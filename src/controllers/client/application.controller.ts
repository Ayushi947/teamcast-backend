import { Request, Response, NextFunction } from 'express';
import { ClientApplicationService } from '@/services/client/application.service';
import { ClientAccountManagerService } from '@/services/client/account.manager.service';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import {
  IClientJobApplicationListApiRequest,
  IClientJobApplicationListApiResponse,
  IClientJobApplicationGetApiRequest,
  IClientJobApplicationGetApiResponse,
  IClientJobApplicationGetAiAssessmentApiRequest,
  IClientJobApplicationGetAiAssessmentApiResponse,
  IClientJobApplicationUpdateApiRequest,
  IClientJobApplicationUpdateApiResponse,
  IClientJobApplicationHireRequestApiRequest,
  IClientJobApplicationHireRequestApiResponse,
} from '@/shared/models/api/client/application.api';
import { singleton } from '@/shared/decorators/singleton';

@singleton
export class ClientApplicationController extends BaseController {
  constructor(
    private readonly clientApplicationService: ClientApplicationService,
    private readonly clientAccountManagerService = new ClientAccountManagerService()
  ) {
    super();
  }

  /**
   * List all applications for a client with optional filtering
   */
  listClientApplications = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientJobApplicationListApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;

        // Extract filter parameters
        const listApplicationsRequest =
          createIApiRequest<IClientJobApplicationListApiRequest>(req);

        // Call service method with domain models
        return await this.clientApplicationService.listClientApplications(
          clientId,
          listApplicationsRequest.filters,
          listApplicationsRequest.pagination
        );
      }
    );
  };

  /**
   * Get a specific application by ID
   */
  getClientApplication = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientJobApplicationGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;

        // Get the application ID from the request parameters
        const getRequest =
          createIApiRequest<IClientJobApplicationGetApiRequest>(req);
        const applicationId = getRequest.params.applicationId;

        // Call service method with domain model
        return await this.clientApplicationService.getClientApplication(
          clientId,
          applicationId
        );
      }
    );
  };

  /**
   * Get the AI assessment for a specific application
   */
  getClientApplicationAiAssessment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientJobApplicationGetAiAssessmentApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;

        // Get the application ID from the request parameters
        const getRequest =
          createIApiRequest<IClientJobApplicationGetAiAssessmentApiRequest>(
            req
          );
        const applicationId = getRequest.params.applicationId;

        // Call service method with domain model
        return await this.clientApplicationService.getClientApplicationAiAssessment(
          clientId,
          applicationId
        );
      }
    );
  };

  /**
   * Update application status (accept/reject)
   */
  updateApplicationStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientJobApplicationUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const clientUserId = req.user.clientUserId as string;

        // Get the application ID and update data from the request
        const updateRequest =
          createIApiRequest<IClientJobApplicationUpdateApiRequest>(req);
        const applicationId = updateRequest.params.applicationId;
        const { status, notes } = req.body;

        // Call service method with domain model
        return await this.clientApplicationService.updateApplicationStatus(
          clientId,
          applicationId,
          status,
          notes,
          clientUserId
        );
      }
    );
  };

  /**
   * Process hire request and send email to account manager
   */
  processHireRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientJobApplicationHireRequestApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const clientUserId = req.user.clientUserId as string;

        // Get the application ID from the request parameters
        const hireRequest =
          createIApiRequest<IClientJobApplicationHireRequestApiRequest>(req);
        const applicationId = hireRequest.params.applicationId;

        // Call service method to process hire request
        await this.clientApplicationService.processHireRequest(
          clientId,
          applicationId,
          clientUserId
        );

        return {
          message:
            'Hire request processed successfully. Account manager has been notified.',
        };
      }
    );
  };
}
