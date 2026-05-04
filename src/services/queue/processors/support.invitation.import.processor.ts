import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/shared/utils/logger';
import { SupportInvitationService } from '@/services/support/invitation.service';

import { ISupportInvitationImportRowData } from '@/shared/models/domain/support/invitation.import.domain';
import {
  SupportInvitationImportStatusEnum,
  SupportInvitationTypeEnum,
} from '@/shared/models/common/enums';
import { QueueService, QUEUE_NAMES, QueueJobData } from '../queue.service';
import { ENV } from '@/config/env';
import { singleton } from '@/shared/decorators/singleton';

export interface SupportInvitationImportJobData extends QueueJobData {
  batchId: string;
  supportUserId: string;
  uploadedBy: string;
  candidates: ISupportInvitationImportRowData[];
  batchIndex: number;
  totalBatches: number;
}

export interface SupportInvitationImportResult {
  batchId: string;
  batchIndex: number;
  totalCandidates: number;
  successfulInvites: number;
  failedInvites: number;
  processedAt: Date;
}

@singleton
export class SupportInvitationImportProcessor {
  private readonly prisma: PrismaClient;
  private readonly batchSize = 100; // Process 100 candidates at a time
  private readonly queueService: QueueService;
  private readonly supportInvitationService: SupportInvitationService;

  constructor() {
    this.prisma = new PrismaClient();
    this.queueService = new QueueService();
    this.supportInvitationService = new SupportInvitationService();

    logger.info('Support invitation import processor initialized', {
      context: 'SupportInvitationImportProcessor.constructor',
    });
  }

  /**
   * Set up workers for processing support invitation import jobs
   */
  async setupWorkers(): Promise<void> {
    this.queueService.createWorker(
      QUEUE_NAMES.SUPPORT_INVITATION_IMPORT_PROCESSING,
      this.process.bind(this),
      {
        concurrency: ENV.BULLMQ_DASHBOARD_CONCURRENCY,
      }
    );

    logger.info('Support invitation import workers initialized', {
      context: 'SupportInvitationImportProcessor.setupWorkers',
    });
  }

