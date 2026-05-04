import { Router } from 'express';
import { CandidateImportController } from '@/controllers/client/candidate.import.controller';
import { CandidateImportService } from '@/services/client/candidate.import.service';
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
  candidateImportTemplateDownloadValidator,
  candidateImportFileUploadValidator,
  candidateImportListValidator,
  candidateImportStatisticsValidator,
} from '@/shared/validators/client/candidate.import.validator';

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

const candidateImportService = new CandidateImportService(
  storageProvider,
  notificationProvider
);
const candidateImportController = new CandidateImportController(
  candidateImportService
);

// Client auth middleware - applies to all candidate import routes
const clientAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.CLIENT]),
  requireRole([UserRoleEnum.ADMIN, UserRoleEnum.HR, UserRoleEnum.RECRUITER]),
];

/**
 * @openapi
 * /client/candidate-import/template/download:
 *   post:
 *     summary: Download Excel template for candidate import
 *     description: Generate and download an Excel template for importing candidates to a specific job posting. Returns the Excel file directly.
 *     tags:
 *       - Client Candidate Import
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ICandidateImportTemplateDownloadRequest'
 *     responses:
 *       200:
 *         description: Excel template file
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Content-Disposition:
 *             description: Attachment with filename
 *             schema:
 *               type: string
 *               example: 'attachment; filename="candidate_import_template.xlsx"'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job posting not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/template/download',
  ...clientAuthMiddleware,
  validateRequest(candidateImportTemplateDownloadValidator),
  candidateImportController.downloadTemplate
);

/**
 * @openapi
 * /client/candidate-import/upload/{jobPostingId}:
 *   post:
 *     summary: Upload and process Excel file with candidate data
 *     description: Upload an Excel file and immediately process candidates for import. Single call like document upload.
 *     tags:
 *       - Client Candidate Import
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobPostingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Job posting ID for the import
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
 *         description: Candidates imported successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateImportProcessApiResponse'
 *       400:
 *         description: Invalid request, file validation failed, or processing error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job posting not found
 *       413:
 *         description: File too large (max 10MB)
 *       500:
 *         description: Internal server error
 */
router.post(
  '/upload/:jobPostingId',
  [...clientAuthMiddleware, upload.single('file')],
  validateRequest(candidateImportFileUploadValidator),
  candidateImportController.uploadCandidates
);

/**
 * @openapi
 * /client/candidate-import/list/{jobPostingId}:
 *   get:
 *     summary: List imported candidates for a job posting
 *     description: Retrieve a list of imported candidates with duplicate detection results
 *     tags:
 *       - Client Candidate Import
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobPostingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Job posting ID to list candidates for
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of candidates to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of candidates to skip
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PROCESSED, DUPLICATE, FAILED]
 *         description: Filter by candidate status
 *       - in: query
 *         name: includeDuplicates
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Whether to include duplicate candidates
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
 *               type: object
 *               properties:
 *                 candidates:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ICandidateImportRecord'
 *                 total:
 *                   type: integer
 *                 duplicateCount:
 *                   type: integer
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job posting not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/list/:jobPostingId',
  ...clientAuthMiddleware,
  validateRequest(candidateImportListValidator),
  candidateImportController.listImportedCandidates
);

/**
 * @openapi
 * /client/candidate-import/statistics:
 *   get:
 *     summary: Get candidate import statistics for a client
 *     description: Retrieve comprehensive statistics about candidate imports including upload counts, success rates, and trends
 *     tags:
 *       - Client Candidate Import
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: jobPostingId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Optional job posting ID to filter statistics
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
 *         description: Candidate import statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateImportStatisticsApiResponse'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/statistics',
  ...clientAuthMiddleware,
  validateRequest(candidateImportStatisticsValidator),
  candidateImportController.getImportStatistics
);

export default router;
