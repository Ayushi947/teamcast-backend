/**
 * OIDC Routes for Deel SSO Integration
 *
 * Endpoints:
 * - GET  /.well-known/openid-configuration - OIDC Discovery
 * - GET  /api/v1/oidc/jwks                 - JSON Web Key Set
 * - POST /api/v1/oidc/deel/sso             - Initiate Deel SSO (requires auth)
 * - GET  /api/v1/oidc/userinfo             - Get user info (requires auth)
 * - GET  /api/v1/oidc/health               - Health check
 *
 * Environment-driven Configuration:
 * - DEV: devapi.teamcast.ai
 * - PROD: api.teamcast.ai
 */

import { Router } from 'express';
import { OIDCController } from '@/controllers/oidc/oidc.controller';
import { requireAuth } from '@/middleware';

const router = Router();

// Initialize controller
const oidcController = new OIDCController();

/**
 * @openapi
 * /.well-known/openid-configuration:
 *   get:
 *     summary: OIDC Discovery Configuration
 *     description: Returns OpenID Connect discovery configuration. Deel fetches this first to discover all OIDC endpoints.
 *     tags:
 *       - OIDC
 *     responses:
 *       200:
 *         description: OIDC Discovery configuration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 issuer:
 *                   type: string
 *                   example: https://api.teamcast.ai
 *                 authorization_endpoint:
 *                   type: string
 *                   example: https://api.teamcast.ai/api/v1/oidc/authorize
 *                 token_endpoint:
 *                   type: string
 *                   example: https://api.teamcast.ai/api/v1/oidc/token
 *                 userinfo_endpoint:
 *                   type: string
 *                   example: https://api.teamcast.ai/api/v1/oidc/userinfo
 *                 jwks_uri:
 *                   type: string
 *                   example: https://api.teamcast.ai/api/v1/oidc/jwks
 */
router.get(
  '/.well-known/openid-configuration',
  oidcController.getDiscoveryConfiguration
);

/**
 * @openapi
 * /v1/oidc/jwks:
 *   get:
 *     summary: JSON Web Key Set (JWKS)
 *     description: Returns public keys used to verify ID Token signatures. Deel uses this to verify tokens.
 *     tags:
 *       - OIDC
 *     responses:
 *       200:
 *         description: JWKS
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 keys:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       kty:
 *                         type: string
 *                         example: RSA
 *                       use:
 *                         type: string
 *                         example: sig
 *                       kid:
 *                         type: string
 *                         example: 7fb16d956d0ffa74
 *                       alg:
 *                         type: string
 *                         example: RS256
 *                       n:
 *                         type: string
 *                         description: RSA modulus
 *                       e:
 *                         type: string
 *                         description: RSA exponent
 */
router.get('/jwks', oidcController.getJWKS);

/**
 * @openapi
 * /v1/oidc/authorize:
 *   get:
 *     summary: OAuth2 Authorization Endpoint
 *     description: |
 *       OAuth2 authorization endpoint. Deel redirects user here to initiate authorization.
 *
 *       Flow:
 *       1. Deel redirects user to this endpoint with client_id, redirect_uri, scope, state
 *       2. TeamCast checks if user is logged in
 *       3. If not logged in, redirects to login page
 *       4. If logged in, generates authorization code
 *       5. Redirects back to Deel with authorization code
 *     tags:
 *       - OIDC
 *     parameters:
 *       - in: query
 *         name: response_type
 *         schema:
 *           type: string
 *           enum: [code]
 *         required: true
 *         description: Must be "code" for authorization code flow
 *       - in: query
 *         name: client_id
 *         schema:
 *           type: string
 *         required: true
 *         description: OAuth2 client ID (Deel's client ID)
 *       - in: query
 *         name: redirect_uri
 *         schema:
 *           type: string
 *         required: true
 *         description: Callback URL to redirect user after authorization
 *       - in: query
 *         name: scope
 *         schema:
 *           type: string
 *         required: true
 *         description: Requested scopes (e.g., "openid email")
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: CSRF protection token
 *     responses:
 *       302:
 *         description: Redirects to redirect_uri with authorization code
 *       400:
 *         description: Invalid request parameters
 */
