import {
  CertificationLevelEnum,
  EducationLevelEnum,
  WorkTypeEnum,
  WorkCommitmentEnum,
  WorkScheduleEnum,
  NoticePeriodEnum,
  SexEnum,
  MaritalStatusEnum,
  USWorkAuthorizationStatusEnum,
} from '../../common/enums';
import {
  IResumeParsingTask,
  toResumeParsingTaskDomain,
} from './resume.parsing.domain';

/**
 * @openapi
 * components:
 *   schemas:
 *     IResume:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The resume ID
 *         candidateId:
 *           type: string
 *           description: The candidate ID
 *         phone:
 *           type: string
 *           description: Candidate's phone number
 *         location:
 *           type: string
 *           description: Candidate's location
 *         summary:
 *           type: string
 *           description: Professional summary
 *         primaryIndustry:
 *           type: string
 *           description: Primary industry
 *         totalExperience:
 *           type: integer
 *           description: Total years of experience
 *         currentJobTitle:
 *           type: string
 *           description: Current job title
 *         currentCompany:
 *           type: string
 *           description: Current company
 *         currentIndustry:
 *           type: string
 *           description: Current industry
 *         currentWorkLocation:
 *           type: string
 *           description: Current work location
 *         currentWorkType:
 *           $ref: '#/components/schemas/WorkTypeEnum'
 *           description: Current work type
 *         currentWorkCommitment:
 *           $ref: '#/components/schemas/WorkCommitmentEnum'
 *           description: Current work commitment
 *         currentWorkSchedule:
 *           $ref: '#/components/schemas/WorkScheduleEnum'
 *           description: Current work schedule
 *         currentSalary:
 *           type: number
 *           description: Current salary
 *         currentSalaryCurrency:
 *           type: string
 *           description: Currency of current salary
 *         availableFrom:
 *           type: string
 *           format: date-time
 *           description: Date from which candidate is available
 *         noticePeriod:
 *           $ref: '#/components/schemas/NoticePeriodEnum'
 *           description: Notice period
 *         resumeSkills:
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
 *         social:
 *           $ref: '#/components/schemas/IResumeSocial'
 *         certifications:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IResumeCertification'
 *         education:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IResumeEducation'
 *         experience:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IResumeExperience'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         resumeFileUrl:
 *           type: string
 *           description: URL of the uploaded resume file
 *         parsingTask:
 *           $ref: '#/components/schemas/IResumeParsingTask'
 *         isUSWorkAuthorized:
 *           type: boolean
 *           description: Is the candidate legally authorized to work in the United States
 *         requiresUSVisaSponsorship:
 *           type: boolean
 *           description: Will the candidate require sponsorship for employment visa status
 *         usWorkAuthorizationStatus:
 *           $ref: '#/components/schemas/USWorkAuthorizationStatusEnum'
 *           description: Current work authorization status in USA
 *         usWorkAuthorizationDetails:
 *           type: string
 *           description: Additional details about USA work authorization
 */
export interface IResume {
  id: string;
  candidateId: string;

  name: string;
  email: string;
  jobTitle?: string;
  image?: string;
  sex?: SexEnum;
  birthDate?: Date;
  maritalStatus?: MaritalStatusEnum;

  phone?: string;
  location?: string;
  summary: string;
  primaryIndustry: string;
  totalExperience: number;
  currentJobTitle?: string;
  currentCompany?: string;
  currentIndustry?: string;
  currentWorkLocation?: string;
  currentWorkType?: WorkTypeEnum;
  currentWorkCommitment?: WorkCommitmentEnum;
  currentWorkSchedule?: WorkScheduleEnum;
  currentSalary?: number;
  currentSalaryCurrency?: string;
  availableFrom?: Date;
  noticePeriod?: NoticePeriodEnum;
  highestEducationLevel: EducationLevelEnum;
  resumeSkills: string[];
  industries: string[];
  languages: string[];

  // USA Work Authorization fields
  isUSWorkAuthorized?: boolean;
  requiresUSVisaSponsorship?: boolean;
  usWorkAuthorizationStatus?: USWorkAuthorizationStatusEnum;
  usWorkAuthorizationDetails?: string;

