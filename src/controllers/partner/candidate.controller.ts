import { singleton } from '@/shared/decorators/singleton';
import { BaseController } from '../common/base.controller';
import { PartnerCandidateService } from '@/services/partner/candidate.service';
import { Request, Response, NextFunction } from 'express';
import {
  IPartnerCandidateGetApiRequest,
  IPartnerCandidateGetApiResponse,
  IPartnerCandidateListApiRequest,
  IPartnerCandidateListApiResponse,
  IPartnerCandidateUpdateApiRequest,
  IPartnerCandidateUpdateApiResponse,
  IPartnerCandidateDeleteApiRequest,
  IPartnerCandidateDeleteApiResponse,
  IPartnerCandidateRecommendationsApiRequest,
  IPartnerCandidateRecommendationsApiResponse,
  IPartnerCandidateRecommendationUpdateApiRequest,
  IPartnerCandidateRecommendationUpdateApiResponse,
} from '@/shared/models/api/partner/candidate.api';
import { createIApiRequest } from '@/utils/api.request';

@singleton
export class PartnerCandidateController extends BaseController {
  constructor(
    private readonly partnerCandidateService: PartnerCandidateService
  ) {
    super();
  }

  getPartnerCandidate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerCandidateGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.user.partnerId as string;

        // Get the candidate ID from the request parameters
        const getRequest =
          createIApiRequest<IPartnerCandidateGetApiRequest>(req);
        const candidateId = getRequest.params.candidateId;

        // Call service method with domain model
        return await this.partnerCandidateService.getPartnerCandidate(
          partnerId,
          candidateId
        );
      }
    );
  };

  updatePartnerCandidate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerCandidateUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.user.partnerId as string;
        const updatedBy = req.user.id;

        // Get the candidate data from the request body
        const updateRequest =
          createIApiRequest<IPartnerCandidateUpdateApiRequest>(req);
        const candidateId = req.params.candidateId;

        return await this.partnerCandidateService.updatePartnerCandidate(
          partnerId,
          candidateId,
          updatedBy,
          updateRequest.data
        );
      }
    );
  };

  deletePartnerCandidate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerCandidateDeleteApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.user.partnerId as string;
        const updatedBy = req.user.id;

        // Get the candidate ID from the request parameters
        const deleteRequest =
          createIApiRequest<IPartnerCandidateDeleteApiRequest>(req);
        const candidateId = deleteRequest.params.candidateId;

        // Call service method with domain model
        await this.partnerCandidateService.deletePartnerCandidate(
          partnerId,
          candidateId,
          updatedBy
        );

        return { success: true };
      }
    );
  };

  listPartnerCandidates = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerCandidateListApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.user.partnerId as string;

        // Get the filter and pagination data from the request
        const listRequest =
          createIApiRequest<IPartnerCandidateListApiRequest>(req);

        return await this.partnerCandidateService.listPartnerCandidates(
          partnerId,
          listRequest.filters,
          listRequest.pagination
        );
      }
    );
  };

  /**
   * Get recommended candidates for a specific job posting
   */
  getRecommendedCandidatesForJobPosting = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerCandidateRecommendationsApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.user.partnerId as string;

        // Get the job posting ID from the request parameters and pagination from query
        const recommendationsRequest =
          createIApiRequest<IPartnerCandidateRecommendationsApiRequest>(req);
        const jobPostingId = recommendationsRequest.params.jobPostingId;

        return await this.partnerCandidateService.getRecommendedCandidatesForJobPosting(
          partnerId,
          jobPostingId,
          recommendationsRequest.pagination
        );
      }
    );
  };

  /**
   * Update recommendation status for a candidate-job posting combination
   */
  updateCandidateRecommendationStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerCandidateRecommendationUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.user.partnerId as string;

        // Get the candidate ID, job posting ID from params and update data from body
        const updateRequest =
          createIApiRequest<IPartnerCandidateRecommendationUpdateApiRequest>(
            req
          );
        const { candidateId, jobPostingId } = updateRequest.params;

        await this.partnerCandidateService.updateCandidateRecommendationStatus(
          partnerId,
          candidateId,
          jobPostingId,
          updateRequest.data
        );

        return {
          success: true,
          message: 'Recommendation status updated successfully',
        };
      }
    );
  };
}
