import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { mcpInterviewService } from '@/services/mcp/mcp.interview.service';
import { logger } from '@/shared/utils/logger';

const router = Router();

/**
 * Validation Schemas
 */
const AcceptInterviewSchema = z.object({
  password: z.string().min(8).optional(),
  acceptTerms: z.boolean().optional(),
});

const DeclineInterviewSchema = z.object({
  reason: z.string().max(500).optional(),
});

const _StartInterviewSchema = z.object({});

/**
 * @openapi
 * /api/public/interviews/{interviewId}:
 *   get:
 *     tags: [MCP Interviews - Public]
 *     summary: Get interview landing page data
 *     description: Public endpoint to get interview details for candidate
 *     parameters:
 *       - in: path
 *         name: interviewId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Interview landing data
 *       404:
 *         description: Interview not found
 */
router.get(
  '/:interviewId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { interviewId } = req.params;

      const landingData =
        await mcpInterviewService.getInterviewLandingData(interviewId);

      if (!landingData) {
        res.status(404).json({
          success: false,
          error: 'Interview not found',
        });
        return;
      }

      res.json({
        success: true,
        data: landingData,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/public/interviews/{interviewId}/accept:
 *   post:
 *     tags: [MCP Interviews - Public]
 *     summary: Accept interview invitation
 *     description: Accept interview and optionally register new account
 *     parameters:
 *       - in: path
 *         name: interviewId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 description: Password for new candidate registration
 *               acceptTerms:
 *                 type: boolean
 *                 description: Accept terms and conditions
 *     responses:
 *       200:
 *         description: Interview accepted
 *       400:
 *         description: Validation error or invalid state
 *       404:
 *         description: Interview not found
 */
router.post(
  '/:interviewId/accept',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { interviewId } = req.params;

      const validation = AcceptInterviewSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validation.error.errors,
        });
        return;
      }

      const result = await mcpInterviewService.acceptInterview({
        interviewId,
        password: validation.data.password,
        acceptTerms: validation.data.acceptTerms,
      });

      logger.info('Interview accepted via public route', {
        context: 'mcpInterviewRoutes.accept',
        interviewId,
      });

      res.json({
        success: true,
        data: {
          redirectUrl: result.redirectUrl,
        },
        message: 'Interview accepted successfully',
      });
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message.includes('not found') ||
          error.message.includes('expired')
        ) {
          res.status(404).json({
            success: false,
            error: error.message,
          });
          return;
        }
        if (
          error.message.includes('not in INVITED status') ||
          error.message.includes('required')
        ) {
          res.status(400).json({
            success: false,
            error: error.message,
          });
          return;
        }
      }
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/public/interviews/{interviewId}/decline:
 *   post:
 *     tags: [MCP Interviews - Public]
 *     summary: Decline interview invitation
 *     description: Decline interview invitation with optional reason
 *     parameters:
 *       - in: path
 *         name: interviewId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for declining
 *     responses:
 *       200:
 *         description: Interview declined
 *       400:
 *         description: Invalid state
 *       404:
 *         description: Interview not found
 */
router.post(
  '/:interviewId/decline',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { interviewId } = req.params;

      const validation = DeclineInterviewSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validation.error.errors,
        });
        return;
      }

      await mcpInterviewService.declineInterview({
        interviewId,
        reason: validation.data.reason,
      });

      logger.info('Interview declined via public route', {
        context: 'mcpInterviewRoutes.decline',
        interviewId,
      });

      res.json({
        success: true,
        message: 'Interview declined',
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            error: error.message,
          });
          return;
        }
        if (error.message.includes('not in INVITED status')) {
          res.status(400).json({
            success: false,
            error: error.message,
          });
          return;
        }
      }
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/public/interviews/{interviewId}/start:
 *   post:
 *     tags: [MCP Interviews - Public]
 *     summary: Start interview assessment
 *     description: Start the interview assessment after acceptance. Creates job posting, application, and assessment invitation.
 *     parameters:
 *       - in: path
 *         name: interviewId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Interview started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     assessmentInviteId:
 *                       type: string
 *                     redirectUrl:
 *                       type: string
 *                     authToken:
 *                       type: string
 *       400:
 *         description: Invalid state (not accepted)
 *       404:
 *         description: Interview not found
 */
router.post(
  '/:interviewId/start',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { interviewId } = req.params;

      const result = await mcpInterviewService.startInterview({
        interviewId,
      });

      logger.info('Interview started via public route', {
        context: 'mcpInterviewRoutes.start',
        interviewId,
        assessmentInviteId: result.assessmentInviteId,
      });

      res.json({
        success: true,
        data: {
          assessmentInviteId: result.assessmentInviteId,
          redirectUrl: result.redirectUrl,
          authToken: result.authToken,
          authUser: result.authUser,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            error: error.message,
          });
          return;
        }
        if (
          error.message.includes('must be in ACCEPTED status') ||
          error.message.includes('not linked')
        ) {
          res.status(400).json({
            success: false,
            error: error.message,
          });
          return;
        }
      }
      next(error);
    }
  }
);

export default router;
