import { singleton } from '@/shared/decorators/singleton';
import { Prisma, PrismaClient } from '@prisma/client';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';
import { EncryptionService } from '@/utils/encryption';
import {
  IWorkableConnectionRequest,
  IWorkableConnectionResponse,
  IWorkableValidationResponse,
  IWorkableCandidateImportRequest,
  IWorkableCandidateImportResponse,
  IWorkableJobImportRequest,
  IWorkableJobImportResponse,
  IWorkableImportedJob,
  IWorkableAvailableJob,
  IWorkableJobSelectionRequest,
  IWorkableCredentials,
} from '@/shared/models/domain/integration/ats/workable/workable.integration.domain';
import {
  IntegrationStatus,
  UserTypeEnum,
  JobPostingIntegrationStatus,
  JobPostingStatusEnum,
  CandidateSource,
  IntegrationSyncStatus,
  CompanyIndustryEnum,
} from '@/shared/models/common/enums';
import {
  IntegrationsFactory,
  IntegrationProvider,
} from '@/services/helpers/integration/integration.factory';
import { WorkableAtsProvider } from '@/services/helpers/integration/providers/ats/workable.ats.provider';
import {
  mapWorkableCandidateToProfile,
  mapJobStatus,
} from './mapper/workable.mapper';
import { IWorkableCandidate } from '@/shared/models/domain/integration/ats/workable/candidate/workable.candidate.domain';
import { IWorkableJob } from '@/shared/models/domain/integration/ats/workable/jobposting/workable.job.domain';
import { JobParserFactory } from '@/services/helpers/ai.job.parser/job.parser.factory';
import { StorageFactory } from '@/services/helpers/storage/storage.factory';
import { JobParsingMode } from '@/shared/models/domain/client/job.parsing.domain';
import { getBucketFolderPathToJobPosting } from '@/utils/presigned.urls';
import { IJobParserProvider } from '@/services/helpers/ai.job.parser/job.parser.provider';

@singleton
export class WorkableIntegrationService {
  private readonly prisma: PrismaClient;
  private readonly API_VERSION: string;
  private readonly storageProvider: any;
  private readonly jobParserProvider: IJobParserProvider;

  constructor() {
    this.prisma = new PrismaClient();
    this.API_VERSION = 'v3';
    this.storageProvider = StorageFactory.getInstance().getProvider();
    this.jobParserProvider = JobParserFactory.getInstance().getProvider();
  }

