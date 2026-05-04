import { Router } from 'express';
import { AuthController } from '@/controllers/auth/auth.controller';
import { AuthService } from '@/services/auth/auth.service';
import {
  loginSchema,
  resetPasswordSchema,
  sendResetPasswordTokenSchema,
  setNewPasswordSchema,
  setPasswordByEmailSchema,
} from '@/shared/validators/auth/auth.validator';
import {
  sendOtpVerificationSchema,
  verifyOtpSchema,
} from '@/shared/validators/auth/otp.verification.validator';
import { requireAuth, validateRequest } from '@/middleware';
import { VerifyService } from '@/services/auth/verify.service';
import { VerifyController } from '@/controllers/auth/verify.controller';
import { NotificationFactory } from '@/services/notification/notification.factory';
import { ClientSubscriptionService } from '@/services/client/subscription.service';
import { PaymentFactory } from '@/services/subscription/payment.factory';
import { NodemailerProvider } from '@/services/notification/nodemailer.service';

const router = Router();

// Initialize services and controller
const notificationProvider =
  new NotificationFactory().getNotificationProvider();

const authService = new AuthService(
  notificationProvider,
  new ClientSubscriptionService(new PaymentFactory(), new NodemailerProvider())
);

const authController = new AuthController(authService);

const verifyService = new VerifyService(notificationProvider);
const verifyController = new VerifyController(verifyService);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Authenticate a user
 *     description: Log in with email and password to receive authentication tokens
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ILogin'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ILoginApiResponse'
 *       400:
 *         description: Invalid credentials or request
 *       429:
 *         description: Too many requests, please try again later
 */
router.post('/login', validateRequest(loginSchema), authController.login);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Refresh authentication token
 *     description: Refresh the authentication token
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IRefreshToken'
 *     responses:
 *       200:
 *         description: Authentication token refreshed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IRefreshTokenApiResponse'
 */
router.post('/refresh', authController.refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Invalidate current user session
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ILoggedOut'
 */
router.post('/logout', requireAuth, authController.logout);

/**
 * @openapi
 * /auth/send-otp-verification:
 *   post:
 *     summary: Send OTP for email verification
 *     description: Send a 6-digit OTP to the user's email for verification
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ISendOtpVerification'
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISendOtpVerificationApiResponse'
 *       400:
 *         description: Invalid email
 *       429:
 *         description: Too many requests, please try again later
 */
router.post(
  '/send-otp-verification',
  validateRequest(sendOtpVerificationSchema),
  verifyController.sendOtpVerification
);

/**
 * @openapi
 * /auth/verify-otp:
 *   post:
 *     summary: Verify OTP for email verification
 *     description: Verify the 6-digit OTP sent to the user's email
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IVerifyOtp'
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IVerifyOtpApiResponse'
 *       400:
 *         description: Invalid OTP
 *       404:
 *         description: OTP not found or expired
 */
router.post(
  '/verify-otp',
  validateRequest(verifyOtpSchema),
  verifyController.verifyOtp
);

/**
 * @openapi
 * /auth/send-reset-password-token:
 *   post:
 *     summary: Request password reset token
 *     description: Send a password reset token to the user
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ISendResetPasswordToken'
 *     responses:
 *       200:
 *         description: Password reset token sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISendResetPasswordTokenApiResponse'
 *       400:
 *         description: Invalid email
 *       429:
 *         description: Too many requests, please try again later
 */
router.post(
  '/send-reset-password-token',
  validateRequest(sendResetPasswordTokenSchema),
  authController.sendResetPasswordToken
);

/**
 * @openapi
 * /auth/reset-password/{token}:
 *   post:
 *     summary: Reset password
 *     description: Set a new password using reset token
 *     tags:
 *       - Authentication
 *     parameters:
 *       - $ref: '#/components/parameters/IResetPasswordTokenParams'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IResetPassword'
 *     responses:
 *       200:
 *         description: Password successfully reset
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IResetPasswordApiResponse'
 *       400:
 *         description: Invalid token or password
 */
router.post(
  '/reset-password/:token',
  validateRequest(resetPasswordSchema),
  authController.resetPassword
);

/**
 * @openapi
 * /auth/set-new-password:
 *   post:
 *     summary: Set new password
 *     description: Set a new password
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ISetNewPassword'
 *     responses:
 *       200:
 *         description: New password set successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISetNewPasswordDone'
 */
router.post(
  '/set-new-password',
  requireAuth,
  validateRequest(setNewPasswordSchema),
  authController.setNewPassword
);

/**
 * @openapi
 * /auth/set-password-by-email:
 *   post:
 *     summary: Set password by email (public)
 *     description: Set a password for a user by email address. Used for practice assessment users who are not yet authenticated.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password set successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid input
 *       404:
 *         description: User not found
 */
router.post(
  '/set-password-by-email',
  validateRequest(setPasswordByEmailSchema),
  authController.setPasswordByEmail
);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Get current user information
 *     description: Retrieve information about the currently authenticated user
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IMeResponse'
 */
router.get('/me', requireAuth, authController.me);

export default router;
