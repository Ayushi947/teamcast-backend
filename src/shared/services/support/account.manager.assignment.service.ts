import { ApiService } from '../core/api.service';
import { IClientAccountManagerAssignment } from '../../models/domain/support/account.manager.assignment.domain';
import { singleton } from '../../decorators/singleton';
import { IUser } from '../../models/domain/user/user.domain';
import { ISupportAccountManagerUserDomain } from '../../models/domain/support/account.manager.assignment.domain';

const ACCOUNT_MANAGER_ASSIGNMENT_ENDPOINTS = {
  BASE: '/support/account-manager-assignment',
  ALL: '/all',
  MANAGER_DETAILS: '/manager-details',
  CLIENT: '/client',
  RECRUITER: '/recruiter/assign',
  AVAILABILITY: '/availability',
} as const;

@singleton
export class AccountManagerAssignmentService extends ApiService {
  /**
   * Change the account manager for a client
   * @param clientId - The ID of the client
   * @param accountManagerId - The ID of the account manager
   * @returns The account manager assignment
   */
  public async changeAccountManager(
    clientId: string,
    accountManagerId: string
  ): Promise<IClientAccountManagerAssignment> {
    try {
      return await this.apiPost<IClientAccountManagerAssignment>(
        `${ACCOUNT_MANAGER_ASSIGNMENT_ENDPOINTS.BASE}/override`,
        { clientId, accountManagerId }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get all account managers
   * @returns All account managers
   */
  public async getAllAccountManagers(): Promise<IUser[]> {
    return await this.apiGet<IUser[]>(
      `${ACCOUNT_MANAGER_ASSIGNMENT_ENDPOINTS.BASE}${ACCOUNT_MANAGER_ASSIGNMENT_ENDPOINTS.ALL}`
    );
  }

  /**
   * Get the manager details for a support user
   * @returns The manager details
   */
  public async getManagerDetails(): Promise<IUser> {
    return await this.apiGet<IUser>(
      `${ACCOUNT_MANAGER_ASSIGNMENT_ENDPOINTS.BASE}${ACCOUNT_MANAGER_ASSIGNMENT_ENDPOINTS.MANAGER_DETAILS}`
    );
  }

  /**
   * Get account manager user details for a client by clientId
   * @param clientId - The ID of the client
   * @returns The account manager for the client
   */
  public async getAccountManagerByClientId(
    clientId: string
  ): Promise<ISupportAccountManagerUserDomain> {
    try {
      return await this.apiGet<ISupportAccountManagerUserDomain>(
        `${ACCOUNT_MANAGER_ASSIGNMENT_ENDPOINTS.BASE}${ACCOUNT_MANAGER_ASSIGNMENT_ENDPOINTS.CLIENT}/${clientId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get account manager assigned to a recruiter
   * @param recruiterId - The ID of the recruiter
   * @returns The account manager for the recruiter
   */
  public async getAccountManagerByRecruiterId(
    recruiterId: string
  ): Promise<ISupportAccountManagerUserDomain> {
    try {
      return await this.apiGet<ISupportAccountManagerUserDomain>(
        `${ACCOUNT_MANAGER_ASSIGNMENT_ENDPOINTS.BASE}/recruiter/${recruiterId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Assign an account manager to a recruiter
   * @param recruiterId - The ID of the recruiter
   * @param accountManagerId - The ID of the account manager
   * @returns The recruiter with the account manager assigned
   */
  public async assignAccountManagerToRecruiter(
    recruiterId: string,
    accountManagerId: string
  ): Promise<IUser> {
    try {
      return await this.apiPost<IUser>(
        `${ACCOUNT_MANAGER_ASSIGNMENT_ENDPOINTS.BASE}${ACCOUNT_MANAGER_ASSIGNMENT_ENDPOINTS.RECRUITER}`,
        { recruiterId, accountManagerId }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Change/reassign the account manager for a recruiter
   * @param recruiterId - The ID of the recruiter
   * @param accountManagerId - The ID of the new account manager
   * @returns The recruiter with the updated account manager
   */
  public async changeAccountManagerForRecruiter(
    recruiterId: string,
    accountManagerId: string
  ): Promise<IUser> {
    try {
      return await this.apiPut<IUser>(
        `${ACCOUNT_MANAGER_ASSIGNMENT_ENDPOINTS.BASE}/recruiter/change`,
        { recruiterId, accountManagerId }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Toggle account manager availability status
   * @param isAvailable - Whether the account manager is available for new assignments
   * @returns The result of the availability toggle
   */
  public async toggleAccountManagerAvailability(
    isAvailable: boolean
  ): Promise<{ success: boolean; message: string; isAvailable: boolean }> {
    try {
      return await this.apiPut<{
        success: boolean;
        message: string;
        isAvailable: boolean;
      }>(
        `${ACCOUNT_MANAGER_ASSIGNMENT_ENDPOINTS.BASE}${ACCOUNT_MANAGER_ASSIGNMENT_ENDPOINTS.AVAILABILITY}`,
        { isAvailable }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get account manager availability status
   * @returns The current availability status and name
   */
  public async getAccountManagerAvailabilityStatus(): Promise<{
    isAvailable: boolean;
    name: string;
  }> {
    try {
      return await this.apiGet<{ isAvailable: boolean; name: string }>(
        `${ACCOUNT_MANAGER_ASSIGNMENT_ENDPOINTS.BASE}${ACCOUNT_MANAGER_ASSIGNMENT_ENDPOINTS.AVAILABILITY}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
