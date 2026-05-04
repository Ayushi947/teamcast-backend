import { Request, Response, NextFunction } from 'express';
import { OnboardingAssessmentService } from '@/services/candidate/onboarding.assessment.service';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import {
  ICandidateOnboardingAssessmentListGetApiResponse,
  ICandidateOnboardingAssessmentGetApiRequest,
  ICandidateOnboardingAssessmentGetApiResponse,
  ICandidateOnboardingAssessmentListRequest,
  ICandidateOnboardingAssessmentStartApiResponse,
  ICandidateOnboardingAssessmentSubmitAnswerApiResponse,
  ICandidateOnboardingAssessmentSubmitAnswerApiRequest,
  ICandidateOnboardingAssessmentInitializeApiResponse,
  ICandidateOnboardingAssessmentTaskGetApiResponse,
  ICandidateOnboardingAssessmentTaskGetApiRequest,
  ICandidateOnboardingAssessmentStartApiRequest,
  ICandidateOnboardingAssessmentHeartbeatApiRequest,
  ICandidateOnboardingAssessmentProctorApiRequest,
  ICandidateOnboardingAssessmentSubmitApiRequest,
  ICandidateOnboardingAssessmentHeartbeatApiResponse,
  ICandidateOnboardingAssessmentProctorApiResponse,
  ICandidateOnboardingAssessmentSubmitApiResponse,
  ICandidateOnboardingAssessmentPresignedUrlApiRequest,
  ICandidateOnboardingAssessmentPresignedUrlApiResponse,
  ICandidateLatestOnboardingAssessmentGetApiResponse,
  ICandidateOnboardingAssessmentQuestionAudioPresignedUrlApiRequest,
  ICandidateOnboardingAssessmentQuestionAudioPresignedUrlApiResponse,
  ICandidateOnboardingAssessmentReSubmitApiRequest,
  ICandidateOnboardingAssessmentGetLatestByCandidateIdApiRequest,
} from '@/shared/models/api/candidate/onboarding.assessment.api';
import { singleton } from '@/shared/decorators/singleton';
import { ErrorCode } from '@/utils/error.codes';
import { AppError } from '@/utils/app.error';

@singleton
export class OnboardingAssessmentController extends BaseController {
  constructor(
    private readonly onboardingAssessmentService: OnboardingAssessmentService
  ) {
    super();
  }

