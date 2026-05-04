import { Job } from 'bullmq';
import { singleton } from '@/shared/decorators/singleton';
import { logger } from '@/shared/utils/logger';
import { QueueService, QueueJobData, QUEUE_NAMES } from '../queue.service';
import { CandidateRecommendationCronService } from '@/services/cron/candidate.recommendation.cron.service';
import { ENV } from '@/config/env';

export interface CandidateRecommendationJobData extends QueueJobData {
  taskId: string;
  batchSize: number;
}

export interface CandidateInitialRecommendationJobData {
  candidateId: string;
  limit: number;
}

@singleton
export class CandidateRecommendationProcessor {
  private readonly queueService: QueueService;

  constructor(
    private readonly candidateRecommendationCronService: CandidateRecommendationCronService
  ) {
    this.queueService = new QueueService();
    logger.info('Candidate recommendation processor initialized', {
      context: 'CandidateRecommendationProcessor.constructor',
    });
  }

  /**
   * Set up workers for processing candidate recommendation jobs
   */
  async setupWorkers(): Promise<void> {
    // Candidate recommendation processing worker
    this.queueService.createWorker(
      QUEUE_NAMES.CANDIDATE_RECOMMENDATION_PROCESSING,
      this.processCandidateRecommendationJob.bind(this),
      {
        concurrency: ENV.BULLMQ_DASHBOARD_CONCURRENCY,
      }
    );

    // Initial recommendations worker
    this.queueService.createWorker(
      QUEUE_NAMES.CANDIDATE_RECOMMENDATION_PROCESSING_INITIAL,
      this.processInitialRecommendationsJob.bind(this),
      {
        concurrency: ENV.BULLMQ_DASHBOARD_CONCURRENCY,
      }
    );

    logger.info('Candidate recommendation workers initialized', {
      context: 'CandidateRecommendationProcessor.setupWorkers',
    });
  }

  /**
   * Add a candidate recommendation job to the queue
   */
  async addCandidateRecommendationJob(
    taskId: string,
    batchSize: number
  ): Promise<void> {
    const queue = this.queueService.getQueue(
      QUEUE_NAMES.CANDIDATE_RECOMMENDATION_PROCESSING
    );

    const jobData: CandidateRecommendationJobData = {
      taskId,
      batchSize,
    };

    await queue.add('process-candidate-recommendations', jobData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });

    logger.info('Candidate recommendation job added to queue', {
      context: 'CandidateRecommendationProcessor.addCandidateRecommendationJob',
      taskId,
      batchSize,
    });
  }

  /**
   * Add a job to find initial recommendations for a candidate
   */
  async addFindInitialRecommendationsJob(
    candidateId: string,
    limit: number = 50
  ): Promise<void> {
    const queue = this.queueService.getQueue(
      QUEUE_NAMES.CANDIDATE_RECOMMENDATION_PROCESSING_INITIAL
    );

    const jobData: CandidateInitialRecommendationJobData = {
      candidateId,
      limit,
    };

    await queue.add('find-initial-recommendations', jobData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      delay: 5000, // Delay 5 seconds to allow candidate profile to be fully processed
    });

    logger.info('Initial recommendations job added to queue', {
      context:
        'CandidateRecommendationProcessor.addFindInitialRecommendationsJob',
      candidateId,
      limit,
    });
  }

  /**
   * Process candidate recommendation job
   */
  private async processCandidateRecommendationJob(
    job: Job<CandidateRecommendationJobData>
  ): Promise<void> {
    const { taskId, batchSize } = job.data;

    logger.info('Processing candidate recommendation job', {
      context:
        'CandidateRecommendationProcessor.processCandidateRecommendationJob',
      jobId: job.id,
      taskId,
      batchSize,
    });

    try {
      // Start background processing task
      await this.candidateRecommendationCronService.startBackgroundProcessCandidates(
        taskId,
        batchSize
      );

      logger.info('Candidate recommendation job completed successfully', {
        context:
          'CandidateRecommendationProcessor.processCandidateRecommendationJob',
        jobId: job.id,
        taskId,
      });
    } catch (error) {
      logger.error('Failed to process candidate recommendation job', {
        context:
          'CandidateRecommendationProcessor.processCandidateRecommendationJob',
        jobId: job.id,
        taskId,
        batchSize,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Process initial recommendations job
   */
  private async processInitialRecommendationsJob(
    job: Job<CandidateInitialRecommendationJobData>
  ): Promise<void> {
    const { candidateId, limit } = job.data;

    logger.info('Processing initial recommendations job', {
      context:
        'CandidateRecommendationProcessor.processInitialRecommendationsJob',
      jobId: job.id,
      candidateId,
      limit,
    });

    try {
      // Process initial recommendations
      await this.candidateRecommendationCronService.startInitialRecommendationsJob(
        candidateId,
        limit
      );

      logger.info('Initial recommendations job completed successfully', {
        context:
          'CandidateRecommendationProcessor.processInitialRecommendationsJob',
        jobId: job.id,
        candidateId,
      });
    } catch (error) {
      logger.error('Failed to process initial recommendations job', {
        context:
          'CandidateRecommendationProcessor.processInitialRecommendationsJob',
        jobId: job.id,
        candidateId,
        limit,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
