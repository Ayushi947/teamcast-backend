import {
  IPartnerUser,
  IPartnerUserActivateDeactivate,
  IPartnerUserCreate,
  IPartnerUserFilterQuery,
  IPartnerUserIdParams,
  IPartnerUserUpdate,
} from '../../domain/partner/user.domain';
import {
  IApiPaginatedRequest,
  IApiRequest,
  IApiResponse,
  IPaginatedResponse,
} from '../common/common.api';

export type IPartnerUserCreateApiRequest = IApiRequest<IPartnerUserCreate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerUserCreateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerUser'
 */
export type IPartnerUserCreateApiResponse = IApiResponse<IPartnerUser>;

export type IPartnerUserUpdateApiRequest = IApiRequest<
  IPartnerUserUpdate,
  void,
  IPartnerUserIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerUserUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerUser'
 */
export type IPartnerUserUpdateApiResponse = IApiResponse<IPartnerUser>;

export type IPartnerUserGetApiRequest = IApiRequest<
  void,
  void,
  IPartnerUserIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerUserGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerUser'
 */
export type IPartnerUserGetApiResponse = IApiResponse<IPartnerUser>;

export type IPartnerUserDeleteApiRequest = IApiRequest<
  void,
  void,
  IPartnerUserIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerUserDeleteApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: boolean
 */
export type IPartnerUserDeleteApiResponse = IApiResponse<boolean>;

export type IPartnerUserListApiRequest = IApiPaginatedRequest<
  void,
  IPartnerUserFilterQuery,
  void
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerUserListApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiPaginatedResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/IPartnerUser'
 */
export type IPartnerUserListApiResponse = IPaginatedResponse<IPartnerUser>;

export type IPartnerUserActivateDeactivateApiRequest = IApiRequest<
  IPartnerUserActivateDeactivate,
  void,
  IPartnerUserIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerUserActivateDeactivateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerUser'
 */
export type IPartnerUserActivateDeactivateApiResponse =
  IApiResponse<IPartnerUser>;
