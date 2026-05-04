import { PrismaClient } from '@prisma/client';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';
import { ClientSubscriptionStatusEnum } from '@/shared/models/common/enums';
import { singleton } from '@/shared/decorators/singleton';

@singleton
export class ClientSubscriptionLimitsService {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Check if client can create a new job posting
   * @param clientId The client ID
   * @returns Object with canCreate boolean and error message if applicable
   */
  async checkJobPostingLimit(clientId: string): Promise<{
    canCreate: boolean;
    errorMessage?: string;
    currentUsage: number;
    limit: number;
  }> {
    try {
      let clientSubscription = await this.getClientWithSubscription(clientId);

      clientSubscription = await clientSubscription.subscriptions.find(
        (subscription: any) =>
          subscription.status === ClientSubscriptionStatusEnum.ACTIVE
      );

      const subscription = clientSubscription;
      const package_ = subscription.package;

      // Check if unlimited (-1 means unlimited)
      if (package_.maxJobPostings === -1) {
        return {
          canCreate: true,
          currentUsage: subscription.usedJobPostings,
          limit: -1,
        };
      }

      const currentUsage = subscription.usedJobPostings;
      const limit = package_.maxJobPostings;

      if (currentUsage >= limit) {
        return {
          canCreate: false,
          errorMessage: `You have reached your job posting limit of ${limit}. Please upgrade your subscription to create more job postings.`,
          currentUsage,
          limit,
        };
      }

      return {
        canCreate: true,
        currentUsage,
        limit,
      };
    } catch (error) {
      logger.error('Failed to check job posting limit', {
        context: 'ClientSubscriptionLimitsService.checkJobPostingLimit',
        clientId,
        error,
      });
      throw error;
    }
  }

  /**
   * Check if client can view candidate profiles
   * @param clientId The client ID
   * @returns Object with canView boolean and error message if applicable
   */
  async checkCandidateViewLimit(clientId: string): Promise<{
    canView: boolean;
    errorMessage?: string;
    currentUsage: number;
    limit: number;
  }> {
    try {
      let clientSubscription = await this.getClientWithSubscription(clientId);

      clientSubscription = await clientSubscription.subscriptions.find(
        (subscription: any) =>
          subscription.status === ClientSubscriptionStatusEnum.ACTIVE
      );

      const subscription = clientSubscription;
      const package_ = subscription.package;

      // Check if unlimited candidate views
      if (
        package_.unlimitedCandidateViews ||
        package_.maxCandidateViews === -1
      ) {
        return {
          canView: true,
          currentUsage: subscription.usedCandidateViews,
          limit: -1,
        };
      }

      const currentUsage = subscription.usedCandidateViews;
      const limit = package_.maxCandidateViews;

      if (currentUsage >= limit) {
        return {
          canView: false,
          errorMessage: `You have reached your candidate view limit of ${limit}. Please upgrade your subscription to view more candidate profiles.`,
          currentUsage,
          limit,
        };
      }

      return {
        canView: true,
        currentUsage,
        limit,
      };
    } catch (error) {
      logger.error('Failed to check candidate view limit', {
        context: 'ClientSubscriptionLimitsService.checkCandidateViewLimit',
        clientId,
        error,
      });
      throw error;
    }
  }

  /**
   * Check if client can create AI assessments
   * @param clientId The client ID
   * @returns Object with canCreate boolean and error message if applicable
   */
  async checkAiAssessmentLimit(clientId: string): Promise<{
    canCreate: boolean;
    errorMessage?: string;
    currentUsage: number;
    limit: number;
  }> {
    try {
      const client = await this.getClientWithSubscription(clientId);

      const clientSubscription = client.subscriptions.find(
        (subscription: any) =>
          subscription.status === ClientSubscriptionStatusEnum.ACTIVE
      );

      const subscription = clientSubscription;
      const package_ = subscription.package;

      // Check if unlimited (-1 means unlimited)
      if (package_.maxAiAssessments === -1) {
        return {
          canCreate: true,
          currentUsage: subscription.usedAiAssessments,
          limit: -1,
        };
      }

      const currentUsage = subscription.usedAiAssessments;
      const limit = package_.maxAiAssessments;

      if (currentUsage >= limit) {
        return {
          canCreate: false,
          errorMessage: `You have reached your AI assessment limit of ${limit}. Please upgrade your subscription to create more AI assessments.`,
          currentUsage,
          limit,
        };
      }

      return {
        canCreate: true,
        currentUsage,
        limit,
      };
    } catch (error) {
      logger.error('Failed to check AI assessment limit', {
        context: 'ClientSubscriptionLimitsService.checkAiAssessmentLimit',
        clientId,
        error,
      });
      throw error;
    }
  }

