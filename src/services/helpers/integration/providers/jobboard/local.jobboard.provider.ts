import { singleton } from '@/shared/decorators/singleton';
import { IIntegrationProvider } from '../../integration.provider';
import { IntegrationProviderType } from '@/shared/models/common/enums';
import { logger } from '@/shared/utils/logger';

@singleton
export class LocalJobBoardProvider implements IIntegrationProvider {
  getProviderType(): IntegrationProviderType {
    return IntegrationProviderType.JOB_BOARD;
  }

  getProviderName(): string {
    return 'Local Job Board';
  }

  async testConnection(credentials: Record<string, any>): Promise<boolean> {
    logger.info('Testing local job board connection', {
      context: 'LocalJobBoardProvider.testConnection',
      credentials,
    });

    // Simulate connection test
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return true;
  }
}