  /**
   * Connect to Workable by creating a new integration
   */
  async connectWorkable(
    clientId: string,
    connectionRequest: IWorkableConnectionRequest
  ): Promise<IWorkableConnectionResponse> {
    try {
      // Get Workable provider
      const workableProvider = await this.prisma.integration_provider.findFirst(
        {
          where: { name: 'Workable', isActive: true },
        }
      );

      if (!workableProvider) {
        throw new AppError(
          'Workable provider not found',
          404,
          ErrorCode.INTEGRATION_PROVIDER_NOT_FOUND
        );
      }

      // Check if integration already exists
      const existingIntegration =
        await this.prisma.client_integration.findUnique({
          where: {
            clientId_providerId: { clientId, providerId: workableProvider.id },
          },
        });

      // Test connection first
      const workableProviderInstance =
        IntegrationsFactory.getInstance().getProvider(
          IntegrationProvider.WORKABLE
        ) as WorkableAtsProvider;

      const credentials: IWorkableCredentials = {
        subdomain: connectionRequest.subdomain,
        apiKey: connectionRequest.apiKey,
      };

      const connectionTest =
        await workableProviderInstance.testConnection(credentials);
      const integrationStatus = connectionTest
        ? IntegrationStatus.ACTIVE
        : IntegrationStatus.ERROR;

      // Encrypt credentials before storing
      const encryptedCredentials =
        EncryptionService.encryptCredentials(credentials);

      let integration;

      if (existingIntegration) {
        // If integration exists and is ACTIVE, throw error
        if (existingIntegration.status === IntegrationStatus.ACTIVE) {
          throw new AppError(
            'Workable integration already exists and is active',
            400,
            ErrorCode.INVALID_REQUEST
          );
        }

        // If integration exists but is in ERROR, INACTIVE, or SYNCING state, update it
        integration = await this.prisma.client_integration.update({
          where: { id: existingIntegration.id },
          data: {
            name: connectionRequest.name,
            description: connectionRequest.description,
            status: integrationStatus,
            credentials:
              encryptedCredentials as unknown as Prisma.InputJsonValue,
            config: {
              subdomain: connectionRequest.subdomain,
              apiVersion: this.API_VERSION,
              baseUrl: `https://${connectionRequest.subdomain}.workable.com`,
            },
            autoSyncEnabled: false,
            lastError: connectionTest
              ? null
              : 'Connection test failed during reconnection',
            errorCount: connectionTest
              ? 0
              : (existingIntegration.errorCount || 0) + 1,
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new integration
        integration = await this.prisma.client_integration.create({
          data: {
            clientId,
            providerId: workableProvider.id,
            name: connectionRequest.name,
            description: connectionRequest.description,
            status: integrationStatus,
            credentials:
              encryptedCredentials as unknown as Prisma.InputJsonValue,
            config: {
              subdomain: connectionRequest.subdomain,
              apiVersion: this.API_VERSION,
              baseUrl: `https://${connectionRequest.subdomain}.workable.com`,
            },
            autoSyncEnabled: false,
            lastError: connectionTest
              ? null
              : 'Connection test failed during setup',
            errorCount: connectionTest ? 0 : 1,
          },
        });
      }

      const isUpdate = !!existingIntegration;

      return {
        integrationId: integration.id,
        status: integrationStatus,
        message: connectionTest
          ? `Workable integration ${isUpdate ? 'updated' : 'created'} successfully`
          : `Integration ${isUpdate ? 'updated' : 'created'} but connection test failed`,
        connectionTest: {
          success: connectionTest,
          message: connectionTest
            ? 'Connection test successful'
            : 'Connection test failed. Please verify credentials.',
        },
      };
    } catch (error) {
      logger.error('Failed to connect Workable', { error });
      if (error instanceof AppError) throw error;
      throw new AppError(
        'Failed to create or update Workable integration',
        500,
        ErrorCode.INTEGRATION_CONNECTION_FAILED
      );
    }
  }

  /**
   * Validate existing Workable connection
   */
  async validateConnection(
    clientId: string,
    integrationId: string
  ): Promise<IWorkableValidationResponse> {
    try {
      const integration = await this.prisma.client_integration.findFirst({
        where: { id: integrationId, clientId },
        include: { provider: true },
      });

      if (!integration) {
        throw new AppError('Integration not found', 404, ErrorCode.NOT_FOUND);
      }

      if (integration.provider.name !== 'Workable') {
        throw new AppError(
          'Not a Workable integration',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      // Decrypt credentials
      let credentials: IWorkableCredentials;
      try {
        const credentialsData = integration.credentials as unknown as string;
        credentials =
          EncryptionService.decryptCredentials<IWorkableCredentials>(
            credentialsData
          );
      } catch (_error) {
        throw new AppError(
          'Failed to decrypt credentials',
          400,
          ErrorCode.INTEGRATION_CREDENTIALS_INVALID
        );
      }

      if (!credentials?.subdomain || !credentials?.apiKey) {
        throw new AppError(
          'Invalid credentials',
          400,
          ErrorCode.INTEGRATION_CREDENTIALS_INVALID
        );
      }

      const workableProvider = IntegrationsFactory.getInstance().getProvider(
        IntegrationProvider.WORKABLE
      ) as WorkableAtsProvider;

      const isValid = await workableProvider.testConnection(credentials);

      // Update status
      await this.prisma.client_integration.update({
        where: { id: integrationId },
        data: {
          status: isValid ? IntegrationStatus.ACTIVE : IntegrationStatus.ERROR,
          lastError: isValid ? null : 'Connection validation failed',
        },
      });

      return {
        isValid,
        message: isValid
          ? 'Connection is valid'
          : 'Connection validation failed',
        details: {
          subdomain: credentials.subdomain,
          apiEndpoint: `https://${credentials.subdomain}.workable.com/spi/v3`,
        },
      };
    } catch (error) {
      logger.error('Failed to validate connection', { error });
      if (error instanceof AppError) throw error;
      throw new AppError(
        'Failed to validate connection',
        500,
        ErrorCode.INTEGRATION_CONNECTION_FAILED
      );
    }
  }

  /**
   * Import candidates from Workable
   */
  async importCandidates(
    clientId: string,
    integrationId: string,
    importRequest: IWorkableCandidateImportRequest
  ): Promise<IWorkableCandidateImportResponse> {
    try {
      const integration = await this.prisma.client_integration.findFirst({
        where: { id: integrationId, clientId },
        include: { provider: true },
      });

      if (
        !integration ||
        integration.provider.name !== IntegrationProvider.WORKABLE
      ) {
        throw new AppError(
          'Workable integration not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Decrypt credentials
      let credentials: IWorkableCredentials;
      try {
        const credentialsData = integration.credentials as unknown as string;
        credentials =
          EncryptionService.decryptCredentials<IWorkableCredentials>(
            credentialsData
          );
      } catch (_error) {
        throw new AppError(
          'Failed to decrypt credentials',
          400,
          ErrorCode.INTEGRATION_CREDENTIALS_INVALID
        );
      }
      const workableProvider = IntegrationsFactory.getInstance().getProvider(
        IntegrationProvider.WORKABLE
      ) as WorkableAtsProvider;

      const workableCandidates = await workableProvider.getCandidates(
        credentials,
        {
          limit: importRequest.limit || 50,
          offset: importRequest.offset || 0,
          externalJobId: importRequest.externalJobId,
          state: importRequest.state,
        }
      );

      let importedCount = 0;
      let skippedCount = 0; // Actually represents updated existing candidates
      let errorCount = 0;
      const errors: Array<{ candidateId: string; error: string }> = [];

      // Find or create job posting integration for linking candidates
      let jobPostingIntegration = null;

      if (importRequest.externalJobId) {
        // If importing candidates for a specific job, find the job posting integration
        jobPostingIntegration =
          await this.prisma.job_posting_integration.findFirst({
            where: {
              clientIntegrationId: integrationId,
              externalJobId: importRequest.externalJobId,
            },
          });

        if (!jobPostingIntegration) {
          throw new AppError(
            `Job posting integration not found for job ID: ${importRequest.externalJobId}. Please import the job first.`,
            404,
            ErrorCode.NOT_FOUND
          );
        }
      } else {
        // If importing general candidates, find the first available job posting integration
        jobPostingIntegration =
          await this.prisma.job_posting_integration.findFirst({
            where: {
              clientIntegrationId: integrationId,
            },
          });

        if (!jobPostingIntegration) {
          throw new AppError(
            'No job posting integration found. Please import at least one job first before importing candidates.',
            404,
            ErrorCode.NOT_FOUND
          );
        }
      }

      // Process each candidate
      for (const workableCandidate of workableCandidates.candidates || []) {
        try {
          // Check if user already exists by email
          const existingUser = await this.prisma.user.findFirst({
            where: { email: workableCandidate.email },
            include: { candidate: true },
          });

          let candidate;

          if (existingUser && existingUser.candidate) {
            // User and candidate already exist
            candidate = existingUser.candidate;
          } else {
            // Map Workable candidate to profile data
            const candidateProfile =
              mapWorkableCandidateToProfile(workableCandidate);

            // Create new user and candidate
            const newUser = await this.prisma.user.create({
              data: {
                name: candidateProfile.name,
                email: candidateProfile.email,
                type: UserTypeEnum.CANDIDATE,
                status: candidateProfile.status,
                role: candidateProfile.role,
                emailVerified: new Date(),
              },
            });

            candidate = await this.prisma.candidate.create({
              data: {
                userId: newUser.id,
                status: candidateProfile.candidateStatus,
                jobSearchStatus: candidateProfile.jobSearchStatus,
                assessmentStage: candidateProfile.assessmentStage,
                resumeAssessmentStatus: candidateProfile.resumeAssessmentStatus,
                onboardingAssessmentStatus:
                  candidateProfile.onboardingAssessmentStatus,
                isPublished: candidateProfile.isPublished,
                completionPercentage: candidateProfile.completionPercentage,
              },
            });
          }

          // Check if candidate integration already exists
          const existingCandidateIntegration =
            await this.prisma.candidate_integration.findUnique({
              where: {
                candidateId_jobPostingIntegrationId: {
                  candidateId: candidate.id,
                  jobPostingIntegrationId: jobPostingIntegration.id,
                },
              },
            });

          if (existingCandidateIntegration) {
            // Update existing candidate integration with latest data from Workable
            await this.updateCandidateIntegrationData(
              existingCandidateIntegration.id,
              workableCandidate,
              candidate.id
            );
            skippedCount++;
            continue;
          }

          // Create candidate integration record
          await this.prisma.candidate_integration.create({
            data: {
              candidateId: candidate.id,
              jobPostingIntegrationId: jobPostingIntegration.id,
              externalCandidateId: workableCandidate.id?.toString(),
              externalApplicationId:
                workableCandidate.application_id?.toString(),
              externalCandidateData: workableCandidate,
              source: CandidateSource.ATS_IMPORT,
              pipelineStage: workableCandidate.stage || undefined,
              pipelineData: workableCandidate.stage
                ? ({
                    stage: workableCandidate.stage,
                    disqualified: workableCandidate.disqualified,
                    disqualified_at: workableCandidate.disqualified_at,
                    disqualification_reason:
                      workableCandidate.disqualification_reason,
                    sourced: workableCandidate.sourced,
                  } as Prisma.InputJsonValue)
                : undefined,
            },
          });

          importedCount++;
        } catch (candidateError) {
          errorCount++;
          errors.push({
            candidateId: workableCandidate.id?.toString() || 'unknown',
            error:
              candidateError instanceof Error
                ? candidateError.message
                : 'Unknown error',
          });
        }
      }

      // Update sync info
      await this.prisma.client_integration.update({
        where: { id: integrationId },
        data: {
          lastSyncAt: new Date(),
          status:
            errorCount === 0
              ? IntegrationStatus.ACTIVE
              : IntegrationStatus.ERROR,
          errorCount: errorCount,
          lastError:
            errorCount > 0 ? `${errorCount} candidates failed to sync` : null,
          lastErrorAt: errorCount > 0 ? new Date() : undefined,
        },
      });

      return {
        success: importedCount > 0 || errorCount === 0,
        message: `Import completed: ${importedCount} imported, ${skippedCount} updated, ${errorCount} errors`,
        importedCount,
        skippedCount,
        errorCount,
        candidates:
          workableCandidates.candidates.map(mapWorkableCandidateToProfile) ||
          [],
        errors,
      };
    } catch (error) {
      logger.error('Failed to import candidates', { error });
      if (error instanceof AppError) throw error;
      throw new AppError(
        'Failed to import candidates',
        500,
        ErrorCode.INTEGRATION_SYNC_FAILED
      );
    }
  }

  /**
   * Import jobs from Workable
   */
  async importJobs(
    clientId: string,
    integrationId: string,
    importRequest: IWorkableJobImportRequest
  ): Promise<IWorkableJobImportResponse> {
    try {
      const integration = await this.prisma.client_integration.findFirst({
        where: { id: integrationId, clientId },
        include: { provider: true },
      });

      if (
        !integration ||
        integration.provider.name !== IntegrationProvider.WORKABLE
      ) {
        throw new AppError(
          'Workable integration not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Decrypt credentials
      let credentials: IWorkableCredentials;
      try {
        const credentialsData = integration.credentials as unknown as string;
        credentials =
          EncryptionService.decryptCredentials<IWorkableCredentials>(
            credentialsData
          );
      } catch (_error) {
        throw new AppError(
          'Failed to decrypt credentials',
          400,
          ErrorCode.INTEGRATION_CREDENTIALS_INVALID
        );
      }
      const workableProvider = IntegrationsFactory.getInstance().getProvider(
        IntegrationProvider.WORKABLE
      ) as WorkableAtsProvider;

      const workableJobs = await workableProvider.getJobs(credentials, {
        limit: importRequest.limit || 50,
        offset: importRequest.offset || 0,
        state: importRequest.state,
      });

      // Default sync to true if not specified
      const shouldSync = importRequest.sync !== false;

      // If sync is false, return available jobs for manual selection
      if (!shouldSync) {
        return await this.getAvailableJobsForSelection(
          integrationId,
          workableJobs.jobs || []
        );
      }

      let importedCount = 0;
      let skippedCount = 0; // Actually represents updated existing jobs
      let errorCount = 0;
      const errors: Array<{ jobId: string; error: string }> = [];
      const importedJobs: IWorkableImportedJob[] = [];

      // Process each job
      for (const workableJob of workableJobs.jobs || []) {
        try {
          // Check if job already exists by external job ID in job_posting_integration
          const existingJobIntegration =
            await this.prisma.job_posting_integration.findFirst({
              where: {
                clientIntegrationId: integrationId,
                externalJobId:
                  workableJob.shortcode || workableJob.id?.toString(),
              },
              include: { jobPosting: true },
            });

          if (existingJobIntegration) {
            // Update existing job integration with latest data from Workable
            await this.updateJobIntegrationData(
              existingJobIntegration.id,
              existingJobIntegration.jobPostingId,
              workableJob
            );
            skippedCount++;
            continue;
          }

          const clientUser = await this.prisma.client_user.findFirst({
            where: { client: { id: clientId } },
          });

          if (!clientUser) {
            throw new Error('No client user found to set as creator');
          }

          // Parse Workable job using job parsing service
          const parsedJob = await this.parseWorkableJob(workableJob);

          // Create job posting with parsed data
          const newJob = await this.prisma.job_posting.create({
            data: {
              clientId,
              createdById: clientUser.id,
              title: parsedJob.title || workableJob.title || 'Untitled Job',
              description:
                parsedJob.description || workableJob.description || '',
              jobType: parsedJob.jobType,
              jobCommitment: parsedJob.jobCommitment || 'FULL_TIME',
              jobSchedule: parsedJob.jobSchedule || 'REGULAR',
              industry: this.mapIndustryToEnum(
                parsedJob.industry ||
                  (typeof workableJob.industry === 'string'
                    ? workableJob.industry
                    : workableJob.industry?.name)
              ),
              totalExperience: parsedJob.totalExperience || 0,
              department:
                parsedJob.department ||
                (typeof workableJob.department === 'string'
                  ? workableJob.department
                  : workableJob.department?.name),
              status: mapJobStatus(workableJob.state),
              numberOfOpenings:
                parsedJob.numberOfOpenings || workableJob.openings_count || 1,
              applicationUrl:
                parsedJob.applicationUrl || workableJob.application_url,
              isRemote:
                parsedJob.isRemote ||
                workableJob.remote ||
                workableJob.location?.telecommuting ||
                false,
              responsibilities: parsedJob.responsibilities || [],
              tags: parsedJob.tags || workableJob.keywords || [],
              requiredSkills: parsedJob.requiredSkills || [],
              preferredSkills: parsedJob.preferredSkills || [],
              benefits: parsedJob.benefits || [],
              preferredUniversities: parsedJob.preferredUniversities || [],
              preferredDegrees: parsedJob.preferredDegrees || [],
              preferredLocations: parsedJob.preferredLocations || [],
              preferredIndustries: parsedJob.preferredIndustries || [],
              minSalary: parsedJob.minSalary || workableJob.salary?.salary_from,
              maxSalary: parsedJob.maxSalary || workableJob.salary?.salary_to,
              salaryCurrency:
                parsedJob.salaryCurrency || workableJob.salary?.salary_currency,
            },
          });

          // Create job posting integration record
          const jobIntegration =
            await this.prisma.job_posting_integration.create({
              data: {
                jobPostingId: newJob.id,
                clientIntegrationId: integrationId,
                externalJobId:
                  workableJob.shortcode || workableJob.id?.toString(),
                externalJobUrl: workableJob.application_url,
                externalJobData: workableJob,
                status: JobPostingIntegrationStatus.DRAFT,
              },
            });

          // Create the imported job response object
          const importedJob: IWorkableImportedJob = {
            id: newJob.id,
            title: newJob.title,
            externalJobId: jobIntegration.externalJobId!,
            externalJobUrl: jobIntegration.externalJobUrl || undefined,
            shortcode: workableJob.shortcode,
            status: newJob.status,
            department: newJob.department || undefined,
            location: workableJob.location?.city,
            isRemote: newJob.isRemote,
            employmentType: workableJob.employment_type,
            function: workableJob.function?.name,
            industry: workableJob.industry?.name,
            numberOfOpenings: newJob.numberOfOpenings,
            createdAt: newJob.createdAt,
          };

          importedJobs.push(importedJob);
          importedCount++;
        } catch (jobError) {
          errorCount++;
          errors.push({
            jobId:
              workableJob.id?.toString() || workableJob.shortcode || 'unknown',
            error:
              jobError instanceof Error ? jobError.message : 'Unknown error',
          });
        }
      }

      // Update sync info
      await this.prisma.client_integration.update({
        where: { id: integrationId },
        data: {
          lastSyncAt: new Date(),
          status:
            errorCount === 0
              ? IntegrationStatus.ACTIVE
              : IntegrationStatus.ERROR,
          errorCount: errorCount,
          lastError:
            errorCount > 0 ? `${errorCount} jobs failed to sync` : null,
          lastErrorAt: errorCount > 0 ? new Date() : undefined,
        },
      });

      return {
        success: importedCount > 0 || errorCount === 0,
        message: `Job import completed: ${importedCount} imported, ${skippedCount} updated, ${errorCount} errors`,
        importedCount,
        skippedCount,
        errorCount,
        jobs: importedJobs,
        availableJobs: [], // Empty for sync=true case
        errors,
      };
    } catch (error) {
      logger.error('Failed to import jobs', { error });
      if (error instanceof AppError) throw error;
      throw new AppError(
        'Failed to import jobs',
        500,
        ErrorCode.INTEGRATION_SYNC_FAILED
      );
    }
  }

  /**
   * Get available jobs for manual selection (when sync=false)
   */
  private async getAvailableJobsForSelection(
    integrationId: string,
    workableJobs: any[]
  ): Promise<IWorkableJobImportResponse> {
    try {
      const availableJobs: IWorkableAvailableJob[] = [];

      for (const workableJob of workableJobs) {
        // Check if job already exists in job_posting_integration
        const existingJobIntegration =
          await this.prisma.job_posting_integration.findFirst({
            where: {
              clientIntegrationId: integrationId,
              externalJobId:
                workableJob.shortcode || workableJob.id?.toString(),
            },
          });

        const availableJob: IWorkableAvailableJob = {
          externalJobId: workableJob.shortcode || workableJob.id?.toString(),
          shortcode: workableJob.shortcode,
          title: workableJob.title || 'Untitled Job',
          department: workableJob.department?.name,
          location: workableJob.location?.city,
          isRemote: workableJob.location?.remote || false,
          employmentType: workableJob.employment_type,
          function: workableJob.function?.name,
          industry: workableJob.industry?.name,
          state: workableJob.state,
          numberOfOpenings: workableJob.openings?.length || 1,
          externalJobUrl: workableJob.application_url,
          createdAt: new Date(workableJob.created_at),
          alreadyImported: !!existingJobIntegration,
        };

        availableJobs.push(availableJob);
      }

      return {
        success: true,
        message: `Found ${availableJobs.length} jobs available for selection`,
        importedCount: 0,
        skippedCount: 0,
        errorCount: 0,
        jobs: [],
        availableJobs,
        errors: [],
      };
    } catch (error) {
      logger.error('Failed to get available jobs for selection', { error });
      throw new AppError(
        'Failed to get available jobs',
        500,
        ErrorCode.INTEGRATION_SYNC_FAILED
      );
    }
  }

  /**
   * Import selected jobs from manual selection
   */
  async importSelectedJobs(
    clientId: string,
    integrationId: string,
    selectionRequest: IWorkableJobSelectionRequest
  ): Promise<IWorkableJobImportResponse> {
    try {
      const integration = await this.prisma.client_integration.findFirst({
        where: { id: integrationId, clientId },
        include: { provider: true },
      });

      if (
        !integration ||
        integration.provider.name !== IntegrationProvider.WORKABLE
      ) {
        throw new AppError(
          'Workable integration not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Decrypt credentials
      let credentials: IWorkableCredentials;
      try {
        const credentialsData = integration.credentials as unknown as string;
        credentials =
          EncryptionService.decryptCredentials<IWorkableCredentials>(
            credentialsData
          );
      } catch (_error) {
        throw new AppError(
          'Failed to decrypt credentials',
          400,
          ErrorCode.INTEGRATION_CREDENTIALS_INVALID
        );
      }

      const workableProvider = IntegrationsFactory.getInstance().getProvider(
        IntegrationProvider.WORKABLE
      ) as WorkableAtsProvider;

      let importedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;
      const errors: Array<{ jobId: string; error: string }> = [];
      const importedJobs: IWorkableImportedJob[] = [];

      // Process each selected job
      for (const selectedJobId of selectionRequest.selectedJobIds) {
        try {
          // Check if job already exists
          const existingJobIntegration =
            await this.prisma.job_posting_integration.findFirst({
              where: {
                clientIntegrationId: integrationId,
                externalJobId: selectedJobId,
              },
              include: { jobPosting: true },
            });

          if (existingJobIntegration) {
            skippedCount++;
            continue;
          }

          // Fetch individual job details from Workable
          const workableJob = await workableProvider.getJob(
            credentials,
            selectedJobId
          );

          const clientUser = await this.prisma.client_user.findFirst({
            where: { client: { id: clientId } },
          });

          if (!clientUser) {
            throw new Error('No client user found to set as creator');
          }

          // Parse Workable job using job parsing service
          const parsedJob = await this.parseWorkableJob(workableJob);

          // Create job posting with parsed data
          const newJob = await this.prisma.job_posting.create({
            data: {
              clientId,
              createdById: clientUser.id,
              title: parsedJob.title || workableJob.title || 'Untitled Job',
              description:
                parsedJob.description || workableJob.description || '',
              jobType: parsedJob.jobType,
              jobCommitment: parsedJob.jobCommitment || 'FULL_TIME',
              jobSchedule: parsedJob.jobSchedule || 'REGULAR',
              industry: this.mapIndustryToEnum(
                parsedJob.industry ||
                  (typeof workableJob.industry === 'string'
                    ? workableJob.industry
                    : workableJob.industry?.name)
              ),
              totalExperience: parsedJob.totalExperience || 0,
              department:
                parsedJob.department ||
                (typeof workableJob.department === 'string'
                  ? workableJob.department
                  : workableJob.department?.name),
              status: mapJobStatus(workableJob.state),
              numberOfOpenings:
                parsedJob.numberOfOpenings || workableJob.openings_count || 1,
              applicationUrl:
                parsedJob.applicationUrl || workableJob.application_url,
              isRemote:
                parsedJob.isRemote ||
                workableJob.remote ||
                workableJob.location?.telecommuting ||
                false,
              responsibilities: parsedJob.responsibilities || [],
              tags: parsedJob.tags || workableJob.keywords || [],
              requiredSkills: parsedJob.requiredSkills || [],
              preferredSkills: parsedJob.preferredSkills || [],
              benefits: parsedJob.benefits || [],
              preferredUniversities: parsedJob.preferredUniversities || [],
              preferredDegrees: parsedJob.preferredDegrees || [],
              preferredLocations: parsedJob.preferredLocations || [],
              preferredIndustries: parsedJob.preferredIndustries || [],
              minSalary: parsedJob.minSalary || workableJob.salary?.salary_from,
              maxSalary: parsedJob.maxSalary || workableJob.salary?.salary_to,
              salaryCurrency:
                parsedJob.salaryCurrency || workableJob.salary?.salary_currency,
            },
          });

          // Create job posting integration record
          const jobIntegration =
            await this.prisma.job_posting_integration.create({
              data: {
                jobPostingId: newJob.id,
                clientIntegrationId: integrationId,
                externalJobId: selectedJobId,
                externalJobUrl: workableJob.application_url,
                externalJobData: workableJob,
                status: JobPostingIntegrationStatus.PUBLISHED,
              },
            });

          // Create the imported job response object
          const importedJob: IWorkableImportedJob = {
            id: newJob.id,
            title: newJob.title,
            externalJobId: jobIntegration.externalJobId!,
            externalJobUrl: jobIntegration.externalJobUrl || undefined,
            shortcode: workableJob.shortcode,
            status: newJob.status,
            department: newJob.department || undefined,
            location: workableJob.location?.city,
            isRemote: newJob.isRemote,
            employmentType: workableJob.employment_type,
            function: workableJob.function?.name,
            industry: workableJob.industry?.name,
            numberOfOpenings: newJob.numberOfOpenings,
            createdAt: newJob.createdAt,
          };

          importedJobs.push(importedJob);
          importedCount++;
        } catch (jobError) {
          errorCount++;
          errors.push({
            jobId: selectedJobId,
            error:
              jobError instanceof Error ? jobError.message : 'Unknown error',
          });
        }
      }

      // Update sync info
      await this.prisma.client_integration.update({
        where: { id: integrationId },
        data: {
          lastSyncAt: new Date(),
          status:
            errorCount === 0
              ? IntegrationStatus.ACTIVE
              : IntegrationStatus.ERROR,
          errorCount: errorCount,
          lastError:
            errorCount > 0 ? `${errorCount} jobs failed to sync` : null,
          lastErrorAt: errorCount > 0 ? new Date() : undefined,
        },
      });

      return {
        success: importedCount > 0 || errorCount === 0,
        message: `Selected job import completed: ${importedCount} imported, ${skippedCount} skipped, ${errorCount} errors`,
        importedCount,
        skippedCount,
        errorCount,
        jobs: importedJobs,
        availableJobs: [], // Empty for selected job import
        errors,
      };
    } catch (error) {
      logger.error('Failed to import selected jobs', { error });
      if (error instanceof AppError) throw error;
      throw new AppError(
        'Failed to import selected jobs',
        500,
        ErrorCode.INTEGRATION_SYNC_FAILED
      );
    }
  }

  /**
   * Update existing candidate integration with latest data from Workable
   */
  private async updateCandidateIntegrationData(
    candidateIntegrationId: string,
    workableCandidate: IWorkableCandidate,
    candidateId: string
  ): Promise<void> {
    try {
      // Map candidate profile to update internal candidate data
      const candidateProfile = mapWorkableCandidateToProfile(workableCandidate);

      // Update candidate record if stage/status has changed
      await this.prisma.candidate.update({
        where: { id: candidateId },
        data: {
          status: candidateProfile.candidateStatus,
          assessmentStage: candidateProfile.assessmentStage,
          resumeAssessmentStatus: candidateProfile.resumeAssessmentStatus,
          onboardingAssessmentStatus:
            candidateProfile.onboardingAssessmentStatus,
          completionPercentage: candidateProfile.completionPercentage,
          // Update last sync time
          updatedAt: new Date(),
        },
      });

      // Update candidate integration with latest external data and pipeline stage
      await this.prisma.candidate_integration.update({
        where: { id: candidateIntegrationId },
        data: {
          externalCandidateData:
            workableCandidate as unknown as Prisma.InputJsonValue,
          pipelineStage: workableCandidate.stage || undefined,
          pipelineStageId: workableCandidate.stage || undefined,
          pipelineData: workableCandidate.stage
            ? ({
                stage: workableCandidate.stage,
                disqualified: workableCandidate.disqualified,
                disqualified_at: workableCandidate.disqualified_at,
                disqualification_reason:
                  workableCandidate.disqualification_reason,
                sourced: workableCandidate.sourced,
                last_updated: new Date().toISOString(),
              } as Prisma.InputJsonValue)
            : undefined,
          lastSyncedAt: new Date(),
          syncStatus: IntegrationSyncStatus.COMPLETED,
        },
      });

      logger.info('Updated candidate integration data', {
        candidateIntegrationId,
        candidateId,
        newStage: workableCandidate.stage,
        disqualified: workableCandidate.disqualified,
      });
    } catch (error) {
      // Update sync status to failed
      try {
        await this.prisma.candidate_integration.update({
          where: { id: candidateIntegrationId },
          data: {
            syncStatus: IntegrationSyncStatus.FAILED,
            syncError: error instanceof Error ? error.message : 'Unknown error',
            lastSyncedAt: new Date(),
          },
        });
      } catch (updateError) {
        logger.error('Failed to update sync status after error', {
          candidateIntegrationId,
          updateError,
        });
      }

      logger.error('Failed to update candidate integration data', {
        candidateIntegrationId,
        candidateId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Parse a Workable job using the job parsing service
   */
  private async parseWorkableJob(workableJob: IWorkableJob): Promise<any> {
    try {
      // Convert Workable job to formatted text for parsing
      const jobText = this.convertWorkableJobToText(workableJob);

      // Generate unique task ID for this parsing operation
      const taskId = `workable-job-${workableJob.id || workableJob.shortcode}-${Date.now()}`;

      // Create a temporary folder for this job
      const { folderPath } = getBucketFolderPathToJobPosting(taskId);
      const fileName = `${taskId}-job-description.txt`;
      const filePath = `${folderPath}/${fileName}`;

      // Upload the job description text to storage
      const jobBuffer = Buffer.from(jobText, 'utf-8');
      await this.storageProvider.uploadFile(jobBuffer, filePath);

      // Parse the job using the job parser with the file path
      await this.jobParserProvider.parse(
        taskId,
        filePath,
        JobParsingMode.INFERRED
      );

      // Wait for parsing to complete
      await this.waitForParsingCompletion(taskId);

      // Get the parsed job data
      const parsedJobData = await this.jobParserProvider.getParsedJob(taskId);

      if (!parsedJobData.isValidJobDescription) {
        throw new Error(
          `Invalid job description: ${parsedJobData.validationReason}`
        );
      }

      return parsedJobData.parsedJob;
    } catch (error) {
      logger.error('Failed to parse Workable job using job parser', {
        workableJobId: workableJob.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Convert Workable job to formatted text for parsing
   */
  private convertWorkableJobToText(workableJob: IWorkableJob): string {
    const sections: string[] = [];

    // Job title
    if (workableJob.title) {
      sections.push(`JOB TITLE: ${workableJob.title}`);
    }

    // Department
    if (workableJob.department) {
      const departmentName =
        typeof workableJob.department === 'string'
          ? workableJob.department
          : workableJob.department.name;
      if (departmentName) {
        sections.push(`DEPARTMENT: ${departmentName}`);
      }
    }

    // Location
    if (workableJob.location) {
      const location = [
        workableJob.location.city,
        workableJob.location.region,
        workableJob.location.country,
      ]
        .filter(Boolean)
        .join(', ');
      if (location) {
        sections.push(`LOCATION: ${location}`);
      }
      if (workableJob.location.telecommuting || workableJob.remote) {
        sections.push('REMOTE WORK: Yes');
      }
    }

    // Employment type
    if (workableJob.employment_type) {
      sections.push(`EMPLOYMENT TYPE: ${workableJob.employment_type}`);
    }

    // Function
    if (workableJob.function) {
      const functionName =
        typeof workableJob.function === 'string'
          ? workableJob.function
          : workableJob.function.name;
      if (functionName) {
        sections.push(`FUNCTION: ${functionName}`);
      }
    }

    // Industry
    if (workableJob.industry) {
      const industryName =
        typeof workableJob.industry === 'string'
          ? workableJob.industry
          : workableJob.industry.name;
      if (industryName) {
        sections.push(`INDUSTRY: ${industryName}`);
      }
    }

    // Job description
    if (workableJob.description) {
      sections.push(`JOB DESCRIPTION:\n${workableJob.description}`);
    }

    // Requirements
    if (workableJob.requirements) {
      sections.push(`REQUIREMENTS:\n${workableJob.requirements}`);
    }

    // Benefits
    if (workableJob.benefits) {
      sections.push(`BENEFITS:\n${workableJob.benefits}`);
    }

    // Application URL
    if (workableJob.application_url) {
      sections.push(`APPLICATION URL: ${workableJob.application_url}`);
    }

    // Salary information
    if (workableJob.salary) {
      const salaryParts: string[] = [];

      if (workableJob.salary.salary_from && workableJob.salary.salary_to) {
        salaryParts.push(
          `${workableJob.salary.salary_from} - ${workableJob.salary.salary_to}`
        );
      } else if (workableJob.salary.salary_from) {
        salaryParts.push(`From ${workableJob.salary.salary_from}`);
      } else if (workableJob.salary.salary_to) {
        salaryParts.push(`Up to ${workableJob.salary.salary_to}`);
      }

      if (workableJob.salary.salary_currency) {
        salaryParts.push(workableJob.salary.salary_currency.toUpperCase());
      }

      if (salaryParts.length > 0) {
        sections.push(`SALARY: ${salaryParts.join(' ')}`);
      }
    }

    // Experience level
    if (workableJob.experience) {
      sections.push(`EXPERIENCE LEVEL: ${workableJob.experience}`);
    }

    // Education level
    if (workableJob.education) {
      sections.push(`EDUCATION: ${workableJob.education}`);
    }

    return sections.join('\n\n');
  }

  /**
   * Map Workable industry string to Prisma company_industry enum
   */
  private mapIndustryToEnum(industry?: string): CompanyIndustryEnum {
    if (!industry) return CompanyIndustryEnum.OTHER;

    const industryMapping: Record<string, CompanyIndustryEnum> = {
      technology: CompanyIndustryEnum.TECHNOLOGY,
      tech: CompanyIndustryEnum.TECHNOLOGY,
      software: CompanyIndustryEnum.TECHNOLOGY,
      it: CompanyIndustryEnum.TECHNOLOGY,
      'information technology': CompanyIndustryEnum.TECHNOLOGY,
      healthcare: CompanyIndustryEnum.HEALTHCARE,
      health: CompanyIndustryEnum.HEALTHCARE,
      medical: CompanyIndustryEnum.HEALTHCARE,
      finance: CompanyIndustryEnum.FINANCE,
      financial: CompanyIndustryEnum.FINANCE,
      banking: CompanyIndustryEnum.FINANCE,
      fintech: CompanyIndustryEnum.FINANCE,
      education: CompanyIndustryEnum.EDUCATION,
      educational: CompanyIndustryEnum.EDUCATION,
      retail: CompanyIndustryEnum.RETAIL,
      'e-commerce': CompanyIndustryEnum.RETAIL,
      ecommerce: CompanyIndustryEnum.RETAIL,
      sales: CompanyIndustryEnum.RETAIL,
    };

    const normalizedIndustry = industry.toLowerCase().trim();
    return industryMapping[normalizedIndustry] || CompanyIndustryEnum.OTHER;
  }

  /**
   * Wait for job parsing to complete
   */
  private async waitForParsingCompletion(taskId: string): Promise<void> {
    const maxWaitTime = 5 * 60 * 1000; // 5 minutes
    const pollInterval = 2000; // 2 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const task = await this.jobParserProvider.getParsingTask(taskId);

        if (task.status === 'COMPLETED') {
          return;
        }

        if (task.status === 'FAILED') {
          throw new Error(
            `Job parsing failed: ${task.error || 'Unknown error'}`
          );
        }

        // Wait before next poll
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes('parsing failed')
        ) {
          throw error;
        }
        // Continue polling for other errors (task not found, etc.)
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      }
    }

    throw new Error('Job parsing timed out');
  }

  /**
   * Update existing job integration with latest data from Workable
   */
  private async updateJobIntegrationData(
    jobIntegrationId: string,
    jobPostingId: string,
    workableJob: IWorkableJob
  ): Promise<void> {
    try {
      // Parse job to update internal job posting data
      const jobData = await this.parseWorkableJob(workableJob);

      // Update job posting record with latest data
      await this.prisma.job_posting.update({
        where: { id: jobPostingId },
        data: {
          // Update key fields that might change
          status: jobData.status,
          numberOfOpenings: jobData.numberOfOpenings,
          minSalary: jobData.minSalary,
          maxSalary: jobData.maxSalary,
          salaryCurrency: jobData.salaryCurrency,
          isRemote: jobData.isRemote,
          description: jobData.description,
          responsibilities: jobData.responsibilities || [],
          benefits: jobData.benefits || [],
          requiredSkills: jobData.requiredSkills || [],
          preferredSkills: jobData.preferredSkills || [],
          tags: jobData.tags || [],
          updatedAt: new Date(),
        },
      });

      // Update job integration record with latest external data
      await this.prisma.job_posting_integration.update({
        where: { id: jobIntegrationId },
        data: {
          externalJobData: workableJob as unknown as Prisma.InputJsonValue,
          status:
            mapJobStatus(workableJob.state) === JobPostingStatusEnum.PUBLISHED
              ? JobPostingIntegrationStatus.PUBLISHED
              : JobPostingIntegrationStatus.DRAFT,
          syncStatus: IntegrationSyncStatus.COMPLETED,
          lastSyncedAt: new Date(),
        },
      });

      logger.info('Updated job integration data', {
        jobIntegrationId,
        jobPostingId,
        externalJobId: workableJob.id,
        state: workableJob.state,
        title: workableJob.title,
      });
    } catch (error) {
      // Update sync status to failed
      try {
        await this.prisma.job_posting_integration.update({
          where: { id: jobIntegrationId },
          data: {
            syncStatus: IntegrationSyncStatus.FAILED,
            syncError: error instanceof Error ? error.message : 'Unknown error',
            lastSyncedAt: new Date(),
          },
        });
      } catch (updateError) {
        logger.error('Failed to update sync status after error', {
          jobIntegrationId,
          updateError,
        });
      }

      logger.error('Failed to update job integration data', {
        jobIntegrationId,
        jobPostingId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
