import { IApiRequest, IApiResponse } from '../common/common.api';
import {
  IPartnerUserProfile,
  IPartnerUserProfileBasicUpdate,
  IPartnerUserProfilePasswordChange,
  IPartnerUserProfilePhotoUpdate,
  IPartnerUserProfilePhotoUrl,
  IPartnerUserSettings,
  IPartnerUserSettingsUpdate,
} from '../../domain/partner/user.profile.domain';

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerUserProfileGetApiResponse:
 *       type: object
 *       properties:
 *         allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerUserProfile'
 */
export type IPartnerUserProfileGetApiResponse =
  IApiResponse<IPartnerUserProfile>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerUserProfileBasicUpdateApiRequest:
 *       type: object
 *       properties:
 *         allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerUserProfileBasicUpdate'
 */
export type IPartnerUserProfileBasicUpdateApiRequest =
  IApiRequest<IPartnerUserProfileBasicUpdate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerUserProfileBasicUpdateApiResponse:
 *       type: object
 *       properties:
 *         allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerUserProfile'
 */
export type IPartnerUserProfileBasicUpdateApiResponse =
  IApiResponse<IPartnerUserProfile>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerUserProfilePasswordChangeApiRequest:
 *       type: object
 *       properties:
 *         allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerUserProfilePasswordChange'
 */
export type IPartnerUserProfilePasswordChangeApiRequest =
  IApiRequest<IPartnerUserProfilePasswordChange>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerUserProfilePasswordChangeApiResponse:
 *       type: object
 *       properties:
 *         allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             message:
 *               type: string
 *               description: Success message
 */
export type IPartnerUserProfilePasswordChangeApiResponse = IApiResponse<{
  message: string;
}>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerUserProfilePhotoUrlApiResponse:
 *       type: object
 *       properties:
 *         allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerUserProfilePhotoUrl'
 */
export type IPartnerUserProfilePhotoUrlApiResponse =
  IApiResponse<IPartnerUserProfilePhotoUrl>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerUserProfilePhotoUpdateApiRequest:
 *       type: object
 *       properties:
 *         allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerUserProfilePhotoUpdate'
 */
export type IPartnerUserProfilePhotoUpdateApiRequest =
  IApiRequest<IPartnerUserProfilePhotoUpdate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerUserProfilePhotoUpdateApiResponse:
 *       type: object
 *       properties:
 *         allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerUserProfilePhotoUrl'
 */
export type IPartnerUserProfilePhotoUpdateApiResponse =
  IApiResponse<IPartnerUserProfilePhotoUrl>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerUserSettingsGetApiResponse:
 *       type: object
 *       properties:
 *         allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerUserSettings'
 */
export type IPartnerUserSettingsGetApiResponse =
  IApiResponse<IPartnerUserSettings>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerUserSettingsUpdateApiRequest:
 *       type: object
 *       properties:
 *         allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerUserSettingsUpdate'
 */
export type IPartnerUserSettingsUpdateApiRequest =
  IApiRequest<IPartnerUserSettingsUpdate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerUserSettingsUpdateApiResponse:
 *       type: object
 *       properties:
 *         allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerUserSettings'
 */
export type IPartnerUserSettingsUpdateApiResponse =
  IApiResponse<IPartnerUserSettings>;
