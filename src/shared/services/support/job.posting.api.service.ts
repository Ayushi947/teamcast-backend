import { singleton } from '../../decorators/singleton';
import { ApiService } from '../core/api.service';
import { ISupportJobPostingListResponse } from '../../models/domain/support/job.posting.domain';

const JOB_POSTING_ENDPOINTS = {
  BASE: '/support/job-postings',
} as const;

@singleton
export class SupportJobPostingApiService extends ApiService {
  /**
   * Get all job postings by account manager ID
   * @returns List of job postings
   */
  public async getJobPostingsByAccountManagerId(): Promise<ISupportJobPostingListResponse> {
    try {
      const endpoint = JOB_POSTING_ENDPOINTS.BASE + '/account-manager';
      return await this.apiGet<ISupportJobPostingListResponse>(endpoint);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get all job postings by account manager ID
   * @returns List of job postings
   */
  public async getAllJobPostingsBySupportUserId(): Promise<ISupportJobPostingListResponse> {
    try {
      const endpoint = JOB_POSTING_ENDPOINTS.BASE;
      return await this.apiGet<ISupportJobPostingListResponse>(endpoint);
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
