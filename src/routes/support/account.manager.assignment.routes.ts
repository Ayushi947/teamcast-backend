import { Router } from 'express';
import { AccountManagerAssignmentController } from '@/controllers/support/account.manager.assignment.controller';
import {
  accountManagerOverrideValidator,
  assignAccountManagerToRecruiterValidator,
  getSupportAccountManagerByClientIdValidator,
} from '@/shared/validators/support/account.manager.assignment.validator';
import {
  requireActiveUser,
  requireAuth,
  requireUserType,
  validateRequest,
} from '@/middleware';
import { UserTypeEnum } from '@/shared/models/common/enums';

const router = Router();

const supportAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.SUPPORT]),
];

const accountManagerAssignmentController =
  new AccountManagerAssignmentController();

// Override the account manager for a client
/**
 * @openapi
 * /support/account-manager-assignment/override:
 *   post:
 *     summary: Change the account manager for a client
 *     description: Change the account manager for a client
 *     tags: [Account Manager Assignment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IAccountManagerOverrideApiRequest'
 *     responses:
 *       200:
 *         description: Account manager overridden successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IAccountManagerOverrideApiResponseWrapper'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IApiResponse'
 */
router.post(
  '/override',
  supportAuthMiddleware,
  [validateRequest(accountManagerOverrideValidator)],
  accountManagerAssignmentController.changeAccountManager
);

/**
 * @openapi
 * /support/account-manager-assignment/all:
 *   get:
 *     summary: Get all account managers
 *     description: Get all account managers
 *     tags: [Account Manager Assignment]
 *     responses:
 *       200:
 *         description: Account managers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IAccountManagerWrapper'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IApiResponse'
 */
router.get('/all', accountManagerAssignmentController.getAllAccountManagers);

/**
 * @openapi
 * /support/account-manager-assignment/manager-details:
 *   get:
 *     summary: Get the account manager details for a support user
 *     description: Get the account manager details for a support user
 *     tags: [Account Manager Assignment]
 *     responses:
 *       200:
 *         description: Account manager details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IAccountManagerWrapper'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IApiResponse'
 */
router.get(
  '/manager-details',
  supportAuthMiddleware,
  accountManagerAssignmentController.getManagerDetails
);

/**
 * @openapi
 * /support/account-manager-assignment/client/{clientId}:
 *   get:
 *     summary: Get account manager details for a client
 *     description: Returns user details of the assigned account manager for the given clientId
 *     tags: [Account Manager Assignment]
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
 *               $ref: '#/components/schemas/IGetSupportAccountManagerByClientIdApiResponse'
 *       404:
 *         description: No account manager assigned for this client
 */
router.get(
  '/client/:clientId',
  [validateRequest(getSupportAccountManagerByClientIdValidator)],
  accountManagerAssignmentController.getAccountManagerByClientId
);

/**
 * @openapi
 * /support/account-manager-assignment/recruiter/assign:
 *   post:
 *     summary: Assign an account manager to a recruiter
 *     description: Assign an account manager to a recruiter
 *     tags: [Account Manager Assignment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IAssignAccountManagerToRecruiterApiRequest'
 *     responses:
 *       200:
 *         description: Account manager assigned to recruiter successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IAssignAccountManagerToRecruiterApiResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IApiResponse'
 */
router.post(
  '/recruiter/assign',
  supportAuthMiddleware,
  [validateRequest(assignAccountManagerToRecruiterValidator)],
  accountManagerAssignmentController.assignAccountManagerToRecruiter
);

/**
 * @openapi
 * /support/account-manager-assignment/recruiter/change:
 *   put:
 *     summary: Change the account manager for a recruiter
 *     description: Change/reassign the account manager for an existing recruiter assignment
 *     tags: [Account Manager Assignment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IAssignAccountManagerToRecruiterApiRequest'
 *     responses:
 *       200:
 *         description: Account manager changed for recruiter successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IAssignAccountManagerToRecruiterApiResponse'
 *       400:
 *         description: Bad request - recruiter doesn't have an account manager assigned
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IApiResponse'
 */
router.put(
  '/recruiter/change',
  supportAuthMiddleware,
  [validateRequest(assignAccountManagerToRecruiterValidator)],
  accountManagerAssignmentController.changeAccountManagerForRecruiter
);

/**
 * @openapi
 * /support/account-manager-assignment/recruiter/{recruiterId}:
 *   get:
 *     summary: Get account manager assigned to a recruiter
 *     description: Returns user details of the assigned account manager for the given recruiterId
 *     tags: [Account Manager Assignment]
 *     parameters:
 *       - in: path
 *         name: recruiterId
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
 *               $ref: '#/components/schemas/IGetSupportAccountManagerByClientIdApiResponse'
 *       404:
 *         description: No account manager assigned for this recruiter
 */
router.get(
  '/recruiter/:recruiterId',
  supportAuthMiddleware,
  accountManagerAssignmentController.getAccountManagerByRecruiterId
);

/**
 * @openapi
 * /support/account-manager-assignment/availability:
 *   put:
 *     summary: Toggle account manager availability status
 *     description: Toggle account manager availability for new client assignments
 *     tags: [Account Manager Assignment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isAvailable
 *             properties:
 *               isAvailable:
 *                 type: boolean
 *                 description: Whether the account manager is available for new assignments
 *     responses:
 *       200:
 *         description: Availability status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 isAvailable:
 *                   type: boolean
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put(
  '/availability',
  supportAuthMiddleware,
  accountManagerAssignmentController.toggleAccountManagerAvailability
);

/**
 * @openapi
 * /support/account-manager-assignment/availability:
 *   get:
 *     summary: Get account manager availability status
 *     description: Get current availability status of the account manager
 *     tags: [Account Manager Assignment]
 *     responses:
 *       200:
 *         description: Availability status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isAvailable:
 *                   type: boolean
 *                 name:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/availability',
  supportAuthMiddleware,
  accountManagerAssignmentController.getAccountManagerAvailabilityStatus
);

export default router;
