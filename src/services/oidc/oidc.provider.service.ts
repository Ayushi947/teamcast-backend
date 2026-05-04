/**
 * OIDC Provider Service for Deel SSO Integration
 *
 * This service implements TeamCast as an OpenID Connect (OIDC) Provider
 * allowing users to Single Sign-On to Deel after authenticating with TeamCast
 * (either via Google OAuth or Email/Password)
 *
 * Architecture:
 * Google Identity → TeamCast (OIDC Provider) → Deel (OIDC Client/Relying Party)
 *
 * Environment-driven Configuration:
 * - DEV: devapi.teamcast.ai (backend), dev.teamcast.ai (frontend)
 * - PROD: api.teamcast.ai (backend), teamcast.ai (frontend)
 */

import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { ENV } from '@/config/env';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/shared/utils/logger';

// Create module-level Prisma instance
const prisma = new PrismaClient();

/**
 * OIDC Discovery Configuration
 * https://openid.net/specs/openid-connect-discovery-1_0.html
 */
interface OIDCConfiguration {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  jwks_uri: string;
  response_types_supported: string[];
  subject_types_supported: string[];
  id_token_signing_alg_values_supported: string[];
  scopes_supported: string[];
  token_endpoint_auth_methods_supported: string[];
  claims_supported: string[];
}

/**
 * JSON Web Key Set (JWKS)
 * Used by Deel to verify ID Token signatures
 */
interface JWKSet {
  keys: JWK[];
}

interface JWK {
  kty: string;
  use: string;
  kid: string;
  alg: string;
  n: string;
  e: string;
}

/**
 * ID Token Claims (JWT Payload)
 * Contains user identity information
 */
interface IDTokenClaims {
  iss: string; // Issuer (TeamCast)
  sub: string; // Subject (User ID)
  aud: string; // Audience (Deel)
  exp: number; // Expiration timestamp
  iat: number; // Issued at timestamp
  email: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  auth_time?: number;
  nonce?: string;
}

/**
 * UserInfo Response
 * Standard OIDC UserInfo endpoint response
 */
interface UserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export class OIDCProviderService {
  private readonly privateKey: string;
  private readonly publicKey: string;
  private readonly issuer: string;
  private readonly keyId: string;
  private readonly tokenExpiry: number;

  constructor() {
    // Use OIDC_ISSUER if explicitly set, otherwise fall back to SERVER_URL
    // This allows dynamic configuration based on environment
    this.issuer = ENV.OIDC_ISSUER || ENV.SERVER_URL;
    this.keyId = ENV.OIDC_KEY_ID;
    this.tokenExpiry = ENV.OIDC_TOKEN_EXPIRY;

    logger.info(`[OIDC] Issuer configured as: ${this.issuer}`);

    try {
      this.privateKey = fs.readFileSync(ENV.OIDC_PRIVATE_KEY_PATH, 'utf8');
      this.publicKey = fs.readFileSync(ENV.OIDC_PUBLIC_KEY_PATH, 'utf8');
      logger.info('[OIDC] Keys loaded successfully');
    } catch (error) {
      logger.error('[OIDC] Failed to load keys', error);
      throw new Error('OIDC keys not found. Please generate RSA keys first.');
    }
  }

  /**
   * Get OIDC Discovery Configuration
   * Deel will fetch this endpoint to discover all OIDC endpoints
   * Endpoint: GET /.well-known/openid-configuration
   *
   * IMPORTANT: authorization_endpoint points to FRONTEND page (/oauth/authorize)
   * This page checks user authentication, shows loading animation, then calls
   * the backend /api/v1/oidc/authorize endpoint with JWT token
   */
  getDiscoveryConfiguration(): OIDCConfiguration {
    return {
      issuer: this.issuer,
      authorization_endpoint: `${ENV.FRONTEND_URL}/oauth/authorize`,
      token_endpoint: `${this.issuer}/api/v1/oidc/token`,
      userinfo_endpoint: `${this.issuer}/api/v1/oidc/userinfo`,
      jwks_uri: `${this.issuer}/api/v1/oidc/jwks`,
      response_types_supported: [
        'code',
        'id_token',
        'token id_token',
        'code id_token',
        'code token',
        'code token id_token',
      ],
      subject_types_supported: ['public'],
      id_token_signing_alg_values_supported: ['RS256'],
      scopes_supported: ['openid', 'profile', 'email'],
      token_endpoint_auth_methods_supported: [
        'client_secret_basic',
        'client_secret_post',
      ],
      claims_supported: [
        'sub',
        'iss',
        'aud',
        'exp',
        'iat',
        'email',
        'email_verified',
        'name',
        'given_name',
        'family_name',
        'picture',
      ],
    };
  }

