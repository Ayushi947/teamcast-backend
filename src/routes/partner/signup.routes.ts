import express from 'express';
import { PartnerSignupController } from '@/controllers/partner/signup.controller';
import { PartnerSignupService } from '@/services/partner/signup.service';
import { partnerSignupValidator } from '@/shared/validators/partner/signup.validator';
import { validateRequest } from '@/middleware';
import { NotificationFactory } from '@/services/notification/notification.factory';
import { VerifyService } from '@/services/auth/verify.service';

const router = express.Router();

// Services
const notificationProvider =
  new NotificationFactory().getNotificationProvider();
const verifyService = new VerifyService(notificationProvider);

const partnerSignupService = new PartnerSignupService(
  notificationProvider,
  verifyService
);

// Controllers
const partnerSignupController = new PartnerSignupController(
  partnerSignupService
);

/**
 * @openapi
 * /partner/signup:
 *   post:
 *     summary: Sign up a new partner user
 *     description: Create a new partner user account
 *     tags:
 *       - Partner
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IPartnerSignup'
 *     responses:
 *       201:
 *         description: Partner user created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerSignupApiResponse'
 */

router.post(
  '/signup',
  validateRequest(partnerSignupValidator),
  partnerSignupController.signup
);

export default router;
