import { Request, Response, NextFunction } from 'express';
import { CandidateSubscriptionService } from '@/services/candidate/subscription.service';
import { logger } from '@/shared/utils/logger';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import {
  ICandidateSubscriptionGetApiResponse,
  ICandidateSubscriptionUpdateApiRequest,
  ICandidateSubscriptionUpdateApiResponse,
  ICandidateSubscriptionCancelApiRequest,
  ICandidateSubscriptionCancelApiResponse,
  ICandidateSubscriptionPackagesApiRequest,
  ICandidateSubscriptionPackagesApiResponse,
  ICandidatePaymentMethodsApiResponse,
  ICandidateAddPaymentMethodApiRequest,
  ICandidateAddPaymentMethodApiResponse,
  ICandidateRemovePaymentMethodApiRequest,
  ICandidateRemovePaymentMethodApiResponse,
  ICandidateSetDefaultPaymentMethodApiRequest,
  ICandidateSetDefaultPaymentMethodApiResponse,
} from '@/shared/models/api/candidate/subscription.api';

export class CandidateSubscriptionController extends BaseController {
  constructor(
    private readonly subscriptionService: CandidateSubscriptionService
  ) {
    super();
  }

  /**
   * Get the current subscription for a candidate
   */
  getCurrentSubscription = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateSubscriptionGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user.candidateId as string;

        logger.info({
          message: 'Getting candidate subscription',
          context: 'CandidateSubscriptionController.getCurrentSubscription',
          candidateId,
        });

        return await this.subscriptionService.getCurrentSubscription(
          candidateId
        );
      }
    );
  };

  /**
   * Get available subscription packages
   */
  getSubscriptionPackages = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateSubscriptionPackagesApiResponse>(
      req,
      res,
      next,
      async () => {
        const packagesRequest =
          createIApiRequest<ICandidateSubscriptionPackagesApiRequest>(req);

        logger.info({
          message: 'Getting subscription packages',
          context: 'CandidateSubscriptionController.getSubscriptionPackages',
          filters: packagesRequest.filters,
          pagination: packagesRequest.pagination,
        });

        return await this.subscriptionService.getSubscriptionPackages(
          packagesRequest.filters,
          packagesRequest.pagination
        );
      }
    );
  };

  /**
   * Update (upgrade/downgrade) a candidate's subscription
   */
  updateSubscription = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateSubscriptionUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user.candidateId as string;
        const updateRequest =
          createIApiRequest<ICandidateSubscriptionUpdateApiRequest>(req);

        logger.info({
          message: 'Updating candidate subscription',
          context: 'CandidateSubscriptionController.updateSubscription',
          candidateId,
          packageId: updateRequest.data.packageId,
        });

        return await this.subscriptionService.updateSubscription(
          candidateId,
          updateRequest.data
        );
      }
    );
  };

  /**
   * Cancel a candidate's subscription
   */
  cancelSubscription = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateSubscriptionCancelApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user.candidateId as string;
        const cancelRequest =
          createIApiRequest<ICandidateSubscriptionCancelApiRequest>(req);

        logger.info({
          message: 'Cancelling candidate subscription',
          context: 'CandidateSubscriptionController.cancelSubscription',
          candidateId,
          reason: cancelRequest.data.reason,
        });

        return await this.subscriptionService.cancelSubscription(
          candidateId,
          cancelRequest.data
        );
      }
    );
  };

  /**
   * Get a candidate's payment methods
   */
  getPaymentMethods = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidatePaymentMethodsApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user.candidateId as string;

        logger.info({
          message: 'Getting candidate payment methods',
          context: 'CandidateSubscriptionController.getPaymentMethods',
          candidateId,
        });

        return await this.subscriptionService.getPaymentMethods(candidateId);
      }
    );
  };

  /**
   * Add a payment method for a candidate
   */
  addPaymentMethod = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateAddPaymentMethodApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user.candidateId as string;
        const addRequest =
          createIApiRequest<ICandidateAddPaymentMethodApiRequest>(req);

        logger.info({
          message: 'Adding candidate payment method',
          context: 'CandidateSubscriptionController.addPaymentMethod',
          candidateId,
          paymentMethodId: addRequest.data.paymentMethodId,
          isDefault: addRequest.data.isDefault,
        });

        return await this.subscriptionService.addPaymentMethod(
          candidateId,
          addRequest.data.paymentMethodId,
          addRequest.data.isDefault
        );
      }
    );
  };

  /**
   * Remove a payment method from a candidate
   */
  removePaymentMethod = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateRemovePaymentMethodApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user.candidateId as string;
        const removeRequest =
          createIApiRequest<ICandidateRemovePaymentMethodApiRequest>(req);

        logger.info({
          message: 'Removing candidate payment method',
          context: 'CandidateSubscriptionController.removePaymentMethod',
          candidateId,
          paymentMethodId: removeRequest.params.paymentMethodId,
        });

        return await this.subscriptionService.removePaymentMethod(
          candidateId,
          removeRequest.params.paymentMethodId
        );
      }
    );
  };

  /**
   * Set a payment method as default for a candidate
   */
  setDefaultPaymentMethod = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ICandidateSetDefaultPaymentMethodApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user.candidateId as string;
        const setDefaultRequest =
          createIApiRequest<ICandidateSetDefaultPaymentMethodApiRequest>(req);

        logger.info({
          message: 'Setting default payment method',
          context: 'CandidateSubscriptionController.setDefaultPaymentMethod',
          candidateId,
          paymentMethodId: setDefaultRequest.data.paymentMethodId,
        });

        return await this.subscriptionService.setDefaultPaymentMethod(
          candidateId,
          setDefaultRequest.data.paymentMethodId
        );
      }
    );
  };
}
