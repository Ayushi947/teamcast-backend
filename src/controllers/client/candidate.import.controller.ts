import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import { singleton } from '@/shared/decorators/singleton';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { CandidateImportService } from '@/services/client/candidate.import.service';
import {
  ICandidateImportTemplateDownloadApiRequest,
  ICandidateImportProcessApiResponse,
  ICandidateImportListApiRequest,
  ICandidateImportListApiResponse,
  ICandidateImportStatisticsApiRequest,
  ICandidateImportStatisticsApiResponse,
} from '@/shared/models/api/client/candidate.import.api';

@singleton
export class CandidateImportController extends BaseController {
  constructor(private readonly candidateImportService: CandidateImportService) {
    super();
  }

  /**
   * Download Excel template for candidate import
   * Returns the file directly like DocumentController
   */
  downloadTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const request =
        createIApiRequest<ICandidateImportTemplateDownloadApiRequest>(req);

      const { buffer, fileName } =
        await this.candidateImportService.downloadTemplate(
          request.data.jobPostingId
        );

      // Set appropriate headers for Excel file download
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileName}"`
      );
      res.setHeader('Content-Length', buffer.length);

      // Send the file buffer directly
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Upload and process Excel file directly (single call like DocumentController)
   */
  uploadCandidates = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateImportProcessApiResponse>(
      req,
      res,
      next,
      async () => {
        const { jobPostingId } = req.params;
        const file = req.file;
        const uploadedBy = req.user?.id;
        const clientId = req.user?.clientId as string;

        if (!uploadedBy) {
          throw new AppError(
            'User not authenticated',
            401,
            ErrorCode.UNAUTHORIZED
          );
        }

        if (!clientId) {
          throw new AppError(
            'Client ID not found',
            400,
            ErrorCode.INVALID_REQUEST
          );
        }

        if (!file) {
          throw new AppError(
            'No file provided',
            400,
            ErrorCode.INVALID_REQUEST
          );
        }

        const progress =
          await this.candidateImportService.uploadAndProcessCandidates(
            jobPostingId,
            clientId,
            file.buffer,
            file.originalname,
            uploadedBy
          );

        return progress;
      }
    );
  };

  /**
   * List imported candidates for a job posting with pagination
   */
  listImportedCandidates = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateImportListApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user?.clientId as string;

        if (!clientId) {
          throw new AppError(
            'Client ID not found',
            400,
            ErrorCode.INVALID_REQUEST
          );
        }

        // Extract request using the standard API request pattern
        const listRequest =
          createIApiRequest<ICandidateImportListApiRequest>(req);
        const { jobPostingId } = listRequest.params;

        // Call service method with proper pagination structure
        const result = await this.candidateImportService.listImportedCandidates(
          jobPostingId,
          clientId,
          listRequest.filters,
          listRequest.pagination
        );

        return result;
      }
    );
  };

  /**
   * Get candidate import statistics for a client
   */
  getImportStatistics = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateImportStatisticsApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user?.clientId as string;

        if (!clientId) {
          throw new AppError(
            'Client ID not found',
            400,
            ErrorCode.INVALID_REQUEST
          );
        }

        // Extract request using the standard API request pattern
        const statsRequest =
          createIApiRequest<ICandidateImportStatisticsApiRequest>(req);

        // Call service method with filters
        const statistics =
          await this.candidateImportService.getImportStatistics(
            clientId,
            statsRequest.filters
          );

        return statistics;
      }
    );
  };
}
