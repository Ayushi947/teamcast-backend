import { IPaymentMethod } from '@/shared/models/domain/common/subscription.domain';
import {
  IStripeInvoice,
  IStripeInvoiceListRequest,
} from '@/shared/models/domain/common/stripe.domain';

/**
 * Interface for payment providers (Stripe, PayPal, etc.)
 */
export interface IPaymentProvider {
  /**
   * Create a customer in the payment provider
   * @param email Customer email
   * @param name Customer name
   * @param metadata Additional metadata
   */
  createCustomer(
    email: string,
    name: string,
    metadata?: Record<string, any>
  ): Promise<string>;

  /**
   * Update a customer in the payment provider
   * @param customerId Customer ID in the payment provider
   * @param data Customer data to update
   */
  updateCustomer(
    customerId: string,
    data: {
      email?: string;
      name?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<void>;

  /**
   * Create or update a subscription for a customer
   * @param customerId Customer ID in the payment provider
   * @param productId Product ID in the payment provider
   * @param priceId Price ID in the payment provider
   * @param metadata Additional metadata
   */
  createOrUpdateSubscription(
    customerId: string,
    productId: string,
    priceId: string,
    metadata?: Record<string, any>
  ): Promise<{
    subscriptionId: string;
    status: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  }>;

  /**
   * Cancel a subscription
   * @param subscriptionId Subscription ID in the payment provider
   */
  cancelSubscription(subscriptionId: string): Promise<{
    subscriptionId: string;
    status: string;
    canceledAt: Date;
  }>;

  /**
   * Get all payment methods for a customer
   * @param customerId Customer ID in the payment provider
   */
  getPaymentMethods(customerId: string): Promise<IPaymentMethod[]>;

  /**
   * Add a payment method for a customer
   * @param customerId Customer ID in the payment provider
   * @param paymentMethodId Payment method ID
   * @param isDefault Whether this should be the default payment method
   */
  addPaymentMethod(
    customerId: string,
    paymentMethodId: string,
    isDefault?: boolean
  ): Promise<IPaymentMethod[]>;

  /**
   * Remove a payment method from a customer
   * @param customerId Customer ID in the payment provider
   * @param paymentMethodId Payment method ID to remove
   */
  removePaymentMethod(
    customerId: string,
    paymentMethodId: string
  ): Promise<IPaymentMethod[]>;

  /**
   * Set a payment method as the default for a customer
   * @param customerId Customer ID in the payment provider
   * @param paymentMethodId Payment method ID to set as default
   */
  setDefaultPaymentMethod(
    customerId: string,
    paymentMethodId: string
  ): Promise<IPaymentMethod[]>;

  /**
   * Get invoices for a customer
   * @param customerId Customer ID in the payment provider
   * @param options Invoice list options (pagination, filters)
   */
  getInvoices(
    customerId: string,
    options?: IStripeInvoiceListRequest
  ): Promise<{
    invoices: IStripeInvoice[];
    hasMore: boolean;
    totalCount: number;
  }>;

  /**
   * Get a specific invoice by ID
   * @param invoiceId Invoice ID in the payment provider
   */
  getInvoice(invoiceId: string): Promise<IStripeInvoice>;
}
