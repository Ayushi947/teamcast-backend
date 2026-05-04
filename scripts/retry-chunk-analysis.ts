/**
 * Retry chunk analysis after fixing GCS URIs
 *
 * Usage:
 *   npx tsx scripts/retry-chunk-analysis.ts <assessmentId>
 */

import { PrismaClient } from '@prisma/client';
import { IntelligentChunkAnalysisService } from '../src/services/video/intelligent.chunk.analysis.service';
import { logger } from '../src/shared/utils/logger';

const prisma = new PrismaClient();

async function main() {
  const assessmentId = process.argv[2];

  if (!assessmentId) {
    logger.error(
      'Usage: npx tsx scripts/retry-chunk-analysis.ts <assessmentId>'
    );
    logger.error(
      'Example: npx tsx scripts/retry-chunk-analysis.ts 60432d15-0089-4294-aea3-a0cb7e5ba583'
    );
    process.exit(1);
  }

  logger.info(`\n🔄 Retrying chunk analysis for assessment: ${assessmentId}\n`);

  try {
    // Get all chunks for this assessment
    const chunks = await prisma.videoChunkAnalysis.findMany({
      where: {
        assessmentId,
      },
      orderBy: {
        chunkIndex: 'asc',
      },
    });

    if (chunks.length === 0) {
      logger.error(`❌ No chunks found for assessment: ${assessmentId}`);
      process.exit(1);
    }

    logger.info(`✅ Found ${chunks.length} chunks\n`);

    // Initialize analysis service
    const analysisService = new IntelligentChunkAnalysisService();

    // Process each chunk
    for (const chunk of chunks) {
      logger.info(`\n📊 Processing chunk ${chunk.chunkIndex}...`);
      logger.info(`   GCS URI: ${chunk.gcsUri}`);
      logger.info(`   Current status: ${chunk.status}`);

      // Validate GCS URI
      if (!chunk.gcsUri.startsWith('gs://')) {
        logger.error(`   ❌ Invalid GCS URI format!`);
        continue;
      }

      if (chunk.gcsUri.includes('storage.googleapis.com')) {
        logger.error(
          `   ❌ GCS URI still has hostname! Run fix-gcs-uris.sql first!`
        );
        continue;
      }

      // Reset status to uploaded before retrying
      await prisma.videoChunkAnalysis.update({
        where: { id: chunk.id },
        data: {
          status: 'analyzing',
        },
      });

      try {
        logger.info(`   🎬 Analyzing...`);
        const startTime = Date.now();

        await analysisService.analyzeChunk(
          chunk.gcsUri,
          chunk.chunkIndex,
          assessmentId
        );

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        logger.info(`   ✅ Analysis completed in ${duration}s`);

        // The analysis service already updates the database
        // Just verify it worked
        const updated = await prisma.videoChunkAnalysis.findUnique({
          where: { id: chunk.id },
        });

        if (updated?.status === 'completed') {
          logger.info(`   ✅ Database updated successfully`);
        } else {
          logger.info(`   ⚠️  Status: ${updated?.status}`);
        }
      } catch (error) {
        logger.error(`   ❌ Analysis failed:`);
        if (error instanceof Error) {
          logger.error(`      ${error.message}`);
        }

        // Mark as failed
        await prisma.videoChunkAnalysis.update({
          where: { id: chunk.id },
          data: {
            status: 'failed',
          },
        });
      }
    }

    logger.info(`\n========================================`);
    logger.info(`\n✅ Finished processing all chunks!`);

    // Show final summary
    const summary = await prisma.videoChunkAnalysis.groupBy({
      by: ['status'],
      where: { assessmentId },
      _count: true,
    });

    logger.info(`\n📊 Final Summary:`);
    for (const stat of summary) {
      logger.info(`   ${stat.status}: ${stat._count} chunks`);
    }
  } catch (error) {
    logger.error(`\n❌ Error:`, error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
