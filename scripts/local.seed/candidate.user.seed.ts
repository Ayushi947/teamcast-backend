import { faker } from '@faker-js/faker';
import { logger } from '../../src/shared/utils/logger';
import { prisma } from './prisma.client';

export const seedCandidateUsers = async (
  candidateUsers: any[],
  candidateSubscriptionPackages: any[],
  partners?: any[]
) => {
  try {
    logger.info('Starting candidate user seed...');

    // Clear existing candidate users (but not partner resource users)
    await prisma.candidate.deleteMany({
      where: {
        user: {
          type: {
            not: 'PARTNER',
          },
        },
      },
    });

    // Create candidate users
    const candidateMappings = await Promise.all(
      candidateUsers.map(async (user) => {
        // Randomly select a subscription package
        const randomPackage = faker.helpers.arrayElement(
          candidateSubscriptionPackages
        );
        if (!randomPackage) {
          throw new Error('No subscription packages available');
        }

        let partnerId = null;
        if (partners && partners.length > 0 && faker.datatype.boolean()) {
          const randomPartner = faker.helpers.arrayElement(partners);
          partnerId = randomPartner.id;
        }

        // Randomly select status and assessment stage
        const status = faker.helpers.arrayElement([
          'NEW',
          'ONBOARDED',
          'REJECTED',
          'HIRED',
        ]);
        const assessmentStage = faker.helpers.arrayElement([
          'RESUME_ASSESSMENT',
          'ONBOARDING_ASSESSMENT',
        ]);

        const candidate = await prisma.candidate.create({
          data: {
            userId: user.id,
            status,
            assessmentStage,
            partnerId,
            settings: {
              create: {
                notificationsEnabled: true,
                emailNotifications: true,
                pushNotifications: true,
                jobAlerts: faker.datatype.boolean(),
                applicationUpdates: faker.datatype.boolean(),
                profileVisibility: faker.datatype.boolean(),
                shareDataWithEmployers: faker.datatype.boolean(),
                darkMode: faker.datatype.boolean(),
                language: 'en',
                timezone: 'UTC',
                preferredCommunicationChannel: faker.helpers.arrayElement([
                  'EMAIL',
                  'PHONE',
                  'SMS',
                  'IN_APP',
                ]),
              },
            },
            preferences: {
              create: {
                preferredIndustries: Array.from(
                  { length: faker.number.int({ min: 1, max: 5 }) },
                  () => faker.company.buzzPhrase()
                ),
                preferredLocations: Array.from(
                  { length: faker.number.int({ min: 1, max: 3 }) },
                  () => faker.location.city()
                ),
                preferredWorkTypes: faker.helpers.arrayElements(
                  [
                    'EMPLOYEE',
                    'CONTRACTOR',
                    'FREELANCER',
                    'VOLUNTEER',
                    'INTERN',
                    'APPRENTICESHIP',
                    'OTHER',
                  ],
                  { min: 1, max: 3 }
                ),
                preferredJobTitles: Array.from(
                  { length: faker.number.int({ min: 1, max: 3 }) },
                  () => faker.person.jobTitle()
                ),
                preferredJobCommitments: faker.helpers.arrayElements(
                  ['FULL_TIME', 'PART_TIME', 'HOURLY', 'PROJECT_BASED'],
                  { min: 1, max: 2 }
                ),
                preferredJobSchedules: faker.helpers.arrayElements(
                  ['REGULAR', 'FLEXIBLE', 'SHIFT_BASED'],
                  { min: 1, max: 3 }
                ),
                preferredSalaryMin: faker.number.float({
                  min: 30000,
                  max: 50000,
                }),
                preferredSalaryMax: faker.number.float({
                  min: 60000,
                  max: 100000,
                }),
                preferredSalaryCurrency: 'INR',
                preferredEquity: faker.datatype.boolean(),
                preferredBenefits: Array.from(
                  { length: faker.number.int({ min: 1, max: 5 }) },
                  () => faker.company.buzzPhrase()
                ),
                preferredResponsibilities: Array.from(
                  { length: faker.number.int({ min: 1, max: 5 }) },
                  () => faker.company.buzzPhrase()
                ),
                preferredTags: Array.from(
                  { length: faker.number.int({ min: 1, max: 5 }) },
                  () => faker.company.buzzPhrase()
                ),
              },
            },
            // Create subscription for the candidate
            candidateSubscription: {
              create: {
                packageId: randomPackage.id,
                status: 'ACTIVE',
                startDate: new Date(),
                endDate: faker.date.future(),
                autoRenew: faker.datatype.boolean(),
                assessmentsUsedThisMonth: 0,
                practiceAssessmentsUsed: 0,
                additionalPracticeAssessmentCredits: 0,
                paymentProvider: 'DUMMY',
                paymentProviderCustomerId: faker.string.uuid(),
                lastBillingDate: new Date(),
                metadata: {
                  trialEndDate: faker.date.future(),
                  lastLoginDate: new Date(),
                  subscriptionSource: 'SEED',
                },
              },
            },
          },
        });

        return candidate;
      })
    );

    logger.info(
      `Created ${candidateMappings.length} candidate users successfully`
    );
    return candidateMappings;
  } catch (error) {
    logger.error('Error seeding candidate users:', error);
    throw error;
  }
};
