import { PrismaClient } from '@prisma/client';
import { singleton } from '@/shared/decorators/singleton';
import {
  ISubscriptionExpiryCronTask,
  SubscriptionExpiryTaskCronStatus,
  SubscriptionExpiryTaskType,
  toSubscriptionExpiryCronTask,
  toSubscriptionExpiryCronTaskList,
  ISubscriptionExpiryCronTaskFilterQuery,
  ISubscriptionExpiryCronTaskUpdate,
} from '@/shared/models/domain/cron/subscription.expiry.cron.domain';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import {
  IPaginationRequest,
  IPaginatedResponse,
} from '@/shared/models/api/common/common.api';
import { getPaginationInfo } from '@/utils/pagination';
import { SubscriptionExpiryProcessor } from '../queue/processors/subscription.expiry.processor';
import { ENV } from '@/config/env';
import { ClientSubscriptionService } from '../client/subscription.service';
import { CandidateSubscriptionService } from '../candidate/subscription.service';
import { PaymentFactory } from '../subscription/payment.factory';
import { NodemailerProvider } from '../notification/nodemailer.service';
import {
  ClientSubscriptionStatusEnum,
  CandidateSubscriptionStatusEnum,
} from '@/shared/models/common/enums';

@singleton
export class SubscriptionExpiryCronService {
  private readonly prisma: PrismaClient;
  private readonly subscriptionExpiryProcessor: SubscriptionExpiryProcessor;
  private readonly clientSubscriptionService: ClientSubscriptionService;
  private readonly candidateSubscriptionService: CandidateSubscriptionService;

  constructor() {
    this.prisma = new PrismaClient();
    this.subscriptionExpiryProcessor = new SubscriptionExpiryProcessor(this);
    this.clientSubscriptionService = new ClientSubscriptionService(
      new PaymentFactory(),
      new NodemailerProvider()
    );
    this.candidateSubscriptionService = new CandidateSubscriptionService(
      new PaymentFactory()
    );
    if (ENV.ENABLE_BULLMQ_WORKERS) {
      this.subscriptionExpiryProcessor.setupWorkers();
    }
    logger.info(
      'Subscription expiry cron service initialized with BullMQ integration',
      {
        context: 'SubscriptionExpiryCronService.constructor',
      }
    );
  }

  /**
   * Start a new subscription expiry task
   */
  async startSubscriptionExpiryTask(
    type: SubscriptionExpiryTaskType,
    metadata?: Record<string, any>
  ): Promise<ISubscriptionExpiryCronTask> {
    try {
      // Create a new task
      const task = await this.prisma.subscription_expiry_task_cron.create({
        data: {
          id: uuidv4(),
          type,
          status: SubscriptionExpiryTaskCronStatus.PENDING,
          totalSubscriptions: 0,
          expiredSubscriptions: 0,
          failedSubscriptions: 0,
          startedAt: new Date(),
          metadata,
        },
      });

      // Start processing in background using queue
      await this.subscriptionExpiryProcessor.addSubscriptionExpiryJob(
        task.id,
        type
      );

      return toSubscriptionExpiryCronTask(task);
    } catch (error) {
      logger.error({
        message: 'Failed to start subscription expiry task',
        context: 'SubscriptionExpiryCronService.startSubscriptionExpiryTask',
        error: error instanceof Error ? error.message : 'Unknown error',
        type,
      });
      throw error;
    }
  }

