import prisma from '@/config/database';
import { logger } from '@/shared/utils/logger';
import { NodemailerProvider } from '@/services/notification/nodemailer.service';
import { ISendOnboardingReminderApiResponse } from '@/shared/models/api/support/candidates.reminder.api';
import { ENV } from '@/config/env';

export class CandidatesReminderService {
  private readonly nodemailerProvider: NodemailerProvider;

  constructor() {
    this.nodemailerProvider = new NodemailerProvider();
  }

  async sendOnboardingAssessmentReminder(
    candidateId: string
  ): Promise<ISendOnboardingReminderApiResponse> {
    try {
      logger.info('Sending onboarding assessment reminder', {
        context: 'CandidatesReminderService.sendOnboardingAssessmentReminder',
        candidateId,
      });

      // Fetch candidate with user info and assessments
      const candidate = await prisma.candidate.findUnique({
        where: { id: candidateId },
        include: {
          user: {
            select: {
              email: true,
              name: true,
            },
          },
          resumeAssessments: {
            where: {
              status: {
                in: [
                  'AI_REVIEW_COMPLETED',
                  'MANUAL_REVIEW_COMPLETED',
                  'ASSESSMENT_COMPLETED',
                ],
              },
            },
            orderBy: {
              completedAt: 'desc',
            },
            take: 1,
          },
          onboardingAssessments: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
      });

      // Validate candidate exists
      if (!candidate) {
        logger.warn('Candidate not found', {
          context: 'CandidatesReminderService.sendOnboardingAssessmentReminder',
          candidateId,
        });
        return {
          success: false,
          message: 'Candidate not found',
        };
      }

      // Check aggregated candidate assessment statuses first to avoid emailing fully completed candidates
      const hasCompletedResume =
        candidate.resumeAssessmentStatus === 'ASSESSMENT_COMPLETED';
      const hasCompletedOnboarding =
        candidate.onboardingAssessmentStatus === 'ASSESSMENT_COMPLETED';

      if (hasCompletedResume && hasCompletedOnboarding) {
        logger.warn('Candidate has completed both assessments', {
          context: 'CandidatesReminderService.sendOnboardingAssessmentReminder',
          candidateId,
          candidateEmail: candidate.user.email,
        });

        return {
          success: false,
          message:
            'Candidate has already completed both resume and onboarding assessments',
          data: {
            candidateEmail: candidate.user.email,
            candidateName: candidate.user.name,
          },
        };
      }

      // Check if onboarding assessment is already completed
      const onboardingAssessment = candidate.onboardingAssessments[0];
      if (
        onboardingAssessment &&
        onboardingAssessment.status === 'ASSESSMENT_COMPLETED'
      ) {
        logger.warn('Onboarding assessment already completed', {
          context: 'CandidatesReminderService.sendOnboardingAssessmentReminder',
          candidateId,
          candidateEmail: candidate.user.email,
        });
        return {
          success: false,
          message: 'Candidate has already completed onboarding assessment',
          data: {
            candidateEmail: candidate.user.email,
            candidateName: candidate.user.name,
          },
        };
      }

      // Generate assessment URL - redirect to resume page
      const frontendUrl = ENV.FRONTEND_URL || 'https://teamcast.ai';
      const assessmentUrl = `${frontendUrl}/app/candidate/resume`;

      // Format resume completed date (if available)
      const latestResumeAssessment = candidate.resumeAssessments?.[0];
      const resumeCompletedDate = latestResumeAssessment?.completedAt
        ? new Date(latestResumeAssessment.completedAt).toLocaleDateString(
            'en-US',
            {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }
          )
        : undefined;

      // Send reminder email
      await this.nodemailerProvider.sendOnboardingAssessmentReminderEmail(
        candidate.user.email,
        candidate.user.name,
        assessmentUrl,
        resumeCompletedDate
      );

      logger.info('Onboarding assessment reminder sent successfully', {
        context: 'CandidatesReminderService.sendOnboardingAssessmentReminder',
        candidateId,
        candidateEmail: candidate.user.email,
      });

      return {
        success: true,
        message: 'Onboarding assessment reminder sent successfully',
        data: {
          candidateEmail: candidate.user.email,
          candidateName: candidate.user.name,
        },
      };
    } catch (error) {
      logger.error('Failed to send onboarding assessment reminder', {
        context: 'CandidatesReminderService.sendOnboardingAssessmentReminder',
        candidateId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        message: 'Failed to send reminder email',
      };
    }
  }
}
