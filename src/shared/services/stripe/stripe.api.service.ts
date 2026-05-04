import { ApiService } from '../core/api.service';
import { singleton } from '../../decorators/singleton';
import {
  IStripeCustomer,
  IStripeCustomerCreate,
  IStripePrice,
  IStripePriceCreate,
  IStripeProduct,
  IStripeProductCreate,
  IStripeSubscription,
  IStripeSubscriptionCreate,
  IStripeInvoice,
  IStripeInvoiceListRequest,
} from '../../models/domain/common/stripe.domain';
import { IPaymentMethod } from '../../models/domain/common/subscription.domain';

/**
 * API endpoints for Stripe related operations
 */
const STRIPE_ENDPOINTS = {
  BASE: '/stripe',
  CUSTOMERS: '/stripe/customers',
  SUBSCRIPTIONS: '/stripe/subscriptions',
  PAYMENT_METHODS: '/stripe/payment-methods',
  PRODUCTS: '/stripe/products',
  CHECKOUT: '/stripe/checkout',
  INVOICES: '/stripe/invoices',
} as const;

/**
 * Service for handling Stripe related API operations
 */
@singleton
export class StripeApiService extends ApiService {
  /**
   * Creates a new customer in Stripe
   * @param data - Customer data including email and name
   * @returns Promise resolving to the created customer
   * @throws Error if the API request fails
   */
  public async createCustomer(
    data: IStripeCustomerCreate
  ): Promise<IStripeCustomer> {
    try {
      return await this.apiPost<IStripeCustomer>(
        STRIPE_ENDPOINTS.CUSTOMERS,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Updates an existing customer in Stripe
   * @param customerId - The ID of the customer to update
   * @param data - Updated customer data
   * @returns Promise resolving to the update result
   * @throws Error if the API request fails
   */
  public async updateCustomer(
    customerId: string,
    data: Partial<IStripeCustomerCreate>
  ): Promise<{ success: boolean }> {
    try {
      return await this.apiPatch<{ success: boolean }>(
        `${STRIPE_ENDPOINTS.CUSTOMERS}/${customerId}`,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Creates or updates a subscription for a customer
   * @param customerId - The ID of the customer
   * @param data - Subscription data including product and price IDs
   * @returns Promise resolving to the subscription details
   * @throws Error if the API request fails
   */
  public async createOrUpdateSubscription(
    customerId: string,
    data: IStripeSubscriptionCreate
  ): Promise<IStripeSubscription> {
    try {
      return await this.apiPost(
        `${STRIPE_ENDPOINTS.CUSTOMERS}/${customerId}/subscriptions`,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Cancels an active subscription
   * @param subscriptionId - The ID of the subscription to cancel
   * @returns Promise resolving to the cancellation result
   * @throws Error if the API request fails
   */
  public async cancelSubscription(
    subscriptionId: string
  ): Promise<IStripeSubscription> {
    try {
      return await this.apiDelete(
        `${STRIPE_ENDPOINTS.SUBSCRIPTIONS}/${subscriptionId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Retrieves all payment methods for a customer
   * @param customerId - The ID of the customer
   * @returns Promise resolving to the list of payment methods
   * @throws Error if the API request fails
   */
  public async getPaymentMethods(customerId: string): Promise<{
    paymentMethods: IPaymentMethod[];
  }> {
    try {
      return await this.apiGet(
        `${STRIPE_ENDPOINTS.CUSTOMERS}/${customerId}/payment-methods`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Adds a new payment method for a customer
   * @param customerId - The ID of the customer
   * @param data - Payment method data
   * @returns Promise resolving to the updated payment methods
   * @throws Error if the API request fails
   */
  public async addPaymentMethod(
    customerId: string,
    data: { paymentMethodId: string; isDefault?: boolean }
  ): Promise<{ paymentMethods: IPaymentMethod[] }> {
    try {
      return await this.apiPost(
        `${STRIPE_ENDPOINTS.CUSTOMERS}/${customerId}/payment-methods`,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Removes a payment method from a customer
   * @param customerId - The ID of the customer
   * @param paymentMethodId - The ID of the payment method to remove
   * @returns Promise resolving to the updated payment methods
   * @throws Error if the API request fails
   */
  public async removePaymentMethod(
    customerId: string,
    paymentMethodId: string
  ): Promise<{ paymentMethods: IPaymentMethod[] }> {
    try {
      return await this.apiDelete(
        `${STRIPE_ENDPOINTS.CUSTOMERS}/${customerId}/payment-methods/${paymentMethodId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Sets a payment method as default for a customer
   * @param customerId - The ID of the customer
   * @param data - Payment method data
   * @returns Promise resolving to the updated payment methods
   * @throws Error if the API request fails
   */
  public async setDefaultPaymentMethod(
    customerId: string,
    data: { paymentMethodId: string }
  ): Promise<{ paymentMethods: IPaymentMethod[] }> {
    try {
      return await this.apiPatch(
        `${STRIPE_ENDPOINTS.CUSTOMERS}/${customerId}/payment-methods/default`,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Creates a new product in Stripe (admin only)
   * @param data - Product data
   * @returns Promise resolving to the created product
   * @throws Error if the API request fails
   */
  public async createProduct(
    data: IStripeProductCreate
  ): Promise<IStripeProduct> {
    try {
      return await this.apiPost(STRIPE_ENDPOINTS.PRODUCTS, data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Creates a new price for a product in Stripe (admin only)
   * @param productId - The ID of the product
   * @param data - Price data
   * @returns Promise resolving to the created price
   * @throws Error if the API request fails
   */
  public async createPrice(
    productId: string,
    data: IStripePriceCreate
  ): Promise<IStripePrice> {
    try {
      return await this.apiPost(
        `${STRIPE_ENDPOINTS.PRODUCTS}/${productId}/prices`,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Creates a checkout session for subscription payment
   * @param data - Checkout session data
   * @returns Promise resolving to the created checkout session
   * @throws Error if the API request fails
   */
  public async createCheckoutSession(data: {
    packageId: string;
    successUrl: string;
    cancelUrl: string;
    customerEmail?: string;
    metadata?: Record<string, any>;
  }): Promise<{
    sessionId: string;
    url: string;
    expiresAt: string;
  }> {
    try {
      return await this.apiPost(`${STRIPE_ENDPOINTS.CHECKOUT}/sessions`, data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Retrieves a checkout session
   * @param sessionId - The ID of the checkout session
   * @returns Promise resolving to the checkout session details
   * @throws Error if the API request fails
   */
  public async retrieveCheckoutSession(sessionId: string): Promise<{
    sessionId: string;
    status: string;
    paymentStatus: string;
    customerId?: string;
    subscriptionId?: string;
    amountTotal: number;
    currency: string;
    expiresAt: string;
    metadata?: Record<string, any>;
  }> {
    try {
      return await this.apiGet(
        `${STRIPE_ENDPOINTS.CHECKOUT}/sessions/${sessionId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Syncs subscription data from Stripe
   * @param data - Subscription sync data
   * @returns Promise resolving to the synced subscription details
   * @throws Error if the API request fails
   */
  public async syncSubscriptionFromStripe(data: {
    subscriptionId: string;
    autoRenew?: boolean;
  }): Promise<{
    subscriptionId: string;
    status: string;
    customerId: string;
    packageId: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
  }> {
    try {
      return await this.apiPost(`${STRIPE_ENDPOINTS.SUBSCRIPTIONS}/sync`, data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Syncs subscription status from Stripe
   * @param subscriptionId - The ID of the subscription to sync
   * @returns Promise resolving to the synced subscription status
   * @throws Error if the API request fails
   */
  public async syncSubscriptionStatus(subscriptionId: string): Promise<{
    subscriptionId: string;
    status: string;
    lastBillingDate: string;
    nextBillingDate: string | null;
  }> {
    try {
      return await this.apiPost(
        `${STRIPE_ENDPOINTS.SUBSCRIPTIONS}/${subscriptionId}/sync-status`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Complete checkout and sync subscription data
   * @param data - Checkout completion data
   * @returns Promise resolving to the synced subscription details
   * @throws Error if the API request fails
   */
  public async completeCheckoutAndSync(data: {
    sessionId: string;
    clientId: string;
    autoRenew?: boolean;
  }): Promise<{
    subscriptionId: string;
    status: string;
    customerId: string;
    packageId: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
  }> {
    try {
      return await this.apiPost(`${STRIPE_ENDPOINTS.CHECKOUT}/complete`, data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get invoices for a customer
   * @param customerId - The ID of the customer
   * @param options - Invoice list options (pagination, filters)
   * @returns Promise resolving to the list of invoices
   * @throws Error if the API request fails
   */
  public async getInvoices(
    customerId: string,
    options?: IStripeInvoiceListRequest
  ): Promise<{
    invoices: IStripeInvoice[];
    hasMore: boolean;
    totalCount: number;
  }> {
    try {
      const queryParams = new URLSearchParams();

      if (options?.limit) {
        queryParams.append('limit', options.limit.toString());
      }
      if (options?.startingAfter) {
        queryParams.append('startingAfter', options.startingAfter);
      }
      if (options?.endingBefore) {
        queryParams.append('endingBefore', options.endingBefore);
      }
      if (options?.status) {
        queryParams.append('status', options.status);
      }
      if (options?.subscriptionId) {
        queryParams.append('subscriptionId', options.subscriptionId);
      }

      const queryString = queryParams.toString();
      const url = queryString
        ? `${STRIPE_ENDPOINTS.CUSTOMERS}/${customerId}/invoices?${queryString}`
        : `${STRIPE_ENDPOINTS.CUSTOMERS}/${customerId}/invoices`;

      return await this.apiGet(url);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a specific invoice by ID
   * @param invoiceId - The ID of the invoice
   * @returns Promise resolving to the invoice details
   * @throws Error if the API request fails
   */
  public async getInvoice(invoiceId: string): Promise<IStripeInvoice> {
    try {
      return await this.apiGet(`${STRIPE_ENDPOINTS.INVOICES}/${invoiceId}`);
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
