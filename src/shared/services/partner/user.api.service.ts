import { ApiService } from '../core/api.service';

import type {
  IPartnerUserCreate,
  IPartnerUserUpdate,
  IPartnerUser,
  IPartnerUserFilterQuery,
  IPartnerUserActivateDeactivate,
} from '../../models/domain/partner/user.domain';
import {
  IPaginatedResponse,
  IPaginationRequest,
} from '../../models/api/common/common.api';
import { singleton } from '../../decorators/singleton';

/**
 * API endpoints for partner user management related operations
 */
const USER_MANAGEMENT_ENDPOINTS = {
  BASE: '/partner/users',
  STATUS: '/partner/users/:userId/status',
} as const;

@singleton
export class PartnerUserManagementApiService extends ApiService {
  /**
   * Get list of partner users
   */
  public async getUsers(
    filter: IPartnerUserFilterQuery & IPaginationRequest
  ): Promise<IPaginatedResponse<IPartnerUser>> {
    try {
      return await this.apiGet<IPaginatedResponse<IPartnerUser>>(
        `${USER_MANAGEMENT_ENDPOINTS.BASE}${filter ? this.buildQueryString(filter) : ''}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a specific partner user
   */
  public async getUser(userId: string): Promise<IPartnerUser> {
    try {
      return await this.apiGet<IPartnerUser>(
        `${USER_MANAGEMENT_ENDPOINTS.BASE}/${userId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a new partner user
   */
  public async createUser(data: IPartnerUserCreate): Promise<IPartnerUser> {
    try {
      return await this.apiPost<IPartnerUser>(
        USER_MANAGEMENT_ENDPOINTS.BASE,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update a partner user
   */
  public async updateUser(
    userId: string,
    data: IPartnerUserUpdate
  ): Promise<IPartnerUser> {
    try {
      return await this.apiPatch<IPartnerUser>(
        `${USER_MANAGEMENT_ENDPOINTS.BASE}/${userId}`,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete a partner user
   */
  public async deleteUser(userId: string): Promise<boolean> {
    try {
      return await this.apiDelete<boolean>(
        `${USER_MANAGEMENT_ENDPOINTS.BASE}/${userId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update partner user status
   */
  public async updateUserStatus(
    userId: string,
    data: IPartnerUserActivateDeactivate
  ): Promise<IPartnerUser> {
    try {
      return await this.apiPatch<IPartnerUser>(
        USER_MANAGEMENT_ENDPOINTS.STATUS.replace(':userId', userId),
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
