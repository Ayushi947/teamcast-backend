import {
  ISupportJobInviteApiRequest,
  ISupportJobInviteApiResponse,
  ISupportJobInviteSimpleResponse,
  ISupportJobPostingInviteDetail,
} from '../../models/api/support/job.posting.invite.api';
import { singleton } from '../../decorators/singleton';
import { ApiService } from '../core/api.service';
import {
  IPaginationRequest,
  IPaginatedResponse,
} from '../../models/api/common/common.api';
import { ISupportJobPostingInviteFilterQuery } from '../../models/domain/support/job.posting.invite.domain';

const JOB_POSTING_INVITE_ENDPOINTS = {
  BASE: '/support/job-posting-invites',
  RESEND: '/support/job-posting-invites/:invitationId/resend',
  WITHDRAW: '/support/job-posting-invites/:invitationId/withdraw',
  IMPORTED_CANDIDATES:
    '/support/job-posting-invites/:jobId/imported-candidates',
} as const;

@singleton
export class SupportJobPostingInviteApiService extends ApiService {
  /**
   * Create a support job posting invite
   * @param data - The data for the invite
   * @returns The response from the API
   */
  public async createSupportJobPostingInvite(
    data: ISupportJobInviteApiRequest
  ): Promise<ISupportJobInviteApiResponse> {
    try {
      const endpoint = JOB_POSTING_INVITE_ENDPOINTS.BASE;
      return await this.apiPost<ISupportJobInviteApiResponse>(endpoint, data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get job posting invites by support user ID with pagination and filtering
   * @param filter - Optional pagination and filtering parameters
   * @returns The response from the API
   */
  public async getJobPostingInvitesBySupportUserId(
    filter?: ISupportJobPostingInviteFilterQuery & IPaginationRequest
  ): Promise<IPaginatedResponse<ISupportJobPostingInviteDetail>> {
    try {
      return await this.apiGet<
        IPaginatedResponse<ISupportJobPostingInviteDetail>
      >(
        `${JOB_POSTING_INVITE_ENDPOINTS.BASE}${filter ? this.buildQueryString(filter) : ''}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Resend a job posting invite
   * @param invitationId - The ID of the invite to resend
   * @returns The response from the API
   */
  public async resendJobPostingInvite(
    invitationId: string
  ): Promise<ISupportJobInviteSimpleResponse> {
    try {
      const endpoint = JOB_POSTING_INVITE_ENDPOINTS.RESEND.replace(
        ':invitationId',
        invitationId
      );
      return await this.apiPost<ISupportJobInviteSimpleResponse>(endpoint);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Withdraw a job posting invite
   * @param invitationId - The ID of the invite to withdraw
   * @returns The response from the API
   */
  public async withdrawJobPostingInvite(
    invitationId: string
  ): Promise<ISupportJobInviteSimpleResponse> {
    try {
      const endpoint = JOB_POSTING_INVITE_ENDPOINTS.WITHDRAW.replace(
        ':invitationId',
        invitationId
      );
      return await this.apiPost<ISupportJobInviteSimpleResponse>(endpoint);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get imported candidates for a job posting
   * @param jobId - The ID of the job posting
   * @param filter - Optional pagination and filtering parameters
   * @returns The response from the API
   */
  public async getImportedCandidates(
    jobId: string,
    filter?: ISupportJobPostingInviteFilterQuery & IPaginationRequest
  ): Promise<IPaginatedResponse<ISupportJobPostingInviteDetail>> {
    try {
      const endpoint = JOB_POSTING_INVITE_ENDPOINTS.IMPORTED_CANDIDATES.replace(
        ':jobId',
        jobId
      );
      return await this.apiGet<
        IPaginatedResponse<ISupportJobPostingInviteDetail>
      >(`${endpoint}${filter ? this.buildQueryString(filter) : ''}`);
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
