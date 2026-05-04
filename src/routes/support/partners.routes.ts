import { Router } from 'express';
import { SupportPartnersController } from '@/controllers/support/partners.controller';
import { SupportPartnersService } from '@/services/support/partners.service';
import { NotificationFactory } from '@/services/notification/notification.factory';

import {
  requireAuth,
  requireActiveUser,
  validateRequest,
  requireUserType,
  requireRole,
} from '@/middleware';
import {
  supportPartnerUpdateValidator,
  supportPartnerIdValidator,
  supportPartnerFilterValidator,
} from '@/shared/validators/support/partners.validator';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';
import { partnerJobPostingsListValidator } from '@/shared/validators/partner/job.postings.validator';
import { partnerUserListValidator } from '@/shared/validators/partner/user.validator';
import { partnerUserInvitationListValidator } from '@/shared/validators/partner/user.invitation.validator';

const router = Router();

// Initialize services and controller
const notificationProvider =
  new NotificationFactory().getNotificationProvider();
const supportPartnersService = new SupportPartnersService(notificationProvider);
const supportPartnersController = new SupportPartnersController(
  supportPartnersService
);

// Support auth middleware - applies to all routes
const supportAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.SUPPORT]),
  requireRole([UserRoleEnum.ADMIN, UserRoleEnum.TECHNICAL_SUPPORT]),
];

/**
 * @openapi
 * /support/partners:
 *   get:
 *     summary: List support partners with filtering and pagination
 *     tags:
 *       - Support  Partners
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortBy'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortOrder'
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *         description: Search term for partner name or email
 *       - in: query
 *         name: companyId
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by company ID
 *       - in: query
 *         name: industry
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by company industry
 *       - in: query
 *         name: size
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by company size
 *       - in: query
 *         name: hasFinancialData
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Filter by whether partner has financial data
 *       - in: query
 *         name: createdAfter
 *         required: false
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by creation date (after)
 *       - in: query
 *         name: createdBefore
 *         required: false
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by creation date (before)
 *     responses:
 *       200:
 *         description: List of support partners
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportPartnerListApiResponse'
 *       400:
 *         description: Bad request - Invalid parameters
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get(
  '/',
  ...supportAuthMiddleware,
  validateRequest(supportPartnerFilterValidator),
  supportPartnersController.listSupportPartners
);

/**
 * @openapi
 * /support/partners/{supportPartnerId}:
 *   get:
 *     summary: Get support partner details by ID
 *     tags:
 *       - Support  Partners
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: supportPartnerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the partner
 *     responses:
 *       200:
 *         description: Partner details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportPartnerGetApiResponse'
 *       400:
 *         description: Bad request - Invalid parameters
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Partner not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:supportPartnerId',
  ...supportAuthMiddleware,
  validateRequest(supportPartnerIdValidator),
  supportPartnersController.getSupportPartner
);

/**
 * @openapi
 * /support/partners/{supportPartnerId}:
 *   patch:
 *     summary: Update support partner
 *     tags:
 *       - Support  Partners
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: supportPartnerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the partner
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ISupportPartnerUpdateValidator'
 *     responses:
 *       200:
 *         description: Partner updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportPartnerUpdateApiResponse'
 *       400:
 *         description: Bad request - Invalid parameters
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Partner not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  '/:supportPartnerId',
  ...supportAuthMiddleware,
  validateRequest(supportPartnerUpdateValidator),
  supportPartnersController.updateSupportPartner
);

/**
 * @openapi
 * /support/partners/{supportPartnerId}:
 *   delete:
 *     summary: Delete support partner
 *     tags:
 *       - Support  Partners
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: supportPartnerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the partner
 *     responses:
 *       200:
 *         description: Partner deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportPartnerDeleteApiResponse'
 *       400:
 *         description: Bad request - Invalid parameters
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Partner not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  '/:supportPartnerId',
  ...supportAuthMiddleware,
  validateRequest(supportPartnerIdValidator),
  supportPartnersController.deleteSupportPartner
);

/**
 * @openapi
 * /support/partners/{supportPartnerId}/job-postings:
 *   get:
 *     summary: List partner job postings
 *     tags:
 *       - Support  Partners
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: supportPartnerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the partner
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *         description: Search in job titles
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by job posting status
 *       - in: query
 *         name: industry
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by industry
 *     responses:
 *       200:
 *         description: List of partner job postings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerJobPostingsGetApiResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Partner not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:supportPartnerId/job-postings',
  ...supportAuthMiddleware,
  validateRequest(partnerJobPostingsListValidator),
  supportPartnersController.listSupportPartnerJobPostings
);

/**
 * @openapi
 * /support/partners/{supportPartnerId}/users:
 *   get:
 *     summary: List partner users
 *     tags:
 *       - Support  Partners
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: supportPartnerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the partner
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *         description: Search in user names or emails
 *       - in: query
 *         name: role
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by user role
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by user status
 *     responses:
 *       200:
 *         description: List of partner users
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerUserListApiResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Partner not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:supportPartnerId/users',
  ...supportAuthMiddleware,
  validateRequest(partnerUserListValidator),
  supportPartnersController.listSupportPartnerUsers
);

/**
 * @openapi
 * /support/partners/{supportPartnerId}/invitations:
 *   get:
 *     summary: List partner user invitations
 *     tags:
 *       - Support  Partners
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: supportPartnerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the partner
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *         description: Search in invitation emails or names
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by invitation status
 *     responses:
 *       200:
 *         description: List of partner invitations
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPartnerUserInvitationListApiResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Partner not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:supportPartnerId/invitations',
  ...supportAuthMiddleware,
  validateRequest(partnerUserInvitationListValidator),
  supportPartnersController.listSupportPartnerInvitations
);

export default router;
