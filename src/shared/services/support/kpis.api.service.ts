import { ApiService } from '../core/api.service';
import type {
  ISupportCandidateKpis,
  ISupportCandidateKpisFilterOptions,
  ISupportCandidateKpisExport,
} from '../../models/domain/support/kpis.domain';
import {
  ISupportCandidateKpisFilterQuery,
  ISupportCandidateKpisApiResponse,
  ISupportCandidateKpisFilterOptionsApiResponse,
  ISupportCandidateKpisExportApiResponse,
} from '../../models/api/support/kpis.api';
import { singleton } from '../../decorators/singleton';

/**
 * API endpoints for support KPIs related operations
 */
const SUPPORT_KPIS_ENDPOINTS = {
  BASE: '/support/kpis',
  CANDIDATES: '/support/kpis/candidates',
  FILTER_OPTIONS: '/support/kpis/candidates/filter-options',
  EXPORT: '/support/kpis/candidates/export',
} as const;

@singleton
export class SupportKpisApiService extends ApiService {
  /**
   * Get candidate KPIs with filtering
   */
  public async getCandidateKpis(
    params?: ISupportCandidateKpisFilterQuery
  ): Promise<ISupportCandidateKpis> {
    try {
      const response = await this.apiGet<ISupportCandidateKpisApiResponse>(
        `${SUPPORT_KPIS_ENDPOINTS.CANDIDATES}${params ? this.buildQueryString(params) : ''}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get filter options for candidate KPIs
   */
  public async getFilterOptions(): Promise<ISupportCandidateKpisFilterOptions> {
    try {
      const response =
        await this.apiGet<ISupportCandidateKpisFilterOptionsApiResponse>(
          SUPPORT_KPIS_ENDPOINTS.FILTER_OPTIONS
        );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Export candidate KPIs data as CSV
   */
  public async exportCandidateKpis(
    params?: ISupportCandidateKpisFilterQuery
  ): Promise<ISupportCandidateKpisExport> {
    try {
      const response =
        await this.apiGet<ISupportCandidateKpisExportApiResponse>(
          `${SUPPORT_KPIS_ENDPOINTS.EXPORT}${params ? this.buildQueryString(params) : ''}`
        );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
