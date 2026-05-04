import { singleton } from '@/shared/decorators/singleton';
import { IIntegrationProvider } from '../../integration.provider';
import { IntegrationProviderType } from '@/shared/models/common/enums';
import { logger } from '@/shared/utils/logger';
import {
  IJobPostingPublish,
  ICandidateImport,
} from '@/shared/models/domain/integration/jobboard/indeed/indeed.domain';
import { ENV } from '@/config/env';
import axios, { AxiosInstance } from 'axios';

@singleton
export class IndeedJobBoardProvider implements IIntegrationProvider {
  private readonly baseUrl: string;
  private readonly oauthBaseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private axiosInstance: AxiosInstance;

  constructor() {
    this.baseUrl = ENV.INDEED_API_BASE_URL || 'https://apis.indeed.com';
    this.oauthBaseUrl = 'https://secure.indeed.com'; // OAuth endpoints are on secure.indeed.com
    this.clientId = ENV.INDEED_CLIENT_ID || '';
    this.clientSecret = ENV.INDEED_CLIENT_SECRET || '';
    this.redirectUri = ENV.INDEED_REDIRECT_URI || '';

    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  getProviderType(): IntegrationProviderType {
    return IntegrationProviderType.JOB_BOARD;
  }

  getProviderName(): string {
    return 'Indeed';
  }

  async testConnection(credentials: Record<string, any>): Promise<boolean> {
    try {
      logger.info('Testing Indeed connection', {
        context: 'IndeedJobBoardProvider.testConnection',
        hasAccessToken: !!credentials.accessToken,
      });

      if (!credentials.accessToken) {
        logger.error('No access token provided for Indeed connection test');
        return false;
      }

      // Test connection by making a simple API call
      const response = await this.axiosInstance.get('/ads/v1/employer/jobs', {
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
        },
        params: {
          limit: 1,
        },
      });

      logger.info('Indeed connection test successful', {
        context: 'IndeedJobBoardProvider.testConnection',
        status: response.status,
      });

      return true;
    } catch (error) {
      logger.error('Indeed connection test failed', {
        context: 'IndeedJobBoardProvider.testConnection',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Generate OAuth authorization URL
   */
  generateAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      state,
      scope: 'employer_access',
    });

    return `${this.oauthBaseUrl}/oauth/v2/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    try {
      const response = await axios.post(`${this.oauthBaseUrl}/oauth/v2/token`, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code',
      });

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
      };
    } catch (error) {
      logger.error('Failed to exchange code for token', {
        context: 'IndeedJobBoardProvider.exchangeCodeForToken',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    try {
      const response = await axios.post(`${this.oauthBaseUrl}/oauth/v2/token`, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      });

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
      };
    } catch (error) {
      logger.error('Failed to refresh access token', {
        context: 'IndeedJobBoardProvider.refreshAccessToken',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Post a job to Indeed
   */
  async publishJob(
    jobData: IJobPostingPublish,
    accessToken: string
  ): Promise<{
    externalJobId: string;
    externalJobUrl: string;
    status: string;
  }> {
    try {
      logger.info('Publishing job to Indeed', {
        context: 'IndeedJobBoardProvider.publishJob',
        jobTitle: jobData.title,
      });

      const response = await this.axiosInstance.post(
        '/ads/v1/employer/jobs',
        {
          title: jobData.title,
          description: jobData.description,
          location: jobData.location,
          company: jobData.company,
          requirements: jobData.requirements,
          skills: jobData.skills,
          salaryMin: jobData.salaryMin,
          salaryMax: jobData.salaryMax,
          employmentType: jobData.employmentType,
          workLocation: jobData.workLocation,
          applicationMethod: {
            type: 'external',
            url: jobData.applicationUrl,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const jobId = response.data.id;
      const jobUrl = `https://www.indeed.com/viewjob?jk=${jobId}`;

      logger.info('Job published to Indeed successfully', {
        context: 'IndeedJobBoardProvider.publishJob',
        jobId,
        jobUrl,
      });

      return {
        externalJobId: jobId,
        externalJobUrl: jobUrl,
        status: 'published',
      };
    } catch (error) {
      logger.error('Failed to publish job to Indeed', {
        context: 'IndeedJobBoardProvider.publishJob',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get job applications from Indeed
   */
  async getJobApplications(
    externalJobId: string,
    accessToken: string
  ): Promise<ICandidateImport[]> {
    try {
      logger.info('Fetching job applications from Indeed', {
        context: 'IndeedJobBoardProvider.getJobApplications',
        externalJobId,
      });

      const response = await this.axiosInstance.get(
        `/ads/v1/employer/jobs/${externalJobId}/applications`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const candidates = response.data.applications.map((app: any) => ({
        externalCandidateId: app.candidateId,
        externalApplicationId: app.applicationId,
        firstName: app.candidate.firstName,
        lastName: app.candidate.lastName,
        email: app.candidate.email,
        phone: app.candidate.phone,
        resumeUrl: app.candidate.resumeUrl,
        appliedAt: new Date(app.appliedAt),
        status: app.status,
        source: 'JOB_BOARD_IMPORT',
        externalData: app,
      }));

      logger.info('Job applications fetched successfully', {
        context: 'IndeedJobBoardProvider.getJobApplications',
        externalJobId,
        candidateCount: candidates.length,
      });

      return candidates;
    } catch (error) {
      logger.error('Failed to fetch job applications from Indeed', {
        context: 'IndeedJobBoardProvider.getJobApplications',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Update job posting on Indeed
   */
  async updateJob(
    externalJobId: string,
    jobData: Partial<IJobPostingPublish>,
    accessToken: string
  ): Promise<boolean> {
    try {
      logger.info('Updating job on Indeed', {
        context: 'IndeedJobBoardProvider.updateJob',
        externalJobId,
      });

      await this.axiosInstance.put(
        `/ads/v1/employer/jobs/${externalJobId}`,
        jobData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      logger.info('Job updated on Indeed successfully', {
        context: 'IndeedJobBoardProvider.updateJob',
        externalJobId,
      });

      return true;
    } catch (error) {
      logger.error('Failed to update job on Indeed', {
        context: 'IndeedJobBoardProvider.updateJob',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Delete job posting from Indeed
   */
  async deleteJob(
    externalJobId: string,
    accessToken: string
  ): Promise<boolean> {
    try {
      logger.info('Deleting job from Indeed', {
        context: 'IndeedJobBoardProvider.deleteJob',
        externalJobId,
      });

      await this.axiosInstance.delete(
        `/ads/v1/employer/jobs/${externalJobId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      logger.info('Job deleted from Indeed successfully', {
        context: 'IndeedJobBoardProvider.deleteJob',
        externalJobId,
      });

      return true;
    } catch (error) {
      logger.error('Failed to delete job from Indeed', {
        context: 'IndeedJobBoardProvider.deleteJob',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
