import { Job } from 'bullmq';
import { singleton } from '@/shared/decorators/singleton';
import { logger } from '@/shared/utils/logger';
import { QueueService, QueueJobData, QUEUE_NAMES } from '../queue.service';
import { PrismaClient } from '@prisma/client';
import { ENV } from '@/config/env';
import type { RagCronService } from '../../cron/rag.cron.service';

export interface RagCronJobData extends QueueJobData {
  taskId: string;
  batchSize: number;
}

@singleton
export class RagCronProcessor {
  private readonly prisma: PrismaClient;
  private readonly queueService: QueueService;

  constructor(private readonly ragCronService: RagCronService) {
    this.prisma = new PrismaClient();
    this.queueService = new QueueService();
    logger.info('RAG cron processor initialized', {
      context: 'RagCronProcessor.constructor',
    });
  }

  /**
   * Set up workers for processing RAG cron jobs
   */
  async setupWorkers(): Promise<void> {
    // RAG processing worker
    this.queueService.createWorker(
      QUEUE_NAMES.RAG_PROCESSING,
      this.processRagJob.bind(this),
      {
        concurrency: ENV.BULLMQ_DASHBOARD_CONCURRENCY,
      }
    );

    logger.info('RAG cron workers initialized', {
      context: 'RagCronProcessor.setupWorkers',
    });
  }

  /**
   * Add a RAG processing job to the queue
   */
  async addRagJob(taskId: string, batchSize: number): Promise<void> {
    const jobData: RagCronJobData = {
      taskId,
      batchSize,
    };

    await this.queueService.addJob(
      QUEUE_NAMES.RAG_PROCESSING,
      'process-rag-entities',
      jobData,
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      }
    );

    logger.info('RAG processing job added to queue', {
      context: 'RagCronProcessor.addRagJob',
      taskId,
      batchSize,
    });
  }

  /**
   * Process RAG job
   */
  private async processRagJob(job: Job<RagCronJobData>): Promise<void> {
    const { taskId, batchSize } = job.data;

    logger.info('Processing RAG job', {
      context: 'RagCronProcessor.processRagJob',
      jobId: job.id,
      taskId,
      batchSize,
    });

    try {
      // Start background processing task
      await this.ragCronService.startBackgroundProcessEntities(
        taskId,
        batchSize
      );

      logger.info('RAG job completed successfully', {
        context: 'RagCronProcessor.processRagJob',
        jobId: job.id,
        taskId,
      });
    } catch (error) {
      logger.error('Failed to process RAG job', {
        context: 'RagCronProcessor.processRagJob',
        jobId: job.id,
        taskId,
        batchSize,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
