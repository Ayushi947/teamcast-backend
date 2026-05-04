import { PrismaClient } from '@prisma/client';
import { singleton } from '@/shared/decorators/singleton';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';

import { ENV } from '@/config/env';
import { toIAuthUser } from '@/shared/models/domain/auth/auth.user.domain';
import { getAuthToken } from '@/utils/generate.token';
import { INotificationProvider } from '../notification/notification.interface';
import {
  InterviewTypeEnum,
  JobAiAssessmentInviteStatusEnum,
} from '@/shared/models/common/enums';
import {
  IJobAiAssessmentInvite,
  IScheduledJobAssessmentDetails,
  toJobAiAssessmentInviteDomain,
  IJobAiAssessmentInterviewItem,
} from '@/shared/models/domain/client/job.ai.assessment.invite';
import { IJobAiAssessmentApplicationUrlGenerateResponse } from '@/shared/models/api/client/job.ai.assessment.invite.api';
import {
  IPaginationRequest,
  IPaginatedResponse,
} from '@/shared/models/api/common/common.api';
import { ClientSubscriptionLimitsService } from './subscription.limits.service';
import { logger } from '@/shared/utils/logger';
import {
  buildQueryConditions,
  IFilterConfig,
  ISortConfig,
} from '@/utils/pagination';

@singleton
export class JobAiAssessmentInviteService {
  private readonly prisma: PrismaClient;
  private readonly invitationExpiryHours = 72; // 3 days
  private readonly subscriptionLimitsService: ClientSubscriptionLimitsService;

  constructor(private readonly notificationProvider: INotificationProvider) {
    this.prisma = new PrismaClient();
    this.subscriptionLimitsService = new ClientSubscriptionLimitsService();
  }

  private readonly interviewFilterConfig: IFilterConfig = {
    allowedFields: ['status'],
    enumFields: ['status'],
  };

  private readonly interviewSortConfig: ISortConfig = {
    allowedFields: ['createdAt', 'updatedAt', 'scheduledDate'],
    defaultSort: { field: 'createdAt', order: 'desc' },
  };

  async createAiAssessmentInvite(
    candidateId: string,
    jobApplicationId: string,
    clientId: string,
    clientUserId: string
  ): Promise<IJobAiAssessmentInvite> {
    // Check subscription limits before creating AI assessment invite
    const limitCheck =
      await this.subscriptionLimitsService.checkAiAssessmentLimit(clientId);

    if (!limitCheck.canCreate) {
      throw new AppError(
        limitCheck.errorMessage || 'AI assessment limit exceeded',
        403,
        ErrorCode.SUBSCRIPTION_LIMIT_REACHED
      );
    }

    const jobApplication = await this.prisma.job_application.findUnique({
      where: { id: jobApplicationId },
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
      },
    });

    if (!jobApplication) {
      throw new AppError('Job application not found', 404, ErrorCode.NOT_FOUND);
    }

    const candidate = await this.prisma.candidate.findUnique({
      where: {
        id: candidateId,
      },
      include: {
        user: true,
      },
    });

    if (!candidate) {
      throw new AppError('Candidate not found', 404, ErrorCode.NOT_FOUND);
    }

    const jobAiAssessmentInvite =
      await this.prisma.job_ai_assessment_invitation.findFirst({
        where: {
          candidateId: candidateId,
          jobApplicationId: jobApplicationId,
          status: JobAiAssessmentInviteStatusEnum.PENDING,
        },
      });

    if (jobAiAssessmentInvite) {
      throw new AppError(
        'Job AI assessment invite already exists',
        400,
        ErrorCode.INVALID_REQUEST
      );
    }

    const createJobAiAssessmentInvite =
      await this.prisma.job_ai_assessment_invitation.create({
        data: {
          candidateId: candidateId,
          clientId: clientId,
          jobApplicationId: jobApplicationId,
          status: JobAiAssessmentInviteStatusEnum.PENDING,
          invitedById: clientUserId,
          expiresAt: new Date(
            new Date().getTime() + this.invitationExpiryHours * 60 * 60 * 1000 // 72 hours
          ),
          createdAt: new Date(),
        },
      });

