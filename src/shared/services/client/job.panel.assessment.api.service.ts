import { ApiService } from '../core/api.service';
import {
  IPaginationRequest,
  IPaginatedResponse,
} from '../../models/api/common/common.api';
import {
  IClientJobPanelAssessmentSlot,
  IClientJobPanelAssessmentSlotWithAvailability,
  IClientJobPanelAssessmentSlotCreate,
  IClientJobPanelAssessmentSlotUpdate,
  IClientJobPanelAssessmentInvitation,
  IClientJobPanelAssessmentInvitationCreate,
  IClientJobPanelAssessmentFeedback,
  IClientJobPanelAssessmentFeedbackSubmit,
  IClientJobPanelAssessment,
} from '../../models/domain/client/job.panel.assessment.domain';
import { IGenerateMeetingLinkRequest } from '../../models/api/client/teams.meeting.api';
import {
  IScheduledInterviewItem,
  IScheduledPanelAssessmentMeetingDetails,
} from '../../models/api/client/job.panel.assessment.api';
import { singleton } from '../../decorators/singleton';

/**
 * API endpoints for panel assessment related operations
 */
const PANEL_ASSESSMENT_ENDPOINTS = {
  SLOTS: '/client/panel-assessment/slots',
  SLOT: '/client/panel-assessment/slots/:slotId',
  INVITATIONS: '/client/panel-assessment/invitations',
  INVITATION: '/client/panel-assessment/invitations/:invitationId',
  INVITATION_CANCEL:
    '/client/panel-assessment/invitations/:invitationId/cancel',
  PUBLIC_FEEDBACK: '/public/panel-assessment/feedback/public/:feedbackToken',
  INTERNAL_FEEDBACK:
    '/client/panel-assessment/feedback/internal/:panelAssessmentId',
  INTERNAL_FEEDBACK_LIST: '/client/panel-assessment/feedback',
  MEETING: '/client/panel-assessment/invitations/:invitationId/meeting',
  MEETING_DETAILS:
    '/client/panel-assessment/invitations/:invitationId/meeting-details',
  MEETING_UPDATE: '/client/panel-assessment/invitations/:invitationId/meeting',
  MEETING_CANCEL: '/client/panel-assessment/invitations/:invitationId/meeting',
  SCHEDULED_INTERVIEWS: '/client/panel-assessment/schedule-interviews',
  COMPLETE_PANEL_ASSESSMENT:
    '/client/panel-assessment/:panelAssessmentId/complete',
} as const;

interface IPanelAssessmentSlotFilters {
  panelAssessmentId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  hostEmail?: string;
  jobApplicationId?: string;
}

interface IPanelAssessmentInvitationFilters {
  candidateId?: string;
  status?: string;
  panelAssessmentId?: string;
  jobApplicationId?: string;
}

interface IPanelAssessmentFeedbackListFilters {
  panelAssessmentId?: string;
  panelMemberEmail?: string;
  isSubmitted?: boolean;
}

@singleton
export class ClientPanelAssessmentApiService extends ApiService {
  // Panel Assessment Slot Operations

