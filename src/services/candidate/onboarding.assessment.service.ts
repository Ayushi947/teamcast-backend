import { onboarding_assessment_status, PrismaClient } from '@prisma/client';
import { singleton } from '@/shared/decorators/singleton';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';
import { ICandidateOnboardingAssessmentFilterQuery } from '@/shared/models/api/candidate/onboarding.assessment.api';
import {
  IPaginatedResponse,
  IPaginationRequest,
} from '@/shared/models/api/common/common.api';
import { getPaginationInfo } from '@/utils/pagination';
import {
  ICandidateOnboardingAssessment,
  toCandidateOnboardingAssessmentDomain,
  ICandidateOnboardingAssessmentTask,
  toCandidateOnboardingAssessmentTaskDomain,
  ICandidateOnboardingAssessmentAnswerSubmitted,
  toCandidateOnboardingAssessmentQuestionDomain,
  ICandidateOnboardingAssessmentProctoring,
  toCandidateOnboardingAssessmentProctoringDomain,
  ICandidateOnboardingAssessmentPresignedUrl,
  ICandidateOnboardingAssessmentVideoAnalysis,
} from '@/shared/models/domain/candidate/onboarding.assessment.domain';
import {
  OnboardingAssessmentResultEnum,
  OnboardingAssessmentStatusEnum,
  OnboardingAssessmentTaskStatusEnum,
  CandidateAssessmentStageEnum,
  OnboardingAssessmentSectionStatusEnum,
  CandidateOnboardingAssessmentStatusEnum,
  JobAiAssessmentVideoAnalysisStatusEnum,
  AssessmentTerminationReasonEnum,
} from '@/shared/models/common/enums';
import { IOnboardingAssessmentProvider } from '../helpers/ai.onboarding.assessment/onboarding.assessment.provider';
import { generateResumeText } from '@/utils/resume';
import {
  getBucketFolderPathToCandidateOnboardingAssessmentQuestionAudio,
  getBucketFolderPathToCandidateOnboardingAssessmentVideo,
} from '@/utils/presigned.urls';
import { extractVideoDurationFromStorage } from '@/utils/video.helper';
import { IStorageProvider } from '../helpers/storage/storage.interface';
import { OnboardingAssessmentProcessor } from '../queue/processors/onboarding.assessment.processor';
import { OnboardingAssessmentVideoAnalysisProcessor } from '../queue/processors/onboarding.assessment.video.analysis.processor';
import { JobAiAssessmentVideoAnalysisProcessor } from '../queue/processors/job.ai.assessment.video.analysis.processor';
import { ENV } from '@/config/env';
import { CandidateRecommendationCronService } from '../cron/candidate.recommendation.cron.service';
import { RedisLiveKitCommunicationService } from '../livekit/redis.communication.service';
import { LiveKitService } from '../livekit/livekit.service';
import { JobAiAssessmentFactory } from '../helpers/job.ai.assessment/job.ai.assessment.factory';
import { JobAiAssessmentService } from './job.ai.assessment.service';

@singleton
export class OnboardingAssessmentService {
  private readonly prisma: PrismaClient;
  private readonly onboardingAssessmentProcessor: OnboardingAssessmentProcessor;
  private readonly onboardingAssessmentVideoAnalysisProcessor: OnboardingAssessmentVideoAnalysisProcessor;
  private readonly candidateRecommendationCronService: CandidateRecommendationCronService;
  private readonly redisLiveKitService: RedisLiveKitCommunicationService;
  private liveKitService?: LiveKitService; // Lazy initialized to avoid circular dependency
  private readonly activeListeners: Set<string> = new Set(); // Track active Redis listeners

  constructor(
    private readonly onboardingAssessmentProvider: IOnboardingAssessmentProvider,
    private readonly storageProvider: IStorageProvider
  ) {
    this.prisma = new PrismaClient();
    this.onboardingAssessmentProcessor = new OnboardingAssessmentProcessor(
      this
    );
    this.onboardingAssessmentVideoAnalysisProcessor =
      new OnboardingAssessmentVideoAnalysisProcessor(
        this,
        this.onboardingAssessmentProvider
      );

    if (ENV.ENABLE_BULLMQ_WORKERS) {
      this.onboardingAssessmentProcessor.setupWorkers();
    }

    this.candidateRecommendationCronService =
      new CandidateRecommendationCronService();

    this.redisLiveKitService = new RedisLiveKitCommunicationService();

    // Setup video analysis workers if enabled (check new flag first, fallback to legacy)
    const workersEnabled =
      ENV.ENABLE_CHUNK_VIDEO_ANALYSIS_WORKERS || ENV.ENABLE_GPU_BULLMQ_WORKERS;
    if (workersEnabled) {
      this.onboardingAssessmentVideoAnalysisProcessor.setupWorkers();
    }

    logger.info('Onboarding assessment service initialized', {
      context: 'OnboardingAssessmentService.constructor',
      videoAnalysisWorkersEnabled: workersEnabled,
    });
  }

  /**
   * Lazy initialization of LiveKitService to avoid circular dependency
   */
  private getLiveKitService(): LiveKitService {
    if (!this.liveKitService) {
      const jobAiAssessmentProvider =
        JobAiAssessmentFactory.getInstance().getProvider();
      const jobAiAssessmentService = new JobAiAssessmentService(
        jobAiAssessmentProvider,
        this.storageProvider
      );
      const jobAiVideoAnalysisProcessor =
        new JobAiAssessmentVideoAnalysisProcessor(
          jobAiAssessmentService,
          jobAiAssessmentProvider
        );

      this.liveKitService = new LiveKitService(
        this.onboardingAssessmentVideoAnalysisProcessor,
        jobAiVideoAnalysisProcessor
      );
    }
    return this.liveKitService;
  }