/**
 * Authorize endpoint handles TWO cases:
 * 1. Browser redirect from Deel (no auth) → Redirects to frontend OAuth page
 * 2. Authenticated API call from frontend (with auth) → Generates auth code
 *
 * No middleware required - controller checks for Authorization header
 */
router.get('/authorize', oidcController.authorize);

/**
 * @openapi
 * /v1/oidc/token:
 *   post:
 *     summary: OAuth2 Token Endpoint
 *     description: |
 *       OAuth2 token endpoint. Deel exchanges authorization code for ID Token here.
 *
 *       Flow:
 *       1. Deel sends authorization code to this endpoint
 *       2. TeamCast validates the code
 *       3. TeamCast generates and returns ID Token
 *       4. Deel verifies ID Token using JWKS
 *     tags:
 *       - OIDC
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - grant_type
 *               - code
 *               - redirect_uri
 *               - client_id
 *             properties:
 *               grant_type:
 *                 type: string
 *                 enum: [authorization_code]
 *                 description: Must be "authorization_code"
 *               code:
 *                 type: string
 *                 description: Authorization code from /authorize endpoint
 *               redirect_uri:
 *                 type: string
 *                 description: Same redirect_uri used in /authorize
 *               client_id:
 *                 type: string
 *                 description: OAuth2 client ID
 *               client_secret:
 *                 type: string
 *                 description: OAuth2 client secret (optional for public clients)
 *     responses:
 *       200:
 *         description: ID Token returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id_token:
 *                   type: string
 *                   description: JWT ID Token
 *                 token_type:
 *                   type: string
 *                   example: Bearer
 *                 expires_in:
 *                   type: number
 *                   description: Token expiry in seconds
 *       400:
 *         description: Invalid grant or invalid request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: invalid_grant
 *                 error_description:
 *                   type: string
 */
router.post('/token', oidcController.token);

/**
 * @openapi
 * /v1/oidc/deel/sso:
 *   post:
 *     summary: Initiate Deel SSO
 *     description: |
 *       Initiates Single Sign-On to Deel. Requires user to be authenticated.
 *
 *       Flow:
 *       1. User is authenticated in TeamCast (Google or Email/Password)
 *       2. User clicks "Hire on Deel" button
 *       3. This endpoint generates ID Token
 *       4. Returns HTML with auto-redirect to Deel
 *       5. User is automatically logged into Deel
 *     tags:
 *       - OIDC
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns HTML with auto-redirect to Deel
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       401:
 *         description: Unauthorized - User must be logged in
 *       500:
 *         description: Failed to initiate SSO
 */
router.post('/deel/sso', requireAuth, oidcController.initiateDeelSSO);

/**
 * @openapi
 * /v1/oidc/userinfo:
 *   get:
 *     summary: Get user information
 *     description: Returns user information in standard OIDC format. Requires authentication.
 *     tags:
 *       - OIDC
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sub:
 *                   type: string
 *                   description: User ID
 *                 email:
 *                   type: string
 *                   description: User email
 *                 email_verified:
 *                   type: boolean
 *                   description: Whether email is verified
 *                 name:
 *                   type: string
 *                   description: Full name
 *                 given_name:
 *                   type: string
 *                   description: First name
 *                 family_name:
 *                   type: string
 *                   description: Last name
 *       401:
 *         description: Unauthorized
 */
router.get('/userinfo', requireAuth, oidcController.getUserInfo);

/**
 * @openapi
 * /v1/oidc/health:
 *   get:
 *     summary: OIDC service health check
 *     description: Returns health status of OIDC service
 *     tags:
 *       - OIDC
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 service:
 *                   type: string
 *                   example: OIDC Provider
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/health', oidcController.healthCheck);

/**
 * @openapi
 * /v1/oidc/deel/status:
 *   get:
 *     summary: Check Deel SSO status for authenticated user's client
 *     description: Returns whether Deel SSO integration is enabled for the user's organization
 *     tags:
 *       - OIDC
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Deel status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     isDeelEnabled:
 *                       type: boolean
 *                       example: true
 *                     clientId:
 *                       type: string
 *                     companyName:
 *                       type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/deel/status', requireAuth, oidcController.getDeelStatus);

export default router;
