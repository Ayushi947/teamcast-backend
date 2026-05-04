import { PrismaClient } from '@prisma/client';
import { singleton } from '@/shared/decorators/singleton';
import { logger } from '@/shared/utils/logger';
import { DailyStatsCronTaskStatus } from '@/shared/models/domain/cron/daily.stats.domain';
import { INotificationProvider } from '@/services/notification/notification.interface';
import { NotificationFactory } from '@/services/notification/notification.factory';
import { ENV } from '@/config/env';
import { DailyStatsEmailTemplate } from '@/templates/email/daily.stats.template';
import { DailyStatsProcessor } from '@/services/queue/processors/daily.stats.processor';
import {
  UserRoleEnum,
  JobPostingStatusEnum,
  ApplicationStatusEnum,
  SupportInvitationStatusEnum,
  OnboardingAssessmentRecommendationEnum,
  JobPostingAssessmentRecommendationEnum,
  PartnerUserInvitationStatusEnum,
  SupportInvitationImportStatusEnum,
  JobInviteStatusEnum,
} from '@/shared/models/common/enums';
import { IPaginationRequest } from '@/shared/models/api/common/common.api';
import { getPaginationInfo } from '@/utils/pagination';

const DAILY_STATS_CC_EMAILS = [
  'john@teamcast.ai',
  'yogi@teamcast.ai',
  'utkarsh@teamcast.ai',
  'vijay@teamcast.ai',
];

@singleton
export class DailyStatsCronService {
  private readonly prisma: PrismaClient;
  private readonly notificationProvider: INotificationProvider;
  private readonly dailyStatsProcessor: DailyStatsProcessor;

  constructor() {
    this.prisma = new PrismaClient();
    this.notificationProvider =
      new NotificationFactory().getNotificationProvider();
    this.dailyStatsProcessor = new DailyStatsProcessor(this);

    // Initialize queue workers
    this.dailyStatsProcessor.setupWorkers();
  }

