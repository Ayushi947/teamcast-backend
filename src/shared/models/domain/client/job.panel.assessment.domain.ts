import {
  JobPanelAssessmentStatusEnum,
  JobPanelAssessmentResultEnum,
  JobPanelAssessmentRecommendationEnum,
  JobPanelAssessmentInvitationStatusEnum,
  JobPanelAssessmentSlotStatusEnum,
  JobPanelAssessmentFeedbackDecisionEnum,
} from '../../common/enums';

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobPanelAssessment:
 *       type: object
 *       description: Domain model representing a client panel assessment
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the panel assessment
 *         candidateId:
 *           type: string
 *           format: uuid
 *           description: ID of the candidate
 *         jobApplicationId:
 *           type: string
 *           format: uuid
 *           description: ID of the job application
 *         status:
 *           $ref: '#/components/schemas/JobPanelAssessmentStatusEnum'
 *           description: Current status of the panel assessment
 *         result:
 *           $ref: '#/components/schemas/JobPanelAssessmentResultEnum'
 *           description: Result of the panel assessment
 *         recommendation:
 *           $ref: '#/components/schemas/JobPanelAssessmentRecommendationEnum'
 *           description: Overall recommendation
 *         scheduledDate:
 *           type: string
 *           format: date-time
 *           description: Scheduled interview date and time
 *         startedAt:
 *           type: string
 *           format: date-time
 *           description: Interview start time
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: Interview completion time
 *         duration:
 *           type: integer
 *           description: Interview duration in minutes
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */
export interface IClientJobPanelAssessment {
  id: string;
  candidateId: string;
  jobApplicationId: string;
  status: JobPanelAssessmentStatusEnum;
  result: JobPanelAssessmentResultEnum;
  recommendation?: JobPanelAssessmentRecommendationEnum;
  scheduledDate?: Date;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  createdAt: Date;
  updatedAt: Date;
  slots?: IClientJobPanelAssessmentSlot[];
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobPanelAssessmentSlot:
 *       type: object
 *       description: Domain model representing a panel assessment time slot
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the slot
 *         clientId:
 *           type: string
 *           format: uuid
 *           description: ID of the client
 *         panelAssessmentId:
 *           type: string
 *           format: uuid
 *           description: ID of the panel assessment
 *         isSelected:
 *           type: boolean
 *           description: Whether this slot is selected by the candidate
 *         createdById:
 *           type: string
 *           format: uuid
 *           description: ID of the user who created the slot
 *         startDateTime:
 *           type: string
 *           format: date-time
 *           description: Slot start date and time
 *         endDateTime:
 *           type: string
 *           format: date-time
 *           description: Slot end date and time
 *         timeZone:
 *           type: string
 *           description: Time zone for the slot
 *         status:
 *           $ref: '#/components/schemas/JobPanelAssessmentSlotStatusEnum'
 *           description: Current status of the slot
 *         panelMemberEmails:
 *           type: array
 *           items:
 *             type: string
 *           description: Email addresses of panel members
 *         panelMemberNames:
 *           type: array
 *           items:
 *             type: string
 *           description: Names of panel members
 *         hostEmail:
 *           type: string
 *           description: Host email address
 *         hostName:
 *           type: string
 *           description: Host name
 */
export interface IClientJobPanelAssessmentSlot {
  id: string;
  clientId: string;
  panelAssessmentId: string;
  createdById: string;
  startDateTime: Date;
  endDateTime: Date;
  timeZone: string;
  status: JobPanelAssessmentSlotStatusEnum;
  isSelected: boolean;
  panelMemberEmails: string[];
  panelMemberNames: string[];
  hostEmail: string;
  hostName: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobPanelAssessmentInvitation:
 *       type: object
 *       description: Domain model representing a panel assessment invitation
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the invitation
 *         clientId:
 *           type: string
 *           format: uuid
 *           description: ID of the client
 *         candidateId:
 *           type: string
 *           format: uuid
 *           description: ID of the candidate
 *         panelAssessmentId:
 *           type: string
 *           format: uuid
 *           description: ID of the panel assessment
 *         invitedById:
 *           type: string
 *           format: uuid
 *           description: ID of the user who sent the invitation
 *         status:
 *           $ref: '#/components/schemas/JobPanelAssessmentInvitationStatusEnum'
 *           description: Current status of the invitation
 *         message:
 *           type: string
 *           description: Custom message to the candidate
 *         panelMemberEmails:
 *           type: array
 *           items:
 *             type: string
 *           description: Email addresses of panel members
 *         panelMemberNames:
 *           type: array
 *           items:
 *             type: string
 *           description: Names of panel members
 *         useTeams:
 *           type: boolean
 *           description: Whether to use Microsoft Teams or external platform
 *         eventId:
 *           type: string
 *           description: Teams/Calendar event ID or external platform event ID
 *         eventLink:
 *           type: string
 *           description: Teams meeting link or external platform meeting link
 *         selectedSlotId:
 *           type: string
 *           description: Selected slot ID when accepted
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: Invitation expiration date
 *         respondedAt:
 *           type: string
 *           format: date-time
 *           description: When candidate responded
 */
export interface IClientJobPanelAssessmentInvitation {
  id: string;
  clientId: string;
  candidateId: string;
  panelAssessmentId: string;
  invitedById: string;
  status: JobPanelAssessmentInvitationStatusEnum;
  message?: string;
  panelMemberEmails: string[];
  panelMemberNames: string[];
  useTeams: boolean;
  eventId?: string;
  eventLink?: string;
  selectedSlotId?: string;
  expiresAt: Date;
  respondedAt?: Date;
  acceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobPanelAssessmentFeedback:
 *       type: object
 *       description: Domain model representing panel member feedback
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the feedback
 *         panelAssessmentId:
 *           type: string
 *           format: uuid
 *           description: ID of the panel assessment
 *         panelMemberEmail:
 *           type: string
 *           description: Email of the panel member
 *         panelMemberName:
 *           type: string
 *           description: Name of the panel member
 *         detailedFeedback:
 *           type: string
 *           description: Detailed feedback from panel member
 *         decision:
 *           $ref: '#/components/schemas/JobPanelAssessmentFeedbackDecisionEnum'
 *           description: Panel member's decision
 *         recommendation:
 *           $ref: '#/components/schemas/JobPanelAssessmentRecommendationEnum'
 *           description: Panel member's recommendation
 *         isSubmitted:
 *           type: boolean
 *           description: Whether feedback has been submitted
 *         submittedAt:
 *           type: string
 *           format: date-time
 *           description: Feedback submission timestamp
 *         feedbackToken:
 *           type: string
 *           description: Unique token for feedback submission
 *         feedbackLink:
 *           type: string
 *           description: Direct link for feedback submission
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */
export interface IClientJobPanelAssessmentFeedback {
  id: string;
  panelAssessmentId: string;
  panelMemberEmail: string;
  panelMemberName: string;
  detailedFeedback: string;
  decision: JobPanelAssessmentFeedbackDecisionEnum;
  recommendation: JobPanelAssessmentRecommendationEnum;
  isSubmitted: boolean;
  submittedAt?: Date;
  feedbackToken?: string;
  feedbackLink?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobPanelAssessmentSlotCreate:
 *       type: object
 *       description: Domain model representing a panel assessment time slot
 *       properties:
 *         panelAssessmentId:
 *           type: string
 *           format: uuid
 *           description: ID of the panel assessment
 *         startDateTime:
 *           type: string
 *           format: date-time
 *           description: Slot start date and time
 *         endDateTime:
 *           type: string
 *           format: date-time
 *           description: Slot end date and time
 *         timeZone:
 *           type: string
 *           description: Time zone for the slot
 *         panelMemberEmails:
 *           type: array
 *           items:
 *             type: string
 *           description: Email addresses of panel members
 *         panelMemberNames:
 *           type: array
 *           items:
 *             type: string
 *           description: Names of panel members
 *         hostEmail:
 *           type: string
 *           description: Host email address
 *         hostName:
 *           type: string
 *           description: Host name
 */
// Create/Update interfaces for panel assessment slots
export interface IClientJobPanelAssessmentSlotCreate {
  jobApplicationId: string;
  // Support both single slot and multiple slots in one interface
  slots: {
    startDateTime: Date;
    endDateTime: Date;
    timeZone: string;
    panelMemberEmails: string[];
    panelMemberNames: string[];
    hostEmail: string;
    hostName: string;
  }[];
}

export interface IClientJobPanelAssessmentSlotUpdate {
  startDateTime?: Date;
  endDateTime?: Date;
  timeZone?: string;
  panelMemberEmails?: string[];
  panelMemberNames?: string[];
  hostEmail?: string;
  hostName?: string;
  status?: JobPanelAssessmentSlotStatusEnum;
  isSelected?: boolean;
}

// Create interfaces for panel assessment invitations
export interface IClientJobPanelAssessmentInvitationCreate {
  candidateId: string;
  jobApplicationId: string;
  message?: string;
  panelMemberEmails?: string[]; // Optional - will use slot data if not provided
  panelMemberNames?: string[]; // Optional - will use slot data if not provided
  useTeams?: boolean; // Optional - defaults to true for Teams integration
  expirationDays?: number; // Days until invitation expires
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobPanelAssessmentInvitationAccept:
 *       type: object
 *       required:
 *         - selectedSlotId
 *       properties:
 *         selectedSlotId:
 *           type: string
 *           format: uuid
 *           description: ID of the selected time slot
 */
export interface IClientJobPanelAssessmentInvitationAccept {
  selectedSlotId: string;
}

// Feedback create/update interfaces
/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobPanelAssessmentFeedbackSubmit:
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
export interface IClientJobPanelAssessmentFeedbackSubmit {
  detailedFeedback: string;
  decision: JobPanelAssessmentFeedbackDecisionEnum;
  recommendation: JobPanelAssessmentRecommendationEnum;
  panelMemberEmail: string;
}

// Panel assessment with related data
export interface IClientJobPanelAssessmentDetails
  extends IClientJobPanelAssessment {
  invitation?: IClientJobPanelAssessmentInvitation;
  feedback: IClientJobPanelAssessmentFeedback[];
  candidate?: {
    id: string;
    name: string;
    email: string;
  };
  jobApplication?: {
    id: string;
    jobPosting: {
      id: string;
      title: string;
    };
  };
}

// Slot with availability information
export interface IClientJobPanelAssessmentSlotWithAvailability
  extends IClientJobPanelAssessmentSlot {
  panelAssessment?: {
    id: string;
    candidate: {
      id: string;
      name: string;
      email: string;
    };
  };
}