  /**
   * Get JWKS (JSON Web Key Set)
   * Deel uses this to get public keys for verifying ID Token signatures
   * Endpoint: GET /api/v1/oidc/jwks
   */
  getJWKS(): JWKSet {
    try {
      // Convert PEM public key to JWK format
      const publicKeyObject = crypto.createPublicKey(this.publicKey);
      const jwk = publicKeyObject.export({ format: 'jwk' }) as any;

      return {
        keys: [
          {
            kty: 'RSA',
            use: 'sig',
            kid: this.keyId,
            alg: 'RS256',
            n: jwk.n,
            e: jwk.e,
          },
        ],
      };
    } catch (error) {
      logger.error('[OIDC] Failed to generate JWKS', error);
      throw new Error('Failed to generate JWKS');
    }
  }

  /**
   * Generate ID Token for a user
   * ID Token is a JWT containing user identity claims
   *
   * @param userId - TeamCast user ID
   * @param clientId - OIDC client ID (Deel's client ID)
   * @param nonce - Optional nonce for replay protection
   */
  async generateIDToken(
    userId: string,
    clientId: string,
    nonce?: string
  ): Promise<string> {
    try {
      // Fetch user from database
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Determine authentication method (Google OAuth or Email/Password)
      // If user has no password, they authenticated via Google OAuth
      const authMethod = !user.password ? 'google' : 'email_password';

      logger.info(
        `Generating ID Token for user ${user.email} (auth: ${authMethod})`
      );

      const now = Math.floor(Date.now() / 1000);

      // Build ID Token claims
      const claims: IDTokenClaims = {
        iss: this.issuer, // Who issued this token (TeamCast)
        sub: user.id, // Subject (unique user identifier)
        aud: clientId, // Audience (who this token is for - Deel)
        exp: now + this.tokenExpiry, // Expiration time
        iat: now, // Issued at
        email: user.email,
        email_verified: !!user.emailVerified,
        name: user.name || undefined,
        auth_time: now,
      };

      // Add optional nonce for replay protection
      if (nonce) {
        claims.nonce = nonce;
      }

      // Split name into given_name and family_name if available
      if (user.name) {
        const nameParts = user.name.split(' ');
        if (nameParts.length > 0) {
          claims.given_name = nameParts[0];
        }
        if (nameParts.length > 1) {
          claims.family_name = nameParts.slice(1).join(' ');
        }
      }

      // Sign the ID Token with RSA private key
      const idToken = jwt.sign(claims, this.privateKey, {
        algorithm: 'RS256',
        keyid: this.keyId,
      });

      logger.info(`ID Token generated successfully for user ${user.email}`);
      return idToken;
    } catch (error) {
      logger.error('Failed to generate ID Token', error);
      throw new Error('Failed to generate ID Token');
    }
  }

