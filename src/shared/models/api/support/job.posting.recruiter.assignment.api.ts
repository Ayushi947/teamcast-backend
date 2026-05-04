import {
  IJobPostingRecruiterAssignment,
  IJobPostingRecruiterAssignmentWithDetails,
  IJobPostingRecruiterAssignmentCreate,
  IJobPostingRecruiterAssignmentUpdate,
  IManualRecruiterAssignmentCreate,
} from '../../domain/support/job.posting.recruiter.assignment.domain';
import {
  IApiRequest,
  IApiResponse,
  IPaginatedResponse,
} from '../common/common.api';

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPostingRecruiterAssignmentCreateApiRequest:
 *       type: object
 *       description: Request to create a recruiter assignment
 *       required:
 *         - data
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/IJobPostingRecruiterAssignmentCreate'
 */
export type IJobPostingRecruiterAssignmentCreateApiRequest =
  IApiRequest<IJobPostingRecruiterAssignmentCreate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPostingRecruiterAssignmentCreateApiResponse:
 *       type: object
 *       description: Response after creating a recruiter assignment
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/IJobPostingRecruiterAssignment'
 */
export type IJobPostingRecruiterAssignmentCreateApiResponse =
  IApiResponse<IJobPostingRecruiterAssignment>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPostingRecruiterAssignmentGetApiRequest:
 *       type: object
 *       description: Request to get a recruiter assignment for a job posting
 *       required:
 *         - params
 *       properties:
 *         params:
 *           type: object
 *           required:
 *             - jobPostingId
 *           properties:
 *             jobPostingId:
 *               type: string
 *               format: uuid
 *               description: ID of the job posting
 */
export type IJobPostingRecruiterAssignmentGetApiRequest = IApiRequest<
  void,
  void,
  { jobPostingId: string }
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPostingRecruiterAssignmentGetApiResponse:
 *       type: object
 *       description: Response with recruiter assignment details
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/IJobPostingRecruiterAssignmentWithDetails'
 */
export type IJobPostingRecruiterAssignmentGetApiResponse =
  IApiResponse<IJobPostingRecruiterAssignmentWithDetails | null>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPostingRecruiterAssignmentUpdateApiRequest:
 *       type: object
 *       description: Request to update a recruiter assignment
 *       required:
 *         - params
 *         - data
 *       properties:
 *         params:
 *           type: object
 *           required:
 *             - assignmentId
 *           properties:
 *             assignmentId:
 *               type: string
 *               format: uuid
 *               description: ID of the assignment
 *         data:
 *           $ref: '#/components/schemas/IJobPostingRecruiterAssignmentUpdate'
 */
export type IJobPostingRecruiterAssignmentUpdateApiRequest = IApiRequest<
  IJobPostingRecruiterAssignmentUpdate,
  void,
  { assignmentId: string }
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPostingRecruiterAssignmentUpdateApiResponse:
 *       type: object
 *       description: Response after updating a recruiter assignment
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/IJobPostingRecruiterAssignment'
 */
export type IJobPostingRecruiterAssignmentUpdateApiResponse =
  IApiResponse<IJobPostingRecruiterAssignment>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPostingRecruiterAssignmentReassignApiRequest:
 *       type: object
 *       description: Request to reassign a recruiter
 *       required:
 *         - params
 *         - data
 *       properties:
 *         params:
 *           type: object
 *           required:
 *             - assignmentId
 *           properties:
 *             assignmentId:
 *               type: string
 *               format: uuid
 *               description: ID of the assignment
 *         data:
 *           type: object
 *           required:
 *             - newRecruiterId
 *           properties:
 *             newRecruiterId:
 *               type: string
 *               format: uuid
 *               description: ID of the new recruiter
 *             reason:
 *               type: string
 *               description: Reason for reassignment
 */
