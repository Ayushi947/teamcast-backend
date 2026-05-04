import { singleton } from '@/shared/decorators/singleton';
import { JobParsingTaskStatusEnum } from '@/shared/models/common/enums';
import {
  IJobParsed,
  IJobParsingTask,
} from '@/shared/models/domain/client/job.parsing.domain';
import { toJobParsingTaskDomain } from '@/shared/models/domain/client/job.parsing.domain';
import {
  IJobPublicParsingTask,
  toJobPublicParsingTaskDomain,
} from '@/shared/models/domain/client/job.public.parsing.domain';
import { logger } from '@/shared/utils/logger';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { PrismaClient } from '@prisma/client';

import { IJobParserProvider } from '../helpers/ai.job.parser/job.parser.provider';
import { JobParsingMode } from '@/shared/models/domain/client/job.parsing.domain';
import { ICandidateJobPosting } from '@/shared/models/domain/candidate/job.posting.domain';

import { IStorageProvider } from '../helpers/storage/storage.interface';
import { getBucketFolderPathToJobPosting } from '@/utils/presigned.urls';
import { JobParsingProcessor } from '../queue/processors/job.parsing.processor';

import { ENV } from '@/config/env';

@singleton
export class ClientJobParsingService {
  private readonly prisma: PrismaClient;
  private readonly jobParsingProcessor: JobParsingProcessor;

  private sanitizeFileName(fileName: string): string {
    // Remove any path components and get just the filename
    const baseName = fileName.split('/').pop() || fileName;
    // Remove any non-alphanumeric characters except dots and hyphens
    const sanitized = baseName.replace(/[^a-zA-Z0-9.-]/g, '_');
    // Ensure the filename isn't too long (max 100 chars)
    return sanitized.slice(0, 100);
  }

  constructor(
    private readonly storageProvider: IStorageProvider,
    private readonly parserProvider: IJobParserProvider
  ) {
    this.prisma = new PrismaClient();
    this.jobParsingProcessor = new JobParsingProcessor(this);
    if (ENV.ENABLE_BULLMQ_WORKERS) {
      this.jobParsingProcessor.setupWorkers();
    }
    logger.info('Job parsing service initialized', {
      context: 'ClientJobParsingService.constructor',
    });
  }

  /**
   * Upload a job description file and create a parsing task
   */
  async uploadJobDescription(
    jobPostingId: string,
    file: Buffer,
    fileName: string,
    mode: JobParsingMode = JobParsingMode.INFERRED
  ): Promise<IJobParsingTask> {
    try {
      // Get job posting
      const jobPosting = await this.prisma.job_posting.findUnique({
        where: { id: jobPostingId },
        include: {
          jobParsingTask: true,
        },
      });

      if (!jobPosting) {
        throw new AppError(
          `Job posting not found with id ${jobPostingId}`,
          404,
          ErrorCode.JOB_POSTING_NOT_FOUND
        );
      }

      // Check if there's an existing parsing task in progress
      if (
        jobPosting.jobParsingTask &&
        (jobPosting.jobParsingTask.status ===
          JobParsingTaskStatusEnum.PENDING ||
          jobPosting.jobParsingTask.status ===
            JobParsingTaskStatusEnum.PROCESSING)
      ) {
        throw new AppError(
          'A job parsing task is already in progress',
          400,
          ErrorCode.PARSING_TASK_IN_PROGRESS
        );
      }

      // Upload file to storage
      const sanitizedFileName = this.sanitizeFileName(fileName);
      const { folderPath } = getBucketFolderPathToJobPosting(jobPostingId);
      const uniqueFileName = `${Date.now()}-${sanitizedFileName}`;
      const filePath = `${folderPath}/${uniqueFileName}`;
      await this.storageProvider.uploadFile(file, filePath);

      // If there's an existing task, update it instead of creating a new one
      let task;
      if (jobPosting.jobParsingTask) {
        task = await this.prisma.job_parsing_task.update({
          where: { id: jobPosting.jobParsingTask.id },
          data: {
            status: JobParsingTaskStatusEnum.PENDING,
            error: null, // Clear any previous errors
          },
        });
      } else {
        // Create new parsing task
        task = await this.prisma.job_parsing_task.create({
          data: {
            jobPostingId: jobPosting.id,
            status: JobParsingTaskStatusEnum.PENDING,
          },
        });
      }

      // Parse job description in the backend using queue
      await this.jobParsingProcessor.addParsingJob(task.id, filePath, mode);

      return toJobParsingTaskDomain(task);
    } catch (error) {
      logger.error('Failed to upload job description', {
        context: 'ClientJobParsingService.uploadJobDescription',
        error: error instanceof Error ? error.message : 'Unknown error',
        jobPostingId,
      });
      throw error;
    }
  }

