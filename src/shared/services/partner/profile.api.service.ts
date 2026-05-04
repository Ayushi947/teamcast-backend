import { ApiService } from '../core/api.service';

import {
  IPartnerProfileBasic,
  IPartnerProfileAddress,
  IPartnerProfileSocial,
  IPartnerProfileCulture,
  IPartnerProfile,
  IPartnerProfileBillingAddress,
  IPartnerProfileShippingAddress,
  IPartnerFinancialData,
  IPartnerFinancialDataUpdate,
  IPartnerDocument,
  IPartnerDocumentCreate,
  IPartnerDocumentUpdate,
  IPartnerBankAccount,
  IPartnerBankAccountCreate,
  IPartnerBankAccountUpdate,
} from '../../models/domain/partner/profile.domain';
import { singleton } from '../../decorators/singleton';
import { IPartnerProfileSettings } from '../../models/domain/partner/profile.settings.domain';

/**
 * API endpoints for partner profile related operations
 */
const PROFILE_ENDPOINTS = {
  BASE: '/partner/profile',
  BASIC: '/partner/profile/basic',
  ADDRESS: '/partner/profile/address',
  BILLING_ADDRESS: '/partner/profile/address/billing',
  SHIPPING_ADDRESS: '/partner/profile/address/shipping',
  SOCIAL: '/partner/profile/social',
  CULTURE: '/partner/profile/culture',
  SETTINGS: '/partner/profile/settings',
  FINANCIAL_DATA: '/partner/profile/financial-data',
  BANK_ACCOUNTS: '/partner/profile/financial-data/bank-accounts',
  DOCUMENTS: '/partner/profile/documents',
  BY_ID: '/partner/profile/:partnerId',
} as const;

