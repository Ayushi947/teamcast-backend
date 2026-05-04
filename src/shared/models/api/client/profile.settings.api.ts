import { IApiRequest, IApiResponse } from '../common/common.api';
import {
  IClientProfileSettings,
  IClientProfileSettingsUpdate,
} from '../../domain/client/profile.settings.domain';

// Get client settings request/response
export type IClientProfileSettingsGetApiRequest = IApiRequest<void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientProfileSettingsGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientProfileSettings'
 */

export type IClientProfileSettingsGetApiResponse =
  IApiResponse<IClientProfileSettings>;

// Update client settings request/response
export type IClientProfileSettingsUpdateApiRequest =
  IApiRequest<IClientProfileSettingsUpdate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientProfileSettingsUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientProfileSettings'
 */

export type IClientProfileSettingsUpdateApiResponse =
  IApiResponse<IClientProfileSettings>;
