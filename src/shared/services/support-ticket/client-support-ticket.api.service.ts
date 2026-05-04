import { ApiService } from '../core/api.service';

import {
  ISupportTicket,
  ISupportTicketSort,
  ISupportTicketListItemResponse,
} from '../../models/domain/support-ticket/support-ticket.domain';
import { singleton } from '../../decorators/singleton';
import {
  IClientSupportTicketFilter,
  IClientSupportTicketCreate,
} from '../../models/domain/support-ticket/client-support-ticket.domain';
import { IPaginationRequest } from '../../models/api/common/common.api';

/**
 * API endpoints for client support ticket related operations
 */
const CLIENT_SUPPORT_TICKET_ENDPOINTS = {
  BASE: '/support-tickets/client',
} as const;

@singleton
export class ClientSupportTicketApiService extends ApiService {
  /**
   * Get client support tickets list with filters and pagination
   */
  public async listTickets(
    filter: IClientSupportTicketFilter & IPaginationRequest,
    sort?: ISupportTicketSort
  ): Promise<ISupportTicketListItemResponse> {
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

      return await this.apiGet<ISupportTicketListItemResponse>(
        `${CLIENT_SUPPORT_TICKET_ENDPOINTS.BASE}?${params.toString()}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a specific client support ticket
   */
  public async getTicketById(ticketId: string): Promise<ISupportTicket> {
    try {
      return await this.apiGet<ISupportTicket>(
        `${CLIENT_SUPPORT_TICKET_ENDPOINTS.BASE}/${ticketId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a new client support ticket
   */
  public async createTicket(
    data: IClientSupportTicketCreate
  ): Promise<ISupportTicket> {
    try {
      const formData = new FormData();

      // Add basic ticket data
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('category', data.category);
      formData.append('targetId', data.targetId || '');
      formData.append('targetType', data.targetType || '');

      if (data.subcategory) {
        formData.append('subcategory', data.subcategory);
      }

      if (data.entityType) {
        formData.append('entityType', data.entityType);
      }

      if (data.metadata) {
        formData.append('metadata', JSON.stringify(data.metadata));
      }

      // Add attachments if any
      if (data.attachments && data.attachments.length > 0) {
        data.attachments.forEach((file) => {
          // Only handle browser File objects in this service
          if (file instanceof File) {
            formData.append('attachments', file);
          }
        });
      }

      return await this.apiPost<ISupportTicket>(
        CLIENT_SUPPORT_TICKET_ENDPOINTS.BASE,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