@singleton
export class PartnerProfileApiService extends ApiService {
  /**
   * Get complete partner profile
   */
  public async getProfile(): Promise<IPartnerProfile> {
    try {
      return await this.apiGet<IPartnerProfile>(PROFILE_ENDPOINTS.BASE);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get basic partner profile
   */
  public async getBasicProfile(): Promise<IPartnerProfileBasic> {
    try {
      return await this.apiGet<IPartnerProfileBasic>(PROFILE_ENDPOINTS.BASIC);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update basic partner profile
   */
  public async updateBasicProfile(
    data: IPartnerProfileBasic
  ): Promise<IPartnerProfileBasic> {
    try {
      return await this.apiPatch<IPartnerProfileBasic>(
        PROFILE_ENDPOINTS.BASIC,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get partner address
   */
  public async getAddress(): Promise<IPartnerProfileAddress> {
    try {
      return await this.apiGet<IPartnerProfileAddress>(
        PROFILE_ENDPOINTS.ADDRESS
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update partner address
   */
  public async updateAddress(
    data: IPartnerProfileAddress
  ): Promise<IPartnerProfileAddress> {
    try {
      return await this.apiPatch<IPartnerProfileAddress>(
        PROFILE_ENDPOINTS.ADDRESS,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
  /**
   * Get partner billingaddress
   */
  public async getBillingAdress(): Promise<IPartnerProfileBillingAddress> {
    try {
      return await this.apiGet<IPartnerProfileBillingAddress>(
        PROFILE_ENDPOINTS.BILLING_ADDRESS
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
  /**
   * Update partner billing address
   */
  public async updateBillingAddress(
    data: IPartnerProfileBillingAddress
  ): Promise<IPartnerProfileBillingAddress> {
    try {
      return await this.apiPatch<IPartnerProfileBillingAddress>(
        PROFILE_ENDPOINTS.BILLING_ADDRESS,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get partner shipping address
   */
  public async getShippingAddress(): Promise<IPartnerProfileShippingAddress> {
    try {
      return await this.apiGet<IPartnerProfileShippingAddress>(
        PROFILE_ENDPOINTS.SHIPPING_ADDRESS
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update partner shipping address
   */
  public async updateShippingAddress(
    data: IPartnerProfileShippingAddress
  ): Promise<IPartnerProfileShippingAddress> {
    try {
      return await this.apiPatch<IPartnerProfileShippingAddress>(
        PROFILE_ENDPOINTS.SHIPPING_ADDRESS,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
  /**
   * Get partner social profiles
   */
  public async getSocialProfile(): Promise<IPartnerProfileSocial> {
    try {
      return await this.apiGet<IPartnerProfileSocial>(PROFILE_ENDPOINTS.SOCIAL);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update partner social profiles
   */
  public async updateSocialProfile(
    data: IPartnerProfileSocial
  ): Promise<IPartnerProfileSocial> {
    try {
      return await this.apiPatch<IPartnerProfileSocial>(
        PROFILE_ENDPOINTS.SOCIAL,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get partner culture information
   */
  public async getCulture(): Promise<IPartnerProfileCulture> {
    try {
      return await this.apiGet<IPartnerProfileCulture>(
        PROFILE_ENDPOINTS.CULTURE
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update partner culture information
   */
  public async updateCulture(
    data: IPartnerProfileCulture
  ): Promise<IPartnerProfileCulture> {
    try {
      return await this.apiPatch<IPartnerProfileCulture>(
        PROFILE_ENDPOINTS.CULTURE,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get partner profile settings
   */
  public async getProfileSettings(): Promise<IPartnerProfileSettings> {
    try {
      return await this.apiGet<IPartnerProfileSettings>(
        PROFILE_ENDPOINTS.SETTINGS
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update partner profile settings
   */
  public async updateProfileSettings(
    data: IPartnerProfileSettings
  ): Promise<IPartnerProfileSettings> {
    try {
      return await this.apiPatch<IPartnerProfileSettings>(
        PROFILE_ENDPOINTS.SETTINGS,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Financial Data Methods

  /**
   * Get partner financial data
   */
  public async getFinancialData(): Promise<IPartnerFinancialData> {
    try {
      return await this.apiGet<IPartnerFinancialData>(
        PROFILE_ENDPOINTS.FINANCIAL_DATA
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create partner financial data
   */
  public async createFinancialData(
    data: IPartnerFinancialDataUpdate
  ): Promise<IPartnerFinancialData> {
    try {
      return await this.apiPost<IPartnerFinancialData>(
        PROFILE_ENDPOINTS.FINANCIAL_DATA,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update partner financial data
   */
  public async updateFinancialData(
    data: IPartnerFinancialDataUpdate
  ): Promise<IPartnerFinancialData> {
    try {
      return await this.apiPatch<IPartnerFinancialData>(
        PROFILE_ENDPOINTS.FINANCIAL_DATA,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Bank Account Methods

  /**
   * Add bank account
   */
  public async addBankAccount(
    data: IPartnerBankAccountCreate
  ): Promise<IPartnerBankAccount> {
    try {
      return await this.apiPost<IPartnerBankAccount>(
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
    data: IPartnerBankAccountUpdate
  ): Promise<IPartnerBankAccount> {
    try {
      return await this.apiPatch<IPartnerBankAccount>(
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

  // Document Methods

  /**
   * Get partner documents
   */
  public async getDocuments(): Promise<IPartnerDocument[]> {
    try {
      return await this.apiGet<IPartnerDocument[]>(PROFILE_ENDPOINTS.DOCUMENTS);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create partner document
   */
  public async createDocument(
    data: IPartnerDocumentCreate
  ): Promise<IPartnerDocument> {
    try {
      return await this.apiPost<IPartnerDocument>(
        PROFILE_ENDPOINTS.DOCUMENTS,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get partner document by ID
   */
  public async getDocumentById(documentId: string): Promise<IPartnerDocument> {
    try {
      return await this.apiGet<IPartnerDocument>(
        `${PROFILE_ENDPOINTS.DOCUMENTS}/${documentId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update partner document
   */
  public async updateDocument(
    documentId: string,
    data: IPartnerDocumentUpdate
  ): Promise<IPartnerDocument> {
    try {
      return await this.apiPatch<IPartnerDocument>(
        `${PROFILE_ENDPOINTS.DOCUMENTS}/${documentId}`,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete partner document
   */
  public async deleteDocument(
    documentId: string
  ): Promise<{ success: boolean }> {
    try {
      return await this.apiDelete<{ success: boolean }>(
        `${PROFILE_ENDPOINTS.DOCUMENTS}/${documentId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Retrieves the partner's profile by ID
   * @param partnerId - The ID of the partner
   * @returns Promise resolving to the profile details
   * @throws Error if the API request fails
   */
  public async getProfileById(partnerId: string): Promise<IPartnerProfile> {
    try {
      return await this.apiGet<IPartnerProfile>(
        `${PROFILE_ENDPOINTS.BASE}/${partnerId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Uploads a profile photo for the partner
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
        `${PROFILE_ENDPOINTS.BASE}/photo`,
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
}
