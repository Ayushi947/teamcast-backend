import { Router } from 'express';
import { PartnerProfileController } from '@/controllers/partner/profile.controller';
import { PartnerProfileService } from '@/services/partner/profile.service';
import { requireAuth, requireActiveUser } from '@/middleware';

const router = Router();

// Initialize services and controller
const partnerProfileService = new PartnerProfileService();
const partnerProfileController = new PartnerProfileController(
  partnerProfileService
);

// Basic auth middleware - any authenticated user can access
const authMiddleware = [requireAuth, requireActiveUser];

/**
 * @openapi
 * /partner/profile/{partnerId}:
 *   get:
 *     summary: Get partner profile by ID
 *     description: Retrieves the full partner profile by ID
 *     tags:
 *       - Partner Profile
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partnerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The partner ID
 *     responses:
 *       200:
 *         description: Partner profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerProfileGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Partner profile not found
 */
router.get(
  '/:partnerId',
  authMiddleware,
  partnerProfileController.getProfileById
);

export default router;
