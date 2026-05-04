import { Queue, Worker, Job, QueueOptions, WorkerOptions } from 'bullmq';
import { singleton } from '@/shared/decorators/singleton';
import { logger } from '@/shared/utils/logger';
import { ENV } from '@/config/env';
import Redis from 'ioredis';

export const QUEUE_NAMES = {
  ONBOARDING_ASSESSMENT_INITIALIZE: 'onboarding-assessment-initialize',
  ONBOARDING_ASSESSMENT_SUBMIT: 'onboarding-assessment-submit',
  ONBOARDING_ASSESSMENT_VIDEO_ANALYSIS: 'onboarding-assessment-video-analysis',
  JOB_AI_ASSESSMENT_INITIALIZE: 'job-ai-assessment-initialize',
  JOB_AI_ASSESSMENT_SUBMIT: 'job-ai-assessment-submit',
  JOB_AI_ASSESSMENT_VIDEO_ANALYSIS: 'job-ai-assessment-video-analysis',
  PUBLIC_PRACTICE_ASSESSMENT_INITIALIZE:
    'public-practice-assessment-initialize',
  PUBLIC_PRACTICE_ASSESSMENT_SUBMIT: 'public-practice-assessment-submit',
  PUBLIC_PRACTICE_ASSESSMENT_VIDEO_ANALYSIS:
    'public-practice-assessment-video-analysis',
  RESUME_PARSING: 'resume-parsing',
  RESUME_ASSESSMENT: 'resume-assessment',
  JOB_PARSING: 'job-parsing',
  JOB_POSTING_ASSESSMENT: 'job-posting-assessment',
  RAG_PROCESSING: 'rag-processing',
  FEEDBACK_EMAIL_PROCESSING: 'feedback-email-processing',
  JOB_RECOMMENDATION_PROCESSING: 'job-recommendation-processing',
  JOB_RECOMMENDATION_PROCESSING_INITIAL:
    'job-recommendation-processing-initial',
  CANDIDATE_RECOMMENDATION_PROCESSING: 'candidate-recommendation-processing',
  CANDIDATE_RECOMMENDATION_PROCESSING_INITIAL:
    'candidate-recommendation-processing-initial',
  CANDIDATE_IMPORT_INVITE_PROCESSING: 'candidate-import-invite-processing',
  SUPPORT_INVITATION_IMPORT_PROCESSING: 'support-invitation-import-processing',
  SUBSCRIPTION_EXPIRY_PROCESSING: 'subscription-expiry-processing',
  DAILY_STATS_PROCESSING: 'daily-stats-processing',
  DAILY_DIGEST_PROCESSING: 'daily-digest-processing',
} as const;

export interface QueueJobData {
  [key: string]: any;
}

export interface QueueJobOptions {
  delay?: number;
  attempts?: number;
  backoff?: {
    type: 'exponential' | 'fixed';
    delay: number;
  };
  removeOnComplete?: number;
  removeOnFail?: number;
  jobId?: string; // For job deduplication - prevents duplicate jobs with same ID
}

@singleton
export class QueueService {
  private static instance: QueueService;
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private redisConnection: Redis;

  constructor() {
    // Create Redis connection for BullMQ
    this.redisConnection = new Redis({
      host: ENV.BULLMQ_REDIS_HOST,
      port: ENV.BULLMQ_REDIS_PORT,
      password: ENV.BULLMQ_REDIS_PASSWORD,
      username: ENV.BULLMQ_REDIS_USER,
      db: ENV.BULLMQ_REDIS_DB,
      enableReadyCheck: false,
      lazyConnect: true,
      maxRetriesPerRequest: null, // Required for BullMQ
    });

    this.redisConnection.on('error', (err) => {
      logger.error('BullMQ Redis connection error', {
        context: 'QueueService.constructor',
        error: err.message,
      });
    });

    this.redisConnection.on('connect', () => {
      logger.info('BullMQ Redis connected', {
        context: 'QueueService.constructor',
      });
    });

    logger.info('Queue service initialized', {
      context: 'QueueService.constructor',
    });
  }

