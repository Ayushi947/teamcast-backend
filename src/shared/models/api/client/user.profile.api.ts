import { IApiRequest, IApiResponse } from '../common/common.api';
import {
  IClientUserProfile,
  IClientUserProfileBasicUpdate,
  IClientUserProfilePasswordChange,
  IClientUserProfilePhotoUpdate,
  IClientUserProfilePhotoUrl,
  IClientUserSettings,
  IClientUserSettingsUpdate,
} from '../../domain/client/user.profile.domain';

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientUserProfileGetApiResponse:
 *       type: object
 *       properties:
 *         allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientUserProfile'
 */
export type IClientUserProfileGetApiResponse = IApiResponse<IClientUserProfile>;

/**
 * IClientUserProfileBasicUpdateApiRequest
 */
export type IClientUserProfileBasicUpdateApiRequest =
  IApiRequest<IClientUserProfileBasicUpdate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientUserProfileBasicUpdateApiResponse:
 *       type: object
 *       properties:
 *         allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientUserProfile'
 */

export type IClientUserProfileBasicUpdateApiResponse =
  IApiResponse<IClientUserProfile>;

// Change password request/response
export type IClientUserProfilePasswordChangeApiRequest =
  IApiRequest<IClientUserProfilePasswordChange>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientUserProfilePasswordChangeApiResponse:
 *       type: object
 *       properties:
 *         allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientUserProfile'
 */

export type IClientUserProfilePasswordChangeApiResponse = IApiResponse<void>;

export type IClientUserProfilePhotoUrlApiRequest = IApiRequest<void>;
/**
 * @openapi
 * components:
 *   schemas:
 *     IClientUserProfilePhotoUrlApiResponse:
 *       type: object
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/IClientUserProfilePhotoUrl'
 */
export type IClientUserProfilePhotoUrlApiResponse =
  IApiResponse<IClientUserProfilePhotoUrl>;

// Update profile photo request/response
export type IClientUserProfilePhotoUpdateApiRequest =
  IApiRequest<IClientUserProfilePhotoUpdate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientUserProfilePhotoUpdateApiResponse:
 *       type: object
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/IClientUserProfilePhotoUrl'
 */
export type IClientUserProfilePhotoUpdateApiResponse =
  IApiResponse<IClientUserProfilePhotoUrl>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientUserSettingsGetApiResponse:
 *       allOf:
 *       - $ref: '#/components/schemas/IApiResponse'
 *       - type: object
 *         properties:
 *           data:
 *             $ref: '#/components/schemas/IClientUserSettings'
 */
export type IClientUserSettingsGetApiResponse =
  IApiResponse<IClientUserSettings>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientUserSettingsUpdateApiRequest:
 *       allOf:
 *       - $ref: '#/components/schemas/IApiResponse'
 *       - type: object
 *         properties:
 *           data:
 *             $ref: '#/components/schemas/IClientUserSettingsUpdate'
 */
export type IClientUserSettingsUpdateApiRequest =
  IApiRequest<IClientUserSettingsUpdate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientUserSettingsUpdateApiResponse:
 *       type: object
 *       properties:
 *         allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientUserSettings'
 */
export type IClientUserSettingsUpdateApiResponse =
  IApiResponse<IClientUserSettings>;
