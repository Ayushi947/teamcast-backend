import { Router } from 'express';
import { StripeController } from '@/controllers/client/stripe.controller';
import {
  requireAuth,
  requireActiveUser,
  requireRole,
  requireUserType,
} from '@/middleware';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';

const router = Router();
const stripeController = new StripeController();

// Client auth middleware - applies to all Stripe routes
const clientAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.CLIENT]),
];

// Admin-only middleware - applies to Stripe management routes
const roleAdminOnlyMiddleware = [
  ...clientAuthMiddleware,
  requireRole([UserRoleEnum.ADMIN]),
];

/**
 * @openapi
 * /stripe/customers:
 *   post:
 *     summary: Create Stripe customer
 *     description: Creates a new customer in Stripe
 *     tags:
 *       - Stripe
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               name:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Customer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 customerId:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid request
 */
router.post(
  '/customers',
  clientAuthMiddleware,
  stripeController.createCustomer
);

/**
 * @openapi
 * /stripe/customers/{customerId}:
 *   patch:
 *     summary: Update Stripe customer
 *     description: Updates an existing customer in Stripe
 *     tags:
 *       - Stripe
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: customerId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               name:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Customer not found
 */
router.patch(
  '/customers/:customerId',
  clientAuthMiddleware,
  stripeController.updateCustomer
);

/**
 * @openapi
 * /stripe/customers/{customerId}/subscriptions:
 *   post:
 *     summary: Create or update subscription
 *     description: Creates a new subscription or updates an existing one for a customer
 *     tags:
 *       - Stripe
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: customerId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - priceId
 *             properties:
 *               productId:
 *                 type: string
 *               priceId:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Subscription created/updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subscriptionId:
 *                   type: string
 *                 status:
 *                   type: string
 *                 currentPeriodStart:
 *                   type: string
 *                   format: date-time
 *                 currentPeriodEnd:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Customer not found
 */
router.post(
  '/customers/:customerId/subscriptions',
  clientAuthMiddleware,
  stripeController.createOrUpdateSubscription
);

/**
 * @openapi
 * /stripe/subscriptions/{subscriptionId}:
 *   delete:
 *     summary: Cancel subscription
 *     description: Cancels an active subscription
 *     tags:
 *       - Stripe
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: subscriptionId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subscription cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subscriptionId:
 *                   type: string
 *                 status:
 *                   type: string
 *                 canceledAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Subscription not found
 */
router.delete(
  '/subscriptions/:subscriptionId',
  clientAuthMiddleware,
  stripeController.cancelSubscription
);

/**
 * @openapi
 * /stripe/customers/{customerId}/payment-methods:
 *   get:
 *     summary: Get payment methods
 *     description: Retrieves all payment methods for a customer
 *     tags:
 *       - Stripe
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: customerId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment methods retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 paymentMethods:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       brand:
 *                         type: string
 *                       last4:
 *                         type: string
 *                       type:
 *                         type: string
 *                       expMonth:
 *                         type: number
 *                       expYear:
 *                         type: number
 *                       isDefault:
 *                         type: boolean
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Customer not found
 */
router.get(
  '/customers/:customerId/payment-methods',
  clientAuthMiddleware,
  stripeController.getPaymentMethods
);

/**
 * @openapi
 * /stripe/customers/{customerId}/payment-methods:
 *   post:
 *     summary: Add payment method
 *     description: Adds a new payment method for a customer
 *     tags:
 *       - Stripe
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: customerId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentMethodId
 *             properties:
 *               paymentMethodId:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Payment method added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 paymentMethods:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/IPaymentMethod'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Customer not found
 */
router.post(
  '/customers/:customerId/payment-methods',
  clientAuthMiddleware,
  stripeController.addPaymentMethod
);

/**
 * @openapi
 * /stripe/customers/{customerId}/payment-methods/{paymentMethodId}:
 *   delete:
 *     summary: Remove payment method
 *     description: Removes a payment method from a customer
 *     tags:
 *       - Stripe
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: customerId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: paymentMethodId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment method removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 paymentMethods:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/IPaymentMethod'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Customer or payment method not found
 */
