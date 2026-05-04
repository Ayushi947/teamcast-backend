import { seedSupportAccountManagers } from './local.seed/support.account.manager.seed';
import { logger } from '../src/shared/utils/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const addSupportAccountManagers = async () => {
  try {
    logger.info('Starting to add support account managers...');

    // Add the support account managers
    const accountManagers = await seedSupportAccountManagers([]);

    logger.info('Successfully added support account managers!');
    logger.info(
      'You can now use these credentials to test the support job posting API:'
    );
    logger.info('Password for all accounts: Password123!');

    return accountManagers;
  } catch (error) {
    logger.error('Error adding support account managers:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

// Run the script if called directly
if (require.main === module) {
  addSupportAccountManagers()
    .then(() => {
      logger.info('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Script failed:', error);
      process.exit(1);
    });
}

export { addSupportAccountManagers };
