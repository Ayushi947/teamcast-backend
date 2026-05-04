import { ApiService } from '../core/api.service';
import {
  ICandidateJobAssessmentInvite,
  toCandidateJobAssessmentInviteDomain,
} from '../../models/domain/candidate/job.assessment.invite.domain';
import {
  ICandidateDeclineJobAssessmentInviteRequest,
  ICandidateAcceptJobAssessmentInviteRequest,
  ICandidateJobAssessmentInviteFilterQuery,
  ICandidateJobAssessmentInviteResponse,
} from '../../models/api/candidate/job.assessment.invite.api';
import {
  IPaginatedResponse,
  IPaginationRequest,
} from '../../models/api/common/common.api';

/**
 * API endpoints for candidate Job assessment invite operations
 */
const CANDIDATE_JOB_ASSESSMENT_INVITE_ENDPOINTS = {
  BASE: '/candidate/job-assessment-invites',
  ACCEPT: '/candidate/job-assessment-invites/:inviteId/accept',
  DECLINE: '/candidate/job-assessment-invites/:inviteId/decline',
} as const;

/**
 * Service for handling candidate Job assessment invite related API operations
 */
export class CandidateJobAssessmentInviteApiService extends ApiService {
  /**
   * Get candidate's Job assessment invites with pagination and filtering
   * @param params - Pagination and filtering parameters
   * @returns Promise resolving to paginated list of invites
   * @throws Error if the API request fails
   */
  public async getInvites(
    params?: ICandidateJobAssessmentInviteFilterQuery & IPaginationRequest
  ): Promise<IPaginatedResponse<ICandidateJobAssessmentInviteResponse>> {
    try {
      return await this.apiGet<
        IPaginatedResponse<ICandidateJobAssessmentInviteResponse>
      >(
        `${CANDIDATE_JOB_ASSESSMENT_INVITE_ENDPOINTS.BASE}${params ? this.buildQueryString(params) : ''}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Accept a Job assessment invite
   * @param inviteId - The ID of the invite to accept
   * @param data - Optional acceptance request data
   * @returns Promise resolving to the updated invite
   * @throws Error if the API request fails
   */
  public async acceptInvite(
    inviteId: string,
    data?: ICandidateAcceptJobAssessmentInviteRequest
  ): Promise<ICandidateJobAssessmentInvite> {
    const response = await this.apiPost<ICandidateJobAssessmentInviteResponse>(
      CANDIDATE_JOB_ASSESSMENT_INVITE_ENDPOINTS.ACCEPT.replace(
        ':inviteId',
        inviteId
      ),
      {
        acceptanceNote: data?.acceptanceNote,
        scheduledDate: data?.scheduledDate,
      }
    );

    return toCandidateJobAssessmentInviteDomain(response);
  }

  /**
   * Decline a Job assessment invite
   * @param inviteId - The ID of the invite to decline
   * @param data - Optional decline request data
   * @returns Promise resolving to the updated invite
   * @throws Error if the API request fails
   */
  public async declineInvite(
    inviteId: string,
    data?: ICandidateDeclineJobAssessmentInviteRequest
  ): Promise<ICandidateJobAssessmentInvite> {
    try {
      const response = await this.apiPost<any>(
        CANDIDATE_JOB_ASSESSMENT_INVITE_ENDPOINTS.DECLINE.replace(
          ':inviteId',
          inviteId
        ),
        data
      );
      return toCandidateJobAssessmentInviteDomain(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
