/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportCandidateKpis:
 *       type: object
 *       description: Comprehensive candidate KPIs and statistics
 *       properties:
 *         total:
 *           type: number
 *           description: Total number of candidates
 *         invites:
 *           $ref: '#/components/schemas/ISupportCandidateInviteStats'
 *         signups:
 *           $ref: '#/components/schemas/ISupportCandidateSignupStats'
 *         profileCompletion:
 *           $ref: '#/components/schemas/ISupportCandidateProfileCompletionStats'
 *         candidateStatus:
 *           $ref: '#/components/schemas/ISupportCandidateStatusStats'
 *         jobSearchStatus:
 *           $ref: '#/components/schemas/ISupportCandidateJobSearchStatusStats'
 *         assessmentStage:
 *           $ref: '#/components/schemas/ISupportCandidateAssessmentStageStats'
 *         resumeAssessment:
 *           $ref: '#/components/schemas/ISupportCandidateResumeAssessmentStats'
 *         onboardingAssessment:
 *           $ref: '#/components/schemas/ISupportCandidateOnboardingAssessmentStats'
 *         jobAiAssessment:
 *           $ref: '#/components/schemas/ISupportCandidateJobAiAssessmentStats'
 *         recommendations:
 *           $ref: '#/components/schemas/ISupportCandidateRecommendationStats'
 *         engagement:
 *           $ref: '#/components/schemas/ISupportCandidateEngagementStats'
 *         subscription:
 *           $ref: '#/components/schemas/ISupportCandidateSubscriptionStats'
 *         userStatus:
 *           $ref: '#/components/schemas/ISupportCandidateUserStatusStats'
 */
