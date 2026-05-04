import { singleton } from '@/shared/decorators/singleton';
import { IIntegrationProvider } from '../../integration.provider';

import { IntegrationProviderType } from '@/shared/models/common/enums';
import { logger } from '@/shared/utils/logger';

@singleton
export class LocalAtsProvider implements IIntegrationProvider {
  getProviderType(): IntegrationProviderType {
    return IntegrationProviderType.ATS;
  }

  getProviderName(): string {
    return 'Local ATS';
  }

  async testConnection(credentials: Record<string, any>): Promise<boolean> {
    logger.info('Testing local ATS connection', {
      context: 'LocalAtsProvider.testConnection',
      credentials,
    });

    // Simulate connection test
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return true;
  }
}
