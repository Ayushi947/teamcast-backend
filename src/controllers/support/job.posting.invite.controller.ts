import { singleton } from '@/shared/decorators/singleton';
import { SupportJobPostingInviteService } from '@/services/support/job.posting.invite.service';
import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../common/base.controller';
import { toSupportJobPostingInviteApiResponse } from '@/shared/models/domain/support/job.posting.invite.domain';
import {
  ISupportJobInviteApiResponse,
  ISupportJobInviteSimpleResponse,
  ISupportJobPostingInviteResendApiRequest,
  ISupportJobPostingInviteWithdrawApiRequest,
  ISupportJobPostingInviteDetail,
} from '@/shared/models/api/support/job.posting.invite.api';
import {
  IPaginationRequest,
  IPaginatedResponse,
} from '@/shared/models/api/common/common.api';
import { ISupportJobPostingInviteFilterQuery } from '@/shared/models/domain/support/job.posting.invite.domain';
import { createIApiRequest } from '@/utils/api.request';

@singleton
export class SupportJobPostingInviteController extends BaseController {
  constructor(
    private readonly supportJobPostingInviteService: SupportJobPostingInviteService
  ) {
    super();
  }

  getJobPostingInvitesBySupportUserId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPaginatedResponse<ISupportJobPostingInviteDetail>>(
      req,
      res,
      next,
      async () => {
        const supportUserId = req.user.supportUserId as string;

        if (!supportUserId) {
          throw new Error('Support user ID is required');
        }

        const filter = req.query as ISupportJobPostingInviteFilterQuery;
        const paginationRequest: IPaginationRequest = {
          page: parseInt(req.query.page as string) || 1,
          limit: parseInt(req.query.limit as string) || 10,
          sortBy: req.query.sortBy as string,
          sortOrder: req.query.sortOrder as 'asc' | 'desc',
          search: req.query.search as string,
          searchColumns: req.query.searchColumns as string[],
        };

        const result =
          await this.supportJobPostingInviteService.getJobPostingInvitesBySupportUserId(
            supportUserId,
            filter,
            paginationRequest
          );

        // Transform domain to API response using IPaginatedResponse structure
        const apiResponse: IPaginatedResponse<ISupportJobPostingInviteDetail> =
          {
            items: result.items.map((invite) =>
              toSupportJobPostingInviteApiResponse(invite)
            ),
            pagination: {
              total: result.pagination.total,
              page: result.pagination.page,
              limit: result.pagination.limit,
              totalPages: result.pagination.totalPages,
            },
          };

        return apiResponse;
      }
    );
  };

  /**
   * Create job posting invites
   */
  createSupportJobPostingInvite = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportJobInviteApiResponse>(
      req,
      res,
      next,
      async () => {
        const supportUserId = req.user.supportUserId;

        if (!supportUserId) {
          throw new Error('Support user ID is required');
        }

        const result =
          await this.supportJobPostingInviteService.createSupportJobPostingInvite(
            req.body,
            supportUserId
          );

        return result;
      }
    );
  };

  resendInvitation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportJobInviteSimpleResponse>(
      req,
      res,
      next,
      async () => {
        const supportUserId = req.user.supportUserId as string;

        const { params } =
          createIApiRequest<ISupportJobPostingInviteResendApiRequest>(req);

        if (!supportUserId) {
          throw new Error('Support user ID is required');
        }

        const result =
          await this.supportJobPostingInviteService.resendInvitation(
            params.invitationId,
            supportUserId
          );

        return result;
      }
    );
  };

  withdrawInvitation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportJobInviteSimpleResponse>(
      req,
      res,
      next,
      async () => {
        const supportUserId = req.user.supportUserId as string;

        if (!supportUserId) {
          throw new Error('Support user ID is required');
        }

        const { params } =
          createIApiRequest<ISupportJobPostingInviteWithdrawApiRequest>(req);

        const result =
          await this.supportJobPostingInviteService.withdrawInvitation(
            params.invitationId,
            supportUserId
          );

        return result;
      }
    );
  };

  /**
   * Get imported candidates for a specific job posting
   */
  getImportedCandidates = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPaginatedResponse<ISupportJobPostingInviteDetail>>(
      req,
      res,
      next,
      async () => {
        const { params } = req;
        const jobId = params.jobId as string;

        if (!jobId) {
          throw new Error('Job ID is required');
        }

        const filter = req.query as ISupportJobPostingInviteFilterQuery;
        const paginationRequest: IPaginationRequest = {
          page: parseInt(req.query.page as string) || 1,
          limit: parseInt(req.query.limit as string) || 10,
          sortBy: req.query.sortBy as string,
          sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
          search: req.query.search as string,
          searchColumns: req.query.searchColumns as string[],
        };

        const result =
          await this.supportJobPostingInviteService.getImportedCandidates(
            jobId,
            filter,
            paginationRequest
          );

        // Transform domain to API response using IPaginatedResponse structure
        const apiResponse: IPaginatedResponse<ISupportJobPostingInviteDetail> =
          {
            items: result.items.map((invite) =>
              toSupportJobPostingInviteApiResponse(invite)
            ),
            pagination: {
              total: result.pagination.total,
              page: result.pagination.page,
              limit: result.pagination.limit,
              totalPages: result.pagination.totalPages,
            },
          };

        return apiResponse;
      }
    );
  };
}
