import { ApiService } from '../core/api.service';
import {
  IGlobalOnboardingAssessmentSettings,
  IGlobalOnboardingAssessmentSettingsUpdate,
} from '../../models/domain/candidate/onboarding.assessment.domain';
import { singleton } from '../../decorators/singleton';

/**
 * API endpoints for onboarding assessment global settings management
 */
const ONBOARDING_ASSESSMENT_GLOBAL_SETTINGS_ENDPOINTS = {
  BASE: '/support/onboarding-assessment-global-settings',
} as const;

@singleton
export class OnboardingAssessmentGlobalSettingsApiService extends ApiService {
  /**
   * Get global onboarding assessment settings
   * @returns Promise resolving to global onboarding assessment settings
   */
  public async getGlobalOnboardingAssessmentSettings(): Promise<IGlobalOnboardingAssessmentSettings> {
    try {
      return await this.apiGet<IGlobalOnboardingAssessmentSettings>(
        ONBOARDING_ASSESSMENT_GLOBAL_SETTINGS_ENDPOINTS.BASE
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update global onboarding assessment settings
   * @param data - Settings data to update
   * @returns Promise resolving to updated settings
   */
  public async updateGlobalOnboardingAssessmentSettings(
    data: IGlobalOnboardingAssessmentSettingsUpdate
  ): Promise<IGlobalOnboardingAssessmentSettings> {
    try {
      return await this.apiPatch<IGlobalOnboardingAssessmentSettings>(
        ONBOARDING_ASSESSMENT_GLOBAL_SETTINGS_ENDPOINTS.BASE,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
