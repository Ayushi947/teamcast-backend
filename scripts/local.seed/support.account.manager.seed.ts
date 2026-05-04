import { support_department, support_level } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { logger } from '../../src/shared/utils/logger';
import { prisma } from './prisma.client';

// Function to create support_user records for existing account manager users
export const seedSupportAccountManagers = async (
  accountManagerUsers: any[]
) => {
  try {
    logger.info('Starting support account manager seed...');

    // Create support_user records for existing account manager users
    const supportUserMappings = await Promise.all(
      accountManagerUsers.map(async (user) => {
        return prisma.support_user.create({
          data: {
            userId: user.id,
            department: support_department.OPERATIONS,
            supportLevel: support_level.L4,
            settings: {
              create: {
                notificationsEnabled: true,
                emailNotifications: true,
                pushNotifications: true,
                darkMode: faker.datatype.boolean(),
                language: 'en',
                timezone: 'UTC',
              },
            },
          },
        });
      })
    );

    logger.info(
      `Created ${supportUserMappings.length} support account manager records successfully`
    );

    // Log credentials for testing
    logger.info('=== SUPPORT ACCOUNT MANAGER CREDENTIALS ===');
    logger.info('All account managers have password: Password123!');
    logger.info('Account Manager emails:');
    accountManagerUsers.forEach((user, index) => {
      logger.info(`${index + 1}. ${user.email}`);
    });
    logger.info('===========================================');

    return supportUserMappings;
  } catch (error) {
    logger.error('Error seeding support account managers:', error);
    throw error;
  }
};
