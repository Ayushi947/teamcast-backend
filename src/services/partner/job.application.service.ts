import { singleton } from '@/shared/decorators/singleton';
import { ErrorCode } from '@/utils/error.codes';
import { AppError } from '@/utils/app.error';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/shared/utils/logger';
import {
  IPartnerJobApplicationDetails,
  IPartnerJobApplicationFilterQuery,
  IPartnerJobApplicationWithdraw,
  toPartnerJobApplicationDetailsDomain,
} from '@/shared/models/domain/partner/job.application.domain';
import { ApplicationStatusEnum } from '@/shared/models/common/enums';
import {
  IPaginatedResponse,
  IPaginationRequest,
} from '@/shared/models/api/common/common.api';
import { getPaginationInfo } from '@/utils/pagination';

@singleton
export class PartnerJobApplicationService {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get partner's job applications with filtering and pagination
   */
  async getPartnerJobApplications(
    partnerId: string,
    filters: IPartnerJobApplicationFilterQuery,
    pagination: IPaginationRequest
  ): Promise<IPaginatedResponse<IPartnerJobApplicationDetails>> {
    try {
      const paginationInfo = getPaginationInfo(pagination);

      // Build where clause for filtering
      const where: any = {
        partnerId: partnerId,
        ...(filters.status && { status: filters.status }),
        ...(filters.jobPostingId && { jobPostingId: filters.jobPostingId }),
        ...(filters.candidateId && { candidateId: filters.candidateId }),
        ...(filters.appliedAfter && {
          appliedAt: {
            gte: filters.appliedAfter,
          },
        }),
        ...(filters.appliedBefore && {
          appliedAt: {
            lte: filters.appliedBefore,
          },
        }),
      };

      // Add search functionality
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();

        // Search across all relevant fields
        where.OR = [
          {
            candidate: {
              user: {
                name: {
                  contains: searchTerm,
                  mode: 'insensitive',
                },
              },
            },
          },
          {
            candidate: {
              user: {
                email: {
                  contains: searchTerm,
                  mode: 'insensitive',
                },
              },
            },
          },
          {
            candidate: {
              user: {
                jobTitle: {
                  contains: searchTerm,
                  mode: 'insensitive',
                },
              },
            },
          },
          {
            jobPosting: {
              title: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
          },
        ];
      }

      const [applications, total] = await Promise.all([
        this.prisma.job_application.findMany({
          where,
          skip: paginationInfo.skip,
          take: paginationInfo.take,
          orderBy: { appliedAt: 'desc' },
          include: {
            candidate: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
            jobPosting: {
              include: {
                client: {
                  include: {
                    company: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        }),
        this.prisma.job_application.count({ where }),
      ]);

      const items: IPartnerJobApplicationDetails[] = applications.map((app) =>
        toPartnerJobApplicationDetailsDomain(app)
      );

      const totalPages = Math.ceil(total / paginationInfo.take);

      return {
        items,
        pagination: {
          total,
          page: pagination.page || 1,
          limit: paginationInfo.take,
          totalPages,
        },
      };
    } catch (error) {
      logger.error('Error fetching partner job applications', {
        error,
        partnerId,
        filters,
        pagination,
      });
      throw new AppError(
        'Failed to fetch job applications',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get partner ID from user context
   */
  async getPartnerFromUserId(userId: string): Promise<string> {
    try {
      const partnerUser = await this.prisma.partner_user.findFirst({
        where: { userId },
        include: { partner: true },
      });

      if (!partnerUser) {
        throw new AppError(
          'Partner not found for user',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      return partnerUser.partnerId;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Error finding partner for user', { error, userId });
      throw new AppError(
        'Failed to find partner information',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get a specific job application by ID for the partner
   */
  async getPartnerJobApplicationById(
    partnerId: string,
    applicationId: string
  ): Promise<IPartnerJobApplicationDetails> {
    try {
      const application = await this.prisma.job_application.findFirst({
        where: {
          id: applicationId,
          partnerId: partnerId,
        },
        include: {
          candidate: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
          jobPosting: {
            include: {
              client: {
                include: {
                  company: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!application) {
        throw new AppError(
          'Job application not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      return toPartnerJobApplicationDetailsDomain(application);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Error fetching partner job application by ID', {
        error,
        partnerId,
        applicationId,
      });
      throw new AppError(
        'Failed to fetch job application',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Withdraw a job application
   */
  async withdrawPartnerJobApplication(
    partnerId: string,
    applicationId: string,
    withdrawData: IPartnerJobApplicationWithdraw
  ): Promise<{ applicationId: string; status: ApplicationStatusEnum }> {
    try {
      // First check if the application exists and belongs to the partner
      const existingApplication = await this.prisma.job_application.findFirst({
        where: {
          id: applicationId,
          partnerId: partnerId,
        },
      });

      if (!existingApplication) {
        throw new AppError(
          'Job application not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Check if the application can be withdrawn (not already withdrawn or rejected)
      if (
        existingApplication.status === ApplicationStatusEnum.WITHDRAWN ||
        existingApplication.status === ApplicationStatusEnum.REJECTED
      ) {
        throw new AppError(
          'Application cannot be withdrawn in its current status',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      // Update the application status to withdrawn
      const updatedApplication = await this.prisma.job_application.update({
        where: {
          id: applicationId,
        },
        data: {
          status: ApplicationStatusEnum.WITHDRAWN,
          notes: withdrawData.reason
            ? `${existingApplication.notes || ''}\n\nWithdrawal reason: ${withdrawData.reason}`
            : existingApplication.notes,
        },
      });

      logger.info('Partner job application withdrawn successfully', {
        partnerId,
        applicationId,
        status: updatedApplication.status,
      });

      return {
        applicationId: updatedApplication.id,
        status: updatedApplication.status as ApplicationStatusEnum,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Error withdrawing partner job application', {
        error,
        partnerId,
        applicationId,
        withdrawData,
      });
      throw new AppError(
        'Failed to withdraw job application',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }
}
