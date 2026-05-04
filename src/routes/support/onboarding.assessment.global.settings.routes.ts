import { Router } from 'express';
import { OnboardingAssessmentGlobalSettingsController } from '@/controllers/support/onboarding.assessment.global.settings.controller';
import { OnboardingAssessmentGlobalSettingsService } from '@/services/support/onboarding.assessment.global.settings.service';
import {
  requireActiveUser,
  requireAuth,
  requireRole,
  requireUserType,
} from '@/middleware';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';

const router = Router();

const onboardingAssessmentGlobalSettingsService =
  new OnboardingAssessmentGlobalSettingsService();
const onboardingAssessmentGlobalSettingsController =
  new OnboardingAssessmentGlobalSettingsController(
    onboardingAssessmentGlobalSettingsService
  );

const adminAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireRole([UserRoleEnum.ADMIN]),
  requireUserType([UserTypeEnum.SUPPORT]),
];

/**
 * @openapi
 * /support/onboarding-assessment-global-settings:
 *   get:
 *     summary: Get global onboarding assessment settings
 *     description: Retrieves the global settings for onboarding assessments
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
  onboardingAssessmentGlobalSettingsController.getGlobalOnboardingAssessmentSettings
);

/**
 * @openapi
 * /support/onboarding-assessment-global-settings:
 *   patch:
 *     summary: Update global onboarding assessment settings
 *     description: Updates the global settings for onboarding assessments
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
  onboardingAssessmentGlobalSettingsController.updateGlobalOnboardingAssessmentSettings
);

export default router;
