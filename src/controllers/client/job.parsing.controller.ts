import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import {
  IJobUploadApiResponse,
  IJobParsingTaskGetApiRequest,
  IJobParsingTaskGetApiResponse,
  IJobParsingGetParsedJobApiRequest,
  IJobParsingGetParsedJobApiResponse,
  IJobPublicParsingUploadApiResponse,
  IJobPublicParsingTaskGetApiRequest,
  IJobPublicParsingTaskGetApiResponse,
  IJobPublicParsingGetJobApiRequest,
  IJobPublicParsingGetJobApiResponse,
} from '@/shared/models/api/client/job.parsing.api';
import { singleton } from '@/shared/decorators/singleton';
import { ErrorCode } from '@/utils/error.codes';
import { AppError } from '@/utils/app.error';
import { ClientJobParsingService } from '@/services/client/job.parsing.service';
import { JobParsingMode } from '@/shared/models/domain/client/job.parsing.domain';

@singleton
export class JobParsingController extends BaseController {
  constructor(private readonly jobParsingService: ClientJobParsingService) {
    super();
  }

  /**
   * Upload job description file
   */
  uploadJobDescription = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IJobUploadApiResponse>(req, res, next, async () => {
      const clientId = req.user.clientId;
      if (!clientId) {
        throw new AppError(
          'Client ID is required',
          400,
          ErrorCode.CLIENT_USER_ID_REQUIRED
        );
      }

      const jobPostingId = req.params.jobPostingId;
      if (!jobPostingId) {
        throw new AppError(
          'Job posting ID is required',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      if (!req.file) {
        throw new AppError(
          'Job description file is required',
          400,
          ErrorCode.FILE_REQUIRED
        );
      }

      // Get parsing mode from query parameter, default to INFERRED if not provided
      const mode =
        (req.query.mode as JobParsingMode) || JobParsingMode.INFERRED;

      // Validate mode
      if (!Object.values(JobParsingMode).includes(mode)) {
        throw new AppError(
          'Invalid parsing mode',
          400,
          ErrorCode.INVALID_PARSING_MODE
        );
      }

      return await this.jobParsingService.uploadJobDescription(
        jobPostingId,
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
    this.handleRequest<IJobParsingTaskGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const { params } = createIApiRequest<IJobParsingTaskGetApiRequest>(req);
        return await this.jobParsingService.getParsingTask(params.taskId);
      }
    );
  };

  /**
   * Get parsing task status for the specific job posting
   */
  getParsingTaskForJobPosting = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IJobParsingTaskGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const jobPostingId = req.params.jobPostingId;
        if (!jobPostingId) {
          throw new AppError(
            'Job posting ID is required',
            400,
            ErrorCode.INVALID_REQUEST
          );
        }
        return await this.jobParsingService.getParsingTaskForJobPosting(
          jobPostingId
        );
      }
    );
  };

  /**
   * Get parsed job description
   */
  getParsedJobDescription = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IJobParsingGetParsedJobApiResponse>(
      req,
      res,
      next,
      async () => {
        const { params } =
          createIApiRequest<IJobParsingGetParsedJobApiRequest>(req);
        return await this.jobParsingService.getParsedJobDescription(
          params.taskId
        );
      }
    );
  };

  /**
   * Public endpoint to upload job description for async parsing
   */
  uploadJobDescriptionPublic = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IJobPublicParsingUploadApiResponse>(
      req,
      res,
      next,
      async () => {
        if (!req.file) {
          throw new AppError(
            'Job description file is required',
            400,
            ErrorCode.FILE_REQUIRED
          );
        }

        const mode =
          (req.query.mode as JobParsingMode) || JobParsingMode.INFERRED;

        if (!Object.values(JobParsingMode).includes(mode)) {
          throw new AppError(
            'Invalid parsing mode',
            400,
            ErrorCode.INVALID_PARSING_MODE
          );
        }

        return await this.jobParsingService.uploadJobDescriptionPublic(
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
    this.handleRequest<IJobPublicParsingTaskGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const { params } =
          createIApiRequest<IJobPublicParsingTaskGetApiRequest>(req);
        return await this.jobParsingService.getPublicParsingTask(params.taskId);
      }
    );
  };

  /**
   * Get parsed job description from public task
   */
  getParsedJobDescriptionFromPublicTask = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IJobPublicParsingGetJobApiResponse>(
      req,
      res,
      next,
      async () => {
        const { params } =
          createIApiRequest<IJobPublicParsingGetJobApiRequest>(req);
        return await this.jobParsingService.getParsedJobDescriptionFromPublicTask(
          params.taskId
        );
      }
    );
  };
}
