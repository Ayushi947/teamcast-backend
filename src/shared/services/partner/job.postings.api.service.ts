import { ApiService } from '../core/api.service';
import {
  IPartnerJobPosting,
  IPartnerJobPostingList,
  IPartnerJobPostingFilterQuery,
} from '../../models/domain/partner/job.postings.domain';
import { IPartnerJobApplicationCreate } from '../../models/domain/partner/job.application.domain';
import {
  IPaginatedResponse,
  IPaginationRequest,
} from '../../models/api/common/common.api';
import { singleton } from '../../decorators/singleton';
import { ApplicationStatusEnum } from '../../models/common/enums';

/**
 * API endpoints for partner job posting related operations
 */
const PARTNER_JOB_POSTING_ENDPOINTS = {
  BASE: '/partner/job-postings',
  APPLY: '/partner/job-postings/:id/apply',
} as const;

/**
 * Service for handling partner job posting related API operations
 */
@singleton
export class PartnerJobPostingsApiService extends ApiService {
  /**
   * Retrieves a list of active job postings available to partners with optional filtering and pagination
   * @param filter - Optional filter and pagination parameters
   * @returns Promise resolving to paginated job postings list
   * @throws Error if the API request fails
   */
  public async getJobPostings(
    filter?: IPartnerJobPostingFilterQuery & IPaginationRequest
  ): Promise<IPaginatedResponse<IPartnerJobPostingList>> {
    try {
      return await this.apiGet<IPaginatedResponse<IPartnerJobPostingList>>(
        `${PARTNER_JOB_POSTING_ENDPOINTS.BASE}${
          filter ? this.buildQueryString(filter) : ''
        }`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Retrieves detailed information for a specific job posting
   * @param jobPostingId - The ID of the job posting to retrieve
   * @returns Promise resolving to the job posting details
   * @throws Error if the API request fails
   */
  public async getJobPostingById(
    jobPostingId: string
  ): Promise<IPartnerJobPosting> {
    try {
      return await this.apiGet<IPartnerJobPosting>(
        `${PARTNER_JOB_POSTING_ENDPOINTS.BASE}/${jobPostingId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Submits a candidate application for a specific job posting
   * @param jobPostingId - The ID of the job posting to apply to
   * @param data - The application data containing candidate ID and optional comment
   * @returns Promise resolving to application confirmation
   * @throws Error if the API request fails
   */
  public async applyToJobPosting(
    jobPostingId: string,
    data: IPartnerJobApplicationCreate
  ): Promise<{
    message: string;
    applications: Array<{
      applicationId: string;
      candidateId: string;
      status: ApplicationStatusEnum;
    }>;
  }> {
    try {
      return await this.apiPost<{
        message: string;
        applications: Array<{
          applicationId: string;
          candidateId: string;
          status: ApplicationStatusEnum;
        }>;
      }>(
        `${PARTNER_JOB_POSTING_ENDPOINTS.APPLY.replace(':id', jobPostingId)}`,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