  social?: IResumeSocial;
  certifications: IResumeCertification[];
  education: IResumeEducation[];
  experience: IResumeExperience[];
  createdAt: Date;
  updatedAt: Date;
  resumeFileUrl?: string;
  parsingTask?: IResumeParsingTask;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeUpdate:
 *       type: object
 *       properties:
 *         phone:
 *           type: string
 *         location:
 *           type: string
 *         summary:
 *           type: string
 *         primaryIndustry:
 *           type: string
 *         totalExperience:
 *           type: number
 *         currentJobTitle:
 *           type: string
 *         currentCompany:
 *           type: string
 *         currentIndustry:
 *           type: string
 *         currentWorkLocation:
 *           type: string
 *         currentWorkType:
 *           $ref: '#/components/schemas/WorkTypeEnum'
 *         currentWorkCommitment:
 *           $ref: '#/components/schemas/WorkCommitmentEnum'
 *         currentWorkSchedule:
 *           $ref: '#/components/schemas/WorkScheduleEnum'
 *         currentSalary:
 *           type: number
 *         currentSalaryCurrency:
 *           type: string
 *         availableFrom:
 *           type: string
 *           format: date-time
 *         noticePeriod:
 *           $ref: '#/components/schemas/NoticePeriodEnum'
 *         highestEducationLevel:
 *           $ref: '#/components/schemas/EducationLevelEnum'
 *         resumeSkills:
 *           type: array
 *           items:
 *             type: string
 *         industries:
 *           type: array
 *           items:
 *             type: string
 *         languages:
 *           type: array
 *           items:
 *             type: string
 *         isUSWorkAuthorized:
 *           type: boolean
 *         requiresUSVisaSponsorship:
 *           type: boolean
 *         usWorkAuthorizationStatus:
 *           $ref: '#/components/schemas/USWorkAuthorizationStatusEnum'
 *         usWorkAuthorizationDetails:
 *           type: string
 */
export interface IResumeUpdate {
  phone?: string;
  location?: string;
  summary?: string;
  primaryIndustry?: string;
  highestEducationLevel?: EducationLevelEnum;
  totalExperience?: number;
  currentJobTitle?: string;
  currentCompany?: string;
  currentIndustry?: string;
  currentWorkLocation?: string;
  currentWorkType?: WorkTypeEnum;
  currentWorkCommitment?: WorkCommitmentEnum;
  currentWorkSchedule?: WorkScheduleEnum;
  currentSalary?: number;
  currentSalaryCurrency?: string;
  availableFrom?: Date;
  noticePeriod?: NoticePeriodEnum;
  resumeSkills?: string[];
  industries?: string[];
  languages?: string[];

  // USA Work Authorization fields
  isUSWorkAuthorized?: boolean;
  requiresUSVisaSponsorship?: boolean;
  usWorkAuthorizationStatus?: USWorkAuthorizationStatusEnum;
  usWorkAuthorizationDetails?: string;

