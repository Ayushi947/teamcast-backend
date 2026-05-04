import { singleton } from '@/shared/decorators/singleton';
import { ErrorCode } from '@/utils/error.codes';
import { AppError } from '@/utils/app.error';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/shared/utils/logger';
import {
  ApplicationStatusEnum,
  JobPostingStatusEnum,
  JobRecommendationStatusEnum,
} from '@/shared/models/common/enums';
import {
  IPartnerJobPosting,
  IPartnerJobPostingList,
  IPartnerJobPostingFilterQuery,
  toPartnerJobPostingDomain,
  toPartnerJobPostingListDomain,
} from '@/shared/models/domain/partner/job.postings.domain';
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
import { IPartnerJobApplication } from '@/shared/models/domain/partner/job.application.domain';

@singleton
export class PartnerJobPostingsService {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
    logger.info('PartnerJobPostingsService initialized');
  }

  private readonly searchConfig: ISearchConfig = {
    searchableFields: ['title', 'description', 'department'],
    relationFields: {},
  };

  private readonly filterConfig: IFilterConfig = {
    allowedFields: [
      'title',
      'department',
      'reportingTo',
      'jobType',
      'industry',
      'status',
      'isRemote',
      'isFeatured',
      'equity',
      'minExperience',
      'maxExperience',
      'minSalary',
      'maxSalary',
      'minTeamSize',
      'maxTeamSize',
      'minNumberOfOpenings',
      'maxNumberOfOpenings',
      'skills',
      'requiredSkills',
      'preferredSkills',
      'preferredLocations',
      'preferredIndustries',
      'benefits',
      'tags',
    ],
    relationFields: {},
    arrayFields: [
      'skills',
      'requiredSkills',
      'preferredSkills',
      'preferredLocations',
      'preferredIndustries',
      'benefits',
      'tags',
    ],
    enumFields: ['jobType', 'industry', 'status'],
  };

  private readonly sortConfig: ISortConfig = {
    allowedFields: [
      'title',
      'jobType',
      'totalExperience',
      'numberOfOpenings',
      'minSalary',
      'maxSalary',
      'applicationDeadline',
      'availableFrom',
      'createdAt',
      'updatedAt',
    ],
    relationFields: {},
    defaultSort: { field: 'createdAt', order: 'desc' },
  };

  /**
   * Get active job postings with enhanced filtering and search
   * Only returns job postings that have recommendations for the partner's candidates
   */
  async getActiveJobPostings(
    partnerId: string,
    filters: IPartnerJobPostingFilterQuery,
    pagination: IPaginationRequest
  ): Promise<IPaginatedResponse<IPartnerJobPostingList>> {
    try {
      const queryConditions = buildQueryConditions(filters, pagination, {
        search: this.searchConfig,
        filter: this.filterConfig,
        sort: this.sortConfig,
      });

      const baseWhere = {
        status: JobPostingStatusEnum.PUBLISHED,
        // Only include job postings that have recommendations for this partner's candidates
        recommendations: {
          some: {
            candidate: {
              partnerId: partnerId,
            },
            status: JobRecommendationStatusEnum.ACTIVE, // Only active recommendations
          },
        },
      };

      const total = await this.prisma.job_posting.count({
        where: {
          ...baseWhere,
          ...queryConditions.where,
        },
      });

      const jobPostings = await this.prisma.job_posting.findMany({
        where: {
          ...baseWhere,
          ...queryConditions.where,
        },
        skip: queryConditions.skip,
        take: queryConditions.take,
        orderBy: queryConditions.orderBy,
        include: {
          recommendations: {
            where: {
              candidate: {
                partnerId: partnerId,
              },
              status: JobRecommendationStatusEnum.ACTIVE,
            },
            select: {
              id: true,
              score: true,
              matchReason: true,
            },
            orderBy: {
              score: 'desc',
            },
          },
        },
      });

      return {
        items: jobPostings.map(toPartnerJobPostingListDomain),
        pagination: {
          total,
          page: queryConditions.pagination.page,
          limit: queryConditions.pagination.limit,
          totalPages: Math.ceil(total / queryConditions.pagination.limit),
        },
      };
    } catch (error) {
      logger.error({
        message: 'Failed to get active job postings',
        context: 'PartnerJobPostingsService.getActiveJobPostings',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        partnerId,
        filters,
        pagination,
      });
      throw error;
    }
  }

  /**
   * Get job posting details by ID (excluding client information)
   */
  async getJobPostingById(id: string): Promise<IPartnerJobPosting> {
    try {
      const jobPosting = await this.prisma.job_posting.findFirst({
        where: {
          id,
          status: JobPostingStatusEnum.PUBLISHED, // Only published jobs
        },
      });

      if (!jobPosting) {
        throw new AppError(
          'Job posting not found or not available',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      return toPartnerJobPostingDomain(jobPosting);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Error fetching job posting details', { error, id });
      throw new AppError(
        'Failed to fetch job posting details',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Apply to a job posting with multiple partner resources/candidates
   */
  async applyToJobPosting(
    partnerId: string,
    jobPostingId: string,
    applicationData: {
      candidates: Array<{ candidateId: string; comment?: string }>;
    }
  ): Promise<IPartnerJobApplication[]> {
    try {
      return await this.prisma.$transaction(async (prisma) => {
        // Verify job posting exists and is published
        const jobPosting = await prisma.job_posting.findFirst({
          where: {
            id: jobPostingId,
            status: JobPostingStatusEnum.PUBLISHED,
          },
        });

        if (!jobPosting) {
          throw new AppError(
            'Job posting not found or not available',
            404,
            ErrorCode.NOT_FOUND
          );
        }

        const applications: IPartnerJobApplication[] = [];

        // Process each candidate application
        for (const candidateData of applicationData.candidates) {
          const candidate = await prisma.candidate.findFirst({
            where: {
              id: candidateData.candidateId,
              partnerId: partnerId,
            },
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          });

          if (!candidate) {
            throw new AppError(
              `Candidate ${candidateData.candidateId} not found or does not belong to your organization`,
              404,
              ErrorCode.NOT_FOUND
            );
          }

          // Check if application already exists
          const existingApplication = await prisma.job_application.findFirst({
            where: {
              candidateId: candidateData.candidateId,
              jobPostingId: jobPostingId,
            },
          });

          if (existingApplication) {
            throw new AppError(
              `Application already exists for candidate ${candidateData.candidateId} and job posting`,
              409,
              ErrorCode.CONFLICT
            );
          }

          const application = await prisma.job_application.create({
            data: {
              candidateId: candidateData.candidateId,
              jobPostingId: jobPostingId,
              partnerId: partnerId,
              notes: candidateData.comment || undefined,
              status: ApplicationStatusEnum.APPLIED,
              appliedAt: new Date(),
            },
          });

          logger.info('Partner job application created', {
            applicationId: application.id,
            partnerId,
            jobPostingId,
            candidateId: candidateData.candidateId,
          });

          // Transform to partner job application domain model
          applications.push({
            id: application.id,
            partnerId: partnerId,
            candidateId: application.candidateId,
            jobPostingId: application.jobPostingId,
            status: application.status as ApplicationStatusEnum,
            appliedAt: application.appliedAt,
            notes: application.notes || undefined,
            createdAt: application.createdAt,
            updatedAt: application.updatedAt,
          });
        }

        // TODO: Send notification to client about new applications
        // await this.notificationService.sendPartnerApplicationNotification(applications);

        return applications;
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Error creating partner job applications', {
        error,
        partnerId,
        jobPostingId,
        applicationData,
      });
      throw new AppError(
        'Failed to submit applications',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get current partner from user context
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
}
