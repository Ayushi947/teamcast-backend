import { singleton } from '@/shared/decorators/singleton';
import {
  IJobPostingAssessment,
  IJobPostingAssessmentTask,
} from '@/shared/models/domain/client/job.posting.assessment.domain';
import {
  toJobPostingAssessmentDomain,
  toJobPostingAssessmentTaskDomain,
} from '@/shared/models/domain/client/job.posting.assessment.domain';
import { logger } from '@/shared/utils/logger';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { PrismaClient } from '@prisma/client';
import { JobPostingAssessmentFactory } from '@/services/helpers/ai.job.posting.assessment/job.posting.assessment.factory';
import { JobPostingAssessmentTaskStatusEnum } from '@/shared/models/common/enums';
import { ENV } from '@/config/env';
import { IAiJobPostingAssessmentStatus } from '../helpers/ai.job.posting.assessment/job.posting.assessment.provider';
import { JobPostingAssessmentProcessor } from '../queue/processors/job.posting.assessment.processor';

@singleton
export class ClientJobPostingAssessmentService {
  private readonly prisma: PrismaClient;
  private readonly assessmentFactory: JobPostingAssessmentFactory;
  private readonly jobPostingAssessmentProcessor: JobPostingAssessmentProcessor;

  constructor() {
    this.prisma = new PrismaClient();
    this.assessmentFactory = JobPostingAssessmentFactory.getInstance();
    this.jobPostingAssessmentProcessor = new JobPostingAssessmentProcessor(
      this
    );
    if (ENV.ENABLE_BULLMQ_WORKERS) {
      this.jobPostingAssessmentProcessor.setupWorkers();
    }
    logger.info(
      'Job posting assessment service initialized with BullMQ integration',
      {
        context: 'ClientJobPostingAssessmentService.constructor',
      }
    );
  }

  /**
   * Start job posting assessment
   */
  async startAssessment(
    jobPostingId: string,
    clientId: string
  ): Promise<IJobPostingAssessmentTask> {
    try {
      // Get job posting for the client
      const jobPosting = await this.prisma.job_posting.findUnique({
        where: { id: jobPostingId },
        include: {
          client: true,
          assessmentTask: {
            include: {
              assessment: true,
            },
          },
        },
      });

      if (!jobPosting) {
        throw new AppError(
          `Job posting not found with id ${jobPostingId}`,
          404,
          ErrorCode.JOB_POSTING_NOT_FOUND
        );
      }

      // Verify the job posting belongs to the client
      if (jobPosting.clientId !== clientId) {
        logger.error('Job posting does not belong to the client', {
          context: 'ClientJobPostingAssessmentService.startAssessment',
          jobPostingId,
          clientId,
        });
        throw new AppError(
          'You are not authorized to assess this job posting',
          403,
          ErrorCode.UNAUTHORIZED
        );
      }

      // Check if there's an existing assessment task in progress
      if (
        jobPosting.assessmentTask &&
        (jobPosting.assessmentTask.status ===
          JobPostingAssessmentTaskStatusEnum.PENDING ||
          jobPosting.assessmentTask.status ===
            JobPostingAssessmentTaskStatusEnum.PROCESSING)
      ) {
        return toJobPostingAssessmentTaskDomain(jobPosting.assessmentTask);
      }

      // If there's an existing task, update it instead of creating a new one
      let task;
      if (jobPosting.assessmentTask) {
        task = await this.prisma.job_posting_assessment_task.update({
          where: { id: jobPosting.assessmentTask.id },
          data: {
            status: JobPostingAssessmentTaskStatusEnum.PENDING,
            error: null, // Clear any previous errors
          },
        });
      } else {
        // Create new assessment task
        task = await this.prisma.job_posting_assessment_task.create({
          data: {
            jobPostingId: jobPosting.id,
            status: JobPostingAssessmentTaskStatusEnum.PENDING,
          },
        });
      }

      // Add assessment job to the queue
      await this.jobPostingAssessmentProcessor.addAssessmentJob(
        task.id,
        jobPostingId
      );

      return toJobPostingAssessmentTaskDomain(task);
    } catch (error) {
      logger.error('Failed to start job posting assessment', {
        context: 'ClientJobPostingAssessmentService.startAssessment',
        error: error instanceof Error ? error.message : 'Unknown error',
        jobPostingId,
      });
      throw error;
    }
  }

  /**
   * Start background process assessment (public method for queue processor)
   */
  async startBackgroundProcessAssessment(
    taskId: string,
    jobPostingId: string
  ): Promise<void> {
    return this.backgroundProcessAssessment(taskId, jobPostingId);
  }

