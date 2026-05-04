import { Router } from 'express';
import {
  requireAuth,
  requireActiveUser,
  requireCandidateAccess,
} from '@/middleware';
import { CandidateResumeAssessmentService } from '@/services/candidate/resume.assessment.service';
import { ResumeAssessmentController } from '@/controllers/candidate/resume.assessment.controller';

const router = Router({ mergeParams: true });

const resumeAssessmentService = new CandidateResumeAssessmentService();
const resumeAssessmentController = new ResumeAssessmentController(
  resumeAssessmentService
);

// Candidate auth middleware - applies to all resume assessment routes
const candidateAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireCandidateAccess,
];

/**
 * @openapi
 * /candidate/resume/assessment/start:
 *   post:
 *     summary: Start resume assessment
 *     description: Start a new resume assessment task
 *     tags:
 *       - Candidate Resume Assessment
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Assessment task started successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IResumeAssessmentStartApiResponse'
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.post(
  '/start',
  [...candidateAuthMiddleware],
  resumeAssessmentController.startAssessment
);

/**
 * @openapi
 * /candidate/resume/assessment/task:
 *   get:
 *     summary: Get resume assessment task status for the current candidate
 *     description: Get the status of a resume assessment task for the current candidate
 *     tags:
 *       - Candidate Resume Assessment
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Task status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IResumeAssessmentTaskGetApiResponse'
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
  resumeAssessmentController.getAssessmentTaskForCandidate
);

/**
 * @openapi
 * /candidate/resume/assessment/task/{taskId}:
 *   get:
 *     summary: Get resume assessment task status
 *     description: Get the status of a resume assessment task
 *     tags:
 *       - Candidate Resume Assessment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IAssessmentTaskIdParams'
 *     responses:
 *       200:
 *         description: Task status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IResumeAssessmentTaskGetApiResponse'
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
  resumeAssessmentController.getAssessmentTask
);

/**
 * @openapi
 * /candidate/resume/assessment/latest:
 *   get:
 *     summary: Get latest resume assessment results
 *     description: Get the latest results of a resume assessment
 *     tags:
 *       - Candidate Resume Assessment
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Assessment results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IResumeAssessmentGetLatestApiResponse'
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Assessment not found
 */
router.get(
  '/latest',
  [...candidateAuthMiddleware],
  resumeAssessmentController.getLatestAssessment
);

/**
 * @openapi
 * /candidate/resume/assessment/{candidateId}/latest:
 *   get:
 *     summary: Get latest resume assessment results for a candidate
 *     description: Get the latest results of a resume assessment for a specific candidate
 *     tags:
 *       - Candidate Resume Assessment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IAssessmentCandidateIdParams'
 *     responses:
 *       200:
 *         description: Assessment results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IResumeAssessmentGetLatestApiResponse'
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Assessment not found
 */
router.get(
  '/:candidateId/latest',
  [...candidateAuthMiddleware],
  resumeAssessmentController.getLatestAssessmentByCandidateId
);

/**
 * @openapi
 * /candidate/resume/assessment/all:
 *   get:
 *     summary: Get all resume assessment results
 *     description: Get all results of a resume assessment
 *     tags:
 *       - Candidate Resume Assessment
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Assessment results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IResumeAssessmentGetAllApiResponse'
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get(
  '/all',
  [...candidateAuthMiddleware],
  resumeAssessmentController.getAllAssessments
);

/**
 * @openapi
 * /candidate/resume/assessment/{assessmentId}:
 *   get:
 *     summary: Get resume assessment results
 *     description: Get the results of a resume assessment
 *     tags:
 *       - Candidate Resume Assessment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IAssessmentIdParams'
 *     responses:
 *       200:
 *         description: Assessment results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IResumeAssessmentGetApiResponse'
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Assessment not found
 */
router.get(
  '/:assessmentId',
  [...candidateAuthMiddleware],
  resumeAssessmentController.getAssessment
);

export default router;
