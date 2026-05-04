import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  requireAuth,
  requireActiveUser,
  requireRole,
  requireUserType,
} from '@/middleware';
import {
  mcpClientService,
  IMcpClientCreate,
  IMcpClientUpdate,
} from '@/services/mcp/mcp.client.service';
import { logger } from '@/shared/utils/logger';
import type { McpScope } from '@/mcp/config/mcp.config';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';

const router = Router();

// Client auth middleware
const clientAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.CLIENT, UserTypeEnum.SUPPORT]),
];

// Admin-only middleware
const adminOnlyMiddleware = [
  ...clientAuthMiddleware,
  requireRole([UserRoleEnum.ADMIN]),
];

/**
 * Validation Schemas
 */
const CreateMcpClientSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  scopes: z.array(z.string()),
  sourceSystem: z.string().max(100).optional(),
  contactEmail: z.string().email().optional(),
  rateLimitPerMinute: z.number().min(1).max(10000).optional(),
  rateLimitPerHour: z.number().min(1).max(100000).optional(),
});

const UpdateMcpClientSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  scopes: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  sourceSystem: z.string().max(100).optional(),
  contactEmail: z.string().email().optional(),
  rateLimitPerMinute: z.number().min(1).max(10000).optional(),
  rateLimitPerHour: z.number().min(1).max(100000).optional(),
  webhookUrl: z.string().url().optional(),
  webhookSecret: z.string().optional(),
  webhookEnabled: z.boolean().optional(),
});

const ConfigureWebhookSchema = z.object({
  webhookUrl: z.string().url(),
  webhookSecret: z.string().optional(),
  webhookEnabled: z.boolean().default(true),
});

/**
 * @openapi
 * /api/client/mcp-clients:
 *   get:
 *     tags: [MCP Clients]
 *     summary: Get all MCP clients for the tenant
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of MCP clients
 */
