import { Request, Response, NextFunction } from 'express';
import { IndeedService } from '@/services/integration/jobboard/indeed/indeed.service';
import { logger } from '@/shared/utils/logger';
import {
  IIndeedInitiateApiRequest,
  IIndeedInitiateApiResponse,
  IIndeedCallbackApiResponse,
  IIndeedJobPublishApiRequest,
  IIndeedJobPublishApiResponse,
  IIndeedJobUpdateApiRequest,
  IIndeedJobUpdateApiResponse,
  IIndeedJobDeleteApiRequest,
  IIndeedJobDeleteApiResponse,
  IIndeedCandidateImportApiRequest,
  IIndeedCandidateImportApiResponse,
  IIndeedTestConnectionApiRequest,
  IIndeedTestConnectionApiResponse,
  IIndeedRefreshTokenApiRequest,
  IIndeedRefreshTokenApiResponse,
} from '@/shared/models/api/integration/jobboard/indeed/indeed.api';
import { BaseController } from '@/controllers/common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import { singleton } from '@/shared/decorators/singleton';

@singleton
export class IndeedController extends BaseController {
  constructor(private readonly indeedService: IndeedService) {
    super();
  }

  /**
   * Initiate Indeed integration
   */
  initiateIntegration = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IIndeedInitiateApiResponse>(req, res, next, async () => {
      const initiateRequest = createIApiRequest<IIndeedInitiateApiRequest>(req);
      const clientId = req.user?.clientId;

      if (!clientId) {
        throw new Error('Client ID not found in request');
      }

      logger.info({
        message: 'Initiating Indeed integration',
        context: 'IndeedController.initiateIntegration',
        clientId,
        integrationName: initiateRequest.data?.integrationName,
      });

      const result = await this.indeedService.initiateIntegration(
        clientId,
        initiateRequest.data?.integrationName
      );

      return {
        success: true,
        message: 'Integration initiated successfully',
        data: result,
      };
    });
  };

  /**
   * Handle OAuth callback from Indeed
   */
  handleCallback = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IIndeedCallbackApiResponse>(req, res, next, async () => {
      logger.info({
        message: 'Handling Indeed OAuth callback',
        context: 'IndeedController.handleCallback',
        state: req.query.state,
      });

      if (req.query.error) {
        throw new Error(`OAuth error: ${req.query.error}`);
      }

      const result = await this.indeedService.handleOAuthCallback(
        req.query.code as string,
        req.query.state as string
      );

      return {
        success: true,
        message: 'OAuth callback handled successfully',
        data: result,
      };
    });
  };

  /**
   * Refresh Indeed access token
   */
  refreshToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IIndeedRefreshTokenApiResponse>(
      req,
      res,
      next,
      async () => {
        const refreshRequest =
          createIApiRequest<IIndeedRefreshTokenApiRequest>(req);

        logger.info({
          message: 'Refreshing Indeed access token',
          context: 'IndeedController.refreshToken',
          clientIntegrationId: refreshRequest.params.clientIntegrationId,
        });

        const tokens = await this.indeedService.refreshAccessToken(
          refreshRequest.params.clientIntegrationId
        );

        return {
          success: true,
          message: 'Access token refreshed successfully',
          data: tokens,
        };
      }
    );
  };

  /**
   * Publish job to Indeed
   */
  publishJob = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IIndeedJobPublishApiResponse>(
      req,
      res,
      next,
      async () => {
        const publishRequest =
          createIApiRequest<IIndeedJobPublishApiRequest>(req);

        logger.info({
          message: 'Publishing job to Indeed',
          context: 'IndeedController.publishJob',
          clientIntegrationId: publishRequest.params.clientIntegrationId,
          jobPostingId: publishRequest.params.jobPostingId,
          jobTitle: publishRequest.data.title,
        });

        const result = await this.indeedService.publishJob(
          publishRequest.params.clientIntegrationId,
          publishRequest.params.jobPostingId
        );

        return {
          success: true,
          message: 'Job published to Indeed successfully',
          data: result,
        };
      }
    );
  };

  /**
   * Update job on Indeed
   */
  updateJob = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IIndeedJobUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const updateRequest =
          createIApiRequest<IIndeedJobUpdateApiRequest>(req);

        logger.info({
          message: 'Updating job on Indeed',
          context: 'IndeedController.updateJob',
          clientIntegrationId: updateRequest.params.clientIntegrationId,
          jobPostingId: updateRequest.params.jobPostingId,
        });

        const success = await this.indeedService.updateJob(
          updateRequest.params.clientIntegrationId,
          updateRequest.params.jobPostingId,
          updateRequest.data
        );

        return {
          success: true,
          message: 'Job updated on Indeed successfully',
          data: success,
        };
      }
    );
  };

  /**
   * Delete job from Indeed
   */
  deleteJob = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IIndeedJobDeleteApiResponse>(
      req,
      res,
      next,
      async () => {
        const deleteRequest =
          createIApiRequest<IIndeedJobDeleteApiRequest>(req);

        logger.info({
          message: 'Deleting job from Indeed',
          context: 'IndeedController.deleteJob',
          clientIntegrationId: deleteRequest.params.clientIntegrationId,
          jobPostingId: deleteRequest.params.jobPostingId,
        });

        const success = await this.indeedService.deleteJob(
          deleteRequest.params.clientIntegrationId,
          deleteRequest.params.jobPostingId
        );

        return {
          success: true,
          message: 'Job deleted from Indeed successfully',
          data: success,
        };
      }
    );
  };

  /**
   * Import candidates from Indeed
   */
  importCandidates = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IIndeedCandidateImportApiResponse>(
      req,
      res,
      next,
      async () => {
        const importRequest =
          createIApiRequest<IIndeedCandidateImportApiRequest>(req);

        logger.info({
          message: 'Importing candidates from Indeed',
          context: 'IndeedController.importCandidates',
          clientIntegrationId: importRequest.params.clientIntegrationId,
          jobPostingIntegrationId: importRequest.params.jobPostingIntegrationId,
        });

        const result = await this.indeedService.importCandidates(
          importRequest.params.clientIntegrationId,
          importRequest.params.jobPostingIntegrationId
        );

        return {
          success: true,
          message: `Imported ${result.importedCount} candidates from Indeed`,
          data: result,
        };
      }
    );
  };

  /**
   * Test connection to Indeed
   */
  testConnection = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IIndeedTestConnectionApiResponse>(
      req,
      res,
      next,
      async () => {
        const testRequest =
          createIApiRequest<IIndeedTestConnectionApiRequest>(req);

        logger.info({
          message: 'Testing Indeed connection',
          context: 'IndeedController.testConnection',
          clientIntegrationId: testRequest.params.clientIntegrationId,
        });

        const result = await this.indeedService.testConnection(
          testRequest.params.clientIntegrationId
        );

        return {
          success: result.success,
          message: result.message,
          data: result,
        };
      }
    );
  };
}
