import { singleton } from '@/shared/decorators/singleton';
import {
  IAiResumeAssessmentTask,
  IAiResumeAssessmentStatus,
  IResumeAssessmentProvider,
} from '../resume.assessment.provider';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/shared/utils/logger';
import { ENV } from '@/config/env';
import { VertexAI } from '@google-cloud/vertexai';
import { gcpConfig } from '@/config/gcp';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { z } from 'zod';
import Redis from 'ioredis';
import { IResumeAssessment } from '@/shared/models/domain/candidate/resume.assessment.domain';
import {
  ResumeAssessmentStatusEnum,
  ResumeAssessmentResultEnum,
  ResumeAssessmentRecommendationEnum,
} from '@/shared/models/common/enums';
import { GcpVertexResumeAssessmentPromptGenerator } from './gcp.vertex.resume.assessment.prompt.generator';

// Schema definitions for validation
const ResumeAssessmentSchema = z.object({
  strengths: z.array(z.string()),
  areasForImprovement: z.array(z.string()),
  skills: z.array(z.string()),
  experienceSummary: z.string().optional(),
  educationSummary: z.string().optional(),
  technicalSkills: z.array(z.string()),
  softSkills: z.array(z.string()),
  yearsOfExperience: z.number().optional(),
  industriesFit: z.array(z.string()),
  jobRolesFit: z.array(z.string()),
  overallFeedback: z.string().optional(),
  recommendation: z.nativeEnum(ResumeAssessmentRecommendationEnum).optional(),
  score: z.number().min(0).max(1),
  confidenceScore: z.number().min(0).max(1),
});

type ResumeAssessmentData = z.infer<typeof ResumeAssessmentSchema>;

