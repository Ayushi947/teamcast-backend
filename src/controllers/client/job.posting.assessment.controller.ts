import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import {
  IJobPostingAssessmentStartApiRequest,
  IJobPostingAssessmentStartApiResponse,
  IJobPostingAssessmentTaskGetApiRequest,
  IJobPostingAssessmentTaskGetApiResponse,
  IJobPostingAssessmentGetApiRequest,
  IJobPostingAssessmentGetApiResponse,
  IJobPostingAssessmentGetByJobPostingApiRequest,
  IJobPostingAssessmentGetLatestApiResponse,
  IJobPostingAssessmentGetAllApiResponse,
} from '@/shared/models/api/client/job.posting.assessment.api';
import { singleton } from '@/shared/decorators/singleton';
import { ErrorCode } from '@/utils/error.codes';
import { AppError } from '@/utils/app.error';
import { ClientJobPostingAssessmentService } from '@/services/client/job.posting.assessment.service';

@singleton
export class JobPostingAssessmentController extends BaseController {
  constructor(
    private readonly jobPostingAssessmentService: ClientJobPostingAssessmentService
  ) {
    super();
  }

  /**
   * Start job posting assessment
   */
  startAssessment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IJobPostingAssessmentStartApiResponse>(
      req,
      res,
      next,
      async () => {
        const { params } =
          createIApiRequest<IJobPostingAssessmentStartApiRequest>(req);
        const clientId = req.user.clientId;

        if (!clientId) {
          throw new AppError(
            'Client ID is required',
            400,
            ErrorCode.CLIENT_USER_ID_REQUIRED
          );
        }

        return await this.jobPostingAssessmentService.startAssessment(
          params.jobPostingId,
          clientId
        );
      }
    );
  };

  /**
   * Get assessment task status for a job posting
   */
  getAssessmentTaskForJobPosting = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IJobPostingAssessmentTaskGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const { params } =
          createIApiRequest<IJobPostingAssessmentGetByJobPostingApiRequest>(
            req
          );
        const clientId = req.user.clientId;

        if (!clientId) {
          throw new AppError(
            'Client ID is required',
            400,
            ErrorCode.CLIENT_USER_ID_REQUIRED
          );
        }

        return await this.jobPostingAssessmentService.getAssessmentTaskForJobPosting(
          params.jobPostingId,
          clientId
        );
      }
    );
  };

  /**
   * Get assessment task status
   */
  getAssessmentTask = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IJobPostingAssessmentTaskGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const { params } =
          createIApiRequest<IJobPostingAssessmentTaskGetApiRequest>(req);
        const clientId = req.user.clientId;

        if (!clientId) {
          throw new AppError(
            'Client ID is required',
            400,
            ErrorCode.CLIENT_USER_ID_REQUIRED
          );
        }

        return await this.jobPostingAssessmentService.getAssessmentTask(
          params.taskId,
          clientId
        );
      }
    );
  };

  /**
   * Get assessment results
   */
  getAssessment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IJobPostingAssessmentGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const { params } =
          createIApiRequest<IJobPostingAssessmentGetApiRequest>(req);
        const clientId = req.user.clientId;

        if (!clientId) {
          throw new AppError(
            'Client ID is required',
            400,
            ErrorCode.CLIENT_USER_ID_REQUIRED
          );
        }

        return await this.jobPostingAssessmentService.getAssessment(
          params.assessmentId,
          clientId
        );
      }
    );
  };

  /**
   * Get latest assessment results for a job posting
   */
  getLatestAssessmentForJobPosting = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IJobPostingAssessmentGetLatestApiResponse>(
      req,
      res,
      next,
      async () => {
        const { params } =
          createIApiRequest<IJobPostingAssessmentGetByJobPostingApiRequest>(
            req
          );
        const clientId = req.user.clientId;

        if (!clientId) {
          throw new AppError(
            'Client ID is required',
            400,
            ErrorCode.CLIENT_USER_ID_REQUIRED
          );
        }

        return await this.jobPostingAssessmentService.getLatestAssessmentForJobPosting(
          params.jobPostingId,
          clientId
        );
      }
    );
  };

  /**
   * Get all assessment results for a job posting
   */
  getAllAssessmentsForJobPosting = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IJobPostingAssessmentGetAllApiResponse>(
      req,
      res,
      next,
      async () => {
        const { params } =
          createIApiRequest<IJobPostingAssessmentGetByJobPostingApiRequest>(
            req
          );
        const clientId = req.user.clientId;

        if (!clientId) {
          throw new AppError(
            'Client ID is required',
            400,
            ErrorCode.CLIENT_USER_ID_REQUIRED
          );
        }

        return await this.jobPostingAssessmentService.getAllAssessmentsForJobPosting(
          params.jobPostingId,
          clientId
        );
      }
    );
  };
}
