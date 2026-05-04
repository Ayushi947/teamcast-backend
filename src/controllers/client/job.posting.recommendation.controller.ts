import { Request, Response, NextFunction } from 'express';
import { ClientJobPostingRecommendationService } from '@/services/client/job.posting.recommendation.service';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import {
  IJobPostingRecommendationListApiRequest,
  IJobPostingRecommendationListApiResponse,
  IJobPostingRecommendationGetApiRequest,
  IJobPostingRecommendationGetApiResponse,
  IJobPostingRecommendationRejectApiRequest,
  IJobPostingRecommendationRejectApiResponse,
  IJobPostingRecommendationMarkViewedApiRequest,
  IJobPostingRecommendationMarkViewedApiResponse,
  IJobPostingRecommendationSaveApiRequest,
  IJobPostingRecommendationSaveApiResponse,
  IJobPostingRecommendationUnsaveApiRequest,
  IJobPostingRecommendationUnsaveApiResponse,
} from '@/shared/models/api/client/job.posting.recommendation.api';
import { singleton } from '@/shared/decorators/singleton';

@singleton
export class ClientJobPostingRecommendationController extends BaseController {
  constructor(
    private readonly jobPostingRecommendationService: ClientJobPostingRecommendationService
  ) {
    super();
  }

  /**
   * Get job posting recommendations with pagination and filtering
   */
  getJobPostingRecommendations = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IJobPostingRecommendationListApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const requestData =
          createIApiRequest<IJobPostingRecommendationListApiRequest>(req);
        const jobPostingId = requestData.params.jobPostingId;

        return await this.jobPostingRecommendationService.getJobPostingRecommendations(
          clientId,
          jobPostingId,
          requestData.filters,
          requestData.pagination
        );
      }
    );
  };

  /**
   * Get a single job posting recommendation
   */
  getJobPostingRecommendation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IJobPostingRecommendationGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const requestData =
          createIApiRequest<IJobPostingRecommendationGetApiRequest>(req);
        const { jobPostingId, recommendationId } = requestData.params;

        return await this.jobPostingRecommendationService.getJobPostingRecommendation(
          clientId,
          jobPostingId,
          recommendationId
        );
      }
    );
  };

  /**
   * Reject a job posting recommendation with feedback
   */
  rejectJobPostingRecommendation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IJobPostingRecommendationRejectApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const requestData =
          createIApiRequest<IJobPostingRecommendationRejectApiRequest>(req);
        const { jobPostingId, recommendationId } = requestData.params;

        return await this.jobPostingRecommendationService.rejectJobPostingRecommendation(
          clientId,
          jobPostingId,
          recommendationId,
          requestData.data
        );
      }
    );
  };

  /**
   * Mark a job posting recommendation as viewed
   */
  markJobPostingRecommendationAsViewed = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IJobPostingRecommendationMarkViewedApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const requestData =
          createIApiRequest<IJobPostingRecommendationMarkViewedApiRequest>(req);
        const { jobPostingId, recommendationId } = requestData.params;

        return await this.jobPostingRecommendationService.markJobPostingRecommendationAsViewed(
          clientId,
          jobPostingId,
          recommendationId
        );
      }
    );
  };

  /**
   * Save a job posting recommendation
   */
  saveJobPostingRecommendation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IJobPostingRecommendationSaveApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const requestData =
          createIApiRequest<IJobPostingRecommendationSaveApiRequest>(req);
        const { jobPostingId, recommendationId } = requestData.params;

        return await this.jobPostingRecommendationService.saveJobPostingRecommendation(
          clientId,
          jobPostingId,
          recommendationId
        );
      }
    );
  };

  /**
   * Unsave a job posting recommendation
   */
  unsaveJobPostingRecommendation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IJobPostingRecommendationUnsaveApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const requestData =
          createIApiRequest<IJobPostingRecommendationUnsaveApiRequest>(req);
        const { jobPostingId, recommendationId } = requestData.params;

        return await this.jobPostingRecommendationService.unsaveJobPostingRecommendation(
          clientId,
          jobPostingId,
          recommendationId
        );
      }
    );
  };
}
