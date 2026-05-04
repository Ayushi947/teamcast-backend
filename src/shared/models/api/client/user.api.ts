import {
  IApiRequest,
  IApiResponse,
  IApiPaginatedRequest,
  IPaginatedResponse,
} from '../common/common.api';
import {
  IClientUser,
  IClientUserCreate,
  IClientUserUpdate,
  IClientUserFilterQuery,
  IClientUserIdParams,
  IClientUserActivateDeactivate,
} from '../../domain/client/user.domain';

export type IClientUserCreateApiRequest = IApiRequest<IClientUserCreate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientUserCreateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientUser'
 */
export type IClientUserCreateApiResponse = IApiResponse<IClientUser>;

export type IClientUserUpdateApiRequest = IApiRequest<
  IClientUserUpdate,
  void,
  IClientUserIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientUserUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientUser'
 */
export type IClientUserUpdateApiResponse = IApiResponse<IClientUser>;

export type IClientUserGetApiRequest = IApiRequest<
  void,
  void,
  IClientUserIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientUserGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientUser'
 */
export type IClientUserGetApiResponse = IApiResponse<IClientUser>;

export type IClientUserDeleteApiRequest = IApiRequest<
  void,
  void,
  IClientUserIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientUserDeleteApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: boolean
 */
export type IClientUserDeleteApiResponse = IApiResponse<boolean>;

export type IClientUserListApiRequest = IApiPaginatedRequest<
  void,
  IClientUserFilterQuery,
  void
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientUserListApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/IClientUser'
 */
export type IClientUserListApiResponse = IPaginatedResponse<IClientUser>;

export type IClientUserActivateDeactivateApiRequest = IApiRequest<
  IClientUserActivateDeactivate,
  void,
  IClientUserIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientUserActivateDeactivateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientUser'
 */
export type IClientUserActivateDeactivateApiResponse =
  IApiResponse<IClientUser>;
