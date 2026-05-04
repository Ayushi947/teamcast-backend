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
 *     ICandidateJobPosting:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         jobType:
 *           $ref: '#/components/schemas/WorkTypeEnum'
 *         jobCommitment:
 *           $ref: '#/components/schemas/WorkCommitmentEnum'
 *         jobSchedule:
 *           $ref: '#/components/schemas/WorkScheduleEnum'
 *         industry:
 *           $ref: '#/components/schemas/CompanyIndustryEnum'
 *         totalExperience:
 *           type: integer
 *         department:
 *           type: string
 *         teamSize:
 *           type: integer
 *         reportingTo:
 *           type: string
 *         hiring_manager_email:
 *           type: string
 *           description: Email of the hiring manager
 *         status:
 *           $ref: '#/components/schemas/JobPostingStatusEnum'
 *         applicationDeadline:
 *           type: string
 *           format: date-time
 *         availableFrom:
 *           type: string
 *           format: date-time
 *         numberOfOpenings:
 *           type: integer
 *         applicationUrl:
 *           type: string
 *         isFeatured:
 *           type: boolean
 *         isRemote:
 *           type: boolean
 *         minSalary:
 *           type: number
 *         maxSalary:
 *           type: number
 *         salaryCurrency:
 *           type: string
 *         equity:
 *           type: boolean
 *         benefits:
 *           type: array
 *           items:
 *             type: string
 *         responsibilities:
 *           type: array
 *           items:
 *             type: string
 *         requiredSkills:
 *           type: array
 *           items:
 *             type: string
 *         preferredSkills:
 *           type: array
 *           items:
 *             type: string
 *         preferredUniversities:
 *           type: array
 *           items:
 *             type: string
 *         preferredDegrees:
 *           type: array
 *           items:
 *             type: string
 *         preferredLocations:
 *           type: array
 *           items:
 *             type: string
 *         preferredIndustries:
 *           type: array
 *           items:
 *             type: string
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         company:
 *           $ref: '#/components/schemas/ICandidateCompanyDetails'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
export interface ICandidateJobPosting {
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
  hiring_manager_email?: string;
  status: JobPostingStatusEnum;
  applicationDeadline?: Date;
  availableFrom?: Date;
  numberOfOpenings: number;
  applicationUrl?: string;
  isFeatured: boolean;
  isRemote: boolean;
  minSalary?: number;
  maxSalary?: number;
  salaryCurrency?: string;
  equity: boolean;
  benefits: string[];
  responsibilities: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  preferredUniversities: string[];
  preferredDegrees: string[];
  preferredLocations: string[];
  preferredIndustries: string[];
  tags: string[];
  company: ICandidateCompanyDetails;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateCompanyDetails:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         companyType:
 *           $ref: '#/components/schemas/CompanyTypeEnum'
 *         industry:
 *           $ref: '#/components/schemas/CompanyIndustryEnum'
 *         size:
 *           $ref: '#/components/schemas/CompanySizeEnum'
 *         stage:
 *           $ref: '#/components/schemas/CompanyStageEnum'
 *         foundedYear:
 *           type: integer
 *         website:
 *           type: string
 *         location:
 *           type: string
 */
export interface ICandidateCompanyDetails {
  id: string;
  name: string;
  description: string;
  companyType: string;
  industry: string;
  size: string;
  stage: string;
  foundedYear: number;
  website?: string;
  location?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobPostingApply:
 *       type: object
 *       properties:
 *         notes:
 *           type: string
 *           description: Optional notes about the application
 *         coverLetterUrl:
 *           type: string
 *           description: Optional URL to the cover letter
 */
export interface ICandidateJobPostingApply {
  notes?: string;
  coverLetterUrl?: string;
}

/**
 * Helper function to convert database model to domain model
 */
export function toCandidateJobPostingDomain(
  jobPosting: any
): ICandidateJobPosting {
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
    hiring_manager_email: jobPosting.hiring_manager_email,
    status: jobPosting.status,
    applicationDeadline: jobPosting.applicationDeadline,
    availableFrom: jobPosting.availableFrom,
    numberOfOpenings: jobPosting.numberOfOpenings,
    applicationUrl: jobPosting.applicationUrl,
    isFeatured: jobPosting.isFeatured,
    isRemote: jobPosting.isRemote,
    minSalary: jobPosting.minSalary,
    maxSalary: jobPosting.maxSalary,
    salaryCurrency: jobPosting.salaryCurrency,
    equity: jobPosting.equity,
    benefits: jobPosting.benefits,
    responsibilities: jobPosting.responsibilities,
    requiredSkills: jobPosting.requiredSkills,
    preferredSkills: jobPosting.preferredSkills,
    preferredUniversities: jobPosting.preferredUniversities,
    preferredDegrees: jobPosting.preferredDegrees,
    preferredLocations: jobPosting.preferredLocations,
    preferredIndustries: jobPosting.preferredIndustries,
    tags: jobPosting.tags,
    company: {
      id: jobPosting.client.company.id,
      name: jobPosting.client.company.name,
      description: jobPosting.client.company.description,
      companyType: jobPosting.client.company.companyType,
      industry: jobPosting.client.company.industry,
      size: jobPosting.client.company.size,
      stage: jobPosting.client.company.stage,
      foundedYear: jobPosting.client.company.foundedYear,
      website: jobPosting.client.company.website,
      location: jobPosting.client.company.address,
    },
    createdAt: jobPosting.createdAt,
    updatedAt: jobPosting.updatedAt,
  };
}
