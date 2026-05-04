import { PrismaClient } from '@prisma/client';
import { singleton } from '@/shared/decorators/singleton';
import {
  IFeedbackEmailCronTask,
  FeedbackEmailTaskCronStatus,
  FeedbackEmailTaskType,
  toFeedbackEmailCronTask,
  toFeedbackEmailCronTaskList,
  IFeedbackEmailCronTaskFilterQuery,
} from '@/shared/models/domain/cron/feedback.email.cron.domain';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import {
  IPaginationRequest,
  IPaginatedResponse,
} from '@/shared/models/api/common/common.api';
import { getPaginationInfo } from '@/utils/pagination';
import { FeedbackEmailCronProcessor } from '../queue/processors/feedback.email.cron.processor';
import { ENV } from '@/config/env';
import { NotificationFactory } from '../notification/notification.factory';
import { INotificationProvider } from '../notification/notification.interface';
import {
  JobPanelAssessmentStatusEnum,
  UserTypeEnum,
  JobPanelAssessmentFeedbackDecisionEnum,
  JobPanelAssessmentRecommendationEnum,
} from '@/shared/models/common/enums';
import { toIAuthUser } from '@/shared/models/domain/auth/auth.user.domain';
import { getAuthToken } from '@/utils/generate.token';
import { CandidatePanelAssessmentService } from '../candidate/job.panel.assessment.service';

@singleton
export class FeedbackEmailCronService {
  private readonly prisma: PrismaClient;
  private readonly notificationProvider: INotificationProvider;
  private readonly feedbackEmailCronProcessor: FeedbackEmailCronProcessor;
  private readonly panelAssessmentService: CandidatePanelAssessmentService;

  constructor() {
    this.prisma = new PrismaClient();
    this.notificationProvider =
      new NotificationFactory().getNotificationProvider();
    this.feedbackEmailCronProcessor = new FeedbackEmailCronProcessor(this);
    this.panelAssessmentService = new CandidatePanelAssessmentService(
      this.notificationProvider
    );
    if (ENV.ENABLE_BULLMQ_WORKERS) {
      this.feedbackEmailCronProcessor.setupWorkers();
    }
    logger.info(
      'Feedback email cron service initialized with BullMQ integration',
      {
        context: 'FeedbackEmailCronService.constructor',
      }
    );
  }

  /**
   * Start a new feedback email task
   */
  async startFeedbackEmailTask(
    type: FeedbackEmailTaskType
  ): Promise<IFeedbackEmailCronTask> {
    try {
      // Create a new task
      const task = await this.prisma.feedback_email_task_cron.create({
        data: {
          id: uuidv4(),
          type,
          status: FeedbackEmailTaskCronStatus.PENDING,
          totalRecipients: 0,
          emailsSent: 0,
          failedEmails: 0,
          startedAt: new Date(),
        },
      });

      // Start processing in background using queue
      await this.feedbackEmailCronProcessor.addFeedbackEmailJob(task.id, type);

      return toFeedbackEmailCronTask(task);
    } catch (error) {
      logger.error({
        message: 'Failed to start feedback email task',
        context: 'FeedbackEmailCronService.startFeedbackEmailTask',
        error: error instanceof Error ? error.message : 'Unknown error',
        type,
      });
      throw error;
    }
  }

