import { singleton } from '@/shared/decorators/singleton';
import { BaseController } from '../common/base.controller';
import { JobAiAssessmentGlobalSettingsService } from '@/services/support/job.ai.assessment.global.settings.service';
import { NextFunction, Request, Response } from 'express';

@singleton
export class JobAiAssessmentGlobalSettingsController extends BaseController {
  constructor(
    private readonly jobAiAssessmentGlobalSettingsService: JobAiAssessmentGlobalSettingsService
  ) {
    super();
  }

  /**
   * Get global job AI assessment settings
   */
  getGlobalJobAiAssessmentSettings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      return await this.jobAiAssessmentGlobalSettingsService.getGlobalJobAiAssessmentSettings();
    });
  };

  /**
   * Update global job AI assessment settings
   */
  updateGlobalJobAiAssessmentSettings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const data = req.body;
      return await this.jobAiAssessmentGlobalSettingsService.updateGlobalJobAiAssessmentSettings(
        data
      );
    });
  };
}
