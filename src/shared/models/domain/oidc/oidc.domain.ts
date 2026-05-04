/**
 * OIDC Domain Models
 * Models for OpenID Connect / OAuth2 authorization flow with Deel
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     IOIDCAuthorizeRequest:
 *       type: object
 *       required:
 *         - response_type
 *         - client_id
 *         - redirect_uri
 *         - scope
 *       properties:
 *         response_type:
 *           type: string
 *           enum: [code]
 *           description: Must be "code" for authorization code flow
 *         client_id:
 *           type: string
 *           description: OAuth2 client ID (Deel's client ID)
 *         redirect_uri:
 *           type: string
 *           description: Callback URL to redirect user after authorization
 *         scope:
 *           type: string
 *           description: Requested scopes (e.g., "openid email")
 *         state:
 *           type: string
 *           description: CSRF protection token
 */
export interface IOIDCAuthorizeRequest {
  response_type: string;
  client_id: string;
  redirect_uri: string;
  scope: string;
  state?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IOIDCAuthorizeResponse:
 *       type: object
 *       required:
 *         - redirect_url
 *       properties:
 *         redirect_url:
 *           type: string
 *           description: Full URL with authorization code to redirect user to Deel
 */
export interface IOIDCAuthorizeResponse {
  redirect_url: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IOIDCDeelStatus:
 *       type: object
 *       required:
 *         - isDeelEnabled
 *       properties:
 *         isDeelEnabled:
 *           type: boolean
 *           description: Whether Deel SSO integration is enabled for the user's organization
 *         clientId:
 *           type: string
 *           description: Client ID (if user belongs to a client)
 *         companyName:
 *           type: string
 *           description: Company name (if user belongs to a client)
 *         message:
 *           type: string
 *           description: Additional message if Deel is not enabled
 */
export interface IOIDCDeelStatus {
  isDeelEnabled: boolean;
  clientId?: string;
  companyName?: string;
  message?: string;
}
