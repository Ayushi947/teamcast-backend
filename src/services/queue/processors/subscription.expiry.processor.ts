import { Job } from 'bullmq';
import { singleton } from '@/shared/decorators/singleton';
import { logger } from '@/shared/utils/logger';
import { QueueService, QueueJobData, QUEUE_NAMES } from '../queue.service';
import { PrismaClient } from '@prisma/client';
import { ENV } from '@/config/env';
import { SubscriptionExpiryTaskType } from '@/shared/models/domain/cron/subscription.expiry.cron.domain';
import { SubscriptionExpiryCronService } from '@/services/cron/subscription.expiry.cron.service';

export interface SubscriptionExpiryJobData extends QueueJobData {
  taskId: string;
  type: SubscriptionExpiryTaskType;
}

@singleton
export class SubscriptionExpiryProcessor {
  private readonly prisma: PrismaClient;
  private readonly queueService: QueueService;

  constructor(
    private readonly subscriptionExpiryCronService: SubscriptionExpiryCronService
  ) {
    this.prisma = new PrismaClient();
    this.queueService = new QueueService();
    logger.info('Subscription expiry processor initialized', {
      context: 'SubscriptionExpiryProcessor.constructor',
    });
  }

  /**
   * Set up workers for processing subscription expiry cron jobs
   */
  async setupWorkers(): Promise<void> {
    // Subscription expiry processing worker
    this.queueService.createWorker(
      QUEUE_NAMES.SUBSCRIPTION_EXPIRY_PROCESSING,
      this.processSubscriptionExpiryJob.bind(this),
      {
        concurrency: ENV.BULLMQ_DASHBOARD_CONCURRENCY,
      }
    );

    logger.info('Subscription expiry workers initialized', {
      context: 'SubscriptionExpiryProcessor.setupWorkers',
    });
  }

  /**
   * Add a subscription expiry job to the queue
   */
  async addSubscriptionExpiryJob(
    taskId: string,
    type: SubscriptionExpiryTaskType
  ): Promise<void> {
    try {
      const jobData: SubscriptionExpiryJobData = {
        taskId,
        type,
      };

      await this.queueService.addJob(
        QUEUE_NAMES.SUBSCRIPTION_EXPIRY_PROCESSING,
        `subscription-expiry-${type.toLowerCase()}-${taskId}`,
        jobData,
        {
          delay: 0,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        }
      );

      logger.info('Subscription expiry job added to queue', {
        context: 'SubscriptionExpiryProcessor.addSubscriptionExpiryJob',
        taskId,
        type,
      });
    } catch (error) {
      logger.error('Failed to add subscription expiry job to queue', {
        context: 'SubscriptionExpiryProcessor.addSubscriptionExpiryJob',
        taskId,
        type,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Process subscription expiry job
   */
  private async processSubscriptionExpiryJob(
    job: Job<SubscriptionExpiryJobData>
  ): Promise<void> {
    const { taskId, type } = job.data;

    logger.info('Processing subscription expiry job', {
      context: 'SubscriptionExpiryProcessor.processSubscriptionExpiryJob',
      jobId: job.id,
      taskId,
      type,
    });

    try {
      // Process based on task type
      switch (type) {
        case SubscriptionExpiryTaskType.CLIENT_SUBSCRIPTION_EXPIRY:
          await this.subscriptionExpiryCronService.processClientSubscriptionExpiry(
            taskId
          );
          break;
        case SubscriptionExpiryTaskType.CANDIDATE_SUBSCRIPTION_EXPIRY:
          await this.subscriptionExpiryCronService.processCandidateSubscriptionExpiry(
            taskId
          );
          break;
        default:
          throw new Error(`Unknown subscription expiry task type: ${type}`);
      }

      logger.info('Subscription expiry job completed successfully', {
        context: 'SubscriptionExpiryProcessor.processSubscriptionExpiryJob',
        jobId: job.id,
        taskId,
        type,
      });
    } catch (error) {
      logger.error('Failed to process subscription expiry job', {
        context: 'SubscriptionExpiryProcessor.processSubscriptionExpiryJob',
        jobId: job.id,
        taskId,
        type,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
