import { singleton } from '@/shared/decorators/singleton';
import { logger } from '@/shared/utils/logger';
import { SearchFactory } from '../helpers/search/search.factory';
import {
  ISearchProvider,
  ISearchFilters,
} from '../helpers/search/search.provider';

@singleton
export class SearchService {
  private readonly searchProvider: ISearchProvider;

  constructor() {
    this.searchProvider = new SearchFactory().getProvider();
  }

  /**
   * Search for jobs using a text query
   * @param query The search query
   * @param limit Maximum number of results to return
   * @param page Page number for pagination
   * @param mode Search mode (basic, skills_focused, industry_focused, comprehensive, location_focused)
   * @param filters Optional filters for advanced search
   */
  async searchJobs(
    query: string,
    limit: number = 10,
    page: number = 1,
    filters?: ISearchFilters
  ) {
    try {
      return await this.searchProvider.searchJobs(query, limit, page, filters);
    } catch (error) {
      logger.error({
        message: 'Failed to search jobs',
        context: 'SearchService.searchJobs',
        error: error instanceof Error ? error.message : 'Unknown error',
        query,
      });
      throw error;
    }
  }

  /**
   * Search for candidates using a text query with enhanced prompt generation
   * @param query The search query
   * @param limit Maximum number of results to return
   * @param page Page number for pagination
   * @param mode Search mode (basic, skills_focused, experience_focused, comprehensive)
   * @param filters Optional filters for advanced search
   */
  async searchCandidates(
    query: string,
    limit: number = 10,
    page: number = 1,
    filters?: ISearchFilters
  ) {
    try {
      return await this.searchProvider.searchCandidates(
        query,
        limit,
        page,
        filters
      );
    } catch (error) {
      logger.error({
        message: 'Failed to search candidates',
        context: 'SearchService.searchCandidates',
        error: error instanceof Error ? error.message : 'Unknown error',
        query,
      });
      throw error;
    }
  }
}
