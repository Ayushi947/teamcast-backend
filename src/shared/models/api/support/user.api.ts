import {
  IApiRequest,
  IApiResponse,
  IApiPaginatedRequest,
  IPaginatedResponse,
} from '../common/common.api';
import {
  ISupportUser,
  ISupportUserCreate,
  ISupportUserCreateResponse,
  ISupportUserUpdate,
  ISupportUserFilterQuery,
  ISupportUserIdParams,
  ISupportUserActivateDeactivate,
  ISupportUserListResponse,
  ISupportUserPasswordChange,
  ISupportUserRecruiterAnalytics,
  ISupportUserProfilePhotoUrl,
} from '../../domain/support/user.domain';

export type ISupportUserCreateApiRequest = IApiRequest<ISupportUserCreate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportUserCreateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISupportUserCreateResponse'
 */
export type ISupportUserCreateApiResponse =
  IApiResponse<ISupportUserCreateResponse>;

export type ISupportUserUpdateApiRequest = IApiRequest<
  ISupportUserUpdate,
  void,
  ISupportUserIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportUserUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISupportUser'
 */
export type ISupportUserUpdateApiResponse = IApiResponse<ISupportUser>;

export type ISupportUserGetApiRequest = IApiRequest<
  void,
  void,
  ISupportUserIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportUserGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISupportUser'
 */
export type ISupportUserGetApiResponse = IApiResponse<ISupportUser>;

export type ISupportUserDeleteApiRequest = IApiRequest<
  void,
  void,
  ISupportUserIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportUserDeleteApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: boolean
 */
export type ISupportUserDeleteApiResponse = IApiResponse<boolean>;

export type ISupportUserListApiRequest = IApiPaginatedRequest<
  void,
  ISupportUserFilterQuery,
  void
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportUserListApiResponse:
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
 *                         $ref: '#/components/schemas/ISupportUserListResponse'
 */
export type ISupportUserListApiResponse =
  IPaginatedResponse<ISupportUserListResponse>;

export type ISupportUserActivateDeactivateApiRequest = IApiRequest<
  ISupportUserActivateDeactivate,
  void,
  ISupportUserIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportUserActivateDeactivateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISupportUser'
 */
export type ISupportUserActivateDeactivateApiResponse =
  IApiResponse<ISupportUser>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportUserChangePasswordApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISupportUserPasswordChange'
 */
export type ISupportUserChangePasswordApiRequest = IApiRequest<
  ISupportUserPasswordChange,
  void,
  ISupportUserIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportUserChangePasswordApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: string
 */
export type ISupportUserChangePasswordApiResponse = IApiResponse<string>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportUserRecruiterAnalyticsApiRequest:
 *       type: object
 *       properties:
 *         startDate:
 *           type: string
 *           format: date
 *           description: Start date for filtering analytics data
 *           example: "2024-01-01"
 *         endDate:
 *           type: string
 *           format: date
 *           description: End date for filtering analytics data
 *           example: "2024-12-31"
 */
export interface ISupportUserRecruiterAnalyticsFilterQuery {
  startDate?: string;
  endDate?: string;
}

export type ISupportUserRecruiterAnalyticsApiRequest = IApiRequest<
  ISupportUserRecruiterAnalyticsFilterQuery,
  void,
  void
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportUserRecruiterAnalyticsApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ISupportUserRecruiterAnalytics'
 */
export type ISupportUserRecruiterAnalyticsApiResponse = IApiResponse<
  ISupportUserRecruiterAnalytics[]
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportUserProfilePhotoUrlApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISupportUserProfilePhotoUrl'
 */
export type ISupportUserProfilePhotoUrlApiRequest = IApiRequest<void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportUserProfilePhotoUrlApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISupportUserProfilePhotoUrl'
 */
export type ISupportUserProfilePhotoUrlApiResponse =
  IApiResponse<ISupportUserProfilePhotoUrl>;
