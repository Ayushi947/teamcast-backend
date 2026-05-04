import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/shared/utils/logger';
import { JobInviteService } from '@/services/client/job.invite.service';
import { IJobInviteApiRequest } from '@/shared/models/api/client/job.invite.api';
import { INotificationProvider } from '@/services/notification/notification.interface';
import { NotificationFactory } from '@/services/notification/notification.factory';
import { ICandidateImportRowData } from '@/shared/models/domain/client/candidate.import.domain';
import { CandidateImportStatusEnum } from '@/shared/models/common/enums';
import { QueueService, QUEUE_NAMES, QueueJobData } from '../queue.service';
import { ENV } from '@/config/env';
import { singleton } from '@/shared/decorators/singleton';

export interface CandidateImportInviteJobData extends QueueJobData {
  batchId: string;
  jobPostingId: string;
  clientId: string;
  uploadedBy: string;
  candidates: ICandidateImportRowData[];
  batchIndex: number;
  totalBatches: number;
}

export interface CandidateImportInviteResult {
  batchId: string;
  batchIndex: number;
  totalCandidates: number;
  successfulInvites: number;
  failedInvites: number;
  processedAt: Date;
}

@singleton
export class CandidateImportInviteProcessor {
  private readonly prisma: PrismaClient;
  private readonly batchSize = 100; // Process 100 candidates at a time
  private readonly queueService: QueueService;

  constructor() {
    this.prisma = new PrismaClient();
    this.queueService = new QueueService();

    logger.info('Candidate import invite processor initialized', {
      context: 'CandidateImportInviteProcessor.constructor',
    });
  }

  /**
   * Set up workers for processing candidate import invite jobs
   */
  async setupWorkers(): Promise<void> {
    this.queueService.createWorker(
      QUEUE_NAMES.CANDIDATE_IMPORT_INVITE_PROCESSING,
      this.process.bind(this),
      {
        concurrency: ENV.BULLMQ_DASHBOARD_CONCURRENCY,
      }
    );

    logger.info('Candidate import invite workers initialized', {
      context: 'CandidateImportInviteProcessor.setupWorkers',
    });
  }

