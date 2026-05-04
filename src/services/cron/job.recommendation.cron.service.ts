import { PrismaClient } from '@prisma/client';
import { singleton } from '@/shared/decorators/singleton';
import {
  IJobRecommendationCronTask,
  JobRecommendationCronTaskStatus,
  toJobRecommendationCronTask,
  toJobRecommendationCronTaskList,
  IJobRecommendationCronTaskFilterQuery,
} from '@/shared/models/domain/cron/job.recommendation.cron.domain';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import {
  IPaginationRequest,
  IPaginatedResponse,
} from '@/shared/models/api/common/common.api';
import { getPaginationInfo } from '@/utils/pagination';
import { JobRecommendationProcessor } from '../queue/processors/job.recommendation.processor';
import { JobRecommendationFactory } from '../helpers/job.recommendation/job.recommendation.factory';
import { ENV } from '@/config/env';

@singleton
export class JobRecommendationCronService {
  private readonly prisma: PrismaClient;
  private readonly jobRecommendationFactory: JobRecommendationFactory;
  private readonly jobRecommendationProcessor: JobRecommendationProcessor;

  constructor() {
    this.prisma = new PrismaClient();
    this.jobRecommendationFactory = JobRecommendationFactory.getInstance();
    this.jobRecommendationProcessor = new JobRecommendationProcessor(this);
    if (ENV.ENABLE_BULLMQ_WORKERS) {
      this.jobRecommendationProcessor.setupWorkers();
    }
    logger.info(
      'Job recommendation cron service initialized with BullMQ integration',
      {
        context: 'JobRecommendationCronService.constructor',
      }
    );
  }

