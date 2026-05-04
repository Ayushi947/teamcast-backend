import { Router } from 'express';
import { ClientAccountManagerController } from '@/controllers/client/account.manager.controller';

const router = Router();
const controller = new ClientAccountManagerController();

/**
 * @openapi
 * /account-manager/client/{clientId}:
 *   get:
 *     summary: Get account manager details for a client
 *     description: Returns user details of the assigned account manager for the given clientId
 *     tags: [Client Account Manager]
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Account manager user details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IGetAccountManagerByClientIdApiResponse'
 *       404:
 *         description: No account manager assigned for this client
 */
router.get('/client/:clientId', controller.getAccountManagerByClientId);

export default router;
