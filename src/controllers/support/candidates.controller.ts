import { Request, Response, NextFunction } from 'express';
import { SupportCandidatesService } from '@/services/support/candidates.service';
import { OnboardingAssessmentService } from '@/services/candidate/onboarding.assessment.service';
import { JobAiAssessmentService } from '@/services/candidate/job.ai.assessment.service';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import {
  ISupportCandidateListApiResponse,
  ISupportCandidateGetApiRequest,
  ISupportCandidateGetApiResponse,
  ISupportCandidateUpdateApiRequest,
  ISupportCandidateUpdateApiResponse,
  ISupportCandidateDeleteApiRequest,
  ISupportCandidateDeleteApiResponse,
  ISupportCandidateListApiRequest,
  ISupportCandidatePublishApiRequest,
  ISupportCandidatePublishApiResponse,
  ISupportRecommendedCandidatesListApiRequest,
  ISupportRecommendedCandidatesListApiResponse,
  ISupportCandidateResetOnboardingAssessmentApiResponse,
  ISupportCandidateResetOnboardingAssessmentApiRequest,
  ISupportCandidateResendJobAiInvitationApiRequest,
  ISupportCandidateResendJobAiInvitationApiResponse,
} from '@/shared/models/api/support/candidates.api';
import { IClientResumeViewApiResponse } from '@/shared/models/api/client/resume.view.api';
import { singleton } from '@/shared/decorators/singleton';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
@singleton
export class SupportCandidatesController extends BaseController {
  constructor(
    private readonly supportCandidatesService: SupportCandidatesService,
    private readonly onboardingAssessmentService: OnboardingAssessmentService,
    private readonly jobAiAssessmentService: JobAiAssessmentService
  ) {
    super();
  }
  /**
   * List all candidates with pagination and filtering
   */
  listSupportCandidates = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportCandidateListApiResponse>(
      req,
      res,
      next,
      async () => {
        const request = createIApiRequest<ISupportCandidateListApiRequest>(req);
        return await this.supportCandidatesService.listSupportCandidates(
          request.filters,
          request.pagination
        );
      }
    );
  };

  /**
   * Get support candidate details by ID
   */
  getSupportCandidate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportCandidateGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const getRequest =
          createIApiRequest<ISupportCandidateGetApiRequest>(req);
        const candidateId = getRequest.params.id;
        return await this.supportCandidatesService.getSupportCandidate(
          candidateId
        );
      }
    );
  };

  /**
   * Generate resume view URL for a support candidate
   */
  viewCandidateResume = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientResumeViewApiResponse>(
      req,
      res,
      next,
      async () => {
        const supportUserId = req.user.id as string;
        const candidateId = req.params.id as string;

        const result = await this.supportCandidatesService.viewCandidateResume(
          supportUserId,
          candidateId
        );

        return {
          result,
          message: 'Resume view URL generated successfully',
        };
      }
    );
  };

  /**
   * Update candidate
   * @param req Request object
   * @param res Response object
   */
  updateSupportCandidate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportCandidateUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const requestingUserId = req.user.id;
        const updateRequest =
          createIApiRequest<ISupportCandidateUpdateApiRequest>(req);
        const candidateId = updateRequest.params.id;

        return await this.supportCandidatesService.updateSupportCandidate(
          requestingUserId,
          candidateId,
          updateRequest.data
        );
      }
    );
  };

  /**
   * Delete a candidate
   */
  deleteSupportCandidate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportCandidateDeleteApiResponse>(
      req,
      res,
      next,
      async () => {
        const deleteRequest =
          createIApiRequest<ISupportCandidateDeleteApiRequest>(req);
        const candidateId = deleteRequest.params.id;

        return await this.supportCandidatesService.deleteSupportCandidate(
          candidateId
        );
      }
    );
  };

  /**
   * Get recommended candidates with onboarding assessment recommendations
   */
  getRecommendedCandidates = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportRecommendedCandidatesListApiResponse>(
      req,
      res,
      next,
      async () => {
        const request =
          createIApiRequest<ISupportRecommendedCandidatesListApiRequest>(req);
        return await this.supportCandidatesService.getRecommendedCandidates(
          request.filters,
          request.pagination
        );
      }
    );
  };

  /**
   * Publish candidate with note
   */
  publishCandidate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportCandidatePublishApiResponse>(
      req,
      res,
      next,
      async () => {
        const requestingUserId = req.user.id;
        const publishRequest =
          createIApiRequest<ISupportCandidatePublishApiRequest>(req);

        const result = await this.supportCandidatesService.publishCandidate(
          requestingUserId,
          publishRequest.data.candidateId,
          publishRequest.data.note
        );

        return result;
      }
    );
  };

  /**
   * Do not publish candidate with note
   */
  doNotPublishCandidate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportCandidatePublishApiResponse>(
      req,
      res,
      next,
      async () => {
        const requestingUserId = req.user.id;
        const doNotPublishRequest =
          createIApiRequest<ISupportCandidatePublishApiRequest>(req);

        const result =
          await this.supportCandidatesService.doNotPublishCandidate(
            requestingUserId,
            doNotPublishRequest.data.candidateId,
            doNotPublishRequest.data.note
          );

        return result;
      }
    );
  };

  /**
   * Unpublish candidate with reason
   */
  unpublishCandidate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportCandidatePublishApiResponse>(
      req,
      res,
      next,
      async () => {
        const requestingUserId = req.user.id;
        const unpublishRequest =
          createIApiRequest<ISupportCandidatePublishApiRequest>(req);

        const result = await this.supportCandidatesService.unpublishCandidate(
          requestingUserId,
          unpublishRequest.data.candidateId,
          unpublishRequest.data.note
        );

        return result;
      }
    );
  };

  /**
   * Reset onboarding assessment for a candidate
   */
  resetOnboardingAssessment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportCandidateResetOnboardingAssessmentApiResponse>(
      req,
      res,
      next,
      async () => {
        const adminUserId = req.user.id;
        const resetRequest =
          createIApiRequest<ISupportCandidateResetOnboardingAssessmentApiRequest>(
            req
          );
        const candidateId = resetRequest.params.supportCandidateId;
        const reason = resetRequest.data.reason;

        return await this.supportCandidatesService.resetOnboardingAssessment(
          adminUserId,
          candidateId,
          reason
        );
      }
    );
  };

  /**
   * Resubmit onboarding assessment for re-analysis
   */
  resubmitOnboardingAssessment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportCandidateResetOnboardingAssessmentApiResponse>(
      req,
      res,
      next,
      async () => {
        const adminUserId = req.user.id;
        const resubmitRequest =
          createIApiRequest<ISupportCandidateResetOnboardingAssessmentApiRequest>(
            req
          );
        const candidateId = resubmitRequest.params.supportCandidateId;

        return await this.supportCandidatesService.resubmitOnboardingAssessment(
          adminUserId,
          candidateId
        );
      }
    );
  };

  /**
   * Reset job AI assessment
   */
  resetJobAiAssessment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportCandidateResetOnboardingAssessmentApiResponse>(
      req,
      res,
      next,
      async () => {
        const adminUserId = req.user.id;
        const assessmentId = req.params.assessmentId;
        const reason = req.body?.reason;

        if (!assessmentId) {
          throw new AppError(
            'Assessment ID is required',
            400,
            ErrorCode.VALIDATION_ERROR
          );
        }

        return await this.supportCandidatesService.resetJobAiAssessment(
          adminUserId,
          assessmentId,
          reason
        );
      }
    );
  };

  /**
   * Resubmit job assessment for re-analysis
   */
  resubmitJobAssessment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportCandidateResetOnboardingAssessmentApiResponse>(
      req,
      res,
      next,
      async () => {
        const adminUserId = req.user.id;
        const assessmentId = req.params.assessmentId;

        if (!assessmentId) {
          throw new AppError(
            'Assessment ID is required',
            400,
            ErrorCode.VALIDATION_ERROR
          );
        }

        return await this.supportCandidatesService.resubmitJobAssessment(
          adminUserId,
          assessmentId
        );
      }
    );
  };

  /**
   * Resend expired job AI assessment invitation
   */
  resendJobAiAssessmentInvitation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportCandidateResendJobAiInvitationApiResponse>(
      req,
      res,
      next,
      async () => {
        const supportUserId = req.user.id;
        const resendRequest =
          createIApiRequest<ISupportCandidateResendJobAiInvitationApiRequest>(
            req
          );
        const invitationId = resendRequest.params.invitationId;

        if (!invitationId) {
          throw new AppError(
            'Invitation ID is required',
            400,
            ErrorCode.VALIDATION_ERROR
          );
        }

        const result =
          await this.supportCandidatesService.resendJobAiAssessmentInvitation(
            supportUserId,
            invitationId
          );
        return result;
      }
    );
  };

  /**
   * Get video chunks for an onboarding assessment (Support/Admin)
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
   * Get playback URL for a specific chunk (Support/Admin)
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
   * Get video chunks for a job AI assessment (Support/Admin)
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
   * Get playback URL for a specific job AI assessment chunk (Support/Admin)
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

  /**
   * Fix video chunks for affected assessments
   * Marks old chunks (created before startedAt) as irrelevant
   */
  fixVideoChunksForAssessment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const adminUserId = req.user.id;
      const assessmentId = req.query.assessmentId as string | undefined;
      const assessmentType =
        (req.query.assessmentType as 'job' | 'onboarding' | 'both') || 'both';
      const dryRun = req.query.dryRun === 'true';

      return await this.supportCandidatesService.fixVideoChunksForAssessment(
        adminUserId,
        {
          assessmentId,
          assessmentType,
          dryRun,
        }
      );
    });
  };

  /**
   * Backfill video chunk durations for existing chunks
   * Extracts duration from video files and stores it in the database
   */
  backfillVideoChunkDurations = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const adminUserId = req.user.id;
      const assessmentId = req.query.assessmentId as string | undefined;
      const candidateId = req.query.candidateId as string | undefined;
      const assessmentType =
        (req.query.assessmentType as 'job' | 'onboarding' | 'both') || 'both';
      const batchSize = req.query.batchSize
        ? parseInt(req.query.batchSize as string, 10)
        : undefined;
      const dryRun = req.query.dryRun === 'true';

      return await this.supportCandidatesService.backfillVideoChunkDurations(
        adminUserId,
        {
          assessmentId,
          candidateId,
          assessmentType,
          batchSize,
          dryRun,
        }
      );
    });
  };
}
