import { Job } from 'bullmq';
import { singleton } from '@/shared/decorators/singleton';
import { logger } from '@/shared/utils/logger';
import { QueueService, QueueJobData, QUEUE_NAMES } from '../queue.service';
import { JobRecommendationCronService } from '@/services/cron/job.recommendation.cron.service';
import { ENV } from '@/config/env';

export interface JobRecommendationJobData extends QueueJobData {
  taskId: string;
  batchSize: number;
}

export interface JobInitialRecommendationJobData extends QueueJobData {
  jobPostingId: string;
  limit: number;
}

@singleton
export class JobRecommendationProcessor {
  private readonly queueService: QueueService;

  constructor(
    private readonly jobRecommendationCronService: JobRecommendationCronService
  ) {
    this.queueService = new QueueService();
    logger.info('Job recommendation processor initialized', {
      context: 'JobRecommendationProcessor.constructor',
    });
  }

  /**
   * Set up workers for processing job recommendation jobs
   */
  async setupWorkers(): Promise<void> {
    // Job recommendation processing worker
    this.queueService.createWorker(
      QUEUE_NAMES.JOB_RECOMMENDATION_PROCESSING,
      this.processJobRecommendationJob.bind(this),
      {
        concurrency: ENV.BULLMQ_DASHBOARD_CONCURRENCY,
      }
    );

    // Initial recommendations worker
    this.queueService.createWorker(
      QUEUE_NAMES.JOB_RECOMMENDATION_PROCESSING_INITIAL,
      this.processInitialRecommendationsJob.bind(this),
      {
        concurrency: ENV.BULLMQ_DASHBOARD_CONCURRENCY,
      }
    );

    logger.info('Job recommendation workers initialized', {
      context: 'JobRecommendationProcessor.setupWorkers',
    });
  }

  /**
   * Add a job recommendation job to the queue
   */
  async addJobRecommendationJob(
    taskId: string,
    batchSize: number
  ): Promise<void> {
    const queue = this.queueService.getQueue(
      QUEUE_NAMES.JOB_RECOMMENDATION_PROCESSING
    );

    const jobData: JobRecommendationJobData = {
      taskId,
      batchSize,
    };

    await queue.add('process-job-recommendations', jobData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });

    logger.info('Job recommendation job added to queue', {
      context: 'JobRecommendationProcessor.addJobRecommendationJob',
      taskId,
      batchSize,
    });
  }

  /**
   * Add a job to find initial recommendations for a job posting
   */
  async addFindInitialRecommendationsJob(
    jobPostingId: string,
    limit: number = 50
  ): Promise<void> {
    const queue = this.queueService.getQueue(
      QUEUE_NAMES.JOB_RECOMMENDATION_PROCESSING_INITIAL
    );

    const jobData: JobInitialRecommendationJobData = {
      jobPostingId,
      limit,
    };

    await queue.add('find-initial-recommendations', jobData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      delay: 5000, // Delay 5 seconds to allow job posting to be fully processed
    });

    logger.info('Initial recommendations job added to queue', {
      context: 'JobRecommendationProcessor.addFindInitialRecommendationsJob',
      jobPostingId,
      limit,
    });
  }

  /**
   * Process job recommendation job
   */
  private async processJobRecommendationJob(
    job: Job<JobRecommendationJobData>
  ): Promise<void> {
    const { taskId, batchSize } = job.data;

    logger.info('Processing job recommendation job', {
      context: 'JobRecommendationProcessor.processJobRecommendationJob',
      jobId: job.id,
      taskId,
      batchSize,
    });

    try {
      // Start background processing task
      await this.jobRecommendationCronService.startBackgroundProcessJobs(
        taskId,
        batchSize
      );

      logger.info('Job recommendation job completed successfully', {
        context: 'JobRecommendationProcessor.processJobRecommendationJob',
        jobId: job.id,
        taskId,
      });
    } catch (error) {
      logger.error('Failed to process job recommendation job', {
        context: 'JobRecommendationProcessor.processJobRecommendationJob',
        jobId: job.id,
        taskId,
        batchSize,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Process initial recommendations job
   */
  private async processInitialRecommendationsJob(
    job: Job<JobInitialRecommendationJobData>
  ): Promise<void> {
    const { jobPostingId, limit } = job.data;

    logger.info('Processing initial recommendations job', {
      context: 'JobRecommendationProcessor.processInitialRecommendationsJob',
      jobId: job.id,
      jobPostingId,
      limit,
    });

    try {
      // Process initial recommendations
      await this.jobRecommendationCronService.startInitialRecommendationsJob(
        jobPostingId,
        limit
      );

      logger.info('Initial recommendations job completed successfully', {
        context: 'JobRecommendationProcessor.processInitialRecommendationsJob',
        jobId: job.id,
        jobPostingId,
      });
    } catch (error) {
      logger.error('Failed to process initial recommendations job', {
        context: 'JobRecommendationProcessor.processInitialRecommendationsJob',
        jobId: job.id,
        jobPostingId,
        limit,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
