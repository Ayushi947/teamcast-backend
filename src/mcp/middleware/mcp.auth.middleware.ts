import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/shared/utils/logger';
import { mcpConfig, MCP_SCOPES, McpScope } from '../config/mcp.config';

const prisma = new PrismaClient();

/**
 * MCP Authentication Middleware
 * Validates API keys and sets MCP context on the request
 */
export async function mcpAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Skip auth if disabled
  if (!mcpConfig.auth.enabled) {
    (req as any).mcpClientId = 'anonymous';
    (req as any).mcpTenantId = '';
    (req as any).mcpScopes = Object.values(MCP_SCOPES);
    return next();
  }

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        jsonrpc: '2.0',
        error: {
          code: -32001,
          message: 'Missing Authorization header',
        },
      });
      return;
    }

    // Support both "Bearer <token>" and "ApiKey <key>" formats
    let apiKey: string | undefined;

    if (authHeader.startsWith('Bearer ')) {
      apiKey = authHeader.substring(7);
    } else if (authHeader.startsWith('ApiKey ')) {
      apiKey = authHeader.substring(7);
    } else {
      apiKey = authHeader;
    }

    if (!apiKey) {
      res.status(401).json({
        jsonrpc: '2.0',
        error: {
          code: -32001,
          message: 'Invalid Authorization header format',
        },
      });
      return;
    }

    // Look up the MCP client by API key
    const mcpClient = await prisma.mcp_client.findFirst({
      where: {
        apiKey: apiKey,
        isActive: true,
      },
      include: {
        client: true,
      },
    });

    if (!mcpClient) {
      logger.warn('MCP: Invalid API key attempted', {
        context: 'mcpAuthMiddleware',
        apiKeyPrefix: apiKey.substring(0, 8) + '...',
      });

      res.status(401).json({
        jsonrpc: '2.0',
        error: {
          code: -32001,
          message: 'Invalid or inactive API key',
        },
      });
      return;
    }

    // Set MCP context on request
    (req as any).mcpClientId = mcpClient.id;
    (req as any).mcpTenantId = mcpClient.clientId;
    (req as any).mcpScopes = mcpClient.scopes || [];
    (req as any).mcpClientName = mcpClient.name;
    (req as any).requestId =
      `mcp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    logger.info('MCP: Request authenticated', {
      context: 'mcpAuthMiddleware',
      mcpClientId: mcpClient.id,
      tenantId: mcpClient.clientId,
      clientName: mcpClient.name,
    });

    // Update last used timestamp
    await prisma.mcp_client.update({
      where: { id: mcpClient.id },
      data: { lastUsedAt: new Date() },
    });

    next();
  } catch (error) {
    logger.error('MCP: Authentication error', {
      context: 'mcpAuthMiddleware',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: 'Authentication error',
      },
    });
  }
}

/**
 * MCP Scope Check Middleware
 * Verifies the client has required scopes for the operation
 */
export function mcpRequireScopes(...requiredScopes: McpScope[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientScopes: string[] = (req as any).mcpScopes || [];

    const hasAllScopes = requiredScopes.every((scope) =>
      clientScopes.includes(scope)
    );

    if (!hasAllScopes) {
      logger.warn('MCP: Insufficient scopes', {
        context: 'mcpRequireScopes',
        required: requiredScopes,
        available: clientScopes,
      });

      res.status(403).json({
        jsonrpc: '2.0',
        error: {
          code: -32001,
          message: `Insufficient permissions. Required scopes: ${requiredScopes.join(', ')}`,
        },
      });
      return;
    }

    next();
  };
}