  /**
   * Get a subscription expiry task by ID
   */
  async getTask(taskId: string): Promise<ISubscriptionExpiryCronTask> {
    try {
      const task = await this.prisma.subscription_expiry_task_cron.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        throw new AppError('Task not found', 404, ErrorCode.NOT_FOUND);
      }

      return toSubscriptionExpiryCronTask(task);
    } catch (error) {
      logger.error('Failed to get subscription expiry task', {
        context: 'SubscriptionExpiryCronService.getTask',
        taskId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get all subscription expiry tasks with pagination and filtering
   */
  async getTasks(
    pagination: IPaginationRequest,
    filters?: ISubscriptionExpiryCronTaskFilterQuery
  ): Promise<IPaginatedResponse<ISubscriptionExpiryCronTask>> {
    try {
      const paginationInfo = getPaginationInfo(pagination);
      const page = pagination.page ?? 1;
      const limit = pagination.limit ?? 10;

      // Build where clause
      const where: any = {};
      if (filters?.type) {
        where.type = filters.type;
      }
      if (filters?.status) {
        where.status = filters.status;
      }
      if (filters?.startDate || filters?.endDate) {
        where.startedAt = {};
        if (filters.startDate) {
          where.startedAt.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.startedAt.lte = filters.endDate;
        }
      }

      // Get total count
      const total = await this.prisma.subscription_expiry_task_cron.count({
        where,
      });

      // Get tasks
      const tasks = await this.prisma.subscription_expiry_task_cron.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: paginationInfo.skip,
        take: paginationInfo.take,
      });

      return toSubscriptionExpiryCronTaskList(tasks, total, page, limit);
    } catch (error) {
      logger.error('Failed to get subscription expiry tasks', {
        context: 'SubscriptionExpiryCronService.getTasks',
        pagination,
        filters,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Update a subscription expiry task
   */
  async updateTask(
    taskId: string,
    updateData: ISubscriptionExpiryCronTaskUpdate
  ): Promise<ISubscriptionExpiryCronTask> {
    try {
      const task = await this.prisma.subscription_expiry_task_cron.update({
        where: { id: taskId },
        data: updateData,
      });

      return toSubscriptionExpiryCronTask(task);
    } catch (error) {
      logger.error('Failed to update subscription expiry task', {
        context: 'SubscriptionExpiryCronService.updateTask',
        taskId,
        updateData,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Process client subscription expiry
   */
  async processClientSubscriptionExpiry(taskId: string): Promise<void> {
    try {
      // Update task status to processing
      await this.updateTask(taskId, {
        status: SubscriptionExpiryTaskCronStatus.PROCESSING,
      });

      logger.info('Starting client subscription expiry processing', {
        context:
          'SubscriptionExpiryCronService.processClientSubscriptionExpiry',
        taskId,
      });

      // Get all active client subscriptions
      const subscriptions = await this.prisma.client_subscription.findMany({
        where: {
          status: ClientSubscriptionStatusEnum.ACTIVE,
        },
        include: {
          client: {
            include: {
              company: true,
            },
          },
        },
      });

      let expiredCount = 0;
      let failedCount = 0;
      const currentDate = new Date();
      const nowDayUtc = Date.UTC(
        currentDate.getUTCFullYear(),
        currentDate.getUTCMonth(),
        currentDate.getUTCDate()
      );

      // Keep consistent semantics with client subscription expiry:
      // UTC-midnight timestamps expire at end of day; otherwise use exact time.
      const shouldExpireDate = (dateValue: Date): boolean => {
        const d = new Date(dateValue);
        const isUtcMidnight =
          d.getUTCHours() === 0 &&
          d.getUTCMinutes() === 0 &&
          d.getUTCSeconds() === 0 &&
          d.getUTCMilliseconds() === 0;

        if (isUtcMidnight) {
          const dayUtc = Date.UTC(
            d.getUTCFullYear(),
            d.getUTCMonth(),
            d.getUTCDate()
          );
          return dayUtc < nowDayUtc;
        }

        return d <= currentDate;
      };

      // Update task with total subscriptions
      await this.updateTask(taskId, {
        totalSubscriptions: subscriptions.length,
      });

      for (const subscription of subscriptions) {
        try {
          let shouldExpire = false;
          let expirationReason = '';

          if (subscription.isTrial) {
            // Handle trial subscription expiration
            if (!subscription.trialExpireAt) {
              logger.warn('Trial subscription has no expiration date', {
                context:
                  'SubscriptionExpiryCronService.processClientSubscriptionExpiry',
                taskId,
                clientId: subscription.clientId,
                subscriptionId: subscription.id,
              });
              continue;
            }

            const trialExpireAt = new Date(subscription.trialExpireAt);
            if (shouldExpireDate(trialExpireAt)) {
              shouldExpire = true;
              expirationReason = 'trial_expired';
            }
          } else {
            // Handle regular subscription expiration
            if (!subscription.endDate) {
              logger.warn('Regular subscription has no end date', {
                context:
                  'SubscriptionExpiryCronService.processClientSubscriptionExpiry',
                taskId,
                clientId: subscription.clientId,
                subscriptionId: subscription.id,
              });
              continue;
            }

            const endDate = new Date(subscription.endDate);
            if (shouldExpireDate(endDate)) {
              shouldExpire = true;
              expirationReason = 'subscription_expired';
            }
          }

          // Update subscription status to expired if conditions are met
          if (shouldExpire) {
            await this.prisma.client_subscription.update({
              where: { id: subscription.id },
              data: { status: ClientSubscriptionStatusEnum.EXPIRED },
            });

            expiredCount++;
            logger.info('Client subscription marked as expired', {
              context:
                'SubscriptionExpiryCronService.processClientSubscriptionExpiry',
              taskId,
              clientId: subscription.clientId,
              subscriptionId: subscription.id,
              reason: expirationReason,
              isTrial: subscription.isTrial,
            });
          }
        } catch (error) {
          failedCount++;
          logger.error('Failed to process client subscription expiration', {
            context:
              'SubscriptionExpiryCronService.processClientSubscriptionExpiry',
            taskId,
            clientId: subscription.clientId,
            subscriptionId: subscription.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Update task with results
      await this.updateTask(taskId, {
        status: SubscriptionExpiryTaskCronStatus.COMPLETED,
        expiredSubscriptions: expiredCount,
        failedSubscriptions: failedCount,
        completedAt: new Date(),
      });

      logger.info('Client subscription expiry processing completed', {
        context:
          'SubscriptionExpiryCronService.processClientSubscriptionExpiry',
        taskId,
        totalProcessed: subscriptions.length,
        expiredCount,
        failedCount,
      });
    } catch (error) {
      // Update task with error
      await this.updateTask(taskId, {
        status: SubscriptionExpiryTaskCronStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
      });

      logger.error('Failed to process client subscription expiry', {
        context:
          'SubscriptionExpiryCronService.processClientSubscriptionExpiry',
        taskId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Process candidate subscription expiry
   */
  async processCandidateSubscriptionExpiry(taskId: string): Promise<void> {
    try {
      // Update task status to processing
      await this.updateTask(taskId, {
        status: SubscriptionExpiryTaskCronStatus.PROCESSING,
      });

      logger.info('Starting candidate subscription expiry processing', {
        context:
          'SubscriptionExpiryCronService.processCandidateSubscriptionExpiry',
        taskId,
      });

      // Get all active candidate subscriptions
      const subscriptions = await this.prisma.candidate_subscription.findMany({
        where: {
          status: CandidateSubscriptionStatusEnum.ACTIVE,
        },
        include: {
          candidate: {
            include: {
              user: true,
            },
          },
        },
      });

      let expiredCount = 0;
      let failedCount = 0;
      const currentDate = new Date();
      const nowDayUtc = Date.UTC(
        currentDate.getUTCFullYear(),
        currentDate.getUTCMonth(),
        currentDate.getUTCDate()
      );

      // Keep consistent semantics with client subscription expiry:
      // UTC-midnight timestamps expire at end of day; otherwise use exact time.
      const shouldExpireDate = (dateValue: Date): boolean => {
        const d = new Date(dateValue);
        const isUtcMidnight =
          d.getUTCHours() === 0 &&
          d.getUTCMinutes() === 0 &&
          d.getUTCSeconds() === 0 &&
          d.getUTCMilliseconds() === 0;

        if (isUtcMidnight) {
          const dayUtc = Date.UTC(
            d.getUTCFullYear(),
            d.getUTCMonth(),
            d.getUTCDate()
          );
          return dayUtc < nowDayUtc;
        }

        return d <= currentDate;
      };

      // Update task with total subscriptions
      await this.updateTask(taskId, {
        totalSubscriptions: subscriptions.length,
      });

      for (const subscription of subscriptions) {
        try {
          // Handle candidate subscription expiration
          if (!subscription.endDate) {
            logger.warn('Candidate subscription has no end date', {
              context:
                'SubscriptionExpiryCronService.processCandidateSubscriptionExpiry',
              taskId,
              candidateId: subscription.candidateId,
              subscriptionId: subscription.id,
            });
            continue;
          }

          const endDate = new Date(subscription.endDate);
          if (shouldExpireDate(endDate)) {
            await this.prisma.candidate_subscription.update({
              where: { id: subscription.id },
              data: { status: CandidateSubscriptionStatusEnum.EXPIRED },
            });

            expiredCount++;
            logger.info('Candidate subscription marked as expired', {
              context:
                'SubscriptionExpiryCronService.processCandidateSubscriptionExpiry',
              taskId,
              candidateId: subscription.candidateId,
              subscriptionId: subscription.id,
              endDate: subscription.endDate,
              currentDate,
            });
          }
        } catch (error) {
          failedCount++;
          logger.error('Failed to process candidate subscription expiration', {
            context:
              'SubscriptionExpiryCronService.processCandidateSubscriptionExpiry',
            taskId,
            candidateId: subscription.candidateId,
            subscriptionId: subscription.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Update task with results
      await this.updateTask(taskId, {
        status: SubscriptionExpiryTaskCronStatus.COMPLETED,
        expiredSubscriptions: expiredCount,
        failedSubscriptions: failedCount,
        completedAt: new Date(),
      });

      logger.info('Candidate subscription expiry processing completed', {
        context:
          'SubscriptionExpiryCronService.processCandidateSubscriptionExpiry',
        taskId,
        totalProcessed: subscriptions.length,
        expiredCount,
        failedCount,
      });
    } catch (error) {
      // Update task with error
      await this.updateTask(taskId, {
        status: SubscriptionExpiryTaskCronStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
      });

      logger.error('Failed to process candidate subscription expiry', {
        context:
          'SubscriptionExpiryCronService.processCandidateSubscriptionExpiry',
        taskId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Cancel a subscription expiry task
   */
  async cancelTask(taskId: string): Promise<ISubscriptionExpiryCronTask> {
    try {
      const task = await this.prisma.subscription_expiry_task_cron.update({
        where: { id: taskId },
        data: {
          status: SubscriptionExpiryTaskCronStatus.CANCELLED,
          completedAt: new Date(),
        },
      });

      logger.info('Subscription expiry task cancelled', {
        context: 'SubscriptionExpiryCronService.cancelTask',
        taskId,
      });

      return toSubscriptionExpiryCronTask(task);
    } catch (error) {
      logger.error('Failed to cancel subscription expiry task', {
        context: 'SubscriptionExpiryCronService.cancelTask',
        taskId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Delete a subscription expiry task
   */
  async deleteTask(taskId: string): Promise<void> {
    try {
      await this.prisma.subscription_expiry_task_cron.delete({
        where: { id: taskId },
      });

      logger.info('Subscription expiry task deleted', {
        context: 'SubscriptionExpiryCronService.deleteTask',
        taskId,
      });
    } catch (error) {
      logger.error('Failed to delete subscription expiry task', {
        context: 'SubscriptionExpiryCronService.deleteTask',
        taskId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
