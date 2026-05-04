import { ApiService } from '../core/api.service';

import {
  IPaginationRequest,
  IPaginatedResponse,
} from '../../models/api/common/common.api';
import {
  ISupportJobApplication,
  ISupportJobApplicationAiAssessment,
  ISupportJobApplicationFilterQuery,
  ISupportJobApplicationStatistics,
  ISupportJobApplicationStatisticsQuery,
} from '../../models/domain/support/application.domain';
import { singleton } from '../../decorators/singleton';

/**
 * API endpoints for support job application related operations
 */
const SUPPORT_APPLICATION_ENDPOINTS = {
  BASE: '/support/applications',
  STATISTICS: '/support/applications/statistics/conversion',
} as const;

@singleton
export class SupportJobApplicationApiService extends ApiService {
  /**
   * Get list of accepted job applications for support
   */
  public async getSupportJobApplications(
    filters?: ISupportJobApplicationFilterQuery & IPaginationRequest
  ): Promise<IPaginatedResponse<ISupportJobApplication>> {
    try {
      return await this.apiGet<IPaginatedResponse<ISupportJobApplication>>(
        `${SUPPORT_APPLICATION_ENDPOINTS.BASE}${filters ? this.buildQueryString(filters) : ''}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a specific accepted job application for support
   */
  public async getSupportJobApplication(
    applicationId: string
  ): Promise<ISupportJobApplication> {
    try {
      return await this.apiGet<ISupportJobApplication>(
        `${SUPPORT_APPLICATION_ENDPOINTS.BASE}/${applicationId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get AI assessment for a support job application
   * Returns null if no assessment exists yet (candidate hasn't completed assessment)
   */
  public async getSupportJobApplicationAiAssessment(
    applicationId: string
  ): Promise<ISupportJobApplicationAiAssessment | null> {
    try {
      return await this.apiGet<ISupportJobApplicationAiAssessment | null>(
        `${SUPPORT_APPLICATION_ENDPOINTS.BASE}/${applicationId}/ai-assessment`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get conversion statistics for support dashboard
   */
  public async getConversionStatistics(
    filters?: ISupportJobApplicationStatisticsQuery
  ): Promise<ISupportJobApplicationStatistics> {
    try {
      return await this.apiGet<ISupportJobApplicationStatistics>(
        `${SUPPORT_APPLICATION_ENDPOINTS.STATISTICS}${filters ? this.buildQueryString(filters) : ''}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
