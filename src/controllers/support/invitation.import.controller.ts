import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import { singleton } from '@/shared/decorators/singleton';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { SupportInvitationImportService } from '@/services/support/invitation.import.service';
import { logger } from '@/shared/utils/logger';
import {
  ISupportInvitationImportProcessApiResponse,
  ISupportInvitationImportListApiRequest,
  ISupportInvitationImportListApiResponse,
  ISupportInvitationImportStatisticsApiRequest,
  ISupportInvitationImportStatisticsApiResponse,
  ISupportInvitationImportPerUploadStatisticsApiResponse,
} from '@/shared/models/api/support/invitation.import.api';

@singleton
export class SupportInvitationImportController extends BaseController {
  constructor(
    private readonly supportInvitationImportService: SupportInvitationImportService
  ) {
    super();
  }

  /**
   * Upload and process Excel file directly for support invitation import
   */
  uploadInvitations = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportInvitationImportProcessApiResponse>(
      req,
      res,
      next,
      async () => {
        const file = req.file;
        const uploadedBy = req.user?.id;
        const supportUserId = req.user?.supportUserId as string;

        if (!uploadedBy) {
          throw new AppError(
            'User not authenticated',
            401,
            ErrorCode.UNAUTHORIZED
          );
        }

        if (!supportUserId) {
          throw new AppError(
            'Support user ID not found',
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
          await this.supportInvitationImportService.uploadAndProcessInvitations(
            supportUserId,
            file.buffer,
            file.originalname,
            uploadedBy
          );

        return progress;
      }
    );
  };

  /**
   * List imported candidates for a support user with pagination
   */
  listImportedCandidates = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportInvitationImportListApiResponse>(
      req,
      res,
      next,
      async () => {
        const supportUserId = req.user?.supportUserId as string;

        if (!supportUserId) {
          throw new AppError(
            'Support user ID not found',
            400,
            ErrorCode.INVALID_REQUEST
          );
        }

        // Extract request using the standard API request pattern
        const listRequest =
          createIApiRequest<ISupportInvitationImportListApiRequest>(req);

        // Log the request for debugging
        logger.debug('Support invitation import list request', {
          context: 'SupportInvitationImportController.listImportedCandidates',
          supportUserId,
          filters: listRequest.filters,
          pagination: listRequest.pagination,
          query: req.query,
        });

        // Call service method with proper pagination structure
        const result =
          await this.supportInvitationImportService.listImportedCandidates(
            supportUserId,
            listRequest.filters,
            listRequest.pagination
          );

        return result;
      }
    );
  };

  /**
   * Get support invitation import statistics for a support user
   */
  getImportStatistics = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportInvitationImportStatisticsApiResponse>(
      req,
      res,
      next,
      async () => {
        const supportUserId = req.user?.supportUserId as string;

        if (!supportUserId) {
          throw new AppError(
            'Support user ID not found',
            400,
            ErrorCode.INVALID_REQUEST
          );
        }

        // Extract request using the standard API request pattern
        const statsRequest =
          createIApiRequest<ISupportInvitationImportStatisticsApiRequest>(req);

        // Call service method with filters
        const statistics =
          await this.supportInvitationImportService.getImportStatistics(
            supportUserId,
            statsRequest.filters
          );

        return statistics;
      }
    );
  };

  /**
   * Get per-upload support invitation import statistics for a support user
   */
  getPerUploadStatistics = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportInvitationImportPerUploadStatisticsApiResponse>(
      req,
      res,
      next,
      async () => {
        const supportUserId = req.user?.supportUserId as string;

        if (!supportUserId) {
          throw new AppError(
            'Support user ID not found',
            400,
            ErrorCode.INVALID_REQUEST
          );
        }

        // Extract request using the standard API request pattern
        const statsRequest =
          createIApiRequest<ISupportInvitationImportStatisticsApiRequest>(req);

        // Call service method with filters
        const perUploadStatistics =
          await this.supportInvitationImportService.getPerUploadStatistics(
            supportUserId,
            statsRequest.filters
          );

        return perUploadStatistics;
      }
    );
  };
}