router.delete(
  '/customers/:customerId/payment-methods/:paymentMethodId',
  clientAuthMiddleware,
  stripeController.removePaymentMethod
);

/**
 * @openapi
 * /stripe/customers/{customerId}/payment-methods/default:
 *   patch:
 *     summary: Set default payment method
 *     description: Sets a payment method as the default for a customer
 *     tags:
 *       - Stripe
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: customerId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentMethodId
 *             properties:
 *               paymentMethodId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Default payment method set successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 paymentMethods:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/IPaymentMethod'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Customer or payment method not found
 */
router.patch(
  '/customers/:customerId/payment-methods/default',
  clientAuthMiddleware,
  stripeController.setDefaultPaymentMethod
);

/**
 * @openapi
 * /stripe/products:
 *   post:
 *     summary: Create product
 *     description: Creates a new product in Stripe (admin only)
 *     tags:
 *       - Stripe
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 productId:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin access required
 */
router.post(
  '/products',
  roleAdminOnlyMiddleware,
  stripeController.createProduct
);

/**
 * @openapi
 * /stripe/products/{productId}/prices:
 *   post:
 *     summary: Create price
 *     description: Creates a new price for a product in Stripe (admin only)
 *     tags:
 *       - Stripe
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: productId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount in cents (e.g., 1000 for $10.00)
 *     responses:
 *       200:
 *         description: Price created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 priceId:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin access required
 *       404:
 *         description: Product not found
 */
router.post(
  '/products/:productId/prices',
  roleAdminOnlyMiddleware,
  stripeController.createPrice
);

/**
 * @openapi
 * /stripe/checkout/sessions:
 *   post:
 *     summary: Create checkout session
 *     description: Creates a new checkout session for subscription payment
 *     tags:
 *       - Stripe
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IStripeCheckoutSessionRequest'
 *     responses:
 *       200:
 *         description: Checkout session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IStripeCheckoutSessionResponse'
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Package not found
 */
router.post(
  '/checkout/sessions',
  clientAuthMiddleware,
  stripeController.createCheckoutSession
);

/**
 * @openapi
 * /stripe/checkout/sessions/{sessionId}:
 *   get:
 *     summary: Retrieve checkout session
 *     description: Retrieves details of a checkout session
 *     tags:
 *       - Stripe
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: sessionId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Checkout session retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IStripeCheckoutSessionRetrieveResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Session not found
 */
router.get(
  '/checkout/sessions/:sessionId',
  clientAuthMiddleware,
  stripeController.retrieveCheckoutSession
);

/**
 * @openapi
 * /stripe/subscriptions/sync:
 *   post:
 *     summary: Sync subscription from Stripe
 *     description: Syncs subscription data from Stripe to the database. The clientId is automatically extracted from the authenticated user context.
 *     tags:
 *       - Stripe
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IStripeSubscriptionSyncRequest'
 *     responses:
 *       200:
 *         description: Subscription synced successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subscriptionId:
 *                   type: string
 *                 status:
 *                   type: string
 *                 customerId:
 *                   type: string
 *                 packageId:
 *                   type: string
 *                 currentPeriodStart:
 *                   type: string
 *                   format: date-time
 *                 currentPeriodEnd:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Subscription not found in Stripe or client not found
 */
router.post(
  '/subscriptions/sync',
  clientAuthMiddleware,
  stripeController.syncSubscriptionFromStripe
);

/**
 * @openapi
 * /stripe/checkout/complete:
 *   post:
 *     summary: Complete checkout and sync subscription
 *     description: Completes the checkout process and syncs subscription data from Stripe to the database
 *     tags:
 *       - Stripe
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IStripeCompleteCheckoutRequest'
 *     responses:
 *       200:
 *         description: Checkout completed and subscription synced successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subscriptionId:
 *                   type: string
 *                 status:
 *                   type: string
 *                 customerId:
 *                   type: string
 *                 packageId:
 *                   type: string
 *                 currentPeriodStart:
 *                   type: string
 *                   format: date-time
 *                 currentPeriodEnd:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Session not found
 */
