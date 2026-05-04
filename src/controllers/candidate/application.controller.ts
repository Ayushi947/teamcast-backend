import { Request, Response, NextFunction } from 'express';
import { CandidateApplicationService } from '@/services/candidate/application.service';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import {
  ICandidateJobApplicationListGetApiResponse,
  ICandidateJobApplicationGetApiRequest,
  ICandidateJobApplicationGetApiResponse,
  ICandidateJobApplicationUpdateApiRequest,
  ICandidateJobApplicationUpdateApiResponse,
  ICandidateJobApplicationListRequest,
  ICandidateJobApplicationAcceptApiRequest,
  ICandidateJobApplicationAcceptApiResponse,
  ICandidateJobApplicationRejectApiRequest,
  ICandidateJobApplicationRejectApiResponse,
  ICandidateJobApplicationWithdrawApiRequest,
  ICandidateJobApplicationWithdrawApiResponse,
  ICandidateJobApplicationGetAiAssessmentApiResponse,
  ICandidateJobApplicationGetAiAssessmentApiRequest,
} from '@/shared/models/api/candidate/application.api';
import { singleton } from '@/shared/decorators/singleton';
import { ErrorCode } from '@/utils/error.codes';
import { AppError } from '@/utils/app.error';

@singleton
export class ApplicationController extends BaseController {
  constructor(
    private readonly applicationService: CandidateApplicationService
  ) {
    super();
  }

  /**
   * Get all job applications for the candidate
   */
  getApplications = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateJobApplicationListGetApiResponse>(
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
        const request =
          createIApiRequest<ICandidateJobApplicationListRequest>(req);
        return await this.applicationService.getApplications(
          candidateId,
          request.filters,
          request.pagination
        );
      }
    );
  };

  /**
   * Get a specific job application
   */
  getApplication = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateJobApplicationGetApiResponse>(
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
        const { params } =
          createIApiRequest<ICandidateJobApplicationGetApiRequest>(req);
        return await this.applicationService.getApplication(
          candidateId,
          params.applicationId
        );
      }
    );
  };

  /**
   * Update a job application (accept/reject invitation or update details)
   */
  updateApplication = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateJobApplicationUpdateApiResponse>(
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
          createIApiRequest<ICandidateJobApplicationUpdateApiRequest>(req);
        return await this.applicationService.updateApplication(
          candidateId,
          params.applicationId,
          data
        );
      }
    );
  };

  /**
   * Accept a job application
   */
  acceptApplication = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateJobApplicationAcceptApiResponse>(
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
          createIApiRequest<ICandidateJobApplicationAcceptApiRequest>(req);
        return await this.applicationService.acceptApplication(
          candidateId,
          params.applicationId,
          data
        );
      }
    );
  };

  /**
   * Reject a job application
   */
  rejectApplication = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateJobApplicationRejectApiResponse>(
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
          createIApiRequest<ICandidateJobApplicationRejectApiRequest>(req);
        return await this.applicationService.rejectApplication(
          candidateId,
          params.applicationId,
          data
        );
      }
    );
  };

  /**
   * Withdraw a job application
   */
  withdrawApplication = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateJobApplicationWithdrawApiResponse>(
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
          createIApiRequest<ICandidateJobApplicationWithdrawApiRequest>(req);
        return await this.applicationService.withdrawApplication(
          candidateId,
          params.applicationId,
          data
        );
      }
    );
  };

  /**
   * Get the AI assessment for a specific application
   */
  getCandidateApplicationAiAssessment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateJobApplicationGetAiAssessmentApiResponse>(
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
        // Get the application ID from the request parameters
        const getRequest =
          createIApiRequest<ICandidateJobApplicationGetAiAssessmentApiRequest>(
            req
          );
        const applicationId = getRequest.params.applicationId;

        // Call service method with domain model
        return await this.applicationService.getCandidateApplicationAiAssessment(
          candidateId,
          applicationId
        );
      }
    );
  };
}
