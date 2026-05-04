import {
  ICandidatePanelAssessmentInvitationGetApiResponse,
  ICandidatePanelAssessmentSlotsGetApiResponse,
} from './../../models/api/candidate/job.panel.assessment.api';
import { ApiService } from '../core/api.service';
import {
  IPaginationRequest,
  IPaginatedResponse,
} from '../../models/api/common/common.api';
import {
  ICandidatePanelAssessmentSlot,
  ICandidatePanelAssessmentInvitation,
} from '../../models/domain/candidate/job.panel.assessment.domain';
import { JobPanelAssessmentInvitationStatusEnum } from '../../models/common/enums';
import { IJobAiAssessmentInterviewItem } from '../../models/domain/client/job.ai.assessment.invite';

/**
 * API endpoints for candidate panel assessment related operations
 */
const CANDIDATE_PANEL_ASSESSMENT_ENDPOINTS = {
  INVITATION: '/candidate/panel-assessment/invitations/:invitationId',
  INVITATION_RESPOND:
    '/candidate/panel-assessment/invitations/:invitationId/respond',
  SLOTS: '/candidate/panel-assessment/:panelAssessmentId/slots',
  INTERVIEWS: '/candidate/panel-assessment/interviews',
} as const;

interface ICandidatePanelAssessmentInvitationResponse {
  action: JobPanelAssessmentInvitationStatusEnum;
  selectedSlotId?: string;
}

export class CandidatePanelAssessmentApiService extends ApiService {
  /**
   * Get panel assessment invitation details for candidate
   */
  public async getPanelAssessmentInvitation(
    invitationId: string
  ): Promise<ICandidatePanelAssessmentInvitationGetApiResponse> {
    try {
      return await this.apiGet<ICandidatePanelAssessmentInvitationGetApiResponse>(
        CANDIDATE_PANEL_ASSESSMENT_ENDPOINTS.INVITATION.replace(
          ':invitationId',
          invitationId
        )
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Respond to panel assessment invitation (accept/reject)
   */
  public async respondToPanelAssessmentInvitation(
    invitationId: string,
    data: ICandidatePanelAssessmentInvitationResponse
  ): Promise<{
    invitation: ICandidatePanelAssessmentInvitation;
    message: string;
  }> {
    try {
      return await this.apiPost<{
        invitation: ICandidatePanelAssessmentInvitation;
        message: string;
      }>(
        CANDIDATE_PANEL_ASSESSMENT_ENDPOINTS.INVITATION_RESPOND.replace(
          ':invitationId',
          invitationId
        ),
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get available panel assessment slots for candidate
   */
  public async getPanelAssessmentSlots(
    panelAssessmentId: string
  ): Promise<ICandidatePanelAssessmentSlotsGetApiResponse> {
    try {
      return await this.apiGet<ICandidatePanelAssessmentSlotsGetApiResponse>(
        CANDIDATE_PANEL_ASSESSMENT_ENDPOINTS.SLOTS.replace(
          ':panelAssessmentId',
          panelAssessmentId
        )
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get panel assessment slots with pagination and filters
   */
  public async getPanelAssessmentSlotsPaginated(
    panelAssessmentId: string,
    params?: {
      status?: string;
      startDate?: Date;
      endDate?: Date;
    } & IPaginationRequest
  ): Promise<IPaginatedResponse<ICandidatePanelAssessmentSlot>> {
    try {
      const endpoint = CANDIDATE_PANEL_ASSESSMENT_ENDPOINTS.SLOTS.replace(
        ':panelAssessmentId',
        panelAssessmentId
      );

      return await this.apiGet<
        IPaginatedResponse<ICandidatePanelAssessmentSlot>
      >(`${endpoint}${params ? this.buildQueryString(params) : ''}`);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Check invitation status for candidate
   */
  public async checkInvitationStatus(invitationId: string): Promise<{
    status: string;
    isExpired: boolean;
    canRespond: boolean;
    expiresAt?: Date;
  }> {
    try {
      return await this.apiGet<{
        status: string;
        isExpired: boolean;
        canRespond: boolean;
        expiresAt?: Date;
      }>(
        `${CANDIDATE_PANEL_ASSESSMENT_ENDPOINTS.INVITATION.replace(
          ':invitationId',
          invitationId
        )}/status`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get candidate's panel assessment history
   */
  public async getCandidatePanelAssessmentHistory(
    params?: {
      status?: string;
      startDate?: Date;
      endDate?: Date;
    } & IPaginationRequest
  ): Promise<IPaginatedResponse<ICandidatePanelAssessmentInvitation>> {
    try {
      return await this.apiGet<
        IPaginatedResponse<ICandidatePanelAssessmentInvitation>
      >(
        `/candidate/panel-assessment/history${
          params ? this.buildQueryString(params) : ''
        }`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Lists scheduled interviews with pagination support
   * @param pagination - Optional pagination parameters
   * @returns Promise resolving to the list of scheduled interviews
   * @throws Error if the API request fails
   */
  public async listScheduledInterviews(
    pagination?: IPaginationRequest
  ): Promise<IPaginatedResponse<IJobAiAssessmentInterviewItem>> {
    try {
      const queryParams = pagination ? this.buildQueryString(pagination) : '';
      return await this.apiGet<
        IPaginatedResponse<IJobAiAssessmentInterviewItem>
      >(`${CANDIDATE_PANEL_ASSESSMENT_ENDPOINTS.INTERVIEWS}${queryParams}`);
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
