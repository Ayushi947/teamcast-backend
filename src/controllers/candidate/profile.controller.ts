import { Request, Response, NextFunction } from 'express';
import { CandidateProfileService } from '@/services/candidate/profile.service';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import {
  ICandidateProfileGetApiResponse,
  ICandidateProfileBasicUpdateApiRequest,
  ICandidateProfileBasicUpdateApiResponse,
  ICandidateProfilePasswordChangeApiRequest,
  ICandidateProfilePasswordChangeApiResponse,
  ICandidateProfilePhotoUrlApiResponse,
  ICandidateProfileAndResumeApiResponse,
  ICandidateProfileByEmailIDApiRequest,
} from '@/shared/models/api/candidate/profile.api';
import { singleton } from '@/shared/decorators/singleton';
import { ErrorCode } from '@/utils/error.codes';
import { AppError } from '@/utils/app.error';
import { logger } from '@/shared/utils/logger';
import { CandidateResumeService } from '@/services/candidate/resume.service';
import { OnboardingAssessmentService } from '@/services/candidate/onboarding.assessment.service';
import { CandidateResumeAssessmentService } from '@/services/candidate/resume.assessment.service';

@singleton
export class CandidateProfileController extends BaseController {
  private candidateResumeService: CandidateResumeService | undefined;
  private onboardingAssessmentService: OnboardingAssessmentService | undefined;
  private candidateResumeAssessmentService:
    | CandidateResumeAssessmentService
    | undefined;

  setResumeService(candidateResumeService: CandidateResumeService) {
    this.candidateResumeService = candidateResumeService;
  }

  setOnboardingAssessmentService(
    onboardingAssessmentService: OnboardingAssessmentService
  ) {
    this.onboardingAssessmentService = onboardingAssessmentService;
  }

  setResumeAssessmentService(
    candidateResumeAssessmentService: CandidateResumeAssessmentService
  ) {
    this.candidateResumeAssessmentService = candidateResumeAssessmentService;
  }

  getProfilePhotoUploadUrl(
    _arg0: string,
    _arg1: ((req: Request, _res: Response, next: NextFunction) => void)[]
  ) {
    throw new Error('Method not implemented.');
  }
  constructor(
    private readonly candidateProfileService: CandidateProfileService
  ) {
    super();
  }

  /**
   * Get candidate profile
   */
  getProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateProfileGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user.candidateId;
        if (!candidateId) {
          throw new AppError(
            'Candidate ID is required',
            400,
            ErrorCode.CANDIDATE_ID_REQUIRED
          );
        }
        return await this.candidateProfileService.getProfile(candidateId);
      }
    );
  };

  /**
   * Get candidate profile by email ID
   */
  getProfileByEmailID = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateProfileGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const { params } =
          createIApiRequest<ICandidateProfileByEmailIDApiRequest>(req);
        return await this.candidateProfileService.getProfileByEmailID(
          params.email
        );
      }
    );
  };
  /**
   * Update basic profile
   */
  updateBasicProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateProfileBasicUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user.candidateId;
        if (!candidateId) {
          throw new AppError(
            'Candidate ID is required',
            400,
            ErrorCode.CANDIDATE_ID_REQUIRED
          );
        }
        const { data } =
          createIApiRequest<ICandidateProfileBasicUpdateApiRequest>(req);
        return await this.candidateProfileService.updateBasicProfile(
          candidateId,
          data
        );
      }
    );
  };

  /**
   * Change password
   */
  changePassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateProfilePasswordChangeApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user.candidateId;
        if (!candidateId) {
          throw new AppError(
            'Candidate ID is required',
            400,
            ErrorCode.CANDIDATE_ID_REQUIRED
          );
        }
        const { data } =
          createIApiRequest<ICandidateProfilePasswordChangeApiRequest>(req);
        await this.candidateProfileService.changePassword(candidateId, data);
        return { message: 'Password changed successfully' };
      }
    );
  };

  /**
   * Upload profile photo directly
   */
  uploadProfilePhoto = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateProfilePhotoUrlApiResponse>(
      req,
      res,
      next,
      async () => {
        if (!req.file) {
          throw new AppError(
            'No file uploaded',
            400,
            ErrorCode.INVALID_REQUEST
          );
        }

        const candidateId = req.user.candidateId;
        if (!candidateId) {
          throw new AppError(
            'Candidate ID is required',
            400,
            ErrorCode.CANDIDATE_ID_REQUIRED
          );
        }
        return await this.candidateProfileService.updateProfilePhoto(
          candidateId,
          req.file.buffer
        );
      }
    );
  };

  /**
   * Get profile photo presigned URL
   */
  getProfilePhotoPresignedUrl = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateProfilePhotoUrlApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user.candidateId;
        if (!candidateId) {
          throw new AppError(
            'Candidate ID is required',
            400,
            ErrorCode.CANDIDATE_ID_REQUIRED
          );
        }
        return await this.candidateProfileService.getProfilePhotoPresignedUrl(
          candidateId
        );
      }
    );
  };

  /**
   * Get candidate profile by ID
   */
  getProfileById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateProfileGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.params.candidateId as string;
        return await this.candidateProfileService.getProfile(candidateId);
      }
    );
  };

  /**
   * Soft delete profile photo
   */
  deleteProfilePhoto = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<void>(req, res, next, async () => {
      const candidateId = req.user.candidateId;
      if (!candidateId) {
        throw new AppError(
          'Candidate ID is required',
          400,
          ErrorCode.CANDIDATE_ID_REQUIRED
        );
      }
      await this.candidateProfileService.deleteProfilePhoto(candidateId);
      return { message: 'Profile photo deleted successfully' };
    });
  };

  /**
   * Public: Get candidate profile and resume by ID
   */
  getPublicProfileAndResume = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateProfileAndResumeApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.params.candidateId as string;

        if (!candidateId) {
          throw new AppError(
            'Candidate ID is required',
            400,
            ErrorCode.CANDIDATE_ID_REQUIRED
          );
        }

        logger.info({
          message:
            'Getting profile and resume with onboarding assessment video and resume assessment',
          candidateId,
        });

        // Set the resume assessment service if available
        if (this.candidateResumeAssessmentService) {
          this.candidateProfileService.setResumeAssessmentService(
            this.candidateResumeAssessmentService
          );
        }

        return await this.candidateProfileService.getPublicProfileAndResume(
          candidateId
        );
      }
    );
  };

  /**
   * Handle errors in a consistent way
   */
  private handleError(error: any, res: Response) {
    logger.error({
      message: 'Error in CandidateProfileController',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
        },
      });
    }
  }
}
