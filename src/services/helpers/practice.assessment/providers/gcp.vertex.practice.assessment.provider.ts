import { singleton } from '@/shared/decorators/singleton';
import {
  IPracticeAssessmentProvider,
  IPracticeAssessmentTask,
  IPracticeAssessmentAnswerSubmitted,
} from '../practice.assessment.provider';
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
  JobAiAssessmentRecommendationEnum,
  QuestionTypeEnum,
  JobAiAssessmentTaskStatusEnum,
  PublicPracticeAssessmentStatusEnum,
  PublicPracticeAssessmentResultEnum,
  PublicPracticeAssessmentRecommendationEnum,
  PublicPracticeAssessmentSectionStatusEnum,
  PublicPracticeAssessmentSectionResultEnum,
} from '@/shared/models/common/enums';
import {
  ICandidateJobAiAssessmentQuestion,
  ICandidateJobAiAssessmentSection,
} from '@/shared/models/domain/candidate/job.ai.assessment.domain';
import { GcpVertexPracticeAssessmentPromptGenerator } from './gcp.vertex.practice.assessment.prompt.generator';
import { IStorageProvider } from '@/services/helpers/storage/storage.interface';
import { StorageFactory } from '../../storage/storage.factory';
import { PrismaClient } from '@prisma/client';
import {
  IPublicPracticeAssessment,
  IPublicPracticeAssessmentSection,
} from '@/shared/models/domain/candidate/public.practice.assessment.domain';

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

const AssessmentResultSchema = z.object({
  score: z.number().min(0).max(1).nullable().optional(),
  strengths: z.array(z.string()).nullable().optional(),
  areasForImprovement: z.array(z.string()).nullable().optional(),
  overallFeedback: z.string().nullable().optional(),
  recommendation: z
    .nativeEnum(JobAiAssessmentRecommendationEnum)
    .nullable()
    .optional(),
  sections: z.array(z.any()).nullable().optional(),
  skills: z.array(z.string()).nullable().optional(),
  technicalSkills: z.array(z.string()).nullable().optional(),
  softSkills: z.array(z.string()).nullable().optional(),
  industriesFit: z.array(z.string()).nullable().optional(),
  jobRolesFit: z.array(z.string()).nullable().optional(),
});

