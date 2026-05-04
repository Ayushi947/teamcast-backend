import { ApiService } from '../core/api.service';
import type {
  IAccountManagerTicketFilter,
  IAccountManagerTicketSort,
  IAccountManagerTicketPagination,
  IAccountManagerTicketStatistics,
  IAccountManagerTicketStatisticsFilter,
} from '../../models/domain/support-ticket/account-manager-ticket.domain';
import {
  IAccountManagerTicketAssignmentRequest,
  IAccountManagerTicketPriorityChangeRequest,
  IAccountManagerTicketCommentRequest,
  IAccountManagerTicketStatusChangeRequest,
  IAccountManagerTicketListApiResponse,
} from '../../models/api/support-ticket/account-manager-ticket.api';
import {
  ISupportTicket,
  ISupportTicketComment,
} from '../../models/domain/support-ticket/support-ticket.domain';

/**
 * API endpoints for account manager ticket operations
 */
const ACCOUNT_MANAGER_TICKET_ENDPOINTS = {
  BASE: '/support-tickets/account-manager',
  ASSIGN: '/support-tickets/account-manager/assign',
  PRIORITY: '/support-tickets/account-manager/priority',
  COMMENT: '/support-tickets/account-manager/comment',
  STATISTICS: '/support-tickets/account-manager/statistics',
  STATUS: '/support-tickets/account-manager/status',
} as const;

export class AccountManagerTicketsApiService extends ApiService {
  /**
   * Get all tickets for clients assigned to an account manager
   */
  public async getAccountManagerTickets(
    filters?: IAccountManagerTicketFilter,
    sort?: IAccountManagerTicketSort,
    pagination?: IAccountManagerTicketPagination
  ): Promise<IAccountManagerTicketListApiResponse> {
    try {
      const queryParams = this.buildTicketQueryParams(
        filters,
        sort,
        pagination
      );
      const queryString = queryParams ? this.buildQueryString(queryParams) : '';

      return await this.apiGet<IAccountManagerTicketListApiResponse>(
        `${ACCOUNT_MANAGER_TICKET_ENDPOINTS.BASE}${queryString}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Assign or reassign a ticket to a support user
   */
  public async assignTicket(
    data: IAccountManagerTicketAssignmentRequest
  ): Promise<ISupportTicket> {
    try {
      return await this.apiPost<ISupportTicket>(
        ACCOUNT_MANAGER_TICKET_ENDPOINTS.ASSIGN,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Change ticket priority with internal note
   */
  public async changeTicketPriority(
    data: IAccountManagerTicketPriorityChangeRequest
  ): Promise<ISupportTicket> {
    try {
      return await this.apiPost<ISupportTicket>(
        ACCOUNT_MANAGER_TICKET_ENDPOINTS.PRIORITY,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Add comment to ticket
   */
  public async addTicketComment(
    data: IAccountManagerTicketCommentRequest
  ): Promise<ISupportTicketComment> {
    try {
      return await this.apiPost<ISupportTicketComment>(
        ACCOUNT_MANAGER_TICKET_ENDPOINTS.COMMENT,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get statistics for account manager tickets
   */
  public async getAccountManagerTicketStatistics(
    data: IAccountManagerTicketStatisticsFilter
  ): Promise<IAccountManagerTicketStatistics> {
    try {
      return await this.apiGet<IAccountManagerTicketStatistics>(
        `${ACCOUNT_MANAGER_TICKET_ENDPOINTS.STATISTICS}?${this.buildQueryString(data)}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Change ticket status with internal note
   */
  public async changeTicketStatus(
    data: IAccountManagerTicketStatusChangeRequest
  ): Promise<ISupportTicket> {
    try {
      return await this.apiPost<ISupportTicket>(
        ACCOUNT_MANAGER_TICKET_ENDPOINTS.STATUS,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Helper method to build query parameters for ticket filtering, sorting, and pagination
   */
  private buildTicketQueryParams(
    filters?: IAccountManagerTicketFilter,
    sort?: IAccountManagerTicketSort,
    pagination?: IAccountManagerTicketPagination
  ): Record<string, any> | null {
    const params: Record<string, any> = {};

    // Add pagination parameters
    if (pagination) {
      if (pagination.page) params.page = pagination.page;
      if (pagination.limit) params.limit = pagination.limit;
    }

    // Add sorting parameters
    if (sort) {
      if (sort.field) params.sortBy = sort.field;
      if (sort.order) params.sortOrder = sort.order;
    }

    // Add filter parameters
    if (filters) {
      if (filters.search) params.search = filters.search;
      if (filters.clientId) params.clientId = filters.clientId;
      if (filters.assignedUserId)
        params.assignedUserId = filters.assignedUserId;
      if (filters.priority && filters.priority.length > 0) {
        params.priority = filters.priority;
      }
      if (filters.category && filters.category.length > 0) {
        params.category = filters.category;
      }
      if (filters.ticketType && filters.ticketType.length > 0) {
        params.ticketType = filters.ticketType;
      }
      if (filters.status && filters.status.length > 0) {
        params.status = filters.status;
      }
      if (filters.createdFrom) {
        params.createdFrom = filters.createdFrom.toISOString();
      }
      if (filters.createdTo) {
        params.createdTo = filters.createdTo.toISOString();
      }
    }

    return Object.keys(params).length > 0 ? params : null;
  }
}
