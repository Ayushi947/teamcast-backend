import { singleton } from '@/shared/decorators/singleton';
import {
  IJobParserProvider,
  IAiJobParsingTask,
  IAiJobParsingStatus,
} from '../job.parser.provider';
import { logger } from '@/shared/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { JobParsingMode } from '@/shared/models/domain/client/job.parsing.domain';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { ENV } from '@/config/env';
import { VertexAI } from '@google-cloud/vertexai';
import { gcpConfig } from '@/config/gcp';
import {
  WorkTypeEnum,
  WorkCommitmentEnum,
  WorkScheduleEnum,
} from '@/shared/models/common/enums';
import { z } from 'zod';
import axios from 'axios';
import Redis from 'ioredis';
import { IStorageProvider } from '@/services/helpers/storage/storage.interface';
import { StorageFactory } from '@/services/helpers/storage/storage.factory';
import { GcpVertexJobParserPromptGenerator } from './gcp.vertex.job.parser.prompt.generator';

// Schema definitions for validation
const JobRequirementSchema = z.object({
  skill: z.string(),
  required: z.boolean(),
  experience: z.number().optional(),
});

const JobParsingSchema = z.object({
  // Core job information - matching IJobPosting
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  department: z.string().nullable().optional(),

  // Job type enums - matching IJobPosting
  jobType: z.string().nullable().optional(), // Maps to WorkTypeEnum
  jobCommitment: z.string().nullable().optional(), // Maps to WorkCommitmentEnum
  jobSchedule: z.string().nullable().optional(), // Maps to WorkScheduleEnum
  industry: z.string().nullable().optional(), // Maps to CompanyIndustryEnum

  // Experience and team info - matching IJobPosting
  totalExperience: z.number().nullable().optional(),
  teamSize: z.number().nullable().optional(),
  reportingTo: z.string().nullable().optional(),
  hiring_manager_email: z.string().nullable().optional(),

  // Application details - matching IJobPosting
  applicationDeadline: z.string().nullable().optional(),
  availableFrom: z.string().nullable().optional(),
  numberOfOpenings: z.number().nullable().optional(),
  applicationUrl: z.string().nullable().optional(),

  // Job features - matching IJobPosting
  isFeatured: z.boolean().nullable().optional(),
  isRemote: z.boolean().nullable().optional(),

  // Salary information - matching IJobPosting
  minSalary: z.number().nullable().optional(),
  maxSalary: z.number().nullable().optional(),
  salaryCurrency: z.string().nullable().optional(),
  equity: z.boolean().nullable().optional(),

  // Job content arrays - matching IJobPosting
  benefits: z.array(z.string()).nullable().optional(),
  responsibilities: z.array(z.string()).nullable().optional(),
  requiredSkills: z.array(z.string()).nullable().optional(),
  preferredSkills: z.array(z.string()).nullable().optional(),
  preferredUniversities: z.array(z.string()).nullable().optional(),
  preferredDegrees: z.array(z.string()).nullable().optional(),
  preferredLocations: z.array(z.string()).nullable().optional(),
  preferredIndustries: z.array(z.string()).nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),

  // Additional fields for parsing context (not in IJobPosting)
  location: z.string().nullable().optional(),
  contactEmail: z.string().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  companyName: z.string().nullable().optional(),
  companyDescription: z.string().nullable().optional(),
  companyWebsite: z.string().nullable().optional(),
  educationLevel: z.string().nullable().optional(),
  languages: z.array(z.string()).nullable().optional(),
  certifications: z.array(z.string()).nullable().optional(),
  travelRequirement: z.string().nullable().optional(),
  securityClearance: z.string().nullable().optional(),

  // Legacy fields for backward compatibility
  workType: z.string().nullable().optional(), // Will map to jobType
  workCommitment: z.string().nullable().optional(), // Will map to jobCommitment
  workSchedule: z.string().nullable().optional(), // Will map to jobSchedule
  requirements: z.array(JobRequirementSchema).nullable().optional(), // Will map to requiredSkills
  preferredQualifications: z.array(z.string()).nullable().optional(), // Will map to preferredSkills
  skills: z.array(z.string()).nullable().optional(), // Will merge with requiredSkills
  minExperience: z.number().nullable().optional(), // Will map to totalExperience
  maxExperience: z.number().nullable().optional(), // Will map to totalExperience
  salaryPer: z.string().nullable().optional(), // Additional salary context
  workLocationTypes: z.array(z.string()).nullable().optional(), // Additional location context
  isUrgent: z.boolean().nullable().optional(), // Additional job priority info
});

