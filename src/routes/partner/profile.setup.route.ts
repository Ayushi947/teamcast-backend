import { Router } from 'express';
import { PartnerProfileSetupController } from '@/controllers/partner/profile.setup.controller';
import { PartnerProfileSetupService } from '@/services/partner/profile.setup.service';
import { PartnerProfileService } from '@/services/partner/profile.service';
import { requireAuth } from '@/middleware/auth.middleware';
import { validateRequest } from '@/middleware/validate.request.middleware';
import {
  partnerProfileSetupValidator,
  partnerProfileSetupRequiredValidator,
} from '@/shared/validators/partner/profile.setup.validator';
import { allowProfileSetupRoutes } from '@/middleware/profile.setup.middleware';

const router = Router();

// Initialize services
const partnerProfileService = new PartnerProfileService();
const partnerProfileSetupService = new PartnerProfileSetupService(
  partnerProfileService
);

// Initialize controller
const partnerProfileSetupController = new PartnerProfileSetupController(
  partnerProfileSetupService
);

/**
 * @openapi
 * /api/partner/profile-setup:
 *   post:
 *     summary: Complete partner profile setup
 *     description: Complete the profile setup for a partner user
 *     tags:
 *       - Partner Profile Setup
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IPartnerProfileSetup'
 *     responses:
 *       200:
 *         description: Profile setup completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerProfileSetupApiResponse'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
  '/',
  requireAuth,
  allowProfileSetupRoutes,
  validateRequest(partnerProfileSetupValidator),
  partnerProfileSetupController.completeProfileSetup.bind(
    partnerProfileSetupController
  )
);

/**
 * @openapi
 * /api/partner/profile-setup/required:
 *   get:
 *     summary: Check if profile setup is required
 *     description: Check if the partner user needs to complete profile setup
 *     tags:
 *       - Partner Profile Setup
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile setup requirement status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerProfileSetupRequiredApiResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/required',
  requireAuth,
  allowProfileSetupRoutes,
  validateRequest(partnerProfileSetupRequiredValidator),
  partnerProfileSetupController.isProfileSetupRequired.bind(
    partnerProfileSetupController
  )
);

export default router;
