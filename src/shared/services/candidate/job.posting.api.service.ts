import { ICandidateJobPostingFilterQuery } from '../../models/api/candidate/job.posting.api';
import { ApiService } from '../core/api.service';
import {
  ICandidateJobPosting,
  ICandidateJobPostingApply,
} from '../../models/domain/candidate/job.posting.domain';
import {
  IPaginatedResponse,
  IPaginationRequest,
} from '../../models/api/common/common.api';
import { ICandidateJobApplication } from '../../models/domain/candidate/application.domain';
import { singleton } from '../../decorators/singleton';
/**
 * API endpoints for job posting related operations
 */
const JOB_POSTING_ENDPOINTS = {
  BASE: '/candidate/job-postings',
} as const;

/**
 * Service for handling job posting related API operations
 */
@singleton
export class CandidateJobPostingApiService extends ApiService {
  /**
   * Retrieves a list of job postings with optional filtering and pagination
   * @param filter - Optional filter and pagination parameters
   * @returns Promise resolving to paginated job postings
   * @throws Error if the API request fails
   */
  public async getJobPostings(
    filter?: ICandidateJobPostingFilterQuery & IPaginationRequest
  ): Promise<IPaginatedResponse<ICandidateJobPosting>> {
    try {
      return await this.apiGet<IPaginatedResponse<ICandidateJobPosting>>(
        `${JOB_POSTING_ENDPOINTS.BASE}${filter ? this.buildQueryString(filter) : ''}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Retrieves a specific job posting by ID
   * @param jobPostingId - The ID of the job posting to retrieve
   * @returns Promise resolving to the job posting details
   * @throws Error if the API request fails
   */
  public async getJobPosting(
    jobPostingId: string
  ): Promise<ICandidateJobPosting> {
    try {
      return await this.apiGet<ICandidateJobPosting>(
        `${JOB_POSTING_ENDPOINTS.BASE}/${jobPostingId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Applies for a specific job posting
   * @param jobPostingId - The ID of the job posting to apply for
   * @param data - The application data
   * @returns Promise resolving to the job application details
   * @throws Error if the API request fails
   */
  public async applyForJob(
    jobPostingId: string,
    data: ICandidateJobPostingApply
  ): Promise<ICandidateJobApplication> {
    try {
      return await this.apiPost<ICandidateJobApplication>(
        `${JOB_POSTING_ENDPOINTS.BASE}/${jobPostingId}/apply`,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
