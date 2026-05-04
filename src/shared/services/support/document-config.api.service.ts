import { ICompanyVerificationStatus } from '../../models/common/enums';
import { singleton } from '../../decorators/singleton';
import { ApiService } from '../core/api.service';
import {
  IDocumentVerificationRequest,
  IDocumentConfig,
  ICountryWithDocuments,
} from '../../models/domain/support/document.config.domain';
import { IClientDocument } from '../../models/domain/client/profile.domain';
import { IDocumentPreviewResponse } from '../../models/domain/support/document.config.domain';

const DOCUMENT_CONFIG_ENDPOINTS = {
  BASE: '/support/document/config',
  COMPANY_VERIFICATION_STATUS:
    '/support/document/company/:companyId/verification-status',
  GET_DOCUMENTS_BY_COUNTRY: '/support/document/:countryName',
  GET_ALL_DOCUMENTS_CONFIG: '/support/document/config/all',
  GET_ALL_DOCUMENTS_BY_CLIENT_ID: '/support/document/client/:clientId',
  VERIFY_DOCUMENT: '/support/document/:documentId/verify',
  GET_DOCUMENT_PREVIEW: '/support/document/:documentId/preview',
} as const;

@singleton
export class DocumentConfigApiService extends ApiService {
  /**
   * Update the verification status of a company
   * @param companyId - The ID of the company to update
   * @param status - The new verification status
   * @param remarks - Optional remarks about the verification status
   * @returns The updated company
   */
  public async updateCompanyVerificationStatus(
    companyId: string,
    status: ICompanyVerificationStatus,
    remarks?: string
  ) {
    const endpoint =
      DOCUMENT_CONFIG_ENDPOINTS.COMPANY_VERIFICATION_STATUS.replace(
        ':companyId',
        companyId
      );

    return await this.apiPut(endpoint, {
      status,
      remarks,
    });
  }

  /**
   * Get the documents by country
   * @param countryName - The name of the country
   * @returns The documents by country
   */
  public async getDocumentsByCountry(countryName: string) {
    const endpoint = DOCUMENT_CONFIG_ENDPOINTS.GET_DOCUMENTS_BY_COUNTRY.replace(
      ':countryName',
      countryName
    );
    return await this.apiGet<IDocumentConfig[]>(endpoint);
  }

  /**
   * Create the document config
   * @param countryName - The name of the country
   * @param documentConfigs - The document configs
   * @returns The created document config
   */
  public async createDocumentConfig(
    countryName: string,
    documentConfig: IDocumentConfig[]
  ) {
    return await this.apiPost<IDocumentConfig[]>(
      DOCUMENT_CONFIG_ENDPOINTS.BASE,
      {
        countryName,
        documentConfig,
      }
    );
  }

  /**
   * Get all documents config
   * @returns The all documents config grouped by country
   */
  public async getAllDocumentsConfig() {
    return await this.apiGet<ICountryWithDocuments[]>(
      DOCUMENT_CONFIG_ENDPOINTS.GET_ALL_DOCUMENTS_CONFIG
    );
  }

  /**
   * Get all documents by client id
   */
  public async getAllDocumentsByClientId(clientId: string) {
    const endpoint =
      DOCUMENT_CONFIG_ENDPOINTS.GET_ALL_DOCUMENTS_BY_CLIENT_ID.replace(
        ':clientId',
        clientId
      );
    return await this.apiGet<IClientDocument[]>(endpoint);
  }

  /**
   * Verify a document
   * @param documentId - The ID of the document to verify
   * @param verificationData - The verification data
   * @returns Success status
   */
  public async verifyDocument(
    documentId: string,
    verificationData: IDocumentVerificationRequest
  ) {
    const endpoint = DOCUMENT_CONFIG_ENDPOINTS.VERIFY_DOCUMENT.replace(
      ':documentId',
      documentId
    );
    return await this.apiPatch<{ success: boolean }>(
      endpoint,
      verificationData
    );
  }

  /**
   * Get document preview URL
   * @param documentId - The ID of the document to preview
   * @returns The document preview URL
   */
  public async getDocumentPreviewUrl(documentId: string) {
    const endpoint = DOCUMENT_CONFIG_ENDPOINTS.GET_DOCUMENT_PREVIEW.replace(
      ':documentId',
      documentId
    );
    return await this.apiGet<IDocumentPreviewResponse>(endpoint);
  }
}