const _VideoAnalysisSchema = z.object({
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

/**
 * GCP Vertex AI Practice Assessment Provider
 *
 * This provider focuses on:
 * - Job Description: 65% (Primary focus)
 * - Resume: 35% (Supporting context)
 *
 * NO onboarding assessment data is used.
 */
@singleton
export class GcpVertexPracticeAssessmentProvider
  implements IPracticeAssessmentProvider
{
  private redis: Redis | null = null;
  private tasks: Map<string, IPracticeAssessmentTask>;
  private chatSessions: Map<string, any>;
  private vertexAI: VertexAI;
  private model: string;
  private location: string;
  private projectId: string;
  private taskCacheTTL = 86400; // 24 hours in seconds
  private useRedisCache: boolean;
  private maxRetries = 3;
  private retryDelays = [2000, 3000, 5000]; // 2s, 3s, 5s delays
  private jsonParseMaxRetries = 2;
  private jsonParseRetryDelays = [1000, 2000];
  private storageProvider: IStorageProvider;
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
    this.tasks = new Map();
    this.chatSessions = new Map();
    this.model = ENV.GOOGLE_CLOUD_VERTEX_AI_MODEL;
    this.location = ENV.GOOGLE_CLOUD_VERTEX_AI_LOCATION;
    this.projectId = ENV.GOOGLE_CLOUD_PROJECT_ID;
    this.useRedisCache = ENV.USE_REDIS_CACHE;
    this.storageProvider = StorageFactory.getInstance().getProvider();

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
          keyPrefix: `${ENV.ENV_NAME}:practice_assessment:`,
          connectTimeout: 5000,
          retryStrategy: (times: number) => {
            const delay = Math.min(times * 100, 3000);
            return delay;
          },
        });

        this.redis.on('error', (err: Error) => {
          logger.error('Redis error', {
            error: err.message,
            context: 'GcpVertexPracticeAssessmentProvider',
          });
        });

        logger.info('Redis cache initialized for practice assessment', {
          context: 'GcpVertexPracticeAssessmentProvider.constructor',
        });
      } catch (error) {
        logger.error('Failed to initialize Redis', {
          error: error instanceof Error ? error.message : 'Unknown error',
          context: 'GcpVertexPracticeAssessmentProvider.constructor',
        });
        this.redis = null;
      }
    } else {
      logger.info('Using local Map storage for practice assessment tasks', {
        context: 'GcpVertexPracticeAssessmentProvider.constructor',
      });
    }

    logger.info('GCP Vertex AI Practice Assessment Provider initialized', {
      context: 'GcpVertexPracticeAssessmentProvider.constructor',
      model: this.model,
      location: this.location,
      projectId: this.projectId,
    });
  }

  /**
   * Get a task from storage (Redis or Map)
   */
  private async getTask(taskId: string): Promise<IPracticeAssessmentTask> {
    if (this.useRedisCache && this.redis) {
      const taskData = await this.redis.get(taskId);
      if (!taskData) {
        throw new AppError(
          `Practice assessment task not found with id ${taskId}`,
          404,
          ErrorCode.NOT_FOUND
        );
      }
      return JSON.parse(taskData);
    } else {
      const task = this.tasks.get(taskId);
      if (!task) {
        throw new AppError(
          `Practice assessment task not found with id ${taskId}`,
          404,
          ErrorCode.NOT_FOUND
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
    task: IPracticeAssessmentTask
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
          context: 'GcpVertexPracticeAssessmentProvider.setTask',
        });
        this.tasks.set(taskId, task);
      }
    } else {
      this.tasks.set(taskId, task);
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
          context: 'GcpVertexPracticeAssessmentProvider.taskExists',
        });
        return this.tasks.has(taskId);
      }
    } else {
      return this.tasks.has(taskId);
    }
  }

  /**
   * Initializes the practice assessment
   * Uses 65% job description / 35% resume weighting
   * Now includes dynamic difficulty level based on experience and job requirements
   */
  async initializeAssessment(
    taskId: string,
    resumeText: string,
    jobDescriptionText: string,
    settings: {
      maxSections?: number;
      maxQuestionsPerSection?: number;
      requiredSections?: string[];
      defaultPassingScore?: number;
      defaultAssessmentDuration?: number;
    }
  ): Promise<IPracticeAssessmentTask> {
    // Analyze difficulty level from resume and JD
    const difficultyLevel =
      GcpVertexPracticeAssessmentPromptGenerator.analyzeDifficultyLevel(
        resumeText,
        jobDescriptionText
      );

    logger.info({
      message:
        'Initializing practice assessment with 65% JD / 35% resume weighting',
      context: 'GcpVertexPracticeAssessmentProvider.initializeAssessment',
      taskId,
      difficultyLevel,
    });

    // Check if task exists
    const exists = await this.taskExists(taskId);

    // Create initial assessment structure
    const assessment: IPublicPracticeAssessment = {
      id: taskId,
      title: 'Practice Assessment',
      description: `Practice assessment based on job requirements (Difficulty: ${difficultyLevel})`,
      sourceJobUrl: '',
      candidateName: '',
      candidateEmail: '',
      status: PublicPracticeAssessmentStatusEnum.NOT_STARTED,
      result: PublicPracticeAssessmentResultEnum.NOT_AVAILABLE,
      score: 0,
      duration: settings.defaultAssessmentDuration || 3600,
      startedAt: undefined,
      completedAt: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      linkedAt: undefined,
      candidateId: undefined,
      termsAccepted: false,
      termsAcceptedAt: undefined,
      overallFeedback: undefined,
      strengths: [],
      areasForImprovement: [],
      recommendation: undefined,
      technicalSkills: [],
      softSkills: [],
      industriesFit: [],
      jobRolesFit: [],
      sections: [],
      progressState: undefined,
      proctoring: undefined,
      publicPracticeAssessmentSettings: {
        id: uuidv4(),
        assessmentId: taskId,
        greetingMessage: undefined,
        defaultAssessmentDuration: settings.defaultAssessmentDuration || 3600,
        maxSections: settings.maxSections || 3,
        maxQuestionsPerSection: settings.maxQuestionsPerSection || 5,
        proctoringEnabled: true,
        maxWarnings: 3,
        tabSwitchLimit: 3,
        copyPasteAllowed: false,
        videoRecordingEnabled: true,
        minimumVideoLength: 0,
        aiVideoAnalysisEnabled: true,
        interviewLanguage: 'ENGLISH',
        interviewDialect: 'en-US',
        interviewVoiceGender: 'female',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      videoAnalysis: undefined,
      resumeText,
      jobDescriptionText,
    };

    const task: IPracticeAssessmentTask = exists
      ? await this.getTask(taskId)
      : {
          taskId,
          status: JobAiAssessmentTaskStatusEnum.PENDING,
          assessment,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

    // Update the task with new values
    task.assessment = assessment;
    task.assessment.resumeText = resumeText;
    task.assessment.jobDescriptionText = jobDescriptionText;
    task.updatedAt = new Date();

    await this.setTask(taskId, task);

    // Process initialization with difficulty level
    await this.processInitializeTask(
      taskId,
      resumeText,
      jobDescriptionText,
      settings,
      difficultyLevel
    );

    return task;
  }

  /**
   * Process the practice assessment initialization
   * Generates sections using 65% JD / 35% resume weighting
   * Now includes dynamic difficulty level
   */
  private async processInitializeTask(
    taskId: string,
    resumeText: string,
    jobDescriptionText: string,
    settings: {
      maxSections?: number;
      maxQuestionsPerSection?: number;
      requiredSections?: string[];
      defaultPassingScore?: number;
      defaultAssessmentDuration?: number;
    },
    difficultyLevel: string
  ): Promise<void> {
    logger.info({
      message:
        'Processing practice assessment initialization (65% JD / 35% resume)',
      context: 'GcpVertexPracticeAssessmentProvider.processInitializeTask',
      taskId,
      difficultyLevel,
    });

    const task = await this.getTask(taskId);

    try {
      // Update task status
      task.status = JobAiAssessmentTaskStatusEnum.INITIALIZE_STARTED;
      task.assessment.status =
        PublicPracticeAssessmentStatusEnum.AI_INITIALIZATION_IN_PROGRESS;
      task.updatedAt = new Date();
      await this.setTask(taskId, task);

      const maxSections = settings.maxSections || 3;
      const requiredSections = settings.requiredSections || [
        'TECHNICAL',
        'BEHAVIORAL',
      ];

      // Generate sections using the practice assessment prompt generator
      // This uses 65% JD / 35% resume weighting with dynamic difficulty
      const sections = await this.generateSections(
        taskId,
        resumeText,
        jobDescriptionText,
        requiredSections,
        maxSections,
        difficultyLevel
      );

      // Create sections in the assessment
      task.assessment.sections = sections.map((section, index) => ({
        id: section.id || uuidv4(),
        assessmentId: taskId,
        title: section.title || `Section ${index + 1}`,
        description: section.description || '',
        type: section.type || 'TECHNICAL',
        status: PublicPracticeAssessmentSectionStatusEnum.NOT_STARTED,
        result: PublicPracticeAssessmentSectionResultEnum.NOT_AVAILABLE,
        score: 0,
        order: index,
        isRequired: true,
        passThreshold: section.passThreshold || 0.7,
        startedAt: undefined,
        completedAt: undefined,
        feedback: undefined,
        strengths: [],
        areasForImprovement: [],
        questions: [],
      }));

      // Initialize chat session for conversational assessment with difficulty level
      await this.initializeChatSession(
        taskId,
        resumeText,
        jobDescriptionText,
        difficultyLevel
      );

      // Update task status to completed
      task.status = JobAiAssessmentTaskStatusEnum.INITIALIZE_COMPLETED;
      task.assessment.status =
        PublicPracticeAssessmentStatusEnum.AI_INITIALIZATION_COMPLETED;
      task.updatedAt = new Date();
      await this.setTask(taskId, task);

      logger.info({
        message: 'Practice assessment initialization completed',
        context: 'GcpVertexPracticeAssessmentProvider.processInitializeTask',
        taskId,
        sectionsGenerated: task.assessment.sections?.length || 0,
      });
    } catch (error) {
      logger.error({
        message: 'Practice assessment initialization failed',
        context: 'GcpVertexPracticeAssessmentProvider.processInitializeTask',
        taskId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      task.status = JobAiAssessmentTaskStatusEnum.FAILED;
      task.assessment.status = PublicPracticeAssessmentStatusEnum.FAILED;
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.updatedAt = new Date();
      await this.setTask(taskId, task);

      throw error;
    }
  }

  /**
   * Generate sections using 65% JD / 35% resume weighting
   * Now includes dynamic difficulty level
   */
  private async generateSections(
    taskId: string,
    resumeText: string,
    jobDescriptionText: string,
    requiredSections: string[],
    maxSections: number,
    difficultyLevel: string
  ): Promise<
    Array<{
      id: string;
      title: string;
      description: string;
      type: string;
      passThreshold: number;
    }>
  > {
    logger.info({
      message: 'Generating sections with 65% JD / 35% resume weighting',
      context: 'GcpVertexPracticeAssessmentProvider.generateSections',
      taskId,
      maxSections,
      requiredSections,
      difficultyLevel,
    });

    const prompt =
      GcpVertexPracticeAssessmentPromptGenerator.generateSectionGenerationPrompt(
        requiredSections,
        resumeText,
        jobDescriptionText,
        maxSections,
        difficultyLevel
      );

    const model = this.vertexAI.preview.getGenerativeModel({
      model: this.model,
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 8192,
      },
    });

    const result = await this.retryWithExponentialBackoff(
      async () => {
        const response = await model.generateContent(prompt);
        return this.parseLLMResponse(response.response, 'section generation');
      },
      'generate sections',
      taskId
    );

    // Validate and ensure each section has required fields
    const sections = (Array.isArray(result) ? result : []).map(
      (section: any, index: number) => {
        const validated = SectionSchema.safeParse(section);

        return {
          id: uuidv4(),
          title:
            validated.success && validated.data.title
              ? validated.data.title
              : `Section ${index + 1}`,
          description:
            validated.success && validated.data.description
              ? validated.data.description
              : 'Assessment section',
          type:
            validated.success && validated.data.type
              ? validated.data.type
              : requiredSections[index % requiredSections.length],
          passThreshold:
            validated.success && validated.data.passThreshold
              ? validated.data.passThreshold
              : 0.7,
        };
      }
    );

    // Ensure we have at least one section
    if (sections.length === 0) {
      return requiredSections.slice(0, maxSections).map((type, _index) => ({
        id: uuidv4(),
        title: `${type} Assessment`,
        description: `Assessment of ${type.toLowerCase()} skills for the job role`,
        type,
        passThreshold: 0.7,
      }));
    }

    return sections.slice(0, maxSections);
  }

  /**
   * Initialize chat session with 65% JD / 35% resume context
   * Now includes dynamic difficulty level
   */
  private async initializeChatSession(
    taskId: string,
    resumeText: string,
    jobDescriptionText: string,
    difficultyLevel?: string
  ): Promise<void> {
    logger.info({
      message: 'Initializing chat session with 65% JD / 35% resume context',
      context: 'GcpVertexPracticeAssessmentProvider.initializeChatSession',
      taskId,
      difficultyLevel,
    });

    const model = this.vertexAI.preview.getGenerativeModel({
      model: this.model,
      generationConfig: {
        temperature: 0.8,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 8192,
      },
    });

    const initialPrompt =
      GcpVertexPracticeAssessmentPromptGenerator.generateInitialChatPrompt(
        resumeText,
        jobDescriptionText,
        difficultyLevel
      );

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: initialPrompt }],
        },
        {
          role: 'model',
          parts: [
            {
              text: "I understand. I am ready to conduct a practice assessment with 65% focus on job requirements and 35% on resume validation. I will use conversational interviewing techniques to create an engaging assessment experience while thoroughly evaluating the candidate's fit for this specific role. Let's begin when you're ready.",
            },
          ],
        },
      ],
    });

    this.chatSessions.set(taskId, chat);
  }

  /**
   * Does the practice assessment evaluation
   */
  async doAssessment(taskId: string): Promise<IPracticeAssessmentTask> {
    const exists = await this.taskExists(taskId);
    if (!exists) {
      throw new AppError(
        `Practice assessment task not found with id ${taskId}`,
        404,
        ErrorCode.NOT_FOUND
      );
    }

    const task = await this.getTask(taskId);
    task.updatedAt = new Date();
    await this.setTask(taskId, task);

    // Process the assessment evaluation
    await this.processAssessmentTask(taskId);

    return task;
  }

  /**
   * Process the assessment evaluation with 65% JD / 35% resume weighting
   */
  private async processAssessmentTask(taskId: string): Promise<void> {
    logger.info({
      message:
        'Processing practice assessment evaluation (65% JD / 35% resume)',
      context: 'GcpVertexPracticeAssessmentProvider.processAssessmentTask',
      taskId,
    });

    const task = await this.getTask(taskId);

    try {
      // Update status
      task.status = JobAiAssessmentTaskStatusEnum.ASSESSMENT_STARTED;
      task.assessment.status =
        PublicPracticeAssessmentStatusEnum.AI_REVIEW_IN_PROGRESS;
      task.updatedAt = new Date();
      await this.setTask(taskId, task);

      // Generate assessment evaluation using 65% JD / 35% resume prompt
      const prompt =
        GcpVertexPracticeAssessmentPromptGenerator.generateAssessmentPrompt(
          task
        );

      const model = this.vertexAI.preview.getGenerativeModel({
        model: this.model,
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 8192,
        },
      });

      const result = await this.retryWithExponentialBackoff(
        async () => {
          const response = await model.generateContent(prompt);
          return this.parseLLMResponse(
            response.response,
            'assessment evaluation'
          );
        },
        'evaluate assessment',
        taskId
      );

      const totalQuestions =
        task.assessment.sections?.reduce(
          (sum, section) => sum + (section.questions?.length || 0),
          0
        ) || 0;
      const answeredQuestions =
        task.assessment.sections?.reduce(
          (sum, section) =>
            sum +
            (section.questions?.filter((q) => q.isAnswered && q.answerGiven)
              .length || 0),
          0
        ) || 0;
      const completionRate =
        totalQuestions > 0 ? answeredQuestions / totalQuestions : 0;

      const MIN_MEANINGFUL_ANSWER_LENGTH = 10;
      const qualityAnswers =
        task.assessment.sections?.reduce(
          (sum, section) =>
            sum +
            (section.questions?.filter(
              (q) =>
                q.isAnswered &&
                q.answerGiven &&
                q.answerGiven.trim().length >= MIN_MEANINGFUL_ANSWER_LENGTH &&
                // Exclude very short generic answers
                ![
                  'yes',
                  'no',
                  'ok',
                  'sure',
                  'maybe',
                  'idk',
                  "i don't know",
                ].includes(q.answerGiven.trim().toLowerCase())
            ).length || 0),
          0
        ) || 0;
      const answerQualityRate =
        answeredQuestions > 0 ? qualityAnswers / answeredQuestions : 0;

      logger.info('Assessment completion and quality calculated', {
        context: 'GcpVertexPracticeAssessmentProvider.processAssessmentTask',
        taskId,
        totalQuestions,
        answeredQuestions,
        completionRate,
        qualityAnswers,
        answerQualityRate,
      });

      // Validate the result
      const validated = AssessmentResultSchema.safeParse(result);
      const assessmentResult = validated.success ? validated.data : result;

      let adjustedScore = assessmentResult.score || 0;

      if (answeredQuestions <= 5 || completionRate < 0.2) {
        const baseMultiplier = Math.max(0.3, completionRate * 1.5);
        adjustedScore = Math.min(
          (assessmentResult.score || 0) * baseMultiplier,
          0.4 // Hard cap at 0.4 for very low completion
        );

        logger.info(
          'Score adjusted for very low completion (≤5 questions or <20%) - severe penalty',
          {
            context:
              'GcpVertexPracticeAssessmentProvider.processAssessmentTask',
            taskId,
            originalScore: assessmentResult.score || 0,
            adjustedScore,
            completionRate,
            answeredQuestions,
            totalQuestions,
            baseMultiplier,
            note: 'Severe penalty applied - insufficient data for accurate assessment',
          }
        );
      } else if (completionRate < 0.3) {
        const penaltyMultiplier = 0.5 + completionRate * 0.5; // More aggressive: 0.5-0.65 range
        adjustedScore = (assessmentResult.score || 0) * penaltyMultiplier;

        logger.info(
          'Score adjusted for very low completion rate (20-30%) - moderate penalty',
          {
            context:
              'GcpVertexPracticeAssessmentProvider.processAssessmentTask',
            taskId,
            originalScore: assessmentResult.score || 0,
            adjustedScore,
            completionRate,
            penaltyMultiplier,
            note: 'Moderate completion penalty applied',
          }
        );
      } else if (completionRate < 0.7) {
        const penaltyMultiplier = 0.8 + completionRate * 0.2;
        adjustedScore = (assessmentResult.score || 0) * penaltyMultiplier;

        logger.info(
          'Score adjusted for medium completion rate (30-70%) - small penalty',
          {
            context:
              'GcpVertexPracticeAssessmentProvider.processAssessmentTask',
            taskId,
            originalScore: assessmentResult.score || 0,
            adjustedScore,
            completionRate,
            penaltyMultiplier,
            note: 'Minor completion penalty applied',
          }
        );
      } else if (completionRate < 1.0) {
        const penaltyMultiplier = 0.9 + completionRate * 0.1;
        adjustedScore = (assessmentResult.score || 0) * penaltyMultiplier;

        logger.info(
          'Score adjusted for high completion rate (70-99%) - minimal penalty',
          {
            context:
              'GcpVertexPracticeAssessmentProvider.processAssessmentTask',
            taskId,
            originalScore: assessmentResult.score || 0,
            adjustedScore,
            completionRate,
            penaltyMultiplier,
            note: 'Minimal penalty - candidate showed strong engagement',
          }
        );
      } else {
        logger.info('Complete assessment - using AI-generated score', {
          context: 'GcpVertexPracticeAssessmentProvider.processAssessmentTask',
          taskId,
          score: assessmentResult.score || 0,
          completionRate,
          answerQualityRate,
          note: 'No completion penalty applied',
        });
      }

      // Update assessment with results
      task.assessment.score = adjustedScore;
      task.assessment.strengths = assessmentResult.strengths || [];
      task.assessment.areasForImprovement =
        assessmentResult.areasForImprovement || [];
      task.assessment.overallFeedback = assessmentResult.overallFeedback || '';
      task.assessment.technicalSkills = assessmentResult.technicalSkills || [];
      task.assessment.softSkills = assessmentResult.softSkills || [];
      task.assessment.industriesFit = assessmentResult.industriesFit || [];
      task.assessment.jobRolesFit = assessmentResult.jobRolesFit || [];

      // Map recommendation
      if (assessmentResult.recommendation) {
        const recommendationMap: Record<
          string,
          PublicPracticeAssessmentRecommendationEnum
        > = {
          HIGHLY_RECOMMENDED:
            PublicPracticeAssessmentRecommendationEnum.HIGHLY_RECOMMENDED,
          RECOMMENDED: PublicPracticeAssessmentRecommendationEnum.RECOMMENDED,
          NOT_RECOMMENDED:
            PublicPracticeAssessmentRecommendationEnum.NOT_RECOMMENDED,
        };
        task.assessment.recommendation =
          recommendationMap[assessmentResult.recommendation] || undefined;
      }

      if (completionRate < 1.0) {
        if (completionRate < 0.8) {
          logger.info(
            'Recommendation downgraded due to incomplete assessment',
            {
              context:
                'GcpVertexPracticeAssessmentProvider.processAssessmentTask',
              taskId,
              originalRecommendation: task.assessment.recommendation,
              completionRate,
            }
          );
          task.assessment.recommendation =
            PublicPracticeAssessmentRecommendationEnum.NOT_RECOMMENDED;
        } else if (
          completionRate < 0.95 &&
          task.assessment.recommendation ===
            PublicPracticeAssessmentRecommendationEnum.HIGHLY_RECOMMENDED
        ) {
          logger.info(
            'Recommendation downgraded from HIGHLY_RECOMMENDED due to incomplete assessment',
            {
              context:
                'GcpVertexPracticeAssessmentProvider.processAssessmentTask',
              taskId,
              completionRate,
            }
          );
          task.assessment.recommendation =
            PublicPracticeAssessmentRecommendationEnum.RECOMMENDED;
        }
      } else if (completionRate === 1.0 && answerQualityRate < 0.6) {
        if (
          task.assessment.recommendation ===
          PublicPracticeAssessmentRecommendationEnum.HIGHLY_RECOMMENDED
        ) {
          logger.info(
            'Recommendation downgraded from HIGHLY_RECOMMENDED due to low answer quality',
            {
              context:
                'GcpVertexPracticeAssessmentProvider.processAssessmentTask',
              taskId,
              answerQualityRate,
              originalRecommendation: task.assessment.recommendation,
            }
          );
          task.assessment.recommendation =
            PublicPracticeAssessmentRecommendationEnum.RECOMMENDED;
        } else if (
          task.assessment.recommendation ===
            PublicPracticeAssessmentRecommendationEnum.RECOMMENDED &&
          answerQualityRate < 0.4
        ) {
          logger.info(
            'Recommendation downgraded from RECOMMENDED due to very low answer quality',
            {
              context:
                'GcpVertexPracticeAssessmentProvider.processAssessmentTask',
              taskId,
              answerQualityRate,
            }
          );
          task.assessment.recommendation =
            PublicPracticeAssessmentRecommendationEnum.NOT_RECOMMENDED;
        }
      }

      if (adjustedScore >= 0.7) {
        task.assessment.result = PublicPracticeAssessmentResultEnum.PASSED;
      } else {
        task.assessment.result = PublicPracticeAssessmentResultEnum.FAILED;
      }

      // Normalize ID for matching (AI may return string with whitespace; task sections use UUID)
      const normalizeSectionId = (id: string | undefined) =>
        id != null ? String(id).trim() : '';

      // Update section results (AI must return section id matching task.assessment.sections; prompt includes section IDs)
      let sectionsUpdated = 0;
      if (
        assessmentResult.sections &&
        Array.isArray(assessmentResult.sections)
      ) {
        assessmentResult.sections.forEach((sectionResult: any) => {
          const resultId = normalizeSectionId(sectionResult.id);
          const section = task.assessment.sections?.find(
            (s) => normalizeSectionId(s.id) === resultId
          );
          if (section) {
            section.score = sectionResult.score ?? 0;
            section.strengths = sectionResult.strengths || [];
            section.areasForImprovement =
              sectionResult.areasForImprovement || [];
            section.status =
              PublicPracticeAssessmentSectionStatusEnum.COMPLETED;
            section.result =
              (sectionResult.score ?? 0) >= 0.7
                ? PublicPracticeAssessmentSectionResultEnum.PASSED
                : PublicPracticeAssessmentSectionResultEnum.FAILED;
            sectionsUpdated++;
          }
        });
      }

      // Fallback 1: when AI returned no section IDs matching our sections (wrong/missing IDs)
      if (sectionsUpdated === 0 && task.assessment.sections?.length) {
        logger.warn({
          message:
            'No section IDs matched - using overall score/result for all sections (check prompt includes Section ID and AI returns exact IDs)',
          context: 'GcpVertexPracticeAssessmentProvider.processAssessmentTask',
          taskId,
          expectedSectionIds: task.assessment.sections.map((s) => s.id),
          returnedSectionIds:
            assessmentResult.sections?.map((s: any) => s.id) ?? [],
        });
        const overallScore = assessmentResult.score ?? 0;
        const overallPass =
          assessmentResult.recommendation === 'HIGHLY_RECOMMENDED' ||
          assessmentResult.recommendation === 'RECOMMENDED';
        for (const section of task.assessment.sections) {
          section.score = overallScore;
          section.status = PublicPracticeAssessmentSectionStatusEnum.COMPLETED;
          section.result = overallPass
            ? PublicPracticeAssessmentSectionResultEnum.PASSED
            : PublicPracticeAssessmentSectionResultEnum.FAILED;
        }
      } else if (
        sectionsUpdated > 0 &&
        task.assessment.sections &&
        sectionsUpdated < task.assessment.sections.length
      ) {
        // Fallback 2: AI returned fewer sections (e.g. last section omitted) - fill missing with overall
        const overallScore = assessmentResult.score ?? 0;
        const overallPass =
          assessmentResult.recommendation === 'HIGHLY_RECOMMENDED' ||
          assessmentResult.recommendation === 'RECOMMENDED';
        for (const section of task.assessment.sections) {
          if (
            section.status !==
            PublicPracticeAssessmentSectionStatusEnum.COMPLETED
          ) {
            section.score = overallScore;
            section.status =
              PublicPracticeAssessmentSectionStatusEnum.COMPLETED;
            section.result = overallPass
              ? PublicPracticeAssessmentSectionResultEnum.PASSED
              : PublicPracticeAssessmentSectionResultEnum.FAILED;
            logger.info({
              message:
                'Section filled with overall score (no AI result for this section)',
              context:
                'GcpVertexPracticeAssessmentProvider.processAssessmentTask',
              taskId,
              sectionId: section.id,
              sectionTitle: section.title,
            });
          }
        }
      }

      // Update status to completed
      task.status = JobAiAssessmentTaskStatusEnum.COMPLETED;
      task.assessment.status =
        PublicPracticeAssessmentStatusEnum.AI_REVIEW_COMPLETED;
      task.assessment.completedAt = new Date();
      task.updatedAt = new Date();
      await this.setTask(taskId, task);

      logger.info({
        message: 'Practice assessment evaluation completed',
        context: 'GcpVertexPracticeAssessmentProvider.processAssessmentTask',
        taskId,
        score: task.assessment.score,
        result: task.assessment.result,
      });
    } catch (error) {
      logger.error({
        message: 'Practice assessment evaluation failed',
        context: 'GcpVertexPracticeAssessmentProvider.processAssessmentTask',
        taskId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      task.status = JobAiAssessmentTaskStatusEnum.FAILED;
      task.assessment.status = PublicPracticeAssessmentStatusEnum.FAILED;
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.updatedAt = new Date();
      await this.setTask(taskId, task);

      throw error;
    }
  }

  /**
   * Gets the status of a practice assessment task
   */
  async getPracticeAssessmentTask(
    taskId: string
  ): Promise<IPracticeAssessmentTask> {
    logger.info({
      message: 'Getting practice assessment task',
      context: 'GcpVertexPracticeAssessmentProvider.getPracticeAssessmentTask',
      taskId,
    });
    return await this.getTask(taskId);
  }

  /**
   * Gets the next question for the practice assessment
   * Uses 65% JD / 35% resume weighting
   */
  async getNextQuestion(
    taskId: string,
    previousQuestionWithAnswer?: ICandidateJobAiAssessmentQuestion
  ): Promise<IPracticeAssessmentAnswerSubmitted> {
    logger.info({
      message: 'Getting next question (65% JD / 35% resume)',
      context: 'GcpVertexPracticeAssessmentProvider.getNextQuestion',
      taskId,
      hasPreviousQuestion: !!previousQuestionWithAnswer,
    });

    const task = await this.getTask(taskId);
    const assessment = task.assessment;
    const maxQuestionsPerSection =
      assessment.publicPracticeAssessmentSettings?.maxQuestionsPerSection ?? 5;

    if (!assessment.sections || assessment.sections.length <= 0) {
      throw new AppError(
        'No sections found in assessment',
        404,
        ErrorCode.NOT_FOUND
      );
    }

    // Logic to determine current section and question position
    let isAssessmentFirstQuestion = false;
    let isAssessmentLastQuestion = false;
    let isLastSection = false;
    let isSectionFirstQuestion = false;
    let isSectionLastQuestion = false;
    let sectionToGenerateQuestion: IPublicPracticeAssessmentSection | undefined;

    if (!previousQuestionWithAnswer) {
      isAssessmentFirstQuestion = isSectionFirstQuestion = true;
      sectionToGenerateQuestion = assessment.sections[0];
    } else {
      // Find current section
      const currentSection = assessment.sections.find(
        (section) => section.id === previousQuestionWithAnswer.sectionId
      );

      if (!currentSection) {
        throw new AppError(
          'Current section not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      const currentSectionQuestionCount = currentSection.questions?.length || 0;

      // Check if this is the last section
      if (currentSection.order === assessment.sections.length - 1) {
        isLastSection = true;

        if (
          currentSectionQuestionCount >= maxQuestionsPerSection ||
          previousQuestionWithAnswer.isLastQuestion === true
        ) {
          isAssessmentLastQuestion = true;
          isSectionLastQuestion = true;
        } else if (
          previousQuestionWithAnswer.order ===
          maxQuestionsPerSection - 2
        ) {
          isSectionLastQuestion = true;
        }

        sectionToGenerateQuestion = currentSection;
      } else {
        if (
          currentSectionQuestionCount >= maxQuestionsPerSection ||
          previousQuestionWithAnswer.isLastQuestion === true
        ) {
          isSectionFirstQuestion = true;
          sectionToGenerateQuestion =
            assessment.sections[currentSection.order + 1];
        } else if (
          previousQuestionWithAnswer.order ===
          maxQuestionsPerSection - 2
        ) {
          isSectionLastQuestion = true;
          sectionToGenerateQuestion = currentSection;
        } else {
          sectionToGenerateQuestion = currentSection;
        }
      }
    }

    if (!sectionToGenerateQuestion) {
      throw new AppError(
        'Section to generate question not found',
        404,
        ErrorCode.NOT_FOUND
      );
    }

    // Generate next question
    const { nextQuestion, shouldEndAssessment } = await this.generateQuestion(
      taskId,
      previousQuestionWithAnswer || null,
      isAssessmentFirstQuestion,
      isAssessmentLastQuestion,
      isSectionFirstQuestion,
      isSectionLastQuestion,
      isLastSection,
      sectionToGenerateQuestion,
      maxQuestionsPerSection
    );

    nextQuestion.order = sectionToGenerateQuestion.questions?.length ?? 0;

    // Add question to section
    if (!sectionToGenerateQuestion.questions) {
      sectionToGenerateQuestion.questions = [];
    }
    sectionToGenerateQuestion.questions.push(nextQuestion as any);

    // Update task
    task.assessment = assessment;
    task.updatedAt = new Date();
    await this.setTask(taskId, task);

    return {
      nextQuestion,
      shouldEndAssessment,
    };
  }

  /**
   * Generate a question using 65% JD / 35% resume weighting
   * Now includes dynamic difficulty level
   */
  private async generateQuestion(
    taskId: string,
    previousQuestionWithAnswer: ICandidateJobAiAssessmentQuestion | null,
    isAssessmentFirstQuestion: boolean,
    isAssessmentLastQuestion: boolean,
    isSectionFirstQuestion: boolean,
    isSectionLastQuestion: boolean,
    isLastSection: boolean,
    section: IPublicPracticeAssessmentSection,
    maxQuestionsPerSection: number
  ): Promise<{
    nextQuestion: ICandidateJobAiAssessmentQuestion;
    shouldEndAssessment: boolean;
  }> {
    const task = await this.getTask(taskId);
    const assessment = task.assessment;

    // Analyze difficulty level
    const difficultyLevel =
      GcpVertexPracticeAssessmentPromptGenerator.analyzeDifficultyLevel(
        assessment.resumeText || '',
        assessment.jobDescriptionText || ''
      );

    logger.info({
      message: 'Generating question with 65% JD / 35% resume weighting',
      context: 'GcpVertexPracticeAssessmentProvider.generateQuestion',
      taskId,
      sectionId: section.id,
      isAssessmentFirstQuestion,
      isSectionFirstQuestion,
      hasPreviousAnswer: !!previousQuestionWithAnswer?.answerGiven,
      difficultyLevel,
    });

    // Get chat session or create new one
    let chat = this.chatSessions.get(taskId);
    if (!chat) {
      await this.initializeChatSession(
        taskId,
        assessment.resumeText || '',
        assessment.jobDescriptionText || '',
        difficultyLevel
      );
      chat = this.chatSessions.get(taskId);
    }

    // Build chat history from previous questions
    const chatHistory: Array<{ role: string; content: string }> = [];
    assessment.sections?.forEach((s) => {
      s.questions?.forEach((q) => {
        chatHistory.push({ role: 'model', content: q.question });
        if (q.answerGiven) {
          chatHistory.push({ role: 'user', content: q.answerGiven });
        }
      });
    });

    // If there's a previous question with answer, generate answer analysis prompt
    let answerAnalysisPrompt = '';
    if (previousQuestionWithAnswer?.answerGiven) {
      answerAnalysisPrompt =
        GcpVertexPracticeAssessmentPromptGenerator.generateAnswerPrompt(
          previousQuestionWithAnswer
        );
      logger.info({
        message: 'Including previous answer analysis in prompt',
        context: 'GcpVertexPracticeAssessmentProvider.generateQuestion',
        taskId,
        previousQuestionId: previousQuestionWithAnswer.id,
        answerLength: previousQuestionWithAnswer.answerGiven.length,
      });
    }

    // Convert section to the format expected by prompt generator
    const sectionForPrompt: ICandidateJobAiAssessmentSection = {
      id: section.id,
      assessmentId: section.assessmentId,
      title: section.title,
      description: section.description || '',
      type: section.type as any,
      status: section.status as any,
      result: section.result as any,
      score: section.score,
      order: section.order,
      passThreshold: section.passThreshold || 0.7,
      isRequired: section.isRequired !== false,
      startedAt: section.startedAt,
      completedAt: section.completedAt,
      feedback: section.feedback,
      strengths: section.strengths || [],
      areasForImprovement: section.areasForImprovement || [],
      questions: (section.questions || []).map((q) => ({
        id: q.id,
        sectionId: q.sectionId,
        question: q.question,
        questionType: q.questionType as any,
        options: q.options,
        correctAnswer: q.correctAnswer,
        answerGiven: q.answerGiven,
        score: q.score,
        maxScore: q.maxScore,
        order: q.order,
        isRequired: q.isRequired,
        isLastQuestion: q.isLastQuestion,
        feedback: q.feedback,
        isAnswered: q.isAnswered,
      })),
    };

    // Generate prompt using 65% JD / 35% resume weighting with difficulty level
    const basePrompt =
      GcpVertexPracticeAssessmentPromptGenerator.generateQuestionPrompt(
        isAssessmentFirstQuestion,
        isAssessmentLastQuestion,
        isSectionFirstQuestion,
        isSectionLastQuestion,
        isLastSection,
        sectionForPrompt,
        maxQuestionsPerSection,
        chatHistory,
        assessment.resumeText || '',
        assessment.jobDescriptionText || '',
        assessment.sections?.map((s) => ({
          id: s.id,
          assessmentId: s.assessmentId,
          title: s.title,
          description: s.description || '',
          type: s.type as any,
          status: s.status as any,
          result: s.result as any,
          score: s.score,
          order: s.order,
          passThreshold: s.passThreshold || 0.7,
          isRequired: s.isRequired !== false,
          startedAt: s.startedAt,
          completedAt: s.completedAt,
          feedback: s.feedback,
          strengths: s.strengths || [],
          areasForImprovement: s.areasForImprovement || [],
          questions: [],
        })) || [],
        difficultyLevel
      );

    // Combine answer analysis with base prompt if previous answer exists
    const prompt = answerAnalysisPrompt
      ? `${answerAnalysisPrompt}\n\n${basePrompt}`
      : basePrompt;

    // Generate question using chat
    const result = await this.retryWithExponentialBackoff(
      async () => {
        const response = await chat.sendMessage(prompt);
        return this.parseLLMResponse(response.response, 'question generation');
      },
      'generate question',
      taskId
    );

    // Validate and create question
    const validated = QuestionSchema.safeParse(result);
    const questionData = validated.success ? validated.data : result;

    const nextQuestion: ICandidateJobAiAssessmentQuestion = {
      id: uuidv4(),
      sectionId: section.id,
      question:
        questionData.question ||
        'Tell me about your experience with the technologies mentioned in this role.',
      questionType: questionData.questionType || QuestionTypeEnum.TEXT,
      options: questionData.options || undefined,
      correctAnswer: questionData.correctAnswer || undefined,
      answerGiven: undefined,
      score: 0,
      maxScore: questionData.maxScore || 1.0,
      order: section.questions?.length || 0,
      isRequired: true,
      isLastQuestion:
        isAssessmentLastQuestion ||
        (isSectionLastQuestion && isLastSection) ||
        questionData.isLastQuestion ||
        false,
      feedback: undefined,
      isAnswered: false,
    };

    return {
      nextQuestion,
      shouldEndAssessment: questionData.shouldEndAssessment || false,
    };
  }

  /**
   * Saves the answer for a practice assessment question
   */
  async saveAnswer(
    taskId: string,
    question: ICandidateJobAiAssessmentQuestion
  ): Promise<ICandidateJobAiAssessmentQuestion> {
    const task = await this.getTask(taskId);
    const assessment = task.assessment;

    // Find the section containing the question
    const section = assessment.sections?.find(
      (s) => s.id === question.sectionId
    );
    if (!section) {
      throw new AppError('Section not found', 404, ErrorCode.NOT_FOUND);
    }

    // Find and update the question
    const questionIndex = section.questions?.findIndex(
      (q) => q.id === question.id
    );
    if (questionIndex === undefined || questionIndex === -1) {
      throw new AppError('Question not found', 404, ErrorCode.NOT_FOUND);
    }

    if (section.questions) {
      section.questions[questionIndex] = question as any;
    }
    task.assessment.updatedAt = new Date();

    await this.setTask(taskId, task);

    return question;
  }

  /**
   * Process the practice assessment video analysis
   */
  async doAssessmentVideoAnalysis(
    taskId: string
  ): Promise<IPracticeAssessmentTask> {
    logger.info({
      message: 'Processing practice assessment video analysis',
      context: 'GcpVertexPracticeAssessmentProvider.doAssessmentVideoAnalysis',
      taskId,
    });

    const task = await this.getTask(taskId);

    // For practice assessments, video analysis is handled by the IntelligentChunkAnalysisService
    // This method is a placeholder for compatibility

    task.updatedAt = new Date();
    await this.setTask(taskId, task);

    return task;
  }

  // ============================================
  // Helper Methods
  // ============================================

  private cleanJsonResponse(text: string): string {
    try {
      JSON.parse(text);
      return text;
    } catch {
      let cleaned = text
        .replace(/```(?:json)?\n?|\n?```/g, '')
        .trim()
        .replace(/^["']|["']$/g, '')
        .replace(/^\uFEFF/, '')
        .replace(/^[^{[]*([{[])/, '$1')
        .replace(/([}\]])[^}\]]*$/, '$1');

      cleaned = cleaned
        .replace(/(\d+)\s*\.\s*(\d+)/g, '$1.$2')
        .replace(/}\s*\n\s*{/g, '},\n{')
        .replace(/]\s*\n\s*\[/g, '],\n[')
        .replace(/}\s*"/g, '},"')
        .replace(/]\s*"/g, '],"')
        .replace(/,\s*]/g, ']')
        .replace(/,\s*}/g, '}')
        .replace(/,,+/g, ',')
        .replace(/"\s*:\s*/g, '": ')
        .replace(/\n\s*/g, ' ')
        .replace(/\s+/g, ' ');

      try {
        JSON.parse(cleaned);
        return cleaned;
      } catch {
        const jsonMatches = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (jsonMatches && jsonMatches[0]) {
          try {
            JSON.parse(jsonMatches[0]);
            return jsonMatches[0];
          } catch {
            // Return cleaned version
          }
        }
        return cleaned;
      }
    }
  }

  private async parseLLMResponse(response: any, context: string): Promise<any> {
    if (!response.candidates?.[0]?.content?.parts?.[0]?.text) {
      logger.error('Invalid response structure from Vertex AI', {
        context: `GcpVertexPracticeAssessmentProvider.${context}`,
      });
      throw new Error('Invalid response from Vertex AI');
    }

    const originalText = response.candidates[0].content.parts[0].text;

    try {
      const cleanedResponse = this.cleanJsonResponse(originalText);
      return JSON.parse(cleanedResponse);
    } catch (parseError) {
      logger.error(`Failed to parse ${context} data`, {
        context: `GcpVertexPracticeAssessmentProvider.${context}`,
        error:
          parseError instanceof Error ? parseError.message : 'Unknown error',
        responsePreview: originalText.substring(0, 500),
      });

      // Try emergency recovery
      try {
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
          return JSON.parse(extractedJson);
        }
      } catch {
        // Emergency recovery failed
      }

      throw new Error(`Invalid JSON response from ${context}`);
    }
  }

  private async retryWithExponentialBackoff<T>(
    operation: () => Promise<T>,
    operationName: string,
    taskId: string
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        if (attempt < this.maxRetries) {
          const delay = this.retryDelays[attempt] || 5000;
          logger.warn({
            message: `Retry attempt ${attempt + 1} for ${operationName}`,
            context:
              'GcpVertexPracticeAssessmentProvider.retryWithExponentialBackoff',
            taskId,
            error: lastError.message,
            delayMs: delay,
          });
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw (
      lastError ||
      new Error(`Failed ${operationName} after ${this.maxRetries} retries`)
    );
  }
}