export type IJobPostingRecruiterAssignmentReassignApiRequest = IApiRequest<
  {
    newRecruiterId: string;
    reason?: string;
  },
  void,
  { assignmentId: string }
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPostingRecruiterAssignmentReassignApiResponse:
 *       type: object
 *       description: Response after reassigning a recruiter
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/IJobPostingRecruiterAssignment'
 */
export type IJobPostingRecruiterAssignmentReassignApiResponse =
  IApiResponse<IJobPostingRecruiterAssignment>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPostingRecruiterAssignmentListApiRequest:
 *       type: object
 *       description: Request to list recruiter assignments
 *       properties:
 *         query:
 *           type: object
 *           properties:
 *             recruiterId:
 *               type: string
 *               format: uuid
 *               description: Filter by recruiter ID
 *             status:
 *               $ref: '#/components/schemas/JobPostingRecruiterAssignmentStatusEnum'
 *               description: Filter by assignment status
 *             page:
 *               type: number
 *               minimum: 1
 *               description: Page number for pagination
 *             limit:
 *               type: number
 *               minimum: 1
 *               maximum: 100
 *               description: Number of items per page
 */
export type IJobPostingRecruiterAssignmentListApiRequest = IApiRequest<
  void,
  {
    recruiterId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPostingRecruiterAssignmentListApiResponse:
 *       type: object
 *       description: Response with paginated list of recruiter assignments
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IJobPostingRecruiterAssignmentWithDetails'
 *         pagination:
 *           $ref: '#/components/schemas/IPaginationInfo'
 */
export type IJobPostingRecruiterAssignmentListApiResponse =
  IPaginatedResponse<IJobPostingRecruiterAssignmentWithDetails>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPostingRecruiterAssignmentCompleteApiRequest:
 *       type: object
 *       description: Request to complete a recruiter assignment
 *       required:
 *         - params
 *       properties:
 *         params:
 *           type: object
 *           required:
 *             - assignmentId
 *           properties:
 *             assignmentId:
 *               type: string
 *               format: uuid
 *               description: ID of the assignment
 *         data:
 *           type: object
 *           properties:
 *             notes:
 *               type: string
 *               description: Completion notes
 */
export type IJobPostingRecruiterAssignmentCompleteApiRequest = IApiRequest<
  {
    notes?: string;
  },
  void,
  { assignmentId: string }
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPostingRecruiterAssignmentCompleteApiResponse:
 *       type: object
 *       description: Response after completing a recruiter assignment
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/IJobPostingRecruiterAssignment'
 */
export type IJobPostingRecruiterAssignmentCompleteApiResponse =
  IApiResponse<IJobPostingRecruiterAssignment>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPostingRecruiterAssignmentAvailableRecruitersApiRequest:
 *       type: object
 *       description: Request to get available recruiters for an account manager
 *       required:
 *         - params
 *       properties:
 *         params:
 *           type: object
 *           required:
 *             - accountManagerId
 *           properties:
 *             accountManagerId:
 *               type: string
 *               format: uuid
 *               description: ID of the account manager
 *         query:
 *           type: object
 *           properties:
 *             page:
 *               type: number
 *               minimum: 1
 *               description: Page number for pagination
 *             limit:
 *               type: number
 *               minimum: 1
 *               maximum: 100
 *               description: Number of items per page
 *             sortBy:
 *               type: string
 *               description: Field to sort by
 *             sortOrder:
 *               type: string
 *               enum: ["asc", "desc"]
 *               description: Sort order
 *             search:
 *               type: string
 *               description: Search term for recruiter name or email
 */
export type IJobPostingRecruiterAssignmentAvailableRecruitersApiRequest =
  IApiRequest<
    void,
    {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      search?: string;
    },
    { accountManagerId: string }
  >;

/**
 * @openapi
 * components:
 *   schemas:
 *     IRecruiterListItem:
 *       type: object
 *       description: Recruiter information for listing
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Recruiter support user ID
 *         name:
 *           type: string
 *           description: Recruiter name
 *         email:
 *           type: string
 *           format: email
 *           description: Recruiter email
 *         jobTitle:
 *           type: string
 *           description: Recruiter job title
 *         role:
 *           type: string
 *           description: Recruiter role
 *         status:
 *           type: string
 *           description: Recruiter status
 *         department:
 *           type: string
 *           description: Recruiter department
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date when recruiter was created
 */
export interface IRecruiterListItem {
  id: string;
  name: string;
  email: string;
  jobTitle?: string;
  role: string;
  status: string;
  department?: string;
  createdAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPostingRecruiterAssignmentAvailableRecruitersApiResponse:
 *       type: object
 *       description: Response with paginated list of available recruiters
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IRecruiterListItem'
 *         pagination:
 *           $ref: '#/components/schemas/IPaginationInfo'
 */
export type IJobPostingRecruiterAssignmentAvailableRecruitersApiResponse =
  IPaginatedResponse<IRecruiterListItem>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPostingRecruiterAssignmentJobPostingsApiRequest:
 *       type: object
 *       description: Request to get job postings assigned to a recruiter
 *       required:
 *         - params
 *       properties:
 *         params:
 *           type: object
 *           required:
 *             - recruiterId
 *           properties:
 *             recruiterId:
 *               type: string
 *               format: uuid
 *               description: ID of the recruiter
 *         query:
 *           type: object
 *           properties:
 *             page:
 *               type: number
 *               minimum: 1
 *               description: Page number for pagination
 *             limit:
 *               type: number
 *               minimum: 1
 *               maximum: 100
 *               description: Number of items per page
 *             sortBy:
 *               type: string
 *               description: Field to sort by
 *             sortOrder:
 *               type: string
 *               enum: ["asc", "desc"]
 *               description: Sort order
 *             search:
 *               type: string
 *               description: Search term for job title or company name
 *             status:
 *               type: string
 *               description: Filter by job posting status
 */
export type IJobPostingRecruiterAssignmentJobPostingsApiRequest = IApiRequest<
  void,
  {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    status?: string;
  },
  { recruiterId: string }
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IRecruiterJobPostingListItem:
 *       type: object
 *       description: Job posting information for recruiter assignment list
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Job posting ID
 *         title:
 *           type: string
 *           description: Job posting title
 *         description:
 *           type: string
 *           description: Job posting description
 *         status:
 *           type: string
 *           description: Job posting status
 *         totalExperience:
 *           type: number
 *           description: Required total years of experience for the job
 *         company:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             name:
 *               type: string
 *         client:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *         assignment:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             assignedAt:
 *               type: string
 *               format: date-time
 *             notes:
 *               type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
export interface IRecruiterJobPostingListItem {
  id: string;
  title: string;
  description: string;
  status: string;
  totalExperience: number;
  company: {
    id: string;
    name: string;
  };
  client: {
    id: string;
  };
  assignment: {
    id: string;
    assignedAt: Date;
    notes?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPostingRecruiterAssignmentJobPostingsApiResponse:
 *       type: object
 *       description: Response with paginated list of job postings assigned to recruiter
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IRecruiterJobPostingListItem'
 *         pagination:
 *           $ref: '#/components/schemas/IPaginationInfo'
 */
export type IJobPostingRecruiterAssignmentJobPostingsApiResponse =
  IPaginatedResponse<IRecruiterJobPostingListItem>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IManualRecruiterAssignmentCreateApiRequest:
 *       type: object
 *       description: Request to manually assign a recruiter to a job posting
 *       required:
 *         - data
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/IManualRecruiterAssignmentCreate'
 */
export type IManualRecruiterAssignmentCreateApiRequest =
  IApiRequest<IManualRecruiterAssignmentCreate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IManualRecruiterAssignmentCreateApiResponse:
 *       type: object
 *       description: Response after manually assigning a recruiter to a job posting
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/IJobPostingRecruiterAssignment'
 */
export type IManualRecruiterAssignmentCreateApiResponse =
  IApiResponse<IJobPostingRecruiterAssignment>;
