import { singleton } from '@/shared/decorators/singleton';
import { PrismaClient } from '@prisma/client';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';
import {
  IIntegrationDataSummary,
  IIntegrationDataDetails,
  IIntegrationJobData,
  IIntegrationCandidateData,
  IDataImportSource,
} from '@/shared/models/domain/integration/common/integration.data.tracking.domain';
import {
  IntegrationStatus,
  CandidateSource,
  JobPostingIntegrationStatus,
  SourceType,
} from '@/shared/models/common/enums';
import { InputJsonValue } from '@prisma/client/runtime/library';

/**
 * Service to track and manage integration data imports
 * Provides insights about which integration imported jobs and candidates
 */
@singleton
export class IntegrationDataTrackingService {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get comprehensive data summary for a client's integrations
   */
  async getIntegrationDataSummary(
    clientId: string,
    performedBy?: string
  ): Promise<IIntegrationDataSummary[]> {
    try {
      logger.info('Getting integration data summary', {
        context: 'IntegrationDataTrackingService.getIntegrationDataSummary',
        clientId,
        performedBy,
      });

      const integrations = await this.prisma.client_integration.findMany({
        where: { clientId },
        include: {
          provider: true,
          jobPostingIntegrations: {
            include: {
              jobPosting: true,
              candidateIntegrations: true,
            },
          },
        },
      });

      // Get total candidates from candidate_import table for this client
      const candidateImportCount = await this.prisma.candidate_import.count({
        where: { clientId },
      });

      const summaries: IIntegrationDataSummary[] = [];

      for (const integration of integrations) {
        const jobCount = integration.jobPostingIntegrations.length;
        const candidateCount = integration.jobPostingIntegrations.reduce(
          (total, jobInt) => total + jobInt.candidateIntegrations.length,
          0
        );

        // Get active jobs count
        const activeJobsCount = integration.jobPostingIntegrations.filter(
          (jobInt) =>
            jobInt.status === JobPostingIntegrationStatus.PUBLISHED ||
            jobInt.status === JobPostingIntegrationStatus.SYNCED
        ).length;

        // Get candidate invites count from candidate_import table for this integration
        const candidateInvitesCount = await this.prisma.candidate_import.count({
          where: {
            clientId,
            integrationProviderId: integration.provider.id,
            status: 'INVITED',
          },
        });

        // Get candidate sourced count from candidate table for this integration
        const candidateSourcedCount = await this.prisma.candidate.count({
          where: {
            importedByClientId: clientId,
            importedIntegrationId: integration.provider.id,
          },
        });

        // Get recent activity
        const recentActivity = await this.getRecentActivity(integration.id);

        summaries.push({
          integrationId: integration.id,
          integrationName: integration.name,
          providerName: integration.provider.name,
          providerType: integration.provider.type as any,
          status: integration.status as any,
          totalJobs: jobCount,
          totalCandidates: candidateCount,
          totalCandidateInvites: candidateInvitesCount,
          totalCandidateSourced: candidateSourcedCount,
          activeJobs: activeJobsCount,
          lastSyncAt: integration.lastSyncAt,
          autoSyncEnabled: integration.autoSyncEnabled,
          recentActivity,
          createdAt: integration.createdAt,
        });
      }

      // Add a summary entry for Excel Upload candidates if there are any
      if (candidateImportCount > 0) {
        // Get Excel Upload provider ID for counting invites and sourced candidates
        const excelUploadProvider =
          await this.prisma.integration_provider.findFirst({
            where: {
              name: 'Excel Upload',
              isActive: true,
            },
          });

        // Get candidate invites count for Excel Upload
        const excelCandidateInvitesCount = excelUploadProvider
          ? await this.prisma.candidate_import.count({
              where: {
                clientId,
                integrationProviderId: excelUploadProvider.id,
                status: 'INVITED',
              },
            })
          : 0;

        // Get candidate sourced count for Excel Upload
        const excelCandidateSourcedCount = excelUploadProvider
          ? await this.prisma.candidate.count({
              where: {
                importedByClientId: clientId,
                importedIntegrationId: excelUploadProvider.id,
              },
            })
          : 0;

        summaries.push({
          integrationId: 'excel-upload',
          integrationName: 'Excel Upload',
          providerName: 'Excel Upload',
          providerType: 'EXCEL_UPLOAD' as any,
          status: 'ACTIVE' as any,
          totalJobs: 0,
          totalCandidates: candidateImportCount,
          totalCandidateInvites: excelCandidateInvitesCount,
          totalCandidateSourced: excelCandidateSourcedCount,
          activeJobs: 0,
          lastSyncAt: null,
          autoSyncEnabled: false,
          recentActivity: {
            jobsLast30Days: 0,
            candidatesLast30Days: candidateImportCount,
          },
          createdAt: new Date(),
        });
      }

      // Log audit event for data summary access
      await this.logDataTrackingAudit(
        clientId,
        'view_data_summary',
        'client',
        clientId,
        {
          totalIntegrations: integrations.length,
          totalJobs: summaries.reduce((total, s) => total + s.totalJobs, 0),
          totalCandidates: summaries.reduce(
            (total, s) => total + s.totalCandidates,
            0
          ),
          accessedAt: new Date(),
        },
        performedBy || clientId
      );

      return summaries;
    } catch (error) {
      logger.error('Failed to get integration data summary', {
        context: 'IntegrationDataTrackingService.getIntegrationDataSummary',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
      });
      throw error;
    }
  }

