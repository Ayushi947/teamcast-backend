import { ENV } from '@/config/env';
import { singleton } from '@/shared/decorators/singleton';
import { PrismaClient } from '@prisma/client';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';
import { IndeedJobBoardProvider } from '@/services/helpers/integration/providers/jobboard/indeed.jobboard.provider';
import {
  IJobPostingPublish,
  ICandidateImport,
  IIndeedTokenResponse,
  IIndeedJobPublishResponse,
} from '@/shared/models/domain/integration/jobboard/indeed/indeed.domain';
import {
  IntegrationStatus,
  JobPostingIntegrationStatus,
  IntegrationSyncStatus,
  CandidateSource,
  UserTypeEnum,
  UserStatusEnum,
  ApplicationStatusEnum,
} from '@/shared/models/common/enums';

import { randomBytes } from 'crypto';

// Type definitions for Prisma JSON fields
interface IntegrationConfig {
  oauthState?: string;
  oauthStateExpiry?: Date;
  [key: string]: any;
}

interface IntegrationCredentials {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenExpiry?: Date;
  [key: string]: any;
}

@singleton
export class IndeedService {
  private readonly prisma: PrismaClient;
  private readonly indeedProvider: IndeedJobBoardProvider;

  constructor() {
    this.prisma = new PrismaClient();
    this.indeedProvider = new IndeedJobBoardProvider();
  }

