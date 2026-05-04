import { Job } from 'bullmq';
import { singleton } from '@/shared/decorators/singleton';
import { logger } from '@/shared/utils/logger';
import { QueueService, QueueJobData, QUEUE_NAMES } from '../queue.service';
import { PrismaClient } from '@prisma/client';
import { OnboardingAssessmentService } from '@/services/candidate/onboarding.assessment.service';
import { ENV } from '@/config/env';

export interface OnboardingAssessmentInitializeJobData extends QueueJobData {
  assessmentId: string;
}

export interface OnboardingAssessmentSubmitJobData extends QueueJobData {
  assessmentId: string;
}

@singleton
export class OnboardingAssessmentProcessor {
  private readonly prisma: PrismaClient;
  private readonly queueService: QueueService;

  constructor(
    private readonly onboardingAssessmentService: OnboardingAssessmentService
  ) {
    this.prisma = new PrismaClient();
    this.queueService = new QueueService();
    logger.info('Onboarding assessment processor initialized', {
      context: 'OnboardingAssessmentProcessor.constructor',
    });
  }

  /**
   * Set up workers for processing onboarding assessment jobs
   */
  async setupWorkers(): Promise<void> {
    // Initialize worker
    this.queueService.createWorker(
      QUEUE_NAMES.ONBOARDING_ASSESSMENT_INITIALIZE,
      this.processInitializeJob.bind(this),
      {
        concurrency: ENV.BULLMQ_DASHBOARD_CONCURRENCY,
      }
    );

    // Submit worker
    this.queueService.createWorker(
      QUEUE_NAMES.ONBOARDING_ASSESSMENT_SUBMIT,
      this.processSubmitJob.bind(this),
      {
        concurrency: ENV.BULLMQ_DASHBOARD_CONCURRENCY,
      }
    );

    logger.info('Onboarding assessment workers initialized', {
      context: 'OnboardingAssessmentProcessor.setupWorkers',
    });
  }

  /**
   * Add an initialize job to the queue
   */
  async addInitializeJob(assessmentId: string): Promise<void> {
    const jobData: OnboardingAssessmentInitializeJobData = {
      assessmentId,
    };

    await this.queueService.addJob(
      QUEUE_NAMES.ONBOARDING_ASSESSMENT_INITIALIZE,
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
      context: 'OnboardingAssessmentProcessor.addInitializeJob',
      assessmentId,
    });
  }

  /**
   * Add a submit job to the queue
   */
  async addSubmitJob(assessmentId: string): Promise<void> {
    const jobData: OnboardingAssessmentSubmitJobData = {
      assessmentId,
    };

    await this.queueService.addJob(
      QUEUE_NAMES.ONBOARDING_ASSESSMENT_SUBMIT,
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
      context: 'OnboardingAssessmentProcessor.addSubmitJob',
      assessmentId,
    });
  }

  /**
   * Process initialize job
   */
  private async processInitializeJob(
    job: Job<OnboardingAssessmentInitializeJobData>
  ): Promise<void> {
    const { assessmentId } = job.data;

    logger.info('Processing initialize job', {
      context: 'OnboardingAssessmentProcessor.processInitializeJob',
      jobId: job.id,
      assessmentId,
    });

    try {
      //initialize job
      await this.onboardingAssessmentService.startBackgroundProcessInitializeTask(
        assessmentId
      );
    } catch (error) {
      logger.error('Failed to process initialize job', {
        context: 'OnboardingAssessmentProcessor.processInitializeJob',
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
    job: Job<OnboardingAssessmentSubmitJobData>
  ): Promise<void> {
    const { assessmentId } = job.data;

    logger.info('Processing submit job', {
      context: 'OnboardingAssessmentProcessor.processSubmitJob',
      jobId: job.id,
      assessmentId,
    });

    try {
      // Submit job
      await this.onboardingAssessmentService.startBackgroundProcessSubmitTask(
        assessmentId
      );
    } catch (error) {
      logger.error('Failed to process submit job', {
        context: 'OnboardingAssessmentProcessor.processSubmitJob',
        jobId: job.id,
        assessmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