@singleton
export class GcpVertexJobParserProvider implements IJobParserProvider {
  private redis: Redis | null = null;
  private tasks: Map<string, IAiJobParsingTask>;
  private vertexAI: VertexAI;
  private model: string;
  private location: string;
  private projectId: string;
  private taskCacheTTL = 86400; // 24 hours in seconds
  private useRedisCache: boolean;

  private storageProvider: IStorageProvider;

  constructor() {
    this.tasks = new Map();
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
          keyPrefix: `${ENV.ENV_NAME}:job_parser:`,
          connectTimeout: 5000,
          retryStrategy: (times: number) => {
            const delay = Math.min(times * 100, 3000);
            return delay;
          },
        });

        this.redis.on('error', (err: Error) => {
          logger.error('Redis error', {
            error: err.message,
            context: 'GcpVertexJobParserProvider',
          });
        });

        logger.info('Redis cache initialized for job parser', {
          context: 'GcpVertexJobParserProvider.constructor',
        });
      } catch (error) {
        logger.error('Failed to initialize Redis', {
          error: error instanceof Error ? error.message : 'Unknown error',
          context: 'GcpVertexJobParserProvider.constructor',
        });
        this.redis = null;
      }
    } else {
      logger.info('Using local Map storage for job parser tasks', {
        context: 'GcpVertexJobParserProvider.constructor',
      });
    }

    logger.info('GCP Vertex AI Job Parser Provider initialized', {
      context: 'GcpVertexJobParserProvider.constructor',
      model: this.model,
      location: this.location,
      projectId: this.projectId,
    });
  }

  /**
   * Get a task from storage (Redis or Map)
   * @param taskId The task ID
   * @returns The task or throws error if not found
   */
  private async getTask(taskId: string): Promise<IAiJobParsingTask> {
    if (this.useRedisCache && this.redis) {
      const taskData = await this.redis.get(taskId);
      if (!taskData) {
        throw new AppError(
          `Parsing task not found with id ${taskId}`,
          404,
          ErrorCode.PARSING_TASK_NOT_FOUND
        );
      }
      return JSON.parse(taskData);
    } else {
      // Fallback to Map if Redis fails
      const task = this.tasks.get(taskId);
      if (!task) {
        throw new AppError(
          `Parsing task not found with id ${taskId}`,
          404,
          ErrorCode.PARSING_TASK_NOT_FOUND
        );
      }
      return task;
    }
  }

  /**
   * Set a task in storage (Redis or Map)
   * @param taskId The task ID
   * @param task The task to store
   */
  private async setTask(
    taskId: string,
    task: IAiJobParsingTask
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
          context: 'GcpVertexJobParserProvider.setTask',
        });
        // Fallback to Map if Redis fails
        this.tasks.set(taskId, task);
      }
    } else {
      this.tasks.set(taskId, task);
    }
  }

  /**
   * Delete a task from storage (Redis or Map)
   * @param taskId The task ID
   */
  private async deleteTask(taskId: string): Promise<void> {
    if (this.useRedisCache && this.redis) {
      try {
        await this.redis.del(taskId);
      } catch (error) {
        logger.error('Failed to delete task from Redis', {
          error: error instanceof Error ? error.message : 'Unknown error',
          taskId,
          context: 'GcpVertexJobParserProvider.deleteTask',
        });
        // Fallback to Map if Redis fails
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
      'invalid json response from parsing',
      'invalid validation result structure',
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
    return true;
  }

  /**
   * Detects the MIME type based on file content and URL
   * @param fileUrl The file URL
   * @param fileBuffer The file buffer
   * @returns The detected MIME type
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
    if (url.includes('.doc')) {
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

  /**
   * Attempts to parse job description with model in a single attempt
   * @param taskId The task ID
   * @param task The task object
   * @param jobFile The job description file buffer
   * @param mode The parsing mode
   * @param attempt The current attempt number
   * @returns The parsed data from the model
   */
  private async attemptJobParsingWithModel(
    taskId: string,
    task: IAiJobParsingTask,
    jobFile: Buffer,
    mode: JobParsingMode,
    attempt: number
  ): Promise<any> {
    // Get the model
    const generativeModel = this.vertexAI.preview.getGenerativeModel({
      model: `projects/${this.projectId}/locations/${this.location}/publishers/google/models/${this.model}`,
    });

    // Prepare the prompt for job parsing based on mode
    task.status = IAiJobParsingStatus.CREATING_PROMPT;
    await this.setTask(taskId, task);
    const prompt =
      GcpVertexJobParserPromptGenerator.generateJobParsingPrompt(mode);

    logger.debug('Prompt for job parsing', {
      context: 'GcpVertexJobParserProvider.attemptJobParsingWithModel',
      mode,
      prompt,
      attempt,
    });

    task.status = IAiJobParsingStatus.LLM_PROCESSING;
    await this.setTask(taskId, task);

    // Detect the file type
    const mimeType = this.detectMimeType(task.fileUrl, jobFile);

    logger.debug('Detected file type for job parsing', {
      context: 'GcpVertexJobParserProvider.attemptJobParsingWithModel',
      fileUrl: task.fileUrl,
      mimeType,
      attempt,
    });

    let contentParts: any[];

    // Handle text files differently
    if (mimeType === 'text/plain') {
      // For text files, include the content directly as text
      const textContent = jobFile.toString('utf-8');
      contentParts = [
        { text: prompt },
        { text: `\n\nJOB DESCRIPTION CONTENT:\n${textContent}` },
      ];
    } else {
      // For binary files (PDF, DOC, etc.), use inlineData
      contentParts = [
        { text: prompt },
        {
          inlineData: {
            mimeType,
            data: jobFile.toString('base64'),
          },
        },
      ];
    }

    // Generate content with appropriate input format
    const result = await generativeModel.generateContent({
      contents: [
        {
          role: 'user',
          parts: contentParts,
        },
      ],
    });

    logger.debug('Raw job parsing result', {
      context: 'GcpVertexJobParserProvider.attemptJobParsingWithModel',
      rawResponse: result.response.candidates?.[0]?.content?.parts?.[0]?.text,
      attempt,
    });

    const response = result.response;
    if (!response.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response from Vertex AI');
    }

    // Clean the response text to ensure it's valid JSON
    let responseText = response.candidates[0].content.parts[0].text
      .replace(/^```(?:json)?\s*/g, '') // Remove ```json or ``` prefix
      .replace(/\s*```$/g, '') // Remove ``` suffix
      .replace(/^`/g, '') // Remove any leading backtick
      .replace(/`$/g, '') // Remove any trailing backtick
      .trim(); // Remove any extra whitespace

    // If the response is still not valid JSON, try to extract JSON from the text
    if (!responseText.startsWith('{')) {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        responseText = jsonMatch[0];
      } else {
        throw new Error('Could not find valid JSON in response');
      }
    }

    logger.debug('Cleaned job parsing result', {
      context: 'GcpVertexJobParserProvider.attemptJobParsingWithModel',
      cleanedResponse: responseText,
      attempt,
    });

    // Parse and validate the response
    task.status = IAiJobParsingStatus.PARSING_RESULTS;
    await this.setTask(taskId, task);

    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch (parseError) {
      logger.error('Failed to parse job data', {
        context: 'GcpVertexJobParserProvider.attemptJobParsingWithModel',
        error:
          parseError instanceof Error ? parseError.message : 'Unknown error',
        responseText,
        attempt,
      });
      throw new Error('Invalid JSON response from parsing');
    }

    // Validate the structure of the response
    if (
      typeof parsedData.isValidJobDescription !== 'boolean' ||
      typeof parsedData.validationReason !== 'string' ||
      typeof parsedData.confidence !== 'number'
    ) {
      throw new Error('Invalid validation result structure');
    }

    return parsedData;
  }

  /**
   * Initiates the job parsing job using GCP Vertex AI
   * @param taskId The task ID
   * @param jobUrl The URL of the job description to parse
   * @param mode The parsing mode to use
   * @returns A promise that resolves to the parsing task
   */
  async parse(
    taskId: string,
    jobUrl: string,
    mode: JobParsingMode = JobParsingMode.INFERRED
  ): Promise<IAiJobParsingTask> {
    // Check if task for the taskId exists and if it is not failed or completed
    try {
      const existingTask = await this.getTask(taskId);
      if (
        existingTask.status !== IAiJobParsingStatus.FAILED &&
        existingTask.status !== IAiJobParsingStatus.COMPLETED
      ) {
        throw new AppError(
          'Job parsing task already exists',
          400,
          ErrorCode.JD_PARSING_TASK_ALREADY_EXISTS
        );
      }
    } catch (error) {
      // Task doesn't exist, which is fine for new tasks
      if (!(error instanceof AppError && error.statusCode === 404)) {
        throw error;
      }
    }

    const newTask: IAiJobParsingTask = {
      taskId,
      status: IAiJobParsingStatus.PENDING,
      fileUrl: jobUrl,
      mode,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.setTask(taskId, newTask);

    // Start processing
    await this.parseJobDescription(taskId, mode);

    return newTask;
  }

  /**
   * Gets the status of a parsing task
   * @param taskId The identifier of the parsing task
   * @returns A promise that resolves to the parsing task status
   */
  async getParsingTask(taskId: string): Promise<IAiJobParsingTask> {
    return await this.getTask(taskId);
  }

  /**
   * Gets the parsed job description
   * @param taskId The identifier of the parsing task
   * @returns A promise that resolves to the parsed job description
   */
  async getParsedJob(taskId: string): Promise<any> {
    const task = await this.getTask(taskId);

    if (task.status !== IAiJobParsingStatus.COMPLETED) {
      throw new AppError(
        `Job parsing is not completed yet. Current status: ${task.status}`,
        400,
        ErrorCode.JD_PARSING_TASK_NOT_COMPLETED
      );
    }

    return task.parsedJob;
  }

  /**
   * Downloads the job description file from the given URL
   * @param fileUrl The URL of the job description file
   * @returns The file content as a Buffer
   */
  private async downloadJobFile(fileUrl: string): Promise<Buffer> {
    try {
      const response = await axios.get(fileUrl, {
        responseType: 'arraybuffer',
        headers: {
          Accept:
            'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/*,*/*',
        },
      });
      return Buffer.from(response.data);
    } catch (error) {
      logger.error('Failed to download job description file', {
        context: 'GcpVertexJobParserProvider.downloadJobFile',
        error: error instanceof Error ? error.message : 'Unknown error',
        fileUrl,
      });
      throw new Error(
        `Failed to download job description file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Process the job parsing task using Vertex AI
   * @param taskId The identifier of the parsing task
   * @param mode The parsing mode to use
   */
  private async parseJobDescription(
    taskId: string,
    mode: JobParsingMode
  ): Promise<void> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error(`Parsing task not found with id ${taskId}`);
    }

    try {
      // Update task status to processing
      task.status = IAiJobParsingStatus.STARTED;
      task.updatedAt = new Date();
      await this.setTask(taskId, task);

      // Download the job description file
      task.status = IAiJobParsingStatus.DOWNLOADING_JOB_DESCRIPTION;
      await this.setTask(taskId, task);

      // Get the presigned url for the job description file
      const presignedUrl = await this.storageProvider.generatePreSignedUrl(
        task.fileUrl,
        'read'
      );

      const jobFile = await this.downloadJobFile(presignedUrl);

      // Process with retry logic and exponential backoff
      const maxRetries = ENV.GEMINI_MAX_RETRIES;
      let lastError: Error | null = null;
      let parsedData: any = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          parsedData = await this.attemptJobParsingWithModel(
            taskId,
            task,
            jobFile,
            mode,
            attempt
          );

          // If we reach here, the attempt was successful
          logger.info('Job parsing successful', {
            context: 'GcpVertexJobParserProvider.parseJobDescription',
            attempt,
            totalAttempts: maxRetries,
          });
          break;
        } catch (error) {
          lastError =
            error instanceof Error ? error : new Error('Unknown error');

          logger.warn('Job parsing attempt failed', {
            context: 'GcpVertexJobParserProvider.parseJobDescription',
            attempt,
            totalAttempts: maxRetries,
            error: lastError.message,
          });

          // Check if this is the last attempt
          if (attempt === maxRetries) {
            logger.error('All job parsing attempts failed', {
              context: 'GcpVertexJobParserProvider.parseJobDescription',
              totalAttempts: maxRetries,
              finalError: lastError.message,
            });
            throw lastError;
          }

          // Check if error is retryable
          const isRetryable = this.isRetryableError(lastError);
          if (!isRetryable) {
            logger.error('Non-retryable error encountered', {
              context: 'GcpVertexJobParserProvider.parseJobDescription',
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

          logger.info('Retrying job parsing with exponential backoff', {
            context: 'GcpVertexJobParserProvider.parseJobDescription',
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
          lastError ||
          new Error('Failed to parse job description after all attempts')
        );
      }

      // Log validation results
      logger.info('Job description validation results', {
        context: 'GcpVertexJobParserProvider.parseJobDescription',
        isValidJobDescription: parsedData.isValidJobDescription,
        validationReason: parsedData.validationReason,
        confidence: parsedData.confidence,
      });

      if (!parsedData.isValidJobDescription || parsedData.confidence < 0.7) {
        throw new Error(
          `Invalid job description: ${parsedData.validationReason}`
        );
      }

      if (!parsedData.parsedData) {
        throw new Error('No parsed data found in response');
      }

      const validatedData = JobParsingSchema.parse(parsedData.parsedData);

      const parsedJobPosting = this.parseVertexAIResponse(
        validatedData,
        task.fileUrl
      );

      // Update task status to completed
      task.status = IAiJobParsingStatus.COMPLETED;
      task.parsedJob = {
        parsedJob: parsedJobPosting,
        mode,
        confidenceScore: parsedData.confidence,
        isValidJobDescription: parsedData.isValidJobDescription,
        validationReason: parsedData.validationReason,
      };
      task.updatedAt = new Date();
      await this.setTask(taskId, task);

      return;
    } catch (error) {
      // Update task status to failed
      task.status = IAiJobParsingStatus.FAILED;
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.updatedAt = new Date();
      await this.setTask(taskId, task);

      throw error;
    }
  }

  /**
   * Parse the Vertex AI response into job posting format
   * @param validatedData The validated data from Vertex AI
   * @param jobFileUrl The URL of the job description file
   * @returns The parsed job posting data
   */
  private parseVertexAIResponse(
    validatedData: z.infer<typeof JobParsingSchema>,
    jobFileUrl: string
  ): any {
    try {
      // Helper function to merge skills from different sources
      const mergeSkills = (
        ...skillArrays: (string[] | null | undefined)[]
      ): string[] => {
        const allSkills: string[] = [];
        skillArrays.forEach((skills) => {
          if (Array.isArray(skills)) {
            allSkills.push(...skills);
          }
        });
        // Remove duplicates and return
        return [...new Set(allSkills)];
      };

      // Helper function to extract skills from requirements
      const extractSkillsFromRequirements = (requirements: any[]): string[] => {
        if (!Array.isArray(requirements)) return [];
        return requirements.map((req) => req.skill || '').filter(Boolean);
      };

      // Calculate total experience from min/max if totalExperience is not provided
      const calculateTotalExperience = (): number => {
        if (validatedData.totalExperience) {
          return this.validateNumber(
            validatedData.totalExperience,
            'totalExperience'
          );
        }

        const minExp = validatedData.minExperience || 0;
        const maxExp = validatedData.maxExperience || 0;

        if (minExp > 0 && maxExp > 0) {
          return Math.round((minExp + maxExp) / 2);
        }
        return minExp || maxExp || 0;
      };

      // Merge required skills from multiple sources
      const requiredSkills = mergeSkills(
        validatedData.requiredSkills,
        validatedData.skills,
        extractSkillsFromRequirements(validatedData.requirements || [])
      );

      // Merge preferred skills from multiple sources
      const preferredSkills = mergeSkills(
        validatedData.preferredSkills,
        validatedData.preferredQualifications
      );

      return {
        id: uuidv4(),
        title: this.validateString(validatedData.title, 'title'),
        description: this.validateString(
          validatedData.description,
          'description'
        ),
        jobType: this.validateEnum(
          validatedData.jobType || validatedData.workType,
          WorkTypeEnum,
          'jobType',
          WorkTypeEnum.EMPLOYEE
        ),
        jobCommitment: this.validateEnum(
          validatedData.jobCommitment || validatedData.workCommitment,
          WorkCommitmentEnum,
          'jobCommitment',
          WorkCommitmentEnum.FULL_TIME
        ),
        jobSchedule: this.validateEnum(
          validatedData.jobSchedule || validatedData.workSchedule,
          WorkScheduleEnum,
          'jobSchedule',
          WorkScheduleEnum.REGULAR
        ),
        industry: this.validateString(validatedData.industry, 'industry'),
        totalExperience: calculateTotalExperience(),
        department: this.validateString(validatedData.department, 'department'),
        teamSize: this.validateNumber(validatedData.teamSize, 'teamSize'),
        reportingTo: this.validateString(
          validatedData.reportingTo,
          'reportingTo'
        ),
        hiring_manager_email: this.validateString(
          validatedData.hiring_manager_email || validatedData.contactEmail,
          'hiring_manager_email'
        ),
        // Status will be set by the calling service
        applicationDeadline: this.validateDate(
          validatedData.applicationDeadline,
          'applicationDeadline'
        ),
        availableFrom: this.validateDate(
          validatedData.availableFrom,
          'availableFrom'
        ),
        numberOfOpenings: this.validateNumber(
          validatedData.numberOfOpenings,
          'numberOfOpenings'
        ),
        applicationUrl: this.validateString(
          validatedData.applicationUrl,
          'applicationUrl'
        ),
        isFeatured: this.validateBoolean(
          validatedData.isFeatured,
          'isFeatured'
        ),
        isRemote: this.validateBoolean(validatedData.isRemote, 'isRemote'),
        minSalary: this.validateNumber(validatedData.minSalary, 'minSalary'),
        maxSalary: this.validateNumber(validatedData.maxSalary, 'maxSalary'),
        salaryCurrency: this.validateString(
          validatedData.salaryCurrency,
          'salaryCurrency'
        ),
        equity: this.validateBoolean(validatedData.equity, 'equity'),
        benefits: this.validateArray(validatedData.benefits, 'benefits'),
        responsibilities: this.validateArray(
          validatedData.responsibilities,
          'responsibilities'
        ),
        requiredSkills: requiredSkills,
        preferredSkills: preferredSkills,
        preferredUniversities: this.validateArray(
          validatedData.preferredUniversities,
          'preferredUniversities'
        ),
        preferredDegrees: this.validateArray(
          validatedData.preferredDegrees,
          'preferredDegrees'
        ),
        preferredLocations: this.validateArray(
          validatedData.preferredLocations,
          'preferredLocations'
        ),
        preferredIndustries: this.validateArray(
          validatedData.preferredIndustries,
          'preferredIndustries'
        ),
        tags: this.validateArray(validatedData.tags, 'tags'),
        createdAt: new Date(),
        updatedAt: new Date(),

        // Additional parsed data for context (not part of IJobPosting)
        _additionalData: {
          contactPhone: this.validateString(
            validatedData.contactPhone,
            'contactPhone'
          ),
          companyName: this.validateString(
            validatedData.companyName,
            'companyName'
          ),
          companyDescription: this.validateString(
            validatedData.companyDescription,
            'companyDescription'
          ),
          companyWebsite: this.validateUrl(
            validatedData.companyWebsite,
            'companyWebsite'
          ),
          educationLevel: this.validateString(
            validatedData.educationLevel,
            'educationLevel'
          ),
          languages: this.validateArray(validatedData.languages, 'languages'),
          certifications: this.validateArray(
            validatedData.certifications,
            'certifications'
          ),
          travelRequirement: this.validateString(
            validatedData.travelRequirement,
            'travelRequirement'
          ),
          securityClearance: this.validateString(
            validatedData.securityClearance,
            'securityClearance'
          ),
          location: this.validateString(validatedData.location, 'location'),
          salaryPer: this.validateString(validatedData.salaryPer, 'salaryPer'),
          workLocationTypes: this.validateArray(
            validatedData.workLocationTypes,
            'workLocationTypes'
          ),
          isUrgent: this.validateBoolean(validatedData.isUrgent, 'isUrgent'),
          jobFileUrl,
        },
      };
    } catch (error) {
      logger.error('Failed to parse validated data', {
        context: 'GcpVertexJobParserProvider.parseVertexAIResponse',
        error: error instanceof Error ? error.message : 'Unknown error',
        data: validatedData,
      });
      throw new Error('Failed to parse validated data');
    }
  }

  // Helper validation methods
  private validateString(
    value: string | null | undefined,
    fieldName: string
  ): string {
    if (!value || value === null) {
      logger.debug(`Invalid ${fieldName}, using default empty string`, {
        context: 'GcpVertexJobParserProvider.validateString',
        fieldName,
        value,
      });
      return '';
    }
    return value;
  }

  private validateNumber(
    value: number | null | undefined,
    fieldName: string
  ): number {
    if (value === undefined || value === null || isNaN(value)) {
      logger.debug(`Invalid ${fieldName}, using default 0`, {
        context: 'GcpVertexJobParserProvider.validateNumber',
        fieldName,
        value,
      });
      return 0;
    }
    return value;
  }

  private validateBoolean(
    value: boolean | null | undefined,
    fieldName: string
  ): boolean {
    if (value === undefined || value === null) {
      logger.debug(`Invalid ${fieldName}, using default false`, {
        context: 'GcpVertexJobParserProvider.validateBoolean',
        fieldName,
        value,
      });
      return false;
    }
    return value;
  }

  private validateArray<T>(
    value: T[] | null | undefined,
    fieldName: string
  ): T[] {
    if (!Array.isArray(value) || value === null) {
      logger.debug(`Invalid ${fieldName}, using default empty array`, {
        context: 'GcpVertexJobParserProvider.validateArray',
        fieldName,
        value,
      });
      return [];
    }
    return value;
  }

  private validateDate(
    value: string | null | undefined,
    fieldName: string
  ): Date | undefined {
    if (!value || value === null) {
      logger.debug(`Invalid ${fieldName}, using undefined`, {
        context: 'GcpVertexJobParserProvider.validateDate',
        fieldName,
        value,
      });
      return undefined;
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      logger.debug(`Invalid date format for ${fieldName}, using undefined`, {
        context: 'GcpVertexJobParserProvider.validateDate',
        fieldName,
        value,
      });
      return undefined;
    }
    return date;
  }

  private validateUrl(
    value: string | null | undefined,
    fieldName: string
  ): string | undefined {
    if (!value || value === null) {
      return undefined;
    }
    try {
      new URL(value);
      return value;
    } catch {
      logger.debug(`Invalid URL for ${fieldName}, using undefined`, {
        context: 'GcpVertexJobParserProvider.validateUrl',
        fieldName,
        value,
      });
      return undefined;
    }
  }

  private validateEnum<T extends string>(
    value: string | null | undefined,
    enumType: Record<string, T>,
    fieldName: string,
    defaultValue: T
  ): T {
    if (!value || value === null) {
      logger.debug(`Missing ${fieldName}, using default ${defaultValue}`, {
        context: 'GcpVertexJobParserProvider.validateEnum',
        fieldName,
        value,
      });
      return defaultValue;
    }

    const normalizedValue = value.toUpperCase();

    // Try direct enum value match
    if (Object.values(enumType).includes(normalizedValue as T)) {
      return normalizedValue as T;
    }

    // Log the invalid value and return default
    logger.debug(
      `Invalid enum value for ${fieldName}, using default ${defaultValue}`,
      {
        context: 'GcpVertexJobParserProvider.validateEnum',
        fieldName,
        value,
        validValues: Object.values(enumType),
      }
    );
    return defaultValue;
  }
}