router.get(
  '/',
  clientAuthMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clientId = (req as any).user.clientId;
      const mcpClients = await mcpClientService.getMcpClients(clientId);

      res.json({
        success: true,
        data: mcpClients,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/client/mcp-clients/scopes:
 *   get:
 *     tags: [MCP Clients]
 *     summary: Get available MCP scopes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of available scopes
 */
router.get(
  '/scopes',
  clientAuthMiddleware,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const scopes = mcpClientService.getAvailableScopes();

      res.json({
        success: true,
        data: scopes,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/client/mcp-clients:
 *   post:
 *     tags: [MCP Clients]
 *     summary: Create a new MCP client
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - scopes
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               scopes:
 *                 type: array
 *                 items:
 *                   type: string
 *               sourceSystem:
 *                 type: string
 *               contactEmail:
 *                 type: string
 *     responses:
 *       201:
 *         description: MCP client created with API key
 */
router.post(
  '/',
  adminOnlyMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clientId = (req as any).user.clientId;
      const clientUserId = (req as any).user.clientUserId;

      const validation = CreateMcpClientSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validation.error.errors,
        });
        return;
      }

      const input: IMcpClientCreate = {
        ...validation.data,
        scopes: validation.data.scopes as McpScope[],
      };

      const mcpClient = await mcpClientService.createMcpClient(
        clientId,
        input,
        clientUserId
      );

      logger.info('MCP client created via API', {
        context: 'mcpClientRoutes.create',
        mcpClientId: mcpClient.id,
        clientId,
      });

      res.status(201).json({
        success: true,
        data: mcpClient,
        message:
          'MCP client created. Save the API key securely - it will not be shown again.',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/client/mcp-clients/{mcpClientId}:
 *   get:
 *     tags: [MCP Clients]
 *     summary: Get a specific MCP client
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mcpClientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: MCP client details
 */
router.get(
  '/:mcpClientId',
  clientAuthMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clientId = (req as any).user.clientId;
      const { mcpClientId } = req.params;

      const mcpClient = await mcpClientService.getMcpClient(
        clientId,
        mcpClientId
      );

      res.json({
        success: true,
        data: mcpClient,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/client/mcp-clients/{mcpClientId}:
 *   patch:
 *     tags: [MCP Clients]
 *     summary: Update an MCP client
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mcpClientId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: MCP client updated
 */
router.patch(
  '/:mcpClientId',
  adminOnlyMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clientId = (req as any).user.clientId;
      const { mcpClientId } = req.params;

      const validation = UpdateMcpClientSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validation.error.errors,
        });
        return;
      }

      const input: IMcpClientUpdate = {
        ...validation.data,
        scopes: validation.data.scopes as McpScope[] | undefined,
      };

      const mcpClient = await mcpClientService.updateMcpClient(
        clientId,
        mcpClientId,
        input
      );

      res.json({
        success: true,
        data: mcpClient,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/client/mcp-clients/{mcpClientId}/regenerate-key:
 *   post:
 *     tags: [MCP Clients]
 *     summary: Regenerate API key for an MCP client
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mcpClientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: New API key generated
 */
router.post(
  '/:mcpClientId/regenerate-key',
  adminOnlyMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clientId = (req as any).user.clientId;
      const { mcpClientId } = req.params;

      const mcpClient = await mcpClientService.regenerateApiKey(
        clientId,
        mcpClientId
      );

      logger.info('MCP client API key regenerated via API', {
        context: 'mcpClientRoutes.regenerateKey',
        mcpClientId,
        clientId,
      });

      res.json({
        success: true,
        data: mcpClient,
        message:
          'API key regenerated. Save it securely - it will not be shown again.',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/client/mcp-clients/{mcpClientId}:
 *   delete:
 *     tags: [MCP Clients]
 *     summary: Delete an MCP client
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mcpClientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: MCP client deleted
 */
router.delete(
  '/:mcpClientId',
  adminOnlyMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clientId = (req as any).user.clientId;
      const { mcpClientId } = req.params;

      await mcpClientService.deleteMcpClient(clientId, mcpClientId);

      logger.info('MCP client deleted via API', {
        context: 'mcpClientRoutes.delete',
        mcpClientId,
        clientId,
      });

      res.json({
        success: true,
        message: 'MCP client deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/client/mcp-clients/{mcpClientId}/activity:
 *   get:
 *     tags: [MCP Clients]
 *     summary: Get activity logs for an MCP client
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mcpClientId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *       - in: query
 *         name: offset
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Activity logs
 */
router.get(
  '/:mcpClientId/activity',
  clientAuthMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clientId = (req as any).user.clientId;
      const { mcpClientId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await mcpClientService.getMcpClientActivityLogs(
        clientId,
        mcpClientId,
        { limit, offset }
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/client/mcp-clients/{mcpClientId}/webhook:
 *   put:
 *     tags: [MCP Clients]
 *     summary: Configure webhook for an MCP client
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mcpClientId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - webhookUrl
 *             properties:
 *               webhookUrl:
 *                 type: string
 *                 format: uri
 *               webhookSecret:
 *                 type: string
 *               webhookEnabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Webhook configured successfully
 */
router.put(
  '/:mcpClientId/webhook',
  adminOnlyMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clientId = (req as any).user.clientId;
      const { mcpClientId } = req.params;

      const validation = ConfigureWebhookSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validation.error.errors,
        });
        return;
      }

      const mcpClient = await mcpClientService.configureWebhook(
        clientId,
        mcpClientId,
        validation.data
      );

      logger.info('MCP client webhook configured via API', {
        context: 'mcpClientRoutes.configureWebhook',
        mcpClientId,
        clientId,
      });

      res.json({
        success: true,
        data: mcpClient,
        message: 'Webhook configured successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/client/mcp-clients/{mcpClientId}/webhook/test:
 *   post:
 *     tags: [MCP Clients]
 *     summary: Test webhook configuration by sending a test event
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mcpClientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Test webhook sent
 */
router.post(
  '/:mcpClientId/webhook/test',
  adminOnlyMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clientId = (req as any).user.clientId;
      const { mcpClientId } = req.params;

      const result = await mcpClientService.testWebhook(clientId, mcpClientId);

      logger.info('MCP client webhook test triggered', {
        context: 'mcpClientRoutes.testWebhook',
        mcpClientId,
        clientId,
        success: result.success,
      });

      res.json({
        success: result.success,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/client/mcp-clients/{mcpClientId}/webhook:
 *   delete:
 *     tags: [MCP Clients]
 *     summary: Disable and remove webhook configuration
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mcpClientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Webhook disabled
 */
router.delete(
  '/:mcpClientId/webhook',
  adminOnlyMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clientId = (req as any).user.clientId;
      const { mcpClientId } = req.params;

      const mcpClient = await mcpClientService.updateMcpClient(
        clientId,
        mcpClientId,
        {
          webhookUrl: undefined,
          webhookSecret: undefined,
          webhookEnabled: false,
        }
      );

      logger.info('MCP client webhook disabled via API', {
        context: 'mcpClientRoutes.disableWebhook',
        mcpClientId,
        clientId,
      });

      res.json({
        success: true,
        data: mcpClient,
        message: 'Webhook disabled successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
