import { Request, Response } from 'express';
import { logger } from '@/shared/utils/logger';
import { mcpConfig, getMcpServerInfo } from '../config/mcp.config';
import { McpToolRegistry } from './tool.registry';
import { z } from 'zod';

/**
 * JSON-RPC 2.0 Request Schema
 */
const JsonRpcRequestSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number()]).optional(),
  method: z.string(),
  params: z.record(z.unknown()).optional(),
});

type JsonRpcRequest = z.infer<typeof JsonRpcRequestSchema>;

/**
 * JSON-RPC 2.0 Response
 */
interface JsonRpcResponse {
  jsonrpc: '2.0';
  id?: string | number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

/**
 * MCP Error Codes (based on JSON-RPC 2.0 + MCP extensions)
 */
export const MCP_ERROR_CODES = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  // MCP-specific error codes
  UNAUTHORIZED: -32001,
  RATE_LIMITED: -32002,
  TOOL_EXECUTION_ERROR: -32003,
  RESOURCE_NOT_FOUND: -32004,
} as const;

/**
 * MCP Context passed to tool handlers
 */
export interface McpContext {
  requestId: string;
  mcpClientId: string; // mcp_client.id
  tenantClientId: string; // mcp_client.clientId
  scopes: string[];
  metadata: Record<string, unknown>;
}

/**
 * MCP Server - Handles JSON-RPC 2.0 protocol for MCP
 */
export class McpServer {
  private static instance: McpServer;
  private toolRegistry: McpToolRegistry;

  private constructor() {
    this.toolRegistry = McpToolRegistry.getInstance();
  }

  static getInstance(): McpServer {
    if (!McpServer.instance) {
      McpServer.instance = new McpServer();
    }
    return McpServer.instance;
  }

  /**
   * Handle MCP discovery request
   */
  handleDiscovery(_req: Request, res: Response): void {
    res.json(getMcpServerInfo());
  }

  /**
   * Handle MCP JSON-RPC request
   */
  async handleRequest(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      // Parse and validate JSON-RPC request
      const parseResult = JsonRpcRequestSchema.safeParse(req.body);

      if (!parseResult.success) {
        this.sendError(
          res,
          null,
          MCP_ERROR_CODES.INVALID_REQUEST,
          'Invalid JSON-RPC request',
          parseResult.error.errors
        );
        return;
      }

      const rpcRequest = parseResult.data;

      logger.info('MCP request received', {
        context: 'McpServer.handleRequest',
        method: rpcRequest.method,
        id: rpcRequest.id,
      });

      // Build MCP context from request
      const mcpContext: McpContext = {
        requestId: (req as any).requestId || `mcp-${Date.now()}`,
        mcpClientId: (req as any).mcpClientId || 'unknown',
        tenantClientId: (req as any).mcpTenantId || '',
        scopes: (req as any).mcpScopes || [],
        metadata: {},
      };

      // Route to appropriate handler based on method
      const response = await this.routeMethod(rpcRequest, mcpContext);

      const duration = Date.now() - startTime;
      logger.info('MCP request completed', {
        context: 'McpServer.handleRequest',
        method: rpcRequest.method,
        id: rpcRequest.id,
        duration,
      });

      res.json(response);
    } catch (error) {
      logger.error('MCP request failed', {
        context: 'McpServer.handleRequest',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      this.sendError(
        res,
        null,
        MCP_ERROR_CODES.INTERNAL_ERROR,
        error instanceof Error ? error.message : 'Internal server error'
      );
    }
  }

  /**
   * Route JSON-RPC method to appropriate handler
   */
  private async routeMethod(
    request: JsonRpcRequest,
    context: McpContext
  ): Promise<JsonRpcResponse> {
    const { method, params, id } = request;

    switch (method) {
      // MCP Lifecycle methods
      case 'initialize':
        return this.handleInitialize(id, params);

      case 'initialized':
      case 'notifications/initialized':
        return this.handleInitialized(id);

      case 'shutdown':
        return this.handleShutdown(id);

      // Tool methods
      case 'tools/list':
        return this.handleToolsList(id);

      case 'tools/call':
        return await this.handleToolsCall(id, params, context);

      // Capabilities
      case 'capabilities/list':
        return this.handleCapabilitiesList(id);

      default:
        return {
          jsonrpc: '2.0',
          id,
          error: {
            code: MCP_ERROR_CODES.METHOD_NOT_FOUND,
            message: `Method not found: ${method}`,
          },
        };
    }
  }

  /**
   * Handle initialize request
   */
  private handleInitialize(
    id: string | number | undefined,
    params: Record<string, unknown> | undefined
  ): JsonRpcResponse {
    logger.info('MCP initialize', {
      context: 'McpServer.handleInitialize',
      clientInfo: params?.clientInfo,
    });

    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: mcpConfig.protocolVersion,
        serverInfo: {
          name: mcpConfig.name,
          version: mcpConfig.version,
        },
        capabilities: {
          tools: mcpConfig.capabilities.tools ? {} : undefined,
          resources: mcpConfig.capabilities.resources ? {} : undefined,
          prompts: mcpConfig.capabilities.prompts ? {} : undefined,
        },
      },
    };
  }

  /**
   * Handle initialized notification
   */
  private handleInitialized(id: string | number | undefined): JsonRpcResponse {
    logger.info('MCP initialized', { context: 'McpServer.handleInitialized' });
    return {
      jsonrpc: '2.0',
      id,
      result: {},
    };
  }

  /**
   * Handle shutdown request
   */
  private handleShutdown(id: string | number | undefined): JsonRpcResponse {
    logger.info('MCP shutdown', { context: 'McpServer.handleShutdown' });
    return {
      jsonrpc: '2.0',
      id,
      result: {},
    };
  }

  /**
   * Handle tools/list request
   */
  private handleToolsList(id: string | number | undefined): JsonRpcResponse {
    const tools = this.toolRegistry.listTools();

    return {
      jsonrpc: '2.0',
      id,
      result: {
        tools: tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      },
    };
  }

  /**
   * Handle tools/call request
   */
  private async handleToolsCall(
    id: string | number | undefined,
    params: Record<string, unknown> | undefined,
    context: McpContext
  ): Promise<JsonRpcResponse> {
    const toolName = params?.name as string;
    const toolArgs = params?.arguments as Record<string, unknown>;

    if (!toolName) {
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: MCP_ERROR_CODES.INVALID_PARAMS,
          message: 'Tool name is required',
        },
      };
    }

    try {
      const result = await this.toolRegistry.executeTool(
        toolName,
        toolArgs || {},
        context
      );

      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: false,
        },
      };
    } catch (error) {
      logger.error('Tool execution failed', {
        context: 'McpServer.handleToolsCall',
        toolName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error:
                  error instanceof Error
                    ? error.message
                    : 'Tool execution failed',
              }),
            },
          ],
          isError: true,
        },
      };
    }
  }

  /**
   * Handle capabilities/list request
   */
  private handleCapabilitiesList(
    id: string | number | undefined
  ): JsonRpcResponse {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        capabilities: mcpConfig.capabilities,
      },
    };
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
    const response: JsonRpcResponse = {
      jsonrpc: '2.0',
      id: id ?? undefined,
      error: {
        code,
        message,
        data,
      },
    };
    res.status(200).json(response);
  }
}