  /**
   * Process support invitation import job
   */
  async process(
    job: Job<SupportInvitationImportJobData>
  ): Promise<SupportInvitationImportResult> {
    const {
      batchId,
      supportUserId,

      candidates,
      batchIndex,
      totalBatches,
    } = job.data;

    logger.info('Starting support invitation import processing', {
      context: 'SupportInvitationImportProcessor.process',
      batchId,
      supportUserId,
      batchIndex,
      totalBatches,
      candidateCount: candidates.length,
      jobId: job.id,
    });

    try {
      // Validate support user exists
      const supportUser = await this.prisma.support_user.findUnique({
        where: { id: supportUserId },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      if (!supportUser) {
        throw new Error(`Support user ${supportUserId} not found`);
      }

      let successfulInvites = 0;
      let failedInvites = 0;

      // Process each candidate in the batch
      for (const candidateData of candidates) {
        try {
          // Create invitation data
          const invitationData = {
            email: candidateData.email,
            name: candidateData.name,
            jobTitle: candidateData.jobTitle,
            type: SupportInvitationTypeEnum.CANDIDATE,
            clientId: undefined,
            partnerId: undefined,
            companyName: undefined,
            specialization: undefined,
            role: undefined,
            department: undefined,
            supportLevel: undefined,
            accountManagerId: undefined,
            isCampaign: true,
            integrationProviderId: candidateData.integrationProviderId,
          };

          // Send invitation using SupportInvitationService
          const invitation = await this.supportInvitationService.sendInvitation(
            supportUser.user.id,
            invitationData
          );

          if (invitation) {
            successfulInvites++;

            // Update the import record to INVITED status
            await this.updateImportRecordStatus(
              batchId,
              candidateData.email,
              SupportInvitationImportStatusEnum.INVITED,
              invitation.id
            );
          }
        } catch (error) {
          logger.warn('Failed to send invitation for candidate', {
            context: 'SupportInvitationImportProcessor.process',
            email: candidateData.email,
            error: error instanceof Error ? error.message : 'Unknown error',
            batchId,
            batchIndex,
          });
          failedInvites++;

          // Update the import record to FAILED status
          await this.updateImportRecordStatus(
            batchId,
            candidateData.email,
            SupportInvitationImportStatusEnum.FAILED,
            null,
            error instanceof Error ? error.message : 'Unknown error'
          );
        }
      }

      // Update job progress if this is the last batch
      if (batchIndex === totalBatches - 1) {
        await this.updateOverallProgress(batchId, supportUserId);
      }

      const result: SupportInvitationImportResult = {
        batchId,
        batchIndex,
        totalCandidates: candidates.length,
        successfulInvites,
        failedInvites,
        processedAt: new Date(),
      };

      logger.info('Support invitation import batch processing completed', {
        context: 'SupportInvitationImportProcessor.process',
        result,
        jobId: job.id,
      });

      return result;
    } catch (error) {
      logger.error('Failed to process support invitation import batch', {
        context: 'SupportInvitationImportProcessor.process',
        batchId,
        batchIndex,
        supportUserId,
        error: error instanceof Error ? error.message : 'Unknown error',
        jobId: job.id,
      });

      // Mark all candidates in this batch as failed
      await this.markBatchAsFailed(batchId, candidates, error);

      throw error;
    }
  }

  /**
   * Split candidates into batches for processing
   */
  splitIntoBatches(
    candidates: ISupportInvitationImportRowData[]
  ): ISupportInvitationImportRowData[][] {
    const batches: ISupportInvitationImportRowData[][] = [];

    for (let i = 0; i < candidates.length; i += this.batchSize) {
      const batch = candidates.slice(i, i + this.batchSize);
      batches.push(batch);
    }

    logger.info('Split candidates into batches for support invitation import', {
      context: 'SupportInvitationImportProcessor.splitIntoBatches',
      totalCandidates: candidates.length,
      batchSize: this.batchSize,
      totalBatches: batches.length,
    });

    return batches;
  }

  /**
   * Queue invitations for imported candidates in batches
   */
  async queueInviteBatches(
    candidateRows: ISupportInvitationImportRowData[],
    batchId: string,
    supportUserId: string,
    uploadedBy: string
  ): Promise<number> {
    try {
      logger.info('Queuing invitations for imported candidates', {
        context: 'SupportInvitationImportProcessor.queueInviteBatches',
        batchId,
        supportUserId,
        candidateCount: candidateRows.length,
      });

      // Split candidates into manageable batches
      const candidateBatches = this.splitIntoBatches(candidateRows);

      logger.info('Split candidates into batches for queue processing', {
        context: 'SupportInvitationImportProcessor.queueInviteBatches',
        batchId,
        totalCandidates: candidateRows.length,
        totalBatches: candidateBatches.length,
      });

      // Queue each batch for processing
      const queuePromises = candidateBatches.map(
        async (candidateBatch, index) => {
          const jobData: SupportInvitationImportJobData = {
            batchId,
            supportUserId,
            uploadedBy,
            candidates: candidateBatch,
            batchIndex: index,
            totalBatches: candidateBatches.length,
          };

          const job = await this.queueService.addJob(
            QUEUE_NAMES.SUPPORT_INVITATION_IMPORT_PROCESSING,
            `support-invitation-import-${batchId}-batch-${index}`,
            jobData,
            {
              delay: index * 3000, // Stagger batches by 3 seconds to avoid overwhelming the system
              attempts: 3,
              backoff: {
                type: 'exponential',
                delay: 5000,
              },
            }
          );

          logger.info('Queued support invitation import batch', {
            context: 'SupportInvitationImportProcessor.queueInviteBatches',
            batchId,
            batchIndex: index,
            jobId: job.id,
            candidateCount: candidateBatch.length,
          });

          return job;
        }
      );

      // Wait for all batches to be queued
      await Promise.all(queuePromises);

      logger.info('All support invitation import batches queued successfully', {
        context: 'SupportInvitationImportProcessor.queueInviteBatches',
        batchId,
        supportUserId,
        totalBatches: candidateBatches.length,
        totalCandidates: candidateRows.length,
      });

      return candidateBatches.length;
    } catch (error) {
      logger.error('Failed to queue invitations for imported candidates', {
        context: 'SupportInvitationImportProcessor.queueInviteBatches',
        batchId,
        supportUserId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Update import record status
   */
  private async updateImportRecordStatus(
    batchId: string,
    email: string,
    status: SupportInvitationImportStatusEnum,
    invitationId?: string | null,
    errorMessage?: string
  ): Promise<void> {
    try {
      await this.prisma.support_invitation_import.updateMany({
        where: {
          batchId,
          email,
        },
        data: {
          status,
          invitationId,
          validationErrors: errorMessage || null,
          updatedAt: new Date(),
        },
      });

      logger.info('Updated support invitation import record status', {
        context: 'SupportInvitationImportProcessor.updateImportRecordStatus',
        batchId,
        email,
        status,
        invitationId,
      });
    } catch (error) {
      logger.error('Failed to update support invitation import record status', {
        context: 'SupportInvitationImportProcessor.updateImportRecordStatus',
        batchId,
        email,
        status,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Don't throw error as this is not critical
    }
  }

  /**
   * Update overall progress when all batches are complete
   */
  private async updateOverallProgress(
    batchId: string,
    supportUserId: string
  ): Promise<void> {
    try {
      // Get count of invited candidates for this batch
      const invitedCount = await this.prisma.support_invitation_import.count({
        where: {
          batchId,
          supportUserId,
          status: SupportInvitationImportStatusEnum.INVITED,
        },
      });

      // Get total count for this batch
      const totalCount = await this.prisma.support_invitation_import.count({
        where: {
          batchId,
          supportUserId,
        },
      });

      logger.info('Overall support invitation import processing completed', {
        context: 'SupportInvitationImportProcessor.updateOverallProgress',
        batchId,
        supportUserId,
        totalCandidates: totalCount,
        invitedCandidates: invitedCount,
        successRate:
          totalCount > 0
            ? `${((invitedCount / totalCount) * 100).toFixed(1)}%`
            : '0%',
      });
    } catch (error) {
      logger.error('Failed to update overall progress', {
        context: 'SupportInvitationImportProcessor.updateOverallProgress',
        batchId,
        supportUserId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Don't throw error as this is not critical
    }
  }

  /**
   * Mark candidates in a failed batch as failed
   */
  private async markBatchAsFailed(
    batchId: string,
    candidates: ISupportInvitationImportRowData[],
    error: any
  ): Promise<void> {
    try {
      const candidateEmails = candidates.map((c) => c.email);

      await this.prisma.support_invitation_import.updateMany({
        where: {
          batchId,
          email: { in: candidateEmails },
        },
        data: {
          status: SupportInvitationImportStatusEnum.FAILED,
          validationErrors: `Invitation processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      });

      logger.info('Marked batch candidates as failed', {
        context: 'SupportInvitationImportProcessor.markBatchAsFailed',
        batchId,
        candidateCount: candidateEmails.length,
      });
    } catch (updateError) {
      logger.error('Failed to mark batch as failed', {
        context: 'SupportInvitationImportProcessor.markBatchAsFailed',
        batchId,
        error:
          updateError instanceof Error ? updateError.message : 'Unknown error',
      });
    }
  }
}
