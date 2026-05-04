import { Job } from 'bullmq';
import { logger } from '@/shared/utils/logger';
import { DailyDigestCronTaskStatus } from '@/shared/models/domain/cron/daily.digest.domain';
import { QueueService } from '../queue.service';
import { DailyDigestCronService } from '@/services/cron/daily.digest.cron.service';

export class DailyDigestProcessor {
  private readonly queueService: QueueService;
  private readonly dailyDigestService: DailyDigestCronService;

  constructor(dailyDigestService: DailyDigestCronService) {
    this.queueService = new QueueService();
    this.dailyDigestService = dailyDigestService;
  }

  async addDailyDigestJob(taskId: string): Promise<void> {
    try {
      await this.queueService.addJob(
        'daily-digest-processing',
        'process-daily-digest',
        {
          taskId,
          timestamp: new Date().toISOString(),
        }
      );

      logger.info('Daily digest job added to queue', {
        context: 'DailyDigestProcessor.addDailyDigestJob',
        taskId,
      });
    } catch (error) {
      logger.error('Failed to add daily digest job to queue', {
        context: 'DailyDigestProcessor.addDailyDigestJob',
        error,
        taskId,
      });
      throw error;
    }
  }

  async processDailyDigestJob(job: Job): Promise<void> {
    const { taskId } = job.data as { taskId: string };

    try {
      logger.info('Processing daily digest job', {
        context: 'DailyDigestProcessor.processDailyDigestJob',
        jobId: job.id,
        taskId,
      });

      // Update task status to in progress
      await this.dailyDigestService.updateTaskStatus(
        taskId,
        DailyDigestCronTaskStatus.IN_PROGRESS
      );

      // Process daily digest for all clients
      const digestData = await this.dailyDigestService.processDailyDigest();

      // Send daily digest emails
      await this.dailyDigestService.sendDailyDigestEmails(digestData);

      // Complete the task
      await this.dailyDigestService.completeDailyDigestTask(taskId, digestData);

      logger.info('Daily digest job completed successfully', {
        context: 'DailyDigestProcessor.processDailyDigestJob',
        jobId: job.id,
        taskId,
        totalClients: digestData.length,
      });
    } catch (error) {
      logger.error('Daily digest job failed', {
        context: 'DailyDigestProcessor.processDailyDigestJob',
        jobId: job.id,
        taskId,
        error,
      });

      // Mark task as failed
      await this.dailyDigestService.failDailyDigestTask(
        taskId,
        error instanceof Error ? error.message : 'Unknown error'
      );

      throw error;
    }
  }

  setupWorkers(): void {
    try {
      this.queueService.createWorker(
        'daily-digest-processing',
        async (job: Job) => {
          await this.processDailyDigestJob(job);
        },
        { concurrency: 1 }
      );

      logger.info('Daily digest processor workers setup completed', {
        context: 'DailyDigestProcessor.setupWorkers',
      });
    } catch (error) {
      logger.error('Failed to setup daily digest processor workers', {
        context: 'DailyDigestProcessor.setupWorkers',
        error,
      });
      throw error;
    }
  }
}
