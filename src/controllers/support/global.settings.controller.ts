import { Request, Response, NextFunction } from 'express';
import { singleton } from '@/shared/decorators/singleton';
import { BaseController } from '../common/base.controller';
import { GlobalSettingsService } from '@/services/support/global.settings.service';
import { createIApiRequest } from '@/utils/api.request';
import {
  IGlobalSettingsGetApiResponse,
  IGlobalSettingsUpdateApiRequest,
  IGlobalSettingsUpdateApiResponse,
} from '@/shared/models/api/support/global.settings.api';

@singleton
export class GlobalSettingsController extends BaseController {
  constructor(private readonly globalSettingsService: GlobalSettingsService) {
    super();
  }

  /**
   * Get global settings
   */
  getGlobalSettings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IGlobalSettingsGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const settings = await this.globalSettingsService.getGlobalSettings();
        // Ensure we always return valid data
        if (!settings) {
          throw new Error('Global settings not found');
        }
        return settings;
      }
    );
  };

  /**
   * Update global settings
   */
  updateGlobalSettings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IGlobalSettingsUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const { data } =
          createIApiRequest<IGlobalSettingsUpdateApiRequest>(req);
        return await this.globalSettingsService.updateGlobalSettings(data);
      }
    );
  };
}
