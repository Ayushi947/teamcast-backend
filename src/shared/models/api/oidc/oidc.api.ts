import { IApiRequest, IApiResponse } from '../common/common.api';
import {
  IOIDCAuthorizeRequest,
  IOIDCAuthorizeResponse,
  IOIDCDeelStatus,
} from '../../domain/oidc/oidc.domain';

// ============================================================================
// OIDC Authorization API Models
// ============================================================================

/**
 * Request to initiate OAuth2 authorization with Deel
 */
export type IOIDCAuthorizeApiRequest = IApiRequest<
  void,
  IOIDCAuthorizeRequest,
  void
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IOIDCAuthorizeApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the operation was successful
 *         data:
 *           $ref: '#/components/schemas/IOIDCAuthorizeResponse'
 *         message:
 *           type: string
 *           description: Response message
 */
export type IOIDCAuthorizeApiResponse = IApiResponse<IOIDCAuthorizeResponse>;

// ============================================================================
// OIDC Deel Status API Models
// ============================================================================

/**
 * Request to check Deel SSO status for authenticated user's client
 */
export type IOIDCDeelStatusApiRequest = IApiRequest<void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IOIDCDeelStatusApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the operation was successful
 *         data:
 *           $ref: '#/components/schemas/IOIDCDeelStatus'
 *         message:
 *           type: string
 *           description: Response message
 */
export type IOIDCDeelStatusApiResponse = IApiResponse<IOIDCDeelStatus>;
