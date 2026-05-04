import { PrismaClient } from '@prisma/client';
import { PaymentFactory } from '@/services/subscription/payment.factory';
import {
  IClientSubscription,
  IClientSubscriptionPackage,
  IClientSubscriptionUpdate,
  IClientSubscriptionCancel,
  toClientSubscriptionDomain,
  toClientSubscriptionPackageDomain,
  IClientSubscriptionPackageFilterQuery,
  IClientSubscriptionUpgradeInfo,
  ILogCandidateViewRequest,
  ILogCandidateViewResponse,
  IClientSubscriptionOverview,
} from '@/shared/models/domain/client/subscription.domain';
import { IPaymentMethod } from '@/shared/models/domain/common/subscription.domain';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';
import { ENV } from '@/config/env';
import {
  IPaginationRequest,
  IPaginatedResponse,
} from '@/shared/models/api/common/common.api';
import { getPaginationInfo } from '@/utils/pagination';
import {
  ClientSubscriptionStatusEnum,
  ClientUserInvitationStatusEnum,
  PaymentProviderEnum,
} from '@/shared/models/common/enums';
import { singleton } from '@/shared/decorators/singleton';
import { ClientSubscriptionLimitsService } from './subscription.limits.service';
import { NodemailerProvider } from '../notification/nodemailer.service';

@singleton
export class ClientSubscriptionService {
  private readonly prisma: PrismaClient;

  constructor(
    private readonly paymentFactory: PaymentFactory,
    private readonly notificationProvider: NodemailerProvider
  ) {
    this.prisma = new PrismaClient();
  }

  /**
   * Safely convert a value to a Date object with fallback
   * @param dateValue The date value to convert (could be Date, string, number, or undefined)
   * @param fallbackDate The fallback date to use if conversion fails
   * @returns A valid Date object
   */
  private safeToDate(dateValue: any, fallbackDate: Date): Date {
    if (!dateValue) {
      return fallbackDate;
    }

    let convertedDate: Date;

    if (dateValue instanceof Date) {
      convertedDate = dateValue;
    } else if (typeof dateValue === 'string') {
      convertedDate = new Date(dateValue);
    } else if (typeof dateValue === 'number') {
      // Assume Unix timestamp
      convertedDate = new Date(dateValue * 1000);
    } else {
      return fallbackDate;
    }

    // Check if the date is valid
    if (isNaN(convertedDate.getTime())) {
      logger.warn('Invalid date encountered, using fallback', {
        context: 'SubscriptionService.safeToDate',
        dateValue,
        fallbackDate,
      });
      return fallbackDate;
    }

    return convertedDate;
  }

