import { Request, Response, NextFunction } from 'express';
import { singleton } from '@/shared/decorators/singleton';
import { ClientCandidateShortlistService } from '@/services/client/candidate.shortlist.service';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import { logger } from '@/shared/utils/logger';
import {
  IClientCandidateShortlistCreateApiRequest,
  IClientCandidateShortlistCreateApiResponse,
  IClientCandidateShortlistUpdateApiRequest,
  IClientCandidateShortlistUpdateApiResponse,
  IClientCandidateShortlistGetApiResponse,
  IClientCandidateShortlistListApiRequest,
  IClientCandidateShortlistDeleteApiResponse,
  IClientCandidateShortlistBulkUpdateApiRequest,
  IClientCandidateShortlistBulkUpdateApiResponse,
  IClientCandidateShortlistStatsApiResponse,
} from '@/shared/models/api/client/candidate.shortlist.api';

@singleton
export class ClientCandidateShortlistController extends BaseController {
  constructor(
    private readonly shortlistService: ClientCandidateShortlistService
  ) {
    super();
  }

  /**
   * Create a new candidate shortlist entry
   */
  createCandidateShortlist = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientCandidateShortlistCreateApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user?.clientId;
        const clientUserId = req.user?.clientUserId;

        if (!clientId || !clientUserId) {
          throw new Error('Client or client user information not found');
        }

        const createRequest =
          createIApiRequest<IClientCandidateShortlistCreateApiRequest>(req);

        logger.info({
          message: 'Creating candidate shortlist',
          context:
            'ClientCandidateShortlistController.createCandidateShortlist',
          clientId,
          candidateId: createRequest.data.candidateId,
        });

        return await this.shortlistService.createCandidateShortlist(
          clientId,
          clientUserId,
          createRequest.data
        );
      }
    );
  };

  /**
   * Update an existing candidate shortlist entry
   */
  updateCandidateShortlist = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientCandidateShortlistUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user?.clientId;
        const { shortlistId } = req.params;

        if (!clientId) {
          throw new Error('Client information not found');
        }

        const updateRequest =
          createIApiRequest<IClientCandidateShortlistUpdateApiRequest>(req);

        logger.info({
          message: 'Updating candidate shortlist',
          context:
            'ClientCandidateShortlistController.updateCandidateShortlist',
          clientId,
          shortlistId,
        });

        return await this.shortlistService.updateCandidateShortlist(
          clientId,
          shortlistId,
          updateRequest.data
        );
      }
    );
  };

  /**
   * Get a single candidate shortlist entry
   */
  getCandidateShortlist = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientCandidateShortlistGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user?.clientId;
        const { shortlistId } = req.params;

        if (!clientId) {
          throw new Error('Client information not found');
        }

        logger.info({
          message: 'Getting candidate shortlist',
          context: 'ClientCandidateShortlistController.getCandidateShortlist',
          clientId,
          shortlistId,
        });

        return await this.shortlistService.getCandidateShortlist(
          clientId,
          shortlistId
        );
      }
    );
  };

  /**
   * Get paginated list of candidate shortlists
   */
  listCandidateShortlists = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const clientId = req.user?.clientId;

      if (!clientId) {
        throw new Error('Client information not found');
      }

      const listRequest =
        createIApiRequest<IClientCandidateShortlistListApiRequest>(req);

      logger.info({
        message: 'Listing candidate shortlists',
        context: 'ClientCandidateShortlistController.listCandidateShortlists',
        clientId,
        pagination: listRequest.pagination,
        filters: listRequest.filters,
      });

      const result = await this.shortlistService.listCandidateShortlists(
        clientId,
        req.query || {}
      );

      // Structure response with data array and pagination at root level
      const response = {
        success: true,
        message: 'Success',
        data: result.data,
        pagination: result.pagination,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a candidate shortlist entry
   */
  deleteCandidateShortlist = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientCandidateShortlistDeleteApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user?.clientId;
        const { shortlistId } = req.params;

        if (!clientId) {
          throw new Error('Client information not found');
        }

        logger.info({
          message: 'Deleting candidate shortlist',
          context:
            'ClientCandidateShortlistController.deleteCandidateShortlist',
          clientId,
          shortlistId,
        });

        return await this.shortlistService.deleteCandidateShortlist(
          clientId,
          shortlistId
        );
      }
    );
  };

  /**
   * Bulk update multiple candidate shortlist entries
   */
  bulkUpdateCandidateShortlists = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientCandidateShortlistBulkUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user?.clientId;

        if (!clientId) {
          throw new Error('Client information not found');
        }

        const bulkUpdateRequest =
          createIApiRequest<IClientCandidateShortlistBulkUpdateApiRequest>(req);

        logger.info({
          message: 'Bulk updating candidate shortlists',
          context:
            'ClientCandidateShortlistController.bulkUpdateCandidateShortlists',
          clientId,
          shortlistIds: bulkUpdateRequest.data.shortlistIds,
        });

        return await this.shortlistService.bulkUpdateCandidateShortlists(
          clientId,
          bulkUpdateRequest.data.shortlistIds,
          bulkUpdateRequest.data.updates
        );
      }
    );
  };

  /**
   * Get candidate shortlist statistics
   */
  getCandidateShortlistStats = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientCandidateShortlistStatsApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user?.clientId;

        if (!clientId) {
          throw new Error('Client information not found');
        }

        logger.info({
          message: 'Getting candidate shortlist statistics',
          context:
            'ClientCandidateShortlistController.getCandidateShortlistStats',
          clientId,
        });

        return await this.shortlistService.getCandidateShortlistStats(clientId);
      }
    );
  };
}
