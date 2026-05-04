import { ApiService } from '../core/api.service';
import { singleton } from '../../decorators/singleton';
import {
  IJobPostingRecommendationListApiRequest,
  IJobPostingRecommendationRejectApiRequest,
} from '../../models/api/client/job.posting.recommendation.api';
import { IPaginatedResponse } from '../../models/api/common/common.api';
import { IJobPostingRecommendation } from '../../models/domain/client/job.posting.recommendation.domain';

/**
 * API endpoints for job posting recommendation related operations
 */
const JOB_POSTING_RECOMMENDATION_ENDPOINTS = {
  LIST: '/client/job-posting-recommendations/:jobPostingId/recommendations',
  GET: '/client/job-posting-recommendations/:jobPostingId/recommendations/:recommendationId',
  REJECT:
    '/client/job-posting-recommendations/:jobPostingId/recommendations/:recommendationId/reject',
  MARK_VIEWED:
    '/client/job-posting-recommendations/:jobPostingId/recommendations/:recommendationId/mark-viewed',
  SAVE: '/client/job-posting-recommendations/:jobPostingId/recommendations/:recommendationId/save',
  UNSAVE:
    '/client/job-posting-recommendations/:jobPostingId/recommendations/:recommendationId/unsave',
} as const;

/**
 * Service for handling job posting recommendation related API operations
 */
@singleton
export class ClientJobPostingRecommendationApiService extends ApiService {
  /**
   * Gets paginated job posting recommendations
   * @param jobPostingId - The ID of the job posting
   * @param params - Query parameters for filtering and pagination
   * @returns Promise resolving to paginated recommendations
   * @throws Error if the API request fails
   */
  public async getJobPostingRecommendations(
    jobPostingId: string,
    params?: IJobPostingRecommendationListApiRequest
  ): Promise<IPaginatedResponse<IJobPostingRecommendation>> {
    try {
      const url = JOB_POSTING_RECOMMENDATION_ENDPOINTS.LIST.replace(
        ':jobPostingId',
        jobPostingId
      );
      return await this.apiGet<IPaginatedResponse<IJobPostingRecommendation>>(
        url,
        { params }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gets a single job posting recommendation
   * @param jobPostingId - The ID of the job posting
   * @param recommendationId - The ID of the recommendation
   * @returns Promise resolving to the recommendation
   * @throws Error if the API request fails
   */
  public async getJobPostingRecommendation(
    jobPostingId: string,
    recommendationId: string
  ): Promise<IJobPostingRecommendation> {
    try {
      const url = JOB_POSTING_RECOMMENDATION_ENDPOINTS.GET.replace(
        ':jobPostingId',
        jobPostingId
      ).replace(':recommendationId', recommendationId);
      return await this.apiGet<IJobPostingRecommendation>(url);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Rejects a job posting recommendation
   * @param jobPostingId - The ID of the job posting
   * @param recommendationId - The ID of the recommendation
   * @param data - Rejection feedback data
   * @returns Promise resolving to the updated recommendation
   * @throws Error if the API request fails
   */
  public async rejectJobPostingRecommendation(
    jobPostingId: string,
    recommendationId: string,
    data: IJobPostingRecommendationRejectApiRequest
  ): Promise<IJobPostingRecommendation> {
    try {
      const url = JOB_POSTING_RECOMMENDATION_ENDPOINTS.REJECT.replace(
        ':jobPostingId',
        jobPostingId
      ).replace(':recommendationId', recommendationId);
      return await this.apiPost<IJobPostingRecommendation>(url, data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Marks a job posting recommendation as viewed
   * @param jobPostingId - The ID of the job posting
   * @param recommendationId - The ID of the recommendation
   * @returns Promise resolving to the updated recommendation
   * @throws Error if the API request fails
   */
  public async markJobPostingRecommendationAsViewed(
    jobPostingId: string,
    recommendationId: string
  ): Promise<IJobPostingRecommendation> {
    try {
      const url = JOB_POSTING_RECOMMENDATION_ENDPOINTS.MARK_VIEWED.replace(
        ':jobPostingId',
        jobPostingId
      ).replace(':recommendationId', recommendationId);
      return await this.apiPost<IJobPostingRecommendation>(url);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Saves a job posting recommendation
   * @param jobPostingId - The ID of the job posting
   * @param recommendationId - The ID of the recommendation
   * @returns Promise resolving to the updated recommendation
   * @throws Error if the API request fails
   */
  public async saveJobPostingRecommendation(
    jobPostingId: string,
    recommendationId: string
  ): Promise<IJobPostingRecommendation> {
    try {
      const url = JOB_POSTING_RECOMMENDATION_ENDPOINTS.SAVE.replace(
        ':jobPostingId',
        jobPostingId
      ).replace(':recommendationId', recommendationId);
      return await this.apiPost<IJobPostingRecommendation>(url);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Unsaves a job posting recommendation
   * @param jobPostingId - The ID of the job posting
   * @param recommendationId - The ID of the recommendation
   * @returns Promise resolving to the updated recommendation
   * @throws Error if the API request fails
   */
  public async unsaveJobPostingRecommendation(
    jobPostingId: string,
    recommendationId: string
  ): Promise<IJobPostingRecommendation> {
    try {
      const url = JOB_POSTING_RECOMMENDATION_ENDPOINTS.UNSAVE.replace(
        ':jobPostingId',
        jobPostingId
      ).replace(':recommendationId', recommendationId);
      return await this.apiPost<IJobPostingRecommendation>(url);
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
