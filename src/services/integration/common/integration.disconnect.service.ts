import { singleton } from '@/shared/decorators/singleton';
import { PrismaClient } from '@prisma/client';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';

import {
  IIntegrationDisconnectRequest,
  IIntegrationDisconnectResponse,
  IIntegrationDisconnectSummary,
} from '@/shared/models/domain/integration/common/integration.disconnect.domain';
import {
  IntegrationStatus,
  JobPostingIntegrationStatus,
  IntegrationSyncStatus,
} from '@/shared/models/common/enums';
import { InputJsonValue } from '@prisma/client/runtime/library';

/**
 * Common service to handle integration disconnection
 * Provides unified disconnect functionality across all integration providers
 */
@singleton
export class IntegrationDisconnectService {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Disconnect an integration with data cleanup options
   */
  async disconnectIntegration(
    clientId: string,
    integrationId: string,
    disconnectRequest: IIntegrationDisconnectRequest
  ): Promise<IIntegrationDisconnectResponse> {
    try {
      logger.info('Starting integration disconnect', {
        context: 'IntegrationDisconnectService.disconnectIntegration',
        clientId,
        integrationId,
        removeData: disconnectRequest.removeData,
        reason: disconnectRequest.reason,
      });

      // Validate integration exists and belongs to client
      const integration = await this.prisma.client_integration.findFirst({
        where: { id: integrationId, clientId },
        include: {
          provider: true,
          jobPostingIntegrations: {
            include: {
              candidateIntegrations: true,
            },
          },
        },
      });

      if (!integration) {
        throw new AppError(
          'Integration not found or does not belong to client',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Prevent disconnection if integration is currently syncing
      if (integration.status === IntegrationStatus.SYNCING) {
        throw new AppError(
          'Cannot disconnect integration while sync is in progress',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      // Get data counts before cleanup
      const dataSummary = await this.getDataSummary(integrationId);

      // Perform data cleanup if requested
      let removedData: IIntegrationDisconnectSummary | undefined;
      if (disconnectRequest.removeData) {
        removedData = await this.removeIntegrationData(
          integrationId,
          disconnectRequest.preserveJobsWithApplications || false
        );
      } else {
        // Just mark data as failed/inactive
        await this.markDataAsInactive(integrationId);
      }

      // Update integration status
      await this.prisma.client_integration.update({
        where: { id: integrationId },
        data: {
          status: IntegrationStatus.INACTIVE,
          credentials: {},
          autoSyncEnabled: false,
          lastError:
            disconnectRequest.reason || 'Integration disconnected by user',
          lastErrorAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Log audit event
      await this.logDisconnectAudit(
        integrationId,
        clientId,
        disconnectRequest,
        dataSummary,
        removedData
      );

      const response: IIntegrationDisconnectResponse = {
        success: true,
        integrationId,
        message: `Integration "${integration.name}" disconnected successfully`,
        disconnectedAt: new Date(),
        dataSummary,
        removedData,
      };

      logger.info('Integration disconnect completed successfully', {
        context: 'IntegrationDisconnectService.disconnectIntegration',
        clientId,
        integrationId,
        providerName: integration.provider.name,
        removedData: !!removedData,
        response,
      });

      return response;
    } catch (error) {
      logger.error('Failed to disconnect integration', {
        context: 'IntegrationDisconnectService.disconnectIntegration',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        integrationId,
      });
      throw error;
    }
  }

  /**
   * Bulk disconnect multiple integrations
   */
  async bulkDisconnectIntegrations(
    clientId: string,
    integrationIds: string[],
    disconnectRequest: IIntegrationDisconnectRequest
  ): Promise<IIntegrationDisconnectResponse[]> {
    try {
      logger.info('Starting bulk integration disconnect', {
        context: 'IntegrationDisconnectService.bulkDisconnectIntegrations',
        clientId,
        integrationCount: integrationIds.length,
        removeData: disconnectRequest.removeData,
      });

      const results: IIntegrationDisconnectResponse[] = [];
      const errors: Array<{ integrationId: string; error: string }> = [];

      // Process each integration
      for (const integrationId of integrationIds) {
        try {
          const result = await this.disconnectIntegration(
            clientId,
            integrationId,
            disconnectRequest
          );
          results.push(result);
        } catch (error) {
          errors.push({
            integrationId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      logger.info('Bulk integration disconnect completed', {
        context: 'IntegrationDisconnectService.bulkDisconnectIntegrations',
        clientId,
        successful: results.length,
        failed: errors.length,
        errors,
      });

      return results;
    } catch (error) {
      logger.error('Failed bulk integration disconnect', {
        context: 'IntegrationDisconnectService.bulkDisconnectIntegrations',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
      });
      throw error;
    }
  }

  /**
   * Get preview of what data would be affected by disconnect
   */
  async getDisconnectPreview(
    clientId: string,
    integrationId: string
  ): Promise<IIntegrationDisconnectSummary> {
    try {
      const integration = await this.prisma.client_integration.findFirst({
        where: { id: integrationId, clientId },
      });

      if (!integration) {
        throw new AppError('Integration not found', 404, ErrorCode.NOT_FOUND);
      }

      return await this.getDataSummary(integrationId);
    } catch (error) {
      logger.error('Failed to get disconnect preview', {
        context: 'IntegrationDisconnectService.getDisconnectPreview',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        integrationId,
      });
      throw error;
    }
  }

  /**
   * Get summary of data associated with an integration
   */
  private async getDataSummary(
    integrationId: string
  ): Promise<IIntegrationDisconnectSummary> {
    const jobIntegrations = await this.prisma.job_posting_integration.findMany({
      where: { clientIntegrationId: integrationId },
      include: {
        candidateIntegrations: true,
        jobPosting: {
          include: {
            applications: true,
          },
        },
      },
    });

    const totalJobs = jobIntegrations.length;
    const totalCandidates = jobIntegrations.reduce(
      (total, jobInt) => total + jobInt.candidateIntegrations.length,
      0
    );

    // Count jobs with applications (may need special handling)
    const jobsWithApplications = jobIntegrations.filter(
      (jobInt) => jobInt.jobPosting.applications.length > 0
    ).length;

    const applicationCount = jobIntegrations.reduce(
      (total, jobInt) => total + jobInt.jobPosting.applications.length,
      0
    );

    return {
      totalJobs,
      totalCandidates,
      jobsWithApplications,
      totalApplications: applicationCount,
      affectedEntities: {
        jobPostings: jobIntegrations.map((ji) => ji.jobPostingId),
        candidates: jobIntegrations.flatMap((ji) =>
          ji.candidateIntegrations.map((ci) => ci.candidateId)
        ),
      },
    };
  }

  /**
   * Remove integration data from the database
   */
  private async removeIntegrationData(
    integrationId: string,
    preserveJobsWithApplications: boolean
  ): Promise<IIntegrationDisconnectSummary> {
    return await this.prisma.$transaction(async (prisma) => {
      const _dataSummary = await this.getDataSummary(integrationId);

      // Get job integrations
      const jobIntegrations = await prisma.job_posting_integration.findMany({
        where: { clientIntegrationId: integrationId },
        include: {
          jobPosting: {
            include: {
              applications: true,
            },
          },
          candidateIntegrations: true,
        },
      });

      let jobsRemoved = 0;
      let candidatesRemoved = 0;
      const preservedJobs: string[] = [];

      for (const jobInt of jobIntegrations) {
        const hasApplications = jobInt.jobPosting.applications.length > 0;

        // Skip deletion if preserving jobs with applications
        if (preserveJobsWithApplications && hasApplications) {
          preservedJobs.push(jobInt.jobPostingId);
          // Just mark as failed instead of deleting
          await prisma.job_posting_integration.update({
            where: { id: jobInt.id },
            data: {
              status: JobPostingIntegrationStatus.FAILED,
              syncStatus: IntegrationSyncStatus.FAILED,
            },
          });
          continue;
        }

        // Remove candidate integrations for this job
        const candidateIntegrationsCount = jobInt.candidateIntegrations.length;
        if (candidateIntegrationsCount > 0) {
          await prisma.candidate_integration.deleteMany({
            where: { jobPostingIntegrationId: jobInt.id },
          });
          candidatesRemoved += candidateIntegrationsCount;
        }

        // Remove job posting integration
        await prisma.job_posting_integration.delete({
          where: { id: jobInt.id },
        });

        // Remove the job posting itself (if no other integrations reference it)
        const otherJobIntegrations = await prisma.job_posting_integration.count(
          {
            where: {
              jobPostingId: jobInt.jobPostingId,
            },
          }
        );

        if (otherJobIntegrations === 0) {
          await prisma.job_posting.delete({
            where: { id: jobInt.jobPostingId },
          });
          jobsRemoved++;
        }
      }

      // Remove sync tasks
      await prisma.integration_sync_task.deleteMany({
        where: { clientIntegrationId: integrationId },
      });

      // Remove webhooks
      await prisma.integration_webhook.deleteMany({
        where: { clientIntegrationId: integrationId },
      });

      return {
        totalJobs: jobsRemoved,
        totalCandidates: candidatesRemoved,
        jobsWithApplications: preservedJobs.length,
        totalApplications: 0, // Applications are preserved
        affectedEntities: {
          jobPostings: [],
          candidates: [],
        },
      };
    });
  }

  /**
   * Mark integration data as inactive without removing it
   */
  private async markDataAsInactive(integrationId: string): Promise<void> {
    await this.prisma.$transaction(async (prisma) => {
      // Mark job posting integrations as failed
      await prisma.job_posting_integration.updateMany({
        where: { clientIntegrationId: integrationId },
        data: {
          status: JobPostingIntegrationStatus.FAILED,
          syncStatus: IntegrationSyncStatus.FAILED,
        },
      });

      // Mark candidate integrations as failed
      await prisma.candidate_integration.updateMany({
        where: {
          jobPostingIntegration: {
            clientIntegrationId: integrationId,
          },
        },
        data: {
          syncStatus: IntegrationSyncStatus.FAILED,
        },
      });

      // Mark sync tasks as failed
      await prisma.integration_sync_task.updateMany({
        where: { clientIntegrationId: integrationId },
        data: {
          status: IntegrationSyncStatus.FAILED,
        },
      });
    });
  }

  /**
   * Log audit event for integration disconnection
   */
  private async logDisconnectAudit(
    integrationId: string,
    clientId: string,
    disconnectRequest: IIntegrationDisconnectRequest,
    dataSummary: IIntegrationDisconnectSummary,
    removedData?: IIntegrationDisconnectSummary
  ): Promise<void> {
    try {
      await this.prisma.integration_audit_log.create({
        data: {
          clientIntegrationId: integrationId,
          action: 'disconnect',
          entityType: 'integration',
          entityId: integrationId,
          metadata: {
            reason: disconnectRequest.reason,
            removeData: disconnectRequest.removeData,
            preserveJobsWithApplications:
              disconnectRequest.preserveJobsWithApplications,
            dataSummary,
            removedData,
            disconnectedAt: new Date(),
          } as unknown as InputJsonValue,
          performedBy: clientId, // This should ideally be the user ID
        },
      });
    } catch (error) {
      // Log error but don't fail the disconnect operation
      logger.error('Failed to log disconnect audit', {
        context: 'IntegrationDisconnectService.logDisconnectAudit',
        error: error instanceof Error ? error.message : 'Unknown error',
        integrationId,
      });
    }
  }
}
