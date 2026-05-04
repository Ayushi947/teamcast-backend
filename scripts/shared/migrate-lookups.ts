import { PrismaClient, lookup_status } from '@prisma/client';
import { promises as fs } from 'fs';
import { join } from 'path';
import { logger } from '../../src/shared/utils/logger';

interface LookupData {
  [key: string]: string[];
}

export async function migrateLookups(prisma: PrismaClient) {
  try {
    const jsonPath = join(__dirname, '..', 'prisma_lookups.json');
    const lookupData: LookupData = JSON.parse(
      await fs.readFile(jsonPath, 'utf-8')
    );

    logger.info(
      `Found ${Object.keys(lookupData).length} lookup categories to migrate`
    );

    // Migrate each lookup category and its values
    for (const [categoryName, values] of Object.entries(lookupData)) {
      try {
        // Create or update the lookup category
        const category = await prisma.lookup_category.upsert({
          where: { name: categoryName },
          update: {}, // No updates needed if it exists
          create: {
            name: categoryName,
            label: categoryName
              .split('_')
              .map(
                (word) =>
                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
              )
              .join(' '),
            status: lookup_status.ACTIVE,
          },
        });

        logger.info(
          `Processing category: ${categoryName} (${values.length} values)`
        );

        // Create or update lookup values
        for (const value of values) {
          await prisma.lookup_value.upsert({
            where: {
              label_lookupCategoryId: {
                label: value,
                lookupCategoryId: category.id,
              },
            },
            update: {}, // No updates needed if it exists
            create: {
              label: value,
              lookupCategoryId: category.id,
              status: lookup_status.ACTIVE,
            },
          });
        }

        logger.info(
          `✓ Successfully processed ${values.length} values for ${categoryName}`
        );
      } catch (error) {
        logger.error(`Error processing category ${categoryName}:`, error);
      }
    }

    logger.info('Lookup migration completed successfully!');
  } catch (error) {
    logger.error('Failed to migrate lookups:', error);
    throw error;
  }
}
