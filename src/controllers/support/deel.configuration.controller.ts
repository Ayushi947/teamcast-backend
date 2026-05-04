/**
 * Deel Configuration Controller for Support Admin
 *
 * Handles HTTP requests for managing Deel SSO configuration for clients.
 * Only accessible by TeamCast support admins.
 */

import { Request, Response, NextFunction } from 'express';
import { BaseController } from '@/controllers/common/base.controller';
import { DeelConfigurationService } from '@/services/support/deel.configuration.service';
import { singleton } from '@/shared/decorators/singleton';
import { AppError } from '@/utils/app.error';
import { logger } from '@/shared/utils/logger';

@singleton
export class DeelConfigurationController extends BaseController {
  private readonly deelConfigService: DeelConfigurationService;

  constructor() {
    super();
    this.deelConfigService = new DeelConfigurationService();
  }

  /**
   * POST /api/support/deel/clients/:clientId/enable
   * Enable Deel SSO for a specific client
   * Only support admins can access this
   */
  enableDeelForClient = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    this.handleRequest(req, res, next, async () => {
      // Check if user is support admin (middleware should handle this)
      if (!req.user?.id) {
        throw new AppError('Unauthorized', 401);
      }

      const { clientId } = req.params;

      if (!clientId) {
        throw new AppError('Client ID is required', 400);
      }

      logger.info(
        `Support admin ${req.user.id} is enabling Deel for client ${clientId}`
      );

      const result = await this.deelConfigService.enableDeelForClient({
        clientId,
        adminUserId: req.user.id,
      });

      return {
        success: true,
        data: result,
        message: 'Deel SSO enabled successfully for client',
      };
    });
  };

  /**
   * POST /api/support/deel/clients/:clientId/disable
   * Disable Deel SSO for a specific client
   * Only support admins can access this
   */
  disableDeelForClient = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    this.handleRequest(req, res, next, async () => {
      if (!req.user?.id) {
        throw new AppError('Unauthorized', 401);
      }

      const { clientId } = req.params;

      if (!clientId) {
        throw new AppError('Client ID is required', 400);
      }

      logger.info(
        `Support admin ${req.user.id} is disabling Deel for client ${clientId}`
      );

      const result = await this.deelConfigService.disableDeelForClient({
        clientId,
        adminUserId: req.user.id,
      });

      return {
        success: true,
        data: result,
        message: 'Deel SSO disabled successfully for client',
      };
    });
  };

  /**
   * GET /api/support/deel/clients/:clientId
   * Get Deel configuration status for a specific client
   * Only support admins can access this
   */
  getDeelConfiguration = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    this.handleRequest(req, res, next, async () => {
      if (!req.user?.id) {
        throw new AppError('Unauthorized', 401);
      }

      const { clientId } = req.params;

      if (!clientId) {
        throw new AppError('Client ID is required', 400);
      }

      logger.info(
        `Support admin ${req.user.id} is fetching Deel configuration for client ${clientId}`
      );

      const result =
        await this.deelConfigService.getDeelConfiguration(clientId);

      return {
        success: true,
        data: result,
        message: 'Deel configuration retrieved successfully',
      };
    });
  };

  /**
   * GET /api/support/deel/clients
   * Get all clients with Deel enabled
   * Only support admins can access this
   */
  getAllClientsWithDeelEnabled = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    this.handleRequest(req, res, next, async () => {
      if (!req.user?.id) {
        throw new AppError('Unauthorized', 401);
      }

      logger.info(
        `Support admin ${req.user.id} is fetching all clients with Deel enabled`
      );

      const result =
        await this.deelConfigService.getAllClientsWithDeelEnabled();

      return {
        success: true,
        data: result,
        message: 'Clients with Deel enabled retrieved successfully',
      };
    });
  };
}
