import { ApiService } from '../core/api.service';

import type {
  IClientUserCreate,
  IClientUserUpdate,
  IClientUser,
  IClientUserFilterQuery,
  IClientUserActivateDeactivate,
} from '../../models/domain/client/user.domain';
import {
  IPaginatedResponse,
  IPaginationRequest,
} from '../../models/api/common/common.api';
import { singleton } from '../../decorators/singleton';

/**
 * API endpoints for user management related operations
 */
const USER_MANAGEMENT_ENDPOINTS = {
  BASE: '/client/users',
  STATUS: '/client/users/:userId/status',
} as const;

@singleton
export class ClientUserManagementApiService extends ApiService {
  /**
   * Get list of users
   */
  public async getUsers(
    filter: IClientUserFilterQuery & IPaginationRequest
  ): Promise<IPaginatedResponse<IClientUser>> {
    try {
      return await this.apiGet<IPaginatedResponse<IClientUser>>(
        `${USER_MANAGEMENT_ENDPOINTS.BASE}${filter ? this.buildQueryString(filter) : ''}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a specific user
   */
  public async getUser(userId: string): Promise<IClientUser> {
    try {
      return await this.apiGet<IClientUser>(
        `${USER_MANAGEMENT_ENDPOINTS.BASE}/${userId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a new user
   */
  public async createUser(data: IClientUserCreate): Promise<IClientUser> {
    try {
      return await this.apiPost<IClientUser>(
        USER_MANAGEMENT_ENDPOINTS.BASE,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update a user
   */
  public async updateUser(
    userId: string,
    data: IClientUserUpdate
  ): Promise<IClientUser> {
    try {
      return await this.apiPatch<IClientUser>(
        `${USER_MANAGEMENT_ENDPOINTS.BASE}/${userId}`,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete a user
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
   * Update user status
   */
  public async updateUserStatus(
    userId: string,
    data: IClientUserActivateDeactivate
  ): Promise<IClientUser> {
    try {
      return await this.apiPatch<IClientUser>(
        USER_MANAGEMENT_ENDPOINTS.STATUS.replace(':userId', userId),
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
