import { ApiService } from '../../../core/api.service';
import { singleton } from '../../../../decorators/singleton';
import {
  IWorkableConnectionRequest,
  IWorkableConnectionResponse,
  IWorkableValidationResponse,
  IWorkableCandidateImportRequest,
  IWorkableCandidateImportResponse,
  IWorkableJobImportRequest,
  IWorkableJobImportResponse,
  IWorkableJobSelectionRequest,
} from '../../../../models/domain/integration/ats/workable/workable.integration.domain';

/**
 * API endpoints for Workable integration operations
 */
const WORKABLE_INTEGRATION_ENDPOINTS = {
  BASE: '/client/workable',
  CONNECT: '/client/workable/connect',
  VALIDATE: '/client/workable/:integrationId/validate',
  IMPORT_CANDIDATES: '/client/workable/:integrationId/import-candidates',
  IMPORT_JOBS: '/client/workable/:integrationId/import-jobs',
  IMPORT_SELECTED_JOBS: '/client/workable/:integrationId/import-selected-jobs',
} as const;

/**
 * Service for handling Workable integration related API operations
 */
@singleton
export class WorkableIntegrationApiService extends ApiService {
  /**
   * Connects to Workable ATS by creating a new integration
   * @param connectionData - Workable connection credentials and settings
   * @returns Promise resolving to the connection response
   * @throws Error if the API request fails
   */
  public async connectWorkable(
    connectionData: IWorkableConnectionRequest
  ): Promise<IWorkableConnectionResponse> {
    try {
      return await this.apiPost<IWorkableConnectionResponse>(
        WORKABLE_INTEGRATION_ENDPOINTS.CONNECT,
        connectionData
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Validates an existing Workable integration connection
   * @param integrationId - The ID of the Workable integration to validate
   * @returns Promise resolving to the validation response
   * @throws Error if the API request fails
   */
  public async validateConnection(
    integrationId: string
  ): Promise<IWorkableValidationResponse> {
    try {
      const url = WORKABLE_INTEGRATION_ENDPOINTS.VALIDATE.replace(
        ':integrationId',
        integrationId
      );
      return await this.apiPost<IWorkableValidationResponse>(url, {});
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Imports candidates from Workable ATS
   * @param integrationId - The ID of the Workable integration
   * @param importRequest - Optional import parameters and filters
   * @returns Promise resolving to the import response
   * @throws Error if the API request fails
   */
  public async importCandidates(
    integrationId: string,
    importRequest?: IWorkableCandidateImportRequest
  ): Promise<IWorkableCandidateImportResponse> {
    try {
      const url = WORKABLE_INTEGRATION_ENDPOINTS.IMPORT_CANDIDATES.replace(
        ':integrationId',
        integrationId
      );
      return await this.apiPost<IWorkableCandidateImportResponse>(
        url,
        importRequest || {}
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Imports jobs from Workable ATS
   * @param integrationId - The ID of the Workable integration
   * @param importRequest - Optional import parameters and filters
   * @returns Promise resolving to the import response
   * @throws Error if the API request fails
   */
  public async importJobs(
    integrationId: string,
    importRequest?: IWorkableJobImportRequest
  ): Promise<IWorkableJobImportResponse> {
    try {
      const url = WORKABLE_INTEGRATION_ENDPOINTS.IMPORT_JOBS.replace(
        ':integrationId',
        integrationId
      );
      return await this.apiPost<IWorkableJobImportResponse>(
        url,
        importRequest || {}
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Imports specific selected jobs from Workable ATS
   * @param integrationId - The ID of the Workable integration
   * @param selectionRequest - The job selection request with job IDs to import
   * @returns Promise resolving to the import response
   * @throws Error if the API request fails
   */
  public async importSelectedJobs(
    integrationId: string,
    selectionRequest: IWorkableJobSelectionRequest
  ): Promise<IWorkableJobImportResponse> {
    try {
      const url = WORKABLE_INTEGRATION_ENDPOINTS.IMPORT_SELECTED_JOBS.replace(
        ':integrationId',
        integrationId
      );
      return await this.apiPost<IWorkableJobImportResponse>(
        url,
        selectionRequest
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
