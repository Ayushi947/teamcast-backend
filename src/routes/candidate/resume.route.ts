import { Router } from 'express';
import { ResumeController } from '@/controllers/candidate/resume.controller';
import { CandidateResumeService } from '@/services/candidate/resume.service';
import {
  requireAuth,
  requireActiveUser,
  validateRequest,
  requireCandidateAccess,
} from '@/middleware';
import {
  resumeSocialUpdateValidator,
  resumeCertificationCreateValidator,
  resumeEducationCreateValidator,
  resumeExperienceCreateValidator,
  resumeProjectCreateValidator,
  resumeUpdateValidator,
  resumeCertificationUpdateValidator,
  resumeEducationUpdateValidator,
  resumeProjectUpdateValidator,
  resumeExperienceUpdateValidator,
} from '@/shared/validators/candidate/resume.validator';
import { StorageFactory } from '@/services/helpers/storage/storage.factory';
import { CandidateProfileService } from '@/services/candidate/profile.service';

/**
 * This router is used for both:
 * 1. /candidate/resume - Direct access to current candidate's resume
 */
const router = Router({ mergeParams: true });

// Initialize services and controller
const storageService = StorageFactory.getInstance().getProvider();
const profileService = new CandidateProfileService(storageService);

const resumeService = new CandidateResumeService(
  profileService,
  storageService
);
const resumeController = new ResumeController(resumeService);

// Candidate auth middleware - applies to all resume routes
const candidateAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireCandidateAccess,
];

/**
 * @openapi
 * /candidate/resume/public/{candidateId}:
 *   get:
 *     summary: Get candidate's public resume
 *     description: Retrieves the resume information for the specified candidate.
 *     tags:
 *       - Candidate Resume
 *     parameters:
 *       - $ref: '#/components/parameters/ICandidateIdParams'
 *     responses:
 *       200:
 *         description: Candidate resume retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IResumePublicGetApiResponse'
 *       404:
 *         description: Candidate resume not found
 */
router.get('/public/:candidateId', resumeController.getPublicResume);

/**
 * @openapi
 * /candidate/resume:
 *   get:
 *     summary: Get candidate resume
 *     description: Retrieves the resume information for the specified candidate.
 *     tags:
 *       - Candidate Resume
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Candidate resume retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IResumeGetApiResponse'
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Candidate resume not found
 */
router.get('/', [...candidateAuthMiddleware], resumeController.getResume);

/**
 * @openapi
 * /candidate/resume:
 *   patch:
 *     summary: Update candidate resume
 *     description: Updates the resume information for the candidate. The authenticated user must be either the same candidate or an admin.
 *     tags:
 *       - Candidate Resume
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IResumeUpdate'
 *     responses:
 *       200:
 *         description: Resume updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IResumeUpdateApiResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Resume not found
 */
router.patch(
  '/',
  [...candidateAuthMiddleware, validateRequest(resumeUpdateValidator)],
  resumeController.updateResume
);

/**
 * @openapi
 * /candidate/resume/social:
 *   get:
 *     summary: Get resume social links
 *     description: Retrieves the social media links from the candidate's resume. The authenticated user must be either the same candidate or an admin.
 *     tags:
 *       - Candidate Resume
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Social links retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IResumeSocialGetApiResponse'
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Resume social links not found
 */
router.get(
  '/social',
  candidateAuthMiddleware,
  resumeController.getResumeSocial
);

/**
 * @openapi
 * /candidate/resume/social:
 *   patch:
 *     summary: Update resume social links
 *     description: Updates the social media links in the candidate's resume. The authenticated user must be either the same candidate or an admin.
 *     tags:
 *       - Candidate Resume
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IResumeSocialUpdate'
 *     responses:
 *       200:
 *         description: Social links updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IResumeSocialUpdateApiResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Resume not found
 */
router.patch(
  '/social',
  [...candidateAuthMiddleware, validateRequest(resumeSocialUpdateValidator)],
  resumeController.updateResumeSocial
);

