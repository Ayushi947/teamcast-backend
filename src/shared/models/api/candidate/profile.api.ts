import { IApiRequest, IApiResponse } from '../common/common.api';
import {
  ICandidateProfile,
  ICandidateProfileAndResume,
  ICandidateProfileBasicUpdate,
  ICandidateProfilePasswordChange,
  ICandidateProfilePhotoUpdate,
  ICandidateProfilePhotoUrl,
} from '../../domain/candidate/profile.domain';

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateProfileGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ICandidateProfile'
 */
export type ICandidateProfileGetApiResponse = IApiResponse<ICandidateProfile>;

/**
 * ICandidateProfileBasicUpdateApiRequest
 */
export type ICandidateProfileBasicUpdateApiRequest =
  IApiRequest<ICandidateProfileBasicUpdate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateProfileBasicUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ICandidateProfile'
 */
export type ICandidateProfileBasicUpdateApiResponse =
  IApiResponse<ICandidateProfile>;

// Change password request/response
export type ICandidateProfilePasswordChangeApiRequest =
  IApiRequest<ICandidateProfilePasswordChange>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateProfilePasswordChangeApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: null
 */
export type ICandidateProfilePasswordChangeApiResponse = IApiResponse<void>;

export type ICandidateProfilePhotoUrlApiRequest = IApiRequest<void>;
/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateProfilePhotoUrlApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ICandidateProfilePhotoUrl'
 */
export type ICandidateProfilePhotoUrlApiResponse =
  IApiResponse<ICandidateProfilePhotoUrl>;

// Update profile photo request/response
export type ICandidateProfilePhotoUpdateApiRequest =
  IApiRequest<ICandidateProfilePhotoUpdate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateProfilePhotoUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ICandidateProfilePhotoUrl'
 */
export type ICandidateProfilePhotoUpdateApiResponse =
  IApiResponse<ICandidateProfilePhotoUrl>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateProfilePhotoDeleteApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: null
 */
export type ICandidateProfilePhotoDeleteApiResponse = IApiResponse<void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateProfileAndResumeApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *                $ref: '#/components/schemas/ICandidateProfileAndResume'
 */
export type ICandidateProfileAndResumeApiResponse =
  IApiResponse<ICandidateProfileAndResume>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateProfileByEmailIDApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             email:
 *               type: string
 */

export type ICandidateProfileByEmailIDApiRequest = IApiRequest<
  void,
  void,
  {
    email: string;
  }
>;