    // Increment AI assessment usage
    await this.subscriptionLimitsService.incrementAiAssessmentUsage(clientId);

    // Generate auth token for immediate login
    const authUser = toIAuthUser(candidate.user);
    const authToken = getAuthToken(authUser);

    const invitationUrl = `${ENV.FRONTEND_URL}/app/candidate/assessments/ai/check?id=${createJobAiAssessmentInvite.id}&token=${authToken.accessToken}`;

    await this.notificationProvider.sendJobAIAssessmentInterviewLinkEmail(
      candidate.user.email,
      candidate.user.name,
      jobApplication.jobPosting.client.company.name,
      jobApplication.jobPosting.title,
      invitationUrl,
      this.invitationExpiryHours
    );

    return toJobAiAssessmentInviteDomain(createJobAiAssessmentInvite);
  }

  async generateInvitationUrl(
    candidateId: string,
    jobApplicationId: string
  ): Promise<IJobAiAssessmentApplicationUrlGenerateResponse> {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        user: true,
      },
    });

    if (!candidate) {
      throw new AppError('Candidate not found', 404, ErrorCode.NOT_FOUND);
    }

    const jobApplication = await this.prisma.job_application.findUnique({
      where: { id: jobApplicationId },
      include: {
        jobPosting: true,
      },
    });

    if (!jobApplication) {
      throw new AppError('Job application not found', 404, ErrorCode.NOT_FOUND);
    }

    const jobAiAssessmentInvite =
      await this.prisma.job_ai_assessment_invitation.findFirst({
        where: {
          candidateId: candidateId,
          jobApplicationId: jobApplicationId,
          status: JobAiAssessmentInviteStatusEnum.PENDING,
        },
        include: {
          candidate: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                },
              },
            },
          },
          jobAiAssessment: {
            select: {
              id: true,
              status: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });

    if (!jobAiAssessmentInvite) {
      throw new AppError(
        'Job AI assessment invite not found',
        404,
        ErrorCode.NOT_FOUND
      );
    }

    const authUser = toIAuthUser(candidate.user);
    const authToken = getAuthToken(authUser);

    const invitationUrl = `${ENV.FRONTEND_URL}/app/candidate/assessments/ai/check?id=${jobAiAssessmentInvite.id}&token=${authToken.accessToken}`;

    return {
      jobAiAssessmentUrl: invitationUrl,
      inviteId: jobAiAssessmentInvite.id,
      candidateId: candidateId,
      status: jobAiAssessmentInvite.status,
      expiresAt: jobAiAssessmentInvite.expiresAt.toISOString(),
    };
  }

  async listJobAiAssessmentInterviews(
    clientId: string,
    pagination?: IPaginationRequest & {
      status?: string | string[];
      jobPostingId?: string;
      assessmentStatus?: string | string[];
    }
  ): Promise<IPaginatedResponse<IJobAiAssessmentInterviewItem>> {
    await this.updateExpiredInvitations(clientId);

    // Extract status filter from pagination query params
    // Express parses single query param as string, multiple as array
    const statusFilter = pagination?.status;
    const normalizedStatusFilter = statusFilter
      ? Array.isArray(statusFilter)
        ? statusFilter
        : [statusFilter]
      : undefined;

    const jobPostingId = pagination?.jobPostingId;

    const assessmentStatusFilter = pagination?.assessmentStatus;
    const normalizedAssessmentStatusFilter = assessmentStatusFilter
      ? Array.isArray(assessmentStatusFilter)
        ? assessmentStatusFilter
        : [assessmentStatusFilter]
      : undefined;

    // Normalize sortBy field: map frontend field names to database field names
    // 'scheduledTime' and 'scheduledDate' both map to 'scheduledDate' in the database
    // But if scheduledDate is null, we should fall back to createdAt for consistent sorting
    const normalizedPaginationRequest = pagination
      ? {
          ...pagination,
          sortBy:
            pagination.sortBy === 'scheduledTime' ||
            pagination.sortBy === 'scheduledDate'
              ? 'scheduledDate'
              : pagination.sortBy,
        }
      : undefined;

    // Build filter object with normalized status
    const filter = normalizedStatusFilter
      ? { status: normalizedStatusFilter }
      : {};

    const queryConditions = buildQueryConditions(
      filter,
      normalizedPaginationRequest || {},
      {
        filter: this.interviewFilterConfig,
        sort: this.interviewSortConfig,
      }
    );

    // Build base where clause with required filters
    const baseWhere: any = {
      clientId,
      // Only apply default status filter if no status filter is provided
      // If status filter is provided, let queryConditions handle it
      ...(!normalizedStatusFilter || normalizedStatusFilter.length === 0
        ? {
            status: {
              in: [
                JobAiAssessmentInviteStatusEnum.PENDING,
                JobAiAssessmentInviteStatusEnum.ACCEPTED,
                JobAiAssessmentInviteStatusEnum.EXPIRED,
              ],
            },
          }
        : {}),
    };

    if (jobPostingId) {
      baseWhere.jobApplication = {
        ...(baseWhere.jobApplication || {}),
        jobPostingId: jobPostingId,
      };
    }

    if (
      normalizedAssessmentStatusFilter &&
      normalizedAssessmentStatusFilter.length > 0
    ) {
      baseWhere.jobAiAssessment = {
        ...(baseWhere.jobAiAssessment || {}),
        status: {
          in: normalizedAssessmentStatusFilter,
        },
      };
    }

    // Add search functionality (handled manually due to nested relations)
    if (pagination?.search && pagination.search.trim()) {
      baseWhere.OR = [
        {
          candidate: {
            user: {
              name: {
                contains: pagination.search.trim(),
                mode: 'insensitive',
              },
            },
          },
        },
        {
          candidate: {
            user: {
              email: {
                contains: pagination.search.trim(),
                mode: 'insensitive',
              },
            },
          },
        },
        {
          jobApplication: {
            jobPosting: {
              title: {
                contains: pagination.search.trim(),
                mode: 'insensitive',
              },
            },
          },
        },
        {
          jobApplication: {
            jobPosting: {
              client: {
                company: {
                  name: {
                    contains: pagination.search.trim(),
                    mode: 'insensitive',
                  },
                },
              },
            },
          },
        },
      ];
    }

    // Merge base where with query conditions where
    const where = {
      ...baseWhere,
      ...queryConditions.where,
    };

    // Special handling for scheduledDate: we need to sort by COALESCE(scheduledDate, createdAt)
    // to match the selectedSlotDateTime field behavior (scheduledDate || createdAt)
    const isSortingByScheduledDate = queryConditions.orderBy?.scheduledDate;
    const sortOrder = isSortingByScheduledDate
      ? (queryConditions.orderBy.scheduledDate as 'asc' | 'desc')
      : null;

    let interviews;
    let total;

    if (isSortingByScheduledDate) {
      // For scheduledDate sorting, we need to sort by the effective date
      // Fetch all matching records, sort in memory, then paginate
      const allInterviews =
        await this.prisma.job_ai_assessment_invitation.findMany({
          where,
          include: {
            candidate: {
              include: {
                user: true,
              },
            },
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
              },
            },
            jobAiAssessment: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        });

      // Sort by effective date (scheduledDate || createdAt)
      allInterviews.sort((a, b) => {
        const aDate = a.scheduledDate || a.createdAt;
        const bDate = b.scheduledDate || b.createdAt;
        if (sortOrder === 'desc') {
          return bDate.getTime() - aDate.getTime();
        } else {
          return aDate.getTime() - bDate.getTime();
        }
      });

      total = allInterviews.length;
      interviews = allInterviews.slice(
        queryConditions.skip,
        queryConditions.skip + queryConditions.take
      );
    } else {
      // Normal sorting for other fields
      const orderBy: any =
        Object.keys(queryConditions.orderBy).length > 0
          ? queryConditions.orderBy
          : this.interviewSortConfig.defaultSort
            ? {
                [this.interviewSortConfig.defaultSort.field]:
                  this.interviewSortConfig.defaultSort.order,
              }
            : { createdAt: 'desc' };

      [interviews, total] = await Promise.all([
        this.prisma.job_ai_assessment_invitation.findMany({
          where,
          skip: queryConditions.skip,
          take: queryConditions.take,
          include: {
            candidate: {
              include: {
                user: true,
              },
            },
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
              },
            },
            jobAiAssessment: {
              select: {
                id: true,
                status: true,
              },
            },
          },
          orderBy,
        }),
        this.prisma.job_ai_assessment_invitation.count({ where }),
      ]);
    }

    const formattedInterviews = interviews.map((invitation) => {
      return {
        id: invitation.id,
        candidateName: invitation.candidate.user.name,
        candidateEmail: invitation.candidate.user.email,
        companyName: invitation.jobApplication.jobPosting.client.company.name,
        jobPostingId: invitation.jobApplication.jobPosting.id,
        jobApplicationId: invitation.jobApplication.id,
        jobTitle: invitation.jobApplication.jobPosting.title,
        status: invitation.status,
        assessmentStatus: invitation.jobAiAssessment?.status || null,
        assessmentId: invitation.jobAiAssessment?.id || null,
        createdAt: invitation.createdAt,
        selectedSlotDateTime: invitation.scheduledDate || invitation.createdAt,
        type: InterviewTypeEnum.AI_INTERVIEW,
        slotId: invitation.id, // Using invitation ID as slot ID since AI assessments don't have slots
        slotStatus: invitation.status, // Using invitation status as slot status
        panelMemberNames: [], // AI assessments don't have panel members
        meetingStatus: invitation.jobAiAssessment?.status || invitation.status, // Use assessment status if available, otherwise fall back to invitation status
      };
    });

    return {
      items: formattedInterviews,
      pagination: {
        total,
        page: queryConditions.pagination.page,
        limit: queryConditions.pagination.limit,
        totalPages: Math.ceil(total / queryConditions.pagination.limit),
      },
    };
  }

  async getJobAiAssessmentDetails(
    clientId: string,
    invitationId: string
  ): Promise<IScheduledJobAssessmentDetails> {
    const invitation = await this.prisma.job_ai_assessment_invitation.findFirst(
      {
        where: { id: invitationId, clientId },
        include: {
          candidate: {
            include: {
              user: true,
            },
          },
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
            },
          },
        },
      }
    );

    if (!invitation) {
      throw new AppError('Invitation not found', 404, ErrorCode.NOT_FOUND);
    }

    return {
      id: invitation.id,
      candidateName: invitation.candidate.user.name,
      candidateEmail: invitation.candidate.user.email,
      jobTitle: invitation.jobApplication.jobPosting.title,
      jobAssessmentId: invitation.jobAiAssessmentId || undefined,
      meetingStatus: invitation.status,
      createdAt: invitation.createdAt,
      expiresAt: invitation.expiresAt,
    };
  }

  async getJobAiAssessmentInviteForCandidateId(
    clientId: string,
    candidateId: string
  ): Promise<IJobAiAssessmentInvite> {
    const interview = await this.prisma.job_ai_assessment_invitation.findFirst({
      where: {
        candidateId,
        clientId,
      },
      include: {
        candidate: {
          include: {
            user: true,
          },
        },
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
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!interview) {
      throw new AppError(
        'AI assessment invite not found',
        404,
        ErrorCode.NOT_FOUND
      );
    }

    return toJobAiAssessmentInviteDomain(interview);
  }

  /**
   * Update expired invitations in the database
   */
  private async updateExpiredInvitations(clientId: string): Promise<void> {
    try {
      const now = new Date();

      // Update all invitations that have expired but still have PENDING status

      await this.prisma.job_ai_assessment_invitation.updateMany({
        where: {
          clientId,
          status: { in: ['PENDING', 'ACCEPTED'] },
          expiresAt: {
            lt: now,
          },
        },
        data: {
          status: 'EXPIRED',
        },
      });
    } catch (error) {
      logger.error({
        message: 'Failed to update expired invitations',
        context: 'JobAiAssessmentService.updateExpiredInvitations',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
