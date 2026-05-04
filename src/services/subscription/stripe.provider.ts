import { IPaymentProvider } from './payment.interface';
import { IPaymentMethod } from '@/shared/models/domain/common/subscription.domain';
import {
  IStripeInvoice,
  IStripeInvoiceListRequest,
} from '@/shared/models/domain/common/stripe.domain';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { ENV } from '@/config/env';
import Stripe from 'stripe';
import { logger } from '@/shared/utils/logger';
import { singleton } from '@/shared/decorators/singleton';
import { PaymentProviderEnum } from '@/shared/models/common/enums';
import { NodemailerProvider } from '../notification/nodemailer.service';
import { client_subscription_status } from '@prisma/client';
import { ClientSubscriptionStatusEnum } from '@/shared/models/common/enums';

@singleton
export class StripeProvider implements IPaymentProvider {
  private stripe: Stripe;

  constructor() {
    // Initialize Stripe with the API key from environment variables
    this.stripe = new Stripe(ENV.STRIPE_SECRET_KEY);
  }

  /**
   * Find a customer by email in Stripe
   */
  async findCustomerByEmail(email: string): Promise<string | null> {
    try {
      const customers = await this.stripe.customers.list({
        email: email,
        limit: 1,
      });

      if (customers.data.length > 0) {
        return customers.data[0].id;
      }

      return null;
    } catch (error) {
      logger.error('Failed to find Stripe customer by email', {
        context: 'StripeProvider.findCustomerByEmail',
        email,
        error,
      });
      throw new AppError(
        'Failed to find customer in payment system',
        500,
        ErrorCode.PAYMENT_GATEWAY_ERROR
      );
    }
  }