  /**
   * Initiate SSO to Deel
   * Generates ID Token and returns redirect URL to Deel
   *
   * @param userId - TeamCast user ID
   * @returns Deel SSO URL with ID Token
   */
  async initiateDeelSSO(userId: string): Promise<string> {
    try {
      if (!ENV.DEEL_ENABLED) {
        throw new Error('Deel integration is not enabled');
      }

      if (!ENV.DEEL_CLIENT_ID) {
        throw new Error('DEEL_CLIENT_ID is not configured');
      }

      if (!ENV.DEEL_REDIRECT_URI) {
        throw new Error('DEEL_REDIRECT_URI is not configured');
      }

      logger.info(`Initiating Deel SSO for user ${userId}`);

      // Get user's client information
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          clientUser: {
            include: {
              client: {
                include: {
                  settings: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Check if user belongs to a client
      const clientUser = user.clientUser;
      if (!clientUser || !clientUser.client) {
        throw new Error('User does not belong to any client organization');
      }

      // Check if Deel is enabled for this client
      const isDeelEnabled = clientUser.client.settings?.isDeelEnabled || false;
      if (!isDeelEnabled) {
        throw new Error(
          'Deel integration is not enabled for your organization. Please contact TeamCast support to enable this feature.'
        );
      }

      logger.info(
        `Deel is enabled for client ${clientUser.client.id}, proceeding with SSO`
      );

      // Generate ID Token
      const idToken = await this.generateIDToken(userId, ENV.DEEL_CLIENT_ID);

      // Build Deel SSO URL
      // Deel will validate this ID Token and log the user in
      const deelSSOUrl = `${ENV.DEEL_REDIRECT_URI}?id_token=${idToken}`;

      logger.info(`Deel SSO URL generated for user ${userId}`);
      return deelSSOUrl;
    } catch (error) {
      logger.error('Failed to initiate Deel SSO', error);
      throw error;
    }
  }

  /**
   * Get user information
   * Standard OIDC UserInfo endpoint
   * Endpoint: GET /api/v1/oidc/userinfo
   *
   * @param userId - TeamCast user ID
   */
  async getUserInfo(userId: string): Promise<UserInfo> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      const userInfo: UserInfo = {
        sub: user.id,
        email: user.email,
        email_verified: !!user.emailVerified,
        name: user.name || '',
      };

      // Split name into given_name and family_name if available
      if (user.name) {
        const nameParts = user.name.split(' ');
        if (nameParts.length > 0) {
          userInfo.given_name = nameParts[0];
        }
        if (nameParts.length > 1) {
          userInfo.family_name = nameParts.slice(1).join(' ');
        }
      }

      return userInfo;
    } catch (error) {
      logger.error('Failed to get user info', error);
      throw new Error('Failed to get user info');
    }
  }

  /**
   * Verify ID Token
   * Used internally to validate tokens
   *
   * @param idToken - JWT ID Token
   */
  verifyIDToken(idToken: string): IDTokenClaims {
    try {
      const decoded = jwt.verify(idToken, this.publicKey, {
        algorithms: ['RS256'],
        issuer: this.issuer,
      }) as IDTokenClaims;

      return decoded;
    } catch (error) {
      logger.error('Failed to verify ID Token', error);
      throw new Error('Invalid ID Token');
    }
  }

  /**
   * Generate authorization code
   * Used in OAuth2 Authorization Code flow
   *
   * @param userId - TeamCast user ID
   * @param clientId - OIDC client ID (Deel's client ID)
   * @param redirectUri - Redirect URI to send user back to Deel
   * @param scope - Requested scopes
   * @param state - State parameter for CSRF protection
   * @returns Authorization code
   */
  async generateAuthorizationCode(
    userId: string,
    clientId: string,
    redirectUri: string,
    scope: string,
    state?: string
  ): Promise<string> {
    try {
      // Generate secure random authorization code
      const authCode = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store authorization code in database
      await prisma.oauth_authorization_code.create({
        data: {
          code: authCode,
          userId,
          clientId,
          redirectUri,
          scope,
          state: state || null,
          expiresAt,
          used: false,
        },
      });

      logger.info(`Authorization code generated for user ${userId}`);
      return authCode;
    } catch (error) {
      logger.error('Failed to generate authorization code', error);
      throw new Error('Failed to generate authorization code');
    }
  }

  /**
   * Exchange authorization code for ID Token
   * Used in OAuth2 Authorization Code flow
   *
   * @param code - Authorization code
   * @param clientId - OIDC client ID
   * @param redirectUri - Redirect URI (must match the one used when generating code)
   * @returns ID Token
   */
  async exchangeCodeForToken(
    code: string,
    clientId: string,
    redirectUri: string
  ): Promise<{ id_token: string; token_type: string; expires_in: number }> {
    try {
      // Find authorization code in database
      const authCodeRecord = await prisma.oauth_authorization_code.findUnique({
        where: { code },
      });

      // Validate authorization code
      if (!authCodeRecord) {
        throw new Error('Invalid authorization code');
      }

      if (authCodeRecord.used) {
        throw new Error('Authorization code already used');
      }

      if (authCodeRecord.expiresAt < new Date()) {
        throw new Error('Authorization code expired');
      }

      if (authCodeRecord.clientId !== clientId) {
        throw new Error('Client ID mismatch');
      }

      if (authCodeRecord.redirectUri !== redirectUri) {
        throw new Error('Redirect URI mismatch');
      }

      // Mark code as used
      await prisma.oauth_authorization_code.update({
        where: { code },
        data: { used: true },
      });

      // Generate ID Token
      const idToken = await this.generateIDToken(
        authCodeRecord.userId,
        clientId,
        undefined
      );

      logger.info(
        `Authorization code exchanged for ID token for user ${authCodeRecord.userId}`
      );

      return {
        id_token: idToken,
        token_type: 'Bearer',
        expires_in: this.tokenExpiry,
      };
    } catch (error) {
      logger.error('Failed to exchange authorization code', error);
      throw error;
    }
  }

  /**
   * Close database connection
   * Call this on application shutdown
   */
  async close(): Promise<void> {
    await prisma.$disconnect();
  }
}
