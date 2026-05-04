import { Router } from 'express';
import { JobAiAssessmentGlobalSettingsController } from '@/controllers/support/job.ai.assessment.global.settings.controller';
import { JobAiAssessmentGlobalSettingsService } from '@/services/support/job.ai.assessment.global.settings.service';
import {
  requireActiveUser,
  requireAuth,
  requireRole,
  requireUserType,
} from '@/middleware';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';

const router = Router();

const jobAiAssessmentGlobalSettingsService =
  new JobAiAssessmentGlobalSettingsService();
const jobAiAssessmentGlobalSettingsController =
  new JobAiAssessmentGlobalSettingsController(
    jobAiAssessmentGlobalSettingsService
  );

const adminAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireRole([UserRoleEnum.ADMIN]),
  requireUserType([UserTypeEnum.SUPPORT]),
];

/**
 * @openapi
 * /support/job-ai-assessment-global-settings:
 *   get:
 *     summary: Get global job AI assessment settings
 *     description: Retrieves the global settings for job AI assessments
 *     tags:
 *       - Support
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 greetingMessage:
 *                   type: string
 *                 defaultAssessmentDuration:
 *                   type: number
 *                 defaultPassingScore:
 *                   type: number
 *                 requiredSections:
 *                   type: array
 *                   items:
 *                     type: string
 *                 maximumAttempts:
 *                   type: number
 *                 cooldownPeriod:
 *                   type: number
 *                 maxAssessmentDuration:
 *                   type: number
 *                 assessmentBuffer:
 *                   type: number
 *                 useCustomPrompts:
 *                   type: boolean
 *                 aiDifficulty:
 *                   type: string
 *                 maxSections:
 *                   type: number
 *                 maxQuestionsPerSection:
 *                   type: number
 *                 proctoringEnabled:
 *                   type: boolean
 *                 maxWarnings:
 *                   type: number
 *                 tabSwitchLimit:
 *                   type: number
 *                 copyPasteAllowed:
 *                   type: boolean
 *                 videoRecordingEnabled:
 *                   type: boolean
 *                 minimumVideoLength:
 *                   type: number
 *                 aiVideoAnalysisEnabled:
 *                   type: boolean
 *                 autoPublishOnSuccess:
 *                   type: boolean
 *                 autoNotifyOnComplete:
 *                   type: boolean
 *                 interviewLanguage:
 *                   type: string
 *                 interviewDialect:
 *                   type: string
 *                 interviewVoiceGender:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get(
  '/',
  adminAuthMiddleware,
  jobAiAssessmentGlobalSettingsController.getGlobalJobAiAssessmentSettings
);

/**
 * @openapi
 * /support/job-ai-assessment-global-settings:
 *   patch:
 *     summary: Update global job AI assessment settings
 *     description: Updates the global settings for job AI assessments
 *     tags:
 *       - Support
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               greetingMessage:
 *                 type: string
 *               defaultAssessmentDuration:
 *                 type: number
 *               defaultPassingScore:
 *                 type: number
 *               requiredSections:
 *                 type: array
 *                 items:
 *                   type: string
 *               maximumAttempts:
 *                 type: number
 *               cooldownPeriod:
 *                 type: number
 *               maxAssessmentDuration:
 *                 type: number
 *               assessmentBuffer:
 *                 type: number
 *               useCustomPrompts:
 *                 type: boolean
 *               aiDifficulty:
 *                 type: string
 *               maxSections:
 *                 type: number
 *               maxQuestionsPerSection:
 *                 type: number
 *               proctoringEnabled:
 *                 type: boolean
 *               maxWarnings:
 *                 type: number
 *               tabSwitchLimit:
 *                 type: number
 *               copyPasteAllowed:
 *                 type: boolean
 *               videoRecordingEnabled:
 *                 type: boolean
 *               minimumVideoLength:
 *                 type: number
 *               aiVideoAnalysisEnabled:
 *                 type: boolean
 *               autoPublishOnSuccess:
 *                 type: boolean
 *               autoNotifyOnComplete:
 *                 type: boolean
 *               interviewLanguage:
 *                 type: string
 *               interviewDialect:
 *                 type: string
 *               interviewVoiceGender:
 *                 type: string
 *                 enum: [female, male]
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.patch(
  '/',
  adminAuthMiddleware,
  jobAiAssessmentGlobalSettingsController.updateGlobalJobAiAssessmentSettings
);

export default router;
