import { singleton } from '@/shared/decorators/singleton';
import {
  IResumeAssessment,
  IResumeAssessmentTask,
} from '@/shared/models/domain/candidate/resume.assessment.domain';
import {
  toResumeAssessmentDomain,
  toResumeAssessmentTaskDomain,
} from '@/shared/models/domain/candidate/resume.assessment.domain';
import { logger } from '@/shared/utils/logger';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { PrismaClient } from '@prisma/client';
import { ResumeAssessmentFactory } from '@/services/helpers/ai.resume.assessment/resume.assessment.factory';
import {
  CandidateResumeAssessmentStatusEnum,
  CandidateAssessmentStageEnum,
  ResumeAssessmentTaskStatusEnum,
} from '@/shared/models/common/enums';
import { ENV } from '@/config/env';
import { generateResumeText } from '@/utils/resume';
import { IAiResumeAssessmentStatus } from '../helpers/ai.resume.assessment/resume.assessment.provider';
import { ResumeAssessmentProcessor } from '../queue/processors/resume.assessment.processor';

@singleton
export class CandidateResumeAssessmentService {
  private readonly prisma: PrismaClient;
  private readonly assessmentFactory: ResumeAssessmentFactory;
  private readonly resumeAssessmentProcessor: ResumeAssessmentProcessor;

  constructor() {
    this.prisma = new PrismaClient();
    this.assessmentFactory = ResumeAssessmentFactory.getInstance();
    this.resumeAssessmentProcessor = new ResumeAssessmentProcessor(this);
    if (ENV.ENABLE_BULLMQ_WORKERS) {
      this.resumeAssessmentProcessor.setupWorkers();
    }
    logger.info(
      'Resume assessment service initialized with BullMQ integration',
      {
        context: 'CandidateResumeAssessmentService.constructor',
      }
    );
  }

  /**
   * Start resume assessment
   */
  async startAssessment(candidateId: string): Promise<IResumeAssessmentTask> {
    try {
      // Get resume for the candidate
      const resume = await this.prisma.resume.findUnique({
        where: { candidateId },
        include: {
          candidate: true,
          assessmentTask: {
            include: {
              assessment: true,
            },
          },
        },
      });

      if (!resume) {
        throw new AppError(
          `Resume not found for candidate ${candidateId}`,
          404,
          ErrorCode.RESUME_NOT_FOUND
        );
      }

      // Check the completion percentage of the assessment
      const completionPercentage = resume.candidate.completionPercentage;

      if (
        completionPercentage < ENV.MIN_RESUME_ASSESSMENT_COMPLETION_PERCENTAGE
      ) {
        throw new AppError(
          `Candidate completion percentage is less than ${ENV.MIN_RESUME_ASSESSMENT_COMPLETION_PERCENTAGE}%, please complete the onboarding process first`,
          400,
          ErrorCode.CANDIDATE_COMPLETION_PERCENTAGE_TOO_LOW
        );
      }

      // Check if there's an existing assessment task in progress
      if (
        resume.assessmentTask &&
        (resume.assessmentTask.status ===
          ResumeAssessmentTaskStatusEnum.PENDING ||
          resume.assessmentTask.status ===
            ResumeAssessmentTaskStatusEnum.PROCESSING)
      ) {
        return toResumeAssessmentTaskDomain(resume.assessmentTask);
      }

      // If there's an existing task, update it instead of creating a new one
      let task;
      if (resume.assessmentTask) {
        task = await this.prisma.resume_assessment_task.update({
          where: { id: resume.assessmentTask.id },
          data: {
            status: ResumeAssessmentTaskStatusEnum.PENDING,
            error: null, // Clear any previous errors
          },
        });
      } else {
        // Create new assessment task
        task = await this.prisma.resume_assessment_task.create({
          data: {
            resumeId: resume.id,
            status: ResumeAssessmentTaskStatusEnum.PENDING,
          },
        });
      }

      // Add assessment job to the queue
      await this.resumeAssessmentProcessor.addAssessmentJob(
        task.id,
        candidateId,
        resume.id
      );

      return toResumeAssessmentTaskDomain(task);
    } catch (error) {
      logger.error('Failed to start resume assessment', {
        context: 'CandidateResumeAssessmentService.startAssessment',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
      });
      throw error;
    }
  }

  /**
   * Start background process assessment (public method for queue processor)
   */
  async startBackgroundProcessAssessment(
    taskId: string,
    candidateId: string,
    resumeId: string
  ): Promise<void> {
    return this.backgroundProcessAssessment(taskId, candidateId, resumeId);
  }

