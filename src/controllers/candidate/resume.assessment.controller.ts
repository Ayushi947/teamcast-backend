import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import {
  IResumeAssessmentGetApiRequest,
  IResumeAssessmentGetApiResponse,
  IResumeAssessmentGetLatestByCandidateIdApiRequest,
  IResumeAssessmentStartApiResponse,
  IResumeAssessmentTaskGetApiRequest,
  IResumeAssessmentTaskGetApiResponse,
} from '@/shared/models/api/candidate/resume.assessment.api';
import { singleton } from '@/shared/decorators/singleton';
import { ErrorCode } from '@/utils/error.codes';
import { AppError } from '@/utils/app.error';
import { CandidateResumeAssessmentService } from '@/services/candidate/resume.assessment.service';

@singleton
export class ResumeAssessmentController extends BaseController {
  constructor(
    private readonly resumeAssessmentService: CandidateResumeAssessmentService
  ) {
    super();
  }

  /**
   * Start resume assessment
   */
  startAssessment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IResumeAssessmentStartApiResponse>(
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

        return await this.resumeAssessmentService.startAssessment(candidateId);
      }
    );
  };

  /**
   * Get assessment task status for the current candidate
   */
  getAssessmentTaskForCandidate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IResumeAssessmentTaskGetApiResponse>(
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
        return await this.resumeAssessmentService.getAssessmentTaskForCandidate(
          candidateId
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
    this.handleRequest<IResumeAssessmentTaskGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const { params } =
          createIApiRequest<IResumeAssessmentTaskGetApiRequest>(req);
        const candidateId = req.user.candidateId;
        if (!candidateId) {
          throw new AppError(
            'Candidate ID is required',
            400,
            ErrorCode.CANDIDATE_ID_REQUIRED
          );
        }

        return await this.resumeAssessmentService.getAssessmentTask(
          params.taskId!,
          candidateId
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
    this.handleRequest<IResumeAssessmentGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const { params } =
          createIApiRequest<IResumeAssessmentGetApiRequest>(req);
        const candidateId = req.user.candidateId;

        if (!candidateId) {
          throw new AppError(
            'Candidate ID is required',
            400,
            ErrorCode.CANDIDATE_ID_REQUIRED
          );
        }

        return await this.resumeAssessmentService.getAssessment(
          params.assessmentId,
          candidateId
        );
      }
    );
  };

  /**
   * Get latest assessment results
   */
  getLatestAssessment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IResumeAssessmentGetApiResponse>(
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

        return await this.resumeAssessmentService.getLatestAssessmentForCandidate(
          candidateId
        );
      }
    );
  };

  getLatestAssessmentByCandidateId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IResumeAssessmentGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const { params } =
          createIApiRequest<IResumeAssessmentGetLatestByCandidateIdApiRequest>(
            req
          );
        const candidateId = params.candidateId;
        if (!candidateId) {
          throw new AppError(
            'Candidate ID is required',
            400,
            ErrorCode.CANDIDATE_ID_REQUIRED
          );
        }

        return await this.resumeAssessmentService.getLatestAssessmentForCandidate(
          candidateId
        );
      }
    );
  };
  /**
   * Get assessment results
   */
  getAllAssessments = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IResumeAssessmentGetApiResponse>(
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

        return await this.resumeAssessmentService.getAllAssessmentsForCandidate(
          candidateId
        );
      }
    );
  };
}
