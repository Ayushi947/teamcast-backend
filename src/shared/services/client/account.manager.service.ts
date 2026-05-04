import { ApiService } from '../core/api.service';
import { IAccountManagerUserDomain } from '../../models/domain/client/account.manager.domain';
import { singleton } from '../../decorators/singleton';

const ACCOUNT_MANAGER_ENDPOINTS = {
  BASE: '/account-manager',
} as const;

@singleton
export class ClientAccountManagerService extends ApiService {
  /**
   * Get the account manager for a client
   * @param clientId - The ID of the client
   * @returns The account manager for the client
   */
  public async getAccountManagerByClientId(
    clientId: string
  ): Promise<IAccountManagerUserDomain> {
    try {
      return await this.apiGet<IAccountManagerUserDomain>(
        `${ACCOUNT_MANAGER_ENDPOINTS.BASE}/client/${clientId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
