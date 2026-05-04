import { singleton } from '../../decorators/singleton';
import { ApiService } from '../core/api.service';
import {
  IJobInviteApiRequest,
  IJobInviteApiResponse,
  IJobInviteTokenValidationResponse,
  IJobInviteListApiResponse,
  IJobInviteByJobApiResponse,
  IJobInviteListApiRequest,
  IJobInviteByJobApiRequest,
  IJobImportedInviteListApiResponse,
} from '../../models/api/client/job.invite.api';

const JOB_INVITE_ENDPOINTS = {
  BASE: '/client/job-invites',
  IMPORTED: '/client/job-invites/:jobPostingId/imported',
} as const;

@singleton
export class ClientJobInviteApiService extends ApiService {
  /**
   * Create a job invite
   * @param data - The job invite request data
   * @returns Promise resolving to the created invite response
   * @throws Error if the API request fails
   */
  public async createJobInvite(
    data: IJobInviteApiRequest
  ): Promise<IJobInviteApiResponse> {
    try {
      return await this.apiPost<IJobInviteApiResponse>(
        `${JOB_INVITE_ENDPOINTS.BASE}`,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Validate an invite token
   * @param token - The invite token to validate
   * @returns Promise resolving to the validation response
   * @throws Error if the API request fails
   */
  public async validateInviteToken(
    token: string
  ): Promise<IJobInviteTokenValidationResponse> {
    try {
      return await this.apiGet<IJobInviteTokenValidationResponse>(
        `${JOB_INVITE_ENDPOINTS.BASE}/validate/${token}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get all job invites with filtering and pagination
   * @param params - Query parameters for filtering and pagination
   * @returns Promise resolving to the job invites list response
   * @throws Error if the API request fails
   */
  public async getAllJobInvites(
    params?: IJobInviteListApiRequest
  ): Promise<IJobInviteListApiResponse> {
    try {
      const queryString = this.buildQueryString(params);
      return await this.apiGet<IJobInviteListApiResponse>(
        `${JOB_INVITE_ENDPOINTS.BASE}${queryString}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get job invites by specific job posting ID
   * @param jobPostingId - The job posting ID
   * @param params - Query parameters for filtering and pagination
   * @returns Promise resolving to the job invites list response
   * @throws Error if the API request fails
   */
  public async getJobInvitesByJobPostingId(
    jobPostingId: string,
    params?: IJobInviteByJobApiRequest
  ): Promise<IJobInviteByJobApiResponse> {
    try {
      const queryString = this.buildQueryString(params);
      return await this.apiGet<IJobInviteByJobApiResponse>(
        `${JOB_INVITE_ENDPOINTS.BASE}/${jobPostingId}${queryString}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get imported candidate job invites for a specific job posting
   * @param jobPostingId - The job posting ID
   * @param params - Query parameters for filtering and pagination
   * @returns Promise resolving to the imported candidate job invites list response
   * @throws Error if the API request fails
   */
  public async getImportedCandidateJobInvitesByJobId(
    jobPostingId: string,
    params?: IJobInviteByJobApiRequest
  ): Promise<IJobImportedInviteListApiResponse> {
    try {
      const queryString = this.buildQueryString(params);
      const url = JOB_INVITE_ENDPOINTS.IMPORTED.replace(
        ':jobPostingId',
        jobPostingId
      );
      return await this.apiGet<IJobImportedInviteListApiResponse>(
        `${url}${queryString}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