  /**
   * Get all onboarding assessments for a candidate
   */
  getOnboardingAssessments = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateOnboardingAssessmentListGetApiResponse>(
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
          createIApiRequest<ICandidateOnboardingAssessmentListRequest>(req);
        return await this.onboardingAssessmentService.getOnboardingAssessments(
          candidateId,
          request.filters,
          request.pagination
        );
      }
    );
  };

  /**
   * Get a specific onboarding assessment
   */
  getOnboardingAssessment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateOnboardingAssessmentGetApiResponse>(
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
          createIApiRequest<ICandidateOnboardingAssessmentGetApiRequest>(req);
        return await this.onboardingAssessmentService.getOnboardingAssessment(
          candidateId,
          params.assessmentId
        );
      }
    );
  };

  /**
   * Initialize onboarding assessment initialize task
   */
  initialize = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateOnboardingAssessmentInitializeApiResponse>(
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
        return await this.onboardingAssessmentService.initialize(candidateId);
      }
    );
  };

  /**
   * Get onboarding assessment initialize task
   */
  getOnboardingAssessmentTask = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateOnboardingAssessmentTaskGetApiResponse>(
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
          createIApiRequest<ICandidateOnboardingAssessmentTaskGetApiRequest>(
            req
          );
        if (!params.assessmentId) {
          throw new AppError(
            'Assessment ID is required',
            400,
            ErrorCode.ONBOARDING_ASSESSMENT_ID_REQUIRED
          );
        }
        return await this.onboardingAssessmentService.getOnboardingAssessmentTask(
          candidateId,
          params.assessmentId
        );
      }
    );
  };

  /**
   * Start an onboarding assessment
   */
  startAssessment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateOnboardingAssessmentStartApiResponse>(
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
          createIApiRequest<ICandidateOnboardingAssessmentStartApiRequest>(req);
        return await this.onboardingAssessmentService.startAssessment(
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
    this.handleRequest<ICandidateOnboardingAssessmentSubmitAnswerApiResponse>(
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
          createIApiRequest<ICandidateOnboardingAssessmentSubmitAnswerApiRequest>(
            req
          );
        return await this.onboardingAssessmentService.submitAnswer(
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
    this.handleRequest<ICandidateOnboardingAssessmentHeartbeatApiResponse>(
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
          createIApiRequest<ICandidateOnboardingAssessmentHeartbeatApiRequest>(
            req
          );
        return await this.onboardingAssessmentService.heartbeat(
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
    this.handleRequest<ICandidateOnboardingAssessmentProctorApiResponse>(
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
          createIApiRequest<ICandidateOnboardingAssessmentProctorApiRequest>(
            req
          );
        return await this.onboardingAssessmentService.proctor(
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
    this.handleRequest<ICandidateOnboardingAssessmentSubmitApiResponse>(
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
          createIApiRequest<ICandidateOnboardingAssessmentSubmitApiRequest>(
            req
          );
        return await this.onboardingAssessmentService.submitAssessment(
          candidateId,
          requestData.params.assessmentId
        );
      }
    );
  };

  /**
   * Process failed assessments
   */
  processFailedAssessments = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      await this.onboardingAssessmentService.processFailedAssessment();
      return {
        success: true,
        message:
          'Failed onboarding assessments processing initiated successfully',
        data: null,
      };
    });
  };

  /**
   * Re-submit an assessment
   */
  reSubmitAssessment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const { params } =
        createIApiRequest<ICandidateOnboardingAssessmentReSubmitApiRequest>(
          req
        );
      return await this.onboardingAssessmentService.reSubmitAssessment(
        params.assessmentId
      );
    });
  };

  /**
   * Get presigned URL for video upload (using only assessmentId)
   */
  getPresignedUrlByAssessmentId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateOnboardingAssessmentPresignedUrlApiResponse>(
      req,
      res,
      next,
      async () => {
        const { params, filters } =
          createIApiRequest<ICandidateOnboardingAssessmentPresignedUrlApiRequest>(
            req
          );
        // Accept optional chunkIndex from query params to prevent race conditions
        const chunkIndex = filters.chunkIndex;
        return await this.onboardingAssessmentService.getPresignedUrlByAssessmentId(
          params.assessmentId,
          chunkIndex
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
    this.handleRequest<ICandidateOnboardingAssessmentPresignedUrlApiResponse>(
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
        const { params, filters } =
          createIApiRequest<ICandidateOnboardingAssessmentPresignedUrlApiRequest>(
            req
          );
        // Accept optional chunkIndex from query params to prevent race conditions
        const chunkIndex = filters.chunkIndex as number | undefined;
        return await this.onboardingAssessmentService.getPresignedUrl(
          candidateId,
          params.assessmentId,
          chunkIndex
        );
      }
    );
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
        const { chunkIndex, gcsUri, questionId } = apiRequest.data as {
          chunkIndex: number;
          gcsUri: string;
          questionId?: string;
        };

        return await this.onboardingAssessmentService.recordChunkUpload(
          candidateId,
          assessmentId,
          chunkIndex,
          gcsUri,
          questionId
        );
      }
    );
  };

  /**
   * Get the latest onboarding assessment for a candidate
   */
  getLatestOnboardingAssessment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateLatestOnboardingAssessmentGetApiResponse>(
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
        return await this.onboardingAssessmentService.getLatestOnboardingAssessment(
          candidateId
        );
      }
    );
  };

  /**
   * Get the latest onboarding assessment for a candidate
   */
  getLatestOnboardingAssessmentByCandidateId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateLatestOnboardingAssessmentGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const { params } =
          createIApiRequest<ICandidateOnboardingAssessmentGetLatestByCandidateIdApiRequest>(
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
        return await this.onboardingAssessmentService.getLatestOnboardingAssessment(
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
    this.handleRequest<ICandidateOnboardingAssessmentQuestionAudioPresignedUrlApiResponse>(
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
          createIApiRequest<ICandidateOnboardingAssessmentQuestionAudioPresignedUrlApiRequest>(
            req
          );
        return await this.onboardingAssessmentService.getQuestionAudioPresignedUrl(
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
    this.handleRequest<ICandidateOnboardingAssessmentQuestionAudioPresignedUrlApiResponse>(
      req,
      res,
      next,
      async () => {
        const { params } =
          createIApiRequest<ICandidateOnboardingAssessmentQuestionAudioPresignedUrlApiRequest>(
            req
          );
        return await this.onboardingAssessmentService.getQuestionAudioPresignedUrlByAssessmentId(
          params.assessmentId,
          params.questionId
        );
      }
    );
  };

  /**
   * Update terms acceptance status for a candidate
   */
  updateTermsAccepted = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<{ message: string }>(req, res, next, async () => {
      const candidateId = req.user?.candidateId;
      if (!candidateId) {
        throw new AppError(
          'Candidate ID is required',
          400,
          ErrorCode.CANDIDATE_ID_REQUIRED
        );
      }

      const { termsAccepted } = req.body;

      if (typeof termsAccepted !== 'boolean') {
        throw new AppError(
          'Terms accepted must be a boolean value',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      await this.onboardingAssessmentService.updateTermsAccepted(
        candidateId,
        termsAccepted
      );

      return { message: 'Terms acceptance status updated successfully' };
    });
  };

  /**
   * Get video chunks for an assessment
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
      const { questionId, includeAnalysis, includePlaybackUrls } =
        req.query as {
          questionId?: string;
          includeAnalysis?: string;
          includePlaybackUrls?: string;
        };

      const chunks = await this.onboardingAssessmentService.getVideoChunks(
        candidateId,
        assessmentId,
        {
          questionId,
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

      return await this.onboardingAssessmentService.getChunkPlaybackUrl(
        candidateId,
        assessmentId,
        chunkId
      );
    });
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
        await this.onboardingAssessmentService.reprocessVideoAnalysis(
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
   * Sync GCS chunks with database for an onboarding assessment
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
        await this.onboardingAssessmentService.syncGcsChunksWithDatabase(
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
