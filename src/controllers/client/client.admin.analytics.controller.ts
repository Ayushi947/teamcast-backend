import { Request, Response } from 'express';
import { singleton } from '@/shared/decorators/singleton';
import { ClientAdminAnalyticsService } from '@/services/client/client.admin.analytics.service';
import { logger } from '@/shared/utils/logger';
import { IApiResponse } from '@/shared/models/api/common/common.api';
import { IClientAnalytics } from '@/shared/models/domain/client/client.admin.analytics.domain';

@singleton
export class ClientAdminAnalyticsController {
  private readonly analyticsService: ClientAdminAnalyticsService;

  constructor() {
    this.analyticsService = new ClientAdminAnalyticsService();
    logger.info('ClientAdminAnalyticsController initialized', {
      context: 'ClientAdminAnalyticsController.constructor',
    });
  }

  /**
   * Get analytics data for the client
   */
  async getClientAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const clientId = req.user?.clientId;

      if (!clientId) {
        const response: IApiResponse<IClientAnalytics> = {
          success: false,
          message: 'Client ID not found in the request',
          error: 'Client ID is required',
        };
        res.status(400).json(response);
        return;
      }

      logger.info('Fetching client analytics data', {
        context: 'ClientAdminAnalyticsController.getClientAnalytics',
        clientId,
      });

      const analyticsData =
        await this.analyticsService.getClientAnalytics(clientId);

      const response: IApiResponse<IClientAnalytics> = {
        success: true,
        message: 'Client analytics data fetched successfully',
        data: analyticsData,
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Error fetching client analytics data', {
        context: 'ClientAdminAnalyticsController.getClientAnalytics',
        error: error instanceof Error ? error.message : String(error),
      });

      const response: IApiResponse<IClientAnalytics> = {
        success: false,
        message: 'Failed to fetch analytics data',
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
      res.status(500).json(response);
    }
  }
}