/**
 * @openapi
 * /candidate/resume/education:
 *   get:
 *     summary: Get all education entries from resume
 *     description: Get all education entries from a candidate's resume
 *     tags:
 *       - Candidate Resume
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved education entries
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IResumeEducationListGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Resume not found
 */
router.get(
  '/education',
  [...candidateAuthMiddleware],
  resumeController.getEducationList
);

/**
 * @openapi
 * /candidate/resume/education:
 *   post:
 *     summary: Add education to resume
 *     description: Adds a new education entry to the candidate's resume. The authenticated user must be either the same candidate or an admin.
 *     tags:
 *       - Candidate Resume
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IResumeEducationCreate'
 *     responses:
 *       201:
 *         description: Education added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IResumeEducationCreateApiResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Resume not found
 */
router.post(
  '/education',
  [...candidateAuthMiddleware, validateRequest(resumeEducationCreateValidator)],
  resumeController.addEducation
);

/**
 * @openapi
 * /candidate/resume/education/{educationId}:
 *   get:
 *     summary: Get education from resume
 *     description: Retrieves a specific education entry from the candidate's resume. The authenticated user must be either the same candidate or an admin.
 *     tags:
 *       - Candidate Resume
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IEducationIdParams'
 *     responses:
 *       200:
 *         description: Education retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IResumeEducationGetApiResponse'
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Education or resume not found
 */
router.get(
  '/education/:educationId',
  [...candidateAuthMiddleware],
  resumeController.getEducation
);

/**
 * @openapi
 * /candidate/resume/education/{educationId}:
 *   patch:
 *     summary: Update education in resume
 *     description: Updates an existing education entry in the candidate's resume. The authenticated user must be either the same candidate or an admin.
 *     tags:
 *       - Candidate Resume
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IEducationIdParams'
 *         schema:
 *           type: string
 *         description: ID of the education to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IResumeEducationUpdate'
 *     responses:
 *       200:
 *         description: Education updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IResumeEducationUpdateApiResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Education or resume not found
 */
router.patch(
  '/education/:educationId',
  [...candidateAuthMiddleware, validateRequest(resumeEducationUpdateValidator)],
  resumeController.updateEducation
);

/**
 * @openapi
 * /candidate/resume/education/{educationId}:
 *   delete:
 *     summary: Delete education from resume
 *     description: Deletes a specific education entry from the candidate's resume. The authenticated user must be either the same candidate or an admin.
 *     tags:
 *       - Candidate Resume
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IEducationIdParams'
 *     responses:
 *       200:
 *         description: Education deleted successfully
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Education or resume not found
 */
router.delete(
  '/education/:educationId',
  [...candidateAuthMiddleware],
  resumeController.deleteEducation
);

/**
 * @openapi
 * /candidate/resume/experience:
 *   get:
 *     summary: Get all experience entries from resume
 *     description: Get all experience entries from a candidate's resume
 *     tags:
 *       - Candidate Resume
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved experience entries
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IResumeExperienceListGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Resume not found
 */
router.get(
  '/experience',
  [...candidateAuthMiddleware],
  resumeController.getExperienceList
);

/**
 * @openapi
 * /candidate/resume/experience:
 *   post:
 *     summary: Add experience to resume
 *     description: Adds a new work experience to the candidate's resume. The authenticated user must be either the same candidate or an admin.
 *     tags:
 *       - Candidate Resume
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IResumeExperienceCreate'
 *     responses:
 *       201:
 *         description: Experience added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IResumeExperienceCreateApiResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Resume not found
 */
router.post(
  '/experience',
  [
    ...candidateAuthMiddleware,
    validateRequest(resumeExperienceCreateValidator),
  ],
  resumeController.addExperience
);

