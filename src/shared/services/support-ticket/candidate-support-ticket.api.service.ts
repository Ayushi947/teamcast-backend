import { ApiService } from '../core/api.service';

import {
  ISupportTicketSort,
  ISupportTicketListItemResponse,
} from '../../models/domain/support-ticket/support-ticket.domain';
import { singleton } from '../../decorators/singleton';
import {
  ICandidateSupportTicketFilter,
  ICandidateSupportTicketCreate,
} from '../../models/domain/support-ticket/candidate-support-ticket.domain';
import { IPaginationRequest } from '../../models/api/common/common.api';
import { ICandidateSupportTicketCreateApiRequest } from '../../models/api/support-ticket/candidate-support-ticket.api';

/**
 * API endpoints for candidate support ticket related operations
 */
const CANDIDATE_SUPPORT_TICKET_ENDPOINTS = {
  BASE: '/support-tickets/candidates',
} as const;

@singleton
export class CandidateSupportTicketApiService extends ApiService {
  /**
   * Get candidate support tickets list with filters and pagination
   */
  public async getCandidateSupportTickets(
    candidateId: string,
    filter: ICandidateSupportTicketFilter & IPaginationRequest,
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
        `${CANDIDATE_SUPPORT_TICKET_ENDPOINTS.BASE}/${candidateId}/tickets?${params.toString()}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a new candidate support ticket
   */
  public async createTicket(
    candidateId: string,
    data: ICandidateSupportTicketCreate
  ): Promise<ICandidateSupportTicketCreateApiRequest> {
    try {
      const formData = new FormData();

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

      return await this.apiPost<ICandidateSupportTicketCreateApiRequest>(
        `${CANDIDATE_SUPPORT_TICKET_ENDPOINTS.BASE}/${candidateId}/tickets`,
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
