import { PrismaClient } from '@prisma/client';
import { singleton } from '@/shared/decorators/singleton';
import {
  ISupportJobApplication,
  ISupportJobApplicationFilterQuery,
  toSupportApplicationDomain,
  ISupportJobApplicationAiAssessment,
  toISupportJobApplicationAiAssessment,
} from '@/shared/models/domain/support/application.domain';
import {
  IPaginationRequest,
  IPaginatedResponse,
} from '@/shared/models/api/common/common.api';
import { getPaginationInfo } from '@/utils/pagination';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';
import { ENV } from '@/config/env';
import { ApplicationStatusEnum } from '../../shared/models/common/enums';
import { IStorageProvider } from '../helpers/storage/storage.interface';
import { StorageFactory } from '../helpers/storage/storage.factory';

@singleton
export class SupportApplicationService {
  private readonly prisma: PrismaClient;
  private readonly storageService: IStorageProvider;

  constructor() {
    this.prisma = new PrismaClient();
    this.storageService = StorageFactory.getInstance().getProvider();
  }

  /**
   * Get a list of accepted applications for support with optional filtering
   * Shows applications that are accepted from both client and candidate sides
   */
  async listSupportApplications(
    filter: ISupportJobApplicationFilterQuery,
    paginationRequest: IPaginationRequest
  ): Promise<IPaginatedResponse<ISupportJobApplication>> {
    try {
      // Get pagination info
      const paginationInfo = getPaginationInfo(paginationRequest);

      // Build the where clause for filtering - focus on accepted applications
      const where: any = {
        ...(filter.jobId && { jobPostingId: filter.jobId }),
        ...(filter.candidateId && { candidateId: filter.candidateId }),
        ...(filter.clientId && {
          jobPosting: {
            clientId: filter.clientId,
          },
        }),
        ...(filter.partnerId && { partnerId: filter.partnerId }),
        ...(filter.dateFrom && {
          acceptedAt: {
            gte: new Date(filter.dateFrom),
          },
        }),
        ...(filter.dateTo && {
          acceptedAt: {
            lte: new Date(filter.dateTo),
          },
        }),
      };

      // Add search filter if provided
      if (filter.search) {
        where.OR = [
          {
            jobPosting: {
              title: {
                contains: filter.search,
                mode: 'insensitive' as const,
              },
            },
          },
          {
            jobPosting: {
              client: {
                company: {
                  name: {
                    contains: filter.search,
                    mode: 'insensitive' as const,
                  },
                },
              },
            },
          },
          {
            candidate: {
              user: {
                name: {
                  contains: filter.search,
                  mode: 'insensitive' as const,
                },
              },
            },
          },
          {
            candidate: {
              user: {
                email: {
                  contains: filter.search,
                  mode: 'insensitive' as const,
                },
              },
            },
          },
        ];
      }

      // Find all accepted applications with their related data
      const applications = await this.prisma.job_application.findMany({
        where,
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
              resume: true,
            },
          },
          partner: {
            include: {
              company: true,
            },
          },
        },
        ...paginationInfo,
      });

      // Count total matching records (for pagination)
      const totalMatchingApplications = await this.prisma.job_application.count(
        {
          where,
        }
      );

      // Convert user images to presigned URLs
      for (const application of applications) {
        if (
          application.candidate?.user?.image &&
          !application.candidate.user.image.startsWith('http')
        ) {
          try {
            const presignedUrl = await this.storageService.generatePreSignedUrl(
              application.candidate.user.image,
              'read'
            );
            application.candidate.user.image = presignedUrl;
          } catch (error) {
            logger.warn({
              message: 'Failed to generate presigned URL for user image',
              context: 'SupportApplicationService.listSupportApplications',
              error: error instanceof Error ? error.message : 'Unknown error',
              imagePath: application.candidate.user.image,
            });
            // Continue without image if presigned URL generation fails
          }
        }
      }

      // Convert to domain models
      const domainApplications = applications.map((application) =>
        toSupportApplicationDomain(application)
      );

      // Return paginated response
      return {
        items: domainApplications,
        pagination: {
          total: totalMatchingApplications,
          page: paginationRequest.page ?? ENV.DEFAULT_PAGE,
          limit: paginationRequest.limit ?? ENV.DEFAULT_LIMIT,
          totalPages: Math.ceil(
            totalMatchingApplications /
              (paginationRequest.limit ?? ENV.DEFAULT_LIMIT)
          ),
        },
      };
    } catch (error) {
      logger.error({
        message: 'Failed to list support applications',
        context: 'SupportApplicationService.listSupportApplications',
        error: error instanceof Error ? error.message : 'Unknown error',
        filter,
      });
      throw error;
    }
  }

  /**
   * Get a specific accepted application by ID
   */
  async getSupportApplication(
    applicationId: string
  ): Promise<ISupportJobApplication> {
    try {
      // Find the application with its related data
      const application = await this.prisma.job_application.findFirst({
        where: {
          id: applicationId,
        },
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
              resume: true,
            },
          },
          partner: {
            include: {
              company: true,
            },
          },
        },
      });

      if (!application) {
        throw new AppError('Application not found', 404, ErrorCode.NOT_FOUND);
      }

      // Convert user image to presigned URL if it exists
      if (
        application.candidate?.user?.image &&
        !application.candidate.user.image.startsWith('http')
      ) {
        try {
          const presignedUrl = await this.storageService.generatePreSignedUrl(
            application.candidate.user.image,
            'read'
          );
          application.candidate.user.image = presignedUrl;
        } catch (error) {
          logger.warn({
            message: 'Failed to generate presigned URL for user image',
            context: 'SupportApplicationService.getSupportApplication',
            error: error instanceof Error ? error.message : 'Unknown error',
            imagePath: application.candidate.user.image,
          });
          // Continue without image if presigned URL generation fails
        }
      }

      // Convert to domain model
      return toSupportApplicationDomain(application);
    } catch (error) {
      logger.error({
        message: 'Failed to get support application',
        context: 'SupportApplicationService.getSupportApplication',
        error: error instanceof Error ? error.message : 'Unknown error',
        applicationId,
      });
      throw error;
    }
  }

  /**
   * Get the AI assessment for a specific accepted application
   * Returns null if no assessment exists yet (candidate hasn't completed assessment)
   */
  async getSupportApplicationAiAssessment(
    applicationId: string
  ): Promise<ISupportJobApplicationAiAssessment | null> {
    try {
      // Use findFirst instead of findUnique because we're filtering by status (non-unique field)
      const application = await this.prisma.job_application.findFirst({
        where: {
          id: applicationId,
        },
        include: {
          candidate: {
            include: {
              user: true,
              resume: true,
            },
          },
        },
      });

      if (!application) {
        throw new AppError(
          'Application not found or not accepted',
          404,
          ErrorCode.JOB_APPLICATION_NOT_FOUND
        );
      }

      const candidateAiAssessment =
        await this.prisma.job_ai_assessment_invitation.findFirst({
          where: {
            jobApplicationId: applicationId,
            candidateId: application.candidateId,
          },
          include: {
            jobAiAssessment: true,
          },
        });

      if (!candidateAiAssessment?.jobAiAssessment) {
        logger.info('No candidate AI assessment found', {
          context:
            'SupportApplicationService.getSupportApplicationAiAssessment',
          applicationId,
        });
        return null;
      }

      const assessment = candidateAiAssessment.jobAiAssessment;

      return assessment
        ? toISupportJobApplicationAiAssessment(assessment)
        : null;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Failed to get AI assessment', {
        context: 'SupportApplicationService.getSupportApplicationAiAssessment',
        applicationId,
        error,
      });

      throw new AppError(
        'Failed to get AI assessment',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get conversion statistics for support dashboard
   */
  async getConversionStatistics(dateFrom?: string, dateTo?: string) {
    try {
      const whereClause: any = {
        status: ApplicationStatusEnum.ACCEPTED,
      };

      if (dateFrom || dateTo) {
        whereClause.acceptedAt = {};
        if (dateFrom) whereClause.acceptedAt.gte = new Date(dateFrom);
        if (dateTo) whereClause.acceptedAt.lte = new Date(dateTo);
      }

      const totalAccepted = await this.prisma.job_application.count({
        where: whereClause,
      });

      const totalApplications = await this.prisma.job_application.count({
        where:
          dateFrom || dateTo
            ? {
                appliedAt: {
                  ...(dateFrom && { gte: new Date(dateFrom) }),
                  ...(dateTo && { lte: new Date(dateTo) }),
                },
              }
            : {},
      });

      const conversionRate =
        totalApplications > 0 ? (totalAccepted / totalApplications) * 100 : 0;

      return {
        totalAccepted,
        totalApplications,
        conversionRate: Math.round(conversionRate * 100) / 100, // Round to 2 decimal places
      };
    } catch (error) {
      logger.error({
        message: 'Failed to get conversion statistics',
        context: 'SupportApplicationService.getConversionStatistics',
        error: error instanceof Error ? error.message : 'Unknown error',
        dateFrom,
        dateTo,
      });
      throw error;
    }
  }
}
