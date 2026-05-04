import { Router } from 'express';
import { PracticeAssessmentSettingsController } from '@/controllers/support/practice.assessment.settings.controller';
import { PublicPracticeAssessmentService } from '@/services/candidate/public.practice.assessment.service';
import { StorageFactory } from '@/services/helpers/storage/storage.factory';
import {
  requireActiveUser,
  requireAuth,
  requireRole,
  requireUserType,
} from '@/middleware';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';

const router = Router();

const storageProvider = StorageFactory.getInstance().getProvider();
const publicPracticeAssessmentService = new PublicPracticeAssessmentService(
  storageProvider
);
const practiceAssessmentSettingsController =
  new PracticeAssessmentSettingsController(publicPracticeAssessmentService);

const adminAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireRole([UserRoleEnum.ADMIN]),
  requireUserType([UserTypeEnum.SUPPORT]),
];

/**
 * @openapi
 * /support/practice-assessment-settings:
 *   get:
 *     summary: Get global practice assessment settings
 *     description: Retrieves the global settings for practice assessments
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
  practiceAssessmentSettingsController.getGlobalPracticeAssessmentSettings
);

/**
 * @openapi
 * /support/practice-assessment-settings:
 *   patch:
 *     summary: Update global practice assessment settings
 *     description: Updates the global settings for practice assessments
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
  practiceAssessmentSettingsController.updateGlobalPracticeAssessmentSettings
);

export default router;
