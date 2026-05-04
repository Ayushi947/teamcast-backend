/**
 * Teamcast MCP Server
 * Model Context Protocol server for AI agent integration
 */

import { Router, json } from 'express';
import { logger } from '@/shared/utils/logger';
import { McpServer } from './core/mcp.server';
import { registerAllMcpTools } from './tools';
import { mcpAuthMiddleware, mcpRateLimitMiddleware } from './middleware';
import { getMcpServerInfo } from './config/mcp.config';
import { createSseTransportRouter } from './transport';

/**
 * Initialize MCP Server and register all tools
 */
export function initializeMcpServer(): void {
  logger.info('Initializing MCP Server', { context: 'mcp.initialize' });

  // Register all tools
  registerAllMcpTools();

  logger.info('MCP Server initialized successfully', {
    context: 'mcp.initialize',
  });
}

/**
 * Create MCP Router with all endpoints
 */
export function createMcpRouter(): Router {
  const router = Router();
  const mcpServer = McpServer.getInstance();

  // JSON parsing for all MCP routes
  router.use(json());

  // SSE Transport routes (for Cursor, Claude Desktop, etc.)
  router.use(createSseTransportRouter());

  // Discovery endpoint (no auth required)
  router.get('/.well-known/mcp-configuration', (_req, res) => {
    res.json(getMcpServerInfo());
  });

  // Discovery endpoint (alternative path)
  router.get('/discover', (_req, res) => {
    res.json(getMcpServerInfo());
  });

  // Health check endpoint
  router.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      server: 'teamcast-mcp-server',
      timestamp: new Date().toISOString(),
    });
  });

  // Main MCP endpoint (JSON-RPC 2.0)
  router.post(
    '/v1',
    mcpAuthMiddleware,
    mcpRateLimitMiddleware,
    async (req, res) => {
      await mcpServer.handleRequest(req, res);
    }
  );

  // Alternative endpoint without version prefix
  router.post(
    '/',
    mcpAuthMiddleware,
    mcpRateLimitMiddleware,
    async (req, res) => {
      await mcpServer.handleRequest(req, res);
    }
  );

  return router;
}

// Re-export key components
export { McpServer } from './core/mcp.server';
export { McpToolRegistry } from './core/tool.registry';
export { mcpConfig, getMcpServerInfo, MCP_SCOPES } from './config/mcp.config';
export { McpWebhookService, mcpWebhookService } from './services';
