import { ApiService } from '../core/api.service';

import type {
  IClientSubscriptionUpdate,
  IClientSubscriptionCancel,
  IClientAddPaymentMethodRequest,
  IClientPaymentMethodParams,
  IClientSetDefaultPaymentMethodRequest,
  IClientSubscription,
  IClientSubscriptionPackage,
  IClientSubscriptionPackageFilterQuery,
} from '../../models/domain/client/subscription.domain';

import type { IClientLogCandidateViewApiResponse } from '../../models/api/client/subscription.api';

import {
  IPaginationRequest,
  IPaginatedResponse,
} from '../../models/api/common/common.api';
import { IPaymentMethod } from '../../models/domain/common/subscription.domain';
import { singleton } from '../../decorators/singleton';
/**
 * API endpoints for subscription related operations
 */
const SUBSCRIPTION_ENDPOINTS = {
  BASE: '/client/subscription',
  PACKAGES: '/client/subscription/packages',
  PAYMENT_METHODS: '/client/subscription/payment-methods',
  DEFAULT_PAYMENT_METHOD: '/client/subscription/payment-methods/default',
  CANDIDATE_VIEW: '/client/subscription/candidate-view',
} as const;

@singleton
export class ClientSubscriptionApiService extends ApiService {
  /**
   * Get current subscription
   */
  public async getSubscription(): Promise<IClientSubscription> {
    try {
      return await this.apiGet<IClientSubscription>(
        SUBSCRIPTION_ENDPOINTS.BASE
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update subscription
   */
  public async updateSubscription(
    data: IClientSubscriptionUpdate
  ): Promise<IClientSubscriptionUpdate> {
    try {
      return await this.apiPatch<IClientSubscriptionUpdate>(
        SUBSCRIPTION_ENDPOINTS.BASE,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Cancel subscription
   */
  public async cancelSubscription(
    data: IClientSubscriptionCancel
  ): Promise<IClientSubscription> {
    try {
      return await this.apiDelete<IClientSubscription>(
        `${SUBSCRIPTION_ENDPOINTS.BASE}`,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get available subscription packages
   */
  public async getSubscriptionPackages(
    params?: IClientSubscriptionPackageFilterQuery & IPaginationRequest
  ): Promise<IPaginatedResponse<IClientSubscriptionPackage>> {
    try {
      return await this.apiGet<IPaginatedResponse<IClientSubscriptionPackage>>(
        `${SUBSCRIPTION_ENDPOINTS.PACKAGES}${params ? this.buildQueryString(params) : ''}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get payment methods
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
   * Add payment method
   */
  public async addPaymentMethod(
    data: IClientAddPaymentMethodRequest
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
   * Remove payment method
   */
  public async removePaymentMethod(
    params: IClientPaymentMethodParams
  ): Promise<IPaymentMethod[]> {
    try {
      return await this.apiDelete<IPaymentMethod[]>(
        `${SUBSCRIPTION_ENDPOINTS.PAYMENT_METHODS}/${params.paymentMethodId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Set default payment method
   */
  public async setDefaultPaymentMethod(
    data: IClientSetDefaultPaymentMethodRequest
  ): Promise<IPaymentMethod[]> {
    try {
      return await this.apiPatch<IPaymentMethod[]>(
        `${SUBSCRIPTION_ENDPOINTS.DEFAULT_PAYMENT_METHOD}/${data.paymentMethodId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Log a candidate view and deduct from subscription if not already viewed
   */
  public async logCandidateView(
    candidateId: string,
    jobPostingId?: string,
    viewContext?: string
  ): Promise<IClientLogCandidateViewApiResponse> {
    try {
      return await this.apiPost<IClientLogCandidateViewApiResponse>(
        SUBSCRIPTION_ENDPOINTS.CANDIDATE_VIEW,
        {
          candidateId,
          jobPostingId,
          viewContext,
        }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
