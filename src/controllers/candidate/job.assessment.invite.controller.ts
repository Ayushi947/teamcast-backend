import { Request, Response, NextFunction } from 'express';
import { CandidateJobAssessmentInviteService } from '@/services/candidate/job.assessment.invite.service';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import {
  ICandidateJobAssessmentInviteListApiRequest,
  ICandidateJobAssessmentInviteListApiResponse,
  ICandidateJobAssessmentInviteAcceptApiRequest,
  ICandidateJobAssessmentInviteAcceptApiResponse,
  ICandidateJobAssessmentInviteDeclineApiRequest,
  ICandidateJobAssessmentInviteDeclineApiResponse,
} from '@/shared/models/api/candidate/job.assessment.invite.api';
import { singleton } from '@/shared/decorators/singleton';
import { ErrorCode } from '@/utils/error.codes';
import { AppError } from '@/utils/app.error';

@singleton
export class CandidateJobAssessmentInviteController extends BaseController {
  constructor(
    private readonly candidateJobAssessmentInviteService: CandidateJobAssessmentInviteService
  ) {
    super();
  }

  /**
   * Get all Job assessment invites for the candidate with pagination
   */
  getInvites = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateJobAssessmentInviteListApiResponse>(
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

        const request =
          createIApiRequest<ICandidateJobAssessmentInviteListApiRequest>(req);

        const result =
          await this.candidateJobAssessmentInviteService.getInvites(
            candidateId,
            request.filters,
            request.pagination
          );

        return result;
      }
    );
  };

  /**
   * Accept a Job assessment invite
   */
  acceptInvite = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateJobAssessmentInviteAcceptApiResponse>(
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

        const { data, params } =
          createIApiRequest<ICandidateJobAssessmentInviteAcceptApiRequest>(req);

        await this.candidateJobAssessmentInviteService.acceptInvite(
          candidateId,
          params.inviteId,
          data
        );

        return 'Job assessment invite accepted successfully';
      }
    );
  };

  /**
   * Decline a Job assessment invite
   */
  declineInvite = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateJobAssessmentInviteDeclineApiResponse>(
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

        const { data, params } =
          createIApiRequest<ICandidateJobAssessmentInviteDeclineApiRequest>(
            req
          );

        await this.candidateJobAssessmentInviteService.declineInvite(
          candidateId,
          params.inviteId,
          data
        );

        return 'Job assessment invite declined successfully';
      }
    );
  };
}
