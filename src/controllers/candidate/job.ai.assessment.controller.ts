import { Request, Response, NextFunction } from 'express';
import { JobAiAssessmentService } from '@/services/candidate/job.ai.assessment.service';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import {
  ICandidateJobAiAssessmentListGetApiResponse,
  ICandidateJobAiAssessmentGetApiRequest,
  ICandidateJobAiAssessmentGetApiResponse,
  ICandidateJobAiAssessmentListRequest,
  ICandidateJobAiAssessmentStartApiResponse,
  ICandidateJobAiAssessmentSubmitAnswerApiResponse,
  ICandidateJobAiAssessmentSubmitAnswerApiRequest,
  ICandidateJobAiAssessmentInitializeApiResponse,
  ICandidateJobAiAssessmentTaskGetApiResponse,
  ICandidateJobAiAssessmentTaskGetApiRequest,
  ICandidateJobAiAssessmentStartApiRequest,
  ICandidateJobAiAssessmentHeartbeatApiRequest,
  ICandidateJobAiAssessmentProctorApiRequest,
  ICandidateJobAiAssessmentSubmitApiRequest,
  ICandidateJobAiAssessmentHeartbeatApiResponse,
  ICandidateJobAiAssessmentProctorApiResponse,
  ICandidateJobAiAssessmentSubmitApiResponse,
  ICandidateJobAiAssessmentPresignedUrlApiRequest,
  ICandidateJobAiAssessmentPresignedUrlApiResponse,
  ICandidateLatestJobAiAssessmentGetApiResponse,
  ICandidateJobAiAssessmentQuestionAudioPresignedUrlApiRequest,
  ICandidateJobAiAssessmentQuestionAudioPresignedUrlApiResponse,
  ICandidateJobAiAssessmentInitializeApiResquest,
  ICandidateJobAiAssessmentInvitationUrlApiRequest,
  ICandidateJobAiAssessmentInvitationUrlApiResponse,
  ICandidateJobAiAssessmentGetLatestByCandidateIdApiRequest,
  ICandidateJobAiAssessmentInterviewsApiPaginatedResponse,
  ICandidateJobAiAssessmentInterviewsApiRequest,
} from '@/shared/models/api/candidate/job.ai.assessment.api';
import { singleton } from '@/shared/decorators/singleton';
import { ErrorCode } from '@/utils/error.codes';
import { AppError } from '@/utils/app.error';

@singleton
export class JobAiAssessmentController extends BaseController {
  constructor(private readonly jobAiAssessmentService: JobAiAssessmentService) {
    super();
  }

