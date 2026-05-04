import { Request, Response, NextFunction } from 'express';
import { PartnerUserProfileService } from '@/services/partner/user.profile.service';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import {
  IPartnerUserProfileGetApiResponse,
  IPartnerUserProfileBasicUpdateApiRequest,
  IPartnerUserProfileBasicUpdateApiResponse,
  IPartnerUserProfilePasswordChangeApiRequest,
  IPartnerUserProfilePasswordChangeApiResponse,
  IPartnerUserProfilePhotoUrlApiResponse,
  IPartnerUserProfilePhotoUpdateApiResponse,
  IPartnerUserSettingsGetApiResponse,
  IPartnerUserSettingsUpdateApiRequest,
  IPartnerUserSettingsUpdateApiResponse,
} from '@/shared/models/api/partner/user.profile.api';
import { singleton } from '@/shared/decorators/singleton';
import { ErrorCode } from '@/utils/error.codes';
import { AppError } from '@/utils/app.error';

@singleton
export class PartnerUserProfileController extends BaseController {
  constructor(
    private readonly partnerUserProfileService: PartnerUserProfileService
  ) {
    super();
  }

  /**
   * Helper method to get partnerUserId from request params
   */
  private getPartnerUserId(req: Request): string {
    const partnerUserId = req.params.partnerUserId;
    if (!partnerUserId) {
      throw new AppError(
        'Partner user ID is required',
        400,
        ErrorCode.INVALID_REQUEST
      );
    }
    return partnerUserId;
  }

  /**
   * Get partner user profile
   */
  getProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerUserProfileGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerUserId = this.getPartnerUserId(req);
        const partnerId = req.user.partnerId as string;
        return await this.partnerUserProfileService.getProfile(
          partnerUserId,
          partnerId
        );
      }
    );
  };

  /**
   * Update basic partner user profile
   */
  updateBasicProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerUserProfileBasicUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerUserId = this.getPartnerUserId(req);
        const partnerId = req.user.partnerId as string;
        const { data } =
          createIApiRequest<IPartnerUserProfileBasicUpdateApiRequest>(req);
        return await this.partnerUserProfileService.updateBasicProfile(
          partnerUserId,
          partnerId,
          data
        );
      }
    );
  };

  /**
   * Change partner user password
   */
  changePassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerUserProfilePasswordChangeApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerUserId = this.getPartnerUserId(req);
        const partnerId = req.user.partnerId as string;
        const { data } =
          createIApiRequest<IPartnerUserProfilePasswordChangeApiRequest>(req);
        await this.partnerUserProfileService.changePassword(
          partnerUserId,
          partnerId,
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
    this.handleRequest<IPartnerUserProfilePhotoUrlApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerUserId = this.getPartnerUserId(req);
        const partnerId = req.user.partnerId as string;
        return await this.partnerUserProfileService.getProfilePhotoUploadUrl(
          partnerUserId,
          partnerId
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
    this.handleRequest<IPartnerUserProfilePhotoUpdateApiResponse>(
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

        const partnerUserId = this.getPartnerUserId(req);
        const partnerId = req.user.partnerId as string;
        return await this.partnerUserProfileService.updateProfilePhoto(
          partnerUserId,
          partnerId,
          req.file.buffer
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
    this.handleRequest<IPartnerUserProfilePhotoUrlApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerUserId = this.getPartnerUserId(req);
        const partnerId = req.user.partnerId as string;
        return await this.partnerUserProfileService.getProfilePhotoPresignedUrl(
          partnerUserId,
          partnerId
        );
      }
    );
  };

  /**
   * Get partner user settings
   */
  getSettings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerUserSettingsGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerUserId = this.getPartnerUserId(req);
        const partnerId = req.user.partnerId as string;
        return await this.partnerUserProfileService.getSettings(
          partnerUserId,
          partnerId
        );
      }
    );
  };

  /**
   * Update partner user settings
   */
  updateSettings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerUserSettingsUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerUserId = this.getPartnerUserId(req);
        const partnerId = req.user.partnerId as string;
        const { data } =
          createIApiRequest<IPartnerUserSettingsUpdateApiRequest>(req);
        return await this.partnerUserProfileService.updateSettings(
          partnerUserId,
          partnerId,
          data
        );
      }
    );
  };

  /**
   * Upload profile photo directly
   */
  uploadProfilePhoto = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerUserProfilePhotoUrlApiResponse>(
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

        const partnerUserId = this.getPartnerUserId(req);
        const partnerId = req.user.partnerId as string;
        return await this.partnerUserProfileService.updateProfilePhoto(
          partnerUserId,
          partnerId,
          req.file.buffer
        );
      }
    );
  };
}
