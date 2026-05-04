import { singleton } from '@/shared/decorators/singleton';
import { PrismaClient } from '@prisma/client';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';
import { ENV } from '@/config/env';
import {
  ISupportJobPostingInvite,
  ISupportJobPostingInviteFilterQuery,
  toSupportJobPostingInviteDomain,
} from '@/shared/models/domain/support/job.posting.invite.domain';
import {
  ISupportJobInviteApiRequest,
  ISupportJobInviteSimpleResponse,
} from '@/shared/models/api/support/job.posting.invite.api';
import { INotificationProvider } from '@/services/notification/notification.interface';
import {
  IPaginatedResponse,
  IPaginationRequest,
} from '@/shared/models/api/common/common.api';
import {
  buildQueryConditions,
  ISearchConfig,
  IFilterConfig,
  ISortConfig,
} from '@/utils/pagination';
import {
  JobInviteStatusEnum,
  SupportJobInviteStatusEnum,
} from '@/shared/models/common/enums';

@singleton
export class SupportJobPostingInviteService {
  private readonly prisma: PrismaClient;
  private readonly invitationExpiryHours = 72; // 3 days
  private readonly searchConfig: ISearchConfig = {
    searchableFields: ['email', 'name'],
  };

  private readonly filterConfig: IFilterConfig = {
    allowedFields: ['email', 'name', 'status', 'jobId'],
    arrayFields: [],
    enumFields: ['status'],
    enumRelationFields: {},
  };

  private readonly sortConfig: ISortConfig = {
    allowedFields: [
      'email',
      'name',
      'status',
      'jobId',
      'createdAt',
      'updatedAt',
      'expiresAt',
    ],
    defaultSort: { field: 'createdAt', order: 'desc' },
  };

  constructor(private readonly notificationProvider: INotificationProvider) {
    this.prisma = new PrismaClient();
  }

  /**
   * Generate invitation URL for a given invite ID and email
   */
  private generateInvitationUrl(inviteId: string, email: string): string {
    return `${ENV.FRONTEND_URL}/app/candidate/signup?inviteId=${inviteId}&email=${encodeURIComponent(email)}`;
  }

  async createSupportJobPostingInvite(
    data: ISupportJobInviteApiRequest,
    supportUserId: string
  ): Promise<ISupportJobInviteSimpleResponse[]> {
    const { candidates, jobTitle, jobId } = data;
    const results: ISupportJobInviteSimpleResponse[] = [];

    const jobPosting = await this.prisma.job_posting.findUnique({
      where: { id: jobId },
    });

    if (!jobPosting) {
      throw new AppError('Job posting not found', 404, ErrorCode.NOT_FOUND);
    }

    for (const candidate of candidates) {
      const { name, email } = candidate;
      try {
        const inviteUser = await this.prisma.user.findUnique({
          where: { email },
        });

        if (inviteUser) {
          throw new AppError(
            `User ${email} already exists`,
            400,
            ErrorCode.INVALID_REQUEST
          );
        }

        // Create the support_user_job_posting_invite record
        const expiresAt = new Date(
          Date.now() + this.invitationExpiryHours * 60 * 60 * 1000
        );

        const inviteExists = await this.prisma.job_invite.findFirst({
          where: {
            email,
            jobId,
            inviterId: supportUserId,
            status: JobInviteStatusEnum.PENDING,
            isSupportInvite: true, // Check for support invites only
          },
        });

        if (inviteExists) {
          throw new AppError(
            `Invite already exists for ${email}`,
            404,
            ErrorCode.NOT_FOUND
          );
        }

        // TODO: Update this once the Prisma schema is updated
        const invite = await this.prisma.job_invite.create({
          data: {
            email,
            name,
            jobId,
            inviterId: supportUserId,
            status: JobInviteStatusEnum.PENDING,
            isSupportInvite: true,
            expiresAt,
          },
        });

        const supportUser = await this.prisma.support_user.findUnique({
          where: { id: supportUserId },
          include: { user: true },
        });

        const jobPosting = await this.prisma.job_posting.findUnique({
          where: { id: jobId },
          include: {
            client: {
              include: { company: true },
            },
          },
        });

        if (
          !supportUser ||
          !jobPosting ||
          !jobPosting.client ||
          !jobPosting.client.company
        ) {
          throw new AppError(
            'Job or company not found',
            404,
            ErrorCode.NOT_FOUND
          );
        }

        const companyName = jobPosting.client.company.name;
        const inviterName = supportUser?.user?.name || 'Hiring Manager';
        const inviteUrl = this.generateInvitationUrl(invite.id, email);

        await this.notificationProvider.sendSupportJobPostingInviteEmail(
          email,
          name,
          inviterName,
          jobTitle,
          companyName,
          inviteUrl,
          this.invitationExpiryHours
        );

        results.push({
          id: invite.id,
          status: SupportJobInviteStatusEnum.PENDING,
          message: 'Support user invited successfully',
        });
      } catch (error: any) {
        throw new AppError(
          `Failed to invite support user: ${error?.message || 'Unknown error'}`,
          400,
          ErrorCode.INVALID_REQUEST
        );
      }
    }

    return results;
  }

