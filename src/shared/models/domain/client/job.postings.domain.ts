import {
  WorkTypeEnum,
  WorkCommitmentEnum,
  WorkScheduleEnum,
  CompanyIndustryEnum,
  JobPostingStatusEnum,
  DifficultyLevelEnum,
} from '../../common/enums';
import { IClientJobApplication } from './application.domain';
import { IClientCandidateShortlist } from './candidate.shortlist.domain';

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobPostingCompany:
 *       type: object
 *       description: Company details of the job posting
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         companyType:
 *           type: string
 *         industry:
 *           type: string
 *         size:
 *           type: string
 *         stage:
 *           type: string
 *         foundedYear:
 *           type: number
 *         website:
 *           type: string
 *         benefits:
 *           type: array
 *           items:
 *             type: string
 *         contactEmail:
 *           type: string
 *         contactPhone:
 *           type: string
 *         contactName:
 *           type: string
 *         address:
 *           type: string
 *         city:
 *           type: string
 *         state:
 *           type: string
 *         zipCode:
 *           type: string
 *         country:
 *           type: string
 *         remarks:
 *           type: string
 *         status:
 *           type: string
 *         logo:
 *           type: string
 */

export interface IClientJobPostingCompany {
  id: string;
  name: string;
  description: string;
  companyType: string; // e.g. "ENTERPRISE"
  industry: string; // e.g. "EDUCATION"
  size: string; // e.g. "OVER_THOUSAND"
  stage: string; // e.g. "ENTERPRISE"
  foundedYear: number;
  website: string;
  benefits: string[];
  contactEmail: string;
  contactPhone: string;
  contactName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  remarks: string | null;
  status: string; // e.g. "UNVERIFIED"
  logo: string | null;
}

/* Job Posting Recommendation */
/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPostingRecommendationList:
 *       type: object
 *       description: Domain model representing a job posting recommendation
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the recommendation
 *         jobPostingId:
 *           type: string
 *           format: uuid
 *           description: ID of the job posting
 *         candidateId:
 *           type: string
 *           format: uuid
 *           description: ID of the candidate
 *         score:
 *           type: number
 *           minimum: 0
 *           maximum: 1
 *           description: Match score between 0-1
 *         matchReason:
 *           type: array
 *           items:
 *             type: string
 *           description: Reasons for the match
 *         isViewed:
 *           type: boolean
 *           description: Whether the recommendation has been viewed
 *         isSaved:
 *           type: boolean
 *           description: Whether the recommendation has been saved
 *         isInvited:
 *           type: boolean
 */

