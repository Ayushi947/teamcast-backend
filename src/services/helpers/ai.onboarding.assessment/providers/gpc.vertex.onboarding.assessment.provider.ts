import { singleton } from '@/shared/decorators/singleton';
import {
  IOnboardingAssessmentProvider,
  IAiOnboardingAssessmentTask,
} from '../onboarding.assessment.provider';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/shared/utils/logger';
import { ENV } from '@/config/env';
import { VertexAI } from '@google-cloud/vertexai';
import { gcpConfig } from '@/config/gcp';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { z } from 'zod';
import Redis from 'ioredis';
import {
  ICandidateOnboardingAssessment,
  ICandidateOnboardingAssessmentAnswerSubmitted,
} from '@/shared/models/domain/candidate/onboarding.assessment.domain';
import {
  OnboardingAssessmentSectionStatusEnum,
  OnboardingAssessmentSectionResultEnum,
  OnboardingAssessmentStatusEnum,
  OnboardingAssessmentResultEnum,
  OnboardingAssessmentRecommendationEnum,
  QuestionTypeEnum,
  OnboardingAssessmentTaskStatusEnum,
  OnboardingAssessmentVideoAnalysisStatusEnum,
} from '@/shared/models/common/enums';
import {
  ICandidateOnboardingAssessmentQuestion,
  ICandidateOnboardingAssessmentSection,
} from '@/shared/models/domain/candidate/onboarding.assessment.domain';
import { GcpVertexOnboardingAssessmentPromptGenerator } from './gpc.vertex.onboarding.assessment.prompt.generator';
import { mergeVideoChunks, detectVideoMimeType } from '@/utils/video.helper';
import { generateHighlightsVideo } from '@/utils/video.helper';
import { IStorageProvider } from '@/services/helpers/storage/storage.interface';
import { StorageFactory } from '../../storage/storage.factory';
import { getBucketFolderPathToCandidateOnboardingAssessmentVideo } from '@/utils/presigned.urls';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { promisify } from 'util';
import { PrismaClient } from '@prisma/client';

const mkdirAsync = promisify(fs.mkdir);

// Schema definitions for validation
const SectionSchema = z.object({
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  passThreshold: z.number().min(0).max(1).nullable().optional(),
});

const QuestionSchema = z.object({
  question: z.string().nullable().optional(),
  questionType: z.nativeEnum(QuestionTypeEnum).nullable().optional(),
  options: z.any().nullable().optional(),
  correctAnswer: z.string().nullable().optional(),
  maxScore: z.number().min(0).max(1).nullable().optional(),
  isLastQuestion: z.boolean().optional().default(false).nullable().optional(),
  success: z.boolean().optional().default(false).nullable().optional(),
  errorMessage: z.string().nullable().optional(),
  lastQuestionReason: z.string().nullable().optional(),
  shouldEndAssessment: z
    .boolean()
    .optional()
    .default(false)
    .nullable()
    .optional(),
});

const SectionResultSchema = z.object({
  id: z.string(),
  score: z.number().min(0).max(1).nullable().optional(),
  strengths: z.array(z.string()).nullable().optional(),
  areasForImprovement: z.array(z.string()).nullable().optional(),
});

const AssessmentResultSchema = z.object({
  score: z.number().min(0).max(1).nullable().optional(),
  strengths: z.array(z.string()).nullable().optional(),
  areasForImprovement: z.array(z.string()).nullable().optional(),
  overallFeedback: z.string().nullable().optional(),
  recommendation: z
    .nativeEnum(OnboardingAssessmentRecommendationEnum)
    .nullable()
    .optional(),
  sections: z.array(SectionResultSchema).nullable().optional(),
  skills: z.array(z.string()).nullable().optional(),
  technicalSkills: z.array(z.string()).nullable().optional(),
  softSkills: z.array(z.string()).nullable().optional(),
  industriesFit: z.array(z.string()).nullable().optional(),
  jobRolesFit: z.array(z.string()).nullable().optional(),
});

const VideoAnalysisSchema = z.object({
  videoUrl: z.string().nullable().optional(),
  transcriptText: z.string().nullable().optional(),
  overallScore: z.number().min(0).max(1).nullable().optional(),
  overallFeedback: z.string().nullable().optional(),
  engagementScore: z.number().min(0).max(1).nullable().optional(),
  engagementFeedback: z.string().nullable().optional(),
  confidenceScore: z.number().min(0).max(1).nullable().optional(),
  confidenceFeedback: z.string().nullable().optional(),
  clarityScore: z.number().min(0).max(1).nullable().optional(),
  clarityFeedback: z.string().nullable().optional(),
  professionalDemeanorScore: z.number().min(0).max(1).nullable().optional(),
  professionalDemeanorFeedback: z.string().nullable().optional(),
  proctoringScore: z.number().min(0).max(1).nullable().optional(),
  proctoringFeedback: z.string().nullable().optional(),
  areasForImprovement: z.array(z.string()).nullable().optional(),
  strengths: z.array(z.string()).nullable().optional(),
  highlightsInstructions: z.any().nullable().optional(),
});

