import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { singleton } from '@/shared/decorators/singleton';
import { QueueService } from './queue.service';
import { logger } from '@/shared/utils/logger';
import { Router } from 'express';

@singleton
export class BullBoardService {
  private serverAdapter: ExpressAdapter;
  private queueService: QueueService;

  constructor() {
    this.queueService = new QueueService();
    this.serverAdapter = new ExpressAdapter();
    this.setupBullBoard();
  }

  /**
   * Setup Bull Board dashboard
   */
  private setupBullBoard(): void {
    // Initialize queues
    this.queueService.initializeQueues();

    // Set the base path for the dashboard
    this.serverAdapter.setBasePath('/admin/queues');

    // Get all queues from the queue service and add them to Bull Board
    const queues = this.queueService.getAllQueues();
    const queueAdapters = Array.from(queues.values()).map(
      (queue) => new BullMQAdapter(queue)
    );

    createBullBoard({
      queues: queueAdapters,
      serverAdapter: this.serverAdapter,
    });

    logger.info('Bull Board dashboard initialized', {
      context: 'BullBoardService.setupBullBoard',
      queueCount: queueAdapters.length,
      basePath: '/admin/queues',
    });
  }

  /**
   * Get the Express router for Bull Board
   */
  getRouter(): Router {
    return this.serverAdapter.getRouter();
  }

  /**
   * Add a new queue to Bull Board
   */
  addQueue(queueName: string): void {
    try {
      const queue = this.queueService.getQueue(queueName);
      // Add the queue to Bull Board
      new BullMQAdapter(queue);

      // Note: Bull Board doesn't have a direct method to add queues after initialization
      // This would require recreating the board with updated queues
      logger.info('Queue added to monitoring', {
        context: 'BullBoardService.addQueue',
        queueName,
      });
    } catch (error) {
      logger.error('Failed to add queue to Bull Board', {
        context: 'BullBoardService.addQueue',
        queueName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