  /**
   * Get all job ai assessments for a candidate
   */
  getJobAiAssessments = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateJobAiAssessmentListGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user?.candidateId;
        if (!candidateId) {
          throw new AppError(
            'Candidate ID is required',
            400,
            ErrorCode.CANDIDATE_ID_REQUIRED
          );
        }
        const request =
          createIApiRequest<ICandidateJobAiAssessmentListRequest>(req);
        return await this.jobAiAssessmentService.getJobAiAssessments(
          candidateId,
          request.filters,
          request.pagination
        );
      }
    );
  };

  /**
   * Get a specific job ai assessment
   */
  getJobAiAssessment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateJobAiAssessmentGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user?.candidateId;
        if (!candidateId) {
          throw new AppError(
            'Candidate ID is required',
            400,
            ErrorCode.CANDIDATE_ID_REQUIRED
          );
        }
        const { params } =
          createIApiRequest<ICandidateJobAiAssessmentGetApiRequest>(req);
        return await this.jobAiAssessmentService.getJobAiAssessment(
          candidateId,
          params.assessmentId
        );
      }
    );
  };

  /**
   * Initialize job ai assessment initialize task
   */
  initialize = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateJobAiAssessmentInitializeApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user?.candidateId;
        const { params } =
          createIApiRequest<ICandidateJobAiAssessmentInitializeApiResquest>(
            req
          );
        if (!candidateId) {
          throw new AppError(
            'Candidate ID is required',
            400,
            ErrorCode.CANDIDATE_ID_REQUIRED
          );
        }
        return await this.jobAiAssessmentService.initialize(
          candidateId,
          params.jobAiAssessmentInviteId
        );
      }
    );
  };

  /**
   * Get job ai assessment initialize task
   */
  getJobAiAssessmentTask = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateJobAiAssessmentTaskGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user?.candidateId;
        if (!candidateId) {
          throw new AppError(
            'Candidate ID is required',
            400,
            ErrorCode.CANDIDATE_ID_REQUIRED
          );
        }
        const { params } =
          createIApiRequest<ICandidateJobAiAssessmentTaskGetApiRequest>(req);
        if (!params.assessmentId) {
          throw new AppError(
            'Assessment ID is required',
            400,
            ErrorCode.JOB_AI_ASSESSMENT_ID_REQUIRED
          );
        }
        return await this.jobAiAssessmentService.getJobAiAssessmentTask(
          candidateId,
          params.assessmentId
        );
      }
    );
  };

  /**
   * Start an job ai assessment
   */
  startAssessment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateJobAiAssessmentStartApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user?.candidateId;
        if (!candidateId) {
          throw new AppError(
            'Candidate ID is required',
            400,
            ErrorCode.CANDIDATE_ID_REQUIRED
          );
        }
        const { params } =
          createIApiRequest<ICandidateJobAiAssessmentStartApiRequest>(req);
        return await this.jobAiAssessmentService.startAssessment(
          candidateId,
          params.assessmentId
        );
      }
    );
  };

  /**
   * Submit answer for a question
   */
  submitAnswer = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateJobAiAssessmentSubmitAnswerApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user?.candidateId;
        if (!candidateId) {
          throw new AppError(
            'Candidate ID is required',
            400,
            ErrorCode.CANDIDATE_ID_REQUIRED
          );
        }
        const data =
          createIApiRequest<ICandidateJobAiAssessmentSubmitAnswerApiRequest>(
            req
          );
        return await this.jobAiAssessmentService.submitAnswer(
          candidateId,
          data.params.assessmentId,
          data.params.questionId,
          data.data.answerGiven
        );
      }
    );
  };

  /**
   * Heartbeat (status update) for assessment
   */
  heartbeat = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateJobAiAssessmentHeartbeatApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user?.candidateId;
        if (!candidateId) {
          throw new AppError(
            'Candidate ID is required',
            400,
            ErrorCode.CANDIDATE_ID_REQUIRED
          );
        }
        const requestData =
          createIApiRequest<ICandidateJobAiAssessmentHeartbeatApiRequest>(req);
        return await this.jobAiAssessmentService.heartbeat(
          candidateId,
          requestData.params.assessmentId,
          requestData.data.duration,
          requestData.data.status
        );
      }
    );
  };

  /**
   * Proctoring event API
   */
  proctor = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateJobAiAssessmentProctorApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user?.candidateId;
        if (!candidateId) {
          throw new AppError(
            'Candidate ID is required',
            400,
            ErrorCode.CANDIDATE_ID_REQUIRED
          );
        }
        const requestData =
          createIApiRequest<ICandidateJobAiAssessmentProctorApiRequest>(req);
        return await this.jobAiAssessmentService.proctor(
          candidateId,
          requestData.params.assessmentId,
          requestData.data.type
        );
      }
    );
  };

  /**
   * Submit the assessment (complete and start AI review)
   */
  submitAssessment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateJobAiAssessmentSubmitApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user?.candidateId;
        if (!candidateId) {
          throw new AppError(
            'Candidate ID is required',
            400,
            ErrorCode.CANDIDATE_ID_REQUIRED
          );
        }
        const requestData =
          createIApiRequest<ICandidateJobAiAssessmentSubmitApiRequest>(req);
        return await this.jobAiAssessmentService.submitAssessment(
          candidateId,
          requestData.params.assessmentId
        );
      }
    );
  };

  /**
   * Get presigned URL for video upload (using only assessmentId)
   */
  getPresignedUrlByAssessmentId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateJobAiAssessmentPresignedUrlApiResponse>(
      req,
      res,
      next,
      async () => {
        const { params, filters } =
          createIApiRequest<ICandidateJobAiAssessmentPresignedUrlApiRequest>(
            req
          );
        // Accept optional chunkIndex from query params to prevent race conditions
        const chunkIndex = filters.chunkIndex;
        return await this.jobAiAssessmentService.getPresignedUrlByAssessmentId(
          params.assessmentId,
          chunkIndex
        );
      }
    );
  };

  /**
   * Get presigned URL for video upload (using only videoUrl)
   * This method handles both routes:
   * - /:assessmentId/presigned-url/public
   * - /presigned-url/by-video-url
   */
  getPresignedUrlByVideoUrl = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateJobAiAssessmentPresignedUrlApiResponse>(
      req,
      res,
      next,
      async () => {
        const videoUrl = req.query.videoUrl as string;
        if (!videoUrl) {
          throw new AppError(
            'Video URL is required',
            400,
            ErrorCode.INVALID_REQUEST
          );
        }
        return await this.jobAiAssessmentService.getPresignedUrlByVideoUrl(
          videoUrl
        );
      }
    );
  };

  /**
   * Get presigned URL for video upload
   */
  getPresignedUrl = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateJobAiAssessmentPresignedUrlApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user?.candidateId;
        if (!candidateId) {
          throw new AppError(
            'Candidate ID is required',
            400,
            ErrorCode.CANDIDATE_ID_REQUIRED
          );
        }
        const { params } =
          createIApiRequest<ICandidateJobAiAssessmentPresignedUrlApiRequest>(
            req
          );
        return await this.jobAiAssessmentService.getPresignedUrl(
          candidateId,
          params.assessmentId
        );
      }
    );
  };

  /**
   * Get the latest job ai assessment for a candidate
   */
  getLatestJobAiAssessment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateLatestJobAiAssessmentGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user?.candidateId;
        if (!candidateId) {
          throw new AppError(
            'Candidate ID is required',
            400,
            ErrorCode.CANDIDATE_ID_REQUIRED
          );
        }
        return await this.jobAiAssessmentService.getLatestJobAiAssessment(
          candidateId
        );
      }
    );
  };

  getLatestJobAiAssessmentByCandidateId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateLatestJobAiAssessmentGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const { params } =
          createIApiRequest<ICandidateJobAiAssessmentGetLatestByCandidateIdApiRequest>(
            req
          );
        const candidateId = params.candidateId;
        if (!candidateId) {
          throw new AppError(
            'Candidate ID is required',
            400,
            ErrorCode.CANDIDATE_ID_REQUIRED
          );
        }
        return await this.jobAiAssessmentService.getLatestJobAiAssessment(
          candidateId
        );
      }
    );
  };

  /**
   * Get presigned URL for question response audio upload
   */
  getQuestionAudioPresignedUrl = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateJobAiAssessmentQuestionAudioPresignedUrlApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user?.candidateId;
        if (!candidateId) {
          throw new AppError(
            'Candidate ID is required',
            400,
            ErrorCode.CANDIDATE_ID_REQUIRED
          );
        }
        const { params } =
          createIApiRequest<ICandidateJobAiAssessmentQuestionAudioPresignedUrlApiRequest>(
            req
          );
        return await this.jobAiAssessmentService.getQuestionAudioPresignedUrl(
          candidateId,
          params.assessmentId,
          params.questionId
        );
      }
    );
  };

  /**
   * Get presigned URL for question response audio upload (using only assessmentId)
   */
  getQuestionAudioPresignedUrlByAssessmentId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateJobAiAssessmentQuestionAudioPresignedUrlApiResponse>(
      req,
      res,
      next,
      async () => {
        const { params } =
          createIApiRequest<ICandidateJobAiAssessmentQuestionAudioPresignedUrlApiRequest>(
            req
          );
        return await this.jobAiAssessmentService.getQuestionAudioPresignedUrlByAssessmentId(
          params.assessmentId,
          params.questionId
        );
      }
    );
  };

  listJobAiAssessmentInterviews = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateJobAiAssessmentInterviewsApiPaginatedResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user.candidateId as string;
        const request =
          createIApiRequest<ICandidateJobAiAssessmentInterviewsApiRequest>(req);
        return await this.jobAiAssessmentService.listJobAiAssessmentInterviews(
          candidateId,
          request.filters,
          request.pagination
        );
      }
    );
  };

  getJobAiAssessmentInvitationUrl = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateJobAiAssessmentInvitationUrlApiResponse>(
      req,
      res,
      next,
      async () => {
        const { params } =
          createIApiRequest<ICandidateJobAiAssessmentInvitationUrlApiRequest>(
            req
          );
        return await this.jobAiAssessmentService.getJobAiAssessmentInvitationUrl(
          params.invitationId
        );
      }
    );
  };

  /**
   * Re-submit job AI assessment for re-analysis
   */
  reSubmitJobAiAssessment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateJobAiAssessmentSubmitApiResponse>(
      req,
      res,
      next,
      async () => {
        const { params } =
          createIApiRequest<ICandidateJobAiAssessmentGetApiRequest>(req);
        return await this.jobAiAssessmentService.reSubmitAssessment(
          params.assessmentId
        );
      }
    );
  };

  /**
   * Get video chunks for a job AI assessment
   */
  getVideoChunks = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const candidateId = req.user?.candidateId;
      if (!candidateId) {
        throw new AppError(
          'Candidate ID is required',
          400,
          ErrorCode.CANDIDATE_ID_REQUIRED
        );
      }

      const apiRequest = createIApiRequest(req);
      const { assessmentId } = apiRequest.params as { assessmentId: string };
      const { questionId, sectionId, includeAnalysis, includePlaybackUrls } =
        req.query as {
          questionId?: string;
          sectionId?: string;
          includeAnalysis?: string;
          includePlaybackUrls?: string;
        };

      const chunks = await this.jobAiAssessmentService.getVideoChunks(
        candidateId,
        assessmentId,
        {
          questionId,
          sectionId,
          includeAnalysis: includeAnalysis === 'true',
          includePlaybackUrls: includePlaybackUrls === 'true',
        }
      );

      return { chunks };
    });
  };

  /**
   * Get playback URL for a specific chunk
   */
  getChunkPlaybackUrl = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const candidateId = req.user?.candidateId;
      if (!candidateId) {
        throw new AppError(
          'Candidate ID is required',
          400,
          ErrorCode.CANDIDATE_ID_REQUIRED
        );
      }

      const apiRequest = createIApiRequest(req);
      const { assessmentId, chunkId } = apiRequest.params as {
        assessmentId: string;
        chunkId: string;
      };

      return await this.jobAiAssessmentService.getChunkPlaybackUrl(
        candidateId,
        assessmentId,
        chunkId
      );
    });
  };

  /**
   * Record video chunk upload and trigger analysis
   */
  recordChunkUpload = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<{ success: boolean; chunkId: string }>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user?.candidateId;
        if (!candidateId) {
          throw new AppError(
            'Candidate ID is required',
            400,
            ErrorCode.CANDIDATE_ID_REQUIRED
          );
        }
        const apiRequest = createIApiRequest(req);
        const { assessmentId } = apiRequest.params as { assessmentId: string };
        const { chunkIndex, gcsUri, questionId, sectionId } =
          apiRequest.data as {
            chunkIndex: number;
            gcsUri: string;
            questionId?: string;
            sectionId?: string;
          };

        return await this.jobAiAssessmentService.recordChunkUpload(
          candidateId,
          assessmentId,
          chunkIndex,
          gcsUri,
          questionId,
          sectionId
        );
      }
    );
  };

  /**
   * Reprocess video analysis for an assessment
   * This endpoint verifies all chunks are properly analyzed before regenerating the final analysis
   * to ensure fair and accurate assessment for candidates
   */
  reprocessVideoAnalysis = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const candidateId = req.user?.candidateId;
      if (!candidateId) {
        throw new AppError(
          'Candidate ID is required',
          400,
          ErrorCode.CANDIDATE_ID_REQUIRED
        );
      }

      const apiRequest = createIApiRequest(req);
      const { assessmentId } = apiRequest.params as { assessmentId: string };

      const videoAnalysis =
        await this.jobAiAssessmentService.reprocessVideoAnalysis(
          candidateId,
          assessmentId
        );

      return {
        success: true,
        message:
          'Video analysis reprocessed successfully with verified chunk coverage',
        data: videoAnalysis,
      };
    });
  };

  /**
   * Sync GCS chunks with database records
   * Manually processes chunks in GCS that don't have DB records
   */
  syncGcsChunksWithDatabase = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const candidateId = req.user?.candidateId;
      if (!candidateId) {
        throw new AppError(
          'Candidate ID is required',
          400,
          ErrorCode.CANDIDATE_ID_REQUIRED
        );
      }

      const apiRequest = createIApiRequest(req);
      const { assessmentId } = apiRequest.params as { assessmentId: string };
      const { triggerAnalysis, dryRun } = (req.query || {}) as {
        triggerAnalysis?: string;
        dryRun?: string;
      };

      const result =
        await this.jobAiAssessmentService.syncGcsChunksWithDatabase(
          candidateId,
          assessmentId,
          {
            triggerAnalysis: triggerAnalysis === 'true',
            dryRun: dryRun === 'true',
          }
        );

      return result;
    });
  };
}
