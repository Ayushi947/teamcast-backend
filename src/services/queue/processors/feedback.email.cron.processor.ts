import { Job } from 'bullmq';
import { singleton } from '@/shared/decorators/singleton';
import { logger } from '@/shared/utils/logger';
import { QueueService, QueueJobData, QUEUE_NAMES } from '../queue.service';
import { PrismaClient } from '@prisma/client';
import { ENV } from '@/config/env';
import { FeedbackEmailTaskType } from '@/shared/models/domain/cron/feedback.email.cron.domain';
import type { FeedbackEmailCronService } from '../../cron/feedback.email.cron.service';

export interface FeedbackEmailCronJobData extends QueueJobData {
  taskId: string;
  type: FeedbackEmailTaskType;
}

@singleton
export class FeedbackEmailCronProcessor {
  private readonly prisma: PrismaClient;
  private readonly queueService: QueueService;

  constructor(
    private readonly feedbackEmailCronService: FeedbackEmailCronService
  ) {
    this.prisma = new PrismaClient();
    this.queueService = new QueueService();
    logger.info('Feedback email cron processor initialized', {
      context: 'FeedbackEmailCronProcessor.constructor',
    });
  }

  /**
   * Set up workers for processing feedback email cron jobs
   */
  async setupWorkers(): Promise<void> {
    // Feedback email processing worker
    this.queueService.createWorker(
      QUEUE_NAMES.FEEDBACK_EMAIL_PROCESSING,
      this.processFeedbackEmailJob.bind(this),
      {
        concurrency: ENV.BULLMQ_DASHBOARD_CONCURRENCY,
      }
    );

    logger.info('Feedback email cron workers initialized', {
      context: 'FeedbackEmailCronProcessor.setupWorkers',
    });
  }

  /**
   * Add a feedback email job to the queue
   */
  async addFeedbackEmailJob(
    taskId: string,
    type: FeedbackEmailTaskType
  ): Promise<void> {
    try {
      const jobData: FeedbackEmailCronJobData = {
        taskId,
        type,
      };

      await this.queueService.addJob(
        QUEUE_NAMES.FEEDBACK_EMAIL_PROCESSING,
        `feedback-email-${type.toLowerCase()}-${taskId}`,
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

      logger.info('Feedback email job added to queue', {
        context: 'FeedbackEmailCronProcessor.addFeedbackEmailJob',
        taskId,
        type,
      });
    } catch (error) {
      logger.error('Failed to add feedback email job to queue', {
        context: 'FeedbackEmailCronProcessor.addFeedbackEmailJob',
        taskId,
        type,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Process feedback email job
   */
  private async processFeedbackEmailJob(
    job: Job<FeedbackEmailCronJobData>
  ): Promise<void> {
    const { taskId, type } = job.data;

    logger.info('Processing feedback email job', {
      context: 'FeedbackEmailCronProcessor.processFeedbackEmailJob',
      jobId: job.id,
      taskId,
      type,
    });

    try {
      // Process based on task type
      switch (type) {
        case FeedbackEmailTaskType.FEEDBACK_REQUEST:
          await this.feedbackEmailCronService.sendFeedbackRequestEmails(taskId);
          break;
        case FeedbackEmailTaskType.FEEDBACK_REMINDER:
          await this.feedbackEmailCronService.sendFeedbackReminderEmails(
            taskId
          );
          break;
        case FeedbackEmailTaskType.PANEL_ASSESSMENT_STATUS_UPDATE:
          await this.feedbackEmailCronService.updatePanelAssessmentStatuses(
            taskId
          );
          break;
        default:
          throw new Error(`Unknown feedback email task type: ${type}`);
      }

      logger.info('Feedback email job completed successfully', {
        context: 'FeedbackEmailCronProcessor.processFeedbackEmailJob',
        jobId: job.id,
        taskId,
        type,
      });
    } catch (error) {
      logger.error('Failed to process feedback email job', {
        context: 'FeedbackEmailCronProcessor.processFeedbackEmailJob',
        jobId: job.id,
        taskId,
        type,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
