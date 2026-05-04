import { Router } from 'express';
import { CandidatesReminderController } from '@/controllers/support/candidates.reminder.controller';
import {
  requireAuth,
  requireRole,
  validateRequest,
  requireUserType,
} from '@/middleware';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';
import { sendOnboardingReminderValidator } from '@/shared/validators/support/candidates.reminder.validator';

const router = Router();

const candidatesReminderController = new CandidatesReminderController();

const supportAuthMiddleware = [
  requireAuth,
  requireRole([
    UserRoleEnum.ADMIN,
    UserRoleEnum.RECRUITER,
    UserRoleEnum.ACCOUNT_MANAGER,
    UserRoleEnum.HR,
    UserRoleEnum.TECHNICAL_SUPPORT,
  ]),
  requireUserType([UserTypeEnum.SUPPORT]),
];

/**
 * @openapi
 * /support/candidates/send-onboarding-reminder:
 *   post:
 *     summary: Send onboarding assessment reminder
 *     description: Send a reminder email to a candidate who has completed resume assessment but not onboarding assessment
 *     tags:
 *       - Support Candidates
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - candidateId
 *             properties:
 *               candidateId:
 *                 type: string
 *                 format: uuid
 *                 description: Unique identifier for the candidate
 *     responses:
 *       200:
 *         description: Reminder email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Onboarding assessment reminder sent successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     candidateEmail:
 *                       type: string
 *                       example: candidate@example.com
 *                     candidateName:
 *                       type: string
 *                       example: John Doe
 *       400:
 *         description: Bad request - resume not completed or onboarding already completed
 *       404:
 *         description: Candidate not found
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.post(
  '/send-onboarding-reminder',
  [...supportAuthMiddleware, validateRequest(sendOnboardingReminderValidator)],
  candidatesReminderController.sendOnboardingAssessmentReminder
);

export default router;