  async getJobPostingInvitesBySupportUserId(
    supportUserId: string,
    filter: ISupportJobPostingInviteFilterQuery,
    paginationRequest: IPaginationRequest
  ): Promise<IPaginatedResponse<ISupportJobPostingInvite>> {
    try {
      logger.info({
        message: 'Listing support job posting invites',
        context:
          'SupportJobPostingInviteService.getJobPostingInvitesBySupportUserId',
        filter,
        paginationRequest,
      });

      // Build query conditions using the generic pagination utilities
      const queryConditions = buildQueryConditions(filter, paginationRequest, {
        search: this.searchConfig,
        filter: this.filterConfig,
        sort: this.sortConfig,
      });

      // Add support user filter to ensure only invites by this user are returned
      queryConditions.where = {
        ...queryConditions.where,
        inviterId: supportUserId,
        isSupportInvite: true,
      };

      // Get total count
      const total = await this.prisma.job_invite.count({
        where: queryConditions.where,
      });

      // Get paginated results
      const invites = await this.prisma.job_invite.findMany({
        where: queryConditions.where,
        skip: queryConditions.skip,
        take: queryConditions.take,
        orderBy: queryConditions.orderBy,
      });

      if (!invites || invites.length === 0) {
        return {
          items: [],
          pagination: {
            total: 0,
            page: queryConditions.pagination.page,
            limit: queryConditions.pagination.limit,
            totalPages: 0,
          },
        };
      }

      // Get unique job IDs and inviter IDs for efficient querying
      const jobIds = [...new Set(invites.map((invite) => invite.jobId))];
      const inviterIds = [
        ...new Set(invites.map((invite) => invite.inviterId)),
      ];

      // Fetch job postings with client and company details
      const jobPostings = await this.prisma.job_posting.findMany({
        where: { id: { in: jobIds } },
        include: {
          client: {
            include: {
              company: true,
            },
          },
        },
      });

      // Fetch inviter details (support users)
      const inviters = await this.prisma.support_user.findMany({
        where: { id: { in: inviterIds } },
        include: {
          user: true,
        },
      });

      // Create a map for quick lookup
      const jobPostingMap = new Map(jobPostings.map((job) => [job.id, job]));
      const inviterMap = new Map(
        inviters.map((inviter) => [inviter.id, inviter])
      );

      const supportJobPostingInvites = invites.map((invite) => {
        const jobPosting = jobPostingMap.get(invite.jobId);
        const inviter = inviterMap.get(invite.inviterId);

        const inviteWithUrl = toSupportJobPostingInviteDomain({
          ...invite,
          jobPosting,
          inviter,
        });

        // Add invitation URL to the response
        inviteWithUrl.invitationUrl = this.generateInvitationUrl(
          invite.id,
          invite.email
        );

        return inviteWithUrl;
      });

      return {
        items: supportJobPostingInvites,
        pagination: {
          total,
          page: queryConditions.pagination.page,
          limit: queryConditions.pagination.limit,
          totalPages: Math.ceil(total / queryConditions.pagination.limit),
        },
      };
    } catch (error) {
      logger.error({
        message: 'Failed to list support job posting invites',
        context:
          'SupportJobPostingInviteService.getJobPostingInvitesBySupportUserId',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        filter,
        paginationRequest,
      });
      throw error;
    }
  }

