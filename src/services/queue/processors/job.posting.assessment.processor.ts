import { Job } from 'bullmq';
import { singleton } from '@/shared/decorators/singleton';
import { logger } from '@/shared/utils/logger';
import { QueueService, QueueJobData, QUEUE_NAMES } from '../queue.service';
import { PrismaClient } from '@prisma/client';
import { ClientJobPostingAssessmentService } from '@/services/client/job.posting.assessment.service';
import { ENV } from '@/config/env';

export interface JobPostingAssessmentJobData extends QueueJobData {
  taskId: string;
  jobPostingId: string;
}

@singleton
export class JobPostingAssessmentProcessor {
  private readonly prisma: PrismaClient;
  private readonly queueService: QueueService;

  constructor(
    private readonly clientJobPostingAssessmentService: ClientJobPostingAssessmentService
  ) {
    this.prisma = new PrismaClient();
    this.queueService = new QueueService();
    logger.info('Job posting assessment processor initialized', {
      context: 'JobPostingAssessmentProcessor.constructor',
    });
  }

  /**
   * Set up workers for processing job posting assessment jobs
   */
  async setupWorkers(): Promise<void> {
    // Assessment worker
    this.queueService.createWorker(
      QUEUE_NAMES.JOB_POSTING_ASSESSMENT,
      this.processAssessmentJob.bind(this),
      {
        concurrency: ENV.BULLMQ_DASHBOARD_CONCURRENCY,
      }
    );

    logger.info('Job posting assessment workers initialized', {
      context: 'JobPostingAssessmentProcessor.setupWorkers',
    });
  }

  /**
   * Add an assessment job to the queue
   */
  async addAssessmentJob(taskId: string, jobPostingId: string): Promise<void> {
    const jobData: JobPostingAssessmentJobData = {
      taskId,
      jobPostingId,
    };

    await this.queueService.addJob(
      QUEUE_NAMES.JOB_POSTING_ASSESSMENT,
      'assess-job-posting',
      jobData,
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      }
    );

    logger.info('Job posting assessment job added to queue', {
      context: 'JobPostingAssessmentProcessor.addAssessmentJob',
      taskId,
      jobPostingId,
    });
  }

  /**
   * Process assessment job
   */
  private async processAssessmentJob(
    job: Job<JobPostingAssessmentJobData>
  ): Promise<void> {
    const { taskId, jobPostingId } = job.data;

    logger.info('Processing job posting assessment job', {
      context: 'JobPostingAssessmentProcessor.processAssessmentJob',
      jobId: job.id,
      taskId,
      jobPostingId,
    });

    try {
      // Start background assessment task
      await this.clientJobPostingAssessmentService.startBackgroundProcessAssessment(
        taskId,
        jobPostingId
      );

      logger.info('Job posting assessment job completed successfully', {
        context: 'JobPostingAssessmentProcessor.processAssessmentJob',
        jobId: job.id,
        taskId,
        jobPostingId,
      });
    } catch (error) {
      logger.error('Failed to process job posting assessment job', {
        context: 'JobPostingAssessmentProcessor.processAssessmentJob',
        jobId: job.id,
        taskId,
        jobPostingId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
