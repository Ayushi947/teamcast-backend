import { Job } from 'bullmq';
import { singleton } from '@/shared/decorators/singleton';
import { logger } from '@/shared/utils/logger';
import { QueueService, QueueJobData, QUEUE_NAMES } from '../queue.service';
import { PrismaClient } from '@prisma/client';
import { JobAiAssessmentService } from '@/services/candidate/job.ai.assessment.service';
import { ENV } from '@/config/env';

export interface JobAiAssessmentInitializeJobData extends QueueJobData {
  assessmentId: string;
}

export interface JobAiAssessmentSubmitJobData extends QueueJobData {
  assessmentId: string;
}

@singleton
export class JobAiAssessmentProcessor {
  private readonly prisma: PrismaClient;
  private readonly queueService: QueueService;

  constructor(private readonly jobAiAssessmentService: JobAiAssessmentService) {
    this.prisma = new PrismaClient();
    this.queueService = new QueueService();
    logger.info('Job AI assessment processor initialized', {
      context: 'JobAiAssessmentProcessor.constructor',
    });
  }

  /**
   * Set up workers for processing job AI assessment jobs
   */
  async setupWorkers(): Promise<void> {
    // Initialize worker
    this.queueService.createWorker(
      QUEUE_NAMES.JOB_AI_ASSESSMENT_INITIALIZE,
      this.processInitializeJob.bind(this),
      {
        concurrency: ENV.BULLMQ_DASHBOARD_CONCURRENCY,
      }
    );

    // Submit worker
    this.queueService.createWorker(
      QUEUE_NAMES.JOB_AI_ASSESSMENT_SUBMIT,
      this.processSubmitJob.bind(this),
      {
        concurrency: ENV.BULLMQ_DASHBOARD_CONCURRENCY,
      }
    );

    logger.info('Job AI assessment workers initialized', {
      context: 'JobAiAssessmentProcessor.setupWorkers',
    });
  }

  /**
   * Add an initialize job to the queue
   */
  async addInitializeJob(assessmentId: string): Promise<void> {
    const jobData: JobAiAssessmentInitializeJobData = {
      assessmentId,
    };

    await this.queueService.addJob(
      QUEUE_NAMES.JOB_AI_ASSESSMENT_INITIALIZE,
      'initialize-assessment',
      jobData,
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      }
    );

    logger.info('Initialize job added to queue', {
      context: 'JobAiAssessmentProcessor.addInitializeJob',
      assessmentId,
    });
  }

  /**
   * Add a submit job to the queue
   */
  async addSubmitJob(assessmentId: string): Promise<void> {
    const jobData: JobAiAssessmentSubmitJobData = {
      assessmentId,
    };

    await this.queueService.addJob(
      QUEUE_NAMES.JOB_AI_ASSESSMENT_SUBMIT,
      'submit-assessment',
      jobData,
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      }
    );

    logger.info('Submit job added to queue', {
      context: 'JobAiAssessmentProcessor.addSubmitJob',
      assessmentId,
    });
  }

  /**
   * Process initialize job
   */
  private async processInitializeJob(
    job: Job<JobAiAssessmentInitializeJobData>
  ): Promise<void> {
    const { assessmentId } = job.data;

    logger.info('Processing initialize job', {
      context: 'JobAiAssessmentProcessor.processInitializeJob',
      jobId: job.id,
      assessmentId,
    });

    try {
      // Initialize job
      await this.jobAiAssessmentService.startBackgroundProcessInitializeTask(
        assessmentId
      );
    } catch (error) {
      logger.error('Failed to process initialize job', {
        context: 'JobAiAssessmentProcessor.processInitializeJob',
        jobId: job.id,
        assessmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Process submit job
   */
  private async processSubmitJob(
    job: Job<JobAiAssessmentSubmitJobData>
  ): Promise<void> {
    const { assessmentId } = job.data;

    logger.info('Processing submit job', {
      context: 'JobAiAssessmentProcessor.processSubmitJob',
      jobId: job.id,
      assessmentId,
    });

    try {
      // Submit job
      await this.jobAiAssessmentService.startBackgroundProcessSubmitTask(
        assessmentId
      );
    } catch (error) {
      logger.error('Failed to process submit job', {
        context: 'JobAiAssessmentProcessor.processSubmitJob',
        jobId: job.id,
        assessmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