  /**
   * Get customer details by ID
   */
  async getCustomerById(customerId: string): Promise<{
    id: string;
    email: string | null;
    name: string | null;
    created: Date;
    metadata: Record<string, any>;
  } | null> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);

      if (customer.deleted) {
        return null;
      }

      return {
        id: customer.id,
        email: customer.email || null,
        name: customer.name || null,
        created: new Date(customer.created * 1000),
        metadata: customer.metadata,
      };
    } catch (error) {
      logger.error('Failed to get Stripe customer by ID', {
        context: 'StripeProvider.getCustomerById',
        customerId,
        error,
      });
      throw new AppError(
        'Failed to get customer from payment system',
        500,
        ErrorCode.PAYMENT_GATEWAY_ERROR
      );
    }
  }

  /**
   * Create a customer in Stripe
   */
  async createCustomer(
    email: string,
    name: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata,
      });
      return customer.id;
    } catch (error) {
      logger.error('Failed to create Stripe customer', {
        context: 'StripeProvider.createCustomer',
        email,
        error,
      });
      throw new AppError(
        'Failed to create customer in payment system',
        500,
        ErrorCode.PAYMENT_GATEWAY_ERROR
      );
    }
  }

  /**
   * Update a customer in Stripe
   */
  async updateCustomer(
    customerId: string,
    data: {
      email?: string;
      name?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    try {
      await this.stripe.customers.update(customerId, {
        email: data.email,
        name: data.name,
        metadata: data.metadata,
      });
    } catch (error) {
      logger.error('Failed to update Stripe customer', {
        context: 'StripeProvider.updateCustomer',
        customerId,
        error,
      });
      throw new AppError(
        'Failed to update customer in payment system',
        500,
        ErrorCode.PAYMENT_GATEWAY_ERROR
      );
    }
  }

  /**
   * Create or update a subscription for a customer in Stripe
   */
  async createOrUpdateSubscription(
    customerId: string,
    productId: string,
    priceId: string,
    metadata?: Record<string, any>
  ): Promise<{
    subscriptionId: string;
    status: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  }> {
    try {
      // First, check if the customer already has an active subscription
      const existingSubscriptions = await this.stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 1,
      });

      let subscription: Stripe.Subscription;

      if (existingSubscriptions.data.length > 0) {
        // Update existing subscription
        subscription = await this.stripe.subscriptions.update(
          existingSubscriptions.data[0].id,
          {
            items: [
              {
                id: existingSubscriptions.data[0].items.data[0].id,
                price: priceId,
              },
            ],
            metadata,
            cancel_at_period_end: true,
          }
        );
      } else {
        // Create new subscription with 14-day trial
        subscription = await this.stripe.subscriptions.create({
          customer: customerId,
          items: [{ price: priceId }],
          metadata,
          trial_period_days: 14,
          cancel_at_period_end: true,
        });
      }

      return {
        subscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodStart: new Date(
          (subscription as any).current_period_start * 1000
        ),
        currentPeriodEnd: new Date(
          (subscription as any).current_period_end * 1000
        ),
      };
    } catch (error) {
      logger.error('Failed to create/update Stripe subscription', {
        context: 'StripeProvider.createOrUpdateSubscription',
        customerId,
        productId,
        priceId,
        error,
      });
      throw new AppError(
        'Failed to create or update subscription in payment system',
        500,
        ErrorCode.PAYMENT_GATEWAY_ERROR
      );
    }
  }

  /**
   * Cancel a subscription in Stripe
   */
  async cancelSubscription(subscriptionId: string): Promise<{
    subscriptionId: string;
    status: string;
    canceledAt: Date;
  }> {
    try {
      // First update the subscription to cancel at period end
      await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });

      // Then retrieve the updated subscription
      const subscription =
        await this.stripe.subscriptions.retrieve(subscriptionId);

      return {
        subscriptionId: subscription.id,
        status: subscription.status,
        canceledAt: new Date(),
      };
    } catch (error) {
      logger.error('Failed to cancel Stripe subscription', {
        context: 'StripeProvider.cancelSubscription',
        subscriptionId,
        error,
      });
      throw new AppError(
        'Failed to cancel subscription in payment system',
        500,
        ErrorCode.PAYMENT_GATEWAY_ERROR
      );
    }
  }

  /**
   * Get all payment methods for a customer from Stripe
   */
  async getPaymentMethods(customerId: string): Promise<IPaymentMethod[]> {
    try {
      const paymentMethods = await this.stripe.customers.listPaymentMethods(
        customerId,
        { type: 'card' }
      );

      // Get the default payment method
      const customer = await this.stripe.customers.retrieve(customerId);
      const defaultPaymentMethodId = (customer as any).invoice_settings
        ?.default_payment_method as string | null;

      return paymentMethods.data.map((pm: Stripe.PaymentMethod) => ({
        id: pm.id,
        brand: pm.card?.brand || 'unknown',
        last4: pm.card?.last4 || '****',
        type: 'card',
        expMonth: pm.card?.exp_month || 0,
        expYear: pm.card?.exp_year || 0,
        isDefault: pm.id === defaultPaymentMethodId,
      }));
    } catch (error) {
      logger.error('Failed to get Stripe payment methods', {
        context: 'StripeProvider.getPaymentMethods',
        customerId,
        error,
      });
      throw new AppError(
        'Failed to retrieve payment methods from payment system',
        500,
        ErrorCode.PAYMENT_GATEWAY_ERROR
      );
    }
  }

  /**
   * Add a payment method for a customer in Stripe
   */
  async addPaymentMethod(
    customerId: string,
    paymentMethodId: string,
    isDefault?: boolean
  ): Promise<IPaymentMethod[]> {
    try {
      // Attach the payment method to the customer
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      // If this should be the default payment method, update the customer
      if (isDefault) {
        await this.stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });
      }

      // Return updated list of payment methods
      return await this.getPaymentMethods(customerId);
    } catch (error) {
      logger.error('Failed to add Stripe payment method', {
        context: 'StripeProvider.addPaymentMethod',
        customerId,
        paymentMethodId,
        error,
      });
      throw new AppError(
        'Failed to add payment method in payment system',
        500,
        ErrorCode.PAYMENT_GATEWAY_ERROR
      );
    }
  }

  /**
   * Remove a payment method from a customer in Stripe
   */
  async removePaymentMethod(
    customerId: string,
    paymentMethodId: string
  ): Promise<IPaymentMethod[]> {
    try {
      // First check if this is the default payment method
      const customer = await this.stripe.customers.retrieve(customerId);
      const defaultPaymentMethodId = (customer as any).invoice_settings
        ?.default_payment_method as string | null;

      // Prevent removing the default payment method
      if (defaultPaymentMethodId === paymentMethodId) {
        throw new AppError(
          'Cannot remove default payment method. Please set a different payment method as default first.',
          400,
          ErrorCode.PAYMENT_METHOD_INVALID
        );
      }

      // Detach the payment method
      await this.stripe.paymentMethods.detach(paymentMethodId);

      // Return updated list of payment methods
      return await this.getPaymentMethods(customerId);
    } catch (error) {
      logger.error('Failed to remove Stripe payment method', {
        context: 'StripeProvider.removePaymentMethod',
        customerId,
        paymentMethodId,
        error,
      });

      // Re-throw AppError instances
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        'Failed to remove payment method in payment system',
        500,
        ErrorCode.PAYMENT_GATEWAY_ERROR
      );
    }
  }

  /**
   * Set a payment method as the default for a customer in Stripe
   */
  async setDefaultPaymentMethod(
    customerId: string,
    paymentMethodId: string
  ): Promise<IPaymentMethod[]> {
    try {
      // Update the customer's default payment method
      await this.stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Return updated list of payment methods
      return await this.getPaymentMethods(customerId);
    } catch (error) {
      logger.error('Failed to set default Stripe payment method', {
        context: 'StripeProvider.setDefaultPaymentMethod',
        customerId,
        paymentMethodId,
        error,
      });
      throw new AppError(
        'Failed to set default payment method in payment system',
        500,
        ErrorCode.PAYMENT_GATEWAY_ERROR
      );
    }
  }

  /**
   * Create a product in Stripe
   */
  async createProduct(name: string): Promise<string> {
    const product = await this.stripe.products.create({
      name,
    });
    return product.id;
  }

  /**
   * Create a price for a product in Stripe
   */
  async createPrice(productId: string, amount: number): Promise<string> {
    const price = await this.stripe.prices.create({
      product: productId,
      unit_amount: amount,
      currency: 'usd',
    });
    return price.id;
  }

  /**
   * Create a checkout session for subscription
   */
  async createCheckoutSession(
    packageId: string,
    successUrl: string,
    cancelUrl: string,
    customerEmail?: string,
    metadata?: Record<string, any>
  ): Promise<{
    sessionId: string;
    url: string;
    expiresAt: Date;
  }> {
    try {
      // Get package details from database
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      const packageDetails =
        await prisma.client_subscription_package.findUnique({
          where: { id: packageId },
        });

      if (!packageDetails) {
        throw new AppError(
          'Subscription package not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      if (!packageDetails.isActive) {
        throw new AppError(
          'Subscription package is not active',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      // Convert price to cents for Stripe
      const amountInCents = Math.round(packageDetails.price * 100);

      // Check if customer already exists by email
      let customerId: string | undefined;
      if (customerEmail) {
        const existingCustomerId =
          await this.findCustomerByEmail(customerEmail);
        customerId = existingCustomerId || undefined;
        logger.info({
          message: 'Customer lookup result',
          context: 'StripeProvider.createCheckoutSession',
          customerEmail,
          customerId: customerId || 'not found',
        });
      }

      // Create checkout session parameters
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
          {
            price_data: {
              currency: packageDetails.currency.toLowerCase(),
              product_data: {
                name: packageDetails.name,
                description: packageDetails.description,
              },
              unit_amount: amountInCents,
              recurring: {
                interval: this.mapBillingCycleToStripeInterval(
                  packageDetails.billingCycle
                ),
              },
            },
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          packageId,
          billingCycle: packageDetails.billingCycle,
          ...metadata,
        },
        subscription_data: {
          metadata: {
            packageId,
            billingCycle: packageDetails.billingCycle,
            ...metadata,
          },
        },
        expires_at: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
      };

      // Use existing customer if found, otherwise use customer_email
      if (customerId) {
        sessionParams.customer = customerId;
        logger.info({
          message: 'Using existing customer for checkout session',
          context: 'StripeProvider.createCheckoutSession',
          customerId,
          customerEmail,
        });
      } else if (customerEmail) {
        sessionParams.customer_email = customerEmail;
        logger.info({
          message: 'Creating new customer for checkout session',
          context: 'StripeProvider.createCheckoutSession',
          customerEmail,
        });
      }

      // Create checkout session
      const session = await this.stripe.checkout.sessions.create(sessionParams);

      await prisma.$disconnect();

      return {
        sessionId: session.id,
        url: session.url!,
        expiresAt: new Date(session.expires_at! * 1000),
      };
    } catch (error) {
      logger.error('Failed to create Stripe checkout session', {
        context: 'StripeProvider.createCheckoutSession',
        packageId,
        error,
      });
      throw new AppError(
        'Failed to create checkout session',
        500,
        ErrorCode.PAYMENT_GATEWAY_ERROR
      );
    }
  }

  /**
   * Retrieve a checkout session
   */
  async retrieveCheckoutSession(sessionId: string): Promise<{
    sessionId: string;
    status: string;
    paymentStatus: string;
    customerId?: string;
    subscriptionId?: string;
    amountTotal: number;
    currency: string;
    expiresAt: Date;
    metadata?: Record<string, any>;
  }> {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);

      return {
        sessionId: session.id,
        status: session.status || '',
        paymentStatus: session.payment_status || '',
        customerId: session.customer ? String(session.customer) : undefined,
        subscriptionId: session.subscription as string,
        amountTotal: session.amount_total || 0,
        currency: session.currency || '',
        expiresAt: new Date(session.expires_at! * 1000),
        metadata: session.metadata ? session.metadata : undefined,
      };
    } catch (error) {
      logger.error('Failed to retrieve Stripe checkout session', {
        context: 'StripeProvider.retrieveCheckoutSession',
        sessionId,
        error,
      });
      throw new AppError(
        'Failed to retrieve checkout session',
        500,
        ErrorCode.PAYMENT_GATEWAY_ERROR
      );
    }
  }

  /**
   * Sync subscription data from Stripe to database
   */
  async syncSubscriptionFromStripe(
    subscriptionId: string,
    clientId: string
  ): Promise<{
    subscriptionId: string;
    status: string;
    customerId: string;
    packageId: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  }> {
    try {
      // Validate subscriptionId
      if (!subscriptionId || typeof subscriptionId !== 'string') {
        throw new AppError(
          'Invalid subscription ID provided',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      logger.info('Retrieving subscription from Stripe', {
        context: 'StripeProvider.syncSubscriptionFromStripe',
        subscriptionId,
      });

      const subscription =
        await this.stripe.subscriptions.retrieve(subscriptionId);

      logger.info('Subscription retrieved from Stripe', {
        context: 'StripeProvider.syncSubscriptionFromStripe',
        subscriptionId,
        subscription,
      });

      // Get package ID from metadata
      const packageId = subscription.metadata.packageId;
      if (!packageId) {
        throw new AppError(
          'Package ID not found in subscription metadata',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      // Calculate billing dates
      const { currentPeriodStart, currentPeriodEnd } =
        this.calculateBillingDates(subscription);

      // For new subscriptions, we need a client ID
      if (!clientId) {
        throw new AppError(
          'Cannot create subscription without client ID. Please provide clientId parameter or use checkout session flow.',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      // Sync subscription to database
      await this.syncSubscriptionToDatabase(
        subscription,
        clientId,
        packageId,
        currentPeriodStart,
        currentPeriodEnd,
        subscription.customer as string
      );

      return {
        subscriptionId: subscription.id,
        status: subscription.status,
        customerId: subscription.customer as string,
        packageId,
        currentPeriodStart,
        currentPeriodEnd,
      };
    } catch (error) {
      // Log the original error for debugging
      logger.error('Failed to sync subscription from Stripe', {
        context: 'StripeProvider.syncSubscriptionFromStripe',
        subscriptionId,
        clientId,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Re-throw AppError instances as-is
      if (error instanceof AppError) {
        throw error;
      }

      // Handle Stripe-specific errors
      if (error instanceof Error) {
        if (error.message.includes('No such subscription')) {
          throw new AppError(
            'Subscription not found in Stripe',
            404,
            ErrorCode.NOT_FOUND
          );
        }
        if (error.message.includes('Invalid API key')) {
          throw new AppError(
            'Invalid Stripe configuration',
            500,
            ErrorCode.PAYMENT_GATEWAY_ERROR
          );
        }
      }

      // Generic error for other cases
      throw new AppError(
        'Failed to sync subscription from Stripe',
        500,
        ErrorCode.PAYMENT_GATEWAY_ERROR
      );
    }
  }

  /**
   * Complete checkout and sync subscription data
   */
  async completeCheckoutAndSync(
    sessionId: string,
    clientId: string
  ): Promise<{
    subscriptionId: string;
    status: string;
    customerId: string;
    packageId: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  }> {
    try {
      // Retrieve the checkout session
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);

      if (!session) {
        throw new AppError(
          'Checkout session not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      if (session.status !== 'complete') {
        throw new AppError(
          'Checkout session is not complete',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      if (!session.subscription) {
        throw new AppError(
          'No subscription found in checkout session',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      // Get package ID from metadata
      const packageId = session.metadata?.packageId;
      if (!packageId) {
        throw new AppError(
          'Package ID not found in session metadata',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      // Get billing cycle from metadata
      const billingCycle = session.metadata?.billingCycle;
      if (!billingCycle) {
        throw new AppError(
          'Billing cycle not found in session metadata',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      // Get customer ID
      const customerId = session.customer as string;
      if (!customerId) {
        throw new AppError(
          'Customer ID not found in session',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      // Get subscription details from Stripe
      const subscription = await this.stripe.subscriptions.retrieve(
        session.subscription as string
      );

      // Calculate billing dates
      const { currentPeriodStart, currentPeriodEnd } =
        this.calculateBillingDates(subscription);

      // Calculate expiry date based on billing cycle
      const expiryDate = this.calculateExpiryDateFromBillingCycle(
        currentPeriodStart,
        billingCycle
      );

      // Sync subscription to database
      await this.syncSubscriptionToDatabase(
        subscription,
        clientId,
        packageId,
        currentPeriodStart,
        currentPeriodEnd,
        customerId
      );

      logger.info('Checkout completed and subscription synced', {
        context: 'StripeProvider.completeCheckoutAndSync',
        sessionId,
        clientId,
        subscriptionId: subscription.id,
        customerId,
        packageId,
        billingCycle,
        expiryDate,
      });

      return {
        subscriptionId: subscription.id,
        status: subscription.status,
        customerId,
        packageId,
        currentPeriodStart,
        currentPeriodEnd,
      };
    } catch (error) {
      logger.error('Failed to complete checkout and sync subscription', {
        context: 'StripeProvider.completeCheckoutAndSync',
        sessionId,
        clientId,
        error,
      });
      throw new AppError(
        'Failed to complete checkout and sync subscription',
        500,
        ErrorCode.PAYMENT_GATEWAY_ERROR
      );
    }
  }

  /**
   * Sync subscription status from Stripe
   */
  async syncSubscriptionStatus(subscriptionId: string): Promise<{
    subscriptionId: string;
    status: string;
    lastBillingDate: Date;
    nextBillingDate: Date | null;
  }> {
    try {
      // Get subscription details from Stripe
      const subscription =
        await this.stripe.subscriptions.retrieve(subscriptionId);

      // Update subscription in database
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      try {
        const existingSubscription = await prisma.client_subscription.findFirst(
          {
            where: {
              paymentProviderSubscriptionId: subscriptionId,
            },
            include: {
              package: true,
            },
          }
        );

        if (!existingSubscription) {
          throw new AppError(
            'Subscription not found in database',
            404,
            ErrorCode.NOT_FOUND
          );
        }

        // Calculate billing dates using shared helper
        const { currentPeriodEnd } = this.calculateBillingDates(subscription);

        // Calculate expiry date based on billing cycle
        const expiryDate = this.calculateExpiryDateFromBillingCycle(
          existingSubscription.startDate,
          existingSubscription.package.billingCycle
        );

        // Prepare update data
        const updateData: any = {
          paymentProvider: PaymentProviderEnum.STRIPE,
          status: this.mapStripeStatusToDbStatus(subscription.status),
          lastBillingDate: new Date(),
          nextBillingDate: currentPeriodEnd,
          metadata: this.extractEssentialMetadata(subscription),
        };

        // Handle endDate based on subscription status
        if (
          subscription.status === 'active' ||
          subscription.status === 'trialing'
        ) {
          // If subscription is active, use calculated expiry date
          updateData.endDate = expiryDate;
        } else if (
          subscription.status === 'canceled' ||
          subscription.status === 'incomplete_expired'
        ) {
          // If subscription is cancelled, set endDate to current period end
          updateData.endDate = currentPeriodEnd;
        }

        // Update subscription status and billing dates
        const updatedSubscription = await prisma.client_subscription.update({
          where: { id: existingSubscription.id },
          data: updateData,
        });

        logger.info('Subscription status synced', {
          context: 'StripeProvider.syncSubscriptionStatus',
          subscriptionId,
          status: subscription.status,
          expiryDate,
          billingCycle: existingSubscription.package.billingCycle,
        });

        return {
          subscriptionId: subscription.id,
          status: subscription.status,
          lastBillingDate: updatedSubscription.lastBillingDate || new Date(),
          nextBillingDate: updatedSubscription.nextBillingDate,
        };
      } finally {
        await prisma.$disconnect();
      }
    } catch (error) {
      logger.error('Failed to sync subscription status', {
        context: 'StripeProvider.syncSubscriptionStatus',
        subscriptionId,
        error,
      });
      throw new AppError(
        'Failed to sync subscription status',
        500,
        ErrorCode.PAYMENT_GATEWAY_ERROR
      );
    }
  }

  /**
   * Helper method to map billing cycle to Stripe interval
   */
  private mapBillingCycleToStripeInterval(
    billingCycle: string
  ): 'month' | 'year' {
    switch (billingCycle.toUpperCase()) {
      case 'MONTHLY':
        return 'month';
      case 'QUARTERLY':
        return 'month'; // Stripe doesn't support quarterly, use monthly
      case 'ANNUALLY':
        return 'year';
      default:
        return 'month';
    }
  }

  /**
   * Helper method to map Stripe status to database status
   */
  private mapStripeStatusToDbStatus(
    stripeStatus: string
  ): client_subscription_status {
    switch (stripeStatus) {
      case 'active':
        return client_subscription_status.ACTIVE;
      case 'canceled':
        return client_subscription_status.CANCELLED;
      case 'incomplete':
        return client_subscription_status.PENDING;
      case 'incomplete_expired':
        return client_subscription_status.EXPIRED;
      case 'trialing':
        return client_subscription_status.TRIALING;
      case 'past_due':
        return client_subscription_status.PENDING;
      case 'unpaid':
        return client_subscription_status.PENDING;
      default:
        return client_subscription_status.PENDING;
    }
  }

  /**
   * Private helper method to extract essential metadata from Stripe subscription
   */
  private extractEssentialMetadata(subscription: Stripe.Subscription): any {
    return {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      status: subscription.status,
      currentPeriodStart: (subscription as any).current_period_start,
      currentPeriodEnd: (subscription as any).current_period_end,
      billingCycleAnchor: subscription.billing_cycle_anchor,
      startDate: subscription.start_date,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at,
      endedAt: subscription.ended_at,
      trialStart: subscription.trial_start,
      trialEnd: subscription.trial_end,
      plan: {
        id: subscription.items.data[0]?.plan?.id,
        amount: subscription.items.data[0]?.plan?.amount,
        currency: subscription.items.data[0]?.plan?.currency,
        interval: subscription.items.data[0]?.plan?.interval,
        intervalCount: subscription.items.data[0]?.plan?.interval_count,
        usageType: subscription.items.data[0]?.plan?.usage_type,
      },
      price: {
        id: subscription.items.data[0]?.price?.id,
        unitAmount: subscription.items.data[0]?.price?.unit_amount,
        currency: subscription.items.data[0]?.price?.currency,
        recurring: subscription.items.data[0]?.price?.recurring,
      },
      latestInvoice: subscription.latest_invoice,
      defaultPaymentMethod: subscription.default_payment_method,
      collectionMethod: subscription.collection_method,
      metadata: subscription.metadata,
      // Additional fields for better tracking
      created: subscription.created,
      currentPeriodStartTimestamp: (subscription as any).current_period_start,
      currentPeriodEndTimestamp: (subscription as any).current_period_end,
      daysUntilDue: subscription.days_until_due,
      livemode: subscription.livemode,
      quantity: subscription.items.data[0]?.quantity,
      subscriptionItems: subscription.items.data.map((item) => ({
        id: item.id,
        priceId: item.price.id,
        quantity: item.quantity,
        unitAmount: item.price.unit_amount,
        currency: item.price.currency,
      })),
    };
  }

  /**
   * Private helper method to sync subscription data to database
   */
  private async syncSubscriptionToDatabase(
    subscription: Stripe.Subscription,
    clientId: string,
    packageId: string,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    customerId: string
  ): Promise<any> {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const notificationProvider = new NodemailerProvider();

    try {
      // Get package details
      const packageDetails =
        await prisma.client_subscription_package.findUnique({
          where: { id: packageId },
        });

      if (!packageDetails) {
        throw new AppError(
          'Subscription package not found',
          400,
          ErrorCode.NOT_FOUND
        );
      }

      // Get existing active subscription
      const existingSubscription = await prisma.client_subscription.findFirst({
        where: { clientId, status: client_subscription_status.ACTIVE },
        include: {
          package: true,
          client: {
            include: {
              company: true,
            },
          },
        },
      });

      // Get all expired subscriptions for this client to check if we can reuse one
      const expiredSubscriptions = await prisma.client_subscription.findMany({
        where: {
          clientId,
          status: client_subscription_status.EXPIRED,
        },
        include: {
          package: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      logger.debug('Found existing subscription and expired subscriptions', {
        context: 'StripeProvider.syncSubscriptionToDatabase',
        clientId,
        hasExistingSubscription: !!existingSubscription,
        expiredSubscriptionsCount: expiredSubscriptions.length,
      });

      // Calculate expiry date based on billing cycle
      const expiryDate = this.calculateExpiryDateFromBillingCycle(
        currentPeriodStart,
        packageDetails.billingCycle
      );

      // Determine if this is an upgrade/downgrade by comparing packages
      const oldPackage = existingSubscription?.package;
      const isPackageChange =
        oldPackage && packageDetails.id != existingSubscription.packageId;
      const isUpgrade =
        isPackageChange && packageDetails.maxSeats > oldPackage.maxSeats;
      const isDowngrade =
        isPackageChange && packageDetails.maxSeats < oldPackage.maxSeats;

      let dbSubscription;

      if (existingSubscription) {
        logger.debug('Package change detected', {
          context: 'StripeProvider.syncSubscriptionToDatabase',
          clientId,
          isPackageChange,
          oldPackageId: oldPackage?.id,
          newPackageId: packageDetails.id,
        });

        if (isPackageChange) {
          // Package is different - implement smart subscription management

          // 1. Store current subscription to history
          await prisma.client_subscription_history.create({
            data: {
              subscriptionId: existingSubscription.id,
              status: existingSubscription.status,
              startDate: existingSubscription.startDate,
              endDate: new Date(), // End the history entry now
              usedJobPostings: existingSubscription.usedJobPostings,
              usedCandidateViews: existingSubscription.usedCandidateViews,
              usedAiAssessments: existingSubscription.usedAiAssessments,
              usedSeats: existingSubscription.usedSeats,
              maxCandidateViewCredits:
                existingSubscription.maxCandidateViewCredits,
              maxAiAssessmentCredits:
                existingSubscription.maxAiAssessmentCredits,
              maxSeatsCredits: existingSubscription.maxSeatsCredits,
              maxJobPostingsCredits: existingSubscription.maxJobPostingsCredits,
              additionalCandidateViewCredits:
                existingSubscription.additionalCandidateViewCredits,
              additionalAiAssessmentCredits:
                existingSubscription.additionalAiAssessmentCredits,
              additionalSeatsCredits:
                existingSubscription.additionalSeatsCredits,
              additionalJobPostingsCredits:
                existingSubscription.additionalJobPostingsCredits,
              isTrial: existingSubscription.isTrial,
              trialExpireAt: existingSubscription.trialExpireAt,
              metadata: {
                changeType: isUpgrade ? 'upgrade' : 'downgrade',
                oldPackageId: oldPackage.id,
                oldPackageName: oldPackage.name,
                newPackageId: packageId,
                newPackageName: packageDetails.name,
                changeDate: new Date().toISOString(),
              },
            },
          });

          // 2. Mark existing subscription as expired and reset credits to zero
          await prisma.client_subscription.update({
            where: { id: existingSubscription.id },
            data: {
              status: ClientSubscriptionStatusEnum.EXPIRED,
              endDate: new Date(),
              // Reset all usage and credits to zero for potential reuse
              usedJobPostings: 0,
              usedCandidateViews: 0,
              usedAiAssessments: 0,
              usedSeats: 0,
              additionalCandidateViewCredits: 0,
              additionalAiAssessmentCredits: 0,
              additionalSeatsCredits: 0,
              additionalJobPostingsCredits: 0,
            },
          });

          // 3. Smart subscription creation/reuse logic
          let subscriptionToReuse = null;

          // Check if we can reuse an expired subscription (max 3 entries per client)
          if (expiredSubscriptions.length > 0) {
            // Find the most recently expired subscription to reuse
            subscriptionToReuse = expiredSubscriptions[0];

            logger.info('Reusing expired subscription entry', {
              context: 'StripeProvider.syncSubscriptionToDatabase',
              clientId,
              reusedSubscriptionId: subscriptionToReuse.id,
              newPackageId: packageId,
            });
          }

          if (subscriptionToReuse) {
            // Reuse existing expired subscription entry
            dbSubscription = await prisma.client_subscription.update({
              where: { id: subscriptionToReuse.id },
              data: {
                packageId,
                status: this.mapStripeStatusToDbStatus(subscription.status),
                paymentProviderSubscriptionId: subscription.id,
                paymentProvider: PaymentProviderEnum.STRIPE,
                paymentProviderCustomerId: customerId,
                startDate: currentPeriodStart,
                endDate: expiryDate,
                lastBillingDate: new Date(),
                nextBillingDate: currentPeriodEnd,
                autoRenew: subscription.status === 'active',
                // Credits are already reset to zero from step 2
                maxCandidateViewCredits: packageDetails.maxCandidateViews,
                maxAiAssessmentCredits: packageDetails.maxAiAssessments,
                maxSeatsCredits: packageDetails.maxSeats,
                maxJobPostingsCredits: packageDetails.maxJobPostings,
                isTrial: false,
                trialExpireAt: null,
              },
              include: {
                package: true,
                client: {
                  include: {
                    company: true,
                  },
                },
              },
            });
          } else {
            // Create NEW subscription entry (only if we don't have 3 entries already)
            const totalSubscriptions = await prisma.client_subscription.count({
              where: { clientId },
            });

            if (totalSubscriptions >= 3) {
              // If we have 3 entries, reuse the oldest expired one
              const oldestExpired =
                expiredSubscriptions[expiredSubscriptions.length - 1];

              logger.info(
                'Maximum 3 subscriptions reached, reusing oldest expired entry',
                {
                  context: 'StripeProvider.syncSubscriptionToDatabase',
                  clientId,
                  reusedSubscriptionId: oldestExpired.id,
                  newPackageId: packageId,
                }
              );

              dbSubscription = await prisma.client_subscription.update({
                where: { id: oldestExpired.id },
                data: {
                  packageId,
                  status: this.mapStripeStatusToDbStatus(subscription.status),
                  paymentProviderSubscriptionId: subscription.id,
                  paymentProvider: PaymentProviderEnum.STRIPE,
                  paymentProviderCustomerId: customerId,
                  startDate: currentPeriodStart,
                  endDate: expiryDate,
                  lastBillingDate: new Date(),
                  nextBillingDate: currentPeriodEnd,
                  autoRenew: subscription.status === 'active',
                  maxCandidateViewCredits: packageDetails.maxCandidateViews,
                  maxAiAssessmentCredits: packageDetails.maxAiAssessments,
                  maxSeatsCredits: packageDetails.maxSeats,
                  maxJobPostingsCredits: packageDetails.maxJobPostings,
                  isTrial: false,
                  trialExpireAt: null,
                },
                include: {
                  package: true,
                  client: {
                    include: {
                      company: true,
                    },
                  },
                },
              });
            } else {
              // Create new entry
              dbSubscription = await prisma.client_subscription.create({
                data: {
                  clientId,
                  packageId,
                  status: this.mapStripeStatusToDbStatus(subscription.status),
                  paymentProviderSubscriptionId: subscription.id,
                  paymentProvider: PaymentProviderEnum.STRIPE,
                  paymentProviderCustomerId: customerId,
                  startDate: currentPeriodStart,
                  endDate: expiryDate,
                  lastBillingDate: new Date(),
                  nextBillingDate: currentPeriodEnd,
                  autoRenew: subscription.status === 'active',
                  // Reset all usage to zero for new package
                  usedJobPostings: 0,
                  usedCandidateViews: 0,
                  usedAiAssessments: 0,
                  usedSeats: 0,
                  // Reset all credits to zero for new package
                  maxCandidateViewCredits: packageDetails.maxCandidateViews,
                  maxAiAssessmentCredits: packageDetails.maxAiAssessments,
                  maxSeatsCredits: packageDetails.maxSeats,
                  maxJobPostingsCredits: packageDetails.maxJobPostings,
                  additionalCandidateViewCredits: 0,
                  additionalAiAssessmentCredits: 0,
                  additionalSeatsCredits: 0,
                  additionalJobPostingsCredits: 0,
                  isTrial: false,
                  trialExpireAt: null,
                },
                include: {
                  package: true,
                  client: {
                    include: {
                      company: true,
                    },
                  },
                },
              });
            }
          }

          logger.info(
            'Package changed - smart subscription management applied',
            {
              context: 'StripeProvider.syncSubscriptionToDatabase',
              stripeSubscriptionId: subscription.id,
              clientId,
              oldDbSubscriptionId: existingSubscription.id,
              newDbSubscriptionId: dbSubscription.id,
              oldPackageId: oldPackage.id,
              newPackageId: packageId,
              isUpgrade,
              isDowngrade,
              reusedExpiredEntry: !!subscriptionToReuse,
              totalSubscriptions: await prisma.client_subscription.count({
                where: { clientId },
              }),
            }
          );
        } else {
          // Same package - just update the existing subscription
          dbSubscription = await prisma.client_subscription.update({
            where: { id: existingSubscription.id },
            data: {
              status: this.mapStripeStatusToDbStatus(subscription.status),
              paymentProviderSubscriptionId: subscription.id,
              paymentProvider: PaymentProviderEnum.STRIPE,
              paymentProviderCustomerId: customerId,
              startDate: currentPeriodStart,
              endDate: expiryDate,
              lastBillingDate: new Date(),
              nextBillingDate: currentPeriodEnd,
              autoRenew: subscription.status === 'active',
              // Preserve existing usage and credits
              usedSeats: existingSubscription.usedSeats,
            },
            include: {
              package: true,
              client: {
                include: {
                  company: true,
                },
              },
            },
          });

          logger.info(
            'Updated existing subscription (same package) in database',
            {
              context: 'StripeProvider.syncSubscriptionToDatabase',
              subscriptionId: subscription.id,
              clientId,
              dbSubscriptionId: dbSubscription.id,
              packageId,
              expiryDate,
              billingCycle: packageDetails.billingCycle,
            }
          );
        }
      } else {
        // Create new subscription (no existing subscription)
        const createData = {
          clientId,
          packageId,
          status: this.mapStripeStatusToDbStatus(subscription.status),
          paymentProviderSubscriptionId: subscription.id,
          paymentProvider: PaymentProviderEnum.STRIPE,
          paymentProviderCustomerId: customerId,
          startDate: currentPeriodStart,
          endDate: expiryDate,
          lastBillingDate: new Date(),
          nextBillingDate: currentPeriodEnd,
          autoRenew: subscription.status === 'active',
          usedSeats: 0,
        };

        dbSubscription = await prisma.client_subscription.create({
          data: createData,
          include: {
            package: true,
            client: {
              include: {
                company: true,
              },
            },
          },
        });

        logger.info('Created new subscription in database', {
          context: 'StripeProvider.syncSubscriptionToDatabase',
          subscriptionId: subscription.id,
          clientId,
          dbSubscriptionId: dbSubscription.id,
          expiryDate,
          billingCycle: packageDetails.billingCycle,
        });
      }

      // --- Send notification ONLY if package actually changed (upgrade/downgrade) ---
      if (isPackageChange) {
        try {
          // Get client and company info
          let client = null;
          let company = null;
          if (existingSubscription) {
            client = existingSubscription.client;
            company = client?.company;
          } else {
            // For new subscription, fetch client and company
            client = await prisma.client.findUnique({
              where: { id: clientId },
              include: { company: true },
            });
            company = client?.company;
          }
          const recipientEmail = company?.contactEmail;
          const recipientName = company?.name || 'Valued Customer';
          const companyName = company?.name || 'Company Name';

          if (recipientEmail) {
            if (isUpgrade) {
              await notificationProvider.sendClientSubscriptionUpgradedEmail(
                recipientEmail,
                recipientName,
                companyName,
                packageDetails.name
              );
              logger.info('Sent upgrade email', {
                recipientEmail,
                clientId,
                oldPackage: oldPackage.name,
                newPackage: packageDetails.name,
              });
            } else if (isDowngrade) {
              await notificationProvider.sendClientSubscriptionDowngradedEmail(
                recipientEmail,
                recipientName,
                companyName,
                packageDetails.name
              );
              logger.info('Sent downgrade email', {
                recipientEmail,
                clientId,
                oldPackage: oldPackage.name,
                newPackage: packageDetails.name,
              });
            }
          } else {
            logger.info(
              'No recipient email for subscription change notification',
              {
                clientId,
                hasOldPackage: !!oldPackage,
                recipientEmail,
              }
            );
          }
        } catch (err) {
          logger.error(
            'Failed to send subscription change email (Stripe sync)',
            {
              context: 'StripeProvider.syncSubscriptionToDatabase',
              error: err instanceof Error ? err.message : err,
            }
          );
        }
      } else {
        logger.info('No package change detected, skipping email notification', {
          clientId,
          oldPackageId: oldPackage?.id,
          newPackageId: packageId,
        });
      }

      return dbSubscription;
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * Calculate expiry date based on billing cycle
   * @param startDate The start date
   * @param billingCycle The billing cycle (MONTHLY, QUARTERLY, ANNUALLY)
   * @returns The calculated expiry date
   */
  private calculateExpiryDateFromBillingCycle(
    startDate: Date,
    billingCycle: string
  ): Date {
    const expiryDate = new Date(startDate);

    switch (billingCycle.toUpperCase()) {
      case 'MONTHLY':
        expiryDate.setMonth(expiryDate.getMonth() + 1);
        break;
      case 'QUARTERLY':
        expiryDate.setMonth(expiryDate.getMonth() + 3);
        break;
      case 'ANNUALLY':
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        break;
      default:
        // Default to monthly if billing cycle is not recognized
        expiryDate.setMonth(expiryDate.getMonth() + 1);
        logger.warn('Unknown billing cycle, defaulting to monthly', {
          context: 'StripeProvider.calculateExpiryDateFromBillingCycle',
          billingCycle,
        });
    }

    return expiryDate;
  }

  /**
   * Private helper method to calculate billing dates from Stripe subscription
   */
  private calculateBillingDates(subscription: Stripe.Subscription): {
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  } {
    // Use the correct Stripe subscription properties with proper type casting
    const currentPeriodStart = (subscription as any).current_period_start
      ? new Date((subscription as any).current_period_start * 1000)
      : new Date();

    const currentPeriodEnd = (subscription as any).current_period_end
      ? new Date((subscription as any).current_period_end * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default to 30 days from now

    // Validate dates
    if (isNaN(currentPeriodStart.getTime())) {
      throw new AppError(
        'Invalid current period start date from Stripe',
        500,
        ErrorCode.PAYMENT_GATEWAY_ERROR
      );
    }

    if (isNaN(currentPeriodEnd.getTime())) {
      throw new AppError(
        'Invalid current period end date from Stripe',
        500,
        ErrorCode.PAYMENT_GATEWAY_ERROR
      );
    }

    return { currentPeriodStart, currentPeriodEnd };
  }

  /**
   * Get invoices for a customer from Stripe
   */
  async getInvoices(
    customerId: string,
    options?: IStripeInvoiceListRequest
  ): Promise<{
    invoices: IStripeInvoice[];
    hasMore: boolean;
    totalCount: number;
  }> {
    try {
      // Build parameters for Stripe API call
      const params: Stripe.InvoiceListParams = {
        customer: customerId,
        limit: Math.min(options?.limit || 10, 100), // Stripe max is 100
      };

      // Add pagination parameters
      if (options?.startingAfter) {
        params.starting_after = options.startingAfter;
      }
      if (options?.endingBefore) {
        params.ending_before = options.endingBefore;
      }

      // Add status filter if provided
      if (options?.status) {
        params.status = options.status as any;
      }

      // Add subscription filter if provided
      if (options?.subscriptionId) {
        params.subscription = options.subscriptionId;
      }

      logger.info('Fetching invoices from Stripe', {
        context: 'StripeProvider.getInvoices',
        customerId,
        options,
      });

      const invoices = await this.stripe.invoices.list(params);

      const mappedInvoices: IStripeInvoice[] = invoices.data.map(
        (invoice: Stripe.Invoice) => ({
          id: invoice.id || '',
          customerId: invoice.customer as string,
          subscriptionId: (invoice as any).subscription as string,
          status: invoice.status || 'unknown',
          amountDue: invoice.amount_due,
          amountPaid: invoice.amount_paid,
          currency: invoice.currency,
          invoiceDate: new Date(invoice.created * 1000),
          dueDate: new Date(invoice.due_date! * 1000),
          paidAt: (invoice as any).status_paid_at
            ? new Date((invoice as any).status_paid_at * 1000)
            : undefined,
          invoicePdf: invoice.invoice_pdf || undefined,
          hostedInvoiceUrl: invoice.hosted_invoice_url || undefined,
          description: invoice.description || undefined,
          metadata: invoice.metadata || {},
        })
      );

      logger.info('Invoices fetched successfully', {
        context: 'StripeProvider.getInvoices',
        customerId,
        invoiceCount: mappedInvoices.length,
        hasMore: invoices.has_more,
      });

      return {
        invoices: mappedInvoices,
        hasMore: invoices.has_more,
        totalCount: invoices.data.length,
      };
    } catch (error) {
      logger.error('Failed to get Stripe invoices', {
        context: 'StripeProvider.getInvoices',
        customerId,
        options,
        error,
      });
      throw new AppError(
        'Failed to retrieve invoices from payment system',
        500,
        ErrorCode.PAYMENT_GATEWAY_ERROR
      );
    }
  }

  /**
   * Process Stripe webhook and create/update payment records
   */
  async processWebhookEvent(event: any): Promise<{
    success: boolean;
    paymentId?: string;
    message: string;
    error?: string;
  }> {
    try {
      logger.info('Processing webhook event in StripeProvider', {
        context: 'StripeProvider.processWebhookEvent',
        eventId: event.id,
        eventType: event.type,
      });

      // Import required dependencies
      const { PrismaClient } = await import('@prisma/client');
      const { PaymentStatus } = await import('@/shared/models/common/enums');
      const prisma = new PrismaClient();

      try {
        let paymentId: string | undefined;
        let subscriptionId: string | undefined;

        // Handle different webhook event types
        switch (event.type) {
          case 'invoice.payment_succeeded':
            paymentId = await this.handlePaymentSucceeded(
              event,
              prisma,
              PaymentStatus
            );
            subscriptionId = event.data.object.subscription;
            break;

          case 'invoice.payment_failed':
            paymentId = await this.handlePaymentFailed(
              event,
              prisma,
              PaymentStatus
            );
            subscriptionId = event.data.object.subscription;
            break;

          case 'payment_intent.succeeded':
            paymentId = await this.handlePaymentIntentSucceeded(
              event,
              prisma,
              PaymentStatus
            );
            break;

          case 'payment_intent.payment_failed':
            paymentId = await this.handlePaymentIntentFailed(
              event,
              prisma,
              PaymentStatus
            );
            break;

          case 'charge.succeeded':
            paymentId = await this.handleChargeSucceeded(
              event,
              prisma,
              PaymentStatus
            );
            break;

          case 'charge.failed':
            paymentId = await this.handleChargeFailed(
              event,
              prisma,
              PaymentStatus
            );
            break;

          default:
            logger.info('Unhandled webhook event type', {
              context: 'StripeProvider.processWebhookEvent',
              eventType: event.type,
            });
            return {
              success: true,
              message: 'Event type not handled for payment tracking',
            };
        }

        // If payment was created/updated successfully and it's subscription-related, sync subscription
        if (paymentId && subscriptionId) {
          try {
            await this.syncSubscriptionStatus(subscriptionId);
            logger.info('Subscription synced after webhook payment', {
              context: 'StripeProvider.processWebhookEvent',
              subscriptionId,
              paymentId,
            });
          } catch (syncError) {
            logger.error('Failed to sync subscription after webhook payment', {
              context: 'StripeProvider.processWebhookEvent',
              subscriptionId,
              error: syncError,
            });
            // Don't fail the webhook processing for subscription sync errors
          }
        }

        return {
          success: true,
          paymentId,
          message: 'Webhook processed successfully',
        };
      } finally {
        await prisma.$disconnect();
      }
    } catch (error) {
      logger.error('Failed to process webhook event in StripeProvider', {
        context: 'StripeProvider.processWebhookEvent',
        eventId: event.id,
        eventType: event.type,
        error,
      });
      return {
        success: false,
        message: 'Failed to process webhook event',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Handle invoice.payment_succeeded webhook event
   */
  private async handlePaymentSucceeded(
    event: any,
    prisma: any,
    PaymentStatus: any
  ): Promise<string> {
    const invoice = event.data.object;
    const paymentIntent = invoice.payment_intent;

    if (!paymentIntent) {
      throw new Error('No payment intent found in invoice');
    }

    // Get payment intent details from Stripe
    const paymentIntentDetails =
      await this.stripe.paymentIntents.retrieve(paymentIntent);

    // Get charges for this payment intent
    const charges = await this.stripe.charges.list({
      payment_intent: paymentIntent,
      limit: 1,
    });

    // Find client by customer ID through subscription
    const clientSubscription = await prisma.client_subscription.findFirst({
      where: { paymentProviderCustomerId: invoice.customer },
      include: {
        client: true,
      },
    });

    if (!clientSubscription || !clientSubscription.client) {
      throw new Error(`Client not found for customer ID: ${invoice.customer}`);
    }

    const client = clientSubscription.client;

    // Find subscription if this is subscription-related
    const subscription = await prisma.client_subscription.findFirst({
      where: { paymentProviderSubscriptionId: invoice.subscription },
    });

    // Create or update payment record
    const payment = await prisma.payment.upsert({
      where: { stripePaymentId: paymentIntent },
      update: {
        status: PaymentStatus.SUCCEEDED,
        receiptUrl: charges.data[0]?.receipt_url,
        webhookReceivedAt: new Date(),
        webhookEventId: event.id,
        metadata: {
          ...paymentIntentDetails.metadata,
          invoiceId: invoice.id,
          subscriptionId: invoice.subscription,
        },
      },
      create: {
        intentId: client.id,
        subscriptionId: subscription?.id,
        stripePaymentId: paymentIntent,
        stripeInvoiceId: invoice.id,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: PaymentStatus.SUCCEEDED,
        receiptUrl: charges.data[0]?.receipt_url,
        paymentMethod: paymentIntentDetails.payment_method_types[0],
        paymentMethodId: paymentIntentDetails.payment_method as string,
        description: invoice.description || `Payment for invoice ${invoice.id}`,
        webhookReceivedAt: new Date(),
        webhookEventId: event.id,
        metadata: {
          ...paymentIntentDetails.metadata,
          invoiceId: invoice.id,
          subscriptionId: invoice.subscription,
        },
      },
    });

    logger.info('Payment succeeded record created/updated', {
      context: 'StripeProvider.handlePaymentSucceeded',
      paymentId: payment.id,
      invoiceId: invoice.id,
      clientId: client.id,
    });

    return payment.id;
  }

  /**
   * Handle invoice.payment_failed webhook event
   */
  private async handlePaymentFailed(
    event: any,
    prisma: any,
    PaymentStatus: any
  ): Promise<string> {
    const invoice = event.data.object;
    const paymentIntent = invoice.payment_intent;

    if (!paymentIntent) {
      throw new Error('No payment intent found in invoice');
    }

    // Find client by customer ID through subscription
    const clientSubscription = await prisma.client_subscription.findFirst({
      where: { paymentProviderCustomerId: invoice.customer },
      include: {
        client: true,
      },
    });

    if (!clientSubscription || !clientSubscription.client) {
      throw new Error(`Client not found for customer ID: ${invoice.customer}`);
    }

    const client = clientSubscription.client;

    // Find subscription if this is subscription-related
    const subscription = await prisma.client_subscription.findFirst({
      where: { paymentProviderSubscriptionId: invoice.subscription },
    });

    // Create or update payment record
    const payment = await prisma.payment.upsert({
      where: { stripePaymentId: paymentIntent },
      update: {
        status: PaymentStatus.FAILED,
        webhookReceivedAt: new Date(),
        webhookEventId: event.id,
        metadata: {
          invoiceId: invoice.id,
          subscriptionId: invoice.subscription,
          failureReason: invoice.last_finalization_error?.message,
        },
      },
      create: {
        intentId: client.id,
        subscriptionId: subscription?.id,
        stripePaymentId: paymentIntent,
        stripeInvoiceId: invoice.id,
        amount: invoice.amount_due,
        currency: invoice.currency,
        status: PaymentStatus.FAILED,
        description: `Failed payment for invoice ${invoice.id}`,
        webhookReceivedAt: new Date(),
        webhookEventId: event.id,
        metadata: {
          invoiceId: invoice.id,
          subscriptionId: invoice.subscription,
          failureReason: invoice.last_finalization_error?.message,
        },
      },
    });

    logger.info('Payment failed record created/updated', {
      context: 'StripeProvider.handlePaymentFailed',
      paymentId: payment.id,
      invoiceId: invoice.id,
      clientId: client.id,
    });

    return payment.id;
  }

  /**
   * Handle payment_intent.succeeded webhook event
   */
  private async handlePaymentIntentSucceeded(
    event: any,
    prisma: any,
    PaymentStatus: any
  ): Promise<string> {
    const paymentIntent = event.data.object;

    // Find client by customer ID through subscription
    const subscription = await prisma.client_subscription.findFirst({
      where: { paymentProviderCustomerId: paymentIntent.customer },
      include: {
        client: true,
      },
    });

    if (!subscription || !subscription.client) {
      throw new Error(
        `Client not found for customer ID: ${paymentIntent.customer}`
      );
    }

    const client = subscription.client;

    // Get charges for this payment intent
    const charges = await this.stripe.charges.list({
      payment_intent: paymentIntent.id,
      limit: 1,
    });

    // Create or update payment record
    const payment = await prisma.payment.upsert({
      where: { stripePaymentId: paymentIntent.id },
      update: {
        status: PaymentStatus.SUCCEEDED,
        receiptUrl: charges.data[0]?.receipt_url,
        webhookReceivedAt: new Date(),
        webhookEventId: event.id,
        metadata: paymentIntent.metadata,
      },
      create: {
        intentId: client.id,
        stripePaymentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: PaymentStatus.SUCCEEDED,
        receiptUrl: charges.data[0]?.receipt_url,
        paymentMethod: paymentIntent.payment_method_types[0],
        paymentMethodId: paymentIntent.payment_method as string,
        description: paymentIntent.description || `Payment ${paymentIntent.id}`,
        webhookReceivedAt: new Date(),
        webhookEventId: event.id,
        metadata: paymentIntent.metadata,
      },
    });

    logger.info('Payment intent succeeded record created/updated', {
      context: 'StripeProvider.handlePaymentIntentSucceeded',
      paymentId: payment.id,
      paymentIntentId: paymentIntent.id,
      clientId: client.id,
    });

    return payment.id;
  }

  /**
   * Handle payment_intent.payment_failed webhook event
   */
  private async handlePaymentIntentFailed(
    event: any,
    prisma: any,
    PaymentStatus: any
  ): Promise<string> {
    const paymentIntent = event.data.object;

    // Find client by customer ID through subscription
    const subscription = await prisma.client_subscription.findFirst({
      where: { paymentProviderCustomerId: paymentIntent.customer },
      include: {
        client: true,
      },
    });

    if (!subscription || !subscription.client) {
      throw new Error(
        `Client not found for customer ID: ${paymentIntent.customer}`
      );
    }

    const client = subscription.client;

    // Create or update payment record
    const payment = await prisma.payment.upsert({
      where: { stripePaymentId: paymentIntent.id },
      update: {
        status: PaymentStatus.FAILED,
        webhookReceivedAt: new Date(),
        webhookEventId: event.id,
        metadata: {
          ...paymentIntent.metadata,
          failureReason: paymentIntent.last_payment_error?.message,
        },
      },
      create: {
        intentId: client.id,
        stripePaymentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: PaymentStatus.FAILED,
        description: `Failed payment ${paymentIntent.id}`,
        webhookReceivedAt: new Date(),
        webhookEventId: event.id,
        metadata: {
          ...paymentIntent.metadata,
          failureReason: paymentIntent.last_payment_error?.message,
        },
      },
    });

    logger.info('Payment intent failed record created/updated', {
      context: 'StripeProvider.handlePaymentIntentFailed',
      paymentId: payment.id,
      paymentIntentId: paymentIntent.id,
      clientId: client.id,
    });

    return payment.id;
  }

  /**
   * Handle charge.succeeded webhook event
   */
  private async handleChargeSucceeded(
    event: any,
    prisma: any,
    PaymentStatus: any
  ): Promise<string> {
    const charge = event.data.object;

    // Find client by customer ID through subscription
    const subscription = await prisma.client_subscription.findFirst({
      where: { paymentProviderCustomerId: charge.customer },
      include: {
        client: true,
      },
    });

    if (!subscription || !subscription.client) {
      throw new Error(`Client not found for customer ID: ${charge.customer}`);
    }

    const client = subscription.client;

    // Create or update payment record
    const payment = await prisma.payment.upsert({
      where: { stripePaymentId: charge.payment_intent || charge.id },
      update: {
        status: PaymentStatus.SUCCEEDED,
        receiptUrl: charge.receipt_url,
        webhookReceivedAt: new Date(),
        webhookEventId: event.id,
        metadata: charge.metadata,
      },
      create: {
        intentId: client.id,
        stripePaymentId: charge.payment_intent || charge.id,
        amount: charge.amount,
        currency: charge.currency,
        status: PaymentStatus.SUCCEEDED,
        receiptUrl: charge.receipt_url,
        paymentMethod: charge.payment_method_details?.type,
        paymentMethodId: charge.payment_method,
        description: charge.description || `Charge ${charge.id}`,
        webhookReceivedAt: new Date(),
        webhookEventId: event.id,
        metadata: charge.metadata,
      },
    });

    logger.info('Charge succeeded record created/updated', {
      context: 'StripeProvider.handleChargeSucceeded',
      paymentId: payment.id,
      chargeId: charge.id,
      clientId: client.id,
    });

    return payment.id;
  }

  /**
   * Handle charge.failed webhook event
   */
  private async handleChargeFailed(
    event: any,
    prisma: any,
    PaymentStatus: any
  ): Promise<string> {
    const charge = event.data.object;

    // Find client by customer ID through subscription
    const subscription = await prisma.client_subscription.findFirst({
      where: { paymentProviderCustomerId: charge.customer },
      include: {
        client: true,
      },
    });

    if (!subscription || !subscription.client) {
      throw new Error(`Client not found for customer ID: ${charge.customer}`);
    }

    const client = subscription.client;

    // Create or update payment record
    const payment = await prisma.payment.upsert({
      where: { stripePaymentId: charge.payment_intent || charge.id },
      update: {
        status: PaymentStatus.FAILED,
        webhookReceivedAt: new Date(),
        webhookEventId: event.id,
        metadata: {
          ...charge.metadata,
          failureReason: charge.failure_message,
        },
      },
      create: {
        intentId: client.id,
        stripePaymentId: charge.payment_intent || charge.id,
        amount: charge.amount,
        currency: charge.currency,
        status: PaymentStatus.FAILED,
        description: `Failed charge ${charge.id}`,
        webhookReceivedAt: new Date(),
        webhookEventId: event.id,
        metadata: {
          ...charge.metadata,
          failureReason: charge.failure_message,
        },
      },
    });

    logger.info('Charge failed record created/updated', {
      context: 'StripeProvider.handlePaymentIntentFailed',
      paymentId: payment.id,
      chargeId: charge.id,
      clientId: client.id,
    });

    return payment.id;
  }

  /**
   * Get a specific invoice by ID from Stripe
   */
  async getInvoice(invoiceId: string): Promise<IStripeInvoice> {
    try {
      logger.info('Fetching invoice from Stripe', {
        context: 'StripeProvider.getInvoice',
        invoiceId,
      });

      const invoice = await this.stripe.invoices.retrieve(invoiceId);

      const mappedInvoice: IStripeInvoice = {
        id: invoice.id || '',
        customerId: invoice.customer as string,
        subscriptionId: (invoice as any).subscription as string,
        status: invoice.status || 'unknown',
        amountDue: invoice.amount_due,
        amountPaid: invoice.amount_paid,
        currency: invoice.currency,
        invoiceDate: new Date(invoice.created * 1000),
        dueDate: new Date(invoice.due_date! * 1000),
        paidAt: (invoice as any).status_paid_at
          ? new Date((invoice as any).status_paid_at * 1000)
          : undefined,
        invoicePdf: invoice.invoice_pdf || undefined,
        hostedInvoiceUrl: invoice.hosted_invoice_url || undefined,
        description: invoice.description || undefined,
        metadata: invoice.metadata || {},
      };

      logger.info('Invoice fetched successfully', {
        context: 'StripeProvider.getInvoice',
        invoiceId,
        status: invoice.status,
      });

      return mappedInvoice;
    } catch (error) {
      logger.error('Failed to get Stripe invoice', {
        context: 'StripeProvider.getInvoice',
        invoiceId,
        error,
      });

      // Handle specific Stripe errors
      if (error instanceof Error) {
        if (error.message.includes('No such invoice')) {
          throw new AppError('Invoice not found', 404, ErrorCode.NOT_FOUND);
        }
      }

      throw new AppError(
        'Failed to retrieve invoice from payment system',
        500,
        ErrorCode.PAYMENT_GATEWAY_ERROR
      );
    }
  }
}
