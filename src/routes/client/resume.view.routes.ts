import express from 'express';

import {
  requireAuth,
  requireActiveUser,
  requireUserType,
  validateRequest,
} from '@/middleware';
import { UserTypeEnum } from '@/shared/models/common/enums';

import { ClientResumeViewService } from '@/services/client/resume.view.service';
import { ClientResumeViewController } from '@/controllers/client/resume.view.controller';
import { clientResumeViewValidator } from '@/shared/validators/client/resume.view.validator';

const router = express.Router();

// Initialize services and controller
const resumeViewService = new ClientResumeViewService();
const resumeViewController = new ClientResumeViewController(resumeViewService);

// Client auth middleware - applies to all resume download routes
const clientAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.CLIENT, UserTypeEnum.SUPPORT]),
];

/**
 * @openapi
 * /client/resume/view/{candidateId}:
 *   get:
 *     summary: View candidate resume
 *     description: Generates a pre-signed URL for viewing a candidate's resume
 *     tags:
 *       - Client Resume View
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: candidateId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the candidate whose resume to view
 *     responses:
 *       200:
 *         description: Resume view URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientResumeViewApiResponse'
 *       400:
 *         description: Invalid candidate ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied to candidate resume view
 *       404:
 *         description: Candidate or resume not found
 */
router.get(
  '/view/:candidateId',
  [...clientAuthMiddleware, validateRequest(clientResumeViewValidator)],
  resumeViewController.viewResume
);

export default router;
