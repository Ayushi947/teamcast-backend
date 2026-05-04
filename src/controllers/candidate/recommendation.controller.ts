import { Request, Response, NextFunction } from 'express';
import { singleton } from '../../shared/decorators/singleton';
import { CandidateRecommendationService } from '../../services/candidate/recommendation.service';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '../../utils/api.request';
import {
  ICandidateRecommendationListApiRequest,
  ICandidateRecommendationListApiResponse,
  ICandidateRecommendationGetApiRequest,
  ICandidateRecommendationApiResponse,
  IRejectCandidateRecommendationApiRequest,
  IRejectCandidateRecommendationApiResponse,
  IMarkCandidateRecommendationViewedApiRequest,
  IMarkCandidateRecommendationViewedApiResponse,
  ISaveCandidateRecommendationApiRequest,
  ISaveCandidateRecommendationApiResponse,
  IUnsaveCandidateRecommendationApiRequest,
  IUnsaveCandidateRecommendationApiResponse,
} from '../../shared/models/api/candidate/recommendation.api';

@singleton
export class CandidateRecommendationController extends BaseController {
  private readonly candidateRecommendationService: CandidateRecommendationService;

  constructor() {
    super();
    this.candidateRecommendationService = new CandidateRecommendationService();
  }

  /**
   * Get candidate recommendations with pagination and filtering
   */
  getCandidateRecommendations = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateRecommendationListApiResponse>(
      req,
      res,
      next,
      async () => {
        const requestData =
          createIApiRequest<ICandidateRecommendationListApiRequest>(req);
        const candidateId = req.user.candidateId as string;

        return await this.candidateRecommendationService.getCandidateRecommendations(
          candidateId,
          requestData.filters,
          requestData.pagination
        );
      }
    );
  };

  /**
   * Get a single candidate recommendation
   */
  getCandidateRecommendation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateRecommendationApiResponse>(
      req,
      res,
      next,
      async () => {
        const requestData =
          createIApiRequest<ICandidateRecommendationGetApiRequest>(req);
        const { recommendationId } = requestData.params;
        const candidateId = req.user.candidateId as string;

        return await this.candidateRecommendationService.getCandidateRecommendation(
          candidateId,
          recommendationId
        );
      }
    );
  };

  /**
   * Reject a candidate recommendation with feedback
   */
  rejectCandidateRecommendation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IRejectCandidateRecommendationApiResponse>(
      req,
      res,
      next,
      async () => {
        const requestData =
          createIApiRequest<IRejectCandidateRecommendationApiRequest>(req);
        const { recommendationId } = requestData.params;
        const candidateId = req.user.candidateId as string;

        return await this.candidateRecommendationService.rejectCandidateRecommendation(
          candidateId,
          recommendationId,
          requestData.data
        );
      }
    );
  };

  /**
   * Mark a candidate recommendation as viewed
   */
  markCandidateRecommendationAsViewed = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IMarkCandidateRecommendationViewedApiResponse>(
      req,
      res,
      next,
      async () => {
        const requestData =
          createIApiRequest<IMarkCandidateRecommendationViewedApiRequest>(req);
        const { recommendationId } = requestData.params;
        const candidateId = req.user.candidateId as string;

        return await this.candidateRecommendationService.markCandidateRecommendationAsViewed(
          candidateId,
          recommendationId
        );
      }
    );
  };

  /**
   * Save a candidate recommendation
   */
  saveCandidateRecommendation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISaveCandidateRecommendationApiResponse>(
      req,
      res,
      next,
      async () => {
        const requestData =
          createIApiRequest<ISaveCandidateRecommendationApiRequest>(req);
        const { recommendationId } = requestData.params;
        const candidateId = req.user.candidateId as string;

        return await this.candidateRecommendationService.saveCandidateRecommendation(
          candidateId,
          recommendationId
        );
      }
    );
  };

  /**
   * Unsave a candidate recommendation
   */
  unsaveCandidateRecommendation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IUnsaveCandidateRecommendationApiResponse>(
      req,
      res,
      next,
      async () => {
        const requestData =
          createIApiRequest<IUnsaveCandidateRecommendationApiRequest>(req);
        const { recommendationId } = requestData.params;
        const candidateId = req.user.candidateId as string;

        return await this.candidateRecommendationService.unsaveCandidateRecommendation(
          candidateId,
          recommendationId
        );
      }
    );
  };
}
