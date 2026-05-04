import { Request, Response, NextFunction } from 'express';

import { BaseController } from '../common/base.controller';

import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { IClientResumeViewApiResponse } from '@/shared/models/api/client/resume.view.api';
import { ClientResumeViewService } from '@/services/client/resume.view.service';

export class ClientResumeViewController extends BaseController {
  constructor(private readonly resumeViewService: ClientResumeViewService) {
    super();
  }

  /**
   * View a candidate's resume
   */
  viewResume = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientResumeViewApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const clientUserId = req.user.id as string;
        const candidateId = req.params.candidateId as string;

        if (!clientId) {
          throw new AppError(
            'Client ID is required',
            400,
            ErrorCode.CLIENT_USER_ID_REQUIRED
          );
        }

        if (!clientUserId) {
          throw new AppError(
            'Client user ID is required',
            400,
            ErrorCode.CLIENT_USER_ID_REQUIRED
          );
        }

        if (!candidateId) {
          throw new AppError(
            'Candidate ID is required',
            400,
            ErrorCode.CANDIDATE_ID_REQUIRED
          );
        }

        const result = await this.resumeViewService.viewResume(
          clientId,
          clientUserId,
          { candidateId }
        );

        return {
          result,
          message: 'Resume view URL generated successfully',
        };
      }
    );
  };
}
