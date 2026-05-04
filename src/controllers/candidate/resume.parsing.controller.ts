import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import {
  IResumeUploadApiResponse,
  IResumeParsingTaskGetApiRequest,
  IResumeParsingTaskGetApiResponse,
  IResumeParsingGetParsedResumeApiRequest,
  IResumeParsingGetParsedResumeApiResponse,
  IResumePublicParsingUploadApiResponse,
  IResumePublicParsingTaskGetApiRequest,
  IResumePublicParsingTaskGetApiResponse,
  IResumePublicParsingGetResumeApiRequest,
  IResumePublicParsingGetResumeApiResponse,
} from '@/shared/models/api/candidate/resume.parsing.api';
import { singleton } from '@/shared/decorators/singleton';
import { ErrorCode } from '@/utils/error.codes';
import { AppError } from '@/utils/app.error';
import { CandidateResumeParsingService } from '@/services/candidate/resume.parsing.service';
import { ResumeParsingMode } from '@/shared/models/domain/candidate/resume.parsing.domain';

@singleton
export class ResumeParsingController extends BaseController {
  constructor(
    private readonly resumeParsingService: CandidateResumeParsingService
  ) {
    super();
  }

  /**
   * Upload resume file
   */
  uploadResume = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IResumeUploadApiResponse>(req, res, next, async () => {
      const candidateId = req.user.candidateId;
      if (!candidateId) {
        throw new AppError(
          'Candidate ID is required',
          400,
          ErrorCode.CANDIDATE_ID_REQUIRED
        );
      }

      if (!req.file) {
        throw new AppError(
          'Resume file is required',
          400,
          ErrorCode.FILE_REQUIRED
        );
      }

      // Get parsing mode from query parameter, default to INFERRED if not provided
      const mode =
        (req.query.mode as ResumeParsingMode) || ResumeParsingMode.INFERRED;

      // Validate mode
      if (!Object.values(ResumeParsingMode).includes(mode)) {
        throw new AppError(
          'Invalid parsing mode',
          400,
          ErrorCode.INVALID_PARSING_MODE
        );
      }

      return await this.resumeParsingService.uploadResume(
        candidateId,
        req.file.buffer,
        req.file.originalname,
        mode
      );
    });
  };

  /**
   * Get parsing task status
   */
  getParsingTask = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IResumeParsingTaskGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const { params } =
          createIApiRequest<IResumeParsingTaskGetApiRequest>(req);
        return await this.resumeParsingService.getParsingTask(params.taskId);
      }
    );
  };

  /**
   * Get parsing task status for the current candidate
   */
  getParsingTaskForCandidate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IResumeParsingTaskGetApiResponse>(
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
        return await this.resumeParsingService.getParsingTaskForCandidate(
          candidateId
        );
      }
    );
  };

  /**
   * Get parsed resume
   */
  getParsedResume = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IResumeParsingGetParsedResumeApiResponse>(
      req,
      res,
      next,
      async () => {
        const { params } =
          createIApiRequest<IResumeParsingGetParsedResumeApiRequest>(req);
        return await this.resumeParsingService.getParsedResume(params.taskId);
      }
    );
  };

  /**
   * Public endpoint to upload resume for async parsing
   */
  uploadResumePublic = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IResumePublicParsingUploadApiResponse>(
      req,
      res,
      next,
      async () => {
        if (!req.file) {
          throw new AppError(
            'Resume file is required',
            400,
            ErrorCode.FILE_REQUIRED
          );
        }

        const mode =
          (req.query.mode as ResumeParsingMode) || ResumeParsingMode.INFERRED;

        if (!Object.values(ResumeParsingMode).includes(mode)) {
          throw new AppError(
            'Invalid parsing mode',
            400,
            ErrorCode.INVALID_PARSING_MODE
          );
        }

        return await this.resumeParsingService.uploadResumePublic(
          req.file.buffer,
          req.file.originalname,
          mode
        );
      }
    );
  };

  /**
   * Get public parsing task status
   */
  getPublicParsingTask = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IResumePublicParsingTaskGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const { params } =
          createIApiRequest<IResumePublicParsingTaskGetApiRequest>(req);
        return await this.resumeParsingService.getPublicParsingTask(
          params.taskId
        );
      }
    );
  };

  /**
   * Get parsed resume from public task
   */
  getParsedResumeFromPublicTask = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IResumePublicParsingGetResumeApiResponse>(
      req,
      res,
      next,
      async () => {
        const { params } =
          createIApiRequest<IResumePublicParsingGetResumeApiRequest>(req);
        return await this.resumeParsingService.getParsedResumeFromPublicTask(
          params.taskId
        );
      }
    );
  };
}
