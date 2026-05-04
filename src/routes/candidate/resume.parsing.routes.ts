import { Router } from 'express';
import multer from 'multer';
import {
  requireAuth,
  requireActiveUser,
  requireCandidateAccess,
  validateRequest,
} from '@/middleware';
import { ResumeParsingController } from '@/controllers/candidate/resume.parsing.controller';
import { CandidateResumeParsingService } from '@/services/candidate/resume.parsing.service';
import { StorageFactory } from '@/services/helpers/storage/storage.factory';
import { ResumeParserFactory } from '@/services/helpers/ai.resume.parser/resume.parser.factory';
import {
  resumePublicParsingUploadValidator,
  resumePublicParsingTaskIdValidator,
  resumePublicParsingGetResumeValidator,
} from '@/shared/validators/candidate/resume.public.parsing.validator';

/**
 * This router is used for both:
 * 1. /candidate/resume - Direct access to current candidate's resume
 */
const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Initialize services
const storageProvider = StorageFactory.getInstance().getProvider();
const parserProvider = ResumeParserFactory.getInstance().getProvider();
const resumeParsingService = new CandidateResumeParsingService(
  storageProvider,
  parserProvider
);

// Initialize controller
const resumeParsingController = new ResumeParsingController(
  resumeParsingService
);

// Candidate auth middleware - applies to all resume parsing routes
const candidateAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireCandidateAccess,
];

/**
 * @openapi
 * /candidate/resume/parsing/upload:
 *   post:
 *     summary: Upload resume file
 *     description: Upload a resume file (PDF) for parsing
 *     tags:
 *       - Candidate Resume Parsing
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Resume uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IResumeUploadApiResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.post(
  '/upload',
  [...candidateAuthMiddleware, upload.single('file')],
  resumeParsingController.uploadResume
);

/**
 * @openapi
 * /candidate/resume/parsing/task:
 *   get:
 *     summary: Get resume parsing task status for the current candidate
 *     description: Get the status of a resume parsing task for the current candidate
 *     tags:
 *       - Candidate Resume Parsing
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Task status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IResumeParsingTaskGetApiResponse'
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Task not found
 */
router.get(
  '/task',
  [...candidateAuthMiddleware],
  resumeParsingController.getParsingTaskForCandidate
);

/**
 * @openapi
 * /candidate/resume/parsing/task/{taskId}:
 *   get:
 *     summary: Get resume parsing task status
 *     description: Get the status of a resume parsing task
 *     tags:
 *       - Candidate Resume Parsing
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IParsingTaskIdParams'
 *     responses:
 *       200:
 *         description: Task status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IResumeParsingTaskGetApiResponse'
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Task not found
 */
router.get(
  '/task/:taskId',
  [...candidateAuthMiddleware],
  resumeParsingController.getParsingTask
);

/**
 * @openapi
 * /candidate/resume/parsing/task/{taskId}/resume:
 *   get:
 *     summary: Get parsed resume
 *     description: Get the parsed resume for a resume parsing task
 *     tags:
 *       - Candidate Resume Parsing
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IParsingTaskIdParams'
 *     responses:
 *       200:
 *         description: Parsed resume retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IResumeParsingGetParsedResumeApiResponse'
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Task not found
 */
router.get(
  '/task/:taskId/resume',
  [...candidateAuthMiddleware],
  resumeParsingController.getParsedResume
);

/**
 * @openapi
 * /candidate/resume/parsing/public/upload:
 *   post:
 *     summary: Upload resume file for async parsing (public)
 *     description: Upload a resume file (PDF) for async parsing without authentication
 *     tags:
 *       - Candidate Resume Parsing
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
 *         description: Resume upload successful, parsing started
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IResumePublicParsingUploadApiResponse'
 *       400:
 *         description: Invalid input data
 */
router.post(
  '/public/upload',
  [upload.single('file'), validateRequest(resumePublicParsingUploadValidator)],
  resumeParsingController.uploadResumePublic
);

/**
 * @openapi
 * /candidate/resume/parsing/public/{taskId}:
 *   get:
 *     summary: Get public parsing task status
 *     description: Get the status of a public parsing task
 *     tags:
 *       - Candidate Resume Parsing
 *     parameters:
 *       - $ref: '#/components/parameters/IPublicParsingTaskIdParams'
 *     responses:
 *       200:
 *         description: Task status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IResumePublicParsingTaskGetApiResponse'
 *       404:
 *         description: Task not found
 */
router.get(
  '/public/:taskId',
  [validateRequest(resumePublicParsingTaskIdValidator)],
  resumeParsingController.getPublicParsingTask
);

/**
 * @openapi
 * /candidate/resume/parsing/public/{taskId}/resume:
 *   get:
 *     summary: Get parsed resume from public task
 *     description: Get the parsed resume for a public parsing task
 *     tags:
 *       - Candidate Resume Parsing
 *     parameters:
 *       - $ref: '#/components/parameters/IPublicParsingTaskIdParams'
 *     responses:
 *       200:
 *         description: Parsed resume retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IResumePublicParsingGetResumeApiResponse'
 *       400:
 *         description: Task not completed yet
 *       404:
 *         description: Task not found
 */
router.get(
  '/public/:taskId/resume',
  [validateRequest(resumePublicParsingGetResumeValidator)],
  resumeParsingController.getParsedResumeFromPublicTask
);

export default router;
