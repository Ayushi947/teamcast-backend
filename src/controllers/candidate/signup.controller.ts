import { Request, Response, NextFunction } from 'express';
import { singleton } from '@/shared/decorators/singleton';
import { BaseController } from '../common/base.controller';
import {
  ICandidateSignupApiRequest,
  ICandidateSignupApiResponse,
} from '@/shared/models/api/candidate/signup.api';
import { CandidateSignupService } from '@/services/candidate/signup.service';
import { createIApiRequest } from '@/utils/api.request';
import { logger } from '@/shared/utils/logger';

@singleton
export class CandidateSignupController extends BaseController {
  constructor(private readonly candidateSignupService: CandidateSignupService) {
    super();
  }

  signup = (req: Request, res: Response, next: NextFunction): void => {
    const inviteId = req.query.inviteId as string;

    if (inviteId) {
      logger.info(
        '🎯 [CANDIDATE SIGNUP API] Invite-based signup request received',
        {
          inviteId,
          email: req.body.data?.email,
          context: 'CandidateSignupController.signup',
        }
      );
    } else {
      logger.info('🎯 [CANDIDATE SIGNUP API] Regular signup request received', {
        email: req.body.data?.email,
        context: 'CandidateSignupController.signup',
      });
    }

    this.handleRequest<ICandidateSignupApiResponse>(
      req,
      res,
      next,
      async () => {
        const request = createIApiRequest<ICandidateSignupApiRequest>(req);
        const inviteId = req.query.inviteId as string;

        const result = await this.candidateSignupService.signup(
          request.data,
          inviteId
        );

        if (inviteId) {
          logger.info(
            '[CANDIDATE SIGNUP API] Invite-based signup completed successfully',
            {
              context: 'CandidateSignupController.signup',
            }
          );
        } else {
          logger.info(
            '✅ [CANDIDATE SIGNUP API] Regular signup completed successfully',
            {
              context: 'CandidateSignupController.signup',
            }
          );
        }

        return result;
      }
    );
  };
}
