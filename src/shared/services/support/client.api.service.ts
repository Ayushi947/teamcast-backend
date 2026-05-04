import { ApiService } from '../core/api.service';
import type {
  ISupportClientUpdate,
  ISupportClient,
  ISupportClientFilterQueryCompanyId,
  ISupportClientVerifyResponse,
  ISupportClientVerifyRequest,
  ISupportClientListResponse,
  ISupportClientJobPostingByIdResponse,
} from '../../models/domain/support/client.domain';
import {
  IPaginatedResponse,
  IPaginationRequest,
} from '../../models/api/common/common.api';

/**
 * API endpoints for support client management related operations
 */
const SUPPORT_CLIENT_MANAGEMENT_ENDPOINTS = {
  BASE: '/support/clients',
  JOB_POSTINGS: '/job-postings',
  USERS: '/users',
  INVITES: '/invitations',
  VERIFY: '/support/clients/:clientId/verify',
  ACCOUNT_MANAGER: '/account-manager/clients',
  INTEGRATION_PROVIDERS:
    '/support/clients/integration-providers/:integrationProviderId',
  CLIENT_INTEGRATIONS: '/support/clients/:supportClientId/integrations',
} as const;

export class SupportClientManagementApiService extends ApiService {
  /**
   * Get list of support clients
   */
  public async listSupportClients(
    filter: ISupportClientFilterQueryCompanyId & IPaginationRequest
  ): Promise<IPaginatedResponse<ISupportClient>> {
    try {
      return await this.apiGet<IPaginatedResponse<ISupportClient>>(
        `${SUPPORT_CLIENT_MANAGEMENT_ENDPOINTS.BASE}${filter ? this.buildQueryString(filter) : ''}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a specific support client
   */
  public async getSupportClient(clientId: string): Promise<ISupportClient> {
    try {
      return await this.apiGet<ISupportClient>(
        `${SUPPORT_CLIENT_MANAGEMENT_ENDPOINTS.BASE}/${clientId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update a support client
   */
  public async updateSupportClient(
    clientId: string,
    data: ISupportClientUpdate
  ): Promise<ISupportClient> {
    try {
      return await this.apiPatch<ISupportClient>(
        `${SUPPORT_CLIENT_MANAGEMENT_ENDPOINTS.BASE}/${clientId}`,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete a support client
   */
  public async deleteSupportClient(clientId: string): Promise<boolean> {
    try {
      return await this.apiDelete<boolean>(
        `${SUPPORT_CLIENT_MANAGEMENT_ENDPOINTS.BASE}/${clientId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * List job postings for a specific support client
   */
  public async listSupportClientJobPostings(
    clientId: string,
    pagination: IPaginationRequest
  ): Promise<IPaginatedResponse<any>> {
    try {
      return await this.apiGet<IPaginatedResponse<any>>(
        `${SUPPORT_CLIENT_MANAGEMENT_ENDPOINTS.BASE}/${clientId}${SUPPORT_CLIENT_MANAGEMENT_ENDPOINTS.JOB_POSTINGS}${pagination ? this.buildQueryString(pagination) : ''}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a job posting by ID
   */
  public async getSupportClientJobPostingById(
    jobPostingId: string
  ): Promise<ISupportClientJobPostingByIdResponse> {
    try {
      return await this.apiGet<ISupportClientJobPostingByIdResponse>(
        `${SUPPORT_CLIENT_MANAGEMENT_ENDPOINTS.BASE}${SUPPORT_CLIENT_MANAGEMENT_ENDPOINTS.JOB_POSTINGS}/${jobPostingId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * List users for a specific support client
   */
  public async listSupportClientUsers(
    clientId: string,
    pagination: IPaginationRequest
  ): Promise<IPaginatedResponse<any>> {
    try {
      return await this.apiGet<IPaginatedResponse<any>>(
        `${SUPPORT_CLIENT_MANAGEMENT_ENDPOINTS.BASE}/${clientId}${SUPPORT_CLIENT_MANAGEMENT_ENDPOINTS.USERS}${pagination ? this.buildQueryString(pagination) : ''}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * List invitations for a specific support client
   */
  public async listSupportClientInvites(
    clientId: string,
    pagination: IPaginationRequest
  ): Promise<IPaginatedResponse<any>> {
    try {
      return await this.apiGet<IPaginatedResponse<any>>(
        `${SUPPORT_CLIENT_MANAGEMENT_ENDPOINTS.BASE}/${clientId}${SUPPORT_CLIENT_MANAGEMENT_ENDPOINTS.INVITES}${pagination ? this.buildQueryString(pagination) : ''}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Verify a support client
   */
  public async verifyClient(
    clientId: string,
    data: ISupportClientVerifyRequest
  ): Promise<ISupportClientVerifyResponse> {
    try {
      return await this.apiPost<ISupportClientVerifyResponse>(
        SUPPORT_CLIENT_MANAGEMENT_ENDPOINTS.VERIFY.replace(
          ':clientId',
          clientId
        ),
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  public async getClientsByAccountManagerId(
    filter: ISupportClientFilterQueryCompanyId & IPaginationRequest
  ): Promise<IPaginatedResponse<ISupportClientListResponse>> {
    try {
      return await this.apiGet<IPaginatedResponse<ISupportClientListResponse>>(
        `${SUPPORT_CLIENT_MANAGEMENT_ENDPOINTS.BASE}${SUPPORT_CLIENT_MANAGEMENT_ENDPOINTS.ACCOUNT_MANAGER}${this.buildQueryString(filter)}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  public async getIntegrationProviderDetails(
    integrationProviderId: string
  ): Promise<any> {
    try {
      return await this.apiGet<any>(
        `${SUPPORT_CLIENT_MANAGEMENT_ENDPOINTS.INTEGRATION_PROVIDERS.replace(
          ':integrationProviderId',
          integrationProviderId
        )}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  public async getClientIntegrations(clientId: string): Promise<any> {
    try {
      return await this.apiGet<any>(
        `${SUPPORT_CLIENT_MANAGEMENT_ENDPOINTS.CLIENT_INTEGRATIONS.replace(
          ':supportClientId',
          clientId
        )}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
