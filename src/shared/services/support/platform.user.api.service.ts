import { ApiService } from '../core/api.service';

/**
 * API endpoints for platform user management (support admin only).
 * Mirrors the contract used by teamcast-ui shared service.
 */
const SUPPORT_PLATFORM_USER_ENDPOINTS = {
  BASE: '/support/platform-users',
  BY_EMAIL: '/support/platform-users/by-email',
} as const;

export class SupportPlatformUserApiService extends ApiService {
  /**
   * Delete a platform user by user ID (UUID)
   */
  public async deletePlatformUserById(
    userId: string,
    force?: boolean
  ): Promise<boolean> {
    try {
      const params = this.buildQueryString({ force });
      return await this.apiDelete<boolean>(
        `${SUPPORT_PLATFORM_USER_ENDPOINTS.BASE}/${userId}${params}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete a platform user by email
   */
  public async deletePlatformUserByEmail(
    email: string,
    force?: boolean
  ): Promise<boolean> {
    try {
      const params = this.buildQueryString({ email, force });
      return await this.apiDelete<boolean>(
        `${SUPPORT_PLATFORM_USER_ENDPOINTS.BY_EMAIL}${params}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
