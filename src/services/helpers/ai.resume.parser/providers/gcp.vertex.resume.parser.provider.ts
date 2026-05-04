import { singleton } from '@/shared/decorators/singleton';
import {
  IAiResumeParsingTask,
  IAiResumeParsingStatus,
  IResumeParserProvider,
} from '../resume.parser.provider';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/shared/utils/logger';
import { ENV } from '@/config/env';
import { VertexAI } from '@google-cloud/vertexai';
import { gcpConfig } from '@/config/gcp';
import { IResumeEducation } from '@/shared/models/domain/candidate/resume.domain';
import { IResumeExperience } from '@/shared/models/domain/candidate/resume.domain';
import { IResumeCertification } from '@/shared/models/domain/candidate/resume.domain';
import { ResumeParsingMode } from '@/shared/models/domain/candidate/resume.parsing.domain';
import {
  EducationLevelEnum,
  WorkTypeEnum,
  WorkCommitmentEnum,
  WorkScheduleEnum,
  NoticePeriodEnum,
} from '@/shared/models/common/enums';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { IResume } from '@/shared/models/domain/candidate/resume.domain';
import { z } from 'zod';
import axios from 'axios';
import Redis from 'ioredis';
import { IStorageProvider } from '@/services/helpers/storage/storage.interface';
import { StorageFactory } from '@/services/helpers/storage/storage.factory';
import { GcpVertexResumeParserPromptGenerator } from './gcp.vertex.resume.parser.prompt.generator';

const optionalUrlSchema = z
  .string()
  .nullable()
  .optional()
  .transform((val) => {
    if (!val || val.trim() === '') return null;
    try {
      new URL(val);
      return val;
    } catch {
      return null;
    }
  });

// Schema definitions for validation
const ProjectSchema = z.object({
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  currentlyWorking: z.boolean().nullable().optional(),
  role: z.string().nullable().optional(),
  teamSize: z.number().nullable().optional(),
  url: optionalUrlSchema,
  githubUrl: optionalUrlSchema,
  demoUrl: optionalUrlSchema,
  skills: z.array(z.string()).nullable().optional(),
  responsibilities: z.array(z.string()).nullable().optional(),
  achievements: z.array(z.string()).nullable().optional(),
  challenges: z.array(z.string()).nullable().optional(),
  solutions: z.array(z.string()).nullable().optional(),
  impact: z.array(z.string()).nullable().optional(),
});

const ExperienceSchema = z.object({
  company: z.string().nullable().optional(),
  position: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  currentlyWorking: z.boolean().nullable().optional(),
  description: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  commitment: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  skills: z.array(z.string()).nullable().optional(),
  responsibilities: z.array(z.string()).nullable().optional(),
  achievements: z.array(z.string()).nullable().optional(),
  projects: z.array(ProjectSchema).nullable().optional(),
});

const EducationSchema = z.object({
  institution: z.string().nullable().optional(),
  level: z.string().nullable().optional(),
  degree: z.string().nullable().optional(),
  fieldOfStudy: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  currentlyPursuing: z.boolean().nullable().optional(),
  gpa: z.number().nullable().optional(),
  achievements: z.array(z.string()).nullable().optional(),
});

const CertificationSchema = z.object({
  name: z.string().nullable().optional(),
  issuer: z.string().nullable().optional(),
  date: z.string().nullable().optional(),
  expiryDate: z.string().nullable().optional(),
  credentialUrl: optionalUrlSchema,
});

const SocialSchema = z.object({
  linkedin: optionalUrlSchema,
  twitter: optionalUrlSchema,
  github: optionalUrlSchema,
  portfolio: optionalUrlSchema,
  leetcode: optionalUrlSchema,
});

const ResumeSchema = z.object({
  summary: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  primaryIndustry: z.string().nullable().optional(),
  totalExperience: z.number().nullable().optional(),
  currentJobTitle: z.string().nullable().optional(),
  currentCompany: z.string().nullable().optional(),
  currentIndustry: z.string().nullable().optional(),
  currentWorkLocation: z.string().nullable().optional(),
  currentWorkType: z.string().nullable().optional(),
  currentWorkCommitment: z.string().nullable().optional(),
  currentWorkSchedule: z.string().nullable().optional(),
  currentSalary: z.number().nullable().optional(),
  currentSalaryCurrency: z.string().nullable().optional(),
  availableFrom: z.string().nullable().optional(),
  noticePeriod: z.string().nullable().optional(),
  resumeSkills: z.array(z.string()).nullable().optional(),
  industries: z.array(z.string()).nullable().optional(),
  languages: z.array(z.string()).nullable().optional(),
  social: SocialSchema.nullable().optional(),
  certifications: z.array(CertificationSchema).nullable().optional(),
  education: z.array(EducationSchema).nullable().optional(),
  experience: z.array(ExperienceSchema).nullable().optional(),
});

