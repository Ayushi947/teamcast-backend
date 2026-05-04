import { ApiService } from '../core/api.service';

import type {
  IPartnerUserProfileBasicUpdate,
  IPartnerUserProfilePasswordChange,
  IPartnerUserProfilePhotoUpdate,
  IPartnerUserProfilePhotoUrl,
  IPartnerUserSettings,
  IPartnerUserSettingsUpdate,
} from '../../models/domain/partner/user.profile.domain';
import { IPartnerUserProfile } from '../../models/domain/partner/user.profile.domain';
import { singleton } from '../../decorators/singleton';

/**
 * API endpoints for partner user profile related operations
 */
const USER_PROFILE_ENDPOINTS = {
  BASE: (partnerUserId: string) => `/partner/user-profile/${partnerUserId}`,
  BASIC: (partnerUserId: string) =>
    `/partner/user-profile/${partnerUserId}/basic`,
  PASSWORD: (partnerUserId: string) =>
    `/partner/user-profile/${partnerUserId}/password`,
  PHOTO_URL: (partnerUserId: string) =>
    `/partner/user-profile/${partnerUserId}/photo/upload-url`,
  PHOTO: (partnerUserId: string) =>
    `/partner/user-profile/${partnerUserId}/photo`,
  PRESIGNED_URL: (partnerUserId: string) =>
    `/partner/user-profile/${partnerUserId}/photo/presigned-url`,
  SETTINGS: (partnerUserId: string) =>
    `/partner/user-profile/${partnerUserId}/settings`,
} as const;

@singleton
export class PartnerUserProfileApiService extends ApiService {
  /**
   * Get user profile
   */
  public async getUserProfile(
    partnerUserId: string
  ): Promise<IPartnerUserProfile> {
    try {
      return await this.apiGet<IPartnerUserProfile>(
        USER_PROFILE_ENDPOINTS.BASE(partnerUserId)
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update user profile basic info
   */
  public async updateUserProfileBasic(
    partnerUserId: string,
    data: IPartnerUserProfileBasicUpdate
  ): Promise<IPartnerUserProfile> {
    try {
      return await this.apiPatch<IPartnerUserProfile>(
        USER_PROFILE_ENDPOINTS.BASIC(partnerUserId),
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Change user password
   */
  public async changeUserPassword(
    partnerUserId: string,
    data: IPartnerUserProfilePasswordChange
  ): Promise<IPartnerUserProfilePasswordChange> {
    try {
      return await this.apiPatch<IPartnerUserProfilePasswordChange>(
        USER_PROFILE_ENDPOINTS.PASSWORD(partnerUserId),
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get user profile photo upload URL
   */
  public async getUserProfilePhotoUrl(partnerUserId: string): Promise<string> {
    try {
      return await this.apiGet<string>(
        USER_PROFILE_ENDPOINTS.PHOTO_URL(partnerUserId)
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update user profile photo
   */
  public async updateUserProfilePhoto(
    partnerUserId: string,
    data: IPartnerUserProfilePhotoUpdate
  ): Promise<IPartnerUserProfilePhotoUpdate> {
    try {
      return await this.apiPatch<IPartnerUserProfilePhotoUpdate>(
        USER_PROFILE_ENDPOINTS.PHOTO(partnerUserId),
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get user profile photo presigned URL
   */
  public async getUserProfilePhotoPresignedUrl(
    partnerUserId: string
  ): Promise<IPartnerUserProfilePhotoUrl> {
    try {
      return await this.apiGet<IPartnerUserProfilePhotoUrl>(
        USER_PROFILE_ENDPOINTS.PRESIGNED_URL(partnerUserId)
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get user profile settings
   */
  public async getUserProfileSettings(
    partnerUserId: string
  ): Promise<IPartnerUserSettings> {
    try {
      return await this.apiGet<IPartnerUserSettings>(
        USER_PROFILE_ENDPOINTS.SETTINGS(partnerUserId)
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update user profile settings
   */
  public async updateUserProfileSettings(
    partnerUserId: string,
    data: IPartnerUserSettingsUpdate
  ): Promise<IPartnerUserSettings> {
    try {
      return await this.apiPatch<IPartnerUserSettings>(
        USER_PROFILE_ENDPOINTS.SETTINGS(partnerUserId),
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
