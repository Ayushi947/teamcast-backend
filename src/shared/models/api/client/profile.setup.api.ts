import {
  IClientProfileSetup,
  IClientProfileSetupDone,
  IClientProfileSetupRequired,
} from '../../domain/client/profile.setup.domain';
import { IApiRequest, IApiResponse } from '../common/common.api';

export type IClientProfileSetupApiRequest = IApiRequest<IClientProfileSetup>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientProfileSetupApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientProfileSetupDone'
 */
export type IClientProfileSetupApiResponse =
  IApiResponse<IClientProfileSetupDone>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientProfileSetupRequiredApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientProfileSetupRequired'
 */
export type IClientProfileSetupRequiredApiResponse =
  IApiResponse<IClientProfileSetupRequired>;