  /**
   * Check if client can add more seats/users
   * @param clientId The client ID
   * @returns Object with canAdd boolean and error message if applicable
   */
  async checkSeatsLimit(clientId: string): Promise<{
    canAdd: boolean;
    errorMessage?: string;
    currentUsage: number;
    limit: number;
  }> {
    try {
      const client = await this.getClientWithSubscription(clientId);

      const clientSubscription = client.subscriptions.find(
        (subscription: any) =>
          subscription.status === ClientSubscriptionStatusEnum.ACTIVE
      );

      const subscription = clientSubscription;
      const package_ = subscription.package;

      // Check if unlimited (-1 means unlimited)
      if (package_.maxSeats === -1) {
        return {
          canAdd: true,
          currentUsage: subscription.usedSeats,
          limit: -1,
        };
      }

      const currentUsage = subscription.usedSeats;
      const limit = package_.maxSeats;

      if (currentUsage >= limit) {
        return {
          canAdd: false,
          errorMessage: `You have reached your user seats limit of ${limit}. Please upgrade your subscription to add more team members.`,
          currentUsage,
          limit,
        };
      }

      // Check if client has available seats if yes cut one seat

      return {
        canAdd: true,
        currentUsage,
        limit,
      };
    } catch (error) {
      logger.error('Failed to check seats limit', {
        context: 'ClientSubscriptionLimitsService.checkSeatsLimit',
        clientId,
        error,
      });
      throw error;
    }
  }

  /**
   * Increment job posting usage
   * @param clientId The client ID
   */
  async incrementJobPostingUsage(clientId: string): Promise<void> {
    try {
      let clientSubscription = await this.getClientWithSubscription(clientId);
      clientSubscription = await clientSubscription.subscriptions.find(
        (subscription: any) =>
          subscription.status === ClientSubscriptionStatusEnum.ACTIVE
      );
      const subscription = clientSubscription;

      await this.prisma.client_subscription.update({
        where: { id: subscription.id },
        data: {
          usedJobPostings: {
            increment: 1,
          },
        },
      });

      logger.info('Incremented job posting usage', {
        context: 'ClientSubscriptionLimitsService.incrementJobPostingUsage',
        clientId,
        newUsage: subscription.usedJobPostings + 1,
      });
    } catch (error) {
      logger.error('Failed to increment job posting usage', {
        context: 'ClientSubscriptionLimitsService.incrementJobPostingUsage',
        clientId,
        error,
      });
      throw error;
    }
  }

  /**
   * Increment candidate view usage
   * @param clientId The client ID
   */
  async incrementCandidateViewUsage(clientId: string): Promise<void> {
    try {
      let clientSubscription = await this.getClientWithSubscription(clientId);
      clientSubscription = await clientSubscription.subscriptions.find(
        (subscription: any) =>
          subscription.status === ClientSubscriptionStatusEnum.ACTIVE
      );
      const subscription = clientSubscription;

      await this.prisma.client_subscription.update({
        where: { id: subscription.id },
        data: {
          usedCandidateViews: {
            increment: 1,
          },
        },
      });

      logger.info('Incremented candidate view usage', {
        context: 'ClientSubscriptionLimitsService.incrementCandidateViewUsage',
        clientId,
        newUsage: subscription.usedCandidateViews + 1,
      });
    } catch (error) {
      logger.error('Failed to increment candidate view usage', {
        context: 'ClientSubscriptionLimitsService.incrementCandidateViewUsage',
        clientId,
        error,
      });
      throw error;
    }
  }

  /**
   * Increment AI assessment usage
   * @param clientId The client ID
   */
  async incrementAiAssessmentUsage(clientId: string): Promise<void> {
    try {
      let clientSubscription = await this.getClientWithSubscription(clientId);
      clientSubscription = await clientSubscription.subscriptions.find(
        (subscription: any) =>
          subscription.status === ClientSubscriptionStatusEnum.ACTIVE
      );
      const subscription = clientSubscription;

      await this.prisma.client_subscription.update({
        where: { id: subscription.id },
        data: {
          usedAiAssessments: {
            increment: 1,
          },
        },
      });

      logger.info('Incremented AI assessment usage', {
        context: 'ClientSubscriptionLimitsService.incrementAiAssessmentUsage',
        clientId,
        newUsage: subscription.usedAiAssessments + 1,
      });
    } catch (error) {
      logger.error('Failed to increment AI assessment usage', {
        context: 'ClientSubscriptionLimitsService.incrementAiAssessmentUsage',
        clientId,
        error,
      });
      throw error;
    }
  }

