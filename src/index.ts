import app from '@/app';
import { ENV } from '@/config/env';
import { logger } from '@/shared/utils/logger';
import prisma from '@/config/database';
import { StartupDiagnosticsService } from '@/utils/startup.diagnostics';
import { WorkerInitializer } from '@/services/queue/worker.initializer';
import { VoiceWebSocketService } from '@/services/websocket/voice.websocket.service';

// Store worker initializer reference for graceful shutdown
let workerInitializer: WorkerInitializer | null = null;

// Run startup diagnostics and initialize workers
const runStartupTasks = async () => {
  try {
    logger.info('🚀 Starting Teamcast Backend Server');

    // Log environment status
    StartupDiagnosticsService.logEnvironmentStatus();

    // Run comprehensive diagnostics
    await StartupDiagnosticsService.runDiagnostics();

    // Initialize BullMQ workers for background job processing
    logger.info('Initializing BullMQ workers...');
    workerInitializer = new WorkerInitializer();
    await workerInitializer.initializeWorkers();

    logger.info('✅ Teamcast Backend startup completed successfully');
  } catch (error) {
    logger.error('Failed to complete startup tasks', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    // Don't exit - let server continue even if worker initialization fails
  }
};

const server = app.listen(ENV.PORT, async () => {
  logger.info(`Server running on port ${ENV.PORT} in ${ENV.NODE_ENV} mode`);

  // Run startup tasks after server starts
  await runStartupTasks();
});

// Initialize Voice WebSocket Service (singleton with protection against double init)
const voiceWebSocketService = VoiceWebSocketService.getInstance();
voiceWebSocketService.initialize(server);

// Memory management: Periodic garbage collection
const gcInterval = setInterval(
  () => {
    if (typeof global.gc === 'function') {
      global.gc();
      logger.debug('Manual garbage collection triggered');
    }
  },
  5 * 60 * 1000
); // Every 5 minutes

// Memory monitoring
const monitorMemory = () => {
  const usage = process.memoryUsage();
  const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
  const externalMB = Math.round(usage.external / 1024 / 1024);

  logger.info('Memory usage', {
    heapUsed: `${heapUsedMB}MB`,
    heapTotal: `${heapTotalMB}MB`,
    external: `${externalMB}MB`,
    rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
  });

  // Trigger GC if heap usage is high
  if (heapUsedMB > 200 && typeof global.gc === 'function') {
    global.gc();
    logger.info('Triggered GC due to high memory usage');
  }
};

const memoryInterval = setInterval(monitorMemory, 2 * 60 * 1000); // Every 2 minutes

// Graceful shutdown handler
const shutdown = async () => {
  logger.info('Shutdown signal received');

  // Clear intervals
  clearInterval(gcInterval);
  clearInterval(memoryInterval);

  // Shutdown BullMQ workers
  if (workerInitializer) {
    try {
      await workerInitializer.shutdown();
      logger.info('BullMQ workers shut down');
    } catch (error) {
      logger.error('Error shutting down workers', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Close Voice WebSocket connections
  voiceWebSocketService.close();

  // Add connection draining
  app.disable('connection'); // Stop accepting new connections

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      await prisma.$disconnect();
      logger.info('Database connections closed');

      // Final cleanup
      if (typeof global.gc === 'function') {
        global.gc();
      }

      process.exit(0);
    } catch (err) {
      logger.error('Error during shutdown:', err);
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error(
      'Could not close connections in time, forcefully shutting down'
    );
    process.exit(1);
  }, 30000);
};

// Handle different shutdown signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { promise, reason });
  shutdown();
});

export default server;
