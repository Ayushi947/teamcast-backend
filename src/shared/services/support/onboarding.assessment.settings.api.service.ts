import { ApiService } from '../core/api.service';

/**
 * Global onboarding assessment settings response
 */
export interface IGlobalOnboardingAssessmentSettings {
  interviewLanguage?: string;
  interviewDialect?: string;
  interviewVoiceGender?: string;
}

/**
 * API endpoints for onboarding assessment settings management
 */
const ONBOARDING_ASSESSMENT_SETTINGS_ENDPOINTS = {
  BASE: '/support/onboarding-assessment-settings',
} as const;

export class OnboardingAssessmentSettingsApiService extends ApiService {
  /**
   * Get global onboarding assessment settings
   * @returns Promise resolving to global onboarding assessment settings
   */
  public async getGlobalOnboardingAssessmentSettings(): Promise<IGlobalOnboardingAssessmentSettings> {
    try {
      return await this.apiGet<IGlobalOnboardingAssessmentSettings>(
        ONBOARDING_ASSESSMENT_SETTINGS_ENDPOINTS.BASE
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
  public async updateGlobalOnboardingAssessmentSettings(data: {
    interviewLanguage?: string;
    interviewDialect?: string;
    interviewVoiceGender?: string;
  }): Promise<IGlobalOnboardingAssessmentSettings> {
    try {
      return await this.apiPatch<IGlobalOnboardingAssessmentSettings>(
        ONBOARDING_ASSESSMENT_SETTINGS_ENDPOINTS.BASE,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
