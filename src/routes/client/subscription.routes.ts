import { Router } from 'express';
import { SubscriptionController } from '@/controllers/client/subscription.controller';
import { ClientSubscriptionService } from '@/services/client/subscription.service';
import { PaymentFactory } from '@/services/subscription/payment.factory';
import {
  requireAuth,
  requireActiveUser,
  requireRole,
  validateRequest,
  requireUserType,
} from '@/middleware';
import {
  clientSubscriptionUpdateValidator,
  clientSubscriptionCancelValidator,
  clientSubscriptionPackagesValidator,
  clientAddPaymentMethodValidator,
  clientRemovePaymentMethodValidator,
  clientSetDefaultPaymentMethodValidator,
  clientSubscriptionAutoRenewValidator,
  clientLogCandidateViewValidator,
} from '@/shared/validators/client/subscription.validator';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';
import { NodemailerProvider } from '@/services/notification/nodemailer.service';

const router = Router();

// Initialize services
const paymentFactory = new PaymentFactory();
const nodemailerProvider = new NodemailerProvider();
const subscriptionService = new ClientSubscriptionService(
  paymentFactory,
  nodemailerProvider
);

// Initialize controller
const subscriptionController = new SubscriptionController(subscriptionService);

// Client auth middleware - applies to all subscription routes
const clientAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.CLIENT, UserTypeEnum.SUPPORT]),
];

// Admin-only middleware - applies to subscription management routes
const roleAdminOnlyMiddleware = [
  ...clientAuthMiddleware,
  requireRole([UserRoleEnum.ADMIN]),
];

/**
 * @openapi
 * /client/subscription:
 *   get:
 *     summary: Get current subscription
 *     description: Retrieves the current active subscription for the client
 *     tags:
 *       - Client Subscription
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current subscription retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientSubscriptionGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No active subscription found
 */
router.get(
  '/',
  clientAuthMiddleware,
  subscriptionController.getCurrentSubscription
);

/**
 * @openapi
 * /client/subscription/overview:
 *   get:
 *     summary: Get current subscription overview
 *     description: Retrieves the current active subscription for the client
 *     tags:
 *       - Client Subscription
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current subscription overview retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientSubscriptionOverviewApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No active subscription found
 */
router.get(
  '/overview',
  clientAuthMiddleware,
  subscriptionController.getCurrentSubscriptionOverview
);

/**
 * @openapi
 * /client/subscription/packages:
 *   get:
 *     summary: Get available subscription packages
 *     description: Retrieves all available subscription packages with pagination
 *     tags:
 *       - Client Subscription
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortBy'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortOrder'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSearch'
 *       - $ref: '#/components/parameters/IClientSubscriptionPackageFilterQuery'
 *     responses:
 *       200:
 *         description: Subscription packages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientSubscriptionPackagesApiResponse'
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/packages',
  [
    // ...clientAuthMiddleware,
    validateRequest(clientSubscriptionPackagesValidator),
  ],
  subscriptionController.getSubscriptionPackages
);

/**
 * @openapi
 * /client/subscription:
 *   patch:
 *     summary: Update subscription
 *     description: Updates (upgrades/downgrades) the client's subscription to a new package
 *     tags:
 *       - Client Subscription
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IClientSubscriptionUpdate'
 *     responses:
 *       200:
 *         description: Subscription updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientSubscriptionUpdateApiResponse'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.patch(
  '/',
  [
    ...roleAdminOnlyMiddleware,
    validateRequest(clientSubscriptionUpdateValidator),
  ],
  subscriptionController.updateSubscription
);

/**
 * @openapi
 * /client/subscription:
 *   delete:
 *     summary: Cancel subscription
 *     description: Cancels the client's active subscription
 *     tags:
 *       - Client Subscription
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IClientSubscriptionCancel'
 *     responses:
 *       200:
 *         description: Subscription cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientSubscriptionCancelApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: No active subscription found
 */
router.delete(
  '/',
  [
    ...roleAdminOnlyMiddleware,
    validateRequest(clientSubscriptionCancelValidator),
  ],
  subscriptionController.cancelSubscription
);

/**
 * @openapi
 * /client/subscription/payment-methods:
 *   get:
 *     summary: Get payment methods
 *     description: Retrieves all payment methods for the client
 *     tags:
 *       - Client Payment Methods
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment methods retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientPaymentMethodsApiResponse'
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/payment-methods',
  clientAuthMiddleware,
  subscriptionController.getPaymentMethods
);

/**
 * @openapi
 * /client/subscription/payment-methods:
 *   post:
 *     summary: Add payment method
 *     description: Adds a new payment method for the client
 *     tags:
 *       - Client Payment Methods
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IClientAddPaymentMethodRequest'
 *     responses:
 *       200:
 *         description: Payment method added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientAddPaymentMethodApiResponse'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.post(
  '/payment-methods',
  [
    ...roleAdminOnlyMiddleware,
    validateRequest(clientAddPaymentMethodValidator),
  ],
  subscriptionController.addPaymentMethod
);

/**
 * @openapi
 * /client/subscription/payment-methods/default:
 *   patch:
 *     summary: Set default payment method
 *     description: Sets a payment method as the default for the client
 *     tags:
 *       - Client Payment Methods
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IClientSetDefaultPaymentMethodRequest'
 *     responses:
 *       200:
 *         description: Default payment method set successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientSetDefaultPaymentMethodApiResponse'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Payment method not found
 */
