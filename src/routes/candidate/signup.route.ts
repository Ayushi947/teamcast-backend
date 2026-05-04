import express from 'express';
import { CandidateSignupController } from '@/controllers/candidate/signup.controller';
import { CandidateSignupService } from '@/services/candidate/signup.service';
import { candidateSignupValidator } from '@/shared/validators/candidate/signup.validator';
import { validateRequest } from '@/middleware';
import { CandidateSubscriptionService } from '@/services/candidate/subscription.service';
import { NotificationFactory } from '@/services/notification/notification.factory';
import { PaymentFactory } from '@/services/subscription/payment.factory';
import { CandidateProfileSettingsService } from '@/services/candidate/profile.settings.service';
import { CandidateResumeService } from '@/services/candidate/resume.service';
import { StorageFactory } from '@/services/helpers/storage/storage.factory';
import { CandidateProfileService } from '@/services/candidate/profile.service';
import { VerifyService } from '@/services/auth/verify.service';

const router = express.Router();

// Services
const notificationProvider =
  new NotificationFactory().getNotificationProvider();
const subscriptionService = new CandidateSubscriptionService(
  new PaymentFactory()
);
const storageService = StorageFactory.getInstance().getProvider();
const profileService = new CandidateProfileService(storageService);
const candidateProfileSettingsService = new CandidateProfileSettingsService();

const resumeService = new CandidateResumeService(
  profileService,
  storageService
);

const verifyService = new VerifyService(notificationProvider);

const candidateSignupService = new CandidateSignupService(
  notificationProvider,
  subscriptionService,
  candidateProfileSettingsService,
  resumeService,
  verifyService
);

// Controllers
const candidateSignupController = new CandidateSignupController(
  candidateSignupService
);

/**
 * @openapi
 * /candidate/signup:
 *   post:
 *     summary: Sign up a new candidate user
 *     description: Create a new candidate user account
 *     tags:
 *       - Candidate
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ICandidateSignup'
 *     responses:
 *       201:
 *         description: Candidate user created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateSignupApiResponse'
 */

router.post(
  '/signup',
  validateRequest(candidateSignupValidator),
  candidateSignupController.signup
);

export default router;