export interface IJobPostingRecommendationList {
  id: string;
  jobPostingId: string;
  candidateId: string;
  score: number;
  matchReason: string[];
  isViewed: boolean;
  isSaved: boolean;
  isInvited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobPosting:
 *       type: object
 *       description: Domain model representing a job posting
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the job posting
 *         clientId:
 *           type: string
 *           format: uuid
 *           description: ID of the client
 *         applications:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IClientJobApplication'
 *         candidateShortlists:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IClientCandidateShortlist'
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
 *         department:
 *           type: string
 *         teamSize:
 *           type: number
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
 *         numberOfOpenings:
 *           type: number
 *         applicationUrl:
 *           type: string
 *         isFeatured:
 *           type: boolean
 *         numberOfViews:
 *           type: number
 *         numberOfApplications:
 *           type: number
 *         minSalary:
 *           type: number
 *         maxSalary:
 *           type: number
 *         isPublished:
 *           type: boolean
 *           description: Whether the job posting is published and visible to candidates
 *         company:
 *           type: object
 *           description: Company details of the job posting
 */
export interface IClientJobPosting {
  id: string;
  clientId: string;
  applications: IClientJobApplication[];
  candidateShortlists?: IClientCandidateShortlist[];
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
  minSalary: number;
  maxSalary: number;
  salaryCurrency: string;
  equity: boolean;
  responsibilities: string[];
  benefits: string[];
  tags: string[];
  isRemote: boolean;
  preferredUniversities: string[];
  preferredDegrees: string[];
  preferredLocations: string[];
  preferredIndustries: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  company?: IClientJobPostingCompany;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobPostingList:
 *       type: object
 *       description: Domain model representing a job posting
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the job posting
 *         clientId:
 *           type: string
 *           format: uuid
 *           description: ID of the client
 *         applications:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IClientJobApplication'
 *         candidateShortlists:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IClientCandidateShortlist'
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
 *         department:
 *           type: string
 *         teamSize:
 *           type: number
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
 *         numberOfOpenings:
 *           type: number
 *         applicationUrl:
 *           type: string
 *         isFeatured:
 *           type: boolean
 *         numberOfViews:
 *           type: number
 *         numberOfApplications:
 *           type: number
 *         minSalary:
 *           type: number
 *         maxSalary:
 *           type: number
 *         isPublished:
 *           type: boolean
 *           description: Whether the job posting is published and visible to candidates
 *         company:
 *           type: object
 *           description: Company details of the job posting
 *         recommendations:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IJobPostingRecommendationList'
 */
export interface IClientJobPostingList {
  id: string;
  clientId: string;
  applications: IClientJobApplication[];
  candidateShortlists?: IClientCandidateShortlist[];
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
  minSalary: number;
  maxSalary: number;
  salaryCurrency: string;
  equity: boolean;
  responsibilities: string[];
  benefits: string[];
  tags: string[];
  isRemote: boolean;
  preferredUniversities: string[];
  preferredDegrees: string[];
  preferredLocations: string[];
  preferredIndustries: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  company?: IClientJobPostingCompany;
  recommendations?: IJobPostingRecommendationList[];
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobPostingCreate:
 *       type: object
 *       description: Payload for creating a new job posting
 *       properties:
 *         title:
 *           type: string
 *           description: Title of the job posting
 *         description:
 *           type: string
 *           description: Detailed description of the job
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
 *         department:
 *           type: string
 *         teamSize:
 *           type: number
 *         reportingTo:
 *           type: string
 *         hiring_manager_email:
 *           type: string
 *           description: Email of the hiring manager
 *         applicationDeadline:
 *           type: string
 *           format: date-time
 *         availableFrom:
 *           type: string
 *           format: date-time
 *         numberOfOpenings:
 *           type: number
 *         applicationUrl:
 *           type: string
 *         isFeatured:
 *           type: boolean
 *         minSalary:
 *           type: number
 *         maxSalary:
 *           type: number
 *         salaryCurrency:
 *           type: string
 *         equity:
 *           type: boolean
 *         responsibilities:
 *           type: array
 *           items:
 *             type: string
 *         benefits:
 *           type: array
 *           items:
 *             type: string
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         isRemote:
 *           type: boolean
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
 *         requiredSkills:
 *           type: array
 *           items:
 *             type: string
 *         preferredSkills:
 *           type: array
 *           items:
 *             type: string
 */
export type IClientJobPostingCreate = Omit<
  IClientJobPosting,
  | 'id'
  | 'clientId'
  | 'client'
  | 'applications'
  | 'status'
  | 'numberOfViews'
  | 'numberOfApplications'
  | 'createdAt'
  | 'updatedAt'
> & {
  aiAssessmentSettings?: IClientJobAiAssessmentSettingsUpdate;
};

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobPostingUpdate:
 *       type: object
 *       description: Payload for updating a job posting
 *       properties:
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
 *           type: number
 *         department:
 *           type: string
 *         teamSize:
 *           type: number
 *         reportingTo:
 *           type: string
 *         hiring_manager_email:
 *           type: string
 *           description: Email of the hiring manager
 *         applicationDeadline:
 *           type: string
 *           format: date-time
 *         availableFrom:
 *           type: string
 *           format: date-time
 *         numberOfOpenings:
 *           type: number
 *         applicationUrl:
 *           type: string
 *         isFeatured:
 *           type: boolean
 *         minSalary:
 *           type: number
 *         maxSalary:
 *           type: number
 *         salaryCurrency:
 *           type: string
 *         equity:
 *           type: boolean
 *         responsibilities:
 *           type: array
 *           items:
 *             type: string
 *         benefits:
 *           type: array
 *           items:
 *             type: string
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         isRemote:
 *           type: boolean
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
 *         requiredSkills:
 *           type: array
 *           items:
 *             type: string
 *         preferredSkills:
 *           type: array
 *           items:
 *             type: string
 */
export type IClientJobPostingUpdate = Partial<IClientJobPostingCreate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobPostingSkillsUpdate:
 *       type: object
 *       description: Payload for updating job posting skills
 *       properties:
 *         requiredSkills:
 *           type: array
 *           items:
 *             type: string
 *         preferredSkills:
 *           type: array
 *           items:
 *             type: string
 */
export interface IClientJobPostingSkillsUpdate {
  requiredSkills?: string[];
  preferredSkills?: string[];
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPostingStatusUpdate:
 *       type: object
 *       description: Payload for updating job posting status
 *       properties:
 *         status:
 *           $ref: '#/components/schemas/JobPostingStatusEnum'
 */
export interface IClientJobPostingStatusUpdate {
  status: JobPostingStatusEnum;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobPostingFilterQuery:
 *       type: object
 *       description: Query parameters for filtering job postings
 *       properties:
 *         title:
 *           type: string
 *         jobType:
 *           $ref: '#/components/schemas/WorkTypeEnum'
 *         industry:
 *           $ref: '#/components/schemas/CompanyIndustryEnum'
 *         status:
 *           $ref: '#/components/schemas/JobPostingStatusEnum'
 *         isRemote:
 *           type: boolean
 *         minSalary:
 *           type: number
 *         maxSalary:
 *           type: number
 *         requiredSkills:
 *           type: array
 *           items:
 *             type: string
 */
export interface IClientJobPostingFilterQuery {
  title?: string;
  department?: string;
  jobType?: WorkTypeEnum;
  industry?: CompanyIndustryEnum;
  status?: JobPostingStatusEnum;
  isRemote?: boolean;
  minSalary?: number;
  maxSalary?: number;
  requiredSkills?: string[];
}

/**
 * @openapi
 * components:
 *   parameters:
 *     IClientJobPostingIdParams:
 *       in: path
 *       name: jobPostingId
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *         description: ID of the job posting
 */
export interface IClientJobPostingIdParams {
  jobPostingId: string;
}

/**
 * Helper function to convert database models to domain models
 */
export function toClientJobPostingDomain(jobPosting: any): IClientJobPosting {
  return {
    id: jobPosting.id,
    clientId: jobPosting.clientId,
    applications: jobPosting.applications || [],
    candidateShortlists: jobPosting.candidateShortlists || [],
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
    minSalary: jobPosting.minSalary,
    maxSalary: jobPosting.maxSalary,
    salaryCurrency: jobPosting.salaryCurrency,
    equity: jobPosting.equity,
    responsibilities: jobPosting.responsibilities,
    benefits: jobPosting.benefits,
    tags: jobPosting.tags,
    isRemote: jobPosting.isRemote,
    preferredUniversities: jobPosting.preferredUniversities,
    preferredDegrees: jobPosting.preferredDegrees,
    preferredLocations: jobPosting.preferredLocations,
    preferredIndustries: jobPosting.preferredIndustries,
    requiredSkills: jobPosting.requiredSkills,
    preferredSkills: jobPosting.preferredSkills,
    company: jobPosting.client.company,
    isPublished: Boolean(jobPosting.isPublished),
    createdAt: jobPosting.createdAt,
    updatedAt: jobPosting.updatedAt,
    // recommendations: jobPosting.recommendations || [],
  };
}

export function toClientJobPostingListDomain(
  jobPosting: any
): IClientJobPostingList {
  return {
    id: jobPosting.id,
    clientId: jobPosting.clientId,
    applications: jobPosting.applications || [],
    candidateShortlists: jobPosting.candidateShortlists || [],
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
    minSalary: jobPosting.minSalary,
    maxSalary: jobPosting.maxSalary,
    salaryCurrency: jobPosting.salaryCurrency,
    equity: jobPosting.equity,
    responsibilities: jobPosting.responsibilities,
    benefits: jobPosting.benefits,
    tags: jobPosting.tags,
    isRemote: jobPosting.isRemote,
    preferredUniversities: jobPosting.preferredUniversities,
    preferredDegrees: jobPosting.preferredDegrees,
    preferredLocations: jobPosting.preferredLocations,
    preferredIndustries: jobPosting.preferredIndustries,
    requiredSkills: jobPosting.requiredSkills,
    preferredSkills: jobPosting.preferredSkills,
    company: jobPosting.client.company,
    isPublished: Boolean(jobPosting.isPublished),
    createdAt: jobPosting.createdAt,
    updatedAt: jobPosting.updatedAt,
    recommendations: jobPosting.recommendations || [],
  };
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobPostingInvite:
 *       type: object
 *       description: Payload for inviting a candidate to a job posting
 *       required:
 *         - candidateId
 *       properties:
 *         candidateId:
 *           type: string
 *           format: uuid
 *           description: ID of the candidate to invite
 *         message:
 *           type: string
 *           description: Optional message to send with the invitation
 *         coverLetterUrl:
 *           type: string
 *           description: URL of the cover letter
 */
export interface IClientJobPostingInvite {
  candidateId: string;
  message?: string;
  coverLetterUrl?: string;
  resumeUrl?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobAiAssessmentSettings:
 *       type: object
 *       description: Domain model representing job posting AI assessment settings
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         jobPostingId:
 *           type: string
 *           format: uuid
 *         clientAiAssessmentSettingsId:
 *           type: string
 *           format: uuid
 *         greetingMessage:
 *           type: string
 *           description: Greeting message for the assessment
 *         defaultAssessmentDuration:
 *           type: number
 *           description: Default assessment duration
 *         defaultPassingScore:
 *           type: number
 *           description: Default passing score
 *         requiredSections:
 *           type: array
 *           items:
 *             type: string
 *           description: Required sections
 *         maximumAttempts:
 *           type: number
 *           description: Maximum attempts
 *         cooldownPeriod:
 *           type: number
 *           description: Cooldown period
 *         maxSections:
 *           type: number
 *         maxQuestionsPerSection:
 *           type: number
 *           description: Maximum questions per section
 *         proctoringEnabled:
 *           type: boolean
 *           description: Whether proctoring is enabled
 *         maxWarnings:
 *           type: number
 *           description: Maximum warnings
 *         tabSwitchLimit:
 *           type: number
 *           description: Maximum tab switches
 *         copyPasteAllowed:
 *           type: boolean
 *         videoRecordingEnabled:
 *           type: boolean
 *           description: Whether video recording is enabled
 *         minimumVideoLength:
 *           type: number
 *           description: Minimum video length
 *         aiVideoAnalysisEnabled:
 *           type: boolean
 *           description: Whether AI video analysis is enabled
 *         autoPublishOnSuccess:
 *           type: boolean
 *           description: Whether to auto-publish on success
 *         autoNotifyOnComplete:
 *           type: boolean
 *           description: Whether to auto-notify on completion
 *         interviewLanguage:
 *           type: string
 *           description: Primary language for interviews (e.g., "ENGLISH")
 *         interviewDialect:
 *           type: string
 *           description: Dialect code for voice synthesis (e.g., "en-US", "en-GB", "en-AU", "en-CA", "en-IN")
 *         interviewVoiceGender:
 *           type: string
 *           description: Voice gender ("female" or "male")
 *         sectionTemplates:
 *           type: object
 *           description: Section templates
 *         questionTemplates:
 *           type: object
 *           description: Question templates
 *         customStyles:
 *           type: object
 *           description: Custom styles
 *         customInstructions:
 *           type: string
 *           description: Custom instructions
 *         createdAt:
 *           type: string
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the settings were last updated
 *
 */
export interface IClientJobAiAssessmentSettings {
  id: string;
  jobPostingId: string;
  clientAiAssessmentSettingsId: string;

  greetingMessage?: string;

  defaultAssessmentDuration?: number;
  defaultPassingScore?: number;
  requiredSections?: string[];
  maximumAttempts?: number;
  cooldownPeriod?: number;
  maxAssessmentDuration?: number;
  assessmentBuffer?: number;

  useCustomPrompts?: boolean;
  aiDifficulty?: DifficultyLevelEnum;
  customPrompts?: Record<string, string>;
  skillWeightings?: Record<string, number>;

  maxSections?: number;
  maxQuestionsPerSection?: number;

  proctoringEnabled?: boolean;
  maxWarnings?: number;
  tabSwitchLimit?: number;
  copyPasteAllowed?: boolean;

  videoRecordingEnabled?: boolean;
  minimumVideoLength?: number;
  aiVideoAnalysisEnabled?: boolean;

  autoPublishOnSuccess?: boolean;
  autoNotifyOnComplete?: boolean;

  // Voice configuration
  interviewLanguage?: string; // Primary language for interviews (e.g., "ENGLISH")
  interviewDialect?: string; // Dialect code for voice synthesis (e.g., "en-US", "en-GB", "en-AU", "en-CA", "en-IN")
  interviewVoiceGender?: string; // Voice gender: "female" or "male"

  sectionTemplates?: Record<string, string>;
  questionTemplates?: Record<string, string>;

  customStyles?: Record<string, string>;
  customInstructions?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobPostingInviteResponse:
 *       type: object
 *       description: Response when a candidate is invited to a job posting (job application)
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the job application
 *         jobId:
 *           type: string
 *           format: uuid
 *           description: ID of the job posting
 *         userId:
 *           type: string
 *           format: uuid
 *           description: ID of the candidate (user)
 *         status:
 *           $ref: '#/components/schemas/ApplicationStatusEnum'
 *           description: Current status of the application
 *         coverLetter:
 *           type: string
 *           description: Cover letter URL or content
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the application was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the application was last updated
 */
export interface ICandidateJobPostingInvite {
  id: string;
  jobId: string;
  userId: string;
  status: string;
  coverLetter?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobAiAssessmentSettingsUpdate:
 *       type: object
 *       description: Payload for updating job posting AI assessment settings
 *       properties:
 *         enabled:
 *           type: boolean
 *         assessmentDuration:
 *           type: number
 *         useCustomPrompts:
 *           type: boolean
 *         technicalAssessmentEnabled:
 *           type: boolean
 *         behavioralAssessmentEnabled:
 *           type: boolean
 *         culturalFitAssessmentEnabled:
 *           type: boolean
 *         aiDifficulty:
 *           type: string
 *           enum: [EASY, MEDIUM, HARD, EXPERT]
 *         requiredSkills:
 *           type: array
 *           items:
 *             type: string
 *         customPrompts:
 *           type: object
 *         skillWeightings:
 *           type: object
 *         passThreshold:
 *           type: number
 */
export type IClientJobAiAssessmentSettingsUpdate = Partial<
  Omit<
    IClientJobAiAssessmentSettings,
    'id' | 'jobPostingId' | 'clientSettingsId' | 'createdAt' | 'updatedAt'
  >
>;

/**
 * Helper function to convert database model to domain model for job AI assessment settings
 */
export function toClientJobAiAssessmentSettingsDomain(
  settings: any
): IClientJobAiAssessmentSettings {
  return {
    id: settings.id,
    jobPostingId: settings.jobPostingId,
    clientAiAssessmentSettingsId: settings.clientAiAssessmentSettingsId,
    greetingMessage: settings.greetingMessage || undefined,
    defaultAssessmentDuration: settings.defaultAssessmentDuration || undefined,
    defaultPassingScore: settings.defaultPassingScore || undefined,
    requiredSections: settings.requiredSections || undefined,
    maximumAttempts: settings.maximumAttempts || undefined,
    cooldownPeriod: settings.cooldownPeriod || undefined,
    maxAssessmentDuration: settings.maxAssessmentDuration || undefined,
    assessmentBuffer: settings.assessmentBuffer || undefined,
    useCustomPrompts: settings.useCustomPrompts || undefined,
    aiDifficulty: settings.aiDifficulty || undefined,
    customPrompts: settings.customPrompts || undefined,
    skillWeightings: settings.skillWeightings || undefined,
    maxSections: settings.maxSections || undefined,
    maxQuestionsPerSection: settings.maxQuestionsPerSection || undefined,
    proctoringEnabled: settings.proctoringEnabled || undefined,
    maxWarnings: settings.maxWarnings || undefined,
    tabSwitchLimit: settings.tabSwitchLimit || undefined,
    copyPasteAllowed: settings.copyPasteAllowed || undefined,
    videoRecordingEnabled: settings.videoRecordingEnabled || undefined,
    minimumVideoLength: settings.minimumVideoLength || undefined,
    aiVideoAnalysisEnabled: settings.aiVideoAnalysisEnabled || undefined,
    autoPublishOnSuccess: settings.autoPublishOnSuccess || undefined,
    autoNotifyOnComplete: settings.autoNotifyOnComplete || undefined,
    sectionTemplates: settings.sectionTemplates || undefined,
    questionTemplates: settings.questionTemplates || undefined,
    customStyles: settings.customStyles || undefined,
    customInstructions: settings.customInstructions || undefined,
    createdAt: settings.createdAt,
    updatedAt: settings.updatedAt,
  };
}
