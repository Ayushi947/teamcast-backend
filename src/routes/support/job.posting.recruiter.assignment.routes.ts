import { Router } from 'express';
import { JobPostingRecruiterAssignmentController } from '@/controllers/support/job.posting.recruiter.assignment.controller';
import { JobPostingRecruiterAssignmentService } from '@/services/support/job.posting.recruiter.assignment.service';
import {
  requireAuth,
  requireActiveUser,
  requireRole,
  validateRequest,
  requireUserType,
} from '@/middleware';
import {
  jobPostingRecruiterAssignmentCreateValidator,
  jobPostingRecruiterAssignmentGetValidator,
  jobPostingRecruiterAssignmentUpdateValidator,
  jobPostingRecruiterAssignmentReassignValidator,
  jobPostingRecruiterAssignmentListValidator,
  jobPostingRecruiterAssignmentCompleteValidator,
  jobPostingRecruiterAssignmentAvailableRecruitersValidator,
  jobPostingRecruiterAssignmentJobPostingsValidator,
  manualRecruiterAssignmentCreateValidator,
} from '@/shared/validators/support/job.posting.recruiter.assignment.validator';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';

const router = Router();

// Initialize services and controller
const recruiterAssignmentService = new JobPostingRecruiterAssignmentService();
const recruiterAssignmentController =
  new JobPostingRecruiterAssignmentController(recruiterAssignmentService);

// All routes require authentication and active user
router.use(
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.SUPPORT])
);

// Admin-only middleware - applies to all routes (HR, Admin, and Recruiters can manage assignments)
const adminOnlyMiddleware = [
  requireAuth,
  requireActiveUser,
  requireRole([
    UserRoleEnum.ADMIN,
    UserRoleEnum.RECRUITER,
    UserRoleEnum.ACCOUNT_MANAGER,
  ]),
];

/**
 * @openapi
 * /support/job-postings/recruiter-assignments:
 *   post:
 *     summary: Create recruiter assignment
 *     description: Manually assign a recruiter to a job posting (Admin and HR only)
 *     tags:
 *       - Job Posting Recruiter Assignments
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IJobPostingRecruiterAssignmentCreate'
 *     responses:
 *       201:
 *         description: Recruiter assignment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IJobPostingRecruiterAssignmentCreateApiResponse'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.post(
  '/',
  [
    ...adminOnlyMiddleware,
    validateRequest(jobPostingRecruiterAssignmentCreateValidator),
  ],
  recruiterAssignmentController.createAssignment
);

/**
 * @openapi
 * /support/job-postings/recruiter-assignments/manual:
 *   post:
 *     summary: Manually assign a recruiter to a job posting
 *     description: Manually assign a specific recruiter to a job posting (Admin, HR, and Account Managers only)
 *     tags:
 *       - Job Posting Recruiter Assignments
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IManualRecruiterAssignmentCreate'
 *     responses:
 *       201:
 *         description: Recruiter manually assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IManualRecruiterAssignmentCreateApiResponse'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Job posting or recruiter not found
 */
router.post(
  '/manual',
  [
    ...adminOnlyMiddleware,
    validateRequest(manualRecruiterAssignmentCreateValidator),
  ],
  recruiterAssignmentController.manuallyAssignRecruiter
);

/**
 * @openapi
 * /support/job-postings/recruiter-assignments/job-posting/{jobPostingId}:
 *   get:
 *     summary: Get recruiter assignment for job posting
 *     description: Get the current recruiter assignment for a specific job posting
 *     tags:
 *       - Job Posting Recruiter Assignments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: jobPostingId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the job posting
 *     responses:
 *       200:
 *         description: Recruiter assignment retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IJobPostingRecruiterAssignmentGetApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job posting or assignment not found
 */
router.get(
  '/job-posting/:jobPostingId',
  [
    ...adminOnlyMiddleware,
    validateRequest(jobPostingRecruiterAssignmentGetValidator),
  ],
  recruiterAssignmentController.getAssignmentForJobPosting
);

/**
 * @openapi
 * /support/job-postings/recruiter-assignments/{assignmentId}:
 *   patch:
 *     summary: Update recruiter assignment
 *     description: Update a recruiter assignment status or details (Admin and HR only)
 *     tags:
 *       - Job Posting Recruiter Assignments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: assignmentId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the assignment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IJobPostingRecruiterAssignmentUpdate'
 *     responses:
 *       200:
 *         description: Recruiter assignment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IJobPostingRecruiterAssignmentUpdateApiResponse'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Assignment not found
 */