  experience?: IResumeExperienceUpdate[];
  education?: IResumeEducationUpdate[];
  certifications?: IResumeCertificationUpdate[];
  social?: IResumeSocialUpdate;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeSocial:
 *       type: object
 *       properties:
 *         linkedin:
 *           type: string
 *         twitter:
 *           type: string
 *         github:
 *           type: string
 *         portfolio:
 *           type: string
 *         leetcode:
 *           type: string
 */
export interface IResumeSocial {
  id: string;
  linkedin?: string;
  twitter?: string;
  github?: string;
  portfolio?: string;
  leetcode?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeSocialUpdate:
 *       type: object
 *       properties:
 *         linkedin:
 *           type: string
 *         twitter:
 *           type: string
 *         github:
 *           type: string
 *         portfolio:
 *           type: string
 *         leetcode:
 *           type: string
 */
export interface IResumeSocialUpdate {
  linkedin?: string;
  twitter?: string;
  github?: string;
  portfolio?: string;
  leetcode?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeCertification:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         issuer:
 *           type: string
 *         issueDate:
 *           type: string
 *           format: date-time
 *         expiryDate:
 *           type: string
 *           format: date-time
 *         credentialId:
 *           type: string
 *         credentialUrl:
 *           type: string
 *         level:
 *           $ref: '#/components/schemas/CertificationLevelEnum'
 *         category:
 *           type: string
 *         description:
 *           type: string
 */
export interface IResumeCertification {
  id: string;
  name: string;
  issuer: string;
  issueDate: Date;
  expiryDate?: Date;
  credentialId?: string;
  credentialUrl?: string;
  level?: CertificationLevelEnum;
  category?: string;
  description?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeCertificationCreate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         issuer:
 *           type: string
 *         issueDate:
 *           type: string
 *           format: date-time
 *         expiryDate:
 *           type: string
 *           format: date-time
 *         credentialId:
 *           type: string
 *         credentialUrl:
 *           type: string
 *         level:
 *           $ref: '#/components/schemas/CertificationLevelEnum'
 *         category:
 *           type: string
 *         description:
 *           type: string
 *       required:
 *         - name
 *         - issuer
 *         - issueDate
 */
export interface IResumeCertificationCreate {
  name: string;
  issuer: string;
  issueDate: Date;
  expiryDate?: Date;
  credentialId?: string;
  credentialUrl?: string;
  level?: CertificationLevelEnum;
  category?: string;
  description?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeCertificationUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         issuer:
 *           type: string
 *         issueDate:
 *           type: string
 *           format: date-time
 *         expiryDate:
 *           type: string
 *           format: date-time
 *         credentialId:
 *           type: string
 *         credentialUrl:
 *           type: string
 *         level:
 *           $ref: '#/components/schemas/CertificationLevelEnum'
 *         category:
 *           type: string
 *         description:
 *           type: string
 */
export interface IResumeCertificationUpdate {
  name?: string;
  issuer?: string;
  issueDate?: Date;
  expiryDate?: Date;
  credentialId?: string;
  credentialUrl?: string;
  level?: CertificationLevelEnum;
  category?: string;
  description?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeEducation:
 *       type: object
 *       properties:
 *         institution:
 *           type: string
 *         level:
 *           $ref: '#/components/schemas/EducationLevelEnum'
 *         degree:
 *           type: string
 *         fieldOfStudy:
 *           type: string
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         gpa:
 *           type: number
 *         achievements:
 *           type: array
 *           items:
 *             type: string
 */
export interface IResumeEducation {
  id: string;
  institution: string;
  level: EducationLevelEnum;
  degree: string;
  fieldOfStudy: string;
  startDate: Date;
  endDate?: Date;
  currentlyPursuing?: boolean;
  gpa?: number;
  achievements: string[];
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeEducationCreate:
 *       type: object
 *       properties:
 *         institution:
 *           type: string
 *         level:
 *           $ref: '#/components/schemas/EducationLevelEnum'
 *         degree:
 *           type: string
 *         fieldOfStudy:
 *           type: string
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         gpa:
 *           type: number
 *         achievements:
 *           type: array
 *           items:
 *             type: string
 */
export interface IResumeEducationCreate {
  institution: string;
  level: EducationLevelEnum;
  degree: string;
  fieldOfStudy: string;
  startDate: Date;
  endDate?: Date;
  gpa?: number;
  achievements: string[];
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeEducationUpdate:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         institution:
 *           type: string
 *         level:
 *           $ref: '#/components/schemas/EducationLevelEnum'
 *         degree:
 *           type: string
 *         fieldOfStudy:
 *           type: string
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         gpa:
 *           type: number
 *         achievements:
 *           type: array
 *           items:
 *             type: string
 */
export interface IResumeEducationUpdate {
  id: string;
  institution?: string;
  level?: EducationLevelEnum;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: Date;
  endDate?: Date;
  currentlyPursuing?: boolean;
  gpa?: number;
  achievements?: string[];
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeExperience:
 *       type: object
 *       properties:
 *         company:
 *           type: string
 *         position:
 *           type: string
 *         industry:
 *           type: string
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         description:
 *           type: string
 *         type:
 *           $ref: '#/components/schemas/WorkTypeEnum'
 *         commitment:
 *           $ref: '#/components/schemas/WorkCommitmentEnum'
 *         location:
 *           type: string
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *         achievements:
 *           type: array
 *           items:
 *             type: string
 *         projects:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IResumeProject'
 */
export interface IResumeExperience {
  id: string;
  company: string;
  position: string;
  industry: string;
  startDate: Date;
  endDate?: Date;
  currentlyWorking?: boolean;
  description: string;
  type: WorkTypeEnum;
  commitment: WorkCommitmentEnum;
  location?: string;
  skills: string[];
  achievements: string[];
  responsibilities: string[];
  projects: IResumeProject[];
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeExperienceCreate:
 *       type: object
 *       required:
 *         - company
 *         - position
 *         - industry
 *         - startDate
 *         - description
 *         - type
 *         - commitment
 *       properties:
 *         company:
 *           type: string
 *         position:
 *           type: string
 *         industry:
 *           type: string
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         description:
 *           type: string
 *         type:
 *           $ref: '#/components/schemas/WorkTypeEnum'
 *         commitment:
 *           $ref: '#/components/schemas/WorkCommitmentEnum'
 *         location:
 *           type: string
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *         achievements:
 *           type: array
 *           items:
 *             type: string
 */
export interface IResumeExperienceCreate {
  company: string;
  position: string;
  industry: string;
  startDate: Date;
  endDate?: Date;
  currentlyWorking?: boolean;
  description: string;
  type: WorkTypeEnum;
  commitment: WorkCommitmentEnum;
  location?: string;
  skills: string[];
  achievements: string[];
  responsibilities: string[];
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeExperienceUpdate:
 *       type: object
 *       required:
 *         - id
 *       properties:
 *         id:
 *           type: string
 *         company:
 *           type: string
 *         position:
 *           type: string
 *         industry:
 *           type: string
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         description:
 *           type: string
 *         type:
 *           $ref: '#/components/schemas/WorkTypeEnum'
 *         commitment:
 *           $ref: '#/components/schemas/WorkCommitmentEnum'
 *         location:
 *           type: string
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *         achievements:
 *           type: array
 *           items:
 *             type: string
 */
export interface IResumeExperienceUpdate {
  id: string;
  company?: string;
  position?: string;
  industry?: string;
  startDate?: Date;
  endDate?: Date;
  currentlyWorking?: boolean;
  description?: string;
  type?: WorkTypeEnum;
  commitment?: WorkCommitmentEnum;
  location?: string;
  skills?: string[];
  achievements?: string[];
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeProject:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         role:
 *           type: string
 *         teamSize:
 *           type: integer
 *         url:
 *           type: string
 *         githubUrl:
 *           type: string
 *         demoUrl:
 *           type: string
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *         responsibilities:
 *           type: array
 *           items:
 *             type: string
 *         achievements:
 *           type: array
 *           items:
 *             type: string
 *         challenges:
 *           type: array
 *           items:
 *             type: string
 *         solutions:
 *           type: array
 *           items:
 *             type: string
 *         impact:
 *           type: array
 *           items:
 *             type: string
 */
export interface IResumeProject {
  id: string;
  name: string;
  description: string;
  startDate?: Date;
  endDate?: Date;
  currentlyWorking?: boolean;
  role: string;
  teamSize?: number;
  url?: string;
  githubUrl?: string;
  demoUrl?: string;
  skills: string[];
  responsibilities: string[];
  achievements: string[];
  challenges: string[];
  solutions: string[];
  impact: string[];
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeProjectCreate:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - role
 *         - skills
 *         - responsibilities
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         role:
 *           type: string
 *         teamSize:
 *           type: number
 *         url:
 *           type: string
 *         githubUrl:
 *           type: string
 *         demoUrl:
 *           type: string
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *         responsibilities:
 *           type: array
 *           items:
 *             type: string
 *         achievements:
 *           type: array
 *           items:
 *             type: string
 *         challenges:
 *           type: array
 *           items:
 *             type: string
 *         solutions:
 *           type: array
 *           items:
 *             type: string
 *         impact:
 *           type: array
 *           items:
 *             type: string
 */
export interface IResumeProjectCreate {
  name: string;
  description: string;
  startDate?: Date;
  endDate?: Date;
  currentlyWorking?: boolean;
  role: string;
  teamSize?: number;
  url?: string;
  githubUrl?: string;
  demoUrl?: string;
  skills: string[];
  responsibilities: string[];
  achievements?: string[];
  challenges?: string[];
  solutions?: string[];
  impact?: string[];
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeProjectUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         role:
 *           type: string
 *         teamSize:
 *           type: number
 *         url:
 *           type: string
 *         githubUrl:
 *           type: string
 *         demoUrl:
 *           type: string
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *         responsibilities:
 *           type: array
 *           items:
 *             type: string
 *         achievements:
 *           type: array
 *           items:
 *             type: string
 *         challenges:
 *           type: array
 *           items:
 *             type: string
 *         solutions:
 *           type: array
 *           items:
 *             type: string
 *         impact:
 *           type: array
 *           items:
 *             type: string
 */
export interface IResumeProjectUpdate {
  name?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  currentlyWorking?: boolean;
  role?: string;
  teamSize?: number;
  url?: string;
  githubUrl?: string;
  demoUrl?: string;
  skills?: string[];
  responsibilities?: string[];
  achievements?: string[];
  challenges?: string[];
  solutions?: string[];
  impact?: string[];
}

/**
 * Helper function to convert database model to domain model
 */
export function toResumeDomain(resume: any): IResume {
  return {
    id: resume.id,

    // Candidate
    candidateId: resume.candidateId,
    name: resume.candidate.user.name,
    email: resume.candidate.user.email,
    jobTitle: resume.candidate.jobTitle || resume.candidate.user.jobTitle,
    image: resume.candidate.image,
    sex: resume.candidate.sex,
    birthDate: resume.candidate.birthDate,
    maritalStatus: resume.candidate.maritalStatus,

    highestEducationLevel: resume.highestEducationLevel,
    phone: resume.phone,
    location: resume.location,
    summary: resume.summary,
    primaryIndustry: resume.primaryIndustry,
    totalExperience: resume.totalExperience,
    currentJobTitle: resume.currentJobTitle,
    currentCompany: resume.currentCompany,
    currentIndustry: resume.currentIndustry,
    currentWorkLocation: resume.currentWorkLocation,
    currentWorkType: resume.currentWorkType,
    currentWorkCommitment: resume.currentWorkCommitment,
    currentWorkSchedule: resume.currentWorkSchedule,
    currentSalary: resume.currentSalary,
    currentSalaryCurrency: resume.currentSalaryCurrency,
    availableFrom: resume.availableFrom,
    noticePeriod: resume.noticePeriod,
    resumeSkills: resume.resumeSkills,
    industries: resume.industries,
    languages: resume.languages,

    // USA Work Authorization fields
    isUSWorkAuthorized: resume.isUSWorkAuthorized,
    requiresUSVisaSponsorship: resume.requiresUSVisaSponsorship,
    usWorkAuthorizationStatus: resume.usWorkAuthorizationStatus,
    usWorkAuthorizationDetails: resume.usWorkAuthorizationDetails,

    social: toResumeSocialDomain(resume.social),
    certifications: resume.certifications.map(toResumeCertificationDomain),
    education: resume.education.map(toResumeEducationDomain),
    experience: resume.experience.map(toResumeExperienceDomain),
    createdAt: resume.createdAt,
    updatedAt: resume.updatedAt,
    resumeFileUrl: resume.resumeFileUrl,
    parsingTask: resume.parsingTask
      ? toResumeParsingTaskDomain(resume.parsingTask)
      : undefined,
  };
}

/**
 * Helper function to convert database model to domain model
 */
export function toResumeSocialDomain(resumeSocial: any): IResumeSocial {
  return {
    id: resumeSocial?.id,
    linkedin: resumeSocial?.linkedin,
    twitter: resumeSocial?.twitter,
    github: resumeSocial?.github,
    portfolio: resumeSocial?.portfolio,
    leetcode: resumeSocial?.leetcode,
  };
}

/**
 * Helper function to convert database model to domain model
 */
export function toResumeCertificationDomain(
  certification: any
): IResumeCertification {
  return {
    id: certification.id,
    name: certification.name,
    issuer: certification.issuer,
    issueDate: certification.issueDate,
    expiryDate: certification.expiryDate,
    credentialId: certification.credentialId,
    credentialUrl: certification.credentialUrl,
    level: certification.level,
    category: certification.category,
    description: certification.description,
  };
}

/**
 * Helper function to convert database model to domain model
 */
export function toResumeEducationDomain(education: any): IResumeEducation {
  return {
    id: education.id,
    institution: education.institution,
    level: education.level,
    degree: education.degree,
    fieldOfStudy: education.fieldOfStudy,
    startDate: education.startDate,
    endDate: education.endDate,
    currentlyPursuing: education.currentlyPursuing,
    gpa: education.gpa,
    achievements: education.achievements,
  };
}

/**
 * Helper function to convert database model to domain model
 */
export function toResumeExperienceDomain(experience: any): IResumeExperience {
  return {
    id: experience.id,
    company: experience.company,
    position: experience.position,
    industry: experience.industry,
    startDate: experience.startDate,
    endDate: experience.endDate,
    currentlyWorking: experience.currentlyWorking,
    description: experience.description,
    type: experience.type,
    commitment: experience.commitment,
    location: experience.location,
    skills: experience.skills,
    achievements: experience.achievements,
    projects: experience.projects,
    responsibilities: experience.responsibilities,
  };
}

/**
 * Helper function to convert database model to domain model
 */
export function toResumeProjectDomain(project: any): IResumeProject {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    startDate: project.startDate,
    endDate: project.endDate,
    currentlyWorking: project.currentlyWorking,
    role: project.role,
    teamSize: project.teamSize,
    url: project.url,
    githubUrl: project.githubUrl,
    demoUrl: project.demoUrl,
    skills: project.skills,
    responsibilities: project.responsibilities,
    achievements: project.achievements,
    challenges: project.challenges,
    solutions: project.solutions,
    impact: project.impact,
  };
}
