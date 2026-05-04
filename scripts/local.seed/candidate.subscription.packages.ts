import { logger } from '../../src/shared/utils/logger';
import { prisma } from './prisma.client';

export const seedCandidateSubscriptionPackages = async () => {
  try {
    logger.info('Starting candidate subscription packages seed...');

    // Clear existing data that might reference packages
    await prisma.candidate_subscription_credit_purchase.deleteMany();
    logger.info('Cleared candidate subscription credit purchases');

    await prisma.candidate_subscription.deleteMany();
    logger.info('Cleared candidate subscriptions');

    // Clear existing packages
    await prisma.candidate_subscription_package.deleteMany();
    logger.info('Cleared candidate subscription packages');

    // Create subscription packages
    const packages = await Promise.all([
      // FREE Tier
      prisma.candidate_subscription_package.create({
        data: {
          name: 'FREE',
          description: 'Basic package for job seekers',
          isDefault: true,
          price: 0,
          currency: 'USD',
          billingCycle: 'MONTHLY',
          isActive: true,
          maxAssessmentsPerMonth: 2,
          maxPracticeAssessments: 5,
          accessToAllSkills: false,
          personalizedFeedback: false,
          careerCoaching: false,
          paymentProvider: 'DUMMY',
          features: {
            features: [
              'Basic skill assessments',
              'Limited practice assessments',
              'Basic resume analysis',
              'Standard job matching',
            ],
            limitations: [
              'No personalized feedback',
              'Limited skill access',
              'Basic career guidance',
            ],
          },
        },
      }),

      // STARTUP Tier
      prisma.candidate_subscription_package.create({
        data: {
          name: 'STARTUP',
          description: 'Enhanced features for active job seekers',
          isDefault: false,
          price: 29.99,
          currency: 'USD',
          billingCycle: 'MONTHLY',
          isActive: true,
          maxAssessmentsPerMonth: 10,
          maxPracticeAssessments: 20,
          accessToAllSkills: true,
          personalizedFeedback: true,
          careerCoaching: false,
          paymentProvider: 'DUMMY',
          features: {
            features: [
              'More skill assessments',
              'Increased practice assessments',
              'Personalized feedback',
              'Advanced resume analysis',
              'Priority job matching',
              'Access to all skills',
            ],
            limitations: [
              'No career coaching',
              'Limited assessment preparation',
              'Standard support',
            ],
          },
        },
      }),

      // PROFESSIONAL Tier
      prisma.candidate_subscription_package.create({
        data: {
          name: 'PROFESSIONAL',
          description: 'Complete package for serious career advancement',
          isDefault: false,
          price: 99.99,
          currency: 'USD',
          billingCycle: 'MONTHLY',
          isActive: true,
          maxAssessmentsPerMonth: 50,
          maxPracticeAssessments: 100,
          accessToAllSkills: true,
          personalizedFeedback: true,
          careerCoaching: true,
          paymentProvider: 'DUMMY',
          features: {
            features: [
              'Unlimited skill assessments',
              'Extensive practice assessments',
              'Personalized feedback',
              'Advanced resume analysis',
              'Priority job matching',
              'Access to all skills',
              'Career coaching sessions',
              'Assessment preparation',
              'Dedicated support',
            ],
            limitations: ['No custom learning paths'],
          },
        },
      }),
    ]);

    logger.info(
      `Created ${packages.length} candidate subscription packages successfully`
    );
    return packages;
  } catch (error) {
    logger.error('Error seeding candidate subscription packages:', error);
    throw error;
  }
};
