import { Request, Response, NextFunction } from 'express';
import { singleton } from '@/shared/decorators/singleton';
import { SupportJobPostingRecommendationService } from '@/services/support/job.posting.recommendation.service';
import { BaseController } from '../common/base.controller';
import { IPaginatedResponse } from '@/shared/models/api/common/common.api';
import {
  ISupportJobRecommendationPreview,
  ISupportStoreRecommendationsResponse,
  ISupportStoredJobRecommendation,
} from '@/shared/models/domain/support/job.posting.recommendation.domain';

@singleton
export class SupportJobPostingRecommendationController extends BaseController {
  constructor(
    private readonly service: SupportJobPostingRecommendationService
  ) {
    super();
  }

  /**
   * Get job recommendations preview for recruiter review
   * @route GET /api/support/job-postings/:jobPostingId/recommendations/preview
   */
  getRecommendationsPreview = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPaginatedResponse<ISupportJobRecommendationPreview>>(
      req,
      res,
      next,
      async () => {
        const { jobPostingId } = req.params;
        const {
          page = 1,
          limit = 25,
          sortBy,
          sortOrder,
          prevSyncDateTime,
          search,
          searchColumns,
          candidateSearch,
        } = req.query;

        const pagination = {
          page: parseInt(page as string, 10) || 1,
          limit: parseInt(limit as string, 10) || 25,
          sortBy: sortBy as string,
          sortOrder: sortOrder as 'asc' | 'desc',
          search: search as string,
          searchColumns: searchColumns as string[],
        };

        const parsedPrevSync = prevSyncDateTime
          ? new Date(prevSyncDateTime as string)
          : undefined;

        return await this.service.getJobRecommendationsPreview(
          jobPostingId,
          pagination,
          parsedPrevSync,
          candidateSearch as string
        );
      }
    );
  };

  /**
   * Store selected recommendations to database
   * @route POST /api/support/job-postings/:jobPostingId/recommendations/store
   */
  storeSelectedRecommendations = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportStoreRecommendationsResponse>(
      req,
      res,
      next,
      async () => {
        const { jobPostingId } = req.params;
        const { selectedCandidateIds, recommendations } = req.body;

        const request = {
          jobPostingId,
          selectedCandidateIds,
          recommendations,
        };

        return await this.service.storeSelectedRecommendations(request);
      }
    );
  };

  /**
   * Get existing stored recommendations for a job posting
   * @route GET /api/support/job-postings/:jobPostingId/recommendations
   */
  getStoredRecommendations = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPaginatedResponse<ISupportStoredJobRecommendation>>(
      req,
      res,
      next,
      async () => {
        const { jobPostingId } = req.params;
        const {
          page = 1,
          limit = 25,
          sortBy,
          sortOrder,
          search,
          searchColumns,
        } = req.query;

        const pagination = {
          page: parseInt(page as string, 10) || 1,
          limit: parseInt(limit as string, 10) || 25,
          sortBy: sortBy as string,
          sortOrder: sortOrder as 'asc' | 'desc',
          search: search as string,
          searchColumns: searchColumns as string[],
        };

        return await this.service.getStoredRecommendations(
          jobPostingId,
          pagination
        );
      }
    );
  };

  /**
   * Refresh recommendations for a job posting
   * @route POST /api/support/job-postings/:jobPostingId/recommendations/refresh
   */
  refreshRecommendations = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPaginatedResponse<ISupportJobRecommendationPreview>>(
      req,
      res,
      next,
      async () => {
        const { jobPostingId } = req.params;
        const { page = 1, limit = 25, sortBy, sortOrder } = req.body;

        const pagination = {
          page: parseInt(page as string, 10) || 1,
          limit: parseInt(limit as string, 10) || 25,
          sortBy: sortBy as string,
          sortOrder: sortOrder as 'asc' | 'desc',
        };

        return await this.service.getJobRecommendationsPreview(
          jobPostingId,
          pagination
        );
      }
    );
  };
}
