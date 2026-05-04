import { ApiService } from '../core/api.service';

import {
  ISlaPolicy,
  ISlaPolicyCreate,
  ISlaPolicyUpdate,
  ISlaPolicyFilter,
  ISlaPolicySort,
  ISlaPolicyListResponse,
  ISlaPolicyMatchCriteria,
} from '../../models/domain/support-ticket/sla-policy.domain';

import { singleton } from '../../decorators/singleton';
import { ISlaPolicyAssignmentApiResponse } from '../../models/api/support-ticket/sla-policy.api';

/**
 * API endpoints for SLA policy related operations
 */
const SLA_POLICY_ENDPOINTS = {
  BASE: '/support-tickets/sla-policies',
  BY_ID: '/support-tickets/sla-policies/:policyId',
  LIST: '/support-tickets/sla-policies/list',
  CREATE: '/support-tickets/sla-policies',
  UPDATE: '/support-tickets/sla-policies/:policyId',
  DELETE: '/support-tickets/sla-policies/:policyId',
  ASSIGN: '/support-tickets/sla-policies/assign',
  MATCH: '/support-tickets/sla-policies/match',
  ACTIVATE: '/support-tickets/sla-policies/:policyId/activate',
  DEACTIVATE: '/support-tickets/sla-policies/:policyId/deactivate',
  SET_DEFAULT: '/support-tickets/sla-policies/:policyId/set-default',
} as const;

@singleton
export class SlaPolicyApiService extends ApiService {
  // ==================== SLA POLICY METHODS ====================

  /**
   * Get SLA policies list with filters and pagination
   */
  public async getSlaPolicies(
    filters?: ISlaPolicyFilter,
    sort?: ISlaPolicySort,
    pagination?: { page: number; limit: number }
  ): Promise<ISlaPolicyListResponse> {
    try {
      const params = new URLSearchParams();

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

      if (sort) {
        params.append('sortBy', sort.field);
        params.append('sortOrder', sort.direction);
      }

      if (pagination) {
        params.append('page', pagination.page.toString());
        params.append('limit', pagination.limit.toString());
      }

      return await this.apiGet<ISlaPolicyListResponse>(
        `${SLA_POLICY_ENDPOINTS.LIST}?${params.toString()}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get SLA policy by ID
   */
  public async getSlaPolicyById(policyId: string): Promise<ISlaPolicy> {
    try {
      return await this.apiGet<ISlaPolicy>(
        SLA_POLICY_ENDPOINTS.BY_ID.replace(':policyId', policyId)
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a new SLA policy
   */
  public async createSlaPolicy(data: ISlaPolicyCreate): Promise<ISlaPolicy> {
    try {
      return await this.apiPost<ISlaPolicy>(SLA_POLICY_ENDPOINTS.CREATE, data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update SLA policy
   */
  public async updateSlaPolicy(
    policyId: string,
    data: ISlaPolicyUpdate
  ): Promise<ISlaPolicy> {
    try {
      return await this.apiPatch<ISlaPolicy>(
        SLA_POLICY_ENDPOINTS.UPDATE.replace(':policyId', policyId),
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete SLA policy
   */
  public async deleteSlaPolicy(
    policyId: string
  ): Promise<{ success: boolean }> {
    try {
      return await this.apiDelete<{ success: boolean }>(
        SLA_POLICY_ENDPOINTS.DELETE.replace(':policyId', policyId)
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Activate SLA policy
   */
  public async activateSlaPolicy(policyId: string): Promise<ISlaPolicy> {
    try {
      return await this.apiPatch<ISlaPolicy>(
        SLA_POLICY_ENDPOINTS.ACTIVATE.replace(':policyId', policyId)
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Deactivate SLA policy
   */
  public async deactivateSlaPolicy(policyId: string): Promise<ISlaPolicy> {
    try {
      return await this.apiPatch<ISlaPolicy>(
        SLA_POLICY_ENDPOINTS.DEACTIVATE.replace(':policyId', policyId)
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Set SLA policy as default
   */
  public async setDefaultSlaPolicy(policyId: string): Promise<ISlaPolicy> {
    try {
      return await this.apiPatch<ISlaPolicy>(
        SLA_POLICY_ENDPOINTS.SET_DEFAULT.replace(':policyId', policyId)
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Find matching SLA policy for criteria
   */
  public async findMatchingSlaPolicy(
    criteria: ISlaPolicyMatchCriteria
  ): Promise<ISlaPolicy | null> {
    try {
      return await this.apiPost<ISlaPolicy | null>(
        SLA_POLICY_ENDPOINTS.MATCH,
        criteria
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Assign SLA policy to ticket
   */
  public async assignSlaPolicy(
    ticketId: string,
    policyId: string
  ): Promise<ISlaPolicyAssignmentApiResponse> {
    try {
      return await this.apiPost<ISlaPolicyAssignmentApiResponse>(
        SLA_POLICY_ENDPOINTS.ASSIGN,
        { ticketId, policyId }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get default SLA policies
   */
  public async getDefaultSlaPolicies(): Promise<ISlaPolicy[]> {
    try {
      return await this.apiGet<ISlaPolicy[]>(
        `${SLA_POLICY_ENDPOINTS.BASE}/defaults`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get SLA policies by entity type
   */
  public async getSlaPoliciesByEntityType(
    entityType: string
  ): Promise<ISlaPolicy[]> {
    try {
      return await this.apiGet<ISlaPolicy[]>(
        `${SLA_POLICY_ENDPOINTS.BASE}/entity-type/${entityType}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get SLA policies by category
   */
  public async getSlaPoliciesByCategory(
    category: string
  ): Promise<ISlaPolicy[]> {
    try {
      return await this.apiGet<ISlaPolicy[]>(
        `${SLA_POLICY_ENDPOINTS.BASE}/category/${category}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get SLA policies by priority
   */
  public async getSlaPoliciesByPriority(
    priority: string
  ): Promise<ISlaPolicy[]> {
    try {
      return await this.apiGet<ISlaPolicy[]>(
        `${SLA_POLICY_ENDPOINTS.BASE}/priority/${priority}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Clone SLA policy
   */
  public async cloneSlaPolicy(
    policyId: string,
    newName: string
  ): Promise<ISlaPolicy> {
    try {
      return await this.apiPost<ISlaPolicy>(
        `${SLA_POLICY_ENDPOINTS.BY_ID.replace(':policyId', policyId)}/clone`,
        { newName }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get SLA policy statistics
   */
  public async getSlaPolicyStatistics(): Promise<{
    totalPolicies: number;
    activePolicies: number;
    defaultPolicies: number;
    policiesByEntityType: Record<string, number>;
    policiesByCategory: Record<string, number>;
    policiesByPriority: Record<string, number>;
  }> {
    try {
      return await this.apiGet<{
        totalPolicies: number;
        activePolicies: number;
        defaultPolicies: number;
        policiesByEntityType: Record<string, number>;
        policiesByCategory: Record<string, number>;
        policiesByPriority: Record<string, number>;
      }>(`${SLA_POLICY_ENDPOINTS.BASE}/statistics`);
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
