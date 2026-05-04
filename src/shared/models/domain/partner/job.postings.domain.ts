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
 *     IPartnerJobPosting:
 *       type: object
 *       description: Job posting domain model for partners (excluding client details)
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the job posting
 *         title:
 *           type: string
 *           description: Title of the job posting
 *         description:
 *           type: string
 *           description: Detailed description of the job
 *         jobType:
 *           $ref: '#/components/schemas/WorkTypeEnum'
 *           description: Type of work (Full-time, Part-time, etc.)
 *         jobCommitment:
 *           $ref: '#/components/schemas/WorkCommitmentEnum'
 *           description: Work commitment level
 *         jobSchedule:
 *           $ref: '#/components/schemas/WorkScheduleEnum'
 *           description: Work schedule
 *         industry:
 *           $ref: '#/components/schemas/CompanyIndustryEnum'
 *           description: Industry of the job
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
 *         isRemote:
 *           type: boolean
 *           description: Whether the job is remote
 *         isFeatured:
 *           type: boolean
 *           description: Whether the job is featured
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
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the job posting was created
 */
export interface IPartnerJobPosting {
  id: string;
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
  status: JobPostingStatusEnum;
  applicationDeadline?: Date;
  availableFrom?: Date;
  numberOfOpenings: number;
  isRemote: boolean;
  isFeatured: boolean;
  preferredUniversities: string[];
  preferredDegrees: string[];
  preferredLocations: string[];
  preferredIndustries: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  minSalary?: number;
  maxSalary?: number;
  salaryCurrency?: string;
  equity: boolean;
  responsibilities: string[];
  benefits: string[];
  tags: string[];
  createdAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerJobPostingList:
 *       type: object
 *       description: Simplified job posting for listing view (excluding client details)
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         title:
 *           type: string
 *         jobType:
 *           $ref: '#/components/schemas/WorkTypeEnum'
 *         location:
 *           type: string
 *           description: Primary location or "Remote"
 *         totalExperience:
 *           type: number
 *         numberOfOpenings:
 *           type: number
 *         requiredSkills:
 *           type: array
 *           items:
 *             type: string
 *         status:
 *           $ref: '#/components/schemas/JobPostingStatusEnum'
 *         isRemote:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 */
export interface IPartnerJobPostingList {
  id: string;
  title: string;
  jobType: WorkTypeEnum;
  location: string;
  totalExperience: number;
  numberOfOpenings: number;
  requiredSkills: string[];
  status: JobPostingStatusEnum;
  isRemote: boolean;
  createdAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerJobPostingFilterQuery:
 *       type: object
 *       description: Query parameters for filtering job postings from partner perspective
 *       properties:
 *         title:
 *           type: string
 *         jobType:
 *           $ref: '#/components/schemas/WorkTypeEnum'
 *         industry:
 *           $ref: '#/components/schemas/CompanyIndustryEnum'
 *         isRemote:
 *           type: boolean
 *         minExperience:
 *           type: number
 *         maxExperience:
 *           type: number
 *         minSalary:
 *           type: number
 *         maxSalary:
 *           type: number
 *         skills:
 *           type: array
 *           items:
 *             type: string
 */
export interface IPartnerJobPostingFilterQuery {
  title?: string;
  jobType?: WorkTypeEnum;
  industry?: CompanyIndustryEnum;
  isRemote?: boolean;
  minExperience?: number;
  maxExperience?: number;
  minSalary?: number;
  maxSalary?: number;
  skills?: string[];
}

/**
 * Helper function to convert database models to partner job posting domain models
 */
export function toPartnerJobPostingDomain(jobPosting: any): IPartnerJobPosting {
  return {
    id: jobPosting.id,
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
    status: jobPosting.status,
    applicationDeadline: jobPosting.applicationDeadline,
    availableFrom: jobPosting.availableFrom,
    numberOfOpenings: jobPosting.numberOfOpenings,
    isRemote: jobPosting.isRemote,
    isFeatured: jobPosting.isFeatured,
    preferredUniversities: jobPosting.preferredUniversities || [],
    preferredDegrees: jobPosting.preferredDegrees || [],
    preferredLocations: jobPosting.preferredLocations || [],
    preferredIndustries: jobPosting.preferredIndustries || [],
    requiredSkills: jobPosting.requiredSkills || [],
    preferredSkills: jobPosting.preferredSkills || [],
    minSalary: jobPosting.minSalary,
    maxSalary: jobPosting.maxSalary,
    salaryCurrency: jobPosting.salaryCurrency,
    equity: jobPosting.equity,
    responsibilities: jobPosting.responsibilities || [],
    benefits: jobPosting.benefits || [],
    tags: jobPosting.tags || [],
    createdAt: jobPosting.createdAt,
  };
}

/**
 * Helper function to convert database models to partner job posting list domain models
 */
export function toPartnerJobPostingListDomain(
  jobPosting: any
): IPartnerJobPostingList {
  const location = jobPosting.isRemote
    ? 'Remote'
    : jobPosting.preferredLocations?.[0] || 'Not specified';

  return {
    id: jobPosting.id,
    title: jobPosting.title,
    jobType: jobPosting.jobType,
    location,
    totalExperience: jobPosting.totalExperience,
    numberOfOpenings: jobPosting.numberOfOpenings,
    requiredSkills: jobPosting.requiredSkills || [],
    status: jobPosting.status,
    isRemote: jobPosting.isRemote,
    createdAt: jobPosting.createdAt,
  };
}
