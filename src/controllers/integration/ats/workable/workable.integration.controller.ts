import { Request, Response, NextFunction } from 'express';
import { WorkableIntegrationService } from '@/services/integration/ats/workable/workable.integration.service';
import { logger } from '@/shared/utils/logger';
import {
  IWorkableConnectApiRequest,
  IWorkableConnectApiResponse,
  IWorkableValidateApiRequest,
  IWorkableValidateApiResponse,
  IWorkableImportCandidatesApiRequest,
  IWorkableImportCandidatesApiResponse,
  IWorkableImportJobsApiRequest,
  IWorkableImportJobsApiResponse,
  IWorkableImportSelectedJobsApiRequest,
  IWorkableImportSelectedJobsApiResponse,
} from '@/shared/models/api/integration/ats/workable/workable.integration.api';
import { BaseController } from '@/controllers/common/base.controller';
import { createIApiRequest } from '@/utils/api.request';

export class WorkableIntegrationController extends BaseController {
  constructor(
    private readonly workableIntegrationService: WorkableIntegrationService
  ) {
    super();
  }

  /**
   * Connect to Workable by creating a new integration
   */
  connectWorkable = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IWorkableConnectApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const connectRequest =
          createIApiRequest<IWorkableConnectApiRequest>(req);

        logger.info('Connecting Workable integration', {
          context: 'WorkableIntegrationController.connectWorkable',
          clientId,
          subdomain: connectRequest.data.subdomain,
          integrationName: connectRequest.data.name,
        });

        return await this.workableIntegrationService.connectWorkable(
          clientId,
          connectRequest.data
        );
      }
    );
  };

  /**
   * Validate an existing Workable connection
   */
  validateConnection = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IWorkableValidateApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const validateRequest =
          createIApiRequest<IWorkableValidateApiRequest>(req);

        logger.info('Validating Workable connection', {
          context: 'WorkableIntegrationController.validateConnection',
          clientId,
          integrationId: validateRequest.params.integrationId,
        });

        return await this.workableIntegrationService.validateConnection(
          clientId,
          validateRequest.params.integrationId
        );
      }
    );
  };

  /**
   * Import candidates from Workable
   */
  importCandidates = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IWorkableImportCandidatesApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const importRequest =
          createIApiRequest<IWorkableImportCandidatesApiRequest>(req);

        logger.info('Importing candidates from Workable', {
          context: 'WorkableIntegrationController.importCandidates',
          clientId,
          integrationId: importRequest.params.integrationId,
          importOptions: importRequest.data,
        });

        return await this.workableIntegrationService.importCandidates(
          clientId,
          importRequest.params.integrationId,
          importRequest.data
        );
      }
    );
  };

  /**
   * Import jobs from Workable
   */
  importJobs = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IWorkableImportJobsApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const importRequest =
          createIApiRequest<IWorkableImportJobsApiRequest>(req);

        logger.info('Importing jobs from Workable', {
          context: 'WorkableIntegrationController.importJobs',
          clientId,
          integrationId: importRequest.params.integrationId,
          importOptions: importRequest.data,
        });

        return await this.workableIntegrationService.importJobs(
          clientId,
          importRequest.params.integrationId,
          importRequest.data
        );
      }
    );
  };

  /**
   * Import selected jobs from manual selection
   */
  importSelectedJobs = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IWorkableImportSelectedJobsApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const selectionRequest =
          createIApiRequest<IWorkableImportSelectedJobsApiRequest>(req);

        logger.info('Importing selected Workable jobs', {
          context: 'WorkableIntegrationController.importSelectedJobs',
          clientId,
          integrationId: selectionRequest.params.integrationId,
          selectedJobsCount: selectionRequest.data.selectedJobIds.length,
        });

        return await this.workableIntegrationService.importSelectedJobs(
          clientId,
          selectionRequest.params.integrationId,
          selectionRequest.data
        );
      }
    );
  };
}