  initializeQueues(): void {
    this.getQueue(QUEUE_NAMES.ONBOARDING_ASSESSMENT_INITIALIZE);
    this.getQueue(QUEUE_NAMES.ONBOARDING_ASSESSMENT_SUBMIT);
    this.getQueue(QUEUE_NAMES.ONBOARDING_ASSESSMENT_VIDEO_ANALYSIS);
    this.getQueue(QUEUE_NAMES.JOB_AI_ASSESSMENT_INITIALIZE);
    this.getQueue(QUEUE_NAMES.JOB_AI_ASSESSMENT_SUBMIT);
    this.getQueue(QUEUE_NAMES.JOB_AI_ASSESSMENT_VIDEO_ANALYSIS);
    this.getQueue(QUEUE_NAMES.PUBLIC_PRACTICE_ASSESSMENT_INITIALIZE);
    this.getQueue(QUEUE_NAMES.PUBLIC_PRACTICE_ASSESSMENT_SUBMIT);
    this.getQueue(QUEUE_NAMES.PUBLIC_PRACTICE_ASSESSMENT_VIDEO_ANALYSIS);
    this.getQueue(QUEUE_NAMES.RESUME_PARSING);
    this.getQueue(QUEUE_NAMES.RESUME_ASSESSMENT);
    this.getQueue(QUEUE_NAMES.JOB_PARSING);
    this.getQueue(QUEUE_NAMES.JOB_POSTING_ASSESSMENT);
    this.getQueue(QUEUE_NAMES.RAG_PROCESSING);
    this.getQueue(QUEUE_NAMES.FEEDBACK_EMAIL_PROCESSING);
    this.getQueue(QUEUE_NAMES.JOB_RECOMMENDATION_PROCESSING);
    this.getQueue(QUEUE_NAMES.JOB_RECOMMENDATION_PROCESSING_INITIAL);
    this.getQueue(QUEUE_NAMES.CANDIDATE_RECOMMENDATION_PROCESSING);
    this.getQueue(QUEUE_NAMES.CANDIDATE_RECOMMENDATION_PROCESSING_INITIAL);
    this.getQueue(QUEUE_NAMES.CANDIDATE_IMPORT_INVITE_PROCESSING);
    this.getQueue(QUEUE_NAMES.SUPPORT_INVITATION_IMPORT_PROCESSING);
    this.getQueue(QUEUE_NAMES.SUBSCRIPTION_EXPIRY_PROCESSING);
    this.getQueue(QUEUE_NAMES.DAILY_STATS_PROCESSING);
    this.getQueue(QUEUE_NAMES.DAILY_DIGEST_PROCESSING);
  }

  /**
   * Create or get a queue
   */
  getQueue(queueName: string, options?: Partial<QueueOptions>): Queue {
    if (this.queues.has(queueName)) {
      return this.queues.get(queueName)!;
    }

    const defaultOptions: QueueOptions = {
      connection: this.redisConnection,
      defaultJobOptions: {
        attempts: ENV.BULLMQ_DEFAULT_JOB_ATTEMPTS,
        backoff: {
          type: 'exponential',
          delay: ENV.BULLMQ_DEFAULT_JOB_BACKOFF_DELAY,
        },
        removeOnComplete: { count: 10 },
        removeOnFail: { count: 50 },
      },
    };

    const queue = new Queue(queueName, {
      ...defaultOptions,
      ...options,
    });

    this.queues.set(queueName, queue);

    logger.info(`Queue created: ${queueName}`, {
      context: 'QueueService.getQueue',
      queueName,
    });

    return queue;
  }

