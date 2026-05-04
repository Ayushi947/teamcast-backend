import { ISearchResult } from '@/shared/models/domain/search/search.domain';

export interface ISearchFilters {
  skills?: string[];
  experience?: number;
  location?: string[];
  industry?: string[];
  jobType?: string[];
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  remote?: boolean;
  education?: string[];
}

export interface ISearchResponse {
  results: ISearchResult[];
  total: number;
  page: number;
  pageSize: number;
  groundingInfo?: any;
}

export interface ISearchProvider {
  /**
   * Search for jobs using a text query
   * @param query The search query
   * @param limit Maximum number of results to return
   * @param page Page number for pagination
   * @param filters Optional filters for advanced search
   */
  searchJobs(
    query: string,
    limit?: number,
    page?: number,
    filters?: ISearchFilters
  ): Promise<ISearchResponse>;

  /**
   * Search for candidates using a text query
   * @param query The search query
   * @param limit Maximum number of results to return
   * @param page Page number for pagination
   * @param filters Optional filters for advanced search
   */
  searchCandidates(
    query: string,
    limit?: number,
    page?: number,
    filters?: ISearchFilters
  ): Promise<ISearchResponse>;

  /**
   * Enrich job search results with additional data
   * @param results Raw search results
   */
  enrichJobSearchResults(results: ISearchResult[]): Promise<ISearchResult[]>;

  /**
   * Enrich candidate search results with additional data
   * @param results Raw search results
   */
  enrichCandidateSearchResults(
    results: ISearchResult[]
  ): Promise<ISearchResult[]>;
}
