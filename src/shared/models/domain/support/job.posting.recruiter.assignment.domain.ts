import { JobPostingRecruiterAssignmentStatusEnum } from '../../common/enums';

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPostingRecruiterAssignment:
 *       type: object
 *       description: Domain model representing a recruiter assignment to a job posting
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the assignment
 *         jobPostingId:
 *           type: string
 *           format: uuid
 *           description: ID of the assigned job posting
 *         recruiterId:
 *           type: string
 *           format: uuid
 *           description: ID of the assigned recruiter
 *         assignedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the assignment was made
 *         assignedBy:
 *           type: string
 *           format: uuid
 *           description: ID of the user who made the assignment
 *         status:
 *           $ref: '#/components/schemas/JobPostingRecruiterAssignmentStatusEnum'
 *         notes:
 *           type: string
 *           description: Optional notes about the assignment
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the assignment was completed
 *         reassignedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the assignment was reassigned
 *         reassignedReason:
 *           type: string
 *           description: Reason for reassignment
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the record was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the record was last updated
 */
export interface IJobPostingRecruiterAssignment {
  id: string;
  jobPostingId: string;
  recruiterId: string;
  assignedAt: Date;
  assignedBy?: string;
  status: JobPostingRecruiterAssignmentStatusEnum;
  notes?: string;
  completedAt?: Date;
  reassignedAt?: Date;
  reassignedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPostingRecruiterAssignmentWithDetails:
 *       type: object
 *       description: Job posting recruiter assignment with recruiter and job posting details
 *       allOf:
 *         - $ref: '#/components/schemas/IJobPostingRecruiterAssignment'
 *         - type: object
 *           properties:
 *             recruiter:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 jobTitle:
 *                   type: string
 *             jobPosting:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 title:
 *                   type: string
 *                 status:
 *                   type: string
 *                 totalExperience:
 *                   type: number
 *                   description: Required total years of experience for the job
 *                 clientId:
 *                   type: string
 *                   format: uuid
 */
export interface IJobPostingRecruiterAssignmentWithDetails
  extends IJobPostingRecruiterAssignment {
  recruiter: {
    id: string;
    name: string;
    email: string;
    jobTitle?: string;
  };
  jobPosting: {
    id: string;
    title: string;
    status: string;
    totalExperience: number;
    clientId: string;
  };
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPostingRecruiterAssignmentCreate:
 *       type: object
 *       description: Data required to create a new recruiter assignment (automatic)
 *       required:
 *         - jobPostingId
 *       properties:
 *         jobPostingId:
 *           type: string
 *           format: uuid
 *           description: ID of the job posting to assign
 *         assignedBy:
 *           type: string
 *           format: uuid
 *           description: ID of the user making the assignment
 *         notes:
 *           type: string
 *           description: Optional notes about the assignment
 */
export interface IJobPostingRecruiterAssignmentCreate {
  jobPostingId: string;
  assignedBy?: string;
  recruiterId?: string;
  notes?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IManualRecruiterAssignmentCreate:
 *       type: object
 *       description: Data required to manually assign a recruiter to a job posting
 *       required:
 *         - jobPostingId
 *         - recruiterId
 *       properties:
 *         jobPostingId:
 *           type: string
 *           format: uuid
 *           description: ID of the job posting to assign
 *         recruiterId:
 *           type: string
 *           format: uuid
 *           description: ID of the recruiter to assign
 *         assignedBy:
 *           type: string
 *           format: uuid
 *           description: ID of the user making the assignment
 *         notes:
 *           type: string
 *           description: Optional notes about the assignment
 */
export interface IManualRecruiterAssignmentCreate {
  jobPostingId: string;
  recruiterId: string;
  assignedBy?: string;
  notes?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPostingRecruiterAssignmentUpdate:
 *       type: object
 *       description: Data for updating a recruiter assignment
 *       properties:
 *         status:
 *           $ref: '#/components/schemas/JobPostingRecruiterAssignmentStatusEnum'
 *         notes:
 *           type: string
 *           description: Optional notes about the assignment
 *         reassignedReason:
 *           type: string
 *           description: Reason for reassignment if status is REASSIGNED
 */
export interface IJobPostingRecruiterAssignmentUpdate {
  status?: JobPostingRecruiterAssignmentStatusEnum;
  notes?: string;
  reassignedReason?: string;
}

/**
 * Convert Prisma job posting recruiter assignment to domain model
 */
export const toJobPostingRecruiterAssignmentDomain = (
  assignment: any
): IJobPostingRecruiterAssignment => {
  return {
    id: assignment.id,
    jobPostingId: assignment.jobPostingId,
    recruiterId: assignment.recruiterId,
    assignedAt: assignment.assignedAt,
    assignedBy: assignment.assignedBy,
    status: assignment.status,
    notes: assignment.notes,
    completedAt: assignment.completedAt,
    reassignedAt: assignment.reassignedAt,
    reassignedReason: assignment.reassignedReason,
    createdAt: assignment.createdAt,
    updatedAt: assignment.updatedAt,
  };
};

/**
 * Convert Prisma job posting recruiter assignment with details to domain model
 */
export const toJobPostingRecruiterAssignmentWithDetailsDomain = (
  assignment: any
): IJobPostingRecruiterAssignmentWithDetails => {
  return {
    ...toJobPostingRecruiterAssignmentDomain(assignment),
    recruiter: {
      id: assignment.recruiter.id,
      name: assignment.recruiter.user.name,
      email: assignment.recruiter.user.email,
      jobTitle: assignment.recruiter.user.jobTitle,
    },
    jobPosting: {
      id: assignment.jobPosting.id,
      title: assignment.jobPosting.title,
      status: assignment.jobPosting.status,
      totalExperience: assignment.jobPosting.totalExperience,
      clientId: assignment.jobPosting.clientId,
    },
  };
};
