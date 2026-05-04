import { ISupportJobPostingListResponse } from '../../models/domain/support/job.posting.domain';
import { ICreateCandidateRecommendationResponse } from '../../models/api/support/candidate.recommendations.api';
import { ApiService } from '../core/api.service';

const CANDIDATE_RECOMMENDATIONS_ENDPOINTS = {
  BASE: '/support/candidate/recommendations',
  RECOMMENDED_JOBS: '/recommended-jobs/candidate/:candidateId',
} as const;

export class CandidateRecommendationsApiService extends ApiService {
  /**
   * Create a candidate recommendation
   * @param candidateId - The ID of the candidate
   * @param jobId - The ID of the job
   * @returns Promise resolving to void
   * @throws Error if the API request fails
   */
  async createCandidateRecommendation(
    candidateId: string,
    jobId: string
  ): Promise<ICreateCandidateRecommendationResponse> {
    try {
      return await this.apiPost<ICreateCandidateRecommendationResponse>(
        `${CANDIDATE_RECOMMENDATIONS_ENDPOINTS.BASE}`,
        {
          candidateId,
          jobId,
        }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get candidate recommended jobs
   * @param candidateId - The ID of the candidate
   * @returns Promise resolving to ISupportJobPostingListResponse
   * @throws Error if the API request fails
   */
  async getCandidateRecommendedJobs(
    candidateId: string
  ): Promise<ISupportJobPostingListResponse> {
    try {
      return await this.apiGet<ISupportJobPostingListResponse>(
        `${CANDIDATE_RECOMMENDATIONS_ENDPOINTS.RECOMMENDED_JOBS.replace(
          ':candidateId',
          candidateId
        )}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
