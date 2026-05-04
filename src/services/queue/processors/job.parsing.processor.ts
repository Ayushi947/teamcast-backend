import { Job } from 'bullmq';
import { singleton } from '@/shared/decorators/singleton';
import { logger } from '@/shared/utils/logger';
import { QueueService, QueueJobData, QUEUE_NAMES } from '../queue.service';
import { PrismaClient } from '@prisma/client';
import { ClientJobParsingService } from '@/services/client/job.parsing.service';
import { ENV } from '@/config/env';
import { JobParsingMode } from '@/shared/models/domain/client/job.parsing.domain';

export interface JobParsingJobData extends QueueJobData {
  taskId: string;
  jobUrl: string;
  mode: JobParsingMode;
  isPublic?: boolean;
}

@singleton
export class JobParsingProcessor {
  private readonly prisma: PrismaClient;
  private readonly queueService: QueueService;

  constructor(
    private readonly clientJobParsingService: ClientJobParsingService
  ) {
    this.prisma = new PrismaClient();
    this.queueService = new QueueService();
    logger.info('Job parsing processor initialized', {
      context: 'JobParsingProcessor.constructor',
    });
  }

  /**
   * Set up workers for processing job parsing jobs
   */
  async setupWorkers(): Promise<void> {
    // Parse worker
    this.queueService.createWorker(
      QUEUE_NAMES.JOB_PARSING,
      this.processParsingJob.bind(this),
      {
        concurrency: ENV.BULLMQ_DASHBOARD_CONCURRENCY,
      }
    );

    logger.info('Job parsing workers initialized', {
      context: 'JobParsingProcessor.setupWorkers',
    });
  }

  /**
   * Add a parsing job to the queue
   */
  async addParsingJob(
    taskId: string,
    jobUrl: string,
    mode: JobParsingMode
  ): Promise<void> {
    const jobData: JobParsingJobData = {
      taskId,
      jobUrl,
      mode,
      isPublic: false,
    };

    await this.queueService.addJob(
      QUEUE_NAMES.JOB_PARSING,
      'parse-job',
      jobData,
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      }
    );

    logger.info('Job parsing job added to queue', {
      context: 'JobParsingProcessor.addParsingJob',
      taskId,
      jobUrl,
      mode,
    });
  }

  /**
   * Add a public parsing job to the queue
   */
  async addPublicParsingJob(
    taskId: string,
    jobUrl: string,
    mode: JobParsingMode
  ): Promise<void> {
    const jobData: JobParsingJobData = {
      taskId,
      jobUrl,
      mode,
      isPublic: true,
    };

    await this.queueService.addJob(
      QUEUE_NAMES.JOB_PARSING,
      'parse-job-public',
      jobData,
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      }
    );

    logger.info('Public job parsing job added to queue', {
      context: 'JobParsingProcessor.addPublicParsingJob',
      taskId,
      jobUrl,
      mode,
    });
  }

  /**
   * Process parsing job
   */
  private async processParsingJob(job: Job<JobParsingJobData>): Promise<void> {
    const { taskId, jobUrl, mode, isPublic } = job.data;

    logger.info('Processing job parsing job', {
      context: 'JobParsingProcessor.processParsingJob',
      jobId: job.id,
      taskId,
      jobUrl,
      mode,
      isPublic,
    });

    try {
      if (isPublic) {
        // Start background parsing task for public parsing
        await this.clientJobParsingService.backgroundParseJobDescriptionPublic(
          taskId,
          jobUrl,
          mode
        );
      } else {
        // Start background parsing task for regular parsing
        await this.clientJobParsingService.startBackgroundParseJobDescription(
          taskId,
          jobUrl,
          mode
        );
      }

      logger.info('Job parsing job completed successfully', {
        context: 'JobParsingProcessor.processParsingJob',
        jobId: job.id,
        taskId,
        isPublic,
      });
    } catch (error) {
      logger.error('Failed to process job parsing job', {
        context: 'JobParsingProcessor.processParsingJob',
        jobId: job.id,
        taskId,
        jobUrl,
        mode,
        isPublic,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