router.patch(
  '/payment-methods/default',
  [
    ...roleAdminOnlyMiddleware,
    validateRequest(clientSetDefaultPaymentMethodValidator),
  ],
  subscriptionController.setDefaultPaymentMethod
);

/**
 * @openapi
 * /client/subscription/payment-methods/{paymentMethodId}:
 *   delete:
 *     summary: Remove payment method
 *     description: Removes a payment method from the client
 *     tags:
 *       - Client Payment Methods
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IClientPaymentMethodParams'
 *     responses:
 *       200:
 *         description: Payment method removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientRemovePaymentMethodApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Payment method not found
 */
router.delete(
  '/payment-methods/:paymentMethodId',
  [
    ...roleAdminOnlyMiddleware,
    validateRequest(clientRemovePaymentMethodValidator),
  ],
  subscriptionController.removePaymentMethod
);

/**
 * @openapi
 * /client/subscription/auto-renew:
 *   patch:
 *     summary: Update auto-renewal settings
 *     description: Updates the auto-renewal setting for the client's subscription
 *     tags:
 *       - Client Subscription
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IClientSubscriptionAutoRenewUpdate'
 *     responses:
 *       200:
 *         description: Auto-renewal settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientSubscriptionGetApiResponse'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No active subscription found
 */
router.patch(
  '/auto-renew',
  [
    ...clientAuthMiddleware,
    validateRequest(clientSubscriptionAutoRenewValidator),
  ],
  subscriptionController.updateAutoRenewal
);

/**
 * @openapi
 * /client/subscription/renew:
 *   post:
 *     summary: Renew subscription
 *     description: Renews the client's subscription with proper billing cycle calculation
 *     tags:
 *       - Client Subscription
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               packageId:
 *                 type: string
 *                 format: uuid
 *                 description: Optional package ID for renewal (if not provided, uses current package)
 *     responses:
 *       200:
 *         description: Subscription renewed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientSubscriptionGetApiResponse'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No active subscription found
 */
router.post(
  '/renew',
  clientAuthMiddleware,
  subscriptionController.renewSubscription
);

/**
 * @openapi
 * /client/subscription/upgrade-info/{packageId}:
 *   get:
 *     summary: Get subscription upgrade information
 *     description: Gets information about upgrading/downgrading to a specific package
 *     tags:
 *       - Client Subscription
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: packageId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *           description: Package ID to compare against current subscription
 *     responses:
 *       200:
 *         description: Upgrade information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientSubscriptionUpgradeInfo'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Package not found
 */
router.get(
  '/upgrade-info/:packageId',
  clientAuthMiddleware,
  subscriptionController.getSubscriptionUpgradeInfo
);

/**
 * @openapi
 * /client/subscription/usage:
 *   get:
 *     summary: Get subscription usage summary
 *     description: Gets comprehensive usage summary for the client's subscription limits
 *     tags:
 *       - Client Subscription
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usage summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobPostings:
 *                   type: object
 *                   properties:
 *                     used:
 *                       type: number
 *                       description: Number of job postings used
 *                     limit:
 *                       type: number
 *                       description: Maximum job postings allowed (-1 for unlimited)
 *                     canCreate:
 *                       type: boolean
 *                       description: Whether client can create more job postings
 *                 candidateViews:
 *                   type: object
 *                   properties:
 *                     used:
 *                       type: number
 *                       description: Number of candidate views used
 *                     limit:
 *                       type: number
 *                       description: Maximum candidate views allowed (-1 for unlimited)
 *                     canView:
 *                       type: boolean
 *                       description: Whether client can view more candidate profiles
 *                 aiAssessments:
 *                   type: object
 *                   properties:
 *                     used:
 *                       type: number
 *                       description: Number of AI assessments used
 *                     limit:
 *                       type: number
 *                       description: Maximum AI assessments allowed (-1 for unlimited)
 *                     canCreate:
 *                       type: boolean
 *                       description: Whether client can create more AI assessments
 *                 seats:
 *                   type: object
 *                   properties:
 *                     used:
 *                       type: number
 *                       description: Number of seats used
 *                     limit:
 *                       type: number
 *                       description: Maximum seats allowed (-1 for unlimited)
 *                     canAdd:
 *                       type: boolean
 *                       description: Whether client can add more team members
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No active subscription found
 */
router.get(
  '/usage',
  clientAuthMiddleware,
  subscriptionController.getUsageSummary
);

/**
 * @openapi
 * /client/subscription/candidate-view:
 *   post:
 *     summary: Log candidate view and deduct from subscription
 *     description: Logs a candidate view and decrements the candidate view count if not already viewed
 *     tags:
 *       - Client Subscription
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               candidateId:
 *                 type: string
 *                 format: uuid
 *                 description: Candidate ID being viewed
 *               jobPostingId:
 *                 type: string
 *                 format: uuid
 *                 description: (Optional) Job posting context
 *               viewContext:
 *                 type: string
 *                 description: (Optional) Additional context
 *     responses:
 *       200:
 *         description: Candidate view logged
 *       403:
 *         description: View limit reached
 */
router.post(
  '/candidate-view',
  [...clientAuthMiddleware, validateRequest(clientLogCandidateViewValidator)],
  subscriptionController.logCandidateView
);

export default router;
