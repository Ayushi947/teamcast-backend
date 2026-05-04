import { Job } from 'bullmq';
import { singleton } from '@/shared/decorators/singleton';
import { logger } from '@/shared/utils/logger';
import { QueueService, QueueJobData, QUEUE_NAMES } from '../queue.service';
import { PrismaClient } from '@prisma/client';
import { CandidateResumeAssessmentService } from '@/services/candidate/resume.assessment.service';
import { ENV } from '@/config/env';

export interface ResumeAssessmentJobData extends QueueJobData {
  taskId: string;
  candidateId: string;
  resumeId: string;
}

@singleton
export class ResumeAssessmentProcessor {
  private readonly prisma: PrismaClient;
  private readonly queueService: QueueService;

  constructor(
    private readonly candidateResumeAssessmentService: CandidateResumeAssessmentService
  ) {
    this.prisma = new PrismaClient();
    this.queueService = new QueueService();
    logger.info('Resume assessment processor initialized', {
      context: 'ResumeAssessmentProcessor.constructor',
    });
  }

  /**
   * Set up workers for processing resume assessment jobs
   */
  async setupWorkers(): Promise<void> {
    // Assessment worker
    this.queueService.createWorker(
      QUEUE_NAMES.RESUME_ASSESSMENT,
      this.processAssessmentJob.bind(this),
      {
        concurrency: ENV.BULLMQ_DASHBOARD_CONCURRENCY,
      }
    );

    logger.info('Resume assessment workers initialized', {
      context: 'ResumeAssessmentProcessor.setupWorkers',
    });
  }

  /**
   * Add an assessment job to the queue
   */
  async addAssessmentJob(
    taskId: string,
    candidateId: string,
    resumeId: string
  ): Promise<void> {
    const jobData: ResumeAssessmentJobData = {
      taskId,
      candidateId,
      resumeId,
    };

    await this.queueService.addJob(
      QUEUE_NAMES.RESUME_ASSESSMENT,
      'assess-resume',
      jobData,
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      }
    );

    logger.info('Resume assessment job added to queue', {
      context: 'ResumeAssessmentProcessor.addAssessmentJob',
      taskId,
      candidateId,
      resumeId,
    });
  }

  /**
   * Process assessment job
   */
  private async processAssessmentJob(
    job: Job<ResumeAssessmentJobData>
  ): Promise<void> {
    const { taskId, candidateId, resumeId } = job.data;

    logger.info('Processing resume assessment job', {
      context: 'ResumeAssessmentProcessor.processAssessmentJob',
      jobId: job.id,
      taskId,
      candidateId,
      resumeId,
    });

    try {
      // Start background assessment task
      await this.candidateResumeAssessmentService.startBackgroundProcessAssessment(
        taskId,
        candidateId,
        resumeId
      );

      logger.info('Resume assessment job completed successfully', {
        context: 'ResumeAssessmentProcessor.processAssessmentJob',
        jobId: job.id,
        taskId,
        candidateId,
      });
    } catch (error) {
      logger.error('Failed to process resume assessment job', {
        context: 'ResumeAssessmentProcessor.processAssessmentJob',
        jobId: job.id,
        taskId,
        candidateId,
        resumeId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
