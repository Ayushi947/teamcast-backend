import { ApiService } from '../core/api.service';
import { singleton } from '../../decorators/singleton';
import { AxiosInstance } from 'axios';
import {
  IPartnerProfileSetup,
  IPartnerProfileSetupDone,
  IPartnerProfileSetupRequired,
} from '../../models/domain/partner/profile.setup.domain';

/**
 * API endpoints for partner profile setup operations
 */
const PARTNER_PROFILE_SETUP_ENDPOINTS = {
  BASE: '/partner/profile-setup',
  REQUIRED: '/partner/profile-setup/required',
} as const;

/**
 * Service for handling partner profile setup related API operations
 * Manages partner profile completion and requirement checking
 */
@singleton
export class PartnerProfileSetupApiService extends ApiService {
  constructor(apiClient: AxiosInstance) {
    super(apiClient);
  }

  /**
   * Complete partner profile setup
   * @param data - Profile setup data including personal and company information
   * @returns Promise resolving to the profile setup completion result
   * @throws Error if the API request fails
   */
  public async completeProfileSetup(
    data: IPartnerProfileSetup
  ): Promise<IPartnerProfileSetupDone> {
    try {
      return await this.apiPost<IPartnerProfileSetupDone>(
        PARTNER_PROFILE_SETUP_ENDPOINTS.BASE,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Check if partner profile setup is required
   * @returns Promise resolving to the profile setup requirement status
   * @throws Error if the API request fails
   */
  public async isProfileSetupRequired(): Promise<IPartnerProfileSetupRequired> {
    try {
      return await this.apiGet<IPartnerProfileSetupRequired>(
        PARTNER_PROFILE_SETUP_ENDPOINTS.REQUIRED
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
