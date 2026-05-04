import { ApiService } from '../core/api.service';
import type {
  ILookupCategoryCreate,
  ILookupValueCreate,
  ILookupCategoryMinimal,
} from '../../models/domain/support/lookup.domain';
import { ILookupCategory, ILookupValue } from '../../models/common/enums';
import { singleton } from '../../decorators/singleton';

/**
 * API endpoints for lookup management related operations
 */
const LOOKUP_MANAGEMENT_ENDPOINTS = {
  CATEGORIES: '/support/lookups/categories',
  VALUES: '/support/lookups/values',
  VALUES_BY_CATEGORIES: '/support/lookups/values/by-categories',
  COUNTRIES: '/support/lookups/countries',
  TIMEZONES: '/support/lookups/timezones',
} as const;

@singleton
export class SupportLookupManagementApiService extends ApiService {
  /**
   * Get list of lookup categories
   */
  public async getLookupCategories(): Promise<ILookupCategory[]> {
    try {
      return await this.apiGet<ILookupCategory[]>(
        LOOKUP_MANAGEMENT_ENDPOINTS.CATEGORIES
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a specific lookup category
   */
  public async getLookupCategory(categoryId: string): Promise<ILookupCategory> {
    try {
      return await this.apiGet<ILookupCategory>(
        `${LOOKUP_MANAGEMENT_ENDPOINTS.CATEGORIES}/${categoryId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a new lookup category
   */
  public async createLookupCategory(
    data: ILookupCategoryCreate
  ): Promise<ILookupCategory> {
    try {
      return await this.apiPost<ILookupCategory>(
        LOOKUP_MANAGEMENT_ENDPOINTS.CATEGORIES,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete a lookup category
   */
  public async deleteLookupCategory(categoryId: string): Promise<void> {
    try {
      return await this.apiDelete<void>(
        `${LOOKUP_MANAGEMENT_ENDPOINTS.CATEGORIES}/${categoryId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a new lookup value
   */
  public async createLookupValue(
    data: ILookupValueCreate
  ): Promise<ILookupValue> {
    try {
      return await this.apiPost<ILookupValue>(
        LOOKUP_MANAGEMENT_ENDPOINTS.VALUES,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete a lookup value
   */
  public async deleteLookupValue(valueId: string): Promise<void> {
    try {
      return await this.apiDelete<void>(
        `${LOOKUP_MANAGEMENT_ENDPOINTS.VALUES}/${valueId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get lookup values by category names
   * @param categories Array of category names to fetch values for
   * @returns Promise resolving to array of lookup categories with their values
   */
  public async getLookupValuesByCategories(
    categories: string[]
  ): Promise<ILookupCategory[] | ILookupCategoryMinimal[]> {
    try {
      return await this.apiGet<ILookupCategory[] | ILookupCategoryMinimal[]>(
        `${LOOKUP_MANAGEMENT_ENDPOINTS.VALUES_BY_CATEGORIES}${this.buildQueryString({ categories: categories.join(',') })}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get list of countries (ISO 3166-1 alpha-2)
   */
  public async getCountries(): Promise<{ code: string; name: string }[]> {
    try {
      return await this.apiGet<{ code: string; name: string }[]>(
        LOOKUP_MANAGEMENT_ENDPOINTS.COUNTRIES
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get timezones for a given country code (ISO 3166-1 alpha-2)
   */
  public async getTimezonesByCountry(countryCode: string): Promise<
    {
      name: string;
      tzCode: string;
      utcOffset: number;
      utcOffsetStr: string;
    }[]
  > {
    try {
      return await this.apiGet<
        {
          name: string;
          tzCode: string;
          utcOffset: number;
          utcOffsetStr: string;
        }[]
      >(
        `${LOOKUP_MANAGEMENT_ENDPOINTS.TIMEZONES}?country=${encodeURIComponent(countryCode)}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
