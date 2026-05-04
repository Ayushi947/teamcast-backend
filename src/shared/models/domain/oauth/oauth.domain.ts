/**
 * OAuth Domain Models and Types
 * Simplified for OAuth broker implementation
 */

import { OAuthProviderEnum } from '../../common/enums';

/**
 * @openapi
 * components:
 *   schemas:
 *     OAuthTokenResponse:
 *       type: object
 *       required:
 *         - access_token
 *         - expires_in
 *         - refresh_expires_in
 *         - refresh_token
 *         - token_type
 *         - scope
 *       properties:
 *         access_token:
 *           type: string
 *           description: OAuth access token
 *         expires_in:
 *           type: number
 *           description: Access token expiration time in seconds
 *         refresh_expires_in:
 *           type: number
 *           description: Refresh token expiration time in seconds
 *         refresh_token:
 *           type: string
 *           description: OAuth refresh token
 *         token_type:
 *           type: string
 *           description: Token type (usually "Bearer")
 *         id_token:
 *           type: string
 *           description: OpenID Connect ID token
 *         scope:
 *           type: string
 *           description: OAuth scope
 */
export interface OAuthTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: string;
  id_token?: string;
  scope: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     OAuthUserInfo:
 *       type: object
 *       required:
 *         - sub
 *         - email
 *         - name
 *         - given_name
 *         - family_name
 *         - preferred_username
 *       properties:
 *         sub:
 *           type: string
 *           description: Subject identifier (user ID)
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *         name:
 *           type: string
 *           description: Full name
 *         given_name:
 *           type: string
 *           description: First name
 *         family_name:
 *           type: string
 *           description: Last name
 *         preferred_username:
 *           type: string
 *           description: Preferred username
 *         identity_provider:
 *           type: string
 *           description: Identity provider used for authentication
 */
export interface OAuthUserInfo {
  sub: string;
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  preferred_username: string;
  identity_provider?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     OAuthUserInfo:
 *       type: object
 *       required:
 *         - id
 *         - email
 *         - name
 *         - provider
 *       properties:
 *         id:
 *           type: string
 *           description: User ID from OAuth provider
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *         name:
 *           type: string
 *           description: Full name
 *         firstName:
 *           type: string
 *           description: First name
 *         lastName:
 *           type: string
 *           description: Last name
 *         avatar:
 *           type: string
 *           description: Avatar URL
 *         provider:
 *           $ref: '#/components/schemas/OAuthProviderEnum'
 */
export interface OAuthUserInfo {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  provider: OAuthProviderEnum;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     OAuthState:
 *       type: object
 *       required:
 *         - provider
 *         - timestamp
 *       properties:
 *         provider:
 *           $ref: '#/components/schemas/OAuthProviderEnum'
 *         userType:
 *           type: string
 *           enum: [candidate, client, partner, support]
 *           description: User type for OAuth flow
 *         returnUrl:
 *           type: string
 *           description: URL to return to after OAuth
 *         timestamp:
 *           type: number
 *           description: Timestamp when state was created
 */
export interface OAuthState {
  provider: OAuthProviderEnum;
  userType?: string;
  returnUrl?: string;
  timestamp: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IOAuthAccount:
 *       type: object
 *       required:
 *         - id
 *         - provider
 *         - providerAccountId
 *         - userId
 *         - createdAt
 *         - updatedAt
 *       properties:
 *         id:
 *           type: string
 *           description: Account ID
 *         provider:
 *           $ref: '#/components/schemas/OAuthProviderEnum'
 *         providerAccountId:
 *           type: string
 *           description: Provider-specific account ID
 *         userId:
 *           type: string
 *           description: Associated user ID
 *         metadata:
 *           type: string
 *           description: Additional metadata as JSON string
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */
export interface IOAuthAccount {
  id: string;
  provider: OAuthProviderEnum;
  providerAccountId: string;
  userId: string;
  metadata?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IOAuthProviders:
 *       type: object
 *       required:
 *         - providers
 *       properties:
 *         providers:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - name
 *               - displayName
 *             properties:
 *               name:
 *                 $ref: '#/components/schemas/OAuthProviderEnum'
 *               displayName:
 *                 type: string
 *                 description: Provider display name
 */
export interface IOAuthProviders {
  providers: Array<{
    name: OAuthProviderEnum;
    displayName: string;
  }>;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IOAuthAuthUrl:
 *       type: object
 *       required:
 *         - authUrl
 *         - state
 *       properties:
 *         authUrl:
 *           type: string
 *           format: uri
 *           description: OAuth authorization URL
 *         state:
 *           type: string
 *           description: State parameter for CSRF protection
 */
export interface IOAuthAuthUrl {
  authUrl: string;
  state: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IOAuthLoginDone:
 *       type: object
 *       required:
 *         - message
 *         - user
 *         - token
 *       properties:
 *         message:
 *           type: string
 *           description: Success message
 *         user:
 *           type: object
 *           description: User information
 *         token:
 *           type: object
 *           description: Authentication token
 *         requiresProfileCompletion:
 *           type: boolean
 *           description: Whether user needs to complete profile setup
 */
export interface IOAuthLoginDone {
  message: string;
  user: any;
  token: any;
  requiresProfileCompletion?: boolean;
}

/**
 * Helper function to convert database models to domain models
 */
export function toOAuthAccountDomain(account: any): IOAuthAccount {
  return {
    id: account.id,
    provider: account.provider as OAuthProviderEnum,
    providerAccountId: account.providerAccountId,
    userId: account.userId,
    metadata: account.metadata,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}

/**
 * Helper function to validate OAuth provider
 */
export function isValidOAuthProvider(
  provider: string
): provider is OAuthProviderEnum {
  return Object.values(OAuthProviderEnum).includes(
    provider as OAuthProviderEnum
  );
}

/**
 * Helper function to normalize OAuth provider string to enum
 */
export function normalizeOAuthProvider(provider: string): OAuthProviderEnum {
  const upperProvider = provider.toUpperCase() as OAuthProviderEnum;
  if (!isValidOAuthProvider(upperProvider)) {
    throw new Error(`Unsupported OAuth provider: ${provider}`);
  }
  return upperProvider;
}