  /**
   * Start a new job recommendation task for initial recommendations
   */
  async startJobRecommendationTask(
    batchSize: number = 10
  ): Promise<IJobRecommendationCronTask> {
    try {
      // Create a new task
      const task = await this.prisma.job_recommendation_cron_task.create({
        data: {
          id: uuidv4(),
          status: JobRecommendationCronTaskStatus.PENDING,
          totalJobs: 0,
          processedJobs: 0,
          failedJobs: 0,
          recommendationsCreated: 0,
          startedAt: new Date(),
        },
      });

      // Start processing in background using queue
      await this.jobRecommendationProcessor.addJobRecommendationJob(
        task.id,
        batchSize
      );

      logger.info('Job recommendation task created', {
        context: 'JobRecommendationCronService.startJobRecommendationTask',
        taskId: task.id,
        batchSize,
      });

      return toJobRecommendationCronTask(task);
    } catch (error) {
      logger.error({
        message: 'Failed to start job recommendation task',
        context: 'JobRecommendationCronService.startJobRecommendationTask',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Find initial recommendations for a specific job posting
   */
  async findInitialRecommendations(
    jobPostingId: string,
    limit: number = 50,
    prevSyncDateTime?: Date
  ): Promise<void> {
    try {
      logger.info('Finding initial recommendations for job posting', {
        context: 'JobRecommendationCronService.findInitialRecommendations',
        jobPostingId,
        limit,
        prevSyncDateTime,
      });

      // Verify job posting exists before proceeding
      const jobPosting = await this.prisma.job_posting.findUnique({
        where: { id: jobPostingId },
        select: { id: true },
      });

      if (!jobPosting) {
        logger.error('Job posting not found', {
          context: 'JobRecommendationCronService.findInitialRecommendations',
          jobPostingId,
        });
        throw new Error('Job posting not found');
      }

      const provider = this.jobRecommendationFactory.getProvider();
      await provider.findInitialRecommendations(
        jobPostingId,
        limit,
        prevSyncDateTime
      );

      logger.info('Initial recommendations completed successfully', {
        context: 'JobRecommendationCronService.findInitialRecommendations',
        jobPostingId,
      });
    } catch (error) {
      logger.error('Failed to find initial recommendations', {
        context: 'JobRecommendationCronService.findInitialRecommendations',
        jobPostingId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Add a background job to find initial recommendations for a job posting
   */
  async addFindInitialRecommendationsJob(
    jobPostingId: string,
    limit: number = 50
  ): Promise<void> {
    try {
      logger.info('Adding background job for initial recommendations', {
        context:
          'JobRecommendationCronService.addFindInitialRecommendationsJob',
        jobPostingId,
        limit,
      });

      await this.jobRecommendationProcessor.addFindInitialRecommendationsJob(
        jobPostingId,
        limit
      );

      logger.info('Background job added successfully', {
        context:
          'JobRecommendationCronService.addFindInitialRecommendationsJob',
        jobPostingId,
      });
    } catch (error) {
      logger.error('Failed to add background job for initial recommendations', {
        context:
          'JobRecommendationCronService.addFindInitialRecommendationsJob',
        jobPostingId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Background process to find initial recommendations for a job posting
   */
  async startInitialRecommendationsJob(
    jobPostingId: string,
    limit: number = 50
  ): Promise<void> {
    try {
      logger.info('Processing background job for initial recommendations', {
        context:
          'JobRecommendationCronService.processInitialRecommendationsJob',
        jobPostingId,
        limit,
      });

      // Verify job posting exists and is published
      const jobPosting = await this.prisma.job_posting.findUnique({
        where: { id: jobPostingId },
        select: {
          id: true,
          isPublished: true,
          status: true,
          recommendationsSync: true,
        },
      });

      if (!jobPosting) {
        logger.warn('Job posting not found, skipping recommendations', {
          context:
            'JobRecommendationCronService.processInitialRecommendationsJob',
          jobPostingId,
        });
        return;
      }

      // Check if initial recommendations already exist
      let prevSyncDateTime: Date | undefined;
      if (jobPosting.recommendationsSync) {
        prevSyncDateTime = new Date(jobPosting.recommendationsSync);

        logger.info('Previous date time', {
          context:
            'JobRecommendationCronService.processInitialRecommendationsJob',
          prevSyncDateTime,
        });
      }

      // Find initial recommendations
      await this.findInitialRecommendations(
        jobPostingId,
        limit,
        prevSyncDateTime
      );

      logger.info(
        'Background job for initial recommendations completed successfully',
        {
          context:
            'JobRecommendationCronService.processInitialRecommendationsJob',
          jobPostingId,
        }
      );
    } catch (error) {
      logger.error(
        'Failed to process background job for initial recommendations',
        {
          context:
            'JobRecommendationCronService.processInitialRecommendationsJob',
          jobPostingId,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );
      throw error;
    }
  }

  /**
   * Find new recommendations for a specific job posting based on new candidates
   */
  async findRecommendations(
    jobPostingId: string,
    limit: number = 25
  ): Promise<void> {
    try {
      logger.info('Finding new recommendations for job posting', {
        context: 'JobRecommendationCronService.findRecommendations',
        jobPostingId,
        limit,
      });

      // Get the last sync timestamp
      const jobPosting = await this.prisma.job_posting.findUnique({
        where: { id: jobPostingId },
        select: { recommendationsSync: true },
      });

      if (!jobPosting) {
        throw new AppError('Job posting not found', 404, ErrorCode.NOT_FOUND);
      }

      const provider = this.jobRecommendationFactory.getProvider();
      await provider.findRecommendations(
        jobPostingId,
        jobPosting.recommendationsSync || undefined,
        limit
      );

      logger.info('New recommendations completed successfully', {
        context: 'JobRecommendationCronService.findRecommendations',
        jobPostingId,
      });
    } catch (error) {
      logger.error('Failed to find new recommendations', {
        context: 'JobRecommendationCronService.findRecommendations',
        jobPostingId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get a job recommendation task by ID
   */
  async getTask(taskId: string): Promise<IJobRecommendationCronTask> {
    try {
      const task = await this.prisma.job_recommendation_cron_task.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        throw new AppError('Task not found', 404, ErrorCode.NOT_FOUND);
      }

      return toJobRecommendationCronTask(task);
    } catch (error) {
      logger.error({
        message: 'Failed to get job recommendation task',
        context: 'JobRecommendationCronService.getTask',
        error: error instanceof Error ? error.message : 'Unknown error',
        taskId,
      });
      throw error;
    }
  }

  /**
   * Get all job recommendation tasks with pagination and filtering
   */
  async getAllTasks(
    filter: IJobRecommendationCronTaskFilterQuery,
    paginationRequest: IPaginationRequest
  ): Promise<IPaginatedResponse<IJobRecommendationCronTask>> {
    try {
      // Get pagination info
      const paginationInfo = getPaginationInfo(paginationRequest);

      // Build where clause based on filters
      const where = {
        ...(filter.status && { status: filter.status }),
      };

      // Get total count for pagination
      const total = await this.prisma.job_recommendation_cron_task.count({
        where,
      });

      // Get paginated results
      const tasks = await this.prisma.job_recommendation_cron_task.findMany({
        where,
        skip: paginationInfo.skip,
        take: paginationInfo.take,
        orderBy: paginationInfo.orderBy,
      });

      // Convert to domain model
      const tasksDomain = toJobRecommendationCronTaskList(tasks);

      return {
        items: tasksDomain,
        pagination: {
          total,
          page: paginationInfo.skip,
          limit: paginationInfo.take,
          totalPages: Math.ceil(total / paginationInfo.take),
        },
      };
    } catch (error) {
      logger.error({
        message: 'Failed to get job recommendation tasks',
        context: 'JobRecommendationCronService.getAllTasks',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Start background processing of job recommendations (public method for queue processor)
   */
  async startBackgroundProcessJobs(
    cronTaskId: string,
    batchSize: number
  ): Promise<void> {
    try {
      logger.info({
        message: 'Processing job recommendations',
        context: 'JobRecommendationCronService.startBackgroundProcessJobs',
        cronTaskId,
        batchSize,
      });

      // Update task status to processing
      await this.prisma.job_recommendation_cron_task.update({
        where: { id: cronTaskId },
        data: { status: JobRecommendationCronTaskStatus.PROCESSING },
      });

      // Get jobs that need recommendations
      const jobsNeedingRecommendations = await this.prisma.job_posting.findMany(
        {
          where: {
            status: 'PUBLISHED',
            isPublished: true,
            OR: [
              { recommendationsSync: null }, // Never synced
              {
                recommendationsSync: {
                  lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Older than 24 hours
                },
              },
            ],
          },
          select: { id: true, recommendationsSync: true },
          take: batchSize,
        }
      );

      const totalJobs = jobsNeedingRecommendations.length;

      // Update total jobs count
      await this.prisma.job_recommendation_cron_task.update({
        where: { id: cronTaskId },
        data: { totalJobs },
      });

      let processedJobs = 0;
      let failedJobs = 0;
      let totalRecommendationsCreated = 0;

      // Process each job posting
      for (const job of jobsNeedingRecommendations) {
        try {
          logger.info('Processing job recommendations', {
            context: 'JobRecommendationCronService.startBackgroundProcessJobs',
            jobId: job.id,
            cronTaskId,
          });

          if (job.recommendationsSync) {
            // Find new recommendations
            await this.findRecommendations(job.id);
          } else {
            // Find initial recommendations
            await this.findInitialRecommendations(job.id);
          }

          processedJobs++;

          // Update progress
          await this.prisma.job_recommendation_cron_task.update({
            where: { id: cronTaskId },
            data: { processedJobs },
          });
        } catch (error) {
          failedJobs++;
          logger.error('Failed to process job recommendations', {
            context: 'JobRecommendationCronService.startBackgroundProcessJobs',
            jobId: job.id,
            cronTaskId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });

          // Update failed jobs count
          await this.prisma.job_recommendation_cron_task.update({
            where: { id: cronTaskId },
            data: { failedJobs },
          });
        }
      }

      // Count total recommendations created
      const recommendationsCount =
        await this.prisma.job_posting_recommendation.count({
          where: {
            jobPostingId: {
              in: jobsNeedingRecommendations.map((j) => j.id),
            },
            createdAt: {
              gte: new Date(Date.now() - 60 * 60 * 1000), // Created in the last hour
            },
          },
        });

      totalRecommendationsCreated = recommendationsCount;

      // Update task status to completed
      await this.prisma.job_recommendation_cron_task.update({
        where: { id: cronTaskId },
        data: {
          status: JobRecommendationCronTaskStatus.COMPLETED,
          processedJobs,
          failedJobs,
          recommendationsCreated: totalRecommendationsCreated,
          completedAt: new Date(),
        },
      });

      logger.info('Job recommendations processing completed', {
        context: 'JobRecommendationCronService.startBackgroundProcessJobs',
        cronTaskId,
        totalJobs,
        processedJobs,
        failedJobs,
        totalRecommendationsCreated,
      });
    } catch (error) {
      // Update task status to failed
      await this.prisma.job_recommendation_cron_task.update({
        where: { id: cronTaskId },
        data: {
          status: JobRecommendationCronTaskStatus.FAILED,
          error: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        },
      });

      logger.error('Job recommendations processing failed', {
        context: 'JobRecommendationCronService.startBackgroundProcessJobs',
        cronTaskId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }
}
