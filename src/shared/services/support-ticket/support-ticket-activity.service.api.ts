import { ApiService } from '../core/api.service';

import {
  ISupportTicketActivityLogFilter,
  ISupportTicketActivityLogSort,
  ISupportTicketActivityLogPagination,
  ISupportTicketActivitySummaryFilter,
  ISupportTicketUserActivityLogFilter,
} from '../../models/domain/support-ticket/support-ticket-activity.domain';
import {
  ISupportTicketActivityLogsApiResponse,
  ISupportTicketActivitySummaryApiResponse,
  ISupportTicketUserActivityLogsApiResponse,
} from '../../models/api/support-ticket/support-ticket-activity.api';
import { singleton } from '../../decorators/singleton';

/**
 * API endpoints for support ticket activity related operations
 */
const SUPPORT_TICKET_ACTIVITY_ENDPOINTS = {
  BASE: '/support-tickets',
  TICKET_ACTIVITY_LOGS: '/support-tickets/:ticketId/activity-logs',
  ALL_ACTIVITY_LOGS: '/support-tickets/activity-logs',
  ACTIVITY_SUMMARY: '/support-tickets/activity-summary',
  USER_ACTIVITY_LOGS: '/support-tickets/users/:userId/activity-logs',
} as const;

@singleton
export class SupportTicketActivityApiService extends ApiService {
  // ==================== ACTIVITY LOG METHODS ====================

  /**
   * Get activity logs for a specific ticket
   */
  public async getTicketActivityLogs(
    ticketId: string,
    filters?: ISupportTicketActivityLogFilter,
    pagination?: ISupportTicketActivityLogPagination
  ): Promise<ISupportTicketActivityLogsApiResponse> {
    try {
      const params = new URLSearchParams();

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              value.forEach((v) => params.append(key, v.toString()));
            } else if (value instanceof Date) {
              params.append(key, value.toISOString());
            } else {
              params.append(key, value.toString());
            }
          }
        });
      }

      if (pagination) {
        params.append('page', pagination.page.toString());
        params.append('limit', pagination.limit.toString());
      }

      return await this.apiGet<ISupportTicketActivityLogsApiResponse>(
        `${SUPPORT_TICKET_ACTIVITY_ENDPOINTS.TICKET_ACTIVITY_LOGS.replace(':ticketId', ticketId)}?${params.toString()}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get all activity logs with comprehensive filtering
   */
  public async getAllActivityLogs(
    filters?: ISupportTicketActivityLogFilter,
    sort?: ISupportTicketActivityLogSort,
    pagination?: ISupportTicketActivityLogPagination
  ): Promise<ISupportTicketActivityLogsApiResponse> {
    try {
      const params = new URLSearchParams();

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              value.forEach((v) => params.append(key, v.toString()));
            } else if (value instanceof Date) {
              params.append(key, value.toISOString());
            } else {
              params.append(key, value.toString());
            }
          }
        });
      }

      if (sort) {
        params.append('sortBy', sort.field);
        params.append('sortOrder', sort.direction);
      }

      if (pagination) {
        params.append('page', pagination.page.toString());
        params.append('limit', pagination.limit.toString());
      }

      return await this.apiGet<ISupportTicketActivityLogsApiResponse>(
        `${SUPPORT_TICKET_ACTIVITY_ENDPOINTS.ALL_ACTIVITY_LOGS}?${params.toString()}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get activity summary for support admin dashboard
   */
  public async getActivitySummary(
    filters?: ISupportTicketActivitySummaryFilter
  ): Promise<ISupportTicketActivitySummaryApiResponse> {
    try {
      const params = new URLSearchParams();

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              value.forEach((v) => params.append(key, v.toString()));
            } else if (value instanceof Date) {
              params.append(key, value.toISOString());
            } else {
              params.append(key, value.toString());
            }
          }
        });
      }

      return await this.apiGet<ISupportTicketActivitySummaryApiResponse>(
        `${SUPPORT_TICKET_ACTIVITY_ENDPOINTS.ACTIVITY_SUMMARY}?${params.toString()}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get user activity logs
   */
  public async getUserActivityLogs(
    userId: string,
    filters?: ISupportTicketUserActivityLogFilter,
    pagination?: ISupportTicketActivityLogPagination
  ): Promise<ISupportTicketUserActivityLogsApiResponse> {
    try {
      const params = new URLSearchParams();

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              value.forEach((v) => params.append(key, v.toString()));
            } else if (value instanceof Date) {
              params.append(key, value.toISOString());
            } else {
              params.append(key, value.toString());
            }
          }
        });
      }

      if (pagination) {
        params.append('page', pagination.page.toString());
        params.append('limit', pagination.limit.toString());
      }

      return await this.apiGet<ISupportTicketUserActivityLogsApiResponse>(
        `${SUPPORT_TICKET_ACTIVITY_ENDPOINTS.USER_ACTIVITY_LOGS.replace(':userId', userId)}?${params.toString()}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
