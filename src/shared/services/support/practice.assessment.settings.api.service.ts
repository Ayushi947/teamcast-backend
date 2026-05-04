import { ApiService } from '../core/api.service';
import {
  IGlobalPracticeAssessmentSettings,
  IGlobalPracticeAssessmentSettingsUpdate,
} from '../../models/domain/candidate/public.practice.assessment.domain';

/**
 * API endpoints for practice assessment settings management
 */
const PRACTICE_ASSESSMENT_SETTINGS_ENDPOINTS = {
  BASE: '/support/practice-assessment-settings',
} as const;

export class PracticeAssessmentSettingsApiService extends ApiService {
  /**
   * Get global practice assessment settings
   * @returns Promise resolving to global practice assessment settings
   */
  public async getGlobalPracticeAssessmentSettings(): Promise<IGlobalPracticeAssessmentSettings> {
    try {
      return await this.apiGet<IGlobalPracticeAssessmentSettings>(
        PRACTICE_ASSESSMENT_SETTINGS_ENDPOINTS.BASE
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update global practice assessment settings
   * @param data - Settings data to update
   * @returns Promise resolving to updated settings
   */
  public async updateGlobalPracticeAssessmentSettings(
    data: IGlobalPracticeAssessmentSettingsUpdate
  ): Promise<IGlobalPracticeAssessmentSettings> {
    try {
      return await this.apiPatch<IGlobalPracticeAssessmentSettings>(
        PRACTICE_ASSESSMENT_SETTINGS_ENDPOINTS.BASE,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
