import { ApiService } from '../core/api.service';

import {
  IClientProfileBasic,
  IClientProfileAddress,
  IClientProfileShippingAddress,
  IClientProfileBillingAddress,
  IClientProfileSocial,
  IClientProfileCulture,
  IClientProfileAiAssessmentSettings,
  IClientProfile,
  IClientFinancialData,
  IClientFinancialDataUpdate,
  IClientBankAccount,
  IClientBankAccountCreate,
  IClientBankAccountUpdate,
} from '../../models/domain/client/profile.domain';
import { singleton } from '../../decorators/singleton';
import { IClientProfileSettings } from '../../models/domain/client/profile.settings.domain';
import { IClientProfilePhotoDeleteApiResponse } from '../../models/api/client/profile.api';

/**
 * API endpoints for profile related operations
 */
const PROFILE_ENDPOINTS = {
  BASE: '/client/profile',
  BASIC: '/client/profile/basic',
  ADDRESS: '/client/profile/address',
  SHIPPING_ADDRESS: '/client/profile/address/shipping',
  BILLING_ADDRESS: '/client/profile/address/billing',
  SOCIAL: '/client/profile/social',
  CULTURE: '/client/profile/culture',
  AI_ASSESSMENT_SETTINGS: '/client/profile/ai-assessment-settings',
  SETTINGS: '/client/profile/settings',
  FINANCIAL_DATA: '/client/profile/financial-data',
  BANK_ACCOUNTS: '/client/profile/financial-data/bank-accounts',
  BY_ID: '/client/profile/:clientId',
  JOB_POSTING_AI_ASSESSMENT_SETTINGS:
    '/client/profile/job-posting/:jobPostingId/ai-assessment-settings',
} as const;

