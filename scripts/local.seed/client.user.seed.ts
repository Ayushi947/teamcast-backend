import { logger } from '../../src/shared/utils/logger';
import { prisma } from './prisma.client';
import { faker } from '@faker-js/faker';

export const seedClientUsers = async (clientUsers: any[], clients: any[]) => {
  try {
    logger.info('Starting client user seed...');

    // Clear existing client users
    await prisma.client_user.deleteMany();

    // Create client users
    const clientUserMappings = await Promise.all(
      clientUsers.map(async (user, index) => {
        const client = clients[index % clients.length];

        // Get client settings
        const clientSettings = await prisma.client.findUnique({
          where: { id: client.id },
          include: { settings: true },
        });

        return prisma.client_user.create({
          data: {
            userId: user.id,
            clientId: client.id,
            settings: {
              create: {
                notificationsEnabled:
                  clientSettings?.settings?.notificationsEnabled ?? true,
                emailNotifications:
                  clientSettings?.settings?.emailNotifications ?? true,
                pushNotifications:
                  clientSettings?.settings?.pushNotifications ?? true,
                darkMode: faker.datatype.boolean(),
                language: 'en',
                timezone: 'UTC',
                preferredCommunicationChannel: 'EMAIL',
              },
            },
          },
        });
      })
    );

    logger.info(
      `Created ${clientUserMappings.length} client users successfully`
    );
    return clientUserMappings;
  } catch (error) {
    logger.error('Error seeding client users:', error);
    throw error;
  }
};
