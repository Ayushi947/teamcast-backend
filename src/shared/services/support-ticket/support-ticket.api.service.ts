import { ApiService } from '../core/api.service';

import {
  ISupportTicket,
  ISupportTicketCreate,
  ISupportTicketUpdate,
  ISupportTicketFilter,
  ISupportTicketSort,
  ISupportTicketComment,
  ISupportTicketCommentCreateRequest,
  ISupportTicketRcaRequest,
  ISupportTicketRcaResponse,
  ISupportTicketResolutionRequest,
  ISupportTicketResolutionResponse,
} from '../../models/domain/support-ticket/support-ticket.domain';

import { singleton } from '../../decorators/singleton';
import { ISupportTicketListApiResponse } from '../../models/api/support-ticket/support-ticket.api';
import {
  SupportTicketPriorityEnum,
  SupportTicketStatusEnum,
} from '../../models/common/enums';
import { IPaginationRequest } from '../../models/api/common/common.api';
import {
  ISupportTicketStatistics,
  ISupportTicketStatisticsFilter,
} from '../../models/domain/support-ticket/support-ticket-statistics.domain';

/**
 * API endpoints for support ticket related operations
 */
const SUPPORT_TICKET_ENDPOINTS = {
  BASE: '/support-tickets',
  BY_ID: '/support-tickets/:ticketId',
  ASSIGN: '/support-tickets/:ticketId/assign',
  ESCALATE: '/support-tickets/:ticketId/escalate',
  RATE: '/support-tickets/:ticketId/rating',
  CHANGE_STATUS: '/support-tickets/:ticketId/status',
  CREATED_BY_USER: '/support-tickets/created-by/:userId',
  CHANGE_PRIORITY: '/support-tickets/:ticketId/priority',
  COMMENTS: '/support-tickets/:ticketId/comments',
  RCA: '/support-tickets/:ticketId/rca',
  RESOLUTION: '/support-tickets/:ticketId/resolution',
  STATISTICS: '/support-tickets/statistics',
  ASSIGNED_TO_USER: '/support-tickets/assigned-to/:assignedUserId',
} as const;

