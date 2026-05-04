import { Request, Response, NextFunction } from 'express';
import { ClientSubscriptionService } from '@/services/client/subscription.service';
import { ClientSubscriptionLimitsService } from '@/services/client/subscription.limits.service';
import { logger } from '@/shared/utils/logger';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import {
  IClientSubscriptionGetApiResponse,
  IClientSubscriptionUpdateApiRequest,
  IClientSubscriptionUpdateApiResponse,
  IClientSubscriptionCancelApiRequest,
  IClientSubscriptionCancelApiResponse,
  IClientSubscriptionPackagesApiRequest,
  IClientSubscriptionPackagesApiResponse,
  IClientPaymentMethodsApiResponse,
  IClientAddPaymentMethodApiRequest,
  IClientAddPaymentMethodApiResponse,
  IClientRemovePaymentMethodApiRequest,
  IClientRemovePaymentMethodApiResponse,
  IClientSetDefaultPaymentMethodApiRequest,
  IClientSetDefaultPaymentMethodApiResponse,
  IClientLogCandidateViewApiResponse,
  IClientSubscriptionOverviewApiResponse,
} from '@/shared/models/api/client/subscription.api';

export class SubscriptionController extends BaseController {
  private readonly subscriptionLimitsService: ClientSubscriptionLimitsService;

  constructor(private readonly subscriptionService: ClientSubscriptionService) {
    super();
    this.subscriptionLimitsService = new ClientSubscriptionLimitsService();
  }

  /**
   * Get the current subscription for a client
   */
  getCurrentSubscription = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientSubscriptionGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;

        logger.info({
          message: 'Getting client subscription',
          context: 'SubscriptionController.getCurrentSubscription',
          clientId,
        });

