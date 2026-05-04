/**
 * @openapi
 * components:
 *   schemas:
 *     ClientAdminAnalyticsResponse:
 *       type: object
 *       properties:
 *         activeJobPostings:
 *           type: object
 *           properties:
 *             totalCount:
 *               type: number
 *               description: Total number of job postings
 *             activeCount:
 *               type: number
 *               description: Number of active job postings
 *             draftCount:
 *               type: number
 *               description: Number of draft job postings
 *             closedCount:
 *               type: number
 *               description: Number of closed job postings
 *             archivedCount:
 *               type: number
 *               description: Number of archived job postings
 *             byIndustry:
 *               type: object
 *               additionalProperties:
 *                 type: number
 *               description: Job postings count by industry
 *             byJobType:
 *               type: object
 *               additionalProperties:
 *                 type: number
 *               description: Job postings count by job type
 *             featuredCount:
 *               type: number
 *               description: Number of featured job postings
 *             remoteCount:
 *               type: number
 *               description: Number of remote job postings
 *             recentlyAdded:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   status:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   numberOfApplications:
 *                     type: number
 *                   numberOfViews:
 *                     type: number
 *         aiAssessments:
 *           type: object
 *           properties:
 *             totalCount:
 *               type: number
 *               description: Total number of AI assessments
 *             completedCount:
 *               type: number
 *               description: Number of completed AI assessments
 *             inProgressCount:
 *               type: number
 *               description: Number of in-progress AI assessments
 *             passedCount:
 *               type: number
 *               description: Number of passed AI assessments
 *             failedCount:
 *               type: number
 *               description: Number of failed AI assessments
 *             byJobPosting:
 *               type: object
 *               additionalProperties:
 *                 type: number
 *               description: AI assessments count by job posting
 *             recentAssessments:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   candidateId:
 *                     type: string
 *                   candidateName:
 *                     type: string
 *                   jobPostingId:
 *                     type: string
 *                   jobTitle:
 *                     type: string
 *                   status:
 *                     type: string
 *                   score:
 *                     type: number
 *                   startedAt:
 *                     type: string
 *                     format: date-time
 *                   completedAt:
 *                     type: string
 *                     format: date-time
 *         pendingInterviews:
 *           type: object
 *           properties:
 *             totalCount:
 *               type: number
 *               description: Total number of interviews
 *             pendingCount:
 *               type: number
 *               description: Number of pending interviews
 *             scheduledCount:
 *               type: number
 *               description: Number of scheduled interviews
 *             completedCount:
 *               type: number
 *               description: Number of completed interviews
 *             byJobPosting:
 *               type: object
 *               additionalProperties:
 *                 type: number
 *               description: Interviews count by job posting
 *             pendingInterviews:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   candidateId:
 *                     type: string
 *                   candidateName:
 *                     type: string
 *                   jobPostingId:
 *                     type: string
 *                   jobTitle:
 *                     type: string
 *                   status:
 *                     type: string
 *                   appliedAt:
 *                     type: string
 *                     format: date-time
 *         activeCandidates:
 *           type: object
 *           properties:
 *             totalCount:
 *               type: number
 *               description: Total number of candidates
 *             activeCount:
 *               type: number
 *               description: Number of active candidates
 *             byJobPosting:
 *               type: object
 *               additionalProperties:
 *                 type: number
 *               description: Candidates count by job posting
 *             recentApplications:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   candidateId:
 *                     type: string
 *                   candidateName:
 *                     type: string
 *                   jobPostingId:
 *                     type: string
 *                   jobTitle:
 *                     type: string
 *                   status:
 *                     type: string
 *                   appliedAt:
 *                     type: string
 *                     format: date-time
 *         teamMembers:
 *           type: object
 *           properties:
 *             totalCount:
 *               type: number
 *               description: Total number of team members
 *             byRole:
 *               type: object
 *               properties:
 *                 admin:
 *                   type: number
 *                   description: Number of admin users
 *                 hr:
 *                   type: number
 *                   description: Number of HR users
 *                 recruiter:
 *                   type: number
 *                   description: Number of recruiter users
 *                 accounts:
 *                   type: number
 *                   description: Number of accounts users
 *                 other:
 *                   type: number
 *                   description: Number of other users
 *             activeCount:
 *               type: number
 *               description: Number of active team members
 *             inactiveCount:
 *               type: number
 *               description: Number of inactive team members
 *             recentlyAdded:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   userId:
 *                     type: string
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   role:
 *                     type: string
 *                   status:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *         candidateOnboarding:
 *           type: object
 *           properties:
 *             totalCount:
 *               type: number
 *               description: Total number of candidates in onboarding
 *             completedCount:
 *               type: number
 *               description: Number of candidates who have completed onboarding
 *             inProgressCount:
 *               type: number
 *               description: Number of candidates with onboarding in progress
 *             pendingCount:
 *               type: number
 *               description: Number of candidates with pending onboarding
 *             byStatus:
 *               type: object
 *               additionalProperties:
 *                 type: number
 *               description: Onboarding count by status
 *             recentOnboarding:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   candidateId:
 *                     type: string
 *                   candidateName:
 *                     type: string
 *                   status:
 *                     type: string
 *                   score:
 *                     type: number
 *                   startedAt:
 *                     type: string
 *                     format: date-time
 *                   completedAt:
 *                     type: string
 *                     format: date-time
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     JobPostingAnalyticsResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: object
 *           properties:
 *             totalCount:
 *               type: number
 *               description: Total number of job postings
 *             activeCount:
 *               type: number
 *               description: Number of active job postings
 *             draftCount:
 *               type: number
 *               description: Number of draft job postings
 *             closedCount:
 *               type: number
 *               description: Number of closed job postings
 *             archivedCount:
 *               type: number
 *               description: Number of archived job postings
 *             byIndustry:
 *               type: object
 *               additionalProperties:
 *                 type: number
 *               description: Job postings count by industry
 *             byJobType:
 *               type: object
 *               additionalProperties:
 *                 type: number
 *               description: Job postings count by job type
 *             featuredCount:
 *               type: number
 *               description: Number of featured job postings
 *             remoteCount:
 *               type: number
 *               description: Number of remote job postings
 *             recentlyAdded:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   status:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   numberOfApplications:
 *                     type: number
 *                   numberOfViews:
 *                     type: number
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     AiAssessmentAnalyticsResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: object
 *           properties:
 *             totalCount:
 *               type: number
 *               description: Total number of AI assessments
 *             completedCount:
 *               type: number
 *               description: Number of completed AI assessments
 *             inProgressCount:
 *               type: number
 *               description: Number of in-progress AI assessments
 *             passedCount:
 *               type: number
 *               description: Number of passed AI assessments
 *             failedCount:
 *               type: number
 *               description: Number of failed AI assessments
 *             byJobPosting:
 *               type: object
 *               additionalProperties:
 *                 type: number
 *               description: AI assessments count by job posting
 *             recentAssessments:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   candidateId:
 *                     type: string
 *                   candidateName:
 *                     type: string
 *                   jobPostingId:
 *                     type: string
 *                   jobTitle:
 *                     type: string
 *                   status:
 *                     type: string
 *                   score:
 *                     type: number
 *                   startedAt:
 *                     type: string
 *                     format: date-time
 *                   completedAt:
 *                     type: string
 *                     format: date-time
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     InterviewAnalyticsResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: object
 *           properties:
 *             totalCount:
 *               type: number
 *               description: Total number of interviews
 *             pendingCount:
 *               type: number
 *               description: Number of pending interviews
 *             scheduledCount:
 *               type: number
 *               description: Number of scheduled interviews
 *             completedCount:
 *               type: number
 *               description: Number of completed interviews
 *             byJobPosting:
 *               type: object
 *               additionalProperties:
 *                 type: number
 *               description: Interviews count by job posting
 *             pendingInterviews:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   candidateId:
 *                     type: string
 *                   candidateName:
 *                     type: string
 *                   jobPostingId:
 *                     type: string
 *                   jobTitle:
 *                     type: string
 *                   status:
 *                     type: string
 *                   appliedAt:
 *                     type: string
 *                     format: date-time
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     CandidateAnalyticsResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: object
 *           properties:
 *             totalCount:
 *               type: number
 *               description: Total number of candidates
 *             activeCount:
 *               type: number
 *               description: Number of active candidates
 *             byJobPosting:
 *               type: object
 *               additionalProperties:
 *                 type: number
 *               description: Candidates count by job posting
 *             recentApplications:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   candidateId:
 *                     type: string
 *                   candidateName:
 *                     type: string
 *                   jobPostingId:
 *                     type: string
 *                   jobTitle:
 *                     type: string
 *                   status:
 *                     type: string
 *                   appliedAt:
 *                     type: string
 *                     format: date-time
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     TeamMemberAnalyticsResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: object
 *           properties:
 *             totalCount:
 *               type: number
 *               description: Total number of team members
 *             byRole:
 *               type: object
 *               properties:
 *                 admin:
 *                   type: number
 *                   description: Number of admin users
 *                 hr:
 *                   type: number
 *                   description: Number of HR users
 *                 recruiter:
 *                   type: number
 *                   description: Number of recruiter users
 *                 accounts:
 *                   type: number
 *                   description: Number of accounts users
 *                 other:
 *                   type: number
 *                   description: Number of other users
 *             activeCount:
 *               type: number
 *               description: Number of active team members
 *             inactiveCount:
 *               type: number
 *               description: Number of inactive team members
 *             recentlyAdded:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   userId:
 *                     type: string
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   role:
 *                     type: string
 *                   status:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     CandidateOnboardingAnalyticsResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: object
 *           properties:
 *             totalCount:
 *               type: number
 *               description: Total number of candidates in onboarding
 *             completedCount:
 *               type: number
 *               description: Number of candidates who have completed onboarding
 *             inProgressCount:
 *               type: number
 *               description: Number of candidates with onboarding in progress
 *             pendingCount:
 *               type: number
 *               description: Number of candidates with pending onboarding
 *             byStatus:
 *               type: object
 *               additionalProperties:
 *                 type: number
 *               description: Onboarding count by status
 *             recentOnboarding:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   candidateId:
 *                     type: string
 *                   candidateName:
 *                     type: string
 *                   status:
 *                     type: string
 *                   score:
 *                     type: number
 *                   startedAt:
 *                     type: string
 *                     format: date-time
 *                   completedAt:
 *                     type: string
 *                     format: date-time
 */

import { IClientAnalytics } from '../../domain/client/client.admin.analytics.domain';
import {
  IJobPostingAnalytics,
  IAiAssessmentAnalytics,
  IPanelAssessmentAnalytics,
  ICandidateAnalytics,
  ITeamMemberAnalytics,
  ICandidateOnboardingAnalytics,
} from '../../domain/client/client.admin.analytics.domain';

export interface IClientAdminAnalyticsApiResponse {
  data: IClientAnalytics;
}

export interface IJobPostingAnalyticsApiResponse {
  data: IJobPostingAnalytics;
}

export interface IAiAssessmentAnalyticsApiResponse {
  data: IAiAssessmentAnalytics;
}

export interface IPanelAssessmentAnalyticsApiResponse {
  data: IPanelAssessmentAnalytics;
}

export interface ICandidateAnalyticsApiResponse {
  data: ICandidateAnalytics;
}

export interface ITeamMemberAnalyticsApiResponse {
  data: ITeamMemberAnalytics;
}

export interface ICandidateOnboardingAnalyticsApiResponse {
  data: ICandidateOnboardingAnalytics;
}
