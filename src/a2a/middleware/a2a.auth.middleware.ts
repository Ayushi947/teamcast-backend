/**
 * A2A Authentication Middleware
 * Handles authentication for A2A protocol requests
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/shared/utils/logger';
import { A2A_ERROR_CODES } from '../core/a2a.types';

const prisma = new PrismaClient();

/**
 * Extended Request with A2A context
 */
export interface A2ARequest extends Request {
  a2aClientId?: string;
  a2aTenantId?: string;
  a2aScopes?: string[];
}

/**
 * A2A Authentication Middleware
 * Validates API key and sets A2A context
 *
 * A2A clients use the same mcp_client table for authentication
 * This allows unified client management while supporting both protocols
 */
export async function a2aAuthMiddleware(
  req: A2ARequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const requestId = `a2a-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  (req as any).requestId = requestId;

  try {
    // Extract API key from headers
    const authHeader = req.headers.authorization;
    const apiKeyHeader = req.headers['x-api-key'] as string;

    let apiKey: string | null = null;

    if (authHeader) {
      // Support both "Bearer <key>" and "ApiKey <key>" formats
      if (authHeader.startsWith('Bearer ')) {
        apiKey = authHeader.substring(7);
      } else if (authHeader.startsWith('ApiKey ')) {
        apiKey = authHeader.substring(7);
      }
    } else if (apiKeyHeader) {
      apiKey = apiKeyHeader;
    }

    if (!apiKey) {
      logger.warn('A2A: Missing authentication', {
        context: 'a2aAuthMiddleware',
        requestId,
        path: req.path,
      });

      res.status(401).json({
        jsonrpc: '2.0',
        error: {
          code: A2A_ERROR_CODES.UNAUTHORIZED,
          message:
            'Authentication required. Provide API key via Authorization header or X-API-Key header.',
        },
        id: null,
      });
      return;
    }

    // Look up the client by API key
    // A2A clients use the same mcp_client table
    const mcpClient = await prisma.mcp_client.findUnique({
      where: { apiKey },
    });

    if (!mcpClient) {
      logger.warn('A2A: Invalid API key', {
        context: 'a2aAuthMiddleware',
        requestId,
        apiKeyPrefix: apiKey.substring(0, 8) + '...',
      });

      res.status(401).json({
        jsonrpc: '2.0',
        error: {
          code: A2A_ERROR_CODES.UNAUTHORIZED,
          message: 'Invalid API key',
        },
        id: null,
      });
      return;
    }

    if (!mcpClient.isActive) {
      logger.warn('A2A: Inactive client', {
        context: 'a2aAuthMiddleware',
        requestId,
        clientId: mcpClient.id,
      });

      res.status(403).json({
        jsonrpc: '2.0',
        error: {
          code: A2A_ERROR_CODES.FORBIDDEN,
          message: 'Client is inactive',
        },
        id: null,
      });
      return;
    }

    // Set A2A context on request
    req.a2aClientId = mcpClient.id;
    req.a2aTenantId = mcpClient.clientId;
    req.a2aScopes = mcpClient.scopes;

    // Update last used timestamp
    await prisma.mcp_client.update({
      where: { id: mcpClient.id },
      data: { lastUsedAt: new Date() },
    });

    logger.debug('A2A: Request authenticated', {
      context: 'a2aAuthMiddleware',
      requestId,
      clientId: mcpClient.id,
      clientName: mcpClient.name,
    });

    next();
  } catch (error) {
    logger.error('A2A: Authentication error', {
      context: 'a2aAuthMiddleware',
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      jsonrpc: '2.0',
      error: {
        code: A2A_ERROR_CODES.INTERNAL_ERROR,
        message: 'Authentication service error',
      },
      id: null,
    });
  }
}

/**
 * A2A Rate Limit Middleware
 * Simple in-memory rate limiting
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function a2aRateLimitMiddleware(
  maxRequestsPerMinute: number = 60
): (req: A2ARequest, res: Response, next: NextFunction) => void {
  // Cleanup old entries every minute
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitStore) {
      if (now > value.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }, 60000);

  return (req: A2ARequest, res: Response, next: NextFunction): void => {
    const clientId = req.a2aClientId || req.ip || 'unknown';
    const now = Date.now();
    const windowMs = 60000; // 1 minute

    let entry = rateLimitStore.get(clientId);

    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      rateLimitStore.set(clientId, entry);
    }

    entry.count++;

    if (entry.count > maxRequestsPerMinute) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);

      logger.warn('A2A: Rate limit exceeded', {
        context: 'a2aRateLimitMiddleware',
        clientId,
        count: entry.count,
        limit: maxRequestsPerMinute,
      });

      res.setHeader('Retry-After', retryAfter.toString());
      res.status(429).json({
        jsonrpc: '2.0',
        error: {
          code: A2A_ERROR_CODES.RATE_LIMITED,
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
          data: { retryAfter },
        },
        id: null,
      });
      return;
    }

    next();
  };
}
