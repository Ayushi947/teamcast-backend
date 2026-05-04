/**
 * A2A Server
 * JSON-RPC 2.0 server for Agent-to-Agent protocol
 */

import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { logger } from '@/shared/utils/logger';
import {
  A2AJsonRpcRequest,
  A2AJsonRpcResponse,
  A2A_ERROR_CODES,
  A2AContext,
  A2AMessage,
  A2AMessageRole,
  A2ATask,
  A2ATaskState,
  A2AMessageSendParams,
  A2ATasksGetParams,
  A2ATasksListParams,
  A2ATasksCancelParams,
  A2APartType,
  A2ATextPart,
  A2ADataPart,
  A2APart,
} from './a2a.types';
import { A2ATaskManager } from './a2a.task.manager';
import { A2ASkillRegistry } from '../skills/skill.registry';
import { generateAgentCard } from '../config/a2a.config';

/**
 * A2A Server
 * Handles A2A JSON-RPC requests
 */
export class A2AServer {
  private static instance: A2AServer;
  private taskManager: A2ATaskManager;
  private skillRegistry: A2ASkillRegistry;

  private constructor() {
    this.taskManager = A2ATaskManager.getInstance();
    this.skillRegistry = A2ASkillRegistry.getInstance();
  }

  static getInstance(): A2AServer {
    if (!A2AServer.instance) {
      A2AServer.instance = new A2AServer();
    }
    return A2AServer.instance;
  }

