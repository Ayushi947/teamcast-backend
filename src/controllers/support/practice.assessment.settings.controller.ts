import { singleton } from '@/shared/decorators/singleton';
import { BaseController } from '../common/base.controller';
import { PublicPracticeAssessmentService } from '@/services/candidate/public.practice.assessment.service';
import { NextFunction, Request, Response } from 'express';

@singleton
export class PracticeAssessmentSettingsController extends BaseController {
  constructor(
    private readonly publicPracticeAssessmentService: PublicPracticeAssessmentService
  ) {
    super();
  }

  /**
   * Get global practice assessment settings
   */
  getGlobalPracticeAssessmentSettings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      return await this.publicPracticeAssessmentService.getGlobalPracticeAssessmentSettings();
    });
  };

  /**
   * Update global practice assessment settings
   */
  updateGlobalPracticeAssessmentSettings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const data = req.body;
      return await this.publicPracticeAssessmentService.updateGlobalPracticeAssessmentSettings(
        data
      );
    });
  };
}
