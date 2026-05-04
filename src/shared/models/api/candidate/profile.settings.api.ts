import { IApiRequest, IApiResponse } from '../common/common.api';
import {
  ICandidateSettings,
  ICandidatePreferences,
  ICandidateSettingsUpdate,
  ICandidatePreferencesUpdate,
} from '../../domain/candidate/profile.settings.domain';

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateSettingsGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ICandidateSettings'
 */
export type ICandidateSettingsGetApiResponse = IApiResponse<ICandidateSettings>;

export type ICandidateSettingsUpdateApiRequest =
  IApiRequest<ICandidateSettingsUpdate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateSettingsUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ICandidateSettingsUpdate'
 */
export type ICandidateSettingsUpdateApiResponse =
  IApiResponse<ICandidateSettings>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidatePreferencesGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ICandidatePreferences'
 */
export type ICandidatePreferencesGetApiResponse =
  IApiResponse<ICandidatePreferences>;

export type ICandidatePreferencesUpdateApiRequest =
  IApiRequest<ICandidatePreferencesUpdate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidatePreferencesUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ICandidatePreferences'
 */
export type ICandidatePreferencesUpdateApiResponse =
  IApiResponse<ICandidatePreferences>;
