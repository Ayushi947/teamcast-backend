import { ApiService } from '../core/api.service';
import { singleton } from '../../decorators/singleton';
import {
  ICandidateRecommendationListApiRequest,
  IRejectCandidateRecommendationApiRequest,
} from '../../models/api/candidate/recommendation.api';
import { IPaginatedResponse } from '../../models/api/common/common.api';
import { ICandidateRecommendation } from '../../models/domain/candidate/recommendation.domain';

/**
 * API endpoints for candidate recommendation related operations
 */
const CANDIDATE_RECOMMENDATION_ENDPOINTS = {
  LIST: '/candidate/:candidateId/recommendations',
  GET: '/candidate/recommendations/:recommendationId',
  REJECT: '/candidate/recommendations/:recommendationId/reject',
  MARK_VIEWED: '/candidate/:candidateId/recommendations/:recommendationId/view',
  SAVE: '/candidate/:candidateId/recommendations/:recommendationId/save',
  UNSAVE: '/candidate/:candidateId/recommendations/:recommendationId/unsave',
} as const;

/**
 * Service for handling candidate recommendation related API operations
 */
@singleton
export class CandidateRecommendationApiService extends ApiService {
  /**
   * Gets paginated candidate recommendations
   * @param candidateId - The candidate ID
   * @param params - Query parameters for filtering and pagination
   * @returns Promise resolving to paginated recommendations
   * @throws Error if the API request fails
   */
  public async getCandidateRecommendations(
    candidateId: string,
    params?: Omit<ICandidateRecommendationListApiRequest, 'params'>
  ): Promise<IPaginatedResponse<ICandidateRecommendation>> {
    try {
      const url = CANDIDATE_RECOMMENDATION_ENDPOINTS.LIST.replace(
        ':candidateId',
        candidateId
      );
      return await this.apiGet<IPaginatedResponse<ICandidateRecommendation>>(
        url,
        params
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gets a single candidate recommendation
   * @param recommendationId - The ID of the recommendation
   * @returns Promise resolving to the recommendation
   * @throws Error if the API request fails
   */
  public async getCandidateRecommendation(
    recommendationId: string
  ): Promise<ICandidateRecommendation> {
    try {
      const url = CANDIDATE_RECOMMENDATION_ENDPOINTS.GET.replace(
        ':recommendationId',
        recommendationId
      );
      return await this.apiGet<ICandidateRecommendation>(url);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Rejects a candidate recommendation
   * @param recommendationId - The ID of the recommendation
   * @param data - Rejection feedback data
   * @returns Promise resolving to the updated recommendation
   * @throws Error if the API request fails
   */
  public async rejectCandidateRecommendation(
    recommendationId: string,
    data: IRejectCandidateRecommendationApiRequest
  ): Promise<ICandidateRecommendation> {
    try {
      const url = CANDIDATE_RECOMMENDATION_ENDPOINTS.REJECT.replace(
        ':recommendationId',
        recommendationId
      );
      return await this.apiPost<ICandidateRecommendation>(url, data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Marks a candidate recommendation as viewed
   * @param candidateId - The ID of the candidate
   * @param recommendationId - The ID of the recommendation
   * @returns Promise resolving to the updated recommendation
   * @throws Error if the API request fails
   */
  public async markCandidateRecommendationAsViewed(
    candidateId: string,
    recommendationId: string
  ): Promise<ICandidateRecommendation> {
    try {
      const url = CANDIDATE_RECOMMENDATION_ENDPOINTS.MARK_VIEWED.replace(
        ':candidateId',
        candidateId
      ).replace(':recommendationId', recommendationId);
      return await this.apiPost<ICandidateRecommendation>(url);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Saves a candidate recommendation
   * @param candidateId - The ID of the candidate
   * @param recommendationId - The ID of the recommendation
   * @returns Promise resolving to the updated recommendation
   * @throws Error if the API request fails
   */
  public async saveCandidateRecommendation(
    candidateId: string,
    recommendationId: string
  ): Promise<ICandidateRecommendation> {
    try {
      const url = CANDIDATE_RECOMMENDATION_ENDPOINTS.SAVE.replace(
        ':candidateId',
        candidateId
      ).replace(':recommendationId', recommendationId);
      return await this.apiPost<ICandidateRecommendation>(url);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Unsaves a candidate recommendation
   * @param candidateId - The ID of the candidate
   * @param recommendationId - The ID of the recommendation
   * @returns Promise resolving to the updated recommendation
   * @throws Error if the API request fails
   */
  public async unsaveCandidateRecommendation(
    candidateId: string,
    recommendationId: string
  ): Promise<ICandidateRecommendation> {
    try {
      const url = CANDIDATE_RECOMMENDATION_ENDPOINTS.UNSAVE.replace(
        ':candidateId',
        candidateId
      ).replace(':recommendationId', recommendationId);
      return await this.apiPost<ICandidateRecommendation>(url);
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
