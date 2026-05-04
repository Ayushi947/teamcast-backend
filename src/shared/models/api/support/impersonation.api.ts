import { IApiRequest, IApiResponse } from '../common/common.api';
import {
  IStartImpersonation,
  IStartImpersonationResponse,
  IStopImpersonation,
  IStopImpersonationResponse,
} from '../../domain/support/impersonation.domain';

// Start Impersonation API Types (like login)
export type IStartImpersonationApiRequest = IApiRequest<IStartImpersonation>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IStartImpersonationApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IStartImpersonationResponse'
 */
export type IStartImpersonationApiResponse =
  IApiResponse<IStartImpersonationResponse>;

// Stop Impersonation API Types (like login)
export type IStopImpersonationApiRequest = IApiRequest<IStopImpersonation>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IStopImpersonationApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IStopImpersonationResponse'
 */
export type IStopImpersonationApiResponse =
  IApiResponse<IStopImpersonationResponse>;