  async resendInvitation(
    invitationId: string,
    inviteUserId: string
  ): Promise<ISupportJobInviteSimpleResponse> {
    const inviter = await this.prisma.support_user.findUnique({
      where: { id: inviteUserId },
      include: {
        user: true,
      },
    });

    if (!inviter) {
      throw new AppError('Inviter not found', 404, ErrorCode.NOT_FOUND);
    }

    const invitation = await this.prisma.job_invite.findUnique({
      where: {
        id: invitationId,
        status: {
          in: [
            JobInviteStatusEnum.PENDING,
            JobInviteStatusEnum.EXPIRED,
            JobInviteStatusEnum.WITHDRAWN,
          ],
        },
      },
    });

    if (!invitation) {
      throw new AppError('Invitation not found', 404, ErrorCode.NOT_FOUND);
    }

    const jobPosting = await this.prisma.job_posting.findUnique({
      where: { id: invitation.jobId },
      include: {
        client: {
          include: { company: true },
        },
      },
    });

    if (!jobPosting) {
      throw new AppError('Job posting not found', 404, ErrorCode.NOT_FOUND);
    }

    const companyName = jobPosting.client.company.name;
    const inviterName = inviter.user.name || 'Hiring Manager';
    const inviteUrl = this.generateInvitationUrl(
      invitation.id,
      invitation.email
    );

    await this.notificationProvider.sendSupportJobPostingInviteEmail(
      invitation.email,
      invitation.name,
      inviterName,
      jobPosting.title,
      companyName,
      inviteUrl,
      this.invitationExpiryHours
    );

    await this.prisma.job_invite.update({
      where: { id: invitationId },
      data: {
        status: JobInviteStatusEnum.PENDING,
        expiresAt: new Date(
          Date.now() + this.invitationExpiryHours * 60 * 60 * 1000
        ),
      },
    });

    logger.info({
      message: 'Support user invitation URL (resend)',
      invitationUrl: inviteUrl,
      email: invitation.email,
      name: invitation.name,
    });

    return {
      id: invitation.id,
      status: SupportJobInviteStatusEnum.PENDING,
      message: 'Support user invited successfully',
    };
  }

