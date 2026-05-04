import { Request, Response, NextFunction } from 'express';
import { CandidateJobPostingService } from '@/services/candidate/job.posting.service';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import {
  ICandidateJobPostingListGetApiResponse,
  IJobPostingGetApiRequest,
  ICandidateJobPostingGetApiResponse,
  ICandidateJobPostingApplyApiRequest,
  ICandidateJobPostingApplyApiResponse,
} from '@/shared/models/api/candidate/job.posting.api';
import { singleton } from '@/shared/decorators/singleton';
import { ErrorCode } from '@/utils/error.codes';
import { AppError } from '@/utils/app.error';

@singleton
export class CandidateJobPostingController extends BaseController {
  constructor(private readonly jobPostingService: CandidateJobPostingService) {
    super();
  }

  /**
   * Get all job postings with pagination and filtering
   */
  getJobPostings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateJobPostingListGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const request = createIApiRequest(req);
        return await this.jobPostingService.getJobPostings(
          request.filters,
          request.pagination
        );
      }
    );
  };

  /**
   * Get a specific job posting
   */
  getJobPosting = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateJobPostingGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const { params } = createIApiRequest<IJobPostingGetApiRequest>(req);
        return await this.jobPostingService.getJobPosting(params.jobPostingId);
      }
    );
  };

  /**
   * Apply for a job posting
   */
  applyForJobPosting = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateJobPostingApplyApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user.candidateId;
        if (!candidateId) {
          throw new AppError(
            'Candidate ID is required',
            400,
            ErrorCode.CANDIDATE_ID_REQUIRED
          );
        }
        const { data, params } =
          createIApiRequest<ICandidateJobPostingApplyApiRequest>(req);
        return await this.jobPostingService.applyForJobPosting(
          candidateId,
          params.jobPostingId,
          data
        );
      }
    );
  };
}