  async getClientWithSubscriptionData(clientId: string): Promise<any> {
    // Get client data
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      include: {
        company: true,
        subscriptions: {
          where: {
            status: ClientSubscriptionStatusEnum.ACTIVE,
          },
          include: {
            package: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!client) {
      throw new AppError('Client not found', 400, ErrorCode.NOT_FOUND);
    }

    const currentSubscription = client.subscriptions[0];

    if (!currentSubscription) {
      logger.info('Client has no active subscription', {
        context: 'SubscriptionService.getClientWithSubscriptionData',
        clientId,
      });
      return client;
    }

    if (!currentSubscription.paymentProviderCustomerId) {
      logger.info('Client has no Stripe customer ID', {
        context: 'SubscriptionService.getClientWithSubscriptionData',
        clientId,
      });
      return client;
    }

    // Return client with subscription as a single property for backward compatibility
    return {
      ...client,
      subscription: currentSubscription,
    };
  }

  /**
   * Check if client has available seats
   * @param clientId The client ID to check
   * @returns True if client has available seats, false otherwise
   */
  async hasAvailableSeats(clientId: string): Promise<boolean> {
    try {
      const client = await this.getClientWithSubscriptionData(clientId);

      const currentSubscription = client.subscription;

      if (
        !currentSubscription ||
        currentSubscription.status !== ClientSubscriptionStatusEnum.ACTIVE
      ) {
        throw new AppError(
          'Client has no active subscription',
          400,
          ErrorCode.SUBSCRIPTION_REQUIRED
        );
      }

      // Calculate total available seats (base package seats + additional credits)
      const totalSeats =
        currentSubscription.package.maxSeats +
        currentSubscription.additionalSeatsCredits;

      // Get current seat usage
      const usedSeatsCount = await this.prisma.client_user.count({
        where: {
          clientId,
          user: {
            status: 'ACTIVE',
          },
        },
      });

      // Get pending invitations count as they potentially could use seats
      const pendingInvitationsCount =
        await this.prisma.client_user_invitation.count({
          where: {
            clientId,
            status: ClientUserInvitationStatusEnum.PENDING,
          },
        });

      // Check if there are available seats
      return usedSeatsCount + pendingInvitationsCount < totalSeats;
    } catch (error) {
      logger.error('Failed to check available seats', {
        context: 'SubscriptionService.hasAvailableSeats',
        clientId,
        error,
      });
      throw error;
    }
  }

  /**
   * Increment the used seats count for a client subscription
   * @param clientId The client ID to update
   */
  async incrementUsedSeats(clientId: string): Promise<void> {
    try {
      const client = await this.getClientWithSubscriptionData(clientId);

      const currentSubscription = client.subscription;

      if (
        !currentSubscription ||
        currentSubscription.status !== ClientSubscriptionStatusEnum.ACTIVE
      ) {
        throw new AppError(
          'Client has no active subscription',
          400,
          ErrorCode.SUBSCRIPTION_REQUIRED
        );
      }

      await this.prisma.client_subscription.updateMany({
        where: {
          id: currentSubscription.id,
        },
        data: {
          usedSeats: {
            increment: 1,
          },
        },
      });
    } catch (error) {
      logger.error('Failed to increment used seats', {
        context: 'SubscriptionService.incrementUsedSeats',
        clientId,
        error,
      });
      throw error;
    }
  }

  /**
   * Decrement the used seats count for a client subscription
   * @param clientId The client ID to update
   */
  async decrementUsedSeats(clientId: string): Promise<void> {
    try {
      // Find the subscription to ensure we don't decrement below zero
      const client = await this.getClientWithSubscriptionData(clientId);

      const currentSubscription = client.subscription;

      if (
        !currentSubscription ||
        currentSubscription.status !== ClientSubscriptionStatusEnum.ACTIVE
      ) {
        throw new AppError(
          'Client has no active subscription',
          400,
          ErrorCode.SUBSCRIPTION_REQUIRED
        );
      }

      // Only decrement if the current count is greater than zero
      if (currentSubscription.usedSeats > 0) {
        await this.prisma.client_subscription.updateMany({
          where: {
            id: currentSubscription.id,
          },
          data: {
            usedSeats: {
              decrement: 1,
            },
          },
        });
      }
    } catch (error) {
      logger.error('Failed to decrement used seats', {
        context: 'SubscriptionService.decrementUsedSeats',
        clientId,
        error,
      });
      throw error;
    }
  }

  /**
   * Get a client's current subscription
   * @param clientId The client ID
   */
  async getCurrentSubscription(clientId: string): Promise<IClientSubscription> {
    try {
      const client = await this.getClientWithSubscriptionData(clientId);

      const currentSubscription = client.subscription;

      if (
        !currentSubscription ||
        currentSubscription.status !== ClientSubscriptionStatusEnum.ACTIVE
      ) {
        logger.info('Client has no active subscription', {
          context: 'SubscriptionService.getCurrentSubscription',
          clientId,
        });
      }

      return toClientSubscriptionDomain(currentSubscription);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Failed to get client subscription', {
        context: 'SubscriptionService.getCurrentSubscription',
        clientId,
        error,
      });

      throw new AppError(
        'Failed to get subscription information',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async makerSubscriptionExpired(clientId: string): Promise<void> {
    try {
      const client = await this.getClientWithSubscriptionData(clientId);

      const currentSubscription = client.subscription;

      if (!currentSubscription) {
        logger.info('Client has no active subscription', {
          context: 'SubscriptionService.makerSubscriptionExpired',
          clientId,
        });
        return;
      }

      if (currentSubscription.status !== ClientSubscriptionStatusEnum.ACTIVE) {
        throw new AppError(
          'Client has no active subscription',
          400,
          ErrorCode.SUBSCRIPTION_REQUIRED
        );
      }

      const currentDate = new Date();
      const nowDayUtc = Date.UTC(
        currentDate.getUTCFullYear(),
        currentDate.getUTCMonth(),
        currentDate.getUTCDate()
      );

      // Treat UTC-midnight dates (common when coming from `YYYY-MM-DD` inputs)
      // as "expires at end of that day" instead of "expires immediately at 00:00 UTC".
      const shouldExpireDate = (dateValue: Date): boolean => {
        const d = new Date(dateValue);
        const isUtcMidnight =
          d.getUTCHours() === 0 &&
          d.getUTCMinutes() === 0 &&
          d.getUTCSeconds() === 0 &&
          d.getUTCMilliseconds() === 0;

        if (isUtcMidnight) {
          const dayUtc = Date.UTC(
            d.getUTCFullYear(),
            d.getUTCMonth(),
            d.getUTCDate()
          );
          // Not expired on the same UTC day; expires starting next UTC day.
          return dayUtc < nowDayUtc;
        }

        // Otherwise keep exact-time semantics (e.g. Stripe timestamps).
        return d <= currentDate;
      };

      let shouldExpire = false;
      let expirationReason = '';

      if (currentSubscription.isTrial) {
        // Handle trial subscription expiration
        if (!currentSubscription.trialExpireAt) {
          logger.warn('Trial subscription has no expiration date', {
            context: 'SubscriptionService.makerSubscriptionExpired',
            clientId,
            subscriptionId: currentSubscription.id,
          });
          return;
        }

        const trialExpireAt = new Date(currentSubscription.trialExpireAt);
        if (shouldExpireDate(trialExpireAt)) {
          shouldExpire = true;
          expirationReason = 'trial_expired';
          logger.info('Trial subscription expired', {
            context: 'SubscriptionService.makerSubscriptionExpired',
            clientId,
            trialExpireAt,
            currentDate,
          });
        } else {
          logger.info('Trial subscription is not expired yet', {
            context: 'SubscriptionService.makerSubscriptionExpired',
            clientId,
            trialExpireAt,
            currentDate,
          });
          return;
        }
      } else {
        // Handle regular subscription expiration
        if (!currentSubscription.endDate) {
          logger.warn('Regular subscription has no end date', {
            context: 'SubscriptionService.makerSubscriptionExpired',
            clientId,
            subscriptionId: currentSubscription.id,
          });
          return;
        }

        const endDate = new Date(currentSubscription.endDate);
        if (shouldExpireDate(endDate)) {
          shouldExpire = true;
          expirationReason = 'subscription_expired';
          logger.info('Regular subscription expired', {
            context: 'SubscriptionService.makerSubscriptionExpired',
            clientId,
            endDate,
            currentDate,
          });
        } else {
          logger.info('Regular subscription is not expired yet', {
            context: 'SubscriptionService.makerSubscriptionExpired',
            clientId,
            endDate,
            currentDate,
          });
          return;
        }
      }

      // Update subscription status to expired if conditions are met
      if (shouldExpire) {
        await this.prisma.client_subscription.updateMany({
          where: { id: currentSubscription.id },
          data: { status: ClientSubscriptionStatusEnum.EXPIRED },
        });

        logger.info('Subscription marked as expired', {
          context: 'SubscriptionService.makerSubscriptionExpired',
          clientId,
          subscriptionId: currentSubscription.id,
          reason: expirationReason,
          isTrial: currentSubscription.isTrial,
        });
      }
    } catch (error) {
      logger.error('Failed to make subscription expired', {
        context: 'SubscriptionService.makerSubscriptionExpired',
        clientId,
        error,
      });
    }
  }

  async getCurrentSubscriptionOverview(
    clientId: string
  ): Promise<IClientSubscriptionOverview> {
    try {
      const result: IClientSubscriptionOverview = {
        isStarterPackage: false,
        seatsQuotaUsedInPercentage: 0,
        activePackRemainingDays: 0,
        jobPostingsQuotaUsedInPercentage: 0,
        candidateViewsQuotaUsedInPercentage: 0,
        aiAssessmentsQuotaUsedInPercentage: 0,
        overallQuotaUsedInPercentage: 0,
        subscriptionStatus: ClientSubscriptionStatusEnum.EXPIRED,
        nextBillingDate: new Date(),
        activePackTotalDays: 0,
      };

      const prevClientSubscription =
        await this.getClientWithSubscriptionData(clientId);

      if (!prevClientSubscription.subscription) {
        logger.info('Client has no active subscription', {
          context: 'SubscriptionService.getCurrentSubscriptionOverview',
          clientId,
        });

        return result;
      }
      await this.makerSubscriptionExpired(clientId);

      const client = await this.getClientWithSubscriptionData(clientId);

      const isStarterPackage = client?.subscription?.isTrial;

      result.isStarterPackage = isStarterPackage;

      const activePackRemainingDays = client?.subscription?.isTrial
        ? new Date(client?.subscription?.trialExpireAt).getTime() -
          new Date().getTime()
        : new Date(client?.subscription?.endDate).getTime() -
          new Date().getTime();

      result.activePackRemainingDays = Math.ceil(
        activePackRemainingDays / (1000 * 60 * 60 * 24)
      );

      result.nextBillingDate = client?.subscription?.isTrial
        ? client?.subscription?.trialExpireAt
        : client?.subscription?.nextBillingDate;

      const seatsQuotaUsedInPercentage =
        (client?.subscription?.usedSeats /
          client?.subscription?.package?.maxSeats) *
        100;

      result.seatsQuotaUsedInPercentage = seatsQuotaUsedInPercentage;

      const jobPostingsQuotaUsedInPercentage =
        (client?.subscription?.usedJobPostings /
          client?.subscription?.package?.maxJobPostings) *
        100;

      result.jobPostingsQuotaUsedInPercentage =
        jobPostingsQuotaUsedInPercentage;

      const candidateViewsQuotaUsedInPercentage =
        (client?.subscription?.usedCandidateViews /
          client?.subscription?.package?.maxCandidateViews) *
        100;

      result.candidateViewsQuotaUsedInPercentage =
        candidateViewsQuotaUsedInPercentage;

      const aiAssessmentsQuotaUsedInPercentage =
        (client?.subscription?.usedAiAssessments /
          client?.subscription?.package?.maxAiAssessments) *
        100;

      result.aiAssessmentsQuotaUsedInPercentage =
        aiAssessmentsQuotaUsedInPercentage;

      result.overallQuotaUsedInPercentage =
        ((client?.subscription?.usedSeats +
          client?.subscription?.usedJobPostings +
          client?.subscription?.usedCandidateViews +
          client?.subscription?.usedAiAssessments) /
          (client?.subscription?.package?.maxSeats +
            client?.subscription?.package?.maxJobPostings +
            client?.subscription?.package?.maxCandidateViews +
            client?.subscription?.package?.maxAiAssessments)) *
        100;

      result.subscriptionStatus = client?.subscription?.status;

      result.activePackTotalDays = Math.ceil(
        (new Date(client?.subscription?.endDate).getTime() -
          new Date(client?.subscription?.startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      return result;
    } catch (error) {
      logger.error('Failed to get client subscription overview', {
        context: 'SubscriptionService.getCurrentSubscriptionOverview',
        clientId,
        error,
      });
      throw new AppError(
        'Failed to get client subscription overview',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get all available subscription packages
   * @param paginationRequest Pagination parameters
   */
  async getSubscriptionPackages(
    paginationRequest: IPaginationRequest,
    filters?: IClientSubscriptionPackageFilterQuery
  ): Promise<IPaginatedResponse<IClientSubscriptionPackage>> {
    try {
      // Build where clause based on filters
      const where = {
        ...(filters?.isActive
          ? { isActive: filters.isActive }
          : { isActive: true }),
        ...(filters?.name && { name: filters.name }),
        ...(filters?.description && { description: filters.description }),
        ...(filters?.price && { price: filters.price }),
      };

      // Get total count
      const total = await this.prisma.client_subscription_package.count({
        where,
      });

      // Get pagination info
      const paginationInfo = getPaginationInfo(paginationRequest);

      const packages = await this.prisma.client_subscription_package.findMany({
        where: {
          isActive: true,
        },
        ...paginationInfo,
      });

      return {
        items: packages.map(toClientSubscriptionPackageDomain),
        pagination: {
          total,
          page: paginationRequest.page || ENV.DEFAULT_PAGE,
          limit: paginationRequest.limit || ENV.DEFAULT_LIMIT,
          totalPages: Math.ceil(
            total / (paginationRequest.limit || ENV.DEFAULT_LIMIT)
          ),
        },
      };
    } catch (error) {
      logger.error('Failed to get subscription packages', {
        context: 'SubscriptionService.getSubscriptionPackages',
        error,
      });

      throw new AppError(
        'Failed to get subscription packages',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Update a client's subscription (upgrade/downgrade)
   * @param clientId The client ID
   * @param subscriptionUpdateData The update data
   */
  async updateSubscription(
    clientId: string,
    subscriptionUpdateData: IClientSubscriptionUpdate
  ): Promise<IClientSubscription> {
    try {
      // Get new package
      const newPackage =
        await this.prisma.client_subscription_package.findUnique({
          where: { id: subscriptionUpdateData.packageId },
        });

      if (!newPackage) {
        throw new AppError(
          'Subscription package not found',
          400,
          ErrorCode.NOT_FOUND
        );
      }

      if (!newPackage.isActive) {
        throw new AppError(
          'The selected subscription package is not available',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      // Get client data
      const client = await this.getClientWithSubscriptionData(clientId);

      let currentSubscription = client.subscription;

      if (!currentSubscription) {
        // Create a default subscription if the client has no subscription
        await this.createDefaultSubscription(clientId);
        // Get the updated client with the new subscription
        const updatedClient =
          await this.getClientWithSubscriptionData(clientId);
        currentSubscription = updatedClient?.subscription;
      }

      if (
        !currentSubscription ||
        currentSubscription.status !== ClientSubscriptionStatusEnum.ACTIVE
      ) {
        throw new AppError(
          'Client has no active subscription',
          400,
          ErrorCode.SUBSCRIPTION_REQUIRED
        );
      }

      // Determine if this is an upgrade or downgrade
      const isUpgrade =
        newPackage.maxSeats > currentSubscription.package.maxSeats;
      const isDowngrade =
        newPackage.maxSeats < currentSubscription.package.maxSeats;

      // Handle seat management for downgrade
      let updatedUsedSeats = currentSubscription.usedSeats;
      if (isDowngrade) {
        // For downgrade, preserve used seats but cap at new package limit
        updatedUsedSeats = Math.min(
          currentSubscription.usedSeats,
          newPackage.maxSeats
        );

        logger.info('Handling subscription downgrade', {
          context: 'SubscriptionService.updateSubscription',
          clientId,
          oldMaxSeats: currentSubscription.package.maxSeats,
          newMaxSeats: newPackage.maxSeats,
          oldUsedSeats: currentSubscription.usedSeats,
          newUsedSeats: updatedUsedSeats,
        });
      }

      // Cancel existing subscription in payment provider if exists
      if (currentSubscription.paymentProviderSubscriptionId) {
        await this.paymentFactory
          .getPaymentProviderByType(
            currentSubscription.paymentProvider as PaymentProviderEnum
          )
          .cancelSubscription(
            currentSubscription.paymentProviderSubscriptionId
          );
      }

      // Calculate new expiry date based on billing cycle
      const startDate = new Date();
      const endDate = this.calculateExpiryDate(
        startDate,
        newPackage.billingCycle
      );

      // Use transaction to ensure consistency
      return await this.prisma.$transaction(async (tx) => {
        // Update in the payment provider
        const subscriptionResult = await this.paymentFactory
          .getPaymentProviderByType(
            currentSubscription.paymentProvider as PaymentProviderEnum
          )
          .createOrUpdateSubscription(
            currentSubscription.paymentProviderCustomerId || '',
            newPackage.paymentProviderProductId || '',
            newPackage.paymentProviderPriceId || '',
            { clientId, packageId: newPackage.id }
          );

        // Prepare update data
        const updateData: any = {
          packageId: newPackage.id,
          status: ClientSubscriptionStatusEnum.ACTIVE,
          startDate: startDate,
          endDate: endDate,
          autoRenew:
            subscriptionUpdateData.autoRenew ?? currentSubscription.autoRenew,
          nextBillingDate: this.safeToDate(
            subscriptionResult?.currentPeriodEnd,
            endDate
          ),
          usedSeats: updatedUsedSeats,
        };

        // Handle credits based on upgrade/downgrade
        if (isUpgrade) {
          // For upgrade, preserve all credits
          logger.info('Preserving credits for subscription upgrade', {
            context: 'SubscriptionService.updateSubscription',
            clientId,
            oldMaxSeats: currentSubscription.package.maxSeats,
            newMaxSeats: newPackage.maxSeats,
          });
        } else if (isDowngrade) {
          // For downgrade, reset all credits to 0 except used seats
          updateData.usedJobPostings = 0;
          updateData.usedCandidateViews = 0;
          updateData.usedAiAssessments = 0;
          updateData.additionalCandidateViewCredits = 0;
          updateData.additionalAiAssessmentCredits = 0;
          updateData.additionalSeatsCredits = 0;

          logger.info('Resetting credits for subscription downgrade', {
            context: 'SubscriptionService.updateSubscription',
            clientId,
            oldMaxSeats: currentSubscription.package.maxSeats,
            newMaxSeats: newPackage.maxSeats,
            preservedUsedSeats: updatedUsedSeats,
          });
        }

        // Update the subscription record
        const updatedSubscription = await tx.client_subscription.update({
          where: { id: currentSubscription.id },
          data: updateData,
          include: {
            package: true,
          },
        });

        // Note: Email notification is now handled by the Stripe provider during sync
        // No need to send notification here as it would be duplicate

        return toClientSubscriptionDomain(updatedSubscription);
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Failed to update subscription', {
        context: 'SubscriptionService.updateSubscription',
        clientId,
        packageId: subscriptionUpdateData.packageId,
        error,
      });

      throw new AppError(
        'Failed to update subscription',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Cancel a client's subscription
   * @param clientId The client ID
   * @param cancelData The cancellation data
   */
  async cancelSubscription(
    clientId: string,
    cancelData: IClientSubscriptionCancel
  ): Promise<IClientSubscription> {
    try {
      // Get client data
      const client = await this.getClientWithSubscriptionData(clientId);

      const currentSubscription = client.subscription;

      if (
        !currentSubscription ||
        currentSubscription.status !== ClientSubscriptionStatusEnum.ACTIVE
      ) {
        throw new AppError(
          'Client has no active subscription',
          400,
          ErrorCode.SUBSCRIPTION_REQUIRED
        );
      }

      // Cancel in the payment provider if subscription ID exists
      if (currentSubscription.paymentProviderSubscriptionId) {
        await this.paymentFactory
          .getPaymentProviderByType(
            currentSubscription.paymentProvider as PaymentProviderEnum
          )
          .cancelSubscription(
            currentSubscription.paymentProviderSubscriptionId
          );
      }

      // Check if the subscription is already cancelled
      if (currentSubscription.status !== ClientSubscriptionStatusEnum.ACTIVE) {
        throw new AppError(
          "User doesn't have an active subscription",
          400,
          ErrorCode.CONFLICT
        );
      }

      // Update the subscription record
      const updatedSubscription = await this.prisma.client_subscription.update({
        where: { id: currentSubscription.id },
        data: {
          status: ClientSubscriptionStatusEnum.CANCELLED,
          endDate: new Date(),
          // Store cancellation reason if provided
          metadata: cancelData.reason
            ? { cancellationReason: cancelData.reason }
            : undefined,
        },
        include: {
          package: true,
        },
      });

      return toClientSubscriptionDomain(updatedSubscription);
    } catch (error) {
      // If the error is an AppError, throw it
      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Failed to cancel subscription', {
        context: 'SubscriptionService.cancelSubscription',
        clientId,
        error,
      });

      throw new AppError(
        'Failed to cancel subscription',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get a client's payment methods
   * @param clientId The client ID
   */
  async getPaymentMethods(clientId: string): Promise<IPaymentMethod[]> {
    try {
      // Get client data
      const client = await this.getClientWithSubscriptionData(clientId);

      const currentSubscription = client.subscription;

      if (
        !currentSubscription ||
        currentSubscription.status !== ClientSubscriptionStatusEnum.ACTIVE
      ) {
        throw new AppError(
          'Client has no active subscription',
          400,
          ErrorCode.SUBSCRIPTION_REQUIRED
        );
      }

      // Get payment methods from the payment provider
      return await this.paymentFactory
        .getPaymentProviderByType(
          currentSubscription.paymentProvider as PaymentProviderEnum
        )
        .getPaymentMethods(currentSubscription.paymentProviderCustomerId || '');
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Failed to get payment methods', {
        context: 'SubscriptionService.getPaymentMethods',
        clientId,
        error,
      });

      throw new AppError(
        'Failed to get payment methods',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Add a payment method for a client
   * @param clientId The client ID
   * @param paymentMethodId The payment method ID
   * @param isDefault Whether this should be the default payment method
   */
  async addPaymentMethod(
    clientId: string,
    paymentMethodId: string,
    isDefault?: boolean
  ): Promise<IPaymentMethod[]> {
    try {
      // Get client data
      const client = await this.getClientWithSubscriptionData(clientId);

      const currentSubscription = client.subscription;

      if (
        !currentSubscription ||
        currentSubscription.status !== ClientSubscriptionStatusEnum.ACTIVE
      ) {
        throw new AppError(
          'Client has no active subscription',
          400,
          ErrorCode.SUBSCRIPTION_REQUIRED
        );
      }

      // Add the payment method in the payment provider
      return await this.paymentFactory
        .getPaymentProviderByType(
          currentSubscription.paymentProvider as PaymentProviderEnum
        )
        .addPaymentMethod(
          currentSubscription.paymentProviderCustomerId || '',
          paymentMethodId,
          isDefault
        );
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Failed to add payment method', {
        context: 'SubscriptionService.addPaymentMethod',
        clientId,
        paymentMethodId,
        error,
      });

      throw new AppError(
        'Failed to add payment method',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Remove a payment method from a client
   * @param clientId The client ID
   * @param paymentMethodId The payment method ID to remove
   */
  async removePaymentMethod(
    clientId: string,
    paymentMethodId: string
  ): Promise<IPaymentMethod[]> {
    try {
      // Get client data
      const client = await this.getClientWithSubscriptionData(clientId);

      const currentSubscription = client.subscription;

      if (
        !currentSubscription ||
        currentSubscription.status !== ClientSubscriptionStatusEnum.ACTIVE
      ) {
        throw new AppError(
          'Client has no active subscription',
          400,
          ErrorCode.SUBSCRIPTION_REQUIRED
        );
      }

      // Remove the payment method in the payment provider
      return await this.paymentFactory
        .getPaymentProviderByType(
          currentSubscription.paymentProvider as PaymentProviderEnum
        )
        .removePaymentMethod(
          currentSubscription.paymentProviderCustomerId || '',
          paymentMethodId
        );
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Failed to remove payment method', {
        context: 'SubscriptionService.removePaymentMethod',
        clientId,
        paymentMethodId,
        error,
      });

      throw new AppError(
        'Failed to remove payment method',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Set a payment method as the default for a client
   * @param clientId The client ID
   * @param paymentMethodId The payment method ID to set as default
   */
  async setDefaultPaymentMethod(
    clientId: string,
    paymentMethodId: string
  ): Promise<IPaymentMethod[]> {
    try {
      // Get client data
      const client = await this.getClientWithSubscriptionData(clientId);

      const currentSubscription = client.subscription;

      if (
        !currentSubscription ||
        currentSubscription.status !== ClientSubscriptionStatusEnum.ACTIVE
      ) {
        throw new AppError(
          'Client has no active subscription',
          400,
          ErrorCode.SUBSCRIPTION_REQUIRED
        );
      }

      if (!currentSubscription.paymentProviderCustomerId) {
        throw new AppError(
          'No payment methods found',
          400,
          ErrorCode.NOT_FOUND
        );
      }

      // Set the default payment method in the payment provider
      return await this.paymentFactory
        .getPaymentProviderByType(
          currentSubscription.paymentProvider as PaymentProviderEnum
        )
        .setDefaultPaymentMethod(
          currentSubscription.paymentProviderCustomerId || '',
          paymentMethodId
        );
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Failed to set default payment method', {
        context: 'SubscriptionService.setDefaultPaymentMethod',
        clientId,
        paymentMethodId,
        error,
      });

      throw new AppError(
        'Failed to set default payment method',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Create a subscription for a client with the default package
   * @param clientId The client ID
   */
  async createDefaultSubscription(
    clientId: string,
    selectedPlan?: string,
    validity?: string
  ): Promise<IClientSubscription> {
    try {
      // Get client data
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
        include: {
          company: true,
          subscriptions: {
            where: {
              status: ClientSubscriptionStatusEnum.ACTIVE,
            },
            take: 1,
          },
        },
      });

      if (!client) {
        throw new AppError('Client not found', 400, ErrorCode.NOT_FOUND);
      }

      if (client.subscriptions[0]) {
        throw new AppError(
          'Client already has an active subscription',
          400,
          ErrorCode.CONFLICT
        );
      }

      let defaultPackage = null;

      if (selectedPlan) {
        defaultPackage =
          await this.prisma.client_subscription_package.findUnique({
            where: { id: selectedPlan },
          });
      } else {
        defaultPackage =
          await this.prisma.client_subscription_package.findFirst({
            where: { isDefault: true, isActive: true },
          });
      }

      // Get default package

      if (!defaultPackage) {
        throw new AppError(
          'No default subscription package found',
          500,
          ErrorCode.INTERNAL_SERVER_ERROR
        );
      }

      // Calculate expiry date based on billing cycle
      const startDate = new Date();
      const endDate = this.calculateExpiryDate(
        startDate,
        defaultPackage.billingCycle
      );

      const trialEndDate = new Date();
      trialEndDate.setDate(
        trialEndDate.getDate() +
          (validity ? parseInt(validity) : defaultPackage.trialPeriod)
      );

      // Use transaction to ensure consistency
      return await this.prisma.$transaction(async (tx) => {
        logger.info('Creating customer in the payment provider', {
          context: 'SubscriptionService.createDefaultSubscription',
          clientId,
          companyName: client.company.name,
          companyContactEmail: client.company.contactEmail,
        });

        // Create the customer in the payment provider if it doesn't exist
        const paymentProviderCustomerId = await this.paymentFactory
          .getPaymentProviderByType(
            defaultPackage.paymentProvider as PaymentProviderEnum
          )
          .createCustomer(
            client.company.contactEmail || '',
            client.company.name,
            { clientId: client.id }
          );

        logger.info('Customer created in the payment provider', {
          context: 'SubscriptionService.createDefaultSubscription',
          clientId,
          paymentProviderCustomerId,
        });

        // Create a new subscription record with usedSeats = 1 for new client
        const newSubscription = await tx.client_subscription.create({
          data: {
            clientId,
            packageId: defaultPackage.id,
            paymentProviderCustomerId: paymentProviderCustomerId,
            status: ClientSubscriptionStatusEnum.ACTIVE,
            startDate: startDate,
            endDate: endDate,
            autoRenew: true,
            usedJobPostings: 0,
            usedCandidateViews: 0,
            usedAiAssessments: 0,
            usedSeats: 1, // Set to 1 for new client signup
            maxCandidateViewCredits: defaultPackage.maxCandidateViews,
            maxAiAssessmentCredits: defaultPackage.maxAiAssessments,
            maxSeatsCredits: defaultPackage.maxSeats,
            maxJobPostingsCredits: defaultPackage.maxJobPostings,
            additionalCandidateViewCredits: 0,
            additionalAiAssessmentCredits: 0,
            additionalSeatsCredits: 0,
            additionalJobPostingsCredits: 0,
            paymentProvider:
              defaultPackage.paymentProvider as PaymentProviderEnum,
            lastBillingDate: new Date(),
            nextBillingDate: endDate,
            isTrial: true,
            trialExpireAt: trialEndDate,
          },
          include: {
            package: true,
          },
        });

        // Create a subscription in the payment provider
        const subscriptionResult = await this.paymentFactory
          .getPaymentProviderByType(
            defaultPackage.paymentProvider as PaymentProviderEnum
          )
          .createOrUpdateSubscription(
            paymentProviderCustomerId,
            defaultPackage.paymentProviderProductId || '',
            defaultPackage.paymentProviderPriceId || '',
            {
              clientId,
              packageId: defaultPackage.id,
              endDate: trialEndDate
                ? trialEndDate.toISOString()
                : endDate.toISOString(),
            }
          );

        logger.info('Subscription created in the payment provider', {
          context: 'SubscriptionService.createDefaultSubscription',
          clientId,
          subscriptionResult,
          currentPeriodEndType: typeof subscriptionResult.currentPeriodEnd,
          currentPeriodEndValue: subscriptionResult.currentPeriodEnd,
          fallbackEndDate: endDate,
        });

        // Update the subscription record
        const updatedSubscription = await tx.client_subscription.update({
          where: { id: newSubscription.id },
          data: {
            paymentProviderSubscriptionId: subscriptionResult.subscriptionId,
            lastBillingDate: new Date(),
            nextBillingDate: this.safeToDate(
              subscriptionResult.currentPeriodEnd,
              endDate
            ),
          },
          include: {
            package: true,
          },
        });

        return toClientSubscriptionDomain(updatedSubscription);
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Failed to create default subscription', {
        context: 'SubscriptionService.createDefaultSubscription',
        clientId,
        error,
      });

      throw new AppError(
        'Failed to create subscription',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Calculate expiry date based on billing cycle
   * @param startDate The start date
   * @param billingCycle The billing cycle (MONTHLY, QUARTERLY, ANNUALLY)
   * @returns The calculated expiry date
   */
  private calculateExpiryDate(startDate: Date, billingCycle: string): Date {
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
    }

    return expiryDate;
  }

  /**
   * Update auto-renewal settings for a client's subscription
   * @param clientId The client ID
   * @param autoRenew Whether the subscription should auto-renew
   */
  async updateAutoRenewal(
    clientId: string,
    autoRenew: boolean
  ): Promise<IClientSubscription> {
    try {
      // Get client data
      const client = await this.getClientWithSubscriptionData(clientId);

      const currentSubscription = client.subscription;

      if (!currentSubscription) {
        throw new AppError(
          'Client has no active subscription',
          400,
          ErrorCode.SUBSCRIPTION_REQUIRED
        );
      }

      // Update the subscription record
      const updatedSubscription = await this.prisma.client_subscription.update({
        where: { id: currentSubscription.id },
        data: {
          autoRenew,
        },
        include: {
          package: true,
        },
      });

      logger.info('Auto-renewal settings updated', {
        context: 'SubscriptionService.updateAutoRenewal',
        clientId,
        autoRenew,
      });

      return toClientSubscriptionDomain(updatedSubscription);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Failed to update auto-renewal settings', {
        context: 'SubscriptionService.updateAutoRenewal',
        clientId,
        autoRenew,
        error,
      });

      throw new AppError(
        'Failed to update auto-renewal settings',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Renew subscription with proper billing cycle calculation
   * @param clientId The client ID
   * @param packageId Optional package ID for renewal (if not provided, uses current package)
   */
  async renewSubscription(
    clientId: string,
    packageId?: string
  ): Promise<IClientSubscription> {
    try {
      // Get client data
      const client = await this.getClientWithSubscriptionData(clientId);
      const currentSubscription = client.subscription;

      if (
        !currentSubscription ||
        currentSubscription.status !== ClientSubscriptionStatusEnum.ACTIVE
      ) {
        throw new AppError(
          'Client has no active subscription',
          400,
          ErrorCode.SUBSCRIPTION_REQUIRED
        );
      }

      // Get package for renewal (current or specified)
      const renewalPackage = packageId
        ? await this.prisma.client_subscription_package.findUnique({
            where: { id: packageId },
          })
        : currentSubscription.package;

      if (!renewalPackage) {
        throw new AppError(
          'Subscription package not found',
          400,
          ErrorCode.NOT_FOUND
        );
      }

      if (!renewalPackage.isActive) {
        throw new AppError(
          'The selected subscription package is not available',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      // Calculate new billing period based on current end date or now
      const currentEndDate = currentSubscription.endDate || new Date();
      const newStartDate = new Date(currentEndDate);
      const newEndDate = this.calculateExpiryDate(
        newStartDate,
        renewalPackage.billingCycle
      );

      // Preserve used seats and credits for renewal
      const preservedUsedSeats = currentSubscription.usedSeats;

      // Use transaction to ensure consistency
      return await this.prisma.$transaction(async (tx) => {
        // Update in the payment provider if different package
        let subscriptionResult = null;
        if (packageId && packageId !== currentSubscription.packageId) {
          subscriptionResult = await this.paymentFactory
            .getPaymentProviderByType(
              currentSubscription.paymentProvider as PaymentProviderEnum
            )
            .createOrUpdateSubscription(
              currentSubscription.paymentProviderCustomerId || '',
              renewalPackage.paymentProviderProductId || '',
              renewalPackage.paymentProviderPriceId || '',
              { clientId, packageId: renewalPackage.id }
            );
        }

        // Update the subscription record
        const updatedSubscription = await tx.client_subscription.update({
          where: { id: currentSubscription.id },
          data: {
            packageId: renewalPackage.id,
            status: ClientSubscriptionStatusEnum.ACTIVE,
            startDate: newStartDate,
            endDate: newEndDate,
            autoRenew: true,
            usedSeats: preservedUsedSeats,
            // Preserve other usage data
            usedJobPostings: currentSubscription.usedJobPostings,
            usedCandidateViews: currentSubscription.usedCandidateViews,
            usedAiAssessments: currentSubscription.usedAiAssessments,
            additionalCandidateViewCredits:
              currentSubscription.additionalCandidateViewCredits,
            additionalAiAssessmentCredits:
              currentSubscription.additionalAiAssessmentCredits,
            additionalSeatsCredits: currentSubscription.additionalSeatsCredits,
            lastBillingDate: new Date(),
            nextBillingDate: this.safeToDate(
              subscriptionResult?.currentPeriodEnd,
              newEndDate
            ),
            paymentProviderSubscriptionId:
              subscriptionResult?.subscriptionId ||
              currentSubscription.paymentProviderSubscriptionId,
          },
          include: {
            package: true,
          },
        });

        logger.info('Subscription renewed successfully', {
          context: 'SubscriptionService.renewSubscription',
          clientId,
          packageId: renewalPackage.id,
          newStartDate,
          newEndDate,
          preservedUsedSeats,
        });

        return toClientSubscriptionDomain(updatedSubscription);
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Failed to renew subscription', {
        context: 'SubscriptionService.renewSubscription',
        clientId,
        packageId,
        error,
      });

      throw new AppError(
        'Failed to renew subscription',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get subscription upgrade/downgrade information
   * @param clientId The client ID
   * @param newPackageId The new package ID to compare against
   */
  async getSubscriptionUpgradeInfo(
    clientId: string,
    newPackageId: string
  ): Promise<IClientSubscriptionUpgradeInfo> {
    try {
      const client = await this.getClientWithSubscriptionData(clientId);
      const currentSubscription = client.subscription;

      const newPackage =
        await this.prisma.client_subscription_package.findUnique({
          where: { id: newPackageId },
        });

      if (!newPackage) {
        throw new AppError(
          'Subscription package not found',
          400,
          ErrorCode.NOT_FOUND
        );
      }

      const isUpgrade =
        newPackage.maxSeats > currentSubscription.package.maxSeats;
      const isDowngrade =
        newPackage.maxSeats < currentSubscription.package.maxSeats;
      const preservedUsedSeats = isDowngrade
        ? Math.min(currentSubscription.usedSeats, newPackage.maxSeats)
        : currentSubscription.usedSeats;

      return {
        isUpgrade,
        isDowngrade,
        oldMaxSeats: currentSubscription.package.maxSeats,
        newMaxSeats: newPackage.maxSeats,
        preservedUsedSeats: isDowngrade ? preservedUsedSeats : undefined,
        creditsReset: isDowngrade,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Failed to get subscription upgrade info', {
        context: 'SubscriptionService.getSubscriptionUpgradeInfo',
        clientId,
        newPackageId,
        error,
      });

      throw new AppError(
        'Failed to get subscription upgrade info',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Validate if a client can upgrade/downgrade to a specific package
   * @param clientId The client ID
   * @param newPackageId The new package ID
   */
  async validateSubscriptionChange(
    clientId: string,
    newPackageId: string
  ): Promise<{ canChange: boolean; reason?: string }> {
    try {
      const client = await this.getClientWithSubscriptionData(clientId);
      const currentSubscription = client.subscription;

      const newPackage =
        await this.prisma.client_subscription_package.findUnique({
          where: { id: newPackageId },
        });

      if (!newPackage) {
        return { canChange: false, reason: 'Package not found' };
      }

      if (!newPackage.isActive) {
        return { canChange: false, reason: 'Package is not active' };
      }

      // Check if it's a downgrade and if current used seats exceed new package limit
      if (newPackage.maxSeats < currentSubscription.package.maxSeats) {
        if (currentSubscription.usedSeats > newPackage.maxSeats) {
          return {
            canChange: false,
            reason: `Cannot downgrade: Current used seats (${currentSubscription.usedSeats}) exceed new package limit (${newPackage.maxSeats})`,
          };
        }
      }

      return { canChange: true };
    } catch (error) {
      logger.error('Failed to validate subscription change', {
        context: 'SubscriptionService.validateSubscriptionChange',
        clientId,
        newPackageId,
        error,
      });

      return { canChange: false, reason: 'Validation failed' };
    }
  }

  /**
   * Get subscription usage summary
   * @param clientId The client ID
   */
  async getSubscriptionUsageSummary(clientId: string): Promise<{
    totalSeats: number;
    usedSeats: number;
    availableSeats: number;
    totalJobPostings: number;
    usedJobPostings: number;
    availableJobPostings: number;
    totalCandidateViews: number;
    usedCandidateViews: number;
    availableCandidateViews: number;
    totalAiAssessments: number;
    usedAiAssessments: number;
    availableAiAssessments: number;
  }> {
    try {
      const client = await this.getClientWithSubscriptionData(clientId);
      const subscription = client.subscription;

      const totalSeats =
        subscription.package.maxSeats + subscription.additionalSeatsCredits;
      const totalJobPostings = subscription.package.maxJobPostings;
      const totalCandidateViews = subscription.package.unlimitedCandidateViews
        ? -1 // -1 indicates unlimited
        : subscription.package.maxCandidateViews +
          subscription.additionalCandidateViewCredits;
      const totalAiAssessments =
        subscription.package.maxAiAssessments +
        subscription.additionalAiAssessmentCredits;

      return {
        totalSeats,
        usedSeats: subscription.usedSeats,
        availableSeats: totalSeats - subscription.usedSeats,
        totalJobPostings,
        usedJobPostings: subscription.usedJobPostings,
        availableJobPostings: totalJobPostings - subscription.usedJobPostings,
        totalCandidateViews,
        usedCandidateViews: subscription.usedCandidateViews,
        availableCandidateViews:
          totalCandidateViews === -1
            ? -1
            : totalCandidateViews - subscription.usedCandidateViews,
        totalAiAssessments,
        usedAiAssessments: subscription.usedAiAssessments,
        availableAiAssessments:
          totalAiAssessments - subscription.usedAiAssessments,
      };
    } catch (error) {
      logger.error('Failed to get subscription usage summary', {
        context: 'SubscriptionService.getSubscriptionUsageSummary',
        clientId,
        error,
      });

      throw new AppError(
        'Failed to get subscription usage summary',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Log a candidate view and deduct from subscription if not already viewed
   */
  async logCandidateView(
    clientId: string,
    clientUserId: string,
    data: ILogCandidateViewRequest
  ): Promise<ILogCandidateViewResponse> {
    // Build composite key for findUnique
    const compositeKey: any = {
      candidateId: data.candidateId,
      clientUserId,
    };
    if (typeof data.jobPostingId === 'string') {
      compositeKey.jobPostingId = data.jobPostingId;
    }

    // Check if already viewed
    const existingView = await this.prisma.candidate_view.findUnique({
      where: {
        candidateId_clientUserId_jobPostingId: compositeKey,
      },
    });

    if (existingView) {
      return { message: 'Already viewed', alreadyViewed: true };
    }

    // Check limit
    const subscriptionLimitsService = new ClientSubscriptionLimitsService();
    const limitCheck =
      await subscriptionLimitsService.checkCandidateViewLimit(clientId);
    if (!limitCheck.canView) {
      throw new AppError(
        limitCheck.errorMessage || 'Candidate view limit exceeded',
        403,
        ErrorCode.SUBSCRIPTION_LIMIT_REACHED
      );
    }

    // Log the view
    await this.prisma.candidate_view.create({
      data: {
        candidateId: data.candidateId,
        clientUserId,
        jobPostingId: data.jobPostingId ?? undefined,
        viewContext: data.viewContext || null,
      },
    });

    // Increment usage
    await subscriptionLimitsService.incrementCandidateViewUsage(clientId);

    return {
      message: 'Candidate view logged and usage deducted',
      alreadyViewed: false,
    };
  }

  async updateSubscriptionsStatusCron() {
    try {
      const subscriptions = await this.prisma.client_subscription.findMany({
        where: {
          status: ClientSubscriptionStatusEnum.ACTIVE,
        },
        include: {
          client: {
            include: {
              company: true,
            },
          },
        },
      });

      logger.info('Starting subscription status update cron job', {
        context: 'SubscriptionService.updateSubscriptionsStatusCron',
        totalSubscriptions: subscriptions.length,
      });

      let expiredCount = 0;
      const currentDate = new Date();
      const nowDayUtc = Date.UTC(
        currentDate.getUTCFullYear(),
        currentDate.getUTCMonth(),
        currentDate.getUTCDate()
      );

      // Consistent expiry semantics with `makerSubscriptionExpired`:
      // UTC-midnight values (from `YYYY-MM-DD` inputs) expire at end of day,
      // while time-specific timestamps use exact-time comparison.
      const shouldExpireDate = (dateValue: Date): boolean => {
        const d = new Date(dateValue);
        const isUtcMidnight =
          d.getUTCHours() === 0 &&
          d.getUTCMinutes() === 0 &&
          d.getUTCSeconds() === 0 &&
          d.getUTCMilliseconds() === 0;

        if (isUtcMidnight) {
          const dayUtc = Date.UTC(
            d.getUTCFullYear(),
            d.getUTCMonth(),
            d.getUTCDate()
          );
          return dayUtc < nowDayUtc;
        }

        return d <= currentDate;
      };

      for (const subscription of subscriptions) {
        try {
          let shouldExpire = false;
          let expirationReason = '';

          if (subscription.isTrial) {
            // Handle trial subscription expiration
            if (!subscription.trialExpireAt) {
              logger.warn('Trial subscription has no expiration date', {
                context: 'SubscriptionService.updateSubscriptionsStatusCron',
                clientId: subscription.clientId,
                subscriptionId: subscription.id,
              });
              continue;
            }

            const trialExpireAt = new Date(subscription.trialExpireAt);
            if (shouldExpireDate(trialExpireAt)) {
              shouldExpire = true;
              expirationReason = 'trial_expired';
              logger.info('Trial subscription expired', {
                context: 'SubscriptionService.updateSubscriptionsStatusCron',
                clientId: subscription.clientId,
                subscriptionId: subscription.id,
                trialExpireAt,
                currentDate,
              });
            }
          } else {
            // Handle regular subscription expiration
            if (!subscription.endDate) {
              logger.warn('Regular subscription has no end date', {
                context: 'SubscriptionService.updateSubscriptionsStatusCron',
                clientId: subscription.clientId,
                subscriptionId: subscription.id,
              });
              continue;
            }

            const endDate = new Date(subscription.endDate);
            if (shouldExpireDate(endDate)) {
              shouldExpire = true;
              expirationReason = 'subscription_expired';
              logger.info('Regular subscription expired', {
                context: 'SubscriptionService.updateSubscriptionsStatusCron',
                clientId: subscription.clientId,
                subscriptionId: subscription.id,
                endDate,
                currentDate,
              });
            }
          }

          // Update subscription status to expired if conditions are met
          if (shouldExpire) {
            await this.prisma.client_subscription.update({
              where: { id: subscription.id },
              data: { status: ClientSubscriptionStatusEnum.EXPIRED },
            });

            expiredCount++;
            logger.info('Subscription marked as expired', {
              context: 'SubscriptionService.updateSubscriptionsStatusCron',
              clientId: subscription.clientId,
              subscriptionId: subscription.id,
              reason: expirationReason,
              isTrial: subscription.isTrial,
            });
          }
        } catch (error) {
          logger.error('Failed to process subscription expiration', {
            context: 'SubscriptionService.updateSubscriptionsStatusCron',
            clientId: subscription.clientId,
            subscriptionId: subscription.id,
            error,
          });
          // Continue processing other subscriptions even if one fails
        }
      }

      logger.info('Subscription status update cron job completed', {
        context: 'SubscriptionService.updateSubscriptionsStatusCron',
        totalProcessed: subscriptions.length,
        expiredCount,
        currentDate,
      });
    } catch (error) {
      logger.error('Failed to run subscription status update cron job', {
        context: 'SubscriptionService.updateSubscriptionsStatusCron',
        error,
      });
    }
  }
}