  /**
   * Start a new daily stats task
   */
  async startDailyStatsTask() {
    try {
      // Create a new task
      const task = await this.prisma.daily_stats_cron_task.create({
        data: {
          status: DailyStatsCronTaskStatus.PENDING,
          startedAt: new Date(),
        },
      });

      // Start processing in background using queue
      await this.dailyStatsProcessor.addDailyStatsJob(task.id);

      logger.info('Daily stats task started', {
        context: 'DailyStatsCronService.startDailyStatsTask',
        taskId: task.id,
      });

      return task;
    } catch (error) {
      logger.error('Failed to start daily stats task', {
        context: 'DailyStatsCronService.startDailyStatsTask',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get a specific daily stats task
   */
  async getTask(taskId: string) {
    return await this.prisma.daily_stats_cron_task.findUnique({
      where: { id: taskId },
    });
  }

  /**
   * Get all daily stats tasks with filtering and pagination
   */
  async getAllTasks(
    filter: { status?: DailyStatsCronTaskStatus },
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
      const total = await this.prisma.daily_stats_cron_task.count({
        where,
      });

      // Get paginated results
      const tasks = await this.prisma.daily_stats_cron_task.findMany({
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
      logger.error('Failed to get daily stats tasks', {
        context: 'DailyStatsCronService.listDailyStatsTasks',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Update task status
   */
  async updateTaskStatus(taskId: string, status: DailyStatsCronTaskStatus) {
    const updateData: any = { status };
    if (status === DailyStatsCronTaskStatus.IN_PROGRESS) {
      updateData.startedAt = new Date();
    }

    return await this.prisma.daily_stats_cron_task.update({
      where: { id: taskId },
      data: updateData,
    });
  }

  /**
   * Complete daily stats task
   */
  async completeDailyStatsTask(
    taskId: string,
    _candidateStats: any,
    _clientStats: any
  ) {
    return await this.prisma.daily_stats_cron_task.update({
      where: { id: taskId },
      data: {
        status: DailyStatsCronTaskStatus.COMPLETED,
        completedAt: new Date(),
      },
    });
  }

  /**
   * Fail daily stats task
   */
  async failDailyStatsTask(taskId: string, error: string) {
    return await this.prisma.daily_stats_cron_task.update({
      where: { id: taskId },
      data: {
        status: DailyStatsCronTaskStatus.FAILED,
        completedAt: new Date(),
        error: 'TASK_FAILED',
        errorMessage: error,
      },
    });
  }

  /**
   * Process candidate statistics
   */
  async processCandidateStats() {
    try {
      // Calculate time range: from 24 hours ago to now (when cron job runs)
      const now = new Date();
      const startOfDay = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const endOfDay = now;

      // Get support invitations (created today)
      const supportInvitations = await this.prisma.support_invitation.findMany({
        where: {
          createdAt: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
      });

      // Get partner invitations (created today, filter by PARTNER_RESOURCE role)
      const partnerInvitations =
        await this.prisma.partner_user_invitation.findMany({
          where: {
            role: UserRoleEnum.PARTNER_RESOURCE,
            createdAt: {
              gte: startOfDay,
              lt: endOfDay,
            },
          },
        });

      // Get support invitation imports (created today)
      const supportImports =
        await this.prisma.support_invitation_import.findMany({
          where: {
            createdAt: {
              gte: startOfDay,
              lt: endOfDay,
            },
          },
        });

      // Get job invites (created today)
      const jobInvites = await this.prisma.job_invite.findMany({
        where: {
          createdAt: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
      });

      // Get onboarding assessments (created today)
      const onboardingAssessments =
        await this.prisma.onboarding_assessment.findMany({
          where: {
            createdAt: {
              gte: startOfDay,
              lt: endOfDay,
            },
          },
        });

      // Get job AI assessments (created today)
      const jobAiAssessments = await this.prisma.job_ai_assessment.findMany({
        where: {
          createdAt: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
      });

      // Calculate invitation statistics
      const invitationStats = {
        supportInvitations: this.calculateInvitationStats(
          supportInvitations,
          'status'
        ),
        partnerInvitations: this.calculateInvitationStats(
          partnerInvitations,
          'partner_user_invitation_status'
        ),
        supportImports: this.calculateInvitationStats(
          supportImports,
          'support_invitation_import_status'
        ),
        jobInvites: this.calculateInvitationStats(
          jobInvites,
          'job_invite_status'
        ),
      };

      // Calculate assessment statistics - only recommendations
      const assessmentStats = {
        onboardingAssessment: this.calculateAssessmentRecommendations(
          onboardingAssessments
        ),
        jobAiAssessment:
          this.calculateJobAiAssessmentRecommendations(jobAiAssessments),
      };

      return {
        invitations: invitationStats,
        assessments: assessmentStats,
      };
    } catch (error) {
      logger.error('Failed to process candidate stats', {
        context: 'DailyStatsCronService.processCandidateStats',
        error,
      });
      throw error;
    }
  }

  /**
   * Process client statistics
   */
  async processClientStats() {
    try {
      // Calculate time range: from 24 hours ago to now (when cron job runs)
      const now = new Date();
      const startOfDay = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const endOfDay = now;

      // Get total clients
      const totalClients = await this.prisma.client.count();

      // Get job postings created in last 24 hours
      const jobPostingsCreatedToday = await this.prisma.job_posting.findMany({
        where: {
          createdAt: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
      });

      // Count job postings by status (only those created in last 24 hours)
      const jobPostingStats = {
        draft: jobPostingsCreatedToday.filter(
          (jp) => jp.status === JobPostingStatusEnum.DRAFT
        ).length,
        published: jobPostingsCreatedToday.filter(
          (jp) => jp.status === JobPostingStatusEnum.PUBLISHED
        ).length,
        closed: jobPostingsCreatedToday.filter(
          (jp) => jp.status === JobPostingStatusEnum.CLOSED
        ).length,
        archived: jobPostingsCreatedToday.filter(
          (jp) => jp.status === JobPostingStatusEnum.ARCHIVED
        ).length,
        total: jobPostingsCreatedToday.length,
      };

      // Get applications created in last 24 hours
      const applicationsCreatedToday =
        await this.prisma.job_application.findMany({
          where: {
            createdAt: {
              gte: startOfDay,
              lt: endOfDay,
            },
          },
        });

      // Count applications by status (only those created in last 24 hours)
      const applicationStats = {
        draft: applicationsCreatedToday.filter(
          (app) => app.status === ApplicationStatusEnum.DRAFT
        ).length,
        invited: applicationsCreatedToday.filter(
          (app) => app.status === ApplicationStatusEnum.INVITED
        ).length,
        applied: applicationsCreatedToday.filter(
          (app) => app.status === ApplicationStatusEnum.APPLIED
        ).length,
        reviewing: applicationsCreatedToday.filter(
          (app) => app.status === ApplicationStatusEnum.REVIEWING
        ).length,
        shortlisted: applicationsCreatedToday.filter(
          (app) => app.status === ApplicationStatusEnum.SHORTLISTED
        ).length,
        assessing: applicationsCreatedToday.filter(
          (app) => app.status === ApplicationStatusEnum.ASSESSING
        ).length,
        offered: applicationsCreatedToday.filter(
          (app) => app.status === ApplicationStatusEnum.OFFERED
        ).length,
        accepted: applicationsCreatedToday.filter(
          (app) => app.status === ApplicationStatusEnum.ACCEPTED
        ).length,
        failed: applicationsCreatedToday.filter(
          (app) => app.status === ApplicationStatusEnum.FAILED
        ).length,
        rejected: applicationsCreatedToday.filter(
          (app) => app.status === ApplicationStatusEnum.REJECTED
        ).length,
        withdrawn: applicationsCreatedToday.filter(
          (app) => app.status === ApplicationStatusEnum.WITHDRAWN
        ).length,
        declined: applicationsCreatedToday.filter(
          (app) => app.status === ApplicationStatusEnum.DECLINED
        ).length,
        total: applicationsCreatedToday.length,
      };

      return {
        totalClients,
        jobPostings: jobPostingStats,
        applications: applicationStats,
      };
    } catch (error) {
      logger.error('Failed to process client stats', {
        context: 'DailyStatsCronService.processClientStats',
        error,
      });
      throw error;
    }
  }

  /**
   * Send daily stats emails to the team
   */
  async sendDailyStatsEmails(candidateStats: any, clientStats: any) {
    try {
      const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const dashboardUrl = `${ENV.FRONTEND_URL}/app/support/dashboard`;

      try {
        // Use the email template with a generic name since it's going to multiple recipients
        const emailTemplate = new DailyStatsEmailTemplate({
          name: 'Team',
          date: today,
          candidateStats,
          clientStats,
          dashboardUrl,
        });

        const { subject, html } = emailTemplate.render();

        // Send email directly to the 3 team members
        await this.notificationProvider.sendEmail({
          from: ENV.SMTP_FROM_EMAIL || 'noreply@teamcast.ai',
          to: DAILY_STATS_CC_EMAILS,
          subject,
          html,
        });

        logger.info('Daily stats email sent to team members', {
          context: 'DailyStatsCronService.sendDailyStatsEmails',
          recipients: DAILY_STATS_CC_EMAILS,
          totalRecipients: DAILY_STATS_CC_EMAILS.length,
        });
      } catch (error) {
        logger.error('Failed to send daily stats email', {
          context: 'DailyStatsCronService.sendDailyStatsEmails',
          recipients: DAILY_STATS_CC_EMAILS,
          error,
        });
        throw error;
      }

      logger.info('Daily stats emails sent to team members', {
        context: 'DailyStatsCronService.sendDailyStatsEmails',
        totalRecipients: DAILY_STATS_CC_EMAILS.length,
      });
    } catch (error) {
      logger.error('Failed to send daily stats emails', {
        context: 'DailyStatsCronService.sendDailyStatsEmails',
        error,
      });
      throw error;
    }
  }

  // Email templating is now handled by DailyStatsEmailTemplate in src/templates/email/daily.stats.template.ts

  /**
   * Calculate invitation statistics
   */
  private calculateInvitationStats(invitations: any[], statusField: string) {
    const total = invitations.length;

    // Handle different invitation types based on the status field
    if (statusField === 'status') {
      // For support invitations and partner invitations
      const pending = invitations.filter(
        (inv) => inv[statusField] === SupportInvitationStatusEnum.PENDING
      ).length;
      const accepted = invitations.filter(
        (inv) => inv[statusField] === SupportInvitationStatusEnum.ACCEPTED
      ).length;
      const expired = invitations.filter(
        (inv) => inv[statusField] === SupportInvitationStatusEnum.EXPIRED
      ).length;
      const withdrawn = invitations.filter(
        (inv) => inv[statusField] === SupportInvitationStatusEnum.WITHDRAWN
      ).length;
      const resend = invitations.filter(
        (inv) => inv[statusField] === SupportInvitationStatusEnum.RESEND
      ).length;

      return {
        pending,
        accepted,
        expired,
        withdrawn,
        resend,
        total,
      };
    } else if (statusField === 'partner_user_invitation_status') {
      // For partner user invitations
      const pending = invitations.filter(
        (inv) => inv[statusField] === PartnerUserInvitationStatusEnum.PENDING
      ).length;
      const accepted = invitations.filter(
        (inv) => inv[statusField] === PartnerUserInvitationStatusEnum.ACCEPTED
      ).length;
      const expired = invitations.filter(
        (inv) => inv[statusField] === PartnerUserInvitationStatusEnum.EXPIRED
      ).length;
      const withdrawn = invitations.filter(
        (inv) => inv[statusField] === PartnerUserInvitationStatusEnum.WITHDRAWN
      ).length;

      return {
        pending,
        accepted,
        expired,
        withdrawn,
        total,
      };
    } else if (statusField === 'support_invitation_import_status') {
      // For support invitation imports
      const pending = invitations.filter(
        (inv) => inv[statusField] === SupportInvitationImportStatusEnum.PENDING
      ).length;
      const processed = invitations.filter(
        (inv) =>
          inv[statusField] === SupportInvitationImportStatusEnum.PROCESSED
      ).length;
      const invited = invitations.filter(
        (inv) => inv[statusField] === SupportInvitationImportStatusEnum.INVITED
      ).length;
      const duplicate = invitations.filter(
        (inv) =>
          inv[statusField] === SupportInvitationImportStatusEnum.DUPLICATE
      ).length;
      const failed = invitations.filter(
        (inv) => inv[statusField] === SupportInvitationImportStatusEnum.FAILED
      ).length;
      const accepted = invitations.filter(
        (inv) => inv[statusField] === SupportInvitationImportStatusEnum.ACCEPTED
      ).length;

      return {
        pending,
        processed,
        invited,
        duplicate,
        failed,
        accepted,
        total,
      };
    } else if (statusField === 'job_invite_status') {
      // For job invites
      const pending = invitations.filter(
        (inv) => inv[statusField] === JobInviteStatusEnum.PENDING
      ).length;
      const accepted = invitations.filter(
        (inv) => inv[statusField] === JobInviteStatusEnum.ACCEPTED
      ).length;
      const declined = invitations.filter(
        (inv) => inv[statusField] === JobInviteStatusEnum.DECLINED
      ).length;
      const cancelled = invitations.filter(
        (inv) => inv[statusField] === JobInviteStatusEnum.CANCELLED
      ).length;
      const expired = invitations.filter(
        (inv) => inv[statusField] === JobInviteStatusEnum.EXPIRED
      ).length;
      const withdrawn = invitations.filter(
        (inv) => inv[statusField] === JobInviteStatusEnum.WITHDRAWN
      ).length;

      return {
        pending,
        accepted,
        declined,
        cancelled,
        expired,
        withdrawn,
        total,
      };
    }

    // Default fallback
    return {
      pending: 0,
      accepted: 0,
      expired: 0,
      withdrawn: 0,
      total,
    };
  }

  /**
   * Calculate onboarding assessment recommendations only
   */
  private calculateAssessmentRecommendations(assessments: any[]) {
    // Only return recommendations
    const highlyRecommended = assessments.filter(
      (ass) =>
        ass.recommendation ===
        OnboardingAssessmentRecommendationEnum.HIGHLY_RECOMMENDED
    ).length;
    const recommended = assessments.filter(
      (ass) =>
        ass.recommendation ===
        OnboardingAssessmentRecommendationEnum.RECOMMENDED
    ).length;
    const notRecommended = assessments.filter(
      (ass) =>
        ass.recommendation ===
        OnboardingAssessmentRecommendationEnum.NOT_RECOMMENDED
    ).length;

    return {
      highlyRecommended,
      recommended,
      notRecommended,
    };
  }

  /**
   * Calculate job AI assessment recommendations only
   */
  private calculateJobAiAssessmentRecommendations(assessments: any[]) {
    // Only return recommendations
    const highlyRecommended = assessments.filter(
      (ass) =>
        ass.recommendation ===
        JobPostingAssessmentRecommendationEnum.HIGHLY_RECOMMENDED
    ).length;
    const recommended = assessments.filter(
      (ass) =>
        ass.recommendation ===
        JobPostingAssessmentRecommendationEnum.RECOMMENDED
    ).length;
    const notRecommended = assessments.filter(
      (ass) =>
        ass.recommendation ===
        JobPostingAssessmentRecommendationEnum.NOT_RECOMMENDED
    ).length;

    return {
      highlyRecommended,
      recommended,
      notRecommended,
    };
  }
}