  /**
   * Get a feedback email task by ID
   */
  async getTask(taskId: string): Promise<IFeedbackEmailCronTask> {
    try {
      const task = await this.prisma.feedback_email_task_cron.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        throw new AppError('Task not found', 404, ErrorCode.NOT_FOUND);
      }

      return toFeedbackEmailCronTask(task);
    } catch (error) {
      logger.error({
        message: 'Failed to get feedback email task',
        context: 'FeedbackEmailCronService.getTask',
        error: error instanceof Error ? error.message : 'Unknown error',
        taskId,
      });
      throw error;
    }
  }

  /**
   * Get all feedback email tasks with pagination and filtering
   */
  async getAllTasks(
    filter: IFeedbackEmailCronTaskFilterQuery,
    paginationRequest: IPaginationRequest
  ): Promise<IPaginatedResponse<IFeedbackEmailCronTask>> {
    try {
      // Get pagination info
      const paginationInfo = getPaginationInfo(paginationRequest);

      // Build where clause based on filters
      const where = {
        ...(filter.status && { status: filter.status }),
        ...(filter.type && { type: filter.type }),
      };

      // Get total count for pagination
      const total = await this.prisma.feedback_email_task_cron.count({
        where,
      });

      // Get paginated results
      const tasks = await this.prisma.feedback_email_task_cron.findMany({
        where,
        skip: paginationInfo.skip,
        take: paginationInfo.take,
        orderBy: paginationInfo.orderBy,
      });

      // Convert to domain model
      const tasksDomain = toFeedbackEmailCronTaskList(tasks);

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
        message: 'Failed to get feedback email tasks',
        context: 'FeedbackEmailCronService.getAllTasks',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Send feedback request emails (public method for queue processor)
   */
  async sendFeedbackRequestEmails(cronTaskId: string): Promise<void> {
    try {
      logger.info({
        message: 'Processing feedback request emails',
        context: 'FeedbackEmailCronService.sendFeedbackRequestEmails',
        cronTaskId,
      });

      // Update task status to processing
      await this.prisma.feedback_email_task_cron.update({
        where: { id: cronTaskId },
        data: { status: FeedbackEmailTaskCronStatus.PROCESSING },
      });

      // Call the existing panel assessment feedback service
      const result = await this.doSendFeedbackRequestEmails();

      // Update task status to completed
      await this.prisma.feedback_email_task_cron.update({
        where: { id: cronTaskId },
        data: {
          status: FeedbackEmailTaskCronStatus.COMPLETED,
          totalRecipients: result.processedAssessments,
          emailsSent: result.emailsSent,
          failedEmails: result.errors,
          completedAt: new Date(),
        },
      });

      logger.info({
        message: 'Feedback request emails processed successfully',
        context: 'FeedbackEmailCronService.sendFeedbackRequestEmails',
        cronTaskId,
        result,
      });
    } catch (error) {
      // Update task status to failed
      await this.prisma.feedback_email_task_cron.update({
        where: { id: cronTaskId },
        data: {
          status: FeedbackEmailTaskCronStatus.FAILED,
          error: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        },
      });

      logger.error({
        message: 'Failed to process feedback request emails',
        context: 'FeedbackEmailCronService.sendFeedbackRequestEmails',
        error: error instanceof Error ? error.message : 'Unknown error',
        cronTaskId,
      });
      throw error;
    }
  }

  /**
   * Send feedback reminder emails (public method for queue processor)
   */
  async sendFeedbackReminderEmails(cronTaskId: string): Promise<void> {
    try {
      logger.info({
        message: 'Processing feedback reminder emails',
        context: 'FeedbackEmailCronService.sendFeedbackReminderEmails',
        cronTaskId,
      });

      // Update task status to processing
      await this.prisma.feedback_email_task_cron.update({
        where: { id: cronTaskId },
        data: { status: FeedbackEmailTaskCronStatus.PROCESSING },
      });

      // Call the existing panel assessment feedback service
      const result = await this.doSendFeedbackReminderEmails();

      // Update task status to completed
      await this.prisma.feedback_email_task_cron.update({
        where: { id: cronTaskId },
        data: {
          status: FeedbackEmailTaskCronStatus.COMPLETED,
          totalRecipients: result.processedFeedbacks,
          emailsSent: result.remindersSent,
          failedEmails: result.errors,
          completedAt: new Date(),
        },
      });

      logger.info({
        message: 'Feedback reminder emails processed successfully',
        context: 'FeedbackEmailCronService.sendFeedbackReminderEmails',
        cronTaskId,
        result,
      });
    } catch (error) {
      // Update task status to failed
      await this.prisma.feedback_email_task_cron.update({
        where: { id: cronTaskId },
        data: {
          status: FeedbackEmailTaskCronStatus.FAILED,
          error: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        },
      });

      logger.error({
        message: 'Failed to process feedback reminder emails',
        context: 'FeedbackEmailCronService.sendFeedbackReminderEmails',
        error: error instanceof Error ? error.message : 'Unknown error',
        cronTaskId,
      });
      throw error;
    }
  }

  /**
   * Send feedback request emails to panel members for completed assessments
   */
  private async doSendFeedbackRequestEmails(): Promise<{
    processedAssessments: number;
    emailsSent: number;
    errors: number;
  }> {
    try {
      logger.info('Starting panel assessment feedback email cron job', {
        context: 'PanelAssessmentFeedbackCronService.sendFeedbackRequestEmails',
      });

      let processedAssessments = 0;
      let emailsSent = 0;
      let errors = 0;

      // Find completed panel assessments that don't have feedback records created yet
      const completedAssessments =
        await this.prisma.job_panel_assessment.findMany({
          where: {
            status: JobPanelAssessmentStatusEnum.COMPLETED,
          },
          include: {
            slots: {
              where: {
                isSelected: true,
              },
            },
            feedback: true,
            jobApplication: {
              include: {
                jobPosting: {
                  include: {
                    client: {
                      include: {
                        company: true,
                      },
                    },
                  },
                },
                candidate: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        });

      for (const assessment of completedAssessments) {
        try {
          processedAssessments++;

          if (!assessment.slots || assessment.slots.length === 0) {
            logger.warn('No selected slot found for completed assessment', {
              context:
                'PanelAssessmentFeedbackCronService.sendFeedbackRequestEmails',
              assessmentId: assessment.id,
            });
            continue;
          }

          const selectedSlot = assessment.slots[0];
          const { panelMemberEmails, panelMemberNames } = selectedSlot;

          if (!panelMemberEmails || panelMemberEmails.length === 0) {
            logger.warn(
              'No panel member emails found for completed assessment',
              {
                context:
                  'PanelAssessmentFeedbackCronService.sendFeedbackRequestEmails',
                assessmentId: assessment.id,
              }
            );
            continue;
          }

          // Create feedback records and send emails for each panel member
          for (let i = 0; i < panelMemberEmails.length; i++) {
            const email = panelMemberEmails[i];
            const name = panelMemberNames[i] || 'Panel Member';

            try {
              // Check if feedback record already exists
              const existingFeedback =
                await this.prisma.job_panel_assessment_feedback.findFirst({
                  where: {
                    panelAssessmentId: assessment.id,
                    panelMemberEmail: email,
                  },
                });

              if (existingFeedback) {
                logger.debug('Feedback record already exists', {
                  context:
                    'PanelAssessmentFeedbackCronService.sendFeedbackRequestEmails',
                  assessmentId: assessment.id,
                  email,
                });
                continue;
              }

              // Check if panel member is internal (has user account in system)
              const internalUser = await this.prisma.user.findFirst({
                where: {
                  email,
                  type: UserTypeEnum.CLIENT,
                },
              });

              const isInternal = !!internalUser;
              const feedbackToken = uuidv4();

              // Create feedback URLs
              let feedbackUrl: string;
              if (isInternal) {
                const authUser = toIAuthUser(internalUser);
                const authToken = getAuthToken(authUser);
                // Internal users get authenticated dashboard link
                feedbackUrl = `${ENV.FRONTEND_URL}app/client/candidates/applications/${assessment.jobApplicationId}/feedback-form?panelAssessmentId=${assessment.id}&applicationId=${assessment.jobApplicationId}&token=${authToken?.accessToken}`;
              } else {
                // External users get tokenized link to HTML form (no authentication required)
                feedbackUrl = `${ENV.SERVER_URL}/api/client/panel-assessment/feedback/form/${feedbackToken}`;
              }

              // Create feedback record for external users
              if (!isInternal) {
                await this.prisma.job_panel_assessment_feedback.create({
                  data: {
                    panelAssessmentId: assessment.id,
                    panelMemberEmail: email,
                    panelMemberName: name,
                    detailedFeedback: '',
                    decision: JobPanelAssessmentFeedbackDecisionEnum.HIRE, // Default value, will be updated when submitted
                    recommendation:
                      JobPanelAssessmentRecommendationEnum.RECOMMENDED, // Default value, will be updated when submitted
                    isSubmitted: false,
                    feedbackToken,
                    feedbackLink: feedbackUrl,
                  },
                });
              }

              // Send feedback request email
              if (this.notificationProvider) {
                await this.notificationProvider.sendPanelAssessmentFeedbackRequestEmail(
                  email,
                  name,
                  assessment.jobApplication.candidate.user.name,
                  assessment.jobApplication.jobPosting.title,
                  assessment.jobApplication.jobPosting.client.company.name,
                  feedbackUrl,
                  isInternal,
                  72 // 72 hours to submit feedback
                );

                emailsSent++;
              }

              logger.info('Feedback request email sent', {
                context:
                  'PanelAssessmentFeedbackCronService.sendFeedbackRequestEmails',
                assessmentId: assessment.id,
                email,
                isInternal,
              });
            } catch (memberError) {
              errors++;
              logger.error('Failed to process panel member feedback request', {
                context:
                  'PanelAssessmentFeedbackCronService.sendFeedbackRequestEmails',
                error:
                  memberError instanceof Error
                    ? memberError.message
                    : 'Unknown error',
                assessmentId: assessment.id,
                email,
              });
            }
          }
        } catch (assessmentError) {
          errors++;
          logger.error('Failed to process assessment for feedback requests', {
            context:
              'PanelAssessmentFeedbackCronService.sendFeedbackRequestEmails',
            error:
              assessmentError instanceof Error
                ? assessmentError.message
                : 'Unknown error',
            assessmentId: assessment.id,
          });
        }
      }

      logger.info('Completed panel assessment feedback email cron job', {
        context: 'PanelAssessmentFeedbackCronService.sendFeedbackRequestEmails',
        processedAssessments,
        emailsSent,
        errors,
      });

      return {
        processedAssessments,
        emailsSent,
        errors,
      };
    } catch (error) {
      logger.error('Failed to run panel assessment feedback email cron job', {
        context: 'PanelAssessmentFeedbackCronService.sendFeedbackRequestEmails',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Send reminder emails to panel members who haven't submitted feedback
   */
  private async doSendFeedbackReminderEmails(): Promise<{
    processedFeedbacks: number;
    remindersSent: number;
    errors: number;
  }> {
    try {
      logger.info('Starting panel assessment feedback reminder cron job', {
        context:
          'PanelAssessmentFeedbackCronService.sendFeedbackReminderEmails',
      });

      let processedFeedbacks = 0;
      let remindersSent = 0;
      let errors = 0;

      // Find feedback records that are not submitted and were created 24-48 hours ago
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      const pendingFeedbacks =
        await this.prisma.job_panel_assessment_feedback.findMany({
          where: {
            isSubmitted: false,
            createdAt: {
              gte: fortyEightHoursAgo,
              lte: twentyFourHoursAgo,
            },
          },
          include: {
            panelAssessment: {
              include: {
                jobApplication: {
                  include: {
                    jobPosting: {
                      include: {
                        client: {
                          include: {
                            company: true,
                          },
                        },
                      },
                    },
                    candidate: {
                      include: {
                        user: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

      for (const feedback of pendingFeedbacks) {
        try {
          processedFeedbacks++;

          const assessment = feedback.panelAssessment;

          // Calculate remaining hours (assuming 72 hour deadline)
          const createdAt = feedback.createdAt;
          const deadline = new Date(createdAt.getTime() + 72 * 60 * 60 * 1000);
          const remainingHours = Math.max(
            0,
            Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60))
          );

          if (remainingHours <= 0) {
            // Feedback deadline has passed, skip reminder
            continue;
          }

          // Send reminder email
          if (this.notificationProvider && feedback.feedbackLink) {
            await this.notificationProvider.sendPanelAssessmentFeedbackReminderEmail(
              feedback.panelMemberEmail,
              feedback.panelMemberName,
              assessment.jobApplication.candidate.user.name,
              assessment.jobApplication.jobPosting.title,
              assessment.jobApplication.jobPosting.client.company.name,
              feedback.feedbackLink,
              remainingHours
            );

            remindersSent++;

            logger.info('Feedback reminder email sent', {
              context:
                'PanelAssessmentFeedbackCronService.sendFeedbackReminderEmails',
              feedbackId: feedback.id,
              email: feedback.panelMemberEmail,
              remainingHours,
            });
          }
        } catch (feedbackError) {
          errors++;
          logger.error('Failed to send feedback reminder', {
            context:
              'PanelAssessmentFeedbackCronService.sendFeedbackReminderEmails',
            error:
              feedbackError instanceof Error
                ? feedbackError.message
                : 'Unknown error',
            feedbackId: feedback.id,
          });
        }
      }

      logger.info('Completed panel assessment feedback reminder cron job', {
        context:
          'PanelAssessmentFeedbackCronService.sendFeedbackReminderEmails',
        processedFeedbacks,
        remindersSent,
        errors,
      });

      return {
        processedFeedbacks,
        remindersSent,
        errors,
      };
    } catch (error) {
      logger.error(
        'Failed to run panel assessment feedback reminder cron job',
        {
          context:
            'PanelAssessmentFeedbackCronService.sendFeedbackReminderEmails',
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );
      throw error;
    }
  }

  /**
   * Update panel assessment statuses based on timing (public method for queue processor)
   */
  async updatePanelAssessmentStatuses(cronTaskId: string): Promise<void> {
    try {
      logger.info({
        message: 'Processing panel assessment status updates',
        context: 'FeedbackEmailCronService.updatePanelAssessmentStatuses',
        cronTaskId,
      });

      // Update task status to processing
      await this.prisma.feedback_email_task_cron.update({
        where: { id: cronTaskId },
        data: { status: FeedbackEmailTaskCronStatus.PROCESSING },
      });

      // Call the panel assessment service to update statuses
      const result = await this.doUpdatePanelAssessmentStatuses();

      // Update task status to completed
      await this.prisma.feedback_email_task_cron.update({
        where: { id: cronTaskId },
        data: {
          status: FeedbackEmailTaskCronStatus.COMPLETED,
          totalRecipients: result.totalAssessments,
          emailsSent: result.updatedAssessments,
          failedEmails: result.errors,
          completedAt: new Date(),
        },
      });

      logger.info({
        message: 'Panel assessment status updates processed successfully',
        context: 'FeedbackEmailCronService.updatePanelAssessmentStatuses',
        cronTaskId,
        result,
      });
    } catch (error) {
      // Update task status to failed
      await this.prisma.feedback_email_task_cron.update({
        where: { id: cronTaskId },
        data: {
          status: FeedbackEmailTaskCronStatus.FAILED,
          error: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        },
      });

      logger.error({
        message: 'Failed to process panel assessment status updates',
        context: 'FeedbackEmailCronService.updatePanelAssessmentStatuses',
        error: error instanceof Error ? error.message : 'Unknown error',
        cronTaskId,
      });
      throw error;
    }
  }

  /**
   * Update panel assessment statuses based on slot timing
   */
  private async doUpdatePanelAssessmentStatuses(): Promise<{
    totalAssessments: number;
    updatedAssessments: number;
    errors: number;
  }> {
    try {
      logger.info('Starting panel assessment status update cron job', {
        context: 'FeedbackEmailCronService.doUpdatePanelAssessmentStatuses',
      });

      let totalAssessments = 0;
      let updatedAssessments = 0;
      let errors = 0;

      // Get all panel assessments that have selected slots and are not in final states
      const panelAssessments = await this.prisma.job_panel_assessment.findMany({
        where: {
          status: {
            notIn: [
              JobPanelAssessmentStatusEnum.COMPLETED,
              JobPanelAssessmentStatusEnum.FAILED,
              JobPanelAssessmentStatusEnum.CANCELLED,
            ],
          },
        },
        include: {
          slots: {
            where: { isSelected: true },
          },
        },
      });

      totalAssessments = panelAssessments.length;

      // Update each assessment individually
      for (const assessment of panelAssessments) {
        try {
          const result =
            await this.panelAssessmentService.updatePanelAssessmentStatusByTiming(
              assessment.id
            );

          if (result.updated) {
            updatedAssessments++;
            logger.info('Panel assessment status updated', {
              context:
                'FeedbackEmailCronService.doUpdatePanelAssessmentStatuses',
              assessmentId: assessment.id,
              previousStatus: result.previousStatus,
              newStatus: result.newStatus,
            });
          }
        } catch (assessmentError) {
          errors++;
          logger.error('Failed to update panel assessment status', {
            context: 'FeedbackEmailCronService.doUpdatePanelAssessmentStatuses',
            error:
              assessmentError instanceof Error
                ? assessmentError.message
                : 'Unknown error',
            assessmentId: assessment.id,
          });
        }
      }

      logger.info('Completed panel assessment status update cron job', {
        context: 'FeedbackEmailCronService.doUpdatePanelAssessmentStatuses',
        totalAssessments,
        updatedAssessments,
        errors,
      });

      return {
        totalAssessments,
        updatedAssessments,
        errors,
      };
    } catch (error) {
      logger.error('Failed to run panel assessment status update cron job', {
        context: 'FeedbackEmailCronService.doUpdatePanelAssessmentStatuses',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
