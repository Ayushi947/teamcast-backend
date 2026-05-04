import {
  IClientSupportTicketCreate,
  IClientSupportTicketListRequest,
} from '../../domain/support-ticket/client-support-ticket.domain';
import { ISupportTicket } from '../../domain/support-ticket/support-ticket.domain';
import {
  IApiPaginatedRequest,
  IApiPaginatedResponse,
  IApiRequest,
  IApiResponse,
} from '../common/common.api';

export type IClientSupportTicketCreateApiRequest =
  IApiRequest<IClientSupportTicketCreate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientSupportTicketCreateApiResponse:
 *       type: object
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/ISupportTicket'
 *         message:
 *           type: string
 *           example: "Support ticket created successfully"
 */
export type IClientSupportTicketCreateApiResponse =
  IApiResponse<ISupportTicket>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientSupportTicketListApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiPaginatedRequest'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientSupportTicketListRequest'
 */
export type IClientSupportTicketListApiRequest =
  IApiPaginatedRequest<IClientSupportTicketListRequest>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientSupportTicketListApiResponse:
 *       type: object
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/IPaginatedResponse'
 *         message:
 *           type: string
 *           example: "Support ticket list retrieved successfully"
 */
export type IClientSupportTicketListApiResponse =
  IApiPaginatedResponse<ISupportTicket>;
