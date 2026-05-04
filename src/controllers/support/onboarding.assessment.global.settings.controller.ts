import { singleton } from '@/shared/decorators/singleton';
import { BaseController } from '../common/base.controller';
import { OnboardingAssessmentGlobalSettingsService } from '@/services/support/onboarding.assessment.global.settings.service';
import { NextFunction, Request, Response } from 'express';

@singleton
export class OnboardingAssessmentGlobalSettingsController extends BaseController {
  constructor(
    private readonly onboardingAssessmentGlobalSettingsService: OnboardingAssessmentGlobalSettingsService
  ) {
    super();
  }

  /**
   * Get global onboarding assessment settings
   */
  getGlobalOnboardingAssessmentSettings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      return await this.onboardingAssessmentGlobalSettingsService.getGlobalOnboardingAssessmentSettings();
    });
  };

  /**
   * Update global onboarding assessment settings
   */
  updateGlobalOnboardingAssessmentSettings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const data = req.body;
      return await this.onboardingAssessmentGlobalSettingsService.updateGlobalOnboardingAssessmentSettings(
        data
      );
    });
  };
}
