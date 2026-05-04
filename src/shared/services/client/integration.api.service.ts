import { ApiService } from '../core/api.service';
import type {
  IClientIntegration,
  IClientIntegrationCreate,
  IClientIntegrationUpdate,
  IClientIntegrationFilterQuery,
  IIntegrationProvider,
  IIntegrationSyncTask,
  IIntegrationWebhook,
  IIntegrationAuditLog,
} from '../../models/domain/client/integration.domain';
import {
  IPaginatedResponse,
  IPaginationRequest,
} from '../../models/api/common/common.api';
import { singleton } from '../../decorators/singleton';

/**
 * API endpoints for integration related operations
 */
const INTEGRATION_ENDPOINTS = {
  BASE: '/client/integrations',
  PROVIDERS: '/client/integrations/providers',
} as const;

@singleton
export class ClientIntegrationApiService extends ApiService {
  /**
   * Get list of available integration providers
   */
  public async getIntegrationProviders(
    params?: IPaginationRequest
  ): Promise<IPaginatedResponse<IIntegrationProvider>> {
    try {
      return await this.apiGet<IPaginatedResponse<IIntegrationProvider>>(
        `${INTEGRATION_ENDPOINTS.PROVIDERS}${params ? this.buildQueryString(params) : ''}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a specific integration provider
   */
  public async getIntegrationProvider(
    providerId: string
  ): Promise<IIntegrationProvider> {
    try {
      return await this.apiGet<IIntegrationProvider>(
        `${INTEGRATION_ENDPOINTS.PROVIDERS}/${providerId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get list of client integrations
   */
  public async getClientIntegrations(
    params?: IClientIntegrationFilterQuery & IPaginationRequest
  ): Promise<IPaginatedResponse<IClientIntegration>> {
    try {
      return await this.apiGet<IPaginatedResponse<IClientIntegration>>(
        `${INTEGRATION_ENDPOINTS.BASE}${params ? this.buildQueryString(params) : ''}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a specific client integration
   */
  public async getClientIntegration(
    integrationId: string
  ): Promise<IClientIntegration> {
    try {
      return await this.apiGet<IClientIntegration>(
        `${INTEGRATION_ENDPOINTS.BASE}/${integrationId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a new client integration
   */
  public async createClientIntegration(
    data: IClientIntegrationCreate
  ): Promise<IClientIntegration> {
    try {
      return await this.apiPost<IClientIntegration>(
        INTEGRATION_ENDPOINTS.BASE,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update a client integration
   */
  public async updateClientIntegration(
    integrationId: string,
    data: IClientIntegrationUpdate
  ): Promise<IClientIntegration> {
    try {
      return await this.apiPut<IClientIntegration>(
        `${INTEGRATION_ENDPOINTS.BASE}/${integrationId}`,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete a client integration
   */
  public async deleteClientIntegration(
    integrationId: string
  ): Promise<boolean> {
    try {
      return await this.apiDelete<boolean>(
        `${INTEGRATION_ENDPOINTS.BASE}/${integrationId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get sync tasks for a client integration
   */
  public async getIntegrationSyncTasks(
    integrationId: string,
    params?: IPaginationRequest
  ): Promise<IPaginatedResponse<IIntegrationSyncTask>> {
    try {
      return await this.apiGet<IPaginatedResponse<IIntegrationSyncTask>>(
        `${INTEGRATION_ENDPOINTS.BASE}/${integrationId}/sync-tasks${
          params ? this.buildQueryString(params) : ''
        }`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get webhooks for a client integration
   */
  public async getIntegrationWebhooks(
    integrationId: string,
    params?: IPaginationRequest
  ): Promise<IPaginatedResponse<IIntegrationWebhook>> {
    try {
      return await this.apiGet<IPaginatedResponse<IIntegrationWebhook>>(
        `${INTEGRATION_ENDPOINTS.BASE}/${integrationId}/webhooks${
          params ? this.buildQueryString(params) : ''
        }`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Test connection for a client integration
   */
  public async testIntegrationConnection(
    integrationId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      return await this.apiPost<{ success: boolean; message: string }>(
        `${INTEGRATION_ENDPOINTS.BASE}/${integrationId}/test-connection`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get audit logs for a client integration
   */
  public async getIntegrationAuditLogs(
    integrationId: string,
    params?: IPaginationRequest
  ): Promise<IPaginatedResponse<IIntegrationAuditLog>> {
    try {
      return await this.apiGet<IPaginatedResponse<IIntegrationAuditLog>>(
        `${INTEGRATION_ENDPOINTS.BASE}/${integrationId}/audit-logs${
          params ? this.buildQueryString(params) : ''
        }`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
