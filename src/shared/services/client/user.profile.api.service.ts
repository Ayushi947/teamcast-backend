import { ApiService } from '../core/api.service';

import type {
  IClientUserProfileBasicUpdate,
  IClientUserProfilePasswordChange,
  IClientUserProfilePhotoUpdate,
  IClientUserProfilePhotoUrl,
  IClientUserSettings,
  IClientUserSettingsUpdate,
} from '../../models/domain/client/user.profile.domain';
import { IClientUserProfile } from '../../models/domain/client/user.profile.domain';
import { singleton } from '../../decorators/singleton';

/**
 * API endpoints for user profile related operations
 */
const USER_PROFILE_ENDPOINTS = {
  BASE: (clientUserId: string) => `/client/user-profile/${clientUserId}`,
  BASIC: (clientUserId: string) => `/client/user-profile/${clientUserId}/basic`,
  PASSWORD: (clientUserId: string) =>
    `/client/user-profile/${clientUserId}/password`,
  PHOTO_URL: (clientUserId: string) =>
    `/client/user-profile/${clientUserId}/photo/upload-url`,
  PHOTO: (clientUserId: string) => `/client/user-profile/${clientUserId}/photo`,
  PRESIGNED_URL: (clientUserId: string) =>
    `/client/user-profile/${clientUserId}/photo/presigned-url`,
  SETTINGS: (clientUserId: string) =>
    `/client/user-profile/${clientUserId}/settings`,
  SETTINGS_BASE: '/client/user-profile/settings',
} as const;

@singleton
export class ClientUserProfileApiService extends ApiService {
  /**
   * Get user profile
   */
  public async getUserProfile(
    clientUserId: string
  ): Promise<IClientUserProfile> {
    try {
      return await this.apiGet<IClientUserProfile>(
        USER_PROFILE_ENDPOINTS.BASE(clientUserId)
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update user profile basic info
   */
  public async updateUserProfileBasic(
    clientUserId: string,
    data: IClientUserProfileBasicUpdate
  ): Promise<IClientUserProfile> {
    try {
      return await this.apiPatch<IClientUserProfile>(
        USER_PROFILE_ENDPOINTS.BASIC(clientUserId),
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
    clientUserId: string,
    data: IClientUserProfilePasswordChange
  ): Promise<IClientUserProfilePasswordChange> {
    try {
      return await this.apiPatch<IClientUserProfilePasswordChange>(
        USER_PROFILE_ENDPOINTS.PASSWORD(clientUserId),
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get user profile photo upload URL
   */
  public async getUserProfilePhotoUrl(clientUserId: string): Promise<string> {
    try {
      return await this.apiGet<string>(
        USER_PROFILE_ENDPOINTS.PHOTO_URL(clientUserId)
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update user profile photo
   */
  public async updateUserProfilePhoto(
    clientUserId: string,
    data: IClientUserProfilePhotoUpdate
  ): Promise<IClientUserProfilePhotoUpdate> {
    try {
      return await this.apiPatch<IClientUserProfilePhotoUpdate>(
        USER_PROFILE_ENDPOINTS.PHOTO(clientUserId),
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
    clientUserId: string
  ): Promise<IClientUserProfilePhotoUrl> {
    try {
      return await this.apiGet<IClientUserProfilePhotoUrl>(
        USER_PROFILE_ENDPOINTS.PRESIGNED_URL(clientUserId)
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get user profile settings
   */
  public async getUserProfileSettings(): Promise<IClientUserSettings> {
    try {
      return await this.apiGet<IClientUserSettings>(
        USER_PROFILE_ENDPOINTS.SETTINGS_BASE
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update user profile settings
   */
  public async updateUserProfileSettings(
    clientUserId: string,
    data: IClientUserSettingsUpdate
  ): Promise<IClientUserSettings> {
    try {
      return await this.apiPatch<IClientUserSettings>(
        USER_PROFILE_ENDPOINTS.SETTINGS(clientUserId),
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
