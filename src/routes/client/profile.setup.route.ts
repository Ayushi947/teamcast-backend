import { Router } from 'express';
import { ClientProfileSetupController } from '@/controllers/client/profile.setup.controller';
import { ClientProfileSetupService } from '@/services/client/profile.setup.service';
import { ClientSubscriptionService } from '@/services/client/subscription.service';
import { ClientProfileService } from '@/services/client/profile.service';
import { PaymentFactory } from '@/services/subscription/payment.factory';
import { NodemailerProvider } from '@/services/notification/nodemailer.service';
import {
  clientProfileSetupValidator,
  clientProfileSetupRequiredValidator,
} from '@/shared/validators/client/profile.setup.validator';
import { requireAuth } from '@/middleware/auth.middleware';
import { validateRequest } from '@/middleware/validate.request.middleware';
import { allowProfileSetupRoutes } from '@/middleware/profile.setup.middleware';

const router = Router();

// Initialize services
const paymentFactory = new PaymentFactory();
const nodemailerProvider = new NodemailerProvider();
const clientSubscriptionService = new ClientSubscriptionService(
  paymentFactory,
  nodemailerProvider
);
const clientProfileService = new ClientProfileService();
const clientProfileSetupService = new ClientProfileSetupService(
  clientSubscriptionService,
  clientProfileService
);

// Initialize controller
const clientProfileSetupController = new ClientProfileSetupController(
  clientProfileSetupService
);

/**
 * @openapi
 * /api/client/profile-setup:
 *   post:
 *     summary: Complete client profile setup
 *     description: Complete the profile setup for a client user
 *     tags:
 *       - Client Profile Setup
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IClientProfileSetup'
 *     responses:
 *       200:
 *         description: Profile setup completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientProfileSetupApiResponse'
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
  validateRequest(clientProfileSetupValidator),
  clientProfileSetupController.completeProfileSetup.bind(
    clientProfileSetupController
  )
);

/**
 * @openapi
 * /api/client/profile-setup/required:
 *   get:
 *     summary: Check if profile setup is required
 *     description: Check if the client user needs to complete profile setup
 *     tags:
 *       - Client Profile Setup
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile setup requirement status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientProfileSetupRequiredApiResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/required',
  requireAuth,
  allowProfileSetupRoutes,
  validateRequest(clientProfileSetupRequiredValidator),
  clientProfileSetupController.isProfileSetupRequired.bind(
    clientProfileSetupController
  )
);

export default router;