  /**
   * Process the job posting assessment asynchronously
   */
  private async backgroundProcessAssessment(
    taskId: string,
    jobPostingId: string
  ): Promise<void> {
    try {
      // Update the task status to processing
      await this.prisma.job_posting_assessment_task.update({
        where: { id: taskId },
        data: {
          status: JobPostingAssessmentTaskStatusEnum.PROCESSING,
        },
      });

      // Generate comprehensive job posting text
      const jobPostingText = await this.generateJobPostingText(jobPostingId);
      if (!jobPostingText) {
        throw new AppError(
          'Failed to generate job posting text',
          400,
          ErrorCode.JOB_POSTING_NOT_FOUND
        );
      }

      // Get the assessment provider and do the assessment
      const provider = this.assessmentFactory.getProvider();
      await provider.doAssessment(taskId, jobPostingText);

      // Get the assessment task status
      const providerTask = await provider.getAssessmentTask(taskId);

      // Update task status to updating, this prevents subsequent tasks from updating the same assessment
      await this.prisma.job_posting_assessment_task.update({
        where: { id: taskId },
        data: {
          status:
            JobPostingAssessmentTaskStatusEnum.UPDATING_JOB_POSTING_ASSESSMENT,
        },
      });

      if (providerTask.status === IAiJobPostingAssessmentStatus.FAILED) {
        await this.prisma.job_posting_assessment_task.update({
          where: { id: taskId },
          data: {
            status: JobPostingAssessmentTaskStatusEnum.FAILED,
            error: providerTask.error,
          },
        });
      } else if (
        providerTask.status === IAiJobPostingAssessmentStatus.COMPLETED
      ) {
        const assessment = providerTask.assessment;
        if (!assessment) {
          await this.prisma.job_posting_assessment_task.update({
            where: { id: taskId },
            data: {
              status: JobPostingAssessmentTaskStatusEnum.FAILED,
              error: 'Assessment not found',
            },
          });
          return;
        }

        // Update assessment with provider data
        const assessmentData = {
          ...assessment,
          jobPostingId: jobPostingId,
        };

        const updatedJobPostingAssessment =
          await this.prisma.job_posting_assessment.upsert({
            where: { id: assessment.id },
            create: assessmentData,
            update: assessmentData,
          });

        // Update task status to completed
        await this.prisma.job_posting_assessment_task.update({
          where: { id: taskId },
          data: {
            assessmentId: updatedJobPostingAssessment.id,
            status: JobPostingAssessmentTaskStatusEnum.COMPLETED,
          },
        });
      }
    } catch (error) {
      // Update task status to failed and log the error
      logger.error('Failed to process job posting assessment', {
        context: 'ClientJobPostingAssessmentService.processAssessment',
        error: error instanceof Error ? error.message : 'Unknown error',
        taskId,
        jobPostingId,
      });

      try {
        // Update task status to failed
        await this.prisma.job_posting_assessment_task.update({
          where: { id: taskId },
          data: {
            status: JobPostingAssessmentTaskStatusEnum.FAILED,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      } catch (updateError) {
        logger.error('Failed to update task status', {
          context: 'ClientJobPostingAssessmentService.processAssessment',
          error:
            updateError instanceof Error
              ? updateError.message
              : 'Unknown error',
        });
      }
    }
  }

  /**
   * Generate job posting text for assessment
   */
  private async generateJobPostingText(jobPostingId: string): Promise<string> {
    const jobPosting = await this.prisma.job_posting.findUnique({
      where: { id: jobPostingId },
      include: {
        client: {
          include: {
            company: true,
          },
        },
      },
    });

    if (!jobPosting) {
      throw new AppError(
        `Job posting not found with id ${jobPostingId}`,
        404,
        ErrorCode.JOB_POSTING_NOT_FOUND
      );
    }

    // Generate comprehensive text representation
    const sections = [
      `Job Title: ${jobPosting.title}`,
      `Company: ${jobPosting.client.company.name}`,
      `Job Type: ${jobPosting.jobType}`,
      `Job Commitment: ${jobPosting.jobCommitment}`,
      `Job Schedule: ${jobPosting.jobSchedule}`,
      `Industry: ${jobPosting.industry}`,
      `Total Experience Required: ${jobPosting.totalExperience} years`,
      `Number of Openings: ${jobPosting.numberOfOpenings}`,
      `Remote Work: ${jobPosting.isRemote ? 'Yes' : 'No'}`,
      `Department: ${jobPosting.department || 'Not specified'}`,
      `Team Size: ${jobPosting.teamSize || 'Not specified'}`,
      `Reporting To: ${jobPosting.reportingTo || 'Not specified'}`,
      '',
      'Job Description:',
      jobPosting.description,
      '',
      'Responsibilities:',
      jobPosting.responsibilities
        .map((resp, index) => `${index + 1}. ${resp}`)
        .join('\n'),
      '',
      'Required Skills:',
      jobPosting.requiredSkills.join(', '),
      '',
      'Preferred Skills:',
      jobPosting.preferredSkills.join(', '),
      '',
      'Preferred Universities:',
      jobPosting.preferredUniversities.join(', '),
      '',
      'Preferred Degrees:',
      jobPosting.preferredDegrees.join(', '),
      '',
      'Preferred Locations:',
      jobPosting.preferredLocations.join(', '),
      '',
      'Preferred Industries:',
      jobPosting.preferredIndustries.join(', '),
      '',
    ];

    // Add compensation information if available
    if (jobPosting.minSalary || jobPosting.maxSalary) {
      sections.push('Compensation:');
      if (jobPosting.minSalary && jobPosting.maxSalary) {
        sections.push(
          `Salary Range: ${jobPosting.salaryCurrency || 'USD'} ${jobPosting.minSalary} - ${jobPosting.maxSalary}`
        );
      } else if (jobPosting.minSalary) {
        sections.push(
          `Minimum Salary: ${jobPosting.salaryCurrency || 'USD'} ${jobPosting.minSalary}`
        );
      } else if (jobPosting.maxSalary) {
        sections.push(
          `Maximum Salary: ${jobPosting.salaryCurrency || 'USD'} ${jobPosting.maxSalary}`
        );
      }
      if (jobPosting.equity) {
        sections.push('Equity: Yes');
      }
      if (jobPosting.benefits.length > 0) {
        sections.push('Benefits:');
        sections.push(jobPosting.benefits.join(', '));
      }
      sections.push('');
    }

    // Add deadlines if available
    if (jobPosting.applicationDeadline) {
      sections.push(
        `Application Deadline: ${jobPosting.applicationDeadline.toISOString()}`
      );
    }
    if (jobPosting.availableFrom) {
      sections.push(
        `Available From: ${jobPosting.availableFrom.toISOString()}`
      );
    }

    // Add tags if available
    if (jobPosting.tags.length > 0) {
      sections.push('');
      sections.push('Tags:');
      sections.push(jobPosting.tags.join(', '));
    }

    return sections.join('\n');
  }

  /**
   * Get assessment task status for a job posting
   */
  async getAssessmentTaskForJobPosting(
    jobPostingId: string,
    clientId: string
  ): Promise<IJobPostingAssessmentTask> {
    try {
      const jobPosting = await this.prisma.job_posting.findUnique({
        where: { id: jobPostingId },
        include: {
          assessmentTask: true,
        },
      });

      if (!jobPosting) {
        throw new AppError(
          `Job posting not found with id ${jobPostingId}`,
          404,
          ErrorCode.JOB_POSTING_NOT_FOUND
        );
      }

      // Verify the job posting belongs to the client
      if (jobPosting.clientId !== clientId) {
        logger.error('Job posting does not belong to the client', {
          context:
            'ClientJobPostingAssessmentService.getAssessmentTaskForJobPosting',
          jobPostingId,
          clientId,
        });
        throw new AppError(
          'You are not authorized to access this job posting',
          403,
          ErrorCode.UNAUTHORIZED
        );
      }

      if (!jobPosting.assessmentTask) {
        throw new AppError(
          `Assessment task not found for job posting ${jobPostingId}`,
          404,
          ErrorCode.JOB_POSTING_ASSESSMENT_TASK_NOT_FOUND
        );
      }

      return toJobPostingAssessmentTaskDomain(jobPosting.assessmentTask);
    } catch (error) {
      logger.error('Failed to get assessment task for job posting', {
        context:
          'ClientJobPostingAssessmentService.getAssessmentTaskForJobPosting',
        error: error instanceof Error ? error.message : 'Unknown error',
        jobPostingId,
        clientId,
      });
      throw error;
    }
  }

  /**
   * Get assessment task status
   */
  async getAssessmentTask(
    taskId: string,
    clientId: string
  ): Promise<IJobPostingAssessmentTask> {
    try {
      // Get the task and verify it belongs to the client
      const task = await this.prisma.job_posting_assessment_task.findUnique({
        where: { id: taskId },
        include: {
          jobPosting: true,
        },
      });

      if (!task) {
        throw new AppError(
          `Assessment task not found with id ${taskId}`,
          404,
          ErrorCode.JOB_POSTING_ASSESSMENT_TASK_NOT_FOUND
        );
      }

      // Verify the task belongs to the client's job posting
      if (task.jobPosting.clientId !== clientId) {
        throw new AppError(
          'You are not authorized to access this assessment task',
          403,
          ErrorCode.UNAUTHORIZED
        );
      }

      return toJobPostingAssessmentTaskDomain(task);
    } catch (error) {
      logger.error('Failed to get assessment task', {
        context: 'ClientJobPostingAssessmentService.getAssessmentTask',
        error: error instanceof Error ? error.message : 'Unknown error',
        taskId,
        clientId,
      });
      throw error;
    }
  }

  /**
   * Get assessment results
   */
  async getAssessment(
    assessmentId: string,
    clientId: string
  ): Promise<IJobPostingAssessment> {
    try {
      // Get the assessment and verify it belongs to the client
      const assessment = await this.prisma.job_posting_assessment.findUnique({
        where: { id: assessmentId },
        include: {
          jobPosting: {
            include: {
              client: true,
            },
          },
        },
      });

      if (!assessment) {
        throw new AppError(
          `Assessment not found with id ${assessmentId}`,
          404,
          ErrorCode.JOB_POSTING_ASSESSMENT_NOT_FOUND
        );
      }

      // Verify the assessment belongs to the client
      if (assessment.jobPosting.clientId !== clientId) {
        logger.error('Assessment does not belong to the client', {
          context: 'ClientJobPostingAssessmentService.getAssessment',
          assessmentId,
          clientId,
        });
        throw new AppError(
          'You are not authorized to access this assessment',
          403,
          ErrorCode.UNAUTHORIZED
        );
      }

      return toJobPostingAssessmentDomain(assessment);
    } catch (error) {
      logger.error('Failed to get assessment', {
        context: 'ClientJobPostingAssessmentService.getAssessment',
        error: error instanceof Error ? error.message : 'Unknown error',
        assessmentId,
        clientId,
      });
      throw error;
    }
  }

  /**
   * Get latest assessment for a job posting
   */
  async getLatestAssessmentForJobPosting(
    jobPostingId: string,
    clientId: string
  ): Promise<IJobPostingAssessment | null> {
    try {
      const jobPosting = await this.prisma.job_posting.findUnique({
        where: { id: jobPostingId },
        include: {
          assessments: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
      });

      if (!jobPosting) {
        throw new AppError(
          `Job posting not found with id ${jobPostingId}`,
          404,
          ErrorCode.JOB_POSTING_NOT_FOUND
        );
      }

      // Verify the job posting belongs to the client
      if (jobPosting.clientId !== clientId) {
        throw new AppError(
          'You are not authorized to access this job posting',
          403,
          ErrorCode.UNAUTHORIZED
        );
      }

      if (!jobPosting.assessments || jobPosting.assessments.length === 0) {
        logger.info('No assessments found for job posting', {
          context:
            'ClientJobPostingAssessmentService.getLatestAssessmentForJobPosting',
          jobPostingId,
          clientId,
        });
        return null;
      }

      return toJobPostingAssessmentDomain(jobPosting.assessments[0]);
    } catch (error) {
      logger.error('Failed to get latest assessment for job posting', {
        context:
          'ClientJobPostingAssessmentService.getLatestAssessmentForJobPosting',
        error: error instanceof Error ? error.message : 'Unknown error',
        jobPostingId,
        clientId,
      });
      throw error;
    }
  }

  /**
   * Get all assessments for a job posting
   */
  async getAllAssessmentsForJobPosting(
    jobPostingId: string,
    clientId: string
  ): Promise<IJobPostingAssessment[]> {
    try {
      const jobPosting = await this.prisma.job_posting.findUnique({
        where: { id: jobPostingId },
        include: {
          assessments: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!jobPosting) {
        throw new AppError(
          `Job posting not found with id ${jobPostingId}`,
          404,
          ErrorCode.JOB_POSTING_NOT_FOUND
        );
      }

      // Verify the job posting belongs to the client
      if (jobPosting.clientId !== clientId) {
        throw new AppError(
          'You are not authorized to access this job posting',
          403,
          ErrorCode.UNAUTHORIZED
        );
      }

      return jobPosting.assessments.map(toJobPostingAssessmentDomain);
    } catch (error) {
      logger.error('Failed to get all assessments for job posting', {
        context:
          'ClientJobPostingAssessmentService.getAllAssessmentsForJobPosting',
        error: error instanceof Error ? error.message : 'Unknown error',
        jobPostingId,
        clientId,
      });
      throw error;
    }
  }
}
