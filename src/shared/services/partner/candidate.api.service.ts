import { ApiService } from '../core/api.service';
import type {
  IPartnerCandidate,
  IPartnerCandidateDetailed,
  IPartnerCandidateUpdate,
  IPartnerCandidateFilterQuery,
} from '../../models/domain/partner/candidate.domain';
import type { IPartnerCandidateWithRecommendation } from '../../models/api/partner/candidate.api';
import {
  IPaginatedResponse,
  IPaginationRequest,
} from '../../models/api/common/common.api';
import { singleton } from '../../decorators/singleton';

/**
 * API endpoints for partner candidate management related operations
 */
const CANDIDATE_MANAGEMENT_ENDPOINTS = {
  BASE: '/partner/candidates',
  RECOMMENDATIONS: '/partner/candidates/recommendations/:jobPostingId',
  RECOMMENDATION_STATUS:
    '/partner/candidates/:candidateId/recommendations/:jobPostingId',
} as const;

@singleton
export class PartnerCandidateApiService extends ApiService {
  /**
   * Get list of partner candidates
   */
  public async getCandidates(
    filter: IPartnerCandidateFilterQuery & IPaginationRequest
  ): Promise<IPaginatedResponse<IPartnerCandidate>> {
    try {
      return await this.apiGet<IPaginatedResponse<IPartnerCandidate>>(
        `${CANDIDATE_MANAGEMENT_ENDPOINTS.BASE}${
          filter ? this.buildQueryString(filter) : ''
        }`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a specific partner candidate with detailed information
   */
  public async getCandidate(
    candidateId: string
  ): Promise<IPartnerCandidateDetailed> {
    try {
      return await this.apiGet<IPartnerCandidateDetailed>(
        `${CANDIDATE_MANAGEMENT_ENDPOINTS.BASE}/${candidateId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update a partner candidate
   */
  public async updateCandidate(
    candidateId: string,
    data: IPartnerCandidateUpdate
  ): Promise<IPartnerCandidate> {
    try {
      return await this.apiPatch<IPartnerCandidate>(
        `${CANDIDATE_MANAGEMENT_ENDPOINTS.BASE}/${candidateId}`,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Soft delete a partner candidate
   */
  public async deleteCandidate(
    candidateId: string
  ): Promise<{ success: boolean }> {
    try {
      return await this.apiDelete<{ success: boolean }>(
        `${CANDIDATE_MANAGEMENT_ENDPOINTS.BASE}/${candidateId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get recommended candidates for a specific job posting
   */
  public async getRecommendedCandidatesForJobPosting(
    jobPostingId: string,
    pagination?: IPaginationRequest
  ): Promise<IPaginatedResponse<IPartnerCandidateWithRecommendation>> {
    try {
      const queryParams = pagination ? this.buildQueryString(pagination) : '';
      return await this.apiGet<
        IPaginatedResponse<IPartnerCandidateWithRecommendation>
      >(
        `${CANDIDATE_MANAGEMENT_ENDPOINTS.RECOMMENDATIONS.replace(
          ':jobPostingId',
          jobPostingId
        )}${queryParams}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update recommendation status for a candidate-job posting combination
   */
  public async updateCandidateRecommendationStatus(
    candidateId: string,
    jobPostingId: string,
    data: {
      isViewed?: boolean;
      isSaved?: boolean;
      hasApplied?: boolean;
    }
  ): Promise<{ success: boolean; message: string }> {
    try {
      return await this.apiPatch<{ success: boolean; message: string }>(
        `${CANDIDATE_MANAGEMENT_ENDPOINTS.RECOMMENDATION_STATUS.replace(
          ':candidateId',
          candidateId
        ).replace(':jobPostingId', jobPostingId)}`,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