@singleton
export class ClientProfileApiService extends ApiService {
  /**
   * Get complete client profile
   */
  public async getProfile(): Promise<IClientProfile> {
    try {
      return await this.apiGet<IClientProfile>(PROFILE_ENDPOINTS.BASE);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get basic client profile
   */
  public async getBasicProfile(): Promise<IClientProfileBasic> {
    try {
      return await this.apiGet<IClientProfileBasic>(PROFILE_ENDPOINTS.BASIC);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update basic client profile
   */
  public async updateBasicProfile(
    data: IClientProfileBasic
  ): Promise<IClientProfileBasic> {
    try {
      return await this.apiPatch<IClientProfileBasic>(
        PROFILE_ENDPOINTS.BASIC,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get client address
   */
  public async getAddress(): Promise<IClientProfileAddress> {
    try {
      return await this.apiGet<IClientProfileAddress>(
        PROFILE_ENDPOINTS.ADDRESS
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update client address
   */
  public async updateAddress(
    data: IClientProfileAddress
  ): Promise<IClientProfileAddress> {
    try {
      return await this.apiPatch<IClientProfileAddress>(
        PROFILE_ENDPOINTS.ADDRESS,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get client shipping address
   */
  public async getShippingAddress(): Promise<IClientProfileShippingAddress> {
    try {
      return await this.apiGet<IClientProfileShippingAddress>(
        PROFILE_ENDPOINTS.SHIPPING_ADDRESS
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update client shipping address
   */
  public async updateShippingAddress(
    data: IClientProfileShippingAddress
  ): Promise<IClientProfileShippingAddress> {
    try {
      return await this.apiPatch<IClientProfileShippingAddress>(
        PROFILE_ENDPOINTS.SHIPPING_ADDRESS,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get client billing address
   */
  public async getBillingAddress(): Promise<IClientProfileBillingAddress> {
    try {
      return await this.apiGet<IClientProfileBillingAddress>(
        PROFILE_ENDPOINTS.BILLING_ADDRESS
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update client billing address
   */
  public async updateBillingAddress(
    data: IClientProfileBillingAddress
  ): Promise<IClientProfileBillingAddress> {
    try {
      return await this.apiPatch<IClientProfileBillingAddress>(
        PROFILE_ENDPOINTS.BILLING_ADDRESS,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get client social profiles
   */
  public async getSocialProfile(): Promise<IClientProfileSocial> {
    try {
      return await this.apiGet<IClientProfileSocial>(PROFILE_ENDPOINTS.SOCIAL);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update client social profiles
   */
  public async updateSocialProfile(
    data: IClientProfileSocial
  ): Promise<IClientProfileSocial> {
    try {
      return await this.apiPatch<IClientProfileSocial>(
        PROFILE_ENDPOINTS.SOCIAL,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get client culture information
   */
  public async getCulture(): Promise<IClientProfileCulture> {
    try {
      return await this.apiGet<IClientProfileCulture>(
        PROFILE_ENDPOINTS.CULTURE
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update client culture information
   */
  public async updateCulture(
    data: IClientProfileCulture
  ): Promise<IClientProfileCulture> {
    try {
      return await this.apiPatch<IClientProfileCulture>(
        PROFILE_ENDPOINTS.CULTURE,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get client AI assessment settings
   */
  public async getAiAssessmentSettings(): Promise<IClientProfileAiAssessmentSettings> {
    try {
      return await this.apiGet<IClientProfileAiAssessmentSettings>(
        PROFILE_ENDPOINTS.AI_ASSESSMENT_SETTINGS
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update client AI assessment settings
   */
  public async updateAiAssessmentSettings(
    data: IClientProfileAiAssessmentSettings
  ): Promise<IClientProfileAiAssessmentSettings> {
    try {
      return await this.apiPatch<IClientProfileAiAssessmentSettings>(
        PROFILE_ENDPOINTS.AI_ASSESSMENT_SETTINGS,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get client profile settings
   */
  public async getProfileSettings(): Promise<IClientProfileSettings> {
    try {
      return await this.apiGet<IClientProfileSettings>(
        PROFILE_ENDPOINTS.SETTINGS
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update client profile settings
   */
  public async updateProfileSettings(
    data: IClientProfileSettings
  ): Promise<IClientProfileSettings> {
    try {
      return await this.apiPatch<IClientProfileSettings>(
        PROFILE_ENDPOINTS.SETTINGS,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Financial Data Methods

  /**
   * Get client financial data
   */
  public async getFinancialData(): Promise<IClientFinancialData> {
    try {
      return await this.apiGet<IClientFinancialData>(
        PROFILE_ENDPOINTS.FINANCIAL_DATA
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create client financial data
   */
  public async createFinancialData(
    data: IClientFinancialDataUpdate
  ): Promise<IClientFinancialData> {
    try {
      return await this.apiPost<IClientFinancialData>(
        PROFILE_ENDPOINTS.FINANCIAL_DATA,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update client financial data
   */
  public async updateFinancialData(
    data: IClientFinancialDataUpdate
  ): Promise<IClientFinancialData> {
    try {
      return await this.apiPatch<IClientFinancialData>(
        PROFILE_ENDPOINTS.FINANCIAL_DATA,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Bank Account Methods

  /**
   * Get bank accounts
   */
  public async getBankAccounts(): Promise<IClientBankAccount[]> {
    try {
      return await this.apiGet<IClientBankAccount[]>(
        PROFILE_ENDPOINTS.BANK_ACCOUNTS
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get bank account by ID
   */
  public async getBankAccountById(
    accountId: string
  ): Promise<IClientBankAccount> {
    try {
      return await this.apiGet<IClientBankAccount>(
        `${PROFILE_ENDPOINTS.BANK_ACCOUNTS}/${accountId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Add bank account
   */
  public async addBankAccount(
    data: IClientBankAccountCreate
  ): Promise<IClientBankAccount> {
    try {
      return await this.apiPost<IClientBankAccount>(
        PROFILE_ENDPOINTS.BANK_ACCOUNTS,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update bank account
   */
  public async updateBankAccount(
    accountId: string,
    data: IClientBankAccountUpdate
  ): Promise<IClientBankAccount> {
    try {
      return await this.apiPatch<IClientBankAccount>(
        `${PROFILE_ENDPOINTS.BANK_ACCOUNTS}/${accountId}`,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete bank account
   */
  public async deleteBankAccount(
    accountId: string
  ): Promise<{ success: boolean }> {
    try {
      return await this.apiDelete<{ success: boolean }>(
        `${PROFILE_ENDPOINTS.BANK_ACCOUNTS}/${accountId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Retrieves the client's profile by ID
   * @param clientId - The ID of the client
   * @returns Promise resolving to the profile details
   * @throws Error if the API request fails
   */
  public async getProfileById(clientId: string): Promise<IClientProfile> {
    try {
      return await this.apiGet<IClientProfile>(
        `${PROFILE_ENDPOINTS.BASE}/${clientId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Uploads a profile photo for the client
   * @param file - The file to upload
   * @returns Promise resolving to the upload result with filename and URL
   * @throws Error if the API request fails
   */
  public async uploadProfilePhoto(
    file: File
  ): Promise<{ fileName: string; logoUrl: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      return await this.apiPatch<{ fileName: string; logoUrl: string }>(
        `${PROFILE_ENDPOINTS.BASE}/logo`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete (remove) client profile logo
   */
  public async deleteProfileLogo(): Promise<IClientProfilePhotoDeleteApiResponse> {
    try {
      return await this.apiDelete<IClientProfilePhotoDeleteApiResponse>(
        `${PROFILE_ENDPOINTS.BASE}/logo`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get job posting AI assessment settings
   * @param jobPostingId - The ID of the job posting
   * @returns Promise resolving to the job posting AI assessment settings
   * @throws Error if the API request fails
   */
  public async getJobPostingAiAssessmentSettings(
    jobPostingId: string
  ): Promise<IClientProfileAiAssessmentSettings> {
    try {
      return await this.apiGet<IClientProfileAiAssessmentSettings>(
        `${PROFILE_ENDPOINTS.JOB_POSTING_AI_ASSESSMENT_SETTINGS.replace(
          ':jobPostingId',
          jobPostingId
        )}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