@singleton
export class SupportTicketApiService extends ApiService {
  /**
   * Get support tickets list with filters and pagination
   */
  public async listTickets(
    filter: ISupportTicketFilter & IPaginationRequest,
    sort?: ISupportTicketSort
  ): Promise<ISupportTicketListApiResponse> {
    try {
      const params = new URLSearchParams();

      // Add filters
      if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              value.forEach((v) => params.append(key, v.toString()));
            } else {
              params.append(key, value.toString());
            }
          }
        });
      }

      // Add sort parameters
      if (sort) {
        params.append('sortBy', sort.field);
        params.append('sortOrder', sort.direction);
      }

      return await this.apiGet<ISupportTicketListApiResponse>(
        `${SUPPORT_TICKET_ENDPOINTS.BASE}?${params.toString()}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get support ticket by ID
   */
  public async getTicketByTicketId(ticketId: string): Promise<ISupportTicket> {
    try {
      return await this.apiGet<ISupportTicket>(
        SUPPORT_TICKET_ENDPOINTS.BY_ID.replace(':ticketId', ticketId)
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
  /**
   * Get support tickets assigned to a specific user
   */
  public async getTicketsAssignedToUserId(
    assignedUserId: string,
    filter: ISupportTicketFilter & IPaginationRequest,
    sort?: ISupportTicketSort
  ): Promise<ISupportTicketListApiResponse> {
    try {
      const params = new URLSearchParams();

      // Add filters
      if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              value.forEach((v) => params.append(key, v.toString()));
            } else {
              params.append(key, value.toString());
            }
          }
        });
      }

      // Add sort parameters
      if (sort) {
        params.append('sortBy', sort.field);
        params.append('sortOrder', sort.direction);
      }

      return await this.apiGet<ISupportTicketListApiResponse>(
        `${SUPPORT_TICKET_ENDPOINTS.ASSIGNED_TO_USER.replace(':assignedUserId', assignedUserId)}?${params.toString()}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a new support ticket
   */
  public async createTicket(
    data: ISupportTicketCreate
  ): Promise<ISupportTicket> {
    try {
      return await this.apiPost<ISupportTicket>(
        SUPPORT_TICKET_ENDPOINTS.BASE,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update support ticket
   */
  public async updateTicketByTicketId(
    ticketId: string,
    data: ISupportTicketUpdate
  ): Promise<ISupportTicket> {
    try {
      return await this.apiPatch<ISupportTicket>(
        SUPPORT_TICKET_ENDPOINTS.BY_ID.replace(':ticketId', ticketId),
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete support ticket
   */
  public async deleteTicketByTicketId(
    ticketId: string
  ): Promise<{ success: boolean }> {
    try {
      return await this.apiDelete<{ success: boolean }>(
        SUPPORT_TICKET_ENDPOINTS.BY_ID.replace(':ticketId', ticketId)
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get all tickets for a specific user
   */
  public async getTicketsByUserId(
    userId: string,
    filter: ISupportTicketFilter & IPaginationRequest,
    sort?: ISupportTicketSort
  ): Promise<ISupportTicketListApiResponse> {
    try {
      const params = new URLSearchParams();

      // Add filters
      if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              value.forEach((v) => params.append(key, v.toString()));
            } else {
              params.append(key, value.toString());
            }
          }
        });
      }

      // Add sort parameters
      if (sort) {
        params.append('sortBy', sort.field);
        params.append('sortOrder', sort.direction);
      }

      return await this.apiGet<ISupportTicketListApiResponse>(
        `${SUPPORT_TICKET_ENDPOINTS.CREATED_BY_USER.replace(':userId', userId)}?${params.toString()}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Assign support ticket to a user
   */
  public async assignTicket(
    ticketId: string,
    assignedUserId: string
  ): Promise<ISupportTicket> {
    try {
      return await this.apiPatch<ISupportTicket>(
        SUPPORT_TICKET_ENDPOINTS.ASSIGN.replace(':ticketId', ticketId),
        { assignedUserId }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Escalate support ticket
   */
  public async escalateTicket(
    ticketId: string,
    escalatedToUserId: string,
    escalationReason: string
  ): Promise<ISupportTicket> {
    try {
      return await this.apiPatch<ISupportTicket>(
        SUPPORT_TICKET_ENDPOINTS.ESCALATE.replace(':ticketId', ticketId),
        { escalatedToUserId, escalationReason }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Rate support ticket
   */
  public async addCustomerRating(
    ticketId: string,
    rating: number,
    feedback?: string
  ): Promise<ISupportTicket> {
    try {
      return await this.apiPatch<ISupportTicket>(
        SUPPORT_TICKET_ENDPOINTS.RATE.replace(':ticketId', ticketId),
        { customerRating: rating, customerFeedback: feedback }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Change support ticket status
   */
  public async changeStatus(
    ticketId: string,
    status: SupportTicketStatusEnum,
    reason?: string
  ): Promise<ISupportTicket> {
    try {
      return await this.apiPatch<ISupportTicket>(
        SUPPORT_TICKET_ENDPOINTS.CHANGE_STATUS.replace(':ticketId', ticketId),
        { status, reason }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Change support ticket priority
   */
  public async changePriority(
    ticketId: string,
    priority: SupportTicketPriorityEnum
  ): Promise<ISupportTicket> {
    try {
      return await this.apiPatch<ISupportTicket>(
        SUPPORT_TICKET_ENDPOINTS.CHANGE_PRIORITY.replace(':ticketId', ticketId),
        { priority }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get comments for a support ticket
   */
  public async getTicketComments(
    ticketId: string
  ): Promise<ISupportTicketComment[]> {
    try {
      return await this.apiGet<ISupportTicketComment[]>(
        SUPPORT_TICKET_ENDPOINTS.COMMENTS.replace(':ticketId', ticketId)
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Add a comment to a support ticket
   */
  public async addTicketComment(
    ticketId: string,
    comment: ISupportTicketCommentCreateRequest
  ): Promise<ISupportTicketComment> {
    try {
      return await this.apiPost<ISupportTicketComment>(
        SUPPORT_TICKET_ENDPOINTS.COMMENTS.replace(':ticketId', ticketId),
        comment
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Add Root Cause Analysis (RCA) to a support ticket
   */
  public async addRootCauseAnalysis(
    ticketId: string,
    data: ISupportTicketRcaRequest
  ): Promise<ISupportTicketRcaResponse> {
    try {
      return await this.apiPost<ISupportTicketRcaResponse>(
        SUPPORT_TICKET_ENDPOINTS.RCA.replace(':ticketId', ticketId),
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update Root Cause Analysis (RCA) for a support ticket
   */
  public async updateRootCauseAnalysis(
    ticketId: string,
    data: ISupportTicketRcaRequest
  ): Promise<ISupportTicketRcaResponse> {
    try {
      return await this.apiPut<ISupportTicketRcaResponse>(
        SUPPORT_TICKET_ENDPOINTS.RCA.replace(':ticketId', ticketId),
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get Root Cause Analysis (RCA) for a support ticket
   */
  public async getRootCauseAnalysis(
    ticketId: string
  ): Promise<ISupportTicketRcaResponse> {
    try {
      return await this.apiGet<ISupportTicketRcaResponse>(
        SUPPORT_TICKET_ENDPOINTS.RCA.replace(':ticketId', ticketId)
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Add resolution notes to a support ticket
   */
  public async addResolutionNotes(
    ticketId: string,
    data: ISupportTicketResolutionRequest
  ): Promise<ISupportTicketResolutionResponse> {
    try {
      return await this.apiPost<ISupportTicketResolutionResponse>(
        SUPPORT_TICKET_ENDPOINTS.RESOLUTION.replace(':ticketId', ticketId),
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update resolution notes for a support ticket
   */
  public async updateResolutionNotes(
    ticketId: string,
    data: ISupportTicketResolutionRequest
  ): Promise<ISupportTicketResolutionResponse> {
    try {
      return await this.apiPut<ISupportTicketResolutionResponse>(
        SUPPORT_TICKET_ENDPOINTS.RESOLUTION.replace(':ticketId', ticketId),
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get resolution notes for a support ticket
   */
  public async getResolutionNotes(
    ticketId: string
  ): Promise<ISupportTicketResolutionResponse> {
    try {
      return await this.apiGet<ISupportTicketResolutionResponse>(
        SUPPORT_TICKET_ENDPOINTS.RESOLUTION.replace(':ticketId', ticketId)
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get support ticket statistics
   */
  public async getTicketStatistics(
    filters: ISupportTicketStatisticsFilter
  ): Promise<ISupportTicketStatistics> {
    try {
      const params = new URLSearchParams();

      // Add filters as query parameters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              value.forEach((v) => params.append(key, v.toString()));
            } else {
              params.append(key, value.toString());
            }
          }
        });
      }

      return await this.apiGet<ISupportTicketStatistics>(
        `${SUPPORT_TICKET_ENDPOINTS.STATISTICS}?${params.toString()}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
