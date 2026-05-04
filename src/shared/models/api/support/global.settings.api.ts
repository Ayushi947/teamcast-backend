import { IApiRequest, IApiResponse } from '../common/common.api';
import {
  IGlobalSettings,
  IGlobalSettingsUpdate,
} from '../../domain/support/global.settings.domain';

// Get global settings request/response
export type IGlobalSettingsGetApiRequest = IApiRequest<void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IGlobalSettingsGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IGlobalSettings'
 */
export type IGlobalSettingsGetApiResponse = IApiResponse<IGlobalSettings>;

// Update global settings request/response
export type IGlobalSettingsUpdateApiRequest =
  IApiRequest<IGlobalSettingsUpdate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IGlobalSettingsUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IGlobalSettings'
 */
export type IGlobalSettingsUpdateApiResponse = IApiResponse<IGlobalSettings>;