@singleton
export class GcpVertexResumeParserProvider implements IResumeParserProvider {
  private redis: Redis | null = null;
  private tasks: Map<string, IAiResumeParsingTask>;
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
          keyPrefix: `${ENV.ENV_NAME}:resume_parser:`,
          connectTimeout: 5000,
          retryStrategy: (times: number) => {
            const delay = Math.min(times * 100, 3000);
            return delay;
          },
        });

        this.redis.on('error', (err: Error) => {
          logger.error('Redis error', {
            error: err.message,
            context: 'GcpVertexResumeParserProvider',
          });
        });

        logger.info('Redis cache initialized for resume parser', {
          context: 'GcpVertexResumeParserProvider.constructor',
        });
      } catch (error) {
        logger.error('Failed to initialize Redis', {
          error: error instanceof Error ? error.message : 'Unknown error',
          context: 'GcpVertexResumeParserProvider.constructor',
        });
        this.redis = null;
      }
    } else {
      logger.info('Using local Map storage for resume parser tasks', {
        context: 'GcpVertexResumeParserProvider.constructor',
      });
    }

    logger.info('GCP Vertex AI Resume Parser Provider initialized', {
      context: 'GcpVertexResumeParserProvider.constructor',
      model: this.model,
      location: this.location,
      projectId: this.projectId,
    });
  }

  /**
   * Get a task from storage (Redis or Map)
   * @param taskId The task ID
   * @returns The task or null if not found
   */
  private async getTask(taskId: string): Promise<IAiResumeParsingTask> {
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
    task: IAiResumeParsingTask
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
          context: 'GcpVertexResumeParserProvider.setTask',
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
          context: 'GcpVertexResumeParserProvider.deleteTask',
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
    // This allows the system to attempt retries for unexpected errors
    return true;
  }

  /**
   * Attempts to parse resume with model in a single attempt
   * @param taskId The task ID
   * @param task The task object
   * @param resumeFile The resume file buffer
   * @param mode The parsing mode
   * @param attempt The current attempt number
   * @returns The parsed data from the model
   */
  private async attemptResumeParsingWithModel(
    taskId: string,
    task: IAiResumeParsingTask,
    resumeFile: Buffer,
    mode: ResumeParsingMode,
    attempt: number
  ): Promise<any> {
    // Get the model
    const generativeModel = this.vertexAI.preview.getGenerativeModel({
      model: `projects/${this.projectId}/locations/${this.location}/publishers/google/models/${this.model}`,
    });

    // Prepare the prompt for resume parsing based on mode
    task.status = IAiResumeParsingStatus.CREATING_PROMPT;
    await this.setTask(taskId, task);
    const prompt =
      GcpVertexResumeParserPromptGenerator.generateResumeParsingPrompt(mode);

    logger.debug('Prompt for resume parsing', {
      context: 'GcpVertexResumeParserProvider.attemptResumeParsingWithModel',
      mode,
      prompt,
      attempt,
    });

    task.status = IAiResumeParsingStatus.LLM_PROCESSING;
    await this.setTask(taskId, task);

    // Detect the file type
    const mimeType = this.detectMimeType(task.fileUrl, resumeFile);

    logger.debug('Detected file type for resume parsing', {
      context: 'GcpVertexResumeParserProvider.attemptResumeParsingWithModel',
      fileUrl: task.fileUrl,
      mimeType,
      attempt,
    });

    let contentParts: any[];

    // Handle text files differently
    if (mimeType === 'text/plain') {
      // For text files, include the content directly as text
      const textContent = resumeFile.toString('utf-8');
      contentParts = [
        { text: prompt },
        { text: `\n\nRESUME CONTENT:\n${textContent}` },
      ];
    } else {
      // For binary files (PDF, DOC, etc.), use inlineData
      contentParts = [
        { text: prompt },
        {
          inlineData: {
            mimeType,
            data: resumeFile.toString('base64'),
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

    logger.debug('Raw resume parsing result', {
      context: 'GcpVertexResumeParserProvider.attemptResumeParsingWithModel',
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

    logger.debug('Cleaned resume parsing result', {
      context: 'GcpVertexResumeParserProvider.attemptResumeParsingWithModel',
      cleanedResponse: responseText,
      attempt,
    });

    // Parse and validate the response
    task.status = IAiResumeParsingStatus.PARSING_RESULTS;
    await this.setTask(taskId, task);

    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch (parseError) {
      logger.error('Failed to parse resume data', {
        context: 'GcpVertexResumeParserProvider.attemptResumeParsingWithModel',
        error:
          parseError instanceof Error ? parseError.message : 'Unknown error',
        responseText,
        attempt,
      });
      throw new Error('Invalid JSON response from parsing');
    }

    // Validate the structure of the response
    if (
      typeof parsedData.isValidResume !== 'boolean' ||
      typeof parsedData.validationReason !== 'string' ||
      typeof parsedData.confidence !== 'number'
    ) {
      throw new Error('Invalid validation result structure');
    }

    return parsedData;
  }

  /**
   * Initiates the resume parsing job
   * @param resumeUrl The URL of the resume to parse
   * @param mode The parsing mode to use (strict or generative)
   * @returns A promise that resolves to the parsing task identifier
   */
  async parse(
    taskId: string,
    resumeUrl: string,
    mode: ResumeParsingMode = ResumeParsingMode.STRICT
  ): Promise<IAiResumeParsingTask> {
    // check if task for the taskId exists and if it is not failed or completed
    const task = this.tasks.get(taskId);

    if (task) {
      if (
        task.status !== IAiResumeParsingStatus.FAILED &&
        task.status !== IAiResumeParsingStatus.COMPLETED
      ) {
        throw new AppError(
          'Resume parsing task already exists',
          400,
          ErrorCode.RESUME_PARSING_TASK_ALREADY_EXISTS
        );
      }
    }

    const newTask: IAiResumeParsingTask = {
      taskId,
      status: IAiResumeParsingStatus.PENDING,
      fileUrl: resumeUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
      mode,
    };

    await this.setTask(taskId, newTask);

    // Start processing
    await this.parseResume(taskId, mode);

    return newTask;
  }

  /**
   * Gets the status of a parsing task
   * @param taskId The identifier of the parsing task
   * @returns A promise that resolves to the parsing task status
   */
  async getParsingTask(taskId: string): Promise<IAiResumeParsingTask> {
    return await this.getTask(taskId);
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
   * Downloads the resume file from the given URL
   * @param fileUrl The URL of the resume file
   * @returns The file content as a Buffer
   */
  private async downloadResumeFile(fileUrl: string): Promise<Buffer> {
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
      logger.error('Failed to download resume file', {
        context: 'GcpVertexResumeParserProvider.downloadResumeFile',
        error: error instanceof Error ? error.message : 'Unknown error',
        fileUrl,
      });
      throw new Error(
        `Failed to download resume file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Process the resume parsing task using Vertex AI
   * @param taskId The identifier of the parsing task
   * @param mode The parsing mode to use (strict or generative)
   */
  private async parseResume(
    taskId: string,
    mode: ResumeParsingMode
  ): Promise<void> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error(`Parsing task not found with id ${taskId}`);
    }

    try {
      // Update task status to processing
      task.status = IAiResumeParsingStatus.STARTED;

      task.updatedAt = new Date();
      await this.setTask(taskId, task);

      // Download the resume file
      task.status = IAiResumeParsingStatus.DOWNLOADING_RESUME;
      await this.setTask(taskId, task);

      // get the presigned url for the resume file
      const presignedUrl = await this.storageProvider.generatePreSignedUrl(
        task.fileUrl,
        'read'
      );

      const resumeFile = await this.downloadResumeFile(presignedUrl);

      // Process with retry logic and exponential backoff
      const maxRetries = ENV.GEMINI_MAX_RETRIES;
      let lastError: Error | null = null;
      let parsedData: any = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          parsedData = await this.attemptResumeParsingWithModel(
            taskId,
            task,
            resumeFile,
            mode,
            attempt
          );

          // If we reach here, the attempt was successful
          logger.info('Resume parsing successful', {
            context: 'GcpVertexResumeParserProvider.parseResume',
            attempt,
            totalAttempts: maxRetries,
          });
          break;
        } catch (error) {
          lastError =
            error instanceof Error ? error : new Error('Unknown error');

          logger.warn('Resume parsing attempt failed', {
            context: 'GcpVertexResumeParserProvider.parseResume',
            attempt,
            totalAttempts: maxRetries,
            error: lastError.message,
          });

          // Check if this is the last attempt
          if (attempt === maxRetries) {
            logger.error('All resume parsing attempts failed', {
              context: 'GcpVertexResumeParserProvider.parseResume',
              totalAttempts: maxRetries,
              finalError: lastError.message,
            });
            throw lastError;
          }

          // Check if error is retryable
          const isRetryable = this.isRetryableError(lastError);
          if (!isRetryable) {
            logger.error('Non-retryable error encountered', {
              context: 'GcpVertexResumeParserProvider.parseResume',
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

          logger.info('Retrying resume parsing with exponential backoff', {
            context: 'GcpVertexResumeParserProvider.parseResume',
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
          lastError || new Error('Failed to parse resume after all attempts')
        );
      }

      // Log validation results
      logger.info('Resume validation results', {
        context: 'GcpVertexResumeParserProvider.processTask',
        isValidResume: parsedData.isValidResume,
        validationReason: parsedData.validationReason,
        confidence: parsedData.confidence,
      });

      if (!parsedData.isValidResume || parsedData.confidence < 0.7) {
        throw new Error(`Invalid resume: ${parsedData.validationReason}`);
      }

      if (!parsedData.parsedData) {
        throw new Error('No parsed data found in response');
      }

      const validatedData = ResumeSchema.parse(parsedData.parsedData);

      const parsedResume = this.parseVertexAIResponse(
        validatedData,
        task.fileUrl
      );

      // Update task status to completed
      task.status = IAiResumeParsingStatus.COMPLETED;
      task.parsedResume = {
        parsedResume,
        mode,
        confidenceScore: parsedData.confidence,
        isValidResume: parsedData.isValidResume,
        validationReason: parsedData.validationReason,
      };
      task.updatedAt = new Date();
      await this.setTask(taskId, task);

      return;
    } catch (error) {
      // Update task status to failed
      task.status = IAiResumeParsingStatus.FAILED;
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.updatedAt = new Date();
      await this.setTask(taskId, task);

      throw error;
    }
  }

  /**
   * Parse the Vertex AI response into IResume format
   * @param validatedData The validated data from Vertex AI
   * @param resumeFileUrl The URL of the resume file
   * @returns The parsed resume in IResume format
   */
  private parseVertexAIResponse(
    validatedData: z.infer<typeof ResumeSchema>,
    resumeFileUrl: string
  ): Partial<IResume> {
    try {
      // Process education entries
      const education: IResumeEducation[] = (validatedData.education || []).map(
        (edu) => ({
          id: uuidv4(),
          institution: this.validateString(edu.institution, 'institution'),
          level: this.validateEnum(
            edu.level,
            EducationLevelEnum,
            'education level',
            EducationLevelEnum.BACHELORS
          ),
          degree: this.validateString(edu.degree, 'degree'),
          fieldOfStudy: this.validateString(edu.fieldOfStudy, 'field of study'),
          startDate:
            this.validateDate(edu.startDate, 'education start date') ||
            new Date(),
          endDate: this.validateDate(edu.endDate, 'education end date'),
          currentlyPursuing: this.validateBoolean(
            edu.currentlyPursuing,
            'currently pursuing'
          ),
          gpa: this.validateNumber(edu.gpa, 'gpa'),
          achievements: this.validateArray(
            edu.achievements,
            'education achievements'
          ),
        })
      );

      // Process experience entries
      const experience: IResumeExperience[] = (
        validatedData.experience || []
      ).map((exp) => ({
        id: uuidv4(),
        company: this.validateString(exp.company, 'company'),
        position: this.validateString(exp.position, 'position'),
        industry: this.validateString(exp.industry, 'industry'),
        startDate:
          this.validateDate(exp.startDate, 'experience start date') ||
          new Date(),
        endDate: this.validateDate(exp.endDate, 'experience end date'),
        currentlyWorking: this.validateBoolean(
          exp.currentlyWorking,
          'currently working'
        ),
        description: this.validateString(exp.description, 'job description'),
        type: this.validateEnum(
          exp.type,
          WorkTypeEnum,
          'work type',
          WorkTypeEnum.EMPLOYEE
        ),
        commitment: this.validateEnum(
          exp.commitment,
          WorkCommitmentEnum,
          'work commitment',
          WorkCommitmentEnum.FULL_TIME
        ),
        location: this.validateString(exp.location, 'work location'),
        skills: this.validateArray(exp.skills, 'experience skills'),
        responsibilities: this.validateArray(
          exp.responsibilities,
          'experience responsibilities'
        ),
        achievements: this.validateArray(
          exp.achievements,
          'experience achievements'
        ),
        projects: this.validateArray(exp.projects, 'projects').map((proj) => ({
          id: uuidv4(),
          name: this.validateString(proj.name, 'project name'),
          description: this.validateString(
            proj.description,
            'project description'
          ),
          startDate: this.validateDate(proj.startDate, 'project start date'),
          endDate: this.validateDate(proj.endDate, 'project end date'),
          currentlyWorking: this.validateBoolean(
            proj.currentlyWorking,
            'project currently working'
          ),
          role: this.validateString(proj.role, 'project role'),
          teamSize: this.validateNumber(proj.teamSize, 'project team size'),
          url: this.validateUrl(proj.url, 'project url'),
          githubUrl: this.validateUrl(proj.githubUrl, 'project github url'),
          demoUrl: this.validateUrl(proj.demoUrl, 'project demo url'),
          skills: this.validateArray(proj.skills, 'project skills'),
          responsibilities: this.validateArray(
            proj.responsibilities,
            'project responsibilities'
          ),
          achievements: this.validateArray(
            proj.achievements,
            'project achievements'
          ),
          challenges: this.validateArray(proj.challenges, 'project challenges'),
          solutions: this.validateArray(proj.solutions, 'project solutions'),
          impact: this.validateArray(proj.impact, 'project impact'),
        })),
      }));

      // Process certifications
      const certifications: IResumeCertification[] = (
        validatedData.certifications || []
      ).map((cert) => ({
        id: uuidv4(),
        name: this.validateString(cert.name, 'certification name'),
        issuer: this.validateString(cert.issuer, 'certification issuer'),
        issueDate:
          this.validateDate(cert.date, 'certification date') || new Date(),
        expiryDate: this.validateDate(
          cert.expiryDate,
          'certification expiry date'
        ),
        credentialUrl: this.validateUrl(
          cert.credentialUrl,
          'certification credential url'
        ),
      }));

      // Create the final IResume object
      return {
        id: uuidv4(),
        candidateId: '', // This will be set by the service layer
        phone: this.validateString(validatedData.phone, 'phone'),
        location: this.validateString(validatedData.location, 'location'),
        summary: this.validateString(validatedData.summary, 'summary'),
        primaryIndustry: this.validateString(
          validatedData.primaryIndustry,
          'primary industry'
        ),
        totalExperience: this.validateNumber(
          validatedData.totalExperience,
          'total experience'
        ),
        currentJobTitle: this.validateString(
          validatedData.currentJobTitle,
          'current job title'
        ),
        currentCompany: this.validateString(
          validatedData.currentCompany,
          'current company'
        ),
        currentIndustry: this.validateString(
          validatedData.currentIndustry,
          'current industry'
        ),
        currentWorkLocation: this.validateString(
          validatedData.currentWorkLocation,
          'current work location'
        ),
        currentWorkType: this.validateEnum(
          validatedData.currentWorkType,
          WorkTypeEnum,
          'current work type',
          WorkTypeEnum.EMPLOYEE
        ),
        currentWorkCommitment: this.validateEnum(
          validatedData.currentWorkCommitment,
          WorkCommitmentEnum,
          'current work commitment',
          WorkCommitmentEnum.FULL_TIME
        ),
        currentWorkSchedule: this.validateEnum(
          validatedData.currentWorkSchedule,
          WorkScheduleEnum,
          'current work schedule',
          WorkScheduleEnum.REGULAR
        ),
        currentSalary: this.validateNumber(
          validatedData.currentSalary,
          'current salary'
        ),
        currentSalaryCurrency: this.validateString(
          validatedData.currentSalaryCurrency,
          'current salary currency'
        ),
        availableFrom: this.validateDate(
          validatedData.availableFrom,
          'available from'
        ),
        noticePeriod: this.validateEnum(
          validatedData.noticePeriod,
          NoticePeriodEnum,
          'notice period',
          NoticePeriodEnum.ONE_MONTH
        ),
        resumeSkills: this.validateArray(
          validatedData.resumeSkills,
          'resume skills'
        ),
        industries: this.validateArray(validatedData.industries, 'industries'),
        languages: this.validateArray(validatedData.languages, 'languages'),
        social: validatedData.social
          ? {
              id: uuidv4(),
              linkedin: this.validateUrl(
                validatedData.social.linkedin,
                'linkedin url'
              ),
              twitter: this.validateUrl(
                validatedData.social.twitter,
                'twitter url'
              ),
              github: this.validateUrl(
                validatedData.social.github,
                'github url'
              ),
              portfolio: this.validateUrl(
                validatedData.social.portfolio,
                'portfolio url'
              ),
              leetcode: this.validateUrl(
                validatedData.social.leetcode,
                'leetcode url'
              ),
            }
          : undefined,
        certifications,
        education,
        experience,
        createdAt: new Date(),
        updatedAt: new Date(),
        resumeFileUrl,
      };
    } catch (error) {
      logger.error('Failed to parse validated data', {
        context: 'GcpVertexResumeParserProvider.parseVertexAIResponse',
        error: error instanceof Error ? error.message : 'Unknown error',
        data: validatedData,
      });
      throw new Error('Failed to parse validated data');
    }
  }

  // Add these helper methods at the top of the class
  private validateString(
    value: string | null | undefined,
    fieldName: string
  ): string {
    if (!value || value === null) {
      logger.debug(`Invalid ${fieldName}, using default empty string`, {
        context: 'GcpVertexResumeParserProvider.validateString',
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
        context: 'GcpVertexResumeParserProvider.validateNumber',
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
        context: 'GcpVertexResumeParserProvider.validateBoolean',
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
        context: 'GcpVertexResumeParserProvider.validateArray',
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
        context: 'GcpVertexResumeParserProvider.validateDate',
        fieldName,
        value,
      });
      return undefined;
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      logger.debug(`Invalid date format for ${fieldName}, using undefined`, {
        context: 'GcpVertexResumeParserProvider.validateDate',
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
        context: 'GcpVertexResumeParserProvider.validateUrl',
        fieldName,
        value,
      });
      return undefined;
    }
  }

  // Add these mapping functions at the top of the class
  private mapWorkType(value: string | null | undefined): WorkTypeEnum {
    if (!value) return WorkTypeEnum.EMPLOYEE;

    const normalizedValue = value.toUpperCase();
    const mapping: Record<string, WorkTypeEnum> = {
      FULL_TIME: WorkTypeEnum.EMPLOYEE,
      PART_TIME: WorkTypeEnum.EMPLOYEE,
      PERMANENT: WorkTypeEnum.EMPLOYEE,
      CONTRACT: WorkTypeEnum.CONTRACTOR,
      FREELANCE: WorkTypeEnum.FREELANCER,
      INTERNSHIP: WorkTypeEnum.INTERN,
      VOLUNTEER: WorkTypeEnum.VOLUNTEER,
      APPRENTICE: WorkTypeEnum.APPRENTICESHIP,
      OTHER: WorkTypeEnum.OTHER,
    };

    return mapping[normalizedValue] || WorkTypeEnum.EMPLOYEE;
  }

  private mapWorkCommitment(
    value: string | null | undefined
  ): WorkCommitmentEnum {
    if (!value) return WorkCommitmentEnum.FULL_TIME;

    const normalizedValue = value.toUpperCase();
    const mapping: Record<string, WorkCommitmentEnum> = {
      FULL_TIME: WorkCommitmentEnum.FULL_TIME,
      PART_TIME: WorkCommitmentEnum.PART_TIME,
      PERMANENT: WorkCommitmentEnum.FULL_TIME,
      TEMPORARY: WorkCommitmentEnum.PART_TIME,
      HOURLY: WorkCommitmentEnum.HOURLY,
      PROJECT_BASED: WorkCommitmentEnum.PROJECT_BASED,
      CONTRACT: WorkCommitmentEnum.PROJECT_BASED,
      FLEXIBLE: WorkCommitmentEnum.PART_TIME,
    };

    return mapping[normalizedValue] || WorkCommitmentEnum.FULL_TIME;
  }

  private mapEducationLevel(
    value: string | null | undefined
  ): EducationLevelEnum {
    if (!value) return EducationLevelEnum.BACHELORS;

    const normalizedValue = value.toUpperCase();
    const mapping: Record<string, EducationLevelEnum> = {
      HIGH_SCHOOL: EducationLevelEnum.HIGH_SCHOOL,
      BACHELORS: EducationLevelEnum.BACHELORS,
      BACHELOR: EducationLevelEnum.BACHELORS,
      MASTERS: EducationLevelEnum.MASTERS,
      MASTER: EducationLevelEnum.MASTERS,
      DOCTORATE: EducationLevelEnum.DOCTORATE,
      PHD: EducationLevelEnum.DOCTORATE,
      DOCTORAL: EducationLevelEnum.DOCTORATE,
      OTHER: EducationLevelEnum.BACHELORS, // Default to BACHELORS for unknown values
    };

    return mapping[normalizedValue] || EducationLevelEnum.BACHELORS;
  }

  private mapWorkSchedule(value: string | null | undefined): WorkScheduleEnum {
    if (!value) return WorkScheduleEnum.REGULAR;

    const normalizedValue = value.toUpperCase();
    const mapping: Record<string, WorkScheduleEnum> = {
      REGULAR: WorkScheduleEnum.REGULAR,
      STANDARD: WorkScheduleEnum.REGULAR,
      NORMAL: WorkScheduleEnum.REGULAR,
      FLEXIBLE: WorkScheduleEnum.FLEXIBLE,
      FLEX: WorkScheduleEnum.FLEXIBLE,
      SHIFT_BASED: WorkScheduleEnum.SHIFT_BASED,
      SHIFT: WorkScheduleEnum.SHIFT_BASED,
      ROTATING: WorkScheduleEnum.SHIFT_BASED,
      OTHER: WorkScheduleEnum.REGULAR, // Default to REGULAR for unknown values
    };

    return mapping[normalizedValue] || WorkScheduleEnum.REGULAR;
  }

  private mapNoticePeriod(value: string | null | undefined): NoticePeriodEnum {
    if (!value) return NoticePeriodEnum.ONE_MONTH;

    const normalizedValue = value.toUpperCase();
    const mapping: Record<string, NoticePeriodEnum> = {
      IMMEDIATE: NoticePeriodEnum.IMMEDIATE,
      NOW: NoticePeriodEnum.IMMEDIATE,
      ONE_WEEK: NoticePeriodEnum.ONE_WEEK,
      TWO_WEEKS: NoticePeriodEnum.TWO_WEEKS,
      ONE_MONTH: NoticePeriodEnum.ONE_MONTH,
      TWO_MONTHS: NoticePeriodEnum.TWO_MONTHS,
      THREE_MONTHS: NoticePeriodEnum.THREE_MONTHS,
      OTHER: NoticePeriodEnum.ONE_MONTH, // Default to ONE_MONTH for unknown values
    };

    return mapping[normalizedValue] || NoticePeriodEnum.ONE_MONTH;
  }

  private validateEnum<T extends string>(
    value: string | null | undefined,
    enumType: Record<string, T>,
    fieldName: string,
    defaultValue: T
  ): T {
    if (!value || value === null) {
      logger.debug(`Missing ${fieldName}, using default ${defaultValue}`, {
        context: 'GcpVertexResumeParserProvider.validateEnum',
        fieldName,
        value,
      });
      return defaultValue;
    }

    const normalizedValue = value.toUpperCase();

    // Special handling for different enum types
    if (Object.values(WorkTypeEnum).includes(normalizedValue as any)) {
      return this.mapWorkType(value) as T;
    }
    if (Object.values(WorkCommitmentEnum).includes(normalizedValue as any)) {
      return this.mapWorkCommitment(value) as T;
    }
    if (Object.values(EducationLevelEnum).includes(normalizedValue as any)) {
      return this.mapEducationLevel(value) as T;
    }
    if (Object.values(WorkScheduleEnum).includes(normalizedValue as any)) {
      return this.mapWorkSchedule(value) as T;
    }
    if (Object.values(NoticePeriodEnum).includes(normalizedValue as any)) {
      return this.mapNoticePeriod(value) as T;
    }

    // Try direct enum value match
    if (Object.values(enumType).includes(normalizedValue as T)) {
      return normalizedValue as T;
    }

    // Log the invalid value and return default
    logger.debug(
      `Invalid enum value for ${fieldName}, using default ${defaultValue}`,
      {
        context: 'GcpVertexResumeParserProvider.validateEnum',
        fieldName,
        value,
        validValues: Object.values(enumType),
      }
    );
    return defaultValue;
  }
}
