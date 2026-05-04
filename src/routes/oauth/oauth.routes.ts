import { Router } from 'express';
import { validateRequest } from '@/middleware/validate.request.middleware';
import {
  oauthAuthUrlValidator,
  oauthCallbackValidator,
} from '@/shared/validators/oauth/oauth.validators';
import { OAuthController } from '@/controllers/oauth/oauth.controller';
import { OAuthService } from '@/services/oauth/oauth.service';
import { CandidateSignupService } from '@/services/candidate/signup.service';
import { ClientSignupService } from '@/services/client/signup.service';
import { PartnerSignupService } from '@/services/partner/signup.service';
import { NotificationFactory } from '@/services/notification/notification.factory';
import { PaymentFactory } from '@/services/subscription/payment.factory';
import { CandidateSubscriptionService } from '@/services/candidate/subscription.service';
import { CandidateProfileSettingsService } from '@/services/candidate/profile.settings.service';
import { CandidateResumeService } from '@/services/candidate/resume.service';
import { ClientSubscriptionService } from '@/services/client/subscription.service';
import { ClientProfileService } from '@/services/client/profile.service';
import { StorageFactory } from '@/services/helpers/storage/storage.factory';
import { CandidateProfileService } from '@/services/candidate/profile.service';
import { AccountManagerAssignmentService } from '@/services/support/account.manager.assignment.service';
import { NodemailerProvider } from '@/services/notification/nodemailer.service';
import { VerifyService } from '@/services/auth/verify.service';

const router = Router();

// Initialize OAuth service and controller with proper dependency injection
const notificationProvider =
  new NotificationFactory().getNotificationProvider();
const paymentFactory = new PaymentFactory();
const storageService = StorageFactory.getInstance().getProvider();

// Initialize candidate signup dependencies
const candidateSubscriptionService = new CandidateSubscriptionService(
  paymentFactory
);
const candidateProfileSettingsService = new CandidateProfileSettingsService();
const candidateProfileService = new CandidateProfileService(storageService);
const candidateResumeService = new CandidateResumeService(
  candidateProfileService,
  storageService
);
const verifyService = new VerifyService(notificationProvider);

const candidateSignupService = new CandidateSignupService(
  notificationProvider,
  candidateSubscriptionService,
  candidateProfileSettingsService,
  candidateResumeService,
  verifyService
);

// Initialize client signup dependencies
const nodemailerProvider = new NodemailerProvider();
const clientSubscriptionService = new ClientSubscriptionService(
  paymentFactory,
  nodemailerProvider
);
const clientProfileService = new ClientProfileService();
const accountManagerAssignmentService = new AccountManagerAssignmentService();
const clientSignupService = new ClientSignupService(
  notificationProvider,
  clientSubscriptionService,
  clientProfileService,
  accountManagerAssignmentService,
  verifyService
);

// Initialize partner signup dependencies
const partnerSignupService = new PartnerSignupService(
  notificationProvider,
  verifyService
);

// Initialize OAuth service and controller
const oauthService = new OAuthService(
  candidateSignupService,
  clientSignupService,
  partnerSignupService
);

const oauthController = new OAuthController(oauthService);

/**
 * @openapi
 * /oauth/providers:
 *   get:
 *     summary: Get available OAuth providers
 *     description: Returns list of supported OAuth providers for authentication
 *     tags:
 *       - OAuth
 *     responses:
 *       200:
 *         description: OAuth providers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IOAuthProvidersApiResponse'
 *       500:
 *         description: Internal server error
 */
router.get('/providers', (req, res, next) => {
  oauthController.getProviders(req, res, next);
});

/**
 * @openapi
 * /oauth/{provider}/auth-url:
 *   get:
 *     summary: Get OAuth authorization URL
 *     description: Generate OAuth authorization URL for the specified provider with optional user type and return URL
 *     tags:
 *       - OAuth
 *     parameters:
 *       - name: provider
 *         in: path
 *         required: true
 *         description: OAuth provider (google or github)
 *         schema:
 *           type: string
 *           enum: [google, github]
 *       - name: userType
 *         in: query
 *         required: false
 *         description: User type for OAuth flow
 *         schema:
 *           type: string
 *           enum: [candidate, client, partner, support]
 *       - name: returnUrl
 *         in: query
 *         required: false
 *         description: URL to return to after OAuth completion
 *         schema:
 *           type: string
 *           format: uri
 *       - name: state
 *         in: query
 *         required: false
 *         description: OAuth state parameter for CSRF protection
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OAuth authorization URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IOAuthAuthUrlApiResponse'
 *       400:
 *         description: Invalid provider or parameters
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:provider/auth-url',
  validateRequest(oauthAuthUrlValidator),
  (req, res, next) => {
    oauthController.getAuthUrl(req, res, next);
  }
);

/**
 * @openapi
 * /oauth/{provider}/callback:
 *   get:
 *     summary: Handle OAuth callback
 *     description: Process OAuth callback from provider and complete authentication
 *     tags:
 *       - OAuth
 *     parameters:
 *       - name: provider
 *         in: path
 *         required: true
 *         description: OAuth provider (google or github)
 *         schema:
 *           type: string
 *           enum: [google, github]
 *       - name: code
 *         in: query
 *         required: true
 *         description: Authorization code from OAuth provider
 *         schema:
 *           type: string
 *       - name: state
 *         in: query
 *         required: false
 *         description: OAuth state parameter for CSRF protection
 *         schema:
 *           type: string
 *       - name: error
 *         in: query
 *         required: false
 *         description: Error from OAuth provider
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OAuth authentication completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IOAuthCallbackApiResponse'
 *       400:
 *         description: Invalid callback parameters
 *       401:
 *         description: OAuth authentication failed
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:provider/callback',
  validateRequest(oauthCallbackValidator),
  (req, res, next) => {
    oauthController.handleCallback(req, res, next);
  }
);

export default router;
