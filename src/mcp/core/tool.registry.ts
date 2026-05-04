import { logger } from '@/shared/utils/logger';
import { McpContext } from './mcp.server';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

/**
 * MCP Tool Definition
 */
export interface McpTool {
  name: string;
  description: string;
  /**
   * JSON Schema (MCP expects JSON Schema for tools/list).
   * This is what gets returned to MCP clients (e.g., Cursor).
   */
  inputSchema: Record<string, unknown>;
  /**
   * Zod schema used for server-side validation before tool execution.
   */
  validationSchema: z.ZodType<unknown>;
  requiredScopes?: string[];
  handler: McpToolHandler;
}

/**
 * MCP Tool Handler Function Type
 */
export type McpToolHandler = (
  args: Record<string, unknown>,
  context: McpContext
) => Promise<unknown>;

/**
 * Tool Registration Options
 */
export interface ToolRegistrationOptions {
  requiredScopes?: string[];
}

/**
 * MCP Tool Registry - Manages all available MCP tools
 */
export class McpToolRegistry {
  private static instance: McpToolRegistry;
  private tools: Map<string, McpTool> = new Map();

  private constructor() {}

  static getInstance(): McpToolRegistry {
    if (!McpToolRegistry.instance) {
      McpToolRegistry.instance = new McpToolRegistry();
    }
    return McpToolRegistry.instance;
  }

  /**
   * Register a new tool
   */
  register(
    name: string,
    description: string,
    inputSchema: z.ZodType<unknown>,
    handler: McpToolHandler,
    options?: ToolRegistrationOptions
  ): void {
    if (this.tools.has(name)) {
      logger.warn(`Tool ${name} already registered, overwriting`, {
        context: 'McpToolRegistry.register',
      });
    }

    // Convert Zod schema to JSON Schema for MCP clients
    const jsonSchemaWrapper: any = zodToJsonSchema(inputSchema as any, {
      name,
    });
    const jsonSchema: Record<string, unknown> =
      (jsonSchemaWrapper?.definitions?.[name] as Record<string, unknown>) ||
      (jsonSchemaWrapper as Record<string, unknown>) ||
      {};

    this.tools.set(name, {
      name,
      description,
      inputSchema: jsonSchema,
      validationSchema: inputSchema,
      handler,
      requiredScopes: options?.requiredScopes,
    });

    logger.info(`Tool registered: ${name}`, {
      context: 'McpToolRegistry.register',
      requiredScopes: options?.requiredScopes,
    });
  }

  /**
   * Get a tool by name
   */
  getTool(name: string): McpTool | undefined {
    return this.tools.get(name);
  }

  /**
   * List all registered tools
   */
  listTools(): McpTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Execute a tool
   */
  async executeTool(
    name: string,
    args: Record<string, unknown>,
    context: McpContext
  ): Promise<unknown> {
    const tool = this.tools.get(name);

    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    // Check scopes if required
    if (tool.requiredScopes && tool.requiredScopes.length > 0) {
      const hasScope = tool.requiredScopes.some((scope) =>
        context.scopes.includes(scope)
      );

      if (!hasScope) {
        throw new Error(
          `Insufficient permissions. Required scopes: ${tool.requiredScopes.join(', ')}`
        );
      }
    }

    // Validate input
    const parseResult = tool.validationSchema.safeParse(args);
    if (!parseResult.success) {
      throw new Error(
        `Invalid tool arguments: ${parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      );
    }

    logger.info(`Executing tool: ${name}`, {
      context: 'McpToolRegistry.executeTool',
      mcpClientId: context.mcpClientId,
      tenantClientId: context.tenantClientId,
    });

    // Execute the tool handler
    return await tool.handler(
      parseResult.data as Record<string, unknown>,
      context
    );
  }

  /**
   * Unregister a tool
   */
  unregister(name: string): boolean {
    return this.tools.delete(name);
  }

  /**
   * Clear all tools
   */
  clear(): void {
    this.tools.clear();
  }

  /**
   * Get tool count
   */
  getToolCount(): number {
    return this.tools.size;
  }
}
