import { Request, Response, NextFunction } from 'express';
import { SupportImpersonationService } from '@/services/support/impersonation.service';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import {
  IStartImpersonationApiRequest,
  IStartImpersonationApiResponse,
  IStopImpersonationApiRequest,
  IStopImpersonationApiResponse,
} from '@/shared/models/api/support/impersonation.api';
import { singleton } from '@/shared/decorators/singleton';

@singleton
export class SupportImpersonationController extends BaseController {
  constructor(
    private readonly supportImpersonationService: SupportImpersonationService
  ) {
    super();
  }

  /**
   * Start impersonation
   */
  startImpersonation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IStartImpersonationApiResponse>(
      req,
      res,
      next,
      async () => {
        const supportUserId = req.user.id;

        const impersonateRequest =
          createIApiRequest<IStartImpersonationApiRequest>(req);

        return await this.supportImpersonationService.startImpersonation(
          supportUserId,
          impersonateRequest.data
        );
      }
    );
  };

  /**
   * Stop impersonation
   */
  stopImpersonation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IStopImpersonationApiResponse>(
      req,
      res,
      next,
      async () => {
        const stopRequest =
          createIApiRequest<IStopImpersonationApiRequest>(req);

        return await this.supportImpersonationService.stopImpersonation(
          stopRequest.data,
          req.user.id
        );
      }
    );
  };
}
