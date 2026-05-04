import { ApiService } from '../core/api.service';
import { IDeelConfiguration } from '../../models/domain/support/deel.configuration.domain';

/**
 * API endpoints for Deel configuration management
 */
const DEEL_CONFIGURATION_ENDPOINTS = {
  BASE: '/support/deel',
  CLIENTS: '/clients',
  CLIENT_BY_ID: '/clients/:clientId',
  ENABLE: '/clients/:clientId/enable',
  DISABLE: '/clients/:clientId/disable',
} as const;

export class DeelConfigurationApiService extends ApiService {
  /**
   * Get Deel configuration for a specific client
   * @param clientId - Client ID
   * @returns Promise resolving to Deel configuration
   */
  public async getDeelConfiguration(
    clientId: string
  ): Promise<IDeelConfiguration> {
    try {
      return await this.apiGet<IDeelConfiguration>(
        `${DEEL_CONFIGURATION_ENDPOINTS.BASE}${DEEL_CONFIGURATION_ENDPOINTS.CLIENT_BY_ID.replace(':clientId', clientId)}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Enable Deel SSO for a client
   * @param clientId - Client ID
   * @returns Promise resolving to updated Deel configuration
   */
  public async enableDeelForClient(
    clientId: string
  ): Promise<IDeelConfiguration> {
    try {
      return await this.apiPost<IDeelConfiguration>(
        `${DEEL_CONFIGURATION_ENDPOINTS.BASE}${DEEL_CONFIGURATION_ENDPOINTS.ENABLE.replace(':clientId', clientId)}`,
        {}
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Disable Deel SSO for a client
   * @param clientId - Client ID
   * @returns Promise resolving to updated Deel configuration
   */
  public async disableDeelForClient(
    clientId: string
  ): Promise<IDeelConfiguration> {
    try {
      return await this.apiPost<IDeelConfiguration>(
        `${DEEL_CONFIGURATION_ENDPOINTS.BASE}${DEEL_CONFIGURATION_ENDPOINTS.DISABLE.replace(':clientId', clientId)}`,
        {}
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get all clients with Deel enabled
   * @returns Promise resolving to array of Deel configurations
   */
  public async getAllClientsWithDeelEnabled(): Promise<IDeelConfiguration[]> {
    try {
      return await this.apiGet<IDeelConfiguration[]>(
        `${DEEL_CONFIGURATION_ENDPOINTS.BASE}${DEEL_CONFIGURATION_ENDPOINTS.CLIENTS}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
