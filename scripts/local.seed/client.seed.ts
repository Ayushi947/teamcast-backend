import { faker } from '@faker-js/faker';
import { logger } from '../../src/shared/utils/logger';
import { prisma } from './prisma.client';

// Helper function to create a single client
const createClient = async (
  companyId: string,
  clientSubscriptionPackages: any[]
) => {
  // Randomly select a package
  const randomPackage = faker.helpers.arrayElement(clientSubscriptionPackages);
  if (!randomPackage) {
    throw new Error('No subscription packages available');
  }

  return prisma.client.create({
    data: {
      companyId,
      settings: {
        create: {
          notificationsEnabled: faker.datatype.boolean(),
          emailNotifications: faker.datatype.boolean(),
          pushNotifications: faker.datatype.boolean(),
          jobAlerts: faker.datatype.boolean(),
          candidateAlerts: faker.datatype.boolean(),
          applicationAlerts: faker.datatype.boolean(),
          privacySettings: {
            dataSharing: faker.datatype.boolean(),
            profileVisibility: faker.helpers.arrayElement([
              'public',
              'private',
              'restricted',
            ]),
            dataRetention: faker.number.int({ min: 30, max: 365 }),
          },
          brandingSettings: {
            primaryColor: faker.color.rgb(),
            secondaryColor: faker.color.rgb(),
            logoUrl: faker.image.url(),
            customDomain: faker.internet.domainName(),
          },
          integrationSettings: {
            calendarIntegration: faker.datatype.boolean(),
            emailIntegration: faker.datatype.boolean(),
            slackIntegration: faker.datatype.boolean(),
          },
        },
      },
      clientAiAssessmentSettings: {
        create: {
          greetingMessage: 'Welcome to the onboarding assessment!',
          defaultAssessmentDuration: 60 * 60,
          defaultPassingScore: 0.7,
          requiredSections: [
            'INTRODUCTION',
            'PSYCHOMETRIC_ASSESSMENT',
            'ASPIRATIONS',
          ],
          maximumAttempts: 3,
          cooldownPeriod: 7,
          proctoringEnabled: true,
          maxWarnings: 3,
          tabSwitchLimit: 3,
          copyPasteAllowed: false,
          videoRecordingEnabled: true,
          minimumVideoLength: 10,
          aiVideoAnalysisEnabled: true,
          autoPublishOnSuccess: true,
          autoNotifyOnComplete: true,
          sectionTemplates: {},
          questionTemplates: {},
          customStyles: {},
          customInstructions:
            'Please complete all sections of the assessment honestly and to the best of your ability.',
        },
      },
      subscriptions: {
        create: {
          packageId: randomPackage.id,
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: faker.date.future(),
          autoRenew: faker.datatype.boolean(),
          usedJobPostings: 0,
          usedCandidateViews: 0,
          usedAiAssessments: 0,
          usedSeats: 1,
          additionalCandidateViewCredits: 0,
          additionalAiAssessmentCredits: 0,
          additionalSeatsCredits: 0,
          paymentProvider: 'DUMMY',
          paymentProviderCustomerId: faker.string.uuid(),
          metadata: {
            trialEndDate: faker.date.future(),
            lastLoginDate: new Date(),
            subscriptionSource: 'SEED',
          },
        },
      },
    },
  });
};

// Function to seed clients
export const seedClients = async (
  companies: any[],
  clientSubscriptionPackages: any[]
) => {
  try {
    logger.info('Starting client seed...');

    // Clear existing clients
    await prisma.client.deleteMany();

    // Create clients for each company
    const clients = await Promise.all(
      companies.map(async (company) => {
        const client = await createClient(
          company.id,
          clientSubscriptionPackages
        );
        return client;
      })
    );

    logger.info(`Created ${clients.length} clients successfully`);
    return clients;
  } catch (error) {
    logger.error('Error seeding clients:', error);
    throw error;
  }
};
