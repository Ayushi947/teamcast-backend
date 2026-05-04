import { PrismaClient } from '@prisma/client';
import { singleton } from '@/shared/decorators/singleton';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';
import {
  IJobPostingRecommendation,
  IJobPostingRecommendationFilterQuery,
  IJobRecommendationReject,
  toJobPostingRecommendationDomain,
} from '@/shared/models/domain/client/job.posting.recommendation.domain';
import {
  IPaginationRequest,
  IPaginatedResponse,
} from '@/shared/models/api/common/common.api';
import { getPaginationInfo } from '@/utils/pagination';
import { JobRecommendationStatusEnum } from '@/shared/models/common/enums';

@singleton
export class ClientJobPostingRecommendationService {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get job posting recommendations with pagination and filtering
   */
  async getJobPostingRecommendations(
    clientId: string,
    jobPostingId: string,
    filters: IJobPostingRecommendationFilterQuery,
    pagination: IPaginationRequest
  ): Promise<IPaginatedResponse<IJobPostingRecommendation>> {
    try {
      // Verify that the job posting belongs to the client
      const jobPosting = await this.prisma.job_posting.findFirst({
        where: {
          id: jobPostingId,
          clientId: clientId,
        },
      });

      if (!jobPosting) {
        throw new AppError(
          'Job posting not found or does not belong to this client',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Build where clause for filtering
      const whereClause: any = {
        jobPostingId: jobPostingId,
        // Only return active recommendations by default
        status: filters.status || JobRecommendationStatusEnum.ACTIVE,
      };

      // Apply optional filters
      if (filters.candidateId) {
        whereClause.candidateId = filters.candidateId;
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

      if (filters.isInvited !== undefined) {
        whereClause.isInvited = filters.isInvited;
      }

      // Get total count
      const totalCount = await this.prisma.job_posting_recommendation.count({
        where: whereClause,
      });

      // Get paginated results
      const paginationInfo = getPaginationInfo(pagination);
      const recommendations =
        await this.prisma.job_posting_recommendation.findMany({
          where: whereClause,
          include: {
            candidate: {
              include: {
                resume: {
                  include: {
                    education: true,
                    certifications: true,
                    experience: {
                      include: {
                        projects: true,
                      },
                    },
                  },
                },
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                  },
                },
              },
            },
            feedback: true,
          },
          orderBy: [
            { score: 'desc' }, // Order by score descending
            { createdAt: 'desc' }, // Then by creation date
          ],
          skip: paginationInfo.skip,
          take: paginationInfo.take,
        });

      const transformedRecommendations = recommendations.map(
        toJobPostingRecommendationDomain
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
      logger.error('Error getting job posting recommendations', {
        error,
        clientId,
        jobPostingId,
        filters,
      });
      throw error;
    }
  }

  /**
   * Get a single job posting recommendation
   */
  async getJobPostingRecommendation(
    clientId: string,
    jobPostingId: string,
    recommendationId: string
  ): Promise<IJobPostingRecommendation> {
    try {
      // Verify that the job posting belongs to the client
      const jobPosting = await this.prisma.job_posting.findFirst({
        where: {
          id: jobPostingId,
          clientId: clientId,
        },
      });

      if (!jobPosting) {
        throw new AppError(
          'Job posting not found or does not belong to this client',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      const recommendation =
        await this.prisma.job_posting_recommendation.findFirst({
          where: {
            id: recommendationId,
            jobPostingId: jobPostingId,
          },
          include: {
            candidate: {
              include: {
                resume: {
                  include: {
                    education: true,
                    certifications: true,
                    experience: {
                      include: {
                        projects: true,
                      },
                    },
                  },
                },
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                  },
                },
              },
            },
            feedback: true,
          },
        });

      if (!recommendation) {
        throw new AppError(
          'Recommendation not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      return toJobPostingRecommendationDomain(recommendation);
    } catch (error) {
      logger.error('Error getting job posting recommendation', {
        error,
        clientId,
        jobPostingId,
        recommendationId,
      });
      throw error;
    }
  }

  /**
   * Reject a job posting recommendation with feedback
   */
  async rejectJobPostingRecommendation(
    clientId: string,
    jobPostingId: string,
    recommendationId: string,
    rejectData: IJobRecommendationReject
  ): Promise<IJobPostingRecommendation> {
    try {
      // Verify that the job posting belongs to the client
      const jobPosting = await this.prisma.job_posting.findFirst({
        where: {
          id: jobPostingId,
          clientId: clientId,
        },
      });

      if (!jobPosting) {
        throw new AppError(
          'Job posting not found or does not belong to this client',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Check if recommendation exists and is not already rejected
      const existingRecommendation =
        await this.prisma.job_posting_recommendation.findFirst({
          where: {
            id: recommendationId,
            jobPostingId: jobPostingId,
          },
        });

      if (!existingRecommendation) {
        throw new AppError(
          'Recommendation not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      if (
        existingRecommendation.status === JobRecommendationStatusEnum.REJECTED
      ) {
        throw new AppError(
          'Recommendation is already rejected',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      // Use transaction to update recommendation and create feedback
      const result = await this.prisma.$transaction(async (tx) => {
        // Update recommendation status to REJECTED
        await tx.job_posting_recommendation.update({
          where: {
            id: recommendationId,
          },
          data: {
            status: JobRecommendationStatusEnum.REJECTED,
            updatedAt: new Date(),
          },
        });

        // Create feedback record
        await tx.job_recommendation_feedback.create({
          data: {
            jobRecommendationId: recommendationId,
            type: rejectData.feedbackType,
            comment: rejectData.comment,
            reason: rejectData.reason,
            isHelpful: rejectData.isHelpful || false,
          },
        });

        // Return the updated recommendation with includes
        return await tx.job_posting_recommendation.findUnique({
          where: {
            id: recommendationId,
          },
          include: {
            candidate: {
              include: {
                resume: {
                  include: {
                    education: true,
                    certifications: true,
                    experience: {
                      include: {
                        projects: true,
                      },
                    },
                  },
                },
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                  },
                },
              },
            },
            feedback: true,
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

      logger.info('Job posting recommendation rejected successfully', {
        clientId,
        jobPostingId,
        recommendationId,
        feedbackType: rejectData.feedbackType,
      });

      return toJobPostingRecommendationDomain(result);
    } catch (error) {
      logger.error('Error rejecting job posting recommendation', {
        error,
        clientId,
        jobPostingId,
        recommendationId,
        rejectData,
      });
      throw error;
    }
  }

  /**
   * Mark a job posting recommendation as viewed
   */
  async markJobPostingRecommendationAsViewed(
    clientId: string,
    jobPostingId: string,
    recommendationId: string
  ): Promise<IJobPostingRecommendation> {
    try {
      // Verify that the job posting belongs to the client
      const jobPosting = await this.prisma.job_posting.findFirst({
        where: {
          id: jobPostingId,
          clientId: clientId,
        },
      });

      if (!jobPosting) {
        throw new AppError(
          'Job posting not found or does not belong to this client',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Update recommendation to mark as viewed
      const updatedRecommendation =
        await this.prisma.job_posting_recommendation.update({
          where: {
            id: recommendationId,
            jobPostingId: jobPostingId,
          },
          data: {
            isViewed: true,
            updatedAt: new Date(),
          },
          include: {
            candidate: {
              include: {
                resume: {
                  include: {
                    education: true,
                    certifications: true,
                    experience: {
                      include: {
                        projects: true,
                      },
                    },
                  },
                },
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                  },
                },
              },
            },
            feedback: true,
          },
        });

      logger.info('Job posting recommendation marked as viewed', {
        clientId,
        jobPostingId,
        recommendationId,
      });

      return toJobPostingRecommendationDomain(updatedRecommendation);
    } catch (error) {
      logger.error('Error marking job posting recommendation as viewed', {
        error,
        clientId,
        jobPostingId,
        recommendationId,
      });
      throw error;
    }
  }

  /**
   * Save a job posting recommendation
   */
  async saveJobPostingRecommendation(
    clientId: string,
    jobPostingId: string,
    recommendationId: string
  ): Promise<IJobPostingRecommendation> {
    try {
      // Verify that the job posting belongs to the client
      const jobPosting = await this.prisma.job_posting.findFirst({
        where: {
          id: jobPostingId,
          clientId: clientId,
        },
      });

      if (!jobPosting) {
        throw new AppError(
          'Job posting not found or does not belong to this client',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Update recommendation to mark as saved
      const updatedRecommendation =
        await this.prisma.job_posting_recommendation.update({
          where: {
            id: recommendationId,
            jobPostingId: jobPostingId,
          },
          data: {
            isSaved: true,
            updatedAt: new Date(),
          },
          include: {
            candidate: {
              include: {
                resume: {
                  include: {
                    education: true,
                    certifications: true,
                    experience: {
                      include: {
                        projects: true,
                      },
                    },
                  },
                },
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                  },
                },
              },
            },
            feedback: true,
          },
        });

      logger.info('Job posting recommendation saved', {
        clientId,
        jobPostingId,
        recommendationId,
      });

      return toJobPostingRecommendationDomain(updatedRecommendation);
    } catch (error) {
      logger.error('Error saving job posting recommendation', {
        error,
        clientId,
        jobPostingId,
        recommendationId,
      });
      throw error;
    }
  }

  /**
   * Unsave a job posting recommendation
   */
  async unsaveJobPostingRecommendation(
    clientId: string,
    jobPostingId: string,
    recommendationId: string
  ): Promise<IJobPostingRecommendation> {
    try {
      // Verify that the job posting belongs to the client
      const jobPosting = await this.prisma.job_posting.findFirst({
        where: {
          id: jobPostingId,
          clientId: clientId,
        },
      });

      if (!jobPosting) {
        throw new AppError(
          'Job posting not found or does not belong to this client',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Update recommendation to mark as unsaved
      const updatedRecommendation =
        await this.prisma.job_posting_recommendation.update({
          where: {
            id: recommendationId,
            jobPostingId: jobPostingId,
          },
          data: {
            isSaved: false,
            updatedAt: new Date(),
          },
          include: {
            candidate: {
              include: {
                resume: {
                  include: {
                    education: true,
                    certifications: true,
                    experience: {
                      include: {
                        projects: true,
                      },
                    },
                  },
                },
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                  },
                },
              },
            },
            feedback: true,
          },
        });

      logger.info('Job posting recommendation unsaved', {
        clientId,
        jobPostingId,
        recommendationId,
      });

      return toJobPostingRecommendationDomain(updatedRecommendation);
    } catch (error) {
      logger.error('Error unsaving job posting recommendation', {
        error,
        clientId,
        jobPostingId,
        recommendationId,
      });
      throw error;
    }
  }
}
