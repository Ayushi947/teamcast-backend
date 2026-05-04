import { Prisma, PrismaClient } from '@prisma/client';
import { singleton } from '@/shared/decorators/singleton';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';
import { McpWebhookService } from '@/mcp/services/mcp.webhook.service';
import { mcp_interview_status, mcp_skill_proficiency } from '@prisma/client';
import { JobAiAssessmentProcessor } from '../queue/processors/job.ai.assessment.processor';
import { JobAiAssessmentVideoAnalysisProcessor } from '../queue/processors/job.ai.assessment.video.analysis.processor';
import { ENV } from '@/config/env';
import { ICandidateJobAiAssessmentFilterQuery } from '@/shared/models/api/candidate/job.ai.assessment.api';
import {
  IPaginatedResponse,
  IPaginationRequest,
} from '@/shared/models/api/common/common.api';
import {
  buildQueryConditions,
  getPaginationInfo,
  IFilterConfig,
  ISortConfig,
} from '@/utils/pagination';
import {
  ICandidateJobAiAssessment,
  toCandidateJobAiAssessmentDomain,
  ICandidateJobAiAssessmentTask,
  toCandidateJobAiAssessmentTaskDomain,
  ICandidateJobAiAssessmentAnswerSubmitted,
  toCandidateJobAiAssessmentQuestionDomain,
  ICandidateJobAiAssessmentProctoring,
  toCandidateJobAiAssessmentProctoringDomain,
  ICandidateJobAiAssessmentPresignedUrl,
  ICandidateJobAiAssessmentVideoAnalysis,
  ICandidateJobAiAssessmentInterviewsFilterQuery,
} from '@/shared/models/domain/candidate/job.ai.assessment.domain';
import {
  JobAiAssessmentResultEnum,
  JobAiAssessmentStatusEnum,
  JobAiAssessmentTaskStatusEnum,
  JobAiAssessmentSectionStatusEnum,
  JobAiAssessmentVideoAnalysisStatusEnum,
  JobAiAssessmentInviteStatusEnum,
  CandidateResumeAssessmentStatusEnum,
  CandidateAssessmentStageEnum,
} from '@/shared/models/common/enums';
import { IJobAiAssessmentProvider } from '../helpers/job.ai.assessment/job.ai.assessment.provider';
import { generateJobDescriptionText, generateResumeText } from '@/utils/resume';
import {
  getBucketFolderPathToCandidateJobAiAssessmentQuestionAudio,
  getBucketFolderPathToCandidateJobAiAssessmentVideo,
} from '@/utils/presigned.urls';
import { IStorageProvider } from '../helpers/storage/storage.interface';
import { extractVideoDurationFromStorage } from '@/utils/video.helper';
import { toIAuthUser } from '@/shared/models/domain/auth/auth.user.domain';
import { getAuthToken } from '@/utils/generate.token';
import { IJobAiAssessmentInterviewItem } from '@/shared/models/domain/client/job.ai.assessment.invite';
import { gcpConfig } from '@/config/gcp';

@singleton
export class JobAiAssessmentService {
  private readonly prisma: PrismaClient;
  private readonly jobAiAssessmentProcessor: JobAiAssessmentProcessor;
  private readonly jobAiAssessmentVideoAnalysisProcessor: JobAiAssessmentVideoAnalysisProcessor;

  constructor(
    private readonly jobAiAssessmentProvider: IJobAiAssessmentProvider,
    private readonly storageProvider: IStorageProvider
  ) {
    this.prisma = new PrismaClient();
    this.jobAiAssessmentProcessor = new JobAiAssessmentProcessor(this);
    this.jobAiAssessmentVideoAnalysisProcessor =
      new JobAiAssessmentVideoAnalysisProcessor(
        this,
        this.jobAiAssessmentProvider
      );

    if (ENV.ENABLE_BULLMQ_WORKERS) {
      this.jobAiAssessmentProcessor.setupWorkers();
    }

    if (ENV.ENABLE_GPU_BULLMQ_WORKERS) {
      this.jobAiAssessmentVideoAnalysisProcessor.setupWorkers();
    }

    logger.info('Job AI assessment service initialized', {
      context: 'JobAiAssessmentService.constructor',
    });
  }

  private readonly interviewFilterConfig: IFilterConfig = {
    allowedFields: ['status'],
    enumFields: ['status'],
  };

  private readonly interviewSortConfig: ISortConfig = {
    allowedFields: ['createdAt', 'updatedAt', 'scheduledDate'],
    defaultSort: { field: 'createdAt', order: 'desc' },
  };

  /**
   * Get all job ai assessments for a candidate with pagination and filtering
   */
  async getJobAiAssessments(
    candidateId: string,
    filter: ICandidateJobAiAssessmentFilterQuery,
    paginationRequest: IPaginationRequest
  ): Promise<IPaginatedResponse<ICandidateJobAiAssessment>> {
    try {
      // Get pagination info
      const paginationInfo = getPaginationInfo(paginationRequest);

      // Build where clause based on filters
      const where = {
        candidateId,
        ...(filter.status &&
          filter.status.length > 0 && {
            status: {
              in: filter.status,
            },
          }),
      };

      const assessments = await this.prisma.job_ai_assessment.findMany({
        where,
        skip: paginationInfo.skip,
        take: paginationInfo.take,
        orderBy: paginationInfo.orderBy,
        include: {
          sections: {
            include: {
              questions: {
                orderBy: {
                  order: 'asc',
                },
              },
            },
            orderBy: {
              order: 'asc',
            },
          },
          progressState: true,
          videoAnalysis: true,
          proctoring: true,
          task: true,
          jobAiAssessmentSettings: true,
        },
      });

      // Get total count for pagination
      const total = await this.prisma.job_ai_assessment.count({
        where,
      });

      return {
        items: assessments.map(toCandidateJobAiAssessmentDomain),
        pagination: {
          total,
          page: paginationInfo.skip,
          limit: paginationInfo.take,
          totalPages: Math.ceil(total / paginationInfo.take),
        },
      };
    } catch (error) {
      logger.error({
        message: 'Failed to get job ai assessments',
        context: 'JobAiAssessmentService.getJobAiAssessments',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        filter,
        paginationRequest,
      });
      throw error;
    }
  }

  /**
   * Get a specific job ai assessment
   */
  async getJobAiAssessment(
    candidateId: string,
    assessmentId: string
  ): Promise<ICandidateJobAiAssessment> {
    try {
      const assessment = await this.getCompleteJobAiAssessment(
        candidateId,
        assessmentId
      );

      return toCandidateJobAiAssessmentDomain(assessment);
    } catch (error) {
      logger.error({
        message: 'Failed to get job ai assessment',
        context: 'JobAiAssessmentService.getJobAiAssessment',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        assessmentId,
      });
      throw error;
    }
  }

  /**
   * Get job ai assessment initialize task
   */
  async getJobAiAssessmentTask(
    candidateId: string,
    assessmentId: string
  ): Promise<ICandidateJobAiAssessmentTask> {
    logger.info({
      message: 'Getting job ai assessment task',
      context: 'JobAiAssessmentService.getJobAiAssessmentTask',
      candidateId,
      assessmentId,
    });
    try {
      logger.info({
        message: 'Getting job ai assessment',
        context: 'JobAiAssessmentService.getJobAiAssessmentTask',
        candidateId,
        assessmentId,
      });
      const assessment = await this.prisma.job_ai_assessment.findUnique({
        where: {
          id: assessmentId,
          candidateId,
        },
        include: {
          task: true,
        },
      });

      if (!assessment) {
        throw new AppError(
          'Job Ai assessment not found',
          404,
          ErrorCode.AI_ASSESSMENT_NOT_FOUND
        );
      }

      if (!assessment.task) {
        throw new AppError(
          'Job Ai assessment task not found',
          404,
          ErrorCode.AI_ASSESSMENT_NOT_FOUND
        );
      }

      const task = await this.getCompleteJobAiAssessmentTask(assessment.id);

      return task;
    } catch (error) {
      logger.error({
        message: 'Failed to get job ai assessment task',
        context: 'JobAiAssessmentService.getJobAiAssessmentTask',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        assessmentId,
      });
      throw error;
    }
  }