@singleton
export class GcpVertexOnboardingAssessmentProvider
  implements IOnboardingAssessmentProvider
{
  private redis: Redis | null = null;
  private tasks: Map<string, IAiOnboardingAssessmentTask>;
  private chatSessions: Map<string, any>;
  private vertexAI: VertexAI;
  private model: string;
  private location: string;
  private projectId: string;
  private taskCacheTTL = 86400; // 24 hours in seconds
  private useRedisCache: boolean;
  private maxRetries = 3;
  private retryDelays = [2000, 3000, 5000]; // 2s, 3s, 5s delays
  private jsonParseMaxRetries = 2; // Specific retries for JSON parsing
  private jsonParseRetryDelays = [1000, 2000]; // Shorter delays for JSON parsing
  private storageProvider: IStorageProvider;
  private prisma: PrismaClient;

  constructor() {
    this.tasks = new Map();
    this.chatSessions = new Map();
    this.model = ENV.GOOGLE_CLOUD_VERTEX_AI_MODEL;
    this.location = ENV.GOOGLE_CLOUD_VERTEX_AI_LOCATION;
    this.projectId = ENV.GOOGLE_CLOUD_PROJECT_ID;
    this.useRedisCache = ENV.USE_REDIS_CACHE;
    this.storageProvider = StorageFactory.getInstance().getProvider();
    this.prisma = new PrismaClient();

    if (!this.projectId) {
      throw new Error('GCP Project ID is required for Vertex AI');
    }

    this.vertexAI = gcpConfig.getVertexAI();

    if (this.useRedisCache) {
      try {
        this.redis = new Redis({
          host: ENV.REDIS_HOST,
          port: ENV.REDIS_PORT,
          password: ENV.REDIS_PASSWORD,
          username: ENV.REDIS_USER,
          keyPrefix: `${ENV.ENV_NAME}:onboarding_assessment:`,
          connectTimeout: 5000,
          retryStrategy: (times: number) => {
            const delay = Math.min(times * 100, 3000);
            return delay;
          },
        });

        this.redis.on('error', (err: Error) => {
          logger.error('Redis error', {
            error: err.message,
            context: 'GcpVertexOnboardingAssessmentProvider',
          });
        });

        logger.info('Redis cache initialized for onboarding assessment', {
          context: 'GcpVertexOnboardingAssessmentProvider.constructor',
        });
      } catch (error) {
        logger.error('Failed to initialize Redis', {
          error: error instanceof Error ? error.message : 'Unknown error',
          context: 'GcpVertexOnboardingAssessmentProvider.constructor',
        });
        this.redis = null;
      }
    } else {
      logger.info('Using local Map storage for onboarding assessment tasks', {
        context: 'GcpVertexOnboardingAssessmentProvider.constructor',
      });
    }

    logger.info('GCP Vertex AI Onboarding Assessment Provider initialized', {
      context: 'GcpVertexOnboardingAssessmentProvider.constructor',
      model: this.model,
      location: this.location,
      projectId: this.projectId,
    });
  }

  /**
   * Get a task from storage (Redis or Map)
   */
  private async getTask(taskId: string): Promise<IAiOnboardingAssessmentTask> {
    if (this.useRedisCache && this.redis) {
      const taskData = await this.redis.get(taskId);
      if (!taskData) {
        throw new AppError(
          `Assessment task not found with id ${taskId}`,
          404,
          ErrorCode.ONBOARDING_ASSESSMENT_TASK_NOT_FOUND
        );
      }
      return JSON.parse(taskData);
    } else {
      const task = this.tasks.get(taskId);
      if (!task) {
        throw new AppError(
          `Assessment task not found with id ${taskId}`,
          404,
          ErrorCode.ONBOARDING_ASSESSMENT_TASK_NOT_FOUND
        );
      }
      return task;
    }
  }

  /**
   * Set a task in storage (Redis or Map)
   */
  private async setTask(
    taskId: string,
    task: IAiOnboardingAssessmentTask
  ): Promise<void> {
    if (this.useRedisCache && this.redis) {
      try {
        await this.redis.set(
          taskId,
          JSON.stringify(task),
          'EX',
          this.taskCacheTTL
        );
      } catch (error) {
        logger.error('Failed to set task in Redis', {
          error: error instanceof Error ? error.message : 'Unknown error',
          taskId,
          context: 'GcpVertexOnboardingAssessmentProvider.setTask',
        });
        this.tasks.set(taskId, task);
      }
    } else {
      this.tasks.set(taskId, task);
    }
  }

  /**
   * Delete a task from storage (Redis or Map)
   */
  private async deleteTask(taskId: string): Promise<void> {
    if (this.useRedisCache && this.redis) {
      try {
        await this.redis.del(taskId);
      } catch (error) {
        logger.error('Failed to delete task from Redis', {
          error: error instanceof Error ? error.message : 'Unknown error',
          taskId,
          context: 'GcpVertexOnboardingAssessmentProvider.deleteTask',
        });
        this.tasks.delete(taskId);
      }
    } else {
      this.tasks.delete(taskId);
    }
  }

  /**
   * Check if a task exists in storage (Redis or Map)
   */
  private async taskExists(taskId: string): Promise<boolean> {
    if (this.useRedisCache && this.redis) {
      try {
        const exists = await this.redis.exists(taskId);
        return exists === 1;
      } catch (error) {
        logger.error('Failed to check task existence in Redis', {
          error: error instanceof Error ? error.message : 'Unknown error',
          taskId,
          context: 'GcpVertexOnboardingAssessmentProvider.taskExists',
        });
        return this.tasks.has(taskId);
      }
    } else {
      return this.tasks.has(taskId);
    }
  }

  /**
   * Initiates the onboarding assessment initialize job
   */
  async initializeAssessment(
    taskId: string,
    assessment: ICandidateOnboardingAssessment
  ): Promise<IAiOnboardingAssessmentTask> {
    logger.info({
      message: 'Initializing onboarding assessment',
      context: 'GcpVertexOnboardingAssessmentProvider.initializeAssessment',
      taskId,
    });
    // Check if task exists and is not in a terminal state
    const exists = await this.taskExists(taskId);

    logger.info({
      message: 'Found task',
      context: 'GcpVertexOnboardingAssessmentProvider.initializeAssessment',
      taskId,
      exists,
    });

    const task = exists
      ? await this.getTask(taskId)
      : {
          id: uuidv4(),
          taskId,
          status: OnboardingAssessmentTaskStatusEnum.PENDING,
          videoAnalysisStatus:
            OnboardingAssessmentVideoAnalysisStatusEnum.NOT_STARTED,
          assessment: assessment,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

    logger.info({
      message: 'Initialized task',
      context: 'GcpVertexOnboardingAssessmentProvider.initializeAssessment',
      taskId,
    });

    // update the task with the new values
    task.assessment = assessment;
    task.updatedAt = new Date();

    await this.setTask(taskId, task);

    logger.info({
      message: 'Task set',
      context: 'GcpVertexOnboardingAssessmentProvider.initializeAssessment',
      taskId,
    });

    // Start processing in the background
    await this.processInitializeTask(taskId);

    return task;
  }

  /**
   * Does the onboarding assessment
   */
  async doAssessment(taskId: string): Promise<IAiOnboardingAssessmentTask> {
    // Check if task exists and is not in a terminal state
    const exists = await this.taskExists(taskId);

    if (!exists) {
      const assessment =
        await this.prisma.onboarding_assessment_task.findUnique({
          where: { id: taskId },
          include: {
            assessment: true,
          },
        });

      if (!assessment || !assessment.assessment) {
        throw new AppError(
          `Assessment not found with id ${taskId}`,
          404,
          ErrorCode.ONBOARDING_ASSESSMENT_NOT_FOUND
        );
      }

      await this.setTask(taskId, {
        assessment: {
          ...assessment.assessment,
          status: OnboardingAssessmentStatusEnum.NOT_STARTED,
          sections: [],
          result: assessment.assessment
            .result as OnboardingAssessmentResultEnum,
          startedAt: assessment.assessment.startedAt || undefined,
          completedAt: assessment.assessment.completedAt || undefined,
          duration: assessment.assessment.duration || undefined,
          overallFeedback: assessment.assessment.overallFeedback || undefined,
          recommendation: assessment.assessment
            .recommendation as OnboardingAssessmentRecommendationEnum,
          videoAnalysisStatus: assessment.assessment
            .videoAnalysisStatus as OnboardingAssessmentVideoAnalysisStatusEnum,
          videoAnalysisError:
            assessment.assessment.videoAnalysisError || undefined,
          experienceSummary:
            assessment.assessment.experienceSummary || undefined,
          educationSummary: assessment.assessment.educationSummary || undefined,
          resumeText: assessment.assessment.resumeText || undefined,
          termsAcceptedAt: assessment.assessment.termsAcceptedAt || undefined,
        },
        taskId,
        status: OnboardingAssessmentTaskStatusEnum.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const task = await this.getTask(taskId);

    // update the task with the new values
    task.updatedAt = new Date();
    await this.setTask(taskId, task);

    // Start processing
    await this.processAssessmentTask(taskId);

    return task;
  }

  /**
   * Process the assessment video analysis
   */
  async doAssessmentVideoAnalysis(
    taskId: string
  ): Promise<IAiOnboardingAssessmentTask> {
    // Get task or create if it doesn't exist (for LiveKit video-only analysis)
    let task: IAiOnboardingAssessmentTask;
    try {
      task = await this.getTask(taskId);
    } catch (error) {
      // Task doesn't exist - this happens for LiveKit video-only analysis
      // We need to get the assessment data from the task ID (extract assessmentId)
      logger.warn({
        message:
          'Task not found for video analysis, will be initialized by service',
        context:
          'GcpVertexOnboardingAssessmentProvider.doAssessmentVideoAnalysis',
        taskId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error; // Re-throw so service layer can initialize it first
    }
    // Temp file for highlights video
    const tmpDir = path.join(os.tmpdir(), uuidv4(), 'video-analysis-final');
    const mergedVideoLocalFilePath = path.join(tmpDir, 'video.mp4');
    const highlightsVideoLocalFilePath = path.join(tmpDir, 'highlights.mp4');

    try {
      // Create temporary directories
      await mkdirAsync(tmpDir, { recursive: true });

      logger.info({
        message: 'Starting assessment video analysis processing',
        context:
          'GcpVertexOnboardingAssessmentProvider.processAssessmentVideoAnalysis',
        taskId,
        currentVideoAnalysisStatus: task.assessment.videoAnalysisStatus,
      });

      // Set video analysis status to in progress
      task.assessment.videoAnalysisStatus =
        OnboardingAssessmentVideoAnalysisStatusEnum.IN_PROGRESS;
      task.updatedAt = new Date();
      await this.setTask(taskId, task);

      logger.info({
        message: 'Video analysis status set to IN_PROGRESS',
        context:
          'GcpVertexOnboardingAssessmentProvider.processAssessmentVideoAnalysis',
        taskId,
      });

      // Merge video chunks or download complete video
      logger.info({
        message: 'Starting video chunks merge',
        context:
          'GcpVertexOnboardingAssessmentProvider.processAssessmentVideoAnalysis',
        taskId,
      });

      const actualVideoFilename = await this.mergeVideoChunks1(
        taskId,
        task,
        mergedVideoLocalFilePath
      );

      logger.info({
        message: 'Video chunks merged successfully',
        context:
          'GcpVertexOnboardingAssessmentProvider.processAssessmentVideoAnalysis',
        taskId,
        actualVideoFilename,
      });

      // Update the video analysis
      logger.info({
        message: 'Starting video analysis update',
        context:
          'GcpVertexOnboardingAssessmentProvider.processAssessmentVideoAnalysis',
        taskId,
      });

      await this.doVideoAnalysis(
        taskId,
        task,
        mergedVideoLocalFilePath,
        highlightsVideoLocalFilePath,
        actualVideoFilename
      );

      logger.info({
        message: 'Video analysis updated successfully',
        context:
          'GcpVertexOnboardingAssessmentProvider.processAssessmentVideoAnalysis',
        taskId,
      });

      // Update video analysis status to completed
      task.assessment.videoAnalysisStatus =
        OnboardingAssessmentVideoAnalysisStatusEnum.COMPLETED;
      task.updatedAt = new Date();
      await this.setTask(taskId, task);

      logger.info({
        message: 'Assessment video analysis processing completed successfully',
        context:
          'GcpVertexOnboardingAssessmentProvider.processAssessmentVideoAnalysis',
        taskId,
      });

      return task;
    } catch (error) {
      logger.error({
        message: 'Error during assessment video analysis processing',
        context:
          'GcpVertexOnboardingAssessmentProvider.processAssessmentVideoAnalysis',
        taskId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Update video analysis status to failed
      task.assessment.videoAnalysisStatus =
        OnboardingAssessmentVideoAnalysisStatusEnum.FAILED;
      task.assessment.videoAnalysisError =
        error instanceof Error ? error.message : 'Unknown error';
      task.updatedAt = new Date();
      await this.setTask(taskId, task);

      // Re-throw the error to maintain existing error handling behavior
      throw error;
    } finally {
      if (fs.existsSync(tmpDir)) {
        logger.info({
          message: 'Cleaning up temp files',
          context:
            'GcpVertexOnboardingAssessmentProvider.processAssessmentVideoAnalysis',
          taskId,
          tmpDir,
        });
        // Clean up temp files
        await fs.promises.rm(tmpDir, { recursive: true, force: true });
      }
    }
  }

  /**
   * Gets the status of an assessment task
   */
  async getOnboardingAssessmentTask(
    taskId: string
  ): Promise<IAiOnboardingAssessmentTask> {
    logger.info({
      message: 'Getting onboarding assessment task',
      context:
        'GcpVertexOnboardingAssessmentProvider.getOnboardingAssessmentTask',
      taskId,
    });
    return await this.getTask(taskId);
  }

  /**
   * Gets the next question for the onboarding assessment
   */
  async getNextQuestion(
    taskId: string,
    previousQuestionWithAnswer?: ICandidateOnboardingAssessmentQuestion
  ): Promise<ICandidateOnboardingAssessmentAnswerSubmitted> {
    logger.info({
      message: 'Getting next question',
      context: 'GcpVertexOnboardingAssessmentProvider.getNextQuestion',
      taskId,
      previousQuestionWithAnswer,
    });

    const task = await this.getTask(taskId);
    const assessment = task.assessment;
    const maxQuestionsPerSection =
      assessment.onboardingAssessmentSettings?.maxQuestionsPerSection ?? 5;

    let isAssessmentFirstQuestion = false;
    let isAssessmentLastQuestion = false;
    let isLastSection = false;
    let isSectionFirstQuestion = false;
    let isSectionLastQuestion = false;
    let currentSection:
      | ICandidateOnboardingAssessmentSection
      | null
      | undefined = null;
    let sectionToGenerateQuestion:
      | ICandidateOnboardingAssessmentSection
      | undefined = undefined;

    if (assessment.sections.length <= 0) {
      throw new AppError(
        'No sections found in assessment',
        404,
        ErrorCode.ONBOARDING_ASSESSMENT_SECTION_NOT_FOUND
      );
    }

    // Logic to get the section to generate the question and the flags
    if (!previousQuestionWithAnswer) {
      isAssessmentFirstQuestion = isSectionFirstQuestion = true;
      sectionToGenerateQuestion = assessment.sections[0];

      logger.info({
        message: 'First question of assessment',
        context: 'GcpVertexOnboardingAssessmentProvider.getNextQuestion',
        taskId,
        sectionOrder: 0,
        sectionId: sectionToGenerateQuestion.id,
      });
    } else {
      // Save the answer for the previous question
      assessment.sections.forEach((section) => {
        section.questions.forEach((question) => {
          if (question.id === previousQuestionWithAnswer.id) {
            question.answerGiven = previousQuestionWithAnswer.answerGiven;
          }
        });
      });

      // Get the current section
      currentSection = assessment.sections.find(
        (section) => section.id === previousQuestionWithAnswer.sectionId
      );
      if (!currentSection) {
        throw new AppError(
          'Current section not found when generating next question',
          404,
          ErrorCode.ONBOARDING_ASSESSMENT_SECTION_NOT_FOUND
        );
      }

      // ⚠️ CRITICAL: Count ANSWERED questions, not total questions in DB
      const currentSectionQuestionCount = currentSection.questions.filter(
        (q) => q.isAnswered
      ).length;

      logger.info({
        message: 'Analyzing section navigation',
        context: 'GcpVertexOnboardingAssessmentProvider.getNextQuestion',
        taskId,
        currentSectionOrder: currentSection.order,
        previousQuestionOrder: previousQuestionWithAnswer.order,
        currentSectionQuestionCount,
        totalQuestionsInSection: currentSection.questions.length,
        maxQuestionsPerSection,
        totalSections: assessment.sections.length,
        previousQuestionIsLastQuestion:
          previousQuestionWithAnswer.isLastQuestion,
      });

      // Check if the current section is the last section
      if (currentSection.order === assessment.sections.length - 1) {
        isLastSection = true;

        // ✅ FIX: Check if previous question was marked as last OR question count reached
        // We should check if we've already reached max questions in the last section
        // OR if the previous question was explicitly marked as isLastQuestion
        if (
          currentSectionQuestionCount >= maxQuestionsPerSection ||
          previousQuestionWithAnswer.isLastQuestion === true
        ) {
          // We just answered the very last question of the last section
          isAssessmentLastQuestion = true;
          isSectionLastQuestion = true;

          logger.info({
            message: '✅ Last question of last section answered',
            context: 'GcpVertexOnboardingAssessmentProvider.getNextQuestion',
            taskId,
            sectionOrder: currentSection.order,
            questionOrder: previousQuestionWithAnswer.order,
            currentSectionQuestionCount,
            maxQuestionsPerSection,
            wasMarkedAsLastQuestion: previousQuestionWithAnswer.isLastQuestion,
          });
        } else if (
          previousQuestionWithAnswer.order ===
          maxQuestionsPerSection - 2
        ) {
          // Next question will be the last question of the last section
          isSectionLastQuestion = true;

          logger.info({
            message: '⚠️ Next question will be last of last section',
            context: 'GcpVertexOnboardingAssessmentProvider.getNextQuestion',
            taskId,
            sectionOrder: currentSection.order,
            questionOrder: previousQuestionWithAnswer.order,
          });
        }

        sectionToGenerateQuestion = currentSection;
      } else {
        // Not the last section - check if we need to move to next section

        // ✅ FIX: Check if previous question was marked as last OR question count reached
        // We should move to next section if we've reached max questions OR
        // if the previous question was explicitly marked as isLastQuestion
        if (
          currentSectionQuestionCount >= maxQuestionsPerSection ||
          previousQuestionWithAnswer.isLastQuestion === true
        ) {
          // We completed this section, move to next section
          isSectionFirstQuestion = true;
          isSectionLastQuestion = false;
          sectionToGenerateQuestion =
            assessment.sections[currentSection.order + 1];

          logger.info({
            message: '🎯 Section completed, moving to next section',
            context: 'GcpVertexOnboardingAssessmentProvider.getNextQuestion',
            taskId,
            completedSectionOrder: currentSection.order,
            completedSectionId: currentSection.id,
            nextSectionOrder: sectionToGenerateQuestion.order,
            nextSectionId: sectionToGenerateQuestion.id,
            nextSectionTitle: sectionToGenerateQuestion.title,
            currentSectionQuestionCount,
            maxQuestionsPerSection,
            wasMarkedAsLastQuestion: previousQuestionWithAnswer.isLastQuestion,
          });
        } else if (
          previousQuestionWithAnswer.order ===
          maxQuestionsPerSection - 2
        ) {
          // Next question will be the last question of this section
          isSectionLastQuestion = true;
          sectionToGenerateQuestion = currentSection;

          logger.info({
            message: '⚠️ Next question will be last of current section',
            context: 'GcpVertexOnboardingAssessmentProvider.getNextQuestion',
            taskId,
            sectionOrder: currentSection.order,
            questionOrder: previousQuestionWithAnswer.order,
          });
        } else {
          // Continue with questions in the current section
          sectionToGenerateQuestion = currentSection;

          logger.info({
            message: 'Continuing with current section',
            context: 'GcpVertexOnboardingAssessmentProvider.getNextQuestion',
            taskId,
            sectionOrder: currentSection.order,
            questionOrder: previousQuestionWithAnswer.order,
          });
        }
      }
    }

    logger.info({
      message: 'Section to generate question',
      context: 'GcpVertexOnboardingAssessmentProvider.getNextQuestion',
      taskId,
      currentSection,
      sectionToGenerateQuestion,
      isAssessmentFirstQuestion,
      isAssessmentLastQuestion,
      isSectionFirstQuestion,
      isSectionLastQuestion,
      isLastSection,
    });

    if (!sectionToGenerateQuestion) {
      throw new AppError(
        'Section to generate question not found',
        404,
        ErrorCode.ONBOARDING_ASSESSMENT_SECTION_NOT_FOUND
      );
    }

    // Generate next question for current section
    const { nextQuestion, shouldEndAssessment } = await this.generateQuestion(
      taskId,
      previousQuestionWithAnswer,
      isAssessmentFirstQuestion,
      isAssessmentLastQuestion,
      isSectionFirstQuestion,
      isSectionLastQuestion,
      isLastSection,
      sectionToGenerateQuestion,
      maxQuestionsPerSection
    );
    nextQuestion.order = sectionToGenerateQuestion?.questions.length ?? 0;
    sectionToGenerateQuestion?.questions.push(nextQuestion);

    // update the task with the new values
    task.assessment = assessment;
    task.updatedAt = new Date();
    await this.setTask(taskId, task);

    return {
      nextQuestion,
      shouldEndAssessment,
    };
  }

  /**
   * Saves the answer for the onboarding assessment question
   */
  async saveAnswer(
    taskId: string,
    question: ICandidateOnboardingAssessmentQuestion
  ): Promise<ICandidateOnboardingAssessmentQuestion> {
    const task = await this.getTask(taskId);
    const assessment = task.assessment;

    // Find the section containing the question
    const section = assessment.sections.find(
      (section) => section.id === question.sectionId
    );
    if (!section) {
      throw new AppError(
        'Section not found',
        404,
        ErrorCode.ONBOARDING_ASSESSMENT_SECTION_NOT_FOUND
      );
    }

    // Find and update the question
    const questionIndex = section.questions.findIndex(
      (q) => q.id === question.id
    );
    if (questionIndex === -1) {
      throw new AppError(
        'Question not found',
        404,
        ErrorCode.ONBOARDING_ASSESSMENT_QUESTION_NOT_FOUND
      );
    }

    section.questions[questionIndex] = question;
    assessment.updatedAt = new Date();

    return question;
  }

  private attemptJsonReconstruction(text: string, context: string): string {
    logger.info(`Attempting JSON reconstruction for ${context}`, {
      textLength: text.length,
      context: `GcpVertexOnboardingAssessmentProvider.${context}`,
    });

    // Try to extract and reconstruct key-value pairs
    try {
      // Look for patterns that suggest this should be an object
      if (text.includes('"') && (text.includes(':') || text.includes('='))) {
        // Extract all quoted strings that look like keys and values
        const keyValuePairs: string[] = [];

        // Match patterns like "key": "value" or "key": number or "key": boolean
        const kvMatches = text.match(
          /"[^"]*"\s*:\s*(?:"[^"]*"|\d+(?:\.\d+)?|true|false|null|\[[^\]]*\]|\{[^}]*\})/g
        );
        if (kvMatches) {
          keyValuePairs.push(...kvMatches);
        }

        // Match array patterns like "key": [...]
        const arrayMatches = text.match(/"[^"]*"\s*:\s*\[[^\]]*\]/g);
        if (arrayMatches) {
          keyValuePairs.push(...arrayMatches);
        }

        // Match object patterns like "key": {...}
        const objectMatches = text.match(/"[^"]*"\s*:\s*\{[^}]*\}/g);
        if (objectMatches) {
          keyValuePairs.push(...objectMatches);
        }

        if (keyValuePairs.length > 0) {
          const reconstructed = `{${keyValuePairs.join(', ')}}`;
          logger.info(
            `JSON reconstruction attempt: found ${keyValuePairs.length} key-value pairs`
          );

          // Test if the reconstruction is valid
          JSON.parse(reconstructed);
          return reconstructed;
        }
      }

      // Try to extract arrays
      if (text.includes('[') && text.includes(']')) {
        const arrayMatch = text.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          const arrayCandidate = arrayMatch[0];
          JSON.parse(arrayCandidate);
          return arrayCandidate;
        }
      }

      // If we can't reconstruct, return minimal valid JSON based on context
      if (context.includes('section')) {
        return '[]'; // Return empty array for sections
      } else if (context.includes('video') || context.includes('assessment')) {
        return '{}'; // Return empty object for other contexts
      }

      return '{}'; // Default fallback
    } catch (reconstructionError) {
      logger.error(`JSON reconstruction failed for ${context}`, {
        error:
          reconstructionError instanceof Error
            ? reconstructionError.message
            : 'Unknown error',
        context: `GcpVertexOnboardingAssessmentProvider.${context}`,
      });

      // Return minimal valid JSON as last resort
      return context.includes('section') ? '[]' : '{}';
    }
  }

  private cleanJsonResponse(text: string): string {
    try {
      // First try parsing as is - if it's already valid JSON, return it
      JSON.parse(text);
      return text;
    } catch (initialError) {
      logger.info('Initial JSON parse failed, attempting cleanup', {
        error:
          initialError instanceof Error
            ? initialError.message
            : 'Unknown error',
        textLength: text.length,
        textPreview: text.substring(0, 200),
      });

      // If not valid JSON, try cleaning it
      let cleaned = text
        // Remove markdown code block formatting
        .replace(/```(?:json)?\n?|\n?```/g, '')
        // Remove any leading/trailing whitespace
        .trim()
        // Remove any leading/trailing quotes
        .replace(/^["']|["']$/g, '')
        // Remove any BOM characters
        .replace(/^\uFEFF/, '')
        // Remove any non-JSON text before the first { or [
        .replace(/^[^{[]*([{[])/, '$1')
        // Remove any non-JSON text after the last } or ]
        .replace(/([}\]])[^}\]]*$/, '$1');

      // Additional cleaning for common AI model JSON issues
      cleaned = cleaned
        // First pass: normalize whitespace while preserving decimal numbers
        .replace(/(\d+)\s*\.\s*(\d+)/g, '$1.$2') // Fix split decimal numbers like "0. 58" -> "0.58"
        // Fix specific case where decimal values get split like "0.5, 8" -> "0.58"
        .replace(/(\d+\.\d+),\s*(\d+)/g, (match, p1, p2) => {
          // Only combine if it makes sense as a decimal (e.g., 0.5, 8 -> 0.58)
          const combined = p1 + p2;
          const decimal = parseFloat(combined);
          if (decimal <= 1.0 && p2.length <= 2) {
            return combined;
          }
          return match; // Keep original if it doesn't make sense
        })
        // Fix missing commas between array elements - look for patterns like }\n{, ]\n[, etc.
        .replace(/}\s*\n\s*{/g, '},\n{')
        .replace(/]\s*\n\s*\[/g, '],\n[')
        // Fix missing commas after closing brackets/braces followed by quotes
        .replace(/}\s*"/g, '},"')
        .replace(/]\s*"/g, '],"')
        // Fix missing commas after numbers followed by quotes or braces
        .replace(/(\d)\s*"/g, '$1,"')
        .replace(/(\d)\s*{/g, '$1,{')
        .replace(/(\d)\s*\[/g, '$1,[')
        // Fix missing commas after strings followed by quotes or braces
        .replace(/"\s*"/g, '","')
        .replace(/"\s*{/g, '",{')
        .replace(/"\s*\[/g, '",[')
        // Fix missing commas after boolean values
        .replace(/(true|false)\s*"/g, '$1,"')
        .replace(/(true|false)\s*{/g, '$1,{')
        .replace(/(true|false)\s*\[/g, '$1,[')
        // Fix missing commas after null values
        .replace(/null\s*"/g, 'null,"')
        .replace(/null\s*{/g, 'null,{')
        .replace(/null\s*\[/g, 'null,[')
        // Fix array elements that are missing commas (more conservative)
        .replace(/("\w+")\s+(")/g, '$1, $2')
        // Fix missing commas between object properties
        .replace(/"\s*\w+\s*:/g, (match) => {
          // Don't add comma if this is the first property (preceded by {)
          return match;
        })
        // Fix object properties that are missing commas
        .replace(/"\s*([^,}\]]+)\s*"/g, '"$1"')
        // Fix trailing commas in arrays and objects
        .replace(/,\s*]/g, ']')
        .replace(/,\s*}/g, '}')
        // Remove orphaned values that break JSON structure
        .replace(/,\s*\d+(?:\.\d+)?\s*,/g, ',') // Remove standalone numbers between commas
        .replace(/{\s*\d+(?:\.\d+)?\s*,/g, '{') // Remove standalone numbers after opening brace
        .replace(/,\s*\d+(?:\.\d+)?\s*}/g, '}') // Remove standalone numbers before closing brace
        .replace(/,\s*\d+(?:\.\d+)?\s*]/g, ']') // Remove standalone numbers before closing bracket
        // Remove orphaned words/identifiers without quotes
        .replace(/,\s*[a-zA-Z_]\w*\s*,/g, ',') // Remove standalone identifiers between commas
        .replace(/{\s*[a-zA-Z_]\w*\s*,/g, '{') // Remove standalone identifiers after opening brace
        .replace(/,\s*[a-zA-Z_]\w*\s*}/g, '}') // Remove standalone identifiers before closing brace
        // Fix double commas (after cleanup)
        .replace(/,,+/g, ',')
        // Fix spaces around colons in objects
        .replace(/"\s*:\s*/g, '": ')
        // Fix newlines and extra spaces that break JSON structure
        .replace(/\n\s*/g, ' ')
        .replace(/\s+/g, ' ');

      try {
        // Try parsing the cleaned text to validate it
        JSON.parse(cleaned);
        logger.info('JSON cleanup successful', {
          originalLength: text.length,
          cleanedLength: cleaned.length,
          cleanedPreview: cleaned.substring(0, 100),
        });
        return cleaned;
      } catch (cleanupError) {
        logger.error('JSON cleanup failed, attempting advanced repair', {
          cleanupError:
            cleanupError instanceof Error
              ? cleanupError.message
              : 'Unknown error',
          cleanedPreview: cleaned.substring(0, 200),
        });

        // Last resort: try to extract valid JSON from the response
        const jsonMatches = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (jsonMatches && jsonMatches[0]) {
          const extracted = jsonMatches[0];
          try {
            JSON.parse(extracted);
            logger.info('JSON extraction successful');
            return extracted;
          } catch (extractError) {
            logger.error('JSON extraction failed', {
              extractError:
                extractError instanceof Error
                  ? extractError.message
                  : 'Unknown error',
            });
          }
        }

        // If all else fails, return the cleaned version and let the calling code handle the error
        return cleaned;
      }
    }
  }

  private async parseLLMResponse(response: any, context: string): Promise<any> {
    if (!response.candidates?.[0]?.content?.parts?.[0]?.text) {
      logger.error('Invalid response structure from Vertex AI', {
        context: `GcpVertexOnboardingAssessmentProvider.${context}`,
        hasResponse: !!response,
        hasCandidates: !!response?.candidates,
        candidatesLength: response?.candidates?.length || 0,
        hasContent: !!response?.candidates?.[0]?.content,
        hasParts: !!response?.candidates?.[0]?.content?.parts,
        partsLength: response?.candidates?.[0]?.content?.parts?.length || 0,
      });
      throw new Error('Invalid response from Vertex AI');
    }

    const originalText = response.candidates[0].content.parts[0].text;

    logger.info(`Attempting to parse ${context} response`, {
      context: `GcpVertexOnboardingAssessmentProvider.${context}`,
      responseLength: originalText.length,
      responsePreview: originalText.substring(0, 300),
      responseSuffix:
        originalText.length > 300
          ? originalText.substring(originalText.length - 100)
          : '',
    });

    try {
      // Use specialized JSON parsing retry for better resilience
      const parsedData = await this.retryJsonParsing(
        () => {
          const cleanedResponse = this.cleanJsonResponse(originalText);
          return JSON.parse(cleanedResponse);
        },
        `JSON parsing for ${context}`,
        'parse-' + Date.now()
      );

      logger.info(`Successfully parsed ${context} response`, {
        context: `GcpVertexOnboardingAssessmentProvider.${context}`,
        originalLength: originalText.length,
        dataType: typeof parsedData,
        isArray: Array.isArray(parsedData),
        objectKeys:
          typeof parsedData === 'object' && !Array.isArray(parsedData)
            ? Object.keys(parsedData).length
            : null,
      });

      return parsedData;
    } catch (parseError) {
      const errorMessage =
        parseError instanceof Error ? parseError.message : 'Unknown error';
      const errorPosition = errorMessage.match(/at position (\d+)/);
      const position = errorPosition ? parseInt(errorPosition[1]) : null;

      logger.error(`Failed to parse ${context} data`, {
        context: `GcpVertexOnboardingAssessmentProvider.${context}`,
        error: errorMessage,
        errorPosition: position,
        responseLength: originalText.length,
        responsePreview: originalText.substring(0, 500),
        // Show text around error position if available
        errorContext: position
          ? {
              before: originalText.substring(
                Math.max(0, position - 50),
                position
              ),
              at: originalText.substring(position, position + 10),
              after: originalText.substring(position + 10, position + 60),
            }
          : null,
        responseSuffix:
          originalText.length > 500
            ? originalText.substring(originalText.length - 200)
            : '',
      });

      // Try one more time with a different approach - remove everything except JSON structure
      try {
        logger.info(`Attempting emergency JSON recovery for ${context}`);

        // Find the main JSON object or array boundaries
        const jsonStart =
          originalText.indexOf('{') !== -1
            ? originalText.indexOf('{')
            : originalText.indexOf('[');
        const jsonEnd =
          originalText.lastIndexOf('}') !== -1
            ? originalText.lastIndexOf('}') + 1
            : originalText.lastIndexOf(']') + 1;

        if (jsonStart !== -1 && jsonEnd > jsonStart) {
          const extractedJson = originalText.substring(jsonStart, jsonEnd);
          const emergencyParsed = JSON.parse(extractedJson);

          logger.info(`Emergency JSON recovery successful for ${context}`, {
            context: `GcpVertexOnboardingAssessmentProvider.${context}`,
            extractedLength: extractedJson.length,
            jsonStart,
            jsonEnd,
          });

          return emergencyParsed;
        }
      } catch (emergencyError) {
        logger.error(`Emergency JSON recovery failed for ${context}`, {
          context: `GcpVertexOnboardingAssessmentProvider.${context}`,
          emergencyError:
            emergencyError instanceof Error
              ? emergencyError.message
              : 'Unknown error',
        });
      }

      // Final attempt: try JSON reconstruction
      try {
        logger.info(`Attempting final JSON reconstruction for ${context}`);
        const reconstructedJson = this.attemptJsonReconstruction(
          originalText,
          context
        );
        const reconstructedParsed = JSON.parse(reconstructedJson);

        logger.warn(
          `JSON reconstruction successful for ${context} - using fallback data`,
          {
            context: `GcpVertexOnboardingAssessmentProvider.${context}`,
            reconstructedLength: reconstructedJson.length,
          }
        );

        return reconstructedParsed;
      } catch (reconstructionError) {
        logger.error(`JSON reconstruction failed for ${context}`, {
          context: `GcpVertexOnboardingAssessmentProvider.${context}`,
          reconstructionError:
            reconstructionError instanceof Error
              ? reconstructionError.message
              : 'Unknown error',
        });
      }

      throw new Error(`Invalid JSON response from ${context}: ${errorMessage}`);
    }
  }

  /**
   * Process the onboarding assessment initialize task
   */
  private async processInitializeTask(taskId: string): Promise<void> {
    logger.info({
      message: 'Processing onboarding assessment initialize task',
      context: 'GcpVertexOnboardingAssessmentProvider.processInitializeTask',
      taskId,
    });

    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error(
        `Onboarding assessment initialize task not found with id ${taskId}`
      );
    }

    logger.info({
      message: 'Processing onboarding assessment initialize task',
      context: 'GcpVertexOnboardingAssessmentProvider.processInitializeTask',
      taskId,
      task,
    });

    try {
      // Update task status to processing
      task.status = OnboardingAssessmentTaskStatusEnum.INITIALIZE_STARTED;
      task.updatedAt = new Date();
      task.assessment.status =
        OnboardingAssessmentStatusEnum.AI_INITIALIZATION_IN_PROGRESS;
      await this.setTask(taskId, task);

      // Get the assessment settings
      const settings = task.assessment.onboardingAssessmentSettings;
      if (!settings) {
        throw new Error('Assessment settings not found');
      }

      logger.info({
        message: 'Assessment settings found',
        context: 'GcpVertexOnboardingAssessmentProvider.processInitializeTask',
        taskId,
        settings,
      });

      // Get the model
      const generativeModel = this.vertexAI.preview.getGenerativeModel({
        model: `projects/${this.projectId}/locations/${this.location}/publishers/google/models/${this.model}`,
      });

      // Prepare the prompt for section generation
      const prompt =
        GcpVertexOnboardingAssessmentPromptGenerator.generateSectionGenerationPrompt(
          settings.requiredSections,
          task.assessment.resumeText ?? '',
          settings.maxSections
        );

      logger.info({
        message: 'Generating sections',
        context: 'GcpVertexOnboardingAssessmentProvider.processInitializeTask',
        taskId,
        prompt,
      });

      // Generate content
      const result = await generativeModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      logger.info({
        message: 'Sections generated',
        context: 'GcpVertexOnboardingAssessmentProvider.processInitializeTask',
        taskId,
        result,
      });

      // Parse and validate the response with retry mechanism
      const sections = await this.retryWithDelay(
        () => this.parseLLMResponse(result.response, 'section generation'),
        'parseLLMResponse (section generation)',
        taskId
      );

      logger.info({
        message: 'Sections parsed',
        context: 'GcpVertexOnboardingAssessmentProvider.processInitializeTask',
        taskId,
        sections,
      });

      // Validate each section
      const validatedSections = sections.map((section: any, index: number) => {
        const validatedSection = SectionSchema.parse(section);
        return {
          id: uuidv4(),
          assessmentId: task.assessment.id,
          title: validatedSection.title,
          description: validatedSection.description,
          type: validatedSection.type,
          status: OnboardingAssessmentSectionStatusEnum.NOT_STARTED,
          result: OnboardingAssessmentSectionResultEnum.NOT_AVAILABLE,
          score: 0,
          order: index,
          isRequired: true,
          passThreshold: validatedSection.passThreshold,
          strengths: [],
          areasForImprovement: [],
          questions: [],
        };
      });

      logger.info({
        message: 'Sections validated',
        context: 'GcpVertexOnboardingAssessmentProvider.processInitializeTask',
        taskId,
        validatedSections,
      });

      // Update the assessment with generated sections
      task.assessment.sections = validatedSections;
      task.assessment.status =
        OnboardingAssessmentStatusEnum.AI_INITIALIZATION_COMPLETED;
      task.assessment.updatedAt = new Date();

      // Update task status to completed
      task.status = OnboardingAssessmentTaskStatusEnum.INITIALIZE_COMPLETED;
      task.updatedAt = new Date();
      await this.setTask(taskId, task);

      logger.info({
        message: 'Onboarding assessment initialized',
        context: 'GcpVertexOnboardingAssessmentProvider.processInitializeTask',
        taskId,
        task,
      });
    } catch (error) {
      logger.error({
        message: 'Error processing onboarding assessment initialize task',
        context: 'GcpVertexOnboardingAssessmentProvider.processInitializeTask',
        taskId,
        error,
      });

      // Update task status to failed
      task.status = OnboardingAssessmentTaskStatusEnum.COMPLETED;
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.updatedAt = new Date();
      await this.setTask(taskId, task);

      throw error;
    }
  }

  /**
   * Merge video chunks into a single file and keep local copy for highlights generation
   * OR download complete video if already exists (e.g., from LiveKit)
   * Returns the actual video filename used
   */
  private async mergeVideoChunks1(
    taskId: string,
    task: IAiOnboardingAssessmentTask,
    mergedVideoLocalFilePath: string
  ): Promise<string> {
    const { folderPath: videoChunksFolder } =
      getBucketFolderPathToCandidateOnboardingAssessmentVideo(
        task.assessment.candidateId,
        task.assessment.id
      );

    if (!videoChunksFolder) {
      logger.warn({
        message: 'No video folder found for merging',
        context: 'GcpVertexOnboardingAssessmentProvider.mergeVideoChunks',
        taskId,
      });
      throw new Error('No video folder found for merging');
    }

    // Retry logic for waiting for LiveKit Egress file upload to complete
    const initialDelayMs = 30000; // 30 seconds initial delay
    const maxRetries = 100;
    const retryDelayMs = 5000; // 5 seconds between retries
    let lastError: Error | null = null;

    // Initial delay to give LiveKit Egress time to upload the file to GCP
    logger.info({
      message: `⏳ Waiting ${initialDelayMs / 1000}s before checking for video files (allows LiveKit Egress upload to complete)`,
      context: 'GcpVertexOnboardingAssessmentProvider.mergeVideoChunks',
      taskId,
      videoChunksFolder,
      assessmentId: task.assessment.id,
      candidateId: task.assessment.candidateId,
      initialDelaySeconds: initialDelayMs / 1000,
    });
    await new Promise((resolve) => setTimeout(resolve, initialDelayMs));

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info({
          message: `🔍 Checking for video files in storage (Attempt ${attempt}/${maxRetries})`,
          context: 'GcpVertexOnboardingAssessmentProvider.mergeVideoChunks',
          taskId,
          videoChunksFolder,
          assessmentId: task.assessment.id,
          candidateId: task.assessment.candidateId,
          attempt,
        });

        // First, check if there's a complete video file (from LiveKit or previously merged)
        const completeVideoFiles =
          await this.storageProvider.listFiles(videoChunksFolder);

        logger.info({
          message: '📁 Files found in storage folder',
          context: 'GcpVertexOnboardingAssessmentProvider.mergeVideoChunks',
          taskId,
          videoChunksFolder,
          fileCount: completeVideoFiles.length,
          attempt,
          files: completeVideoFiles.map((f) => ({
            name: f.name,
            size: f.size,
            created: f.created,
            url: f.url?.substring(0, 100) + '...', // Truncate URL for readability
          })),
        });

        // Look for complete video files (LiveKit MP4s or merged WebM)
        const liveKitVideo = completeVideoFiles.find(
          (file) => file.name.includes('livekit-') && file.name.endsWith('.mp4')
        );
        const mergedWebm = completeVideoFiles.find(
          (file) =>
            file.name.includes('video.mp4') || file.name.includes('video.webm')
        );

        logger.info({
          message: '🔎 Searching for complete video files',
          context: 'GcpVertexOnboardingAssessmentProvider.mergeVideoChunks',
          taskId,
          attempt,
          liveKitVideoFound: !!liveKitVideo,
          liveKitVideoName: liveKitVideo?.name,
          liveKitVideoSize: liveKitVideo?.size,
          mergedWebmFound: !!mergedWebm,
          mergedWebmName: mergedWebm?.name,
        });

        const completeVideoFile = liveKitVideo?.name || mergedWebm?.name;

        if (completeVideoFile) {
          // Complete video exists - download it directly
          // Note: completeVideoFile from listFiles() already contains the full path
          // Extract just the filename from the full path for return value
          const filename =
            completeVideoFile.split('/').pop() || completeVideoFile;

          logger.info({
            message: '✅ Complete video found, downloading directly',
            context: 'GcpVertexOnboardingAssessmentProvider.mergeVideoChunks',
            taskId,
            completeVideoFile,
            filename,
            type: liveKitVideo
              ? 'LiveKit Egress Recording (MP4)'
              : 'Merged WebM',
            fullPath: completeVideoFile,
            attemptNumber: attempt,
          });

          const downloadStartTime = Date.now();
          // Use completeVideoFile directly - it already contains the full path from listFiles()
          const videoBuffer =
            await this.storageProvider.downloadFile(completeVideoFile);
          const downloadDuration = Date.now() - downloadStartTime;

          logger.info({
            message: '⬇️ Video downloaded from storage',
            context: 'GcpVertexOnboardingAssessmentProvider.mergeVideoChunks',
            taskId,
            bufferSize: videoBuffer.length,
            downloadDurationMs: downloadDuration,
            downloadDurationSec: (downloadDuration / 1000).toFixed(2),
          });

          await fs.promises.writeFile(mergedVideoLocalFilePath, videoBuffer);

          logger.info({
            message: '💾 Complete video saved to local disk successfully',
            context: 'GcpVertexOnboardingAssessmentProvider.mergeVideoChunks',
            taskId,
            localPath: mergedVideoLocalFilePath,
            fileSize: videoBuffer.length,
            fileSizeMB: (videoBuffer.length / (1024 * 1024)).toFixed(2),
            actualVideoFile: filename,
            totalAttempts: attempt,
          });

          task.assessment.updatedAt = new Date();
          await this.setTask(taskId, task);

          // Return just the filename (not full path) for use in videoUrl construction
          return filename;
        }

        // Check if there are any video chunk files (old upload method)
        const videoChunkFiles = completeVideoFiles.filter(
          (file) =>
            (file.name.endsWith('.webm') || file.name.endsWith('.mp4')) &&
            !file.name.includes('livekit-') &&
            !file.name.includes('video.webm') &&
            !file.name.includes('video.mp4')
        );

        if (videoChunkFiles.length > 0) {
          // We have video chunks - merge them
          logger.info({
            message: '🔢 Found video chunks, proceeding with merge',
            context: 'GcpVertexOnboardingAssessmentProvider.mergeVideoChunks',
            taskId,
            chunkCount: videoChunkFiles.length,
            chunkFiles: videoChunkFiles.map((f) => f.name),
          });

          await mergeVideoChunks(
            this.storageProvider,
            videoChunksFolder,
            mergedVideoLocalFilePath
          );

          // Upload the merged file
          const mergedFileBuffer = await fs.promises.readFile(
            mergedVideoLocalFilePath
          );
          const mergedFileUrl = await this.storageProvider.uploadFile(
            mergedFileBuffer,
            `${videoChunksFolder}/video.webm`
          );

          logger.info({
            message: 'Video chunks merged successfully',
            context: 'GcpVertexOnboardingAssessmentProvider.mergeVideoChunks',
            taskId,
            mergedFileUrl,
            mergedVideoLocalFilePath,
          });

          task.assessment.updatedAt = new Date();
          await this.setTask(taskId, task);

          // Return the merged filename
          return 'video.webm';
        }

        // No video files found yet - might be upload in progress
        if (attempt < maxRetries) {
          logger.warn({
            message: `⏳ No video files found yet, waiting ${retryDelayMs}ms before retry (Attempt ${attempt}/${maxRetries})`,
            context: 'GcpVertexOnboardingAssessmentProvider.mergeVideoChunks',
            taskId,
            assessmentId: task.assessment.id,
            videoChunksFolder,
            availableFilesCount: completeVideoFiles.length,
            filesInFolder: completeVideoFiles.map((f) => f.name),
            nextRetryIn: `${retryDelayMs}ms`,
          });

          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
          continue;
        }

        // Last attempt failed
        const errorMessage = `❌ No video files found in folder after ${maxRetries} attempts. Expected LiveKit recording (livekit-*.mp4) or video chunks. Folder: ${videoChunksFolder}`;
        lastError = new Error(errorMessage);
        logger.error({
          message: errorMessage,
          context: 'GcpVertexOnboardingAssessmentProvider.mergeVideoChunks',
          taskId,
          assessmentId: task.assessment.id,
          videoChunksFolder,
          totalFilesInFolder: completeVideoFiles.length,
          totalAttempts: maxRetries,
          totalWaitTimeSeconds: (maxRetries * retryDelayMs) / 1000,
          availableFiles: completeVideoFiles.map((f) => ({
            name: f.name,
            size: f.size,
            created: f.created,
          })),
          troubleshooting: {
            possibleReasons: [
              'LiveKit egress recording failed or was cancelled',
              'File upload to GCP storage failed (check egress logs)',
              'Wrong folder path - verify candidateId and assessmentId match',
              'GCP storage permissions issue',
              'Video file was never created due to egress error',
            ],
            expectedFilePatterns: [
              'livekit-{assessmentId}-{timestamp}.mp4 (from LiveKit Egress)',
              'video.webm (previously merged)',
              'chunk_*.webm (legacy upload method)',
            ],
            recommendations: [
              'Check LiveKit egress logs for upload errors',
              'Verify GCP storage bucket permissions',
              'Confirm egress completed successfully without errors',
              'Check that the room recording was actually started',
            ],
          },
        });
        throw lastError;
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxRetries) {
          logger.warn({
            message: `⚠️ Error checking for video files, will retry`,
            context: 'GcpVertexOnboardingAssessmentProvider.mergeVideoChunks',
            error: error instanceof Error ? error.message : 'Unknown error',
            taskId,
            attempt,
            maxRetries,
            nextRetryIn: `${retryDelayMs}ms`,
          });
          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
          continue;
        }

        logger.error({
          message: 'Error processing video after all retry attempts',
          context: 'GcpVertexOnboardingAssessmentProvider.mergeVideoChunks',
          error: error instanceof Error ? error.message : 'Unknown error',
          taskId,
          assessmentId: task.assessment.id,
          totalAttempts: maxRetries,
        });
        throw error;
      }
    }

    // Should never reach here, but just in case
    throw lastError || new Error('Failed to process video after all retries');
  }

  /**
   * Generate highlights video using ffmpeg based on highlightsInstructions
   */
  private async generateHighlightsVideo(
    taskId: string,
    task: IAiOnboardingAssessmentTask,
    mergedVideoLocalFilePath: string,
    highlightsVideoLocalFilePath: string
  ): Promise<void> {
    try {
      logger.info({
        message: 'Generating highlights video',
        context:
          'GcpVertexOnboardingAssessmentProvider.generateHighlightsVideo',
        taskId,
      });

      const { folderPath: videoChunksFolder } =
        getBucketFolderPathToCandidateOnboardingAssessmentVideo(
          task.assessment.candidateId,
          task.assessment.id
        );

      if (!videoChunksFolder) {
        logger.warn({
          message: 'No video folder found for highlights generation',
          context:
            'GcpVertexOnboardingAssessmentProvider.generateHighlightsVideo',
          taskId,
        });
        return;
      }

      // Check if video analysis exists and has highlights instructions
      if (!task.assessment.videoAnalysis?.highlightsInstructions) {
        logger.warn({
          message: 'No highlights instructions found in video analysis',
          context:
            'GcpVertexOnboardingAssessmentProvider.generateHighlightsVideo',
          taskId,
        });
        return;
      }

      // highlights instructions
      const highlightsInstructions =
        task.assessment.videoAnalysis.highlightsInstructions;

      // Validate highlights instructions structure
      try {
        const parsedInstructions = JSON.parse(highlightsInstructions);
        if (
          !parsedInstructions.highs ||
          !Array.isArray(parsedInstructions.highs) ||
          !parsedInstructions.lows ||
          !Array.isArray(parsedInstructions.lows) ||
          !parsedInstructions.introduction ||
          !parsedInstructions.interviewEnd
        ) {
          logger.warn({
            message:
              'Highlights instructions missing required structure (highs, lows, introduction, or interviewEnd)',
            context:
              'GcpVertexOnboardingAssessmentProvider.generateHighlightsVideo',
            taskId,
            highlightsInstructions,
          });
          return;
        }
      } catch (parseError) {
        logger.warn({
          message: 'Failed to parse highlights instructions',
          context:
            'GcpVertexOnboardingAssessmentProvider.generateHighlightsVideo',
          taskId,
          error:
            parseError instanceof Error ? parseError.message : 'Unknown error',
          highlightsInstructions,
        });
        return;
      }

      logger.info({
        message: 'Using video source for highlights generation',
        context:
          'GcpVertexOnboardingAssessmentProvider.generateHighlightsVideo',
        taskId,
        highlightsInstructions,
      });

      // Generate highlights video
      await generateHighlightsVideo(
        mergedVideoLocalFilePath,
        highlightsVideoLocalFilePath,
        highlightsInstructions,
        'crossfade'
      );

      logger.info({
        message: 'Highlights video generated successfully',
        context:
          'GcpVertexOnboardingAssessmentProvider.generateHighlightsVideo',
        taskId,
        highlightsVideoLocalFilePath,
      });

      // Upload the highlights video
      const highlightsBuffer = await fs.promises.readFile(
        highlightsVideoLocalFilePath
      );
      const highlightsVideoUrl = await this.storageProvider.uploadFile(
        highlightsBuffer,
        `${videoChunksFolder}/highlights.webm`
      );

      logger.info({
        message: 'Highlights video uploaded successfully',
        context:
          'GcpVertexOnboardingAssessmentProvider.generateHighlightsVideo',
        taskId,
        highlightsVideoUrl,
      });

      // Update the assessment with highlights video URL
      if (task.assessment.videoAnalysis) {
        task.assessment.videoAnalysis.highlightsVideoUrl = highlightsVideoUrl;
      }

      // Update task
      task.updatedAt = new Date();
      await this.setTask(taskId, task);

      logger.info({
        message: 'Highlights video generated successfully',
        context:
          'GcpVertexOnboardingAssessmentProvider.generateHighlightsVideo',
        taskId,
        highlightsVideoUrl,
      });
    } catch (error) {
      logger.error({
        message: 'Error generating highlights video',
        context:
          'GcpVertexOnboardingAssessmentProvider.generateHighlightsVideo',
        taskId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Don't throw the error as this is not critical for the assessment
    }
  }

  /**
   * Update the video analysis
   */
  private async doVideoAnalysis(
    taskId: string,
    task: IAiOnboardingAssessmentTask,
    mergedVideoLocalFilePath: string,
    highlightsVideoLocalFilePath: string,
    actualVideoFilename: string
  ): Promise<void> {
    logger.info({
      message: 'Updating video analysis',
      context: 'GcpVertexOnboardingAssessmentProvider.doVideoAnalysis',
      taskId,
    });

    const { folderPath: videoChunksFolder } =
      getBucketFolderPathToCandidateOnboardingAssessmentVideo(
        task.assessment.candidateId,
        task.assessment.id
      );

    try {
      // Download the merged video
      const videoBuffer = await fs.promises.readFile(mergedVideoLocalFilePath);

      // Detect video MIME type from file path and buffer
      const mimeType = detectVideoMimeType(
        mergedVideoLocalFilePath,
        videoBuffer
      );

      logger.info({
        message: 'Detected video format for analysis',
        context: 'GcpVertexOnboardingAssessmentProvider.doVideoAnalysis',
        mimeType,
        filePath: mergedVideoLocalFilePath,
        taskId,
      });

      // Get the model
      const generativeModel = this.vertexAI.preview.getGenerativeModel({
        model: `projects/${this.projectId}/locations/${this.location}/publishers/google/models/${this.model}`,
      });

      // Read video file as base64
      const videoBase64 = videoBuffer.toString('base64');

      // Build assessment context for the AI
      const assessmentContext = {
        candidateInfo: {
          id: task.assessment.candidateId,
          resumeText: task.assessment.resumeText || 'No resume provided',
        },
        assessmentStructure: {
          totalSections: task.assessment.sections.length,
          sections: task.assessment.sections.map((section) => ({
            title: section.title,
            description: section.description,
            type: section.type,
            totalQuestions: section.questions?.length || 0,
            questions:
              section.questions?.map((q) => ({
                question: q.question,
                answer: q.answerGiven || 'No answer provided',
                questionType: q.questionType,
              })) || [],
          })),
        },
        settings: {
          maxQuestionsPerSection:
            task.assessment.onboardingAssessmentSettings
              ?.maxQuestionsPerSection || 5,
          duration: task.assessment.duration,
        },
      };

      const contextPrompt = `
==============================================================================
ASSESSMENT DATA PROVIDED - YOU MUST USE THIS DATA FOR YOUR ANALYSIS
==============================================================================

CANDIDATE INFORMATION:
${JSON.stringify(assessmentContext.candidateInfo, null, 2)}

QUESTIONS ASKED & CANDIDATE'S ANSWERS:
${JSON.stringify(assessmentContext.assessmentStructure, null, 2)}

ASSESSMENT SETTINGS:
${JSON.stringify(assessmentContext.settings, null, 2)}

==============================================================================
CRITICAL INSTRUCTIONS - READ CAREFULLY BEFORE ANALYZING
==============================================================================

**YOU HAVE BEEN PROVIDED WITH ALL THE ASSESSMENT DATA ABOVE**

The data includes:
✓ Candidate's resume and background
✓ ALL questions that were asked during the interview
✓ ALL answers the candidate provided (both written and spoken)
✓ Assessment structure and settings

**YOUR TASK:**
1. **USE THE ANSWERS PROVIDED ABOVE** - The candidate HAS answered the questions. Their answers are in the "answer" field for each question. DO NOT say "no answers provided" or "incomplete responses".

2. **ANALYZE BOTH VIDEO AND WRITTEN DATA**:
   - Watch the video to assess behavior (engagement, confidence, clarity, professionalism)
   - Read the candidate's answers from the data above to evaluate technical accuracy
   - Match video responses with the written answers to check consistency
   - Cross-reference answers with the candidate's resume

3. **EVALUATION REQUIREMENTS**:
   - For EACH question listed above, evaluate the candidate's answer quality
   - Identify which answers demonstrate strong technical knowledge
   - Identify which answers need more depth or clarity
   - Compare the candidate's demonstrated skills vs their resume claims
   - Provide SPECIFIC feedback referencing actual questions and answers

4. **STRENGTHS & IMPROVEMENTS**:
   - **strengths**: MUST identify at least 3 specific strengths from the candidate's responses (e.g., "Strong answer on Question 2 about system design", "Good technical depth on performance optimization")
   - **areasForImprovement**: MUST identify at least 3 specific areas with actionable feedback (e.g., "Question 3 answer lacked specific metrics", "Could provide more examples of leadership experience")

5. **FINAL VERDICT**:
   - Combine behavioral analysis (from video) with technical evaluation (from answers)
   - Provide a comprehensive overallFeedback that includes BOTH aspects
   - Ensure scores reflect the complete assessment, not just video behavior

**IMPORTANT**: You have complete assessment data. Analyze it thoroughly and provide specific, actionable feedback based on what the candidate actually said and wrote.

Now analyze the video AND the provided assessment data to give your comprehensive evaluation:
`;

      // Generate content with multimodal input
      const result = await generativeModel.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text:
                  contextPrompt +
                  '\n\n' +
                  GcpVertexOnboardingAssessmentPromptGenerator.generateVideoAnalysisPrompt(),
              },
              {
                inlineData: {
                  mimeType, // Use detected MIME type (video/mp4 or video/webm)
                  data: videoBase64,
                },
              },
            ],
          },
        ],
      });

      // Parse and validate the response with retry mechanism
      const rawVideoAnalysis = await this.retryWithDelay(
        () => this.parseLLMResponse(result.response, 'video analysis'),
        'parseLLMResponse (video analysis)',
        taskId
      );

      // Validate the video analysis using Zod schema
      const validatedVideoAnalysis =
        VideoAnalysisSchema.parse(rawVideoAnalysis);

      // Validate and stringify highlights instructions
      let highlightsInstructionsString = '';
      if (validatedVideoAnalysis.highlightsInstructions) {
        try {
          // Validate structure before stringifying
          const instructions = validatedVideoAnalysis.highlightsInstructions;
          if (
            instructions.highs &&
            Array.isArray(instructions.highs) &&
            instructions.lows &&
            Array.isArray(instructions.lows) &&
            instructions.introduction &&
            instructions.interviewEnd
          ) {
            highlightsInstructionsString = JSON.stringify(instructions);
            logger.info({
              message: 'Valid highlights instructions received from AI',
              context: 'GcpVertexOnboardingAssessmentProvider.doVideoAnalysis',
              taskId,
              highsCount: instructions.highs.length,
              lowsCount: instructions.lows.length,
            });
          } else {
            logger.warn({
              message:
                'Highlights instructions from AI missing required structure, will skip highlights generation',
              context: 'GcpVertexOnboardingAssessmentProvider.doVideoAnalysis',
              taskId,
            });
          }
        } catch (error) {
          logger.warn({
            message: 'Error validating highlights instructions from AI',
            context: 'GcpVertexOnboardingAssessmentProvider.doVideoAnalysis',
            taskId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      } else {
        logger.warn({
          message:
            'No highlights instructions received from AI, will skip highlights generation',
          context: 'GcpVertexOnboardingAssessmentProvider.doVideoAnalysis',
          taskId,
        });
      }

      // Update the assessment with video analysis
      task.assessment.videoAnalysis = {
        videoUrl: `${videoChunksFolder}/${actualVideoFilename}`,
        highlightsVideoUrl: `${videoChunksFolder}/highlights.webm`,
        transcriptText: validatedVideoAnalysis.transcriptText ?? '',
        overallScore: validatedVideoAnalysis.overallScore ?? 0,
        overallFeedback: validatedVideoAnalysis.overallFeedback ?? '',
        engagementScore: validatedVideoAnalysis.engagementScore ?? 0,
        engagementFeedback: validatedVideoAnalysis.engagementFeedback ?? '',
        confidenceScore: validatedVideoAnalysis.confidenceScore ?? 0,
        confidenceFeedback: validatedVideoAnalysis.confidenceFeedback ?? '',
        clarityScore: validatedVideoAnalysis.clarityScore ?? 0,
        clarityFeedback: validatedVideoAnalysis.clarityFeedback ?? '',
        professionalDemeanorScore:
          validatedVideoAnalysis.professionalDemeanorScore ?? 0,
        professionalDemeanorFeedback:
          validatedVideoAnalysis.professionalDemeanorFeedback ?? '',
        proctoringScore: validatedVideoAnalysis.proctoringScore ?? 0,
        proctoringFeedback: validatedVideoAnalysis.proctoringFeedback ?? '',
        areasForImprovement: validatedVideoAnalysis.areasForImprovement ?? [],
        strengths: validatedVideoAnalysis.strengths ?? [],
        highlightsInstructions: highlightsInstructionsString,
      };

      // Update task
      task.updatedAt = new Date();
      await this.setTask(taskId, task);

      // Generate highlights video if highlights instructions are available
      await this.generateHighlightsVideo(
        taskId,
        task,
        mergedVideoLocalFilePath,
        highlightsVideoLocalFilePath
      );

      logger.info({
        message: 'Video analysis completed',
        context: 'GcpVertexOnboardingAssessmentProvider.doVideoAnalysis',
        taskId,
        videoAnalysis: task.assessment.videoAnalysis,
      });
    } catch (error) {
      logger.error({
        message: 'Error processing video analysis',
        context: 'GcpVertexOnboardingAssessmentProvider.doVideoAnalysis',
        taskId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Set default values in case of error
      task.assessment.videoAnalysis = {
        videoUrl: `${videoChunksFolder}/video.webm`,
        highlightsVideoUrl: `${videoChunksFolder}/highlights.webm`,
        transcriptText: '',
        overallScore: 0,
        overallFeedback: '',
        engagementScore: 0,
        engagementFeedback: '',
        confidenceScore: 0,
        confidenceFeedback: '',
        clarityScore: 0,
        clarityFeedback: '',
        professionalDemeanorScore: 0,
        professionalDemeanorFeedback: '',
        proctoringScore: 0,
        proctoringFeedback: '',
        areasForImprovement: ['Video analysis could not be completed'],
        strengths: [],
        highlightsInstructions: '', // Empty string instead of '{}'
      };

      // Update task with error state
      task.updatedAt = new Date();
      await this.setTask(taskId, task);
    }
  }

  /**
   * Generate assessment result using Vertex AI
   */
  private async generateAssessmentResult(
    task: IAiOnboardingAssessmentTask
  ): Promise<z.infer<typeof AssessmentResultSchema>> {
    // Get the model
    const generativeModel = this.vertexAI.preview.getGenerativeModel({
      model: `projects/${this.projectId}/locations/${this.location}/publishers/google/models/${this.model}`,
    });

    // Prepare the prompt for assessment
    const prompt =
      GcpVertexOnboardingAssessmentPromptGenerator.generateAssessmentPrompt(
        task
      );

    logger.info({
      message: 'Generating assessment',
      context: 'GcpVertexOnboardingAssessmentProvider.generateAssessmentResult',
      taskId: task.taskId,
      prompt,
    });

    // Generate content
    const result = await this.retryWithDelay<{ response: any }>(
      () =>
        generativeModel.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        }),
      'generativeModel.generateContent (assessment)',
      task.taskId
    );

    // Parse and validate the response
    const assessmentResult = await this.retryWithDelay(
      () => this.parseLLMResponse(result.response, 'assessment'),
      'parseLLMResponse (assessment)',
      task.taskId
    );

    logger.info({
      message: 'Assessment generated',
      context: 'GcpVertexOnboardingAssessmentProvider.generateAssessmentResult',
      taskId: task.taskId,
      assessmentResult,
    });

    // Validate the assessment result
    return AssessmentResultSchema.parse(assessmentResult);
  }

  /**
   * Process the onboarding assessment task
   */
  private async processAssessmentTask(taskId: string): Promise<void> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error(`Onboarding assessment task not found with id ${taskId}`);
    }

    try {
      logger.info({
        message: 'Processing onboarding assessment task',
        context: 'GcpVertexOnboardingAssessmentProvider.processAssessmentTask',
        taskId,
        task,
      });

      // Update task status to processing
      task.status = OnboardingAssessmentTaskStatusEnum.ASSESSMENT_STARTED;
      task.updatedAt = new Date();
      task.assessment.status =
        OnboardingAssessmentStatusEnum.AI_REVIEW_IN_PROGRESS;
      await this.setTask(taskId, task);

      // ⚠️ CRITICAL: Reload fresh section statuses from database
      // HTTP polling service updates section status during interview (IN_PROGRESS → COMPLETED)
      // We need to get these latest statuses before AI review overwrites them
      logger.info({
        message: '🔄 Reloading section statuses from database before AI review',
        context: 'GcpVertexOnboardingAssessmentProvider.processAssessmentTask',
        taskId,
        assessmentId: task.assessment.id,
      });

      const freshSections =
        await this.prisma.onboarding_assessment_section.findMany({
          where: { assessmentId: task.assessment.id },
          orderBy: { order: 'asc' },
          include: {
            questions: {
              orderBy: { order: 'asc' },
            },
          },
        });

      // Update task's in-memory sections with fresh database statuses
      for (const freshSection of freshSections) {
        const taskSection = task.assessment.sections.find(
          (s) => s.id === freshSection.id
        );
        if (taskSection) {
          // Preserve the fresh status from database
          taskSection.status =
            freshSection.status as OnboardingAssessmentSectionStatusEnum;
          taskSection.startedAt = freshSection.startedAt || undefined;
          taskSection.completedAt = freshSection.completedAt || undefined;

          logger.info({
            message: '✅ Updated section status from database',
            context:
              'GcpVertexOnboardingAssessmentProvider.processAssessmentTask',
            sectionId: freshSection.id,
            sectionTitle: freshSection.title,
            status: freshSection.status,
            startedAt: freshSection.startedAt,
            completedAt: freshSection.completedAt,
          });
        }
      }

      // Generate assessment result

      const validatedResult = await this.generateAssessmentResult(task);

      // Update assessment with results
      await this.updateAssessmentResult(task, validatedResult);

      // Update task status to completed
      task.status = OnboardingAssessmentTaskStatusEnum.ASSESSMENT_COMPLETED;
      task.updatedAt = new Date();
      await this.setTask(taskId, task);
    } catch (error) {
      // Update task status to failed
      task.status = OnboardingAssessmentTaskStatusEnum.COMPLETED;
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.updatedAt = new Date();
      await this.setTask(taskId, task);

      throw error;
    }
  }

  private async getChatSession(taskId: string): Promise<any> {
    let chat = this.chatSessions.get(taskId);
    if (!chat) {
      const generativeModel = this.vertexAI.preview.getGenerativeModel({
        model: `projects/${this.projectId}/locations/${this.location}/publishers/google/models/${this.model}`,
      });
      chat = generativeModel.startChat();
      this.chatSessions.set(taskId, chat);
    }
    return chat;
  }

  private async initializeChatSession(
    task: IAiOnboardingAssessmentTask
  ): Promise<void> {
    const chat = await this.getChatSession(task.taskId);

    // Initialize with assessment context
    await chat.sendMessage(
      GcpVertexOnboardingAssessmentPromptGenerator.generateInitialChatPrompt(
        task.assessment.resumeText ?? ''
      )
    );
  }

  private async generateQuestion(
    taskId: string,
    previousQuestionWithAnswer:
      | ICandidateOnboardingAssessmentQuestion
      | null
      | undefined,
    isAssessmentFirstQuestion: boolean,
    isAssessmentLastQuestion: boolean,
    isSectionFirstQuestion: boolean,
    isSectionLastQuestion: boolean,
    isLastSection: boolean,
    sectionToGenerateQuestion: ICandidateOnboardingAssessmentSection,
    maxQuestionsPerSection: number
  ): Promise<ICandidateOnboardingAssessmentAnswerSubmitted> {
    logger.info({
      message: '🎯 Generating question with flags',
      context: 'GcpVertexOnboardingAssessmentProvider.generateQuestion',
      taskId,
      sectionId: sectionToGenerateQuestion.id,
      sectionTitle: sectionToGenerateQuestion.title,
      sectionOrder: sectionToGenerateQuestion.order,
      currentQuestionCount: sectionToGenerateQuestion.questions.length,
      maxQuestionsPerSection,
      isAssessmentFirstQuestion,
      isAssessmentLastQuestion,
      isSectionFirstQuestion,
      isSectionLastQuestion,
      isLastSection,
      previousQuestionOrder: previousQuestionWithAnswer?.order,
    });

    const task = await this.getTask(taskId);
    if (isAssessmentFirstQuestion) {
      await this.initializeChatSession(task);
    }

    const chat = await this.getChatSession(taskId);

    let prompt = '';

    if (previousQuestionWithAnswer) {
      // Add answer context
      prompt =
        GcpVertexOnboardingAssessmentPromptGenerator.generateAnswerPrompt(
          previousQuestionWithAnswer
        );
    }

    if (!isAssessmentFirstQuestion && isSectionFirstQuestion) {
      // Add section transition context
      logger.info({
        message: '🔄 Section transition detected - adding transition prompt',
        context: 'GcpVertexOnboardingAssessmentProvider.generateQuestion',
        taskId,
        newSectionTitle: sectionToGenerateQuestion.title,
        newSectionOrder: sectionToGenerateQuestion.order,
      });

      prompt +=
        GcpVertexOnboardingAssessmentPromptGenerator.generateSectionTransitionPrompt(
          sectionToGenerateQuestion,
          maxQuestionsPerSection
        );
    }

    logger.info({
      message: 'Section transition prompt',
      context: 'GcpVertexOnboardingAssessmentProvider.generateQuestion',
      taskId,
      prompt,
    });

    // Generate the next question
    prompt +=
      GcpVertexOnboardingAssessmentPromptGenerator.generateQuestionPrompt(
        isAssessmentFirstQuestion,
        isAssessmentLastQuestion,
        isSectionFirstQuestion,
        isSectionLastQuestion,
        isLastSection,
        sectionToGenerateQuestion,
        maxQuestionsPerSection
      );

    logger.info({
      message: 'Question prompt',
      context: 'GcpVertexOnboardingAssessmentProvider.generateQuestion',
      taskId,
      prompt,
    });

    const result = await this.retryWithDelay<{ response: any }>(
      () => chat.sendMessage(prompt),
      'chat.sendMessage (question generation)',
      taskId
    );

    // Parse and validate the response
    const question = await this.retryWithDelay(
      () => this.parseLLMResponse(result.response, 'question generation'),
      'parseLLMResponse (question generation)',
      taskId
    );

    const validatedQuestion = QuestionSchema.parse(question);

    // ⚠️ CRITICAL: Clean question text to remove intro phrases that LLM might add despite instructions
    let cleanedQuestionText =
      validatedQuestion.question ??
      'Please provide your response to the previous question.';

    // Remove common intro phrases that add no value
    // These patterns match the exact issues we've seen in production logs
    const introPatterns = [
      // Simple acknowledgments
      /^Thank you for sharing that!?\s*/i,
      /^That's great to hear!?\s*/i,
      /^That's interesting!?\s*/i,
      /^Thanks!?\s*/i,
      /^Great!?\s*/i,
      /^Awesome!?\s*/i,

      // Complex intro sentences (from actual production logs)
      /^It sounds like you've been\s+[^.!?]+[.!?]\s*/i,
      /^It sounds like you're\s+[^.!?]+[.!?]\s*/i,
      /^It sounds like\s+[^.!?]+[.!?]\s*/i,

      // Transition phrases
      /^Now,?\s*let's dive (deeper|into|a bit deeper)\s*/i,
      /^Let's dive (deeper|into|a bit deeper)\s*/i,
      /^Shifting gears,?\s*(a bit)?\s*/i,
      /^Moving on,?\s*/i,

      // Full intro sentences that need to be stripped
      // Example: "Thank you for sharing that! It sounds like you've been focusing on finding candidates with strong Python skills. "
      /^[^?]*?\.\s*It sounds like [^?]*?\.\s*/i,
      /^[^?]*?\.\s*Now,?\s*let's [^?]*?\.\s*/i,
    ];

    const originalQuestion = cleanedQuestionText;
    for (const pattern of introPatterns) {
      cleanedQuestionText = cleanedQuestionText.replace(pattern, '');
    }

    // Log if we cleaned anything
    if (originalQuestion !== cleanedQuestionText) {
      logger.warn({
        message: '⚠️ Cleaned intro text from LLM-generated question',
        context: 'GcpVertexOnboardingAssessmentProvider.generateQuestion',
        taskId,
        originalQuestion: originalQuestion.substring(0, 200),
        cleanedQuestion: cleanedQuestionText.substring(0, 200),
      });
    }

    // Create the question object
    const newQuestion: ICandidateOnboardingAssessmentQuestion = {
      id: uuidv4(),
      sectionId: sectionToGenerateQuestion.id,
      question: cleanedQuestionText,
      questionType: validatedQuestion.questionType ?? QuestionTypeEnum.TEXT,
      options: validatedQuestion.options ?? {},
      correctAnswer: validatedQuestion.correctAnswer ?? '',
      score: 0,
      // Set isLastQuestion based on the flags passed to this function
      // This is critical for section navigation logic to work correctly
      isLastQuestion: isSectionLastQuestion || isAssessmentLastQuestion,
      maxScore: validatedQuestion.maxScore ?? 0,
      order: sectionToGenerateQuestion.questions.length,
      isRequired: true,
      isAnswered: false,
    };

    // Ensure question is not empty
    if (!newQuestion.question || newQuestion.question.trim() === '') {
      newQuestion.question =
        'Please provide your response to the previous question.';
    }

    logger.info({
      message: '✅ Question generated successfully',
      context: 'GcpVertexOnboardingAssessmentProvider.generateQuestion',
      taskId,
      sectionId: sectionToGenerateQuestion.id,
      sectionTitle: sectionToGenerateQuestion.title,
      sectionOrder: sectionToGenerateQuestion.order,
      questionId: newQuestion.id,
      questionOrder: newQuestion.order,
      questionType: newQuestion.questionType,
      totalQuestionsInSection: sectionToGenerateQuestion.questions.length + 1,
      maxQuestionsPerSection,
      shouldEndAssessment: validatedQuestion.shouldEndAssessment ?? false,
    });

    return {
      nextQuestion: newQuestion,
      shouldEndAssessment: validatedQuestion.shouldEndAssessment ?? false,
    };
  }

  /**
   * Retry function with exponential backoff for handling 429 errors
   */
  private async retryJsonParsing<T>(
    operation: () => T,
    operationName: string,
    taskId: string
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.jsonParseMaxRetries; attempt++) {
      try {
        logger.info(
          `JSON parsing attempt ${attempt + 1}/${this.jsonParseMaxRetries + 1}`,
          {
            context: 'GcpVertexOnboardingAssessmentProvider.retryJsonParsing',
            operationName,
            taskId,
            attempt: attempt + 1,
          }
        );

        const result = operation();

        if (attempt > 0) {
          logger.info(`JSON parsing succeeded on retry`, {
            context: 'GcpVertexOnboardingAssessmentProvider.retryJsonParsing',
            operationName,
            taskId,
            successfulAttempt: attempt + 1,
          });
        }

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        logger.warn(`JSON parsing attempt ${attempt + 1} failed`, {
          context: 'GcpVertexOnboardingAssessmentProvider.retryJsonParsing',
          operationName,
          taskId,
          attempt: attempt + 1,
          error: lastError.message,
          willRetry: attempt < this.jsonParseMaxRetries,
        });

        if (attempt < this.jsonParseMaxRetries) {
          const delay =
            this.jsonParseRetryDelays[
              Math.min(attempt, this.jsonParseRetryDelays.length - 1)
            ];
          logger.info(`Waiting ${delay}ms before JSON parsing retry`, {
            context: 'GcpVertexOnboardingAssessmentProvider.retryJsonParsing',
            operationName,
            taskId,
            delay,
          });
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    logger.error(`All JSON parsing attempts failed`, {
      context: 'GcpVertexOnboardingAssessmentProvider.retryJsonParsing',
      operationName,
      taskId,
      totalAttempts: this.jsonParseMaxRetries + 1,
      finalError: lastError?.message,
    });

    throw (
      lastError ||
      new Error(
        `${operationName} failed after ${this.jsonParseMaxRetries + 1} attempts`
      )
    );
  }

  private async retryWithDelay<T>(
    operation: () => Promise<T>,
    operationName: string,
    taskId: string
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if it's a 429 error (Too Many Requests)
        const isRateLimitError =
          error instanceof Error &&
          ((error as any).status === 429 ||
            error.message.includes('429') ||
            error.message.toLowerCase().includes('too many requests') ||
            error.message.toLowerCase().includes('rate limit'));

        if (isRateLimitError && attempt < this.maxRetries) {
          const delay = this.retryDelays[attempt - 1]; // Use delay from array: 2s, 3s, 5s

          logger.warn({
            message: 'Rate limit hit, retrying after delay',
            context: 'GcpVertexOnboardingAssessmentProvider.retryWithDelay',
            operationName,
            taskId,
            attempt,
            delay,
            error: lastError.message,
          });

          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        // If it's not a rate limit error or we've exhausted retries, throw the error
        if (attempt === this.maxRetries) {
          logger.error({
            message: `Failed to execute ${operationName} after all retries`,
            context: 'GcpVertexOnboardingAssessmentProvider.retryWithDelay',
            operationName,
            taskId,
            error: lastError.message,
            attempts: attempt,
          });
          throw lastError;
        }
      }
    }

    throw (
      lastError ||
      new Error(`Failed to execute ${operationName} after all retries`)
    );
  }

  private async updateAssessmentResult(
    task: IAiOnboardingAssessmentTask,
    validatedResult: z.infer<typeof AssessmentResultSchema>
  ): Promise<void> {
    // Update overall assessment results
    task.assessment.score = validatedResult.score ?? 0;
    task.assessment.strengths = validatedResult.strengths ?? [];
    task.assessment.areasForImprovement =
      validatedResult.areasForImprovement ?? [];
    task.assessment.overallFeedback = validatedResult.overallFeedback ?? '';
    task.assessment.recommendation =
      validatedResult.recommendation ??
      OnboardingAssessmentRecommendationEnum.NOT_RECOMMENDED;
    task.assessment.status = OnboardingAssessmentStatusEnum.AI_REVIEW_COMPLETED;
    task.assessment.completedAt = new Date();
    task.assessment.skills = validatedResult.skills ?? [];
    task.assessment.technicalSkills = validatedResult.technicalSkills ?? [];
    task.assessment.softSkills = validatedResult.softSkills ?? [];
    task.assessment.industriesFit = validatedResult.industriesFit ?? [];
    task.assessment.jobRolesFit = validatedResult.jobRolesFit ?? [];

    // Calculate overall result based on score and proctoring
    const hasProctoringIssues =
      task.assessment.proctoring?.automaticallyFailed ||
      task.assessment.proctoring?.manualReviewRequired;

    task.assessment.result = hasProctoringIssues
      ? OnboardingAssessmentResultEnum.AI_REVIEW_FAILED
      : validatedResult.recommendation ===
            OnboardingAssessmentRecommendationEnum.RECOMMENDED ||
          validatedResult.recommendation ===
            OnboardingAssessmentRecommendationEnum.HIGHLY_RECOMMENDED
        ? OnboardingAssessmentResultEnum.PASSED
        : OnboardingAssessmentResultEnum.AI_REVIEW_FAILED;

    task.assessment.selectedForNextRound =
      task.assessment.result === OnboardingAssessmentResultEnum.PASSED &&
      !hasProctoringIssues;

    // Normalize ID for matching (AI may return string with whitespace; task sections use UUID)
    const normalizeSectionId = (id: string | undefined) =>
      id != null ? String(id).trim() : '';

    // Update section results (AI must return section id matching task.assessment.sections; prompt includes section IDs)
    let sectionsUpdated = 0;
    if (validatedResult.sections?.length) {
      for (const sectionResult of validatedResult.sections) {
        const resultId = normalizeSectionId(sectionResult.id);
        const section = task.assessment.sections.find(
          (s) => normalizeSectionId(s.id) === resultId
        );
        if (section) {
          section.score = sectionResult.score ?? 0;
          section.strengths = sectionResult.strengths ?? [];
          section.areasForImprovement = sectionResult.areasForImprovement ?? [];
          section.status = OnboardingAssessmentSectionStatusEnum.COMPLETED;
          section.result =
            (sectionResult.score ?? 0) >= (section.passThreshold ?? 0.7)
              ? OnboardingAssessmentSectionResultEnum.PASSED
              : OnboardingAssessmentSectionResultEnum.FAILED_AI_REVIEW;

          logger.info({
            message: 'Section result calculated',
            context:
              'GcpVertexOnboardingAssessmentProvider.processAssessmentTask',
            sectionId: section.id,
            sectionTitle: section.title,
            score: section.score,
            passThreshold: section.passThreshold,
            result: section.result,
          });
          sectionsUpdated++;
        }
      }
    }

    // Fallback 1: when AI returned no section IDs matching our sections (wrong/missing IDs)
    if (sectionsUpdated === 0 && task.assessment.sections?.length) {
      logger.warn({
        message:
          'No section IDs matched - using overall score/result for all sections (check prompt includes Section ID and AI returns exact IDs)',
        context: 'GcpVertexOnboardingAssessmentProvider.processAssessmentTask',
        taskId: task.taskId,
        expectedSectionIds: task.assessment.sections.map((s) => s.id),
        returnedSectionIds: validatedResult.sections?.map((s) => s.id) ?? [],
      });
      const overallScore = validatedResult.score ?? 0;
      const overallPass =
        task.assessment.recommendation ===
          OnboardingAssessmentRecommendationEnum.HIGHLY_RECOMMENDED ||
        task.assessment.recommendation ===
          OnboardingAssessmentRecommendationEnum.RECOMMENDED;
      for (const section of task.assessment.sections) {
        section.score = overallScore;
        section.status = OnboardingAssessmentSectionStatusEnum.COMPLETED;
        section.result = overallPass
          ? OnboardingAssessmentSectionResultEnum.PASSED
          : OnboardingAssessmentSectionResultEnum.FAILED_AI_REVIEW;
      }
    } else if (
      sectionsUpdated > 0 &&
      task.assessment.sections &&
      sectionsUpdated < task.assessment.sections.length
    ) {
      // Fallback 2: AI returned fewer sections (e.g. last section omitted) - fill missing with overall
      const overallScore = validatedResult.score ?? 0;
      const overallPass =
        task.assessment.recommendation ===
          OnboardingAssessmentRecommendationEnum.HIGHLY_RECOMMENDED ||
        task.assessment.recommendation ===
          OnboardingAssessmentRecommendationEnum.RECOMMENDED;
      for (const section of task.assessment.sections) {
        if (
          section.status !== OnboardingAssessmentSectionStatusEnum.COMPLETED
        ) {
          section.score = overallScore;
          section.status = OnboardingAssessmentSectionStatusEnum.COMPLETED;
          section.result = overallPass
            ? OnboardingAssessmentSectionResultEnum.PASSED
            : OnboardingAssessmentSectionResultEnum.FAILED_AI_REVIEW;
          logger.info({
            message:
              'Section filled with overall score (no AI result for this section)',
            context:
              'GcpVertexOnboardingAssessmentProvider.processAssessmentTask',
            sectionId: section.id,
            sectionTitle: section.title,
          });
        }
      }
    }

    task.assessment.updatedAt = new Date();
  }
}