@singleton
export class GcpVertexResumeAssessmentProvider
  implements IResumeAssessmentProvider
{
  private redis: Redis | null = null;
  private tasks: Map<string, IAiResumeAssessmentTask>;
  private vertexAI: VertexAI;
  private model: string;
  private location: string;
  private projectId: string;
  private taskCacheTTL = 86400; // 24 hours in seconds
  private useRedisCache: boolean;

  constructor() {
    this.tasks = new Map();
    this.model = ENV.GOOGLE_CLOUD_VERTEX_AI_MODEL;
    this.location = ENV.GOOGLE_CLOUD_VERTEX_AI_LOCATION;
    this.projectId = ENV.GOOGLE_CLOUD_PROJECT_ID;
    this.useRedisCache = ENV.USE_REDIS_CACHE;

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
          keyPrefix: `${ENV.ENV_NAME}:resume_assessment:`,
          connectTimeout: 5000,
          retryStrategy: (times: number) => {
            const delay = Math.min(times * 100, 3000);
            return delay;
          },
        });

        this.redis.on('error', (err: Error) => {
          logger.error('Redis error', {
            error: err.message,
            context: 'GcpVertexResumeAssessmentProvider',
          });
        });

        logger.info('Redis cache initialized for resume assessment', {
          context: 'GcpVertexResumeAssessmentProvider.constructor',
        });
      } catch (error) {
        logger.error('Failed to initialize Redis', {
          error: error instanceof Error ? error.message : 'Unknown error',
          context: 'GcpVertexResumeAssessmentProvider.constructor',
        });
        this.redis = null;
      }
    } else {
      logger.info('Using local Map storage for resume assessment tasks', {
        context: 'GcpVertexResumeAssessmentProvider.constructor',
      });
    }

    logger.info('GCP Vertex AI Resume Assessment Provider initialized', {
      context: 'GcpVertexResumeAssessmentProvider.constructor',
      model: this.model,
      location: this.location,
      projectId: this.projectId,
    });
  }

  /**
   * Get a task from storage (Redis or Map)
   */
  private async getTask(taskId: string): Promise<IAiResumeAssessmentTask> {
    if (this.useRedisCache && this.redis) {
      const taskData = await this.redis.get(taskId);
      if (!taskData) {
        throw new AppError(
          `Assessment task not found with id ${taskId}`,
          404,
          ErrorCode.RESUME_ASSESSMENT_NOT_FOUND
        );
      }
      return JSON.parse(taskData);
    } else {
      const task = this.tasks.get(taskId);
      if (!task) {
        throw new AppError(
          `Assessment task not found with id ${taskId}`,
          404,
          ErrorCode.RESUME_ASSESSMENT_NOT_FOUND
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
    task: IAiResumeAssessmentTask
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
          context: 'GcpVertexResumeAssessmentProvider.setTask',
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
          context: 'GcpVertexResumeAssessmentProvider.deleteTask',
        });
        this.tasks.delete(taskId);
      }
    } else {
      this.tasks.delete(taskId);
    }
  }

  /**
   * Determines if an error is retryable based on error type and message
   * @param error The error to check
   * @returns True if the error is retryable, false otherwise
   */
  private isRetryableError(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();

    // Retryable errors
    const retryablePatterns = [
      'rate limit',
      'throttling',
      'throttled',
      'quota exceeded',
      'service unavailable',
      'timeout',
      'connection error',
      'network error',
      'temporary failure',
      'server error',
      'internal error',
      'bad gateway',
      'gateway timeout',
      'service temporarily unavailable',
      'invalid response from vertex ai',
      'could not find valid json in response',
      'invalid json response from assessment',
      'failed to parse resume assessment data',
    ];

    // Non-retryable errors
    const nonRetryablePatterns = [
      'authentication',
      'unauthorized',
      'forbidden',
      'not found',
      'invalid request',
      'malformed request',
      'permission denied',
      'access denied',
      'invalid credentials',
      'bad request',
    ];

    // Check for non-retryable patterns first
    for (const pattern of nonRetryablePatterns) {
      if (errorMessage.includes(pattern)) {
        return false;
      }
    }

    // Check for retryable patterns
    for (const pattern of retryablePatterns) {
      if (errorMessage.includes(pattern)) {
        return true;
      }
    }

    // Check HTTP status codes if available
    if (error.message.includes('status')) {
      const statusMatch = error.message.match(/status[:\s]+(\d+)/i);
      if (statusMatch) {
        const statusCode = parseInt(statusMatch[1], 10);

        // 5xx errors are generally retryable
        if (statusCode >= 500 && statusCode < 600) {
          return true;
        }

        // 429 (Too Many Requests) is retryable
        if (statusCode === 429) {
          return true;
        }

        // 4xx errors (except 429) are generally not retryable
        if (statusCode >= 400 && statusCode < 500) {
          return false;
        }
      }
    }

    // Default to retryable for unknown errors to be safe
    // This allows the system to attempt retries for unexpected errors
    return true;
  }

  /**
   * Attempts to assess resume with model in a single attempt
   * @param taskId The task ID
   * @param task The task object
   * @param resumeText The resume text content
   * @param attempt The current attempt number
   * @returns The assessment data from the model
   */
  private async attemptResumeAssessmentWithModel(
    taskId: string,
    task: IAiResumeAssessmentTask,
    resumeText: string,
    attempt: number
  ): Promise<any> {
    // Get the model
    const generativeModel = this.vertexAI.preview.getGenerativeModel({
      model: `projects/${this.projectId}/locations/${this.location}/publishers/google/models/${this.model}`,
    });

    // Update task status to creating prompt
    task.status = IAiResumeAssessmentStatus.CREATING_PROMPT;
    await this.setTask(taskId, task);

    const prompt =
      GcpVertexResumeAssessmentPromptGenerator.generateResumeAssessmentPrompt();

    logger.debug('Prompt for resume assessment', {
      context:
        'GcpVertexResumeAssessmentProvider.attemptResumeAssessmentWithModel',
      prompt,
      attempt,
    });

    // Update task status to LLM processing
    task.status = IAiResumeAssessmentStatus.STARTED;
    await this.setTask(taskId, task);

    // Generate content
    const result = await generativeModel.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'text/plain',
                data: Buffer.from(resumeText).toString('base64'),
              },
            },
          ],
        },
      ],
    });

    logger.debug('Raw resume assessment result', {
      context:
        'GcpVertexResumeAssessmentProvider.attemptResumeAssessmentWithModel',
      rawResponse: result.response.candidates?.[0]?.content?.parts?.[0]?.text,
      attempt,
    });

    const response = result.response;
    if (!response.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response from Vertex AI');
    }

    // Clean the response text to ensure it's valid JSON
    let responseText = response.candidates[0].content.parts[0].text
      .replace(/^```(?:json)?\s*/g, '')
      .replace(/\s*```$/g, '')
      .replace(/^`/g, '')
      .replace(/`$/g, '')
      .trim();

    // If the response is still not valid JSON, try to extract JSON from the text
    if (!responseText.startsWith('{')) {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        responseText = jsonMatch[0];
      } else {
        throw new Error('Could not find valid JSON in response');
      }
    }

    logger.debug('Cleaned resume assessment result', {
      context:
        'GcpVertexResumeAssessmentProvider.attemptResumeAssessmentWithModel',
      cleanedResponse: responseText,
      attempt,
    });

    // Parse and validate the response
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch (parseError) {
      logger.error('Failed to parse resume assessment data', {
        context:
          'GcpVertexResumeAssessmentProvider.attemptResumeAssessmentWithModel',
        error:
          parseError instanceof Error ? parseError.message : 'Unknown error',
        responseText,
        attempt,
      });
      throw new Error('Invalid JSON response from assessment');
    }

    return parsedData;
  }

  /**
   * Initiates the resume assessment
   */
  async doAssessment(
    taskId: string,
    resumeText: string
  ): Promise<IAiResumeAssessmentTask> {
    // check if task for the taskId exists and if it is not failed or completed
    const task = this.tasks.get(taskId);
    if (task) {
      if (
        task.status !== IAiResumeAssessmentStatus.FAILED &&
        task.status !== IAiResumeAssessmentStatus.COMPLETED
      ) {
        throw new AppError(
          'Resume assessment task already exists',
          400,
          ErrorCode.RESUME_ASSESSMENT_TASK_ALREADY_EXISTS
        );
      }
    }

    const newTask: IAiResumeAssessmentTask = {
      taskId,
      status: IAiResumeAssessmentStatus.PENDING,
      resumeText,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.setTask(taskId, newTask);

    // Start processing
    await this.processTask(taskId);

    return newTask;
  }

  /**
   * Gets the status of an assessment task
   */
  async getAssessmentTask(taskId: string): Promise<IAiResumeAssessmentTask> {
    return await this.getTask(taskId);
  }

  /**
   * Process the resume assessment task using Vertex AI
   */
  private async processTask(taskId: string): Promise<void> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error(`Assessment task not found with id ${taskId}`);
    }

    try {
      // Update task status to processing
      task.status = IAiResumeAssessmentStatus.STARTED;
      task.updatedAt = new Date();
      await this.setTask(taskId, task);

      if (!task.resumeText) {
        throw new Error('Resume text not found');
      }

      // Process with retry logic and exponential backoff
      const maxRetries = ENV.GEMINI_MAX_RETRIES;
      let lastError: Error | null = null;
      let parsedData: any = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          parsedData = await this.attemptResumeAssessmentWithModel(
            taskId,
            task,
            task.resumeText,
            attempt
          );

          // If we reach here, the attempt was successful
          logger.info('Resume assessment successful', {
            context: 'GcpVertexResumeAssessmentProvider.processTask',
            attempt,
            totalAttempts: maxRetries,
          });
          break;
        } catch (error) {
          lastError =
            error instanceof Error ? error : new Error('Unknown error');

          logger.warn('Resume assessment attempt failed', {
            context: 'GcpVertexResumeAssessmentProvider.processTask',
            attempt,
            totalAttempts: maxRetries,
            error: lastError.message,
          });

          // Check if this is the last attempt
          if (attempt === maxRetries) {
            logger.error('All resume assessment attempts failed', {
              context: 'GcpVertexResumeAssessmentProvider.processTask',
              totalAttempts: maxRetries,
              finalError: lastError.message,
            });
            throw lastError;
          }

          // Check if error is retryable
          const isRetryable = this.isRetryableError(lastError);
          if (!isRetryable) {
            logger.error('Non-retryable error encountered', {
              context: 'GcpVertexResumeAssessmentProvider.processTask',
              error: lastError.message,
              attempt,
            });
            throw lastError;
          }

          // Calculate exponential backoff delay
          const baseDelay = 1000; // 1 second
          const backoffMultiplier = 2;
          const jitter = Math.random() * 0.1; // 10% jitter
          const delay =
            baseDelay * Math.pow(backoffMultiplier, attempt - 1) * (1 + jitter);

          logger.info('Retrying resume assessment with exponential backoff', {
            context: 'GcpVertexResumeAssessmentProvider.processTask',
            attempt,
            nextAttempt: attempt + 1,
            delayMs: Math.round(delay),
          });

          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      if (!parsedData) {
        throw (
          lastError || new Error('Failed to assess resume after all attempts')
        );
      }

      // Parse and validate the response
      task.status = IAiResumeAssessmentStatus.PARSING_RESULTS;
      await this.setTask(taskId, task);

      // Validate the structure of the response
      const validatedData = ResumeAssessmentSchema.parse(
        parsedData
      ) as ResumeAssessmentData;

      // Create the assessment object
      const assessment = this.createAssessmentFromValidatedData(
        validatedData,
        taskId,
        task
      );

      // Update task status to completed
      task.status = IAiResumeAssessmentStatus.COMPLETED;
      task.assessment = assessment;
      task.updatedAt = new Date();
      await this.setTask(taskId, task);
    } catch (error) {
      // Update task status to failed
      task.status = IAiResumeAssessmentStatus.FAILED;
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.updatedAt = new Date();
      await this.setTask(taskId, task);

      throw error;
    }
  }

  /**
   * Creates an assessment object from validated data
   * @param validatedData The validated assessment data
   * @param taskId The task ID
   * @param task The current task
   * @returns The created assessment object
   */
  private createAssessmentFromValidatedData(
    validatedData: ResumeAssessmentData,
    taskId: string,
    task: IAiResumeAssessmentTask
  ): IResumeAssessment {
    if (!task.resumeText) {
      throw new Error('Resume text is required to create assessment');
    }

    return {
      id: uuidv4(),
      candidateId: taskId, // Using taskId as candidateId for now
      status: ResumeAssessmentStatusEnum.AI_REVIEW_COMPLETED,
      result:
        validatedData.recommendation ==
          ResumeAssessmentRecommendationEnum.RECOMMENDED ||
        validatedData.recommendation ==
          ResumeAssessmentRecommendationEnum.HIGHLY_RECOMMENDED
          ? ResumeAssessmentResultEnum.PASSED
          : ResumeAssessmentResultEnum.AI_REVIEW_FAILED,
      score: validatedData.score,
      confidenceScore: validatedData.confidenceScore,
      resumeText: task.resumeText,
      strengths: validatedData.strengths,
      areasForImprovement: validatedData.areasForImprovement,
      skills: validatedData.skills,
      experienceSummary: validatedData.experienceSummary,
      educationSummary: validatedData.educationSummary,
      technicalSkills: validatedData.technicalSkills,
      softSkills: validatedData.softSkills,
      yearsOfExperience: validatedData.yearsOfExperience,
      industriesFit: validatedData.industriesFit,
      jobRolesFit: validatedData.jobRolesFit,
      overallFeedback: validatedData.overallFeedback,
      recommendation: validatedData.recommendation,
      startedAt: task.createdAt,
      completedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}
