import { ApiService } from '../core/api.service';
import {
  ICandidateSubscription,
  ICandidateSubscriptionCancel,
  ICandidateSubscriptionPackage,
  ICandidateSubscriptionUpdate,
  ICandidateAddPaymentMethod,
  ICandidateSetDefaultPaymentMethod,
  ICandidateSubscriptionPackageFilterQuery,
} from '../../models/domain/candidate/subscription.domain';

import {
  IPaginatedResponse,
  IPaginationRequest,
} from '../../models/api/common/common.api';

import { IPaymentMethod } from '../../models/domain/common/subscription.domain';
import { singleton } from '../../decorators/singleton';
/**
 * API endpoints for subscription related operations
 */
const SUBSCRIPTION_ENDPOINTS = {
  BASE: '/candidate/subscription',
  PACKAGES: '/candidate/subscription/packages',
  PAYMENT_METHODS: '/candidate/subscription/payment-methods',
  DEFAULT_PAYMENT_METHOD: '/candidate/subscription/payment-methods/default',
} as const;

/**
 * Service for handling subscription related API operations
 */
@singleton
export class CandidateSubscriptionApiService extends ApiService {
  /**
   * Retrieves the current subscription details
   * @returns Promise resolving to the current subscription details
   * @throws Error if the API request fails
   */
  public async getCurrentSubscription(): Promise<ICandidateSubscription> {
    try {
      return await this.apiGet<ICandidateSubscription>(
        SUBSCRIPTION_ENDPOINTS.BASE
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Updates the current subscription
   * @param data - The subscription update data
   * @returns Promise resolving to the updated subscription details
   * @throws Error if the API request fails
   */
  public async updateSubscription(
    data: ICandidateSubscriptionUpdate
  ): Promise<ICandidateSubscription> {
    try {
      return await this.apiPatch<ICandidateSubscription>(
        SUBSCRIPTION_ENDPOINTS.BASE,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Cancels the current subscription
   * @param data - The subscription cancellation data
   * @returns Promise resolving to the cancellation response
   * @throws Error if the API request fails
   */
  public async cancelSubscription(
    data: ICandidateSubscriptionCancel
  ): Promise<ICandidateSubscription> {
    try {
      return await this.apiDelete<ICandidateSubscription>(
        SUBSCRIPTION_ENDPOINTS.BASE,
        { data }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Retrieves available subscription packages
   * @param filter - Optional pagination parameters
   * @returns Promise resolving to the subscription packages
   * @throws Error if the API request fails
   */
  public async getSubscriptionPackages(
    filter?: ICandidateSubscriptionPackageFilterQuery & IPaginationRequest
  ): Promise<IPaginatedResponse<ICandidateSubscriptionPackage>> {
    try {
      return await this.apiGet<
        IPaginatedResponse<ICandidateSubscriptionPackage>
      >(SUBSCRIPTION_ENDPOINTS.PACKAGES, {
        params: this.buildPaginationParams(filter),
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Retrieves available payment methods
   * @returns Promise resolving to the payment methods
   * @throws Error if the API request fails
   */
  public async getPaymentMethods(): Promise<IPaymentMethod[]> {
    try {
      return await this.apiGet<IPaymentMethod[]>(
        SUBSCRIPTION_ENDPOINTS.PAYMENT_METHODS
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Adds a new payment method
   * @param data - The payment method data
   * @returns Promise resolving to the added payment method details
   * @throws Error if the API request fails
   */
  public async addPaymentMethod(
    data: ICandidateAddPaymentMethod
  ): Promise<IPaymentMethod[]> {
    try {
      return await this.apiPost<IPaymentMethod[]>(
        SUBSCRIPTION_ENDPOINTS.PAYMENT_METHODS,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Removes a payment method
   * @param paymentMethodId - The ID of the payment method to remove
   * @returns Promise resolving to the removal response
   * @throws Error if the API request fails
   */
  public async removePaymentMethod(
    paymentMethodId: string
  ): Promise<IPaymentMethod[]> {
    try {
      return await this.apiDelete<IPaymentMethod[]>(
        `${SUBSCRIPTION_ENDPOINTS.PAYMENT_METHODS}/${paymentMethodId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Sets the default payment method
   * @param data - The default payment method data
   * @returns Promise resolving to the updated payment method details
   * @throws Error if the API request fails
   */
  public async setDefaultPaymentMethod(
    data: ICandidateSetDefaultPaymentMethod
  ): Promise<IPaymentMethod[]> {
    try {
      return await this.apiPatch<IPaymentMethod[]>(
        SUBSCRIPTION_ENDPOINTS.DEFAULT_PAYMENT_METHOD,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
