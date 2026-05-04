import { Router } from 'express';
import { CandidateSubscriptionController } from '@/controllers/candidate/subscription.controller';
import { CandidateSubscriptionService } from '@/services/candidate/subscription.service';
import { PaymentFactory } from '@/services/subscription/payment.factory';
import {
  requireAuth,
  requireActiveUser,
  requireUserType,
  validateRequest,
} from '@/middleware';
import {
  candidateSubscriptionUpdateValidator,
  candidateSubscriptionCancelValidator,
  candidateSubscriptionPackagesValidator,
  candidateAddPaymentMethodValidator,
  candidateRemovePaymentMethodValidator,
  candidateSetDefaultPaymentMethodValidator,
} from '@/shared/validators/candidate/subscription.validator';
import { UserTypeEnum } from '@/shared/models/common/enums';

const router = Router();

// Initialize services
const paymentFactory = new PaymentFactory();
const subscriptionService = new CandidateSubscriptionService(paymentFactory);

// Initialize controller
const subscriptionController = new CandidateSubscriptionController(
  subscriptionService
);

// Candidate auth middleware - applies to all subscription routes
const candidateAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.CANDIDATE]),
];

/**
 * @openapi
 * /candidate/subscription:
 *   get:
 *     summary: Get current subscription
 *     description: Retrieves the current active subscription for the candidate
 *     tags:
 *       - Candidate Subscription
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current subscription retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateSubscriptionGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No active subscription found
 */
router.get(
  '/',
  candidateAuthMiddleware,
  subscriptionController.getCurrentSubscription
);

/**
 * @openapi
 * /candidate/subscription/packages:
 *   get:
 *     summary: Get subscription packages
 *     description: Retrieves available subscription packages
 *     tags:
 *       - Candidate Subscription
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Subscription packages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateSubscriptionPackagesApiResponse'
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/packages',
  candidateAuthMiddleware,
  validateRequest(candidateSubscriptionPackagesValidator),
  subscriptionController.getSubscriptionPackages
);

/**
 * @openapi
 * /candidate/subscription:
 *   patch:
 *     summary: Update subscription
 *     description: Updates (upgrades/downgrades) the candidate's subscription
 *     tags:
 *       - Candidate Subscription
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IUpdateSubscriptionRequest'
 *     responses:
 *       200:
 *         description: Subscription updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateSubscriptionUpdateApiResponse'
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid request
 */
router.patch(
  '/',
  candidateAuthMiddleware,
  validateRequest(candidateSubscriptionUpdateValidator),
  subscriptionController.updateSubscription
);

/**
 * @openapi
 * /candidate/subscription:
 *   delete:
 *     summary: Cancel subscription
 *     description: Cancels the candidate's subscription
 *     tags:
 *       - Candidate Subscription
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ICancelSubscriptionRequest'
 *     responses:
 *       200:
 *         description: Subscription cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateSubscriptionCancelApiResponse'
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid request
 */
router.delete(
  '/',
  candidateAuthMiddleware,
  validateRequest(candidateSubscriptionCancelValidator),
  subscriptionController.cancelSubscription
);

/**
 * @openapi
 * /candidate/subscription/payment-methods:
 *   get:
 *     summary: Get payment methods
 *     description: Retrieves the candidate's payment methods
 *     tags:
 *       - Candidate Subscription
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment methods retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidatePaymentMethodsApiResponse'
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/payment-methods',
  candidateAuthMiddleware,
  subscriptionController.getPaymentMethods
);

/**
 * @openapi
 * /candidate/subscription/payment-methods:
 *   post:
 *     summary: Add payment method
 *     description: Adds a new payment method for the candidate
 *     tags:
 *       - Candidate Subscription
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ICandidateAddPaymentMethodRequest'
 *     responses:
 *       200:
 *         description: Payment method added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateAddPaymentMethodApiResponse'
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid request
 */
router.post(
  '/payment-methods',
  candidateAuthMiddleware,
  validateRequest(candidateAddPaymentMethodValidator),
  subscriptionController.addPaymentMethod
);

/**
 * @openapi
 * /candidate/subscription/payment-methods/{paymentMethodId}:
 *   delete:
 *     summary: Remove payment method
 *     description: Removes a payment method for the candidate
 *     tags:
 *       - Candidate Subscription
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentMethodId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the payment method to remove
 *     responses:
 *       200:
 *         description: Payment method removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateRemovePaymentMethodApiResponse'
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid request
 */
router.delete(
  '/payment-methods/:paymentMethodId',
  candidateAuthMiddleware,
  validateRequest(candidateRemovePaymentMethodValidator),
  subscriptionController.removePaymentMethod
);

/**
 * @openapi
 * /candidate/subscription/payment-methods/default:
 *   patch:
 *     summary: Set default payment method
 *     description: Sets a payment method as default for the candidate
 *     tags:
 *       - Candidate Subscription
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ICandidateSetDefaultPaymentMethodRequest'
 *     responses:
 *       200:
 *         description: Default payment method set successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateSetDefaultPaymentMethodApiResponse'
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid request
 */
router.patch(
  '/payment-methods/default',
  candidateAuthMiddleware,
  validateRequest(candidateSetDefaultPaymentMethodValidator),
  subscriptionController.setDefaultPaymentMethod
);

export default router;