export interface ISupportCandidateKpis {
  total: number;
  invites: ISupportCandidateInviteStats;
  signups: ISupportCandidateSignupStats;
  profileCompletion: ISupportCandidateProfileCompletionStats;
  candidateStatus: ISupportCandidateStatusStats;
  jobSearchStatus: ISupportCandidateJobSearchStatusStats;
  assessmentStage: ISupportCandidateAssessmentStageStats;
  resumeAssessment: ISupportCandidateResumeAssessmentStats;
  onboardingAssessment: ISupportCandidateOnboardingAssessmentStats;
  jobAiAssessment: ISupportCandidateJobAiAssessmentStats;
  recommendations: ISupportCandidateRecommendationStats;
  engagement: ISupportCandidateEngagementStats;
  subscription: ISupportCandidateSubscriptionStats;
  userStatus: ISupportCandidateUserStatusStats;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportCandidateInviteStats:
 *       type: object
 *       description: Candidate invitation statistics
 *       properties:
 *         total:
 *           type: number
 *           description: Total number of invitations sent
 *         supportInvitations:
 *           $ref: '#/components/schemas/ISupportInvitationStats'
 *         partnerInvitations:
 *           $ref: '#/components/schemas/IPartnerInvitationStats'
 *         jobInvitations:
 *           $ref: '#/components/schemas/IJobInvitationStats'
 *         jobAiAssessmentInvitations:
 *           $ref: '#/components/schemas/IJobAiAssessmentInvitationStats'
 */
export interface ISupportCandidateInviteStats {
  total: number;
  supportInvitations: ISupportInvitationStats;
  partnerInvitations: IPartnerInvitationStats;
  jobInvitations: IJobInvitationStats;
  jobAiAssessmentInvitations: IJobAiAssessmentInvitationStats;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportInvitationStats:
 *       type: object
 *       description: Support invitation statistics
 *       properties:
 *         total:
 *           type: number
 *         pending:
 *           type: number
 *         accepted:
 *           type: number
 *         expired:
 *           type: number
 *         withdrawn:
 *           type: number
 */
export interface ISupportInvitationStats {
  total: number;
  pending: number;
  accepted: number;
  expired: number;
  withdrawn: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerInvitationStats:
 *       type: object
 *       description: Partner invitation statistics
 *       properties:
 *         total:
 *           type: number
 *         pending:
 *           type: number
 *         accepted:
 *           type: number
 *         expired:
 *           type: number
 *         withdrawn:
 *           type: number
 */
export interface IPartnerInvitationStats {
  total: number;
  pending: number;
  accepted: number;
  expired: number;
  withdrawn: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobInvitationStats:
 *       type: object
 *       description: Job invitation statistics
 *       properties:
 *         total:
 *           type: number
 *         pending:
 *           type: number
 *         accepted:
 *           type: number
 *         declined:
 *           type: number
 *         expired:
 *           type: number
 *         cancelled:
 *           type: number
 *         withdrawn:
 *           type: number
 */
export interface IJobInvitationStats {
  total: number;
  pending: number;
  accepted: number;
  declined: number;
  expired: number;
  cancelled: number;
  withdrawn: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobAiAssessmentInvitationStats:
 *       type: object
 *       description: Job AI assessment invitation statistics
 *       properties:
 *         total:
 *           type: number
 *         pending:
 *           type: number
 *         accepted:
 *           type: number
 *         declined:
 *           type: number
 *         expired:
 *           type: number
 *         cancelled:
 *           type: number
 */
export interface IJobAiAssessmentInvitationStats {
  total: number;
  pending: number;
  accepted: number;
  declined: number;
  expired: number;
  cancelled: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IRecruiterInfo:
 *       type: object
 *       description: Recruiter information within account manager structure
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Recruiter ID
 *         name:
 *           type: string
 *           description: Recruiter name
 *         email:
 *           type: string
 *           format: email
 *           description: Recruiter email
 *         activeJobPostings:
 *           type: number
 *           description: Number of active job postings assigned to this recruiter
 */
export interface IRecruiterInfo {
  id: string;
  name: string;
  email: string;
  activeJobPostings: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IAccountManagerInfo:
 *       type: object
 *       description: Account manager information with nested recruiters
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Account manager ID
 *         name:
 *           type: string
 *           description: Account manager name
 *         email:
 *           type: string
 *           format: email
 *           description: Account manager email
 *         assignedClients:
 *           type: number
 *           description: Number of clients assigned to this account manager
 *         recruiters:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IRecruiterInfo'
 *           description: List of recruiters assigned to this account manager
 */
export interface IAccountManagerInfo {
  id: string;
  name: string;
  email: string;
  assignedClients: number;
  recruiters: IRecruiterInfo[];
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportTeamStructure:
 *       type: object
 *       description: Complete support team structure with account managers and recruiters
 *       properties:
 *         accountManagers:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IAccountManagerInfo'
 *           description: List of account managers with their assigned recruiters
 *         unassignedRecruiters:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IRecruiterInfo'
 *           description: List of recruiters not assigned to any account manager
 */
export interface ISupportTeamStructure {
  accountManagers: IAccountManagerInfo[];
  unassignedRecruiters: IRecruiterInfo[];
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerFilterOption:
 *       type: object
 *       description: Partner filter option
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Partner ID
 *         name:
 *           type: string
 *           description: Partner name
 *         email:
 *           type: string
 *           format: email
 *           description: Partner email
 *         companyName:
 *           type: string
 *           description: Partner company name
 *         managedCandidates:
 *           type: number
 *           description: Number of candidates managed by this partner
 */
export interface IPartnerFilterOption {
  id: string;
  name: string;
  email: string;
  companyName: string;
  managedCandidates: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportCandidateSignupStats:
 *       type: object
 *       description: Candidate signup statistics
 *       properties:
 *         total:
 *           type: number
 *           description: Total number of signups
 *         organic:
 *           type: number
 *           description: Organic signups (not from invitations)
 *         fromInvitations:
 *           type: number
 *           description: Signups from invitations
 */
export interface ISupportCandidateSignupStats {
  total: number;
  organic: number;
  fromInvitations: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportCandidateProfileCompletionStats:
 *       type: object
 *       description: Profile completion statistics
 *       properties:
 *         total:
 *           type: number
 *         completed:
 *           type: number
 *         inProgress:
 *           type: number
 *         notStarted:
 *           type: number
 *         averageCompletion:
 *           type: number
 *         byPercentage:
 *           $ref: '#/components/schemas/IProfileCompletionByPercentage'
 */
export interface ISupportCandidateProfileCompletionStats {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  averageCompletion: number;
  byPercentage: IProfileCompletionByPercentage;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IProfileCompletionByPercentage:
 *       type: object
 *       description: Profile completion breakdown by percentage ranges
 *       properties:
 *         "0-25":
 *           type: number
 *         "26-50":
 *           type: number
 *         "51-75":
 *           type: number
 *         "76-99":
 *           type: number
 *         "100":
 *           type: number
 */
export interface IProfileCompletionByPercentage {
  '0-25': number;
  '26-50': number;
  '51-75': number;
  '76-99': number;
  '100': number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportCandidateStatusStats:
 *       type: object
 *       description: Candidate status statistics
 *       properties:
 *         total:
 *           type: number
 *         new:
 *           type: number
 *         onboarded:
 *           type: number
 *         rejected:
 *           type: number
 *         hired:
 *           type: number
 */
export interface ISupportCandidateStatusStats {
  total: number;
  new: number;
  onboarded: number;
  rejected: number;
  hired: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportCandidateJobSearchStatusStats:
 *       type: object
 *       description: Job search status statistics
 *       properties:
 *         total:
 *           type: number
 *         openToOpportunities:
 *           type: number
 *         notLooking:
 *           type: number
 */
export interface ISupportCandidateJobSearchStatusStats {
  total: number;
  openToOpportunities: number;
  notLooking: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportCandidateAssessmentStageStats:
 *       type: object
 *       description: Assessment stage statistics
 *       properties:
 *         total:
 *           type: number
 *         resumeAssessment:
 *           type: number
 *         onboardingAssessment:
 *           type: number
 */
export interface ISupportCandidateAssessmentStageStats {
  total: number;
  resumeAssessment: number;
  onboardingAssessment: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportCandidateResumeAssessmentStats:
 *       type: object
 *       description: Resume assessment statistics
 *       properties:
 *         total:
 *           type: number
 *         byStatus:
 *           $ref: '#/components/schemas/IAssessmentStatusBreakdown'
 *         byResult:
 *           $ref: '#/components/schemas/IAssessmentResultBreakdown'
 *         byRecommendation:
 *           $ref: '#/components/schemas/IAssessmentRecommendationBreakdown'
 */
export interface ISupportCandidateResumeAssessmentStats {
  total: number;
  byStatus: IAssessmentStatusBreakdown;
  byResult: IAssessmentResultBreakdown;
  byRecommendation: IAssessmentRecommendationBreakdown;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportCandidateOnboardingAssessmentStats:
 *       type: object
 *       description: Onboarding assessment statistics
 *       properties:
 *         total:
 *           type: number
 *         byStatus:
 *           $ref: '#/components/schemas/IAssessmentStatusBreakdown'
 *         byResult:
 *           $ref: '#/components/schemas/IAssessmentResultBreakdown'
 *         byRecommendation:
 *           $ref: '#/components/schemas/IAssessmentRecommendationBreakdown'
 */
export interface ISupportCandidateOnboardingAssessmentStats {
  total: number;
  byStatus: IAssessmentStatusBreakdown;
  byResult: IAssessmentResultBreakdown;
  byRecommendation: IAssessmentRecommendationBreakdown;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportCandidateJobAiAssessmentStats:
 *       type: object
 *       description: Job AI assessment statistics
 *       properties:
 *         total:
 *           type: number
 *         byStatus:
 *           $ref: '#/components/schemas/IAssessmentStatusBreakdown'
 *         byResult:
 *           $ref: '#/components/schemas/IAssessmentResultBreakdown'
 *         byRecommendation:
 *           $ref: '#/components/schemas/IAssessmentRecommendationBreakdown'
 */
export interface ISupportCandidateJobAiAssessmentStats {
  total: number;
  byStatus: IAssessmentStatusBreakdown;
  byResult: IAssessmentResultBreakdown;
  byRecommendation: IAssessmentRecommendationBreakdown;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IAssessmentStatusBreakdown:
 *       type: object
 *       description: Assessment status breakdown
 *       properties:
 *         notDone:
 *           type: number
 *         inProgress:
 *           type: number
 *         completed:
 *           type: number
 *         failed:
 *           type: number
 */
export interface IAssessmentStatusBreakdown {
  notDone: number;
  inProgress: number;
  completed: number;
  failed: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IAssessmentResultBreakdown:
 *       type: object
 *       description: Assessment result breakdown
 *       properties:
 *         notAvailable:
 *           type: number
 *         passed:
 *           type: number
 *         aiReviewFailed:
 *           type: number
 *         manualReviewFailed:
 *           type: number
 */
export interface IAssessmentResultBreakdown {
  notAvailable: number;
  passed: number;
  aiReviewFailed: number;
  manualReviewFailed: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IAssessmentRecommendationBreakdown:
 *       type: object
 *       description: Assessment recommendation breakdown
 *       properties:
 *         highlyRecommended:
 *           type: number
 *         recommended:
 *           type: number
 *         notRecommended:
 *           type: number
 */
export interface IAssessmentRecommendationBreakdown {
  highlyRecommended: number;
  recommended: number;
  notRecommended: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportCandidateRecommendationStats:
 *       type: object
 *       description: Overall recommendation statistics
 *       properties:
 *         total:
 *           type: number
 *         highlyRecommended:
 *           type: number
 *         recommended:
 *           type: number
 *         notRecommended:
 *           type: number
 */
export interface ISupportCandidateRecommendationStats {
  total: number;
  highlyRecommended: number;
  recommended: number;
  notRecommended: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportCandidateEngagementStats:
 *       type: object
 *       description: Candidate engagement statistics
 *       properties:
 *         total:
 *           type: number
 *         shortlisted:
 *           type: number
 *         shortlistedByStatus:
 *           $ref: '#/components/schemas/IShortlistStatusBreakdown'
 *         savedJobs:
 *           type: number
 *         views:
 *           type: number
 *         applications:
 *           type: number
 *         recommendationsReceived:
 *           type: number
 *         recommendationsViewed:
 *           type: number
 *         recommendationsSaved:
 *           type: number
 *         recommendationsApplied:
 *           type: number
 *         practiceAssessments:
 *           type: number
 */
export interface ISupportCandidateEngagementStats {
  total: number;
  shortlisted: number;
  shortlistedByStatus: IShortlistStatusBreakdown;
  savedJobs: number;
  views: number;
  applications: number;
  recommendationsReceived: number;
  recommendationsViewed: number;
  recommendationsSaved: number;
  recommendationsApplied: number;
  practiceAssessments: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IShortlistStatusBreakdown:
 *       type: object
 *       description: Shortlist status breakdown
 *       properties:
 *         shortlisted:
 *           type: number
 *         notInterested:
 *           type: number
 *         rejected:
 *           type: number
 */
export interface IShortlistStatusBreakdown {
  shortlisted: number;
  notInterested: number;
  rejected: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportCandidateSubscriptionStats:
 *       type: object
 *       description: Candidate subscription statistics
 *       properties:
 *         total:
 *           type: number
 *         active:
 *           type: number
 *         inactive:
 *           type: number
 *         cancelled:
 *           type: number
 *         expired:
 *           type: number
 *         withSubscription:
 *           type: number
 *         withoutSubscription:
 *           type: number
 *         averageAssessmentsUsed:
 *           type: number
 *         averagePracticeAssessmentsUsed:
 *           type: number
 */
export interface ISupportCandidateSubscriptionStats {
  total: number;
  active: number;
  inactive: number;
  cancelled: number;
  expired: number;
  withSubscription: number;
  withoutSubscription: number;
  averageAssessmentsUsed: number;
  averagePracticeAssessmentsUsed: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportCandidateUserStatusStats:
 *       type: object
 *       description: User status statistics
 *       properties:
 *         total:
 *           type: number
 *         active:
 *           type: number
 *         inactive:
 *           type: number
 *         blocked:
 *           type: number
 */
export interface ISupportCandidateUserStatusStats {
  total: number;
  active: number;
  inactive: number;
  blocked: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportCandidateKpisFilterOptions:
 *       type: object
 *       description: Comprehensive filter options for candidate KPIs
 *       properties:
 *         supportTeam:
 *           $ref: '#/components/schemas/ISupportTeamStructure'
 *         partners:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IPartnerFilterOption'
 *           description: List of partners
 *         traditionalFilters:
 *           type: array
 *           items:
 *             type: string
 *           description: List of traditional filter types
 */
export interface ISupportCandidateKpisFilterOptions {
  supportTeam: ISupportTeamStructure;
  partners: IPartnerFilterOption[];
  traditionalFilters: string[];
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportCandidateKpisExport:
 *       type: object
 *       description: Export data for candidate KPIs with important fields
 *       properties:
 *         filename:
 *           type: string
 *           description: Generated filename with filters
 *         csvData:
 *           type: string
 *           description: CSV data as base64 encoded string
 *         totalCandidates:
 *           type: number
 *           description: Total number of candidates exported
 */
export interface ISupportCandidateKpisExport {
  filename: string;
  csvData: string;
  totalCandidates: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateExportData:
 *       type: object
 *       description: Individual candidate data for export
 *       properties:
 *         candidateId:
 *           type: string
 *           description: Candidate ID
 *         userId:
 *           type: string
 *           description: User ID
 *         name:
 *           type: string
 *           description: Candidate name
 *         email:
 *           type: string
 *           description: Candidate email
 *         status:
 *           type: string
 *           description: Candidate status
 *         signupDate:
 *           type: string
 *           format: date-time
 *           description: User signup date
 *         partnerId:
 *           type: string
 *           description: Partner ID if assigned
 *         partnerName:
 *           type: string
 *           description: Partner company name
 *         profileCompletion:
 *           type: number
 *           description: Profile completion percentage
 *         resumeAssessmentStatus:
 *           type: string
 *           description: Resume assessment status
 *         onboardingAssessmentStatus:
 *           type: string
 *           description: Onboarding assessment status
 *         totalApplications:
 *           type: number
 *           description: Total job applications
 *         totalShortlists:
 *           type: number
 *           description: Total shortlists
 *         subscriptionStatus:
 *           type: string
 *           description: Subscription status
 *         assessmentsUsed:
 *           type: number
 *           description: Assessments used this month
 *         practiceAssessmentsUsed:
 *           type: number
 *           description: Practice assessments used
 *         lastActivity:
 *           type: string
 *           format: date-time
 *           description: Last activity date
 *         supportInviteDate:
 *           type: string
 *           format: date-time
 *           description: Support invitation sent date
 *         supportInviteAcceptedDate:
 *           type: string
 *           format: date-time
 *           description: Support invitation accepted date
 *         appliedJobPostings:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of applied job posting names
 *         invitedJobPostings:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of invited job posting names
 *         profilePublished:
 *           type: boolean
 *           description: Whether candidate profile is published
 *         aiReviewCompleted:
 *           type: boolean
 *           description: Whether AI review is completed
 *         resumeAssessmentResult:
 *           type: string
 *           description: Resume assessment result
 *         resumeAssessmentScore:
 *           type: number
 *           description: Resume assessment score
 *         resumeAssessmentRecommendation:
 *           type: string
 *           description: Resume assessment recommendation
 *         onboardingAssessmentResult:
 *           type: string
 *           description: Onboarding assessment result
 *         onboardingAssessmentScore:
 *           type: number
 *           description: Onboarding assessment score
 *         onboardingAssessmentRecommendation:
 *           type: string
 *           description: Onboarding assessment recommendation
 */
export interface ICandidateExportData {
  candidateId: string;
  userId: string;
  name: string;
  email: string;
  status: string;
  signupDate: string;
  partnerId?: string;
  partnerName?: string;
  profileCompletion: number;
  resumeAssessmentStatus: string;
  onboardingAssessmentStatus: string;
  totalApplications: number;
  totalShortlists: number;
  subscriptionStatus?: string;
  assessmentsUsed: number;
  practiceAssessmentsUsed: number;
  lastActivity: string;
  supportInviteDate?: string;
  supportInviteAcceptedDate?: string;
  appliedJobPostings: string[];
  invitedJobPostings: string[];
  profilePublished: boolean;
  aiReviewCompleted: boolean;
  resumeAssessmentResult?: string;
  resumeAssessmentScore?: number;
  resumeAssessmentRecommendation?: string;
  onboardingAssessmentResult?: string;
  onboardingAssessmentScore?: number;
  onboardingAssessmentRecommendation?: string;
}
