import {
  IApiResponse,
  IPaginationRequest,
} from '../../models/api/common/common.api';
import { AxiosInstance } from 'axios';

export abstract class ApiService {
  constructor(private readonly apiClient: AxiosInstance) {}

  protected async apiGet<T>(url: string, config?: any): Promise<T> {
    try {
      const response = await this.apiClient.get<IApiResponse<T>>(url, config);
      if (!response?.data?.data) throw new Error('No data received');
      return response.data.data as T;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  protected async apiPost<T>(
    url: string,
    data?: any,
    config?: any
  ): Promise<T> {
    try {
      const response = await this.apiClient.post<IApiResponse<T>>(
        url,
        data,
        config
      );
      if (!response?.data?.data) throw new Error('No data received');
      return response.data.data as T;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  protected async apiPut<T>(url: string, data?: any, config?: any): Promise<T> {
    try {
      const response = await this.apiClient.put<IApiResponse<T>>(
        url,
        data,
        config
      );
      if (!response?.data?.data) throw new Error('No data received');
      return response.data.data as T;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  protected async apiPatch<T>(
    url: string,
    data?: any,
    config?: any
  ): Promise<T> {
    try {
      const response = await this.apiClient.patch<IApiResponse<T>>(
        url,
        data,
        config
      );
      if (!response?.data?.data) throw new Error('No data received');
      return response.data.data as T;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  protected async apiDelete<T>(url: string, config?: any): Promise<T> {
    try {
      const response = await this.apiClient.delete<IApiResponse<T>>(
        url,
        config
      );
      if (!response?.data?.data) throw new Error('No data received');
      return response.data.data as T;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  protected handleError(error: any): Error {
    if (error.response) {
      const apiError = error.response.data;
      let errorMessage = 'An error occurred';

      // Handle different error response structures
      if (apiError) {
        if (typeof apiError === 'string') {
          errorMessage = apiError;
        } else if (apiError.message) {
          // Backend returns error message directly in message field
          errorMessage = apiError.message;
        } else if (apiError.error) {
          errorMessage = apiError.error;
        } else if (apiError.data?.message) {
          errorMessage = apiError.data.message;
        } else if (apiError.data?.error) {
          errorMessage = apiError.data.error;
        }
      }

      const customError = new Error(errorMessage);
      Object.assign(customError, {
        status: error.response.status,
        code: apiError?.code,
        errors: apiError?.errors,
      });
      return customError;
    }

    // Handle network errors or other types of errors
    if (error.message) {
      return error;
    }

    // Fallback for unknown error types
    return new Error('An unexpected error occurred');
  }

  protected buildQueryString(params: any): string {
    const query = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return value
            .map((v) => `${encodeURIComponent(key)}=${encodeURIComponent(v)}`)
            .join('&');
        }
        return `${encodeURIComponent(key)}=${encodeURIComponent(
          String(value)
        )}`;
      })
      .join('&');
    return query ? `?${query}` : '';
  }

  protected buildPaginationParams(
    params?: IPaginationRequest
  ): Record<string, any> {
    if (!params) return {};

    return {
      page: params.page,
      limit: params.limit,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      search: params.search,
    };
  }
}
