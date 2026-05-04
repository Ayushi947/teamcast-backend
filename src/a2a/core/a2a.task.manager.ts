/**
 * A2A Task Manager
 * Manages task lifecycle for A2A protocol
 */

import { randomUUID } from 'crypto';
import { logger } from '@/shared/utils/logger';
import {
  A2ATask,
  A2ATaskState,
  A2AMessage,
  A2AMessageRole,
  A2AArtifact,
  A2APart,
  A2APartType,
  A2ATextPart,
  A2ADataPart,
  A2APushNotification,
} from './a2a.types';

/**
 * Task storage interface
 * Can be implemented with Redis for production
 */
interface TaskStore {
  get(taskId: string): Promise<A2ATask | null>;
  set(taskId: string, task: A2ATask): Promise<void>;
  delete(taskId: string): Promise<boolean>;
  list(filter: TaskListFilter): Promise<{ tasks: A2ATask[]; total: number }>;
}

/**
 * Task list filter
 */
interface TaskListFilter {
  clientId?: string;
  contextId?: string;
  state?: A2ATaskState[];
  limit?: number;
  offset?: number;
}

/**
 * Push notification handler
 */
type PushNotificationHandler = (
  clientId: string,
  notification: A2APushNotification
) => Promise<void>;

/**
 * In-memory task store (for development)
 * Production should use Redis or database
 */
class InMemoryTaskStore implements TaskStore {
  private tasks: Map<string, A2ATask> = new Map();
  private tasksByClient: Map<string, Set<string>> = new Map();

  async get(taskId: string): Promise<A2ATask | null> {
    return this.tasks.get(taskId) || null;
  }

  async set(taskId: string, task: A2ATask): Promise<void> {
    this.tasks.set(taskId, task);

    // Index by client if metadata contains clientId
    const clientId = task.metadata?.clientId as string;
    if (clientId) {
      if (!this.tasksByClient.has(clientId)) {
        this.tasksByClient.set(clientId, new Set());
      }
      this.tasksByClient.get(clientId)!.add(taskId);
    }
  }

  async delete(taskId: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (task) {
      const clientId = task.metadata?.clientId as string;
      if (clientId) {
        this.tasksByClient.get(clientId)?.delete(taskId);
      }
    }
    return this.tasks.delete(taskId);
  }

  async list(
    filter: TaskListFilter
  ): Promise<{ tasks: A2ATask[]; total: number }> {
    let tasks: A2ATask[] = [];

    if (filter.clientId) {
      const clientTaskIds =
        this.tasksByClient.get(filter.clientId) || new Set();
      tasks = Array.from(clientTaskIds)
        .map((id) => this.tasks.get(id)!)
        .filter(Boolean);
    } else {
      tasks = Array.from(this.tasks.values());
    }

    // Apply filters
    if (filter.contextId) {
      tasks = tasks.filter((t) => t.contextId === filter.contextId);
    }

    if (filter.state && filter.state.length > 0) {
      tasks = tasks.filter((t) => filter.state!.includes(t.state));
    }

    // Sort by updatedAt descending
    tasks.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    const total = tasks.length;
    const offset = filter.offset || 0;
    const limit = filter.limit || 20;

    tasks = tasks.slice(offset, offset + limit);

    return { tasks, total };
  }
}

/**
 * A2A Task Manager
 * Singleton for managing A2A tasks
 */
export class A2ATaskManager {
  private static instance: A2ATaskManager;
  private store: TaskStore;
  private pushHandler: PushNotificationHandler | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.store = new InMemoryTaskStore();

