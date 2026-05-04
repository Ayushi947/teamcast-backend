import { ApiService } from '../core/api.service';
import {
  IClientJobAiAssessmentInviteCreateApiResponse,
  IJobAiAssessmentApplicationUrlGenerateResponse,
  IJobAiAssessmentInviteApiRequest,
} from '../../models/api/client/job.ai.assessment.invite.api';
import {
  IScheduledJobAssessmentDetails,
  IJobAiAssessmentInterviewItem,
} from '../../models/domain/client/job.ai.assessment.invite';
import { IJobAiAssessmentInvite } from '../../models/domain/client/job.ai.assessment.invite';
import {
  IPaginationRequest,
  IPaginatedResponse,
} from '../../models/api/common/common.api';
import { singleton } from '../../decorators/singleton';

const JOB_AI_ASSESSMENT_INVITE_ENDPOINTS = {
  BASE: '/client/job-ai-assessment-invites',
  GENERATE_URL: '/client/job-ai-assessment-invites/generate-url',
} as const;

@singleton
export class ClientJobAiAssessmentInviteApiService extends ApiService {
  public async createJobAiAssessmentInvite(
    data: IJobAiAssessmentInviteApiRequest
  ): Promise<IClientJobAiAssessmentInviteCreateApiResponse> {
    try {
      return await this.apiPost<IClientJobAiAssessmentInviteCreateApiResponse>(
        `${JOB_AI_ASSESSMENT_INVITE_ENDPOINTS.BASE}`,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Generate JD assessment URL
   * @param applicationId - The ID of the application to generate URL for
   * @returns Promise resolving to the generated URL
   * @throws Error if the API request fails
   */
  public async generateJdAssessmentUrl(
    candidateId: string,
    jobApplicationId: string
  ): Promise<IJobAiAssessmentApplicationUrlGenerateResponse> {
    try {
      return await this.apiPost<IJobAiAssessmentApplicationUrlGenerateResponse>(
        JOB_AI_ASSESSMENT_INVITE_ENDPOINTS.GENERATE_URL,
        {
          candidateId: candidateId,
          jobApplicationId: jobApplicationId,
        }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * List job AI assessment interviews with pagination and search
   * @param pagination - Pagination parameters including search query
   * @returns Promise resolving to the paginated list of job AI assessment interviews
   * @throws Error if the API request fails
   */
  public async listJobAiAssessmentInterviews(
    pagination?: IPaginationRequest
  ): Promise<IPaginatedResponse<IJobAiAssessmentInterviewItem>> {
    try {
      const queryParams = this.buildQueryString(pagination || {});
      return await this.apiGet<
        IPaginatedResponse<IJobAiAssessmentInterviewItem>
      >(`${JOB_AI_ASSESSMENT_INVITE_ENDPOINTS.BASE}/interviews${queryParams}`);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get details for job ai assessment by invitation id
   * @param invitationId - The ID of the invitation
   * @returns Promise resolving to the job ai assessment details
   * @throws Error if the API request fails
   */
  public async getJobAiAssessmentDetails(
    invitationId: string
  ): Promise<IScheduledJobAssessmentDetails> {
    try {
      return await this.apiGet<IScheduledJobAssessmentDetails>(
        `${JOB_AI_ASSESSMENT_INVITE_ENDPOINTS.BASE}/${invitationId}/details`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
  /**
   * Get job AI assessment invite for candidate
   * @param candidateId - The ID of the candidate
   * @returns Promise resolving to the job AI assessment invite
   * @throws Error if the API request fails
   */
  public async getJobAiAssessmentInviteForCandidateId(
    candidateId: string
  ): Promise<IJobAiAssessmentInvite> {
    try {
      return await this.apiGet<IJobAiAssessmentInvite>(
        `${JOB_AI_ASSESSMENT_INVITE_ENDPOINTS.BASE}/${candidateId}/interviews`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
