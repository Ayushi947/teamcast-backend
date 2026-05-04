import { Router } from 'express';
import multer from 'multer';
import {
  requireAuth,
  requireActiveUser,
  requireUserType,
  validateRequest,
} from '@/middleware';
import { UserTypeEnum } from '@/shared/models/common/enums';
import { JobParsingController } from '@/controllers/client/job.parsing.controller';
import { ClientJobParsingService } from '@/services/client/job.parsing.service';
import { StorageFactory } from '@/services/helpers/storage/storage.factory';
import { JobParserFactory } from '@/services/helpers/ai.job.parser/job.parser.factory';
import {
  jobPublicParsingUploadValidator,
  jobPublicParsingTaskIdValidator,
  jobPublicParsingGetJobValidator,
} from '@/shared/validators/client/job.public.parsing.validator';

/**
 * This router is used for:
 * 1. /client/job/:jobPostingId/parsing - Job parsing for specific job posting
 * 2. /client/job/parsing/public - Public job parsing endpoints
 */
const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Initialize services
const storageProvider = StorageFactory.getInstance().getProvider();
const parserProvider = JobParserFactory.getInstance().getProvider();
const jobParsingService = new ClientJobParsingService(
  storageProvider,
  parserProvider
);

// Initialize controller
const jobParsingController = new JobParsingController(jobParsingService);

// Client auth middleware - applies to all authenticated job parsing routes
const clientAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.CLIENT]),
];

// PUBLIC ROUTES MUST COME FIRST - before parameterized routes
// This prevents /:jobPostingId routes from matching /public paths

/**
 * @openapi
 * /client/job/parsing/public/upload:
 *   post:
 *     summary: Upload job description file for async parsing (public)
 *     description: Upload a job description file (PDF, DOC, DOCX, TXT) for async parsing without authentication
 *     tags:
 *       - Client Job Parsing
 *     parameters:
 *       - in: query
 *         name: mode
 *         schema:
 *           type: string
 *           enum: [STRICT, INFERRED, GENERATIVE]
 *           default: INFERRED
 *         description: The parsing mode to use
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Job description upload successful, parsing started
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IJobPublicParsingUploadApiResponse'
 *       400:
 *         description: Invalid input data
 */
router.post(
  '/public/upload',
  [upload.single('file'), validateRequest(jobPublicParsingUploadValidator)],
  jobParsingController.uploadJobDescriptionPublic
);

/**
 * @openapi
 * /client/job/parsing/public/{taskId}:
 *   get:
 *     summary: Get public parsing task status
 *     description: Get the status of a public parsing task
 *     tags:
 *       - Client Job Parsing
 *     parameters:
 *       - $ref: '#/components/parameters/IPublicJobParsingTaskIdParams'
 *     responses:
 *       200:
 *         description: Task status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IJobPublicParsingTaskGetApiResponse'
 *       404:
 *         description: Task not found
 */
router.get(
  '/public/:taskId',
  [validateRequest(jobPublicParsingTaskIdValidator)],
  jobParsingController.getPublicParsingTask
);

/**
 * @openapi
 * /client/job/parsing/public/{taskId}/job:
 *   get:
 *     summary: Get parsed job description from public task
 *     description: Get the parsed job description for a public parsing task
 *     tags:
 *       - Client Job Parsing
 *     parameters:
 *       - $ref: '#/components/parameters/IPublicJobParsingTaskIdParams'
 *     responses:
 *       200:
 *         description: Parsed job description retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IJobPublicParsingGetJobApiResponse'
 *       400:
 *         description: Task not completed yet
 *       404:
 *         description: Task not found
 */
router.get(
  '/public/:taskId/job',
  [validateRequest(jobPublicParsingGetJobValidator)],
  jobParsingController.getParsedJobDescriptionFromPublicTask
);

// AUTHENTICATED ROUTES - these come after public routes to avoid conflicts

/**
 * @openapi
 * /client/job/parsing/task/{taskId}:
 *   get:
 *     summary: Get job parsing task status
 *     description: Get the status of a job parsing task
 *     tags:
 *       - Client Job Parsing
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IJobParsingTaskIdParams'
 *     responses:
 *       200:
 *         description: Task status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IJobParsingTaskGetApiResponse'
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Task not found
 */
router.get(
  '/task/:taskId',
  [...clientAuthMiddleware],
  jobParsingController.getParsingTask
);

/**
 * @openapi
 * /client/job/parsing/task/{taskId}/job:
 *   get:
 *     summary: Get parsed job description
 *     description: Get the parsed job description for a job parsing task
 *     tags:
 *       - Client Job Parsing
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IJobParsingTaskIdParams'
 *     responses:
 *       200:
 *         description: Parsed job description retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IJobParsingGetParsedJobApiResponse'
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Task not found
 */
router.get(
  '/task/:taskId/job',
  [...clientAuthMiddleware],
  jobParsingController.getParsedJobDescription
);

/**
 * @openapi
 * /client/job/{jobPostingId}/parsing/upload:
 *   post:
 *     summary: Upload job description file
 *     description: Upload a job description file (PDF, DOC, DOCX, TXT) for parsing
 *     tags:
 *       - Client Job Parsing
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobPostingId
 *         required: true
 *         schema:
 *           type: string
 *         description: The job posting ID
 *       - in: query
 *         name: mode
 *         schema:
 *           type: string
 *           enum: [STRICT, INFERRED, GENERATIVE]
 *           default: INFERRED
 *         description: The parsing mode to use (STRICT for exact parsing, INFERRED for smart parsing, GENERATIVE for AI-enhanced parsing)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Job description uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IJobUploadApiResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Job posting not found
 */
router.post(
  '/:jobPostingId/upload',
  [...clientAuthMiddleware, upload.single('file')],
  jobParsingController.uploadJobDescription
);

/**
 * @openapi
 * /client/job/{jobPostingId}/parsing/task:
 *   get:
 *     summary: Get job parsing task status for the specific job posting
 *     description: Get the status of a job parsing task for the specific job posting
 *     tags:
 *       - Client Job Parsing
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobPostingId
 *         required: true
 *         schema:
 *           type: string
 *         description: The job posting ID
 *     responses:
 *       200:
 *         description: Task status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IJobParsingTaskGetApiResponse'
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Task not found
 */
router.get(
  '/:jobPostingId/task',
  [...clientAuthMiddleware],
  jobParsingController.getParsingTaskForJobPosting
);

export default router;