  /**
   * Initialize job ai assessment initialize task
   */
  async initialize(
    candidateId: string,
    jobAiAssessmentInviteId: string
  ): Promise<ICandidateJobAiAssessmentTask> {
    try {
      logger.info({
        message: 'Initializing job ai assessment',
        context: 'JobAiAssessmentService.initialize',
        candidateId,
      });

      const candidate = await this.prisma.candidate.findUnique({
        where: {
          id: candidateId,
        },
        include: {
          resume: true,
          jobAiAssessments: true,
        },
      });

      const jobAiAssessmentInvite =
        await this.prisma.job_ai_assessment_invitation.findUnique({
          where: {
            id: jobAiAssessmentInviteId,
          },
          include: {
            jobApplication: {
              include: {
                jobPosting: {
                  include: {
                    jobPostingAiAssessmentSettings: {
                      include: {
                        clientAiAssessmentSettings: {
                          include: {
                            globalJobAiAssessmentSettings: true,
                          },
                        },
                      },
                    },
                    client: {
                      include: {
                        clientAiAssessmentSettings: {
                          include: {
                            globalJobAiAssessmentSettings: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        });

      logger.info({
        message: 'Found candidate',
        context: 'JobAiAssessmentService.initialize',
        candidateId,
        jobAiAssessmentInvite,
      });

      if (!candidate) {
        throw new AppError(
          'Candidate not found',
          404,
          ErrorCode.CANDIDATE_NOT_FOUND
        );
      }

      if (!jobAiAssessmentInvite) {
        throw new AppError(
          'Job ai assessment invite not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      const clientId = jobAiAssessmentInvite.jobApplication.jobPosting.clientId;
      const isMcpInterview = await this.prisma.mcp_interview.findFirst({
        where: {
          candidateId: candidateId,
          mcpClient: {
            clientId: clientId,
          },
          expiresAt: jobAiAssessmentInvite.expiresAt,
        },
        select: {
          id: true,
        },
      });

      // Only require candidate.resume for non-MCP interviews
      if (!isMcpInterview && !candidate.resume) {
        throw new AppError(
          'Candidate resume not found',
          404,
          ErrorCode.RESUME_NOT_FOUND
        );
      }

      // Check if an assessment already exists for this job application
      const existingAssessment = await this.prisma.job_ai_assessment.findUnique(
        {
          where: {
            jobApplicationId: jobAiAssessmentInvite.jobApplication.id,
          },
          include: {
            task: true,
            sections: {
              select: {
                id: true,
              },
            },
          },
        }
      );

      // Track if we need to re-initialize a reset assessment
      let isReinitializingReset = false;

      if (existingAssessment) {
        // Check if assessment has been reset (no sections) - needs re-initialization
        const hasNoSections =
          !existingAssessment.sections ||
          existingAssessment.sections.length === 0;
        const isReset =
          hasNoSections &&
          existingAssessment.status === JobAiAssessmentStatusEnum.NOT_STARTED;

        if (isReset) {
          logger.info(
            'Existing assessment found but has been reset - will re-initialize',
            {
              assessmentId: existingAssessment.id,
              candidateId,
              context: 'JobAiAssessmentService.initialize',
            }
          );
          isReinitializingReset = true;
          // Continue with initialization process below (don't return early)
        } else {
          // Assessment exists and has sections - return existing task (normal flow)
          // Update invitation status to ACCEPTED if still PENDING
          if (
            jobAiAssessmentInvite.status ===
            JobAiAssessmentInviteStatusEnum.PENDING
          ) {
            await this.prisma.job_ai_assessment_invitation.update({
              where: {
                id: jobAiAssessmentInviteId,
              },
              data: {
                jobAiAssessmentId: existingAssessment.id,
                status: JobAiAssessmentInviteStatusEnum.ACCEPTED,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              },
            });
          }
          // Return the existing task for this assessment
          const existingTask = await this.getCompleteJobAiAssessmentTask(
            existingAssessment.id
          );
          return existingTask;
        }
      }
      // Get settings with proper fallback chain: job-specific -> client-level -> global
      const jobPostingSettings =
        jobAiAssessmentInvite.jobApplication.jobPosting
          .jobPostingAiAssessmentSettings;
      const clientSettings =
        jobAiAssessmentInvite.jobApplication.jobPosting.client
          .clientAiAssessmentSettings;
      let globalSettings = clientSettings?.globalJobAiAssessmentSettings;

      // If global settings not available through client, fetch directly
      if (!globalSettings) {
        globalSettings =
          await this.prisma.global_job_ai_assessment_settings.findFirst({
            where: { isSingleton: true },
          });
      }

      const mcpInterview = await this.prisma.mcp_interview.findFirst({
        where: {
          candidateId: candidateId,
          mcpClient: {
            clientId: clientId,
          },
          expiresAt: jobAiAssessmentInvite.expiresAt,
        },
        select: {
          id: true,
          maxSections: true,
          expectedDurationMinutes: true,
          resumeFileUrl: true,
        },
      });

      if (mcpInterview) {
        logger.info({
          message:
            'Found MCP interview with custom settings - will use for assessment',
          context: 'JobAiAssessmentService.initialize',
          mcpInterviewId: mcpInterview.id,
          expectedDurationMinutes: mcpInterview.expectedDurationMinutes,
          maxSections: mcpInterview.maxSections,
        });
      }

      // Get voice configuration with fallback chain
      const getVoiceConfig = (
        field: 'interviewLanguage' | 'interviewDialect' | 'interviewVoiceGender'
      ) => {
        return (
          (jobPostingSettings as any)?.[field] ??
          (clientSettings as any)?.[field] ??
          (globalSettings as any)?.[field] ??
          (field === 'interviewLanguage'
            ? 'ENGLISH'
            : field === 'interviewDialect'
              ? 'en-US'
              : 'female')
        );
      };

      // Determine duration: prioritize MCP interview settings, then fallback chain
      const effectiveDuration =
        mcpInterview?.expectedDurationMinutes != null
          ? mcpInterview.expectedDurationMinutes * 60 // Convert minutes to seconds
          : (clientSettings?.defaultAssessmentDuration ??
            globalSettings?.defaultAssessmentDuration ??
            3600); // 1 hour default

      // Determine maxSections: prioritize MCP interview settings, then fallback chain
      const effectiveMaxSections =
        mcpInterview?.maxSections != null
          ? mcpInterview.maxSections
          : (clientSettings?.maxSections ?? globalSettings?.maxSections ?? 1);

      // create the job ai assessment with proper fallback chain
      const aiAssessmentSettings = jobPostingSettings || {
        defaultAssessmentDuration: effectiveDuration,
        defaultPassingScore:
          clientSettings?.defaultPassingScore ??
          globalSettings?.defaultPassingScore ??
          70,
        maximumAttempts:
          clientSettings?.maximumAttempts ??
          globalSettings?.maximumAttempts ??
          1,
        cooldownPeriod:
          clientSettings?.cooldownPeriod ?? globalSettings?.cooldownPeriod ?? 0,
        requiredSections: clientSettings?.requiredSections ??
          globalSettings?.requiredSections ?? ['DEFAULT'],
        maxSections: effectiveMaxSections,
        maxQuestionsPerSection:
          clientSettings?.maxQuestionsPerSection ??
          globalSettings?.maxQuestionsPerSection ??
          5,
        proctoringEnabled:
          clientSettings?.proctoringEnabled ??
          globalSettings?.proctoringEnabled ??
          true,
        maxWarnings:
          clientSettings?.maxWarnings ?? globalSettings?.maxWarnings ?? 3,
        tabSwitchLimit:
          clientSettings?.tabSwitchLimit ?? globalSettings?.tabSwitchLimit ?? 3,
        copyPasteAllowed:
          clientSettings?.copyPasteAllowed ??
          globalSettings?.copyPasteAllowed ??
          false,
        videoRecordingEnabled:
          clientSettings?.videoRecordingEnabled ??
          globalSettings?.videoRecordingEnabled ??
          true,
        minimumVideoLength:
          clientSettings?.minimumVideoLength ??
          globalSettings?.minimumVideoLength ??
          0,
        aiVideoAnalysisEnabled:
          clientSettings?.aiVideoAnalysisEnabled ??
          globalSettings?.aiVideoAnalysisEnabled ??
          true,
        autoPublishOnSuccess:
          clientSettings?.autoPublishOnSuccess ??
          globalSettings?.autoPublishOnSuccess ??
          false,
        autoNotifyOnComplete:
          clientSettings?.autoNotifyOnComplete ??
          globalSettings?.autoNotifyOnComplete ??
          false,
        greetingMessage:
          clientSettings?.greetingMessage ??
          globalSettings?.greetingMessage ??
          '',
        interviewLanguage: getVoiceConfig('interviewLanguage'),
        interviewDialect: getVoiceConfig('interviewDialect'),
        interviewVoiceGender: getVoiceConfig('interviewVoiceGender'),
        sectionTemplates:
          (clientSettings?.sectionTemplates as Record<string, string>) ??
          (globalSettings?.sectionTemplates as Record<string, string>) ??
          {},
        questionTemplates:
          (clientSettings?.questionTemplates as Record<string, string>) ??
          (globalSettings?.questionTemplates as Record<string, string>) ??
          {},
        customStyles:
          (clientSettings?.customStyles as Record<string, string>) ??
          (globalSettings?.customStyles as Record<string, string>) ??
          {},
        customInstructions:
          clientSettings?.customInstructions ??
          globalSettings?.customInstructions ??
          '',
      };

      // Check if we need to update existing reset assessment or create new one
      let jobAiAssessment;
      if (isReinitializingReset && existingAssessment) {
        // Update existing reset assessment
        logger.info('Updating existing reset assessment', {
          assessmentId: existingAssessment.id,
          candidateId,
          jobApplicationId: jobAiAssessmentInvite.jobApplication.id,
          status: JobAiAssessmentStatusEnum.NOT_STARTED,
          result: JobAiAssessmentResultEnum.NOT_AVAILABLE,
          score: 0,
          startedAt: new Date(),
          completedAt: null,
          automaticallyPublished: false,
          duration: aiAssessmentSettings.defaultAssessmentDuration,
          jobAiAssessmentSettings: {
            create: {
              defaultAssessmentDuration:
                aiAssessmentSettings.defaultAssessmentDuration,
              defaultPassingScore: aiAssessmentSettings.defaultPassingScore,
              maximumAttempts: aiAssessmentSettings.maximumAttempts,
              cooldownPeriod: aiAssessmentSettings.cooldownPeriod,
              requiredSections: aiAssessmentSettings.requiredSections,
              maxSections: aiAssessmentSettings.maxSections,
              maxQuestionsPerSection:
                aiAssessmentSettings.maxQuestionsPerSection,
              proctoringEnabled: aiAssessmentSettings.proctoringEnabled,
              maxWarnings: aiAssessmentSettings.maxWarnings,
              tabSwitchLimit: aiAssessmentSettings.tabSwitchLimit,
              copyPasteAllowed: aiAssessmentSettings.copyPasteAllowed,
              videoRecordingEnabled: aiAssessmentSettings.videoRecordingEnabled,
              minimumVideoLength: aiAssessmentSettings.minimumVideoLength,
              aiVideoAnalysisEnabled:
                aiAssessmentSettings.aiVideoAnalysisEnabled,
              autoPublishOnSuccess: aiAssessmentSettings.autoPublishOnSuccess,
              autoNotifyOnComplete: aiAssessmentSettings.autoNotifyOnComplete,
              greetingMessage: aiAssessmentSettings.greetingMessage,
              interviewLanguage: aiAssessmentSettings.interviewLanguage,
              interviewDialect: aiAssessmentSettings.interviewDialect,
              interviewVoiceGender: aiAssessmentSettings.interviewVoiceGender,
              sectionTemplates: aiAssessmentSettings.sectionTemplates || {},
              questionTemplates: aiAssessmentSettings.questionTemplates || {},
              customStyles: aiAssessmentSettings.customStyles || {},
              customInstructions: aiAssessmentSettings.customInstructions || '',
            },
          },
          context: 'JobAiAssessmentService.initialize',
        });

        jobAiAssessment = await this.prisma.job_ai_assessment.update({
          where: { id: existingAssessment.id },
          data: {
            status: JobAiAssessmentStatusEnum.NOT_STARTED,
            result: JobAiAssessmentResultEnum.NOT_AVAILABLE,
            score: 0,
            startedAt: new Date(),
            completedAt: null,
            duration: aiAssessmentSettings.defaultAssessmentDuration,
            jobAiAssessmentSettings: {
              upsert: {
                create: {
                  defaultAssessmentDuration:
                    aiAssessmentSettings.defaultAssessmentDuration,
                  defaultPassingScore: aiAssessmentSettings.defaultPassingScore,
                  maximumAttempts: aiAssessmentSettings.maximumAttempts,
                  cooldownPeriod: aiAssessmentSettings.cooldownPeriod,
                  requiredSections: aiAssessmentSettings.requiredSections,
                  maxSections: aiAssessmentSettings.maxSections,
                  maxQuestionsPerSection:
                    aiAssessmentSettings.maxQuestionsPerSection,
                  proctoringEnabled: aiAssessmentSettings.proctoringEnabled,
                  maxWarnings: aiAssessmentSettings.maxWarnings,
                  tabSwitchLimit: aiAssessmentSettings.tabSwitchLimit,
                  copyPasteAllowed: aiAssessmentSettings.copyPasteAllowed,
                  videoRecordingEnabled:
                    aiAssessmentSettings.videoRecordingEnabled,
                  minimumVideoLength: aiAssessmentSettings.minimumVideoLength,
                  aiVideoAnalysisEnabled:
                    aiAssessmentSettings.aiVideoAnalysisEnabled,
                  autoPublishOnSuccess:
                    aiAssessmentSettings.autoPublishOnSuccess,
                  autoNotifyOnComplete:
                    aiAssessmentSettings.autoNotifyOnComplete,
                  greetingMessage: aiAssessmentSettings.greetingMessage,
                  interviewLanguage: aiAssessmentSettings.interviewLanguage,
                  interviewDialect: aiAssessmentSettings.interviewDialect,
                  interviewVoiceGender:
                    aiAssessmentSettings.interviewVoiceGender,
                  sectionTemplates: aiAssessmentSettings.sectionTemplates || {},
                  questionTemplates:
                    aiAssessmentSettings.questionTemplates || {},
                  customStyles: aiAssessmentSettings.customStyles || {},
                  customInstructions:
                    aiAssessmentSettings.customInstructions || '',
                },
                update: {
                  defaultAssessmentDuration:
                    aiAssessmentSettings.defaultAssessmentDuration,
                  defaultPassingScore: aiAssessmentSettings.defaultPassingScore,
                  maximumAttempts: aiAssessmentSettings.maximumAttempts,
                  cooldownPeriod: aiAssessmentSettings.cooldownPeriod,
                  requiredSections: aiAssessmentSettings.requiredSections,
                  maxSections: aiAssessmentSettings.maxSections,
                  maxQuestionsPerSection:
                    aiAssessmentSettings.maxQuestionsPerSection,
                  proctoringEnabled: aiAssessmentSettings.proctoringEnabled,
                  maxWarnings: aiAssessmentSettings.maxWarnings,
                  tabSwitchLimit: aiAssessmentSettings.tabSwitchLimit,
                  copyPasteAllowed: aiAssessmentSettings.copyPasteAllowed,
                  videoRecordingEnabled:
                    aiAssessmentSettings.videoRecordingEnabled,
                  minimumVideoLength: aiAssessmentSettings.minimumVideoLength,
                  aiVideoAnalysisEnabled:
                    aiAssessmentSettings.aiVideoAnalysisEnabled,
                  autoPublishOnSuccess:
                    aiAssessmentSettings.autoPublishOnSuccess,
                  autoNotifyOnComplete:
                    aiAssessmentSettings.autoNotifyOnComplete,
                  greetingMessage: aiAssessmentSettings.greetingMessage,
                  interviewLanguage: aiAssessmentSettings.interviewLanguage,
                  interviewDialect: aiAssessmentSettings.interviewDialect,
                  interviewVoiceGender:
                    aiAssessmentSettings.interviewVoiceGender,
                  sectionTemplates: aiAssessmentSettings.sectionTemplates || {},
                  questionTemplates:
                    aiAssessmentSettings.questionTemplates || {},
                  customStyles: aiAssessmentSettings.customStyles || {},
                  customInstructions:
                    aiAssessmentSettings.customInstructions || '',
                },
              },
            },
          },
          include: {
            candidate: {
              include: {
                resume: true,
              },
            },
          },
        });
      } else {
        // Create new assessment
        jobAiAssessment = await this.prisma.job_ai_assessment.create({
          data: {
            candidateId,
            jobApplicationId: jobAiAssessmentInvite.jobApplication.id,
            status: JobAiAssessmentStatusEnum.NOT_STARTED,
            result: JobAiAssessmentResultEnum.NOT_AVAILABLE,
            score: 0,
            startedAt: new Date(),
            completedAt: null,
            automaticallyPublished: false,
            duration: aiAssessmentSettings.defaultAssessmentDuration,
            jobAiAssessmentSettings: {
              create: {
                defaultAssessmentDuration:
                  aiAssessmentSettings.defaultAssessmentDuration,
                defaultPassingScore: aiAssessmentSettings.defaultPassingScore,
                maximumAttempts: aiAssessmentSettings.maximumAttempts,
                cooldownPeriod: aiAssessmentSettings.cooldownPeriod,
                requiredSections: aiAssessmentSettings.requiredSections,
                maxSections: aiAssessmentSettings.maxSections,
                maxQuestionsPerSection:
                  aiAssessmentSettings.maxQuestionsPerSection,
                proctoringEnabled: aiAssessmentSettings.proctoringEnabled,
                maxWarnings: aiAssessmentSettings.maxWarnings,
                tabSwitchLimit: aiAssessmentSettings.tabSwitchLimit,
                copyPasteAllowed: aiAssessmentSettings.copyPasteAllowed,
                videoRecordingEnabled:
                  aiAssessmentSettings.videoRecordingEnabled,
                minimumVideoLength: aiAssessmentSettings.minimumVideoLength,
                aiVideoAnalysisEnabled:
                  aiAssessmentSettings.aiVideoAnalysisEnabled,
                autoPublishOnSuccess: aiAssessmentSettings.autoPublishOnSuccess,
                autoNotifyOnComplete: aiAssessmentSettings.autoNotifyOnComplete,
                greetingMessage: aiAssessmentSettings.greetingMessage,
                interviewLanguage: aiAssessmentSettings.interviewLanguage,
                interviewDialect: aiAssessmentSettings.interviewDialect,
                interviewVoiceGender: aiAssessmentSettings.interviewVoiceGender,
                sectionTemplates: aiAssessmentSettings.sectionTemplates || {},
                questionTemplates: aiAssessmentSettings.questionTemplates || {},
                customStyles: aiAssessmentSettings.customStyles || {},
                customInstructions:
                  aiAssessmentSettings.customInstructions || '',
              },
            },
          },
          include: {
            candidate: {
              include: {
                resume: true,
              },
            },
          },
        });
      }

      await this.tryLinkMcpInterviewToAssessment({
        candidateId,
        inviteExpiresAt: jobAiAssessmentInvite.expiresAt,
        assessmentId: jobAiAssessment.id,
      });

      // Safety check: Verify MCP interview settings are applied (should already be applied above)
      // This is a fallback in case the initial check didn't find the MCP interview before linking
      const linkedMcpInterview = await this.prisma.mcp_interview.findFirst({
        where: {
          assessmentId: jobAiAssessment.id,
        },
        select: {
          id: true,
          maxSections: true,
          expectedDurationMinutes: true,
        },
      });

      // Only update if we found a linked interview but didn't find one in the initial check
      // (This means the initial check missed it, so apply settings now)
      const shouldApplyFallbackSettings = linkedMcpInterview && !mcpInterview;
      if (shouldApplyFallbackSettings) {
        const settingsUpdate: any = {};

        if (linkedMcpInterview.maxSections != null) {
          settingsUpdate.maxSections = linkedMcpInterview.maxSections;
          logger.info({
            message:
              'Fallback: Overriding maxSections from linked MCP interview',
            context: 'JobAiAssessmentService.initialize',
            mcpInterviewId: linkedMcpInterview.id,
            maxSections: linkedMcpInterview.maxSections,
          });
        }

        if (linkedMcpInterview.expectedDurationMinutes != null) {
          const durationSeconds =
            linkedMcpInterview.expectedDurationMinutes * 60;
          settingsUpdate.defaultAssessmentDuration = durationSeconds;

          await this.prisma.job_ai_assessment.update({
            where: { id: jobAiAssessment.id },
            data: { duration: durationSeconds },
          });

          logger.info({
            message: 'Fallback: Overriding duration from linked MCP interview',
            context: 'JobAiAssessmentService.initialize',
            mcpInterviewId: linkedMcpInterview.id,
            durationMinutes: linkedMcpInterview.expectedDurationMinutes,
            durationSeconds,
          });
        }

        if (Object.keys(settingsUpdate).length > 0) {
          await this.prisma.job_ai_assessment_settings.update({
            where: { assessmentId: jobAiAssessment.id },
            data: settingsUpdate,
          });
        }
      }

      await this.prisma.job_ai_assessment_invitation.update({
        where: {
          id: jobAiAssessmentInviteId,
        },
        data: {
          jobAiAssessmentId: jobAiAssessment.id,
          status: JobAiAssessmentInviteStatusEnum.ACCEPTED,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      logger.info({
        message: 'Creating or updating job ai assessment task',
        context: 'JobAiAssessmentService.initialize',
        candidateId,
        jobAiAssessmentId: jobAiAssessment.id,
      });

      // Create or update task (upsert to handle reset assessments)
      const task = await this.prisma.job_ai_assessment_task.upsert({
        where: {
          assessmentId: jobAiAssessment.id,
        },
        create: {
          assessmentId: jobAiAssessment.id,
          status: JobAiAssessmentTaskStatusEnum.PENDING,
        },
        update: {
          status: JobAiAssessmentTaskStatusEnum.PENDING,
          error: null,
        },
      });

      // check if task is not created
      if (!task) {
        throw new AppError(
          'Failed to create job ai assessment initialize task',
          500,
          ErrorCode.INTERNAL_SERVER_ERROR
        );
      }

      logger.info({
        message: 'Created new job ai assessment task',
        context: 'JobAiAssessmentService.initialize',
        candidateId,
        jobAiAssessmentId: jobAiAssessment.id,
        taskId: task.id,
      });

      // Generate resume text based on interview type
      let resumeText = '';
      if (mcpInterview) {
        if (mcpInterview.resumeFileUrl) {
          try {
            resumeText = await this.extractTextFromMcpResumeFile(
              mcpInterview.resumeFileUrl
            );
            logger.info({
              message: 'Extracted text from MCP resume file',
              context: 'JobAiAssessmentService.initialize',
              candidateId,
              resumeFileUrl: mcpInterview.resumeFileUrl,
              textLength: resumeText.length,
            });
          } catch (error) {
            logger.warn({
              message:
                'Failed to extract text from MCP resume file, continuing without resume',
              context: 'JobAiAssessmentService.initialize',
              candidateId,
              resumeFileUrl: mcpInterview.resumeFileUrl,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
            // Continue with empty resume text
            resumeText = '';
          }
        } else {
          logger.info({
            message:
              'MCP interview has no resume file, continuing without resume',
            context: 'JobAiAssessmentService.initialize',
            candidateId,
            mcpInterviewId: mcpInterview.id,
          });
          // Continue with empty resume text
          resumeText = '';
        }
      } else {
        if (!candidate.resume) {
          throw new AppError(
            'Candidate resume not found',
            404,
            ErrorCode.RESUME_NOT_FOUND
          );
        }
        resumeText = await generateResumeText(this.prisma, candidate.resume.id);
      }

      // generate job description text
      const jobDescriptionText = await generateJobDescriptionText(
        this.prisma,
        jobAiAssessmentInvite.jobApplication.jobPosting.id
      );

      // update job ai assessment
      await this.prisma.job_ai_assessment.update({
        where: { id: jobAiAssessment.id },
        data: {
          resumeText,
          jobDescriptionText,
        },
      });

      logger.info({
        message: 'Generated resume text',
        context: 'JobAiAssessmentService.initialize',
        candidateId,
      });

      const completeTask = await this.getCompleteJobAiAssessmentTask(
        jobAiAssessment.id
      );

      logger.info({
        message: 'Got complete job ai assessment task, and processing it',
        context: 'JobAiAssessmentService.initialize',
        candidateId,
        completeTask,
      });

      // Start background process to initialize the assessment
      await this.jobAiAssessmentProcessor.addInitializeJob(jobAiAssessment.id);

      logger.info({
        message: 'Returned complete job ai assessment task',
        context: 'JobAiAssessmentService.initialize',
        candidateId,
        completeTask,
      });

      return completeTask;
    } catch (error) {
      logger.error({
        message: 'Failed to initialize job ai assessment initialize task',
        context:
          'JobAiAssessmentService.initializeJobAiAssessmentInitializeTask',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
      });
      throw error;
    }
  }

  /**
   * Start an job ai assessment
   */
  async startAssessment(
    candidateId: string,
    assessmentId: string
  ): Promise<ICandidateJobAiAssessment> {
    try {
      const assessment = await this.getCompleteJobAiAssessment(
        candidateId,
        assessmentId
      );

      logger.info({
        message: 'Got assessment',
        context: 'JobAiAssessmentService.startAssessment',
        assessmentId,
      });

      // Check if assessment is in correct state
      if (
        assessment.status !==
        JobAiAssessmentStatusEnum.AI_INITIALIZATION_COMPLETED
      ) {
        throw new AppError(
          'Assessment is not ready to start',
          400,
          ErrorCode.ASSESSMENT_NOT_READY
        );
      }

      logger.info({
        message: 'Assessment is ready to start',
        context: 'JobAiAssessmentService.startAssessment',
        assessmentId,
      });

      // Start the assessment
      if (!assessment.task) {
        throw new AppError(
          'Assessment task not found',
          404,
          ErrorCode.JOB_AI_ASSESSMENT_TASK_NOT_FOUND
        );
      }
      logger.info({
        message: 'Getting first question',
        context: 'JobAiAssessmentService.startAssessment',
        assessmentId,
      });
      const response = await this.jobAiAssessmentProvider.getNextQuestion(
        assessment.task.id
      );

      logger.info({
        message: 'Got first question',
        context: 'JobAiAssessmentService.startAssessment',
        assessmentId,
        response,
      });

      const firstQuestion = response.nextQuestion;

      // Save the first question
      const savedFirstQuestion =
        await this.prisma.job_ai_assessment_question.create({
          data: {
            id: firstQuestion.id,
            sectionId: firstQuestion.sectionId,
            question: firstQuestion.question,
            questionType: firstQuestion.questionType,
            options: firstQuestion.options,
            correctAnswer: firstQuestion.correctAnswer,
            maxScore: firstQuestion.maxScore,
            isLastQuestion: firstQuestion.isLastQuestion,
            order: firstQuestion.order,
          },
        });

      // Saving the first question
      logger.info({
        message: 'Saved first question',
        context: 'JobAiAssessmentService.startAssessment',
        assessmentId,
        savedFirstQuestion,
      });

      // Update assessment status
      await this.prisma.job_ai_assessment.update({
        where: { id: assessmentId },
        data: {
          status: JobAiAssessmentStatusEnum.CANDIDATE_ASSESSMENT_IN_PROGRESS,
          startedAt: new Date(),
          progressState: {
            create: {
              currentSectionId: firstQuestion.sectionId,
              currentQuestionId: firstQuestion.id,
              lastSavedAt: new Date(),
              isCompleted: false,
            },
          },
        },
      });

      logger.info({
        message: 'Updated assessment status',
        context: 'JobAiAssessmentService.startAssessment',
        assessmentId,
      });

      // Notify MCP client if this candidate was sent via MCP
      this.notifyMcpWebhookForAssessment(assessmentId, 'assessment.started');

      // Get the updated assessment
      const updatedAssessment = await this.getCompleteJobAiAssessment(
        candidateId,
        assessmentId
      );

      logger.info({
        message: 'Returned assessment',
        context: 'JobAiAssessmentService.startAssessment',
        assessmentId,
      });

      return toCandidateJobAiAssessmentDomain(updatedAssessment);
    } catch (error) {
      logger.error({
        message: 'Failed to start assessment',
        context: 'JobAiAssessmentService.startAssessment',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        assessmentId,
      });
      throw error;
    }
  }

  /**
   * Submit answer for a question
   */
  async submitAnswer(
    candidateId: string,
    assessmentId: string,
    questionId: string,
    answerGiven: string
  ): Promise<ICandidateJobAiAssessmentAnswerSubmitted> {
    try {
      logger.info({
        message: 'Submitting answer',
        context: 'JobAiAssessmentService.submitAnswer',
        candidateId,
        assessmentId,
        questionId,
        answerGiven,
      });

      // Check if the question is answered already
      const question = await this.prisma.job_ai_assessment_question.findUnique({
        where: { id: questionId },
      });

      if (!question) {
        throw new AppError(
          'Question not found',
          404,
          ErrorCode.QUESTION_NOT_FOUND
        );
      }

      if (question?.isAnswered) {
        throw new AppError(
          'Question already answered',
          400,
          ErrorCode.JOB_AI_ASSESSMENT_QUESTION_ALREADY_ANSWERED
        );
      }

      // TODO: Authorize the candidate
      // Save the answer
      await this.prisma.job_ai_assessment_question.update({
        where: { id: questionId },
        data: {
          answerGiven,
          isAnswered: true,
        },
      });

      const assessment = await this.getCompleteJobAiAssessment(
        candidateId,
        assessmentId
      );

      if (!assessment.task) {
        throw new AppError(
          'Assessment task not found',
          404,
          ErrorCode.JOB_AI_ASSESSMENT_TASK_NOT_FOUND
        );
      }

      // Check if assessment is in progress
      if (
        assessment.status !==
        JobAiAssessmentStatusEnum.CANDIDATE_ASSESSMENT_IN_PROGRESS
      ) {
        throw new AppError(
          'Candidate assessment is not in progress',
          400,
          ErrorCode.CANDIDATE_ASSESSMENT_NOT_IN_PROGRESS
        );
      }

      // Find current question
      const currentQuestion = assessment.sections
        .flatMap((section) => section.questions)
        .find((q) => q.id === questionId);

      if (!currentQuestion) {
        throw new AppError(
          'Question not found',
          404,
          ErrorCode.QUESTION_NOT_FOUND
        );
      }

      logger.info({
        message: 'Found current question',
        context: 'JobAiAssessmentService.submitAnswer',
        assessmentId,
        questionId,
        currentQuestion,
      });

      // get the number of questions in the section
      const currentSectionData = assessment.sections.find(
        (s) => s.id === currentQuestion.sectionId
      );

      if (!currentSectionData) {
        throw new AppError(
          'Current section not found',
          404,
          ErrorCode.JOB_AI_ASSESSMENT_SECTION_NOT_FOUND
        );
      }

      const numberOfQuestionsInSection = currentSectionData.questions.length;
      const maxQuestionsPerSection =
        assessment.jobAiAssessmentSettings?.maxQuestionsPerSection || 5;
      const isLastSection =
        currentSectionData.order === assessment.sections.length - 1;

      logger.info({
        message: 'Section analysis for answer submission',
        context: 'JobAiAssessmentService.submitAnswer',
        assessmentId,
        questionId,
        currentQuestionOrder: currentQuestion.order,
        numberOfQuestionsInSection,
        maxQuestionsPerSection,
        sectionOrder: currentSectionData.order,
        totalSections: assessment.sections.length,
        isLastSection,
      });

      // update the section start or end time
      if (currentQuestion.order === 0) {
        await this.prisma.job_ai_assessment_section.update({
          where: { id: currentQuestion.sectionId },
          data: {
            startedAt: new Date(),
            status: JobAiAssessmentSectionStatusEnum.IN_PROGRESS,
          },
        });

        logger.info({
          message: '🎬 Section started',
          context: 'JobAiAssessmentService.submitAnswer',
          assessmentId,
          sectionId: currentQuestion.sectionId,
          sectionTitle: currentSectionData.title,
        });
      }

      // ✅ FIX: Check if we just answered the last question of this section
      const isLastQuestionOfSection =
        currentQuestion.order === maxQuestionsPerSection - 1;

      if (isLastQuestionOfSection) {
        await this.prisma.job_ai_assessment_section.update({
          where: { id: currentQuestion.sectionId },
          data: {
            completedAt: new Date(),
            status: JobAiAssessmentSectionStatusEnum.COMPLETED,
          },
        });

        logger.info({
          message: '✅ Section completed',
          context: 'JobAiAssessmentService.submitAnswer',
          assessmentId,
          sectionId: currentQuestion.sectionId,
          sectionTitle: currentSectionData.title,
          sectionOrder: currentSectionData.order,
          questionOrder: currentQuestion.order,
        });
      }

      // ✅ FIX: Only end assessment if this is the last question of the last section
      if (isLastQuestionOfSection && isLastSection) {
        logger.info({
          message:
            '🏁 Last question of last section answered - completing assessment',
          context: 'JobAiAssessmentService.submitAnswer',
          assessmentId,
          questionId,
          sectionOrder: currentSectionData.order,
          questionOrder: currentQuestion.order,
        });
        await this.jobAiAssessmentProvider.saveAnswer(
          assessment.task.id,
          toCandidateJobAiAssessmentQuestionDomain(currentQuestion)
        );

        // Update assessment status
        await this.prisma.job_ai_assessment.update({
          where: { id: assessmentId },
          data: {
            status: JobAiAssessmentStatusEnum.CANDIDATE_ASSESSMENT_COMPLETED,
          },
        });

        // Update task status
        await this.prisma.job_ai_assessment_task.update({
          where: { id: assessment.task.id },
          data: {
            status: JobAiAssessmentTaskStatusEnum.ASSESSMENT_COMPLETED,
          },
        });

        // Update progress state
        await this.prisma.job_ai_assessment_progress.update({
          where: { assessmentId },
          data: {
            isCompleted: true,
            lastSavedAt: new Date(),
          },
        });

        return {
          nextQuestion: toCandidateJobAiAssessmentQuestionDomain({
            ...currentQuestion,
            isLastQuestion: true,
            question:
              'Thank you for completing the assessment. We will review your answers and get back to you soon.',
          }),
          shouldEndAssessment: true,
        };
      } else {
        logger.info({
          message: 'Getting next question',
          context: 'JobAiAssessmentService.submitAnswer',
          assessmentId,
          questionId,
        });
        // Ai task to find next question
        const response = await this.jobAiAssessmentProvider.getNextQuestion(
          assessment.task.id,
          toCandidateJobAiAssessmentQuestionDomain(currentQuestion)
        );

        logger.info({
          message: 'Got next question',
          context: 'JobAiAssessmentService.submitAnswer',
          assessmentId,
          questionId,
          response,
        });

        const nextQuestion = response.nextQuestion;

        // Save the next question
        await this.prisma.job_ai_assessment_question.create({
          data: {
            id: nextQuestion.id,
            sectionId: nextQuestion.sectionId,
            question: nextQuestion.question,
            questionType: nextQuestion.questionType,
            options: nextQuestion.options,
            correctAnswer: nextQuestion.correctAnswer,
            maxScore: nextQuestion.maxScore,
            isLastQuestion: nextQuestion.isLastQuestion,
            order: nextQuestion.order,
          },
        });

        logger.info({
          message: 'Got next question',
          context: 'JobAiAssessmentService.submitAnswer',
          assessmentId,
          questionId,
          nextQuestion,
        });

        if (!nextQuestion) {
          throw new AppError(
            'No next question found',
            404,
            ErrorCode.NO_NEXT_QUESTION_FOUND
          );
        }

        // Update progress state
        await this.prisma.job_ai_assessment_progress.update({
          where: { assessmentId },
          data: {
            currentSectionId: nextQuestion.sectionId,
            currentQuestionId: nextQuestion.id,
            lastSavedAt: new Date(),
            isCompleted: false,
          },
        });

        return {
          nextQuestion: toCandidateJobAiAssessmentQuestionDomain(nextQuestion),
          shouldEndAssessment: response.shouldEndAssessment,
        };
      }
    } catch (error) {
      logger.error({
        message: 'Failed to submit answer',
        context: 'JobAiAssessmentService.submitAnswer',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        assessmentId,
        questionId,
      });
      throw error;
    }
  }

  /**
   * Submit the assessment (complete and start AI review)
   */
  async submitAssessment(
    candidateId: string,
    assessmentId: string
  ): Promise<ICandidateJobAiAssessment> {
    try {
      logger.info({
        message: 'Submitting assessment',
        context: 'JobAiAssessmentService.submitAssessment',
        candidateId,
        assessmentId,
      });
      const assessment = await this.getCompleteJobAiAssessment(
        candidateId,
        assessmentId
      );
      if (
        assessment.status !==
          JobAiAssessmentStatusEnum.CANDIDATE_ASSESSMENT_IN_PROGRESS &&
        assessment.status !==
          JobAiAssessmentStatusEnum.CANDIDATE_ASSESSMENT_COMPLETED
      ) {
        throw new AppError(
          'Assessment is not in progress or completed',
          400,
          ErrorCode.ASSESSMENT_NOT_IN_PROGRESS
        );
      }
      // Mark as completed
      await this.prisma.job_ai_assessment.update({
        where: { id: assessmentId },
        data: {
          status: JobAiAssessmentStatusEnum.CANDIDATE_ASSESSMENT_COMPLETED,
          completedAt: new Date(),
        },
      });

      await this.tryMarkMcpInterviewCompleted(assessmentId);

      if (!assessment.task) {
        throw new AppError(
          'Assessment task not found',
          404,
          ErrorCode.JOB_AI_ASSESSMENT_TASK_NOT_FOUND
        );
      }

      logger.info({
        message: 'Processing submit task',
        context: 'JobAiAssessmentService.submitAssessment',
        assessment,
      });
      // process task async
      await this.jobAiAssessmentProcessor.addSubmitJob(assessmentId);

      return toCandidateJobAiAssessmentDomain(
        await this.getCompleteJobAiAssessment(candidateId, assessmentId)
      );
    } catch (error) {
      logger.error({
        message: 'Failed to submit assessment',
        context: 'JobAiAssessmentService.submitAssessment',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        assessmentId,
      });
      throw error;
    }
  }

  /**
   * Heartbeat (status update) for assessment
   */
  async heartbeat(
    candidateId: string,
    assessmentId: string,
    duration: number,
    status?: string
  ): Promise<boolean> {
    try {
      logger.info({
        message: 'Updating assessment status',
        context: 'JobAiAssessmentService.heartbeat',
        candidateId,
        assessmentId,
        duration,
        status,
      });
      await this.getCompleteJobAiAssessment(candidateId, assessmentId);
      const updateData: any = { duration };
      // do not update status
      // if (status) updateData.status = status;
      const updated = await this.prisma.job_ai_assessment.update({
        where: { id: assessmentId },
        data: updateData,
      });
      if (!updated) {
        throw new AppError(
          'Assessment not found',
          404,
          ErrorCode.JOB_AI_ASSESSMENT_NOT_FOUND
        );
      }
      return true;
    } catch (error) {
      logger.error({
        message: 'Failed to update heartbeat',
        context: 'JobAiAssessmentService.heartbeat',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        assessmentId,
      });
      throw error;
    }
  }

  /**
   * Proctoring event API
   */
  async proctor(
    candidateId: string,
    assessmentId: string,
    type: string
  ): Promise<ICandidateJobAiAssessmentProctoring> {
    try {
      await this.getCompleteJobAiAssessment(candidateId, assessmentId);
      let proctoring =
        await this.prisma.job_ai_assessment_proctoring.findUnique({
          where: { assessmentId },
        });
      if (!proctoring) {
        proctoring = await this.prisma.job_ai_assessment_proctoring.create({
          data: { assessmentId },
        });
      }
      const update: any = {};
      const currentEvents =
        typeof proctoring.suspiciousEvents === 'object' &&
        proctoring.suspiciousEvents !== null
          ? proctoring.suspiciousEvents
          : {};
      switch (type) {
        case 'TAB_SWITCHED':
          update.tabSwitches = { increment: 1 };
          break;
        case 'COPY_PASTE':
          update.copyPasteAttempts = { increment: 1 };
          break;
        case 'MULTIPLE_PERSONS_DETECTED':
          update.multiplePersonsDetected = true;
          break;
        case 'NO_FACE_DETECTED':
          // Track no face detection events in suspicious events
          update.suspiciousEvents = {
            set: {
              ...currentEvents,
              [new Date().toISOString()]: 'NO_FACE_DETECTED',
            },
          };
          break;
        case 'AUDIO_IRREGULARITY':
          update.audioIrregularities = true;
          break;
        case 'SCREEN_SHARE_VIOLATION':
          update.screenShareViolations = true;
          break;
        case 'WARNING':
          update.warningCount = { increment: 1 };
          break;
        default:
          update.suspiciousEvents = {
            set: { ...currentEvents, [new Date().toISOString()]: type },
          };
      }
      const updated = await this.prisma.job_ai_assessment_proctoring.update({
        where: { assessmentId },
        data: update,
      });
      return toCandidateJobAiAssessmentProctoringDomain(updated);
    } catch (error) {
      logger.error({
        message: 'Failed to update proctoring event',
        context: 'JobAiAssessmentService.proctor',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        assessmentId,
        type,
      });
      throw error;
    }
  }

  /**
   * Get presigned URL for video upload (using only assessmentId)
   */
  async getPresignedUrlByAssessmentId(
    assessmentId: string,
    chunkIndex?: number
  ): Promise<
    ICandidateJobAiAssessmentPresignedUrl & {
      chunkIndex: number;
      gcsUri: string;
      filePath: string;
    }
  > {
    try {
      logger.info({
        message: 'Getting presigned URL for video upload by assessmentId',
        context: 'JobAiAssessmentService.getPresignedUrlByAssessmentId',
        assessmentId,
        chunkIndex,
      });

      // Get assessment to find candidateId
      const assessment = await this.prisma.job_ai_assessment.findUnique({
        where: { id: assessmentId },
        select: { candidateId: true },
      });

      if (!assessment) {
        throw new AppError(
          'Job AI assessment not found',
          404,
          ErrorCode.JOB_AI_ASSESSMENT_NOT_FOUND
        );
      }

      // Use provided chunkIndex or calculate next chunk index
      let nextChunkIndex: number;
      if (chunkIndex !== undefined) {
        nextChunkIndex = chunkIndex;
      } else {
        // Get next chunk index - only count relevant chunks with uploaded/completed status
        const lastChunk =
          await this.prisma.jobAiAssessmentVideoChunkAnalysis.findFirst({
            where: {
              assessmentId,
              isRelevant: true,
              status: {
                in: ['uploaded', 'analyzing', 'completed'],
              },
            },
            orderBy: { chunkIndex: 'desc' },
            select: { chunkIndex: true },
          });

        nextChunkIndex = lastChunk ? lastChunk.chunkIndex + 1 : 0;
      }

      const { folderPath } = getBucketFolderPathToCandidateJobAiAssessmentVideo(
        assessment.candidateId,
        assessmentId
      );

      // Use consistent filename format: chunk-INDEX-TIMESTAMP.webm
      const timestamp = Date.now();
      const fileName = `chunk-${nextChunkIndex}-${timestamp}.webm`;
      const filePath = `${folderPath}/${fileName}`;
      const gcsUri = `gs://${ENV.GCS_BUCKET_NAME}/${filePath}`;

      // Generate presigned URL with longer expiry for upload (10 minutes)
      const presignedUrl = await this.storageProvider.generatePreSignedUrl(
        filePath,
        'write',
        'video/webm;codecs=vp8,opus'
      );

      logger.info({
        message: 'Generated presigned URL for video upload',
        context: 'JobAiAssessmentService.getPresignedUrlByAssessmentId',
        assessmentId,
        chunkIndex: nextChunkIndex,
        fileName,
        filePath,
      });

      return {
        presignedUrl,
        chunkIndex: nextChunkIndex,
        gcsUri,
        filePath,
      };
    } catch (error) {
      logger.error({
        message: 'Failed to get presigned URL by assessmentId',
        context: 'JobAiAssessmentService.getPresignedUrlByAssessmentId',
        error: error instanceof Error ? error.message : 'Unknown error',
        assessmentId,
      });
      throw error;
    }
  }
  /**
   * Get presigned URL for video upload (using only videoUrl)
   */
  async getPresignedUrlByVideoUrl(
    videoUrl: string
  ): Promise<ICandidateJobAiAssessmentPresignedUrl> {
    try {
      logger.info({
        message: 'Getting presigned URL for video upload by videoUrl',
        context: 'JobAiAssessmentService.getPresignedUrlByVideoUrl',
        videoUrl,
      });

      const presignedUrl = await this.storageProvider.generatePreSignedUrl(
        videoUrl,
        'write'
      );

      return { presignedUrl };
    } catch (error) {
      logger.error({
        message: 'Failed to get presigned URL by videoUrl',
        context: 'JobAiAssessmentService.getPresignedUrlByVideoUrl',
        error: error instanceof Error ? error.message : 'Unknown error',
        videoUrl,
      });
      throw error;
    }
  }

  /**
   * Get presigned URL for video upload
   */
  async getPresignedUrl(
    candidateId: string,
    assessmentId: string
  ): Promise<ICandidateJobAiAssessmentPresignedUrl> {
    try {
      logger.info({
        message: 'Getting presigned URL for video upload',
        context: 'JobAiAssessmentService.getPresignedUrl',
        candidateId,
        assessmentId,
      });

      await this.getCompleteJobAiAssessment(candidateId, assessmentId);

      const { folderPath } = getBucketFolderPathToCandidateJobAiAssessmentVideo(
        candidateId,
        assessmentId
      );
      const fileName = `chunk-${Date.now()}.webm`;
      const presignedUrl = await this.storageProvider.generatePreSignedUrl(
        `${folderPath}/${fileName}`,
        'write',
        'video/webm;codecs=vp8,opus'
      );

      return { presignedUrl };
    } catch (error) {
      logger.error({
        message: 'Failed to get presigned URL',
        context: 'JobAiAssessmentService.getPresignedUrl',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        assessmentId,
      });
      throw error;
    }
  }

  /**
   * Get presigned URL for question response audio upload (using only assessmentId)
   */
  async getQuestionAudioPresignedUrlByAssessmentId(
    assessmentId: string,
    questionId: string
  ): Promise<ICandidateJobAiAssessmentPresignedUrl> {
    try {
      logger.info({
        message:
          'Getting presigned URL for question response audio by assessmentId',
        context:
          'JobAiAssessmentService.getQuestionAudioPresignedUrlByAssessmentId',
        assessmentId,
        questionId,
      });

      // Get assessment to find candidateId
      const assessment = await this.prisma.job_ai_assessment.findUnique({
        where: { id: assessmentId },
        select: { candidateId: true },
      });

      if (!assessment) {
        throw new AppError(
          'Job AI assessment not found',
          404,
          ErrorCode.JOB_AI_ASSESSMENT_NOT_FOUND
        );
      }

      // Verify question exists in assessment
      const question = await this.prisma.job_ai_assessment_question.findFirst({
        where: {
          id: questionId,
          section: {
            assessmentId,
          },
        },
      });

      if (!question) {
        throw new AppError(
          'Question not found in assessment',
          404,
          ErrorCode.JOB_AI_ASSESSMENT_QUESTION_NOT_FOUND
        );
      }

      // Generate presigned URL for audio upload
      const { folderPath } =
        getBucketFolderPathToCandidateJobAiAssessmentQuestionAudio(
          assessment.candidateId,
          assessmentId,
          questionId
        );
      const fileName = `audio.mp3`;
      const presignedUrl = await this.storageProvider.generatePreSignedUrl(
        `${folderPath}/${fileName}`,
        'write',
        'audio/webm;codecs=opus'
      );

      return {
        presignedUrl,
      };
    } catch (error) {
      logger.error({
        message:
          'Failed to get presigned URL for question response audio by assessmentId',
        context:
          'JobAiAssessmentService.getQuestionAudioPresignedUrlByAssessmentId',
        error: error instanceof Error ? error.message : 'Unknown error',
        assessmentId,
        questionId,
      });
      throw error;
    }
  }

  /**
   * Get presigned URL for question response audio upload
   */
  async getQuestionAudioPresignedUrl(
    candidateId: string,
    assessmentId: string,
    questionId: string
  ): Promise<ICandidateJobAiAssessmentPresignedUrl> {
    try {
      logger.info({
        message: 'Getting presigned URL for question response audio',
        context: 'JobAiAssessmentService.getQuestionAudioPresignedUrl',
        candidateId,
        assessmentId,
        questionId,
      });

      // Verify assessment exists and belongs to candidate
      const assessment = await this.prisma.job_ai_assessment.findUnique({
        where: {
          id: assessmentId,
          candidateId,
        },
      });

      if (!assessment) {
        throw new AppError(
          'Job Ai assessment not found',
          404,
          ErrorCode.AI_ASSESSMENT_NOT_FOUND
        );
      }

      // Verify question exists in assessment
      const question = await this.prisma.job_ai_assessment_question.findFirst({
        where: {
          id: questionId,
          section: {
            assessmentId,
          },
        },
      });

      if (!question) {
        throw new AppError(
          'Question not found in assessment',
          404,
          ErrorCode.JOB_AI_ASSESSMENT_QUESTION_NOT_FOUND
        );
      }

      // Generate presigned URL for audio upload
      const { folderPath } =
        getBucketFolderPathToCandidateJobAiAssessmentQuestionAudio(
          candidateId,
          assessmentId,
          questionId
        );
      const fileName = `audio.mp3`;
      const presignedUrl = await this.storageProvider.generatePreSignedUrl(
        `${folderPath}/${fileName}`,
        'write',
        'audio/webm;codecs=opus'
      );

      return {
        presignedUrl,
      };
    } catch (error) {
      logger.error({
        message: 'Failed to get presigned URL for question response audio',
        context: 'JobAiAssessmentService.getQuestionAudioPresignedUrl',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        assessmentId,
        questionId,
      });
      throw error;
    }
  }

  /**
   * Record chunk upload and trigger analysis
   */
  async recordChunkUpload(
    candidateId: string,
    assessmentId: string,
    chunkIndex: number,
    gcsUri: string,
    questionId?: string,
    sectionId?: string
  ): Promise<{ success: boolean; chunkId: string }> {
    try {
      logger.info({
        message: 'Recording chunk upload',
        context: 'JobAiAssessmentService.recordChunkUpload',
        candidateId,
        assessmentId,
        chunkIndex,
        gcsUri,
        questionId,
        sectionId,
      });

      // Verify assessment belongs to candidate
      await this.getCompleteJobAiAssessment(candidateId, assessmentId);

      // ✅ CRITICAL: Only verify file existence for question chunks
      // Transition chunks (questionId = null) are expected to not have files
      if (questionId) {
        // Verify file exists in GCS before recording (only for question chunks)
        try {
          const filePath = gcsUri.replace(`gs://${ENV.GCS_BUCKET_NAME}/`, '');
          const exists = await this.storageProvider.fileExists(filePath);

          if (!exists) {
            throw new AppError(
              'Video chunk file not found in storage',
              404,
              ErrorCode.FILE_NOT_FOUND
            );
          }

          // Get file metadata to verify upload
          const metadata = await this.storageProvider.getFileMetadata(filePath);
          logger.info({
            message: '✅ Verified question chunk file in GCS',
            context: 'JobAiAssessmentService.recordChunkUpload',
            assessmentId,
            chunkIndex,
            questionId,
            fileSize: metadata.size,
            contentType: metadata.contentType,
          });

          // Extract video duration asynchronously (don't block upload recording)
          // This will be stored in the database after extraction completes
          this.extractAndStoreChunkDuration(
            assessmentId,
            chunkIndex,
            filePath
          ).catch((error) => {
            logger.warn({
              message: 'Failed to extract chunk duration (non-blocking)',
              context: 'JobAiAssessmentService.recordChunkUpload',
              error: error instanceof Error ? error.message : 'Unknown error',
              assessmentId,
              chunkIndex,
              questionId,
            });
            // Don't throw - this is a background operation
          });
        } catch (storageError) {
          logger.error({
            message: '❌ Failed to verify chunk file in GCS',
            context: 'JobAiAssessmentService.recordChunkUpload',
            error:
              storageError instanceof Error
                ? storageError.message
                : 'Unknown error',
            assessmentId,
            chunkIndex,
            questionId,
            gcsUri,
          });
          throw new AppError(
            'Failed to verify uploaded video chunk',
            500,
            ErrorCode.STORAGE_ERROR
          );
        }
      } else {
        // Log transition chunk (no file verification needed)
        logger.info({
          message:
            '⚠️ Recording transition chunk (no questionId) - skipping file verification',
          context: 'JobAiAssessmentService.recordChunkUpload',
          assessmentId,
          chunkIndex,
          gcsUri,
          note: 'Transition chunks are recorded between questions and do not have uploaded files',
        });
      }

      // Determine attempt number for this question
      // ✅ FIX: Use the same attemptNumber for all chunks of the same question
      // Only increment attemptNumber if there's an actual retry (not just multiple chunks)
      let attemptNumber = 1;
      if (questionId) {
        // Check if there are existing chunks for this question
        const existingChunks =
          await this.prisma.jobAiAssessmentVideoChunkAnalysis.findMany({
            where: {
              assessmentId,
              questionId,
              isRelevant: true, // Only count relevant chunks
            },
            orderBy: {
              attemptNumber: 'desc',
            },
            take: 1,
          });

        if (existingChunks.length > 0) {
          // ✅ Use the SAME attemptNumber as existing chunks (not increment)
          // Multiple chunks for the same question should have the same attemptNumber
          attemptNumber = existingChunks[0].attemptNumber;

          logger.debug({
            message: 'Adding chunk to existing question attempt',
            context: 'JobAiAssessmentService.recordChunkUpload',
            assessmentId,
            questionId,
            chunkIndex,
            attemptNumber,
            existingChunkCount: existingChunks.length,
          });

          // ❌ DO NOT mark previous chunks as irrelevant
          // ❌ DO NOT delete previous chunks from GCS
          // All chunks for the same question/attempt should coexist
        }
      }

      // Create or update chunk record
      const chunk = await this.prisma.jobAiAssessmentVideoChunkAnalysis.upsert({
        where: {
          job_ai_video_chunk_analysis_assessment_id_chunk_index_section_id_key:
            {
              assessmentId,
              chunkIndex,
              sectionId: sectionId ?? null, // Handle null sectionId for transition chunks
            } as Prisma.JobAiAssessmentVideoChunkAnalysisWhereUniqueInput['job_ai_video_chunk_analysis_assessment_id_chunk_index_section_id_key'],
        },
        create: {
          assessmentId,
          chunkIndex,
          gcsUri,
          questionId,
          sectionId,
          attemptNumber,
          isRelevant: !!questionId, // ✅ Transition chunks are not relevant
          status: questionId ? 'uploaded' : 'skipped', // ✅ Different status for transition chunks
        },
        update: {
          gcsUri,
          questionId,
          sectionId,
          attemptNumber,
          isRelevant: !!questionId, // ✅ Transition chunks are not relevant
          status: questionId ? 'uploaded' : 'skipped', // ✅ Different status for transition chunks
          updatedAt: new Date(),
        },
      });

      // ✅ Only trigger analysis for question chunks (with files)
      if (questionId) {
        // Trigger async analysis (don't wait for it)
        this.analyzeChunkAsync(assessmentId, chunkIndex, gcsUri).catch(
          (error) => {
            logger.error({
              message: 'Failed to analyze chunk',
              context: 'JobAiAssessmentService.recordChunkUpload',
              error: error instanceof Error ? error.message : 'Unknown error',
              assessmentId,
              chunkIndex,
              questionId,
            });
          }
        );

        logger.info({
          message: '✅ Question chunk recorded and analysis triggered',
          context: 'JobAiAssessmentService.recordChunkUpload',
          assessmentId,
          chunkIndex,
          questionId,
          chunkId: chunk.id,
        });
      } else {
        logger.info({
          message: '⚠️ Transition chunk recorded (skipped analysis)',
          context: 'JobAiAssessmentService.recordChunkUpload',
          assessmentId,
          chunkIndex,
          chunkId: chunk.id,
          note: 'Transition chunks do not trigger video analysis',
        });
      }

      return { success: true, chunkId: chunk.id };
    } catch (error) {
      logger.error({
        message: 'Failed to record chunk upload',
        context: 'JobAiAssessmentService.recordChunkUpload',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        assessmentId,
        chunkIndex,
      });
      throw error;
    }
  }

  /**
   * Analyze chunk asynchronously with automatic retry
   */
  private async analyzeChunkAsync(
    assessmentId: string,
    chunkIndex: number,
    gcsUri: string,
    retryCount: number = 0
  ): Promise<void> {
    const MAX_RETRIES = 2; // Retry up to 2 times (3 total attempts)

    try {
      // Check if chunk should be analyzed (skip if marked as irrelevant or skipped)
      const chunk =
        await this.prisma.jobAiAssessmentVideoChunkAnalysis.findFirst({
          where: {
            assessmentId,
            chunkIndex,
          },
          select: {
            isRelevant: true,
            status: true,
          },
        });

      if (chunk && (!chunk.isRelevant || chunk.status === 'skipped')) {
        logger.info({
          message:
            'Skipping chunk analysis - chunk marked as irrelevant or skipped',
          context: 'JobAiAssessmentService.analyzeChunkAsync',
          assessmentId,
          chunkIndex,
          isRelevant: chunk.isRelevant,
          status: chunk.status,
        });
        return;
      }

      // Update status to analyzing
      await this.prisma.jobAiAssessmentVideoChunkAnalysis.updateMany({
        where: {
          assessmentId,
          chunkIndex,
        },
        data: {
          status: 'analyzing',
        },
      });

      // Import and use IntelligentChunkAnalysisService
      const { IntelligentChunkAnalysisService } = await import(
        '@/services/video/intelligent.chunk.analysis.service'
      );
      const analysisService = new IntelligentChunkAnalysisService();

      // Perform analysis - analyzeChunk now handles upsert internally
      await analysisService.analyzeChunk(
        gcsUri,
        chunkIndex,
        assessmentId,
        'job'
      );

      logger.info({
        message: 'Chunk analysis completed',
        context: 'JobAiAssessmentService.analyzeChunkAsync',
        assessmentId,
        chunkIndex,
        retryCount,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      // Check if we should retry
      if (retryCount < MAX_RETRIES) {
        logger.warn({
          message: 'Chunk analysis failed, retrying...',
          context: 'JobAiAssessmentService.analyzeChunkAsync',
          error: errorMessage,
          assessmentId,
          chunkIndex,
          retryCount,
          nextRetry: retryCount + 1,
        });

        // Wait before retrying (exponential backoff)
        const delayMs = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, delayMs));

        // Retry
        return this.analyzeChunkAsync(
          assessmentId,
          chunkIndex,
          gcsUri,
          retryCount + 1
        );
      }

      // Max retries exceeded - mark as failed
      await this.prisma.jobAiAssessmentVideoChunkAnalysis.updateMany({
        where: {
          assessmentId,
          chunkIndex,
        },
        data: {
          status: 'failed',
        },
      });

      logger.error({
        message: 'Chunk analysis failed after retries',
        context: 'JobAiAssessmentService.analyzeChunkAsync',
        error: errorMessage,
        assessmentId,
        chunkIndex,
        totalAttempts: retryCount + 1,
      });
      throw error;
    }
  }

  /**
   * Extract and store video chunk duration asynchronously
   * This method runs in the background and doesn't block chunk recording
   */
  private async extractAndStoreChunkDuration(
    assessmentId: string,
    chunkIndex: number,
    filePath: string
  ): Promise<void> {
    try {
      logger.info({
        message: 'Extracting chunk duration',
        context: 'JobAiAssessmentService.extractAndStoreChunkDuration',
        assessmentId,
        chunkIndex,
        filePath,
      });

      // Extract duration from video file
      const duration = await extractVideoDurationFromStorage(
        this.storageProvider,
        filePath
      );

      if (duration === null) {
        logger.warn({
          message: 'Failed to extract chunk duration',
          context: 'JobAiAssessmentService.extractAndStoreChunkDuration',
          assessmentId,
          chunkIndex,
          filePath,
        });
        return;
      }

      // Update chunk record with duration
      await this.prisma.jobAiAssessmentVideoChunkAnalysis.updateMany({
        where: {
          assessmentId,
          chunkIndex,
        },
        data: {
          duration,
        },
      });

      logger.info({
        message: '✅ Chunk duration stored successfully',
        context: 'JobAiAssessmentService.extractAndStoreChunkDuration',
        assessmentId,
        chunkIndex,
        durationSeconds: duration,
        durationMinutes: (duration / 60).toFixed(2),
      });
    } catch (error) {
      logger.error({
        message: 'Failed to extract and store chunk duration',
        context: 'JobAiAssessmentService.extractAndStoreChunkDuration',
        error: error instanceof Error ? error.message : 'Unknown error',
        assessmentId,
        chunkIndex,
        filePath,
      });
      // Don't throw - this is a background operation
    }
  }

  /**
   * Get all relevant video chunks for an assessment
   */
  async getVideoChunks(
    candidateId: string,
    assessmentId: string,
    options?: {
      questionId?: string;
      sectionId?: string;
      includeAnalysis?: boolean;
      includePlaybackUrls?: boolean;
    }
  ): Promise<
    Array<{
      id: string;
      chunkIndex: number;
      questionId: string | null;
      sectionId: string | null;
      attemptNumber: number;
      status: string;
      createdAt: Date;
      analysis?: any;
      playbackUrl?: string;
      playbackUrlError?: string;
      duration?: number;
    }>
  > {
    try {
      logger.info({
        message: 'Getting video chunks',
        context: 'JobAiAssessmentService.getVideoChunks',
        candidateId,
        assessmentId,
        options,
      });

      // Verify assessment belongs to candidate
      const assessment = await this.getCompleteJobAiAssessment(
        candidateId,
        assessmentId
      );

      // Build query filter
      const where: any = {
        assessmentId,
        isRelevant: true,
      };

      if (options?.questionId) {
        where.questionId = options.questionId;
      }

      if (options?.sectionId) {
        where.sectionId = options.sectionId;
      }

      if (assessment.startedAt) {
        where.createdAt = {
          gte: assessment.startedAt,
        };
      }

      // Get chunks from database
      const chunks =
        await this.prisma.jobAiAssessmentVideoChunkAnalysis.findMany({
          where,
          orderBy: [
            { sectionId: 'asc' },
            { questionId: 'asc' },
            { chunkIndex: 'asc' },
          ],
          select: {
            id: true,
            chunkIndex: true,
            questionId: true,
            sectionId: true,
            attemptNumber: true,
            status: true,
            createdAt: true,
            gcsUri: true,
            duration: true,
            analysis: options?.includeAnalysis ?? false,
          },
        });

      // Generate playback URLs if requested
      const result = await Promise.all(
        chunks.map(async (chunk) => {
          const data: any = {
            id: chunk.id,
            chunkIndex: chunk.chunkIndex,
            questionId: chunk.questionId,
            sectionId: chunk.sectionId,
            attemptNumber: chunk.attemptNumber,
            status: chunk.status,
            createdAt: chunk.createdAt,
            duration: chunk.duration ?? undefined,
          };

          if (options?.includeAnalysis) {
            data.analysis = chunk.analysis;
          }

          if (options?.includePlaybackUrls) {
            // ✅ Skip playback URL generation for transition chunks (no file)
            if (!chunk.questionId) {
              logger.debug({
                message: 'Skipping playback URL for transition chunk (no file)',
                context: 'JobAiAssessmentService.getVideoChunks',
                chunkId: chunk.id,
                chunkIndex: chunk.chunkIndex,
              });
              data.playbackUrlError = 'Transition chunk (no file uploaded)';
            } else {
              try {
                // Extract file path from GCS URI
                const filePath = chunk.gcsUri.replace(
                  `gs://${ENV.GCS_BUCKET_NAME}/`,
                  ''
                );

                // Verify file exists before generating signed URL
                const exists = await this.storageProvider.fileExists(filePath);

                if (!exists) {
                  logger.warn({
                    message: 'Question chunk file not found in GCS',
                    context: 'JobAiAssessmentService.getVideoChunks',
                    chunkId: chunk.id,
                    chunkIndex: chunk.chunkIndex,
                    questionId: chunk.questionId,
                    gcsUri: chunk.gcsUri,
                    filePath,
                    reason: 'FILE_NOT_FOUND',
                  });

                  // Add error info to response for debugging
                  data.playbackUrlError = 'File not found in storage';
                } else {
                  // Generate signed URL valid for 1 hour for read operations
                  data.playbackUrl =
                    await this.storageProvider.generatePreSignedUrl(
                      filePath,
                      'read',
                      'video/webm'
                    );

                  logger.debug({
                    message: 'Generated playback URL for question chunk',
                    context: 'JobAiAssessmentService.getVideoChunks',
                    chunkId: chunk.id,
                    chunkIndex: chunk.chunkIndex,
                    questionId: chunk.questionId,
                  });
                }
              } catch (error) {
                const errorMessage =
                  error instanceof Error ? error.message : 'Unknown error';

                logger.error({
                  message: 'Failed to generate playback URL for question chunk',
                  context: 'JobAiAssessmentService.getVideoChunks',
                  error: errorMessage,
                  chunkId: chunk.id,
                  chunkIndex: chunk.chunkIndex,
                  questionId: chunk.questionId,
                  gcsUri: chunk.gcsUri,
                  hasGcsUri: !!chunk.gcsUri,
                  gcsUriLength: chunk.gcsUri?.length,
                });

                // Add error info to response for debugging
                data.playbackUrlError = errorMessage;
              }
            }
          }

          return data;
        })
      );

      logger.info({
        message: 'Retrieved video chunks',
        context: 'JobAiAssessmentService.getVideoChunks',
        assessmentId,
        chunkCount: result.length,
      });

      return result;
    } catch (error) {
      logger.error({
        message: 'Failed to get video chunks',
        context: 'JobAiAssessmentService.getVideoChunks',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        assessmentId,
      });
      throw error;
    }
  }

  /**
   * Get playback URL for a specific chunk
   */
  async getChunkPlaybackUrl(
    candidateId: string,
    assessmentId: string,
    chunkId: string
  ): Promise<{ playbackUrl: string; expiresIn: number }> {
    try {
      logger.info({
        message: 'Getting chunk playback URL',
        context: 'JobAiAssessmentService.getChunkPlaybackUrl',
        candidateId,
        assessmentId,
        chunkId,
      });

      // Verify assessment belongs to candidate
      await this.getCompleteJobAiAssessment(candidateId, assessmentId);

      // Get the chunk
      const chunk =
        await this.prisma.jobAiAssessmentVideoChunkAnalysis.findFirst({
          where: {
            id: chunkId,
            assessmentId,
            isRelevant: true,
          },
          select: {
            gcsUri: true,
          },
        });

      if (!chunk) {
        throw new AppError('Video chunk not found', 404, ErrorCode.NOT_FOUND);
      }

      const filePath = chunk.gcsUri.replace(`gs://${ENV.BUCKET_NAME}/`, '');

      const playbackUrl = await this.storageProvider.generatePreSignedUrl(
        filePath,
        'read'
      );

      logger.info({
        message: 'Generated chunk playback URL',
        context: 'JobAiAssessmentService.getChunkPlaybackUrl',
        chunkId,
      });

      return {
        playbackUrl,
        expiresIn: 3600,
      };
    } catch (error) {
      logger.error({
        message: 'Failed to get chunk playback URL',
        context: 'JobAiAssessmentService.getChunkPlaybackUrl',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        assessmentId,
        chunkId,
      });
      throw error;
    }
  }

  /**
   * Get video chunks by assessment ID (for support/admin access)
   */
  async getVideoChunksByAssessmentId(
    assessmentId: string,
    options?: {
      questionId?: string;
      sectionId?: string;
      includeAnalysis?: boolean;
      includePlaybackUrls?: boolean;
    }
  ): Promise<
    Array<{
      id: string;
      chunkIndex: number;
      questionId: string | null;
      sectionId: string | null;
      attemptNumber: number;
      status: string;
      createdAt: Date;
      analysis?: any;
      playbackUrl?: string;
      playbackUrlError?: string;
      duration?: number; // Duration in seconds from database
    }>
  > {
    try {
      logger.info({
        message: 'Getting video chunks (admin access)',
        context: 'JobAiAssessmentService.getVideoChunksByAssessmentId',
        assessmentId,
        options,
      });

      // Get assessment to check startedAt for filtering
      const assessment = await this.prisma.job_ai_assessment.findUnique({
        where: { id: assessmentId },
        select: { startedAt: true },
      });

      // Build query filter
      const where: any = {
        assessmentId,
        isRelevant: true,
      };

      if (options?.questionId) {
        where.questionId = options.questionId;
      }

      if (options?.sectionId) {
        where.sectionId = options.sectionId;
      }

      if (assessment?.startedAt) {
        where.createdAt = {
          gte: assessment.startedAt,
        };
      }

      // Get chunks from database
      const chunks =
        await this.prisma.jobAiAssessmentVideoChunkAnalysis.findMany({
          where,
          orderBy: [
            { sectionId: 'asc' },
            { questionId: 'asc' },
            { chunkIndex: 'asc' },
          ],
          select: {
            id: true,
            chunkIndex: true,
            questionId: true,
            sectionId: true,
            attemptNumber: true,
            status: true,
            createdAt: true,
            gcsUri: true,
            duration: true, // Include duration from database
            analysis: options?.includeAnalysis ?? false,
          },
        });

      // Generate playback URLs if requested
      const result = await Promise.all(
        chunks.map(async (chunk) => {
          const data: any = {
            id: chunk.id,
            chunkIndex: chunk.chunkIndex,
            questionId: chunk.questionId,
            sectionId: chunk.sectionId,
            attemptNumber: chunk.attemptNumber,
            status: chunk.status,
            createdAt: chunk.createdAt,
            duration: chunk.duration ?? undefined, // Include duration from database
          };

          if (options?.includeAnalysis) {
            data.analysis = chunk.analysis;
          }

          if (options?.includePlaybackUrls) {
            // Skip playback URL for transition chunks
            if (!chunk.questionId) {
              data.playbackUrlError = 'Transition chunk (no file uploaded)';
            } else {
              try {
                const filePath = chunk.gcsUri.replace(
                  `gs://${ENV.GCS_BUCKET_NAME}/`,
                  ''
                );

                // Verify file exists before generating signed URL
                const exists = await this.storageProvider.fileExists(filePath);

                if (!exists) {
                  logger.warn({
                    message: 'Chunk file not found in GCS',
                    context:
                      'JobAiAssessmentService.getVideoChunksByAssessmentId',
                    chunkId: chunk.id,
                    gcsUri: chunk.gcsUri,
                  });
                  data.playbackUrlError = 'File not found in storage';
                } else {
                  data.playbackUrl =
                    await this.storageProvider.generatePreSignedUrl(
                      filePath,
                      'read'
                    );
                }
              } catch (error) {
                logger.warn({
                  message: 'Failed to generate playback URL for chunk',
                  context:
                    'JobAiAssessmentService.getVideoChunksByAssessmentId',
                  error:
                    error instanceof Error ? error.message : 'Unknown error',
                  chunkId: chunk.id,
                });
                data.playbackUrlError =
                  error instanceof Error ? error.message : 'Unknown error';
              }
            }
          }

          return data;
        })
      );

      logger.info({
        message: 'Retrieved video chunks (admin access)',
        context: 'JobAiAssessmentService.getVideoChunksByAssessmentId',
        assessmentId,
        chunkCount: result.length,
      });

      return result;
    } catch (error) {
      logger.error({
        message: 'Failed to get video chunks (admin access)',
        context: 'JobAiAssessmentService.getVideoChunksByAssessmentId',
        error: error instanceof Error ? error.message : 'Unknown error',
        assessmentId,
      });
      throw error;
    }
  }

  /**
   * Get chunk playback URL by assessment and chunk ID (for support/admin access)
   */
  async getChunkPlaybackUrlByAssessmentId(
    assessmentId: string,
    chunkId: string
  ): Promise<{ playbackUrl: string; expiresIn: number }> {
    try {
      logger.info({
        message: 'Getting chunk playback URL (admin access)',
        context: 'JobAiAssessmentService.getChunkPlaybackUrlByAssessmentId',
        assessmentId,
        chunkId,
      });

      // Get the chunk
      const chunk =
        await this.prisma.jobAiAssessmentVideoChunkAnalysis.findFirst({
          where: {
            id: chunkId,
            assessmentId,
            isRelevant: true,
          },
          select: {
            gcsUri: true,
          },
        });

      if (!chunk) {
        throw new AppError('Video chunk not found', 404, ErrorCode.NOT_FOUND);
      }

      const filePath = chunk.gcsUri.replace(`gs://${ENV.BUCKET_NAME}/`, '');

      const playbackUrl = await this.storageProvider.generatePreSignedUrl(
        filePath,
        'read'
      );

      logger.info({
        message: 'Generated chunk playback URL (admin access)',
        context: 'JobAiAssessmentService.getChunkPlaybackUrlByAssessmentId',
        chunkId,
      });

      return {
        playbackUrl,
        expiresIn: 3600,
      };
    } catch (error) {
      logger.error({
        message: 'Failed to get chunk playback URL (admin access)',
        context: 'JobAiAssessmentService.getChunkPlaybackUrlByAssessmentId',
        error: error instanceof Error ? error.message : 'Unknown error',
        assessmentId,
        chunkId,
      });
      throw error;
    }
  }

  /**
   * Background cleanup task for irrelevant chunks
   * Deletes old chunk files from GCS and removes their database records
   */
  private async cleanupIrrelevantChunksAsync(
    assessmentId: string,
    questionId: string,
    currentAttemptNumber: number
  ): Promise<void> {
    try {
      logger.info({
        message: 'Starting cleanup of irrelevant chunks',
        context: 'JobAiAssessmentService.cleanupIrrelevantChunksAsync',
        assessmentId,
        questionId,
        currentAttemptNumber,
      });

      // Get all irrelevant chunks for this question (older attempts)
      const irrelevantChunks =
        await this.prisma.jobAiAssessmentVideoChunkAnalysis.findMany({
          where: {
            assessmentId,
            questionId,
            attemptNumber: {
              lt: currentAttemptNumber,
            },
            isRelevant: false,
          },
          select: {
            id: true,
            gcsUri: true,
            chunkIndex: true,
            attemptNumber: true,
          },
        });

      if (irrelevantChunks.length === 0) {
        logger.info({
          message: 'No irrelevant chunks to cleanup',
          context: 'JobAiAssessmentService.cleanupIrrelevantChunksAsync',
          assessmentId,
          questionId,
        });
        return;
      }

      logger.info({
        message: 'Found irrelevant chunks to delete',
        context: 'JobAiAssessmentService.cleanupIrrelevantChunksAsync',
        assessmentId,
        questionId,
        count: irrelevantChunks.length,
      });

      // Delete chunk files from GCS
      const deletionPromises = irrelevantChunks.map(async (chunk) => {
        try {
          // Extract file path from GCS URI (gs://bucket/path/to/file.webm -> path/to/file.webm)
          const filePath = chunk.gcsUri.replace(`gs://${ENV.BUCKET_NAME}/`, '');

          await this.storageProvider.deleteFile(filePath);

          logger.info({
            message: 'Deleted irrelevant chunk file',
            context: 'JobAiAssessmentService.cleanupIrrelevantChunksAsync',
            assessmentId,
            chunkIndex: chunk.chunkIndex,
            attemptNumber: chunk.attemptNumber,
            gcsUri: chunk.gcsUri,
          });
        } catch (error) {
          logger.error({
            message: 'Failed to delete chunk file',
            context: 'JobAiAssessmentService.cleanupIrrelevantChunksAsync',
            error: error instanceof Error ? error.message : 'Unknown error',
            assessmentId,
            chunkId: chunk.id,
            gcsUri: chunk.gcsUri,
          });
          // Continue with other deletions even if one fails
        }
      });

      await Promise.allSettled(deletionPromises);

      // Delete chunk records from database
      const deleteResult =
        await this.prisma.jobAiAssessmentVideoChunkAnalysis.deleteMany({
          where: {
            assessmentId,
            questionId,
            attemptNumber: {
              lt: currentAttemptNumber,
            },
            isRelevant: false,
          },
        });

      logger.info({
        message: 'Cleanup completed',
        context: 'JobAiAssessmentService.cleanupIrrelevantChunksAsync',
        assessmentId,
        questionId,
        deletedCount: deleteResult.count,
      });
    } catch (error) {
      logger.error({
        message: 'Failed to cleanup irrelevant chunks',
        context: 'JobAiAssessmentService.cleanupIrrelevantChunksAsync',
        error: error instanceof Error ? error.message : 'Unknown error',
        assessmentId,
        questionId,
      });
      // Don't throw - this is a background cleanup task
    }
  }

  /**
   * Process task
   */
  private async backgroundProcessInitializeTask(
    assessment: ICandidateJobAiAssessment
  ) {
    try {
      logger.info({
        message: 'Processing job ai assessment initialize task',
        context: 'JobAiAssessmentService.backgroundProcessInitializeTask',
        assessmentId: assessment.id,
        assessment,
      });
      // Check if task exists
      if (!assessment.task) {
        throw new AppError(
          'Assessment task not found',
          404,
          ErrorCode.JOB_AI_ASSESSMENT_TASK_NOT_FOUND
        );
      }
      // Update the assessment status
      await this.prisma.job_ai_assessment.update({
        where: { id: assessment.id },
        data: {
          status: JobAiAssessmentStatusEnum.AI_INITIALIZATION_IN_PROGRESS,
        },
      });

      // Update candidate's assessmentStage to JOB_AI_ASSESSMENT when Job AI assessment starts
      await this.prisma.candidate.update({
        where: { id: assessment.candidateId },
        data: {
          assessmentStage: CandidateAssessmentStageEnum.JOB_AI_ASSESSMENT,
        },
      });

      // Update the task status
      await this.prisma.job_ai_assessment_task.update({
        where: { id: assessment.task.id },
        data: {
          status: JobAiAssessmentTaskStatusEnum.INITIALIZE_STARTED,
        },
      });

      // Call the provider to create the job ai assessment
      await this.jobAiAssessmentProvider.initializeAssessment(
        assessment.task.id,
        assessment
      );

      // Update the assessment status
      await this.prisma.job_ai_assessment.update({
        where: { id: assessment.id },
        data: {
          status: JobAiAssessmentStatusEnum.AI_INITIALIZATION_COMPLETED,
        },
      });

      // Update the task status
      await this.prisma.job_ai_assessment_task.update({
        where: { id: assessment.task.id },
        data: {
          status: JobAiAssessmentTaskStatusEnum.INITIALIZE_COMPLETED,
        },
      });

      const aiTask = await this.jobAiAssessmentProvider.getJobAiAssessmentTask(
        assessment.task.id
      );

      logger.info({
        message: 'Job Ai assessment initialized',
        context: 'JobAiAssessmentService.backgroundProcessInitializeTask',
        taskId: assessment.task.id,
        sections: aiTask.assessment.sections,
      });

      // Update the assessment
      await this.prisma.job_ai_assessment.update({
        where: { id: assessment.id },
        data: {
          status: aiTask.assessment.status,
          result: aiTask.assessment.result,
          score: aiTask.assessment.score,
          overallFeedback: aiTask.assessment.overallFeedback,
          recommendation: aiTask.assessment.recommendation,
          skills: aiTask.assessment.skills,
          technicalSkills: aiTask.assessment.technicalSkills,
          softSkills: aiTask.assessment.softSkills,
          industriesFit: aiTask.assessment.industriesFit,
          jobRolesFit: aiTask.assessment.jobRolesFit,
          strengths: aiTask.assessment.strengths,
          areasForImprovement: aiTask.assessment.areasForImprovement,
          sections: {
            create: aiTask.assessment.sections.map((section) => ({
              id: section.id,
              title: section.title,
              description: section.description,
              type: section.type,
              status: section.status,
              result: section.result,
              score: section.score,
              order: section.order,
              isRequired: section.isRequired,
              passThreshold: section.passThreshold,
              feedback: section.feedback,
              strengths: section.strengths,
              areasForImprovement: section.areasForImprovement,
              questions: {
                create:
                  section.questions?.map((question) => ({
                    id: question.id,
                    question: question.question,
                    questionType: question.questionType,
                    options: question.options,
                    correctAnswer: question.correctAnswer,
                    score: question.score,
                    maxScore: question.maxScore,
                    order: question.order,
                    isRequired: question.isRequired,
                    feedback: question.feedback,
                  })) || [],
              },
            })),
          },
        },
      });

      logger.info({
        message: 'Job Ai assessment complete',
        context: 'JobAiAssessmentService.backgroundProcessInitializeTask',
        taskId: assessment.task.id,
        assessment: aiTask.assessment,
      });
    } catch (error) {
      logger.error({
        message: 'Failed to process task',
        context: 'JobAiAssessmentService.processTask',
        error: error instanceof Error ? error.message : 'Unknown error',
        assessmentId: assessment.id,
      });
      try {
        if (!assessment.task) {
          throw new AppError(
            'Assessment task not found',
            404,
            ErrorCode.JOB_AI_ASSESSMENT_TASK_NOT_FOUND
          );
        }
        // Update the task status
        await this.prisma.job_ai_assessment_task.update({
          where: { id: assessment.task.id },
          data: {
            status: JobAiAssessmentTaskStatusEnum.FAILED,
          },
        });
        // Update the assessment status
        await this.prisma.job_ai_assessment.update({
          where: { id: assessment.id },
          data: {
            status: JobAiAssessmentStatusEnum.ASSESSMENT_COMPLETED,
          },
        });
      } catch (error) {
        logger.error({
          message: 'Failed to update assessment status',
          context: 'JobAiAssessmentService.backgroundProcessInitializeTask',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  /**
   * Process submit task
   */
  private async backgroundProcessSubmitTask(
    assessment: ICandidateJobAiAssessment
  ) {
    try {
      logger.info({
        message: 'Processing submit task',
        context: 'JobAiAssessmentService.backgroundProcessSubmitTask',
        assessment,
      });

      if (!assessment.task) {
        throw new AppError(
          'Assessment task not found',
          404,
          ErrorCode.JOB_AI_ASSESSMENT_TASK_NOT_FOUND
        );
      }

      // Update the assessment status
      await this.prisma.job_ai_assessment.update({
        where: { id: assessment.id },
        data: {
          status: JobAiAssessmentStatusEnum.AI_REVIEW_IN_PROGRESS,
        },
      });

      // Update the assessment task status
      await this.prisma.job_ai_assessment_task.update({
        where: { id: assessment.task.id },
        data: {
          status: JobAiAssessmentTaskStatusEnum.ASSESSMENT_STARTED,
        },
      });
      // Start AI review
      await this.jobAiAssessmentProvider.doAssessment(assessment.task.id);

      // Copy the assessment to the candidate
      const aiTask = await this.jobAiAssessmentProvider.getJobAiAssessmentTask(
        assessment.task.id
      );

      logger.info({
        message: 'Job Ai assessment aiTask completed',
        context: 'JobAiAssessmentService.backgroundProcessSubmitTask',
        aiTask,
      });

      // Synthesize final video chunk analysis (if chunks exist)
      try {
        const { IntelligentChunkAnalysisService } = await import(
          '@/services/video/intelligent.chunk.analysis.service'
        );
        const analysisService = new IntelligentChunkAnalysisService();

        // Check if there are any analyzed chunks
        const chunkCount =
          await this.prisma.jobAiAssessmentVideoChunkAnalysis.count({
            where: {
              assessmentId: assessment.id,
              status: 'completed',
            },
          });

        if (chunkCount > 0) {
          logger.info({
            message: 'Synthesizing final video chunk analysis',
            context: 'JobAiAssessmentService.backgroundProcessSubmitTask',
            assessmentId: assessment.id,
            chunkCount,
          });

          const finalAnalysis = await analysisService.synthesizeFinalAnalysis(
            assessment.id,
            'job'
          );

          // Store final analysis in videoAnalysis field
          await this.createVideoAnalysis(assessment.id, finalAnalysis);

          await this.prisma.job_ai_assessment.update({
            where: { id: assessment.id },
            data: {
              videoAnalysisStatus:
                JobAiAssessmentVideoAnalysisStatusEnum.COMPLETED,
              score: finalAnalysis.overallScore,
              overallFeedback: finalAnalysis.overallFeedback,
              strengths: finalAnalysis.strengths,
              areasForImprovement: finalAnalysis.areasForImprovement,
            },
          });

          logger.info({
            message: 'Final video chunk analysis completed',
            context: 'JobAiAssessmentService.backgroundProcessSubmitTask',
            assessmentId: assessment.id,
          });
        } else {
          logger.info({
            message: 'No video chunks found for analysis',
            context: 'JobAiAssessmentService.backgroundProcessSubmitTask',
            assessmentId: assessment.id,
          });
        }
      } catch (videoError) {
        logger.error({
          message:
            'Failed to synthesize video chunk analysis (continuing anyway)',
          context: 'JobAiAssessmentService.backgroundProcessSubmitTask',
          error:
            videoError instanceof Error ? videoError.message : 'Unknown error',
          assessmentId: assessment.id,
        });
        // Don't throw - video analysis is supplementary
      }

      // DISABLED: Video merging and analysis (using chunk-based analysis instead)
      // await this.jobAiAssessmentVideoAnalysisProcessor.addVideoAnalysisJob(
      //   assessment.id,
      //   assessment.task.id
      // );
      logger.info({
        message:
          'Skipping legacy video merge/analysis - using chunk-based approach',
        context: 'JobAiAssessmentService.backgroundProcessSubmitTask',
        assessmentId: assessment.id,
      });

      if (aiTask.status === JobAiAssessmentTaskStatusEnum.FAILED) {
        // Update the assessment task status
        await this.prisma.job_ai_assessment_task.update({
          where: { id: assessment.task.id },
          data: {
            status: JobAiAssessmentTaskStatusEnum.FAILED,
          },
        });
        // Update the assessment status
        await this.prisma.job_ai_assessment.update({
          where: { id: assessment.id },
          data: {
            status: JobAiAssessmentStatusEnum.ASSESSMENT_FAILED,
            result: JobAiAssessmentResultEnum.AI_REVIEW_FAILED,
          },
        });

        // update the candidate job ai assessment status
        await this.prisma.candidate.update({
          where: { id: assessment.candidateId },
          data: {
            jobAiAssessments: {
              update: {
                where: { id: assessment.id },
                data: {
                  status: JobAiAssessmentStatusEnum.ASSESSMENT_FAILED,
                },
              },
            },
          },
        });

        // Notify MCP client if this candidate was sent via MCP
        this.notifyMcpWebhookForAssessment(assessment.id, 'assessment.failed');

        return;
      }

      await this.updateCandidateJobAiAssessmentResult(
        assessment.id,
        aiTask.assessment
      );

      // Update the assessment task status
      await this.prisma.job_ai_assessment_task.update({
        where: { id: assessment.task.id },
        data: {
          status: JobAiAssessmentTaskStatusEnum.ASSESSMENT_COMPLETED,
        },
      });
    } catch (error) {
      logger.error({
        message: 'Failed to process submit task',
        context: 'JobAiAssessmentService.backgroundProcessSubmitTask',
        error: error instanceof Error ? error.message : 'Unknown error',
        assessment,
      });
      try {
        if (assessment.task) {
          // Update the assessment task status
          await this.prisma.job_ai_assessment_task.update({
            where: { id: assessment.task.id },
            data: {
              status: JobAiAssessmentTaskStatusEnum.FAILED,
            },
          });
          // Update the assessment status
          await this.prisma.job_ai_assessment.update({
            where: { id: assessment.id },
            data: {
              status: JobAiAssessmentStatusEnum.ASSESSMENT_FAILED,
            },
          });
        }
      } catch (error) {
        logger.error({
          message: 'Failed to update assessment task status',
          context: 'JobAiAssessmentService.backgroundProcessSubmitTask',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  private async updateCandidateJobAiAssessmentResult(
    assessmentId: string,
    assessment: ICandidateJobAiAssessment
  ) {
    await this.prisma.$transaction(async (tx) => {
      await tx.job_ai_assessment.update({
        where: { id: assessmentId },
        data: {
          status: JobAiAssessmentStatusEnum.AI_REVIEW_COMPLETED,
          score: assessment.score,
          result: assessment.result,
          overallFeedback: assessment.overallFeedback,
          recommendation: assessment.recommendation,
          strengths: assessment.strengths,
          areasForImprovement: assessment.areasForImprovement,
          selectedForNextRound: assessment.selectedForNextRound,
          skills: assessment.skills,
          technicalSkills: assessment.technicalSkills,
          softSkills: assessment.softSkills,
          industriesFit: assessment.industriesFit,
          jobRolesFit: assessment.jobRolesFit,
          experienceSummary: assessment.experienceSummary,
          educationSummary: assessment.educationSummary,
        },
      });

      if (assessment.sections?.length) {
        for (const section of assessment.sections) {
          const hasAiResult =
            section.status === JobAiAssessmentSectionStatusEnum.COMPLETED;
          if (!hasAiResult) continue;
          await tx.job_ai_assessment_section.update({
            where: { id: section.id },
            data: {
              status: section.status,
              result: section.result,
              score: section.score ?? 0,
              feedback: section.feedback ?? null,
              strengths: section.strengths ?? [],
              areasForImprovement: section.areasForImprovement ?? [],
            },
          });
        }
      }
    });

    // If this assessment is linked to an MCP interview, publish RESULTS_READY on the interview.
    await this.tryMarkMcpInterviewResultsReady(assessmentId);

    // Notify MCP client if this candidate was sent via MCP
    const webhookEvent =
      assessment.result === 'PASSED'
        ? 'assessment.passed'
        : 'assessment.completed';
    this.notifyMcpWebhookForAssessment(
      assessmentId,
      webhookEvent as 'assessment.passed' | 'assessment.completed'
    );
  }

  /**
   * Helper method to send MCP webhook notification for assessment events
   * Fetches the jobApplicationId from the database and sends the notification
   */
  private async notifyMcpWebhookForAssessment(
    assessmentId: string,
    event:
      | 'assessment.started'
      | 'assessment.completed'
      | 'assessment.passed'
      | 'assessment.failed'
  ): Promise<void> {
    try {
      const assessment = await this.prisma.job_ai_assessment.findUnique({
        where: { id: assessmentId },
        select: { jobApplicationId: true },
      });

      if (assessment?.jobApplicationId) {
        await McpWebhookService.getInstance().notifyInterviewResult(
          assessment.jobApplicationId,
          event
        );
      }
    } catch (err) {
      logger.error({
        message: 'Failed to send MCP webhook for assessment event',
        context: 'JobAiAssessmentService.notifyMcpWebhookForAssessment',
        error: err instanceof Error ? err.message : 'Unknown error',
        assessmentId,
        event,
      });
    }
  }

  /**
   * Try to link an MCP interview to a newly created Job AI assessment.
   * This enables downstream status/result sync for A2A/MCP.
   */
  private async tryLinkMcpInterviewToAssessment(params: {
    candidateId: string;
    inviteExpiresAt: Date;
    assessmentId: string;
  }): Promise<void> {
    try {
      const interview = await this.prisma.mcp_interview.findFirst({
        where: {
          candidateId: params.candidateId,
          status: mcp_interview_status.IN_PROGRESS,
          expiresAt: params.inviteExpiresAt,
          assessmentId: null,
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });

      if (!interview) {
        return;
      }

      await this.prisma.mcp_interview.update({
        where: { id: interview.id },
        data: {
          assessmentId: params.assessmentId,
        },
      });
    } catch (error) {
      logger.warn({
        message:
          'Failed to link MCP interview to Job AI assessment (non-fatal)',
        context: 'JobAiAssessmentService.tryLinkMcpInterviewToAssessment',
        candidateId: params.candidateId,
        assessmentId: params.assessmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * When a candidate submits the assessment, mark the linked MCP interview as COMPLETED.
   */
  private async tryMarkMcpInterviewCompleted(
    assessmentId: string
  ): Promise<void> {
    try {
      const now = new Date();
      await this.prisma.mcp_interview.updateMany({
        where: { assessmentId, status: mcp_interview_status.IN_PROGRESS },
        data: { status: mcp_interview_status.COMPLETED, completedAt: now },
      });
    } catch (error) {
      logger.warn({
        message: 'Failed to mark MCP interview as COMPLETED (non-fatal)',
        context: 'JobAiAssessmentService.tryMarkMcpInterviewCompleted',
        assessmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * When AI review completes, mark the linked MCP interview as RESULTS_READY and populate results.
   * This is idempotent (clears prior skill results for the interview before writing).
   */
  private async tryMarkMcpInterviewResultsReady(
    assessmentId: string
  ): Promise<void> {
    try {
      const interview = await this.prisma.mcp_interview.findFirst({
        where: { assessmentId },
        select: {
          id: true,
          mcpClientId: true,
          externalReferenceId: true,
          externalCandidateId: true,
          candidateEmail: true,
          candidateName: true,
          skillsToAssess: true,
          completedAt: true,
        },
      });

      if (!interview) {
        return;
      }

      const assessment = await this.prisma.job_ai_assessment.findUnique({
        where: { id: assessmentId },
        include: {
          sections: {
            include: { questions: true },
            orderBy: { order: 'asc' },
          },
        },
      });

      if (!assessment) {
        return;
      }

      const rawScore = assessment.score ?? 0;
      const score100 = rawScore <= 1 ? Math.round(rawScore * 100) : rawScore;

      const recommendation =
        assessment.recommendation === 'HIGHLY_RECOMMENDED'
          ? 'STRONG_HIRE'
          : assessment.recommendation === 'RECOMMENDED'
            ? 'HIRE'
            : assessment.recommendation === 'NOT_RECOMMENDED'
              ? 'NO_HIRE'
              : null;

      const resultSummary =
        assessment.overallFeedback ||
        (assessment.strengths?.length || assessment.areasForImprovement?.length
          ? [
              ...(assessment.strengths?.length
                ? [`Strengths: ${assessment.strengths.join('; ')}`]
                : []),
              ...(assessment.areasForImprovement?.length
                ? [
                    `Areas for improvement: ${assessment.areasForImprovement.join(
                      '; '
                    )}`,
                  ]
                : []),
            ].join('\n')
          : null);

      const sectionScores = assessment.sections.map((s) => ({
        sectionId: s.id,
        sectionName: s.title || s.type,
        score: s.score,
        timeSpent:
          s.startedAt && s.completedAt
            ? `${Math.floor((s.completedAt.getTime() - s.startedAt.getTime()) / 60000)}:${Math.floor(
                ((s.completedAt.getTime() - s.startedAt.getTime()) % 60000) /
                  1000
              )
                .toString()
                .padStart(2, '0')}`
            : null,
        questionsAnswered: s.questions?.filter((q) => q.isAnswered).length ?? 0,
        questionsTotal: s.questions?.length ?? 0,
      }));

      const proficiencyFromScore100 = (s100: number): mcp_skill_proficiency => {
        if (s100 >= 91) return mcp_skill_proficiency.EXPERT;
        if (s100 >= 71) return mcp_skill_proficiency.ADVANCED;
        if (s100 >= 41) return mcp_skill_proficiency.INTERMEDIATE;
        return mcp_skill_proficiency.BEGINNER;
      };

      // Clear previous per-skill results to keep this idempotent.
      await this.prisma.mcp_interview_skill_result.deleteMany({
        where: { interviewId: interview.id },
      });

      for (const skillName of interview.skillsToAssess || []) {
        await this.prisma.mcp_interview_skill_result.create({
          data: {
            interviewId: interview.id,
            skillName,
            score: score100,
            proficiencyLevel: proficiencyFromScore100(score100),
            strengths: assessment.strengths ?? [],
            improvements: assessment.areasForImprovement ?? [],
            feedback: assessment.overallFeedback ?? null,
            sectionScores,
          },
        });
      }

      await this.prisma.mcp_interview.update({
        where: { id: interview.id },
        data: {
          status: mcp_interview_status.RESULTS_READY,
          resultsReadyAt: new Date(),
          completedAt:
            interview.completedAt ?? assessment.completedAt ?? new Date(),
          overallScore: score100,
          recommendation,
          resultSummary,
        },
      });

      // Trigger the standard interview results webhook for MCP/A2A consumers.
      await McpWebhookService.getInstance().triggerWebhook(
        interview.mcpClientId,
        'interview.results_ready',
        {
          interviewId: interview.id,
          externalReferenceId: interview.externalReferenceId,
          externalCandidateId: interview.externalCandidateId,
          candidateEmail: interview.candidateEmail,
          candidateName: interview.candidateName,
          overallScore: score100,
          recommendation,
        }
      );
    } catch (error) {
      logger.warn({
        message: 'Failed to mark MCP interview RESULTS_READY (non-fatal)',
        context: 'JobAiAssessmentService.tryMarkMcpInterviewResultsReady',
        assessmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async backgroundProcessVideoAnalysis(
    assessmentId: string,
    taskId: string
  ): Promise<void> {
    logger.info({
      message: 'Processing job AI assessment video analysis (chunk-based)',
      context: 'JobAiAssessmentService.backgroundProcessVideoAnalysis',
      assessmentId,
      taskId,
    });
    const assessment =
      await this.getCompleteJobAiAssessmentByAssessmentId(assessmentId);

    logger.info({
      message: 'Job AI assessment video analysis',
      context: 'JobAiAssessmentService.backgroundProcessVideoAnalysis',
      assessment,
    });
    try {
      // Update status to IN_PROGRESS
      await this.prisma.job_ai_assessment.update({
        where: { id: assessmentId },
        data: {
          videoAnalysisStatus:
            JobAiAssessmentVideoAnalysisStatusEnum.IN_PROGRESS,
        },
      });

      // Synthesize final video chunk analysis (if chunks exist)
      const { IntelligentChunkAnalysisService } = await import(
        '@/services/video/intelligent.chunk.analysis.service'
      );
      const analysisService = new IntelligentChunkAnalysisService();

      // Check if there are any analyzed chunks
      const chunkCount =
        await this.prisma.jobAiAssessmentVideoChunkAnalysis.count({
          where: {
            assessmentId: assessment.id,
            status: 'completed',
          },
        });

      if (chunkCount > 0) {
        logger.info({
          message: 'Synthesizing final video chunk analysis',
          context: 'JobAiAssessmentService.backgroundProcessVideoAnalysis',
          assessmentId: assessment.id,
          chunkCount,
        });

        const finalAnalysis = await analysisService.synthesizeFinalAnalysis(
          assessment.id,
          'job'
        );

        // Store final analysis in videoAnalysis field
        await this.createVideoAnalysis(assessment.id, finalAnalysis);

        // Update the assessment video analysis status to COMPLETED
        await this.prisma.job_ai_assessment.update({
          where: { id: assessmentId },
          data: {
            videoAnalysisStatus:
              JobAiAssessmentVideoAnalysisStatusEnum.COMPLETED,
          },
        });

        logger.info({
          message: 'Final video chunk analysis completed',
          context: 'JobAiAssessmentService.backgroundProcessVideoAnalysis',
          assessmentId: assessment.id,
        });
      } else {
        logger.warn({
          message: 'No video chunks found for analysis',
          context: 'JobAiAssessmentService.backgroundProcessVideoAnalysis',
          assessmentId: assessment.id,
        });

        // Update status to FAILED since no chunks were found
        await this.prisma.job_ai_assessment.update({
          where: { id: assessmentId },
          data: {
            videoAnalysisStatus: JobAiAssessmentVideoAnalysisStatusEnum.FAILED,
            videoAnalysisError: 'No video chunks found for analysis',
          },
        });
      }

      // DISABLED: Legacy full-video analysis (now using chunk-based approach)
      // await this.jobAiAssessmentProvider.initializeAssessment(taskId, assessment);
      // const aiTask = await this.jobAiAssessmentProvider.doAssessmentVideoAnalysis(taskId);
      logger.info({
        message:
          'Skipping legacy video merge/analysis - using chunk-based approach',
        context: 'JobAiAssessmentService.backgroundProcessVideoAnalysis',
        assessmentId: assessment.id,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      logger.error({
        message: 'Failed to process job AI assessment video analysis',
        context: 'JobAiAssessmentService.backgroundProcessVideoAnalysis',
        error: errorMessage,
        assessment,
        taskId,
      });

      // Update status to FAILED and store error message
      await this.prisma.job_ai_assessment.update({
        where: { id: assessmentId },
        data: {
          videoAnalysisStatus: JobAiAssessmentVideoAnalysisStatusEnum.FAILED,
          videoAnalysisError: errorMessage,
        },
      });

      // Re-throw the error so the job is marked as failed in the queue
      throw error;
    }
  }

  /**
   * Manually reprocess final video analysis for an assessment
   * Useful for regenerating analysis after fixes or for missing analyses
   */
  async reprocessVideoAnalysis(
    candidateId: string,
    assessmentId: string
  ): Promise<ICandidateJobAiAssessmentVideoAnalysis> {
    logger.info({
      message: 'Manually reprocessing video analysis',
      context: 'JobAiAssessmentService.reprocessVideoAnalysis',
      candidateId,
      assessmentId,
    });

    // Verify assessment belongs to candidate
    const _assessment = await this.getCompleteJobAiAssessment(
      candidateId,
      assessmentId
    );

    try {
      // Update status to IN_PROGRESS
      await this.prisma.job_ai_assessment.update({
        where: { id: assessmentId },
        data: {
          videoAnalysisStatus:
            JobAiAssessmentVideoAnalysisStatusEnum.IN_PROGRESS,
        },
      });

      // Import analysis service
      const { IntelligentChunkAnalysisService } = await import(
        '@/services/video/intelligent.chunk.analysis.service'
      );
      const analysisService = new IntelligentChunkAnalysisService();

      // Get all chunks for comprehensive verification
      const allChunks =
        await this.prisma.jobAiAssessmentVideoChunkAnalysis.findMany({
          where: { assessmentId },
          orderBy: { chunkIndex: 'asc' },
          select: {
            chunkIndex: true,
            status: true,
            isRelevant: true,
            analysis: true,
          },
        });

      // Comprehensive verification to ensure fairness
      const completedChunks = allChunks.filter(
        (c) => c.status === 'completed' && c.isRelevant
      );
      const failedChunks = allChunks.filter((c) => c.status === 'failed');
      const processingChunks = allChunks.filter(
        (c) => c.status === 'analyzing' || c.status === 'pending'
      );
      const irrelevantChunks = allChunks.filter((c) => !c.isRelevant);

      // Count relevant chunks that aren't completed
      const relevantChunks = allChunks.filter((c) => c.isRelevant);
      const incompleteRelevantChunks = relevantChunks.filter(
        (c) => c.status !== 'completed'
      );

      logger.info({
        message: 'Chunk verification for reprocessing',
        context: 'JobAiAssessmentService.reprocessVideoAnalysis',
        assessmentId,
        totalChunks: allChunks.length,
        relevantChunks: relevantChunks.length,
        completedChunks: completedChunks.length,
        irrelevantChunks: irrelevantChunks.length,
        failedChunks: failedChunks.length,
        processingChunks: processingChunks.length,
        chunkIndices: completedChunks
          .map((c) => c.chunkIndex)
          .sort((a, b) => a - b),
      });

      // Verification checks to ensure fairness
      if (completedChunks.length === 0) {
        throw new Error(
          'No completed video chunks found for analysis. Ensure chunks are uploaded and analyzed first.'
        );
      }

      if (failedChunks.length > 0) {
        logger.warn({
          message: 'Found failed chunks during reprocessing verification',
          context: 'JobAiAssessmentService.reprocessVideoAnalysis',
          assessmentId,
          failedChunkIndices: failedChunks.map((c) => c.chunkIndex),
        });
        throw new Error(
          `Cannot reprocess: ${failedChunks.length} chunk(s) failed analysis. Please re-analyze failed chunks first to ensure fair assessment.`
        );
      }

      if (processingChunks.length > 0) {
        logger.warn({
          message:
            'Found chunks still processing during reprocessing verification',
          context: 'JobAiAssessmentService.reprocessVideoAnalysis',
          assessmentId,
          processingChunkIndices: processingChunks.map((c) => c.chunkIndex),
        });
        throw new Error(
          `Cannot reprocess: ${processingChunks.length} chunk(s) still being analyzed. Please wait for all chunks to complete.`
        );
      }

      // Check that all relevant chunks are completed
      if (incompleteRelevantChunks.length > 0) {
        logger.warn({
          message:
            'Found incomplete relevant chunks during reprocessing verification',
          context: 'JobAiAssessmentService.reprocessVideoAnalysis',
          assessmentId,
          incompleteChunkIndices: incompleteRelevantChunks.map(
            (c) => c.chunkIndex
          ),
          incompleteChunkStatuses: incompleteRelevantChunks.map((c) => ({
            index: c.chunkIndex,
            status: c.status,
          })),
        });
        throw new Error(
          `Cannot reprocess: ${incompleteRelevantChunks.length} relevant chunk(s) are not completed. All relevant chunks must be analyzed to ensure fair assessment.`
        );
      }

      // Minimum coverage check (at least 2 chunks for meaningful analysis)
      if (completedChunks.length < 2) {
        throw new Error(
          `Insufficient chunk coverage: only ${completedChunks.length} chunk(s) available. At least 2 chunks required for fair assessment.`
        );
      }

      // Synthesize final analysis from chunks
      const finalAnalysis = await analysisService.synthesizeFinalAnalysis(
        assessmentId,
        'job'
      );

      // Store final analysis
      const videoAnalysis = await this.createVideoAnalysis(
        assessmentId,
        finalAnalysis
      );

      // Update status to COMPLETED
      await this.prisma.job_ai_assessment.update({
        where: { id: assessmentId },
        data: {
          videoAnalysisStatus: JobAiAssessmentVideoAnalysisStatusEnum.COMPLETED,
          videoAnalysisError: null, // Clear any previous errors on success
          score: finalAnalysis.overallScore,
          overallFeedback: finalAnalysis.overallFeedback,
          strengths: finalAnalysis.strengths,
          areasForImprovement: finalAnalysis.areasForImprovement,
        },
      });

      logger.info({
        message: 'Video analysis reprocessing completed',
        context: 'JobAiAssessmentService.reprocessVideoAnalysis',
        assessmentId,
        overallScore: videoAnalysis.overallScore,
      });

      return videoAnalysis;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      logger.error({
        message: 'Failed to reprocess video analysis',
        context: 'JobAiAssessmentService.reprocessVideoAnalysis',
        error: errorMessage,
        assessmentId,
      });

      // Update status to FAILED
      await this.prisma.job_ai_assessment.update({
        where: { id: assessmentId },
        data: {
          videoAnalysisStatus: JobAiAssessmentVideoAnalysisStatusEnum.FAILED,
          videoAnalysisError: errorMessage,
        },
      });

      throw error;
    }
  }

  async createVideoAnalysis(
    assessmentId: string,
    videoAnalysis: ICandidateJobAiAssessmentVideoAnalysis
  ): Promise<ICandidateJobAiAssessmentVideoAnalysis> {
    // Create or update the video analysis
    await this.prisma.job_ai_assessment_video_analysis.upsert({
      where: { assessmentId },
      update: {
        transcriptText: videoAnalysis.transcriptText,
        videoUrl: videoAnalysis.videoUrl,
        highlightsVideoUrl: videoAnalysis.highlightsVideoUrl,
        highlightsInstructions: videoAnalysis.highlightsInstructions,
        overallScore: videoAnalysis.overallScore,
        overallFeedback: videoAnalysis.overallFeedback,
        engagementScore: videoAnalysis.engagementScore,
        engagementFeedback: videoAnalysis.engagementFeedback,
        confidenceScore: videoAnalysis.confidenceScore,
        confidenceFeedback: videoAnalysis.confidenceFeedback,
        clarityScore: videoAnalysis.clarityScore,
        clarityFeedback: videoAnalysis.clarityFeedback,
        professionalDemeanorScore: videoAnalysis.professionalDemeanorScore,
        professionalDemeanorFeedback:
          videoAnalysis.professionalDemeanorFeedback,
        proctoringScore: videoAnalysis.proctoringScore,
        proctoringFeedback: videoAnalysis.proctoringFeedback,
        strengths: videoAnalysis.strengths,
        areasForImprovement: videoAnalysis.areasForImprovement,
      },
      create: {
        assessmentId,
        transcriptText: videoAnalysis.transcriptText,
        videoUrl: videoAnalysis.videoUrl,
        highlightsVideoUrl: videoAnalysis.highlightsVideoUrl,
        highlightsInstructions: videoAnalysis.highlightsInstructions,
        overallScore: videoAnalysis.overallScore,
        overallFeedback: videoAnalysis.overallFeedback,
        engagementScore: videoAnalysis.engagementScore,
        engagementFeedback: videoAnalysis.engagementFeedback,
        confidenceScore: videoAnalysis.confidenceScore,
        confidenceFeedback: videoAnalysis.confidenceFeedback,
        clarityScore: videoAnalysis.clarityScore,
        clarityFeedback: videoAnalysis.clarityFeedback,
        professionalDemeanorScore: videoAnalysis.professionalDemeanorScore,
        professionalDemeanorFeedback:
          videoAnalysis.professionalDemeanorFeedback,
        proctoringScore: videoAnalysis.proctoringScore,
        proctoringFeedback: videoAnalysis.proctoringFeedback,
        strengths: videoAnalysis.strengths,
        areasForImprovement: videoAnalysis.areasForImprovement,
      },
    });

    return videoAnalysis;
  }

  /**
   * Helper method to validate and get assessment
   */
  private async getCompleteJobAiAssessment(
    candidateId: string,
    assessmentId: string
  ): Promise<ICandidateJobAiAssessment> {
    const assessment = await this.prisma.job_ai_assessment.findUnique({
      where: {
        id: assessmentId,
        candidateId,
      },
      include: {
        sections: {
          include: {
            questions: {
              orderBy: {
                order: 'asc',
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
        task: true,
        progressState: true,
        videoAnalysis: true,
        proctoring: true,
        jobAiAssessmentSettings: true,
      },
    });

    if (!assessment) {
      throw new AppError(
        'Job Ai assessment not found',
        404,
        ErrorCode.JOB_AI_ASSESSMENT_NOT_FOUND
      );
    }

    return toCandidateJobAiAssessmentDomain(assessment);
  }

  /**
   * Get the complete job ai assessment task
   */
  private async getCompleteJobAiAssessmentTask(
    assessmentId: string
  ): Promise<ICandidateJobAiAssessmentTask> {
    logger.info({
      message: 'Getting complete job ai assessment task',
      context: 'JobAiAssessmentService.getCompleteJobAiAssessmentTask',
      assessmentId,
    });
    const task = await this.prisma.job_ai_assessment_task.findUnique({
      where: {
        assessmentId,
      },
      include: {
        assessment: {
          include: {
            sections: {
              include: {
                questions: {
                  orderBy: {
                    order: 'asc',
                  },
                },
              },
              orderBy: {
                order: 'asc',
              },
            },
            progressState: true,
            videoAnalysis: true,
            proctoring: true,
            jobAiAssessmentSettings: true,
          },
        },
      },
    });

    if (!task) {
      throw new AppError(
        'Job Ai assessment task not found',
        404,
        ErrorCode.JOB_AI_ASSESSMENT_TASK_NOT_FOUND
      );
    }

    logger.info({
      message: 'Getting complete job ai assessment task',
      context: 'JobAiAssessmentService.getCompleteJobAiAssessmentTask',
      taskId: task.id,
    });

    return toCandidateJobAiAssessmentTaskDomain(task);
  }

  /**
   * Get the latest job ai assessment for a candidate
   */
  async getLatestJobAiAssessment(
    candidateId: string
  ): Promise<ICandidateJobAiAssessment | null> {
    try {
      logger.info({
        message: 'Getting latest job ai assessment',
        context: 'JobAiAssessmentService.getLatestJobAiAssessment',
        candidateId,
      });

      const assessment = await this.prisma.job_ai_assessment.findFirst({
        where: {
          candidateId,
        },
        include: {
          sections: {
            include: {
              questions: {
                orderBy: {
                  order: 'asc',
                },
              },
            },
            orderBy: {
              order: 'asc',
            },
          },
          task: true,
          progressState: true,
          videoAnalysis: true,
          proctoring: true,
          jobAiAssessmentSettings: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      });

      if (!assessment) {
        logger.warn({
          message: 'No job ai assessment found for candidate',
          context: 'JobAiAssessmentService.getLatestJobAiAssessment',
          candidateId,
        });
        return null;
      }

      const assessmentDomain = toCandidateJobAiAssessmentDomain(assessment);

      if (assessmentDomain.videoAnalysis?.videoUrl) {
        // Get the presigned URL for the video

        const presignedUrl = await this.storageProvider.generatePreSignedUrl(
          assessmentDomain.videoAnalysis?.videoUrl,
          'read'
        );
        logger.info({
          message: 'Got presigned URL for video',
          context: 'JobAiAssessmentService.getLatestJobAiAssessment',
          assessmentId: assessment.id,
          videoUrl: assessmentDomain.videoAnalysis.videoUrl,
          presignedUrl,
        });
        assessmentDomain.videoAnalysis.videoUrl = presignedUrl;
        if (assessmentDomain.videoAnalysis.highlightsVideoUrl) {
          const presignedUrl = await this.storageProvider.generatePreSignedUrl(
            assessmentDomain.videoAnalysis.highlightsVideoUrl,
            'read'
          );
          assessmentDomain.videoAnalysis.highlightsVideoUrl = presignedUrl;
        }
      }

      return assessmentDomain;
    } catch (error) {
      logger.error({
        message: 'Failed to get latest job ai assessment',
        context: 'JobAiAssessmentService.getLatestJobAiAssessment',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
      });
      throw error;
    }
  }

  async listJobAiAssessmentInterviews(
    candidateId: string,
    filter: ICandidateJobAiAssessmentInterviewsFilterQuery,
    paginationRequest: IPaginationRequest
  ): Promise<IPaginatedResponse<IJobAiAssessmentInterviewItem>> {
    try {
      // Normalize sortBy field: map 'scheduledTime' to 'createdAt' for database field
      const normalizedPaginationRequest = {
        ...paginationRequest,
        sortBy:
          paginationRequest.sortBy === 'scheduledTime'
            ? 'createdAt'
            : paginationRequest.sortBy,
      };

      // Normalize status filter: ensure it's always an array
      // Express parses single query param as string, multiple as array
      const normalizedFilter = {
        ...filter,
        status: filter?.status
          ? Array.isArray(filter.status)
            ? filter.status
            : [filter.status]
          : undefined,
      };

      const queryConditions = buildQueryConditions(
        normalizedFilter,
        normalizedPaginationRequest,
        {
          filter: this.interviewFilterConfig,
          sort: this.interviewSortConfig,
        }
      );

      // Build base where clause with required filters
      const baseWhere: any = {
        candidateId,
        // Only apply default status exclusion if no status filter is provided
        // OR if the status filter doesn't include the excluded statuses
        // If status filter includes PENDING, DECLINED, or EXPIRED, don't apply exclusion
        ...(() => {
          const excludedStatuses = [
            JobAiAssessmentInviteStatusEnum.PENDING,
            JobAiAssessmentInviteStatusEnum.DECLINED,
            JobAiAssessmentInviteStatusEnum.EXPIRED,
          ];

          // Use normalized filter status (already normalized to array)
          const statusArray = normalizedFilter?.status || [];

          // If status filter is provided, let queryConditions handle it - don't add exclusion here
          // The queryConditions.where will override baseWhere.status anyway
          if (statusArray.length > 0) {
            // Status filter provided - don't apply exclusion, let queryConditions handle filtering
            return {};
          }

          // No status filter provided, apply default exclusion
          return {
            status: {
              notIn: excludedStatuses,
            },
          };
        })(),
        // Exclude invitations where the related job application was declined
        jobApplication: {
          declinedAt: null,
          status: {
            not: 'DECLINED',
          },
        },
      };

      // First, update any expired invitations in the database
      await this.updateExpiredInvitations(candidateId);

      if (paginationRequest?.search?.trim()) {
        const search = paginationRequest.search.trim();
        baseWhere.OR = [
          {
            jobApplication: {
              jobPosting: {
                OR: [
                  { title: { contains: search, mode: 'insensitive' } },
                  {
                    client: {
                      company: {
                        name: { contains: search, mode: 'insensitive' },
                      },
                    },
                  },
                ],
              },
            },
          },
        ];
      }

      // Get all interviews
      const interviews =
        await this.prisma.job_ai_assessment_invitation.findMany({
          where: {
            ...baseWhere,
            ...queryConditions.where,
          },
          include: {
            candidate: { include: { user: true } },
            jobApplication: {
              include: {
                jobPosting: {
                  include: {
                    client: { include: { company: true } },
                  },
                },
              },
            },
            jobAiAssessment: true,
          },
          skip: queryConditions.skip,
          take: queryConditions.take,
          orderBy: queryConditions.orderBy,
        });

      // Format interviews using database status (now consistent)
      const formattedInterviews = interviews.map((invitation) => ({
        id: invitation.id,
        candidateName: invitation.candidate.user.name,
        candidateEmail: invitation.candidate.user.email,
        companyName: invitation.jobApplication.jobPosting.client.company.name,
        jobTitle: invitation.jobApplication.jobPosting.title,
        status: invitation.jobAiAssessment?.status || invitation.status,
        assessmentStatus: invitation.jobAiAssessment?.status || null,
        assessmentId: invitation.jobAiAssessment?.id || null,
        createdAt: invitation.createdAt,
        // Include job application acceptance/decline info for frontend logic
        jobApplicationAcceptedAt: invitation.jobApplication.acceptedAt,
        jobApplicationDeclinedAt: invitation.jobApplication.declinedAt,
        jobApplicationStatus: invitation.jobApplication.status,
      }));

      const page = paginationRequest?.page || 1;
      const limit = paginationRequest?.limit || 10;
      const totalPages = Math.ceil(formattedInterviews.length / limit);

      return {
        items: formattedInterviews,
        pagination: {
          totalPages,
          total: formattedInterviews.length,
          page,
          limit,
        },
      };
    } catch (error) {
      logger.error({
        message: 'Failed to list job AI assessment interviews',
        context: 'JobAiAssessmentService.listJobAiAssessmentInterviews',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        filter,
        paginationRequest,
      });

      return {
        items: [],
        pagination: { total: 0, page: 0, limit: 0, totalPages: 0 },
      };
    }
  }

  /**
   * Process failed assessments by retrying them with the same background process
   */
  async processFailedAssessment(): Promise<void> {
    try {
      logger.info({
        message: 'Processing failed assessments',
        context: 'JobAiAssessmentService.processFailedAssessment',
      });

      // Find all failed assessments
      const failedAssessments = await this.prisma.job_ai_assessment.findMany({
        where: {
          status: JobAiAssessmentStatusEnum.ASSESSMENT_FAILED,
        },
        include: {
          task: true,
          candidate: true,
        },
      });

      logger.info({
        message: `Found ${failedAssessments.length} failed assessments to retry`,
        context: 'JobAiAssessmentService.processFailedAssessment',
        count: failedAssessments.length,
      });

      // Process each failed assessment
      for (const failedAssessment of failedAssessments) {
        try {
          logger.info({
            message: 'Retrying failed assessment',
            context: 'JobAiAssessmentService.processFailedAssessment',
            assessmentId: failedAssessment.id,
            candidateId: failedAssessment.candidateId,
          });

          // Reset assessment status to allow retry
          await this.prisma.job_ai_assessment.update({
            where: { id: failedAssessment.id },
            data: {
              status: JobAiAssessmentStatusEnum.CANDIDATE_ASSESSMENT_COMPLETED,
            },
          });

          // Reset task status if it exists
          if (failedAssessment.task) {
            await this.prisma.job_ai_assessment_task.update({
              where: { id: failedAssessment.task.id },
              data: {
                status: JobAiAssessmentTaskStatusEnum.ASSESSMENT_STARTED,
              },
            });
          }

          // Run the same background process as submitAssessment
          await this.jobAiAssessmentProcessor.addSubmitJob(failedAssessment.id);
        } catch (error) {
          logger.error({
            message: 'Failed to process individual failed assessment',
            context: 'JobAiAssessmentService.processFailedAssessment',
            error: error instanceof Error ? error.message : 'Unknown error',
            assessmentId: failedAssessment.id,
            candidateId: failedAssessment.candidateId,
          });
        }
      }

      logger.info({
        message: 'Completed processing failed assessments',
        context: 'JobAiAssessmentService.processFailedAssessment',
        processedCount: failedAssessments.length,
      });
    } catch (error) {
      logger.error({
        message: 'Failed to process failed assessments',
        context: 'JobAiAssessmentService.processFailedAssessment',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Re-submit an assessment
   */
  async reSubmitAssessment(
    assessmentId: string
  ): Promise<ICandidateJobAiAssessment> {
    try {
      logger.info({
        message: 'Re-submitting assessment for video analysis',
        context: 'JobAiAssessmentService.reSubmitAssessment',
        assessmentId,
      });

      const assessment =
        await this.getCompleteJobAiAssessmentByAssessmentId(assessmentId);

      if (!assessment) {
        throw new AppError(
          'Assessment not found',
          404,
          ErrorCode.JOB_AI_ASSESSMENT_NOT_FOUND
        );
      }

      if (!assessment.task) {
        throw new AppError(
          'Assessment task not found',
          404,
          ErrorCode.JOB_AI_ASSESSMENT_TASK_NOT_FOUND
        );
      }

      // Delete old video analysis if exists
      if (assessment.videoAnalysis) {
        logger.info({
          message: 'Deleting old video analysis before resubmit',
          context: 'JobAiAssessmentService.reSubmitAssessment',
          assessmentId,
        });

        await this.prisma.job_ai_assessment_video_analysis.deleteMany({
          where: { assessmentId: assessmentId },
        });
      }

      // Reset assessment status
      await this.prisma.job_ai_assessment.update({
        where: { id: assessmentId },
        data: {
          status: JobAiAssessmentStatusEnum.CANDIDATE_ASSESSMENT_COMPLETED,
          videoAnalysisStatus:
            JobAiAssessmentVideoAnalysisStatusEnum.NOT_STARTED,
        },
      });

      // Reset task status to trigger video analysis
      await this.prisma.job_ai_assessment_task.update({
        where: { id: assessment.task.id },
        data: {
          status: JobAiAssessmentTaskStatusEnum.ASSESSMENT_STARTED,
        },
      });

      // Restart the background process for AI review
      // Note: The background processor will handle task recreation in Redis if needed
      await this.jobAiAssessmentProcessor.addSubmitJob(assessmentId);

      // Get the updated assessment
      const updatedAssessment =
        await this.getCompleteJobAiAssessmentByAssessmentId(assessmentId);

      logger.info({
        message: 'Assessment re-submitted successfully',
        context: 'JobAiAssessmentService.reSubmitAssessment',
        assessmentId,
        newStatus: updatedAssessment.status,
        videoAnalysisStatus: updatedAssessment.videoAnalysisStatus,
      });

      return updatedAssessment;
    } catch (error) {
      logger.error({
        message: 'Failed to re-submit assessment',
        context: 'JobAiAssessmentService.reSubmitAssessment',
        error: error instanceof Error ? error.message : 'Unknown error',
        assessmentId,
      });
      throw error;
    }
  }

  /**
   * Start background process initialize task
   */
  async startBackgroundProcessInitializeTask(assessmentId: string) {
    const assessment =
      await this.getCompleteJobAiAssessmentByAssessmentId(assessmentId);
    if (!assessment.task) {
      throw new AppError(
        'Assessment task not found',
        404,
        ErrorCode.JOB_AI_ASSESSMENT_TASK_NOT_FOUND
      );
    }
    logger.info({
      message: 'Starting background process initialize task',
      context: 'JobAiAssessmentService.startBackgroundProcessInitializeTask',
      assessmentId,
    });
    await this.backgroundProcessInitializeTask(assessment);
  }

  /**
   * Start background process submit task
   */
  async startBackgroundProcessSubmitTask(assessmentId: string): Promise<void> {
    const assessment =
      await this.getCompleteJobAiAssessmentByAssessmentId(assessmentId);
    if (!assessment.task) {
      throw new AppError(
        'Assessment task not found',
        404,
        ErrorCode.JOB_AI_ASSESSMENT_TASK_NOT_FOUND
      );
    }
    logger.info({
      message: 'Starting background process submit task',
      context: 'JobAiAssessmentService.startBackgroundProcessSubmitTask',
      assessmentId,
    });
    await this.backgroundProcessSubmitTask(assessment);
  }

  /**
   * Helper method to get assessment by assessment ID only
   */
  private async getCompleteJobAiAssessmentByAssessmentId(
    assessmentId: string
  ): Promise<ICandidateJobAiAssessment> {
    const assessment = await this.prisma.job_ai_assessment.findUnique({
      where: {
        id: assessmentId,
      },
      include: {
        sections: {
          include: {
            questions: {
              orderBy: {
                order: 'asc',
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
        task: true,
        progressState: true,
        videoAnalysis: true,
        proctoring: true,
        jobAiAssessmentSettings: true,
      },
    });

    if (!assessment) {
      throw new AppError(
        'Job Ai assessment not found',
        404,
        ErrorCode.JOB_AI_ASSESSMENT_NOT_FOUND
      );
    }

    return toCandidateJobAiAssessmentDomain(assessment);
  }

  async getJobAiAssessmentInvitationUrl(invitationId: string): Promise<string> {
    const invitation =
      await this.prisma.job_ai_assessment_invitation.findUnique({
        where: { id: invitationId },
        include: {
          candidate: {
            include: {
              user: true,
            },
          },
          jobApplication: true,
          jobAiAssessment: true,
        },
      });

    if (!invitation) {
      throw new AppError(
        'Job ai assessment invitation not found',
        404,
        ErrorCode.NOT_FOUND
      );
    }

    // Check if the invitation has expired

    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      if (invitation.jobAiAssessment) {
        const assessmentStatus = invitation.jobAiAssessment.status;
        const allowedStatuses = [
          JobAiAssessmentStatusEnum.AI_INITIALIZATION_IN_PROGRESS,
          JobAiAssessmentStatusEnum.AI_INITIALIZATION_COMPLETED,
          JobAiAssessmentStatusEnum.CANDIDATE_ASSESSMENT_IN_PROGRESS,
          JobAiAssessmentStatusEnum.CANDIDATE_ASSESSMENT_COMPLETED,
          JobAiAssessmentStatusEnum.AI_REVIEW_IN_PROGRESS,
          JobAiAssessmentStatusEnum.AI_REVIEW_COMPLETED,
        ];

        if (
          !allowedStatuses.includes(
            assessmentStatus as JobAiAssessmentStatusEnum
          )
        ) {
          throw new AppError(
            'Assessment invitation has expired',
            410,
            ErrorCode.ASSESSMENT_INVITATION_EXPIRED
          );
        }
        // Assessment is in progress/started, allow continued access
        logger.info({
          message:
            'Allowing access to expired invitation because assessment is in progress',
          context: 'JobAiAssessmentService.getJobAiAssessmentInvitationUrl',
          invitationId,
          assessmentStatus,
          expiresAt: invitation.expiresAt,
        });
      } else {
        // No assessment started yet, so enforce expiration
        throw new AppError(
          'Assessment invitation has expired',
          410,
          ErrorCode.ASSESSMENT_INVITATION_EXPIRED
        );
      }
    }

    // Check if the candidate has accepted the assessment invite
    if (!invitation.jobApplication.acceptedAt) {
      throw new AppError(
        'Please accept the Application invite before accessing the assessment, ',
        403,
        ErrorCode.FORBIDDEN
      );
    }

    // Check if the candidate has completed the Resume Assessment
    if (
      invitation.candidate.resumeAssessmentStatus !==
      CandidateResumeAssessmentStatusEnum.ASSESSMENT_COMPLETED
    ) {
      throw new AppError(
        'Please complete your Resume Assessment first.',
        403,
        ErrorCode.FORBIDDEN
      );
    }

    const authUser = toIAuthUser(invitation.candidate.user);
    const authToken = getAuthToken(authUser);

    const invitationUrl = `${ENV.FRONTEND_URL}/app/candidate/assessments/ai/check?id=${invitation.id}&token=${authToken.accessToken}`;

    return invitationUrl;
  }

  /**
   * Check if an assessment invitation has expired (real-time check)
   */
  private isInvitationExpired(invitation: {
    expiresAt: Date | null;
    status: string;
  }): boolean {
    // Check if invitation has expired based on expiresAt date, regardless of current status
    return !!(invitation.expiresAt && invitation.expiresAt < new Date());
  }

  /**
   * Update expired invitations in the database
   */
  private async updateExpiredInvitations(candidateId: string): Promise<void> {
    try {
      const now = new Date();

      // Update all invitations that have expired but still have PENDING status
      const updateResult =
        await this.prisma.job_ai_assessment_invitation.updateMany({
          where: {
            candidateId,
            status: { in: ['PENDING', 'ACCEPTED'] },
            expiresAt: {
              lt: now,
            },
          },
          data: {
            status: 'EXPIRED',
          },
        });

      if (updateResult.count > 0) {
        logger.info({
          message: 'Updated expired invitations',
          context: 'JobAiAssessmentService.updateExpiredInvitations',
          candidateId,
          updatedCount: updateResult.count,
        });
      }
    } catch (error) {
      logger.error({
        message: 'Failed to update expired invitations',
        context: 'JobAiAssessmentService.updateExpiredInvitations',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
      });
      // Don't throw error - this shouldn't break the main flow
    }
  }

  /**
   * Get real-time status for an invitation (accounts for expiry)
   */
  private getRealTimeInvitationStatus(invitation: {
    expiresAt: Date | null;
    status: string;
  }): string {
    return this.isInvitationExpired(invitation) ? 'EXPIRED' : invitation.status;
  }

  /**
   * Check if an assessment invitation has expired
   */
  async checkAssessmentInvitationExpiry(
    invitationId: string
  ): Promise<boolean> {
    try {
      const invitation =
        await this.prisma.job_ai_assessment_invitation.findUnique({
          where: { id: invitationId },
          select: { expiresAt: true, status: true },
        });

      if (!invitation) {
        return false;
      }

      return this.isInvitationExpired(invitation);
    } catch (error) {
      logger.error({
        message: 'Failed to check assessment invitation expiry',
        context: 'JobAiAssessmentService.checkAssessmentInvitationExpiry',
        error: error instanceof Error ? error.message : 'Unknown error',
        invitationId,
      });
      return false;
    }
  }

  /**
   * Manually expire an assessment invitation
   */
  async expireAssessmentInvitation(invitationId: string): Promise<void> {
    try {
      await this.prisma.job_ai_assessment_invitation.update({
        where: { id: invitationId },
        data: {
          status: 'EXPIRED',
          updatedAt: new Date(),
        },
      });

      logger.info({
        message: 'Manually expired assessment invitation',
        context: 'JobAiAssessmentService.expireAssessmentInvitation',
        invitationId,
      });
    } catch (error) {
      logger.error({
        message: 'Failed to manually expire assessment invitation',
        context: 'JobAiAssessmentService.expireAssessmentInvitation',
        error: error instanceof Error ? error.message : 'Unknown error',
        invitationId,
      });
      throw error;
    }
  }

  /**
   * Check if candidate has completed onboarding assessment
   */
  async hasCompletedOnboarding(candidateId: string): Promise<boolean> {
    try {
      const candidate = await this.prisma.candidate.findUnique({
        where: { id: candidateId },
        select: {
          onboardingAssessmentStatus: true,
        },
      });

      const hasCompleted =
        candidate?.onboardingAssessmentStatus === 'ASSESSMENT_COMPLETED';

      logger.info({
        message: 'Checked onboarding completion status',
        context: 'JobAiAssessmentService.hasCompletedOnboarding',
        candidateId,
        hasCompleted,
        status: candidate?.onboardingAssessmentStatus,
      });

      return hasCompleted;
    } catch (error) {
      logger.error({
        message: 'Failed to check onboarding completion status',
        context: 'JobAiAssessmentService.hasCompletedOnboarding',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
      });
      return false;
    }
  }

  /**
   * Get candidate's latest completed onboarding assessment
   */
  async getLatestOnboardingAssessment(
    candidateId: string
  ): Promise<any | null> {
    try {
      const assessment = await this.prisma.onboarding_assessment.findFirst({
        where: {
          candidateId,
          status: 'ASSESSMENT_COMPLETED',
        },
        include: {
          sections: {
            include: {
              questions: {
                orderBy: { order: 'asc' },
              },
            },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { completedAt: 'desc' },
      });

      if (!assessment) {
        logger.info({
          message: 'No completed onboarding assessment found',
          context: 'JobAiAssessmentService.getLatestOnboardingAssessment',
          candidateId,
        });
        return null;
      }

      logger.info({
        message: 'Retrieved latest onboarding assessment',
        context: 'JobAiAssessmentService.getLatestOnboardingAssessment',
        candidateId,
        assessmentId: assessment.id,
        score: assessment.score,
        completedAt: assessment.completedAt,
      });

      // Return the assessment data (we'll use it as-is in the provider)
      return assessment;
    } catch (error) {
      logger.error({
        message: 'Failed to get latest onboarding assessment',
        context: 'JobAiAssessmentService.getLatestOnboardingAssessment',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
      });
      return null;
    }
  }

  /**
   * Manually sync GCS chunks with database records
   * Finds chunks in GCS that don't have DB records and creates them
   * Useful for recovering from data inconsistencies
   */
  async syncGcsChunksWithDatabase(
    candidateId: string,
    assessmentId: string,
    options?: {
      triggerAnalysis?: boolean; // Whether to trigger analysis for newly created chunks
      dryRun?: boolean; // If true, only report what would be done without making changes
    }
  ): Promise<{
    totalGcsChunks: number;
    existingDbChunks: number;
    missingDbChunks: number;
    createdChunks: number;
    failedChunks: number;
    chunks: Array<{
      chunkIndex: number;
      fileName: string;
      gcsUri: string;
      fileSize: number;
      status: 'existing' | 'created' | 'failed' | 'skipped';
      error?: string;
    }>;
  }> {
    try {
      logger.info({
        message: 'Starting GCS chunks sync with database',
        context: 'JobAiAssessmentService.syncGcsChunksWithDatabase',
        candidateId,
        assessmentId,
        options,
      });

      // Verify assessment exists
      const assessment = await this.prisma.job_ai_assessment.findUnique({
        where: { id: assessmentId, candidateId },
        select: { id: true, candidateId: true },
      });

      if (!assessment) {
        throw new AppError(
          'Job AI assessment not found',
          404,
          ErrorCode.JOB_AI_ASSESSMENT_NOT_FOUND
        );
      }

      // Get folder path for assessment videos
      const { folderPath } = getBucketFolderPathToCandidateJobAiAssessmentVideo(
        candidateId,
        assessmentId
      );

      // List all files in GCS folder
      const gcsFiles = await this.storageProvider.listFiles(folderPath, {
        sortBy: 'name',
        sortOrder: 'asc',
      });

      logger.info({
        message: 'Found files in GCS',
        context: 'JobAiAssessmentService.syncGcsChunksWithDatabase',
        assessmentId,
        fileCount: gcsFiles.length,
      });

      const chunkFilesWithIndex = gcsFiles
        .filter(
          (file) => file.name.includes('chunk-') && file.name.endsWith('.webm')
        )
        .map((file) => {
          // Extract filename from path (handle both full paths and just filenames)
          const fileName = file.name.split('/').pop() || file.name;

          // Try new format first: chunk-INDEX-TIMESTAMP.webm
          let chunkIndex: number | null = null;
          const newFormatMatch = fileName.match(/chunk-(\d+)-(\d+)\.webm$/);

          if (newFormatMatch) {
            // New format: chunk-INDEX-TIMESTAMP.webm
            chunkIndex = parseInt(newFormatMatch[1], 10);
          } else {
            // Try old format: chunk-TIMESTAMP.webm
            const oldFormatMatch = fileName.match(/chunk-(\d+)\.webm$/);
            if (oldFormatMatch) {
              chunkIndex = -1;
            }
          }

          return {
            fileName: file.name,
            chunkIndex,
            gcsUri: `gs://${ENV.GCS_BUCKET_NAME}/${file.name}`,
            fileSize: file.size,
            created: file.created,
            isOldFormat: chunkIndex === -1,
          };
        })
        .filter((file) => file.chunkIndex !== null);

      // Get existing DB chunks
      const existingDbChunks =
        await this.prisma.jobAiAssessmentVideoChunkAnalysis.findMany({
          where: { assessmentId },
          select: {
            chunkIndex: true,
            sectionId: true,
            questionId: true,
            gcsUri: true,
          },
        });

      const existingGcsUriMap = new Map(
        existingDbChunks.map((c) => [c.gcsUri, c])
      );

      const maxExistingChunkIndex =
        existingDbChunks.length > 0
          ? Math.max(...existingDbChunks.map((c) => c.chunkIndex))
          : -1;

      const chunkFiles: Array<{
        fileName: string;
        chunkIndex: number;
        gcsUri: string;
        fileSize: number;
        created: Date;
        isExisting: boolean;
      }> = [];

      // Track next index for truly missing old format files
      let nextSequentialIndex = maxExistingChunkIndex + 1;

      // Process new format files first (they have index in filename)
      const newFormatFiles = chunkFilesWithIndex.filter((f) => !f.isOldFormat);
      for (const file of newFormatFiles) {
        const existingChunk = existingGcsUriMap.get(file.gcsUri);
        chunkFiles.push({
          fileName: file.fileName,
          chunkIndex: existingChunk
            ? existingChunk.chunkIndex
            : file.chunkIndex!,
          gcsUri: file.gcsUri,
          fileSize: file.fileSize,
          created: file.created,
          isExisting: !!existingChunk,
        });
      }

      const oldFormatFiles = chunkFilesWithIndex.filter((f) => f.isOldFormat);

      oldFormatFiles.sort((a, b) => {
        const fileNameA = a.fileName.split('/').pop() || a.fileName;
        const fileNameB = b.fileName.split('/').pop() || b.fileName;
        const timestampA = parseInt(
          fileNameA.match(/chunk-(\d+)\.webm$/)?.[1] || '0',
          10
        );
        const timestampB = parseInt(
          fileNameB.match(/chunk-(\d+)\.webm$/)?.[1] || '0',
          10
        );
        return timestampA - timestampB;
      });

      for (const file of oldFormatFiles) {
        const existingChunk = existingGcsUriMap.get(file.gcsUri);
        if (existingChunk) {
          // File exists in DB - use DB's chunkIndex
          chunkFiles.push({
            fileName: file.fileName,
            chunkIndex: existingChunk.chunkIndex,
            gcsUri: file.gcsUri,
            fileSize: file.fileSize,
            created: file.created,
            isExisting: true,
          });
        } else {
          // File is truly missing - assign new sequential index
          chunkFiles.push({
            fileName: file.fileName,
            chunkIndex: nextSequentialIndex,
            gcsUri: file.gcsUri,
            fileSize: file.fileSize,
            created: file.created,
            isExisting: false,
          });
          nextSequentialIndex++;
        }
      }

      // Find missing chunks (those not in DB)
      const missingChunks = chunkFiles.filter((file) => !file.isExisting);

      logger.info({
        message: 'Chunk sync analysis',
        context: 'JobAiAssessmentService.syncGcsChunksWithDatabase',
        assessmentId,
        totalGcsChunks: chunkFiles.length,
        existingDbChunks: existingDbChunks.length,
        missingChunks: missingChunks.length,
      });

      const results: Array<{
        chunkIndex: number;
        fileName: string;
        gcsUri: string;
        fileSize: number;
        status: 'existing' | 'created' | 'failed' | 'skipped';
        error?: string;
      }> = [];

      let createdCount = 0;
      let failedCount = 0;

      // Process missing chunks
      for (const chunkFile of missingChunks) {
        try {
          if (options?.dryRun) {
            results.push({
              chunkIndex: chunkFile.chunkIndex,
              fileName: chunkFile.fileName,
              gcsUri: chunkFile.gcsUri,
              fileSize: chunkFile.fileSize,
              status: 'skipped',
            });
            continue;
          }

          let sectionId: string | null = null;
          let questionId: string | null = null;

          // Find closest existing chunk to infer section/question
          const closestChunk = existingDbChunks
            .filter((c) => c.chunkIndex < chunkFile.chunkIndex)
            .sort((a, b) => b.chunkIndex - a.chunkIndex)[0];

          if (closestChunk) {
            sectionId = closestChunk.sectionId;
            questionId = closestChunk.questionId;
          }

          // Create DB record
          await this.prisma.jobAiAssessmentVideoChunkAnalysis.create({
            data: {
              assessmentId,
              chunkIndex: chunkFile.chunkIndex,
              gcsUri: chunkFile.gcsUri,
              sectionId,
              questionId,
              isRelevant: !!questionId, // Only relevant if has questionId
              status: questionId ? 'uploaded' : 'skipped',
              attemptNumber: 1,
            },
          });

          createdCount++;
          results.push({
            chunkIndex: chunkFile.chunkIndex,
            fileName: chunkFile.fileName,
            gcsUri: chunkFile.gcsUri,
            fileSize: chunkFile.fileSize,
            status: 'created',
          });

          // Trigger analysis if requested and chunk is relevant
          if (options?.triggerAnalysis && questionId) {
            this.analyzeChunkAsync(
              assessmentId,
              chunkFile.chunkIndex,
              chunkFile.gcsUri
            ).catch((error) => {
              logger.error({
                message: 'Failed to trigger analysis for synced chunk',
                context: 'JobAiAssessmentService.syncGcsChunksWithDatabase',
                error: error instanceof Error ? error.message : 'Unknown error',
                assessmentId,
                chunkIndex: chunkFile.chunkIndex,
              });
            });
          }
        } catch (error) {
          failedCount++;
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          results.push({
            chunkIndex: chunkFile.chunkIndex,
            fileName: chunkFile.fileName,
            gcsUri: chunkFile.gcsUri,
            fileSize: chunkFile.fileSize,
            status: 'failed',
            error: errorMessage,
          });

          logger.error({
            message: 'Failed to create DB record for GCS chunk',
            context: 'JobAiAssessmentService.syncGcsChunksWithDatabase',
            error: errorMessage,
            assessmentId,
            chunkIndex: chunkFile.chunkIndex,
            fileName: chunkFile.fileName,
          });
        }
      }

      // Add existing chunks to results
      for (const chunkFile of chunkFiles) {
        if (chunkFile.isExisting) {
          results.push({
            chunkIndex: chunkFile.chunkIndex,
            fileName: chunkFile.fileName,
            gcsUri: chunkFile.gcsUri,
            fileSize: chunkFile.fileSize,
            status: 'existing',
          });
        }
      }

      // Sort results by chunkIndex
      results.sort((a, b) => a.chunkIndex - b.chunkIndex);

      logger.info({
        message: 'GCS chunks sync completed',
        context: 'JobAiAssessmentService.syncGcsChunksWithDatabase',
        assessmentId,
        totalGcsChunks: chunkFiles.length,
        existingDbChunks: existingDbChunks.length,
        missingDbChunks: missingChunks.length,
        createdChunks: createdCount,
        failedChunks: failedCount,
      });

      return {
        totalGcsChunks: chunkFiles.length,
        existingDbChunks: existingDbChunks.length,
        missingDbChunks: missingChunks.length,
        createdChunks: createdCount,
        failedChunks: failedCount,
        chunks: results,
      };
    } catch (error) {
      logger.error({
        message: 'Failed to sync GCS chunks with database',
        context: 'JobAiAssessmentService.syncGcsChunksWithDatabase',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        assessmentId,
      });
      throw error;
    }
  }

  /**
   * Extract plain text from MCP interview resume file
   * Uses Vertex AI to extract text from PDF/DOCX files
   */
  private async extractTextFromMcpResumeFile(
    resumeFileUrl: string
  ): Promise<string> {
    try {
      // Download the file from storage
      const fileBuffer = await this.storageProvider.downloadFile(resumeFileUrl);

      // Detect MIME type
      const mimeType = this.detectMimeType(resumeFileUrl, fileBuffer);

      // If it's a text file, return the content directly
      if (mimeType === 'text/plain') {
        return fileBuffer.toString('utf-8');
      }

      // For PDF/DOCX files, use Vertex AI to extract text
      const vertexAI = gcpConfig.getVertexAI();
      const model = ENV.GOOGLE_CLOUD_VERTEX_AI_MODEL;
      const location = ENV.GOOGLE_CLOUD_VERTEX_AI_LOCATION;
      const projectId = ENV.GOOGLE_CLOUD_PROJECT_ID;

      if (!projectId) {
        throw new Error('GCP Project ID is required for Vertex AI');
      }

      const generativeModel = vertexAI.preview.getGenerativeModel({
        model: `projects/${projectId}/locations/${location}/publishers/google/models/${model}`,
      });

      // Simple prompt to extract text content
      const prompt = `Extract all text content from this resume document. Return only the plain text content, preserving the structure and formatting as much as possible. Do not add any commentary or analysis, just return the text.`;

      const contentParts: any[] = [
        { text: prompt },
        {
          inlineData: {
            mimeType,
            data: fileBuffer.toString('base64'),
          },
        },
      ];

      const result = await generativeModel.generateContent({
        contents: [
          {
            role: 'user',
            parts: contentParts,
          },
        ],
      });

      const extractedText =
        result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!extractedText || extractedText.trim().length === 0) {
        logger.warn({
          message: 'Vertex AI returned empty text from resume file',
          context: 'JobAiAssessmentService.extractTextFromMcpResumeFile',
          resumeFileUrl,
        });
        return '';
      }

      return extractedText.trim();
    } catch (error) {
      logger.error({
        message: 'Failed to extract text from MCP resume file',
        context: 'JobAiAssessmentService.extractTextFromMcpResumeFile',
        resumeFileUrl,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Detect MIME type from file URL and buffer
   */
  private detectMimeType(fileUrl: string, fileBuffer: Buffer): string {
    // Check file extension first
    const url = fileUrl.toLowerCase();
    if (url.includes('.txt') || url.includes('.text')) {
      return 'text/plain';
    }
    if (url.includes('.pdf')) {
      return 'application/pdf';
    }
    if (url.includes('.doc') && !url.includes('.docx')) {
      return 'application/msword';
    }
    if (url.includes('.docx')) {
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }

    // Check file content magic bytes
    const header = fileBuffer.subarray(0, 4);

    // PDF magic bytes: %PDF
    if (
      header[0] === 0x25 &&
      header[1] === 0x50 &&
      header[2] === 0x44 &&
      header[3] === 0x46
    ) {
      return 'application/pdf';
    }

    // Check if it's likely text content (all printable ASCII)
    const textSample = fileBuffer.subarray(0, Math.min(100, fileBuffer.length));
    let isProbablyText = true;
    for (let i = 0; i < textSample.length; i++) {
      const byte = textSample[i];
      // Allow printable ASCII chars (32-126) and common whitespace (9, 10, 13)
      if (!(byte >= 32 && byte <= 126) && ![9, 10, 13].includes(byte)) {
        isProbablyText = false;
        break;
      }
    }

    if (isProbablyText) {
      return 'text/plain';
    }

    // Default to PDF if uncertain
    return 'application/pdf';
  }
}
