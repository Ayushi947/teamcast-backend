// scripts/excel-upload-integration.ts
// This script seeds the Excel upload integration provider into the database.
import { PrismaClient } from '@prisma/client';
import { logger } from '../src/shared/utils/logger';

const prisma = new PrismaClient();

const providers = [
  {
    name: 'Excel Upload',
    type: 'ATS' as const,
    description: 'Excel file upload for candidate import',
    logoUrl:
      'https://upload.wikimedia.org/wikipedia/commons/3/34/Microsoft_Office_Excel_%282019%E2%80%93present%29.svg',
    websiteUrl: 'https://excel.cloud.microsoft/en-gb/',
    apiEndpoint: null,
    apiVersion: null,
    authType: 'file_upload',
    authConfig: {
      supportedFormats: ['xlsx', 'xls', 'csv'],
      maxFileSize: '10MB',
      requiresTemplate: true,
    },
    supportsJobImport: false,
    supportsJobPublish: false,
    supportsCandidateImport: true,
    supportsCandidatePush: false,
    supportsPipelineUpdate: false,
    rateLimitPerMinute: 10,
    rateLimitPerHour: 100,
    isActive: true,
    isVerified: true,
    metadata: {
      categories: ['file-upload', 'candidate-import', 'ats'],
      regions: ['global'],
      languages: ['en'],
    },
  },
];

async function seedExcelIntegrationProvider() {
  logger.info('🌐 Seeding excel integration provider...');

  await prisma.integration_provider.upsert({
    where: { name: 'Excel Upload' },
    update: providers[0],
    create: providers[0],
  });

  logger.info('✅ Seeded excel integration provider');
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedExcelIntegrationProvider()
    .catch((error) => {
      logger.error('❌ Error seeding excel integration provider:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
