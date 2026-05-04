import { PrismaClient } from '@prisma/client';
import { singleton } from '@/shared/decorators/singleton';
import { logger } from '@/shared/utils/logger';
import { DailyDigestCronTaskStatus } from '@/shared/models/domain/cron/daily.digest.domain';
import { INotificationProvider } from '@/services/notification/notification.interface';
import { NotificationFactory } from '@/services/notification/notification.factory';
import { ENV } from '@/config/env';
import { DailyDigestEmailTemplate } from '@/templates/email/daily.digest.template';
import { DailyDigestProcessor } from '@/services/queue/processors/daily.digest.processor';
import {
  UserStatusEnum,
  UserRoleEnum,
  JobPostingStatusEnum,
  JobRecommendationStatusEnum,
} from '@/shared/models/common/enums';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { v4 as uuidv4 } from 'uuid';
import { IPaginationRequest } from '@/shared/models/api/common/common.api';
import { getPaginationInfo } from '@/utils/pagination';
import { IStorageProvider } from '@/services/helpers/storage/storage.interface';
import { StorageFactory } from '@/services/helpers/storage/storage.factory';

const DAILY_DIGEST_CC_EMAILS = [
  'john@teamcast.ai',
  'yogi@teamcast.ai',
  'utkarsh@teamcast.ai',
];

@singleton
export class DailyDigestCronService {
  private readonly prisma: PrismaClient;
  private readonly notificationProvider: INotificationProvider;
  private readonly dailyDigestProcessor: DailyDigestProcessor;
  private readonly storageService: IStorageProvider;

  constructor() {
    this.prisma = new PrismaClient();
    this.notificationProvider =
      new NotificationFactory().getNotificationProvider();
    this.dailyDigestProcessor = new DailyDigestProcessor(this);
    this.storageService = StorageFactory.getInstance().getProvider();

    // Initialize queue workers
    this.dailyDigestProcessor.setupWorkers();
  }

