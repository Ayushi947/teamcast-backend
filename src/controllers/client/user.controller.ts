import { Request, Response, NextFunction } from 'express';
import { ClientUserService } from '@/services/client/user.service';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import {
  IClientUserCreateApiRequest,
  IClientUserCreateApiResponse,
  IClientUserUpdateApiRequest,
  IClientUserUpdateApiResponse,
  IClientUserGetApiRequest,
  IClientUserGetApiResponse,
  IClientUserDeleteApiRequest,
  IClientUserDeleteApiResponse,
  IClientUserListApiRequest,
  IClientUserListApiResponse,
  IClientUserActivateDeactivateApiRequest,
  IClientUserActivateDeactivateApiResponse,
} from '@/shared/models/api/client/user.api';
import { singleton } from '@/shared/decorators/singleton';

@singleton
export class ClientUserController extends BaseController {
  constructor(private readonly clientUserService: ClientUserService) {
    super();
  }

  /**
   * Create a new client user
   */
  createClientUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientUserCreateApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const adminUserId = req.user.id;

        // Get the user data from the request body
        const createRequest =
          createIApiRequest<IClientUserCreateApiRequest>(req);

        // Call service method with domain model
        return await this.clientUserService.createClientUser(
          adminUserId,
          clientId,
          createRequest.data
        );
      }
    );
  };

  /**
   * Update an existing client user
   */
  updateClientUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientUserUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const requestingUserId = req.user.id;

        // Get the update data and user ID from the request
        const updateRequest =
          createIApiRequest<IClientUserUpdateApiRequest>(req);
        const clientUserId = updateRequest.params.clientUserId;

        // Call service method with domain model
        return await this.clientUserService.updateClientUser(
          requestingUserId,
          clientId,
          clientUserId,
          updateRequest.data
        );
      }
    );
  };

  /**
   * Get a client user by ID
   */
  getClientUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientUserGetApiResponse>(req, res, next, async () => {
      const clientId = req.user.clientId as string;

      // Get the user ID from the request parameters
      const getRequest = createIApiRequest<IClientUserGetApiRequest>(req);
      const userId = getRequest.params.clientUserId;

      // Call service method with domain model
      return await this.clientUserService.getClientUser(clientId, userId);
    });
  };

  /**
   * Delete a client user
   */
  deleteClientUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientUserDeleteApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;

        // Get the user ID from the request parameters
        const deleteRequest =
          createIApiRequest<IClientUserDeleteApiRequest>(req);
        const userId = deleteRequest.params.clientUserId;

        // Call service method with domain model
        await this.clientUserService.deleteClientUser(clientId, userId);

        // Return empty data for successful deletion
        return undefined;
      }
    );
  };

  /**
   * List all client users with optional filtering
   */
  listClientUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientUserListApiResponse>(req, res, next, async () => {
      const clientId = req.user.clientId as string;

      // Extract filter parameters
      const listUsersRequest =
        createIApiRequest<IClientUserListApiRequest>(req);

      // Call service method with domain models
      return await this.clientUserService.listClientUsers(
        clientId,
        listUsersRequest.filters,
        listUsersRequest.pagination
      );
    });
  };

  /**
   * Activate or deactivate a client user
   */
  activateDeactivateClientUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientUserActivateDeactivateApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const requestingUserId = req.user.id;

        // Get the status data and user ID from the request
        const statusRequest =
          createIApiRequest<IClientUserActivateDeactivateApiRequest>(req);
        const clientUserId = statusRequest.params.clientUserId;

        // Call service method with domain model
        return await this.clientUserService.activateDeactivateClientUser(
          requestingUserId,
          clientId,
          clientUserId,
          statusRequest.data
        );
      }
    );
  };
}