/**
 * @openapi
 * /candidate/resume/experience/{experienceId}:
 *   get:
 *     summary: Get experience from resume
 *     description: Retrieves a specific experience entry from the candidate's resume. The authenticated user must be either the same candidate or an admin.
 *     tags:
 *       - Candidate Resume
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IExperienceIdParams'
 *     responses:
 *       200:
 *         description: Experience retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IResumeExperienceGetApiResponse'
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Experience or resume not found
 */
router.get(
  '/experience/:experienceId',
  [...candidateAuthMiddleware],
  resumeController.getExperience
);

/**
 * @openapi
 * /candidate/resume/experience/{experienceId}:
 *   patch:
 *     summary: Update experience in resume
 *     description: Updates an existing experience entry in the candidate's resume. The authenticated user must be either the same candidate or an admin.
 *     tags:
 *       - Candidate Resume
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IExperienceIdParams'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IResumeExperienceUpdate'
 *     responses:
 *       200:
 *         description: Experience updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IResumeExperienceGetApiResponse'
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Experience or resume not found
 */
router.patch(
  '/experience/:experienceId',
  [
    ...candidateAuthMiddleware,
    validateRequest(resumeExperienceUpdateValidator),
  ],
  resumeController.updateExperience
);

/**
 * @openapi
 * /candidate/resume/experience/{experienceId}:
 *   delete:
 *     summary: Delete experience from resume
 *     description: Deletes a specific experience entry from the candidate's resume. The authenticated user must be either the same candidate or an admin.
 *     tags:
 *       - Candidate Resume
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IExperienceIdParams'
 *     responses:
 *       200:
 *         description: Experience deleted successfully
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Experience or resume not found
 */
router.delete(
  '/experience/:experienceId',
  [...candidateAuthMiddleware],
  resumeController.deleteExperience
);

/**
 * @openapi
 * /candidate/resume/experience/{experienceId}/project:
 *   post:
 *     summary: Add project to experience
 *     description: Adds a new project to a work experience in the candidate's resume. The authenticated user must be either the same candidate or an admin.
 *     tags:
 *       - Candidate Resume
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IExperienceIdParams'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IResumeProjectCreate'
 *     responses:
 *       201:
 *         description: Project added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IResumeProjectCreateApiResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Resume or experience not found
 */
router.post(
  '/experience/:experienceId/project',
  [...candidateAuthMiddleware, validateRequest(resumeProjectCreateValidator)],
  resumeController.addProject
);

/**
 * @openapi
 * /candidate/resume/experience/{experienceId}/project:
 *   get:
 *     summary: Get all projects for a specific experience
 *     description: Get all projects associated with a specific experience entry in a candidate's resume
 *     tags:
 *       - Candidate Resume
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IExperienceIdParams'
 *     responses:
 *       200:
 *         description: Successfully retrieved projects
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IResumeProjectListGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Resume or experience not found
 */
router.get(
  '/experience/:experienceId/project',
  [...candidateAuthMiddleware],
  resumeController.getProjectList
);

/**
 * @openapi
 * /candidate/resume/experience/{experienceId}/project/{projectId}:
 *   get:
 *     summary: Get project from experience
 *     description: Retrieves a specific project from a work experience in the candidate's resume. The authenticated user must be either the same candidate or an admin.
 *     tags:
 *       - Candidate Resume
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IExperienceIdParams'
 *       - $ref: '#/components/parameters/IProjectIdParams'
 *     responses:
 *       200:
 *         description: Project retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IResumeProjectGetApiResponse'
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Resume, experience, or project not found
 */
router.get(
  '/experience/:experienceId/project/:projectId',
  [...candidateAuthMiddleware],
  resumeController.getProject
);

/**
 * @openapi
 * /candidate/resume/experience/{experienceId}/project/{projectId}:
 *   patch:
 *     summary: Update project in experience
 *     description: Updates a specific project in a work experience in the candidate's resume. The authenticated user must be either the same candidate or an admin.
 *     tags:
 *       - Candidate Resume
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IExperienceIdParams'
 *       - $ref: '#/components/parameters/IProjectIdParams'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IResumeProjectUpdate'
 *     responses:
 *       200:
 *         description: Project updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IResumeProjectUpdateApiResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Resume, experience, or project not found
 */
