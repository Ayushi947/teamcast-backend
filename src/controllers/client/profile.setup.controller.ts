import { Request, Response } from 'express';
import { logger } from '@/shared/utils/logger';
import { ClientProfileSetupService } from '@/services/client/profile.setup.service';
import {
  IClientProfileSetupApiResponse,
  IClientProfileSetupRequiredApiResponse,
} from '@/shared/models/api/client/profile.setup.api';
import { IAuthUser } from '@/shared/models/domain/auth/auth.user.domain';
import { IClientProfileSetup } from '@/shared/models/domain/client/profile.setup.domain';

export class ClientProfileSetupController {
  constructor(
    private readonly clientProfileSetupService: ClientProfileSetupService
  ) {}

  /**
   * Complete client profile setup
   * @param req Request with profile setup data
   * @param res Response with profile setup result
   */
  async completeProfileSetup(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as IAuthUser;
      const setupData = req.body as IClientProfileSetup;

      logger.info('Client profile setup request received', {
        userId: user.id,
        context: 'ClientProfileSetupController.completeProfileSetup',
      });

      const result = await this.clientProfileSetupService.completeProfileSetup(
        user.id,
        setupData
      );

      const response: IClientProfileSetupApiResponse = {
        success: true,
        message: result.message,
        data: result,
      };

      logger.info('Client profile setup completed successfully', {
        userId: user.id,
        context: 'ClientProfileSetupController.completeProfileSetup',
      });

      res.status(200).json(response);
    } catch (error) {
      logger.error('Client profile setup failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        context: 'ClientProfileSetupController.completeProfileSetup',
      });

      res.status(500).json({
        success: false,
        message: 'Failed to complete profile setup',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Check if client profile setup is required
   * @param req Request with user info
   * @param res Response with setup requirement status
   */
  async isProfileSetupRequired(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as IAuthUser;

      logger.info('Checking client profile setup requirement', {
        userId: user.id,
        context: 'ClientProfileSetupController.isProfileSetupRequired',
      });

      const result =
        await this.clientProfileSetupService.isProfileSetupRequired(user.id);

      const response: IClientProfileSetupRequiredApiResponse = {
        success: true,
        message: 'Profile setup requirement checked',
        data: result,
      };

      logger.info('Client profile setup requirement checked', {
        userId: user.id,
        required: result.required,
        context: 'ClientProfileSetupController.isProfileSetupRequired',
      });

      res.status(200).json(response);
    } catch (error) {
      logger.error('Failed to check client profile setup requirement', {
        error: error instanceof Error ? error.message : 'Unknown error',
        context: 'ClientProfileSetupController.isProfileSetupRequired',
      });

      res.status(500).json({
        success: false,
        message: 'Failed to check profile setup requirement',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
