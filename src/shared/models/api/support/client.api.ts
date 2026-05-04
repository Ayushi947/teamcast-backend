import {
  IApiRequest,
  IApiResponse,
  IApiPaginatedRequest,
  IPaginatedResponse,
} from '../common/common.api';
import {
  ISupportClient,
  ISupportClientUpdate,
  ISupportClientFilterQueryCompanyId,
  ISupportClientIdParams,
  ISupportClientVerifyRequest,
  ISupportClientVerifyResponse,
  ISupportClientJobPostingByIdResponse,
  ISupportClientJobPostingByIdParams,
} from '../../domain/support/client.domain';
import type { IMcpClientWithApiKey } from '../../domain/client/mcp.client.domain';

export type ISupportClientUpdateApiRequest = IApiRequest<
  ISupportClientUpdate,
  void,
  ISupportClientIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportClientUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISupportClient'
 */
export type ISupportClientUpdateApiResponse = IApiResponse<ISupportClient>;

export type ISupportClientGetApiRequest = IApiRequest<
  void,
  void,
  ISupportClientIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportClientGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISupportClient'
 */
export type ISupportClientGetApiResponse = IApiResponse<ISupportClient>;

export type ISupportClientDeleteApiRequest = IApiRequest<
  void,
  void,
  ISupportClientIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportClientDeleteApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: boolean
 */
export type ISupportClientDeleteApiResponse = IApiResponse<boolean>;

export type ISupportClientListApiRequest = IApiPaginatedRequest<
  void,
  ISupportClientFilterQueryCompanyId,
  void
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportClientListApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPaginatedResponse'
 */
export type ISupportClientListApiResponse = IPaginatedResponse<ISupportClient>;

export type ISupportClientVerifyApiRequest = IApiRequest<
  ISupportClientVerifyRequest,
  void,
  ISupportClientIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportClientVerifyApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISupportClientVerifyResponse'
 */
export type ISupportClientVerifyApiResponse =
  IApiResponse<ISupportClientVerifyResponse>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportClientJobPostingByIdApiRequest:
 *       type: object
 *       description: Request model for getting a job posting by ID
 *       properties:
 *         params:
 *           $ref: '#/components/schemas/ISupportClientJobPostingByIdParams'
 */
export type ISupportClientJobPostingByIdApiRequest = IApiRequest<
  void,
  void,
  ISupportClientJobPostingByIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportClientJobPostingByIdApiResponse:
 *       type: object
 *       description: Request model for getting a job posting by ID
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/ISupportClientJobPostingByIdResponse'
 */
export type ISupportClientJobPostingByIdApiResponse =
  IApiResponse<ISupportClientJobPostingByIdResponse>;

export type ISupportClientGenerateMcpKeyApiRequest = IApiRequest<
  void,
  void,
  ISupportClientIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportClientGenerateMcpKeyApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IMcpClientWithApiKey'
 */
export type ISupportClientGenerateMcpKeyApiResponse =
  IApiResponse<IMcpClientWithApiKey>;
