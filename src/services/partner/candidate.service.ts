import { singleton } from '@/shared/decorators/singleton';
import { PrismaClient } from '@prisma/client';
import {
  IPartnerCandidate,
  IPartnerCandidateDetailed,
  IPartnerCandidateFilterQuery,
  IPartnerCandidateUpdate,
  toPartnerCandidateDomain,
  toPartnerCandidateDetailedDomain,
} from '@/shared/models/domain/partner/candidate.domain';
import { ErrorCode } from '@/utils/error.codes';
import { AppError } from '@/utils/app.error';
import { logger } from '@/shared/utils/logger';
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
import { CandidateRecommendationStatusEnum } from '@/shared/models/common/enums';

@singleton
export class PartnerCandidateService {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  private readonly searchConfig: ISearchConfig = {
    searchableFields: [],
    relationFields: {
      user: ['email', 'name', 'jobTitle'],
    },
  };

  private readonly filterConfig: IFilterConfig = {
    allowedFields: [
      'status',
      'assessmentStage',
      'jobSearchStatus',
      'isPublished',
      'minExperience',
      'maxExperience',
      'skills',
    ],
    relationFields: {
      email: 'user',
      name: 'user',
      jobTitle: 'user',
    },
    arrayFields: ['skills'],
    enumFields: ['status', 'assessmentStage', 'jobSearchStatus'],
  };

  private readonly sortConfig: ISortConfig = {
    allowedFields: [
      'status',
      'assessmentStage',
      'jobSearchStatus',
      'isPublished',
      'createdAt',
      'updatedAt',
    ],
    relationFields: {
      email: { relation: 'user', field: 'email' },
      name: { relation: 'user', field: 'name' },
      jobTitle: { relation: 'user', field: 'jobTitle' },
    },
    defaultSort: { field: 'createdAt', order: 'desc' },
  };

  async getPartnerCandidate(
    partnerId: string,
    candidateId: string
  ): Promise<IPartnerCandidateDetailed> {
    try {
      const candidate = await this.prisma.candidate.findFirst({
        where: {
          id: candidateId,
          partnerId: partnerId,
          deletedAt: null,
        },
        include: {
          user: true,
          resume: {
            include: {
              social: true,
              certifications: true,
              education: true,
              experience: true,
              parsingTask: true,
            },
          },
          preferences: true,
        },
      });

      if (!candidate) {
        throw new AppError('Candidate not found', 404, ErrorCode.NOT_FOUND);
      }

      return toPartnerCandidateDetailedDomain(candidate);
    } catch (error) {
      logger.error({
        message: 'Failed to get partner candidate',
        context: 'PartnerCandidateService.getPartnerCandidate',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        partnerId,
      });
      throw error;
    }
  }

  async updatePartnerCandidate(
    partnerId: string,
    candidateId: string,
    updatedBy: string,
    candidateData: IPartnerCandidateUpdate
  ): Promise<IPartnerCandidate> {
    try {
      logger.info({
        message: 'Updating partner candidate',
        context: 'PartnerCandidateService.updatePartnerCandidate',
        candidateId,
        candidateData,
      });

      // Check if candidate exists and belongs to the partner
      const existingCandidate = await this.prisma.candidate.findFirst({
        where: {
          id: candidateId,
          partnerId: partnerId,
          deletedAt: null,
        },
        include: {
          user: true,
        },
      });

      if (!existingCandidate) {
        throw new AppError('Candidate not found', 404, ErrorCode.NOT_FOUND);
      }

      // Update the candidate
      const updatedCandidate = await this.prisma.candidate.update({
        where: { id: candidateId },
        data: {
          ...candidateData,
          updatedBy,
        },
        include: {
          user: true,
        },
      });

      return toPartnerCandidateDomain(updatedCandidate);
    } catch (error) {
      logger.error({
        message: 'Failed to update partner candidate',
        context: 'PartnerCandidateService.updatePartnerCandidate',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        candidateData,
      });
      throw error;
    }
  }

