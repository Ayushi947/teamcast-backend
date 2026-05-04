import { singleton } from '@/shared/decorators/singleton';
import { SupportJobPostingService } from '@/services/support/job.posting.service';
import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../common/base.controller';
import { ISupportJobPostingListResponse } from '@/shared/models/domain/support/job.posting.domain';

@singleton
export class SupportJobPostingController extends BaseController {
  constructor(
    private readonly supportJobPostingService: SupportJobPostingService
  ) {
    super();
  }

  getAllJobPostingsBySupportUserId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportJobPostingListResponse>(
      req,
      res,
      next,
      async () => {
        const supportUserId = req.user.supportUserId as string;

        if (!supportUserId) {
          throw new Error('Support user ID is required');
        }

        return await this.supportJobPostingService.getAllJobPostingsBySupportUserId(
          supportUserId
        );
      }
    );
  };

  getJobPostingsByAccountManagerId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportJobPostingListResponse>(
      req,
      res,
      next,
      async () => {
        const accountManagerId = req.user.supportUserId as string;

        if (!accountManagerId) {
          throw new Error('Account manager ID is required');
        }

        return await this.supportJobPostingService.getJobPostingsByAccountManagerId(
          accountManagerId
        );
      }
    );
  };
}