router.post(
  '/checkout/complete',
  clientAuthMiddleware,
  stripeController.completeCheckoutAndSync
);

/**
 * @openapi
 * /stripe/subscriptions/{subscriptionId}/sync-status:
 *   post:
 *     summary: Sync subscription status from Stripe
 *     description: Manually syncs subscription status and billing information from Stripe
 *     tags:
 *       - Stripe
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: subscriptionId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subscription status synced successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subscriptionId:
 *                   type: string
 *                 status:
 *                   type: string
 *                 lastBillingDate:
 *                   type: string
 *                   format: date-time
 *                 nextBillingDate:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Subscription not found
 */
router.post(
  '/subscriptions/:subscriptionId/sync-status',
  clientAuthMiddleware,
  stripeController.syncSubscriptionStatus
);

/**
 * @openapi
 * /stripe/customers/find/{email}:
 *   get:
 *     summary: Find customer by email
 *     description: Finds an existing customer in Stripe by email address
 *     tags:
 *       - Stripe
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: email
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *     responses:
 *       200:
 *         description: Customer found successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 customerId:
 *                   type: string
 *                   nullable: true
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Customer not found
 */
router.get(
  '/customers/find/:email',
  clientAuthMiddleware,
  stripeController.findCustomerByEmail
);

/**
 * @openapi
 * /stripe/customers/{customerId}/details:
 *   get:
 *     summary: Get customer details
 *     description: Retrieves customer details from Stripe by customer ID
 *     tags:
 *       - Stripe
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: customerId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 customer:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                       nullable: true
 *                     name:
 *                       type: string
 *                       nullable: true
 *                     created:
 *                       type: string
 *                       format: date-time
 *                     metadata:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Customer not found
 */
router.get(
  '/customers/:customerId/details',
  clientAuthMiddleware,
  stripeController.getCustomerById
);

/**
 * @openapi
 * /stripe/customers/{customerId}/invoices:
 *   get:
 *     summary: Get customer invoices
 *     description: Retrieves all invoices for a customer from Stripe
 *     tags:
 *       - Stripe
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: customerId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of invoices to return (max 100)
 *       - name: startingAfter
 *         in: query
 *         schema:
 *           type: string
 *         description: Cursor for pagination (invoice ID)
 *       - name: endingBefore
 *         in: query
 *         schema:
 *           type: string
 *         description: Cursor for pagination (invoice ID)
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [draft, open, paid, void, uncollectible]
 *         description: Filter by invoice status
 *       - name: subscriptionId
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by subscription ID
 *     responses:
 *       200:
 *         description: Invoices retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invoices:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/IStripeInvoice'
 *                 hasMore:
 *                   type: boolean
 *                   description: Whether there are more invoices to fetch
 *                 totalCount:
 *                   type: integer
 *                   description: Total number of invoices returned
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Customer not found
 */
router.get(
  '/customers/:customerId/invoices',
  clientAuthMiddleware,
  stripeController.getInvoices
);

/**
 * @openapi
 * /stripe/invoices/{invoiceId}:
 *   get:
 *     summary: Get invoice by ID
 *     description: Retrieves a specific invoice from Stripe by invoice ID
 *     tags:
 *       - Stripe
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: invoiceId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invoice retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IStripeInvoice'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Invoice not found
 */
router.get(
  '/invoices/:invoiceId',
  clientAuthMiddleware,
  stripeController.getInvoice
);

/**
 * @openapi
 * /stripe/webhook:
 *   post:
 *     summary: Stripe webhook endpoint
 *     description: Handles Stripe webhook events for payment tracking and subscription updates
 *     tags:
 *       - Stripe
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Stripe webhook event object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 paymentId:
 *                   type: string
 *                   nullable: true
 *       400:
 *         description: Invalid webhook signature or event
 *       500:
 *         description: Internal server error
 */
router.post('/webhook', stripeController.handleWebhook);

export default router;
