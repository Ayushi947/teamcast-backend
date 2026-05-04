import {
  IPartnerUserInvitationSend,
  IPartnerUserInvitationFilterQuery,
  IPartnerInvitationIdParams,
  IPartnerUserInvitation,
  IPartnerUserInvitationAccepted,
  IPartnerUserInvitationAcceptParams,
} from '../../domain/partner/user.invitation.domain';
import {
  IApiPaginatedRequest,
  IApiRequest,
  IApiResponse,
  IPaginatedResponse,
} from '../common/common.api';

export type IPartnerUserInvitationSendApiRequest =
  IApiRequest<IPartnerUserInvitationSend>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerUserInvitationSendApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerUserInvitation'
 */
export type IPartnerUserInvitationSendApiResponse =
  IApiResponse<IPartnerUserInvitation>;

export type IPartnerUserInvitationGetApiRequest = IApiRequest<
  void,
  void,
  IPartnerInvitationIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerUserInvitationGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerUserInvitation'
 */
export type IPartnerUserInvitationGetApiResponse =
  IApiResponse<IPartnerUserInvitation>;

export type IPartnerUserInvitationWithdrawApiRequest = IApiRequest<
  void,
  void,
  IPartnerInvitationIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerUserInvitationWithdrawApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerUserInvitation'
 */
export type IPartnerUserInvitationWithdrawApiResponse =
  IApiResponse<IPartnerUserInvitation>;

export type IPartnerUserInvitationResendApiRequest = IApiRequest<
  void,
  void,
  IPartnerInvitationIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerUserInvitationResendApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerUserInvitation'
 */
export type IPartnerUserInvitationResendApiResponse =
  IApiResponse<IPartnerUserInvitation>;

export type IPartnerUserInvitationAcceptApiRequest = IApiRequest<
  void,
  void,
  IPartnerUserInvitationAcceptParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerUserInvitationAcceptApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerUserInvitationAccepted'
 */
export type IPartnerUserInvitationAcceptApiResponse =
  IApiResponse<IPartnerUserInvitationAccepted>;

export type IPartnerUserInvitationListApiRequest = IApiPaginatedRequest<
  void,
  IPartnerUserInvitationFilterQuery,
  void
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerUserInvitationListApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/IPartnerUserInvitation'
 *                 pagination:
 *                   $ref: '#/components/schemas/IPaginationInfo'
 */
export type IPartnerUserInvitationListApiResponse = IApiResponse<
  IPaginatedResponse<IPartnerUserInvitation>
>;
