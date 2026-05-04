import { Router } from 'express';
import { CandidateProfileSettingsController } from '@/controllers/candidate/profile.settings.controller';
import { CandidateProfileSettingsService } from '@/services/candidate/profile.settings.service';
import {
  requireAuth,
  requireActiveUser,
  validateRequest,
  requireCandidateAccess,
} from '@/middleware';
import {
  candidateSettingsUpdateValidator,
  candidatePreferencesUpdateValidator,
} from '@/shared/validators/candidate/profile.settings.validator';

const router = Router();

// Initialize services and controller
const candidateProfileSettingsService = new CandidateProfileSettingsService();
const candidateProfileSettingsController =
  new CandidateProfileSettingsController(candidateProfileSettingsService);

// Candidate auth middleware - applies to all profile settings routes
const candidateAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireCandidateAccess,
];

/**
 * @openapi
 * /candidate/settings/settings:
 *   get:
 *     summary: Get candidate settings
 *     description: Retrieves the settings for the authenticated candidate.
 *     tags:
 *       - Candidate Profile Settings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Candidate settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateSettingsGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get(
  '/settings',
  [...candidateAuthMiddleware],
  candidateProfileSettingsController.getSettings
);

/**
 * @openapi
 * /candidate/settings/settings:
 *   patch:
 *     summary: Update candidate settings
 *     description: Updates the settings for the authenticated candidate.
 *     tags:
 *       - Candidate Profile Settings
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ICandidateSettingsUpdate'
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateSettingsUpdateApiResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.patch(
  '/settings',
  [
    ...candidateAuthMiddleware,
    validateRequest(candidateSettingsUpdateValidator),
  ],
  candidateProfileSettingsController.updateSettings
);

/**
 * @openapi
 * /candidate/settings/preferences:
 *   get:
 *     summary: Get candidate preferences
 *     description: Retrieves the preferences for the authenticated candidate.
 *     tags:
 *       - Candidate Profile Settings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Candidate preferences retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidatePreferencesGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get(
  '/preferences',
  [...candidateAuthMiddleware],
  candidateProfileSettingsController.getPreferences
);

/**
 * @openapi
 * /candidate/settings/preferences:
 *   patch:
 *     summary: Update candidate preferences
 *     description: Updates the preferences for the authenticated candidate.
 *     tags:
 *       - Candidate Profile Settings
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ICandidatePreferencesUpdate'
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidatePreferencesUpdateApiResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.patch(
  '/preferences',
  [
    ...candidateAuthMiddleware,
    validateRequest(candidatePreferencesUpdateValidator),
  ],
  candidateProfileSettingsController.updatePreferences
);

export default router;
