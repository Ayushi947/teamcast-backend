import { singleton } from '@/shared/decorators/singleton';
import { logger } from '@/shared/utils/logger';
import { OnboardingAssessmentService } from '@/services/candidate/onboarding.assessment.service';
import { JobAiAssessmentService } from '@/services/candidate/job.ai.assessment.service';
import { OnboardingAssessmentProcessor } from './processors/onboarding.assessment.processor';
import { JobAiAssessmentProcessor } from './processors/job.ai.assessment.processor';
import { OnboardingAssessmentFactory } from '@/services/helpers/ai.onboarding.assessment/onboarding.assessment.factory';
import { JobAiAssessmentFactory } from '@/services/helpers/job.ai.assessment/job.ai.assessment.factory';
import { StorageFactory } from '@/services/helpers/storage/storage.factory';

/**
 * Worker Initializer Service
 *
 * Responsible for setting up all BullMQ workers when the application starts.
 * This ensures that background jobs are processed properly.
 */
@singleton
export class WorkerInitializer {
  private static instance: WorkerInitializer;
  private initialized = false;

  /**
   * Initialize all workers for background job processing
   */
  async initializeWorkers(): Promise<void> {
    if (this.initialized) {
      logger.warn('Workers already initialized', {
        context: 'WorkerInitializer.initializeWorkers',
      });
      return;
    }

    logger.info('Initializing BullMQ workers...', {
      context: 'WorkerInitializer.initializeWorkers',
    });

    try {
      // Initialize Onboarding Assessment Workers
      await this.initializeOnboardingAssessmentWorkers();

      // Initialize Job AI Assessment Workers
      await this.initializeJobAiAssessmentWorkers();

      // TODO: Initialize other workers as needed
      // - Resume parsing workers
      // - Job parsing workers
      // - Recommendation workers
      // - etc.

      this.initialized = true;

      logger.info('✅ All BullMQ workers initialized successfully', {
        context: 'WorkerInitializer.initializeWorkers',
      });
    } catch (error) {
      logger.error('Failed to initialize workers', {
        context: 'WorkerInitializer.initializeWorkers',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Initialize Onboarding Assessment workers
   */
  private async initializeOnboardingAssessmentWorkers(): Promise<void> {
    try {
      const onboardingProvider =
        OnboardingAssessmentFactory.getInstance().getProvider();
      const storageProvider = StorageFactory.getInstance().getProvider();
      const onboardingAssessmentService = new OnboardingAssessmentService(
        onboardingProvider,
        storageProvider
      );

      const onboardingProcessor = new OnboardingAssessmentProcessor(
        onboardingAssessmentService
      );

      await onboardingProcessor.setupWorkers();

      logger.info('Onboarding assessment workers initialized', {
        context: 'WorkerInitializer.initializeOnboardingAssessmentWorkers',
      });
    } catch (error) {
      logger.error('Failed to initialize onboarding assessment workers', {
        context: 'WorkerInitializer.initializeOnboardingAssessmentWorkers',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Initialize Job AI Assessment workers
   */
  private async initializeJobAiAssessmentWorkers(): Promise<void> {
    try {
      const jobAiProvider = JobAiAssessmentFactory.getInstance().getProvider();
      const storageProvider = StorageFactory.getInstance().getProvider();
      const jobAiAssessmentService = new JobAiAssessmentService(
        jobAiProvider,
        storageProvider
      );

      const jobAiProcessor = new JobAiAssessmentProcessor(
        jobAiAssessmentService
      );

      await jobAiProcessor.setupWorkers();

      logger.info('Job AI assessment workers initialized', {
        context: 'WorkerInitializer.initializeJobAiAssessmentWorkers',
      });
    } catch (error) {
      logger.error('Failed to initialize job AI assessment workers', {
        context: 'WorkerInitializer.initializeJobAiAssessmentWorkers',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Gracefully shutdown all workers
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down BullMQ workers...', {
      context: 'WorkerInitializer.shutdown',
    });

    // TODO: Implement graceful shutdown for all workers
    // This should close all worker connections properly

    this.initialized = false;

    logger.info('BullMQ workers shut down', {
      context: 'WorkerInitializer.shutdown',
    });
  }
}
