/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerCandidateDetails:
 *       type: object
 *       description: Simplified candidate details for job applications
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Candidate ID
 *         name:
 *           type: string
 *           description: Candidate name
 *         email:
 *           type: string
 *           format: email
 *           description: Candidate email
 *         jobTitle:
 *           type: string
 *           description: Candidate job title
 */

import { ApplicationStatusEnum } from '../../common/enums';

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerJobApplication:
 *       type: object
 *       description: Domain model representing a partner job application
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the application
 *         partnerId:
 *           type: string
 *           format: uuid
 *           description: ID of the partner making the application
 *         jobPostingId:
 *           type: string
 *           format: uuid
 *           description: ID of the job posting
 *         candidateId:
 *           type: string
 *           format: uuid
 *           description: ID of the candidate being submitted
 *         status:
 *           $ref: '#/components/schemas/ApplicationStatusEnum'
 *           description: Current status of the application
 *         notes:
 *           type: string
 *           description: Optional notes from the partner
 *         appliedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the application was submitted
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the application was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the application was last updated
 */
export interface IPartnerJobApplication {
  id: string;
  partnerId: string;
  jobPostingId: string;
  candidateId: string;
  status: ApplicationStatusEnum;
  notes?: string;
  appliedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerJobApplicationCreate:
 *       type: object
 *       required:
 *         - candidates
 *       description: Payload for creating a partner job application
 *       properties:
 *         candidates:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - candidateId
 *             properties:
 *               candidateId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the partner's candidate to submit
 *               comment:
 *                 type: string
 *                 description: Optional note to the client
 */
export interface IPartnerJobApplicationCreate {
  candidates: Array<{
    candidateId: string;
    comment?: string;
  }>;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerJobApplicationDetails:
 *       type: object
 *       description: Detailed partner job application with related data
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         partnerId:
 *           type: string
 *           format: uuid
 *         jobPostingId:
 *           type: string
 *           format: uuid
 *         candidateId:
 *           type: string
 *           format: uuid
 *         status:
 *           $ref: '#/components/schemas/ApplicationStatusEnum'
 *         notes:
 *           type: string
 *         appliedAt:
 *           type: string
 *           format: date-time
 *         candidate:
 *           $ref: '#/components/schemas/IPartnerCandidateDetails'
 *         jobPosting:
 *           $ref: '#/components/schemas/IPartnerJobPostingList'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
export interface IPartnerJobApplicationDetails {
  id: string;
  partnerId: string;
  jobPostingId: string;
  candidateId: string;
  status: ApplicationStatusEnum;
  notes?: string;
  appliedAt: Date;
  candidate: {
    id: string;
    name: string;
    email: string;
    jobTitle?: string;
  };
  jobPosting: {
    id: string;
    title: string;
    company: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerJobApplicationFilterQuery:
 *       type: object
 *       description: Query parameters for filtering partner job applications
 *       properties:
 *         status:
 *           $ref: '#/components/schemas/ApplicationStatusEnum'
 *         jobPostingId:
 *           type: string
 *           format: uuid
 *           description: Filter by job posting ID
 *         candidateId:
 *           type: string
 *           format: uuid
 *           description: Filter by candidate ID
 *         appliedAfter:
 *           type: string
 *           format: date-time
 *           description: Filter applications submitted after this date
 *         appliedBefore:
 *           type: string
 *           format: date-time
 *           description: Filter applications submitted before this date
 *         search:
 *           type: string
 *           description: Search term to match against candidate name, email, job title, or job posting title
 */
export interface IPartnerJobApplicationFilterQuery {
  status?: ApplicationStatusEnum;
  jobPostingId?: string;
  candidateId?: string;
  appliedAfter?: Date;
  appliedBefore?: Date;
  search?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerJobApplicationWithdraw:
 *       type: object
 *       description: Payload for withdrawing a partner job application
 *       properties:
 *         reason:
 *           type: string
 *           description: Optional reason for withdrawing the application
 */
export interface IPartnerJobApplicationWithdraw {
  reason?: string;
}

/**
 * Helper function to convert database models to domain models
 */
export function toPartnerJobApplicationDomain(
  application: any
): IPartnerJobApplication {
  return {
    id: application.id,
    partnerId: application.partnerId,
    jobPostingId: application.jobPostingId,
    candidateId: application.candidateId,
    status: application.status,
    notes: application.notes,
    appliedAt: application.appliedAt,
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
  };
}

/**
 * Helper function to convert database models with relations to detailed domain models
 */
export function toPartnerJobApplicationDetailsDomain(
  application: any
): IPartnerJobApplicationDetails {
  return {
    id: application.id,
    partnerId: application.partnerId,
    jobPostingId: application.jobPostingId,
    candidateId: application.candidateId,
    status: application.status,
    notes: application.notes,
    appliedAt: application.appliedAt,
    candidate: {
      id: application.candidate.id,
      name: application.candidate.user.name,
      email: application.candidate.user.email,
      jobTitle: application.candidate.user.jobTitle,
    },
    jobPosting: {
      id: application.jobPosting.id,
      title: application.jobPosting.title,
      company: application.jobPosting.client?.company?.name || 'Company',
    },
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
  };
}
