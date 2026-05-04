import {
  CandidateStatusEnum,
  CandidateAssessmentStageEnum,
  CandidateJobSearchStatusEnum,
  SexEnum,
  MaritalStatusEnum,
  CandidateResumeAssessmentStatusEnum,
  CandidateOnboardingAssessmentStatusEnum,
  UserRoleEnum,
  UserStatusEnum,
} from '../../common/enums';

// Import related domain models
import { IResume } from '../candidate/resume.domain';
import {
  ICandidateSettings,
  ICandidatePreferences,
} from '../candidate/profile.settings.domain';
import { IResumeAssessment } from '../candidate/resume.assessment.domain';

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerCandidateDetailed:
 *       type: object
 *       description: Comprehensive domain model representing a candidate managed by a partner with all related information
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the candidate
 *         userId:
 *           type: string
 *           format: uuid
 *           description: Reference to the user account
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the candidate
 *         name:
 *           type: string
 *           description: Full name of the candidate
 *         jobTitle:
 *           type: string
 *           description: Current job title of the candidate
 *         image:
 *           type: string
 *           description: Profile picture URL
 *         role:
 *           $ref: '#/components/schemas/UserRoleEnum'
 *           description: User role
 *         userStatus:
 *           $ref: '#/components/schemas/UserStatusEnum'
 *           description: User account status
 *         status:
 *           $ref: '#/components/schemas/CandidateStatusEnum'
 *           description: Current status of the candidate
 *         assessmentStage:
 *           $ref: '#/components/schemas/CandidateAssessmentStageEnum'
 *           description: Current assessment stage of the candidate
 *         resumeAssessmentStatus:
 *           $ref: '#/components/schemas/CandidateResumeAssessmentStatusEnum'
 *           description: Resume assessment status
 *         onboardingAssessmentStatus:
 *           $ref: '#/components/schemas/CandidateOnboardingAssessmentStatusEnum'
 *           description: Onboarding assessment status
 *         jobSearchStatus:
 *           $ref: '#/components/schemas/CandidateJobSearchStatusEnum'
 *           description: Job search status of the candidate
 *         isPublished:
 *           type: boolean
 *           description: Whether the candidate profile is published
 *         completionPercentage:
 *           type: integer
 *           description: Profile completion percentage
 *         sex:
 *           $ref: '#/components/schemas/SexEnum'
 *           description: Gender of the candidate
 *         birthDate:
 *           type: string
 *           format: date
 *           description: Date of birth of the candidate
 *         maritalStatus:
 *           $ref: '#/components/schemas/MaritalStatusEnum'
 *           description: Marital status of the candidate
 *         phone:
 *           type: string
 *           description: Phone number
 *         location:
 *           type: string
 *           description: Current location
 *         totalExperience:
 *           type: integer
 *           description: Total years of experience
 *         currentCompany:
 *           type: string
 *           description: Current company
 *         currentIndustry:
 *           type: string
 *           description: Current industry
 *         summary:
 *           type: string
 *           description: Professional summary
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *           description: List of skills
 *         industries:
 *           type: array
 *           items:
 *             type: string
 *           description: List of industries
 *         languages:
 *           type: array
 *           items:
 *             type: string
 *           description: List of languages
 *         resume:
 *           $ref: '#/components/schemas/IResume'
 *           description: Complete resume information
 *         settings:
 *           $ref: '#/components/schemas/ICandidateSettings'
 *           description: Candidate settings
 *         preferences:
 *           $ref: '#/components/schemas/ICandidatePreferences'
 *           description: Candidate preferences
 *         resumeAssessment:
 *           $ref: '#/components/schemas/IResumeAssessment'
 *           description: Resume assessment results
 *         partnerId:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the partner managing this candidate
 *         updatedBy:
 *           type: string
 *           format: uuid
 *           description: ID of the user who last updated this candidate
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the candidate was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the candidate was last updated
 *       required:
 *         - id
 *         - userId
 *         - email
 *         - name
 *         - status
 *         - assessmentStage
 *         - jobSearchStatus
 *         - isPublished
 *         - completionPercentage
 *         - partnerId
 *         - createdAt
 *         - updatedAt
 */