  /**
   * Get detailed data for a specific integration
   */
  async getIntegrationDataDetails(
    clientId: string,
    integrationId: string,
    performedBy?: string
  ): Promise<IIntegrationDataDetails> {
    try {
      logger.info('Getting integration data details', {
        context: 'IntegrationDataTrackingService.getIntegrationDataDetails',
        clientId,
        integrationId,
        performedBy,
      });

      const integration = await this.prisma.client_integration.findFirst({
        where: { id: integrationId, clientId },
        include: {
          provider: true,
          jobPostingIntegrations: {
            include: {
              jobPosting: true,
              candidateIntegrations: {
                include: {
                  candidate: {
                    include: {
                      user: true,
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!integration) {
        throw new AppError('Integration not found', 404, ErrorCode.NOT_FOUND);
      }

      // Process jobs data
      const jobs: IIntegrationJobData[] =
        integration.jobPostingIntegrations.map((jobInt) => ({
          jobId: jobInt.jobPostingId,
          jobTitle: jobInt.jobPosting.title,
          externalJobId: jobInt.externalJobId,
          externalJobUrl: jobInt.externalJobUrl,
          status: jobInt.status as any,
          candidateCount: jobInt.candidateIntegrations.length,
          syncStatus: jobInt.syncStatus as any,
          lastSyncedAt: jobInt.lastSyncedAt,
          publishedAt: jobInt.publishedAt,
          createdAt: jobInt.createdAt,
        }));

      // Process candidates data
      const candidates: IIntegrationCandidateData[] = [];
      for (const jobInt of integration.jobPostingIntegrations) {
        for (const candInt of jobInt.candidateIntegrations) {
          candidates.push({
            candidateId: candInt.candidateId,
            candidateName: candInt.candidate.user.name,
            candidateEmail: candInt.candidate.user.email,
            jobId: jobInt.jobPostingId,
            jobTitle: jobInt.jobPosting.title,
            externalCandidateId: candInt.externalCandidateId,
            externalApplicationId: candInt.externalApplicationId,
            source: candInt.source as any,
            pipelineStage: candInt.pipelineStage,
            syncStatus: candInt.syncStatus as any,
            lastSyncedAt: candInt.lastSyncedAt,
            createdAt: candInt.createdAt,
          });
        }
      }

      // Get candidate invites count from candidate_import table for this integration
      const candidateInvitesCount = await this.prisma.candidate_import.count({
        where: {
          clientId,
          integrationProviderId: integration.provider.id,
          status: 'INVITED',
        },
      });

      // Get candidate sourced count from candidate table for this integration
      const candidateSourcedCount = await this.prisma.candidate.count({
        where: {
          importedByClientId: clientId,
          importedIntegrationId: integration.provider.id,
        },
      });

      const details: IIntegrationDataDetails = {
        integrationId: integration.id,
        integrationName: integration.name,
        providerName: integration.provider.name,
        providerType: integration.provider.type as any,
        status: integration.status as any,
        autoSyncEnabled: integration.autoSyncEnabled,
        lastSyncAt: integration.lastSyncAt,
        jobs,
        candidates,
        totalJobs: jobs.length,
        totalCandidates: candidates.length,
        totalCandidateInvites: candidateInvitesCount,
        totalCandidateSourced: candidateSourcedCount,
        createdAt: integration.createdAt,
      };

      // Log audit event for data details access
      await this.logDataTrackingAudit(
        integrationId,
        'view_data_details',
        'integration',
        integrationId,
        {
          integrationName: integration.name,
          providerName: integration.provider.name,
          totalJobs: jobs.length,
          totalCandidates: candidates.length,
          accessedAt: new Date(),
        },
        performedBy || clientId
      );

      return details;
    } catch (error) {
      logger.error('Failed to get integration data details', {
        context: 'IntegrationDataTrackingService.getIntegrationDataDetails',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        integrationId,
      });
      throw error;
    }
  }

  /**
   * Find data import sources for a specific job
   */
  async getJobImportSource(
    clientId: string,
    jobId: string,
    performedBy?: string
  ): Promise<IDataImportSource | null> {
    try {
      const jobIntegration =
        await this.prisma.job_posting_integration.findFirst({
          where: {
            jobPostingId: jobId,
            clientIntegration: {
              clientId,
            },
          },
          include: {
            clientIntegration: {
              include: {
                provider: true,
              },
            },
            jobPosting: true,
          },
        });

      if (!jobIntegration) {
        return null;
      }

      const importSource: IDataImportSource = {
        sourceType: SourceType.JOB,
        sourceId: jobId,
        integrationId: jobIntegration.clientIntegrationId,
        integrationName: jobIntegration.clientIntegration.name,
        providerName: jobIntegration.clientIntegration.provider.name,
        providerType: jobIntegration.clientIntegration.provider.type as any,
        externalId: jobIntegration.externalJobId,
        externalUrl: jobIntegration.externalJobUrl,
        importedAt: jobIntegration.createdAt,
        lastSyncedAt: jobIntegration.lastSyncedAt,
      };

      // Log audit event for job import source lookup
      await this.logDataTrackingAudit(
        jobIntegration.clientIntegrationId,
        'lookup_job_source',
        'job_posting',
        jobId,
        {
          jobTitle: jobIntegration.jobPosting.title,
          integrationName: jobIntegration.clientIntegration.name,
          providerName: jobIntegration.clientIntegration.provider.name,
          externalJobId: jobIntegration.externalJobId,
          accessedAt: new Date(),
        },
        performedBy || clientId
      );

      return importSource;
    } catch (error) {
      logger.error('Failed to get job import source', {
        context: 'IntegrationDataTrackingService.getJobImportSource',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        jobId,
      });
      throw error;
    }
  }

  /**
   * Find data import sources for a specific candidate
   */
  async getCandidateImportSource(
    clientId: string,
    candidateId: string,
    performedBy?: string
  ): Promise<IDataImportSource[]> {
    try {
      const candidateIntegrations =
        await this.prisma.candidate_integration.findMany({
          where: {
            candidateId,
            jobPostingIntegration: {
              clientIntegration: {
                clientId,
              },
            },
          },
          include: {
            jobPostingIntegration: {
              include: {
                clientIntegration: {
                  include: {
                    provider: true,
                  },
                },
                jobPosting: true,
              },
            },
            candidate: {
              include: {
                user: true,
              },
            },
          },
        });

      const importSources = candidateIntegrations.map((candInt) => ({
        sourceType: SourceType.CANDIDATE,
        sourceId: candidateId,
        integrationId: candInt.jobPostingIntegration.clientIntegrationId,
        integrationName: candInt.jobPostingIntegration.clientIntegration.name,
        providerName:
          candInt.jobPostingIntegration.clientIntegration.provider.name,
        providerType: candInt.jobPostingIntegration.clientIntegration.provider
          .type as any,
        externalId: candInt.externalCandidateId,
        externalUrl: null,
        importedAt: candInt.createdAt,
        lastSyncedAt: candInt.lastSyncedAt,
        relatedJobId: candInt.jobPostingIntegration.jobPostingId,
        relatedJobTitle: candInt.jobPostingIntegration.jobPosting.title,
        pipelineStage: candInt.pipelineStage,
        source: candInt.source as any,
      }));

      // Log audit event for candidate import source lookup
      if (candidateIntegrations.length > 0) {
        const firstIntegration = candidateIntegrations[0];
        await this.logDataTrackingAudit(
          firstIntegration.jobPostingIntegration.clientIntegrationId,
          'lookup_candidate_source',
          'candidate',
          candidateId,
          {
            candidateName: firstIntegration.candidate.user.name,
            candidateEmail: firstIntegration.candidate.user.email,
            totalSources: importSources.length,
            integrations: importSources.map((source) => ({
              integrationName: source.integrationName,
              providerName: source.providerName,
              relatedJobTitle: source.relatedJobTitle,
            })),
            accessedAt: new Date(),
          },
          performedBy || clientId
        );
      }

      return importSources;
    } catch (error) {
      logger.error('Failed to get candidate import source', {
        context: 'IntegrationDataTrackingService.getCandidateImportSource',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        candidateId,
      });
      throw error;
    }
  }

  /**
   * Get data usage statistics across all integrations for a client
   */
  async getDataUsageStatistics(clientId: string, performedBy?: string) {
    try {
      const stats = await this.prisma.client_integration.findMany({
        where: { clientId },
        include: {
          provider: true,
          jobPostingIntegrations: {
            include: {
              candidateIntegrations: true,
            },
          },
        },
      });

      // Get total candidates from candidate_import table for this client
      const candidateImportCount = await this.prisma.candidate_import.count({
        where: { clientId },
      });

      const usage = {
        totalIntegrations: stats.length,
        activeIntegrations: stats.filter(
          (i) => i.status === IntegrationStatus.ACTIVE
        ).length,
        totalJobsImported: 0,
        totalCandidatesImported: 0,
        totalCandidateInvites: 0,
        totalCandidateSourced: 0,
        byProvider: {} as Record<
          string,
          {
            providerName: string;
            integrationCount: number;
            jobsImported: number;
            candidatesImported: number;
            candidateInvites: number;
            candidateSourced: number;
          }
        >,
        bySource: {
          [CandidateSource.ATS_IMPORT]: 0,
          [CandidateSource.JOB_BOARD_IMPORT]: 0,
          [CandidateSource.MANUAL_IMPORT]: 0,
          [CandidateSource.REFERRAL]: 0,
          [CandidateSource.SELF_SIGNUP]: 0,
        },
      };

      for (const integration of stats) {
        const providerName = integration.provider.name;
        const jobsCount = integration.jobPostingIntegrations.length;
        const candidatesCount = integration.jobPostingIntegrations.reduce(
          (total, jobInt) => total + jobInt.candidateIntegrations.length,
          0
        );

        // Get candidate invites count for this integration
        const candidateInvitesCount = await this.prisma.candidate_import.count({
          where: {
            clientId,
            integrationProviderId: integration.provider.id,
            status: 'INVITED',
          },
        });

        // Get candidate sourced count for this integration
        const candidateSourcedCount = await this.prisma.candidate.count({
          where: {
            importedByClientId: clientId,
            importedIntegrationId: integration.provider.id,
          },
        });

        usage.totalJobsImported += jobsCount;
        usage.totalCandidatesImported += candidatesCount;
        usage.totalCandidateInvites += candidateInvitesCount;
        usage.totalCandidateSourced += candidateSourcedCount;

        if (!usage.byProvider[providerName]) {
          usage.byProvider[providerName] = {
            providerName,
            integrationCount: 0,
            jobsImported: 0,
            candidatesImported: 0,
            candidateInvites: 0,
            candidateSourced: 0,
          };
        }

        usage.byProvider[providerName].integrationCount++;
        usage.byProvider[providerName].jobsImported += jobsCount;
        usage.byProvider[providerName].candidatesImported += candidatesCount;
        usage.byProvider[providerName].candidateInvites +=
          candidateInvitesCount;
        usage.byProvider[providerName].candidateSourced +=
          candidateSourcedCount;

        // Count by source
        for (const jobInt of integration.jobPostingIntegrations) {
          for (const candInt of jobInt.candidateIntegrations) {
            if (candInt.source in usage.bySource) {
              usage.bySource[candInt.source as keyof typeof usage.bySource]++;
            }
          }
        }
      }

      // Add candidate import count to total candidates imported
      usage.totalCandidatesImported += candidateImportCount;

      // Add Excel Upload candidate invites and sourced counts to totals
      const excelUploadProvider =
        await this.prisma.integration_provider.findFirst({
          where: {
            name: 'Excel Upload',
            isActive: true,
          },
        });

      if (excelUploadProvider) {
        const excelCandidateInvitesCount =
          await this.prisma.candidate_import.count({
            where: {
              clientId,
              integrationProviderId: excelUploadProvider.id,
              status: 'INVITED',
            },
          });

        const excelCandidateSourcedCount = await this.prisma.candidate.count({
          where: {
            importedByClientId: clientId,
            importedIntegrationId: excelUploadProvider.id,
          },
        });

        usage.totalCandidateInvites += excelCandidateInvitesCount;
        usage.totalCandidateSourced += excelCandidateSourcedCount;
      }

      // Log audit event for usage statistics access
      await this.logDataTrackingAudit(
        clientId,
        'view_usage_statistics',
        'client',
        clientId,
        {
          totalIntegrations: usage.totalIntegrations,
          activeIntegrations: usage.activeIntegrations,
          totalJobsImported: usage.totalJobsImported,
          totalCandidatesImported: usage.totalCandidatesImported,
          providers: Object.keys(usage.byProvider),
          accessedAt: new Date(),
        },
        performedBy || clientId
      );

      return usage;
    } catch (error) {
      logger.error('Failed to get data usage statistics', {
        context: 'IntegrationDataTrackingService.getDataUsageStatistics',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
      });
      throw error;
    }
  }

  /**
   * Get recent activity for an integration
   */
  private async getRecentActivity(integrationId: string) {
    const recentJobs = await this.prisma.job_posting_integration.count({
      where: {
        clientIntegrationId: integrationId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    });

    const recentCandidates = await this.prisma.candidate_integration.count({
      where: {
        jobPostingIntegration: {
          clientIntegrationId: integrationId,
        },
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    });

    return {
      jobsLast30Days: recentJobs,
      candidatesLast30Days: recentCandidates,
    };
  }

  /**
   * Log audit event for data tracking activities
   */
  private async logDataTrackingAudit(
    clientIntegrationId: string,
    action: string,
    entityType: string,
    entityId: string,
    metadata: Record<string, any>,
    performedBy: string
  ): Promise<void> {
    try {
      await this.prisma.integration_audit_log.create({
        data: {
          clientIntegrationId,
          action,
          entityType,
          entityId,
          metadata: metadata as unknown as InputJsonValue,
          performedBy,
        },
      });
    } catch (error) {
      // Log error but don't fail the main operation
      logger.error('Failed to log data tracking audit', {
        context: 'IntegrationDataTrackingService.logDataTrackingAudit',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientIntegrationId,
        action,
        entityType,
        entityId,
      });
    }
  }
}