  /**
   * Increment seats usage
   * @param clientId The client ID
   */
  async incrementSeatsUsage(clientId: string): Promise<void> {
    try {
      let clientSubscription = await this.getClientWithSubscription(clientId);
      clientSubscription = await clientSubscription.subscriptions.find(
        (subscription: any) =>
          subscription.status === ClientSubscriptionStatusEnum.ACTIVE
      );
      const subscription = clientSubscription;

      await this.prisma.client_subscription.update({
        where: { id: subscription.id },
        data: {
          usedSeats: {
            increment: 1,
          },
        },
      });

      logger.info('Incremented seats usage', {
        context: 'ClientSubscriptionLimitsService.incrementSeatsUsage',
        clientId,
        newUsage: subscription.usedSeats + 1,
      });
    } catch (error) {
      logger.error('Failed to increment seats usage', {
        context: 'ClientSubscriptionLimitsService.incrementSeatsUsage',
        clientId,
        error,
      });
      throw error;
    }
  }

  /**
   * Get client with subscription data
   * @param clientId The client ID
   * @returns Client with subscription data
   */
  private async getClientWithSubscription(clientId: string): Promise<any> {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      include: {
        subscriptions: {
          include: {
            package: true,
          },
        },
      },
    });

    if (!client) {
      throw new AppError('Client not found', 404, ErrorCode.NOT_FOUND);
    }

    if (client.subscriptions.length === 0) {
      throw new AppError(
        'No subscription found for client',
        400,
        ErrorCode.SUBSCRIPTION_REQUIRED
      );
    }

    if (
      client.subscriptions.some(
        (subscription) =>
          subscription.status !== ClientSubscriptionStatusEnum.ACTIVE
      )
    ) {
      logger.info('Client subscription is not active', {
        context: 'ClientSubscriptionLimitsService.getClientWithSubscription',
        clientId,
        subscriptionStatus: client.subscriptions.some(
          (subscription) =>
            subscription.status !== ClientSubscriptionStatusEnum.ACTIVE
        ),
      });
    }

    return client;
  }

  /**
   * Get comprehensive usage summary for a client
   * @param clientId The client ID
   * @returns Usage summary object
   */
  async getUsageSummary(clientId: string): Promise<{
    jobPostings: { used: number; limit: number; canCreate: boolean };
    candidateViews: { used: number; limit: number; canView: boolean };
    aiAssessments: { used: number; limit: number; canCreate: boolean };
    seats: { used: number; limit: number; canAdd: boolean };
  }> {
    try {
      let clientSubscription = await this.getClientWithSubscription(clientId);

      clientSubscription = await clientSubscription.subscriptions.find(
        (subscription: any) =>
          subscription.status === ClientSubscriptionStatusEnum.ACTIVE
      );

      if (!clientSubscription) {
        return {
          jobPostings: {
            used: 0,
            limit: 0,
            canCreate: false,
          },

          candidateViews: {
            used: 0,
            limit: 0,
            canView: false,
          },

          aiAssessments: {
            used: 0,
            limit: 0,
            canCreate: false,
          },

          seats: {
            used: 0,
            limit: 0,
            canAdd: false,
          },
        };
      }
      const subscription = clientSubscription;
      const package_ = subscription.package;

      return {
        jobPostings: {
          used: subscription.usedJobPostings,
          limit: package_.maxJobPostings,
          canCreate:
            package_.maxJobPostings === -1 ||
            subscription.usedJobPostings < package_.maxJobPostings,
        },
        candidateViews: {
          used: subscription.usedCandidateViews,
          limit: package_.maxCandidateViews,
          canView:
            package_.unlimitedCandidateViews ||
            package_.maxCandidateViews === -1 ||
            subscription.usedCandidateViews < package_.maxCandidateViews,
        },
        aiAssessments: {
          used: subscription.usedAiAssessments,
          limit: package_.maxAiAssessments,
          canCreate:
            package_.maxAiAssessments === -1 ||
            subscription.usedAiAssessments < package_.maxAiAssessments,
        },
        seats: {
          used: subscription.usedSeats,
          limit: package_.maxSeats,
          canAdd:
            package_.maxSeats === -1 ||
            subscription.usedSeats < package_.maxSeats,
        },
      };
    } catch (error) {
      logger.error('Failed to get usage summary', {
        context: 'ClientSubscriptionLimitsService.getUsageSummary',
        clientId,
        error,
      });
      throw error;
    }
  }
}
