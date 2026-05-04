import {
  UserRoleEnum,
  UserStatusEnum,
  JobSearchStatusEnum,
  SexEnum,
  MaritalStatusEnum,
  CandidateStatusEnum,
  CandidateAssessmentStageEnum,
  CandidateResumeAssessmentStatusEnum,
  CandidateOnboardingAssessmentStatusEnum,
} from '../../common/enums';
import { IUser } from '../user/user.domain';
import {
  ICandidatePreferences,
  ICandidateSettings,
  toCandidatePreferencesDomain,
  toCandidateSettingsDomain,
} from './profile.settings.domain';
import { IResumeAssessment } from './resume.assessment.domain';
import { IResume } from './resume.domain';
import { ICandidateOnboardingAssessment } from './onboarding.assessment.domain';

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The candidate ID
 *         name:
 *           type: string
 *           description: Candidate's full name
 *         email:
 *           type: string
 *           format: email
 *           description: Candidate's email address
 *         role:
 *           type: string
 *           ref: '#/components/schemas/UserRoleEnum'
 *           description: Candidate's role
 *         status:
 *           type: string
 *           ref: '#/components/schemas/UserStatusEnum'
 *           description: Candidate's account status
 *         candidateStatus:
 *           type: string
 *           ref: '#/components/schemas/CandidateStatusEnum'
 *           description: Candidate's status
 *         assessmentStage:
 *           type: string
 *           ref: '#/components/schemas/CandidateAssessmentStageEnum'
 *           description: Candidate's assessment stage
 *         resumeAssessmentStatus:
 *           type: string
 *           ref: '#/components/schemas/CandidateResumeAssessmentStatusEnum'
 *           description: Candidate's resume assessment status
 *         onboardingAssessmentStatus:
 *           type: string
 *           ref: '#/components/schemas/CandidateOnboardingAssessmentStatusEnum'
 *           description: Candidate's onboarding assessment status
 *         isPublished:
 *           type: boolean
 *           description: Whether the profile is published
 *         isInviteSignup:
 *           type: boolean
 *           description: Whether the candidate registered via an invite link
 *         completionPercentage:
 *           type: integer
 *           description: Profile completion percentage
 *         jobSearchStatus:
 *           type: string
 *           ref: '#/components/schemas/JobSearchStatusEnum'
 *           description: Candidate's job search status
 *         jobTitle:
 *           type: string
 *           description: Candidate's job title
 *         image:
 *           type: string
 *           description: URL to candidate's profile picture
 *         sex:
 *           type: string
 *           ref: '#/components/schemas/SexEnum'
 *           description: Candidate's sex
 *         birthDate:
 *           type: string
 *           format: date-time
 *           description: Candidate's birth date
 *         maritalStatus:
 *           type: string
 *           ref: '#/components/schemas/MaritalStatusEnum'
 *         settings:
 *           type: object
 *           ref: '#/components/schemas/ICandidateSettings'
 *           description: Candidate's settings
 *         preferences:
 *           type: object
 *           ref: '#/components/schemas/ICandidatePreferences'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the profile was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the profile was last updated
 */