export interface IPartnerCandidateDetailed {
  id: string;
  userId: string;
  email: string;
  name: string;
  jobTitle?: string;
  image?: string;
  role: UserRoleEnum;
  userStatus: UserStatusEnum;
  status: CandidateStatusEnum;
  assessmentStage: CandidateAssessmentStageEnum;
  resumeAssessmentStatus: CandidateResumeAssessmentStatusEnum;
  onboardingAssessmentStatus: CandidateOnboardingAssessmentStatusEnum;
  jobSearchStatus: CandidateJobSearchStatusEnum;
  isPublished: boolean;
  completionPercentage: number;
  sex?: SexEnum;
  birthDate?: Date;
  maritalStatus?: MaritalStatusEnum;
  phone?: string;
  location?: string;
  totalExperience?: number;
  currentCompany?: string;
  currentIndustry?: string;
  summary?: string;
  skills?: string[];
  industries?: string[];
  languages?: string[];
  resume?: IResume;
  settings?: ICandidateSettings;
  preferences?: ICandidatePreferences;
  resumeAssessment?: IResumeAssessment;
  partnerId: string;
  deletedAt?: Date;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerCandidate:
 *       type: object
 *       description: Basic domain model representing a candidate managed by a partner
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the candidate
 *         userId:
 *           type: string
 *           format: uuid
 *           description: Reference to the user account
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the candidate
 *         name:
 *           type: string
 *           description: Full name of the candidate
 *         jobTitle:
 *           type: string
 *           description: Current job title of the candidate
 *         status:
 *           $ref: '#/components/schemas/CandidateStatusEnum'
 *           description: Current status of the candidate
 *         assessmentStage:
 *           $ref: '#/components/schemas/CandidateAssessmentStageEnum'
 *           description: Current assessment stage of the candidate
 *         jobSearchStatus:
 *           $ref: '#/components/schemas/CandidateJobSearchStatusEnum'
 *           description: Job search status of the candidate
 *         isPublished:
 *           type: boolean
 *           description: Whether the candidate profile is published
 *         completionPercentage:
 *           type: integer
 *           description: Profile completion percentage
 *         sex:
 *           $ref: '#/components/schemas/SexEnum'
 *           description: Gender of the candidate
 *         birthDate:
 *           type: string
 *           format: date
 *           description: Date of birth of the candidate
 *         maritalStatus:
 *           $ref: '#/components/schemas/MaritalStatusEnum'
 *           description: Marital status of the candidate
 *         partnerId:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the partner managing this candidate
 *         updatedBy:
 *           type: string
 *           format: uuid
 *           description: ID of the user who last updated this candidate
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the candidate was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the candidate was last updated
 *       required:
 *         - id
 *         - userId
 *         - email
 *         - name
 *         - status
 *         - assessmentStage
 *         - jobSearchStatus
 *         - isPublished
 *         - completionPercentage
 *         - partnerId
 *         - createdAt
 *         - updatedAt
 */
export interface IPartnerCandidate {
  id: string;
  userId: string;
  email: string;
  name: string;
  jobTitle?: string;
  image?: string;
  status: CandidateStatusEnum;
  assessmentStage: CandidateAssessmentStageEnum;
  jobSearchStatus: CandidateJobSearchStatusEnum;
  isPublished: boolean;
  completionPercentage: number;
  sex?: SexEnum;
  birthDate?: Date;
  maritalStatus?: MaritalStatusEnum;
  partnerId: string;
  deletedAt?: Date;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerCandidateUpdate:
 *       type: object
 *       description: Payload for updating a candidate
 *       properties:
 *         status:
 *           $ref: '#/components/schemas/CandidateStatusEnum'
 *           description: Status of the candidate
 *         assessmentStage:
 *           $ref: '#/components/schemas/CandidateAssessmentStageEnum'
 *           description: Assessment stage of the candidate
 *         jobSearchStatus:
 *           $ref: '#/components/schemas/CandidateJobSearchStatusEnum'
 *           description: Job search status of the candidate
 *         sex:
 *           $ref: '#/components/schemas/SexEnum'
 *           description: Gender of the candidate
 *         birthDate:
 *           type: string
 *           format: date
 *           description: Date of birth of the candidate
 *         maritalStatus:
 *           $ref: '#/components/schemas/MaritalStatusEnum'
 *           description: Marital status of the candidate
 */
export type IPartnerCandidateUpdate = Partial<
  Pick<
    IPartnerCandidate,
    | 'status'
    | 'assessmentStage'
    | 'jobSearchStatus'
    | 'sex'
    | 'birthDate'
    | 'maritalStatus'
  >
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerCandidateFilterQuery:
 *       type: object
 *       description: Enhanced query parameters for filtering partner candidates
 *       properties:
 *         search:
 *           type: string
 *           description: Global search across all searchable fields
 *         searchColumns:
 *           type: array
 *           items:
 *             type: string
 *           description: Specific columns to search in (if not provided, searches all)
 *         email:
 *           type: string
 *           description: Filter by candidate email
 *         name:
 *           type: string
 *           description: Filter by candidate name
 *         jobTitle:
 *           type: string
 *           description: Filter by job title
 *         company:
 *           type: string
 *           description: Filter by current company
 *         industry:
 *           type: string
 *           description: Filter by industry
 *         location:
 *           type: string
 *           description: Filter by location
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *           description: Filter by skills
 *         status:
 *           $ref: '#/components/schemas/CandidateStatusEnum'
 *           description: Filter by candidate status
 *         assessmentStage:
 *           $ref: '#/components/schemas/CandidateAssessmentStageEnum'
 *           description: Filter by candidate assessment stage
 *         jobSearchStatus:
 *           $ref: '#/components/schemas/CandidateJobSearchStatusEnum'
 *           description: Filter by candidate job search status
 *         isPublished:
 *           type: boolean
 *           description: Filter by whether candidate profile is published
 *         minExperience:
 *           type: integer
 *           description: Minimum years of experience
 *         maxExperience:
 *           type: integer
 *           description: Maximum years of experience
 */
export interface IPartnerCandidateFilterQuery {
  search?: string;
  searchColumns?: string[];
  email?: string;
  name?: string;
  jobTitle?: string;
  company?: string;

