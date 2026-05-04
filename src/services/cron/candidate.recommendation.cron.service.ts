import { PrismaClient } from '@prisma/client';
import { singleton } from '@/shared/decorators/singleton';
import {
  ICandidateRecommendationCronTask,
  CandidateRecommendationCronTaskStatus,
  toCandidateRecommendationCronTask,
  toCandidateRecommendationCronTaskList,
  ICandidateRecommendationCronTaskFilterQuery,
} from '@/shared/models/domain/cron/candidate.recommendation.cron.domain';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import {
  IPaginationRequest,
  IPaginatedResponse,
} from '@/shared/models/api/common/common.api';
import { getPaginationInfo } from '@/utils/pagination';
import { CandidateRecommendationProcessor } from '../queue/processors/candidate.recommendation.processor';
import { CandidateRecommendationFactory } from '../helpers/candidate.recommendation/candidate.recommendation.factory';
import { ENV } from '@/config/env';

@singleton
export class CandidateRecommendationCronService {
  private readonly prisma: PrismaClient;
  private readonly candidateRecommendationFactory: CandidateRecommendationFactory;
  private readonly candidateRecommendationProcessor: CandidateRecommendationProcessor;

  constructor() {
    this.prisma = new PrismaClient();
    this.candidateRecommendationFactory =
      CandidateRecommendationFactory.getInstance();
    this.candidateRecommendationProcessor =
      new CandidateRecommendationProcessor(this);
    if (ENV.ENABLE_BULLMQ_WORKERS) {
      this.candidateRecommendationProcessor.setupWorkers();
    }
    logger.info(
      'Candidate recommendation cron service initialized with BullMQ integration',
      {
        context: 'CandidateRecommendationCronService.constructor',
      }
    );
  }

