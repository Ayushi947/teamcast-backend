import { ApiService } from '../core/api.service';
import {
  ICandidateProfile,
  ICandidateProfileAndResume,
  ICandidateProfileBasicUpdate,
  ICandidateProfilePasswordChange,
  ICandidateProfilePhotoUpdate,
  ICandidateProfilePhotoUrl,
} from '../../models/domain/candidate/profile.domain';
import { singleton } from '../../decorators/singleton';
/**
 * API endpoints for profile related operations
 */
const PROFILE_ENDPOINTS = {
  BASE: '/candidate/profile',
  BASIC: '/candidate/profile/basic',
  PASSWORD: '/candidate/profile/password',
  PHOTO: '/candidate/profile/photo',
  PHOTO_UPLOAD_URL: '/candidate/profile/photo/upload-url',
  PHOTO_PRESIGNED_URL: '/candidate/profile/photo/presigned-url',
  BY_ID: '/candidate/profile/:candidateId',
  BY_EMAIL: '/candidate/profile/email',
} as const;

/**
 * Service for handling profile related API operations
 */
@singleton
export class CandidateProfileApiService extends ApiService {
  /**
   * Retrieves the candidate's profile
   * @returns Promise resolving to the profile details
   * @throws Error if the API request fails
   */
  public async getProfile(): Promise<ICandidateProfile> {
    try {
      return await this.apiGet<ICandidateProfile>(PROFILE_ENDPOINTS.BASE);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Updates basic profile information
   * @param data - The profile update data
   * @returns Promise resolving to the updated profile details
   * @throws Error if the API request fails
   */
  public async updateBasicProfile(
    data: ICandidateProfileBasicUpdate
  ): Promise<ICandidateProfile> {
    try {
      return await this.apiPatch<ICandidateProfile>(
        PROFILE_ENDPOINTS.BASIC,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Changes the candidate's password
   * @param data - The password change data
   * @returns Promise resolving when the password is changed
   * @throws Error if the API request fails
   */
  public async changePassword(
    data: ICandidateProfilePasswordChange
  ): Promise<void> {
    try {
      return await this.apiPatch<void>(PROFILE_ENDPOINTS.PASSWORD, data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Retrieves a URL for uploading a profile photo
   * @returns Promise resolving to the upload URL details
   * @throws Error if the API request fails
   */
  public async getProfilePhotoUploadUrl(): Promise<ICandidateProfilePhotoUrl> {
    try {
      return await this.apiGet<ICandidateProfilePhotoUrl>(
        PROFILE_ENDPOINTS.PHOTO_UPLOAD_URL
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Updates the profile photo
   * @param data - The photo update data
   * @returns Promise resolving to the photo URL details
   * @throws Error if the API request fails
   */
  public async updateProfilePhoto(
    data: ICandidateProfilePhotoUpdate
  ): Promise<ICandidateProfilePhotoUrl> {
    try {
      return await this.apiPatch<ICandidateProfilePhotoUrl>(
        PROFILE_ENDPOINTS.PHOTO,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Retrieves a presigned URL for the profile photo
   * @returns Promise resolving to the photo URL details
   * @throws Error if the API request fails
   */
  public async getProfilePhotoUrl(): Promise<ICandidateProfilePhotoUrl> {
    try {
      return await this.apiGet<ICandidateProfilePhotoUrl>(
        PROFILE_ENDPOINTS.PHOTO_PRESIGNED_URL
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Retrieves the candidate's profile by ID
   * @param candidateId - The ID of the candidate
   * @returns Promise resolving to the profile details
   * @throws Error if the API request fails
   */
  public async getProfileById(candidateId: string): Promise<ICandidateProfile> {
    try {
      return await this.apiGet<ICandidateProfile>(
        `${PROFILE_ENDPOINTS.BASE}/${candidateId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Soft deletes the candidate's profile photo
   * @returns Promise resolving when the photo is deleted
   * @throws Error if the API request fails
   */
  public async deleteProfilePhoto(): Promise<void> {
    try {
      return await this.apiDelete<void>(PROFILE_ENDPOINTS.PHOTO);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Fetch public candidate profile and resume by candidateId
   */
  async getPublicProfileAndResume(
    candidateId: string
  ): Promise<ICandidateProfileAndResume> {
    try {
      return await this.apiGet<ICandidateProfileAndResume>(
        `${PROFILE_ENDPOINTS.BASE}/public/${candidateId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Fetch public candidate profile and resume by email ID
   * @param email - The email ID of the candidate
   * @returns Promise resolving to the profile details
   * @throws Error if the API request fails
   */
  async getProfileByEmailID(email: string): Promise<ICandidateProfile> {
    try {
      return await this.apiGet<ICandidateProfile>(
        `${PROFILE_ENDPOINTS.BY_EMAIL}/${email}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
