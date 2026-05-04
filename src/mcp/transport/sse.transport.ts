/**
 * MCP SSE Transport
 * Server-Sent Events transport for MCP protocol
 * Required for clients like Cursor IDE
 */

import { Request, Response, Router } from 'express';
import { randomUUID } from 'crypto';
import { logger } from '@/shared/utils/logger';
import { McpServer, McpContext } from '../core/mcp.server';
import { mcpAuthMiddleware } from '../middleware';

/**
 * Active SSE session
 */
interface SseSession {
  id: string;
  response: Response;
  clientId: string;
  tenantId: string;
  scopes: string[];
  createdAt: Date;
  lastActivity: Date;
}

/**
 * SSE Transport Manager
 * Manages SSE connections and message routing
 */
class SseTransportManager {
  private static instance: SseTransportManager;
  private sessions: Map<string, SseSession> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Clean up stale sessions every 5 minutes
    this.cleanupInterval = setInterval(
      () => this.cleanupStaleSessions(),
      5 * 60 * 1000
    );
  }

  static getInstance(): SseTransportManager {
    if (!SseTransportManager.instance) {
      SseTransportManager.instance = new SseTransportManager();
    }
    return SseTransportManager.instance;
  }

  /**
   * Create a new SSE session
   */
  createSession(
    res: Response,
    clientId: string,
    tenantId: string,
    scopes: string[]
  ): string {
    const sessionId = randomUUID();
    const session: SseSession = {
      id: sessionId,
      response: res,
      clientId,
      tenantId,
      scopes,
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    this.sessions.set(sessionId, session);

    logger.info('SSE session created', {
      context: 'SseTransport.createSession',
      sessionId,
      clientId,
    });

    return sessionId;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): SseSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Update session activity
   */
  updateActivity(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
    }
  }

  /**
   * Remove session
   */
  removeSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    logger.info('SSE session removed', {
      context: 'SseTransport.removeSession',
      sessionId,
    });
  }

  /**
   * Send SSE event to a session
   */
  sendEvent(sessionId: string, event: string, data: unknown): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    try {
      const eventData = typeof data === 'string' ? data : JSON.stringify(data);
      session.response.write(`event: ${event}\ndata: ${eventData}\n\n`);
      session.lastActivity = new Date();
      return true;
    } catch (error) {
      logger.error('Failed to send SSE event', {
        context: 'SseTransport.sendEvent',
        sessionId,
        event,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      this.removeSession(sessionId);
      return false;
    }
  }

  /**
   * Send message response to session
   */
  sendMessage(sessionId: string, message: unknown): boolean {
    return this.sendEvent(sessionId, 'message', message);
  }

  /**
   * Clean up stale sessions (inactive for more than 30 minutes)
   */
  private cleanupStaleSessions(): void {
    const staleThreshold = 30 * 60 * 1000; // 30 minutes
    const now = Date.now();

    for (const [sessionId, session] of this.sessions) {
      if (now - session.lastActivity.getTime() > staleThreshold) {
        try {
          session.response.end();
        } catch {
          // Ignore errors when ending stale connections
        }
        this.removeSession(sessionId);
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
    for (const [sessionId, session] of this.sessions) {
      try {
        session.response.end();
      } catch {
        // Ignore errors
      }
      this.sessions.delete(sessionId);
    }
  }
}

/**
 * Create SSE transport router
 */
export function createSseTransportRouter(): Router {
  const router = Router();
  const sseManager = SseTransportManager.getInstance();
  const mcpServer = McpServer.getInstance();

  /**
   * SSE connection endpoint
   * Clients connect here to establish SSE stream
   */
  router.get('/sse', mcpAuthMiddleware, (req: Request, res: Response) => {
    const clientId = (req as any).mcpClientId || 'unknown';
    const tenantId = (req as any).mcpTenantId || '';
    const scopes = (req as any).mcpScopes || [];

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    res.flushHeaders();

    // Create session
    const sessionId = sseManager.createSession(res, clientId, tenantId, scopes);

    // Send endpoint event with message URL
    // The client will POST messages to this endpoint
    const messageEndpoint = `/api/mcp/sse/message?sessionId=${sessionId}`;
    sseManager.sendEvent(sessionId, 'endpoint', messageEndpoint);

    // Send initial ping
    sseManager.sendEvent(sessionId, 'ping', { timestamp: Date.now() });

    // Handle client disconnect
    req.on('close', () => {
      logger.info('SSE client disconnected', {
        context: 'SseTransport.sse',
        sessionId,
        clientId,
      });
      sseManager.removeSession(sessionId);
    });

    // Keep-alive ping every 30 seconds
    const pingInterval = setInterval(() => {
      if (!sseManager.sendEvent(sessionId, 'ping', { timestamp: Date.now() })) {
        clearInterval(pingInterval);
      }
    }, 30000);

    req.on('close', () => {
      clearInterval(pingInterval);
    });
  });

  /**
   * Message endpoint for SSE transport
   * Clients POST JSON-RPC messages here
   */
  router.post('/sse/message', async (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string;

    if (!sessionId) {
      res.status(400).json({ error: 'Session ID required' });
      return;
    }

    const session = sseManager.getSession(sessionId);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    // Update session activity
    sseManager.updateActivity(sessionId);

    // Build MCP context from session
    const mcpContext: McpContext = {
      requestId: `mcp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      mcpClientId: session.clientId,
      tenantClientId: session.tenantId,
      scopes: session.scopes,
      metadata: {},
    };

    // Attach context to request for the MCP server
    (req as any).mcpClientId = session.clientId;
    (req as any).mcpTenantId = session.tenantId;
    (req as any).mcpScopes = session.scopes;
    (req as any).requestId = mcpContext.requestId;

    try {
      // Process the JSON-RPC request
      const rpcRequest = req.body;

      logger.info('SSE message received', {
        context: 'SseTransport.message',
        sessionId,
        method: rpcRequest?.method,
      });

      // Create a mock response to capture the MCP server's response
      let responseData: unknown = null;
      const mockRes = {
        json: (data: unknown) => {
          responseData = data;
        },
        status: () => mockRes,
      } as unknown as Response;

      // Handle the request through MCP server
      await mcpServer.handleRequest(req, mockRes);

      // Send response via SSE
      if (responseData) {
        sseManager.sendMessage(sessionId, responseData);
      }

      // Acknowledge the POST request
      res.status(202).json({ status: 'accepted' });
    } catch (error) {
      logger.error('SSE message processing failed', {
        context: 'SseTransport.message',
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Send error via SSE
      sseManager.sendMessage(sessionId, {
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : 'Internal error',
        },
      });

      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}

export { SseTransportManager };
