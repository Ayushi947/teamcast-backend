import { logger } from '../../src/shared/utils/logger';
import { prisma } from './prisma.client';
import { faker } from '@faker-js/faker';

export const seedPartnerUsers = async (
  partnerUsers: any[],
  partners: any[]
) => {
  try {
    logger.info('Starting partner user seed...');

    // Clear existing partner users
    await prisma.partner_user.deleteMany();

    // Create partner users
    const partnerUserMappings = await Promise.all(
      partnerUsers.map(async (user, index) => {
        const partner = partners[index % partners.length];
        return prisma.partner_user.create({
          data: {
            userId: user.id,
            partnerId: partner.id,
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
      `Created ${partnerUserMappings.length} partner users successfully`
    );
    return partnerUserMappings;
  } catch (error) {
    logger.error('Error seeding partner users:', error);
    throw error;
  }
};
