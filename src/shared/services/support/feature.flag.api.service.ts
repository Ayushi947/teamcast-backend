import { ApiService } from '../core/api.service';
import type {
  IFeatureFlag,
  IFeatureFlagCreate,
  IFeatureFlagUpdate,
  IFeatureFlagListParams,
} from '../../models/domain/support/feature.flag.domain';
import { singleton } from '../../decorators/singleton';
import { IPaginatedResponse } from '../../models/api/common/common.api';

/**
 * API endpoints for feature flag management
 */
const FEATURE_FLAG_ENDPOINTS = {
  BASE: '/support/feature-flags',
  PUBLIC: '/support/feature-flags/public',
  BULK_TOGGLE: '/support/feature-flags/bulk/toggle',
} as const;

export type { IFeatureFlagListParams };

@singleton
export class SupportFeatureFlagApiService extends ApiService {
  /**
   * List feature flags with search, filters and pagination (admin only)
   */
  public async listFeatureFlags(
    params: IFeatureFlagListParams
  ): Promise<IPaginatedResponse<IFeatureFlag>> {
    try {
      const queryString = this.buildQueryString({
        page: params.page,
        limit: params.limit,
        search: params.search,
        category: params.category,
        enabled: params.enabled,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      });
      return await this.apiGet<IPaginatedResponse<IFeatureFlag>>(
        `${FEATURE_FLAG_ENDPOINTS.BASE}${queryString}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get all feature flags (admin only)
   */
  public async getAllFeatureFlags(): Promise<IFeatureFlag[]> {
    try {
      return await this.apiGet<IFeatureFlag[]>(FEATURE_FLAG_ENDPOINTS.BASE);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get public feature flags (for clients)
   * @param clientId Optional client ID for client-specific flags
   * @param userType Optional user type for filtering
   */
  public async getPublicFeatureFlags(
    clientId?: string,
    userType?: string
  ): Promise<Record<string, boolean>> {
    try {
      const params = new URLSearchParams();
      if (clientId) params.append('clientId', clientId);
      if (userType) params.append('userType', userType);

      const queryString = params.toString();
      const url = queryString
        ? `${FEATURE_FLAG_ENDPOINTS.PUBLIC}?${queryString}`
        : FEATURE_FLAG_ENDPOINTS.PUBLIC;

      return await this.apiGet<Record<string, boolean>>(url);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a specific feature flag by ID
   */
  public async getFeatureFlagById(id: string): Promise<IFeatureFlag> {
    try {
      return await this.apiGet<IFeatureFlag>(
        `${FEATURE_FLAG_ENDPOINTS.BASE}/${id}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a new feature flag
   */
  public async createFeatureFlag(
    data: IFeatureFlagCreate
  ): Promise<IFeatureFlag> {
    try {
      return await this.apiPost<IFeatureFlag>(
        FEATURE_FLAG_ENDPOINTS.BASE,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update an existing feature flag
   */
  public async updateFeatureFlag(
    id: string,
    data: IFeatureFlagUpdate
  ): Promise<IFeatureFlag> {
    try {
      return await this.apiPatch<IFeatureFlag>(
        `${FEATURE_FLAG_ENDPOINTS.BASE}/${id}`,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete a feature flag
   */
  public async deleteFeatureFlag(id: string): Promise<void> {
    try {
      return await this.apiDelete<void>(`${FEATURE_FLAG_ENDPOINTS.BASE}/${id}`);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Bulk toggle feature flags
   * @param ids Array of feature flag IDs to toggle
   * @param enabled Whether to enable or disable the flags
   */
  public async bulkToggleFeatureFlags(
    ids: string[],
    enabled: boolean
  ): Promise<IFeatureFlag[]> {
    try {
      return await this.apiPost<IFeatureFlag[]>(
        FEATURE_FLAG_ENDPOINTS.BULK_TOGGLE,
        { ids, enabled }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
