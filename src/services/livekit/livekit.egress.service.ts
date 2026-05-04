import { singleton } from '@/shared/decorators/singleton';
import { EgressClient, EncodedFileType } from 'livekit-server-sdk';
import {
  GCPUpload,
  EncodedFileOutput,
  EncodingOptions,
  AudioCodec,
  VideoCodec,
} from '@livekit/protocol';
import { logger } from '@/shared/utils/logger';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { ENV } from '@/config/env';
import { gcpConfig } from '@/config/gcp';
import { Storage } from '@google-cloud/storage';
import { PrismaClient } from '@prisma/client';
import { OnboardingAssessmentVideoAnalysisProcessor } from '@/services/queue/processors/onboarding.assessment.video.analysis.processor';
import { JobAiAssessmentVideoAnalysisProcessor } from '@/services/queue/processors/job.ai.assessment.video.analysis.processor';
import {
  getBucketFolderPathToCandidateOnboardingAssessmentVideo,
  getBucketFolderPathToCandidateJobAiAssessmentVideo,
} from '@/utils/presigned.urls';

interface StartRecordingRequest {
  roomName: string;
  assessmentId: string;
  assessmentType: 'ONBOARDING' | 'JOB_AI';
  candidateId?: string; // Optional - will be fetched if not provided
  audioOnly?: boolean;
}

interface StartRecordingResponse {
  egressId: string;
  roomName: string;
  assessmentId: string;
  status: 'started';
  recordingPath: string;
}

interface EgressInfo {
  egressId: string;
  roomName: string;
  status: string;
  fileLocation?: string;
  duration?: string;
  fileSize?: string;
  error?: string;
}

@singleton
export class LiveKitEgressService {
  private egressClient: EgressClient;
  private storage: Storage;
  private prisma: PrismaClient;
  private gcpBucket: string;
  private recordingPrefix: string;
  private onboardingVideoAnalysisProcessor: OnboardingAssessmentVideoAnalysisProcessor;
  private jobAiVideoAnalysisProcessor: JobAiAssessmentVideoAnalysisProcessor;
  // Temporary in-memory storage for egress metadata
  // TODO: Move to Redis for production
  private egressMetadataMap: Map<
    string,
    {
      assessmentId: string;
      assessmentType: 'ONBOARDING' | 'JOB_AI';
      roomName: string;
      filePath: string;
    }
  >;
  // Track rooms currently starting recordings to prevent race conditions
  private recordingStartLocks: Map<string, Promise<StartRecordingResponse>>;

  constructor(
    onboardingVideoAnalysisProcessor: OnboardingAssessmentVideoAnalysisProcessor,
    jobAiVideoAnalysisProcessor: JobAiAssessmentVideoAnalysisProcessor
  ) {
    this.egressMetadataMap = new Map();
    this.recordingStartLocks = new Map();
    this.onboardingVideoAnalysisProcessor = onboardingVideoAnalysisProcessor;
    this.jobAiVideoAnalysisProcessor = jobAiVideoAnalysisProcessor;

    // Initialize LiveKit Egress Client
    this.egressClient = new EgressClient(
      ENV.LIVEKIT_API_URL || 'http://localhost:7880',
      ENV.LIVEKIT_API_KEY || 'devkey',
      ENV.LIVEKIT_API_SECRET || 'secret'
    );

    // Initialize Google Cloud Storage using centralized config
    this.storage = gcpConfig.getStorage();

    this.gcpBucket = ENV.GCS_BUCKET_NAME || 'teamcast-local-storage';
    this.recordingPrefix = ENV.GCS_RECORDING_PREFIX || 'interviews/recordings/';

    this.prisma = new PrismaClient();

    logger.info('LiveKitEgressService initialized', {
      bucket: this.gcpBucket,
      prefix: this.recordingPrefix,
    });
  }