router.patch(
  '/experience/:experienceId/project/:projectId',
  [...candidateAuthMiddleware, validateRequest(resumeProjectUpdateValidator)],
  resumeController.updateProject
);

/**
 * @openapi
 * /candidate/resume/experience/{experienceId}/project/{projectId}:
 *   delete:
 *     summary: Delete project from experience
 *     description: Deletes a specific project from a work experience in the candidate's resume. The authenticated user must be either the same candidate or an admin.
 *     tags:
 *       - Candidate Resume
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IExperienceIdParams'
 *       - $ref: '#/components/parameters/IProjectIdParams'
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Resume, experience, or project not found
 */
router.delete(
  '/experience/:experienceId/project/:projectId',
  [...candidateAuthMiddleware],
  resumeController.deleteProject
);

/**
 * @openapi
 * /candidate/resume/certification:
 *   get:
 *     summary: Get all certifications from resume
 *     description: Retrieves all certifications from the candidate's resume. The authenticated user must be either the same candidate or an admin.
 *     tags:
 *       - Candidate Resume
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Certifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IResumeCertificationsGetApiResponse'
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Resume not found
 */
router.get(
  '/certification',
  [...candidateAuthMiddleware],
  resumeController.getCertifications
);

/**
 * @openapi
 * /candidate/resume/certification:
 *   post:
 *     summary: Add certification to resume
 *     description: Adds a new certification to the candidate's resume. The authenticated user must be either the same candidate or an admin.
 *     tags:
 *       - Candidate Resume
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IResumeCertificationCreate'
 *     responses:
 *       201:
 *         description: Certification added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IResumeCertificationCreateApiResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Resume not found
 */
router.post(
  '/certification',
  [
    ...candidateAuthMiddleware,
    validateRequest(resumeCertificationCreateValidator),
  ],
  resumeController.addCertification
);

/**
 * @openapi
 * /candidate/resume/certification/{certificationId}:
 *   get:
 *     summary: Get certification from resume
 *     description: Retrieves a specific certification from the candidate's resume. The authenticated user must be either the same candidate or an admin.
 *     tags:
 *       - Candidate Resume
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ICertificationIdParams'
 *     responses:
 *       200:
 *         description: Certification retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IResumeCertificationGetApiResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Certification or resume not found
 */
router.get(
  '/certification/:certificationId',
  [...candidateAuthMiddleware],
  resumeController.getCertification
);

/**
 * @openapi
 * /candidate/resume/certification/{certificationId}:
 *   patch:
 *     summary: Update certification in resume
 *     description: Updates an existing certification in the candidate's resume. The authenticated user must be either the same candidate or an admin.
 *     tags:
 *       - Candidate Resume
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ICertificationIdParams'
 *         schema:
 *           type: string
 *         description: ID of the certification to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IResumeCertificationUpdate'
 *     responses:
 *       200:
 *         description: Certification updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IResumeCertificationUpdateApiResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Certification or resume not found
 */
router.patch(
  '/certification/:certificationId',
  [
    ...candidateAuthMiddleware,
    validateRequest(resumeCertificationUpdateValidator),
  ],
  resumeController.updateCertification
);

/**
 * @openapi
 * /candidate/resume/certification/{certificationId}:
 *   delete:
 *     summary: Delete certification from resume
 *     description: Deletes a specific certification from the candidate's resume. The authenticated user must be either the same candidate or an admin.
 *     tags:
 *       - Candidate Resume
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ICertificationIdParams'
 *     responses:
 *       200:
 *         description: Certification deleted successfully
 *       401:
 *         description: Forbidden - Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Certification or resume not found
 */
router.delete(
  '/certification/:certificationId',
  [...candidateAuthMiddleware],
  resumeController.deleteCertification
);

export default router;