  /**
   * Start a new candidate recommendation task for initial recommendations
   */
  async startCandidateRecommendationTask(
    batchSize: number = 10
  ): Promise<ICandidateRecommendationCronTask> {
    try {
      // Create a new task
      const task = await this.prisma.candidate_recommendation_cron_task.create({
        data: {
          id: uuidv4(),
          status: CandidateRecommendationCronTaskStatus.PENDING,
          totalCandidates: 0,
          processedCandidates: 0,
          failedCandidates: 0,
          recommendationsCreated: 0,
          startedAt: new Date(),
        },
      });

      // Start processing in background using queue
      await this.candidateRecommendationProcessor.addCandidateRecommendationJob(
        task.id,
        batchSize
      );

      return toCandidateRecommendationCronTask(task);
    } catch (error) {
      logger.error({
        message: 'Failed to start candidate recommendation task',
        context:
          'CandidateRecommendationCronService.startCandidateRecommendationTask',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Find initial recommendations for a specific candidate
   */
  async findInitialRecommendations(
    candidateId: string,
    limit: number = 50,
    prevSyncDateTime?: Date
  ): Promise<void> {
    try {
      logger.info('Finding initial recommendations for candidate', {
        context:
          'CandidateRecommendationCronService.findInitialRecommendations',
        candidateId,
        limit,
        prevSyncDateTime,
      });

      const provider = this.candidateRecommendationFactory.getProvider();
      await provider.findInitialRecommendations(
        candidateId,
        limit,
        prevSyncDateTime
      );

      logger.info('Initial recommendations completed successfully', {
        context:
          'CandidateRecommendationCronService.findInitialRecommendations',
        candidateId,
      });
    } catch (error) {
      logger.error('Failed to find initial recommendations', {
        context:
          'CandidateRecommendationCronService.findInitialRecommendations',
        candidateId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Add a background job to find initial recommendations for a candidate
   */
  async addFindInitialRecommendationsJob(
    candidateId: string,
    limit: number = 50
  ): Promise<void> {
    try {
      logger.info('Adding background job for initial recommendations', {
        context:
          'CandidateRecommendationCronService.addFindInitialRecommendationsJob',
        candidateId,
        limit,
      });

      await this.candidateRecommendationProcessor.addFindInitialRecommendationsJob(
        candidateId,
        limit
      );

      logger.info('Background job added successfully', {
        context:
          'CandidateRecommendationCronService.addFindInitialRecommendationsJob',
        candidateId,
      });
    } catch (error) {
      logger.error('Failed to add background job for initial recommendations', {
        context:
          'CandidateRecommendationCronService.addFindInitialRecommendationsJob',
        candidateId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Background process to find initial recommendations for a candidate
   */
  async startInitialRecommendationsJob(
    candidateId: string,
    limit: number = 50
  ): Promise<void> {
    try {
      logger.info('Processing background job for initial recommendations', {
        context:
          'CandidateRecommendationCronService.startInitialRecommendationsJob',
        candidateId,
        limit,
      });

      // Verify candidate exists and is published
      const candidate = await this.prisma.candidate.findUnique({
        where: { id: candidateId },
        select: {
          id: true,
          isPublished: true,
          jobSearchStatus: true,
          recommendationsSync: true,
        },
      });

      if (!candidate) {
        logger.warn('Candidate not found, skipping recommendations', {
          context:
            'CandidateRecommendationCronService.startInitialRecommendationsJob',
          candidateId,
        });
        return;
      }

      if (
        !candidate.isPublished ||
        candidate.jobSearchStatus !== 'OPEN_TO_OPPORTUNITIES'
      ) {
        logger.warn(
          'Candidate is not published or not open to opportunities, skipping recommendations',
          {
            context:
              'CandidateRecommendationCronService.startInitialRecommendationsJob',
            candidateId,
            isPublished: candidate.isPublished,
            jobSearchStatus: candidate.jobSearchStatus,
          }
        );
        return;
      }

      let prevSyncDateTime: Date | undefined;
      // Check if initial recommendations already exist
      if (candidate.recommendationsSync) {
        prevSyncDateTime = new Date(candidate.recommendationsSync);
      }

      // Find initial recommendations
      await this.findInitialRecommendations(
        candidateId,
        limit,
        prevSyncDateTime
      );

      logger.info(
        'Background job for initial recommendations completed successfully',
        {
          context:
            'CandidateRecommendationCronService.startInitialRecommendationsJob',
          candidateId,
        }
      );
    } catch (error) {
      logger.error(
        'Failed to process background job for initial recommendations',
        {
          context:
            'CandidateRecommendationCronService.startInitialRecommendationsJob',
          candidateId,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );
      throw error;
    }
  }

  /**
   * Find new recommendations for a specific candidate based on new job postings
   */
  async findRecommendations(
    candidateId: string,
    limit: number = 25
  ): Promise<void> {
    try {
      logger.info('Finding new recommendations for candidate', {
        context: 'CandidateRecommendationCronService.findRecommendations',
        candidateId,
        limit,
      });

      // Get the last sync timestamp
      const candidate = await this.prisma.candidate.findUnique({
        where: { id: candidateId },
        select: { recommendationsSync: true },
      });

      if (!candidate) {
        throw new AppError('Candidate not found', 404, ErrorCode.NOT_FOUND);
      }

      const provider = this.candidateRecommendationFactory.getProvider();
      await provider.findRecommendations(
        candidateId,
        candidate.recommendationsSync || undefined,
        limit
      );

      logger.info('New recommendations completed successfully', {
        context: 'CandidateRecommendationCronService.findRecommendations',
        candidateId,
      });
    } catch (error) {
      logger.error('Failed to find new recommendations', {
        context: 'CandidateRecommendationCronService.findRecommendations',
        candidateId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get a candidate recommendation task by ID
   */
  async getTask(taskId: string): Promise<ICandidateRecommendationCronTask> {
    try {
      const task =
        await this.prisma.candidate_recommendation_cron_task.findUnique({
          where: { id: taskId },
        });

      if (!task) {
        throw new AppError('Task not found', 404, ErrorCode.NOT_FOUND);
      }

      return toCandidateRecommendationCronTask(task);
    } catch (error) {
      logger.error({
        message: 'Failed to get candidate recommendation task',
        context: 'CandidateRecommendationCronService.getTask',
        error: error instanceof Error ? error.message : 'Unknown error',
        taskId,
      });
      throw error;
    }
  }

  /**
   * Get all candidate recommendation tasks with pagination and filtering
   */
  async getAllTasks(
    filter: ICandidateRecommendationCronTaskFilterQuery,
    paginationRequest: IPaginationRequest
  ): Promise<IPaginatedResponse<ICandidateRecommendationCronTask>> {
    try {
      // Get pagination info
      const paginationInfo = getPaginationInfo(paginationRequest);

      // Build where clause based on filters
      const where = {
        ...(filter.status && { status: filter.status }),
      };

      // Get total count for pagination
      const total = await this.prisma.candidate_recommendation_cron_task.count({
        where,
      });

      // Get paginated results
      const tasks =
        await this.prisma.candidate_recommendation_cron_task.findMany({
          where,
          skip: paginationInfo.skip,
          take: paginationInfo.take,
          orderBy: paginationInfo.orderBy,
        });

      // Convert to domain model
      const tasksDomain = toCandidateRecommendationCronTaskList(tasks);

      return {
        items: tasksDomain,
        pagination: {
          total,
          page: paginationInfo.skip,
          limit: paginationInfo.take,
          totalPages: Math.ceil(total / paginationInfo.take),
        },
      };
    } catch (error) {
      logger.error({
        message: 'Failed to get candidate recommendation tasks',
        context: 'CandidateRecommendationCronService.getAllTasks',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Start background processing of candidate recommendations (public method for queue processor)
   */
  async startBackgroundProcessCandidates(
    cronTaskId: string,
    batchSize: number
  ): Promise<void> {
    try {
      logger.info({
        message: 'Processing candidate recommendations',
        context:
          'CandidateRecommendationCronService.startBackgroundProcessCandidates',
        cronTaskId,
        batchSize,
      });

      // Update task status to processing
      await this.prisma.candidate_recommendation_cron_task.update({
        where: { id: cronTaskId },
        data: { status: CandidateRecommendationCronTaskStatus.PROCESSING },
      });

      // Get candidates that need recommendations
      const candidatesNeedingRecommendations =
        await this.prisma.candidate.findMany({
          where: {
            jobSearchStatus: 'OPEN_TO_OPPORTUNITIES',
            isPublished: true,
            OR: [
              { recommendationsSync: null }, // Never synced
              {
                recommendationsSync: {
                  lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Older than 24 hours
                },
              },
            ],
          },
          select: { id: true, recommendationsSync: true },
          take: batchSize,
        });

      const totalCandidates = candidatesNeedingRecommendations.length;

      // Update total candidates count
      await this.prisma.candidate_recommendation_cron_task.update({
        where: { id: cronTaskId },
        data: { totalCandidates },
      });

      let processedCandidates = 0;
      let failedCandidates = 0;
      let totalRecommendationsCreated = 0;

      // Process each candidate
      for (const candidate of candidatesNeedingRecommendations) {
        try {
          logger.info('Processing candidate recommendations', {
            context:
              'CandidateRecommendationCronService.startBackgroundProcessCandidates',
            candidateId: candidate.id,
            cronTaskId,
          });

          if (candidate.recommendationsSync) {
            // Find new recommendations
            await this.findRecommendations(candidate.id);
          } else {
            // Find initial recommendations
            await this.findInitialRecommendations(candidate.id);
          }

          processedCandidates++;

          // Update progress
          await this.prisma.candidate_recommendation_cron_task.update({
            where: { id: cronTaskId },
            data: { processedCandidates },
          });
        } catch (error) {
          failedCandidates++;
          logger.error('Failed to process candidate recommendations', {
            context:
              'CandidateRecommendationCronService.startBackgroundProcessCandidates',
            candidateId: candidate.id,
            cronTaskId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });

          // Update failed candidates count
          await this.prisma.candidate_recommendation_cron_task.update({
            where: { id: cronTaskId },
            data: { failedCandidates },
          });
        }
      }

      // Count total recommendations created
      const recommendationsCount =
        await this.prisma.candidate_recommendation.count({
          where: {
            candidateId: {
              in: candidatesNeedingRecommendations.map((c) => c.id),
            },
            createdAt: {
              gte: new Date(Date.now() - 60 * 60 * 1000), // Created in the last hour
            },
          },
        });

      totalRecommendationsCreated = recommendationsCount;

      // Update task status to completed
      await this.prisma.candidate_recommendation_cron_task.update({
        where: { id: cronTaskId },
        data: {
          status: CandidateRecommendationCronTaskStatus.COMPLETED,
          processedCandidates,
          failedCandidates,
          recommendationsCreated: totalRecommendationsCreated,
          completedAt: new Date(),
        },
      });

      logger.info('Candidate recommendations processing completed', {
        context:
          'CandidateRecommendationCronService.startBackgroundProcessCandidates',
        cronTaskId,
        totalCandidates,
        processedCandidates,
        failedCandidates,
        totalRecommendationsCreated,
      });
    } catch (error) {
      // Update task status to failed
      await this.prisma.candidate_recommendation_cron_task.update({
        where: { id: cronTaskId },
        data: {
          status: CandidateRecommendationCronTaskStatus.FAILED,
          error: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        },
      });

      logger.error('Candidate recommendations processing failed', {
        context:
          'CandidateRecommendationCronService.startBackgroundProcessCandidates',
        cronTaskId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }
}
