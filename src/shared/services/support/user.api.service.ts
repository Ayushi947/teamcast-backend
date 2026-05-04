import { ApiService } from '../core/api.service';

import type {
  ISupportUserCreate,
  ISupportUserCreateResponse,
  ISupportUserUpdate,
  ISupportUser,
  ISupportUserFilterQuery,
  ISupportUserActivateDeactivate,
  ISupportUserPasswordChange,
  ISupportUserRecruiterAnalytics,
} from '../../models/domain/support/user.domain';
import {
  IPaginatedResponse,
  IPaginationRequest,
} from '../../models/api/common/common.api';

/**
 * API endpoints for support user management related operations
 */
const SUPPORT_USER_MANAGEMENT_ENDPOINTS = {
  BASE: '/support/users',
  STATUS: '/support/users/:userId/status',
  ANALYTICS: '/support/users/analytics/recruiters',
} as const;

export class SupportUserManagementApiService extends ApiService {
  /**
   * Get list of support users
   */
  public async getSupportUsers(
    filter: ISupportUserFilterQuery & IPaginationRequest
  ): Promise<IPaginatedResponse<ISupportUser>> {
    try {
      return await this.apiGet<IPaginatedResponse<ISupportUser>>(
        `${SUPPORT_USER_MANAGEMENT_ENDPOINTS.BASE}${filter ? this.buildQueryString(filter) : ''}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a specific support user
   */
  public async getSupportUser(supportUserId: string): Promise<ISupportUser> {
    try {
      return await this.apiGet<ISupportUser>(
        `${SUPPORT_USER_MANAGEMENT_ENDPOINTS.BASE}/${supportUserId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a new support user
   */
  public async createSupportUser(
    data: ISupportUserCreate
  ): Promise<ISupportUserCreateResponse> {
    try {
      return await this.apiPost<ISupportUserCreateResponse>(
        SUPPORT_USER_MANAGEMENT_ENDPOINTS.BASE,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update a support user
   */
  public async updateSupportUser(
    supportUserId: string,
    data: ISupportUserUpdate
  ): Promise<ISupportUser> {
    try {
      return await this.apiPatch<ISupportUser>(
        `${SUPPORT_USER_MANAGEMENT_ENDPOINTS.BASE}/${supportUserId}`,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete a support user
   */
  public async deleteSupportUser(supportUserId: string): Promise<boolean> {
    try {
      return await this.apiDelete<boolean>(
        `${SUPPORT_USER_MANAGEMENT_ENDPOINTS.BASE}/${supportUserId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Change support user password
   */
  public async changeSupportUserPassword(
    supportUserId: string,
    data: ISupportUserPasswordChange
  ): Promise<string> {
    try {
      return await this.apiPatch<string>(
        `${SUPPORT_USER_MANAGEMENT_ENDPOINTS.BASE}/${supportUserId}/password`,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update support user status
   */
  public async updateSupportUserStatus(
    supportUserId: string,
    data: ISupportUserActivateDeactivate
  ): Promise<ISupportUser> {
    try {
      return await this.apiPatch<ISupportUser>(
        SUPPORT_USER_MANAGEMENT_ENDPOINTS.STATUS.replace(
          ':userId',
          supportUserId
        ),
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get account manager recruiters analytics
   * @param startDate - The start date for filtering analytics data
   * @param endDate - The end date for filtering analytics data
   * @returns The analytics data for the account manager recruiters
   */
  public async getAccountManagerRecruitersAnalytics(
    startDate?: string,
    endDate?: string
  ): Promise<ISupportUserRecruiterAnalytics[]> {
    try {
      return await this.apiPost<ISupportUserRecruiterAnalytics[]>(
        `${SUPPORT_USER_MANAGEMENT_ENDPOINTS.ANALYTICS}`,
        { startDate, endDate }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
