import { ApiService } from '../core/api.service';
import { singleton } from '../../decorators/singleton';
import { AxiosInstance } from 'axios';
import {
  IOIDCAuthorizeResponse,
  IOIDCDeelStatus,
} from '../../models/domain/oidc/oidc.domain';

/**
 * API endpoints for OIDC operations
 */
const OIDC_ENDPOINTS = {
  AUTHORIZE: '/oidc/authorize',
  DEEL_STATUS: '/oidc/deel/status',
} as const;

/**
 * Service for handling OIDC related API operations
 * Manages OAuth2/OIDC authorization flow with Deel
 */
@singleton
export class OIDCApiService extends ApiService {
  constructor(apiClient: AxiosInstance) {
    super(apiClient);
  }

  /**
   * Initiate OAuth2 authorization flow with Deel
   * Generates authorization code and returns redirect URL
   *
   * @param params - OAuth2 authorization parameters from Deel
   * @returns Promise resolving to redirect URL with authorization code
   * @throws Error if the API request fails or user is not authenticated
   */
  public async authorize(params: {
    response_type: string;
    client_id: string;
    redirect_uri: string;
    scope: string;
    state?: string;
  }): Promise<IOIDCAuthorizeResponse> {
    try {
      const queryParams = new URLSearchParams({
        response_type: params.response_type,
        client_id: params.client_id,
        redirect_uri: params.redirect_uri,
        scope: params.scope,
        ...(params.state && { state: params.state }),
      });

      // This endpoint will redirect, so we need to handle it differently
      // The backend will generate auth code and return redirect URL
      const response = await this.apiGet<IOIDCAuthorizeResponse>(
        `${OIDC_ENDPOINTS.AUTHORIZE}?${queryParams.toString()}`,
        {
          // Prevent automatic redirects
          maxRedirects: 0,
          validateStatus: (status: number) => status >= 200 && status < 400,
        }
      );

      return response;
    } catch (error: any) {
      // Handle redirect response
      if (error.response?.status === 302 || error.response?.status === 301) {
        const redirectUrl = error.response.headers.location;
        if (redirectUrl) {
          return { redirect_url: redirectUrl };
        }
      }
      throw this.handleError(error);
    }
  }

  /**
   * Check if Deel SSO is enabled for authenticated user's organization
   *
   * @returns Promise resolving to Deel status
   * @throws Error if the API request fails
   */
  public async getDeelStatus(): Promise<IOIDCDeelStatus> {
    try {
      return await this.apiGet<IOIDCDeelStatus>(OIDC_ENDPOINTS.DEEL_STATUS);
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