  /**
   * Initiate Indeed integration by creating client_integration entry and generating OAuth URL
   * This is the entry point when a client clicks "Integrate with Indeed" button
   */
  async initiateIntegration(
    clientId: string,
    integrationName?: string
  ): Promise<{
    clientIntegrationId: string;
    authUrl: string;
    state: string;
  }> {
    try {
      logger.info('Initiating Indeed integration', {
        context: 'IndeedService.initiateIntegration',
        clientId,
        integrationName,
      });

      // Find Indeed provider
      const indeedProvider = await this.prisma.integration_provider.findFirst({
        where: {
          name: 'Indeed',
          isActive: true,
        },
      });

      if (!indeedProvider) {
        throw new AppError(
          'Indeed integration provider not found or inactive',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Check if client already has an Indeed integration
      const existingIntegration =
        await this.prisma.client_integration.findFirst({
          where: {
            clientId,
            providerId: indeedProvider.id,
          },
        });

      if (
        existingIntegration &&
        existingIntegration.status === IntegrationStatus.ACTIVE
      ) {
        throw new AppError(
          'Client already has an active Indeed integration',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      // Generate state parameter for OAuth security
      const state = randomBytes(32).toString('hex');

      // Create or update client integration
      const clientIntegration = existingIntegration
        ? await this.prisma.client_integration.update({
            where: { id: existingIntegration.id },
            data: {
              name: integrationName || 'Indeed Integration',
              status: IntegrationStatus.INACTIVE,
              config: {
                oauthState: state,
                oauthStateExpiry: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
              },
              credentials: undefined, // Clear any existing credentials
              lastError: null,
              errorCount: 0,
              updatedAt: new Date(),
            },
          })
        : await this.prisma.client_integration.create({
            data: {
              clientId,
              providerId: indeedProvider.id,
              name: integrationName || 'Indeed Integration',
              status: IntegrationStatus.INACTIVE,
              config: {
                oauthState: state,
                oauthStateExpiry: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
              },
            },
          });

      const authUrl = this.indeedProvider.generateAuthUrl(state);

      logger.info('Indeed integration initiated successfully', {
        context: 'IndeedService.initiateIntegration',
        clientId,
        clientIntegrationId: clientIntegration.id,
        authUrl,
      });

      return {
        clientIntegrationId: clientIntegration.id,
        authUrl,
        state,
      };
    } catch (error) {
      logger.error('Failed to initiate Indeed integration', {
        context: 'IndeedService.initiateIntegration',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
      });
      throw error;
    }
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   * Modified to work with state parameter to identify the integration
   */
  async handleOAuthCallback(
    code: string,
    state: string
  ): Promise<{
    clientIntegrationId: string;
    tokens: IIndeedTokenResponse;
  }> {
    try {
      logger.info('Handling Indeed OAuth callback', {
        context: 'IndeedService.handleOAuthCallback',
        state,
      });

      // Find client integration by state
      const integration = await this.prisma.client_integration.findFirst({
        where: {
          config: {
            path: ['oauthState'],
            equals: state,
          },
        },
        include: { provider: true },
      });

      if (!integration) {
        throw new AppError(
          'Invalid OAuth state parameter or integration not found',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      // Verify provider is Indeed
      if (integration.provider.name !== 'Indeed') {
        throw new AppError(
          'Invalid provider for Indeed integration',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      // Verify state hasn't expired
      const config = (integration.config || {}) as IntegrationConfig;
      const stateExpiry = config.oauthStateExpiry;

      if (!stateExpiry || new Date() > new Date(stateExpiry)) {
        throw new AppError(
          'OAuth state has expired',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      // Exchange code for tokens
      const tokens = await this.indeedProvider.exchangeCodeForToken(code);

      // Update integration with tokens and activate it
      await this.prisma.client_integration.update({
        where: { id: integration.id },
        data: {
          credentials: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: tokens.expiresIn,
            tokenExpiry: new Date(Date.now() + tokens.expiresIn * 1000),
          },
          status: IntegrationStatus.ACTIVE,
          config: {
            ...config,
            oauthState: null,
            oauthStateExpiry: null,
          },
          lastError: null,
          errorCount: 0,
          updatedAt: new Date(),
        },
      });

      logger.info('Indeed OAuth callback handled successfully', {
        context: 'IndeedService.handleOAuthCallback',
        clientIntegrationId: integration.id,
      });

      return {
        clientIntegrationId: integration.id,
        tokens,
      };
    } catch (error) {
      logger.error('Failed to handle Indeed OAuth callback', {
        context: 'IndeedService.handleOAuthCallback',
        error: error instanceof Error ? error.message : 'Unknown error',
        state,
      });
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(
    clientIntegrationId: string
  ): Promise<IIndeedTokenResponse> {
    try {
      logger.info('Refreshing Indeed access token', {
        context: 'IndeedService.refreshAccessToken',
        clientIntegrationId,
      });

      const integration = await this.prisma.client_integration.findUnique({
        where: { id: clientIntegrationId },
      });

      if (!integration) {
        throw new AppError(
          'Client integration not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      const credentials = (integration.credentials ||
        {}) as IntegrationCredentials;
      const refreshToken = credentials.refreshToken;
      if (!refreshToken) {
        throw new AppError(
          'No refresh token available',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      const tokens = await this.indeedProvider.refreshAccessToken(refreshToken);

      // Update integration with new tokens
      await this.prisma.client_integration.update({
        where: { id: clientIntegrationId },
        data: {
          credentials: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: tokens.expiresIn,
            tokenExpiry: new Date(Date.now() + tokens.expiresIn * 1000),
          },
        },
      });

      logger.info('Indeed access token refreshed successfully', {
        context: 'IndeedService.refreshAccessToken',
        clientIntegrationId,
      });

      return tokens;
    } catch (error) {
      logger.error('Failed to refresh Indeed access token', {
        context: 'IndeedService.refreshAccessToken',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientIntegrationId,
      });
      throw error;
    }
  }

  /**
   * Publish job to Indeed
   */
  async publishJob(
    clientIntegrationId: string,
    jobPostingId: string
  ): Promise<IIndeedJobPublishResponse> {
    try {
      logger.info('Publishing job to Indeed', {
        context: 'IndeedService.publishJob',
        clientIntegrationId,
        jobPostingId,
      });

      // Get job posting and integration
      const jobPosting = await this.prisma.job_posting.findFirst({
        where: { id: jobPostingId },
        include: {
          client: {
            include: {
              company: true,
            },
          },
        },
      });

      if (!jobPosting) {
        throw new AppError('Job posting not found', 404, ErrorCode.NOT_FOUND);
      }

      const integration = await this.prisma.client_integration.findFirst({
        where: {
          id: clientIntegrationId,
          status: IntegrationStatus.ACTIVE,
        },
      });

      if (!integration) {
        throw new AppError(
          'Integration not found or inactive',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      const credentials = (integration.credentials ||
        {}) as IntegrationCredentials;
      const accessToken = credentials.accessToken;
      if (!accessToken) {
        throw new AppError(
          'No access token available',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      // Check if job posting integration already exists
      const existingJobIntegration =
        await this.prisma.job_posting_integration.findUnique({
          where: {
            jobPostingId_clientIntegrationId: {
              jobPostingId,
              clientIntegrationId,
            },
          },
        });

      if (existingJobIntegration) {
        throw new AppError(
          'Job is already published to this integration',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      // Prepare job data for Indeed
      const jobData: IJobPostingPublish = {
        title: jobPosting.title,
        description: jobPosting.description,
        location: jobPosting.preferredLocations?.[0] || '',
        company: jobPosting.client.company?.name || 'Company',
        requirements: jobPosting.requiredSkills || [],
        skills: jobPosting.requiredSkills || [],
        salaryMin: jobPosting.minSalary || undefined,
        salaryMax: jobPosting.maxSalary || undefined,
        employmentType: jobPosting.jobCommitment || '',
        workLocation: jobPosting.preferredLocations?.[0] || 'onsite',
        applicationUrl: `${ENV.FRONTEND_URL}/jobs/${jobPosting.id}/apply`,
      };

      // Publish job to Indeed
      const result = await this.indeedProvider.publishJob(jobData, accessToken);

      // Create job posting integration record
      const jobPostingIntegration =
        await this.prisma.job_posting_integration.create({
          data: {
            jobPostingId,
            clientIntegrationId,
            externalJobId: result.externalJobId,
            externalJobUrl: result.externalJobUrl,
            externalJobData: result,
            status: JobPostingIntegrationStatus.PUBLISHED,
            syncStatus: IntegrationSyncStatus.COMPLETED,
            publishedAt: new Date(),
            publishedBy: integration.clientId,
            lastSyncedAt: new Date(),
          },
        });

      logger.info('Job published to Indeed successfully', {
        context: 'IndeedService.publishJob',
        clientIntegrationId,
        jobPostingId,
        externalJobId: result.externalJobId,
        integrationId: jobPostingIntegration.id,
      });

      return result;
    } catch (error) {
      logger.error('Failed to publish job to Indeed', {
        context: 'IndeedService.publishJob',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientIntegrationId,
        jobPostingId,
      });
      throw error;
    }
  }

  /**
   * Import candidates from Indeed and create job applications in TeamCast
   */
  async importCandidates(
    clientIntegrationId: string,
    jobPostingIntegrationId: string
  ): Promise<{
    importedCount: number;
    duplicateCount: number;
    errorCount: number;
    candidates: ICandidateImport[];
  }> {
    try {
      logger.info('Importing candidates from Indeed', {
        context: 'IndeedService.importCandidates',
        clientIntegrationId,
        jobPostingIntegrationId,
      });

      const integration = await this.prisma.client_integration.findUnique({
        where: { id: clientIntegrationId },
      });

      if (!integration) {
        throw new AppError(
          'Client integration not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      const jobIntegration =
        await this.prisma.job_posting_integration.findUnique({
          where: { id: jobPostingIntegrationId },
          include: { jobPosting: true },
        });

      if (!jobIntegration) {
        throw new AppError(
          'Job posting integration not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      const credentials = (integration.credentials ||
        {}) as IntegrationCredentials;
      const accessToken = credentials.accessToken;
      if (!accessToken) {
        throw new AppError(
          'No access token available',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      // Fetch candidates from Indeed
      const candidates = await this.indeedProvider.getJobApplications(
        jobIntegration.externalJobId!,
        accessToken
      );

      let importedCount = 0;
      let duplicateCount = 0;
      let errorCount = 0;

      // Process each candidate
      for (const candidate of candidates) {
        try {
          // Check if candidate already exists by external application ID
          const existingCandidateIntegration =
            await this.prisma.candidate_integration.findFirst({
              where: {
                externalApplicationId: candidate.externalApplicationId,
                jobPostingIntegrationId,
              },
            });

          if (existingCandidateIntegration) {
            duplicateCount++;
            continue;
          }

          // Find or create candidate by email
          let candidateRecord = await this.prisma.candidate.findFirst({
            where: {
              user: {
                email: candidate.email,
              },
            },
          });

          // If candidate doesn't exist, create new candidate
          if (!candidateRecord) {
            // Create user record first
            const userRecord = await this.prisma.user.create({
              data: {
                email: candidate.email,
                name: `${candidate.firstName} ${candidate.lastName}`,
                type: UserTypeEnum.CANDIDATE,
                status: UserStatusEnum.ACTIVE,
              },
            });

            // Create candidate record
            candidateRecord = await this.prisma.candidate.create({
              data: {
                userId: userRecord.id,
              },
            });
          }

          // Create job application
          const jobApplication = await this.prisma.job_application.create({
            data: {
              candidateId: candidateRecord.id,
              jobPostingId: jobIntegration.jobPostingId,
              status: ApplicationStatusEnum.APPLIED,
              appliedAt: candidate.appliedAt
                ? new Date(candidate.appliedAt)
                : new Date(),
            },
          });

          // Create candidate integration record
          await this.prisma.candidate_integration.create({
            data: {
              candidateId: candidateRecord.id,
              jobPostingIntegrationId,
              externalCandidateId: candidate.externalCandidateId,
              externalApplicationId: candidate.externalApplicationId,
              externalCandidateData: candidate.externalData,
              source: CandidateSource.JOB_BOARD_IMPORT,
              syncStatus: IntegrationSyncStatus.COMPLETED,
              lastSyncedAt: new Date(),
            },
          });

          logger.info('Candidate imported successfully', {
            context: 'IndeedService.importCandidates',
            candidateId: candidateRecord.id,
            jobApplicationId: jobApplication.id,
            externalCandidateId: candidate.externalCandidateId,
          });

          importedCount++;
        } catch (error) {
          logger.error('Failed to import candidate', {
            context: 'IndeedService.importCandidates',
            error: error instanceof Error ? error.message : 'Unknown error',
            candidateId: candidate.externalCandidateId,
          });
          errorCount++;
        }
      }

      // Update job integration sync status
      await this.prisma.job_posting_integration.update({
        where: { id: jobPostingIntegrationId },
        data: {
          syncStatus: IntegrationSyncStatus.COMPLETED,
          lastSyncedAt: new Date(),
        },
      });

      logger.info('Candidates imported from Indeed successfully', {
        context: 'IndeedService.importCandidates',
        importedCount,
        duplicateCount,
        errorCount,
      });

      return {
        importedCount,
        duplicateCount,
        errorCount,
        candidates,
      };
    } catch (error) {
      logger.error('Failed to import candidates from Indeed', {
        context: 'IndeedService.importCandidates',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientIntegrationId,
        jobPostingIntegrationId,
      });
      throw error;
    }
  }

  /**
   * Test connection to Indeed
   */
  async testConnection(clientIntegrationId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      logger.info('Testing Indeed connection', {
        context: 'IndeedService.testConnection',
        clientIntegrationId,
      });

      const integration = await this.prisma.client_integration.findUnique({
        where: { id: clientIntegrationId },
      });

      if (!integration) {
        throw new AppError(
          'Client integration not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      const credentials = (integration.credentials ||
        {}) as IntegrationCredentials;
      const accessToken = credentials.accessToken;
      if (!accessToken) {
        return {
          success: false,
          message: 'No access token available. Please complete OAuth flow.',
        };
      }

      const success = await this.indeedProvider.testConnection({
        accessToken,
      });

      const message = success
        ? 'Connection to Indeed successful'
        : 'Connection to Indeed failed';

      logger.info('Indeed connection test completed', {
        context: 'IndeedService.testConnection',
        clientIntegrationId,
        success,
      });

      return { success, message };
    } catch (error) {
      logger.error('Failed to test Indeed connection', {
        context: 'IndeedService.testConnection',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientIntegrationId,
      });
      return {
        success: false,
        message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Update job on Indeed
   */
  async updateJob(
    clientIntegrationId: string,
    jobPostingId: string,
    jobData: Partial<IJobPostingPublish>
  ): Promise<boolean> {
    try {
      logger.info('Updating job on Indeed', {
        context: 'IndeedService.updateJob',
        clientIntegrationId,
        jobPostingId,
      });

      const integration = await this.prisma.client_integration.findUnique({
        where: { id: clientIntegrationId },
      });

      if (!integration) {
        throw new AppError(
          'Client integration not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      const jobIntegration =
        await this.prisma.job_posting_integration.findUnique({
          where: {
            jobPostingId_clientIntegrationId: {
              jobPostingId,
              clientIntegrationId,
            },
          },
        });

      if (!jobIntegration) {
        throw new AppError(
          'Job posting integration not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      const credentials = (integration.credentials ||
        {}) as IntegrationCredentials;
      const accessToken = credentials.accessToken;
      if (!accessToken) {
        throw new AppError(
          'No access token available',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      // Update job on Indeed
      const success = await this.indeedProvider.updateJob(
        jobIntegration.externalJobId!,
        jobData,
        accessToken
      );

      // Update job posting integration record
      await this.prisma.job_posting_integration.update({
        where: { id: jobIntegration.id },
        data: {
          syncStatus: IntegrationSyncStatus.COMPLETED,
          lastSyncedAt: new Date(),
        },
      });

      logger.info('Job updated on Indeed successfully', {
        context: 'IndeedService.updateJob',
        clientIntegrationId,
        jobPostingId,
        success,
      });

      return success;
    } catch (error) {
      logger.error('Failed to update job on Indeed', {
        context: 'IndeedService.updateJob',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientIntegrationId,
        jobPostingId,
      });
      throw error;
    }
  }

  /**
   * Delete job from Indeed
   */
  async deleteJob(
    clientIntegrationId: string,
    jobPostingId: string
  ): Promise<boolean> {
    try {
      logger.info('Deleting job from Indeed', {
        context: 'IndeedService.deleteJob',
        clientIntegrationId,
        jobPostingId,
      });

      const integration = await this.prisma.client_integration.findUnique({
        where: { id: clientIntegrationId },
      });

      if (!integration) {
        throw new AppError(
          'Client integration not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      const jobIntegration =
        await this.prisma.job_posting_integration.findUnique({
          where: {
            jobPostingId_clientIntegrationId: {
              jobPostingId,
              clientIntegrationId,
            },
          },
        });

      if (!jobIntegration) {
        throw new AppError(
          'Job posting integration not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      const credentials = (integration.credentials ||
        {}) as IntegrationCredentials;
      const accessToken = credentials.accessToken;
      if (!accessToken) {
        throw new AppError(
          'No access token available',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      // Delete job from Indeed
      const success = await this.indeedProvider.deleteJob(
        jobIntegration.externalJobId!,
        accessToken
      );

      // Update job posting integration record
      await this.prisma.job_posting_integration.update({
        where: { id: jobIntegration.id },
        data: {
          status: JobPostingIntegrationStatus.DELETED,
          syncStatus: IntegrationSyncStatus.COMPLETED,
          lastSyncedAt: new Date(),
        },
      });

      logger.info('Job deleted from Indeed successfully', {
        context: 'IndeedService.deleteJob',
        clientIntegrationId,
        jobPostingId,
        success,
      });

      return success;
    } catch (error) {
      logger.error('Failed to delete job from Indeed', {
        context: 'IndeedService.deleteJob',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientIntegrationId,
        jobPostingId,
      });
      throw error;
    }
  }
}
