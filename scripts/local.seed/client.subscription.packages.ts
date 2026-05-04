import { logger } from '../../src/shared/utils/logger';
import { prisma } from './prisma.client';

export const seedClientSubscriptionPackages = async () => {
  try {
    logger.info('Starting client subscription packages seed...');

    // Clear existing data that might reference packages
    await prisma.client_subscription_credit_purchase.deleteMany();
    logger.info('Cleared client subscription credit purchases');

    await prisma.client_subscription.deleteMany();
    logger.info('Cleared client subscriptions');

    // Clear existing packages
    await prisma.client_subscription_package.deleteMany();
    logger.info('Cleared client subscription packages');

    // Create subscription packages
    const packages = await Promise.all([
      // STARTER Tier
      prisma.client_subscription_package.create({
        data: {
          name: 'Starter',
          description: 'Perfect for small teams and startups',
          isDefault: true,
          price: 199,
          currency: 'USD',
          billingCycle: 'MONTHLY',
          isActive: true,
          maxJobPostings: 5,
          maxCandidateViews: 75,
          maxAiAssessments: 15,
          maxSeats: 3,
          unlimitedCandidateViews: false,
          paymentProvider: 'STRIPE',
          paymentProviderPriceId: 'price_1Rb2A4HQFOJAl3DqyvoHUS6Y',
          paymentProviderProductId: 'prod_SW4INXeLW4WSkk',
          additionalFeatures: {
            aiPoweredCandidateMatching: true,
            emailSupport: true,
            basicPerformanceInsights: true,
            automatedInterviewScheduling: true,
            includesAIRecommendations: true,
            prioritySupport: false,
            customBranding: false,
          },
        },
      }),

      // PROFESSIONAL Tier
      prisma.client_subscription_package.create({
        data: {
          name: 'Professional',
          description: 'Ideal for growing companies',
          isDefault: false,
          price: 499,
          currency: 'USD',
          billingCycle: 'MONTHLY',
          isActive: true,
          maxJobPostings: 20,
          maxCandidateViews: 250,
          maxAiAssessments: 50,
          maxSeats: 10,
          unlimitedCandidateViews: false,
          paymentProvider: 'STRIPE',
          paymentProviderPriceId: 'price_1Rb29THQFOJAl3DqBHF7pIlY',
          paymentProviderProductId: 'prod_SW4IT4m942rwAT',
          additionalFeatures: {
            advancedAIMatchingWithCustomCriteria: true,
            prioritySupportViaEmailAndLiveChat: true,
            comprehensiveAnalytics: true,
            smartInterviewSchedulingWithCalendarSync: true,
            seamlessATSAndJobBoardConnections: true,
            includesAIRecommendations: true,
            customBranding: false,
          },
        },
      }),

      // ENTERPRISE Tier
      prisma.client_subscription_package.create({
        data: {
          name: 'Enterprise',
          description: 'For large organizations with custom needs',
          isDefault: false,
          price: 0,
          currency: 'USD',
          billingCycle: 'MONTHLY',
          isActive: true,
          maxJobPostings: -1, // Unlimited
          maxCandidateViews: -1, // Unlimited
          maxAiAssessments: -1, // Unlimited
          maxSeats: -1, // Unlimited
          unlimitedCandidateViews: true,
          paymentProvider: 'STRIPE',
          paymentProviderPriceId: null,
          paymentProviderProductId: null,
          additionalFeatures: {
            customAIMatchingAlgorithms: true,
            dedicatedSupport24_7: true,
            seamlessATSAndJobBoardConnections: true,
            customAnalyticsAndWhiteLabelReporting: true,
            advancedInterviewToolsWithCustomWorkflows: true,
            completeTeamManagementAndCollaboration: true,
            fullAPIAccess: true,
            customIntegrations: true,
            dedicatedAccountManager: true,
            includesAIRecommendations: true,
            customBranding: true,
          },
        },
      }),
    ]);

    logger.info(
      `Created ${packages.length} subscription packages successfully`
    );
    return packages;
  } catch (error) {
    logger.error('Error seeding subscription packages:', error);
    throw error;
  }
};