  /**
   * Start recording a LiveKit room session
   */
  async startRoomRecording(
    request: StartRecordingRequest
  ): Promise<StartRecordingResponse> {
    const { roomName } = request;

    // CRITICAL: Check if recording is already being started for this room (race condition prevention)
    const existingLock = this.recordingStartLocks.get(roomName);
    if (existingLock) {
      logger.warn(
        '⚠️ Recording start already in progress for room - waiting for it',
        {
          roomName,
          assessmentId: request.assessmentId,
        }
      );
      // Wait for the existing recording start to complete and return its result
      return existingLock;
    }

    // Create a promise for this recording start and store it as a lock
    const recordingPromise = this._startRoomRecordingInternal(request);

    // Store the lock
    this.recordingStartLocks.set(roomName, recordingPromise);

    // Clean up the lock when done (success or failure)
    recordingPromise
      .finally(() => {
        this.recordingStartLocks.delete(roomName);
        logger.debug('Recording start lock released', { roomName });
      })
      .catch(() => {
        // Errors are handled in the internal method
      });

    return recordingPromise;
  }

  /**
   * Internal method to actually start the recording (called by startRoomRecording with lock protection)
   */
  private async _startRoomRecordingInternal(
    request: StartRecordingRequest
  ): Promise<StartRecordingResponse> {
    const {
      roomName,
      assessmentId,
      assessmentType,
      audioOnly = false,
    } = request;
    let { candidateId } = request;

    try {
      logger.info('Starting room recording', {
        roomName,
        assessmentId,
        assessmentType,
        audioOnly,
        candidateId,
      });

      // Check for existing active recordings to prevent duplicates
      const existingEgress = await this.egressClient.listEgress({ roomName });
      const activeRecordings = existingEgress.filter(
        (e) =>
          e.status?.toString() === 'EGRESS_STARTING' ||
          e.status?.toString() === 'EGRESS_ACTIVE'
      );

      if (activeRecordings.length > 0) {
        logger.warn(
          '⚠️ Recording already active for room - skipping duplicate',
          {
            roomName,
            assessmentId,
            activeEgressIds: activeRecordings.map((e) => e.egressId),
          }
        );

        // Return existing recording info
        return {
          egressId: activeRecordings[0].egressId,
          roomName,
          assessmentId,
          status: 'started',
          recordingPath: '', // Will be available when egress completes
        };
      }

      // Fetch candidateId if not provided
      if (!candidateId) {
        const assessment =
          assessmentType === 'ONBOARDING'
            ? await this.prisma.onboarding_assessment.findUnique({
                where: { id: assessmentId },
                select: { candidateId: true },
              })
            : await this.prisma.job_ai_assessment.findUnique({
                where: { id: assessmentId },
                select: { candidateId: true },
              });

        if (!assessment) {
          throw new AppError('Assessment not found', 404, ErrorCode.NOT_FOUND);
        }

        candidateId = assessment.candidateId;
        logger.info('Fetched candidateId from assessment', { candidateId });
      }

      // Generate recording file path using unified structure
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      // Note: Using MP4 format for LiveKit recordings
      // Video analysis is now format-agnostic and supports both MP4 and WebM
      const fileExtension = 'mp4';
      const fileName = `livekit-${assessmentId}-${timestamp}.${fileExtension}`;

      // Use unified path structure: candidates/${candidateId}/onboarding/${assessmentId}/video/
      const { folderPath } =
        assessmentType === 'ONBOARDING'
          ? getBucketFolderPathToCandidateOnboardingAssessmentVideo(
              candidateId,
              assessmentId
            )
          : getBucketFolderPathToCandidateJobAiAssessmentVideo(
              candidateId,
              assessmentId
            );

      const filePath = `${folderPath}/${fileName}`;

      logger.info('Generated recording file path', {
        filePath,
        candidateId,
        assessmentId,
        fileExtension,
      });

      // Get GCP credentials using the centralized config
      const credentialsJson = gcpConfig.getCredentialsJson();

      // Use MP4 format for LiveKit recordings (reliable cross-platform support)
      // Video analysis is format-agnostic and auto-detects MP4 vs WebM
      const fileType = EncodedFileType.MP4;

      // Configure file output with GCP upload
      const fileOutput = new EncodedFileOutput({
        fileType,
        filepath: filePath,
        output: {
          case: 'gcp',
          value: new GCPUpload({
            credentials: JSON.stringify(credentialsJson),
            bucket: this.gcpBucket,
          }),
        },
      });

      // Start room composite egress
      // Use egress service's built-in templates via template server
      const options: any = {
        customBaseUrl: ENV.LIVEKIT_EGRESS_TEMPLATE_BASE_URL, // Egress template server
      };

      // Only set audioOnly if explicitly requested
      if (audioOnly) {
        options.audioOnly = true;
      } else {
        // For video recording, use speaker layout and optimized 720p encoding
        options.layout = 'speaker';

        // Configure 720p encoding options for optimal quality and file size
        // Recommended for interview recordings: ~2-4 MB per minute
        options.encodingOptions = new EncodingOptions({
          width: 1280, // 720p width
          height: 720, // 720p height
          framerate: 24, // Lower framerate for smaller files
          videoBitrate: 800, // 800 kbps - balanced quality/size
          videoCodec: VideoCodec.H264_MAIN, // H.264 for broad compatibility
          audioBitrate: 128, // 128 kbps - high quality audio for interviews
          audioCodec: AudioCodec.OPUS, // OPUS for excellent voice quality
        });
      }

      const egressInfo = await this.egressClient.startRoomCompositeEgress(
        roomName,
        fileOutput,
        options
      );

      logger.info('Room recording started successfully', {
        egressId: egressInfo.egressId,
        roomName,
        filePath,
        audioOnly,
        encoding: audioOnly
          ? 'audio-only'
          : '720p (1280x720, 24fps, 800kbps video, 128kbps audio)',
      });

      // Store egress metadata in database
      await this.saveEgressMetadata(
        egressInfo.egressId,
        assessmentId,
        assessmentType,
        roomName,
        filePath
      );

      return {
        egressId: egressInfo.egressId,
        roomName,
        assessmentId,
        status: 'started',
        recordingPath: filePath,
      };
    } catch (error) {
      logger.error('Failed to start room recording', {
        error: error instanceof Error ? error.message : String(error),
        roomName,
        assessmentId,
      });

      throw new AppError(
        'Failed to start recording',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Stop an active recording
   */
  async stopRecording(egressId: string): Promise<void> {
    try {
      logger.info('Stopping recording', { egressId });

      await this.egressClient.stopEgress(egressId);

      logger.info('Recording stopped successfully', { egressId });
    } catch (error) {
      logger.error('Failed to stop recording', {
        error: error instanceof Error ? error.message : String(error),
        egressId,
      });

      throw new AppError(
        'Failed to stop recording',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Stop all active recordings for a specific room
   */
  async stopRecordingByRoomName(roomName: string): Promise<void> {
    try {
      logger.info('Stopping all recordings for room', { roomName });

      // List all egress for this room
      const egressList = await this.egressClient.listEgress({ roomName });

      // Filter for active recordings
      const activeEgress = egressList.filter(
        (e) =>
          e.status?.toString() === 'EGRESS_STARTING' ||
          e.status?.toString() === 'EGRESS_ACTIVE'
      );

      if (activeEgress.length === 0) {
        logger.info('No active recordings found for room', { roomName });
        return;
      }

      // Stop all active recordings
      for (const egress of activeEgress) {
        try {
          await this.egressClient.stopEgress(egress.egressId);
          logger.info('Stopped recording', {
            egressId: egress.egressId,
            roomName,
          });
        } catch (error) {
          logger.warn('Failed to stop individual recording', {
            error: error instanceof Error ? error.message : String(error),
            egressId: egress.egressId,
            roomName,
          });
        }
      }

      logger.info('All recordings stopped for room', {
        roomName,
        stoppedCount: activeEgress.length,
      });
    } catch (error) {
      logger.error('Failed to stop recordings for room', {
        error: error instanceof Error ? error.message : String(error),
        roomName,
      });

      // Don't throw error - this is called from webhook handler
      // and shouldn't fail the webhook processing
    }
  }

  /**
   * Get egress status
   */
  async getEgressInfo(egressId: string): Promise<EgressInfo> {
    try {
      const egressList = await this.egressClient.listEgress({ roomName: '' });
      const egress = egressList.find((e) => e.egressId === egressId);

      if (!egress) {
        throw new AppError('Egress not found', 404, ErrorCode.NOT_FOUND);
      }

      // Get file info from fileResults array
      const fileInfo = egress.fileResults?.[0];

      return {
        egressId: egress.egressId,
        roomName: egress.roomName || '',
        status: egress.status?.toString() || 'unknown',
        fileLocation: fileInfo?.location,
        duration: fileInfo?.duration?.toString(),
        fileSize: fileInfo?.size?.toString(),
      };
    } catch (error) {
      logger.error('Failed to get egress info', {
        error: error instanceof Error ? error.message : String(error),
        egressId,
      });

      throw new AppError(
        'Failed to get egress info',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Handle egress ended webhook event
   */
  async handleEgressEnded(egressInfo: any): Promise<void> {
    const { egressId, roomName, fileResults, error } = egressInfo;

    // Get file info from fileResults array
    const fileInfo = fileResults?.[0];

    try {
      logger.info('🎬 Handling egress ended event', {
        context: 'LiveKitEgressService.handleEgressEnded',
        egressId,
        roomName,
        fileLocation: fileInfo?.location,
        fileSize: fileInfo?.size,
        fileDuration: fileInfo?.duration,
        hasError: !!error,
        error,
        fileResultsCount: fileResults?.length || 0,
      });

      // Find assessment by egress ID
      const metadata = await this.findEgressMetadata(egressId);

      if (!metadata) {
        logger.warn('⚠️ Egress metadata not found', {
          context: 'LiveKitEgressService.handleEgressEnded',
          egressId,
          availableEgressIds: Array.from(this.egressMetadataMap.keys()),
        });
        return;
      }

      const { assessmentId, assessmentType, filePath } = metadata;

      logger.info('📋 Found egress metadata', {
        context: 'LiveKitEgressService.handleEgressEnded',
        egressId,
        assessmentId,
        assessmentType,
        filePath,
      });

      // Update assessment with recording information
      if (error) {
        await this.updateAssessmentRecordingStatus(
          assessmentId,
          assessmentType,
          'failed',
          filePath,
          { error }
        );
      } else {
        await this.updateAssessmentRecordingStatus(
          assessmentId,
          assessmentType,
          'completed',
          filePath,
          {
            duration: fileInfo?.duration?.toString(),
            size: fileInfo?.size?.toString(),
            location: fileInfo?.location,
          }
        );

        // Trigger video analysis after successful recording
        try {
          logger.info(
            '🎥 Triggering video analysis job for completed recording',
            {
              context: 'LiveKitEgressService.handleEgressEnded',
              assessmentId,
              assessmentType,
              filePath,
              fileLocation: fileInfo?.location,
              fileSize: fileInfo?.size,
              fileDuration: fileInfo?.duration,
            }
          );

          // Update video analysis status to IN_PROGRESS immediately when job is queued
          if (assessmentType === 'ONBOARDING') {
            await this.prisma.onboarding_assessment.update({
              where: { id: assessmentId },
              data: {
                videoAnalysisStatus: 'IN_PROGRESS',
              },
            });
            logger.info(
              '✅ Updated onboarding assessment video analysis status to IN_PROGRESS',
              {
                context: 'LiveKitEgressService.handleEgressEnded',
                assessmentId,
              }
            );
          } else {
            await this.prisma.job_ai_assessment.update({
              where: { id: assessmentId },
              data: {
                videoAnalysisStatus: 'IN_PROGRESS',
              },
            });
            logger.info(
              '✅ Updated job AI assessment video analysis status to IN_PROGRESS',
              {
                context: 'LiveKitEgressService.handleEgressEnded',
                assessmentId,
              }
            );
          }

          // Generate a task ID for video analysis
          const taskId = `video-analysis-${assessmentId}-${Date.now()}`;

          // Pass recording metadata to video analysis job
          const videoAnalysisOptions = {
            // Store recording path and location for video analysis to use
            recordingPath: filePath, // The GCP path: candidates/{candidateId}/onboarding/{assessmentId}/video/livekit-{assessmentId}-{timestamp}.mp4
            recordingLocation: fileInfo?.location, // Full gs:// URL
          };

          logger.info('📦 Video analysis options prepared', {
            context: 'LiveKitEgressService.handleEgressEnded',
            taskId,
            assessmentId,
            assessmentType,
            recordingPath: videoAnalysisOptions.recordingPath,
            recordingLocation: videoAnalysisOptions.recordingLocation,
          });

          if (assessmentType === 'ONBOARDING') {
            await this.onboardingVideoAnalysisProcessor.addVideoAnalysisJob(
              assessmentId,
              taskId,
              videoAnalysisOptions as any
            );
          } else {
            await this.jobAiVideoAnalysisProcessor.addVideoAnalysisJob(
              assessmentId,
              taskId,
              videoAnalysisOptions as any
            );
          }

          logger.info('✅ Video analysis job queued successfully', {
            context: 'LiveKitEgressService.handleEgressEnded',
            assessmentId,
            assessmentType,
            taskId,
          });
        } catch (videoAnalysisError) {
          logger.error('Failed to trigger video analysis job', {
            error:
              videoAnalysisError instanceof Error
                ? videoAnalysisError.message
                : String(videoAnalysisError),
            assessmentId,
            assessmentType,
          });
          // Don't throw - video analysis failure shouldn't fail the egress ended handling
        }
      }

      logger.info('Assessment recording status updated', {
        assessmentId,
        assessmentType,
        status: error ? 'failed' : 'completed',
      });

      // 🧹 CRITICAL: Cleanup egress metadata from in-memory map after processing
      try {
        this.egressMetadataMap.delete(egressId);
        logger.info('✅ Cleaned up egress metadata from memory', {
          context: 'LiveKitEgressService.handleEgressEnded',
          egressId,
          remainingEgressCount: this.egressMetadataMap.size,
        });
      } catch (cleanupError) {
        logger.error('Failed to cleanup egress metadata', {
          error:
            cleanupError instanceof Error
              ? cleanupError.message
              : String(cleanupError),
          egressId,
        });
      }
    } catch (err) {
      logger.error('Failed to handle egress ended event', {
        error: err instanceof Error ? err.message : String(err),
        egressId,
      });
    }
  }

  /**
   * Save transcript to GCP Storage
   */
  async saveTranscript(
    assessmentId: string,
    roomName: string,
    transcript: Array<{ timestamp: number; speaker: string; text: string }>
  ): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `transcript-${assessmentId}-${timestamp}.json`;
      const filePath = `interviews/transcripts/${assessmentId}/${fileName}`;

      const bucket = this.storage.bucket(this.gcpBucket);
      const file = bucket.file(filePath);

      const transcriptData = {
        assessmentId,
        roomName,
        timestamp: new Date().toISOString(),
        transcript,
        metadata: {
          totalMessages: transcript.length,
          duration: transcript[transcript.length - 1]?.timestamp || 0,
        },
      };

      await file.save(JSON.stringify(transcriptData, null, 2), {
        contentType: 'application/json',
        metadata: {
          assessmentId,
          roomName,
        },
      });

      logger.info('Transcript saved to GCP', {
        assessmentId,
        filePath,
        messageCount: transcript.length,
      });

      return filePath;
    } catch (error) {
      logger.error('Failed to save transcript', {
        error: error instanceof Error ? error.message : String(error),
        assessmentId,
      });

      throw new AppError(
        'Failed to save transcript',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Private helper: Save egress metadata to in-memory map
   * TODO: Move to Redis for production persistence
   */
  private async saveEgressMetadata(
    egressId: string,
    assessmentId: string,
    assessmentType: 'ONBOARDING' | 'JOB_AI',
    roomName: string,
    filePath: string
  ): Promise<void> {
    this.egressMetadataMap.set(egressId, {
      assessmentId,
      assessmentType,
      roomName,
      filePath,
    });

    logger.info('Egress metadata saved', {
      egressId,
      assessmentId,
      assessmentType,
      roomName,
    });
  }

  /**
   * Private helper: Find egress metadata from in-memory map
   * TODO: Move to Redis for production persistence
   */
  private async findEgressMetadata(egressId: string): Promise<{
    assessmentId: string;
    assessmentType: 'ONBOARDING' | 'JOB_AI';
    filePath: string;
  } | null> {
    const metadata = this.egressMetadataMap.get(egressId);

    if (!metadata) {
      logger.warn('Egress metadata not found in map', { egressId });
      return null;
    }

    return metadata;
  }

  /**
   * Private helper: Update assessment recording status
   */
  private async updateAssessmentRecordingStatus(
    assessmentId: string,
    assessmentType: 'ONBOARDING' | 'JOB_AI',
    status: 'completed' | 'failed',
    filePath: string,
    metadata: any
  ): Promise<void> {
    const updateData = {
      metadata: {
        egress: {
          status,
          filePath,
          completedAt: new Date().toISOString(),
          ...metadata,
        },
      },
    };

    if (assessmentType === 'ONBOARDING') {
      await this.prisma.onboarding_assessment.update({
        where: { id: assessmentId },
        data: updateData as any,
      });
    } else {
      await this.prisma.job_ai_assessment.update({
        where: { id: assessmentId },
        data: updateData as any,
      });
    }
  }
}
