import {
  InterviewTypeEnum,
  JobPanelAssessmentSlotStatusEnum,
  JobPanelAssessmentStatusEnum,
} from '../../common/enums';
import {
  IClientJobPanelAssessmentSlot,
  IClientJobPanelAssessmentInvitation,
  IClientJobPanelAssessmentFeedback,
  IClientJobPanelAssessmentSlotWithAvailability,
  IClientJobPanelAssessmentSlotCreate,
  IClientJobPanelAssessmentSlotUpdate,
  IClientJobPanelAssessmentInvitationCreate,
  IClientJobPanelAssessmentFeedbackSubmit,
} from '../../domain/client/job.panel.assessment.domain';
import {
  IPaginatedResponse,
  IApiRequest,
  IApiResponse,
  IApiPaginatedRequest,
} from '../common/common.api';

// Panel Assessment Slot APIs
/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobPanelAssessmentSlotCreateApiRequest:
 *       type: object
 *       required:
 *         - data
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/IClientJobPanelAssessmentSlotCreate'
 */
export type IClientJobPanelAssessmentSlotCreateApiRequest =
  IApiRequest<IClientJobPanelAssessmentSlotCreate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobPanelAssessmentSlotCreateApiResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: object
 *           properties:
 *             slots:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/IClientJobPanelAssessmentSlot'
 *               description: Created panel assessment slots (one or more)
 *             message:
 *               type: string
 *               description: Success message indicating number of slots created
 */
export type IClientJobPanelAssessmentSlotCreateApiResponse = IApiResponse<{
  slots: IClientJobPanelAssessmentSlot[];
  message: string;
}>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobPanelAssessmentSlotUpdateApiRequest:
 *       type: object
 *       required:
 *         - data
 *         - params
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/IClientJobPanelAssessmentSlotUpdate'
 *         params:
 *           type: object
 *           required:
 *             - slotId
 *           properties:
 *             slotId:
 *               type: string
 *               format: uuid
 */
export type IClientJobPanelAssessmentSlotUpdateApiRequest =
  IApiRequest<IClientJobPanelAssessmentSlotUpdate> & {
    params: {
      slotId: string;
    };
  };

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobPanelAssessmentSlotUpdateApiResponse:
 *       type: object
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/IClientJobPanelAssessmentSlot'
 */
export type IClientJobPanelAssessmentSlotUpdateApiResponse =
  IApiResponse<IClientJobPanelAssessmentSlot>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobPanelAssessmentSlotGetApiRequest:
 *       type: object
 *       required:
 *         - params
 *       properties:
 *         params:
 *           type: object
 *           required:
 *             - slotId
 *           properties:
 *             slotId:
 *               type: string
 *               format: uuid
 */
export type IClientJobPanelAssessmentSlotGetApiRequest = IApiRequest<null> & {
  params: {
    slotId: string;
  };
};

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobPanelAssessmentSlotGetApiResponse:
 *       type: object
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/IClientJobPanelAssessmentSlotWithAvailability'
 */
export type IClientJobPanelAssessmentSlotGetApiResponse =
  IApiResponse<IClientJobPanelAssessmentSlotWithAvailability>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobPanelAssessmentSlotDeleteApiRequest:
 *       type: object
 *       required:
 *         - params
 *       properties:
 *         params:
 *           type: object
 *           required:
 *             - slotId
 *           properties:
 *             slotId:
 *               type: string
 *               format: uuid
 */
export type IClientJobPanelAssessmentSlotDeleteApiRequest =
  IApiRequest<null> & {
    params: {
      slotId: string;
    };
  };

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobPanelAssessmentSlotDeleteApiResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: null
 */
export type IClientJobPanelAssessmentSlotDeleteApiResponse = IApiResponse<null>;

