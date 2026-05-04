import { singleton } from '@/shared/decorators/singleton';
import { IIntegrationProvider } from '../../integration.provider';
import { IntegrationProviderType } from '@/shared/models/common/enums';
import { logger } from '@/shared/utils/logger';

import axios, { AxiosError, AxiosInstance } from 'axios';
import { IntegrationProvider } from '../../integration.factory';

interface WorkableCredentials {
  subdomain: string;
  apiKey: string;
}

// Constants
const WORKABLE_CONSTANTS = {
  API: {
    BASE_URL_TEMPLATE: 'https://{subdomain}.workable.com',
    VERSION: 'v3',
    ENDPOINTS: {
      ACCOUNTS: 'accounts',
      JOBS: 'jobs',
      CANDIDATES: 'candidates',
    },
    TIMEOUT: 10000,
  },
  HEADERS: {
    CONTENT_TYPE: 'application/json',
    AUTHORIZATION_PREFIX: 'Bearer',
  },
  HTTP_STATUS: {
    SUCCESS_MIN: 200,
    SUCCESS_MAX: 300,
  },
  CONTEXT: {
    TEST_CONNECTION: 'WorkableAtsProvider.testConnection',
    GET_JOBS: 'WorkableAtsProvider.getJobs',
    GET_CANDIDATES: 'WorkableAtsProvider.getCandidates',
    GET_JOB: 'WorkableAtsProvider.getJob',
    GET_CANDIDATE: 'WorkableAtsProvider.getCandidate',
  },
} as const;

