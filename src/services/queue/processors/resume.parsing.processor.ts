import { Job } from 'bullmq';
import { singleton } from '@/shared/decorators/singleton';
import { logger } from '@/shared/utils/logger';
import { QueueService, QueueJobData, QUEUE_NAMES } from '../queue.service';
import { PrismaClient } from '@prisma/client';
import { CandidateResumeParsingService } from '@/services/candidate/resume.parsing.service';
import { ENV } from '@/config/env';
import { ResumeParsingMode } from '@/shared/models/domain/candidate/resume.parsing.domain';

export interface ResumeParsingJobData extends QueueJobData {
  taskId: string;
  resumeUrl: string;
  mode: ResumeParsingMode;
  isPublic?: boolean;
}

@singleton
export class ResumeParsingProcessor {
  private readonly prisma: PrismaClient;
  private readonly queueService: QueueService;

  constructor(
    private readonly candidateResumeParsingService: CandidateResumeParsingService
  ) {
    this.prisma = new PrismaClient();
    this.queueService = new QueueService();
    logger.info('Resume parsing processor initialized', {
      context: 'ResumeParsingProcessor.constructor',
    });
  }

  /**
   * Set up workers for processing resume parsing jobs
   */
  async setupWorkers(): Promise<void> {
    // Parse worker
    this.queueService.createWorker(
      QUEUE_NAMES.RESUME_PARSING,
      this.processParsingJob.bind(this),
      {
        concurrency: ENV.BULLMQ_DASHBOARD_CONCURRENCY,
      }
    );

    logger.info('Resume parsing workers initialized', {
      context: 'ResumeParsingProcessor.setupWorkers',
    });
  }

  /**
   * Add a parsing job to the queue
   */
  async addParsingJob(
    taskId: string,
    resumeUrl: string,
    mode: ResumeParsingMode
  ): Promise<void> {
    const jobData: ResumeParsingJobData = {
      taskId,
      resumeUrl,
      mode,
      isPublic: false,
    };

    await this.queueService.addJob(
      QUEUE_NAMES.RESUME_PARSING,
      'parse-resume',
      jobData,
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      }
    );

    logger.info('Resume parsing job added to queue', {
      context: 'ResumeParsingProcessor.addParsingJob',
      taskId,
      resumeUrl,
      mode,
    });
  }

  /**
   * Add a public parsing job to the queue
   */
  async addPublicParsingJob(
    taskId: string,
    resumeUrl: string,
    mode: ResumeParsingMode
  ): Promise<void> {
    const jobData: ResumeParsingJobData = {
      taskId,
      resumeUrl,
      mode,
      isPublic: true,
    };

    await this.queueService.addJob(
      QUEUE_NAMES.RESUME_PARSING,
      'parse-resume-public',
      jobData,
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      }
    );

    logger.info('Public resume parsing job added to queue', {
      context: 'ResumeParsingProcessor.addPublicParsingJob',
      taskId,
      resumeUrl,
      mode,
    });
  }

  /**
   * Process parsing job
   */
  private async processParsingJob(
    job: Job<ResumeParsingJobData>
  ): Promise<void> {
    const { taskId, resumeUrl, mode, isPublic } = job.data;

    logger.info('Processing resume parsing job', {
      context: 'ResumeParsingProcessor.processParsingJob',
      jobId: job.id,
      taskId,
      resumeUrl,
      mode,
      isPublic,
    });

    try {
      if (isPublic) {
        // Start background parsing task for public parsing
        await this.candidateResumeParsingService.backgroundParseResumePublic(
          taskId,
          resumeUrl,
          mode
        );
      } else {
        // Start background parsing task for regular parsing
        await this.candidateResumeParsingService.startBackgroundParseResume(
          taskId,
          resumeUrl,
          mode
        );
      }

      logger.info('Resume parsing job completed successfully', {
        context: 'ResumeParsingProcessor.processParsingJob',
        jobId: job.id,
        taskId,
        isPublic,
      });
    } catch (error) {
      logger.error('Failed to process resume parsing job', {
        context: 'ResumeParsingProcessor.processParsingJob',
        jobId: job.id,
        taskId,
        resumeUrl,
        mode,
        isPublic,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