  /**
   * Start a new daily digest task
   */
  async startDailyDigestTask() {
    try {
      // Create a new task
      const task = await this.prisma.daily_digest_cron_task.create({
        data: {
          id: uuidv4(),
          status: DailyDigestCronTaskStatus.PENDING,
          startedAt: new Date(),
        },
      });

      // Start processing in background using queue
      await this.dailyDigestProcessor.addDailyDigestJob(task.id);

      return task;
    } catch (error) {
      logger.error('Failed to start daily digest task', {
        context: 'DailyDigestCronService.startDailyDigestTask',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get a specific daily digest task
   */
  async getTask(taskId: string) {
    try {
      const task = await this.prisma.daily_digest_cron_task.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        throw new AppError('Task not found', 404, ErrorCode.NOT_FOUND);
      }

      return task;
    } catch (error) {
      logger.error('Failed to get daily digest task', {
        context: 'DailyDigestCronService.getDailyDigestTask',
        error: error instanceof Error ? error.message : 'Unknown error',
        taskId,
      });
      throw error;
    }
  }

  /**
   * Get all daily digest tasks with filtering and pagination
   */
  async getAllTasks(
    filter: { status?: DailyDigestCronTaskStatus },
    paginationRequest: IPaginationRequest
  ) {
    try {
      // Get pagination info
      const paginationInfo = getPaginationInfo(paginationRequest);

      // Build where clause based on filters
      const where = {
        ...(filter.status && { status: filter.status }),
      };

      // Get total count for pagination
      const total = await this.prisma.daily_digest_cron_task.count({
        where,
      });

      // Get paginated results
      const tasks = await this.prisma.daily_digest_cron_task.findMany({
        where,
        skip: paginationInfo.skip,
        take: paginationInfo.take,
        orderBy: paginationInfo.orderBy,
      });

      return {
        items: tasks,
        pagination: {
          total,
          page: paginationInfo.skip,
          limit: paginationInfo.take,
          totalPages: Math.ceil(total / paginationInfo.take),
        },
      };
    } catch (error) {
      logger.error('Failed to get daily digest tasks', {
        context: 'DailyDigestCronService.listDailyDigestTasks',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Update task status
   */
  async updateTaskStatus(taskId: string, status: DailyDigestCronTaskStatus) {
    try {
      const updateData: any = { status };
      if (status === DailyDigestCronTaskStatus.IN_PROGRESS) {
        updateData.startedAt = new Date();
      }

      const task = await this.prisma.daily_digest_cron_task.update({
        where: { id: taskId },
        data: updateData,
      });

      logger.info('Task status updated', {
        context: 'DailyDigestCronService.updateTaskStatus',
        taskId,
        status,
      });

      return task;
    } catch (error) {
      logger.error('Failed to update task status', {
        context: 'DailyDigestCronService.updateTaskStatus',
        error: error instanceof Error ? error.message : 'Unknown error',
        taskId,
        status,
      });
      throw error;
    }
  }

  /**
   * Complete daily digest task
   */
  async completeDailyDigestTask(taskId: string, digestData: any) {
    try {
      const task = await this.prisma.daily_digest_cron_task.update({
        where: { id: taskId },
        data: {
          status: DailyDigestCronTaskStatus.COMPLETED,
          completedAt: new Date(),
          clientDigests: JSON.stringify(digestData),
        },
      });

      logger.info('Daily digest task completed', {
        context: 'DailyDigestCronService.completeDailyDigestTask',
        taskId,
        digestDataLength: digestData?.length || 0,
      });

      return task;
    } catch (error) {
      logger.error('Failed to complete daily digest task', {
        context: 'DailyDigestCronService.completeDailyDigestTask',
        error: error instanceof Error ? error.message : 'Unknown error',
        taskId,
      });
      throw error;
    }
  }

  /**
   * Fail daily digest task
   */
  async failDailyDigestTask(taskId: string, error: string) {
    try {
      const task = await this.prisma.daily_digest_cron_task.update({
        where: { id: taskId },
        data: {
          status: DailyDigestCronTaskStatus.FAILED,
          completedAt: new Date(),
          error: 'TASK_FAILED',
          errorMessage: error,
        },
      });

      logger.error('Daily digest task failed', {
        context: 'DailyDigestCronService.failDailyDigestTask',
        taskId,
        error,
      });

      return task;
    } catch (updateError) {
      logger.error('Failed to update failed task status', {
        context: 'DailyDigestCronService.failDailyDigestTask',
        error:
          updateError instanceof Error ? updateError.message : 'Unknown error',
        taskId,
        originalError: error,
      });
      throw updateError;
    }
  }

  /**
   * Process daily digest for all clients
   */
  async processDailyDigest() {
    try {
      // Get all active clients with their admin users
      const clients = await this.prisma.client.findMany({
        include: {
          clientUsers: {
            where: {
              user: {
                status: UserStatusEnum.ACTIVE,
                role: {
                  in: [UserRoleEnum.ADMIN],
                },
              },
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
          company: {
            select: {
              name: true,
            },
          },
        },
      });

      const digestData = [];

      // Process each client
      for (const client of clients) {
        // Only process clients that have admin users
        if (client.clientUsers && client.clientUsers.length > 0) {
          for (const clientUser of client.clientUsers) {
            try {
              const clientDigest = await this.processClientDigest(
                client,
                clientUser
              );
              if (clientDigest) {
                digestData.push(clientDigest);
              }
            } catch (error) {
              logger.error('Failed to process client digest', {
                context: 'DailyDigestCronService.processDailyDigest',
                clientId: client.id,
                clientUserId: clientUser.id,
                error,
              });
              // Continue with other client users
            }
          }
        }
      }

      return digestData;
    } catch (error) {
      logger.error('Failed to process daily digest', {
        context: 'DailyDigestCronService.processDailyDigest',
        error,
      });
      throw error;
    }
  }

  /**
   * Process digest for a specific client
   */
  private async processClientDigest(client: any, clientUser: any) {
    try {
      const now = new Date();
      const startOfDay = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const endOfDay = now;

      // Get all job postings for this client (excluding DRAFT and ARCHIVED)
      const jobPostings = await this.prisma.job_posting.findMany({
        where: {
          clientId: client.id,
          status: {
            in: [JobPostingStatusEnum.PUBLISHED, JobPostingStatusEnum.CLOSED],
          },
        },
        select: {
          id: true,
          title: true,
          status: true,
        },
      });

      if (jobPostings.length === 0) {
        return null; // No job postings to process
      }

      const jobPostingsWithRecommendations = [];

      // Process each job posting
      for (const jobPosting of jobPostings) {
        const recommendations =
          await this.prisma.job_posting_recommendation.findMany({
            where: {
              jobPostingId: jobPosting.id,
              status: JobRecommendationStatusEnum.ACTIVE,
              isInvited: false,
              createdAt: {
                gte: startOfDay,
                lt: endOfDay,
              },
            },
            include: {
              candidate: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      image: true,
                    },
                  },
                  resume: {
                    select: {
                      currentJobTitle: true,
                    },
                  },
                  onboardingAssessments: {
                    select: {
                      recommendation: true,
                    },
                    take: 1,
                    orderBy: {
                      createdAt: 'desc',
                    },
                  },
                },
              },
            },
            orderBy: {
              score: 'desc',
            },
            take: 5, // Top 5 candidates
          });

        // Transform recommendations with pre-signed URLs for images
        const todaysCandidates = await Promise.all(
          recommendations.map(async (rec) => {
            let profileImage = rec.candidate.user.image;

            if (profileImage && !profileImage.startsWith('http')) {
              try {
                profileImage = await this.storageService.generatePreSignedUrl(
                  profileImage,
                  'read'
                );
              } catch (error) {
                logger.warn(
                  'Failed to generate pre-signed URL for candidate image',
                  {
                    context: 'DailyDigestCronService.processClientDigest',
                    candidateId: rec.candidate.id,
                    imagePath: profileImage,
                    error:
                      error instanceof Error ? error.message : 'Unknown error',
                  }
                );
              }
            }

            return {
              id: rec.candidate.id,
              name: rec.candidate.user.name || 'Unknown',
              image: profileImage,
              currentJobTitle: rec.candidate.resume?.currentJobTitle,
              score: rec.score,
              matchReason: rec.matchReason || [],
              onboardingRecommendation: (
                rec.candidate.onboardingAssessments?.[0]?.recommendation ||
                'RECOMMENDED'
              )
                .split('_')
                .map(
                  (word) =>
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                )
                .join(' '),
            };
          })
        );

        logger.info('Processing job posting recommendations', {
          context: 'DailyDigestCronService.processClientDigest',
          jobPostingId: jobPosting.id,
          jobTitle: jobPosting.title,
          totalRecommendations: recommendations.length,
          candidatesToShow: todaysCandidates.length,
        });

        jobPostingsWithRecommendations.push({
          id: jobPosting.id,
          title: jobPosting.title,
          status: jobPosting.status,
          totalRecommendations: recommendations.length,
          todaysCandidates,
        });
      }

      // Always return client data regardless of recommendations
      return {
        clientId: client.id,
        clientName: client.company?.name || 'Unknown Company',
        clientEmail: clientUser.user.email,
        clientUserName: clientUser.user.name || 'Admin',
        jobPostings: jobPostingsWithRecommendations,
      };
    } catch (error) {
      logger.error('Failed to process client digest', {
        context: 'DailyDigestCronService.processClientDigest',
        clientId: client.id,
        error,
      });
      return null;
    }
  }

  /**
   * Send daily digest emails to client admins
   */
  async sendDailyDigestEmails(digestData: any[]) {
    try {
      const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Send emails to each client with CC recipients
      const emailPromises = digestData.map(async (clientData) => {
        try {
          const dashboardUrl = `${ENV.FRONTEND_URL}/app/client/dashboard`;

          // Use the email template
          const emailTemplate = new DailyDigestEmailTemplate({
            name: clientData.clientUserName,
            date: today,
            clientName: clientData.clientName,
            jobPostings: clientData.jobPostings,
            dashboardUrl,
          });

          const { subject, html } = emailTemplate.render();

          // Send email to client with CC recipients
          await this.notificationProvider.sendEmail({
            from: ENV.SMTP_FROM_EMAIL || 'noreply@teamcast.ai',
            to: clientData.clientEmail,
            cc: DAILY_DIGEST_CC_EMAILS,
            subject,
            html,
          });

          logger.info('Daily digest email sent to client with CC', {
            context: 'DailyDigestCronService.sendDailyDigestEmails',
            clientId: clientData.clientId,
            email: clientData.clientEmail,
            cc: DAILY_DIGEST_CC_EMAILS,
          });
        } catch (error) {
          logger.error('Failed to send daily digest email to client', {
            context: 'DailyDigestCronService.sendDailyDigestEmails',
            clientId: clientData.clientId,
            email: clientData.clientEmail,
            error,
          });
        }
      });

      await Promise.allSettled(emailPromises);

      logger.info('Daily digest emails sent to clients', {
        context: 'DailyDigestCronService.sendDailyDigestEmails',
        totalClients: digestData.length,
      });
    } catch (error) {
      logger.error('Failed to send daily digest emails', {
        context: 'DailyDigestCronService.sendDailyDigestEmails',
        error,
      });
      throw error;
    }
  }
}
