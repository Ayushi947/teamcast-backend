import {
  ICandidateSupportTicketCreate,
  ICandidateSupportTicketListRequest,
} from '../../domain/support-ticket/candidate-support-ticket.domain';
import { ISupportTicket } from '../../domain/support-ticket/support-ticket.domain';
import {
  IApiPaginatedRequest,
  IApiPaginatedResponse,
  IApiRequest,
  IApiResponse,
} from '../common/common.api';

export type ICandidateSupportTicketCreateApiRequest =
  IApiRequest<ICandidateSupportTicketCreate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateSupportTicketCreateApiResponse:
 *       type: object
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/ISupportTicket'
 *         message:
 *           type: string
 *           example: "Support ticket created successfully"
 */
export type ICandidateSupportTicketCreateApiResponse =
  IApiResponse<ISupportTicket>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateSupportTicketListApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiPaginatedRequest'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ICandidateSupportTicketListRequest'
 */
export type ICandidateSupportTicketListApiRequest =
  IApiPaginatedRequest<ICandidateSupportTicketListRequest>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateSupportTicketListApiResponse:
 *       type: object
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/IPaginatedResponse'
 *         message:
 *           type: string
 *           example: "Support ticket list retrieved successfully"
 */
export type ICandidateSupportTicketListApiResponse =
  IApiPaginatedResponse<ISupportTicket>;
