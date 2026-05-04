import { Request, Response } from 'express';
import { CandidatesReminderService } from '@/services/support/candidates.reminder.service';
import { logger } from '@/shared/utils/logger';
import { ISendOnboardingReminderRequest } from '@/shared/models/api/support/candidates.reminder.api';

export class CandidatesReminderController {
  private readonly candidatesReminderService: CandidatesReminderService;

  constructor() {
    this.candidatesReminderService = new CandidatesReminderService();
  }

  sendOnboardingAssessmentReminder = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { candidateId } = req.body as ISendOnboardingReminderRequest;

      logger.info('Received onboarding assessment reminder request', {
        context:
          'CandidatesReminderController.sendOnboardingAssessmentReminder',
        candidateId,
      });

      const result =
        await this.candidatesReminderService.sendOnboardingAssessmentReminder(
          candidateId
        );

      if (!result.success) {
        // Determine appropriate status code based on error message
        let statusCode = 400;
        if (result.message === 'Candidate not found') {
          statusCode = 404;
        }

        res.status(statusCode).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      logger.error('Error in sendOnboardingAssessmentReminder controller', {
        context:
          'CandidatesReminderController.sendOnboardingAssessmentReminder',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };
}
