import {
  JobPanelAssessmentInvitationStatusEnum,
  JobPanelAssessmentSlotStatusEnum,
} from '../../common/enums';

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidatePanelAssessmentInvitation:
 *       type: object
 *       description: Domain model representing a panel assessment invitation from candidate perspective
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the invitation
 *         panelAssessmentId:
 *           type: string
 *           format: uuid
 *           description: ID of the panel assessment
 *         status:
 *           $ref: '#/components/schemas/JobPanelAssessmentInvitationStatusEnum'
 *           description: Current status of the invitation
 *         message:
 *           type: string
 *           description: Custom message from the client
 *         selectedSlotId:
 *           type: string
 *           format: uuid
 *           description: ID of the selected slot (if accepted)
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: Invitation expiration date
 *         respondedAt:
 *           type: string
 *           format: date-time
 *           description: When the candidate responded
 *         acceptedAt:
 *           type: string
 *           format: date-time
 *           description: When the candidate accepted
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */
export interface ICandidatePanelAssessmentInvitation {
  id: string;
  panelAssessmentId: string;
  status: JobPanelAssessmentInvitationStatusEnum;
  message?: string;
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
 *     ICandidatePanelAssessmentSlot:
 *       type: object
 *       description: Domain model representing a panel assessment time slot from candidate perspective
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the slot
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
 *         status:
 *           $ref: '#/components/schemas/JobPanelAssessmentSlotStatusEnum'
 *           description: Current status of the slot
 *         isSelected:
 *           type: boolean
 *           description: Whether this slot is selected by the candidate
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */
export interface ICandidatePanelAssessmentSlot {
  id: string;
  panelAssessmentId: string;
  startDateTime: Date;
  endDateTime: Date;
  timeZone: string;
  status: JobPanelAssessmentSlotStatusEnum;
  isSelected: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidatePanelAssessmentInvitationResponse:
 *       type: object
 *       description: Candidate's response to panel assessment invitation
 *       properties:
 *         action:
 *           type: string
 *           enum: [accept, reject]
 *           description: Action taken by the candidate
 *         selectedSlotId:
 *           type: string
 *           format: uuid
 *           description: Selected slot ID (required when accepting)
 */
export interface ICandidatePanelAssessmentInvitationResponse {
  action: JobPanelAssessmentInvitationStatusEnum;
  selectedSlotId?: string;
}
