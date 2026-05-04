import { Request, Response, NextFunction } from 'express';
import { OnboardingAssessmentService } from '@/services/candidate/onboarding.assessment.service';
import { JobAiAssessmentService } from '@/services/candidate/job.ai.assessment.service';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import { singleton } from '@/shared/decorators/singleton';
import { ErrorCode } from '@/utils/error.codes';
import { AppError } from '@/utils/app.error';

@singleton
export class ClientCandidatesController extends BaseController {
  constructor(
    private readonly onboardingAssessmentService: OnboardingAssessmentService,
    private readonly jobAiAssessmentService: JobAiAssessmentService
  ) {
    super();
  }

  /**
   * Get video chunks for an onboarding assessment (Client/HR)
   */
  getOnboardingVideoChunks = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const apiRequest = createIApiRequest(req);
      const { assessmentId } = apiRequest.params as { assessmentId: string };
      const { questionId, includeAnalysis, includePlaybackUrls } =
        req.query as {
          questionId?: string;
          includeAnalysis?: string;
          includePlaybackUrls?: string;
        };

      const chunks =
        await this.onboardingAssessmentService.getVideoChunksByAssessmentId(
          assessmentId,
          {
            questionId,
            includeAnalysis: includeAnalysis === 'true',
            includePlaybackUrls: includePlaybackUrls !== 'false', // Default true
          }
        );

      return { chunks };
    });
  };

  /**
   * Get playback URL for a specific chunk (Client/HR)
   */
  getOnboardingChunkPlaybackUrl = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const apiRequest = createIApiRequest(req);
      const { assessmentId, chunkId } = apiRequest.params as {
        assessmentId: string;
        chunkId: string;
      };

      if (!assessmentId) {
        throw new AppError(
          'Assessment ID is required',
          400,
          ErrorCode.ONBOARDING_ASSESSMENT_ID_REQUIRED
        );
      }

      if (!chunkId) {
        throw new AppError(
          'Chunk ID is required',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      const result =
        await this.onboardingAssessmentService.getChunkPlaybackUrlByAssessmentId(
          assessmentId,
          chunkId
        );

      return result;
    });
  };

  /**
   * Get video chunks for a job AI assessment (Client/HR)
   */
  getJobAiAssessmentVideoChunks = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const apiRequest = createIApiRequest(req);
      const { assessmentId } = apiRequest.params as { assessmentId: string };
      const { questionId, sectionId, includeAnalysis, includePlaybackUrls } =
        req.query as {
          questionId?: string;
          sectionId?: string;
          includeAnalysis?: string;
          includePlaybackUrls?: string;
        };

      const chunks =
        await this.jobAiAssessmentService.getVideoChunksByAssessmentId(
          assessmentId,
          {
            questionId,
            sectionId,
            includeAnalysis: includeAnalysis === 'true',
            includePlaybackUrls: includePlaybackUrls !== 'false', // Default true
          }
        );

      return { chunks };
    });
  };

  /**
   * Get playback URL for a specific job AI assessment chunk (Client/HR)
   */
  getJobAiAssessmentChunkPlaybackUrl = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const apiRequest = createIApiRequest(req);
      const { assessmentId, chunkId } = apiRequest.params as {
        assessmentId: string;
        chunkId: string;
      };

      if (!assessmentId) {
        throw new AppError(
          'Assessment ID is required',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      if (!chunkId) {
        throw new AppError(
          'Chunk ID is required',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      const result =
        await this.jobAiAssessmentService.getChunkPlaybackUrlByAssessmentId(
          assessmentId,
          chunkId
        );

      return result;
    });
  };
}