export interface ICandidateProfile {
  candidateId: string;
  name: string;
  email: string;
  role: UserRoleEnum;
  status: UserStatusEnum;
  user?: IUser;
  resume?: IResume;
  candidateStatus: CandidateStatusEnum;
  assessmentStage: CandidateAssessmentStageEnum;
  resumeAssessmentStatus: CandidateResumeAssessmentStatusEnum;
  onboardingAssessmentStatus: CandidateOnboardingAssessmentStatusEnum;
  isPublished: boolean;
  isInviteSignup: boolean;
  completionPercentage: number;
  jobSearchStatus: JobSearchStatusEnum;
  jobTitle?: string;
  image?: string;
  sex?: SexEnum;
  birthDate?: Date;
  maritalStatus?: MaritalStatusEnum;
  settings?: ICandidateSettings;
  preferences?: ICandidatePreferences;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateProfileBasicUpdate:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Candidate's full name
 *         jobTitle:
 *           type: string
 *           description: Candidate's job title
 *         sex:
 *           type: string
 *           ref: '#/components/schemas/SexEnum'
 *         birthDate:
 *           type: string
 *           format: date-time
 *           description: Candidate's birth date
 *         maritalStatus:
 *           type: string
 *           ref: '#/components/schemas/MaritalStatusEnum'
 *         jobSearchStatus:
 *           type: string
 *           ref: '#/components/schemas/JobSearchStatusEnum'
 */
export interface ICandidateProfileBasicUpdate {
  name?: string;
  jobTitle?: string;
  sex?: SexEnum;
  birthDate?: Date;
  maritalStatus?: MaritalStatusEnum;
  jobSearchStatus?: JobSearchStatusEnum;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateProfilePasswordChange:
 *       type: object
 *       required:
 *         - currentPassword
 *         - newPassword
 *       properties:
 *         currentPassword:
 *           type: string
 *           description: Candidate's current password
 *         newPassword:
 *           type: string
 *           description: Candidate's new password
 */
export interface ICandidateProfilePasswordChange {
  currentPassword: string;
  newPassword: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateProfilePhotoUpdate:
 *       type: object
 *       properties:
 *         fileName:
 *           type: string
 *           description: Name of the uploaded file
 */
export type ICandidateProfilePhotoUpdate = {
  fileName: string;
};

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateProfilePhotoUrl:
 *       type: object
 *       properties:
 *         fileName:
 *           type: string
 *           description: Name of the uploaded file
 *         presignedUrl:
 *           type: string
 *           description: URL to candidate's profile picture
 */
export interface ICandidateProfilePhotoUrl {
  fileName: string;
  presignedUrl: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateProfilePhotoDelete:
 *       type: object
 *       properties:
 *         softDelete:
 *           type: boolean
 *           description: Whether to soft delete the profile photo
 */
export interface ICandidateProfilePhotoDelete {
  softDelete: boolean;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateProfileAndResume:
 *       type: object
 *       properties:
 *         profile:
 *           type: object
 *           ref: '#/components/schemas/ICandidateProfile'
 *         resume:
 *           type: object
 *           ref: '#/components/schemas/IResume'
 *         onboardingAssessment:
 *           $ref: '#/components/schemas/ICandidateOnboardingAssessment'
 *           description: Complete onboarding assessment data
 *         resumeAssessment:
 *           $ref: '#/components/schemas/IResumeAssessment'
 *           description: Resume assessment data
 */
export interface ICandidateProfileAndResume {
  profile: ICandidateProfile;
  resume: IResume;
  onboardingAssessment?: ICandidateOnboardingAssessment;
  resumeAssessment?: IResumeAssessment;
}

/**
 * Helper function to convert database model to domain model
 */
export function toCandidateProfileDomain(
  user: any,
  candidate?: any
): ICandidateProfile {
  return {
    candidateId: candidate.id,
    name: user.name,
    email: user.email,

    role: user.role,
    status: user.status,

    candidateStatus: candidate.status,
    assessmentStage: candidate.assessmentStage,
    resumeAssessmentStatus: candidate.resumeAssessmentStatus,
    onboardingAssessmentStatus: candidate.onboardingAssessmentStatus,
    jobSearchStatus: candidate.jobSearchStatus,
    isPublished: candidate.isPublished,
    isInviteSignup: Boolean(candidate.isInviteSignup),
    completionPercentage: candidate.completionPercentage,

    jobTitle: user.jobTitle,
    image: user.image,
    sex: candidate.sex,
    birthDate: candidate.birthDate,
    maritalStatus: candidate.maritalStatus,

    settings: candidate.settings
      ? toCandidateSettingsDomain(candidate.settings)
      : undefined,
    preferences: candidate?.preferences
      ? toCandidatePreferencesDomain(candidate.preferences)
      : undefined,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
