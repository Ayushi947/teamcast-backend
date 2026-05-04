import { IApiRequest, IApiResponse } from '../common/common.api';
import {
  IOAuthLoginDone,
  IOAuthProviders,
  IOAuthAuthUrl,
} from '../../domain/oauth/oauth.domain';

// ============================================================================
// Generic OAuth API Models
// ============================================================================

export type IOAuthProvidersApiRequest = IApiRequest<void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IOAuthProvidersApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the operation was successful
 *         data:
 *           $ref: '#/components/schemas/IOAuthProviders'
 *         message:
 *           type: string
 *           description: Response message
 */
export type IOAuthProvidersApiResponse = IApiResponse<IOAuthProviders>;

export type IOAuthAuthUrlApiRequest = IApiRequest<
  { state?: string; returnUrl?: string; userType?: string },
  void,
  { provider: string }
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IOAuthAuthUrlApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the operation was successful
 *         data:
 *           $ref: '#/components/schemas/IOAuthAuthUrl'
 *         message:
 *           type: string
 *           description: Response message
 */
export type IOAuthAuthUrlApiResponse = IApiResponse<IOAuthAuthUrl>;

export type IOAuthCallbackApiRequest = IApiRequest<
  void,
  { code: string; state?: string; error?: string; error_description?: string },
  { provider: string }
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IOAuthCallbackApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the operation was successful
 *         data:
 *           $ref: '#/components/schemas/IOAuthLoginDone'
 *         message:
 *           type: string
 *           description: Response message
 */
export type IOAuthCallbackApiResponse = IApiResponse<IOAuthLoginDone>;
