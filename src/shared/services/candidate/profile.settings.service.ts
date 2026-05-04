import { ApiService } from '../core/api.service';
import {
  ICandidateSettings,
  ICandidateSettingsUpdate,
  ICandidatePreferences,
  ICandidatePreferencesUpdate,
} from '../../models/domain/candidate/profile.settings.domain';
import { singleton } from '../../decorators/singleton';

/**
 * API endpoints for profile settings related operations
 */
const SETTINGS_ENDPOINTS = {
  BASE: '/candidate/settings/settings',
  PREFERENCES: '/candidate/settings/preferences',
} as const;

/**
 * Service for handling profile settings related API operations
 */
@singleton
export class CandidateProfileSettingsService extends ApiService {
  /**
   * Retrieves the candidate's settings
   * @returns Promise resolving to the settings details
   * @throws Error if the API request fails
   */
  public async getSettings(): Promise<ICandidateSettings> {
    try {
      return await this.apiGet<ICandidateSettings>(SETTINGS_ENDPOINTS.BASE);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Updates the candidate's settings
   * @param data - The settings update data
   * @returns Promise resolving to the updated settings details
   * @throws Error if the API request fails
   */
  public async updateSettings(
    data: ICandidateSettingsUpdate
  ): Promise<ICandidateSettings> {
    try {
      return await this.apiPatch<ICandidateSettings>(
        SETTINGS_ENDPOINTS.BASE,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Retrieves the candidate's preferences
   * @returns Promise resolving to the preferences details
   * @throws Error if the API request fails
   */
  public async getPreferences(): Promise<ICandidatePreferences> {
    try {
      return await this.apiGet<ICandidatePreferences>(
        SETTINGS_ENDPOINTS.PREFERENCES
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Updates the candidate's preferences
   * @param data - The preferences update data
   * @returns Promise resolving to the updated preferences details
   * @throws Error if the API request fails
   */
  public async updatePreferences(
    data: ICandidatePreferencesUpdate
  ): Promise<ICandidatePreferences> {
    try {
      return await this.apiPatch<ICandidatePreferences>(
        SETTINGS_ENDPOINTS.PREFERENCES,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
