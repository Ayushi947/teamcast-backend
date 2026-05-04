/**
 * Support Admin Routes for Deel Configuration
 *
 * These routes allow TeamCast support admins to:
 * - Enable/disable Deel SSO for specific clients
 * - View Deel configuration status
 * - List all clients with Deel enabled
 *
 * All routes require support admin authentication.
 */

import { Router } from 'express';
import { DeelConfigurationController } from '@/controllers/support/deel.configuration.controller';
import { requireAuth } from '@/middleware';

const router = Router();

// Initialize controller
const deelConfigController = new DeelConfigurationController();

/**
 * @openapi
 * /api/support/deel/clients:
 *   get:
 *     summary: Get all clients with Deel enabled
 *     description: Returns a list of all clients who have Deel SSO enabled
 *     tags:
 *       - Support Admin - Deel Configuration
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of clients with Deel enabled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       clientId:
 *                         type: string
 *                       companyName:
 *                         type: string
 *                       isDeelEnabled:
 *                         type: boolean
 *                       deelConfiguredAt:
 *                         type: string
 *                         format: date-time
 *                       deelConfiguredBy:
 *                         type: string
 *                       deelConfiguredByName:
 *                         type: string
 *       401:
 *         description: Unauthorized - Support admin only
 */
router.get(
  '/clients',
  requireAuth,
  deelConfigController.getAllClientsWithDeelEnabled
);

/**
 * @openapi
 * /api/support/deel/clients/{clientId}:
 *   get:
 *     summary: Get Deel configuration for a client
 *     description: Returns Deel SSO configuration status for a specific client
 *     tags:
 *       - Support Admin - Deel Configuration
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID
 *     responses:
 *       200:
 *         description: Deel configuration for the client
 *       404:
 *         description: Client not found
 *       401:
 *         description: Unauthorized - Support admin only
 */
router.get(
  '/clients/:clientId',
  requireAuth,
  deelConfigController.getDeelConfiguration
);

/**
 * @openapi
 * /api/support/deel/clients/{clientId}/enable:
 *   post:
 *     summary: Enable Deel SSO for a client
 *     description: Enables Deel Single Sign-On integration for a specific client. Only support admins can perform this action.
 *     tags:
 *       - Support Admin - Deel Configuration
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID
 *     responses:
 *       200:
 *         description: Deel SSO enabled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     clientId:
 *                       type: string
 *                     companyName:
 *                       type: string
 *                     isDeelEnabled:
 *                       type: boolean
 *                       example: true
 *                     deelConfiguredAt:
 *                       type: string
 *                       format: date-time
 *                     deelConfiguredBy:
 *                       type: string
 *                     deelConfiguredByName:
 *                       type: string
 *       404:
 *         description: Client not found
 *       401:
 *         description: Unauthorized - Support admin only
 */
router.post(
  '/clients/:clientId/enable',
  requireAuth,
  deelConfigController.enableDeelForClient
);

/**
 * @openapi
 * /api/support/deel/clients/{clientId}/disable:
 *   post:
 *     summary: Disable Deel SSO for a client
 *     description: Disables Deel Single Sign-On integration for a specific client. Only support admins can perform this action.
 *     tags:
 *       - Support Admin - Deel Configuration
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID
 *     responses:
 *       200:
 *         description: Deel SSO disabled successfully
 *       404:
 *         description: Client not found
 *       401:
 *         description: Unauthorized - Support admin only
 */
router.post(
  '/clients/:clientId/disable',
  requireAuth,
  deelConfigController.disableDeelForClient
);

export default router;