  /**
   * Handle incoming JSON-RPC request
   */
  async handleRequest(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const rpcRequest = req.body as A2AJsonRpcRequest;

      // Validate JSON-RPC request
      if (!this.isValidJsonRpcRequest(rpcRequest)) {
        this.sendError(
          res,
          null,
          A2A_ERROR_CODES.INVALID_REQUEST,
          'Invalid JSON-RPC request'
        );
        return;
      }

      // Build context from request
      const context: A2AContext = {
        requestId: (req as any).requestId || `a2a-${randomUUID()}`,
        clientId: (req as any).a2aClientId || 'unknown',
        tenantId: (req as any).a2aTenantId || '',
        metadata: {},
      };

      logger.info('A2A request received', {
        context: 'A2AServer.handleRequest',
        method: rpcRequest.method,
        requestId: context.requestId,
        clientId: context.clientId,
      });

      // Route to method handler
      const result = await this.routeMethod(rpcRequest, context);

      // Send success response
      this.sendResult(res, rpcRequest.id || null, result);

      logger.info('A2A request completed', {
        context: 'A2AServer.handleRequest',
        method: rpcRequest.method,
        requestId: context.requestId,
        duration: Date.now() - startTime,
      });
    } catch (error) {
      logger.error('A2A request failed', {
        context: 'A2AServer.handleRequest',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (error instanceof A2AError) {
        this.sendError(res, null, error.code, error.message, error.data);
      } else {
        this.sendError(
          res,
          null,
          A2A_ERROR_CODES.INTERNAL_ERROR,
          error instanceof Error ? error.message : 'Internal server error'
        );
      }
    }
  }

  /**
   * Route to method handler
   */
  private async routeMethod(
    request: A2AJsonRpcRequest,
    context: A2AContext
  ): Promise<unknown> {
    const { method, params } = request;

    switch (method) {
      case 'message/send':
        return this.handleMessageSend(
          params as unknown as A2AMessageSendParams,
          context
        );

      case 'tasks/get':
        return this.handleTasksGet(
          params as unknown as A2ATasksGetParams,
          context
        );

      case 'tasks/list':
        return this.handleTasksList(
          params as unknown as A2ATasksListParams,
          context
        );

      case 'tasks/cancel':
        return this.handleTasksCancel(
          params as unknown as A2ATasksCancelParams,
          context
        );

      case 'agent/info':
        return this.handleAgentInfo();

      default:
        throw new A2AError(
          A2A_ERROR_CODES.METHOD_NOT_FOUND,
          `Method not found: ${method}`
        );
    }
  }

  /**
   * Handle message/send
   * Main entry point for skill execution
   */
  private async handleMessageSend(
    params: A2AMessageSendParams,
    context: A2AContext
  ): Promise<{ task: A2ATask }> {
    // Validate params
    if (
      !params.message ||
      !params.message.parts ||
      params.message.parts.length === 0
    ) {
      throw new A2AError(
        A2A_ERROR_CODES.INVALID_PARAMS,
        'Message with parts is required'
      );
    }

    // Extract skill and parameters from message
    const { skillId, skillParams } = this.parseMessageForSkill(params.message);

    if (!skillId) {
      throw new A2AError(
        A2A_ERROR_CODES.INVALID_PARAMS,
        'Could not determine skill from message. Please specify a skill ID in the data part or use natural language matching a skill.'
      );
    }

    // Create initial user message
    const userMessage: A2AMessage = {
      messageId: `msg_${randomUUID()}`,
      role: A2AMessageRole.USER,
      parts: params.message.parts,
      timestamp: new Date().toISOString(),
      metadata: params.message.metadata,
    };

    // Create task
    const task = await this.taskManager.createTask({
      contextId: params.contextId,
      clientId: context.clientId,
      initialMessage: userMessage,
      metadata: {
        skillId,
        tenantId: context.tenantId,
      },
    });

    // Execute skill asynchronously for long-running tasks
    // For now, execute synchronously
    try {
      const result = await this.skillRegistry.executeSkill(
        skillId,
        skillParams,
        context
      );

      // Create response message
      const responseMessage = A2ATaskManager.createDataMessage(
        A2AMessageRole.AGENT,
        result.data || {},
        result.text
      );

      // Update task with result
      if (result.state === A2ATaskState.COMPLETED) {
        await this.taskManager.completeTask(task.taskId, {
          message: responseMessage,
          artifacts: result.artifacts,
        });
      } else if (result.state === A2ATaskState.FAILED) {
        await this.taskManager.failTask(task.taskId, {
          code: 'SKILL_EXECUTION_ERROR',
          message: result.text || 'Skill execution failed',
        });
      } else {
        await this.taskManager.updateState(
          task.taskId,
          result.state,
          responseMessage,
          result.artifacts
        );
      }

      // Get updated task
      const updatedTask = await this.taskManager.getTask(task.taskId);
      return { task: updatedTask! };
    } catch (error) {
      // Mark task as failed
      await this.taskManager.failTask(task.taskId, {
        code: 'SKILL_EXECUTION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      });

      const failedTask = await this.taskManager.getTask(task.taskId);
      return { task: failedTask! };
    }
  }

  /**
   * Handle tasks/get
   */
  private async handleTasksGet(
    params: A2ATasksGetParams,
    context: A2AContext
  ): Promise<{ task: A2ATask | null }> {
    if (!params.taskId) {
      throw new A2AError(A2A_ERROR_CODES.INVALID_PARAMS, 'taskId is required');
    }

    const task = await this.taskManager.getTask(params.taskId);

    if (!task) {
      throw new A2AError(
        A2A_ERROR_CODES.TASK_NOT_FOUND,
        `Task not found: ${params.taskId}`
      );
    }

    // Verify client owns this task
    if (task.metadata?.clientId !== context.clientId) {
      throw new A2AError(
        A2A_ERROR_CODES.FORBIDDEN,
        'Not authorized to access this task'
      );
    }

    return { task };
  }

  /**
   * Handle tasks/list
   */
  private async handleTasksList(
    params: A2ATasksListParams,
    context: A2AContext
  ): Promise<{ tasks: A2ATask[]; total: number }> {
    const result = await this.taskManager.listTasks({
      clientId: context.clientId,
      contextId: params.contextId,
      state: params.state,
      limit: params.limit || 20,
      offset: params.offset || 0,
    });

    return result;
  }

  /**
   * Handle tasks/cancel
   */
  private async handleTasksCancel(
    params: A2ATasksCancelParams,
    context: A2AContext
  ): Promise<{ task: A2ATask | null }> {
    if (!params.taskId) {
      throw new A2AError(A2A_ERROR_CODES.INVALID_PARAMS, 'taskId is required');
    }

    // Verify task exists and belongs to client
    const existingTask = await this.taskManager.getTask(params.taskId);
    if (!existingTask) {
      throw new A2AError(
        A2A_ERROR_CODES.TASK_NOT_FOUND,
        `Task not found: ${params.taskId}`
      );
    }

    if (existingTask.metadata?.clientId !== context.clientId) {
      throw new A2AError(
        A2A_ERROR_CODES.FORBIDDEN,
        'Not authorized to cancel this task'
      );
    }

    const task = await this.taskManager.cancelTask(
      params.taskId,
      params.reason
    );

    if (!task) {
      throw new A2AError(
        A2A_ERROR_CODES.UNSUPPORTED_OPERATION,
        'Task cannot be cancelled in its current state'
      );
    }

    return { task };
  }

  /**
   * Handle agent/info
   */
  private async handleAgentInfo(): Promise<Record<string, unknown>> {
    const agentCard = generateAgentCard();
    return {
      agentId: agentCard.agentId,
      name: agentCard.name,
      description: agentCard.description,
      protocolVersions: agentCard.protocolVersions,
      capabilities: agentCard.capabilities,
      skills: agentCard.skills.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
      })),
    };
  }

