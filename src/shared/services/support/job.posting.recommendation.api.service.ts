import { ApiService } from '../core/api.service';
import { singleton } from '../../decorators/singleton';
import type {
  ISupportJobRecommendationPreviewApiResponse,
  ISupportStoreRecommendationsApiRequest,
  ISupportStoreRecommendationsApiResponse,
  ISupportStoredJobRecommendationListApiResponse,
  ISupportRefreshRecommendationsApiRequest,
  ISupportRefreshRecommendationsApiResponse,
} from '../../models/api/support/job.posting.recommendation.api';
import { IPaginationRequest } from '../../models/api/common/common.api';

/**
 * API endpoints for support job posting recommendation operations
 */
const SUPPORT_JOB_RECOMMENDATION_ENDPOINTS = {
  BASE: '/support/job-postings',
  PREVIEW: (jobPostingId: string) =>
    `/support/job-postings/${jobPostingId}/recommendations/preview`,
  STORE: (jobPostingId: string) =>
    `/support/job-postings/${jobPostingId}/recommendations/store`,
  LIST: (jobPostingId: string) =>
    `/support/job-postings/${jobPostingId}/recommendations`,
  REFRESH: (jobPostingId: string) =>
    `/support/job-postings/${jobPostingId}/recommendations/refresh`,
} as const;

@singleton
export class SupportJobPostingRecommendationApiService extends ApiService {
  /**
   * Get job recommendation preview for recruiter review
   * @param jobPostingId ID of the job posting
   * @param filters Query filters including prevSyncDateTime and candidateSearch
   * @param pagination Pagination parameters
   */
  public async getRecommendationsPreview(
    jobPostingId: string,
    filters?: {
      prevSyncDateTime?: string;
      search?: string;
      searchColumns?: string[];
      candidateSearch?: string;
    },
    pagination?: IPaginationRequest
  ): Promise<ISupportJobRecommendationPreviewApiResponse> {
    try {
      const queryParams = {
        ...(filters || {}),
        ...(pagination || {}),
      };
      const hasParams = Object.keys(queryParams).length > 0;
      const url = `${SUPPORT_JOB_RECOMMENDATION_ENDPOINTS.PREVIEW(jobPostingId)}${hasParams ? this.buildQueryString(queryParams) : ''}`;
      return await this.apiGet<ISupportJobRecommendationPreviewApiResponse>(
        url
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Store selected recommendations to database
   * @param jobPostingId ID of the job posting
   * @param data Store recommendations request data
   */
  public async storeSelectedRecommendations(
    jobPostingId: string,
    data: ISupportStoreRecommendationsApiRequest['data']
  ): Promise<ISupportStoreRecommendationsApiResponse> {
    try {
      return await this.apiPost<ISupportStoreRecommendationsApiResponse>(
        SUPPORT_JOB_RECOMMENDATION_ENDPOINTS.STORE(jobPostingId),
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get stored recommendations for a job posting
   * @param jobPostingId ID of the job posting
   * @param pagination Pagination parameters
   */
  public async getStoredRecommendations(
    jobPostingId: string,
    pagination?: IPaginationRequest & {
      search?: string;
      searchColumns?: string[];
    }
  ): Promise<ISupportStoredJobRecommendationListApiResponse> {
    try {
      const queryString = pagination ? this.buildQueryString(pagination) : '';
      const url = `${SUPPORT_JOB_RECOMMENDATION_ENDPOINTS.LIST(jobPostingId)}${queryString}`;
      return await this.apiGet<ISupportStoredJobRecommendationListApiResponse>(
        url
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Refresh job recommendations
   * @param jobPostingId ID of the job posting
   * @param data Refresh recommendations request data
   * @param pagination Pagination parameters
   */
  public async refreshRecommendations(
    jobPostingId: string,
    data: ISupportRefreshRecommendationsApiRequest['data'],
    pagination?: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<ISupportRefreshRecommendationsApiResponse> {
    try {
      const requestData = { ...data, ...pagination };
      return await this.apiPost<ISupportRefreshRecommendationsApiResponse>(
        SUPPORT_JOB_RECOMMENDATION_ENDPOINTS.REFRESH(jobPostingId),
        requestData
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