@singleton
export class WorkableAtsProvider implements IIntegrationProvider {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: WORKABLE_CONSTANTS.API.TIMEOUT,
    });
  }

  getProviderType(): IntegrationProviderType {
    return IntegrationProviderType.ATS;
  }

  getProviderName(): string {
    return IntegrationProvider.WORKABLE;
  }

  /**
   * Build the base URL for Workable API
   * @param subdomain The subdomain for the Workable instance
   * @returns The base URL
   */
  private buildBaseUrl(subdomain: string): string {
    return WORKABLE_CONSTANTS.API.BASE_URL_TEMPLATE.replace(
      '{subdomain}',
      subdomain
    );
  }

  /**
   * Build the API endpoint URL
   * @param baseUrl The base URL
   * @param endpoint The endpoint path
   * @returns The full API URL
   */
  private buildApiUrl(baseUrl: string, endpoint: string): string {
    return `${baseUrl}/spi/${WORKABLE_CONSTANTS.API.VERSION}/${endpoint}`;
  }

  /**
   * Get standard headers for API requests
   * @param apiKey The API key
   * @returns Headers object
   */
  private getHeaders(apiKey: string): Record<string, string> {
    return {
      Authorization: `${WORKABLE_CONSTANTS.HEADERS.AUTHORIZATION_PREFIX} ${apiKey}`,
      'Content-Type': WORKABLE_CONSTANTS.HEADERS.CONTENT_TYPE,
    };
  }

  /**
   * Test the connection to Workable API
   * @param credentials Provider-specific credentials containing subdomain and apiKey
   * @returns Promise that resolves to connection test result
   */
  async testConnection(credentials: Record<string, any>): Promise<boolean> {
    try {
      const { subdomain, apiKey } = credentials as WorkableCredentials;

      if (!subdomain || !apiKey) {
        logger.error('Missing required credentials for Workable', {
          context: WORKABLE_CONSTANTS.CONTEXT.TEST_CONNECTION,
          hasSubdomain: !!subdomain,
          hasApiKey: !!apiKey,
        });
        return false;
      }

      const baseUrl = this.buildBaseUrl(subdomain);
      const testUrl = this.buildApiUrl(
        baseUrl,
        WORKABLE_CONSTANTS.API.ENDPOINTS.ACCOUNTS
      );

      logger.info('Testing Workable connection', {
        context: WORKABLE_CONSTANTS.CONTEXT.TEST_CONNECTION,
        subdomain,
        baseUrl,
        endpoint: WORKABLE_CONSTANTS.API.ENDPOINTS.ACCOUNTS,
      });

      const response = await this.axiosInstance.get(testUrl, {
        headers: this.getHeaders(apiKey),
        timeout: WORKABLE_CONSTANTS.API.TIMEOUT,
      });

      // Check if the response is successful (2xx status)
      const isSuccessful =
        response.status >= WORKABLE_CONSTANTS.HTTP_STATUS.SUCCESS_MIN &&
        response.status < WORKABLE_CONSTANTS.HTTP_STATUS.SUCCESS_MAX;

      logger.info('Workable connection test result', {
        context: WORKABLE_CONSTANTS.CONTEXT.TEST_CONNECTION,
        status: response.status,
        isSuccessful,
      });

      return isSuccessful;
    } catch (error) {
      const axiosError = error as AxiosError;
      logger.error('Workable connection test failed', {
        context: WORKABLE_CONSTANTS.CONTEXT.TEST_CONNECTION,
        error: axiosError?.message,
        status: axiosError?.response?.status,
        statusText: axiosError?.response?.statusText,
        endpoint: WORKABLE_CONSTANTS.API.ENDPOINTS.ACCOUNTS,
        credentials: {
          hasSubdomain: !!credentials.subdomain,
          hasApiKey: !!credentials.apiKey,
          subdomain: credentials.subdomain,
        },
      });
      return false;
    }
  }

  /**
   * Get jobs from Workable
   * @param credentials Provider-specific credentials
   * @param options Query options
   * @returns Promise that resolves to jobs data
   */
  async getJobs(
    credentials: Record<string, any>,
    options: {
      limit?: number;
      offset?: number;
      state?: string;
    } = {}
  ): Promise<any> {
    try {
      const { subdomain, apiKey } = credentials as WorkableCredentials;
      const baseUrl = this.buildBaseUrl(subdomain);
      const jobsUrl = this.buildApiUrl(
        baseUrl,
        WORKABLE_CONSTANTS.API.ENDPOINTS.JOBS
      );

      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.offset) params.append('offset', options.offset.toString());
      if (options.state) params.append('state', options.state);

      const response = await this.axiosInstance.get(
        `${jobsUrl}?${params.toString()}`,
        {
          headers: this.getHeaders(apiKey),
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Failed to get jobs from Workable', {
        context: WORKABLE_CONSTANTS.CONTEXT.GET_JOBS,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get candidates from Workable
   * @param credentials Provider-specific credentials
   * @param options Query options
   * @returns Promise that resolves to candidates data
   */
  async getCandidates(
    credentials: Record<string, any>,
    options: {
      limit?: number;
      offset?: number;
      externalJobId?: string;
      state?: string;
    } = {}
  ): Promise<any> {
    try {
      const { subdomain, apiKey } = credentials as WorkableCredentials;
      const baseUrl = this.buildBaseUrl(subdomain);

      // Build URL based on whether we're getting candidates for a specific job or all candidates
      let candidatesUrl: string;
      if (options.externalJobId) {
        // Get candidates for a specific job
        candidatesUrl = this.buildApiUrl(
          baseUrl,
          `${WORKABLE_CONSTANTS.API.ENDPOINTS.JOBS}/${options.externalJobId}/${WORKABLE_CONSTANTS.API.ENDPOINTS.CANDIDATES}`
        );
      } else {
        // Get all candidates
        candidatesUrl = this.buildApiUrl(
          baseUrl,
          WORKABLE_CONSTANTS.API.ENDPOINTS.CANDIDATES
        );
      }

      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.offset) params.append('offset', options.offset.toString());
      if (options.state) params.append('state', options.state);

      const response = await this.axiosInstance.get(
        `${candidatesUrl}?${params.toString()}`,
        {
          headers: this.getHeaders(apiKey),
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Failed to get candidates from Workable', {
        context: WORKABLE_CONSTANTS.CONTEXT.GET_CANDIDATES,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get a specific job from Workable
   * @param credentials Provider-specific credentials
   * @param jobId The job ID
   * @returns Promise that resolves to job data
   */
  async getJob(credentials: Record<string, any>, jobId: string): Promise<any> {
    try {
      const { subdomain, apiKey } = credentials as WorkableCredentials;
      const baseUrl = this.buildBaseUrl(subdomain);
      const jobUrl = this.buildApiUrl(
        baseUrl,
        `${WORKABLE_CONSTANTS.API.ENDPOINTS.JOBS}/${jobId}`
      );

      const response = await this.axiosInstance.get(jobUrl, {
        headers: this.getHeaders(apiKey),
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to get job from Workable', {
        context: WORKABLE_CONSTANTS.CONTEXT.GET_JOB,
        jobId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get a specific candidate from Workable
   * @param credentials Provider-specific credentials
   * @param candidateId The candidate ID
   * @returns Promise that resolves to candidate data
   */
  async getCandidate(
    credentials: Record<string, any>,
    candidateId: string
  ): Promise<any> {
    try {
      const { subdomain, apiKey } = credentials as WorkableCredentials;
      const baseUrl = this.buildBaseUrl(subdomain);
      const candidateUrl = this.buildApiUrl(
        baseUrl,
        `${WORKABLE_CONSTANTS.API.ENDPOINTS.CANDIDATES}/${candidateId}`
      );

      const response = await this.axiosInstance.get(candidateUrl, {
        headers: this.getHeaders(apiKey),
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to get candidate from Workable', {
        context: WORKABLE_CONSTANTS.CONTEXT.GET_CANDIDATE,
        candidateId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
