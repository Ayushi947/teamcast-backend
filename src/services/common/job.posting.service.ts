import { PrismaClient } from '@prisma/client';
import { singleton } from '@/shared/decorators/singleton';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';

@singleton
export class CommonJobPostingService {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get job posting by ID for job assessment initialization
   * This method fetches the job posting data needed for assessment initialization
   */
  async getJobPostingForAssessment(jobPostingId: string): Promise<{
    id: string;
    title: string;
    description: string;
    clientId: string;
  }> {
    try {
      const jobPosting = await this.prisma.job_posting.findUnique({
        where: {
          id: jobPostingId,
        },
        select: {
          id: true,
          title: true,
          description: true,
          clientId: true,
        },
      });

      if (!jobPosting) {
        throw new AppError(
          'Job posting not found',
          404,
          ErrorCode.JOB_POSTING_NOT_FOUND
        );
      }

      return jobPosting;
    } catch (error) {
      logger.error({
        message: 'Failed to get job posting for assessment',
        context: 'CommonJobPostingService.getJobPostingForAssessment',
        error: error instanceof Error ? error.message : 'Unknown error',
        jobPostingId,
      });
      throw error;
    }
  }
}
