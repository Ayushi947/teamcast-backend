import express from 'express';
import { ClientSignupController } from '@/controllers/client/signup.controller';
import { ClientSignupService } from '@/services/client/signup.service';
import { clientSignupValidator } from '@/shared/validators/client/signup.validator';
import { validateRequest } from '@/middleware';
import { NotificationFactory } from '@/services/notification/notification.factory';
import { PaymentFactory } from '@/services/subscription/payment.factory';
import { ClientSubscriptionService } from '@/services/client/subscription.service';
import { ClientProfileService } from '@/services/client/profile.service';
import { NodemailerProvider } from '@/services/notification/nodemailer.service';
import { AccountManagerAssignmentService } from '@/services/support/account.manager.assignment.service';
import { VerifyService } from '@/services/auth/verify.service';

const router = express.Router();

// Services
const notificationProvider =
  new NotificationFactory().getNotificationProvider();
const nodemailerProvider = new NodemailerProvider();
const subscriptionService = new ClientSubscriptionService(
  new PaymentFactory(),
  nodemailerProvider
);

const clientProfileService = new ClientProfileService();
const accountManagerAssignmentService = new AccountManagerAssignmentService();
const verifyService = new VerifyService(notificationProvider);

const clientSignupService = new ClientSignupService(
  notificationProvider,
  subscriptionService,
  clientProfileService,
  accountManagerAssignmentService,
  verifyService
);

// Controllers
const clientSignupController = new ClientSignupController(clientSignupService);

/**
 * @openapi
 * /client/signup:
 *   post:
 *     summary: Sign up a new client user
 *     description: Create a new client user account
 *     tags:
 *       - Client
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IClientSignup'
 *     responses:
 *       201:
 *         description: Client user created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientSignupApiResponse'
 */

router.post(
  '/signup',
  validateRequest(clientSignupValidator),
  clientSignupController.signup
);

export default router;
