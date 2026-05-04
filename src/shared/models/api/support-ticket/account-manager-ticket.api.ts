import {
  IApiRequest,
  IApiResponse,
  IPaginatedResponse,
} from '../common/common.api';
import {
  ISupportTicket,
  ISupportTicketListItemResponse,
} from '../../domain/support-ticket/support-ticket.domain';
import { ISupportTicketComment } from '../../domain/support-ticket/support-ticket.domain';
import { IAccountManagerTicketStatistics } from '../../domain/support-ticket/account-manager-ticket.domain';

/**
 * @openapi
 * components:
 *   schemas:
 *     AccountManagerTicketListApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               allOf:
 *                 - $ref: '#/components/schemas/IPaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ISupportTicketListItemResponse'
 */
export type IAccountManagerTicketListApiResponse =
  IPaginatedResponse<ISupportTicketListItemResponse>;

/**
 * @openapi
 * components:
 *   schemas:
 *     AccountManagerTicketAssignmentRequest:
 *       type: object
 *       description: Request to assign or reassign a ticket to a support user
 *       properties:
 *         ticketId:
 *           type: string
 *           format: uuid
 *           description: ID of the ticket to assign
 *         assignedUserId:
 *           type: string
 *           format: uuid
 *           description: ID of the support user to assign the ticket to
 *         internalNote:
 *           type: string
 *           description: Optional internal note about the assignment
 *       required:
 *         - ticketId
 *         - assignedUserId
 *       example:
 *         ticketId: "123e4567-e89b-12d3-a456-426614174000"
 *         assignedUserId: "123e4567-e89b-12d3-a456-426614174001"
 *         internalNote: "Reassigned due to workload distribution"
 */
export interface IAccountManagerTicketAssignmentRequest {
  ticketId: string;
  assignedUserId: string;
  internalNote?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     AccountManagerTicketAssignmentApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/AccountManagerTicketAssignmentRequest'
 */
export type IAccountManagerTicketAssignmentApiRequest =
  IApiRequest<IAccountManagerTicketAssignmentRequest>;

/**
 * @openapi
 * components:
 *   schemas:
 *     AccountManagerTicketAssignmentApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISupportTicket'
 */
export type IAccountManagerTicketAssignmentApiResponse =
  IApiResponse<ISupportTicket>;

/**
 * @openapi
 * components:
 *   schemas:
 *     AccountManagerTicketPriorityChangeRequest:
 *       type: object
 *       description: Request to change ticket priority with internal note
 *       properties:
 *         ticketId:
 *           type: string
 *           format: uuid
 *           description: ID of the ticket to change priority for
 *         priority:
 *           $ref: '#/components/schemas/SupportTicketPriorityEnum'
 *         internalNote:
 *           type: string
 *           description: Required internal note explaining the priority change
 *       required:
 *         - ticketId
 *         - priority
 *       example:
 *         ticketId: "123e4567-e89b-12d3-a456-426614174000"
 *         priority: "HIGH"
 *         internalNote: "Client reported critical issue affecting production"
 */
export interface IAccountManagerTicketPriorityChangeRequest {
  ticketId: string;
  priority: string;
  internalNote?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     AccountManagerTicketPriorityChangeApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/AccountManagerTicketPriorityChangeRequest'
 */
export type IAccountManagerTicketPriorityChangeApiRequest =
  IApiRequest<IAccountManagerTicketPriorityChangeRequest>;

/**
 * @openapi
 * components:
 *   schemas:
 *     AccountManagerTicketPriorityChangeApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISupportTicket'
 */
export type IAccountManagerTicketPriorityChangeApiResponse =
  IApiResponse<ISupportTicket>;

/**
 * @openapi
 * components:
 *   schemas:
 *     AccountManagerTicketStatusChangeRequest:
 *       type: object
 *       description: Request to change ticket status with internal note
 *       properties:
 *         ticketId:
 *           type: string
 *           format: uuid
 *           description: ID of the ticket to change status for
 *         status:
 *           $ref: '#/components/schemas/SupportTicketStatusEnum'
 *         internalNote:
 *           type: string
 *           description: Required internal note explaining the status change
 *       required:
 *         - ticketId
 *         - status
 *         - internalNote
 *       example:
 *         ticketId: "123e4567-e89b-12d3-a456-426614174000"
 *         status: "RESOLVED"
 *         internalNote: "Issue has been resolved and tested with client"
 */
export interface IAccountManagerTicketStatusChangeRequest {
  ticketId: string;
  status: string;
  internalNote?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     AccountManagerTicketStatusChangeApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/AccountManagerTicketStatusChangeRequest'
 */
export type IAccountManagerTicketStatusChangeApiRequest =
  IApiRequest<IAccountManagerTicketStatusChangeRequest>;

/**
 * @openapi
 * components:
 *   schemas:
 *     AccountManagerTicketStatusChangeApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISupportTicket'
 */
export type IAccountManagerTicketStatusChangeApiResponse =
  IApiResponse<ISupportTicket>;

/**
 * @openapi
 * components:
 *   schemas:
 *     AccountManagerTicketCommentRequest:
 *       type: object
 *       description: Request to add a comment to a ticket
 *       properties:
 *         ticketId:
 *           type: string
 *           format: uuid
 *           description: ID of the ticket to add comment to
 *         content:
 *           type: string
 *           description: Content of the comment
 *         isInternal:
 *           type: boolean
 *           description: Whether the comment is internal (not visible to customer)
 *       required:
 *         - ticketId
 *         - content
 *         - isInternal
 *       example:
 *         ticketId: "123e4567-e89b-12d3-a456-426614174000"
 *         content: "Following up with the client on this issue"
 *         isInternal: true
 */
export interface IAccountManagerTicketCommentRequest {
  ticketId: string;
  content: string;
  isInternal: boolean;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     AccountManagerTicketCommentApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/AccountManagerTicketCommentRequest'
 */
export type IAccountManagerTicketCommentApiRequest =
  IApiRequest<IAccountManagerTicketCommentRequest>;

/**
 * @openapi
 * components:
 *   schemas:
 *     AccountManagerTicketCommentApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISupportTicketComment'
 */
export type IAccountManagerTicketCommentApiResponse =
  IApiResponse<ISupportTicketComment>;

/**
 * @openapi
 * components:
 *   schemas:
 *     AccountManagerTicketStatisticsApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IAccountManagerTicketStatistics'
 */
export type IAccountManagerTicketStatisticsApiResponse =
  IApiResponse<IAccountManagerTicketStatistics>;
