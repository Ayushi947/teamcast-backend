import { IntegrationProviderType } from '@/shared/models/common/enums';

export interface IIntegrationProvider {
  /**
   * Get the provider type
   */
  getProviderType(): IntegrationProviderType;

  /**
   * Get the provider name
   */
  getProviderName(): string;

  /**
   * Test the integration connection
   * @param credentials Provider-specific credentials
   * @returns Promise that resolves to connection test result
   */
  testConnection(credentials: Record<string, any>): Promise<boolean>;
}
