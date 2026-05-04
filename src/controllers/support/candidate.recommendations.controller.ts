import { singleton } from '@/shared/decorators/singleton';
import { CandidateRecommendationsService } from '@/services/support/candidate.recommendations.service';
import { NextFunction, Request, Response } from 'express';
import { BaseController } from '../common/base.controller';

import { createIApiRequest } from '@/utils/api.request';
import {
  ICreateCandidateRecommendationApiRequest,
  ICreateCandidateRecommendationResponse,
} from '@/shared/models/api/support/candidate.recommendations.api';
import { ISupportJobPostingListResponse } from '@/shared/models/domain/support/job.posting.domain';
import { IGetCandidateRecommendedJobsApiRequest } from '@/shared/models/api/candidate/recommendation.api';

@singleton
export class CandidateRecommendationsController extends BaseController {
  constructor(
    private readonly candidateRecommendationsService: CandidateRecommendationsService
  ) {
    super();
  }

  createCandidateRecommendation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    this.handleRequest<ICreateCandidateRecommendationResponse>(
      req,
      res,
      next,
      async () => {
        const request =
          createIApiRequest<ICreateCandidateRecommendationApiRequest>(req);

        const recommendation =
          await this.candidateRecommendationsService.createCandidateRecommendation(
            request.data.candidateId,
            request.data.jobId
          );

        return {
          data: recommendation,
          message: 'Candidate recommendation created successfully',
        };
      }
    );
  };

  getCandidateRecommendedJobs = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    this.handleRequest<ISupportJobPostingListResponse>(
      req,
      res,
      next,
      async () => {
        const request =
          createIApiRequest<IGetCandidateRecommendedJobsApiRequest>(req);

        const candidateRecommendations =
          await this.candidateRecommendationsService.getCandidateRecommendedJobs(
            request.params.candidateId
          );

        return {
          data: candidateRecommendations,
          message: 'Candidate recommendations fetched successfully',
        };
      }
    );
  };
}
