import { IActivityLogGetApiResponse } from '../../models/api/activity/activity.log.api';
import { ApiService } from '../core/api.service';
import {
  IActivityLog,
  IActivityLogCreate,
  IActivityLogCreated,
  IActivityLogFilters,
} from '../../models/domain/activity/activity.log.domain';
import { IPaginationRequest } from '../../models/api/common/common.api';
import { singleton } from '../../decorators/singleton';

/**
 * API endpoints for activity log related operations
 */
const ACTIVITY_LOG_ENDPOINTS = {
  BASE: '/activity',
  USER_LOGS: '/activity/user',
} as const;

/**
 * Service for handling activity log related API operations
 */
@singleton
export class ActivityLogApiService extends ApiService {
  /**
   * Retrieves a list of activity logs with optional filtering and pagination
   * @param filter - Optional filter and pagination parameters
   * @returns Promise resolving to paginated activity logs
   * @throws Error if the API request fails
   */
  public async getActivityLogs(
    filter?: IActivityLogFilters & IPaginationRequest
  ): Promise<IActivityLogGetApiResponse> {
    try {
      return await this.apiGet<IActivityLogGetApiResponse>(
        `${ACTIVITY_LOG_ENDPOINTS.BASE}${filter ? this.buildQueryString(filter) : ''}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Retrieves a specific activity log by ID
   * @param activityLogId - The ID of the activity log to retrieve
   * @returns Promise resolving to the activity log details
   * @throws Error if the API request fails
   */
  public async getActivityLog(activityLogId: string): Promise<IActivityLog> {
    try {
      return await this.apiGet<IActivityLog>(
        `${ACTIVITY_LOG_ENDPOINTS.BASE}/${activityLogId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Creates a new activity log
   * @param data - The activity log data to create
   * @returns Promise resolving to the created activity log
   * @throws Error if the API request fails
   */
  public async createActivityLog(
    data: IActivityLogCreate
  ): Promise<IActivityLogCreated> {
    try {
      return await this.apiPost<IActivityLogCreated>(
        ACTIVITY_LOG_ENDPOINTS.BASE,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Retrieves activity logs for a specific user with optional filtering and pagination
   * @param userId - The ID of the user whose activity logs to retrieve
   * @param filter - Optional filter and pagination parameters
   * @returns Promise resolving to paginated user activity logs
   * @throws Error if the API request fails
   */
  public async getUserActivityLogs(
    userId: string,
    filter?: IActivityLogFilters & IPaginationRequest
  ): Promise<IActivityLogGetApiResponse> {
    try {
      const queryParams = filter ? this.buildQueryString(filter) : '';
      return await this.apiGet<IActivityLogGetApiResponse>(
        `${ACTIVITY_LOG_ENDPOINTS.USER_LOGS}/${userId}${queryParams}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Deletes a specific activity log by ID
   * @param activityLogId - The ID of the activity log to delete
   * @returns Promise resolving when the activity log is deleted
   * @throws Error if the API request fails
   */
  public async deleteActivityLog(activityLogId: string): Promise<void> {
    try {
      await this.apiDelete<void>(
        `${ACTIVITY_LOG_ENDPOINTS.BASE}/${activityLogId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
