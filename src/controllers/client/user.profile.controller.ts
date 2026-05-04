import { Request, Response, NextFunction } from 'express';
import { ClientUserProfileService } from '@/services/client/user.profile.service';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import {
  IClientUserProfileGetApiResponse,
  IClientUserProfileBasicUpdateApiRequest,
  IClientUserProfileBasicUpdateApiResponse,
  IClientUserProfilePasswordChangeApiRequest,
  IClientUserProfilePasswordChangeApiResponse,
  IClientUserProfilePhotoUrlApiResponse,
  IClientUserProfilePhotoUpdateApiRequest,
  IClientUserProfilePhotoUpdateApiResponse,
  IClientUserSettingsGetApiResponse,
  IClientUserSettingsUpdateApiRequest,
  IClientUserSettingsUpdateApiResponse,
} from '@/shared/models/api/client/user.profile.api';
import { singleton } from '@/shared/decorators/singleton';
import { ErrorCode } from '@/utils/error.codes';
import { AppError } from '@/utils/app.error';

@singleton
export class ClientUserProfileController extends BaseController {
  constructor(
    private readonly clientUserProfileService: ClientUserProfileService
  ) {
    super();
  }

  private getClientUserId(req: Request): string {
    const clientUserId = req.params.clientUserId;

    if (
      clientUserId &&
      clientUserId.trim() !== '' &&
      clientUserId !== req.user.id
    ) {
      return clientUserId;
    }

    if (!req.user.clientUserId) {
      throw new AppError(
        'Client user ID is required',
        400,
        ErrorCode.CLIENT_USER_ID_REQUIRED
      );
    }

    return req.user.clientUserId;
  }

  /**
   * Get client user profile
   */
  getProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientUserProfileGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientUserId = this.getClientUserId(req);
        const clientId = req.user.clientId as string;
        return await this.clientUserProfileService.getProfile(
          clientUserId,
          clientId
        );
      }
    );
  };

  /**
   * Update basic client user profile
   */
  updateBasicProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientUserProfileBasicUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientUserId = this.getClientUserId(req);
        const clientId = req.user.clientId as string;
        const { data } =
          createIApiRequest<IClientUserProfileBasicUpdateApiRequest>(req);
        return await this.clientUserProfileService.updateBasicProfile(
          clientUserId,
          clientId,
          data
        );
      }
    );
  };

  /**
   * Change client user password
   */
  changePassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientUserProfilePasswordChangeApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientUserId = this.getClientUserId(req);
        const clientId = req.user.clientId as string;
        const { data } =
          createIApiRequest<IClientUserProfilePasswordChangeApiRequest>(req);
        await this.clientUserProfileService.changePassword(
          clientUserId,
          clientId,
          data
        );
        return { message: 'Password changed successfully' };
      }
    );
  };

  /**
   * Get profile photo upload URL
   */
  getProfilePhotoUploadUrl = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientUserProfilePhotoUrlApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientUserId = this.getClientUserId(req);
        const clientId = req.user.clientId as string;
        return await this.clientUserProfileService.getProfilePhotoUploadUrl(
          clientUserId,
          clientId
        );
      }
    );
  };

  /**
   * Update profile photo
   */
  updateProfilePhoto = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientUserProfilePhotoUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientUserId = this.getClientUserId(req);
        const clientId = req.user.clientId as string;
        const { data } =
          createIApiRequest<IClientUserProfilePhotoUpdateApiRequest>(req);
        return await this.clientUserProfileService.updateProfilePhoto(
          clientUserId,
          clientId,
          data
        );
      }
    );
  };

  /**
   * Get profile photo presigned URL
   */
  getProfilePhotoPresignedUrl = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientUserProfilePhotoUrlApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientUserId = this.getClientUserId(req);
        const clientId = req.user.clientId as string;
        return await this.clientUserProfileService.getProfilePhotoPresignedUrl(
          clientUserId,
          clientId
        );
      }
    );
  };

  /**
   * Get client user settings
   */
  getSettings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientUserSettingsGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientUserId = this.getClientUserId(req);
        const clientId = req.user.clientId as string;
        return await this.clientUserProfileService.getSettings(
          clientUserId,
          clientId
        );
      }
    );
  };

  /**
   * Update client user settings
   */
  updateSettings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientUserSettingsUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientUserId = this.getClientUserId(req);
        const clientId = req.user.clientId as string;
        const { data } =
          createIApiRequest<IClientUserSettingsUpdateApiRequest>(req);
        return await this.clientUserProfileService.updateSettings(
          clientUserId,
          clientId,
          data
        );
      }
    );
  };
}
