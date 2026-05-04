import { ApiService } from '../core/api.service';
import {
  IClientJobPostingCreate,
  IClientJobPostingUpdate,
  IClientJobPostingSkillsUpdate,
  IClientJobPostingStatusUpdate,
  IClientJobPostingInvite,
  IClientJobPostingFilterQuery,
  IClientJobPosting,
} from '../../models/domain/client/job.postings.domain';
import {
  IPaginatedResponse,
  IPaginationRequest,
} from '../../models/api/common/common.api';
import { IClientJobApplication } from '../../models/domain/client/application.domain';
import { singleton } from '../../decorators/singleton';
import { IClientJobPostingInviteApiRequest } from '../../models/api/client/job.posting.api';
/**
 * API endpoints for job posting related operations
 */
const JOB_POSTING_ENDPOINTS = {
  BASE: '/client/job-postings',
  INVITE: '/client/job-postings/:jobPostingId/invite',
  RECOMMENDATION_FEEDBACK:
    '/client/job-postings/:jobPostingId/recommendations/:recommendationId/feedback',
  PUBLIC: '/client/job-postings/public/:jobPostingId',
} as const;

@singleton
export class ClientJobPostingApiService extends ApiService {
  /**
   * Get list of job postings
   */
  public async getJobPostings(
    params?: IClientJobPostingFilterQuery & IPaginationRequest
  ): Promise<IPaginatedResponse<IClientJobPosting>> {
    try {
      return await this.apiGet<IPaginatedResponse<IClientJobPosting>>(
        `${JOB_POSTING_ENDPOINTS.BASE}${params ? this.buildQueryString(params) : ''}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a specific job posting
   */
  public async getJobPosting(jobPostingId: string): Promise<IClientJobPosting> {
    try {
      return await this.apiGet<IClientJobPosting>(
        `${JOB_POSTING_ENDPOINTS.BASE}/${jobPostingId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a new job posting
   */
  public async createJobPosting(
    data: IClientJobPostingCreate
  ): Promise<IClientJobPosting> {
    try {
      return await this.apiPost<IClientJobPosting>(
        JOB_POSTING_ENDPOINTS.BASE,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update a job posting
   */
  public async updateJobPosting(
    jobPostingId: string,
    data: IClientJobPostingUpdate
  ): Promise<IClientJobPosting> {
    try {
      return await this.apiPatch<IClientJobPosting>(
        `${JOB_POSTING_ENDPOINTS.BASE}/${jobPostingId}`,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete a job posting
   */
  public async deleteJobPosting(jobPostingId: string): Promise<boolean> {
    try {
      return await this.apiDelete<boolean>(
        `${JOB_POSTING_ENDPOINTS.BASE}/${jobPostingId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Invite a candidate to a job posting
   */
  public async inviteCandidate(
    jobPostingId: string,
    data: IClientJobPostingInvite
  ): Promise<IClientJobApplication> {
    try {
      return await this.apiPost<IClientJobApplication>(
        `${JOB_POSTING_ENDPOINTS.BASE}/${jobPostingId}/invite`,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update job posting skills
   */
  public async updateJobPostingSkills(
    jobPostingId: string,
    data: IClientJobPostingSkillsUpdate
  ): Promise<IClientJobPosting> {
    try {
      return await this.apiPatch<IClientJobPosting>(
        `${JOB_POSTING_ENDPOINTS.BASE}/${jobPostingId}/skills`,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update job posting status
   */
  public async updateJobPostingStatus(
    jobPostingId: string,
    data: IClientJobPostingStatusUpdate
  ): Promise<IClientJobPosting> {
    try {
      return await this.apiPatch<IClientJobPosting>(
        `${JOB_POSTING_ENDPOINTS.BASE}/${jobPostingId}/status`,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Invites a candidate to a job posting
   * @param jobPostingId - The ID of the job posting to invite to
   * @returns Promise resolving to the invite response
   * @throws Error if the API request fails
   */
  public async inviteToJob(
    jobPostingId: string
  ): Promise<IClientJobPostingInviteApiRequest> {
    try {
      return await this.apiPost<IClientJobPostingInviteApiRequest>(
        `${JOB_POSTING_ENDPOINTS.INVITE.replace(':jobPostingId', jobPostingId)}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a public job posting
   */
  public async getPublicJobPosting(
    jobPostingId: string
  ): Promise<IClientJobPosting> {
    try {
      return await this.apiGet<IClientJobPosting>(
        `${JOB_POSTING_ENDPOINTS.PUBLIC.replace(':jobPostingId', jobPostingId)}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
