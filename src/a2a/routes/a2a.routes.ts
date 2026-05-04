/**
 * A2A Routes
 * HTTP routes for A2A protocol
 */

import { Router, Request, Response } from 'express';
import { logger } from '@/shared/utils/logger';
import { A2AServer } from '../core/a2a.server';
import { A2ASkillRegistry } from '../skills/skill.registry';
import { generateAgentCard, A2A_CONFIG } from '../config/a2a.config';
import {
  a2aAuthMiddleware,
  a2aRateLimitMiddleware,
} from '../middleware/a2a.auth.middleware';
import { registerInterviewSkills } from '../skills/interview.skills';

/**
 * Initialize A2A skills
 */
function initializeA2A(): void {
  // Register interview skills
  registerInterviewSkills();

  logger.info('A2A: Initialized', {
    context: 'a2aRoutes.initializeA2A',
    skillCount: A2ASkillRegistry.getInstance().getSkillCount(),
  });
}

/**
 * Create A2A Router
 */
export function createA2ARouter(): Router {
  const router = Router();
  const a2aServer = A2AServer.getInstance();

  // Initialize A2A
  initializeA2A();

  /**
   * Agent Card Discovery Endpoint
   * GET /.well-known/agent.json
   * This is typically served at the root level, but we also support it here
   */
  router.get('/agent.json', (_req: Request, res: Response) => {
    const agentCard = generateAgentCard();
    res.json(agentCard);
  });

  /**
   * Health Check
   * GET /health
   */
  router.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      protocol: 'A2A',
      version: A2A_CONFIG.version,
      protocolVersions: A2A_CONFIG.protocolVersions,
      skills: A2ASkillRegistry.getInstance().getSkillCount(),
    });
  });

  /**
   * Main A2A JSON-RPC Endpoint
   * POST /
   * Handles all A2A JSON-RPC methods
   */
  router.post(
    '/',
    a2aAuthMiddleware,
    a2aRateLimitMiddleware(A2A_CONFIG.rateLimit.maxRequestsPerMinute),
    async (req: Request, res: Response) => {
      await a2aServer.handleRequest(req, res);
    }
  );

  /**
   * Message Send Endpoint (alternative to /)
   * POST /message
   */
  router.post(
    '/message',
    a2aAuthMiddleware,
    a2aRateLimitMiddleware(A2A_CONFIG.rateLimit.maxRequestsPerMinute),
    async (req: Request, res: Response) => {
      // Wrap in JSON-RPC format if not already
      if (!req.body.jsonrpc) {
        req.body = {
          jsonrpc: '2.0',
          method: 'message/send',
          params: req.body,
          id: `msg-${Date.now()}`,
        };
      }
      await a2aServer.handleRequest(req, res);
    }
  );

  /**
   * Tasks Endpoints
   */
  router.get(
    '/tasks/:taskId',
    a2aAuthMiddleware,
    async (req: Request, res: Response) => {
      req.body = {
        jsonrpc: '2.0',
        method: 'tasks/get',
        params: { taskId: req.params.taskId },
        id: `task-${Date.now()}`,
      };
      await a2aServer.handleRequest(req, res);
    }
  );

  router.get(
    '/tasks',
    a2aAuthMiddleware,
    async (req: Request, res: Response) => {
      req.body = {
        jsonrpc: '2.0',
        method: 'tasks/list',
        params: {
          contextId: req.query.contextId,
          state: req.query.state
            ? (req.query.state as string).split(',')
            : undefined,
          limit: req.query.limit
            ? parseInt(req.query.limit as string)
            : undefined,
          offset: req.query.offset
            ? parseInt(req.query.offset as string)
            : undefined,
        },
        id: `tasks-${Date.now()}`,
      };
      await a2aServer.handleRequest(req, res);
    }
  );

  router.post(
    '/tasks/:taskId/cancel',
    a2aAuthMiddleware,
    async (req: Request, res: Response) => {
      req.body = {
        jsonrpc: '2.0',
        method: 'tasks/cancel',
        params: {
          taskId: req.params.taskId,
          reason: req.body?.reason,
        },
        id: `cancel-${Date.now()}`,
      };
      await a2aServer.handleRequest(req, res);
    }
  );

  /**
   * Skills Discovery Endpoint
   * GET /skills
   */
  router.get('/skills', a2aAuthMiddleware, (_req: Request, res: Response) => {
    const skills = A2ASkillRegistry.getInstance().getAllSkills();
    res.json({
      skills: skills.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        tags: s.tags,
        inputSchema: s.inputSchema,
        outputSchema: s.outputSchema,
      })),
      total: skills.length,
    });
  });

  /**
   * Skill Details Endpoint
   * GET /skills/:skillId
   */
  router.get(
    '/skills/:skillId',
    a2aAuthMiddleware,
    (req: Request, res: Response) => {
      const skill = A2ASkillRegistry.getInstance().getSkill(req.params.skillId);

      if (!skill) {
        res.status(404).json({
          error: 'Skill not found',
          skillId: req.params.skillId,
        });
        return;
      }

      res.json({
        id: skill.id,
        name: skill.name,
        description: skill.description,
        tags: skill.tags,
        inputSchema: skill.inputSchema,
        outputSchema: skill.outputSchema,
        examples: skill.examples,
      });
    }
  );

  return router;
}

/**
 * Create Agent Card Router
 * For serving agent.json at /.well-known/
 */
export function createAgentCardRouter(): Router {
  const router = Router();

  router.get('/agent.json', (_req: Request, res: Response) => {
    const agentCard = generateAgentCard();
    res.json(agentCard);
  });

  return router;
}
