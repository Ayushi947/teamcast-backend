import {
  IClientUserInvitationSend,
  IClientUserInvitationFilterQuery,
  IInvitationIdParams,
  IClientUserInvitation,
  IClientUserInvitationAccepted,
  IClientUserInvitationAcceptParams,
} from '../../domain/client/user.invitation.domain';
import {
  IApiPaginatedRequest,
  IApiRequest,
  IApiResponse,
  IPaginatedResponse,
} from '../common/common.api';

export type IClientUserInvitationSendApiRequest =
  IApiRequest<IClientUserInvitationSend>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientUserInvitationSendApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientUserInvitation'
 */
export type IClientUserInvitationSendApiResponse =
  IApiResponse<IClientUserInvitation>;

export type IClientUserInvitationGetApiRequest = IApiRequest<
  void,
  void,
  IInvitationIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientUserInvitationGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientUserInvitation'
 */
export type IClientUserInvitationGetApiResponse =
  IApiResponse<IClientUserInvitation>;

export type IClientUserInvitationWithdrawApiRequest = IApiRequest<
  void,
  void,
  IInvitationIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientUserInvitationWithdrawApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientUserInvitation'
 */
export type IClientUserInvitationWithdrawApiResponse =
  IApiResponse<IClientUserInvitation>;

export type IClientUserInvitationResendApiRequest = IApiRequest<
  void,
  void,
  IInvitationIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientUserInvitationResendApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientUserInvitation'
 */
export type IClientUserInvitationResendApiResponse =
  IApiResponse<IClientUserInvitation>;

export type IClientUserInvitationAcceptApiRequest = IApiRequest<
  void,
  void,
  IClientUserInvitationAcceptParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientUserInvitationAcceptApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientUserInvitationAccepted'
 */
export type IClientUserInvitationAcceptApiResponse =
  IApiResponse<IClientUserInvitationAccepted>;

export type IClientUserInvitationListApiRequest = IApiPaginatedRequest<
  void,
  IClientUserInvitationFilterQuery,
  void
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientUserInvitationListApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPaginatedResponse'
 *               items:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/IClientUserInvitation'
 */
export type IClientUserInvitationListApiResponse = IApiResponse<
  IPaginatedResponse<IClientUserInvitation>
>;
