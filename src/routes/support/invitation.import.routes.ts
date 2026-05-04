import { Router } from 'express';
import { SupportInvitationImportController } from '@/controllers/support/invitation.import.controller';
import { SupportInvitationImportService } from '@/services/support/invitation.import.service';
import {
  requireAuth,
  requireActiveUser,
  requireRole,
  requireUserType,
  validateRequest,
} from '@/middleware';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';
import { StorageFactory } from '@/services/helpers/storage/storage.factory';
import { NotificationFactory } from '@/services/notification/notification.factory';
import multer from 'multer';
import {
  supportInvitationImportListSchema,
  supportInvitationImportStatisticsSchema,
} from '@/shared/validators/support/invitation.import.validator';

const router = Router();

// Configure multer for file uploads (like DocumentController)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Initialize services and controller with all required dependencies
const storageProvider = StorageFactory.getInstance().getProvider();
const notificationFactory = new NotificationFactory();
const notificationProvider = notificationFactory.getNotificationProvider();

const supportInvitationImportService = new SupportInvitationImportService(
  storageProvider,
  notificationProvider
);
const supportInvitationImportController = new SupportInvitationImportController(
  supportInvitationImportService
);

// Support auth middleware - applies to all support invitation import routes
const supportAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.SUPPORT]),
  requireRole([UserRoleEnum.ADMIN]),
];

/**
 * @openapi
 * /support/invitation-import/upload:
 *   post:
 *     summary: Upload and process Excel file with candidate data for support invitations
 *     description: Upload an Excel file and immediately process candidates for support invitation import. Single call like document upload.
 *     tags:
 *       - Support Invitation Import
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The Excel file containing candidate data (.xlsx or .xls)
 *     responses:
 *       200:
 *         description: Candidates imported successfully for invitations
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportInvitationImportProcessApiResponse'
 *       400:
 *         description: Invalid request, file validation failed, or processing error
 *       401:
 *         description: Unauthorized
 *       413:
 *         description: File too large (max 10MB)
 *       500:
 *         description: Internal server error
 */
router.post(
  '/upload',
  [...supportAuthMiddleware, upload.single('file')],
  supportInvitationImportController.uploadInvitations
);

/**
 * @openapi
 * /support/invitation-import/list:
 *   get:
 *     summary: List imported candidates for support invitations
 *     description: Retrieve a list of imported candidates with invitation status
 *     tags:
 *       - Support Invitation Import
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of candidates to return
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PROCESSED, INVITED, DUPLICATE, FAILED]
 *         description: Filter by candidate status
 *       - in: query
 *         name: jobTitle
 *         schema:
 *           type: string
 *         description: Filter by job title
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location
 *       - in: query
 *         name: skills
 *         schema:
 *           type: string
 *         description: Filter by skills
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, email, phone, job title, location, skills
 *     responses:
 *       200:
 *         description: List of imported candidates
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportInvitationImportListApiResponse'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/list',
  ...supportAuthMiddleware,
  validateRequest(supportInvitationImportListSchema),
  supportInvitationImportController.listImportedCandidates
);

/**
 * @openapi
 * /support/invitation-import/statistics:
 *   get:
 *     summary: Get support invitation import statistics
 *     description: Retrieve comprehensive statistics about support invitation imports including upload counts, success rates, and trends
 *     tags:
 *       - Support Invitation Import
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for statistics (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for statistics (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Support invitation import statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportInvitationImportStatisticsApiResponse'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/statistics',
  ...supportAuthMiddleware,
  validateRequest(supportInvitationImportStatisticsSchema),
  supportInvitationImportController.getImportStatistics
);

/**
 * @openapi
 * /support/invitation-import/statistics/per-upload:
 *   get:
 *     summary: Get per-upload support invitation import statistics
 *     description: Retrieve detailed statistics for each individual upload/batch including failure reasons and per-batch metrics
 *     tags:
 *       - Support Invitation Import
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for statistics (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for statistics (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Per-upload support invitation import statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISupportInvitationImportPerUploadStatisticsApiResponse'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/statistics/per-upload',
  ...supportAuthMiddleware,
  validateRequest(supportInvitationImportStatisticsSchema),
  supportInvitationImportController.getPerUploadStatistics
);

export default router;
