import { ApiService } from '../core/api.service';
import { singleton } from '../../decorators/singleton';
import { AxiosInstance } from 'axios';
import {
  IOAuthProviders,
  IOAuthAuthUrl,
  IOAuthLoginDone,
} from '../../models/domain/oauth/oauth.domain';

/**
 * API endpoints for OAuth operations
 */
const OAUTH_ENDPOINTS = {
  PROVIDERS: '/oauth/providers',
  AUTH_URL: (provider: string) => `/oauth/${provider}/auth-url`,
  CALLBACK: (provider: string) => `/oauth/${provider}/callback`,
} as const;

/**
 * Service for handling OAuth related API operations
 * Manages OAuth provider integration and authentication flow
 */
@singleton
export class OAuthApiService extends ApiService {
  constructor(apiClient: AxiosInstance) {
    super(apiClient);
  }

  /**
   * Get available OAuth providers
   * @param userType - Type of user (candidate, client, partner)
   * @returns Promise resolving to list of available OAuth providers
   * @throws Error if the API request fails
   */
  public async getProviders(userType: string): Promise<IOAuthProviders> {
    try {
      return await this.apiGet<IOAuthProviders>(
        `${OAUTH_ENDPOINTS.PROVIDERS}?userType=${userType}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Generate OAuth authorization URL
   * @param provider - OAuth provider (google, github, etc.)
   * @param userType - Type of user (candidate, client, partner)
   * @param redirectUri - Redirect URI after authorization
   * @returns Promise resolving to the authorization URL and state
   * @throws Error if the API request fails
   */
  public async generateAuthorizationUrl(
    provider: string,
    userType: string,
    redirectUri?: string
  ): Promise<IOAuthAuthUrl> {
    try {
      const params = new URLSearchParams({
        userType,
        ...(redirectUri && { returnUrl: redirectUri }),
      });

      return await this.apiGet<IOAuthAuthUrl>(
        `${OAUTH_ENDPOINTS.AUTH_URL(provider)}?${params.toString()}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle OAuth callback
   * @param provider - OAuth provider name
   * @param code - Authorization code from OAuth provider
   * @param state - Optional state parameter for verification
   * @returns Promise resolving to the OAuth callback result
   * @throws Error if the API request fails
   */
  public async handleCallback(
    provider: string,
    code: string,
    state?: string
  ): Promise<IOAuthLoginDone> {
    try {
      const params = new URLSearchParams({ code });
      if (state) {
        params.append('state', state);
      }

      return await this.apiGet<IOAuthLoginDone>(
        `${OAUTH_ENDPOINTS.CALLBACK(provider)}?${params.toString()}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
