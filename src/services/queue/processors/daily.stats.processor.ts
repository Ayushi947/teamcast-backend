import { Job } from 'bullmq';
import { logger } from '@/shared/utils/logger';
import { DailyStatsCronTaskStatus } from '@/shared/models/domain/cron/daily.stats.domain';
import { QueueService } from '../queue.service';
import { DailyStatsCronService } from '@/services/cron/daily.stats.cron.service';

export class DailyStatsProcessor {
  private readonly queueService: QueueService;
  private readonly dailyStatsService: DailyStatsCronService;

  constructor(dailyStatsService: DailyStatsCronService) {
    this.queueService = new QueueService();
    this.dailyStatsService = dailyStatsService;
  }

  async addDailyStatsJob(taskId: string): Promise<void> {
    try {
      await this.queueService.addJob(
        'daily-stats-processing',
        'process-daily-stats',
        {
          taskId,
          timestamp: new Date().toISOString(),
        }
      );

      logger.info('Daily stats job added to queue', {
        context: 'DailyStatsProcessor.addDailyStatsJob',
        taskId,
      });
    } catch (error) {
      logger.error('Failed to add daily stats job to queue', {
        context: 'DailyStatsProcessor.addDailyStatsJob',
        error,
        taskId,
      });
      throw error;
    }
  }

  async processDailyStatsJob(job: Job): Promise<void> {
    const { taskId } = job.data as { taskId: string };

    try {
      logger.info('Processing daily stats job', {
        context: 'DailyStatsProcessor.processDailyStatsJob',
        jobId: job.id,
        taskId,
      });

      // Update task status to in progress
      await this.dailyStatsService.updateTaskStatus(
        taskId,
        DailyStatsCronTaskStatus.IN_PROGRESS
      );

      // Process candidate and client stats
      const [candidateStats, clientStats] = await Promise.all([
        this.dailyStatsService.processCandidateStats(),
        this.dailyStatsService.processClientStats(),
      ]);

      // Send daily stats emails
      await this.dailyStatsService.sendDailyStatsEmails(
        candidateStats,
        clientStats
      );

      // Complete the task
      await this.dailyStatsService.completeDailyStatsTask(
        taskId,
        candidateStats,
        clientStats
      );

      logger.info('Daily stats job completed successfully', {
        context: 'DailyStatsProcessor.processDailyStatsJob',
        jobId: job.id,
        taskId,
      });
    } catch (error) {
      logger.error('Daily stats job failed', {
        context: 'DailyStatsProcessor.processDailyStatsJob',
        jobId: job.id,
        taskId,
        error,
      });

      // Mark task as failed
      await this.dailyStatsService.failDailyStatsTask(
        taskId,
        error instanceof Error ? error.message : 'Unknown error'
      );

      throw error;
    }
  }

  setupWorkers(): void {
    try {
      this.queueService.createWorker(
        'daily-stats-processing',
        async (job: Job) => {
          await this.processDailyStatsJob(job);
        },
        { concurrency: 1 }
      );

      logger.info('Daily stats processor workers setup completed', {
        context: 'DailyStatsProcessor.setupWorkers',
      });
    } catch (error) {
      logger.error('Failed to setup daily stats processor workers', {
        context: 'DailyStatsProcessor.setupWorkers',
        error,
      });
      throw error;
    }
  }
}
