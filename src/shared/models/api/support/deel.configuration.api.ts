import { IDeelConfiguration } from '../../domain/support/deel.configuration.domain';
import { IApiRequest, IApiResponse } from '../common/common.api';

/**
 * Request parameters for getting Deel configuration
 */
export interface IDeelConfigurationParams {
  clientId: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IDeelConfigurationGetApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             params:
 *               type: object
 *               properties:
 *                 clientId:
 *                   type: string
 *                   format: uuid
 *                   description: Client ID
 */
export type IDeelConfigurationGetApiRequest = IApiRequest<
  void,
  void,
  IDeelConfigurationParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IDeelConfigurationGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IDeelConfiguration'
 */
export type IDeelConfigurationGetApiResponse = IApiResponse<IDeelConfiguration>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IDeelConfigurationEnableApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             params:
 *               type: object
 *               properties:
 *                 clientId:
 *                   type: string
 *                   format: uuid
 *                   description: Client ID
 */
export type IDeelConfigurationEnableApiRequest = IApiRequest<
  void,
  void,
  IDeelConfigurationParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IDeelConfigurationEnableApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IDeelConfiguration'
 */
export type IDeelConfigurationEnableApiResponse =
  IApiResponse<IDeelConfiguration>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IDeelConfigurationDisableApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             params:
 *               type: object
 *               properties:
 *                 clientId:
 *                   type: string
 *                   format: uuid
 *                   description: Client ID
 */
export type IDeelConfigurationDisableApiRequest = IApiRequest<
  void,
  void,
  IDeelConfigurationParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IDeelConfigurationDisableApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IDeelConfiguration'
 */
export type IDeelConfigurationDisableApiResponse =
  IApiResponse<IDeelConfiguration>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IDeelConfigurationListApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 */
export type IDeelConfigurationListApiRequest = IApiRequest<void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IDeelConfigurationListApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/IDeelConfiguration'
 */
export type IDeelConfigurationListApiResponse = IApiResponse<
  IDeelConfiguration[]
>;