  async deletePartnerCandidate(
    partnerId: string,
    candidateId: string,
    updatedBy: string
  ): Promise<void> {
    try {
      // Check if candidate exists and belongs to the partner
      const candidate = await this.prisma.candidate.findFirst({
        where: {
          id: candidateId,
          partnerId: partnerId,
          deletedAt: null,
        },
      });

      if (!candidate) {
        throw new AppError('Candidate not found', 404, ErrorCode.NOT_FOUND);
      }

      // Soft delete the candidate by setting deletedAt and updatedBy
      await this.prisma.candidate.update({
        where: { id: candidateId },
        data: {
          deletedAt: new Date(),
          updatedBy: updatedBy,
        },
      });

      logger.info({
        message: 'Partner candidate soft deleted successfully',
        context: 'PartnerCandidateService.deletePartnerCandidate',
        candidateId,
        partnerId,
        updatedBy,
      });
    } catch (error) {
      logger.error({
        message: 'Failed to delete partner candidate',
        context: 'PartnerCandidateService.deletePartnerCandidate',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        partnerId,
      });
      throw error;
    }
  }

  async listPartnerCandidates(
    partnerId: string,
    filter: IPartnerCandidateFilterQuery,
    paginationRequest: IPaginationRequest
  ): Promise<IPaginatedResponse<IPartnerCandidate>> {
    try {
      logger.info({
        message: 'Listing partner candidates',
        context: 'PartnerCandidateService.listPartnerCandidates',
        partnerId,
        filter,
        paginationRequest,
      });

      // Build query conditions using the generic pagination utilities
      const queryConditions = buildQueryConditions(filter, paginationRequest, {
        search: this.searchConfig,
        filter: this.filterConfig,
        sort: this.sortConfig,
      });

      // Add base conditions
      const baseWhere = {
        partnerId,
        deletedAt: null,
      };

      // Get total count
      const total = await this.prisma.candidate.count({
        where: {
          ...baseWhere,
          ...queryConditions.where,
        },
      });

      logger.info({
        message: 'Found total candidates',
        context: 'PartnerCandidateService.listPartnerCandidates',
        total,
        skip: queryConditions.skip,
        take: queryConditions.take,
      });

      const candidates = await this.prisma.candidate.findMany({
        where: {
          ...baseWhere,
          ...queryConditions.where,
        },
        skip: queryConditions.skip,
        take: queryConditions.take,
        orderBy: queryConditions.orderBy,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              jobTitle: true,
            },
          },
          resume: {
            select: {
              id: true,
            },
          },
        },
      });

      logger.info({
        message: 'Successfully listed partner candidates',
        context: 'PartnerCandidateService.listPartnerCandidates',
        total,
        count: candidates.length,
        page: queryConditions.pagination.page,
        limit: queryConditions.pagination.limit,
        skip: queryConditions.skip,
      });

      return {
        items: candidates.map(toPartnerCandidateDomain),
        pagination: {
          total,
          page: queryConditions.pagination.page,
          limit: queryConditions.pagination.limit,
          totalPages: Math.ceil(total / queryConditions.pagination.limit),
        },
      };
    } catch (error) {
      logger.error({
        message: 'Failed to list partner candidates',
        context: 'PartnerCandidateService.listPartnerCandidates',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        filter,
        paginationRequest,
      });
      throw error;
    }
  }

  /**
   * Get recommended candidates for a specific job posting
   * Returns partner's candidates who have active recommendations for the given job posting
   */
  async getRecommendedCandidatesForJobPosting(
    partnerId: string,
    jobPostingId: string,
    paginationRequest: IPaginationRequest
  ): Promise<
    IPaginatedResponse<
      IPartnerCandidate & {
        recommendation: {
          score: number;
          matchReason: string[];
          isViewed: boolean;
          isSaved: boolean;
          hasApplied: boolean;
          createdAt: Date;
        };
      }
    >
  > {
    try {
      logger.info({
        message: 'Getting recommended candidates for job posting',
        context:
          'PartnerCandidateService.getRecommendedCandidatesForJobPosting',
        partnerId,
        jobPostingId,
        paginationRequest,
      });

      // Provide default values for pagination
      const page = paginationRequest.page || 1;
      const limit = paginationRequest.limit || 10;
      const skip = (page - 1) * limit;

      // Get total count of recommended candidates
      const total = await this.prisma.candidate_recommendation.count({
        where: {
          jobPostingId: jobPostingId,
          status: CandidateRecommendationStatusEnum.ACTIVE,
          candidate: {
            partnerId: partnerId,
            deletedAt: null,
          },
        },
      });

      // Get recommended candidates with their recommendation data
      const recommendations =
        await this.prisma.candidate_recommendation.findMany({
          where: {
            jobPostingId: jobPostingId,
            status: CandidateRecommendationStatusEnum.ACTIVE,
            candidate: {
              partnerId: partnerId,
              deletedAt: null,
            },
          },
          include: {
            candidate: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    name: true,
                    jobTitle: true,
                  },
                },
                resume: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
          orderBy: {
            score: 'desc', // Order by highest match score first
          },
          skip: skip,
          take: limit,
        });

      logger.info({
        message: 'Successfully retrieved recommended candidates',
        context:
          'PartnerCandidateService.getRecommendedCandidatesForJobPosting',
        total,
        count: recommendations.length,
        page: page,
        limit: limit,
      });

      // Transform the data to include recommendation details
      const candidatesWithRecommendations = recommendations.map((rec) => {
        const candidateDomain = toPartnerCandidateDomain(rec.candidate);
        return {
          ...candidateDomain,
          recommendation: {
            score: rec.score,
            matchReason: rec.matchReason,
            isViewed: rec.isViewed,
            isSaved: rec.isSaved,
            hasApplied: rec.hasApplied,
            createdAt: rec.createdAt,
          },
        };
      });

      return {
        items: candidatesWithRecommendations,
        pagination: {
          total,
          page: page,
          limit: limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error({
        message: 'Failed to get recommended candidates for job posting',
        context:
          'PartnerCandidateService.getRecommendedCandidatesForJobPosting',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        partnerId,
        jobPostingId,
        paginationRequest,
      });
      throw error;
    }
  }

  /**
   * Update recommendation status for a candidate-job posting combination
   * Allows partners to mark recommendations as viewed, saved, etc.
   */
  async updateCandidateRecommendationStatus(
    partnerId: string,
    candidateId: string,
    jobPostingId: string,
    updateData: {
      isViewed?: boolean;
      isSaved?: boolean;
      hasApplied?: boolean;
    }
  ): Promise<void> {
    try {
      logger.info({
        message: 'Updating candidate recommendation status',
        context: 'PartnerCandidateService.updateCandidateRecommendationStatus',
        partnerId,
        candidateId,
        jobPostingId,
        updateData,
      });

      // Verify the candidate belongs to the partner
      const candidate = await this.prisma.candidate.findFirst({
        where: {
          id: candidateId,
          partnerId: partnerId,
          deletedAt: null,
        },
      });

      if (!candidate) {
        throw new AppError(
          'Candidate not found or does not belong to your organization',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Update the recommendation status
      const recommendation =
        await this.prisma.candidate_recommendation.updateMany({
          where: {
            candidateId: candidateId,
            jobPostingId: jobPostingId,
            status: CandidateRecommendationStatusEnum.ACTIVE,
          },
          data: {
            ...updateData,
            updatedAt: new Date(),
          },
        });

      if (recommendation.count === 0) {
        throw new AppError(
          'Recommendation not found for this candidate and job posting',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      logger.info({
        message: 'Successfully updated candidate recommendation status',
        context: 'PartnerCandidateService.updateCandidateRecommendationStatus',
        partnerId,
        candidateId,
        jobPostingId,
        updateData,
        updatedCount: recommendation.count,
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error({
        message: 'Failed to update candidate recommendation status',
        context: 'PartnerCandidateService.updateCandidateRecommendationStatus',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        partnerId,
        candidateId,
        jobPostingId,
        updateData,
      });
      throw new AppError(
        'Failed to update recommendation status',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }
}