  // Multi-select filters
  industry?: string | string[];
  location?: string | string[];
  skills?: string[];
  status?: CandidateStatusEnum | CandidateStatusEnum[];
  assessmentStage?:
    | CandidateAssessmentStageEnum
    | CandidateAssessmentStageEnum[];
  jobSearchStatus?:
    | CandidateJobSearchStatusEnum
    | CandidateJobSearchStatusEnum[];

  // Boolean filters
  isPublished?: boolean;

  // Range filters
  minExperience?: number;
  maxExperience?: number;
  minCompletionPercentage?: number;
  maxCompletionPercentage?: number;

  // Date range filters
  createdAfter?: Date;
  createdBefore?: Date;
  updatedAfter?: Date;
  updatedBefore?: Date;

  // Additional filters
  industries?: string[];
  languages?: string[];
  currentCompanies?: string[];
}

/**
 * @openapi
 * components:
 *   parameters:
 *     IPartnerCandidateFilterQuerySearch:
 *       in: query
 *       name: search
 *       required: false
 *       schema:
 *         type: string
 *         description: Global search across all searchable fields
 *     IPartnerCandidateFilterQuerySearchColumns:
 *       in: query
 *       name: searchColumns
 *       required: false
 *       schema:
 *         type: array
 *         items:
 *           type: string
 *         description: Specific columns to search in
 *       example: ["name", "email", "jobTitle"]
 *     IPartnerCandidateFilterQueryEmail:
 *       in: query
 *       name: email
 *       required: false
 *       schema:
 *         type: string
 *         format: email
 *         description: Filter by candidate email
 *     IPartnerCandidateFilterQueryName:
 *       in: query
 *       name: name
 *       required: false
 *       schema:
 *         type: string
 *         description: Filter by candidate name
 *     IPartnerCandidateFilterQueryJobTitle:
 *       in: query
 *       name: jobTitle
 *       required: false
 *       schema:
 *         type: string
 *         description: Filter by job title
 *     IPartnerCandidateFilterQueryCompany:
 *       in: query
 *       name: company
 *       required: false
 *       schema:
 *         type: string
 *         description: Filter by current company
 *     IPartnerCandidateFilterQueryIndustry:
 *       in: query
 *       name: industry
 *       required: false
 *       schema:
 *         type: string
 *         description: Filter by industry
 *     IPartnerCandidateFilterQueryLocation:
 *       in: query
 *       name: location
 *       required: false
 *       schema:
 *         type: string
 *         description: Filter by location
 *     IPartnerCandidateFilterQuerySkills:
 *       in: query
 *       name: skills
 *       required: false
 *       schema:
 *         type: array
 *         items:
 *           type: string
 *         description: Filter by skills
 *     IPartnerCandidateFilterQueryStatus:
 *       in: query
 *       name: status
 *       required: false
 *       schema:
 *         $ref: '#/components/schemas/CandidateStatusEnum'
 *         description: Filter by candidate status
 *     IPartnerCandidateFilterQueryAssessmentStage:
 *       in: query
 *       name: assessmentStage
 *       required: false
 *       schema:
 *         $ref: '#/components/schemas/CandidateAssessmentStageEnum'
 *         description: Filter by candidate assessment stage
 *     IPartnerCandidateFilterQueryJobSearchStatus:
 *       in: query
 *       name: jobSearchStatus
 *       required: false
 *       schema:
 *         $ref: '#/components/schemas/CandidateJobSearchStatusEnum'
 *         description: Filter by candidate job search status
 *     IPartnerCandidateFilterQueryIsPublished:
 *       in: query
 *       name: isPublished
 *       required: false
 *       schema:
 *         type: boolean
 *         description: Filter by whether candidate profile is published
 *     IPartnerCandidateFilterQueryMinExperience:
 *       in: query
 *       name: minExperience
 *       required: false
 *       schema:
 *         type: integer
 *         description: Minimum years of experience
 *     IPartnerCandidateFilterQueryMaxExperience:
 *       in: query
 *       name: maxExperience
 *       required: false
 *       schema:
 *         type: integer
 *         description: Maximum years of experience
 */

/**
 * @openapi
 * components:
 *   parameters:
 *     IPartnerCandidateIdParams:
 *       in: path
 *       name: candidateId
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *         description: Unique identifier for the candidate
 */
export interface IPartnerCandidateIdParams {
  candidateId: string;
}

/**
 * Helper function to convert database models to basic domain models
 * This handles the relationship between User and Candidate
 */
export function toPartnerCandidateDomain(candidate?: any): IPartnerCandidate {
  return {
    id: candidate.id,
    userId: candidate.userId,
    email: candidate.user.email,
    name: candidate.user.name,
    jobTitle: candidate.user.jobTitle,
    image: candidate.user.image,
    status: candidate.status,
    assessmentStage: candidate.assessmentStage,
    jobSearchStatus: candidate.jobSearchStatus,
    isPublished: candidate.isPublished,
    completionPercentage: candidate.completionPercentage,
    sex: candidate.sex,
    birthDate: candidate.birthDate,
    maritalStatus: candidate.maritalStatus,
    partnerId: candidate.partnerId,
    deletedAt: candidate.deletedAt,
    updatedBy: candidate.updatedBy,
    createdAt: candidate.createdAt,
    updatedAt: candidate.updatedAt,
  };
}

/**
 * Helper function to convert database models to detailed domain models
 * This includes all related information like resume, settings, preferences, etc.
 */
export function toPartnerCandidateDetailedDomain(
  candidate?: any
): IPartnerCandidateDetailed {
  return {
    id: candidate.id,
    userId: candidate.userId,
    email: candidate.user.email,
    name: candidate.user.name,
    jobTitle: candidate.user.jobTitle,
    image: candidate.user.image,
    role: candidate.user.role,
    userStatus: candidate.user.status,
    status: candidate.status,
    assessmentStage: candidate.assessmentStage,
    resumeAssessmentStatus: candidate.resumeAssessmentStatus,
    onboardingAssessmentStatus: candidate.onboardingAssessmentStatus,
    jobSearchStatus: candidate.jobSearchStatus,
    isPublished: candidate.isPublished,
    completionPercentage: candidate.completionPercentage,
    sex: candidate.sex,
    birthDate: candidate.birthDate,
    maritalStatus: candidate.maritalStatus,
    phone: candidate.resume?.phone,
    location: candidate.resume?.location,
    totalExperience: candidate.resume?.totalExperience,
    currentCompany: candidate.resume?.currentCompany,
    currentIndustry: candidate.resume?.currentIndustry,
    summary: candidate.resume?.summary,
    skills: candidate.resume?.resumeSkills,
    industries: candidate.resume?.industries,
    languages: candidate.resume?.languages,
    resume: candidate.resume
      ? {
          id: candidate.resume.id,
          candidateId: candidate.resume.candidateId,
          name: candidate.resume.name,
          email: candidate.resume.email,
          jobTitle: candidate.resume.jobTitle,
          image: candidate.resume.image,
          sex: candidate.resume.sex,
          birthDate: candidate.resume.birthDate,
          maritalStatus: candidate.resume.maritalStatus,
          phone: candidate.resume.phone,
          location: candidate.resume.location,
          summary: candidate.resume.summary,
          primaryIndustry: candidate.resume.primaryIndustry,
          totalExperience: candidate.resume.totalExperience,
          currentJobTitle: candidate.resume.currentJobTitle,
          currentCompany: candidate.resume.currentCompany,
          currentIndustry: candidate.resume.currentIndustry,
          currentWorkLocation: candidate.resume.currentWorkLocation,
          currentWorkType: candidate.resume.currentWorkType,
          currentWorkCommitment: candidate.resume.currentWorkCommitment,
          currentWorkSchedule: candidate.resume.currentWorkSchedule,
          currentSalary: candidate.resume.currentSalary,
          currentSalaryCurrency: candidate.resume.currentSalaryCurrency,
          availableFrom: candidate.resume.availableFrom,
          noticePeriod: candidate.resume.noticePeriod,
          highestEducationLevel: candidate.resume.highestEducationLevel,
          resumeSkills: candidate.resume.resumeSkills,
          industries: candidate.resume.industries,
          languages: candidate.resume.languages,
          social: candidate.resume.social,
          certifications: candidate.resume.certifications || [],
          education: candidate.resume.education || [],
          experience: candidate.resume.experience || [],
          createdAt: candidate.resume.createdAt,
          updatedAt: candidate.resume.updatedAt,
          resumeFileUrl: candidate.resume.resumeFileUrl,
          parsingTask: candidate.resume.parsingTask,
        }
      : undefined,
    settings: candidate.settings,
    preferences: candidate.preferences,
    resumeAssessment: candidate.resumeAssessment,
    partnerId: candidate.partnerId,
    deletedAt: candidate.deletedAt,
    updatedBy: candidate.updatedBy,
    createdAt: candidate.createdAt,
    updatedAt: candidate.updatedAt,
  };
}