router.patch(
  '/:assignmentId',
  [
    ...adminOnlyMiddleware,
    validateRequest(jobPostingRecruiterAssignmentUpdateValidator),
  ],
  recruiterAssignmentController.updateAssignment
);

/**
 * @openapi
 * /support/job-postings/recruiter-assignments/{assignmentId}/reassign:
 *   post:
 *     summary: Reassign recruiter
 *     description: Reassign a job posting to a different recruiter (Admin and HR only)
 *     tags:
 *       - Job Posting Recruiter Assignments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: assignmentId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the assignment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newRecruiterId
 *             properties:
 *               newRecruiterId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the new recruiter
 *               reason:
 *                 type: string
 *                 description: Reason for reassignment
 *     responses:
 *       200:
 *         description: Recruiter reassigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IJobPostingRecruiterAssignmentReassignApiResponse'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Assignment not found
 */
router.post(
  '/:assignmentId/reassign',
  [
    ...adminOnlyMiddleware,
    validateRequest(jobPostingRecruiterAssignmentReassignValidator),
  ],
  recruiterAssignmentController.reassignRecruiter
);

/**
 * @openapi
 * /support/job-postings/recruiter-assignments/{assignmentId}/complete:
 *   post:
 *     summary: Complete recruiter assignment
 *     description: Mark a recruiter assignment as completed (Admin, HR, and assigned Recruiter)
 *     tags:
 *       - Job Posting Recruiter Assignments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: assignmentId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the assignment
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 description: Completion notes
 *     responses:
 *       200:
 *         description: Recruiter assignment completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IJobPostingRecruiterAssignmentCompleteApiResponse'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Assignment not found
 */
router.post(
  '/:assignmentId/complete',
  [
    ...adminOnlyMiddleware,
    validateRequest(jobPostingRecruiterAssignmentCompleteValidator),
  ],
  recruiterAssignmentController.completeAssignment
);

/**
 * @openapi
 * /support/job-postings/recruiter-assignments:
 *   get:
 *     summary: List recruiter assignments
 *     description: Get a list of recruiter assignments with optional filtering
 *     tags:
 *       - Job Posting Recruiter Assignments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: recruiterId
 *         in: query
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by recruiter ID
 *       - name: status
 *         in: query
 *         schema:
 *           $ref: '#/components/schemas/JobPostingRecruiterAssignmentStatusEnum'
 *         description: Filter by assignment status
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of recruiter assignments
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IJobPostingRecruiterAssignmentListApiResponse'
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
  [
    ...adminOnlyMiddleware,
    validateRequest(jobPostingRecruiterAssignmentListValidator),
  ],
  recruiterAssignmentController.listAssignments
);

/**
 * @openapi
 * /support/job-postings/recruiter-assignments/account-managers/{accountManagerId}/available-recruiters:
 *   get:
 *     summary: Get available recruiters for an account manager
 *     description: Get all recruiters assigned to a specific account manager (Support team only)
 *     tags:
 *       - Job Posting Recruiter Assignments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: accountManagerId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the account manager
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortBy'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortOrder'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSearch'
 *     responses:
 *       200:
 *         description: Available recruiters retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IJobPostingRecruiterAssignmentAvailableRecruitersApiResponse'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Account manager not found
 */
router.get(
  '/account-managers/:accountManagerId/available-recruiters',
  [
    ...adminOnlyMiddleware,
    validateRequest(jobPostingRecruiterAssignmentAvailableRecruitersValidator),
  ],
  recruiterAssignmentController.getAvailableRecruitersForAccountManager
);

/**
 * @openapi
 * /support/job-postings/recruiter-assignments/recruiters/{recruiterId}/job-postings:
 *   get:
 *     summary: Get job postings assigned to a recruiter
 *     description: Get all active job postings assigned to a specific recruiter
 *     tags:
 *       - Job Posting Recruiter Assignments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: recruiterId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the recruiter
 *       - $ref: '#/components/parameters/IPaginationRequestParamsPage'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsLimit'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortBy'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSortOrder'
 *       - $ref: '#/components/parameters/IPaginationRequestParamsSearch'
 *       - name: status
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by job posting status
 *     responses:
 *       200:
 *         description: Job postings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IJobPostingRecruiterAssignmentJobPostingsApiResponse'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Recruiter not found
 */
router.get(
  '/recruiters/:recruiterId/job-postings',
  [
    ...adminOnlyMiddleware,
    validateRequest(jobPostingRecruiterAssignmentJobPostingsValidator),
  ],
  recruiterAssignmentController.getJobPostingsForRecruiter
);

export default router;