  /**
   * Get all onboarding assessments for a candidate with pagination and filtering
   */
  async getOnboardingAssessments(
    candidateId: string,
    filter: ICandidateOnboardingAssessmentFilterQuery,
    paginationRequest: IPaginationRequest
  ): Promise<IPaginatedResponse<ICandidateOnboardingAssessment>> {
    try {
      // Get pagination info
      const paginationInfo = getPaginationInfo(paginationRequest);

      // Build where clause based on filters
      const where = {
        candidateId,
        ...(filter.status && {
          status: filter.status as onboarding_assessment_status,
        }),
      };

      const assessments = await this.prisma.onboarding_assessment.findMany({
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
          onboardingAssessmentSettings: true,
        },
      });

      // Get total count for pagination
      const total = await this.prisma.onboarding_assessment.count({
        where,
      });

      return {
        items: assessments.map(toCandidateOnboardingAssessmentDomain),
        pagination: {
          total,
          page: paginationInfo.skip,
          limit: paginationInfo.take,
          totalPages: Math.ceil(total / paginationInfo.take),
        },
      };
    } catch (error) {
      logger.error({
        message: 'Failed to get onboarding assessments',
        context: 'OnboardingAssessmentService.getOnboardingAssessments',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        filter,
        paginationRequest,
      });
      throw error;
    }
  }

  /**
   * Get a specific onboarding assessment
   */
  async getOnboardingAssessment(
    candidateId: string,
    assessmentId: string
  ): Promise<ICandidateOnboardingAssessment> {
    try {
      const assessment = await this.getCompleteOnboardingAssessment(
        candidateId,
        assessmentId
      );

      return toCandidateOnboardingAssessmentDomain(assessment);
    } catch (error) {
      logger.error({
        message: 'Failed to get onboarding assessment',
        context: 'OnboardingAssessmentService.getOnboardingAssessment',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        assessmentId,
      });
      throw error;
    }
  }

  /**
   * Get onboarding assessment initialize task
   */
  async getOnboardingAssessmentTask(
    candidateId: string,
    assessmentId: string
  ): Promise<ICandidateOnboardingAssessmentTask> {
    logger.info({
      message: 'Getting onboarding assessment task',
      context: 'OnboardingAssessmentService.getOnboardingAssessmentTask',
      candidateId,
      assessmentId,
    });
    try {
      logger.info({
        message: 'Getting onboarding assessment',
        context: 'OnboardingAssessmentService.getOnboardingAssessmentTask',
        candidateId,
        assessmentId,
      });
      const assessment = await this.prisma.onboarding_assessment.findUnique({
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
          'Onboarding assessment not found',
          404,
          ErrorCode.AI_ASSESSMENT_NOT_FOUND
        );
      }

      if (!assessment.task) {
        throw new AppError(
          'Onboarding assessment task not found',
          404,
          ErrorCode.AI_ASSESSMENT_NOT_FOUND
        );
      }

      const task = await this.getCompleteOnboardingAssessmentTask(
        assessment.id
      );

      return task;
    } catch (error) {
      logger.error({
        message: 'Failed to get onboarding assessment task',
        context: 'OnboardingAssessmentService.getOnboardingAssessmentTask',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        assessmentId,
      });
      throw error;
    }
  }

  /**
   * Initialize onboarding assessment initialize task
   */
  async initialize(
    candidateId: string
  ): Promise<ICandidateOnboardingAssessmentTask> {
    try {
      logger.info({
        message: 'Initializing onboarding assessment',
        context: 'OnboardingAssessmentService.initialize',
        candidateId,
      });

      const candidate = await this.prisma.candidate.findUnique({
        where: {
          id: candidateId,
        },
        include: {
          resume: true,
          onboardingAssessments: true,
        },
      });

      logger.info({
        message: 'Found candidate',
        context: 'OnboardingAssessmentService.initialize',
        candidateId,
      });

      if (!candidate) {
        throw new AppError(
          'Candidate not found',
          404,
          ErrorCode.CANDIDATE_NOT_FOUND
        );
      }

      if (
        candidate.assessmentStage !==
        CandidateAssessmentStageEnum.ONBOARDING_ASSESSMENT
      ) {
        throw new AppError(
          'Candidate assessment stage is not in onboarding assessment',
          400,
          ErrorCode.CANDIDATE_ASSESSMENT_STAGE_NOT_IN_ASSESSMENT
        );
      }

      if (!candidate.resume) {
        throw new AppError(
          'Candidate resume not found',
          404,
          ErrorCode.RESUME_NOT_FOUND
        );
      }

      // check if the candidate assessment is already initialized and is not completed
      const candidateAssessment =
        await this.prisma.onboarding_assessment.findFirst({
          where: {
            candidateId,
            status: {
              notIn: [
                OnboardingAssessmentStatusEnum.NOT_STARTED,
                OnboardingAssessmentStatusEnum.ASSESSMENT_COMPLETED,
                OnboardingAssessmentStatusEnum.ASSESSMENT_FAILED,
              ],
            },
          },
        });

      // if the candidate assessment is already initialized, return the task
      if (candidateAssessment) {
        logger.info({
          message: 'Returning existing onboarding assessment task',
          context: 'OnboardingAssessmentService.initialize',
          candidateId,
          candidateAssessment,
        });
        return this.getOnboardingAssessmentTask(
          candidateId,
          candidateAssessment.id
        );
      }

      // get the global onboarding assessment settings
      const globalOnboardingAssessmentSettings =
        await this.prisma.global_onboarding_assessment_settings.findFirst();

      if (!globalOnboardingAssessmentSettings) {
        throw new AppError(
          'Global onboarding assessment settings not found',
          404,
          ErrorCode.GLOBAL_ONBOARDING_ASSESSMENT_SETTINGS_NOT_FOUND
        );
      }

      logger.info({
        message: 'Creating new onboarding assessment',
        context: 'OnboardingAssessmentService.initialize',
        candidateId,
      });

      const defaultInterviewLanguage =
        globalOnboardingAssessmentSettings.interviewLanguage || 'ENGLISH';
      const defaultInterviewDialect =
        globalOnboardingAssessmentSettings.interviewDialect || 'en-US';
      const defaultInterviewVoiceGender =
        globalOnboardingAssessmentSettings.interviewVoiceGender || 'female';

      // create the onboarding assessment
      const onboardingAssessment =
        await this.prisma.onboarding_assessment.create({
          data: {
            candidateId,
            status: OnboardingAssessmentStatusEnum.NOT_STARTED,
            result: OnboardingAssessmentResultEnum.NOT_AVAILABLE,
            score: 0,
            startedAt: new Date(),
            completedAt: null,
            automaticallyPublished: false,
            duration:
              globalOnboardingAssessmentSettings.defaultAssessmentDuration,
            onboardingAssessmentSettings: {
              create: {
                globalSettingsId: globalOnboardingAssessmentSettings.id,
                defaultAssessmentDuration:
                  globalOnboardingAssessmentSettings.defaultAssessmentDuration,
                defaultPassingScore:
                  globalOnboardingAssessmentSettings.defaultPassingScore,
                maximumAttempts:
                  globalOnboardingAssessmentSettings.maximumAttempts,
                cooldownPeriod:
                  globalOnboardingAssessmentSettings.cooldownPeriod,
                requiredSections:
                  globalOnboardingAssessmentSettings.requiredSections,
                maxSections: globalOnboardingAssessmentSettings.maxSections,
                maxQuestionsPerSection:
                  globalOnboardingAssessmentSettings.maxQuestionsPerSection,
                proctoringEnabled:
                  globalOnboardingAssessmentSettings.proctoringEnabled,
                maxWarnings: globalOnboardingAssessmentSettings.maxWarnings,
                tabSwitchLimit:
                  globalOnboardingAssessmentSettings.tabSwitchLimit,
                copyPasteAllowed:
                  globalOnboardingAssessmentSettings.copyPasteAllowed,
                videoRecordingEnabled:
                  globalOnboardingAssessmentSettings.videoRecordingEnabled,
                minimumVideoLength:
                  globalOnboardingAssessmentSettings.minimumVideoLength,
                aiVideoAnalysisEnabled:
                  globalOnboardingAssessmentSettings.aiVideoAnalysisEnabled,
                autoPublishOnSuccess:
                  globalOnboardingAssessmentSettings.autoPublishOnSuccess,
                autoNotifyOnComplete:
                  globalOnboardingAssessmentSettings.autoNotifyOnComplete,
                greetingMessage:
                  globalOnboardingAssessmentSettings.greetingMessage,
                sectionTemplates:
                  globalOnboardingAssessmentSettings.sectionTemplates || {},
                questionTemplates:
                  globalOnboardingAssessmentSettings.questionTemplates || {},
                customStyles:
                  globalOnboardingAssessmentSettings.customStyles || {},
                customInstructions:
                  globalOnboardingAssessmentSettings.customInstructions || '',
                interviewLanguage: defaultInterviewLanguage,
                interviewDialect: defaultInterviewDialect,
                interviewVoiceGender: defaultInterviewVoiceGender,
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

      logger.info({
        message: 'Created new onboarding assessment',
        context: 'OnboardingAssessmentService.initialize',
        candidateId,
        onboardingAssessmentId: onboardingAssessment.id,
      });

      // Create new task
      const task = await this.prisma.onboarding_assessment_task.create({
        data: {
          assessmentId: onboardingAssessment.id,
          status: OnboardingAssessmentTaskStatusEnum.PENDING,
        },
      });

      // check if task is not created
      if (!task) {
        throw new AppError(
          'Failed to create onboarding assessment initialize task',
          500,
          ErrorCode.ONBOARDING_ASSESSMENT_INITIALIZE_TASK_NOT_CREATED
        );
      }

      logger.info({
        message: 'Created new onboarding assessment task',
        context: 'OnboardingAssessmentService.initialize',
        candidateId,
        onboardingAssessmentId: onboardingAssessment.id,
        taskId: task.id,
      });

      // generate resume text
      const resumeText = await generateResumeText(
        this.prisma,
        candidate.resume.id
      );

      await this.prisma.onboarding_assessment.update({
        where: { id: onboardingAssessment.id },
        data: {
          resumeText,
        },
      });

      logger.info({
        message: 'Generated resume text',
        context: 'OnboardingAssessmentService.initialize',
        candidateId,
      });

      const completeTask = await this.getCompleteOnboardingAssessmentTask(
        onboardingAssessment.id
      );

      logger.info({
        message: 'Got complete onboarding assessment task, and processing it',
        context: 'OnboardingAssessmentService.initialize',
        candidateId,
        completeTask,
      });

      // Start background process to initialize the assessment
      await this.onboardingAssessmentProcessor.addInitializeJob(
        onboardingAssessment.id
      );

      // update the candidate onboarding assessment status
      await this.prisma.candidate.update({
        where: { id: candidateId },
        data: {
          onboardingAssessmentStatus:
            CandidateOnboardingAssessmentStatusEnum.ASSESSMENT_IN_PROGRESS,
        },
      });

      logger.info({
        message: 'Returned complete onboarding assessment task',
        context: 'OnboardingAssessmentService.initialize',
        candidateId,
        completeTask,
      });

      return completeTask;
    } catch (error) {
      logger.error({
        message: 'Failed to initialize onboarding assessment initialize task',
        context:
          'OnboardingAssessmentService.initializeOnboardingAssessmentInitializeTask',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
      });
      throw error;
    }
  }

  /**
   * Start an onboarding assessment
   */
  async startAssessment(
    candidateId: string,
    assessmentId: string
  ): Promise<ICandidateOnboardingAssessment> {
    try {
      const assessment = await this.getCompleteOnboardingAssessment(
        candidateId,
        assessmentId
      );

      logger.info({
        message: 'Got assessment',
        context: 'OnboardingAssessmentService.startAssessment',
        assessmentId,
      });

      // Check if assessment is in correct state
      if (
        assessment.status !==
        OnboardingAssessmentStatusEnum.AI_INITIALIZATION_COMPLETED
      ) {
        throw new AppError(
          'Assessment is not ready to start',
          400,
          ErrorCode.ASSESSMENT_NOT_READY
        );
      }

      logger.info({
        message: 'Assessment is ready to start',
        context: 'OnboardingAssessmentService.startAssessment',
        assessmentId,
      });

      // Start the assessment
      if (!assessment.task) {
        throw new AppError(
          'Assessment task not found',
          404,
          ErrorCode.ONBOARDING_ASSESSMENT_TASK_NOT_FOUND
        );
      }
      logger.info({
        message: 'Getting first question',
        context: 'OnboardingAssessmentService.startAssessment',
        assessmentId,
      });
      const response = await this.onboardingAssessmentProvider.getNextQuestion(
        assessment.task.id
      );

      logger.info({
        message: 'Got first question',
        context: 'OnboardingAssessmentService.startAssessment',
        assessmentId,
        response,
      });

      const firstQuestion = response.nextQuestion;

      // Save the first question
      const savedFirstQuestion =
        await this.prisma.onboarding_assessment_question.create({
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
        context: 'OnboardingAssessmentService.startAssessment',
        assessmentId,
        savedFirstQuestion,
      });

      // Clean up previous attempt data (in case of restart)
      await this.cleanupPreviousAttempt(assessmentId);

      // Update assessment status
      await this.prisma.onboarding_assessment.update({
        where: { id: assessmentId },
        data: {
          status:
            OnboardingAssessmentStatusEnum.CANDIDATE_ASSESSMENT_IN_PROGRESS,
          startedAt: new Date(),
        },
      });

      // Create or update progress state
      if (assessment.progressState) {
        // Update existing progress state
        await this.prisma.onboarding_assessment_progress.update({
          where: { assessmentId },
          data: {
            currentSectionId: firstQuestion.sectionId,
            currentQuestionId: firstQuestion.id,
            lastSavedAt: new Date(),
            isCompleted: false,
          },
        });
      } else {
        // Create new progress state
        await this.prisma.onboarding_assessment_progress.create({
          data: {
            assessmentId,
            currentSectionId: firstQuestion.sectionId,
            currentQuestionId: firstQuestion.id,
            lastSavedAt: new Date(),
            isCompleted: false,
          },
        });
      }

      logger.info({
        message: 'Updated assessment status',
        context: 'OnboardingAssessmentService.startAssessment',
        assessmentId,
      });

      // Get the updated assessment
      const updatedAssessment = await this.getCompleteOnboardingAssessment(
        candidateId,
        assessmentId
      );

      logger.info({
        message: 'Returned assessment',
        context: 'OnboardingAssessmentService.startAssessment',
        assessmentId,
      });

      return toCandidateOnboardingAssessmentDomain(updatedAssessment);
    } catch (error) {
      logger.error({
        message: 'Failed to start assessment',
        context: 'OnboardingAssessmentService.startAssessment',
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
  ): Promise<ICandidateOnboardingAssessmentAnswerSubmitted> {
    try {
      logger.info({
        message: 'Submitting answer',
        context: 'OnboardingAssessmentService.submitAnswer',
        candidateId,
        assessmentId,
        questionId,
        answerGiven,
      });

      // Check if the question is answered already
      const question =
        await this.prisma.onboarding_assessment_question.findUnique({
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
          ErrorCode.ONBOARDING_ASSESSMENT_QUESTION_ALREADY_ANSWERED
        );
      }

      // TODO: Authorize the candidate
      // Save the answer
      await this.prisma.onboarding_assessment_question.update({
        where: { id: questionId },
        data: {
          answerGiven,
          isAnswered: true,
        },
      });

      const assessment = await this.getCompleteOnboardingAssessment(
        candidateId,
        assessmentId
      );

      if (!assessment.task) {
        throw new AppError(
          'Assessment task not found',
          404,
          ErrorCode.ONBOARDING_ASSESSMENT_TASK_NOT_FOUND
        );
      }

      // Check if assessment is in progress
      if (
        assessment.status !==
        OnboardingAssessmentStatusEnum.CANDIDATE_ASSESSMENT_IN_PROGRESS
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
        context: 'OnboardingAssessmentService.submitAnswer',
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
          ErrorCode.ONBOARDING_ASSESSMENT_SECTION_NOT_FOUND
        );
      }

      const numberOfQuestionsInSection = currentSectionData.questions.length;
      const maxQuestionsPerSection =
        assessment.onboardingAssessmentSettings?.maxQuestionsPerSection || 5;
      const isLastSection =
        currentSectionData.order === assessment.sections.length - 1;

      logger.info({
        message: 'Section analysis for answer submission',
        context: 'OnboardingAssessmentService.submitAnswer',
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
        // Check if section exists before updating
        const sectionExists =
          await this.prisma.onboarding_assessment_section.findUnique({
            where: { id: currentQuestion.sectionId },
          });

        if (sectionExists) {
          await this.prisma.onboarding_assessment_section.update({
            where: { id: currentQuestion.sectionId },
            data: {
              startedAt: new Date(),
              status: OnboardingAssessmentSectionStatusEnum.IN_PROGRESS,
            },
          });

          logger.info({
            message: '🎬 Section started',
            context: 'OnboardingAssessmentService.submitAnswer',
            assessmentId,
            sectionId: currentQuestion.sectionId,
            sectionTitle: currentSectionData.title,
          });
        } else {
          logger.warn({
            message: '⚠️ Section not found in database, skipping status update',
            context: 'OnboardingAssessmentService.submitAnswer',
            assessmentId,
            sectionId: currentQuestion.sectionId,
            sectionTitle: currentSectionData.title,
          });
        }
      }

      // ✅ FIX: Check if we just answered the last question of this section
      // Questions are 0-indexed: 0, 1, 2, 3, 4 for maxQuestionsPerSection=5
      // Last question order = maxQuestionsPerSection - 1 (e.g., order 4)
      const isLastQuestionOfSection =
        currentQuestion.order === maxQuestionsPerSection - 1;

      if (isLastQuestionOfSection) {
        // Check if section exists before updating
        const sectionExists =
          await this.prisma.onboarding_assessment_section.findUnique({
            where: { id: currentQuestion.sectionId },
          });

        if (sectionExists) {
          await this.prisma.onboarding_assessment_section.update({
            where: { id: currentQuestion.sectionId },
            data: {
              completedAt: new Date(),
              status: OnboardingAssessmentSectionStatusEnum.COMPLETED,
            },
          });

          logger.info({
            message: '✅ Section completed',
            context: 'OnboardingAssessmentService.submitAnswer',
            assessmentId,
            sectionId: currentQuestion.sectionId,
            sectionTitle: currentSectionData.title,
            sectionOrder: currentSectionData.order,
            questionOrder: currentQuestion.order,
          });
        } else {
          logger.warn({
            message:
              '⚠️ Section not found in database, skipping completion update',
            context: 'OnboardingAssessmentService.submitAnswer',
            assessmentId,
            sectionId: currentQuestion.sectionId,
            sectionTitle: currentSectionData.title,
          });
        }
      }

      // ✅ FIX: Only end assessment if this is the last question of the last section
      if (isLastQuestionOfSection && isLastSection) {
        logger.info({
          message:
            '🏁 Last question of last section answered - completing assessment',
          context: 'OnboardingAssessmentService.submitAnswer',
          assessmentId,
          questionId,
          sectionOrder: currentSectionData.order,
          questionOrder: currentQuestion.order,
        });

        await this.onboardingAssessmentProvider.saveAnswer(
          assessment.task.id,
          toCandidateOnboardingAssessmentQuestionDomain(currentQuestion)
        );

        // Update assessment status
        await this.prisma.onboarding_assessment.update({
          where: { id: assessmentId },
          data: {
            status:
              OnboardingAssessmentStatusEnum.CANDIDATE_ASSESSMENT_COMPLETED,
          },
        });

        // Update task status
        await this.prisma.onboarding_assessment_task.update({
          where: { id: assessment.task.id },
          data: {
            status: OnboardingAssessmentTaskStatusEnum.ASSESSMENT_COMPLETED,
          },
        });

        // Update progress state
        await this.prisma.onboarding_assessment_progress.update({
          where: { assessmentId },
          data: {
            isCompleted: true,
            lastSavedAt: new Date(),
          },
        });

        return {
          nextQuestion: toCandidateOnboardingAssessmentQuestionDomain({
            ...currentQuestion,
            isLastQuestion: true,
            question:
              'Thank you for completing the assessment. We will review your answers and get back to you soon.',
          }),
          shouldEndAssessment: true,
        };
      } else {
        logger.info({
          message: '➡️ Getting next question from AI provider',
          context: 'OnboardingAssessmentService.submitAnswer',
          assessmentId,
          questionId,
          currentSectionId: currentQuestion.sectionId,
          currentSectionOrder: currentSectionData.order,
          currentQuestionOrder: currentQuestion.order,
        });

        // Ai task to find next question
        const response =
          await this.onboardingAssessmentProvider.getNextQuestion(
            assessment.task.id,
            toCandidateOnboardingAssessmentQuestionDomain(currentQuestion)
          );

        logger.info({
          message: '✅ Got next question from AI provider',
          context: 'OnboardingAssessmentService.submitAnswer',
          assessmentId,
          currentQuestionId: questionId,
          nextQuestionId: response.nextQuestion.id,
          nextQuestionSectionId: response.nextQuestion.sectionId,
          nextQuestionOrder: response.nextQuestion.order,
          shouldEndAssessment: response.shouldEndAssessment,
        });

        const nextQuestion = response.nextQuestion;

        if (!nextQuestion) {
          throw new AppError(
            'No next question found',
            404,
            ErrorCode.NO_NEXT_QUESTION_FOUND
          );
        }

        // Determine if section changed
        const sectionChanged =
          nextQuestion.sectionId !== currentQuestion.sectionId;
        if (sectionChanged) {
          const nextSection = assessment.sections.find(
            (s) => s.id === nextQuestion.sectionId
          );
          logger.info({
            message: '🔄 Section transition detected',
            context: 'OnboardingAssessmentService.submitAnswer',
            assessmentId,
            previousSectionId: currentQuestion.sectionId,
            previousSectionOrder: currentSectionData.order,
            nextSectionId: nextQuestion.sectionId,
            nextSectionOrder: nextSection?.order,
            nextSectionTitle: nextSection?.title,
          });
        }

        // Save the next question
        await this.prisma.onboarding_assessment_question.create({
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
          message: '💾 Next question saved to database',
          context: 'OnboardingAssessmentService.submitAnswer',
          assessmentId,
          questionId: nextQuestion.id,
          sectionId: nextQuestion.sectionId,
          questionOrder: nextQuestion.order,
        });

        // Update progress state
        await this.prisma.onboarding_assessment_progress.update({
          where: { assessmentId },
          data: {
            currentSectionId: nextQuestion.sectionId,
            currentQuestionId: nextQuestion.id,
            lastSavedAt: new Date(),
            isCompleted: false,
          },
        });

        return {
          nextQuestion:
            toCandidateOnboardingAssessmentQuestionDomain(nextQuestion),
          shouldEndAssessment: response.shouldEndAssessment,
        };
      }
    } catch (error) {
      logger.error({
        message: 'Failed to submit answer',
        context: 'OnboardingAssessmentService.submitAnswer',
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
  ): Promise<ICandidateOnboardingAssessment> {
    try {
      logger.info({
        message: 'Submitting assessment',
        context: 'OnboardingAssessmentService.submitAssessment',
        candidateId,
        assessmentId,
      });
      const assessment = await this.getCompleteOnboardingAssessment(
        candidateId,
        assessmentId
      );
      if (
        assessment.status !==
          OnboardingAssessmentStatusEnum.CANDIDATE_ASSESSMENT_IN_PROGRESS &&
        assessment.status !==
          OnboardingAssessmentStatusEnum.CANDIDATE_ASSESSMENT_COMPLETED
      ) {
        throw new AppError(
          'Assessment is not in progress or completed',
          400,
          ErrorCode.ASSESSMENT_NOT_IN_PROGRESS
        );
      }
      // Mark as completed
      await this.prisma.onboarding_assessment.update({
        where: { id: assessmentId },
        data: {
          status: OnboardingAssessmentStatusEnum.CANDIDATE_ASSESSMENT_COMPLETED,
          completedAt: new Date(),
        },
      });
      if (!assessment.task) {
        throw new AppError(
          'Assessment task not found',
          404,
          ErrorCode.ONBOARDING_ASSESSMENT_TASK_NOT_FOUND
        );
      }

      logger.info({
        message: 'Processing submit task',
        context: 'OnboardingAssessmentService.submitAssessment',
        assessment,
      });
      // process task async
      await this.onboardingAssessmentProcessor.addSubmitJob(assessmentId);

      return toCandidateOnboardingAssessmentDomain(
        await this.getCompleteOnboardingAssessment(candidateId, assessmentId)
      );
    } catch (error) {
      logger.error({
        message: 'Failed to submit assessment',
        context: 'OnboardingAssessmentService.submitAssessment',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        assessmentId,
      });
      throw error;
    }
  }

  /**
   * Process failed assessments by retrying them with the same background process
   */
  async processFailedAssessment(): Promise<void> {
    try {
      logger.info({
        message: 'Processing failed assessments tttt',
        context: 'OnboardingAssessmentService.processFailedAssessment',
      });

      // Find all failed assessments
      const failedAssessments =
        await this.prisma.onboarding_assessment.findMany({
          where: {
            status: OnboardingAssessmentStatusEnum.ASSESSMENT_FAILED,
          },
          include: {
            task: true,
            candidate: true,
          },
        });

      logger.info({
        message: `Found ${failedAssessments.length} failed assessments to retry`,
        context: 'OnboardingAssessmentService.processFailedAssessment',
        count: failedAssessments.length,
      });

      // Process each failed assessment
      for (const failedAssessment of failedAssessments) {
        try {
          logger.info({
            message: 'Retrying failed assessment',
            context: 'OnboardingAssessmentService.processFailedAssessment',
            assessmentId: failedAssessment.id,
            candidateId: failedAssessment.candidateId,
          });

          // Reset assessment status to allow retry
          await this.prisma.onboarding_assessment.update({
            where: { id: failedAssessment.id },
            data: {
              status:
                OnboardingAssessmentStatusEnum.CANDIDATE_ASSESSMENT_COMPLETED,
            },
          });

          // Reset task status if it exists
          if (failedAssessment.task) {
            await this.prisma.onboarding_assessment_task.update({
              where: { id: failedAssessment.task.id },
              data: {
                status: OnboardingAssessmentTaskStatusEnum.ASSESSMENT_STARTED,
              },
            });
          }

          // Run the same background process as submitAssessment
          await this.onboardingAssessmentProcessor.addSubmitJob(
            failedAssessment.id
          );
        } catch (error) {
          logger.error({
            message: 'Failed to process individual failed assessment',
            context: 'OnboardingAssessmentService.processFailedAssessment',
            error: error instanceof Error ? error.message : 'Unknown error',
            assessmentId: failedAssessment.id,
            candidateId: failedAssessment.candidateId,
          });
        }
      }

      logger.info({
        message: 'Completed processing failed assessments',
        context: 'OnboardingAssessmentService.processFailedAssessment',
        processedCount: failedAssessments.length,
      });
    } catch (error) {
      logger.error({
        message: 'Failed to process failed assessments',
        context: 'OnboardingAssessmentService.processFailedAssessment',
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
  ): Promise<ICandidateOnboardingAssessment> {
    try {
      logger.info({
        message: 'Re-submitting assessment',
        context: 'OnboardingAssessmentService.reSubmitAssessment',
        assessmentId,
      });

      const assessment =
        await this.getCompleteOnboardingAssessmentByAssessmentId(assessmentId);

      if (!assessment) {
        throw new AppError(
          'Assessment not found',
          404,
          ErrorCode.ONBOARDING_ASSESSMENT_NOT_FOUND
        );
      }

      if (!assessment.task) {
        throw new AppError(
          'Assessment task not found',
          404,
          ErrorCode.ONBOARDING_ASSESSMENT_TASK_NOT_FOUND
        );
      }

      await this.prisma.onboarding_assessment.update({
        where: { id: assessmentId },
        data: {
          status: OnboardingAssessmentStatusEnum.CANDIDATE_ASSESSMENT_COMPLETED,
        },
      });

      // Reset task status if it exists
      if (assessment.task) {
        await this.prisma.onboarding_assessment_task.update({
          where: { id: assessment.task.id },
          data: {
            status: OnboardingAssessmentTaskStatusEnum.ASSESSMENT_STARTED,
          },
        });
      }

      // Restart the background process for AI review
      await this.onboardingAssessmentProcessor.addSubmitJob(assessmentId);

      // Get the updated assessment
      const updatedAssessment =
        await this.getCompleteOnboardingAssessmentByAssessmentId(assessmentId);

      logger.info({
        message: 'Assessment re-submitted successfully',
        context: 'OnboardingAssessmentService.reSubmitAssessment',
        assessmentId,
        newStatus: updatedAssessment.status,
      });

      return updatedAssessment;
    } catch (error) {
      logger.error({
        message: 'Failed to re-submit assessment',
        context: 'OnboardingAssessmentService.reSubmitAssessment',
        error: error instanceof Error ? error.message : 'Unknown error',
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
        context: 'OnboardingAssessmentService.heartbeat',
        candidateId,
        assessmentId,
        duration,
        status,
      });
      await this.getCompleteOnboardingAssessment(candidateId, assessmentId);
      const updateData: any = { duration };
      // do not update status
      // if (status) updateData.status = status;
      const updated = await this.prisma.onboarding_assessment.update({
        where: { id: assessmentId },
        data: updateData,
      });
      if (!updated) {
        throw new AppError(
          'Assessment not found',
          404,
          ErrorCode.ONBOARDING_ASSESSMENT_NOT_FOUND
        );
      }
      return true;
    } catch (error) {
      logger.error({
        message: 'Failed to update heartbeat',
        context: 'OnboardingAssessmentService.heartbeat',
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
  ): Promise<ICandidateOnboardingAssessmentProctoring> {
    try {
      await this.getCompleteOnboardingAssessment(candidateId, assessmentId);
      let proctoring =
        await this.prisma.onboarding_assessment_proctoring.findUnique({
          where: { assessmentId },
        });
      if (!proctoring) {
        proctoring = await this.prisma.onboarding_assessment_proctoring.create({
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
      const updated = await this.prisma.onboarding_assessment_proctoring.update(
        {
          where: { assessmentId },
          data: update,
        }
      );

      // Check if max warnings exceeded after updating
      if (type === 'WARNING') {
        const assessment = await this.prisma.onboarding_assessment.findUnique({
          where: { id: assessmentId },
          include: { onboardingAssessmentSettings: true },
        });

        if (assessment && assessment.onboardingAssessmentSettings) {
          const maxWarnings =
            assessment.onboardingAssessmentSettings.maxWarnings || 3;

          if (updated.warningCount >= maxWarnings) {
            logger.warn({
              message: 'Max warnings exceeded, terminating assessment',
              context: 'OnboardingAssessmentService.proctor',
              assessmentId,
              warningCount: updated.warningCount,
              maxWarnings,
            });

            // Terminate assessment asynchronously to avoid blocking proctor response
            this.terminateAssessment(
              assessmentId,
              AssessmentTerminationReasonEnum.MAX_WARNINGS_EXCEEDED
            ).catch((error) => {
              logger.error({
                message: 'Failed to terminate assessment after max warnings',
                context: 'OnboardingAssessmentService.proctor',
                error: error instanceof Error ? error.message : 'Unknown error',
                assessmentId,
              });
            });
          }
        }
      }

      return toCandidateOnboardingAssessmentProctoringDomain(updated);
    } catch (error) {
      logger.error({
        message: 'Failed to update proctoring event',
        context: 'OnboardingAssessmentService.proctor',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        assessmentId,
        type,
      });
      throw error;
    }
  }

  /**
   * Complete assessment when all questions are answered
   */
  async completeAssessment(assessmentId: string): Promise<void> {
    logger.info({
      message: 'Completing assessment',
      context: 'OnboardingAssessmentService.completeAssessment',
      assessmentId,
    });

    try {
      // Get assessment details
      const assessment = await this.prisma.onboarding_assessment.findUnique({
        where: { id: assessmentId },
        select: {
          id: true,
          candidateId: true,
          status: true,
          livekitRoomName: true,
        },
      });

      if (!assessment) {
        throw new AppError(
          'Assessment not found',
          404,
          ErrorCode.ONBOARDING_ASSESSMENT_NOT_FOUND
        );
      }

      // Check if already completed
      if (
        assessment.status ===
          OnboardingAssessmentStatusEnum.AI_REVIEW_COMPLETED ||
        assessment.status ===
          OnboardingAssessmentStatusEnum.ASSESSMENT_COMPLETED
      ) {
        logger.warn({
          message: 'Assessment already completed, skipping',
          context: 'OnboardingAssessmentService.completeAssessment',
          assessmentId,
          currentStatus: assessment.status,
        });
        return;
      }

      // Update assessment status to AI_REVIEW_COMPLETED
      await this.prisma.onboarding_assessment.update({
        where: { id: assessmentId },
        data: {
          status: OnboardingAssessmentStatusEnum.AI_REVIEW_COMPLETED,
          completedAt: new Date(),
        },
      });

      // Update candidate assessment status to ASSESSMENT_COMPLETED
      await this.prisma.candidate.update({
        where: { id: assessment.candidateId },
        data: {
          onboardingAssessmentStatus:
            CandidateOnboardingAssessmentStatusEnum.ASSESSMENT_COMPLETED,
        },
      });

      logger.info({
        message: 'Assessment marked as completed',
        context: 'OnboardingAssessmentService.completeAssessment',
        assessmentId,
      });

      // Close LiveKit room if exists
      if (assessment.livekitRoomName) {
        try {
          await this.getLiveKitService().closeAssessmentRoom(
            assessment.livekitRoomName,
            assessmentId
          );
          logger.info({
            message: 'LiveKit room closed successfully',
            context: 'OnboardingAssessmentService.completeAssessment',
            assessmentId,
          });
        } catch (error) {
          logger.error({
            message: 'Failed to close LiveKit room',
            context: 'OnboardingAssessmentService.completeAssessment',
            error: error instanceof Error ? error.message : 'Unknown error',
            assessmentId,
          });
        }
      }

      // Cleanup Redis keys and listener
      try {
        await this.redisLiveKitService.cleanupAssessment(assessmentId);
        this.activeListeners.delete(assessmentId); // Remove from active listeners
        logger.info({
          message: 'Redis keys cleaned up and listener removed',
          context: 'OnboardingAssessmentService.completeAssessment',
          assessmentId,
        });
      } catch (error) {
        logger.error({
          message: 'Failed to cleanup Redis keys',
          context: 'OnboardingAssessmentService.completeAssessment',
          error: error instanceof Error ? error.message : 'Unknown error',
          assessmentId,
        });
      }
    } catch (error) {
      logger.error({
        message: 'Failed to complete assessment',
        context: 'OnboardingAssessmentService.completeAssessment',
        error: error instanceof Error ? error.message : 'Unknown error',
        assessmentId,
      });
      throw error;
    }
  }

  /**
   * Terminate assessment due to violations or other incidents
   */
  async terminateAssessment(
    assessmentId: string,
    reason: AssessmentTerminationReasonEnum
  ): Promise<void> {
    logger.info({
      message: 'Terminating assessment',
      context: 'OnboardingAssessmentService.terminateAssessment',
      assessmentId,
      reason,
    });

    try {
      // Get assessment details
      const assessment = await this.prisma.onboarding_assessment.findUnique({
        where: { id: assessmentId },
        select: {
          candidateId: true,
          status: true,
          livekitRoomName: true,
        },
      });

      if (!assessment) {
        throw new AppError(
          'Assessment not found',
          404,
          ErrorCode.ONBOARDING_ASSESSMENT_NOT_FOUND
        );
      }

      // Check if assessment is already terminated or completed
      if (
        assessment.status ===
          OnboardingAssessmentStatusEnum.ASSESSMENT_TERMINATED ||
        assessment.status ===
          OnboardingAssessmentStatusEnum.ASSESSMENT_COMPLETED ||
        assessment.status === OnboardingAssessmentStatusEnum.ASSESSMENT_FAILED
      ) {
        logger.warn({
          message: 'Assessment already in terminal state, skipping termination',
          context: 'OnboardingAssessmentService.terminateAssessment',
          assessmentId,
          currentStatus: assessment.status,
        });
        return;
      }

      // Determine result based on reason
      let result: OnboardingAssessmentResultEnum;
      switch (reason) {
        case AssessmentTerminationReasonEnum.MAX_WARNINGS_EXCEEDED:
          result = OnboardingAssessmentResultEnum.TERMINATED_MAX_WARNINGS;
          break;
        case AssessmentTerminationReasonEnum.FOUL_LANGUAGE_DETECTED:
          result = OnboardingAssessmentResultEnum.TERMINATED_FOUL_LANGUAGE;
          break;
        case AssessmentTerminationReasonEnum.CANDIDATE_REQUESTED:
          result = OnboardingAssessmentResultEnum.TERMINATED_CANDIDATE_REQUEST;
          break;
        case AssessmentTerminationReasonEnum.INCIDENT_DETECTED:
          result = OnboardingAssessmentResultEnum.TERMINATED_INCIDENT;
          break;
        default:
          result = OnboardingAssessmentResultEnum.TERMINATED_INCIDENT;
      }

      // CRITICAL: Save transcript and create initial video analysis entry BEFORE closing room
      // This ensures the entry exists for later video analysis processing
      if (assessment.livekitRoomName) {
        try {
          logger.info({
            message:
              'Retrieving transcript and creating video analysis entry before room closure',
            context: 'OnboardingAssessmentService.terminateAssessment',
            assessmentId,
            roomName: assessment.livekitRoomName,
          });

          // Get full transcript from Redis before closing room
          const transcript = await this.getLiveKitService().getFullTranscript(
            assessmentId,
            'ONBOARDING'
          );

          // Create initial video_analysis entry with transcript
          // This is critical - without this, video analysis will fail
          await this.prisma.onboarding_assessment_video_analysis.upsert({
            where: { assessmentId },
            create: {
              assessmentId,
              transcriptText: transcript || 'Assessment terminated early',
            },
            update: {
              transcriptText: transcript || 'Assessment terminated early',
            },
          });

          logger.info({
            message:
              'Video analysis entry created successfully with transcript',
            context: 'OnboardingAssessmentService.terminateAssessment',
            assessmentId,
            transcriptLength: transcript?.length || 0,
          });
        } catch (error) {
          logger.error({
            message:
              'Failed to save transcript, creating empty video analysis entry',
            context: 'OnboardingAssessmentService.terminateAssessment',
            error: error instanceof Error ? error.message : 'Unknown error',
            assessmentId,
          });

          // Create empty entry as fallback to prevent video analysis from failing
          try {
            await this.prisma.onboarding_assessment_video_analysis.upsert({
              where: { assessmentId },
              create: {
                assessmentId,
                transcriptText:
                  'Assessment terminated - transcript unavailable',
              },
              update: {
                transcriptText:
                  'Assessment terminated - transcript unavailable',
              },
            });
          } catch (innerError) {
            logger.error({
              message: 'Failed to create fallback video analysis entry',
              context: 'OnboardingAssessmentService.terminateAssessment',
              error:
                innerError instanceof Error
                  ? innerError.message
                  : 'Unknown error',
              assessmentId,
            });
          }
        }
      }

      // Close LiveKit room if exists (after saving transcript)
      if (assessment.livekitRoomName) {
        try {
          await this.getLiveKitService().closeAssessmentRoom(
            assessment.livekitRoomName,
            assessmentId
          );
          logger.info({
            message: 'LiveKit room closed successfully',
            context: 'OnboardingAssessmentService.terminateAssessment',
            assessmentId,
            roomName: assessment.livekitRoomName,
          });
        } catch (error) {
          logger.error({
            message: 'Failed to close LiveKit room',
            context: 'OnboardingAssessmentService.terminateAssessment',
            error: error instanceof Error ? error.message : 'Unknown error',
            assessmentId,
            roomName: assessment.livekitRoomName,
          });
          // Don't throw - room closure failure shouldn't block termination
        }
      }

      // Cleanup Redis keys and listener
      try {
        await this.redisLiveKitService.cleanupAssessment(assessmentId);
        this.activeListeners.delete(assessmentId); // Remove from active listeners
        logger.info({
          message: 'Redis keys cleaned up and listener removed',
          context: 'OnboardingAssessmentService.terminateAssessment',
          assessmentId,
        });
      } catch (error) {
        logger.error({
          message: 'Failed to cleanup Redis keys',
          context: 'OnboardingAssessmentService.terminateAssessment',
          error: error instanceof Error ? error.message : 'Unknown error',
          assessmentId,
        });
        // Don't throw - Redis cleanup failure shouldn't block termination
      }

      // Update assessment status to COMPLETED (so video processing happens)
      // Keep the termination reason and result for tracking
      await this.prisma.onboarding_assessment.update({
        where: { id: assessmentId },
        data: {
          status: OnboardingAssessmentStatusEnum.CANDIDATE_ASSESSMENT_COMPLETED,
          result,
          endedAt: new Date(),
          terminationReason: reason,
        },
      });

      // Update candidate assessment status to allow retaking
      await this.prisma.candidate.update({
        where: { id: assessment.candidateId },
        data: {
          onboardingAssessmentStatus:
            CandidateOnboardingAssessmentStatusEnum.ASSESSMENT_NOT_DONE,
        },
      });

      logger.info({
        message: 'Assessment status updated to completed (terminated)',
        context: 'OnboardingAssessmentService.terminateAssessment',
        assessmentId,
        result,
        reason,
      });

      // Trigger the same background processing as submitAssessment
      // This will handle AI review and video analysis
      logger.info({
        message: 'Triggering background processing for terminated assessment',
        context: 'OnboardingAssessmentService.terminateAssessment',
        assessmentId,
      });

      await this.onboardingAssessmentProcessor.addSubmitJob(assessmentId);

      logger.info({
        message:
          'Assessment terminated successfully with background processing queued',
        context: 'OnboardingAssessmentService.terminateAssessment',
        assessmentId,
        reason,
      });
    } catch (error) {
      logger.error({
        message: 'Failed to terminate assessment',
        context: 'OnboardingAssessmentService.terminateAssessment',
        error: error instanceof Error ? error.message : 'Unknown error',
        assessmentId,
        reason,
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
    ICandidateOnboardingAssessmentPresignedUrl & {
      chunkIndex: number;
      gcsUri: string;
      filePath: string;
    }
  > {
    try {
      logger.info({
        message: 'Getting presigned URL for video upload by assessmentId',
        context: 'OnboardingAssessmentService.getPresignedUrlByAssessmentId',
        assessmentId,
        chunkIndex,
      });

      // Get assessment to find candidateId
      const assessment = await this.prisma.onboarding_assessment.findUnique({
        where: { id: assessmentId },
        select: { candidateId: true },
      });

      if (!assessment) {
        throw new AppError(
          'Onboarding assessment not found',
          404,
          ErrorCode.ONBOARDING_ASSESSMENT_NOT_FOUND
        );
      }

      // Use provided chunkIndex or calculate next chunk index
      let nextChunkIndex: number;
      if (chunkIndex !== undefined) {
        nextChunkIndex = chunkIndex;
      } else {
        // Get next chunk index - only count relevant chunks with uploaded/completed status
        const lastChunk = await this.prisma.videoChunkAnalysis.findFirst({
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

      const { folderPath } =
        getBucketFolderPathToCandidateOnboardingAssessmentVideo(
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
        context: 'OnboardingAssessmentService.getPresignedUrlByAssessmentId',
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
        context: 'OnboardingAssessmentService.getPresignedUrlByAssessmentId',
        error: error instanceof Error ? error.message : 'Unknown error',
        assessmentId,
      });
      throw error;
    }
  }

  /**
   * Clean up data from previous assessment attempt (restart scenario)
   */
  private async cleanupPreviousAttempt(assessmentId: string): Promise<void> {
    try {
      logger.info({
        message: 'Cleaning up previous attempt data',
        context: 'OnboardingAssessmentService.cleanupPreviousAttempt',
        assessmentId,
      });

      // Delete old video chunk analysis records
      const deletedChunks = await this.prisma.videoChunkAnalysis.deleteMany({
        where: { assessmentId },
      });

      logger.info({
        message: 'Deleted video chunk records',
        context: 'OnboardingAssessmentService.cleanupPreviousAttempt',
        assessmentId,
        count: deletedChunks.count,
      });

      // Reset proctoring data (keep history but reset counts)
      const proctoring =
        await this.prisma.onboarding_assessment_proctoring.findUnique({
          where: { assessmentId },
        });

      if (proctoring) {
        await this.prisma.onboarding_assessment_proctoring.update({
          where: { assessmentId },
          data: {
            tabSwitches: 0,
            copyPasteAttempts: 0,
            multiplePersonsDetected: false,
            warningCount: 0,
            // Keep suspiciousEvents as historical record
          },
        });
      }

      // Delete old video chunks from GCS
      try {
        // Delete all files in the video folder
        const assessment = await this.prisma.onboarding_assessment.findUnique({
          where: { id: assessmentId },
          select: { candidateId: true },
        });

        if (assessment) {
          const { folderPath: fullFolderPath } =
            getBucketFolderPathToCandidateOnboardingAssessmentVideo(
              assessment.candidateId,
              assessmentId
            );

          // List and delete all files in the folder
          const files = await this.storageProvider.listFiles(fullFolderPath);

          logger.warn({
            message: '🗑️ Deleting ALL video chunks (assessment restart)',
            context: 'OnboardingAssessmentService.cleanupPreviousAttempt',
            assessmentId,
            folderPath: fullFolderPath,
            fileCount: files.length,
            reason: 'ASSESSMENT_RESTART',
            files: files.map((f) => f.name),
          });

          const deletionPromises = files.map((file) =>
            this.storageProvider.deleteFile(file.name)
          );
          await Promise.allSettled(deletionPromises);

          logger.info({
            message: '✅ Deleted video chunks from GCS',
            context: 'OnboardingAssessmentService.cleanupPreviousAttempt',
            assessmentId,
            folderPath: fullFolderPath,
            filesDeleted: files.length,
          });
        }
      } catch (storageError) {
        logger.warn({
          message: 'Failed to delete video chunks from GCS (continuing anyway)',
          context: 'OnboardingAssessmentService.cleanupPreviousAttempt',
          error:
            storageError instanceof Error
              ? storageError.message
              : 'Unknown error',
          assessmentId,
        });
      }

      logger.info({
        message: 'Cleanup completed',
        context: 'OnboardingAssessmentService.cleanupPreviousAttempt',
        assessmentId,
      });
    } catch (error) {
      logger.error({
        message: 'Failed to cleanup previous attempt (continuing anyway)',
        context: 'OnboardingAssessmentService.cleanupPreviousAttempt',
        error: error instanceof Error ? error.message : 'Unknown error',
        assessmentId,
      });
      // Don't throw - cleanup failure shouldn't block assessment start
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
    questionId?: string
  ): Promise<{ success: boolean; chunkId: string }> {
    try {
      logger.info({
        message: 'Recording chunk upload',
        context: 'OnboardingAssessmentService.recordChunkUpload',
        candidateId,
        assessmentId,
        chunkIndex,
        gcsUri,
        questionId,
      });

      // Verify assessment belongs to candidate
      await this.getCompleteOnboardingAssessment(candidateId, assessmentId);

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
            context: 'OnboardingAssessmentService.recordChunkUpload',
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
              context: 'OnboardingAssessmentService.recordChunkUpload',
              error: error instanceof Error ? error.message : 'Unknown error',
              assessmentId,
              chunkIndex,
              questionId,
            });
            // Don't throw - duration extraction failure shouldn't block chunk recording
          });
        } catch (storageError) {
          logger.error({
            message: '❌ Failed to verify chunk file in GCS',
            context: 'OnboardingAssessmentService.recordChunkUpload',
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
          context: 'OnboardingAssessmentService.recordChunkUpload',
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
        const existingChunks = await this.prisma.videoChunkAnalysis.findMany({
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
            context: 'OnboardingAssessmentService.recordChunkUpload',
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
      const chunk = await this.prisma.videoChunkAnalysis.upsert({
        where: {
          video_chunk_analysis_assessment_id_chunk_index_key: {
            assessmentId,
            chunkIndex,
          },
        },
        create: {
          assessmentId,
          chunkIndex,
          gcsUri,
          questionId,
          attemptNumber,
          isRelevant: !!questionId, // ✅ Transition chunks are not relevant
          status: questionId ? 'uploaded' : 'skipped', // ✅ Different status for transition chunks
        },
        update: {
          gcsUri,
          questionId,
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
              context: 'OnboardingAssessmentService.recordChunkUpload',
              error: error instanceof Error ? error.message : 'Unknown error',
              assessmentId,
              chunkIndex,
              questionId,
            });
          }
        );

        logger.info({
          message: '✅ Question chunk recorded and analysis triggered',
          context: 'OnboardingAssessmentService.recordChunkUpload',
          assessmentId,
          chunkIndex,
          questionId,
          chunkId: chunk.id,
        });
      } else {
        logger.info({
          message: '⚠️ Transition chunk recorded (skipped analysis)',
          context: 'OnboardingAssessmentService.recordChunkUpload',
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
        context: 'OnboardingAssessmentService.recordChunkUpload',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        assessmentId,
        chunkIndex,
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
        context: 'OnboardingAssessmentService.extractAndStoreChunkDuration',
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
          context: 'OnboardingAssessmentService.extractAndStoreChunkDuration',
          assessmentId,
          chunkIndex,
          filePath,
        });
        return;
      }

      // Update chunk record with duration
      await this.prisma.videoChunkAnalysis.updateMany({
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
        context: 'OnboardingAssessmentService.extractAndStoreChunkDuration',
        assessmentId,
        chunkIndex,
        durationSeconds: duration,
        durationMinutes: (duration / 60).toFixed(2),
      });
    } catch (error) {
      logger.error({
        message: 'Failed to extract and store chunk duration',
        context: 'OnboardingAssessmentService.extractAndStoreChunkDuration',
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
   * Returns only relevant chunks (excludes superseded attempts)
   */
  async getVideoChunks(
    candidateId: string,
    assessmentId: string,
    options?: {
      questionId?: string;
      includeAnalysis?: boolean;
      includePlaybackUrls?: boolean;
    }
  ): Promise<
    Array<{
      id: string;
      chunkIndex: number;
      questionId: string | null;
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
        context: 'OnboardingAssessmentService.getVideoChunks',
        candidateId,
        assessmentId,
        options,
      });

      // Verify assessment belongs to candidate
      const assessment = await this.getCompleteOnboardingAssessment(
        candidateId,
        assessmentId
      );

      // Build query filter
      const where: any = {
        assessmentId,
        isRelevant: true, // Only relevant chunks
      };

      if (options?.questionId) {
        where.questionId = options.questionId;
      }

      if (assessment.startedAt) {
        where.createdAt = {
          gte: assessment.startedAt,
        };
      }

      // Get chunks from database
      const chunks = await this.prisma.videoChunkAnalysis.findMany({
        where,
        orderBy: [{ questionId: 'asc' }, { chunkIndex: 'asc' }],
        select: {
          id: true,
          chunkIndex: true,
          questionId: true,
          attemptNumber: true,
          status: true,
          createdAt: true,
          gcsUri: true,
          publicUrl: true,
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
            attemptNumber: chunk.attemptNumber,
            status: chunk.status,
            createdAt: chunk.createdAt,
            duration: chunk.duration ?? undefined, // Include duration from database
          };

          if (options?.includeAnalysis) {
            data.analysis = chunk.analysis;
          }

          if (options?.includePlaybackUrls) {
            // ✅ Skip playback URL generation for transition chunks (no file)
            if (!chunk.questionId) {
              logger.debug({
                message: 'Skipping playback URL for transition chunk (no file)',
                context: 'OnboardingAssessmentService.getVideoChunks',
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
                    context: 'OnboardingAssessmentService.getVideoChunks',
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
                    context: 'OnboardingAssessmentService.getVideoChunks',
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
                  context: 'OnboardingAssessmentService.getVideoChunks',
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
        context: 'OnboardingAssessmentService.getVideoChunks',
        assessmentId,
        chunkCount: result.length,
      });

      return result;
    } catch (error) {
      logger.error({
        message: 'Failed to get video chunks',
        context: 'OnboardingAssessmentService.getVideoChunks',
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
        context: 'OnboardingAssessmentService.getChunkPlaybackUrl',
        candidateId,
        assessmentId,
        chunkId,
      });

      // Verify assessment belongs to candidate
      await this.getCompleteOnboardingAssessment(candidateId, assessmentId);

      // Get the chunk
      const chunk = await this.prisma.videoChunkAnalysis.findFirst({
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

      // Extract file path from GCS URI
      const filePath = chunk.gcsUri.replace(`gs://${ENV.BUCKET_NAME}/`, '');

      // Generate signed URL valid for 1 hour (3600 seconds)
      const playbackUrl = await this.storageProvider.generatePreSignedUrl(
        filePath,
        'read'
      );

      logger.info({
        message: 'Generated chunk playback URL',
        context: 'OnboardingAssessmentService.getChunkPlaybackUrl',
        chunkId,
      });

      return {
        playbackUrl,
        expiresIn: 3600, // 1 hour
      };
    } catch (error) {
      logger.error({
        message: 'Failed to get chunk playback URL',
        context: 'OnboardingAssessmentService.getChunkPlaybackUrl',
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
   * Does not verify candidate ownership
   */
  async getVideoChunksByAssessmentId(
    assessmentId: string,
    options?: {
      questionId?: string;
      includeAnalysis?: boolean;
      includePlaybackUrls?: boolean;
      orderBy?: 'chunkIndex' | 'questionId' | 'createdAt';
    }
  ): Promise<
    Array<{
      id: string;
      chunkIndex: number;
      questionId: string | null;
      attemptNumber: number;
      status: string;
      createdAt: Date;
      analysis?: any;
      playbackUrl?: string;
      duration?: number; // Duration in seconds from database
    }>
  > {
    try {
      logger.info({
        message: 'Getting video chunks (admin access)',
        context: 'OnboardingAssessmentService.getVideoChunksByAssessmentId',
        assessmentId,
        options,
      });

      // Get assessment to check startedAt for filtering
      const assessment = await this.prisma.onboarding_assessment.findUnique({
        where: { id: assessmentId },
        select: { startedAt: true },
      });

      // Build query filter
      const where: any = {
        assessmentId,
        isRelevant: true, // Only relevant chunks
      };

      if (options?.questionId) {
        where.questionId = options.questionId;
      }

      if (assessment?.startedAt) {
        where.createdAt = {
          gte: assessment.startedAt,
        };
      }

      // Get chunks from database
      const chunks = await this.prisma.videoChunkAnalysis.findMany({
        where,
        orderBy: [{ questionId: 'asc' }, { chunkIndex: 'asc' }],
        select: {
          id: true,
          chunkIndex: true,
          questionId: true,
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
            attemptNumber: chunk.attemptNumber,
            status: chunk.status,
            createdAt: chunk.createdAt,
            duration: chunk.duration ?? undefined, // Include duration from database
          };

          if (options?.includeAnalysis) {
            data.analysis = chunk.analysis;
          }

          if (options?.includePlaybackUrls) {
            try {
              // Extract file path from GCS URI
              const filePath = chunk.gcsUri.replace(
                `gs://${ENV.BUCKET_NAME}/`,
                ''
              );
              // Generate signed URL valid for 1 hour
              data.playbackUrl =
                await this.storageProvider.generatePreSignedUrl(
                  filePath,
                  'read'
                );
            } catch (error) {
              logger.warn({
                message: 'Failed to generate playback URL for chunk',
                context:
                  'OnboardingAssessmentService.getVideoChunksByAssessmentId',
                error: error instanceof Error ? error.message : 'Unknown error',
                chunkId: chunk.id,
              });
            }
          }

          return data;
        })
      );

      logger.info({
        message: 'Retrieved video chunks (admin access)',
        context: 'OnboardingAssessmentService.getVideoChunksByAssessmentId',
        assessmentId,
        chunkCount: result.length,
      });

      return result;
    } catch (error) {
      logger.error({
        message: 'Failed to get video chunks (admin access)',
        context: 'OnboardingAssessmentService.getVideoChunksByAssessmentId',
        error: error instanceof Error ? error.message : 'Unknown error',
        assessmentId,
      });
      throw error;
    }
  }

  /**
   * Get chunk playback URL by assessment and chunk ID (for support/admin access)
   * Does not verify candidate ownership
   */
  async getChunkPlaybackUrlByAssessmentId(
    assessmentId: string,
    chunkId: string
  ): Promise<{ playbackUrl: string; expiresIn: number }> {
    try {
      logger.info({
        message: 'Getting chunk playback URL (admin access)',
        context:
          'OnboardingAssessmentService.getChunkPlaybackUrlByAssessmentId',
        assessmentId,
        chunkId,
      });

      // Get the chunk
      const chunk = await this.prisma.videoChunkAnalysis.findFirst({
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

      // Extract file path from GCS URI
      const filePath = chunk.gcsUri.replace(`gs://${ENV.BUCKET_NAME}/`, '');

      // Generate signed URL valid for 1 hour (3600 seconds)
      const playbackUrl = await this.storageProvider.generatePreSignedUrl(
        filePath,
        'read'
      );

      logger.info({
        message: 'Generated chunk playback URL (admin access)',
        context:
          'OnboardingAssessmentService.getChunkPlaybackUrlByAssessmentId',
        chunkId,
      });

      return {
        playbackUrl,
        expiresIn: 3600, // 1 hour
      };
    } catch (error) {
      logger.error({
        message: 'Failed to get chunk playback URL (admin access)',
        context:
          'OnboardingAssessmentService.getChunkPlaybackUrlByAssessmentId',
        error: error instanceof Error ? error.message : 'Unknown error',
        assessmentId,
        chunkId,
      });
      throw error;
    }
  }

  /**
   * Analyze chunk asynchronously with automatic retry
   * Handles rate limiting and transient errors with exponential backoff
   */
  private async analyzeChunkAsync(
    assessmentId: string,
    chunkIndex: number,
    gcsUri: string,
    retryCount: number = 0
  ): Promise<void> {
    const MAX_RETRIES = 10;

    try {
      // Check if chunk should be analyzed (skip if marked as irrelevant or skipped)
      const chunk = await this.prisma.videoChunkAnalysis.findFirst({
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
          context: 'OnboardingAssessmentService.analyzeChunkAsync',
          assessmentId,
          chunkIndex,
          isRelevant: chunk.isRelevant,
          status: chunk.status,
        });
        return;
      }

      // Update status to analyzing
      await this.prisma.videoChunkAnalysis.updateMany({
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

      // Perform analysis - analyzeChunk now handles rate limiting and upsert internally
      await analysisService.analyzeChunk(
        gcsUri,
        chunkIndex,
        assessmentId,
        'onboarding'
      );

      logger.info({
        message: 'Chunk analysis completed',
        context: 'OnboardingAssessmentService.analyzeChunkAsync',
        assessmentId,
        chunkIndex,
        retryCount,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      // Check if this is a rate limit error
      const isRateLimitError =
        errorMessage.includes('RESOURCE_EXHAUSTED') ||
        errorMessage.includes('Quota exceeded') ||
        errorMessage.includes('Rate limit') ||
        errorMessage.includes('429');

      // Check if we should retry
      if (retryCount < MAX_RETRIES) {
        logger.warn({
          message: isRateLimitError
            ? 'Rate limit error, retrying with longer delay...'
            : 'Chunk analysis failed, retrying...',
          context: 'OnboardingAssessmentService.analyzeChunkAsync',
          error: errorMessage,
          assessmentId,
          chunkIndex,
          retryCount,
          nextRetry: retryCount + 1,
          isRateLimitError,
        });

        // Calculate delay based on error type
        let delayMs: number;
        if (isRateLimitError) {
          // For rate limit errors, use longer delays: 5s, 15s, 30s, 60s
          delayMs = Math.min(5000 * Math.pow(2, retryCount), 60000);
        } else {
          // For other errors, use shorter exponential backoff: 1s, 2s, 4s, 8s
          delayMs = Math.pow(2, retryCount) * 1000;
        }

        logger.info({
          message: 'Waiting before retry',
          context: 'OnboardingAssessmentService.analyzeChunkAsync',
          assessmentId,
          chunkIndex,
          delayMs,
          delaySeconds: (delayMs / 1000).toFixed(1),
        });

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
      await this.prisma.videoChunkAnalysis.updateMany({
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
        context: 'OnboardingAssessmentService.analyzeChunkAsync',
        error: errorMessage,
        assessmentId,
        chunkIndex,
        totalAttempts: retryCount + 1,
        isRateLimitError,
      });
      throw error;
    }
  }

  /**
   * Diagnose chunks with missing playback URLs
   * Returns detailed information about why URLs are missing
   *
   * Common causes:
   * 1. Transition chunks (questionId: null) - Frontend may not upload these
   * 2. Files deleted during question retry - Old attempts cleaned up
   * 3. Files deleted during assessment restart - All chunks cleaned up
   * 4. Upload failure - File never reached GCS
   */
  async diagnoseChunkPlaybackIssues(
    candidateId: string,
    assessmentId: string
  ): Promise<{
    totalChunks: number;
    relevantChunks: number;
    transitionChunks: number;
    chunksWithFiles: number;
    chunksMissingFiles: number;
    recommendation: string;
    issues: Array<{
      chunkIndex: number;
      chunkId: string;
      questionId: string | null;
      attemptNumber: number;
      isRelevant: boolean;
      gcsUri: string;
      fileExists: boolean;
      issue: string;
    }>;
  }> {
    try {
      logger.info({
        message: 'Diagnosing chunk playback issues',
        context: 'OnboardingAssessmentService.diagnoseChunkPlaybackIssues',
        candidateId,
        assessmentId,
      });

      // Verify assessment belongs to candidate
      await this.getCompleteOnboardingAssessment(candidateId, assessmentId);

      // Get ALL chunks (including irrelevant ones) for comprehensive diagnosis
      const allChunks = await this.prisma.videoChunkAnalysis.findMany({
        where: {
          assessmentId,
        },
        orderBy: { chunkIndex: 'asc' },
        select: {
          id: true,
          chunkIndex: true,
          questionId: true,
          attemptNumber: true,
          isRelevant: true,
          gcsUri: true,
          status: true,
        },
      });

      const issues: Array<{
        chunkIndex: number;
        chunkId: string;
        questionId: string | null;
        attemptNumber: number;
        isRelevant: boolean;
        gcsUri: string;
        fileExists: boolean;
        issue: string;
      }> = [];

      let chunksWithFiles = 0;
      let chunksMissingFiles = 0;
      const transitionChunks = allChunks.filter((c) => c.questionId === null);
      const relevantChunks = allChunks.filter((c) => c.isRelevant);

      // Check each chunk
      for (const chunk of allChunks) {
        const filePath = chunk.gcsUri.replace(
          `gs://${ENV.GCS_BUCKET_NAME}/`,
          ''
        );
        const fileExists = await this.storageProvider.fileExists(filePath);

        if (fileExists) {
          chunksWithFiles++;
        } else {
          chunksMissingFiles++;
        }

        // Report issues for relevant chunks only (irrelevant chunks are expected to be missing/deleted)
        if (chunk.isRelevant && !fileExists) {
          let issue = 'File not found in GCS storage';

          if (chunk.questionId === null) {
            issue =
              'Transition chunk (no questionId) - file not uploaded by frontend';
          } else if (chunk.attemptNumber > 1) {
            issue = `Question retry (attempt ${chunk.attemptNumber}) - check if previous attempt was cleaned up`;
          }

          issues.push({
            chunkIndex: chunk.chunkIndex,
            chunkId: chunk.id,
            questionId: chunk.questionId,
            attemptNumber: chunk.attemptNumber,
            isRelevant: chunk.isRelevant,
            gcsUri: chunk.gcsUri,
            fileExists: false,
            issue,
          });
        }

        // Report transition chunks even if they exist (informational)
        if (chunk.questionId === null && chunk.isRelevant) {
          issues.push({
            chunkIndex: chunk.chunkIndex,
            chunkId: chunk.id,
            questionId: chunk.questionId,
            attemptNumber: chunk.attemptNumber,
            isRelevant: chunk.isRelevant,
            gcsUri: chunk.gcsUri,
            fileExists,
            issue: fileExists
              ? '⚠️ Transition chunk with file (unusual - check frontend)'
              : '✅ Transition chunk without file (expected - frontend does not upload these)',
          });
        }
      }

      // Generate recommendation
      let recommendation = '';
      const transitionChunksMissingFiles = transitionChunks.filter(
        (c) => !issues.find((i) => i.chunkId === c.id && i.fileExists)
      ).length;
      const questionChunksMissingFiles =
        chunksMissingFiles - transitionChunksMissingFiles;

      if (chunksMissingFiles === 0) {
        recommendation = '✅ All relevant chunks have files in storage.';
      } else if (transitionChunksMissingFiles === chunksMissingFiles) {
        recommendation =
          '✅ All missing files are transition chunks (questionId: null). ' +
          'This is EXPECTED BEHAVIOR. Frontend does not upload transition chunks. ' +
          'Backend now skips file verification for transition chunks. ' +
          'No action required - system working as designed.';
      } else if (questionChunksMissingFiles > 0) {
        recommendation =
          `⚠️ Found ${questionChunksMissingFiles} question chunk(s) with missing files (questionId present). ` +
          'Possible causes: (1) Upload failure - check frontend logs, (2) Question retry cleanup - old attempts deleted, (3) Assessment restart cleanup - all chunks deleted. ' +
          'Check backend logs for deletion events.';
      } else {
        recommendation =
          '✅ All question chunks have files. Transition chunks missing files (expected).';
      }

      logger.info({
        message: 'Chunk playback diagnosis completed',
        context: 'OnboardingAssessmentService.diagnoseChunkPlaybackIssues',
        assessmentId,
        totalChunks: allChunks.length,
        relevantChunks: relevantChunks.length,
        transitionChunks: transitionChunks.length,
        chunksWithFiles,
        chunksMissingFiles,
        issuesFound: issues.length,
        recommendation,
      });

      return {
        totalChunks: allChunks.length,
        relevantChunks: relevantChunks.length,
        transitionChunks: transitionChunks.length,
        chunksWithFiles,
        chunksMissingFiles,
        recommendation,
        issues,
      };
    } catch (error) {
      logger.error({
        message: 'Failed to diagnose chunk playback issues',
        context: 'OnboardingAssessmentService.diagnoseChunkPlaybackIssues',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        assessmentId,
      });
      throw error;
    }
  }

  /**
   * Manually retry failed chunk analysis
   * Useful for recovering from transient failures
   */
  async retryFailedChunks(
    candidateId: string,
    assessmentId: string
  ): Promise<{
    retriedCount: number;
    successCount: number;
    failedCount: number;
  }> {
    try {
      logger.info({
        message: 'Retrying failed chunk analysis',
        context: 'OnboardingAssessmentService.retryFailedChunks',
        candidateId,
        assessmentId,
      });

      // Verify assessment belongs to candidate
      await this.getCompleteOnboardingAssessment(candidateId, assessmentId);

      // Get all failed chunks
      const failedChunks = await this.prisma.videoChunkAnalysis.findMany({
        where: {
          assessmentId,
          status: 'failed',
          isRelevant: true,
        },
        select: {
          id: true,
          chunkIndex: true,
          gcsUri: true,
        },
      });

      if (failedChunks.length === 0) {
        logger.info({
          message: 'No failed chunks to retry',
          context: 'OnboardingAssessmentService.retryFailedChunks',
          assessmentId,
        });
        return { retriedCount: 0, successCount: 0, failedCount: 0 };
      }

      logger.info({
        message: 'Found failed chunks to retry',
        context: 'OnboardingAssessmentService.retryFailedChunks',
        assessmentId,
        failedChunksCount: failedChunks.length,
        chunkIndices: failedChunks.map((c) => c.chunkIndex),
      });

      // Retry each failed chunk
      let successCount = 0;
      let failedCount = 0;

      for (const chunk of failedChunks) {
        try {
          await this.analyzeChunkAsync(
            assessmentId,
            chunk.chunkIndex,
            chunk.gcsUri,
            0 // Start with retry count 0
          );
          successCount++;
        } catch (error) {
          failedCount++;
          logger.error({
            message: 'Failed to retry chunk analysis',
            context: 'OnboardingAssessmentService.retryFailedChunks',
            error: error instanceof Error ? error.message : 'Unknown error',
            assessmentId,
            chunkIndex: chunk.chunkIndex,
          });
        }
      }

      logger.info({
        message: 'Completed retrying failed chunks',
        context: 'OnboardingAssessmentService.retryFailedChunks',
        assessmentId,
        retriedCount: failedChunks.length,
        successCount,
        failedCount,
      });

      return {
        retriedCount: failedChunks.length,
        successCount,
        failedCount,
      };
    } catch (error) {
      logger.error({
        message: 'Failed to retry failed chunks',
        context: 'OnboardingAssessmentService.retryFailedChunks',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        assessmentId,
      });
      throw error;
    }
  }

  /**
   * Cleanup irrelevant chunk files from GCS (background task)
   */
  private async cleanupIrrelevantChunksAsync(
    assessmentId: string,
    questionId: string,
    currentAttemptNumber: number
  ): Promise<void> {
    try {
      logger.info({
        message: 'Starting cleanup of irrelevant chunks',
        context: 'OnboardingAssessmentService.cleanupIrrelevantChunksAsync',
        assessmentId,
        questionId,
        currentAttemptNumber,
      });

      // Get all irrelevant chunks for this question (older attempts)
      const irrelevantChunks = await this.prisma.videoChunkAnalysis.findMany({
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
          context: 'OnboardingAssessmentService.cleanupIrrelevantChunksAsync',
          assessmentId,
          questionId,
        });
        return;
      }

      logger.info({
        message: 'Found irrelevant chunks to delete',
        context: 'OnboardingAssessmentService.cleanupIrrelevantChunksAsync',
        assessmentId,
        questionId,
        count: irrelevantChunks.length,
      });

      // Delete chunk files from GCS
      const deletionPromises = irrelevantChunks.map(async (chunk) => {
        try {
          // Extract file path from GCS URI (gs://bucket/path/to/file.webm -> path/to/file.webm)
          const filePath = chunk.gcsUri.replace(`gs://${ENV.BUCKET_NAME}/`, '');

          logger.info({
            message: '🗑️ Deleting irrelevant chunk file (question retry)',
            context: 'OnboardingAssessmentService.cleanupIrrelevantChunksAsync',
            assessmentId,
            questionId,
            chunkIndex: chunk.chunkIndex,
            attemptNumber: chunk.attemptNumber,
            currentAttemptNumber,
            gcsUri: chunk.gcsUri,
            filePath,
            reason: 'QUESTION_RETRY',
          });

          await this.storageProvider.deleteFile(filePath);

          logger.info({
            message: '✅ Successfully deleted irrelevant chunk file',
            context: 'OnboardingAssessmentService.cleanupIrrelevantChunksAsync',
            assessmentId,
            chunkIndex: chunk.chunkIndex,
            gcsUri: chunk.gcsUri,
          });
        } catch (error) {
          logger.error({
            message: '❌ Failed to delete chunk file',
            context: 'OnboardingAssessmentService.cleanupIrrelevantChunksAsync',
            error: error instanceof Error ? error.message : 'Unknown error',
            assessmentId,
            chunkId: chunk.id,
            chunkIndex: chunk.chunkIndex,
            gcsUri: chunk.gcsUri,
            filePath: chunk.gcsUri.replace(`gs://${ENV.BUCKET_NAME}/`, ''),
          });
          // Continue with other deletions even if one fails
        }
      });

      await Promise.allSettled(deletionPromises);

      // Delete chunk records from database
      const deleteResult = await this.prisma.videoChunkAnalysis.deleteMany({
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
        context: 'OnboardingAssessmentService.cleanupIrrelevantChunksAsync',
        assessmentId,
        questionId,
        deletedCount: deleteResult.count,
      });
    } catch (error) {
      logger.error({
        message: 'Failed to cleanup irrelevant chunks',
        context: 'OnboardingAssessmentService.cleanupIrrelevantChunksAsync',
        error: error instanceof Error ? error.message : 'Unknown error',
        assessmentId,
        questionId,
      });
      // Don't throw - this is a background cleanup task
    }
  }

  /**
   * Get presigned URL for video upload
   */
  async getPresignedUrl(
    candidateId: string,
    assessmentId: string,
    chunkIndex?: number
  ): Promise<ICandidateOnboardingAssessmentPresignedUrl> {
    try {
      logger.info({
        message: 'Getting presigned URL for video upload',
        context: 'OnboardingAssessmentService.getPresignedUrl',
        candidateId,
        assessmentId,
        chunkIndex,
      });

      await this.getCompleteOnboardingAssessment(candidateId, assessmentId);

      // Use provided chunkIndex or calculate next chunk index
      let nextChunkIndex: number;
      if (chunkIndex !== undefined) {
        nextChunkIndex = chunkIndex;
      } else {
        // Get next chunk index - only count relevant chunks with uploaded/completed status
        const lastChunk = await this.prisma.videoChunkAnalysis.findFirst({
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

      const { folderPath } =
        getBucketFolderPathToCandidateOnboardingAssessmentVideo(
          candidateId,
          assessmentId
        );

      // Use consistent filename format: chunk-INDEX-TIMESTAMP.webm
      const timestamp = Date.now();
      const fileName = `chunk-${nextChunkIndex}-${timestamp}.webm`;
      const filePath = `${folderPath}/${fileName}`;
      const gcsUri = `gs://${ENV.GCS_BUCKET_NAME}/${filePath}`;

      const presignedUrl = await this.storageProvider.generatePreSignedUrl(
        filePath,
        'write',
        'video/webm;codecs=vp8,opus'
      );

      logger.info({
        message: 'Generated presigned URL for video upload',
        context: 'OnboardingAssessmentService.getPresignedUrl',
        assessmentId,
        chunkIndex: nextChunkIndex,
        fileName,
        filePath,
      });

      return { presignedUrl, gcsUri };
    } catch (error) {
      logger.error({
        message: 'Failed to get presigned URL',
        context: 'OnboardingAssessmentService.getPresignedUrl',
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
  ): Promise<ICandidateOnboardingAssessmentPresignedUrl> {
    try {
      logger.info({
        message:
          'Getting presigned URL for question response audio by assessmentId',
        context:
          'OnboardingAssessmentService.getQuestionAudioPresignedUrlByAssessmentId',
        assessmentId,
        questionId,
      });

      // Get assessment to find candidateId
      const assessment = await this.prisma.onboarding_assessment.findUnique({
        where: { id: assessmentId },
        select: { candidateId: true },
      });

      if (!assessment) {
        throw new AppError(
          'Onboarding assessment not found',
          404,
          ErrorCode.ONBOARDING_ASSESSMENT_NOT_FOUND
        );
      }

      // Verify question exists in assessment
      const question =
        await this.prisma.onboarding_assessment_question.findFirst({
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
          ErrorCode.ONBOARDING_ASSESSMENT_QUESTION_NOT_FOUND
        );
      }

      // Generate presigned URL for audio upload
      const { folderPath } =
        getBucketFolderPathToCandidateOnboardingAssessmentQuestionAudio(
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
          'OnboardingAssessmentService.getQuestionAudioPresignedUrlByAssessmentId',
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
  ): Promise<ICandidateOnboardingAssessmentPresignedUrl> {
    try {
      logger.info({
        message: 'Getting presigned URL for question response audio',
        context: 'OnboardingAssessmentService.getQuestionAudioPresignedUrl',
        candidateId,
        assessmentId,
        questionId,
      });

      // Verify assessment exists and belongs to candidate
      const assessment = await this.prisma.onboarding_assessment.findUnique({
        where: {
          id: assessmentId,
          candidateId,
        },
      });

      if (!assessment) {
        throw new AppError(
          'Onboarding assessment not found',
          404,
          ErrorCode.AI_ASSESSMENT_NOT_FOUND
        );
      }

      // Verify question exists in assessment
      const question =
        await this.prisma.onboarding_assessment_question.findFirst({
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
          ErrorCode.ONBOARDING_ASSESSMENT_QUESTION_NOT_FOUND
        );
      }

      // Generate presigned URL for audio upload
      const { folderPath } =
        getBucketFolderPathToCandidateOnboardingAssessmentQuestionAudio(
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
        context: 'OnboardingAssessmentService.getQuestionAudioPresignedUrl',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        assessmentId,
        questionId,
      });
      throw error;
    }
  }

  /**
   * Start background process initialize task
   */
  async startBackgroundProcessInitializeTask(assessmentId: string) {
    const assessment =
      await this.getCompleteOnboardingAssessmentByAssessmentId(assessmentId);
    if (!assessment.task) {
      throw new AppError(
        'Assessment task not found',
        404,
        ErrorCode.ONBOARDING_ASSESSMENT_TASK_NOT_FOUND
      );
    }
    logger.info({
      message: 'Starting background process initialize task',
      context:
        'OnboardingAssessmentService.startBackgroundProcessInitializeTask',
      assessmentId,
    });
    await this.backgroundProcessInitializeTask(assessment);
  }

  private async backgroundProcessInitializeTask(
    assessment: ICandidateOnboardingAssessment
  ) {
    try {
      logger.info({
        message: 'Processing onboarding assessment initialize task',
        context: 'OnboardingAssessmentService.backgroundProcessInitializeTask',
        assessmentId: assessment.id,
      });
      // Check if task exists
      if (!assessment.task) {
        throw new AppError(
          'Assessment task not found',
          404,
          ErrorCode.ONBOARDING_ASSESSMENT_TASK_NOT_FOUND
        );
      }
      // Update the assessment status
      await this.prisma.onboarding_assessment.update({
        where: { id: assessment.id },
        data: {
          status: OnboardingAssessmentStatusEnum.AI_INITIALIZATION_IN_PROGRESS,
        },
      });

      // Update the task status
      await this.prisma.onboarding_assessment_task.update({
        where: { id: assessment.task.id },
        data: {
          status: OnboardingAssessmentTaskStatusEnum.INITIALIZE_STARTED,
        },
      });

      // Call the provider to create the onboarding assessment
      await this.onboardingAssessmentProvider.initializeAssessment(
        assessment.task.id,
        assessment
      );

      logger.info({
        message: 'Onboarding assessment initialized',
        context: 'OnboardingAssessmentService.backgroundProcessInitializeTask',
        assessmentId: assessment.id,
      });

      // Update the assessment status
      await this.prisma.onboarding_assessment.update({
        where: { id: assessment.id },
        data: {
          status: OnboardingAssessmentStatusEnum.AI_INITIALIZATION_COMPLETED,
        },
      });

      // Update the task status
      await this.prisma.onboarding_assessment_task.update({
        where: { id: assessment.task.id },
        data: {
          status: OnboardingAssessmentTaskStatusEnum.INITIALIZE_COMPLETED,
        },
      });

      const aiTask =
        await this.onboardingAssessmentProvider.getOnboardingAssessmentTask(
          assessment.task.id
        );

      logger.info({
        message: 'Onboarding assessment initialized',
        context: 'OnboardingAssessmentService.backgroundProcessInitializeTask',
        taskId: assessment.task.id,
        sections: aiTask.assessment.sections,
      });

      // Update the assessment
      await this.prisma.onboarding_assessment.update({
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
        message: 'Onboarding assessment complete',
        context: 'OnboardingAssessmentService.backgroundProcessInitializeTask',
        taskId: assessment.task.id,
        assessment: aiTask.assessment,
      });

      // If assessment was marked as pending start (candidate joined room before initialization), auto-start it now
      try {
        const isPending =
          await this.redisLiveKitService.isAssessmentPendingStart(
            assessment.id
          );

        if (isPending) {
          logger.info({
            message:
              'Assessment marked as pending start, auto-starting Redis assessment now',
            context:
              'OnboardingAssessmentService.backgroundProcessInitializeTask',
            assessmentId: assessment.id,
          });

          // Clear the pending flag
          await this.redisLiveKitService.clearAssessmentPendingStart(
            assessment.id
          );

          // Start the assessment and publish first question to Redis
          await this.startAssessmentWithLiveKit(
            assessment.candidateId,
            assessment.id
          );

          logger.info({
            message:
              'Redis assessment auto-started successfully after initialization',
            context:
              'OnboardingAssessmentService.backgroundProcessInitializeTask',
            assessmentId: assessment.id,
          });
        }
      } catch (error) {
        logger.error({
          message: 'Failed to auto-start Redis assessment after initialization',
          context:
            'OnboardingAssessmentService.backgroundProcessInitializeTask',
          error: error instanceof Error ? error.message : 'Unknown error',
          assessmentId: assessment.id,
        });
        // Don't fail the initialization if auto-start fails
      }
    } catch (error) {
      logger.error({
        message: 'Failed to process task',
        context: 'OnboardingAssessmentService.processTask',
        error: error instanceof Error ? error.message : 'Unknown error',
        assessmentId: assessment.id,
      });
      try {
        if (!assessment.task) {
          throw new AppError(
            'Assessment task not found',
            404,
            ErrorCode.ONBOARDING_ASSESSMENT_TASK_NOT_FOUND
          );
        }
        // Update the task status
        await this.prisma.onboarding_assessment_task.update({
          where: { id: assessment.task.id },
          data: {
            status: OnboardingAssessmentTaskStatusEnum.FAILED,
          },
        });
        // Update the assessment status
        await this.prisma.onboarding_assessment.update({
          where: { id: assessment.id },
          data: {
            status: OnboardingAssessmentStatusEnum.ASSESSMENT_COMPLETED,
          },
        });
      } catch (error) {
        logger.error({
          message: 'Failed to update assessment status',
          context:
            'OnboardingAssessmentService.backgroundProcessInitializeTask',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  /**
   * Start background process submit task
   */
  async startBackgroundProcessSubmitTask(assessmentId: string): Promise<void> {
    const assessment =
      await this.getCompleteOnboardingAssessmentByAssessmentId(assessmentId);
    if (!assessment.task) {
      throw new AppError(
        'Assessment task not found',
        404,
        ErrorCode.ONBOARDING_ASSESSMENT_TASK_NOT_FOUND
      );
    }
    logger.info({
      message: 'Starting background process submit task',
      context: 'OnboardingAssessmentService.startBackgroundProcessSubmitTask',
      assessmentId,
    });
    await this.backgroundProcessSubmitTask(assessment);
  }

  private async backgroundProcessSubmitTask(
    assessment: ICandidateOnboardingAssessment
  ) {
    try {
      logger.info({
        message: 'Processing submit task',
        context: 'OnboardingAssessmentService.backgroundProcessSubmitTask',
        assessment,
      });

      if (!assessment.task) {
        throw new AppError(
          'Assessment task not found',
          404,
          ErrorCode.ONBOARDING_ASSESSMENT_TASK_NOT_FOUND
        );
      }

      // Update the assessment status
      await this.prisma.onboarding_assessment.update({
        where: { id: assessment.id },
        data: {
          status: OnboardingAssessmentStatusEnum.AI_REVIEW_IN_PROGRESS,
        },
      });

      // Update the assessment task status
      await this.prisma.onboarding_assessment_task.update({
        where: { id: assessment.task.id },
        data: {
          status: OnboardingAssessmentTaskStatusEnum.ASSESSMENT_STARTED,
        },
      });
      // Start AI review
      await this.onboardingAssessmentProvider.doAssessment(assessment.task.id);

      // Copy the assessment to the candidate
      const aiTask =
        await this.onboardingAssessmentProvider.getOnboardingAssessmentTask(
          assessment.task.id
        );

      logger.info({
        message: 'Onboarding assessment aiTask completed',
        context: 'OnboardingAssessmentService.backgroundProcessSubmitTask',
        aiTask,
      });

      // Synthesize final video chunk analysis with comprehensive verification
      try {
        // Update status to IN_PROGRESS
        await this.prisma.onboarding_assessment.update({
          where: { id: assessment.id },
          data: {
            videoAnalysisStatus: 'IN_PROGRESS',
          },
        });

        const { IntelligentChunkAnalysisService } = await import(
          '@/services/video/intelligent.chunk.analysis.service'
        );
        const analysisService = new IntelligentChunkAnalysisService();

        // Get all chunks for comprehensive verification (same as reprocess)
        const allChunks = await this.prisma.videoChunkAnalysis.findMany({
          where: { assessmentId: assessment.id },
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

        // Count relevant chunks
        const relevantChunks = allChunks.filter((c) => c.isRelevant);

        logger.info({
          message: 'Chunk verification for automatic analysis',
          context: 'OnboardingAssessmentService.backgroundProcessSubmitTask',
          assessmentId: assessment.id,
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

        // Verification checks with lenient handling
        if (completedChunks.length === 0) {
          throw new Error(
            'No completed video chunks found for analysis. Ensure chunks are uploaded and analyzed first.'
          );
        }

        // Minimum coverage check (at least 2 chunks for meaningful analysis)
        if (completedChunks.length < 2) {
          throw new Error(
            `Insufficient chunk coverage: only ${completedChunks.length} chunk(s) available. At least 2 chunks required for fair assessment.`
          );
        }

        // Calculate success rate
        const totalRelevantChunks = relevantChunks.length;
        const successRate =
          (completedChunks.length / totalRelevantChunks) * 100;
        const MIN_SUCCESS_RATE = 80; // Require at least 80% success rate

        // Handle processing chunks - wait briefly if any are still processing
        if (processingChunks.length > 0) {
          logger.warn({
            message:
              'Found chunks still processing, will use completed chunks only',
            context: 'OnboardingAssessmentService.backgroundProcessSubmitTask',
            assessmentId: assessment.id,
            processingChunkIndices: processingChunks.map((c) => c.chunkIndex),
            completedCount: completedChunks.length,
            totalRelevant: totalRelevantChunks,
          });
        }

        // Handle failed chunks with automatic retry attempt
        if (failedChunks.length > 0) {
          logger.warn({
            message: 'Found failed chunks, attempting automatic retry',
            context: 'OnboardingAssessmentService.backgroundProcessSubmitTask',
            assessmentId: assessment.id,
            failedChunkIndices: failedChunks.map((c) => c.chunkIndex),
          });

          // Attempt to retry failed chunks
          try {
            const assessmentData =
              await this.prisma.onboarding_assessment.findUnique({
                where: { id: assessment.id },
                select: { candidateId: true },
              });

            if (assessmentData) {
              const retryResult = await this.retryFailedChunks(
                assessmentData.candidateId,
                assessment.id
              );

              logger.info({
                message: 'Auto-retry completed for failed chunks',
                context:
                  'OnboardingAssessmentService.backgroundProcessSubmitTask',
                assessmentId: assessment.id,
                retryResult,
              });

              // Refresh chunk data after retry
              const refreshedChunks =
                await this.prisma.videoChunkAnalysis.findMany({
                  where: { assessmentId: assessment.id },
                  orderBy: { chunkIndex: 'asc' },
                  select: {
                    chunkIndex: true,
                    status: true,
                    isRelevant: true,
                  },
                });

              const newCompletedChunks = refreshedChunks.filter(
                (c) => c.status === 'completed' && c.isRelevant
              );
              const newFailedChunks = refreshedChunks.filter(
                (c) => c.status === 'failed'
              );

              // Recalculate success rate
              const newSuccessRate =
                (newCompletedChunks.length / totalRelevantChunks) * 100;

              if (newSuccessRate >= MIN_SUCCESS_RATE) {
                logger.info({
                  message: 'Retry succeeded, proceeding with analysis',
                  context:
                    'OnboardingAssessmentService.backgroundProcessSubmitTask',
                  assessmentId: assessment.id,
                  successRate: newSuccessRate.toFixed(1) + '%',
                });
              } else if (
                newFailedChunks.length > 0 &&
                newSuccessRate < MIN_SUCCESS_RATE
              ) {
                logger.error({
                  message: 'Retry failed, success rate below minimum threshold',
                  context:
                    'OnboardingAssessmentService.backgroundProcessSubmitTask',
                  assessmentId: assessment.id,
                  successRate: newSuccessRate.toFixed(1) + '%',
                  minRequired: MIN_SUCCESS_RATE + '%',
                  failedChunks: newFailedChunks.length,
                });
                throw new Error(
                  `Video analysis failed: Only ${newSuccessRate.toFixed(1)}% chunks analyzed successfully (minimum ${MIN_SUCCESS_RATE}% required). ${newFailedChunks.length} chunk(s) failed after retry.`
                );
              }
            }
          } catch (retryError) {
            logger.error({
              message: 'Auto-retry of failed chunks encountered error',
              context:
                'OnboardingAssessmentService.backgroundProcessSubmitTask',
              error:
                retryError instanceof Error
                  ? retryError.message
                  : 'Unknown error',
              assessmentId: assessment.id,
            });
            // Re-throw if it's the success rate error, otherwise log and continue
            if (
              retryError instanceof Error &&
              retryError.message.includes('success rate')
            ) {
              throw retryError;
            }
          }
        }

        // Final success rate check
        if (successRate < MIN_SUCCESS_RATE) {
          logger.warn({
            message: 'Success rate below minimum threshold',
            context: 'OnboardingAssessmentService.backgroundProcessSubmitTask',
            assessmentId: assessment.id,
            successRate: successRate.toFixed(1) + '%',
            minRequired: MIN_SUCCESS_RATE + '%',
            completedChunks: completedChunks.length,
            totalRelevantChunks,
            failedChunks: failedChunks.length,
          });
          throw new Error(
            `Insufficient video coverage: Only ${successRate.toFixed(1)}% of chunks analyzed successfully (minimum ${MIN_SUCCESS_RATE}% required). ${failedChunks.length} chunk(s) failed.`
          );
        }

        logger.info({
          message: 'Chunk verification passed for automatic analysis',
          context: 'OnboardingAssessmentService.backgroundProcessSubmitTask',
          assessmentId: assessment.id,
          successRate: successRate.toFixed(1) + '%',
          completedChunks: completedChunks.length,
          totalRelevantChunks,
        });

        // Synthesize final analysis from chunks
        logger.info({
          message: 'Starting synthesis of final video analysis',
          context: 'OnboardingAssessmentService.backgroundProcessSubmitTask',
          assessmentId: assessment.id,
        });

        const finalAnalysis = await analysisService.synthesizeFinalAnalysis(
          assessment.id,
          'onboarding'
        );

        logger.info({
          message: '✅ Final analysis synthesized successfully',
          context: 'OnboardingAssessmentService.backgroundProcessSubmitTask',
          assessmentId: assessment.id,
          overallScore: finalAnalysis.overallScore,
          hasTranscript: !!finalAnalysis.transcriptText,
          transcriptLength: finalAnalysis.transcriptText?.length || 0,
        });

        // ✅ CRITICAL: Store final analysis using proper relation upsert
        // This creates/updates the onboarding_assessment_video_analysis table entry
        await this.createVideoAnalysis(assessment.id, finalAnalysis);

        logger.info({
          message: '✅ Video analysis stored in database successfully',
          context: 'OnboardingAssessmentService.backgroundProcessSubmitTask',
          assessmentId: assessment.id,
        });

        // Update status to COMPLETED
        await this.prisma.onboarding_assessment.update({
          where: { id: assessment.id },
          data: {
            videoAnalysisStatus: 'COMPLETED',
            score: finalAnalysis.overallScore,
            overallFeedback: finalAnalysis.overallFeedback,
            strengths: finalAnalysis.strengths,
            areasForImprovement: finalAnalysis.areasForImprovement,
          },
        });

        logger.info({
          message: 'Final video chunk analysis completed',
          context: 'OnboardingAssessmentService.backgroundProcessSubmitTask',
          assessmentId: assessment.id,
          overallScore: finalAnalysis.overallScore,
        });
      } catch (videoError) {
        const errorMessage =
          videoError instanceof Error ? videoError.message : 'Unknown error';

        logger.error({
          message: 'Failed to synthesize video chunk analysis',
          context: 'OnboardingAssessmentService.backgroundProcessSubmitTask',
          error: errorMessage,
          assessmentId: assessment.id,
        });

        // Update status to FAILED with error message
        await this.prisma.onboarding_assessment.update({
          where: { id: assessment.id },
          data: {
            videoAnalysisStatus: 'FAILED',
            videoAnalysisError: errorMessage,
          },
        });

        // Don't throw - video analysis is supplementary, continue with assessment completion
      }

      // DISABLED: Video merging and analysis (using chunk-based analysis instead)
      // await this.onboardingAssessmentVideoAnalysisProcessor.addVideoAnalysisJob(
      //   assessment.id,
      //   assessment.task.id
      // );
      logger.info({
        message:
          'Skipping legacy video merge/analysis - using chunk-based approach',
        context: 'OnboardingAssessmentService.backgroundProcessSubmitTask',
        assessmentId: assessment.id,
      });

      if (aiTask.status === OnboardingAssessmentTaskStatusEnum.FAILED) {
        // Update the assessment task status
        await this.prisma.onboarding_assessment_task.update({
          where: { id: assessment.task.id },
          data: {
            status: OnboardingAssessmentTaskStatusEnum.FAILED,
          },
        });
        // Update the assessment status
        await this.prisma.onboarding_assessment.update({
          where: { id: assessment.id },
          data: {
            status: OnboardingAssessmentStatusEnum.ASSESSMENT_FAILED,
            result: OnboardingAssessmentResultEnum.AI_REVIEW_FAILED,
          },
        });

        // update the candidate onboarding assessment status
        await this.prisma.candidate.update({
          where: { id: assessment.candidateId },
          data: {
            onboardingAssessmentStatus:
              CandidateOnboardingAssessmentStatusEnum.ASSESSMENT_FAILED,
          },
        });

        return;
      }

      await this.updateCandidateOnboardingAssessmentResult(
        assessment.id,
        aiTask.assessment
      );

      // Update the assessment task status
      await this.prisma.onboarding_assessment_task.update({
        where: { id: assessment.task.id },
        data: {
          status: OnboardingAssessmentTaskStatusEnum.ASSESSMENT_COMPLETED,
        },
      });

      let candidateOnboardingAssessmentStatus =
        CandidateOnboardingAssessmentStatusEnum.ASSESSMENT_COMPLETED;

      if (
        aiTask.assessment.status ===
        OnboardingAssessmentStatusEnum.ASSESSMENT_FAILED
      ) {
        candidateOnboardingAssessmentStatus =
          CandidateOnboardingAssessmentStatusEnum.ASSESSMENT_FAILED;
      }

      // update the candidate onboarding assessment status
      await this.prisma.candidate.update({
        where: { id: assessment.candidateId },
        data: {
          onboardingAssessmentStatus: candidateOnboardingAssessmentStatus,
        },
      });
    } catch (error) {
      logger.error({
        message: 'Failed to process submit task',
        context: 'OnboardingAssessmentService.backgroundProcessSubmitTask',
        error: error instanceof Error ? error.message : 'Unknown error',
        assessment,
      });
      try {
        if (assessment.task) {
          // Update the assessment task status
          await this.prisma.onboarding_assessment_task.update({
            where: { id: assessment.task.id },
            data: {
              status: OnboardingAssessmentTaskStatusEnum.FAILED,
            },
          });
          // Update the assessment status
          await this.prisma.onboarding_assessment.update({
            where: { id: assessment.id },
            data: {
              status: OnboardingAssessmentStatusEnum.ASSESSMENT_FAILED,
            },
          });
        }

        // update the candidate onboarding assessment status
        await this.prisma.candidate.update({
          where: { id: assessment.candidateId },
          data: {
            onboardingAssessmentStatus:
              CandidateOnboardingAssessmentStatusEnum.ASSESSMENT_FAILED,
          },
        });
      } catch (error) {
        logger.error({
          message: 'Failed to update assessment task status',
          context: 'OnboardingAssessmentService.backgroundProcessSubmitTask',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  /**
   * Manually reprocess final video analysis for an assessment
   * Useful for regenerating analysis after fixes or for missing analyses
   */
  async reprocessVideoAnalysis(
    candidateId: string,
    assessmentId: string
  ): Promise<ICandidateOnboardingAssessmentVideoAnalysis> {
    logger.info({
      message: 'Manually reprocessing video analysis',
      context: 'OnboardingAssessmentService.reprocessVideoAnalysis',
      candidateId,
      assessmentId,
    });

    // Verify assessment belongs to candidate
    await this.getCompleteOnboardingAssessment(candidateId, assessmentId);

    try {
      // Update status to IN_PROGRESS
      await this.prisma.onboarding_assessment.update({
        where: { id: assessmentId },
        data: {
          videoAnalysisStatus: 'IN_PROGRESS',
        },
      });

      // Import analysis service
      const { IntelligentChunkAnalysisService } = await import(
        '@/services/video/intelligent.chunk.analysis.service'
      );
      const analysisService = new IntelligentChunkAnalysisService();

      // Get all chunks for comprehensive verification
      const allChunks = await this.prisma.videoChunkAnalysis.findMany({
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

      // Count relevant chunks
      const relevantChunks = allChunks.filter((c) => c.isRelevant);

      logger.info({
        message: 'Chunk verification for reprocessing',
        context: 'OnboardingAssessmentService.reprocessVideoAnalysis',
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

      // Lenient verification checks
      if (completedChunks.length === 0) {
        throw new Error(
          'No completed video chunks found for analysis. Ensure chunks are uploaded and analyzed first.'
        );
      }

      // Minimum coverage check (at least 2 chunks for meaningful analysis)
      if (completedChunks.length < 2) {
        throw new Error(
          `Insufficient chunk coverage: only ${completedChunks.length} chunk(s) available. At least 2 chunks required for fair assessment.`
        );
      }

      // Calculate success rate
      const totalRelevantChunks = relevantChunks.length;
      const successRate = (completedChunks.length / totalRelevantChunks) * 100;
      const MIN_SUCCESS_RATE = 80;

      // Lenient handling - log warnings but proceed if success rate is acceptable
      if (processingChunks.length > 0) {
        logger.warn({
          message: 'Found chunks still processing, using completed chunks only',
          context: 'OnboardingAssessmentService.reprocessVideoAnalysis',
          assessmentId,
          processingChunkIndices: processingChunks.map((c) => c.chunkIndex),
        });
      }

      if (failedChunks.length > 0) {
        logger.warn({
          message:
            'Found failed chunks, checking if success rate is acceptable',
          context: 'OnboardingAssessmentService.reprocessVideoAnalysis',
          assessmentId,
          failedChunkIndices: failedChunks.map((c) => c.chunkIndex),
          successRate: successRate.toFixed(1) + '%',
        });
      }

      // Only fail if success rate is below threshold
      if (successRate < MIN_SUCCESS_RATE) {
        logger.error({
          message: 'Success rate below minimum threshold',
          context: 'OnboardingAssessmentService.reprocessVideoAnalysis',
          assessmentId,
          successRate: successRate.toFixed(1) + '%',
          minRequired: MIN_SUCCESS_RATE + '%',
          completedChunks: completedChunks.length,
          totalRelevantChunks,
          failedChunks: failedChunks.length,
        });
        throw new Error(
          `Insufficient video coverage: Only ${successRate.toFixed(1)}% of chunks analyzed successfully (minimum ${MIN_SUCCESS_RATE}% required). ${failedChunks.length} chunk(s) failed. Use retryFailedChunks() to retry failed chunks.`
        );
      }

      logger.info({
        message: 'Chunk verification passed for reprocessing',
        context: 'OnboardingAssessmentService.reprocessVideoAnalysis',
        assessmentId,
        successRate: successRate.toFixed(1) + '%',
        completedChunks: completedChunks.length,
        totalRelevantChunks,
      });

      // Synthesize final analysis from chunks
      const finalAnalysis = await analysisService.synthesizeFinalAnalysis(
        assessmentId,
        'onboarding'
      );

      // Store final analysis using proper relation upsert
      const videoAnalysis = await this.createVideoAnalysis(
        assessmentId,
        finalAnalysis
      );

      // Update status to COMPLETED
      await this.prisma.onboarding_assessment.update({
        where: { id: assessmentId },
        data: {
          videoAnalysisStatus: 'COMPLETED',
          videoAnalysisError: null, // Clear any previous error on success
          score: finalAnalysis.overallScore,
          overallFeedback: finalAnalysis.overallFeedback,
          strengths: finalAnalysis.strengths,
          areasForImprovement: finalAnalysis.areasForImprovement,
        },
      });

      logger.info({
        message: 'Video analysis reprocessing completed',
        context: 'OnboardingAssessmentService.reprocessVideoAnalysis',
        assessmentId,
        overallScore: videoAnalysis.overallScore,
      });

      return videoAnalysis;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      logger.error({
        message: 'Failed to reprocess video analysis',
        context: 'OnboardingAssessmentService.reprocessVideoAnalysis',
        error: errorMessage,
        assessmentId,
      });

      // Update status to FAILED
      await this.prisma.onboarding_assessment.update({
        where: { id: assessmentId },
        data: {
          videoAnalysisStatus: 'FAILED',
          videoAnalysisError: errorMessage,
        },
      });

      throw error;
    }
  }

  private async updateCandidateOnboardingAssessmentResult(
    assessmentId: string,
    assessment: ICandidateOnboardingAssessment
  ) {
    await this.prisma.$transaction(async (tx) => {
      await tx.onboarding_assessment.update({
        where: { id: assessmentId },
        data: {
          status: OnboardingAssessmentStatusEnum.AI_REVIEW_COMPLETED,
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
            section.status === OnboardingAssessmentSectionStatusEnum.COMPLETED;
          if (!hasAiResult) continue;
          await tx.onboarding_assessment_section.update({
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
  }

  async backgroundProcessVideoAnalysis(
    assessmentId: string,
    taskId: string
  ): Promise<void> {
    logger.info({
      message:
        'Processing onboarding assessment video analysis using chunk synthesis',
      context: 'OnboardingAssessmentService.backgroundProcessVideoAnalysis',
      assessmentId,
      taskId,
    });

    try {
      // Note: Status is already set to IN_PROGRESS in livekit.egress.service.ts
      // when the job is queued. No need to update it again here.

      // Import analysis service for chunk synthesis (no ffmpeg required)
      const { IntelligentChunkAnalysisService } = await import(
        '@/services/video/intelligent.chunk.analysis.service'
      );
      const analysisService = new IntelligentChunkAnalysisService();

      // Get all chunks for comprehensive verification
      const allChunks = await this.prisma.videoChunkAnalysis.findMany({
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
      const relevantChunks = allChunks.filter((c) => c.isRelevant);

      logger.info({
        message: 'Chunk verification for background processing',
        context: 'OnboardingAssessmentService.backgroundProcessVideoAnalysis',
        assessmentId,
        totalChunks: allChunks.length,
        relevantChunks: relevantChunks.length,
        completedChunks: completedChunks.length,
        failedChunks: failedChunks.length,
        processingChunks: processingChunks.length,
        chunkIndices: completedChunks
          .map((c) => c.chunkIndex)
          .sort((a, b) => a - b),
      });

      // Lenient verification checks
      if (completedChunks.length === 0) {
        throw new Error(
          'No completed video chunks found for analysis. Ensure chunks are uploaded and analyzed first.'
        );
      }

      // Minimum coverage check (at least 2 chunks for meaningful analysis)
      if (completedChunks.length < 2) {
        throw new Error(
          `Insufficient chunk coverage: only ${completedChunks.length} chunk(s) available. At least 2 chunks required for fair assessment.`
        );
      }

      // Calculate success rate
      const totalRelevantChunks = relevantChunks.length;
      const successRate = (completedChunks.length / totalRelevantChunks) * 100;
      const MIN_SUCCESS_RATE = 80;

      // Lenient handling - log warnings but proceed if success rate is acceptable
      if (processingChunks.length > 0) {
        logger.warn({
          message: 'Found chunks still processing, using completed chunks only',
          context: 'OnboardingAssessmentService.backgroundProcessVideoAnalysis',
          assessmentId,
          processingChunkIndices: processingChunks.map((c) => c.chunkIndex),
        });
      }

      if (failedChunks.length > 0) {
        logger.warn({
          message:
            'Found failed chunks, checking if success rate is acceptable',
          context: 'OnboardingAssessmentService.backgroundProcessVideoAnalysis',
          assessmentId,
          failedChunkIndices: failedChunks.map((c) => c.chunkIndex),
          successRate: successRate.toFixed(1) + '%',
        });
      }

      // Only fail if success rate is below threshold
      if (successRate < MIN_SUCCESS_RATE) {
        logger.error({
          message: 'Success rate below minimum threshold',
          context: 'OnboardingAssessmentService.backgroundProcessVideoAnalysis',
          assessmentId,
          successRate: successRate.toFixed(1) + '%',
          minRequired: MIN_SUCCESS_RATE + '%',
          completedChunks: completedChunks.length,
          totalRelevantChunks,
          failedChunks: failedChunks.length,
        });
        throw new Error(
          `Insufficient video coverage: Only ${successRate.toFixed(1)}% of chunks analyzed successfully (minimum ${MIN_SUCCESS_RATE}% required). ${failedChunks.length} chunk(s) failed.`
        );
      }

      logger.info({
        message: 'Chunk verification passed for background processing',
        context: 'OnboardingAssessmentService.backgroundProcessVideoAnalysis',
        assessmentId,
        successRate: successRate.toFixed(1) + '%',
        completedChunks: completedChunks.length,
        totalRelevantChunks,
      });

      // Synthesize final analysis from chunks (no ffmpeg required)
      logger.info({
        message: 'Synthesizing final analysis from completed chunks',
        context: 'OnboardingAssessmentService.backgroundProcessVideoAnalysis',
        assessmentId,
        completedChunks: completedChunks.length,
      });

      const finalAnalysis = await analysisService.synthesizeFinalAnalysis(
        assessmentId,
        'onboarding'
      );

      logger.info({
        message: '✅ Final analysis synthesized successfully (background)',
        context: 'OnboardingAssessmentService.backgroundProcessVideoAnalysis',
        assessmentId,
        overallScore: finalAnalysis.overallScore,
        hasTranscript: !!finalAnalysis.transcriptText,
      });

      // ✅ CRITICAL: Store final analysis using proper relation upsert
      await this.createVideoAnalysis(assessmentId, finalAnalysis);

      logger.info({
        message:
          '✅ Video analysis stored in database successfully (background)',
        context: 'OnboardingAssessmentService.backgroundProcessVideoAnalysis',
        assessmentId,
      });

      // Update the assessment video analysis status to COMPLETED
      await this.prisma.onboarding_assessment.update({
        where: { id: assessmentId },
        data: {
          videoAnalysisStatus: JobAiAssessmentVideoAnalysisStatusEnum.COMPLETED,
          score: finalAnalysis.overallScore,
          overallFeedback: finalAnalysis.overallFeedback,
          strengths: finalAnalysis.strengths,
          areasForImprovement: finalAnalysis.areasForImprovement,
        },
      });

      logger.info({
        message:
          'Onboarding assessment video analysis completed successfully using chunk synthesis',
        context: 'OnboardingAssessmentService.backgroundProcessVideoAnalysis',
        assessmentId,
        overallScore: finalAnalysis.overallScore,
        method: 'chunk-synthesis',
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      logger.error({
        message: 'Failed to process onboarding assessment video analysis',
        context: 'OnboardingAssessmentService.backgroundProcessVideoAnalysis',
        error: errorMessage,
        assessmentId,
        taskId,
      });

      // Update status to FAILED and store error message
      await this.prisma.onboarding_assessment.update({
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

  async createVideoAnalysis(
    assessmentId: string,
    videoAnalysis: ICandidateOnboardingAssessmentVideoAnalysis
  ): Promise<ICandidateOnboardingAssessmentVideoAnalysis> {
    try {
      logger.info({
        message: 'Creating/updating video analysis entry',
        context: 'OnboardingAssessmentService.createVideoAnalysis',
        assessmentId,
        hasTranscript: !!videoAnalysis.transcriptText,
        transcriptLength: videoAnalysis.transcriptText?.length || 0,
        overallScore: videoAnalysis.overallScore,
      });

      // ✅ CRITICAL: Create or update the video analysis and return the actual database record
      const createdOrUpdated =
        await this.prisma.onboarding_assessment_video_analysis.upsert({
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

      logger.info({
        message: '✅ Video analysis entry created/updated successfully',
        context: 'OnboardingAssessmentService.createVideoAnalysis',
        assessmentId,
        recordId: createdOrUpdated.id,
        overallScore: createdOrUpdated.overallScore,
        hasTranscript: !!createdOrUpdated.transcriptText,
      });

      // Return the videoAnalysis input (domain model) since that's what the interface expects
      // The database record has additional fields we don't need to return
      return videoAnalysis;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      logger.error({
        message: '❌ Failed to create/update video analysis entry',
        context: 'OnboardingAssessmentService.createVideoAnalysis',
        error: errorMessage,
        assessmentId,
        videoAnalysisFields: {
          hasTranscript: !!videoAnalysis.transcriptText,
          overallScore: videoAnalysis.overallScore,
          engagementScore: videoAnalysis.engagementScore,
        },
      });

      throw new AppError(
        `Failed to create video analysis entry: ${errorMessage}`,
        500,
        ErrorCode.STORAGE_ERROR
      );
    }
  }

  /**
   * Helper method to validate and get assessment
   */
  private async getCompleteOnboardingAssessment(
    candidateId: string,
    assessmentId: string
  ): Promise<ICandidateOnboardingAssessment> {
    const assessment = await this.prisma.onboarding_assessment.findUnique({
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
        onboardingAssessmentSettings: true,
      },
    });

    if (!assessment) {
      throw new AppError(
        'Onboarding assessment not found',
        404,
        ErrorCode.ONBOARDING_ASSESSMENT_NOT_FOUND
      );
    }

    return toCandidateOnboardingAssessmentDomain(assessment);
  }

  private async getCompleteOnboardingAssessmentByAssessmentId(
    assessmentId: string
  ): Promise<ICandidateOnboardingAssessment> {
    const assessment = await this.prisma.onboarding_assessment.findUnique({
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
        onboardingAssessmentSettings: true,
      },
    });

    if (!assessment) {
      throw new AppError(
        'Onboarding assessment not found',
        404,
        ErrorCode.ONBOARDING_ASSESSMENT_NOT_FOUND
      );
    }

    return toCandidateOnboardingAssessmentDomain(assessment);
  }

  /**
   * Get the complete onboarding assessment task
   */
  private async getCompleteOnboardingAssessmentTask(
    assessmentId: string
  ): Promise<ICandidateOnboardingAssessmentTask> {
    logger.info({
      message: 'Getting complete onboarding assessment task',
      context:
        'OnboardingAssessmentService.getCompleteOnboardingAssessmentTask',
      assessmentId,
    });
    const task = await this.prisma.onboarding_assessment_task.findUnique({
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
            onboardingAssessmentSettings: true,
          },
        },
      },
    });

    if (!task) {
      throw new AppError(
        'Onboarding assessment task not found',
        404,
        ErrorCode.ONBOARDING_ASSESSMENT_TASK_NOT_FOUND
      );
    }

    logger.info({
      message: 'Getting complete onboarding assessment task',
      context:
        'OnboardingAssessmentService.getCompleteOnboardingAssessmentTask',
      taskId: task.id,
    });

    return toCandidateOnboardingAssessmentTaskDomain(task);
  }

  /**
   * Get the latest onboarding assessment for a candidate
   */
  async getLatestOnboardingAssessment(
    candidateId: string
  ): Promise<ICandidateOnboardingAssessment | null> {
    try {
      logger.info({
        message: 'Getting latest onboarding assessment',
        context: 'OnboardingAssessmentService.getLatestOnboardingAssessment',
        candidateId,
      });

      const assessment = await this.prisma.onboarding_assessment.findFirst({
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
          onboardingAssessmentSettings: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      });

      if (!assessment) {
        logger.warn({
          message: 'No onboarding assessment found for candidate',
          context: 'OnboardingAssessmentService.getLatestOnboardingAssessment',
          candidateId,
        });
        return null;
      }
      logger.info({
        message: 'Found latest onboarding assessment',
        context: 'OnboardingAssessmentService.getLatestOnboardingAssessment',
        assessmentId: assessment.id,
      });

      const assessmentDomain =
        toCandidateOnboardingAssessmentDomain(assessment);

      if (assessmentDomain.videoAnalysis?.videoUrl) {
        // Get the presigned URL for the video

        const presignedUrl = await this.storageProvider.generatePreSignedUrl(
          assessmentDomain.videoAnalysis?.videoUrl,
          'read'
        );
        logger.info({
          message: 'Got presigned URL for video',
          context: 'OnboardingAssessmentService.getLatestOnboardingAssessment',
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
        message: 'Failed to get latest onboarding assessment',
        context: 'OnboardingAssessmentService.getLatestOnboardingAssessment',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
      });
      throw error;
    }
  }

  /**
   * Update terms acceptance status for a candidate
   * Creates an assessment record if one doesn't exist
   */
  async updateTermsAccepted(
    candidateId: string,
    termsAccepted: boolean
  ): Promise<void> {
    try {
      logger.info({
        message: 'Updating terms acceptance status',
        context: 'OnboardingAssessmentService.updateTermsAccepted',
        candidateId,
        termsAccepted,
      });

      // Find the latest assessment for the candidate
      let assessment = await this.prisma.onboarding_assessment.findFirst({
        where: {
          candidateId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // If no assessment exists, create one
      if (!assessment) {
        logger.info({
          message: 'No assessment found, creating new one for terms acceptance',
          context: 'OnboardingAssessmentService.updateTermsAccepted',
          candidateId,
        });

        assessment = await this.prisma.onboarding_assessment.create({
          data: {
            candidateId,
            status: OnboardingAssessmentStatusEnum.NOT_STARTED,
            termsAccepted,
            termsAcceptedAt: termsAccepted ? new Date() : null,
          },
        });

        logger.info({
          message: 'Created new assessment for terms acceptance',
          context: 'OnboardingAssessmentService.updateTermsAccepted',
          candidateId,
          assessmentId: assessment.id,
        });
      } else {
        // Update the existing assessment's terms acceptance status
        await this.prisma.onboarding_assessment.update({
          where: {
            id: assessment.id,
          },
          data: {
            termsAccepted,
            termsAcceptedAt: termsAccepted ? new Date() : null,
          },
        });

        logger.info({
          message: 'Updated existing assessment terms acceptance status',
          context: 'OnboardingAssessmentService.updateTermsAccepted',
          candidateId,
          assessmentId: assessment.id,
        });
      }

      logger.info({
        message: 'Terms acceptance status updated successfully',
        context: 'OnboardingAssessmentService.updateTermsAccepted',
        candidateId,
        termsAccepted,
        assessmentId: assessment.id,
      });
    } catch (error) {
      logger.error({
        message: 'Failed to update terms acceptance status',
        context: 'OnboardingAssessmentService.updateTermsAccepted',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        termsAccepted,
      });
      throw error;
    }
  }

  /**
   * Publish question to Redis for LiveKit agent consumption
   * This method is called when a question needs to be sent to LiveKit agent
   */
  async publishQuestionToLiveKit(
    assessmentId: string,
    questionId: string
  ): Promise<void> {
    try {
      logger.info('Publishing question to LiveKit via Redis', {
        context: 'OnboardingAssessmentService.publishQuestionToLiveKit',
        assessmentId,
        questionId,
      });

      // Get the assessment with all questions
      const assessment = await this.prisma.onboarding_assessment.findUnique({
        where: { id: assessmentId },
        include: {
          sections: {
            include: {
              questions: {
                orderBy: { order: 'asc' },
              },
            },
            orderBy: { order: 'asc' },
          },
          progressState: true,
        },
      });

      if (!assessment) {
        throw new AppError(
          'Assessment not found',
          404,
          ErrorCode.ONBOARDING_ASSESSMENT_NOT_FOUND
        );
      }

      // Find the question
      let question: any = null;
      let sequence = 0;
      let totalQuestions = 0;

      for (const section of assessment.sections) {
        for (const q of section.questions) {
          totalQuestions++;
          if (q.id === questionId) {
            question = q;
            sequence = totalQuestions;
          }
        }
      }

      if (!question) {
        throw new AppError(
          'Question not found',
          404,
          ErrorCode.QUESTION_NOT_FOUND
        );
      }

      // Determine if first/last question
      const isFirstQuestion = sequence === 1;
      const isLastQuestion = sequence === totalQuestions;

      // Get previous question ID
      let previousQuestionId: string | undefined;
      if (!isFirstQuestion && assessment.progressState) {
        previousQuestionId =
          assessment.progressState.currentQuestionId || undefined;
      }

      // Publish to Redis
      await this.redisLiveKitService.publishQuestion(
        assessmentId,
        toCandidateOnboardingAssessmentQuestionDomain(question),
        sequence,
        isFirstQuestion,
        isLastQuestion,
        previousQuestionId
      );

      // Update progress in Redis
      await this.redisLiveKitService.updateAssessmentProgress(
        assessmentId,
        questionId,
        question.sectionId,
        sequence - 1 // completed questions
      );

      logger.info('Successfully published question to LiveKit', {
        context: 'OnboardingAssessmentService.publishQuestionToLiveKit',
        assessmentId,
        questionId,
        sequence,
      });
    } catch (error) {
      logger.error('Failed to publish question to LiveKit', {
        context: 'OnboardingAssessmentService.publishQuestionToLiveKit',
        error: error instanceof Error ? error.message : 'Unknown error',
        assessmentId,
        questionId,
      });
      throw error;
    }
  }

  /**
   * Handle response from LiveKit agent via Redis
   */
  async handleLiveKitResponse(
    assessmentId: string,
    questionId: string,
    answer: string
  ): Promise<void> {
    try {
      logger.info('Handling LiveKit response', {
        context: 'OnboardingAssessmentService.handleLiveKitResponse',
        assessmentId,
        questionId,
      });

      // Use existing submitAnswer logic
      const assessment = await this.prisma.onboarding_assessment.findUnique({
        where: { id: assessmentId },
        include: {
          candidate: true,
        },
      });

      if (!assessment) {
        throw new AppError(
          'Assessment not found',
          404,
          ErrorCode.ONBOARDING_ASSESSMENT_NOT_FOUND
        );
      }

      // Submit the answer using existing logic
      const result = await this.submitAnswer(
        assessment.candidateId,
        assessmentId,
        questionId,
        answer
      );

      // If there's a next question, publish it to Redis
      if (result.nextQuestion && !result.shouldEndAssessment) {
        await this.publishQuestionToLiveKit(
          assessmentId,
          result.nextQuestion.id
        );
      } else {
        // No more questions - signal assessment completion to agent
        logger.info('No more questions, signaling completion to agent', {
          context: 'OnboardingAssessmentService.handleLiveKitResponse',
          assessmentId,
          shouldEndAssessment: result.shouldEndAssessment,
        });

        // Publish special END marker to Redis question queue
        // This allows agent to immediately end instead of waiting for timeout
        const queueKey = `assessment:${assessmentId}:questions`;
        await this.redisLiveKitService['redisClient'].lpush(
          queueKey,
          JSON.stringify({
            messageType: 'END',
            assessmentId,
            timestamp: new Date().toISOString(),
          })
        );
      }

      logger.info('Successfully handled LiveKit response', {
        context: 'OnboardingAssessmentService.handleLiveKitResponse',
        assessmentId,
        questionId,
        hasNextQuestion: !!result.nextQuestion,
        shouldEnd: result.shouldEndAssessment,
      });
    } catch (error) {
      logger.error('Failed to handle LiveKit response', {
        context: 'OnboardingAssessmentService.handleLiveKitResponse',
        error: error instanceof Error ? error.message : 'Unknown error',
        assessmentId,
        questionId,
      });
      throw error;
    }
  }

  /**
   * Start Redis response listener to handle answers and generate next questions
   * Runs in background and automatically cleans up when assessment completes
   * This method is idempotent - safe to call multiple times for the same assessment
   */
  async startRedisResponseListener(
    assessmentId: string,
    _candidateId?: string
  ): Promise<void> {
    // Check if listener already active (idempotent)
    if (this.activeListeners.has(assessmentId)) {
      logger.debug('Redis response listener already active for assessment', {
        context: 'OnboardingAssessmentService.startRedisResponseListener',
        assessmentId,
      });
      return;
    }

    logger.info('Starting Redis response listener', {
      context: 'OnboardingAssessmentService.startRedisResponseListener',
      assessmentId,
    });

    try {
      // Mark as active before subscribing
      this.activeListeners.add(assessmentId);

      await this.redisLiveKitService.subscribeToResponses(
        assessmentId,
        async (response) => {
          try {
            logger.info('Received response from agent', {
              context: 'OnboardingAssessmentService.startRedisResponseListener',
              assessmentId,
              questionId: response.questionId,
            });

            // Handle the response and generate next question
            await this.handleLiveKitResponse(
              assessmentId,
              response.questionId,
              response.answer
            );
          } catch (error) {
            logger.error('Error handling LiveKit response', {
              context: 'OnboardingAssessmentService.startRedisResponseListener',
              assessmentId,
              questionId: response.questionId,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
            // Don't throw - keep listener running for remaining questions
          }
        }
      );

      logger.info('Redis response listener started successfully', {
        context: 'OnboardingAssessmentService.startRedisResponseListener',
        assessmentId,
      });
    } catch (error) {
      // Remove from active set if subscription failed
      this.activeListeners.delete(assessmentId);

      logger.error('Failed to start Redis response listener', {
        context: 'OnboardingAssessmentService.startRedisResponseListener',
        assessmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Start assessment with LiveKit agent (via Redis)
   */
  async startAssessmentWithLiveKit(
    candidateId: string,
    assessmentId: string
  ): Promise<void> {
    try {
      logger.info('Starting assessment with LiveKit', {
        context: 'OnboardingAssessmentService.startAssessmentWithLiveKit',
        candidateId,
        assessmentId,
      });

      // Use existing startAssessment logic to generate first question
      const assessment = await this.startAssessment(candidateId, assessmentId);

      // Get first question from sections
      const firstQuestion = assessment.sections[0]?.questions[0];

      if (!firstQuestion) {
        throw new AppError(
          'No first question found',
          404,
          ErrorCode.QUESTION_NOT_FOUND
        );
      }

      // Initialize Redis progress tracking
      const totalQuestions = assessment.sections.reduce(
        (sum, section) => sum + section.questions.length,
        0
      );

      await this.redisLiveKitService.initializeAssessmentProgress(
        assessmentId,
        totalQuestions
      );

      // Publish first question to Redis
      await this.publishQuestionToLiveKit(assessmentId, firstQuestion.id);

      // Start Redis response listener in background to handle subsequent questions
      // This listener will process each answer and publish the next question
      this.startRedisResponseListener(assessmentId, candidateId).catch(
        (error) => {
          logger.error('Redis response listener failed', {
            context: 'OnboardingAssessmentService.startAssessmentWithLiveKit',
            error: error instanceof Error ? error.message : 'Unknown error',
            assessmentId,
          });
        }
      );

      logger.info('Successfully started assessment with LiveKit', {
        context: 'OnboardingAssessmentService.startAssessmentWithLiveKit',
        assessmentId,
        firstQuestionId: firstQuestion.id,
      });
    } catch (error) {
      logger.error('Failed to start assessment with LiveKit', {
        context: 'OnboardingAssessmentService.startAssessmentWithLiveKit',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        assessmentId,
      });
      throw error;
    }
  }

  /**
   * Get global onboarding assessment settings
   */
  async getGlobalOnboardingAssessmentSettings(): Promise<{
    interviewLanguage?: string;
    interviewDialect?: string;
    interviewVoiceGender?: string;
  }> {
    try {
      const globalSettings =
        await this.prisma.global_onboarding_assessment_settings.findFirst({
          where: { isSingleton: true },
        });

      if (!globalSettings) {
        // Return defaults if no settings found
        return {
          interviewLanguage: 'ENGLISH',
          interviewDialect: 'en-US',
          interviewVoiceGender: 'female',
        };
      }

      return {
        interviewLanguage: globalSettings.interviewLanguage || 'ENGLISH',
        interviewDialect: globalSettings.interviewDialect || 'en-US',
        interviewVoiceGender: globalSettings.interviewVoiceGender || 'female',
      };
    } catch (error) {
      logger.error({
        message: 'Failed to get global onboarding assessment settings',
        context:
          'OnboardingAssessmentService.getGlobalOnboardingAssessmentSettings',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Update global onboarding assessment settings
   */
  async updateGlobalOnboardingAssessmentSettings(data: {
    interviewLanguage?: string;
    interviewDialect?: string;
    interviewVoiceGender?: string;
  }): Promise<{
    interviewLanguage?: string;
    interviewDialect?: string;
    interviewVoiceGender?: string;
  }> {
    try {
      // Get or create the singleton global settings
      const globalSettings =
        await this.prisma.global_onboarding_assessment_settings.upsert({
          where: { isSingleton: true },
          create: {
            name: 'Default Onboarding Assessment Settings',
            description: 'Default settings for onboarding assessments',
            isSingleton: true,
            interviewLanguage: data.interviewLanguage || 'ENGLISH',
            interviewDialect: data.interviewDialect || 'en-US',
            interviewVoiceGender: data.interviewVoiceGender || 'female',
            // Set other required fields with defaults
            defaultAssessmentDuration: 3600,
            defaultPassingScore: 0.7,
            requiredSections: [],
            maximumAttempts: 3,
            cooldownPeriod: 7,
            maxSections: 6,
            maxQuestionsPerSection: 8,
            proctoringEnabled: true,
            maxWarnings: 3,
            tabSwitchLimit: 3,
            copyPasteAllowed: false,
            videoRecordingEnabled: true,
            minimumVideoLength: 10,
            aiVideoAnalysisEnabled: true,
            autoPublishOnSuccess: true,
            autoNotifyOnComplete: true,
          },
          update: {
            ...(data.interviewLanguage !== undefined && {
              interviewLanguage: data.interviewLanguage,
            }),
            ...(data.interviewDialect !== undefined && {
              interviewDialect: data.interviewDialect,
            }),
            ...(data.interviewVoiceGender !== undefined && {
              interviewVoiceGender: data.interviewVoiceGender,
            }),
          },
        });

      return {
        interviewLanguage: globalSettings.interviewLanguage || 'ENGLISH',
        interviewDialect: globalSettings.interviewDialect || 'en-US',
        interviewVoiceGender: globalSettings.interviewVoiceGender || 'female',
      };
    } catch (error) {
      logger.error({
        message: 'Failed to update global onboarding assessment settings',
        context:
          'OnboardingAssessmentService.updateGlobalOnboardingAssessmentSettings',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
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
        context: 'OnboardingAssessmentService.syncGcsChunksWithDatabase',
        candidateId,
        assessmentId,
        options,
      });

      // Verify assessment exists
      const assessment = await this.prisma.onboarding_assessment.findUnique({
        where: { id: assessmentId, candidateId },
        select: { id: true, candidateId: true },
      });

      if (!assessment) {
        throw new AppError(
          'Onboarding assessment not found',
          404,
          ErrorCode.ONBOARDING_ASSESSMENT_NOT_FOUND
        );
      }

      // Get folder path for assessment videos
      const { folderPath } =
        getBucketFolderPathToCandidateOnboardingAssessmentVideo(
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
        context: 'OnboardingAssessmentService.syncGcsChunksWithDatabase',
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
      const existingDbChunks = await this.prisma.videoChunkAnalysis.findMany({
        where: { assessmentId },
        select: {
          chunkIndex: true,
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

      // Process old format files - match by gcsUri
      const oldFormatFiles = chunkFilesWithIndex.filter((f) => f.isOldFormat);

      // Sort old format files by timestamp for consistent ordering when assigning new indices
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
        context: 'OnboardingAssessmentService.syncGcsChunksWithDatabase',
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

          // Try to infer questionId from existing chunks with similar indices
          // Or use null if we can't determine (will be transition chunk)
          let questionId: string | null = null;

          // Find closest existing chunk to infer question
          const closestChunk = existingDbChunks
            .filter((c) => c.chunkIndex < chunkFile.chunkIndex)
            .sort((a, b) => b.chunkIndex - a.chunkIndex)[0];

          if (closestChunk) {
            questionId = closestChunk.questionId;
          }

          // Create DB record
          await this.prisma.videoChunkAnalysis.create({
            data: {
              assessmentId,
              chunkIndex: chunkFile.chunkIndex,
              gcsUri: chunkFile.gcsUri,
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
                context:
                  'OnboardingAssessmentService.syncGcsChunksWithDatabase',
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
            context: 'OnboardingAssessmentService.syncGcsChunksWithDatabase',
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
        context: 'OnboardingAssessmentService.syncGcsChunksWithDatabase',
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
        context: 'OnboardingAssessmentService.syncGcsChunksWithDatabase',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        assessmentId,
      });
      throw error;
    }
  }
}
