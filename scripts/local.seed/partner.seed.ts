import { faker } from '@faker-js/faker';
import { logger } from '../../src/shared/utils/logger';
import { prisma } from './prisma.client';

// Helper function to create a single partner
const createPartner = async (companyId: string) => {
  return prisma.partner.create({
    data: {
      companyId,
      settings: {
        create: {
          notificationsEnabled: faker.datatype.boolean(),
          emailNotifications: faker.datatype.boolean(),
          pushNotifications: faker.datatype.boolean(),
          consultantAlerts: faker.datatype.boolean(),
          contractAlerts: faker.datatype.boolean(),
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
    },
  });
};

// Function to seed partners
export const seedPartners = async (companies: any[]) => {
  try {
    logger.info('Starting partner seed...');

    // Clear existing partners
    await prisma.partner.deleteMany();

    // Create partners for each company
    const partners = await Promise.all(
      companies.map((company) => createPartner(company.id))
    );

    logger.info(`Created ${partners.length} partners successfully`);
    return partners;
  } catch (error) {
    logger.error('Error seeding partners:', error);
    throw error;
  }
};
