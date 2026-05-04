import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../common/base.controller';
import { FeatureFlagService } from '@/services/support/feature.flag.service';

/**
 * Controller for the feature flag schedule cron job.
 * Processes due scheduled enable/disable actions.
 */
export class FeatureFlagScheduleCronController extends BaseController {
  constructor(private readonly featureFlagService: FeatureFlagService) {
    super();
  }

  /**
   * Process due feature flag schedules (enable/disable at scheduled time).
   * Invoke from a cron job every minute.
   */
  processDueSchedules = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      return await this.featureFlagService.processDueSchedules();
    });
  };
}
