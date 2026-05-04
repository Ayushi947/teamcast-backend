import { SupportTicketStatusEnum } from '../../common/enums';
import {
  IApiRequest,
  IApiResponse,
  IApiPaginatedRequest,
  IPaginatedResponse,
} from '../common/common.api';
import {
  ISupportTicketCreateData,
  ISupportTicketUpdateData,
  ISupportTicketApiResponse,
  ISupportTicketListItemResponse,
  ISupportTicketFilter,
  ISupportTicketPriorityChange,
  ISupportTicketCommentCreateRequest,
  ISupportTicketRcaRequest,
  ISupportTicketRcaResponse,
  ISupportTicketResolutionRequest,
  ISupportTicketResolutionResponse,
} from '../../domain/support-ticket/support-ticket.domain';
import {
  ISupportTicketStatistics,
  ISupportTicketStatisticsFilter,
} from '../../domain/support-ticket/support-ticket-statistics.domain';

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketListApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiPaginatedRequest'
 *         - type: object
 *           properties:
 *             filters:
 *               $ref: '#/components/schemas/ISupportTicketFilter'
 *               description: Filter criteria for support tickets
 */
export type ISupportTicketListApiRequest = IApiPaginatedRequest<
  void,
  ISupportTicketFilter,
  void
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketListApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPaginatedResponse'
 */
export type ISupportTicketListApiResponse =
  IPaginatedResponse<ISupportTicketListItemResponse>;

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketCreateApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/SupportTicketCreateData'
 */
export type ISupportTicketCreateApiRequest =
  IApiRequest<ISupportTicketCreateData>;

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketUpdateApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/SupportTicketUpdateData'
 */
export type ISupportTicketUpdateApiRequest =
  IApiRequest<ISupportTicketUpdateData>;

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/SupportTicketApiResponse'
 */
export type ISupportTicketGetApiResponse =
  IApiResponse<ISupportTicketApiResponse>;

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketCreateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/SupportTicketApiResponse'
 */
export type ISupportTicketCreateApiResponse =
  IApiResponse<ISupportTicketApiResponse>;

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/SupportTicketApiResponse'
 */
export type ISupportTicketUpdateApiResponse =
  IApiResponse<ISupportTicketApiResponse>;

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketDeleteApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 */
export type ISupportTicketDeleteApiResponse = IApiResponse<{
  success: boolean;
}>;

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketStatusChangeApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 status:
 *                   $ref: '#/components/schemas/SupportTicketStatusEnum'
 *                 reason:
 *                   type: string
 *                   description: Reason for status change
 */
export type ISupportTicketStatusChangeApiRequest = IApiRequest<{
  status: SupportTicketStatusEnum;
  reason?: string;
}>;

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketEscalationApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 escalatedToUserId:
 *                   type: string
 *                   format: uuid
 *                   description: ID of the user to escalate to
 *                 escalationReason:
 *                   type: string
 *                   description: Reason for escalation
 */
export type ISupportTicketEscalationApiRequest = IApiRequest<{
  escalatedToUserId: string;
  escalationReason: string;
}>;

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketRatingApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 rating:
 *                   type: integer
 *                   minimum: 1
 *                   maximum: 5
 *                   description: Customer rating from 1 to 5
 *                 feedback:
 *                   type: string
 *                   description: Customer feedback
 */
export type ISupportTicketRatingApiRequest = IApiRequest<{
  rating: number;
  feedback?: string;
}>;

/**
 * Support Ticket Priority Change Api Request
 */

/**
 * Support Ticket Priority Change Api Response
 */
/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketPriorityChangeApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISupportTicketPriorityChange'
 */
export type ISupportTicketPriorityChangeApiRequest =
  IApiRequest<ISupportTicketPriorityChange>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportTicketPriorityChangeApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISupportTicketPriorityChange'
 */
export type ISupportTicketPriorityChangeApiResponse =
  IApiResponse<ISupportTicketPriorityChange>;

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketCommentApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISupportTicketCommentCreateRequest'
 */
export type ISupportTicketCommentApiRequest =
  IApiRequest<ISupportTicketCommentCreateRequest>;

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketRcaApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISupportTicketRcaRequest'
 */
export type ISupportTicketRcaApiRequest = IApiRequest<ISupportTicketRcaRequest>;

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketRcaApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISupportTicketRcaResponse'
 */
export type ISupportTicketRcaApiResponse =
  IApiResponse<ISupportTicketRcaResponse>;

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketResolutionApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISupportTicketResolutionRequest'
 */
export type ISupportTicketResolutionApiRequest =
  IApiRequest<ISupportTicketResolutionRequest>;

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketResolutionApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISupportTicketResolutionResponse'
 */
export type ISupportTicketResolutionApiResponse =
  IApiResponse<ISupportTicketResolutionResponse>;

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketStatisticsApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             filters:
 *               $ref: '#/components/schemas/ISupportTicketStatisticsFilter'
 *               description: Filter criteria for support ticket statistics
 */
export type ISupportTicketStatisticsApiRequest =
  IApiRequest<ISupportTicketStatisticsFilter>;

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketStatisticsApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISupportTicketStatistics'
 */
export type ISupportTicketStatisticsApiResponse =
  IApiResponse<ISupportTicketStatistics>;
