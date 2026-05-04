import { PrismaClient } from '@prisma/client';
import { RagFactory } from '../helpers/rag/rag.factory';
import { singleton } from '@/shared/decorators/singleton';
import { logger } from '@/shared/utils/logger';

@singleton
export class RagService {
  private prisma: PrismaClient;
  private ragProvider;

  constructor() {
    this.prisma = new PrismaClient();
    this.ragProvider = RagFactory.getInstance().getProvider();
  }

  /**
   * Process all dirty candidates and jobs
   * @param batchSize Number of entities to process in each batch
   */
  async processDirtyEntities(batchSize: number = 10): Promise<void> {
    try {
      logger.info({
        message: 'Processing dirty entities',
        context: 'RagService.processDirtyEntities',
        batchSize,
      });

      // Process dirty candidates
      const dirtyCandidates = await this.prisma.candidate.findMany({
        where: {
          isDirty: true,
          isPublished: true,
        },
        take: batchSize,
      });

      logger.info({
        message: 'Found dirty candidates',
        context: 'RagService.processDirtyEntities',
        dirtyCandidatesCount: dirtyCandidates.length,
      });

      for (const candidate of dirtyCandidates) {
        try {
          await this.ragProvider.index(candidate.id, 'candidate');
        } catch (error) {
          logger.error({
            message: 'Failed to index candidate',
            context: 'RagService.processDirtyEntities',
            error: error instanceof Error ? error.message : 'Unknown error',
            candidateId: candidate.id,
          });
        }
      }

      // Process dirty jobs
      const dirtyJobs = await this.prisma.job_posting.findMany({
        where: {
          isDirty: true,
          isPublished: true,
        },
        take: batchSize,
      });

      for (const job of dirtyJobs) {
        try {
          await this.ragProvider.index(job.id, 'job');
        } catch (error) {
          logger.error({
            message: 'Failed to index job',
            context: 'RagService.processDirtyEntities',
            error: error instanceof Error ? error.message : 'Unknown error',
            jobId: job.id,
          });
        }
      }
    } catch (error) {
      logger.error({
        message: 'Failed to process dirty entities',
        context: 'RagService.processDirtyEntities',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
