import { IPaymentProvider } from './payment.interface';
import { IPaymentMethod } from '@/shared/models/domain/common/subscription.domain';
import {
  IStripeInvoice,
  IStripeInvoiceListRequest,
} from '@/shared/models/domain/common/stripe.domain';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';
import { singleton } from '@/shared/decorators/singleton';

/**
 * Dummy payment provider for testing or environments without real payment integration
 */
@singleton
export class DummyProvider implements IPaymentProvider {
  // In-memory storage for dummy data
  private customers: Map<string, any> = new Map();
  private subscriptions: Map<string, any> = new Map();
  private paymentMethods: Map<string, Map<string, IPaymentMethod>> = new Map();
  private defaultPaymentMethods: Map<string, string> = new Map();
  private invoices: Map<string, IStripeInvoice> = new Map();

  constructor() {
    logger.info('Using Dummy Payment Provider');
  }

  /**
   * Create a customer
   */
  async createCustomer(
    email: string,
    name: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    try {
      // Generate a fake customer ID
      const customerId = `cus_dummy_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      // Store customer data
      this.customers.set(customerId, {
        id: customerId,
        email,
        name,
        metadata: metadata || {},
        created: new Date(),
      });

      logger.info(`Dummy: Created customer ${customerId}`, { email, name });
      return customerId;
    } catch (error) {
      logger.error('Failed to create dummy customer', {
        context: 'DummyProvider.createCustomer',
        email,
        error,
      });
      throw new AppError(
        'Failed to create customer in payment system',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Update a customer
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
      const customer = this.customers.get(customerId);
      if (!customer) {
        throw new AppError('Customer not found', 404, ErrorCode.NOT_FOUND);
      }

      // Update customer data
      if (data.email) customer.email = data.email;
      if (data.name) customer.name = data.name;
      if (data.metadata) {
        customer.metadata = { ...customer.metadata, ...data.metadata };
      }

      this.customers.set(customerId, customer);
      logger.info(`Dummy: Updated customer ${customerId}`);
    } catch (error) {
      if (error instanceof AppError) throw error;

      logger.error('Failed to update dummy customer', {
        context: 'DummyProvider.updateCustomer',
        customerId,
        error,
      });
      throw new AppError(
        'Failed to update customer in payment system',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Create or update a subscription
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
      // Check if customer exists
      if (!this.customers.has(customerId)) {
        throw new AppError('Customer not found', 404, ErrorCode.NOT_FOUND);
      }

      // Check for existing subscription
      let subscriptionId = '';
      let existingSubscription = null;

      // Find subscription for this customer
      for (const [id, sub] of this.subscriptions.entries()) {
        if (sub.customerId === customerId && sub.status === 'active') {
          subscriptionId = id;
          existingSubscription = sub;
          break;
        }
      }

      const now = new Date();
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1); // 1 month subscription

      if (existingSubscription) {
        // Update existing subscription
        existingSubscription.productId = productId;
        existingSubscription.priceId = priceId;
        existingSubscription.metadata = metadata || {};
        existingSubscription.updatedAt = now;

        this.subscriptions.set(subscriptionId, existingSubscription);
        logger.info(
          `Dummy: Updated subscription ${subscriptionId} for customer ${customerId}`
        );
      } else {
        // Create new subscription
        subscriptionId = `sub_dummy_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const newSubscription = {
          id: subscriptionId,
          customerId,
          productId,
          priceId,
          status: 'active',
          metadata: metadata || {},
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          createdAt: now,
          updatedAt: now,
        };

        this.subscriptions.set(subscriptionId, newSubscription);
        logger.info(
          `Dummy: Created subscription ${subscriptionId} for customer ${customerId}`
        );

        // Create a dummy invoice for the new subscription
        this.createDummyInvoice(customerId, subscriptionId, 9999, 'paid');
        logger.info(
          `Dummy: Created invoice for subscription ${subscriptionId}`
        );
      }

      const subscription = this.subscriptions.get(subscriptionId);

      return {
        subscriptionId,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;

      logger.error('Failed to create/update dummy subscription', {
        context: 'DummyProvider.createOrUpdateSubscription',
        customerId,
        productId,
        priceId,
        error,
      });
      throw new AppError(
        'Failed to create or update subscription in payment system',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<{
    subscriptionId: string;
    status: string;
    canceledAt: Date;
  }> {
    try {
      const subscription = this.subscriptions.get(subscriptionId);
      if (!subscription) {
        throw new AppError('Subscription not found', 404, ErrorCode.NOT_FOUND);
      }

      // Update subscription status
      subscription.status = 'canceled';
      subscription.canceledAt = new Date();
      this.subscriptions.set(subscriptionId, subscription);

      logger.info(`Dummy: Canceled subscription ${subscriptionId}`);

      return {
        subscriptionId,
        status: subscription.status,
        canceledAt: subscription.canceledAt,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;

      logger.error('Failed to cancel dummy subscription', {
        context: 'DummyProvider.cancelSubscription',
        subscriptionId,
        error,
      });
      throw new AppError(
        'Failed to cancel subscription in payment system',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get all payment methods for a customer
   */
  async getPaymentMethods(customerId: string): Promise<IPaymentMethod[]> {
    try {
      if (!this.customers.has(customerId)) {
        throw new AppError('Customer not found', 404, ErrorCode.NOT_FOUND);
      }

      // Get customer's payment methods
      const customerPaymentMethods =
        this.paymentMethods.get(customerId) || new Map();
      const defaultPaymentMethodId = this.defaultPaymentMethods.get(customerId);

      // Convert to array and add isDefault flag
      const result: IPaymentMethod[] = Array.from(
        customerPaymentMethods.values()
      ).map((pm) => ({
        ...pm,
        isDefault: pm.id === defaultPaymentMethodId,
      }));

      return result;
    } catch (error) {
      if (error instanceof AppError) throw error;

      logger.error('Failed to get dummy payment methods', {
        context: 'DummyProvider.getPaymentMethods',
        customerId,
        error,
      });
      throw new AppError(
        'Failed to retrieve payment methods from payment system',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Add a payment method for a customer
   */
  async addPaymentMethod(
    customerId: string,
    paymentMethodId: string,
    isDefault?: boolean
  ): Promise<IPaymentMethod[]> {
    try {
      if (!this.customers.has(customerId)) {
        throw new AppError('Customer not found', 404, ErrorCode.NOT_FOUND);
      }

      // Initialize payment methods map for this customer if it doesn't exist
      if (!this.paymentMethods.has(customerId)) {
        this.paymentMethods.set(customerId, new Map());
      }

      const customerPaymentMethods = this.paymentMethods.get(customerId)!;

      // Create a dummy payment method
      const newPaymentMethod: IPaymentMethod = {
        id: paymentMethodId,
        type: 'card',
        brand: 'visa', // Default dummy brand
        last4: paymentMethodId.substring(paymentMethodId.length - 4),
        expMonth: 12,
        expYear: new Date().getFullYear() + 2,
        isDefault: false,
      };

      // Add payment method
      customerPaymentMethods.set(paymentMethodId, newPaymentMethod);

      // Set as default if requested or if it's the first payment method
      if (isDefault || customerPaymentMethods.size === 1) {
        this.defaultPaymentMethods.set(customerId, paymentMethodId);
      }

      logger.info(
        `Dummy: Added payment method ${paymentMethodId} for customer ${customerId}`
      );

      // Return updated payment methods
      return await this.getPaymentMethods(customerId);
    } catch (error) {
      if (error instanceof AppError) throw error;

      logger.error('Failed to add dummy payment method', {
        context: 'DummyProvider.addPaymentMethod',
        customerId,
        paymentMethodId,
        error,
      });
      throw new AppError(
        'Failed to add payment method in payment system',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Remove a payment method from a customer
   */
  async removePaymentMethod(
    customerId: string,
    paymentMethodId: string
  ): Promise<IPaymentMethod[]> {
    try {
      if (!this.customers.has(customerId)) {
        throw new AppError('Customer not found', 404, ErrorCode.NOT_FOUND);
      }

      const customerPaymentMethods = this.paymentMethods.get(customerId);
      if (
        !customerPaymentMethods ||
        !customerPaymentMethods.has(paymentMethodId)
      ) {
        throw new AppError(
          'Payment method not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Check if it's the default payment method
      const defaultPaymentMethodId = this.defaultPaymentMethods.get(customerId);
      if (defaultPaymentMethodId === paymentMethodId) {
        throw new AppError(
          'Cannot remove default payment method. Please set a different payment method as default first.',
          400,
          ErrorCode.PAYMENT_METHOD_INVALID
        );
      }

      // Remove the payment method
      customerPaymentMethods.delete(paymentMethodId);

      logger.info(
        `Dummy: Removed payment method ${paymentMethodId} for customer ${customerId}`
      );

      // Return updated payment methods
      return await this.getPaymentMethods(customerId);
    } catch (error) {
      if (error instanceof AppError) throw error;

      logger.error('Failed to remove dummy payment method', {
        context: 'DummyProvider.removePaymentMethod',
        customerId,
        paymentMethodId,
        error,
      });
      throw new AppError(
        'Failed to remove payment method in payment system',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Set a payment method as the default for a customer
   */
  async setDefaultPaymentMethod(
    customerId: string,
    paymentMethodId: string
  ): Promise<IPaymentMethod[]> {
    try {
      if (!this.customers.has(customerId)) {
        throw new AppError('Customer not found', 404, ErrorCode.NOT_FOUND);
      }

      const customerPaymentMethods = this.paymentMethods.get(customerId);
      if (
        !customerPaymentMethods ||
        !customerPaymentMethods.has(paymentMethodId)
      ) {
        throw new AppError(
          'Payment method not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Set as default
      this.defaultPaymentMethods.set(customerId, paymentMethodId);

      logger.info(
        `Dummy: Set payment method ${paymentMethodId} as default for customer ${customerId}`
      );

      // Return updated payment methods
      return await this.getPaymentMethods(customerId);
    } catch (error) {
      if (error instanceof AppError) throw error;

      logger.error('Failed to set default dummy payment method', {
        context: 'DummyProvider.setDefaultPaymentMethod',
        customerId,
        paymentMethodId,
        error,
      });
      throw new AppError(
        'Failed to set default payment method in payment system',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get invoices for a customer
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
      if (!this.customers.has(customerId)) {
        throw new AppError('Customer not found', 404, ErrorCode.NOT_FOUND);
      }

      // Get all invoices for this customer
      let customerInvoices: IStripeInvoice[] = [];
      for (const [_invoiceId, invoice] of this.invoices.entries()) {
        if (invoice.customerId === customerId) {
          customerInvoices.push(invoice);
        }
      }

      // Apply filters
      if (options?.status) {
        customerInvoices = customerInvoices.filter(
          (invoice) => invoice.status === options.status
        );
      }

      if (options?.subscriptionId) {
        customerInvoices = customerInvoices.filter(
          (invoice) => invoice.subscriptionId === options.subscriptionId
        );
      }

      // Sort by invoice date (newest first)
      customerInvoices.sort(
        (a, b) => b.invoiceDate.getTime() - a.invoiceDate.getTime()
      );

      // Apply pagination
      const limit = Math.min(options?.limit || 10, 100);
      let hasMore = false;
      const totalCount = customerInvoices.length;

      // Apply cursor-based pagination
      if (options?.startingAfter) {
        const startIndex = customerInvoices.findIndex(
          (invoice) => invoice.id === options.startingAfter
        );
        if (startIndex !== -1) {
          customerInvoices = customerInvoices.slice(startIndex + 1);
        }
      }

      if (options?.endingBefore) {
        const endIndex = customerInvoices.findIndex(
          (invoice) => invoice.id === options.endingBefore
        );
        if (endIndex !== -1) {
          customerInvoices = customerInvoices.slice(0, endIndex);
        }
      }

      // Apply limit
      if (customerInvoices.length > limit) {
        hasMore = true;
        customerInvoices = customerInvoices.slice(0, limit);
      }

      logger.info(
        `Dummy: Retrieved ${customerInvoices.length} invoices for customer ${customerId}`
      );

      return {
        invoices: customerInvoices,
        hasMore,
        totalCount,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;

      logger.error('Failed to get dummy invoices', {
        context: 'DummyProvider.getInvoices',
        customerId,
        options,
        error,
      });
      throw new AppError(
        'Failed to retrieve invoices from payment system',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get a specific invoice by ID
   */
  async getInvoice(invoiceId: string): Promise<IStripeInvoice> {
    try {
      const invoice = this.invoices.get(invoiceId);
      if (!invoice) {
        throw new AppError('Invoice not found', 404, ErrorCode.NOT_FOUND);
      }

      logger.info(`Dummy: Retrieved invoice ${invoiceId}`);

      return invoice;
    } catch (error) {
      if (error instanceof AppError) throw error;

      logger.error('Failed to get dummy invoice', {
        context: 'DummyProvider.getInvoice',
        invoiceId,
        error,
      });
      throw new AppError(
        'Failed to retrieve invoice from payment system',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Create a dummy invoice for testing purposes
   */
  private createDummyInvoice(
    customerId: string,
    subscriptionId?: string,
    amount: number = 9999, // $99.99 in cents
    status: string = 'paid'
  ): IStripeInvoice {
    const invoiceId = `in_dummy_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + 30); // Due in 30 days

    const invoice: IStripeInvoice = {
      id: invoiceId,
      customerId,
      subscriptionId,
      status,
      amountDue: amount,
      amountPaid: status === 'paid' ? amount : 0,
      currency: 'usd',
      invoiceDate: now,
      dueDate,
      paidAt: status === 'paid' ? now : undefined,
      invoicePdf: `https://dummy.example.com/invoices/${invoiceId}.pdf`,
      hostedInvoiceUrl: `https://dummy.example.com/invoices/${invoiceId}`,
      description: 'Dummy invoice for testing purposes',
      metadata: {
        dummy: true,
        created_at: now.toISOString(),
      },
    };

    this.invoices.set(invoiceId, invoice);
    return invoice;
  }
}
