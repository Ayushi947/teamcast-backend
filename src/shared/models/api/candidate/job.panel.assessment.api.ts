import {
  ICandidatePanelAssessmentInvitation,
  ICandidatePanelAssessmentSlot,
  ICandidatePanelAssessmentInvitationResponse,
} from '../../domain/candidate/job.panel.assessment.domain';
import { IScheduledInterviewItem } from '../client/job.panel.assessment.api';
import {
  IApiResponse,
  IApiRequest,
  IApiPaginatedRequest,
  IPaginatedResponse,
} from '../common/common.api';
import { JobPanelAssessmentStatusEnum } from '../../common/enums';

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidatePanelAssessmentInvitationResponseApiRequest:
 *       type: object
 *       description: Request to respond to a panel assessment invitation
 *       properties:
 *         data:
 *           type: object
 *           properties:
 *             action:
 *               type: string
 *               enum: [accept, reject]
 *               description: Action taken by the candidate
 *             selectedSlotId:
 *               type: string
 *               format: uuid
 *               description: Selected slot ID (required when accepting)
 *         params:
 *           type: object
 *           properties:
 *             invitationId:
 *               type: string
 *               format: uuid
 *               description: Invitation ID
 *       example:
 *         data:
 *           action: "accept"
 *           selectedSlotId: "550e8400-e29b-41d4-a716-446655440000"
 *         params:
 *           invitationId: "123e4567-e89b-12d3-a456-426614174000"
 */
export type ICandidatePanelAssessmentInvitationResponseApiRequest = IApiRequest<
  ICandidatePanelAssessmentInvitationResponse,
  any,
  { invitationId: string }
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidatePanelAssessmentInvitationResponseApiResponse:
 *       type: object
 *       description: Response from panel assessment invitation action
 *       properties:
 *         data:
 *           type: object
 *           properties:
 *             invitation:
 *               $ref: '#/components/schemas/ICandidatePanelAssessmentInvitation'
 *             message:
 *               type: string
 *               description: Success message
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 */
export type ICandidatePanelAssessmentInvitationResponseApiResponse =
  IApiResponse<{
    invitation: ICandidatePanelAssessmentInvitation;
    message: string;
  }>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidatePanelAssessmentInvitationGetApiRequest:
 *       type: object
 *       description: Request parameters for getting panel assessment invitation
 *       properties:
 *         params:
 *           type: object
 *           properties:
 *             invitationId:
 *               type: string
 *               format: uuid
 *               description: Invitation ID
 */
export type ICandidatePanelAssessmentInvitationGetApiRequest = IApiRequest<
  any,
  any,
  { invitationId: string }
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidatePanelAssessmentInvitationGetApiResponse:
 *       type: object
 *       description: Panel assessment invitation response
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/ICandidatePanelAssessmentInvitation'
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 */
export type ICandidatePanelAssessmentInvitationGetApiResponse =
  IApiResponse<ICandidatePanelAssessmentInvitation>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidatePanelAssessmentSlotsGetApiRequest:
 *       type: object
 *       description: Request parameters for getting panel assessment slots
 *       properties:
 *         params:
 *           type: object
 *           properties:
 *             panelAssessmentId:
 *               type: string
 *               format: uuid
 *               description: Panel assessment ID
 */
export type ICandidatePanelAssessmentSlotsGetApiRequest = IApiRequest<
  any,
  any,
  { panelAssessmentId: string }
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidatePanelAssessmentSlotsGetApiResponse:
 *       type: object
 *       description: Panel assessment slots response
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ICandidatePanelAssessmentSlot'
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 */
export type ICandidatePanelAssessmentSlotsGetApiResponse = IApiResponse<
  ICandidatePanelAssessmentSlot[]
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateListScheduledInterviewsApiResponse:
 *       type: object
 *       description: Response for listing scheduled interviews
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IScheduledInterviewItem'
 *           description: List of scheduled interviews with basic information
 */
/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidatePanelAssessmentFilterQuery:
 *       type: object
 *       properties:
 *         status:
 *           type: array
 *           items:
 *             type: string
 *             enum: [MEETING_SCHEDULED, COMPLETED, CANCELLED, INVITATION_SENT, SLOT_SELECTED, IN_PROGRESS]
 *           description: Filter by panel assessment status
 *         type:
 *           type: array
 *           items:
 *             type: string
 *             enum: [PANEL_ASSESSMENT, AI_INTERVIEW]
 *           description: Filter by interview type
 *         search:
 *           type: string
 *           description: Search term for job position or company name
 */
export interface ICandidatePanelAssessmentFilterQuery {
  status?: JobPanelAssessmentStatusEnum[];
  type?: string[];
  search?: string;
}

export type ICandidateListScheduledInterviewsRequest = IApiPaginatedRequest<
  void,
  ICandidatePanelAssessmentFilterQuery
>;

export type ICandidateListScheduledInterviewsApiResponse = IApiResponse<
  IPaginatedResponse<IScheduledInterviewItem>
>;