  /**
   * Process the resume assessment asynchronously
   */
  private async backgroundProcessAssessment(
    taskId: string,
    candidateId: string,
    resumeId: string
  ): Promise<void> {
    try {
      // Update the candidate status to assessment in progress
      await this.prisma.candidate.update({
        where: { id: candidateId },
        data: {
          assessmentStage: CandidateAssessmentStageEnum.ONBOARDING_ASSESSMENT,
          resumeAssessmentStatus:
            CandidateResumeAssessmentStatusEnum.ASSESSMENT_IN_PROGRESS,
        },
      });

      // Update the task status to processing
      await this.prisma.resume_assessment_task.update({
        where: { id: taskId },
        data: {
          status: ResumeAssessmentTaskStatusEnum.PROCESSING,
        },
      });

      // Generate comprehensive resume text
      const resumeText = await generateResumeText(this.prisma, resumeId);
      if (!resumeText) {
        throw new AppError(
          'Failed to generate resume text',
          400,
          ErrorCode.RESUME_NOT_FOUND
        );
      }

      // Get the assessment provider and do the assessment
      const provider = this.assessmentFactory.getProvider();
      await provider.doAssessment(taskId, resumeText);

      // Get the assessment task status
      const providerTask = await provider.getAssessmentTask(taskId);

      // Update task status to processing, this is to prevent subsequent tasks from updating the same assessment
      await this.prisma.resume_assessment_task.update({
        where: { id: taskId },
        data: {
          status:
            ResumeAssessmentTaskStatusEnum.UPDATING_CANDIDATE_RESUME_ASSESSMENT,
        },
      });

      if (providerTask.status === IAiResumeAssessmentStatus.FAILED) {
        await this.prisma.resume_assessment_task.update({
          where: { id: taskId },
          data: {
            status: ResumeAssessmentTaskStatusEnum.FAILED,
            error: providerTask.error,
          },
        });
      } else if (providerTask.status === IAiResumeAssessmentStatus.COMPLETED) {
        const assessment = providerTask.assessment;
        if (!assessment) {
          await this.prisma.resume_assessment_task.update({
            where: { id: taskId },
            data: {
              status: ResumeAssessmentTaskStatusEnum.FAILED,
              error: 'Assessment not found',
            },
          });
        }
        // Update assessment with provider data
        if (assessment) {
          const assessmentData = {
            ...assessment,
            candidateId: candidateId,
          };

          const updatedResumeAssessment =
            await this.prisma.resume_assessment.upsert({
              where: { id: assessment.id },
              create: assessmentData,
              update: assessmentData,
            });

          // Update task status to completed
          await this.prisma.resume_assessment_task.update({
            where: { id: taskId },
            data: {
              assessmentId: updatedResumeAssessment.id,
              status: ResumeAssessmentTaskStatusEnum.COMPLETED,
            },
          });

          // Update the candidate status
          await this.prisma.candidate.update({
            where: { id: candidateId },
            data: {
              resumeAssessmentStatus:
                CandidateResumeAssessmentStatusEnum.ASSESSMENT_COMPLETED,
              assessmentStage:
                CandidateAssessmentStageEnum.ONBOARDING_ASSESSMENT,
            },
          });

          // --- Begin: Job AI Assessment Notification Logic ---
          // Note: Job AI Assessment invitations are NOT automatically initialized
          // Candidates must manually trigger initialization from the UI when ready
          // The invitation email was already sent when the invitation was created
          // --- End: Job AI Assessment Notification Logic ---
        }
      }
    } catch (error) {
      // Update task status to failed and log the error
      logger.error('Failed to process resume assessment', {
        context: 'CandidateResumeAssessmentService.processAssessment',
        error: error instanceof Error ? error.message : 'Unknown error',
        taskId,
      });

      try {
        // Update task status to failed
        await this.prisma.resume_assessment_task.update({
          where: { id: taskId },
          data: {
            status: ResumeAssessmentTaskStatusEnum.FAILED,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        });

        // Update candidate status to reflect the failed assessment
        await this.prisma.resume_assessment_task.findUnique({
          where: { id: taskId },
          include: {
            resume: true,
          },
        });

        await this.prisma.candidate.update({
          where: { id: candidateId },
          data: {
            assessmentStage: CandidateAssessmentStageEnum.RESUME_ASSESSMENT,
            resumeAssessmentStatus:
              CandidateResumeAssessmentStatusEnum.ASSESSMENT_FAILED,
          },
        });
      } catch (error) {
        logger.error('Failed to update candidate status', {
          context: 'CandidateResumeAssessmentService.processAssessment',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  /**
   * Get assessment task status for the current candidate
   */
  async getAssessmentTaskForCandidate(
    candidateId: string
  ): Promise<IResumeAssessmentTask> {
    try {
      const resume = await this.prisma.resume.findUnique({
        where: { candidateId },
        include: {
          assessmentTask: true,
        },
      });

      if (!resume || !resume.assessmentTask) {
        throw new AppError(
          `Assessment task not found for candidate ${candidateId}`,
          404,
          ErrorCode.RESUME_ASSESSMENT_TASK_NOT_FOUND
        );
      }

      return toResumeAssessmentTaskDomain(resume.assessmentTask);
    } catch (error) {
      logger.error('Failed to get assessment task for candidate', {
        context:
          'CandidateResumeAssessmentService.getAssessmentTaskForCandidate',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
      });
      throw error;
    }
  }

  /**
   * Get assessment task status
   */
  async getAssessmentTask(
    taskId: string,
    candidateId: string
  ): Promise<IResumeAssessmentTask> {
    try {
      // Get the task and verify it belongs to the candidate
      const task = await this.prisma.resume_assessment_task.findUnique({
        where: { id: taskId },
        include: {
          resume: true,
        },
      });

      if (!task) {
        throw new AppError(
          `Assessment task not found with id ${taskId}`,
          404,
          ErrorCode.RESUME_ASSESSMENT_TASK_NOT_FOUND
        );
      }

      // Verify the task belongs to the candidate's resume
      if (task.resume.candidateId !== candidateId) {
        throw new AppError(
          'You are not authorized to access this assessment task',
          403,
          ErrorCode.UNAUTHORIZED
        );
      }

      return toResumeAssessmentTaskDomain(task);
    } catch (error) {
      logger.error('Failed to get assessment task', {
        context: 'CandidateResumeAssessmentService.getAssessmentTask',
        error: error instanceof Error ? error.message : 'Unknown error',
        taskId,
      });
      throw error;
    }
  }

  /**
   * Get assessment results
   */
  async getAssessment(
    assessmentId: string,
    candidateId: string
  ): Promise<IResumeAssessment> {
    try {
      // Get the assessment and verify it belongs to the candidate
      const assessment = await this.prisma.resume_assessment.findUnique({
        where: { id: assessmentId },
      });

      if (!assessment) {
        throw new AppError(
          `Assessment not found with id ${assessmentId}`,
          404,
          ErrorCode.RESUME_ASSESSMENT_NOT_FOUND
        );
      }

      // Verify the assessment belongs to the candidate
      if (assessment.candidateId !== candidateId) {
        throw new AppError(
          'You are not authorized to access this assessment',
          403,
          ErrorCode.UNAUTHORIZED
        );
      }

      return toResumeAssessmentDomain(assessment);
    } catch (error) {
      logger.error('Failed to get assessment', {
        context: 'CandidateResumeAssessmentService.getAssessment',
        error: error instanceof Error ? error.message : 'Unknown error',
        assessmentId,
      });
      throw error;
    }
  }

  /**
   * Get latest assessment for a candidate
   * Returns null if no assessment exists yet (candidate hasn't completed assessment)
   */
  async getLatestAssessmentForCandidate(
    candidateId: string
  ): Promise<IResumeAssessment | null> {
    try {
      const candidate = await this.prisma.candidate.findUnique({
        where: { id: candidateId },
        include: {
          resumeAssessments: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
      });

      if (
        !candidate ||
        !candidate.resumeAssessments ||
        candidate.resumeAssessments.length === 0
      ) {
        logger.info('No resume assessment found for candidate', {
          context:
            'CandidateResumeAssessmentService.getLatestAssessmentForCandidate',
          candidateId,
        });
        return null;
      }

      return toResumeAssessmentDomain(candidate.resumeAssessments[0]);
    } catch (error) {
      logger.error('Failed to get latest assessment for candidate', {
        context:
          'CandidateResumeAssessmentService.getLatestAssessmentForCandidate',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
      });
      throw error;
    }
  }

  /**
   * Get all assessments for a candidate
   */
  async getAllAssessmentsForCandidate(
    candidateId: string
  ): Promise<IResumeAssessment[]> {
    try {
      const resume = await this.prisma.resume.findUnique({
        where: { candidateId },
        include: {
          assessmentTask: {
            include: {
              assessment: true,
            },
          },
        },
      });

      if (!resume) {
        throw new AppError(
          `Resume not found for candidate ${candidateId}`,
          404,
          ErrorCode.RESUME_NOT_FOUND
        );
      }

      // Get all assessments for the candidate
      const assessments = await this.prisma.resume_assessment.findMany({
        where: { candidateId },
        orderBy: { createdAt: 'desc' },
      });

      return assessments.map(toResumeAssessmentDomain);
    } catch (error) {
      logger.error('Failed to get all assessments for candidate', {
        context:
          'CandidateResumeAssessmentService.getAllAssessmentsForCandidate',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
      });
      throw error;
    }
  }
}