  /**
   * Create one or more panel assessment slots
   */
  public async createPanelAssessmentSlots(
    data: IClientJobPanelAssessmentSlotCreate
  ): Promise<{ slots: IClientJobPanelAssessmentSlot[]; message: string }> {
    try {
      return await this.apiPost<{
        slots: IClientJobPanelAssessmentSlot[];
        message: string;
      }>(PANEL_ASSESSMENT_ENDPOINTS.SLOTS, data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get list of panel assessment slots
   */
  public async getPanelAssessmentSlots(
    params?: IPanelAssessmentSlotFilters & IPaginationRequest
  ): Promise<
    IPaginatedResponse<IClientJobPanelAssessmentSlotWithAvailability>
  > {
    try {
      return await this.apiGet<
        IPaginatedResponse<IClientJobPanelAssessmentSlotWithAvailability>
      >(
        `${PANEL_ASSESSMENT_ENDPOINTS.SLOTS}${
          params ? this.buildQueryString(params) : ''
        }`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a specific panel assessment slot
   */
  public async getPanelAssessmentSlot(
    slotId: string
  ): Promise<IClientJobPanelAssessmentSlotWithAvailability> {
    try {
      return await this.apiGet<IClientJobPanelAssessmentSlotWithAvailability>(
        PANEL_ASSESSMENT_ENDPOINTS.SLOT.replace(':slotId', slotId)
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update a panel assessment slot
   */
  public async updatePanelAssessmentSlot(
    slotId: string,
    data: IClientJobPanelAssessmentSlotUpdate
  ): Promise<IClientJobPanelAssessmentSlot> {
    try {
      return await this.apiPut<IClientJobPanelAssessmentSlot>(
        PANEL_ASSESSMENT_ENDPOINTS.SLOT.replace(':slotId', slotId),
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete a panel assessment slot
   */
  public async deletePanelAssessmentSlot(slotId: string): Promise<void> {
    try {
      await this.apiDelete<void>(
        PANEL_ASSESSMENT_ENDPOINTS.SLOT.replace(':slotId', slotId)
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Panel Assessment Invitation Operations

  /**
   * Create panel assessment invitation
   */
  public async createPanelAssessmentInvitation(
    data: IClientJobPanelAssessmentInvitationCreate
  ): Promise<IClientJobPanelAssessmentInvitation> {
    try {
      return await this.apiPost<IClientJobPanelAssessmentInvitation>(
        PANEL_ASSESSMENT_ENDPOINTS.INVITATIONS,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get list of panel assessment invitations
   */
  public async getPanelAssessmentInvitations(
    params?: IPanelAssessmentInvitationFilters & IPaginationRequest
  ): Promise<IPaginatedResponse<IClientJobPanelAssessmentInvitation>> {
    try {
      return await this.apiGet<
        IPaginatedResponse<IClientJobPanelAssessmentInvitation>
      >(
        `${PANEL_ASSESSMENT_ENDPOINTS.INVITATIONS}${
          params ? this.buildQueryString(params) : ''
        }`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a specific panel assessment invitation
   */
  public async getPanelAssessmentInvitation(
    invitationId: string
  ): Promise<IClientJobPanelAssessmentInvitation> {
    try {
      return await this.apiGet<IClientJobPanelAssessmentInvitation>(
        PANEL_ASSESSMENT_ENDPOINTS.INVITATION.replace(
          ':invitationId',
          invitationId
        )
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Cancel panel assessment invitation
   */
  public async cancelPanelAssessmentInvitation(
    invitationId: string
  ): Promise<IClientJobPanelAssessmentInvitation> {
    try {
      return await this.apiPost<IClientJobPanelAssessmentInvitation>(
        PANEL_ASSESSMENT_ENDPOINTS.INVITATION_CANCEL.replace(
          ':invitationId',
          invitationId
        )
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Public Panel Assessment Feedback Operations (for panel members)

  /**
   * Get panel assessment feedback information (public endpoint for panel members)
   */
  public async getPanelAssessmentFeedback(feedbackToken: string): Promise<{
    feedback: IClientJobPanelAssessmentFeedback;
    candidate: { name: string; email: string };
    jobPosting: { title: string; company: string };
    assessment: { scheduledDate?: Date };
  }> {
    try {
      return await this.apiGet<{
        feedback: IClientJobPanelAssessmentFeedback;
        candidate: { name: string; email: string };
        jobPosting: { title: string; company: string };
        assessment: { scheduledDate?: Date };
      }>(
        PANEL_ASSESSMENT_ENDPOINTS.PUBLIC_FEEDBACK.replace(
          ':feedbackToken',
          feedbackToken
        )
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Internal Panel Assessment Feedback Operations (for panel members)

  /**
   * Submit panel assessment feedback (internal endpoint for panel members)
   */
  public async submitPanelAssessmentFeedback(
    panelAssessmentId: string,
    data: IClientJobPanelAssessmentFeedbackSubmit
  ): Promise<IClientJobPanelAssessmentFeedback> {
    try {
      return await this.apiPost<IClientJobPanelAssessmentFeedback>(
        PANEL_ASSESSMENT_ENDPOINTS.INTERNAL_FEEDBACK.replace(
          ':panelAssessmentId',
          panelAssessmentId
        ),
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get list of panel assessment feedback (internal endpoint for panel members)
   */
  public async getPanelAssessmentFeedbackList(
    params?: IPanelAssessmentFeedbackListFilters & IPaginationRequest
  ): Promise<IPaginatedResponse<IClientJobPanelAssessmentFeedback>> {
    try {
      return await this.apiGet<
        IPaginatedResponse<IClientJobPanelAssessmentFeedback>
      >(
        `${PANEL_ASSESSMENT_ENDPOINTS.INTERNAL_FEEDBACK_LIST}${
          params ? this.buildQueryString(params) : ''
        }`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Teams Meeting Operations

  /**
   * Generate and send Teams meeting link for a panel assessment invitation
   */
  public async generateAndSendTeamsMeetingLink(
    invitationId: string,
    data: IGenerateMeetingLinkRequest
  ): Promise<{ meetingLink: string; message: string; eventId?: string }> {
    try {
      return await this.apiPost<{
        meetingLink: string;
        message: string;
        eventId?: string;
      }>(
        PANEL_ASSESSMENT_ENDPOINTS.MEETING.replace(
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
   * Update Teams meeting link for a panel assessment invitation
   */
  public async updateTeamsMeetingLink(
    invitationId: string,
    data: IGenerateMeetingLinkRequest
  ): Promise<{ meetingLink: string; message: string; eventId?: string }> {
    try {
      return await this.apiPut<{
        meetingLink: string;
        message: string;
        eventId?: string;
      }>(
        PANEL_ASSESSMENT_ENDPOINTS.MEETING_UPDATE.replace(
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
   * Cancel Teams meeting for a panel assessment invitation
   */
  public async cancelTeamsMeeting(
    invitationId: string
  ): Promise<{ message: string }> {
    try {
      return await this.apiDelete<{ message: string }>(
        PANEL_ASSESSMENT_ENDPOINTS.MEETING_CANCEL.replace(
          ':invitationId',
          invitationId
        )
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  //panel assessment interview operations

  /**
   * List scheduled interviews with pagination and search
   * @param pagination - Pagination parameters including search query
   * @returns Promise resolving to the paginated list of scheduled interviews
   * @throws Error if the API request fails
   */
  public async listScheduledInterviews(
    pagination?: IPaginationRequest
  ): Promise<IPaginatedResponse<IScheduledInterviewItem>> {
    try {
      const queryParams = this.buildQueryString(pagination || {});
      return await this.apiGet<IPaginatedResponse<IScheduledInterviewItem>>(
        `${PANEL_ASSESSMENT_ENDPOINTS.SCHEDULED_INTERVIEWS}${queryParams}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get panel assessment meeting details
   */
  public async getPanelAssessmentMeetingDetails(
    invitationId: string
  ): Promise<IScheduledPanelAssessmentMeetingDetails> {
    try {
      return await this.apiGet<IScheduledPanelAssessmentMeetingDetails>(
        PANEL_ASSESSMENT_ENDPOINTS.MEETING_DETAILS.replace(
          ':invitationId',
          invitationId
        )
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Complete a panel assessment
   */
  public async completePanelAssessment(
    panelAssessmentId: string
  ): Promise<IClientJobPanelAssessment> {
    try {
      return await this.apiPost<IClientJobPanelAssessment>(
        PANEL_ASSESSMENT_ENDPOINTS.COMPLETE_PANEL_ASSESSMENT.replace(
          ':panelAssessmentId',
          panelAssessmentId
        )
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