  /**
   * Create a worker for a queue
   */
  createWorker<T extends QueueJobData = QueueJobData>(
    queueName: string,
    processor: (job: Job<T>) => Promise<any>,
    options?: Partial<WorkerOptions>
  ): Worker {
    if (this.workers.has(queueName)) {
      logger.warn(`Worker already exists for queue: ${queueName}`, {
        context: 'QueueService.createWorker',
        queueName,
      });
      return this.workers.get(queueName)!;
    }

    const defaultOptions: WorkerOptions = {
      connection: this.redisConnection,
      concurrency: ENV.BULLMQ_DASHBOARD_CONCURRENCY,
      removeOnComplete: { count: 10 },
      removeOnFail: { count: 50 },
    };

    const worker = new Worker(
      queueName,
      async (job: Job<T>) => {
        logger.info(`Processing job: ${job.id} in queue: ${queueName}`, {
          context: 'QueueService.createWorker',
          queueName,
          jobId: job.id,
          jobData: job.data,
        });

        try {
          const result = await processor(job);
          logger.info(`Job completed: ${job.id} in queue: ${queueName}`, {
            context: 'QueueService.createWorker',
            queueName,
            jobId: job.id,
          });
          return result;
        } catch (error) {
          logger.error(`Job failed: ${job.id} in queue: ${queueName}`, {
            context: 'QueueService.createWorker',
            queueName,
            jobId: job.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          throw error;
        }
      },
      {
        ...defaultOptions,
        ...options,
      }
    );

    // Set up worker event listeners
    worker.on('completed', (job) => {
      logger.info(`Worker completed job: ${job.id}`, {
        context: 'QueueService.worker.completed',
        queueName,
        jobId: job.id,
      });
    });

    worker.on('failed', (job, err) => {
      logger.error(`Worker failed job: ${job?.id}`, {
        context: 'QueueService.worker.failed',
        queueName,
        jobId: job?.id,
        error: err.message,
        attempts: job?.attemptsMade,
      });
    });

    worker.on('error', (err) => {
      logger.error(`Worker error in queue: ${queueName}`, {
        context: 'QueueService.worker.error',
        queueName,
        error: err.message,
      });
    });

    this.workers.set(queueName, worker);

    logger.info(`Worker created for queue: ${queueName}`, {
      context: 'QueueService.createWorker',
      queueName,
    });

    return worker;
  }

  /**
   * Add a job to a queue
   */
  async addJob(
    queueName: string,
    jobName: string,
    data: QueueJobData,
    options?: QueueJobOptions
  ): Promise<Job<QueueJobData>> {
    const queue = this.getQueue(queueName);

    const job = await queue.add(jobName, data, options);

    logger.info(`Job added to queue: ${queueName}`, {
      context: 'QueueService.addJob',
      queueName,
      jobName,
      jobId: job.id,
      data,
    });

    return job;
  }

  /**
   * Get job by ID from a queue
   */
  async getJob(
    queueName: string,
    jobId: string
  ): Promise<Job<QueueJobData> | undefined> {
    const queue = this.getQueue(queueName);
    return queue.getJob(jobId);
  }

  /**
   * Remove a job from a queue
   */
  async removeJob(queueName: string, jobId: string): Promise<void> {
    const job = await this.getJob(queueName, jobId);
    if (job) {
      await job.remove();
      logger.info(`Job removed from queue: ${queueName}`, {
        context: 'QueueService.removeJob',
        queueName,
        jobId,
      });
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName: string) {
    const queue = this.getQueue(queueName);
    const waiting = await queue.getWaiting();
    const active = await queue.getActive();
    const completed = await queue.getCompleted();
    const failed = await queue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
    };
  }

  /**
   * Get all queues
   */
  getAllQueues(): Map<string, Queue> {
    return this.queues;
  }

  /**
   * Pause a queue
   */
  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.pause();
    logger.info(`Queue paused: ${queueName}`, {
      context: 'QueueService.pauseQueue',
      queueName,
    });
  }

  /**
   * Resume a queue
   */
  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.resume();
    logger.info(`Queue resumed: ${queueName}`, {
      context: 'QueueService.resumeQueue',
      queueName,
    });
  }

  /**
   * Clean up resources
   */
  async close(): Promise<void> {
    logger.info('Closing queue service', {
      context: 'QueueService.close',
    });

    // Close all workers
    for (const [queueName, worker] of this.workers) {
      await worker.close();
      logger.info(`Worker closed for queue: ${queueName}`, {
        context: 'QueueService.close',
        queueName,
      });
    }

    // Close all queues
    for (const [queueName, queue] of this.queues) {
      await queue.close();
      logger.info(`Queue closed: ${queueName}`, {
        context: 'QueueService.close',
        queueName,
      });
    }

    // Close Redis connection
    await this.redisConnection.quit();

    this.workers.clear();
    this.queues.clear();

    logger.info('Queue service closed', {
      context: 'QueueService.close',
    });
  }
}