  /**
   * Process candidate import invite job
   */
  async process(
    job: Job<CandidateImportInviteJobData>
  ): Promise<CandidateImportInviteResult> {
    const {
      batchId,
      jobPostingId,
      clientId,
      uploadedBy,
      candidates,
      batchIndex,
      totalBatches,
    } = job.data;

    logger.info('Starting candidate import invite processing', {
      context: 'CandidateImportInviteProcessor.process',
      batchId,
      jobPostingId,
      clientId,
      batchIndex,
      totalBatches,
      candidateCount: candidates.length,
      jobId: job.id,
    });

    try {
      // Validate job posting exists
      const jobPosting = await this.prisma.job_posting.findUnique({
        where: { id: jobPostingId, clientId },
        select: { id: true, title: true },
      });

      if (!jobPosting) {
        throw new Error(
          `Job posting ${jobPostingId} not found for client ${clientId}`
        );
      }

      // Get client user ID from uploadedBy
      let clientUserId: string;
      const clientUser = await this.prisma.client_user.findFirst({
        where: {
          id: uploadedBy,
          clientId: clientId,
        },
        select: { id: true },
      });

      if (!clientUser) {
        logger.warn(
          'Client user not found, using first available client user',
          {
            context: 'CandidateImportInviteProcessor.process',
            uploadedBy,
            clientId,
            batchId,
          }
        );

        const fallbackClientUser = await this.prisma.client_user.findFirst({
          where: { clientId },
          select: { id: true },
        });

        if (!fallbackClientUser) {
          throw new Error(`No client user found for client ${clientId}`);
        }

        clientUserId = fallbackClientUser.id;
      } else {
        clientUserId = clientUser.id;
      }

      // Prepare candidates data for job invite
      const candidatesForInvite = candidates.map((candidate) => ({
        name: candidate.name,
        email: candidate.email,
      }));

      // Create job invite request
      const jobInviteRequest: IJobInviteApiRequest = {
        candidates: candidatesForInvite,
        jobTitle: jobPosting.title || 'Job Position',
        jobId: jobPostingId,
      };

      logger.info(
        'Processing candidate batch for invites (without applications)',
        {
          context: 'CandidateImportInviteProcessor.process',
          batchId,
          batchIndex,
          candidateCount: candidatesForInvite.length,
        }
      );

      // Get Excel Upload integration provider ID
      const excelUploadProvider =
        await this.prisma.integration_provider.findFirst({
          where: {
            name: 'Excel Upload',
            isActive: true,
          },
          select: { id: true },
        });

      // Create dependencies for JobInviteService
      const notificationFactory = new NotificationFactory();
      const notificationProvider: INotificationProvider =
        notificationFactory.getNotificationProvider();
      const jobInviteService = new JobInviteService(notificationProvider);

      // Call JobInviteService to create invites for this batch (without applications)
      const inviteResults =
        await jobInviteService.createJobInviteWithoutApplication(
          jobInviteRequest,
          clientUserId,
          true, // Set isImportedCandidate to true for imported candidates
          excelUploadProvider?.id // Pass the integration provider ID
        );

      // Count successful and failed invites
      const successfulInvites = inviteResults.filter(
        (result) => result.id
      ).length;
      const failedInvites = inviteResults.filter((result) => !result.id);

      // Update candidate import records to INVITED status for successful invites
      if (successfulInvites > 0) {
        await this.updateCandidateImportStatusToInvited(
          batchId,
          candidates,
          successfulInvites
        );
      }

      // Log details about failed invites
      if (failedInvites.length > 0) {
        logger.info('Some job invites failed in batch (without applications)', {
          context: 'CandidateImportInviteProcessor.process',
          batchId,
          batchIndex,
          failedInvites: failedInvites.map((result) => result.message),
        });
      }

      // Update job progress if this is the last batch
      if (batchIndex === totalBatches - 1) {
        await this.updateOverallProgress(batchId, jobPostingId, clientId);
      }

      const result: CandidateImportInviteResult = {
        batchId,
        batchIndex,
        totalCandidates: candidates.length,
        successfulInvites,
        failedInvites: failedInvites.length,
        processedAt: new Date(),
      };

      logger.info(
        'Candidate import invite batch processing completed (without applications)',
        {
          context: 'CandidateImportInviteProcessor.process',
          result,
          jobId: job.id,
        }
      );

      return result;
    } catch (error) {
      logger.error(
        'Failed to process candidate import invite batch (without applications)',
        {
          context: 'CandidateImportInviteProcessor.process',
          batchId,
          batchIndex,
          jobPostingId,
          clientId,
          error: error instanceof Error ? error.message : 'Unknown error',
          jobId: job.id,
        }
      );

      // Mark candidate import records as failed for this batch
      await this.markBatchAsFailed(batchId, candidates, error);

      throw error;
    }
  }

  /**
   * Split candidates into batches for processing
   */
  splitIntoBatches(
    candidates: ICandidateImportRowData[]
  ): ICandidateImportRowData[][] {
    const batches: ICandidateImportRowData[][] = [];

    for (let i = 0; i < candidates.length; i += this.batchSize) {
      const batch = candidates.slice(i, i + this.batchSize);
      batches.push(batch);
    }

    logger.info('Split candidates into batches', {
      context: 'CandidateImportInviteProcessor.splitIntoBatches',
      totalCandidates: candidates.length,
      batchSize: this.batchSize,
      totalBatches: batches.length,
    });

    return batches;
  }

