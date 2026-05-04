import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import { singleton } from '@/shared/decorators/singleton';
import { IntegrationDataTrackingService } from '@/services/integration/common/integration.data.tracking.service';
import { IntegrationDisconnectService } from '@/services/integration/common/integration.disconnect.service';
import {
  IIntegrationDataSummaryApiRequest,
  IIntegrationDataSummaryApiResponse,
  IIntegrationDataDetailsApiRequest,
  IIntegrationDataDetailsApiResponse,
  IJobImportSourceApiRequest,
  IJobImportSourceApiResponse,
  ICandidateImportSourceApiRequest,
  ICandidateImportSourceApiResponse,
  IDataUsageStatisticsApiRequest,
  IDataUsageStatisticsApiResponse,
  IIntegrationDisconnectApiRequest,
  IIntegrationDisconnectApiResponse,
  IIntegrationBulkDisconnectApiRequest,
  IIntegrationBulkDisconnectApiResponse,
  IIntegrationDisconnectPreviewApiRequest,
  IIntegrationDisconnectPreviewApiResponse,
} from '@/shared/models/api/integration/common/integration.common.api';
import { logger } from '@/shared/utils/logger';

@singleton
export class IntegrationCommonController extends BaseController {
  constructor(
    private readonly dataTrackingService: IntegrationDataTrackingService,
    private readonly disconnectService: IntegrationDisconnectService
  ) {
    super();
  }

  /**
   * Get integration data summary for all client integrations
   */
  getIntegrationDataSummary = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IIntegrationDataSummaryApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const _request =
          createIApiRequest<IIntegrationDataSummaryApiRequest>(req);

        logger.info('Getting integration data summary', {
          context: 'IntegrationCommonController.getIntegrationDataSummary',
          clientId,
        });

        return await this.dataTrackingService.getIntegrationDataSummary(
          clientId
        );
      }
    );
  };

  /**
   * Get detailed data for a specific integration
   */
  getIntegrationDataDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IIntegrationDataDetailsApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const request =
          createIApiRequest<IIntegrationDataDetailsApiRequest>(req);

        logger.info('Getting integration data details', {
          context: 'IntegrationCommonController.getIntegrationDataDetails',
          clientId,
          integrationId: request.params.integrationId,
        });

        return await this.dataTrackingService.getIntegrationDataDetails(
          clientId,
          request.params.integrationId
        );
      }
    );
  };

  /**
   * Get import source information for a job
   */
  getJobImportSource = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IJobImportSourceApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const request = createIApiRequest<IJobImportSourceApiRequest>(req);

        logger.info('Getting job import source', {
          context: 'IntegrationCommonController.getJobImportSource',
          clientId,
          jobId: request.params.jobId,
        });

        return await this.dataTrackingService.getJobImportSource(
          clientId,
          request.params.jobId
        );
      }
    );
  };

  /**
   * Get import source information for a candidate
   */
  getCandidateImportSource = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateImportSourceApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const request =
          createIApiRequest<ICandidateImportSourceApiRequest>(req);

        logger.info('Getting candidate import source', {
          context: 'IntegrationCommonController.getCandidateImportSource',
          clientId,
          candidateId: request.params.candidateId,
        });

        return await this.dataTrackingService.getCandidateImportSource(
          clientId,
          request.params.candidateId
        );
      }
    );
  };

  /**
   * Get data usage statistics across all integrations
   */
  getDataUsageStatistics = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IDataUsageStatisticsApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const _request = createIApiRequest<IDataUsageStatisticsApiRequest>(req);

        logger.info('Getting data usage statistics', {
          context: 'IntegrationCommonController.getDataUsageStatistics',
          clientId,
        });

        return await this.dataTrackingService.getDataUsageStatistics(clientId);
      }
    );
  };

  /**
   * Disconnect an integration
   */
  disconnectIntegration = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IIntegrationDisconnectApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const request =
          createIApiRequest<IIntegrationDisconnectApiRequest>(req);

        logger.info('Disconnecting integration', {
          context: 'IntegrationCommonController.disconnectIntegration',
          clientId,
          integrationId: request.params.integrationId,
          removeData: request.data.removeData,
        });

        return await this.disconnectService.disconnectIntegration(
          clientId,
          request.params.integrationId,
          request.data
        );
      }
    );
  };

  /**
   * Bulk disconnect multiple integrations
   */
  bulkDisconnectIntegrations = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IIntegrationBulkDisconnectApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const request =
          createIApiRequest<IIntegrationBulkDisconnectApiRequest>(req);

        logger.info('Bulk disconnecting integrations', {
          context: 'IntegrationCommonController.bulkDisconnectIntegrations',
          clientId,
          integrationCount: request.data.integrationIds.length,
          removeData: request.data.disconnectOptions.removeData,
        });

        const results = await this.disconnectService.bulkDisconnectIntegrations(
          clientId,
          request.data.integrationIds,
          request.data.disconnectOptions
        );

        // Create the expected API response structure
        return {
          results,
          summary: {
            total: request.data.integrationIds.length,
            successful: results.length,
            failed: request.data.integrationIds.length - results.length,
          },
        };
      }
    );
  };

  /**
   * Get preview of what data would be affected by disconnect
   */
  getDisconnectPreview = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IIntegrationDisconnectPreviewApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const request =
          createIApiRequest<IIntegrationDisconnectPreviewApiRequest>(req);

        logger.info('Getting disconnect preview', {
          context: 'IntegrationCommonController.getDisconnectPreview',
          clientId,
          integrationId: request.params.integrationId,
        });

        return await this.disconnectService.getDisconnectPreview(
          clientId,
          request.params.integrationId
        );
      }
    );
  };
}
