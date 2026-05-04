import { Request, Response } from 'express';
import { logger } from '@/shared/utils/logger';
import { PartnerProfileSetupService } from '@/services/partner/profile.setup.service';
import {
  IPartnerProfileSetupApiResponse,
  IPartnerProfileSetupRequiredApiResponse,
} from '@/shared/models/api/partner/profile.setup.api';
import { IAuthUser } from '@/shared/models/domain/auth/auth.user.domain';
import { IPartnerProfileSetup } from '@/shared/models/domain/partner/profile.setup.domain';

export class PartnerProfileSetupController {
  constructor(
    private readonly partnerProfileSetupService: PartnerProfileSetupService
  ) {}

  /**
   * Complete partner profile setup
   * @param req Request with profile setup data
   * @param res Response with profile setup result
   */
  async completeProfileSetup(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as IAuthUser;
      const setupData = req.body as IPartnerProfileSetup;

      logger.info('Partner profile setup request received', {
        userId: user.id,
        context: 'PartnerProfileSetupController.completeProfileSetup',
      });

      const result = await this.partnerProfileSetupService.completeProfileSetup(
        user.id,
        setupData
      );

      const response: IPartnerProfileSetupApiResponse = {
        success: true,
        message: result.message,
        data: result,
      };

      logger.info('Partner profile setup completed successfully', {
        userId: user.id,
        context: 'PartnerProfileSetupController.completeProfileSetup',
      });

      res.status(200).json(response);
    } catch (error) {
      logger.error('Partner profile setup failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        context: 'PartnerProfileSetupController.completeProfileSetup',
      });

      res.status(500).json({
        success: false,
        message: 'Failed to complete profile setup',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Check if partner profile setup is required
   * @param req Request with user info
   * @param res Response with setup requirement status
   */
  async isProfileSetupRequired(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as IAuthUser;

      logger.info('Checking partner profile setup requirement', {
        userId: user.id,
        context: 'PartnerProfileSetupController.isProfileSetupRequired',
      });

      const result =
        await this.partnerProfileSetupService.isProfileSetupRequired(user.id);

      const response: IPartnerProfileSetupRequiredApiResponse = {
        success: true,
        message: 'Profile setup requirement checked',
        data: result,
      };

      logger.info('Partner profile setup requirement checked', {
        userId: user.id,
        required: result.required,
        context: 'PartnerProfileSetupController.isProfileSetupRequired',
      });

      res.status(200).json(response);
    } catch (error) {
      logger.error('Failed to check partner profile setup requirement', {
        error: error instanceof Error ? error.message : 'Unknown error',
        context: 'PartnerProfileSetupController.isProfileSetupRequired',
      });

      res.status(500).json({
        success: false,
        message: 'Failed to check profile setup requirement',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
