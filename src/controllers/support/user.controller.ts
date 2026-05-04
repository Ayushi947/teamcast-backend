import { Request, Response, NextFunction } from 'express';
import { SupportUserService } from '@/services/support/user.service';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import {
  ISupportUserUpdateApiRequest,
  ISupportUserUpdateApiResponse,
  ISupportUserGetApiRequest,
  ISupportUserGetApiResponse,
  ISupportUserDeleteApiRequest,
  ISupportUserDeleteApiResponse,
  ISupportUserListApiResponse,
  ISupportUserActivateDeactivateApiRequest,
  ISupportUserActivateDeactivateApiResponse,
  ISupportUserListApiRequest,
  ISupportUserChangePasswordApiRequest,
  ISupportUserChangePasswordApiResponse,
  ISupportUserRecruiterAnalyticsApiResponse,
  ISupportUserRecruiterAnalyticsApiRequest,
  ISupportUserProfilePhotoUrlApiResponse,
} from '@/shared/models/api/support/user.api';
import { singleton } from '@/shared/decorators/singleton';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';

@singleton
export class SupportUserController extends BaseController {
  constructor(private readonly supportUserService: SupportUserService) {
    super();
  }

  /**
   * Update an existing support user
   */
  updateSupportUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportUserUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const requestingUserId = req.user.id;

        // Get the update data and user ID from the request
        const updateRequest =
          createIApiRequest<ISupportUserUpdateApiRequest>(req);
        const supportUserId = updateRequest.params.supportUserId;

        // Call service method with domain model
        return await this.supportUserService.updateSupportUser(
          requestingUserId,
          supportUserId,
          updateRequest.data
        );
      }
    );
  };

  /**
   * Get a support user by ID
   */
  getSupportUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportUserGetApiResponse>(req, res, next, async () => {
      // Get the user ID from the request parameters
      const getRequest = createIApiRequest<ISupportUserGetApiRequest>(req);
      const userId = getRequest.params.supportUserId;

      // Call service method with domain model
      return await this.supportUserService.getSupportUser(userId);
    });
  };

  /**
   * Delete a support user
   */
  deleteSupportUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportUserDeleteApiResponse>(
      req,
      res,
      next,
      async () => {
        // Get the user ID from the request parameters
        const deleteRequest =
          createIApiRequest<ISupportUserDeleteApiRequest>(req);
        const userId = deleteRequest.params.supportUserId;

        // Call service method with domain model
        await this.supportUserService.deleteSupportUser(userId);

        // Return empty data for successful deletion
        return undefined;
      }
    );
  };

  /**
   * List all support users with optional filtering
   */
  listSupportUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportUserListApiResponse>(
      req,
      res,
      next,
      async () => {
        const request = createIApiRequest<ISupportUserListApiRequest>(req);
        return await this.supportUserService.listSupportUsers(
          request.filters,
          request.pagination
        );
      }
    );
  };

  /**
   * Change the password of a support user
   */
  changePassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportUserChangePasswordApiResponse>(
      req,
      res,
      next,
      async () => {
        const supportUserId = req.params.supportUserId;
        const { data } =
          createIApiRequest<ISupportUserChangePasswordApiRequest>(req);
        await this.supportUserService.changePassword(supportUserId, data);
        return { message: 'Password changed successfully' };
      }
    );
  };

  /**
   * Activate or deactivate a support user
   */
  activateDeactivateSupportUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportUserActivateDeactivateApiResponse>(
      req,
      res,
      next,
      async () => {
        const requestingUserId = req.user.id;

        // Get the status data and user ID from the request
        const statusRequest =
          createIApiRequest<ISupportUserActivateDeactivateApiRequest>(req);
        const supportUserId = statusRequest.params.supportUserId;

        // Call service method with domain model including autoReassign parameter
        return await this.supportUserService.activateDeactivateSupportUser(
          requestingUserId,
          supportUserId,
          statusRequest.data
        );
      }
    );
  };

  /**
   * Get recruiters analytics
   */
  getAcoountManagerRecruitersAnalytics = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportUserRecruiterAnalyticsApiResponse>(
      req,
      res,
      next,
      async () => {
        const supportUserId = req.user.supportUserId;

        if (!supportUserId) {
          throw new AppError('Forbidden', 403, ErrorCode.FORBIDDEN);
        }

        const request =
          createIApiRequest<ISupportUserRecruiterAnalyticsApiRequest>(req);
        const startDate = request.data.startDate;
        const endDate = request.data.endDate;

        return await this.supportUserService.getAcoountManagerRecruitersAnalytics(
          supportUserId,
          startDate,
          endDate
        );
      }
    );
  };

  updateProfilePhoto = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportUserProfilePhotoUrlApiResponse>(
      req,
      res,
      next,
      async () => {
        if (!req.file) {
          throw new AppError(
            'No file uploaded',
            400,
            ErrorCode.INVALID_REQUEST
          );
        }

        const supportUserId = req.user.supportUserId;
        if (!supportUserId) {
          throw new AppError('Forbidden', 403, ErrorCode.FORBIDDEN);
        }

        return await this.supportUserService.updateProfilePhoto(
          supportUserId,
          req.file.buffer
        );
      }
    );
  };
}
