import { Router } from 'express';
import { OnboardingAssessmentSettingsController } from '@/controllers/support/onboarding.assessment.settings.controller';
import { OnboardingAssessmentService } from '@/services/candidate/onboarding.assessment.service';
import { OnboardingAssessmentFactory } from '@/services/helpers/ai.onboarding.assessment/onboarding.assessment.factory';
import { StorageFactory } from '@/services/helpers/storage/storage.factory';
import {
  requireActiveUser,
  requireAuth,
  requireRole,
  requireUserType,
} from '@/middleware';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';

const router = Router();

const onboardingAssessmentProvider =
  OnboardingAssessmentFactory.getInstance().getProvider();
const storageProvider = StorageFactory.getInstance().getProvider();
const onboardingAssessmentService = new OnboardingAssessmentService(
  onboardingAssessmentProvider,
  storageProvider
);
const onboardingAssessmentSettingsController =
  new OnboardingAssessmentSettingsController(onboardingAssessmentService);

const adminAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireRole([UserRoleEnum.ADMIN]),
  requireUserType([UserTypeEnum.SUPPORT]),
];

/**
 * @openapi
 * /support/onboarding-assessment-settings:
 *   get:
 *     summary: Get global onboarding assessment settings
 *     description: Retrieves the global voice settings for onboarding assessments
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
 *                 interviewLanguage:
 *                   type: string
 *                   example: "ENGLISH"
 *                 interviewDialect:
 *                   type: string
 *                   example: "en-US"
 *                 interviewVoiceGender:
 *                   type: string
 *                   example: "female"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get(
  '/',
  adminAuthMiddleware,
  onboardingAssessmentSettingsController.getGlobalOnboardingAssessmentSettings
);

/**
 * @openapi
 * /support/onboarding-assessment-settings:
 *   patch:
 *     summary: Update global onboarding assessment settings
 *     description: Updates the global voice settings for onboarding assessments
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
 *               interviewLanguage:
 *                 type: string
 *                 example: "ENGLISH"
 *               interviewDialect:
 *                 type: string
 *                 example: "en-US"
 *               interviewVoiceGender:
 *                 type: string
 *                 enum: [female, male]
 *                 example: "female"
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 interviewLanguage:
 *                   type: string
 *                   example: "ENGLISH"
 *                 interviewDialect:
 *                   type: string
 *                   example: "en-US"
 *                 interviewVoiceGender:
 *                   type: string
 *                   example: "female"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.patch(
  '/',
  adminAuthMiddleware,
  onboardingAssessmentSettingsController.updateGlobalOnboardingAssessmentSettings
);

export default router;
