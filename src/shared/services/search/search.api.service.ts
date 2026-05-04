import { ApiService } from '../core/api.service';
import {
  ISearchRequest,
  ISearchResponse,
  ITypeaheadRequest,
  ITypeaheadResponse,
} from '../../models/domain/search/search.domain';
import { singleton } from '../../decorators/singleton';

/**
 * API endpoints for search related operations
 */
const SEARCH_ENDPOINTS = {
  SEARCH: '/search',
  TYPEAHEAD: '/search/typeahead',
  SEARCH_JOBS: '/search/jobs',
  SEARCH_JOBS_TYPEAHEAD: '/search/jobs/typeahead',
  SEARCH_CANDIDATES: '/search/candidates',
  SEARCH_CANDIDATES_TYPEAHEAD: '/search/candidates/typeahead',
} as const;

@singleton
export class SearchApiService extends ApiService {
  /**
   * Search for jobs or candidates
   */
  public async search(data: ISearchRequest): Promise<ISearchResponse> {
    try {
      return await this.apiPost<ISearchResponse>(SEARCH_ENDPOINTS.SEARCH, data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get typeahead suggestions for jobs or candidates
   */
  public async typeahead(data: ITypeaheadRequest): Promise<ITypeaheadResponse> {
    try {
      return await this.apiPost<ITypeaheadResponse>(
        SEARCH_ENDPOINTS.TYPEAHEAD,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Search for jobs
   */
  public async searchJobs(data: ISearchRequest): Promise<ISearchResponse> {
    try {
      return await this.apiPost<ISearchResponse>(
        SEARCH_ENDPOINTS.SEARCH_JOBS,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get typeahead suggestions for jobs
   */
  public async getJobsTypeahead(
    data: ITypeaheadRequest
  ): Promise<ITypeaheadResponse> {
    try {
      return await this.apiPost<ITypeaheadResponse>(
        SEARCH_ENDPOINTS.SEARCH_JOBS_TYPEAHEAD,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Search for candidates
   */
  public async searchCandidates(
    data: ISearchRequest
  ): Promise<ISearchResponse> {
    try {
      return await this.apiPost<ISearchResponse>(
        SEARCH_ENDPOINTS.SEARCH_CANDIDATES,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get typeahead suggestions for candidates
   */
  public async getCandidatesTypeahead(
    data: ITypeaheadRequest
  ): Promise<ITypeaheadResponse> {
    try {
      return await this.apiPost<ITypeaheadResponse>(
        SEARCH_ENDPOINTS.SEARCH_CANDIDATES_TYPEAHEAD,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
