import { seedPracticeAssessmentSettings } from './local.seed/practice.assessment.settings.seed';
import { logger } from '../src/shared/utils/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const seed = async () => {
  try {
    logger.info('Starting practice assessment settings seed...');

    await seedPracticeAssessmentSettings();

    logger.info('Practice assessment settings seed completed successfully');
  } catch (error) {
    logger.error('Error seeding practice assessment settings:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

seed();
