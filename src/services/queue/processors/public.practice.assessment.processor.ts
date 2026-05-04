import { Job } from 'bullmq';
import { singleton } from '@/shared/decorators/singleton';
import { logger } from '@/shared/utils/logger';
import { QueueService, QueueJobData, QUEUE_NAMES } from '../queue.service';
import { ENV } from '@/config/env';
import { PublicPracticeAssessmentService } from '@/services/candidate/public.practice.assessment.service';

export interface PublicPracticeAssessmentInitializeJobData
  extends QueueJobData {
  assessmentId: string;
}

export interface PublicPracticeAssessmentSubmitJobData extends QueueJobData {
  assessmentId: string;
}

@singleton
export class PublicPracticeAssessmentProcessor {
  private readonly queueService: QueueService;

  constructor(
    private readonly publicPracticeAssessmentService: PublicPracticeAssessmentService
  ) {
    this.queueService = new QueueService();
    logger.info('Public practice assessment processor initialized', {
      context: 'PublicPracticeAssessmentProcessor.constructor',
    });
  }

  /**
   * Set up workers for processing public practice assessment jobs
   */
  async setupWorkers(): Promise<void> {
    // Initialize worker
    this.queueService.createWorker(
      QUEUE_NAMES.PUBLIC_PRACTICE_ASSESSMENT_INITIALIZE,
      this.processInitializeJob.bind(this),
      {
        concurrency: ENV.BULLMQ_DASHBOARD_CONCURRENCY,
      }
    );

    // Submit worker
    this.queueService.createWorker(
      QUEUE_NAMES.PUBLIC_PRACTICE_ASSESSMENT_SUBMIT,
      this.processSubmitJob.bind(this),
      {
        concurrency: ENV.BULLMQ_DASHBOARD_CONCURRENCY,
      }
    );

    logger.info('Public practice assessment workers initialized', {
      context: 'PublicPracticeAssessmentProcessor.setupWorkers',
    });
  }

  /**
   * Add an initialize job to the queue
   */
  async addInitializeJob(assessmentId: string): Promise<void> {
    const jobData: PublicPracticeAssessmentInitializeJobData = {
      assessmentId,
    };

    await this.queueService.addJob(
      QUEUE_NAMES.PUBLIC_PRACTICE_ASSESSMENT_INITIALIZE,
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
      context: 'PublicPracticeAssessmentProcessor.addInitializeJob',
      assessmentId,
    });
  }

  /**
   * Add a submit job to the queue
   */
  async addSubmitJob(assessmentId: string): Promise<void> {
    const jobData: PublicPracticeAssessmentSubmitJobData = {
      assessmentId,
    };

    await this.queueService.addJob(
      QUEUE_NAMES.PUBLIC_PRACTICE_ASSESSMENT_SUBMIT,
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
      context: 'PublicPracticeAssessmentProcessor.addSubmitJob',
      assessmentId,
    });
  }

  /**
   * Process initialize job
   */
  private async processInitializeJob(
    job: Job<PublicPracticeAssessmentInitializeJobData>
  ): Promise<void> {
    const { assessmentId } = job.data;

    logger.info('Processing initialize job', {
      context: 'PublicPracticeAssessmentProcessor.processInitializeJob',
      jobId: job.id,
      assessmentId,
    });

    try {
      // Initialize job
      await this.publicPracticeAssessmentService.startBackgroundProcessInitializeTask(
        assessmentId
      );
    } catch (error) {
      logger.error('Failed to process initialize job', {
        context: 'PublicPracticeAssessmentProcessor.processInitializeJob',
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
    job: Job<PublicPracticeAssessmentSubmitJobData>
  ): Promise<void> {
    const { assessmentId } = job.data;

    logger.info('Processing submit job', {
      context: 'PublicPracticeAssessmentProcessor.processSubmitJob',
      jobId: job.id,
      assessmentId,
    });

    try {
      // Submit job
      await this.publicPracticeAssessmentService.startBackgroundProcessSubmitTask(
        assessmentId
      );
    } catch (error) {
      logger.error('Failed to process submit job', {
        context: 'PublicPracticeAssessmentProcessor.processSubmitJob',
        jobId: job.id,
        assessmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