  /**
   * Queue job invites for imported candidates in batches
   */
  async queueInviteBatches(
    candidateRows: ICandidateImportRowData[],
    batchId: string,
    jobPostingId: string,
    clientId: string,
    uploadedBy: string
  ): Promise<number> {
    try {
      logger.info(
        'Queuing job invites for imported candidates (without applications)',
        {
          context: 'CandidateImportInviteProcessor.queueInviteBatches',
          batchId,
          jobPostingId,
          clientId,
          candidateCount: candidateRows.length,
        }
      );

      // Split candidates into manageable batches
      const candidateBatches = this.splitIntoBatches(candidateRows);

      logger.info(
        'Split candidates into batches for queue processing (without applications)',
        {
          context: 'CandidateImportInviteProcessor.queueInviteBatches',
          batchId,
          totalCandidates: candidateRows.length,
          totalBatches: candidateBatches.length,
        }
      );

      // Queue each batch for processing
      const queuePromises = candidateBatches.map(
        async (candidateBatch, index) => {
          const jobData: CandidateImportInviteJobData = {
            batchId,
            jobPostingId,
            clientId,
            uploadedBy,
            candidates: candidateBatch,
            batchIndex: index,
            totalBatches: candidateBatches.length,
          };

          const job = await this.queueService.addJob(
            QUEUE_NAMES.CANDIDATE_IMPORT_INVITE_PROCESSING,
            `candidate-import-invite-${batchId}-batch-${index}`,
            jobData,
            {
              delay: index * 2000, // Stagger batches by 2 seconds to avoid overwhelming the system
              attempts: 3,
              backoff: {
                type: 'exponential',
                delay: 5000,
              },
            }
          );

          logger.info('Queued candidate invite batch (without applications)', {
            context: 'CandidateImportInviteProcessor.queueInviteBatches',
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

      logger.info(
        'All candidate invite batches queued successfully (without applications)',
        {
          context: 'CandidateImportInviteProcessor.queueInviteBatches',
          batchId,
          jobPostingId,
          totalBatches: candidateBatches.length,
          totalCandidates: candidateRows.length,
        }
      );

      return candidateBatches.length;
    } catch (error) {
      logger.error(
        'Failed to queue job invites for imported candidates (without applications)',
        {
          context: 'CandidateImportInviteProcessor.queueInviteBatches',
          batchId,
          jobPostingId,
          clientId,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );
      throw error;
    }
  }

  /**
   * Update candidate import records to INVITED status for successful invites
   */
  private async updateCandidateImportStatusToInvited(
    batchId: string,
    candidates: ICandidateImportRowData[],
    successfulInvites: number
  ): Promise<void> {
    try {
      const candidateEmails = candidates.map((c) => c.email);

      // Update candidate import records to INVITED status
      const updateResult = await this.prisma.candidate_import.updateMany({
        where: {
          batchId,
          email: { in: candidateEmails },
          status: CandidateImportStatusEnum.PROCESSED, // Only update PROCESSED records
        },
        data: {
          status: CandidateImportStatusEnum.INVITED,
          updatedAt: new Date(),
        },
      });

      logger.info('Updated candidate import records to INVITED status', {
        context:
          'CandidateImportInviteProcessor.updateCandidateImportStatusToInvited',
        batchId,
        totalCandidates: candidateEmails.length,
        successfulInvites,
        updatedRecords: updateResult.count,
      });
    } catch (error) {
      logger.error('Failed to update candidate import status to INVITED', {
        context:
          'CandidateImportInviteProcessor.updateCandidateImportStatusToInvited',
        batchId,
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
    jobPostingId: string,
    clientId: string
  ): Promise<void> {
    try {
      // Get count of invited candidates for this batch
      const invitedCount = await this.prisma.candidate_import.count({
        where: {
          batchId,
          jobPostingId,
          clientId,
          status: CandidateImportStatusEnum.INVITED,
        },
      });

      // Get total count for this batch
      const totalCount = await this.prisma.candidate_import.count({
        where: {
          batchId,
          jobPostingId,
          clientId,
        },
      });

      logger.info('Overall candidate import invite processing completed', {
        context: 'CandidateImportInviteProcessor.updateOverallProgress',
        batchId,
        jobPostingId,
        totalCandidates: totalCount,
        invitedCandidates: invitedCount,
        successRate:
          totalCount > 0
            ? `${((invitedCount / totalCount) * 100).toFixed(1)}%`
            : '0%',
      });
    } catch (error) {
      logger.error('Failed to update overall progress', {
        context: 'CandidateImportInviteProcessor.updateOverallProgress',
        batchId,
        jobPostingId,
        clientId,
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
    candidates: ICandidateImportRowData[],
    error: any
  ): Promise<void> {
    try {
      const candidateEmails = candidates.map((c) => c.email);

      await this.prisma.candidate_import.updateMany({
        where: {
          batchId,
          email: { in: candidateEmails },
        },
        data: {
          status: CandidateImportStatusEnum.FAILED,
          validationErrors: `Invite processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      });

      logger.info('Marked batch candidates as failed', {
        context: 'CandidateImportInviteProcessor.markBatchAsFailed',
        batchId,
        candidateCount: candidateEmails.length,
      });
    } catch (updateError) {
      logger.error('Failed to mark batch as failed', {
        context: 'CandidateImportInviteProcessor.markBatchAsFailed',
        batchId,
        error:
          updateError instanceof Error ? updateError.message : 'Unknown error',
      });
    }
  }
}
