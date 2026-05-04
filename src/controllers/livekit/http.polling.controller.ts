import { Request, Response, NextFunction } from 'express';
import { BaseController } from '@/controllers/common/base.controller';
import { LiveKitHttpPollingService } from '@/services/livekit/http.polling.service';
import { ISubmitAnswerRequest } from '@/shared/models/domain/livekit/http.polling.domain';
import { logger } from '@/shared/utils/logger';
import { IOnboardingAssessmentProvider } from '@/services/helpers/ai.onboarding.assessment/onboarding.assessment.provider';
import { IStorageProvider } from '@/services/helpers/storage/storage.interface';

export class LiveKitHttpPollingController extends BaseController {
  private pollingService: LiveKitHttpPollingService;

  constructor(
    onboardingAssessmentProvider: IOnboardingAssessmentProvider,
    storageProvider: IStorageProvider
  ) {
    super();
    this.pollingService = new LiveKitHttpPollingService(
      onboardingAssessmentProvider,
      storageProvider
    );
  }

  /**
   * GET /api/livekit/assessment/:assessmentId/next-question
   * Agent polls this to get next question
   */
  getNextQuestion = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const { assessmentId } = req.params;

      logger.info('Agent polling for next question', {
        assessmentId,
        context: 'LiveKitHttpPollingController.getNextQuestion',
      });

      return await this.pollingService.getNextQuestion(assessmentId);
    });
  };

  /**
   * POST /api/livekit/assessment/:assessmentId/answer
   * Agent submits answer here
   */
  submitAnswer = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const { assessmentId } = req.params;

      logger.info('Agent submitting answer', {
        assessmentId,
        questionId: req.body.questionId,
        context: 'LiveKitHttpPollingController.submitAnswer',
      });

      const request: ISubmitAnswerRequest = {
        assessmentId,
        ...req.body,
      };

      return await this.pollingService.submitAnswer(request);
    });
  };
}
