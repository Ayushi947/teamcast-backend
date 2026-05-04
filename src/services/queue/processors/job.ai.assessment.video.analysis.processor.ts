import { Job } from 'bullmq';
import { singleton } from '@/shared/decorators/singleton';
import { logger } from '@/shared/utils/logger';
import {
  QueueService,
  QueueJobData,
  QueueJobOptions,
  QUEUE_NAMES,
} from '../queue.service';
import { ENV } from '@/config/env';
import { JobAiAssessmentService } from '@/services/candidate/job.ai.assessment.service';
import { IJobAiAssessmentProvider } from '@/services/helpers/job.ai.assessment/job.ai.assessment.provider';

interface JobAiAssessmentVideoAnalysisJobData extends QueueJobData {
  assessmentId: string;
  taskId: string;
  recordingPath?: string; // GCP path to the recorded video
  recordingLocation?: string; // Full gs:// URL
}

@singleton
export class JobAiAssessmentVideoAnalysisProcessor {
  private queueService: QueueService;
  private jobAiAssessmentService: JobAiAssessmentService;
  private jobAiAssessmentProvider: IJobAiAssessmentProvider;

  constructor(
    jobAiAssessmentService: JobAiAssessmentService,
    jobAiAssessmentProvider: IJobAiAssessmentProvider
  ) {
    this.queueService = new QueueService();
    this.jobAiAssessmentService = jobAiAssessmentService;
    this.jobAiAssessmentProvider = jobAiAssessmentProvider;

    // Validate video analysis workers configuration
    this.validateWorkerConfiguration();

    logger.info('Job AI assessment video analysis processor initialized', {
      context: 'JobAiAssessmentVideoAnalysisProcessor.constructor',
      chunkAnalysisEnabled: ENV.ENABLE_CHUNK_VIDEO_ANALYSIS_WORKERS,
      legacyGpuEnabled: ENV.ENABLE_GPU_BULLMQ_WORKERS,
      environment: ENV.NODE_ENV,
    });
  }

  /**
   * Validate video analysis workers configuration
   * Warns if video analysis workers are disabled in production
   */
  private validateWorkerConfiguration(): void {
    // Check new flag first, fallback to legacy GPU flag for backward compatibility
    const workersEnabled =
      ENV.ENABLE_CHUNK_VIDEO_ANALYSIS_WORKERS || ENV.ENABLE_GPU_BULLMQ_WORKERS;

    if (
      (ENV.NODE_ENV === 'production' || ENV.NODE_ENV === 'qa') &&
      !workersEnabled
    ) {
      logger.warn(
        'Video analysis workers are DISABLED in production/qa environment. Video analysis will NOT be processed!',
        {
          context:
            'JobAiAssessmentVideoAnalysisProcessor.validateWorkerConfiguration',
          environment: ENV.NODE_ENV,
          ENABLE_CHUNK_VIDEO_ANALYSIS_WORKERS:
            ENV.ENABLE_CHUNK_VIDEO_ANALYSIS_WORKERS,
          ENABLE_GPU_BULLMQ_WORKERS: ENV.ENABLE_GPU_BULLMQ_WORKERS,
          recommendation:
            'Set ENABLE_CHUNK_VIDEO_ANALYSIS_WORKERS=true to enable cloud-based chunk video analysis (no GPU required)',
        }
      );
    }
  }

  /**
   * Set up workers for processing job AI assessment video analysis jobs
   * Enabled when ENABLE_CHUNK_VIDEO_ANALYSIS_WORKERS or legacy ENABLE_GPU_BULLMQ_WORKERS is true
   */
  async setupWorkers(): Promise<void> {
    // Check new flag first, fallback to legacy GPU flag for backward compatibility
    const workersEnabled =
      ENV.ENABLE_CHUNK_VIDEO_ANALYSIS_WORKERS || ENV.ENABLE_GPU_BULLMQ_WORKERS;

    if (!workersEnabled) {
      logger.info(
        'Video analysis workers are disabled, skipping worker setup',
        {
          context: 'JobAiAssessmentVideoAnalysisProcessor.setupWorkers',
          note: 'Set ENABLE_CHUNK_VIDEO_ANALYSIS_WORKERS=true to enable (no GPU required)',
        }
      );
      return;
    }

    // Video analysis worker - uses Google Cloud Video Intelligence API (cloud-based, no local GPU needed)
    this.queueService.createWorker(
      QUEUE_NAMES.JOB_AI_ASSESSMENT_VIDEO_ANALYSIS,
      this.processVideoAnalysisJob.bind(this),
      {
        concurrency: ENV.BULLMQ_DASHBOARD_CONCURRENCY,
      }
    );

    logger.info('Job AI assessment video analysis workers initialized', {
      context: 'JobAiAssessmentVideoAnalysisProcessor.setupWorkers',
    });
  }

  /**
   * Add a video analysis job to the queue
   * Uses jobId for deduplication to prevent processing the same video multiple times
   */
  async addVideoAnalysisJob(
    assessmentId: string,
    taskId: string,
    options?: QueueJobOptions & {
      recordingPath?: string;
      recordingLocation?: string;
    }
  ): Promise<void> {
    // Create unique job ID for deduplication
    const jobId = `video-analysis-${assessmentId}-${taskId}`;

    const jobData: JobAiAssessmentVideoAnalysisJobData = {
      assessmentId,
      taskId,
      recordingPath: options?.recordingPath,
      recordingLocation: options?.recordingLocation,
    };

    await this.queueService.addJob(
      QUEUE_NAMES.JOB_AI_ASSESSMENT_VIDEO_ANALYSIS,
      'process-video-analysis',
      jobData,
      {
        ...options,
        jobId, // Add jobId for deduplication - BullMQ will prevent duplicate jobs with same ID
        // Add specific options for GPU jobs
        attempts: 3, // Retry up to 3 times for GPU processing
        backoff: {
          type: 'exponential',
          delay: 10000, // 10 seconds base delay for GPU jobs
        },
        // GPU jobs configuration
        // Remove completed jobs after 5 to save space
        removeOnComplete: 5,
        removeOnFail: 10,
      }
    );

    logger.info('Video analysis job added to queue', {
      context: 'JobAiAssessmentVideoAnalysisProcessor.addVideoAnalysisJob',
      assessmentId,
      taskId,
      jobId,
      deduplication: 'enabled',
    });
  }

  /**
   * Process video analysis job
   * This runs on GPU-enabled machines
   */
  private async processVideoAnalysisJob(
    job: Job<JobAiAssessmentVideoAnalysisJobData>
  ): Promise<void> {
    const { assessmentId, taskId } = job.data;

    try {
      logger.info('Processing job AI assessment video analysis job', {
        context:
          'JobAiAssessmentVideoAnalysisProcessor.processVideoAnalysisJob',
        jobId: job.id,
        assessmentId,
        taskId,
      });

      await this.jobAiAssessmentService.backgroundProcessVideoAnalysis(
        assessmentId,
        taskId
      );

      logger.info(
        'Job AI assessment video analysis job completed successfully',
        {
          context:
            'JobAiAssessmentVideoAnalysisProcessor.processVideoAnalysisJob',
          jobId: job.id,
          assessmentId,
          taskId,
        }
      );
    } catch (error) {
      logger.error('Job AI assessment video analysis job failed', {
        context:
          'JobAiAssessmentVideoAnalysisProcessor.processVideoAnalysisJob',
        jobId: job.id,
        assessmentId,
        taskId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      throw error;
    }
  }
}
