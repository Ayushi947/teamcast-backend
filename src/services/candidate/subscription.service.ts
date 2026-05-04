import { PrismaClient } from '@prisma/client';
import { PaymentFactory } from '@/services/subscription/payment.factory';
import {
  ICandidateSubscription,
  ICandidateSubscriptionPackage,
  ICandidateSubscriptionUpdate,
  ICandidateSubscriptionCancel,
  toCandidateSubscriptionDomain,
  toCandidateSubscriptionPackageDomain,
  ICandidateSubscriptionPackageFilterQuery,
} from '@/shared/models/domain/candidate/subscription.domain';
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
  PaymentProviderEnum,
  CandidateSubscriptionStatusEnum,
} from '@/shared/models/common/enums';
import { singleton } from '@/shared/decorators/singleton';

@singleton
export class CandidateSubscriptionService {
  private readonly prisma: PrismaClient;

  constructor(private readonly paymentFactory: PaymentFactory) {
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
        context: 'CandidateSubscriptionService.safeToDate',
        dateValue,
        fallbackDate,
      });
      return fallbackDate;
    }

    return convertedDate;
  }

  async getCandidateWithSubscriptionData(candidateId: string): Promise<any> {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        user: true,
        candidateSubscription: {
          include: {
            package: true,
          },
        },
      },
    });

    if (!candidate) {
      throw new AppError('Candidate not found', 400, ErrorCode.NOT_FOUND);
    }

    const currentSubscription = candidate.candidateSubscription;

    if (!currentSubscription) {
      throw new AppError(
        'No active subscription found for candidate',
        400,
        ErrorCode.SUBSCRIPTION_REQUIRED
      );
    }

    if (!currentSubscription.paymentProviderCustomerId) {
      throw new AppError(
        'Candidate has no payment provider customer ID',
        400,
        ErrorCode.SUBSCRIPTION_REQUIRED
      );
    }

    return candidate;
  }

  /**
   * Get a candidate's current subscription
   * @param candidateId The candidate ID
   */
  async getCurrentSubscription(
    candidateId: string
  ): Promise<ICandidateSubscription> {
    try {
      const candidate =
        await this.getCandidateWithSubscriptionData(candidateId);
      const currentSubscription = candidate.candidateSubscription;

      if (
        !currentSubscription ||
        currentSubscription.status !== CandidateSubscriptionStatusEnum.ACTIVE
      ) {
        throw new AppError(
          'Candidate has no active subscription',
          400,
          ErrorCode.SUBSCRIPTION_REQUIRED
        );
      }

      return toCandidateSubscriptionDomain(currentSubscription);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Failed to get candidate subscription', {
        context: 'CandidateSubscriptionService.getCurrentSubscription',
        candidateId,
        error,
      });

      throw new AppError(
        'Failed to get subscription information',
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
    filter: ICandidateSubscriptionPackageFilterQuery,
    paginationRequest: IPaginationRequest
  ): Promise<IPaginatedResponse<ICandidateSubscriptionPackage>> {
    try {
      const where = {
        ...(filter?.isActive
          ? { isActive: filter.isActive }
          : { isActive: true }),
        ...(filter?.name && { name: filter.name }),
        ...(filter?.description && { description: filter.description }),
        ...(filter?.price && { price: filter.price }),
      };
      const total = await this.prisma.candidate_subscription_package.count({
        where,
      });

      const paginationInfo = getPaginationInfo(paginationRequest);

      const packages =
        await this.prisma.candidate_subscription_package.findMany({
          where,
          ...paginationInfo,
        });

      return {
        items: packages.map(toCandidateSubscriptionPackageDomain),
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
        context: 'CandidateSubscriptionService.getSubscriptionPackages',
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
   * Update a candidate's subscription (upgrade/downgrade)
   * @param candidateId The candidate ID
   * @param updateData The update data
   */
  async updateSubscription(
    candidateId: string,
    updateData: ICandidateSubscriptionUpdate
  ): Promise<ICandidateSubscription> {
    try {
      const newPackage =
        await this.prisma.candidate_subscription_package.findUnique({
          where: { id: updateData.packageId },
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

      const candidate = await this.prisma.candidate.findUnique({
        where: { id: candidateId },
        include: {
          user: true,
          candidateSubscription: {
            include: {
              package: true,
            },
          },
        },
      });

      if (!candidate) {
        throw new AppError('Candidate not found', 400, ErrorCode.NOT_FOUND);
      }

      let currentSubscription;

      if (!candidate.candidateSubscription) {
        await this.createDefaultSubscription(candidateId);
        const updatedCandidate = await this.prisma.candidate.findUnique({
          where: { id: candidateId },
          include: {
            user: true,
            candidateSubscription: {
              include: {
                package: true,
              },
            },
          },
        });
        currentSubscription = updatedCandidate?.candidateSubscription;
      } else {
        currentSubscription = candidate.candidateSubscription;
      }

      if (
        !currentSubscription ||
        currentSubscription.status !== CandidateSubscriptionStatusEnum.ACTIVE
      ) {
        throw new AppError(
          'Candidate has no active subscription',
          400,
          ErrorCode.SUBSCRIPTION_REQUIRED
        );
      }

      if (currentSubscription.paymentProviderSubscriptionId) {
        await this.paymentFactory
          .getPaymentProviderByType(
            currentSubscription.paymentProvider as PaymentProviderEnum
          )
          .cancelSubscription(
            currentSubscription.paymentProviderSubscriptionId
          );
      }

      return await this.prisma.$transaction(async (tx) => {
        const subscriptionResult = await this.paymentFactory
          .getPaymentProviderByType(
            currentSubscription.paymentProvider as PaymentProviderEnum
          )
          .createOrUpdateSubscription(
            currentSubscription.paymentProviderCustomerId || '',
            newPackage.paymentProviderProductId || '',
            newPackage.paymentProviderPriceId || '',
            { candidateId, packageId: newPackage.id }
          );

        const updatedSubscription = await tx.candidate_subscription.update({
          where: { id: currentSubscription.id },
          data: {
            packageId: newPackage.id,
            status: CandidateSubscriptionStatusEnum.ACTIVE,
            nextBillingDate: this.safeToDate(
              subscriptionResult?.currentPeriodEnd,
              new Date()
            ),
          },
          include: {
            package: true,
          },
        });

        return toCandidateSubscriptionDomain(updatedSubscription);
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Failed to update subscription', {
        context: 'CandidateSubscriptionService.updateSubscription',
        candidateId,
        packageId: updateData.packageId,
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
   * Cancel a candidate's subscription
   * @param candidateId The candidate ID
   * @param cancelData The cancellation data
   */
  async cancelSubscription(
    candidateId: string,
    cancelData: ICandidateSubscriptionCancel
  ): Promise<ICandidateSubscription> {
    try {
      const candidate =
        await this.getCandidateWithSubscriptionData(candidateId);
      const currentSubscription = candidate.candidateSubscription;

      if (
        !currentSubscription ||
        currentSubscription.status !== CandidateSubscriptionStatusEnum.ACTIVE
      ) {
        throw new AppError(
          'Candidate has no active subscription',
          400,
          ErrorCode.SUBSCRIPTION_REQUIRED
        );
      }

      if (currentSubscription.paymentProviderSubscriptionId) {
        await this.paymentFactory
          .getPaymentProviderByType(
            currentSubscription.paymentProvider as PaymentProviderEnum
          )
          .cancelSubscription(
            currentSubscription.paymentProviderSubscriptionId
          );
      }

      if (
        currentSubscription.status !== CandidateSubscriptionStatusEnum.ACTIVE
      ) {
        throw new AppError(
          "User doesn't have an active subscription",
          400,
          ErrorCode.CONFLICT
        );
      }

      const updatedSubscription =
        await this.prisma.candidate_subscription.update({
          where: { id: currentSubscription.id },
          data: {
            status: CandidateSubscriptionStatusEnum.CANCELLED,
            metadata: cancelData.reason
              ? { cancellationReason: cancelData.reason }
              : undefined,
          },
          include: {
            package: true,
          },
        });

      return toCandidateSubscriptionDomain(updatedSubscription);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Failed to cancel subscription', {
        context: 'CandidateSubscriptionService.cancelSubscription',
        candidateId,
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
   * Get a candidate's payment methods
   * @param candidateId The candidate ID
   */
  async getPaymentMethods(candidateId: string): Promise<IPaymentMethod[]> {
    try {
      const candidate =
        await this.getCandidateWithSubscriptionData(candidateId);
      const currentSubscription = candidate.candidateSubscription;

      if (
        !currentSubscription ||
        currentSubscription.status !== CandidateSubscriptionStatusEnum.ACTIVE
      ) {
        throw new AppError(
          'Candidate has no active subscription',
          400,
          ErrorCode.SUBSCRIPTION_REQUIRED
        );
      }

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
        context: 'CandidateSubscriptionService.getPaymentMethods',
        candidateId,
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
   * Add a payment method for a candidate
   * @param candidateId The candidate ID
   * @param paymentMethodId The payment method ID
   * @param isDefault Whether this should be the default payment method
   */
  async addPaymentMethod(
    candidateId: string,
    paymentMethodId: string,
    isDefault?: boolean
  ): Promise<IPaymentMethod[]> {
    try {
      const candidate =
        await this.getCandidateWithSubscriptionData(candidateId);
      const currentSubscription = candidate.candidateSubscription;

      if (
        !currentSubscription ||
        currentSubscription.status !== CandidateSubscriptionStatusEnum.ACTIVE
      ) {
        throw new AppError(
          'Candidate has no active subscription',
          400,
          ErrorCode.SUBSCRIPTION_REQUIRED
        );
      }

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
        context: 'CandidateSubscriptionService.addPaymentMethod',
        candidateId,
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
   * Remove a payment method from a candidate
   * @param candidateId The candidate ID
   * @param paymentMethodId The payment method ID to remove
   */
  async removePaymentMethod(
    candidateId: string,
    paymentMethodId: string
  ): Promise<IPaymentMethod[]> {
    try {
      const candidate =
        await this.getCandidateWithSubscriptionData(candidateId);
      const currentSubscription = candidate.candidateSubscription;

      if (
        !currentSubscription ||
        currentSubscription.status !== CandidateSubscriptionStatusEnum.ACTIVE
      ) {
        throw new AppError(
          'Candidate has no active subscription',
          400,
          ErrorCode.SUBSCRIPTION_REQUIRED
        );
      }

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
        context: 'CandidateSubscriptionService.removePaymentMethod',
        candidateId,
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
   * Set a payment method as the default for a candidate
   * @param candidateId The candidate ID
   * @param paymentMethodId The payment method ID to set as default
   */
  async setDefaultPaymentMethod(
    candidateId: string,
    paymentMethodId: string
  ): Promise<IPaymentMethod[]> {
    try {
      const candidate =
        await this.getCandidateWithSubscriptionData(candidateId);
      const currentSubscription = candidate.candidateSubscription;

      if (
        !currentSubscription ||
        currentSubscription.status !== CandidateSubscriptionStatusEnum.ACTIVE
      ) {
        throw new AppError(
          'Candidate has no active subscription',
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
        context: 'CandidateSubscriptionService.setDefaultPaymentMethod',
        candidateId,
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
   * Create a subscription for a candidate with the default package
   * @param candidateId The candidate ID
   */
  async createDefaultSubscription(
    candidateId: string
  ): Promise<ICandidateSubscription> {
    try {
      const candidate = await this.prisma.candidate.findUnique({
        where: { id: candidateId },
        include: {
          user: true,
          candidateSubscription: true,
        },
      });

      if (!candidate) {
        throw new AppError('Candidate not found', 400, ErrorCode.NOT_FOUND);
      }

      if (candidate.candidateSubscription) {
        throw new AppError(
          'Candidate already has an active subscription',
          400,
          ErrorCode.CONFLICT
        );
      }

      const defaultPackage =
        await this.prisma.candidate_subscription_package.findFirst({
          where: { isDefault: true, isActive: true },
        });

      if (!defaultPackage) {
        throw new AppError(
          'No default subscription package found',
          500,
          ErrorCode.INTERNAL_SERVER_ERROR
        );
      }

      return await this.prisma.$transaction(async (tx) => {
        logger.info('Creating customer in the payment provider', {
          context: 'CandidateSubscriptionService.createDefaultSubscription',
          candidateId,
          userEmail: candidate.user.email,
          userName: candidate.user.name,
        });

        const paymentProviderCustomerId = await this.paymentFactory
          .getPaymentProviderByType(
            defaultPackage.paymentProvider as PaymentProviderEnum
          )
          .createCustomer(candidate.user.email, candidate.user.name, {
            candidateId: candidate.id,
          });

        logger.info('Customer created in the payment provider', {
          context: 'CandidateSubscriptionService.createDefaultSubscription',
          candidateId,
          paymentProviderCustomerId,
        });

        const newSubscription = await tx.candidate_subscription.create({
          data: {
            candidateId,
            packageId: defaultPackage.id,
            paymentProviderCustomerId: paymentProviderCustomerId,
            status: CandidateSubscriptionStatusEnum.ACTIVE,
            startDate: new Date(),
            autoRenew: true,
            practiceAssessmentsUsed: 0,
            paymentProvider:
              defaultPackage.paymentProvider as PaymentProviderEnum,
            lastBillingDate: new Date(),
          },
          include: {
            package: true,
          },
        });

        const subscriptionResult = await this.paymentFactory
          .getPaymentProviderByType(
            defaultPackage.paymentProvider as PaymentProviderEnum
          )
          .createOrUpdateSubscription(
            paymentProviderCustomerId,
            defaultPackage.paymentProviderProductId || '',
            defaultPackage.paymentProviderPriceId || '',
            { candidateId, packageId: defaultPackage.id }
          );

        logger.info('Subscription created in the payment provider', {
          context: 'CandidateSubscriptionService.createDefaultSubscription',
          candidateId,
          subscriptionResult,
        });

        const updatedSubscription = await tx.candidate_subscription.update({
          where: { id: newSubscription.id },
          data: {
            paymentProviderSubscriptionId: subscriptionResult.subscriptionId,
            lastBillingDate: new Date(),
            nextBillingDate: this.safeToDate(
              subscriptionResult.currentPeriodEnd,
              new Date()
            ),
          },
          include: {
            package: true,
          },
        });

        return toCandidateSubscriptionDomain(updatedSubscription);
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Failed to create default subscription', {
        context: 'CandidateSubscriptionService.createDefaultSubscription',
        candidateId,
        error,
      });

      throw new AppError(
        'Failed to create subscription',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }
}
