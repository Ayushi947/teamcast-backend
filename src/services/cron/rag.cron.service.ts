import { PrismaClient } from '@prisma/client';
import { singleton } from '@/shared/decorators/singleton';
import {
  IRagCronTask,
  RagCronTaskStatus,
  toRagCronTask,
  toRagCronTaskList,
  IRagCronTaskFilterQuery,
} from '@/shared/models/domain/cron/rag.cron.domain';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import {
  IPaginationRequest,
  IPaginatedResponse,
} from '@/shared/models/api/common/common.api';
import { getPaginationInfo } from '@/utils/pagination';
import { RagService } from '../rag/rag.service';
import { RagCronProcessor } from '../queue/processors/rag.cron.processor';
import { ENV } from '@/config/env';

@singleton
export class RagCronService {
  private readonly prisma: PrismaClient;
  private readonly ragService: RagService;
  private readonly ragCronProcessor: RagCronProcessor;

  constructor() {
    this.prisma = new PrismaClient();
    this.ragService = new RagService();
    this.ragCronProcessor = new RagCronProcessor(this);
    if (ENV.ENABLE_BULLMQ_WORKERS) {
      this.ragCronProcessor.setupWorkers();
    }
    logger.info('RAG cron service initialized with BullMQ integration', {
      context: 'RagCronService.constructor',
    });
  }

  /**
   * Start a new RAG task
   */
  async startRagTask(batchSize: number = 10): Promise<IRagCronTask> {
    try {
      // Create a new task
      const task = await this.prisma.rag_task_cron.create({
        data: {
          id: uuidv4(),
          status: RagCronTaskStatus.PENDING,
          totalEntities: 0,
          processedEntities: 0,
          failedEntities: 0,
          startedAt: new Date(),
        },
      });

      // Start processing in background using queue
      await this.ragCronProcessor.addRagJob(task.id, batchSize);

      return toRagCronTask(task);
    } catch (error) {
      logger.error({
        message: 'Failed to start RAG task',
        context: 'RagCronService.startRagTask',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get a RAG task by ID
   */
  async getTask(taskId: string): Promise<IRagCronTask> {
    try {
      const task = await this.prisma.rag_task_cron.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        throw new AppError('Task not found', 404, ErrorCode.NOT_FOUND);
      }

      return toRagCronTask(task);
    } catch (error) {
      logger.error({
        message: 'Failed to get RAG task',
        context: 'RagCronService.getTask',
        error: error instanceof Error ? error.message : 'Unknown error',
        taskId,
      });
      throw error;
    }
  }

  /**
   * Get all RAG tasks with pagination and filtering
   */
  async getAllTasks(
    filter: IRagCronTaskFilterQuery,
    paginationRequest: IPaginationRequest
  ): Promise<IPaginatedResponse<IRagCronTask>> {
    try {
      // Get pagination info
      const paginationInfo = getPaginationInfo(paginationRequest);

      // Build where clause based on filters
      const where = {
        ...(filter.status && { status: filter.status }),
      };

      // Get total count for pagination
      const total = await this.prisma.rag_task_cron.count({
        where,
      });

      // Get paginated results
      const tasks = await this.prisma.rag_task_cron.findMany({
        where,
        skip: paginationInfo.skip,
        take: paginationInfo.take,
        orderBy: paginationInfo.orderBy,
      });

      // Convert to domain model
      const tasksDomain = toRagCronTaskList(tasks);

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
        message: 'Failed to get RAG tasks',
        context: 'RagCronService.getAllTasks',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Start background processing of entities (public method for queue processor)
   */
  async startBackgroundProcessEntities(
    cronTaskId: string,
    batchSize: number
  ): Promise<void> {
    try {
      logger.info({
        message: 'Processing entities',
        context: 'RagCronService.backgroundProcessEntities',
        cronTaskId,
        batchSize,
      });
      // Update task status to processing
      await this.prisma.rag_task_cron.update({
        where: { id: cronTaskId },
        data: { status: RagCronTaskStatus.PROCESSING },
      });

      // Get count of dirty entities
      const [dirtyCandidatesCount, dirtyJobsCount] = await Promise.all([
        this.prisma.candidate.count({
          where: {
            isDirty: true,
            isPublished: true,
          },
        }),
        this.prisma.job_posting.count({
          where: {
            isDirty: true,
            isPublished: true,
          },
        }),
      ]);

      const totalEntities = dirtyCandidatesCount + dirtyJobsCount;

      // Update total entities count
      await this.prisma.rag_task_cron.update({
        where: { id: cronTaskId },
        data: { totalEntities },
      });

      // Process dirty entities
      await this.ragService.processDirtyEntities(batchSize);

      // Get updated counts after processing
      const [remainingCandidatesCount, remainingJobsCount] = await Promise.all([
        this.prisma.candidate.count({
          where: {
            isDirty: true,
            isPublished: true,
          },
        }),
        this.prisma.job_posting.count({
          where: {
            isDirty: true,
            isPublished: true,
          },
        }),
      ]);

      const remainingEntities = remainingCandidatesCount + remainingJobsCount;
      const processedEntities = totalEntities - remainingEntities;

      // Update task status to completed
      await this.prisma.rag_task_cron.update({
        where: { id: cronTaskId },
        data: {
          status: RagCronTaskStatus.COMPLETED,
          processedEntities,
          failedEntities: totalEntities - processedEntities,
          completedAt: new Date(),
        },
      });
    } catch (error) {
      // Update task status to failed
      await this.prisma.rag_task_cron.update({
        where: { id: cronTaskId },
        data: {
          status: RagCronTaskStatus.FAILED,
          error: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        },
      });

      throw error;
    }
  }
}