interface IClientJobPanelAssessmentSlotListFilters {
  panelAssessmentId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  hostEmail?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobPanelAssessmentSlotListApiRequest:
 *       type: object
 *       properties:
 *         filters:
 *           type: object
 *           properties:
 *             panelAssessmentId:
 *               type: string
 *               format: uuid
 *             status:
 *               type: string
 *             startDate:
 *               type: string
 *               format: date
 *             endDate:
 *               type: string
 *               format: date
 *             hostEmail:
 *               type: string
 *         pagination:
 *           $ref: '#/components/schemas/IPaginationRequest'
 */
export type IClientJobPanelAssessmentSlotListApiRequest = IApiPaginatedRequest<
  void,
  IClientJobPanelAssessmentSlotListFilters,
  void
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobPanelAssessmentSlotListApiResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IClientJobPanelAssessmentSlotWithAvailability'
 *         pagination:
 *           $ref: '#/components/schemas/IPaginatedResponse'
 */
export type IClientJobPanelAssessmentSlotListApiResponse =
  IPaginatedResponse<IClientJobPanelAssessmentSlotWithAvailability>;

// Panel Assessment Invitation APIs
/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobPanelAssessmentInvitationCreateApiRequest:
 *       type: object
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/IClientJobPanelAssessmentInvitationCreate'
 */
export type IClientJobPanelAssessmentInvitationCreateApiRequest =
  IApiRequest<IClientJobPanelAssessmentInvitationCreate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobPanelAssessmentInvitationCreateApiResponse:
 *       type: object
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/IClientJobPanelAssessmentInvitation'
 */
export type IClientJobPanelAssessmentInvitationCreateApiResponse =
  IApiResponse<IClientJobPanelAssessmentInvitation>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobPanelAssessmentInvitationGetApiRequest:
 *       type: object
 *       properties:
 *         params:
 *           type: object
 *           properties:
 *             invitationId:
 *               type: string
 *               format: uuid
 */
export type IClientJobPanelAssessmentInvitationGetApiRequest = IApiRequest<
  void,
  void,
  { invitationId: string }
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobPanelAssessmentInvitationGetApiResponse:
 *       type: object
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/IClientJobPanelAssessmentInvitation'
 */
export type IClientJobPanelAssessmentInvitationGetApiResponse =
  IApiResponse<IClientJobPanelAssessmentInvitation>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobPanelAssessmentInvitationCancelApiRequest:
 *       type: object
 *       properties:
 *         params:
 *           type: object
 *           properties:
 *             invitationId:
 *               type: string
 *               format: uuid
 */
export type IClientJobPanelAssessmentInvitationCancelApiRequest = IApiRequest<
  void,
  void,
  { invitationId: string }
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobPanelAssessmentInvitationCancelApiResponse:
 *       type: object
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/IClientJobPanelAssessmentInvitation'
 */
export type IClientJobPanelAssessmentInvitationCancelApiResponse =
  IApiResponse<IClientJobPanelAssessmentInvitation>;

interface IClientJobPanelAssessmentInvitationListFilters {
  candidateId?: string;
  status?: string;
  panelAssessmentId?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobPanelAssessmentInvitationListApiRequest:
 *       type: object
 *       properties:
 *         filters:
 *           type: object
 *           properties:
 *             candidateId:
 *               type: string
 *               format: uuid
 *             status:
 *               type: string
 *             panelAssessmentId:
 *               type: string
 *               format: uuid
 *         pagination:
 *           $ref: '#/components/schemas/IPaginationRequest'
 */
export type IClientJobPanelAssessmentInvitationListApiRequest =
  IApiPaginatedRequest<
    void,
    IClientJobPanelAssessmentInvitationListFilters,
    void
  >;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobPanelAssessmentInvitationListApiResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IClientJobPanelAssessmentInvitation'
 *         pagination:
 *           $ref: '#/components/schemas/IPaginatedResponse'
 */
export type IClientJobPanelAssessmentInvitationListApiResponse =
  IPaginatedResponse<IClientJobPanelAssessmentInvitation>;

// Panel Assessment APIs

// Public Feedback Submission APIs (for panel members)
/**
 * @openapi
 * components:
 *   schemas:
 *     IPublicJobPanelAssessmentFeedbackGetApiRequest:
 *       type: object
 *       properties:
 *         params:
 *           type: object
 *           properties:
 *             feedbackToken:
 *               type: string
 *               description: Unique token for accessing feedback form
 */
export type IPublicJobPanelAssessmentFeedbackGetApiRequest = IApiRequest<
  void,
  void,
  { feedbackToken: string }
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPublicJobPanelAssessmentFeedbackGetApiResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: object
 *           properties:
 *             feedback:
 *               $ref: '#/components/schemas/IClientJobPanelAssessmentFeedback'
 *             candidate:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *             jobPosting:
 *               type: object
 *               properties:
 *                 title:
 *                   type: string
 *                 company:
 *                   type: string
 *             assessment:
 *               type: object
 *               properties:
 *                 scheduledDate:
 *                   type: string
 *                   format: date-time
 */
export type IPublicJobPanelAssessmentFeedbackGetApiResponse = IApiResponse<{
  feedback: IClientJobPanelAssessmentFeedback;
  candidate: {
    name: string;
    email: string;
  };
  jobPosting: {
    title: string;
    company: string;
  };
  assessment: {
    scheduledDate?: Date;
  };
}>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPublicJobPanelAssessmentFeedbackSubmitApiRequest:
 *       type: object
 *       properties:
 *         params:
 *           type: object
 *           properties:
 *             feedbackToken:
 *               type: string
 *               description: Unique token for accessing feedback form
 *         data:
 *           $ref: '#/components/schemas/IClientJobPanelAssessmentFeedbackSubmit'
 */
export type IPublicJobPanelAssessmentFeedbackSubmitApiRequest = IApiRequest<
  IClientJobPanelAssessmentFeedbackSubmit,
  void,
  { feedbackToken: string }
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPublicJobPanelAssessmentFeedbackSubmitApiResponse:
 *       type: object
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/IClientJobPanelAssessmentFeedback'
 */
export type IPublicJobPanelAssessmentFeedbackSubmitApiResponse =
  IApiResponse<IClientJobPanelAssessmentFeedback>;

// Single Slot Update APIs

// Internal Feedback Submission APIs (for authenticated users)
/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobPanelAssessmentFeedbackSubmitInternalApiRequest:
 *       type: object
 *       required:
 *         - detailedFeedback
 *         - decision
 *         - recommendation
 *         - panelMemberEmail
 *       properties:
 *         detailedFeedback:
 *           type: string
 *           description: Detailed feedback from panel member
 *           example: "The candidate showed excellent problem-solving abilities."
 *         decision:
 *           $ref: '#/components/schemas/JobPanelAssessmentFeedbackDecisionEnum'
 *           description: Panel member's decision
 *           example: "HIRE"
 *         recommendation:
 *           $ref: '#/components/schemas/JobPanelAssessmentRecommendationEnum'
 *           description: Panel member's recommendation
 *           example: "RECOMMENDED"
 *         panelMemberEmail:
 *           type: string
 *           format: email
 *           description: Email of the panel member submitting feedback
 *           example: "ajayforcomputerscience@gmail.com"
 */
export type IClientJobPanelAssessmentFeedbackSubmitInternalApiRequest =
  IApiRequest<IClientJobPanelAssessmentFeedbackSubmit>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobPanelAssessmentFeedbackSubmitInternalApiResponse:
 *       type: object
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/IClientJobPanelAssessmentFeedback'
 */
export type IClientJobPanelAssessmentFeedbackSubmitInternalApiResponse =
  IApiResponse<IClientJobPanelAssessmentFeedback>;

interface IClientJobPanelAssessmentFeedbackListFilters {
  panelAssessmentId?: string;
  panelMemberEmail?: string;
  isSubmitted?: boolean;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobPanelAssessmentFeedbackListApiRequest:
 *       type: object
 *       properties:
 *         filters:
 *           type: object
 *           properties:
 *             panelAssessmentId:
 *               type: string
 *               format: uuid
 *               description: Filter by panel assessment ID
 *             panelMemberEmail:
 *               type: string
 *               format: email
 *               description: Filter by panel member email
 *             isSubmitted:
 *               type: boolean
 *               description: Filter by submission status
 *         pagination:
 *           $ref: '#/components/schemas/IPaginationRequest'
 */
export type IClientJobPanelAssessmentFeedbackListApiRequest =
  IApiPaginatedRequest<
    void,
    IClientJobPanelAssessmentFeedbackListFilters,
    void
  >;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobPanelAssessmentFeedbackListApiResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IClientJobPanelAssessmentFeedback'
 *         pagination:
 *           $ref: '#/components/schemas/IPaginatedResponse'
 */
export type IClientJobPanelAssessmentFeedbackListApiResponse =
  IPaginatedResponse<IClientJobPanelAssessmentFeedback>;

// Simplified Scheduled Interview Item Interface
/**
 * @openapi
 * components:
 *   schemas:
 *     IScheduledInterviewItem:
 *       type: object
 *       description: Simplified scheduled interview information with slot and panel details
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the invitation
 *         candidateName:
 *           type: string
 *           description: Name of the candidate
 *         candidateEmail:
 *           type: string
 *           format: email
 *           description: Email of the candidate
 *         companyName:
 *           type: string
 *           description: Name of the company
 *         panelAssessmentId:
 *           type: string
 *           format: uuid
 *           description: ID of the panel assessment
 *         meetingStatus:
 *           type: JobPanelAssessmentStatusEnum
 *           enum: [MEETING_SCHEDULED, MEETING_CANCELLED, MEETING_COMPLETED]
 *         jobTitle:
 *           type: string
 *           description: Title of the job posting
 *         selectedSlotDateTime:
 *           type: string
 *           format: date-time
 *           description: Date and time of the selected interview slot
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the interview invitation was created
 *         slotId:
 *           type: string
 *           format: uuid
 *           description: ID of the selected time slot
 *         slotStatus:
 *           type: string
 *           enum: [AVAILABLE, SELECTED, OCCUPIED, CANCELLED]
 *           description: Status of the selected time slot
 *         panelMemberNames:
 *           type: array
 *           items:
 *             type: string
 *           description: Names of panel members for the interview
 *         invitationUrl:
 *           type: string
 *           description: URL of the invitation
 */
export interface IScheduledInterviewItem {
  id: string;
  candidateName: string;
  candidateEmail: string;
  companyName?: string;
  jobPostingId?: string;
  jobApplicationId?: string;
  panelAssessmentId?: string;
  meetingStatus?: JobPanelAssessmentStatusEnum;
  assessmentStatus?: string | null;
  assessmentId?: string | null;
  jobTitle: string;
  selectedSlotDateTime: Date;
  createdAt: Date;
  slotId: string;
  slotStatus: JobPanelAssessmentSlotStatusEnum;
  panelMemberNames: string[];
  invitationUrl?: string;
  type?: InterviewTypeEnum;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IScheduledPanelAssessmentMeetingDetails:
 *       type: object
 *       description: Detailed information about a scheduled panel assessment meeting
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the invitation
 *         candidateName:
 *           type: string
 *           description: Name of the candidate
 *         candidateEmail:
 *           type: string
 *           format: email
 *           description: Email of the candidate
 *         panelAssessmentId:
 *           type: string
 *           format: uuid
 *           description: ID of the panel assessment
 *         meetingStatus:
 *           type: string
 *           description: Status of the meeting/panel assessment
 *         jobTitle:
 *           type: string
 *           description: Title of the job posting
 *         selectedSlotDateTime:
 *           type: string
 *           format: date-time
 *           description: Date and time of the selected interview slot
 *         eventLink:
 *           type: string
 *           description: Link to the virtual meeting
 *         panelMemberNames:
 *           type: array
 *           items:
 *             type: string
 *           description: Names of panel members for the interview
 *         panelMemberEmails:
 *           type: array
 *           items:
 *             type: string
 *           description: Email addresses of panel members
 */
export interface IScheduledPanelAssessmentMeetingDetails {
  id: string;
  candidateName: string;
  candidateEmail: string;
  panelAssessmentId: string;
  meetingStatus: string;
  jobTitle: string;
  selectedSlotDateTime?: Date;
  eventLink?: string;
  panelMemberNames: string[];
  panelMemberEmails: string[];
}

export type IScheduledPanelAssessmentMeetingDetailsApiResponse =
  IApiResponse<IScheduledPanelAssessmentMeetingDetails>;

// Main API Response Interface
/**
 * @openapi
 * components:
 *   schemas:
 *     IClientListSceduledInterviewsApiResponse:
 *       type: object
 *       description: Response for listing scheduled interviews with simplified data
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IScheduledInterviewItem'
 *           description: List of scheduled interviews with basic information
 */
export type IClientListSceduledInterviewsApiResponse = IApiResponse<
  IScheduledInterviewItem[]
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientListScheduledInterviewsApiRequest:
 *       type: object
 *       properties:
 *         search:
 *           type: string
 *           description: Search query for filtering scheduled interviews
 *         pagination:
 *           $ref: '#/components/schemas/IPaginationRequest'
 */
export type IClientListScheduledInterviewsApiRequest = IApiPaginatedRequest<
  void,
  { search?: string },
  void
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientListScheduledInterviewsApiResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IScheduledInterviewItem'
 *         pagination:
 *           $ref: '#/components/schemas/IPaginatedResponse'
 */
export type IClientListScheduledInterviewsApiResponse =
  IPaginatedResponse<IScheduledInterviewItem>;
