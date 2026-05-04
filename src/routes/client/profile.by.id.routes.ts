import { Router } from 'express';
import { ClientProfileController } from '@/controllers/client/profile.controller';
import { ClientProfileService } from '@/services/client/profile.service';
import { requireAuth, requireActiveUser } from '@/middleware';

const router = Router();

// Initialize services and controller
const clientProfileService = new ClientProfileService();
const clientProfileController = new ClientProfileController(
  clientProfileService
);

// Basic auth middleware - any authenticated user can access
const authMiddleware = [requireAuth, requireActiveUser];

/**
 * @openapi
 * /client/profile/{clientId}:
 *   get:
 *     summary: Get client profile by ID
 *     description: Retrieves the full client profile by ID
 *     tags:
 *       - Client Profile
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: The client ID
 *     responses:
 *       200:
 *         description: Client profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientProfileGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Client profile not found
 */
router.get(
  '/:clientId',
  authMiddleware,
  clientProfileController.getProfileById
);

export default router;
