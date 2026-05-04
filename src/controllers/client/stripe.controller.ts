import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../common/base.controller';
import { StripeProvider } from '@/services/subscription/stripe.provider';
import { logger } from '@/shared/utils/logger';
import { ClientProfileService } from '@/services/client/profile.service';
import { ENV } from '@/config/env';

export class StripeController extends BaseController {
  private stripeProvider: StripeProvider;
  private clientProfileService: ClientProfileService;

  constructor() {
    super();
    this.stripeProvider = new StripeProvider();
    this.clientProfileService = new ClientProfileService();
  }

  /**
   * Create a new customer in Stripe
   */
  createCustomer = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const { email, name, metadata } = req.body;

      logger.info({
        message: 'Creating Stripe customer',
        context: 'StripeController.createCustomer',
        email,
        name,
      });

      const customerId = await this.stripeProvider.createCustomer(
        email,
        name,
        metadata
      );

      return { customerId };
    });
  };

  /**
   * Update an existing customer in Stripe
   */
  updateCustomer = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const { customerId } = req.params;
      const { email, name, metadata } = req.body;

      logger.info({
        message: 'Updating Stripe customer',
        context: 'StripeController.updateCustomer',
        customerId,
      });

      await this.stripeProvider.updateCustomer(customerId, {
        email,
        name,
        metadata,
      });

      return { success: true };
    });
  };

  /**
   * Create or update a subscription
   */
  createOrUpdateSubscription = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const { customerId } = req.params;
      const { productId, priceId, metadata } = req.body;

      logger.info({
        message: 'Creating/updating Stripe subscription',
        context: 'StripeController.createOrUpdateSubscription',
        customerId,
        productId,
        priceId,
      });

      const subscription = await this.stripeProvider.createOrUpdateSubscription(
        customerId,
        productId,
        priceId,
        metadata
      );

      return subscription;
    });
  };

  /**
   * Cancel a subscription
   */
  cancelSubscription = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const { subscriptionId } = req.params;

      logger.info({
        message: 'Canceling Stripe subscription',
        context: 'StripeController.cancelSubscription',
        subscriptionId,
      });

      const result =
        await this.stripeProvider.cancelSubscription(subscriptionId);

      return result;
    });
  };

  /**
   * Get payment methods for a customer
   */
  getPaymentMethods = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const { customerId } = req.params;

      logger.info({
        message: 'Getting Stripe payment methods',
        context: 'StripeController.getPaymentMethods',
        customerId,
      });

      const paymentMethods =
        await this.stripeProvider.getPaymentMethods(customerId);

      return { paymentMethods };
    });
  };

  /**
   * Add a payment method for a customer
   */
  addPaymentMethod = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const { customerId } = req.params;
      const { paymentMethodId, isDefault } = req.body;

      logger.info({
        message: 'Adding Stripe payment method',
        context: 'StripeController.addPaymentMethod',
        customerId,
        isDefault,
      });

      const paymentMethods = await this.stripeProvider.addPaymentMethod(
        customerId,
        paymentMethodId,
        isDefault
      );

      return { paymentMethods };
    });
  };

  /**
   * Remove a payment method from a customer
   */
  removePaymentMethod = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const { customerId, paymentMethodId } = req.params;

      logger.info({
        message: 'Removing Stripe payment method',
        context: 'StripeController.removePaymentMethod',
        customerId,
        paymentMethodId,
      });

      const paymentMethods = await this.stripeProvider.removePaymentMethod(
        customerId,
        paymentMethodId
      );

      return { paymentMethods };
    });
  };

  /**
   * Set a default payment method for a customer
   */
  setDefaultPaymentMethod = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const { customerId } = req.params;
      const { paymentMethodId } = req.body;

      logger.info({
        message: 'Setting default Stripe payment method',
        context: 'StripeController.setDefaultPaymentMethod',
        customerId,
        paymentMethodId,
      });

      const paymentMethods = await this.stripeProvider.setDefaultPaymentMethod(
        customerId,
        paymentMethodId
      );

      return { paymentMethods };
    });
  };

  /**
   * Create a product in Stripe
   */
  createProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const { name } = req.body;

      logger.info({
        message: 'Creating Stripe product',
        context: 'StripeController.createProduct',
        name,
      });

      const productId = await this.stripeProvider.createProduct(name);

      return { productId };
    });
  };

  /**
   * Create a price for a product
   */
  createPrice = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const { productId } = req.params;
      const { amount } = req.body;

      logger.info({
        message: 'Creating price for product',
        context: 'StripeController.createPrice',
        productId,
        amount,
      });

      const priceId = await this.stripeProvider.createPrice(productId, amount);

      return { priceId };
    });
  };

  /**
   * Create a checkout session
   */
  createCheckoutSession = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const clientId = req.user.clientId as string;
      const { packageId, successUrl, cancelUrl, metadata } = req.body;

      const clientDetails =
        await this.clientProfileService.getProfile(clientId);

      metadata.clientId = clientId;
      logger.info({
        message: 'Creating checkout session',
        context: 'StripeController.createCheckoutSession',
        packageId,
        clientEmail: clientDetails.basic.contactEmail,
        hasClientEmail: !!clientDetails.basic.contactEmail,
      });

      const session = await this.stripeProvider.createCheckoutSession(
        packageId,
        successUrl,
        cancelUrl,
        clientDetails.basic.contactEmail,
        metadata
      );

      logger.info({
        message: 'Checkout session created successfully',
        context: 'StripeController.createCheckoutSession',
        sessionId: session.sessionId,
        clientEmail: clientDetails.basic.contactEmail,
      });

      return {
        sessionId: session.sessionId,
        url: session.url,
        expiresAt: session.expiresAt,
      };
    });
  };

  /**
   * Retrieve a checkout session
   */
  retrieveCheckoutSession = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const { sessionId } = req.params;
      logger.info({
        message: 'Retrieving Stripe checkout session',
        context: 'StripeController.retrieveCheckoutSession',
        sessionId,
      });

      const checkoutSession =
        await this.stripeProvider.retrieveCheckoutSession(sessionId);

      await this.stripeProvider.retrieveCheckoutSession(sessionId);

      return checkoutSession;
    });
  };

  /**
   * Sync subscription from Stripe
   */
  syncSubscriptionFromStripe = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const { subscriptionId } = req.body;
      const clientId = req.user.clientId as string;

      logger.info({
        message: 'Syncing subscription from Stripe',
        context: 'StripeController.syncSubscriptionFromStripe',
        subscriptionId,
        clientId,
      });

      const subscription = await this.stripeProvider.syncSubscriptionFromStripe(
        subscriptionId,
        clientId
      );

      return subscription;
    });
  };

  /**
   * Complete checkout and sync subscription
   */
  completeCheckoutAndSync = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const { sessionId, clientId } = req.body;

      logger.info({
        message: 'Completing checkout and syncing subscription',
        context: 'StripeController.completeCheckoutAndSync',
        sessionId,
        clientId,
      });

      const subscription = await this.stripeProvider.completeCheckoutAndSync(
        sessionId,
        clientId
      );

      return subscription;
    });
  };

  /**
   * Sync subscription status from Stripe
   */
  syncSubscriptionStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const { subscriptionId } = req.params;

      logger.info({
        message: 'Syncing subscription status from Stripe',
        context: 'StripeController.syncSubscriptionStatus',
        subscriptionId,
      });

      const result =
        await this.stripeProvider.syncSubscriptionStatus(subscriptionId);

      return result;
    });
  };

  /**
   * Find customer by email
   */
  findCustomerByEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const { email } = req.params;

      logger.info({
        message: 'Finding Stripe customer by email',
        context: 'StripeController.findCustomerByEmail',
        email,
      });

      const customerId = await this.stripeProvider.findCustomerByEmail(email);

      return { customerId };
    });
  };

  /**
   * Get customer details by ID
   */
  getCustomerById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const { customerId } = req.params;

      logger.info({
        message: 'Getting Stripe customer details',
        context: 'StripeController.getCustomerById',
        customerId,
      });

      const customer = await this.stripeProvider.getCustomerById(customerId);

      return { customer };
    });
  };

  /**
   * Get invoices for a customer
   */
  getInvoices = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const { customerId } = req.params;
      const { limit, startingAfter, endingBefore, status, subscriptionId } =
        req.query;

      logger.info({
        message: 'Getting Stripe invoices for customer',
        context: 'StripeController.getInvoices',
        customerId,
        limit,
        status,
        subscriptionId,
      });

      const options = {
        limit: limit ? parseInt(limit as string) : undefined,
        startingAfter: startingAfter as string,
        endingBefore: endingBefore as string,
        status: status as string,
        subscriptionId: subscriptionId as string,
      };

      const result = await this.stripeProvider.getInvoices(customerId, options);

      return result;
    });
  };

  /**
   * Get a specific invoice by ID
   */
  getInvoice = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const { invoiceId } = req.params;

      logger.info({
        message: 'Getting Stripe invoice by ID',
        context: 'StripeController.getInvoice',
        invoiceId,
      });

      const invoice = await this.stripeProvider.getInvoice(invoiceId);

      return invoice;
    });
  };

  /**
   * Handle Stripe webhook events
   */
  handleWebhook = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const sig = req.headers['stripe-signature'] as string;
      const endpointSecret = ENV.STRIPE_WEBHOOK_SECRET;

      if (!endpointSecret) {
        logger.error('Stripe webhook secret not configured', {
          context: 'StripeController.handleWebhook',
        });
        res.status(500).json({
          success: false,
          message: 'Webhook secret not configured',
        });
        return;
      }

      let event: any;

      try {
        // Verify webhook signature
        const { default: Stripe } = await import('stripe');
        const stripe = new Stripe(ENV.STRIPE_SECRET_KEY);
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } catch (err) {
        logger.error('Webhook signature verification failed', {
          context: 'StripeController.handleWebhook',
          error: err instanceof Error ? err.message : 'Unknown error',
        });
        res.status(400).json({
          success: false,
          message: 'Invalid webhook signature',
        });
        return;
      }

      logger.info('Processing Stripe webhook event', {
        context: 'StripeController.handleWebhook',
        eventId: event.id,
        eventType: event.type,
      });

      // Process the webhook event using StripeProvider
      const result = await this.stripeProvider.processWebhookEvent(event);

      if (result.success) {
        res.status(200).json(result);
      } else {
        logger.error('Webhook processing failed', {
          context: 'StripeController.handleWebhook',
          eventId: event.id,
          eventType: event.type,
          error: result.error,
        });
        res.status(500).json(result);
      }
    } catch (error) {
      logger.error('Unexpected error in webhook handler', {
        context: 'StripeController.handleWebhook',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
}
