import { Request, Response, NextFunction } from 'express';
import { CandidateProfileSettingsService } from '@/services/candidate/profile.settings.service';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import {
  ICandidateSettingsGetApiResponse,
  ICandidateSettingsUpdateApiRequest,
  ICandidateSettingsUpdateApiResponse,
  ICandidatePreferencesGetApiResponse,
  ICandidatePreferencesUpdateApiRequest,
  ICandidatePreferencesUpdateApiResponse,
} from '@/shared/models/api/candidate/profile.settings.api';
import { singleton } from '@/shared/decorators/singleton';
import { ErrorCode } from '@/utils/error.codes';
import { AppError } from '@/utils/app.error';

@singleton
export class CandidateProfileSettingsController extends BaseController {
  constructor(
    private readonly candidateProfileSettingsService: CandidateProfileSettingsService
  ) {
    super();
  }

  /**
   * Get candidate settings
   */
  getSettings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateSettingsGetApiResponse>(
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
        return await this.candidateProfileSettingsService.getSettings(
          candidateId
        );
      }
    );
  };

  /**
   * Update candidate settings
   */
  updateSettings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateSettingsUpdateApiResponse>(
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
          createIApiRequest<ICandidateSettingsUpdateApiRequest>(req);
        return await this.candidateProfileSettingsService.updateSettings(
          candidateId,
          data
        );
      }
    );
  };

  /**
   * Get candidate preferences
   */
  getPreferences = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidatePreferencesGetApiResponse>(
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
        return await this.candidateProfileSettingsService.getPreferences(
          candidateId
        );
      }
    );
  };

  /**
   * Update candidate preferences
   */
  updatePreferences = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidatePreferencesUpdateApiResponse>(
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
          createIApiRequest<ICandidatePreferencesUpdateApiRequest>(req);
        return await this.candidateProfileSettingsService.updatePreferences(
          candidateId,
          data
        );
      }
    );
  };
}