    // Cleanup old tasks every hour
    this.cleanupInterval = setInterval(
      () => this.cleanupOldTasks(),
      60 * 60 * 1000
    );
  }

  static getInstance(): A2ATaskManager {
    if (!A2ATaskManager.instance) {
      A2ATaskManager.instance = new A2ATaskManager();
    }
    return A2ATaskManager.instance;
  }

  /**
   * Set push notification handler
   */
  setPushHandler(handler: PushNotificationHandler): void {
    this.pushHandler = handler;
  }

  /**
   * Create a new task
   */
  async createTask(params: {
    contextId?: string;
    clientId: string;
    initialMessage?: A2AMessage;
    metadata?: Record<string, unknown>;
  }): Promise<A2ATask> {
    const now = new Date().toISOString();
    const taskId = `task_${randomUUID()}`;

    const task: A2ATask = {
      taskId,
      contextId: params.contextId,
      state: A2ATaskState.WORKING,
      messages: params.initialMessage ? [params.initialMessage] : [],
      artifacts: [],
      createdAt: now,
      updatedAt: now,
      metadata: {
        ...params.metadata,
        clientId: params.clientId,
      },
    };

    await this.store.set(taskId, task);

    logger.info('A2A task created', {
      context: 'A2ATaskManager.createTask',
      taskId,
      clientId: params.clientId,
    });

    return task;
  }

  /**
   * Get task by ID
   */
  async getTask(taskId: string): Promise<A2ATask | null> {
    return this.store.get(taskId);
  }

  /**
   * List tasks with filtering
   */
  async listTasks(
    filter: TaskListFilter
  ): Promise<{ tasks: A2ATask[]; total: number }> {
    return this.store.list(filter);
  }

  /**
   * Add message to task
   */
  async addMessage(
    taskId: string,
    message: A2AMessage
  ): Promise<A2ATask | null> {
    const task = await this.store.get(taskId);
    if (!task) {
      return null;
    }

    task.messages.push(message);
    task.updatedAt = new Date().toISOString();

    await this.store.set(taskId, task);

    return task;
  }

  /**
   * Add artifact to task
   */
  async addArtifact(
    taskId: string,
    artifact: A2AArtifact
  ): Promise<A2ATask | null> {
    const task = await this.store.get(taskId);
    if (!task) {
      return null;
    }

    if (!task.artifacts) {
      task.artifacts = [];
    }
    task.artifacts.push(artifact);
    task.updatedAt = new Date().toISOString();

    await this.store.set(taskId, task);

    return task;
  }

  /**
   * Update task state
   */
  async updateState(
    taskId: string,
    state: A2ATaskState,
    message?: A2AMessage,
    artifacts?: A2AArtifact[]
  ): Promise<A2ATask | null> {
    const task = await this.store.get(taskId);
    if (!task) {
      return null;
    }

    task.state = state;
    task.updatedAt = new Date().toISOString();

    if (message) {
      task.messages.push(message);
    }

    if (artifacts && artifacts.length > 0) {
      if (!task.artifacts) {
        task.artifacts = [];
      }
      task.artifacts.push(...artifacts);
    }

    await this.store.set(taskId, task);

    // Send push notification if handler is set
    if (this.pushHandler) {
      const clientId = task.metadata?.clientId as string;
      if (clientId) {
        await this.sendPushNotification(clientId, task, message, artifacts);
      }
    }

    logger.info('A2A task state updated', {
      context: 'A2ATaskManager.updateState',
      taskId,
      state,
    });

    return task;
  }

  /**
   * Complete task with final response
   */
  async completeTask(
    taskId: string,
    response: {
      message?: A2AMessage;
      artifacts?: A2AArtifact[];
    }
  ): Promise<A2ATask | null> {
    return this.updateState(
      taskId,
      A2ATaskState.COMPLETED,
      response.message,
      response.artifacts
    );
  }

  /**
   * Fail task with error
   */
  async failTask(
    taskId: string,
    error: { code: string; message: string }
  ): Promise<A2ATask | null> {
    const errorMessage: A2AMessage = {
      messageId: `msg_${randomUUID()}`,
      role: A2AMessageRole.AGENT,
      parts: [
        {
          type: A2APartType.TEXT,
          text: error.message,
        } as A2ATextPart,
        {
          type: A2APartType.DATA,
          data: { errorCode: error.code },
        } as A2ADataPart,
      ],
      timestamp: new Date().toISOString(),
    };

    return this.updateState(taskId, A2ATaskState.FAILED, errorMessage);
  }

  /**
   * Cancel task
   */
  async cancelTask(taskId: string, reason?: string): Promise<A2ATask | null> {
    const task = await this.store.get(taskId);
    if (!task) {
      return null;
    }

    // Can only cancel tasks that are working or input-required
    if (
      task.state !== A2ATaskState.WORKING &&
      task.state !== A2ATaskState.INPUT_REQUIRED
    ) {
      return null;
    }

    const cancelMessage: A2AMessage = {
      messageId: `msg_${randomUUID()}`,
      role: A2AMessageRole.AGENT,
      parts: [
        {
          type: A2APartType.TEXT,
          text: reason || 'Task cancelled by client',
        } as A2ATextPart,
      ],
      timestamp: new Date().toISOString(),
    };

    return this.updateState(taskId, A2ATaskState.CANCELLED, cancelMessage);
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(
    clientId: string,
    task: A2ATask,
    message?: A2AMessage,
    artifacts?: A2AArtifact[]
  ): Promise<void> {
    if (!this.pushHandler) {
      return;
    }

    try {
      const notification: A2APushNotification = {
        taskId: task.taskId,
        state: task.state,
        message,
        artifacts,
        timestamp: new Date().toISOString(),
      };

      await this.pushHandler(clientId, notification);
    } catch (error) {
      logger.error('Failed to send A2A push notification', {
        context: 'A2ATaskManager.sendPushNotification',
        taskId: task.taskId,
        clientId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Cleanup old completed/failed tasks
   */
  private async cleanupOldTasks(): Promise<void> {
    // Tasks older than 24 hours in terminal states can be cleaned up
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const now = Date.now();

    const { tasks } = await this.store.list({});

    for (const task of tasks) {
      const age = now - new Date(task.updatedAt).getTime();
      if (
        age > maxAge &&
        [
          A2ATaskState.COMPLETED,
          A2ATaskState.FAILED,
          A2ATaskState.CANCELLED,
          A2ATaskState.REJECTED,
        ].includes(task.state)
      ) {
        await this.store.delete(task.taskId);
        logger.debug('Cleaned up old A2A task', {
          context: 'A2ATaskManager.cleanupOldTasks',
          taskId: task.taskId,
        });
      }
    }
  }

  /**
   * Shutdown manager
   */
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  /**
   * Helper: Create text message
   */
  static createTextMessage(
    role: A2AMessageRole,
    text: string,
    metadata?: Record<string, unknown>
  ): A2AMessage {
    return {
      messageId: `msg_${randomUUID()}`,
      role,
      parts: [
        {
          type: A2APartType.TEXT,
          text,
        } as A2ATextPart,
      ],
      timestamp: new Date().toISOString(),
      metadata,
    };
  }

  /**
   * Helper: Create data message
   */
  static createDataMessage(
    role: A2AMessageRole,
    data: Record<string, unknown>,
    text?: string,
    metadata?: Record<string, unknown>
  ): A2AMessage {
    const parts: A2APart[] = [];

    if (text) {
      parts.push({
        type: A2APartType.TEXT,
        text,
      } as A2ATextPart);
    }

    parts.push({
      type: A2APartType.DATA,
      data,
    } as A2ADataPart);

    return {
      messageId: `msg_${randomUUID()}`,
      role,
      parts,
      timestamp: new Date().toISOString(),
      metadata,
    };
  }

  /**
   * Helper: Create artifact
   */
  static createArtifact(
    name: string,
    data: Record<string, unknown>,
    text?: string
  ): A2AArtifact {
    const parts: A2APart[] = [];

    if (text) {
      parts.push({
        type: A2APartType.TEXT,
        text,
      } as A2ATextPart);
    }

    parts.push({
      type: A2APartType.DATA,
      data,
    } as A2ADataPart);

    return {
      artifactId: `artifact_${randomUUID()}`,
      name,
      parts,
    };
  }
}
