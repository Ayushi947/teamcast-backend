import { singleton } from '../../shared/decorators/singleton';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../shared/utils/logger';
import { AppError } from '../../utils/app.error';
import { ErrorCode } from '../../utils/error.codes';
import {
  ICandidateRecommendation,
  ICandidateRecommendationFilterQuery,
  ICandidateRecommendationReject,
  toCandidateRecommendationDomain,
} from '../../shared/models/domain/candidate/recommendation.domain';
import {
  IPaginationRequest,
  IPaginatedResponse,
} from '../../shared/models/api/common/common.api';
import { getPaginationInfo } from '../../utils/pagination';
import { CandidateRecommendationStatusEnum } from '../../shared/models/common/enums';

@singleton
export class CandidateRecommendationService {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get candidate recommendations with pagination and filtering
   */
  async getCandidateRecommendations(
    candidateId: string,
    filters: ICandidateRecommendationFilterQuery,
    pagination: IPaginationRequest
  ): Promise<IPaginatedResponse<ICandidateRecommendation>> {
    try {
      // Verify that the candidate exists
      const candidate = await this.prisma.candidate.findUnique({
        where: { id: candidateId },
        select: { id: true },
      });

      if (!candidate) {
        throw new AppError('Candidate not found', 404, ErrorCode.NOT_FOUND);
      }

      // Build where clause for filtering
      const whereClause: any = {
        candidateId: candidateId,
        // Only return active recommendations by default
        status: filters.status || CandidateRecommendationStatusEnum.ACTIVE,
      };

      // Apply optional filters
      if (filters.jobPostingId) {
        whereClause.jobPostingId = filters.jobPostingId;
      }

      if (filters.minScore !== undefined) {
        whereClause.score = { gte: filters.minScore };
      }

      if (filters.maxScore !== undefined) {
        whereClause.score = {
          ...whereClause.score,
          lte: filters.maxScore,
        };
      }

      if (filters.isViewed !== undefined) {
        whereClause.isViewed = filters.isViewed;
      }

      if (filters.isSaved !== undefined) {
        whereClause.isSaved = filters.isSaved;
      }

      if (filters.hasApplied !== undefined) {
        whereClause.hasApplied = filters.hasApplied;
      }

      // Add date range filters
      if (filters.createdAfter) {
        whereClause.createdAt = {
          ...whereClause.createdAt,
          gte: filters.createdAfter,
        };
      }

      if (filters.createdBefore) {
        whereClause.createdAt = {
          ...whereClause.createdAt,
          lte: filters.createdBefore,
        };
      }

      // Add job posting related filters
      if (filters.industry || filters.location || filters.jobType) {
        whereClause.jobPosting = {};

        if (filters.industry) {
          whereClause.jobPosting.industry = filters.industry;
        }

        if (filters.jobType) {
          whereClause.jobPosting.jobType = filters.jobType;
        }

        if (filters.location) {
          whereClause.jobPosting.OR = [
            { preferredLocations: { has: filters.location } },
            { isRemote: true },
          ];
        }
      }

      // Get total count
      const totalCount = await this.prisma.candidate_recommendation.count({
        where: whereClause,
      });

      // Get paginated results
      const paginationInfo = getPaginationInfo(pagination);
      const recommendations =
        await this.prisma.candidate_recommendation.findMany({
          where: whereClause,
          include: {
            feedback: true,
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
          orderBy: [
            { score: 'desc' }, // Order by score descending
            { createdAt: 'desc' }, // Then by creation date
          ],
          skip: paginationInfo.skip,
          take: paginationInfo.take,
        });

      const transformedRecommendations = recommendations.map(
        toCandidateRecommendationDomain
      );

      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      const totalPages = Math.ceil(totalCount / limit);

      return {
        items: transformedRecommendations,
        pagination: {
          total: totalCount,
          page: page,
          limit: limit,
          totalPages: totalPages,
        },
      };
    } catch (error) {
      logger.error('Error getting candidate recommendations', {
        error,
        candidateId,
        filters,
      });
      throw error;
    }
  }

  /**
   * Get a single candidate recommendation
   */
  async getCandidateRecommendation(
    candidateId: string,
    recommendationId: string
  ): Promise<ICandidateRecommendation> {
    try {
      // Verify that the candidate exists
      const candidate = await this.prisma.candidate.findUnique({
        where: { id: candidateId },
        select: { id: true },
      });

      if (!candidate) {
        throw new AppError('Candidate not found', 404, ErrorCode.NOT_FOUND);
      }

      const recommendation =
        await this.prisma.candidate_recommendation.findFirst({
          where: {
            id: recommendationId,
            candidateId: candidateId,
          },
          include: {
            feedback: true,
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

      if (!recommendation) {
        throw new AppError(
          'Recommendation not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      return toCandidateRecommendationDomain(recommendation);
    } catch (error) {
      logger.error('Error getting candidate recommendation', {
        error,
        candidateId,
        recommendationId,
      });
      throw error;
    }
  }

  /**
   * Reject a candidate recommendation with feedback
   */
  async rejectCandidateRecommendation(
    candidateId: string,
    recommendationId: string,
    rejectData: ICandidateRecommendationReject
  ): Promise<ICandidateRecommendation> {
    try {
      // Verify that the candidate exists
      const candidate = await this.prisma.candidate.findUnique({
        where: { id: candidateId },
        select: { id: true },
      });

      if (!candidate) {
        throw new AppError('Candidate not found', 404, ErrorCode.NOT_FOUND);
      }

      // Verify that the recommendation exists and belongs to the candidate
      const existingRecommendation =
        await this.prisma.candidate_recommendation.findFirst({
          where: {
            id: recommendationId,
            candidateId: candidateId,
          },
        });

      if (!existingRecommendation) {
        throw new AppError(
          'Recommendation not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Check if already rejected
      if (
        existingRecommendation.status ===
        CandidateRecommendationStatusEnum.REJECTED
      ) {
        throw new AppError(
          'Recommendation has already been rejected',
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }

      // Use transaction to update recommendation and create feedback
      const result = await this.prisma.$transaction(async (tx) => {
        // Update recommendation status to REJECTED
        await tx.candidate_recommendation.update({
          where: {
            id: recommendationId,
          },
          data: {
            status: CandidateRecommendationStatusEnum.REJECTED,
            updatedAt: new Date(),
          },
        });

        // Create feedback record
        await tx.candidate_recommendation_feedback.create({
          data: {
            candidateRecommendationId: recommendationId,
            type: rejectData.feedbackType,
            comment: rejectData.comment,
            reason: rejectData.reason,
            isHelpful: rejectData.isHelpful || false,
          },
        });

        // Return the updated recommendation with includes
        return await tx.candidate_recommendation.findUnique({
          where: {
            id: recommendationId,
          },
          include: {
            feedback: true,
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
      });

      if (!result) {
        throw new AppError(
          'Failed to reject recommendation',
          500,
          ErrorCode.INTERNAL_SERVER_ERROR
        );
      }

      logger.info('Candidate recommendation rejected successfully', {
        candidateId,
        recommendationId,
        feedbackType: rejectData.feedbackType,
      });

      return toCandidateRecommendationDomain(result);
    } catch (error) {
      logger.error('Error rejecting candidate recommendation', {
        error,
        candidateId,
        recommendationId,
      });
      throw error;
    }
  }

  /**
   * Mark a candidate recommendation as viewed
   */
  async markCandidateRecommendationAsViewed(
    candidateId: string,
    recommendationId: string
  ): Promise<ICandidateRecommendation> {
    try {
      // Verify that the candidate exists
      const candidate = await this.prisma.candidate.findUnique({
        where: { id: candidateId },
        select: { id: true },
      });

      if (!candidate) {
        throw new AppError('Candidate not found', 404, ErrorCode.NOT_FOUND);
      }

      // Update recommendation to mark as viewed
      const updatedRecommendation =
        await this.prisma.candidate_recommendation.update({
          where: {
            id: recommendationId,
            candidateId: candidateId,
          },
          data: {
            isViewed: true,
            updatedAt: new Date(),
          },
          include: {
            feedback: true,
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

      logger.info('Candidate recommendation marked as viewed', {
        candidateId,
        recommendationId,
      });

      return toCandidateRecommendationDomain(updatedRecommendation);
    } catch (error) {
      logger.error('Error marking candidate recommendation as viewed', {
        error,
        candidateId,
        recommendationId,
      });
      throw error;
    }
  }

  /**
   * Save a candidate recommendation
   */
  async saveCandidateRecommendation(
    candidateId: string,
    recommendationId: string
  ): Promise<ICandidateRecommendation> {
    try {
      // Verify that the candidate exists
      const candidate = await this.prisma.candidate.findUnique({
        where: { id: candidateId },
        select: { id: true },
      });

      if (!candidate) {
        throw new AppError('Candidate not found', 404, ErrorCode.NOT_FOUND);
      }

      // Update recommendation to mark as saved
      const updatedRecommendation =
        await this.prisma.candidate_recommendation.update({
          where: {
            id: recommendationId,
            candidateId: candidateId,
          },
          data: {
            isSaved: true,
            updatedAt: new Date(),
          },
          include: {
            feedback: true,
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

      logger.info('Candidate recommendation saved', {
        candidateId,
        recommendationId,
      });

      return toCandidateRecommendationDomain(updatedRecommendation);
    } catch (error) {
      logger.error('Error saving candidate recommendation', {
        error,
        candidateId,
        recommendationId,
      });
      throw error;
    }
  }

  /**
   * Unsave a candidate recommendation
   */
  async unsaveCandidateRecommendation(
    candidateId: string,
    recommendationId: string
  ): Promise<ICandidateRecommendation> {
    try {
      // Verify that the candidate exists
      const candidate = await this.prisma.candidate.findUnique({
        where: { id: candidateId },
        select: { id: true },
      });

      if (!candidate) {
        throw new AppError('Candidate not found', 404, ErrorCode.NOT_FOUND);
      }

      // Update recommendation to mark as unsaved
      const updatedRecommendation =
        await this.prisma.candidate_recommendation.update({
          where: {
            id: recommendationId,
            candidateId: candidateId,
          },
          data: {
            isSaved: false,
            updatedAt: new Date(),
          },
          include: {
            feedback: true,
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

      logger.info('Candidate recommendation unsaved', {
        candidateId,
        recommendationId,
      });

      return toCandidateRecommendationDomain(updatedRecommendation);
    } catch (error) {
      logger.error('Error unsaving candidate recommendation', {
        error,
        candidateId,
        recommendationId,
      });
      throw error;
    }
  }
}
