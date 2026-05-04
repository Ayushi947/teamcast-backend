import { singleton } from '@/shared/decorators/singleton';
import { Request, Response, NextFunction } from 'express';
import { PartnerJobApplicationService } from '@/services/partner/job.application.service';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import {
  IPartnerJobApplicationListApiRequest,
  IPartnerJobApplicationListApiResponse,
  IPartnerJobApplicationByIdApiRequest,
  IPartnerJobApplicationByIdApiResponse,
  IPartnerJobApplicationWithdrawApiRequest,
  IPartnerJobApplicationWithdrawApiResponse,
} from '@/shared/models/api/partner/job.application.api';

@singleton
export class PartnerJobApplicationController extends BaseController {
  constructor(
    private readonly partnerJobApplicationService: PartnerJobApplicationService
  ) {
    super();
  }

  /**
   * Get partner's job applications
   */
  getJobApplications = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerJobApplicationListApiResponse>(
      req,
      res,
      next,
      async () => {
        const apiRequest =
          createIApiRequest<IPartnerJobApplicationListApiRequest>(req);

        // Get partner ID from authenticated user
        const partnerId =
          await this.partnerJobApplicationService.getPartnerFromUserId(
            req.user!.id
          );

        return await this.partnerJobApplicationService.getPartnerJobApplications(
          partnerId,
          apiRequest.filters,
          apiRequest.pagination
        );
      }
    );
  };

  /**
   * Get a specific job application by ID
   */
  getJobApplicationById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerJobApplicationByIdApiResponse>(
      req,
      res,
      next,
      async () => {
        const apiRequest =
          createIApiRequest<IPartnerJobApplicationByIdApiRequest>(req);

        // Get partner ID from authenticated user
        const partnerId =
          await this.partnerJobApplicationService.getPartnerFromUserId(
            req.user!.id
          );

        return await this.partnerJobApplicationService.getPartnerJobApplicationById(
          partnerId,
          apiRequest.params.id
        );
      }
    );
  };

  /**
   * Withdraw a job application
   */
  withdrawJobApplication = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPartnerJobApplicationWithdrawApiResponse>(
      req,
      res,
      next,
      async () => {
        const apiRequest =
          createIApiRequest<IPartnerJobApplicationWithdrawApiRequest>(req);

        // Get partner ID from authenticated user
        const partnerId =
          await this.partnerJobApplicationService.getPartnerFromUserId(
            req.user!.id
          );

        const result =
          await this.partnerJobApplicationService.withdrawPartnerJobApplication(
            partnerId,
            apiRequest.params.id,
            apiRequest.data
          );

        return {
          message: 'Job application withdrawn successfully',
          applicationId: result.applicationId,
          status: result.status,
        };
      }
    );
  };
}
