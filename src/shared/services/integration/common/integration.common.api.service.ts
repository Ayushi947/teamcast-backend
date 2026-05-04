import { ApiService } from '../../core/api.service';
import { singleton } from '../../../decorators/singleton';
import {
  IIntegrationDisconnectApiRequest,
  IIntegrationBulkDisconnectApiRequest,
} from '../../../models/api/integration/common/integration.common.api';
import {
  IIntegrationDataSummary,
  IIntegrationDataDetails,
  IDataImportSource,
  IDataUsageStatistics,
} from '../../../models/domain/integration/common/integration.data.tracking.domain';
import {
  IIntegrationDisconnectResponse,
  IIntegrationDisconnectSummary,
} from '../../../models/domain/integration/common/integration.disconnect.domain';

/**
 * API endpoints for integration common operations
 */
const INTEGRATION_COMMON_ENDPOINTS = {
  BASE: '/client/integrations/common',
  DATA_SUMMARY: '/client/integrations/common/data-summary',
  DATA_DETAILS: '/client/integrations/common/data-details/:integrationId',
  JOB_IMPORT_SOURCE: '/client/integrations/common/job-import-source/:jobId',
  CANDIDATE_IMPORT_SOURCE:
    '/client/integrations/common/candidate-import-source/:candidateId',
  USAGE_STATISTICS: '/client/integrations/common/usage-statistics',
  DISCONNECT: '/client/integrations/common/disconnect/:integrationId',
  BULK_DISCONNECT: '/client/integrations/common/bulk-disconnect',
  DISCONNECT_PREVIEW:
    '/client/integrations/common/disconnect-preview/:integrationId',
} as const;

/**
 * Shared API service for integration common operations
 * Provides methods for data tracking and integration management
 */
@singleton
export class IntegrationCommonApiService extends ApiService {
  /**
   * Get integration data summary
   * Retrieves a summary of all integration data for the client
   */
  public async getIntegrationDataSummary(): Promise<IIntegrationDataSummary[]> {
    try {
      return await this.apiGet<IIntegrationDataSummary[]>(
        INTEGRATION_COMMON_ENDPOINTS.DATA_SUMMARY
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get detailed integration data
   * Retrieves detailed data for a specific integration
   */
  public async getIntegrationDataDetails(
    integrationId: string
  ): Promise<IIntegrationDataDetails> {
    try {
      const endpoint = INTEGRATION_COMMON_ENDPOINTS.DATA_DETAILS.replace(
        ':integrationId',
        integrationId
      );
      return await this.apiGet<IIntegrationDataDetails>(endpoint);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get job import source
   * Retrieves information about which integration imported a specific job
   */
  public async getJobImportSource(
    jobId: string
  ): Promise<IDataImportSource | null> {
    try {
      const endpoint = INTEGRATION_COMMON_ENDPOINTS.JOB_IMPORT_SOURCE.replace(
        ':jobId',
        jobId
      );
      return await this.apiGet<IDataImportSource | null>(endpoint);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get candidate import source
   * Retrieves information about which integration(s) imported a specific candidate
   */
  public async getCandidateImportSource(
    candidateId: string
  ): Promise<IDataImportSource[]> {
    try {
      const endpoint =
        INTEGRATION_COMMON_ENDPOINTS.CANDIDATE_IMPORT_SOURCE.replace(
          ':candidateId',
          candidateId
        );
      return await this.apiGet<IDataImportSource[]>(endpoint);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get data usage statistics
   * Retrieves usage statistics across all integrations for the client
   */
  public async getDataUsageStatistics(): Promise<IDataUsageStatistics> {
    try {
      return await this.apiGet<IDataUsageStatistics>(
        INTEGRATION_COMMON_ENDPOINTS.USAGE_STATISTICS
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Disconnect an integration
   * Disconnects an integration with options for data cleanup
   */
  public async disconnectIntegration(
    integrationId: string,
    disconnectRequest: IIntegrationDisconnectApiRequest['data']
  ): Promise<IIntegrationDisconnectResponse> {
    try {
      const endpoint = INTEGRATION_COMMON_ENDPOINTS.DISCONNECT.replace(
        ':integrationId',
        integrationId
      );
      return await this.apiPost<IIntegrationDisconnectResponse>(
        endpoint,
        disconnectRequest
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Bulk disconnect multiple integrations
   * Disconnects multiple integrations at once with options for data cleanup
   */
  public async bulkDisconnectIntegrations(
    bulkDisconnectRequest: IIntegrationBulkDisconnectApiRequest['data']
  ): Promise<{
    results: IIntegrationDisconnectResponse[];
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
  }> {
    try {
      return await this.apiPost<{
        results: IIntegrationDisconnectResponse[];
        summary: {
          total: number;
          successful: number;
          failed: number;
        };
      }>(INTEGRATION_COMMON_ENDPOINTS.BULK_DISCONNECT, bulkDisconnectRequest);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get disconnect preview
   * Previews what data would be affected by disconnecting an integration
   */
  public async getDisconnectPreview(
    integrationId: string
  ): Promise<IIntegrationDisconnectSummary> {
    try {
      const endpoint = INTEGRATION_COMMON_ENDPOINTS.DISCONNECT_PREVIEW.replace(
        ':integrationId',
        integrationId
      );
      return await this.apiGet<IIntegrationDisconnectSummary>(endpoint);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Helper method to build query strings from parameters
   */
  protected buildQueryString(params: Record<string, any>): string {
    const urlParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((item) =>
            urlParams.append(`${key}[]`, item.toString())
          );
        } else {
          urlParams.append(key, value.toString());
        }
      }
    });

    const queryString = urlParams.toString();
    return queryString ? `?${queryString}` : '';
  }
}
