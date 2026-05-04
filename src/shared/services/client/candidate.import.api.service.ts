import { ApiService } from '../core/api.service';

import { IPaginationRequest } from '../../models/api/common/common.api';
import {
  ICandidateImportTemplateDownloadRequest,
  ICandidateImportProcessApiResponse,
  ICandidateImportStatisticsApiRequest,
} from '../../models/api/client/candidate.import.api';
import {
  ICandidateImportListResponse,
  ICandidateImportStatistics,
} from '../../models/domain/client/candidate.import.domain';
import { singleton } from '../../decorators/singleton';

/**
 * API endpoints for candidate import related operations
 */
const CANDIDATE_IMPORT_ENDPOINTS = {
  BASE: '/client/candidate-import',
  TEMPLATE_DOWNLOAD: '/client/candidate-import/template/download',
  UPLOAD: '/client/candidate-import/upload',
  LIST: '/client/candidate-import/list',
  STATISTICS: '/client/candidate-import/statistics',
} as const;

@singleton
export class CandidateImportApiService extends ApiService {
  /**
   * Download Excel template for candidate import
   */
  public async downloadTemplate(
    request: ICandidateImportTemplateDownloadRequest
  ): Promise<Blob> {
    try {
      return await this.apiPost<Blob>(
        CANDIDATE_IMPORT_ENDPOINTS.TEMPLATE_DOWNLOAD,
        request,
        { responseType: 'blob' }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Upload and process Excel file with candidate data
   */
  public async uploadCandidates(
    jobPostingId: string,
    file: File
  ): Promise<ICandidateImportProcessApiResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      return await this.apiPost<ICandidateImportProcessApiResponse>(
        `${CANDIDATE_IMPORT_ENDPOINTS.UPLOAD}/${jobPostingId}`,
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
   * List imported candidates for a job posting
   */
  public async listImportedCandidates(
    jobPostingId: string,
    filters?: {
      limit?: number;
      offset?: number;
      status?: string;
      includeDuplicates?: boolean;
      jobTitle?: string;
      location?: string;
      skills?: string;
      search?: string;
    } & IPaginationRequest
  ): Promise<ICandidateImportListResponse> {
    try {
      const queryParams = filters ? this.buildQueryString(filters) : '';
      return await this.apiGet<ICandidateImportListResponse>(
        `${CANDIDATE_IMPORT_ENDPOINTS.LIST}/${jobPostingId}${queryParams}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get candidate import statistics
   */
  public async getImportStatistics(
    request: ICandidateImportStatisticsApiRequest
  ): Promise<ICandidateImportStatistics> {
    try {
      const queryParams = request.filters
        ? this.buildQueryString(request.filters)
        : '';
      return await this.apiGet<ICandidateImportStatistics>(
        `${CANDIDATE_IMPORT_ENDPOINTS.STATISTICS}${queryParams}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