  /**
   * Parse message to extract skill and parameters
   */
  private parseMessageForSkill(message: {
    role: A2AMessageRole;
    parts: A2APart[];
    metadata?: Record<string, unknown>;
  }): { skillId: string | null; skillParams: Record<string, unknown> } {
    let skillId: string | null = null;
    let skillParams: Record<string, unknown> = {};

    // Check for explicit skill ID in data parts
    for (const part of message.parts) {
      if (part.type === A2APartType.DATA) {
        const dataPart = part as A2ADataPart;
        if (dataPart.data.skillId) {
          skillId = dataPart.data.skillId as string;
          skillParams = { ...dataPart.data };
          delete skillParams.skillId;
        } else if (dataPart.data.skill) {
          skillId = dataPart.data.skill as string;
          skillParams = { ...dataPart.data };
          delete skillParams.skill;
        } else {
          // Assume all data is skill params
          skillParams = { ...skillParams, ...dataPart.data };
        }
      }
    }

    // If no explicit skill ID, try to match from text
    if (!skillId) {
      for (const part of message.parts) {
        if (part.type === A2APartType.TEXT) {
          const textPart = part as A2ATextPart;
          const matchedSkill = this.matchSkillFromText(textPart.text);
          if (matchedSkill) {
            skillId = matchedSkill;
            break;
          }
        }
      }
    }

    // Check metadata for skill ID
    if (!skillId && message.metadata?.skillId) {
      skillId = message.metadata.skillId as string;
    }

    return { skillId, skillParams };
  }

  /**
   * Match skill from natural language text
   */
  private matchSkillFromText(text: string): string | null {
    const lowerText = text.toLowerCase();

    // Simple keyword matching
    if (
      lowerText.includes('request interview') ||
      lowerText.includes('schedule interview') ||
      lowerText.includes('assess candidate') ||
      lowerText.includes('interview request')
    ) {
      return 'interview.request';
    }

    if (
      lowerText.includes('interview status') ||
      lowerText.includes('check status') ||
      lowerText.includes('status of interview')
    ) {
      return 'interview.status';
    }

    if (
      lowerText.includes('interview results') ||
      lowerText.includes('get results') ||
      lowerText.includes('assessment results')
    ) {
      return 'interview.results';
    }

    if (
      lowerText.includes('list interviews') ||
      lowerText.includes('show interviews')
    ) {
      return 'interview.list';
    }

    if (lowerText.includes('cancel interview')) {
      return 'interview.cancel';
    }

    return null;
  }

  /**
   * Validate JSON-RPC request
   */
  private isValidJsonRpcRequest(
    request: unknown
  ): request is A2AJsonRpcRequest {
    if (!request || typeof request !== 'object') {
      return false;
    }

    const req = request as Record<string, unknown>;

    if (req.jsonrpc !== '2.0') {
      return false;
    }

    if (typeof req.method !== 'string') {
      return false;
    }

    return true;
  }

  /**
   * Send JSON-RPC success response
   */
  private sendResult(
    res: Response,
    id: string | number | null,
    result: unknown
  ): void {
    const response: A2AJsonRpcResponse = {
      jsonrpc: '2.0',
      result,
      id,
    };
    res.json(response);
  }

  /**
   * Send JSON-RPC error response
   */
  private sendError(
    res: Response,
    id: string | number | null,
    code: number,
    message: string,
    data?: unknown
  ): void {
    const response: A2AJsonRpcResponse = {
      jsonrpc: '2.0',
      error: { code, message, data },
      id,
    };
    res.json(response);
  }
}

/**
 * A2A Error class
 */
export class A2AError extends Error {
  code: number;
  data?: unknown;

  constructor(code: number, message: string, data?: unknown) {
    super(message);
    this.name = 'A2AError';
    this.code = code;
    this.data = data;
  }
}
