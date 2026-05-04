import { singleton } from '@/shared/decorators/singleton';
import { BaseController } from '../common/base.controller';
import { PartnerUserService } from '@/services/partner/user.service';
import { Request, Response, NextFunction } from 'express';
import {
  IPartnerUserActivateDeactivateApiRequest,
  IPartnerUserActivateDeactivateApiResponse,
  IPartnerUserCreateApiRequest,
  IPartnerUserCreateApiResponse,
  IPartnerUserDeleteApiRequest,
  IPartnerUserDeleteApiResponse,
  IPartnerUserGetApiRequest,
  IPartnerUserGetApiResponse,
  IPartnerUserListApiRequest,
  IPartnerUserListApiResponse,
  IPartnerUserUpdateApiRequest,
  IPartnerUserUpdateApiResponse,
} from '@/shared/models/api/partner/user.api';
import { createIApiRequest } from '@/utils/api.request';

@singleton
export class PartnerUserController extends BaseController {
  constructor(private readonly partnerUserService: PartnerUserService) {
    super();
  }

  createPartnerUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerUserCreateApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.user.partnerId as string;
        const adminUserId = req.user.id;

        // Get the user data from the request body
        const createRequest =
          createIApiRequest<IPartnerUserCreateApiRequest>(req);

        return await this.partnerUserService.createPartnerUser(
          partnerId,
          adminUserId,
          createRequest.data
        );
      }
    );
  };

  updatePartnerUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerUserUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.user.partnerId as string;
        const adminUserId = req.user.id;

        // Get the user data from the request body
        const updateRequest =
          createIApiRequest<IPartnerUserUpdateApiRequest>(req);

        const partnerUserId = req.params.partnerUserId;

        return await this.partnerUserService.updatePartnerUser(
          adminUserId,
          partnerId,
          partnerUserId,
          updateRequest.data
        );
      }
    );
  };

  getPartnerUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerUserGetApiResponse>(req, res, next, async () => {
      const partnerId = req.user.partnerId as string;

      // Get the user ID from the request parameters
      const getRequest = createIApiRequest<IPartnerUserGetApiRequest>(req);
      const partnerUserId = getRequest.params.partnerUserId;

      // Call service method with domain model
      return await this.partnerUserService.getPartnerUser(
        partnerId,
        partnerUserId
      );
    });
  };

  deletePartnerUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerUserDeleteApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.user.partnerId as string;

        // Get the user ID from the request parameters
        const deleteRequest =
          createIApiRequest<IPartnerUserDeleteApiRequest>(req);
        const partnerUserId = deleteRequest.params.partnerUserId;

        // Call service method with domain model
        await this.partnerUserService.deletePartnerUser(
          partnerId,
          partnerUserId
        );

        return undefined;
      }
    );
  };

  listPartnerUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerUserListApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.user.partnerId as string;

        // Extract filter parameters
        const listUsersRequest =
          createIApiRequest<IPartnerUserListApiRequest>(req);

        // Call service method with domain models
        return await this.partnerUserService.listPartnerUsers(
          partnerId,
          listUsersRequest.filters,
          listUsersRequest.pagination
        );
      }
    );
  };

  activateDeactivatePartnerUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerUserActivateDeactivateApiResponse>(
      req,
      res,
      next,
      async () => {
        const partnerId = req.user.partnerId as string;
        const adminUserId = req.user.id;

        // Get the status data and user ID from the request
        const statusRequest =
          createIApiRequest<IPartnerUserActivateDeactivateApiRequest>(req);
        const partnerUserId = statusRequest.params.partnerUserId;

        // Call service method with domain model
        return await this.partnerUserService.activateDeactivatePartnerUser(
          adminUserId,
          partnerId,
          partnerUserId,
          statusRequest.data
        );
      }
    );
  };
}