        return await this.subscriptionService.getCurrentSubscription(clientId);
      }
    );
  };

  getCurrentSubscriptionOverview = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientSubscriptionOverviewApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;

        logger.info({
          message: 'Getting client subscription overview',
          context: 'SubscriptionController.getCurrentSubscriptionOverview',
          clientId,
        });

        return await this.subscriptionService.getCurrentSubscriptionOverview(
          clientId
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
    this.handleRequest<IClientSubscriptionPackagesApiResponse>(
      req,
      res,
      next,
      async () => {
        // Create API request with pagination
        const packagesRequest =
          createIApiRequest<IClientSubscriptionPackagesApiRequest>(req);

        logger.info({
          message: 'Getting subscription packages',
          context: 'SubscriptionController.getSubscriptionPackages',
          pagination: packagesRequest.pagination,
        });

        return await this.subscriptionService.getSubscriptionPackages(
          packagesRequest.pagination,
          packagesRequest.filters
        );
      }
    );
  };

  /**
   * Update (upgrade/downgrade) a client's subscription
   */
  updateSubscription = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientSubscriptionUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const updateRequest =
          createIApiRequest<IClientSubscriptionUpdateApiRequest>(req);

        logger.info({
          message: 'Updating client subscription',
          context: 'SubscriptionController.updateSubscription',
          clientId,
          packageId: updateRequest.data.packageId,
        });

        return await this.subscriptionService.updateSubscription(
          clientId,
          updateRequest.data
        );
      }
    );
  };

  /**
   * Cancel a client's subscription
   */
  cancelSubscription = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientSubscriptionCancelApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const cancelRequest =
          createIApiRequest<IClientSubscriptionCancelApiRequest>(req);

        logger.info({
          message: 'Cancelling client subscription',
          context: 'SubscriptionController.cancelSubscription',
          clientId,
          reason: cancelRequest.data.reason,
        });

        return await this.subscriptionService.cancelSubscription(
          clientId,
          cancelRequest.data
        );
      }
    );
  };

  /**
   * Get a client's payment methods
   */
  getPaymentMethods = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientPaymentMethodsApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        logger.info({
          message: 'Getting client payment methods',
          context: 'SubscriptionController.getPaymentMethods',
          clientId,
        });

        return await this.subscriptionService.getPaymentMethods(clientId);
      }
    );
  };

  /**
   * Add a payment method for a client
   */
  addPaymentMethod = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientAddPaymentMethodApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const addRequest =
          createIApiRequest<IClientAddPaymentMethodApiRequest>(req);

        logger.info({
          message: 'Adding client payment method',
          context: 'SubscriptionController.addPaymentMethod',
          clientId,
          isDefault: addRequest.data.isDefault,
        });

        return await this.subscriptionService.addPaymentMethod(
          clientId,
          addRequest.data.paymentMethodId,
          addRequest.data.isDefault
        );
      }
    );
  };

  /**
   * Remove a payment method from a client
   */
  removePaymentMethod = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientRemovePaymentMethodApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const removeRequest =
          createIApiRequest<IClientRemovePaymentMethodApiRequest>(req);

        logger.info({
          message: 'Removing client payment method',
          context: 'SubscriptionController.removePaymentMethod',
          clientId,
          paymentMethodId: removeRequest.params.paymentMethodId,
        });

        return await this.subscriptionService.removePaymentMethod(
          clientId,
          removeRequest.params.paymentMethodId
        );
      }
    );
  };

  /**
   * Set a default payment method for a client
   */
  setDefaultPaymentMethod = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientSetDefaultPaymentMethodApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const setDefaultRequest =
          createIApiRequest<IClientSetDefaultPaymentMethodApiRequest>(req);

        logger.info({
          message: 'Setting default payment method for client',
          context: 'SubscriptionController.setDefaultPaymentMethod',
          clientId,
        });

        return await this.subscriptionService.setDefaultPaymentMethod(
          clientId,
          setDefaultRequest.data.paymentMethodId
        );
      }
    );
  };

  /**
   * Update auto-renewal settings for a client's subscription
   */
  updateAutoRenewal = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientSubscriptionGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const autoRenewRequest = req.body;

        logger.info({
          message: 'Updating client subscription auto-renewal',
          context: 'SubscriptionController.updateAutoRenewal',
          clientId,
          autoRenew: autoRenewRequest.autoRenew,
        });

        return await this.subscriptionService.updateAutoRenewal(
          clientId,
          autoRenewRequest.autoRenew
        );
      }
    );
  };

  /**
   * Renew a client's subscription
   */
  renewSubscription = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientSubscriptionGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const packageId = req.body.packageId; // Optional

        logger.info({
          message: 'Renewing client subscription',
          context: 'SubscriptionController.renewSubscription',
          clientId,
          packageId,
        });

        return await this.subscriptionService.renewSubscription(
          clientId,
          packageId
        );
      }
    );
  };

  /**
   * Get subscription upgrade/downgrade information
   */
  getSubscriptionUpgradeInfo = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const clientId = req.user.clientId as string;
      const { packageId } = req.params;

      logger.info({
        message: 'Getting subscription upgrade info',
        context: 'SubscriptionController.getSubscriptionUpgradeInfo',
        clientId,
        packageId,
      });

      return await this.subscriptionService.getSubscriptionUpgradeInfo(
        clientId,
        packageId
      );
    });
  };

  /**
   * Get usage summary for a client's subscription with individula quota
   */
  getUsageSummary = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const clientId = req.user.clientId as string;

      logger.info({
        message: 'Getting subscription usage summary',
        context: 'SubscriptionController.getUsageSummary',
        clientId,
      });

      return await this.subscriptionLimitsService.getUsageSummary(clientId);
    });
  };

  /**
   * Log a candidate view and deduct from subscription if not already viewed
   */
  logCandidateView = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientLogCandidateViewApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const clientUserId = req.user.clientUserId as string;
        const data = req.body;
        return await this.subscriptionService.logCandidateView(
          clientId,
          clientUserId,
          data
        );
      }
    );
  };
}