  /**
   * Start background parse job description (public method for queue processor)
   */
  async startBackgroundParseJobDescription(
    taskId: string,
    jobUrl: string,
    mode: JobParsingMode
  ): Promise<void> {
    return this.backgroundParseJobDescription(taskId, jobUrl, mode);
  }

  /**
   * Parse a job description
   */
  private async backgroundParseJobDescription(
    taskId: string,
    jobUrl: string,
    mode: JobParsingMode
  ): Promise<void> {
    try {
      const task = await this.prisma.job_parsing_task.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        throw new AppError(
          `Parsing task not found with id ${taskId}`,
          404,
          ErrorCode.PARSING_TASK_NOT_FOUND
        );
      }

      // Update task status to processing
      await this.prisma.job_parsing_task.update({
        where: { id: taskId },
        data: { status: JobParsingTaskStatusEnum.PROCESSING },
      });

      // Initiate parsing task
      await this.parserProvider.parse(taskId, jobUrl, mode);

      // Process the job posting
      await this.updateJobPosting(taskId);

      // Update task status to completed
      await this.prisma.job_parsing_task.update({
        where: { id: taskId },
        data: { status: JobParsingTaskStatusEnum.COMPLETED },
      });
    } catch (error) {
      logger.error('Failed to parse job description', {
        context: 'ClientJobParsingService.backgroundParseJobDescription',
        error: error instanceof Error ? error.message : 'Unknown error',
        taskId,
      });

      // Update task status to failed
      await this.prisma.job_parsing_task.update({
        where: { id: taskId },
        data: {
          status: JobParsingTaskStatusEnum.FAILED,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  /**
   * Get parsing task for a specific job posting
   */
  async getParsingTaskForJobPosting(
    jobPostingId: string
  ): Promise<IJobParsingTask> {
    try {
      const jobPosting = await this.prisma.job_posting.findUnique({
        where: { id: jobPostingId },
        include: {
          jobParsingTask: true,
        },
      });

      if (!jobPosting) {
        throw new AppError(
          `Job posting not found with id ${jobPostingId}`,
          404,
          ErrorCode.JOB_POSTING_NOT_FOUND
        );
      }

      if (!jobPosting.jobParsingTask) {
        throw new AppError(
          `No parsing task found for job posting ${jobPostingId}`,
          404,
          ErrorCode.PARSING_TASK_NOT_FOUND
        );
      }

      return toJobParsingTaskDomain(jobPosting.jobParsingTask);
    } catch (error) {
      logger.error('Failed to get parsing task for job posting', {
        context: 'ClientJobParsingService.getParsingTaskForJobPosting',
        error: error instanceof Error ? error.message : 'Unknown error',
        jobPostingId,
      });
      throw error;
    }
  }

  /**
   * Get parsing task by task ID
   */
  async getParsingTask(taskId: string): Promise<IJobParsingTask> {
    try {
      const task = await this.prisma.job_parsing_task.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        throw new AppError(
          `Parsing task not found with id ${taskId}`,
          404,
          ErrorCode.PARSING_TASK_NOT_FOUND
        );
      }

      return toJobParsingTaskDomain(task);
    } catch (error) {
      logger.error('Failed to get parsing task', {
        context: 'ClientJobParsingService.getParsingTask',
        error: error instanceof Error ? error.message : 'Unknown error',
        taskId,
      });
      throw error;
    }
  }

  /**
   * Get parsed job description
   */
  async getParsedJobDescription(taskId: string): Promise<IJobParsed> {
    try {
      const task = await this.prisma.job_parsing_task.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        throw new AppError(
          `Parsing task not found with id ${taskId}`,
          404,
          ErrorCode.PARSING_TASK_NOT_FOUND
        );
      }

      if (task.status !== JobParsingTaskStatusEnum.COMPLETED) {
        throw new AppError(
          'Job parsing task is not completed yet',
          400,
          ErrorCode.PARSING_TASK_NOT_COMPLETED
        );
      }

      const parsedJob = await this.parserProvider.getParsedJob(taskId);

      return parsedJob;
    } catch (error) {
      logger.error('Failed to get parsed job description', {
        context: 'ClientJobParsingService.getParsedJobDescription',
        error: error instanceof Error ? error.message : 'Unknown error',
        taskId,
      });
      throw error;
    }
  }

  /**
   * Update job posting with parsed data
   */
  async updateJobPosting(taskId: string): Promise<boolean> {
    try {
      const task = await this.prisma.job_parsing_task.findUnique({
        where: { id: taskId },
        include: {
          jobPosting: true,
        },
      });

      if (!task) {
        throw new AppError(
          `Parsing task not found with id ${taskId}`,
          404,
          ErrorCode.PARSING_TASK_NOT_FOUND
        );
      }

      // Update task status to updating job posting
      await this.prisma.job_parsing_task.update({
        where: { id: taskId },
        data: { status: JobParsingTaskStatusEnum.UPDATING_JOB_POSTING },
      });

      // Get parsed job data
      const parsedJob = await this.parserProvider.getParsedJob(taskId);

      // Update job posting with parsed data
      await this.updateJobPostingWithParsedData(
        task.jobPostingId,
        parsedJob.parsedJob
      );

      return true;
    } catch (error) {
      logger.error('Failed to update job posting', {
        context: 'ClientJobParsingService.updateJobPosting',
        error: error instanceof Error ? error.message : 'Unknown error',
        taskId,
      });

      // Update task status to failed
      await this.prisma.job_parsing_task.update({
        where: { id: taskId },
        data: {
          status: JobParsingTaskStatusEnum.FAILED,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      return false;
    }
  }

  /**
   * Update job posting with parsed data
   */
  private async updateJobPostingWithParsedData(
    jobPostingId: string,
    parsedJobData: Partial<ICandidateJobPosting>
  ): Promise<void> {
    try {
      const updateData: any = {};

      // Map parsed data to job posting fields
      if (parsedJobData.title) updateData.title = parsedJobData.title;
      if (parsedJobData.description)
        updateData.description = parsedJobData.description;
      if (parsedJobData.jobType) updateData.jobType = parsedJobData.jobType;
      if (parsedJobData.jobCommitment)
        updateData.jobCommitment = parsedJobData.jobCommitment;
      if (parsedJobData.jobSchedule)
        updateData.jobSchedule = parsedJobData.jobSchedule;
      if (parsedJobData.industry) updateData.industry = parsedJobData.industry;
      if (parsedJobData.totalExperience)
        updateData.totalExperience = parsedJobData.totalExperience;
      if (parsedJobData.department)
        updateData.department = parsedJobData.department;
      if (parsedJobData.teamSize) updateData.teamSize = parsedJobData.teamSize;
      if (parsedJobData.reportingTo)
        updateData.reportingTo = parsedJobData.reportingTo;
      if (parsedJobData.numberOfOpenings)
        updateData.numberOfOpenings = parsedJobData.numberOfOpenings;
      if (parsedJobData.isRemote !== undefined)
        updateData.isRemote = parsedJobData.isRemote;
      if (parsedJobData.minSalary)
        updateData.minSalary = parsedJobData.minSalary;
      if (parsedJobData.maxSalary)
        updateData.maxSalary = parsedJobData.maxSalary;
      if (parsedJobData.salaryCurrency)
        updateData.salaryCurrency = parsedJobData.salaryCurrency;
      if (parsedJobData.equity !== undefined)
        updateData.equity = parsedJobData.equity;
      if (parsedJobData.benefits) updateData.benefits = parsedJobData.benefits;
      if (parsedJobData.responsibilities)
        updateData.responsibilities = parsedJobData.responsibilities;
      if (parsedJobData.requiredSkills)
        updateData.requiredSkills = parsedJobData.requiredSkills;
      if (parsedJobData.preferredSkills)
        updateData.preferredSkills = parsedJobData.preferredSkills;
      if (parsedJobData.preferredUniversities)
        updateData.preferredUniversities = parsedJobData.preferredUniversities;
      if (parsedJobData.preferredDegrees)
        updateData.preferredDegrees = parsedJobData.preferredDegrees;
      if (parsedJobData.preferredLocations)
        updateData.preferredLocations = parsedJobData.preferredLocations;
      if (parsedJobData.preferredIndustries)
        updateData.preferredIndustries = parsedJobData.preferredIndustries;
      if (parsedJobData.tags) updateData.tags = parsedJobData.tags;
      if (parsedJobData.applicationDeadline)
        updateData.applicationDeadline = parsedJobData.applicationDeadline;
      if (parsedJobData.availableFrom)
        updateData.availableFrom = parsedJobData.availableFrom;

      // Update job posting
      await this.prisma.job_posting.update({
        where: { id: jobPostingId },
        data: updateData,
      });

      logger.info('Job posting updated successfully with parsed data', {
        context: 'ClientJobParsingService.updateJobPostingWithParsedData',
        jobPostingId,
      });
    } catch (error) {
      logger.error('Failed to update job posting with parsed data', {
        context: 'ClientJobParsingService.updateJobPostingWithParsedData',
        error: error instanceof Error ? error.message : 'Unknown error',
        jobPostingId,
      });
      throw error;
    }
  }

  /**
   * Upload job description file for public parsing (without authentication)
   */
  async uploadJobDescriptionPublic(
    file: Buffer,
    fileName: string,
    mode: JobParsingMode = JobParsingMode.INFERRED
  ): Promise<IJobPublicParsingTask> {
    try {
      // Upload file to storage
      const sanitizedFileName = this.sanitizeFileName(fileName);
      const { folderPath } = getBucketFolderPathToJobPosting('public');
      const uniqueFileName = `${Date.now()}-${sanitizedFileName}`;
      const filePath = `${folderPath}/${uniqueFileName}`;
      await this.storageProvider.uploadFile(file, filePath);

      // Create public parsing task
      const task = await this.prisma.job_public_parsing_task.create({
        data: {
          fileName: sanitizedFileName,
          status: JobParsingTaskStatusEnum.PENDING,
        },
      });

      // Parse job description in the background using queue
      await this.jobParsingProcessor.addPublicParsingJob(
        task.id,
        filePath,
        mode
      );

      return toJobPublicParsingTaskDomain(task);
    } catch (error) {
      logger.error('Failed to upload job description for public parsing', {
        context: 'ClientJobParsingService.uploadJobDescriptionPublic',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get public parsing task by task ID
   */
  async getPublicParsingTask(taskId: string): Promise<IJobPublicParsingTask> {
    try {
      const task = await this.prisma.job_public_parsing_task.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        throw new AppError(
          `Public parsing task not found with id ${taskId}`,
          404,
          ErrorCode.PARSING_TASK_NOT_FOUND
        );
      }

      return toJobPublicParsingTaskDomain(task);
    } catch (error) {
      logger.error('Failed to get public parsing task', {
        context: 'ClientJobParsingService.getPublicParsingTask',
        error: error instanceof Error ? error.message : 'Unknown error',
        taskId,
      });
      throw error;
    }
  }

  /**
   * Get parsed job description from public task
   */
  async getParsedJobDescriptionFromPublicTask(
    taskId: string
  ): Promise<IJobParsed> {
    try {
      const task = await this.prisma.job_public_parsing_task.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        throw new AppError(
          `Public parsing task not found with id ${taskId}`,
          404,
          ErrorCode.PARSING_TASK_NOT_FOUND
        );
      }

      if (task.status !== JobParsingTaskStatusEnum.COMPLETED) {
        throw new AppError(
          'Job parsing task is not completed yet',
          400,
          ErrorCode.PARSING_TASK_NOT_COMPLETED
        );
      }

      const parsedJob = await this.parserProvider.getParsedJob(taskId);

      return parsedJob;
    } catch (error) {
      logger.error('Failed to get parsed job description from public task', {
        context:
          'ClientJobParsingService.getParsedJobDescriptionFromPublicTask',
        error: error instanceof Error ? error.message : 'Unknown error',
        taskId,
      });
      throw error;
    }
  }

  /**
   * Background parse job description for public task
   */
  async backgroundParseJobDescriptionPublic(
    taskId: string,
    jobUrl: string,
    mode: JobParsingMode
  ): Promise<void> {
    try {
      const task = await this.prisma.job_public_parsing_task.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        throw new AppError(
          `Public parsing task not found with id ${taskId}`,
          404,
          ErrorCode.PARSING_TASK_NOT_FOUND
        );
      }

      // Update task status to processing
      await this.prisma.job_public_parsing_task.update({
        where: { id: taskId },
        data: { status: JobParsingTaskStatusEnum.PROCESSING },
      });

      // Initiate parsing task
      await this.parserProvider.parse(taskId, jobUrl, mode);

      // Update task status to completed
      await this.prisma.job_public_parsing_task.update({
        where: { id: taskId },
        data: { status: JobParsingTaskStatusEnum.COMPLETED },
      });
    } catch (error) {
      logger.error('Failed to parse job description for public task', {
        context: 'ClientJobParsingService.backgroundParseJobDescriptionPublic',
        error: error instanceof Error ? error.message : 'Unknown error',
        taskId,
      });

      // Update task status to failed
      await this.prisma.job_public_parsing_task.update({
        where: { id: taskId },
        data: {
          status: JobParsingTaskStatusEnum.FAILED,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }
}