  /**
   * Get imported candidates for a specific job posting
   */
  async getImportedCandidates(
    jobId: string,
    filter: ISupportJobPostingInviteFilterQuery,
    paginationRequest: IPaginationRequest
  ): Promise<IPaginatedResponse<ISupportJobPostingInvite>> {
    try {
      logger.info({
        message: 'Listing imported candidates for job posting',
        context: 'SupportJobPostingInviteService.getImportedCandidates',
        jobId,
        filter,
        paginationRequest,
      });

      // Build query conditions using the generic pagination utilities
      const queryConditions = buildQueryConditions(filter, paginationRequest, {
        search: this.searchConfig,
        filter: this.filterConfig,
        sort: this.sortConfig,
      });

      // Add filters for imported candidates
      queryConditions.where = {
        ...queryConditions.where,
        jobId: jobId,
        isImportedCandidate: true, // Only show imported candidates
      };

      // Get total count
      const total = await this.prisma.job_invite.count({
        where: queryConditions.where,
      });

      // Get paginated results
      const invites = await this.prisma.job_invite.findMany({
        where: queryConditions.where,
        skip: queryConditions.skip,
        take: queryConditions.take,
        orderBy: queryConditions.orderBy,
      });

      if (!invites || invites.length === 0) {
        return {
          items: [],
          pagination: {
            total: 0,
            page: queryConditions.pagination.page,
            limit: queryConditions.pagination.limit,
            totalPages: 0,
          },
        };
      }

      // Get unique inviter IDs for efficient querying
      const inviterIds = [
        ...new Set(invites.map((invite) => invite.inviterId)),
      ];

      // Get unique integration IDs for efficient querying
      const integrationIds = [
        ...new Set(
          invites
            .map((invite) => invite.integrationId)
            .filter((id): id is string => id !== null && id !== undefined)
        ),
      ];

      // Fetch inviter details (client users)
      const inviters = await this.prisma.client_user.findMany({
        where: { id: { in: inviterIds } },
        include: {
          user: true,
        },
      });

      // Fetch integration provider details
      const integrationProviders =
        integrationIds.length > 0
          ? await this.prisma.integration_provider.findMany({
              where: { id: { in: integrationIds } },
              select: {
                id: true,
                name: true,
                description: true,
                type: true,
              },
            })
          : [];

      // Create maps for quick lookup
      const inviterMap = new Map(
        inviters.map((inviter) => [inviter.id, inviter])
      );
      const integrationMap = new Map(
        integrationProviders.map((provider) => [provider.id, provider])
      );

      const importedCandidates = invites.map((invite) => {
        const inviter = inviterMap.get(invite.inviterId);
        const integration = invite.integrationId
          ? integrationMap.get(invite.integrationId)
          : undefined;

        const inviteWithUrl = toSupportJobPostingInviteDomain({
          ...invite,
          inviter,
          integrationId: integration?.id,
          isImportedCandidate: true,
        });

        // Add invitation URL to the response
        inviteWithUrl.invitationUrl = this.generateInvitationUrl(
          invite.id,
          invite.email
        );

        return inviteWithUrl;
      });

      return {
        items: importedCandidates,
        pagination: {
          total,
          page: queryConditions.pagination.page,
          limit: queryConditions.pagination.limit,
          totalPages: Math.ceil(total / queryConditions.pagination.limit),
        },
      };
    } catch (error) {
      logger.error({
        message: 'Failed to list imported candidates',
        context: 'SupportJobPostingInviteService.getImportedCandidates',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        jobId,
        filter,
        paginationRequest,
      });
      throw error;
    }
  }

  async withdrawInvitation(
    invitationId: string,
    inviteUserId: string
  ): Promise<ISupportJobInviteSimpleResponse> {
    const inviter = await this.prisma.support_user.findUnique({
      where: { id: inviteUserId },
      include: {
        user: true,
      },
    });

    if (!inviter) {
      throw new AppError('Inviter not found', 404, ErrorCode.NOT_FOUND);
    }

    const invitation = await this.prisma.job_invite.findUnique({
      where: {
        id: invitationId,
        status: JobInviteStatusEnum.PENDING,
      },
    });

    if (!invitation) {
      throw new AppError('Invitation not found', 404, ErrorCode.NOT_FOUND);
    }

    const jobPosting = await this.prisma.job_posting.findUnique({
      where: { id: invitation.jobId },
      include: {
        client: {
          include: { company: true },
        },
      },
    });

    if (!jobPosting) {
      throw new AppError('Job posting not found', 404, ErrorCode.NOT_FOUND);
    }

    const companyName = jobPosting.client.company.name;

    await this.notificationProvider.sendSupportJobPostingInviteWithdrawnEmail(
      invitation.email,
      invitation.name,
      inviter.user.name || 'Hiring Manager',
      jobPosting.title,
      companyName,
      'The position has been filled internally. We appreciate your interest and will keep your profile in mind for future opportunities.'
    );

    const updatedInvitation = await this.prisma.job_invite.update({
      where: { id: invitationId },
      data: {
        status: JobInviteStatusEnum.WITHDRAWN,
      },
    });

    return {
      id: updatedInvitation.id,
      status: SupportJobInviteStatusEnum.WITHDRAWN,
      message: 'Support user invitation withdrawn successfully',
    };
  }
}
