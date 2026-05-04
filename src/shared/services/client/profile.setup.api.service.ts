import { ApiService } from '../core/api.service';
import { singleton } from '../../decorators/singleton';
import { AxiosInstance } from 'axios';
import {
  IClientProfileSetup,
  IClientProfileSetupDone,
  IClientProfileSetupRequired,
} from '../../models/domain/client/profile.setup.domain';

/**
 * API endpoints for client profile setup operations
 */
const CLIENT_PROFILE_SETUP_ENDPOINTS = {
  BASE: '/client/profile-setup',
  REQUIRED: '/client/profile-setup/required',
} as const;

/**
 * Service for handling client profile setup related API operations
 * Manages client profile completion and requirement checking
 */
@singleton
export class ClientProfileSetupApiService extends ApiService {
  constructor(apiClient: AxiosInstance) {
    super(apiClient);
  }

  /**
   * Complete client profile setup
   * @param data - Profile setup data including personal and company information
   * @returns Promise resolving to the profile setup completion result
   * @throws Error if the API request fails
   */
  public async completeProfileSetup(
    data: IClientProfileSetup
  ): Promise<IClientProfileSetupDone> {
    try {
      return await this.apiPost<IClientProfileSetupDone>(
        CLIENT_PROFILE_SETUP_ENDPOINTS.BASE,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Check if client profile setup is required
   * @returns Promise resolving to the profile setup requirement status
   * @throws Error if the API request fails
   */
  public async isProfileSetupRequired(): Promise<IClientProfileSetupRequired> {
    try {
      return await this.apiGet<IClientProfileSetupRequired>(
        CLIENT_PROFILE_SETUP_ENDPOINTS.REQUIRED
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
