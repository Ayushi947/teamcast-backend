import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../common/base.controller';
import { singleton } from '@/shared/decorators/singleton';
import { JobInviteService } from '@/services/client/job.invite.service';
import {
  IJobInviteApiRequest,
  IJobInviteApiResponse,
  IJobInviteTokenValidationResponse,
  IJobInviteListApiResponse,
  IJobInviteByJobApiResponse,
  IJobImportedInviteListApiResponse,
} from '@/shared/models/api/client/job.invite.api';
import { IJobInviteFilters } from '@/shared/models/domain/client/job.invite.domain';
import { IPaginationRequest } from '@/shared/models/api/common/common.api';
import { JobInviteStatusEnum } from '@/shared/models/common/enums';
import { logger } from '@/shared/utils/logger';

@singleton
export class ClientJobInviteController extends BaseController {
  constructor(private readonly jobInviteService: JobInviteService) {
    super();
  }

  validateInviteToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    logger.info('[JOB INVITE API] Token validation request received', {
      tokenPrefix: req.params.token?.substring(0, 8),
      context: 'ClientJobInviteController.validateInviteToken',
    });

    this.handleRequest<IJobInviteTokenValidationResponse>(
      req,
      res,
      next,
      async () => {
        const token = req.params.token;
        if (!token) {
          logger.error(
            '[JOB INVITE API] Token validation failed: No token provided',
            {
              context: 'ClientJobInviteController.validateInviteToken',
            }
          );
          throw new Error('Token is required');
        }

        const validationResult =
          await this.jobInviteService.validateInviteToken(token);
        logger.info('[JOB INVITE API] Token validation completed', {
          isValid: validationResult.isValid,
          context: 'ClientJobInviteController.validateInviteToken',
        });
        return validationResult;
      }
    );
  };

  createJobInvite = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    logger.info('[JOB INVITE API] Create job invite request received', {
      clientUserId: req.user.clientUserId,
      jobId: req.body.jobId,
      candidatesCount: req.body.candidates?.length || 0,
      context: 'ClientJobInviteController.createJobInvite',
    });

    this.handleRequest<IJobInviteApiResponse>(req, res, next, async () => {
      const data = req.body as IJobInviteApiRequest;
      const clientId = req.user.clientId;
      const clientUserId = req.user.clientUserId;
      if (!clientId) {
        logger.error(' [JOB INVITE API] Create invite failed: No client ID', {
          context: 'ClientJobInviteController.createJobInvite',
        });
        throw new Error('Client ID is required');
      }
      if (!clientUserId) {
        logger.error(
          '[JOB INVITE API] Create invite failed: No client user ID',
          {
            context: 'ClientJobInviteController.createJobInvite',
          }
        );
        throw new Error('Client User ID is required');
      }

      return await this.jobInviteService.createJobInvite(data, clientUserId);
    });
  };

  getAllJobInvites = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    logger.info('[JOB INVITE API] Get all job invites request received', {
      clientUserId: req.user.clientUserId,
      query: req.query,
      context: 'ClientJobInviteController.getAllJobInvites',
    });

    this.handleRequest<IJobInviteListApiResponse>(req, res, next, async () => {
      const clientId = req.user.clientId;
      if (!clientId) {
        logger.error('[JOB INVITE API] Get invites failed: No client ID', {
          context: 'ClientJobInviteController.getAllJobInvites',
        });
        throw new Error('Client ID is required');
      }

      // Extract filters from query parameters
      const filters: IJobInviteFilters = {
        status: req.query.status
          ? Array.isArray(req.query.status)
            ? (req.query.status as JobInviteStatusEnum[])
            : [req.query.status as JobInviteStatusEnum]
          : undefined,
        jobId: req.query.jobId as string,
        search: req.query.search as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };

      // Extract pagination parameters
      const paginationRequest: IPaginationRequest = {
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
        search: req.query.search as string,
      };

      const result = await this.jobInviteService.getAllJobInvites(
        clientId,
        filters,
        paginationRequest
      );

      logger.info(
        '[JOB INVITE API] Get all job invites completed successfully',
        {
          total: result.total,
          page: result.page,
          context: 'ClientJobInviteController.getAllJobInvites',
        }
      );

      return result;
    });
  };

  getJobInvitesByJobPostingId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const jobPostingId = req.params.jobPostingId;

    logger.info(
      '[JOB INVITE API] Get job invites by job posting request received',
      {
        clientUserId: req.user.clientUserId,
        jobPostingId,
        query: req.query,
        context: 'ClientJobInviteController.getJobInvitesByJobPostingId',
      }
    );

    this.handleRequest<IJobInviteByJobApiResponse>(req, res, next, async () => {
      const clientId = req.user.clientId;
      if (!clientId) {
        logger.error(
          '[JOB INVITE API] Get invites by job failed: No client ID',
          {
            context: 'ClientJobInviteController.getJobInvitesByJobPostingId',
          }
        );
        throw new Error('Client ID is required');
      }

      if (!jobPostingId) {
        logger.error(
          '[JOB INVITE API] Get invites by job failed: No job posting ID',
          {
            context: 'ClientJobInviteController.getJobInvitesByJobPostingId',
          }
        );
        throw new Error('Job posting ID is required');
      }

      // Extract filters from query parameters
      const filters: IJobInviteFilters = {
        status: req.query.status
          ? Array.isArray(req.query.status)
            ? (req.query.status as JobInviteStatusEnum[])
            : [req.query.status as JobInviteStatusEnum]
          : undefined,
        search: req.query.search as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };

      // Extract pagination parameters
      const paginationRequest: IPaginationRequest = {
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
        search: req.query.search as string,
      };

      const result = await this.jobInviteService.getJobInvitesByJobPostingId(
        clientId,
        jobPostingId,
        filters,
        paginationRequest
      );

      logger.info(
        '[JOB INVITE API] Get job invites by job posting completed successfully',
        {
          jobPostingId,
          total: result.total,
          page: result.page,
          context: 'ClientJobInviteController.getJobInvitesByJobPostingId',
        }
      );

      return result;
    });
  };

  getImportedCandidateJobInvites = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    logger.info(
      '[JOB INVITE API] Get imported candidate job invites request received',
      {
        clientUserId: req.user.clientUserId,
        query: req.query,
        context: 'ClientJobInviteController.getImportedCandidateJobInvites',
      }
    );

    this.handleRequest<IJobInviteListApiResponse>(req, res, next, async () => {
      const clientId = req.user.clientId;
      if (!clientId) {
        logger.error(
          '[JOB INVITE API] Get imported candidate invites failed: No client ID',
          {
            context: 'ClientJobInviteController.getImportedCandidateJobInvites',
          }
        );
        throw new Error('Client ID is required');
      }

      // Extract filters from query parameters
      const filters: IJobInviteFilters = {
        status: req.query.status
          ? Array.isArray(req.query.status)
            ? (req.query.status as JobInviteStatusEnum[])
            : [req.query.status as JobInviteStatusEnum]
          : undefined,
        jobId: req.query.jobId as string,
        search: req.query.search as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };

      // Extract pagination parameters
      const paginationRequest: IPaginationRequest = {
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
        search: req.query.search as string,
      };

      const result = await this.jobInviteService.getImportedCandidateJobInvites(
        clientId,
        filters,
        paginationRequest
      );

      logger.info(
        '[JOB INVITE API] Get imported candidate job invites completed successfully',
        {
          total: result.total,
          page: result.page,
          context: 'ClientJobInviteController.getImportedCandidateJobInvites',
        }
      );

      return result;
    });
  };

  getImportedCandidateJobInvitesByJobId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const jobPostingId = req.params.jobPostingId;

    logger.info(
      '[JOB INVITE API] Get imported candidate job invites by job ID request received',
      {
        clientUserId: req.user.clientUserId,
        jobPostingId,
        query: req.query,
        context:
          'ClientJobInviteController.getImportedCandidateJobInvitesByJobId',
      }
    );

    this.handleRequest<IJobImportedInviteListApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId;
        if (!clientId) {
          logger.error(
            '[JOB INVITE API] Get imported candidate invites by job failed: No client ID',
            {
              context:
                'ClientJobInviteController.getImportedCandidateJobInvitesByJobId',
            }
          );
          throw new Error('Client ID is required');
        }

        if (!jobPostingId) {
          logger.error(
            '[JOB INVITE API] Get imported candidate invites by job failed: No job posting ID',
            {
              context:
                'ClientJobInviteController.getImportedCandidateJobInvitesByJobId',
            }
          );
          throw new Error('Job posting ID is required');
        }

        // Extract filters from query parameters
        const filters: IJobInviteFilters = {
          status: req.query.status
            ? Array.isArray(req.query.status)
              ? (req.query.status as JobInviteStatusEnum[])
              : [req.query.status as JobInviteStatusEnum]
            : undefined,
          search: req.query.search as string,
          startDate: req.query.startDate as string,
          endDate: req.query.endDate as string,
        };

        // Extract pagination parameters
        const paginationRequest: IPaginationRequest = {
          page: req.query.page ? Number(req.query.page) : undefined,
          limit: req.query.limit ? Number(req.query.limit) : undefined,
          sortBy: req.query.sortBy as string,
          sortOrder: req.query.sortOrder as 'asc' | 'desc',
          search: req.query.search as string,
        };

        const result =
          await this.jobInviteService.getImportedCandidateJobInvitesByJobId(
            clientId,
            jobPostingId,
            filters,
            paginationRequest
          );

        logger.info(
          '[JOB INVITE API] Get imported candidate job invites by job ID completed successfully',
          {
            jobPostingId,
            total: result.pagination.total,
            page: result.pagination.page,
            context:
              'ClientJobInviteController.getImportedCandidateJobInvitesByJobId',
          }
        );

        return result;
      }
    );
  };
}
