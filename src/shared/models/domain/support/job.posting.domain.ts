import {
  WorkTypeEnum,
  WorkCommitmentEnum,
  WorkScheduleEnum,
  CompanyIndustryEnum,
  JobPostingStatusEnum,
} from '../../common/enums';

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportJobPosting:
 *       type: object
 *       description: Domain model representing a job posting for support team view
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the job posting
 *         clientId:
 *           type: string
 *           format: uuid
 *           description: ID of the client
 *         title:
 *           type: string
 *           description: Title of the job posting
 *         description:
 *           type: string
 *           description: Detailed description of the job posting
 *         jobType:
 *           $ref: '#/components/schemas/WorkTypeEnum'
 *         jobCommitment:
 *           $ref: '#/components/schemas/WorkCommitmentEnum'
 *         jobSchedule:
 *           $ref: '#/components/schemas/WorkScheduleEnum'
 *         industry:
 *           $ref: '#/components/schemas/CompanyIndustryEnum'
 *         totalExperience:
 *           type: number
 *           description: Required total years of experience
 *         department:
 *           type: string
 *           description: Department of the job
 *         teamSize:
 *           type: number
 *           description: Size of the team
 *         reportingTo:
 *           type: string
 *           description: Position this role reports to
 *         hiring_manager_email:
 *           type: string
 *           description: Email of the hiring manager
 *         status:
 *           $ref: '#/components/schemas/JobPostingStatusEnum'
 *           description: Current status of the job posting
 *         applicationDeadline:
 *           type: string
 *           format: date-time
 *           description: Deadline for applications
 *         availableFrom:
 *           type: string
 *           format: date-time
 *           description: Date from which the position is available
 *         numberOfOpenings:
 *           type: number
 *           description: Number of positions available
 *         applicationUrl:
 *           type: string
 *           description: URL for job applications
 *         isFeatured:
 *           type: boolean
 *           description: Whether the job is featured
 *         numberOfViews:
 *           type: number
 *           description: Number of views the job posting has received
 *         numberOfApplications:
 *           type: number
 *           description: Number of applications received
 *         isRemote:
 *           type: boolean
 *           description: Whether the job is remote
 *         minSalary:
 *           type: number
 *           description: Minimum salary offered
 *         maxSalary:
 *           type: number
 *           description: Maximum salary offered
 *         salaryCurrency:
 *           type: string
 *           description: Currency for salary
 *         equity:
 *           type: boolean
 *           description: Whether equity is offered
 *         responsibilities:
 *           type: array
 *           items:
 *             type: string
 *           description: List of job responsibilities
 *         benefits:
 *           type: array
 *           items:
 *             type: string
 *           description: List of benefits offered
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Tags associated with the job
 *         preferredUniversities:
 *           type: array
 *           items:
 *             type: string
 *           description: Preferred universities for candidates
 *         preferredDegrees:
 *           type: array
 *           items:
 *             type: string
 *           description: Preferred degrees for candidates
 *         preferredLocations:
 *           type: array
 *           items:
 *             type: string
 *           description: Preferred locations for candidates
 *         preferredIndustries:
 *           type: array
 *           items:
 *             type: string
 *           description: Preferred industries for candidates
 *         requiredSkills:
 *           type: array
 *           items:
 *             type: string
 *           description: Required skills for the job
 *         preferredSkills:
 *           type: array
 *           items:
 *             type: string
 *           description: Preferred skills for the job
 *         isPublished:
 *           type: boolean
 *           description: Whether the job posting is published and visible to candidates
 *         recruiter:
 *           type: object
 *           description: Information about the assigned recruiter
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *               description: Recruiter ID
 *             name:
 *               type: string
 *               description: Recruiter name
 *             email:
 *               type: string
 *               description: Recruiter email
 *             assignedAt:
 *               type: string
 *               format: date-time
 *               description: Date when recruiter was assigned
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the job posting was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the job posting was last updated
 */
export interface ISupportJobPosting {
  id: string;
  clientId: string;
  title: string;
  description: string;
  jobType: WorkTypeEnum;
  jobCommitment: WorkCommitmentEnum;
  jobSchedule: WorkScheduleEnum;
  industry: CompanyIndustryEnum;
  totalExperience: number;
  department?: string;
  teamSize?: number;
  reportingTo?: string;
  hiring_manager_email?: string;
  status: JobPostingStatusEnum;
  applicationDeadline?: Date;
  availableFrom?: Date;
  numberOfOpenings: number;
  applicationUrl?: string;
  isFeatured: boolean;
  numberOfViews: number;
  numberOfApplications: number;
  isRemote: boolean;
  minSalary?: number;
  maxSalary?: number;
  salaryCurrency?: string;
  equity: boolean;
  responsibilities: string[];
  benefits: string[];
  tags: string[];
  preferredUniversities: string[];
  preferredDegrees: string[];
  preferredLocations: string[];
  preferredIndustries: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  isPublished: boolean;
  recruiter?: {
    id: string;
    name: string;
    email: string;
    assignedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportJobPostingListResponse:
 *       type: object
 *       description: Response model for support job posting list
 *       properties:
 *         jobPostings:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ISupportJobPosting'
 *           description: List of job postings
 *         total:
 *           type: number
 *           description: Total number of job postings
 */
export interface ISupportJobPostingListResponse {
  jobPostings: ISupportJobPosting[];
  total: number;
}

/**
 * Helper function to convert database model to domain model
 */
export function toSupportJobPostingDomain(jobPosting: any): ISupportJobPosting {
  return {
    id: jobPosting.id,
    clientId: jobPosting.clientId,
    title: jobPosting.title,
    description: jobPosting.description,
    jobType: jobPosting.jobType,
    jobCommitment: jobPosting.jobCommitment,
    jobSchedule: jobPosting.jobSchedule,
    industry: jobPosting.industry,
    totalExperience: jobPosting.totalExperience,
    department: jobPosting.department,
    teamSize: jobPosting.teamSize,
    reportingTo: jobPosting.reportingTo,
    hiring_manager_email: jobPosting.hiring_manager_email,
    status: jobPosting.status,
    applicationDeadline: jobPosting.applicationDeadline,
    availableFrom: jobPosting.availableFrom,
    numberOfOpenings: jobPosting.numberOfOpenings,
    applicationUrl: jobPosting.applicationUrl,
    isFeatured: jobPosting.isFeatured,
    numberOfViews: jobPosting.numberOfViews,
    numberOfApplications: jobPosting.numberOfApplications,
    isRemote: jobPosting.isRemote,
    minSalary: jobPosting.minSalary,
    maxSalary: jobPosting.maxSalary,
    salaryCurrency: jobPosting.salaryCurrency,
    equity: jobPosting.equity,
    responsibilities: jobPosting.responsibilities,
    benefits: jobPosting.benefits,
    tags: jobPosting.tags,
    preferredUniversities: jobPosting.preferredUniversities,
    preferredDegrees: jobPosting.preferredDegrees,
    preferredLocations: jobPosting.preferredLocations,
    preferredIndustries: jobPosting.preferredIndustries,
    requiredSkills: jobPosting.requiredSkills,
    preferredSkills: jobPosting.preferredSkills,
    isPublished: jobPosting.isPublished,
    recruiter: jobPosting.recruiter
      ? {
          id: jobPosting.recruiter.id,
          name: jobPosting.recruiter.name,
          email: jobPosting.recruiter.email,
          assignedAt: jobPosting.recruiter.assignedAt,
        }
      : undefined,
    createdAt: jobPosting.createdAt,
    updatedAt: jobPosting.updatedAt,
  };
}
