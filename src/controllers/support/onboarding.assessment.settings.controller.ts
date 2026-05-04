import { singleton } from '@/shared/decorators/singleton';
import { BaseController } from '../common/base.controller';
import { OnboardingAssessmentService } from '@/services/candidate/onboarding.assessment.service';
import { NextFunction, Request, Response } from 'express';

@singleton
export class OnboardingAssessmentSettingsController extends BaseController {
  constructor(
    private readonly onboardingAssessmentService: OnboardingAssessmentService
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
      return await this.onboardingAssessmentService.getGlobalOnboardingAssessmentSettings();
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
      const { interviewLanguage, interviewDialect, interviewVoiceGender } =
        req.body;

      return await this.onboardingAssessmentService.updateGlobalOnboardingAssessmentSettings(
        {
          interviewLanguage,
          interviewDialect,
          interviewVoiceGender,
        }
      );
    });
  };
}
