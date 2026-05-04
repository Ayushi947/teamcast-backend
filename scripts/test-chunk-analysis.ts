/**
 * Test script to manually trigger chunk analysis and see errors
 *
 * Usage:
 *   npx tsx scripts/test-chunk-analysis.ts <assessmentId> <chunkIndex>
 */

import { PrismaClient } from '@prisma/client';
import { IntelligentChunkAnalysisService } from '../src/services/video/intelligent.chunk.analysis.service';
import { logger } from '../src/shared/utils/logger';

const prisma = new PrismaClient();

async function main() {
  const assessmentId = process.argv[2];
  const chunkIndex = parseInt(process.argv[3]);

  if (!assessmentId || isNaN(chunkIndex)) {
    logger.error(
      'Usage: npx tsx scripts/test-chunk-analysis.ts <assessmentId> <chunkIndex>'
    );
    logger.error(
      'Example: npx tsx scripts/test-chunk-analysis.ts 60432d15-0089-4294-aea3-a0cb7e5ba583 0'
    );
    process.exit(1);
  }

  logger.info(`\n🔍 Testing chunk analysis for:`);
  logger.info(`   Assessment ID: ${assessmentId}`);
  logger.info(`   Chunk Index: ${chunkIndex}`);
  logger.info(`\n========================================\n`);

  try {
    // Get chunk from database
    const chunk = await prisma.videoChunkAnalysis.findFirst({
      where: {
        assessmentId,
        chunkIndex,
      },
    });

    if (!chunk) {
      logger.error(`❌ Chunk not found in database!`);
      logger.error(`   Assessment ID: ${assessmentId}`);
      logger.error(`   Chunk Index: ${chunkIndex}`);
      process.exit(1);
    }

    logger.info(`✅ Found chunk in database:`);
    logger.info(`   ID: ${chunk.id}`);
    logger.info(`   GCS URI: ${chunk.gcsUri}`);
    logger.info(`   Status: ${chunk.status}`);
    logger.info(`   Created: ${chunk.createdAt}`);
    logger.info(`\n========================================\n`);

    // Validate GCS URI format
    if (!chunk.gcsUri.startsWith('gs://')) {
      logger.error(`❌ Invalid GCS URI format!`);
      logger.error(`   Expected: gs://bucket-name/path/to/file`);
      logger.error(`   Got: ${chunk.gcsUri}`);
      process.exit(1);
    }

    logger.info(`✅ GCS URI format is valid\n`);

    // Initialize analysis service
    logger.info(`🔧 Initializing IntelligentChunkAnalysisService...`);
    const analysisService = new IntelligentChunkAnalysisService();
    logger.info(`✅ Service initialized\n`);

    // Run analysis
    logger.info(`🎬 Starting chunk analysis...`);
    logger.info(`   This may take 30-60 seconds...\n`);

    const startTime = Date.now();
    const analysis = await analysisService.analyzeChunk(
      chunk.gcsUri,
      chunkIndex,
      assessmentId
    );
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    logger.info(`\n✅ Analysis completed in ${duration}s!\n`);
    logger.info(`📊 Analysis results:`);
    logger.info(JSON.stringify(analysis, null, 2));
  } catch (error) {
    logger.error(`\n❌ Analysis failed with error:\n`);
    if (error instanceof Error) {
      logger.error(`   Message: ${error.message}`);
      logger.error(`   Stack: ${error.stack}`);
    } else {
      logger.error(error);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
