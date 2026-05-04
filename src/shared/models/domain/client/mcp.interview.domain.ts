/**
 * MCP Interview Domain Models
 * Agent-initiated interview requests for skill assessment
 */

/**
 * Interview status enum
 */
export enum McpInterviewStatusEnum {
  INVITED = 'INVITED',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  EVALUATING = 'EVALUATING',
  RESULTS_READY = 'RESULTS_READY',
  CANCELLED = 'CANCELLED',
}

/**
 * Assessment level enum
 */
export enum McpAssessmentLevelEnum {
  JUNIOR = 'JUNIOR',
  INTERMEDIATE = 'INTERMEDIATE',
  SENIOR = 'SENIOR',
  LEAD = 'LEAD',
}

/**
 * Skill proficiency level enum
 */
export enum McpSkillProficiencyEnum {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT',
}

/**
 * External candidate data structure
 * Stored in candidateData JSON field for new candidates
 */
export interface IMcpExternalCandidateData {
  // Required
  name: string;
  email: string;

  // Contact
  phone?: string;

  // Professional info
  currentTitle?: string;
  currentCompany?: string;
  yearsOfExperience?: number;

  // Profile links
  linkedInUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;

  // Resume
  resumeUrl?: string;
  resumeText?: string;

  // Location
  location?: string;
  timezone?: string;

  // Agent metadata
  sourceSystem?: string;
  sourcedAt?: string;
  agentNotes?: string;
  externalCandidateId?: string;
}

/**
 * Job context shown to candidate
 */
export interface IMcpInterviewJobContext {
  title: string;
  company?: string;
  description?: string;
  location?: string;
}

/**
 * Per-skill result
 */
export interface IMcpInterviewSkillResult {
  id: string;
  interviewId: string;
  skillName: string;
  score: number | null;
  proficiencyLevel: McpSkillProficiencyEnum | null;
  strengths: string[];
  improvements: string[];
  feedback: string | null;
  sectionScores: IMcpSkillSectionScore[] | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Section score within a skill result
 */
export interface IMcpSkillSectionScore {
  sectionId: string;
  sectionName: string;
  score: number;
  timeSpent: string;
}

/**
 * MCP Interview domain model
 */
export interface IMcpInterview {
  id: string;

  // Candidate reference
  candidateId: string | null;
  isNewCandidate: boolean;
  candidateData: IMcpExternalCandidateData | null;
  candidateEmail: string;
  candidateName: string;
  linkedUserId: string | null;

  // MCP agent info
  mcpClientId: string;
  externalReferenceId: string | null;
  externalCandidateId: string | null;

  // Job context
  jobTitle: string | null;
  companyName: string | null;
  jobDescription: string | null;
  jobLocation: string | null;

  // Interview configuration
  skillsToAssess: string[];
  assessmentLevel: McpAssessmentLevelEnum;
  customInstructions: string | null;
  expectedDurationMinutes: number | null;
  maxSections: number | null;
  resumeFileUrl: string | null;

  // Status
  status: McpInterviewStatusEnum;
  invitedAt: Date;
  acceptedAt: Date | null;
  declinedAt: Date | null;
  declineReason: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  resultsReadyAt: Date | null;
  expiresAt: Date;

  // Assessment link
  assessmentId: string | null;

  // Results
  overallScore: number | null;
  recommendation: string | null;
  resultSummary: string | null;

  // Relations
  skillResults?: IMcpInterviewSkillResult[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * MCP Interview with MCP client info (for internal use)
 */
export interface IMcpInterviewWithClient extends IMcpInterview {
  mcpClient?: {
    id: string;
    name: string;
    sourceSystem: string | null;
  };
}

/**
 * MCP Interview with candidate info
 */
export interface IMcpInterviewWithCandidate extends IMcpInterview {
  candidate?: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      image: string | null;
    };
  } | null;
}

/**
 * Input for creating an MCP interview request
 */
export interface IMcpInterviewCreate {
  // Option 1: Existing candidate
  candidateId?: string;

  // Option 2: External candidate data
  candidate?: IMcpExternalCandidateData;

  // Interview configuration
  skillsToAssess: string[];
  assessmentLevel?: McpAssessmentLevelEnum;
  customInstructions?: string;
  expectedDurationMinutes?: number; // Expected assessment duration in minutes
  maxSections?: number; // Maximum number of assessment sections to generate
  resumeFile?: string; // Base64 encoded resume file (PDF/DOCX)
  resumeFileName?: string; // Original filename of the resume

  // Job context (shown to candidate)
  jobContext?: IMcpInterviewJobContext;

  // Agent tracking
  externalReferenceId?: string;
  externalCandidateId?: string;

  // Settings
  expiryDays?: number;
  inviteMessage?: string;
}

/**
 * Input for updating interview status
 */
export interface IMcpInterviewUpdate {
  status?: McpInterviewStatusEnum;
  declineReason?: string;
  assessmentId?: string;
  overallScore?: number;
  recommendation?: string;
  resultSummary?: string;
}

/**
 * Filter query for listing interviews
 */
export interface IMcpInterviewFilterQuery {
  status?: McpInterviewStatusEnum | McpInterviewStatusEnum[];
  candidateEmail?: string;
  externalReferenceId?: string;
  externalCandidateId?: string;
  skillsToAssess?: string[];
  fromDate?: Date;
  toDate?: Date;
}

/**
 * Interview results response for agent
 */
export interface IMcpInterviewResults {
  interviewId: string;
  externalReferenceId: string | null;
  externalCandidateId: string | null;

  candidate: {
    name: string;
    email: string;
    teamcastCandidateId: string | null;
  };

  status: McpInterviewStatusEnum;
  completedAt: Date | null;

  overall: {
    score: number | null;
    recommendation: string | null;
    summary: string | null;
  };

  skillAssessments: Array<{
    skill: string;
    score: number | null;
    level: McpSkillProficiencyEnum | null;
    strengths: string[];
    improvements: string[];
    notes: string | null;
  }>;

  sections: Array<{
    name: string;
    skillName: string;
    score: number | null;
    timeSpent: string | null;
    questionsAnswered: number;
    questionsTotal: number;
  }>;
}

/**
 * Interview landing page data (for candidate view)
 */
export interface IMcpInterviewLandingData {
  interviewId: string;
  status: McpInterviewStatusEnum;
  isExpired: boolean;

  // Candidate info (pre-filled)
  candidateName: string;
  candidateEmail: string;
  isNewCandidate: boolean;

  // Job context (shown to candidate)
  jobTitle: string | null;
  companyName: string | null;
  jobDescription: string | null;
  jobLocation: string | null;

  // Assessment info
  skillsCount: number;
  /**
   * If provided by the inviter, this is the exact duration configured for the interview.
   * (Stored on `mcp_interview.expectedDurationMinutes`.)
   */
  expectedDurationMinutes: number | null; // in minutes
  /**
   * If provided by the inviter, this caps the number of assessment sections.
   * (Stored on `mcp_interview.maxSections`.)
   */
  maxSections: number | null;
  estimatedDuration: number; // in minutes
  expiresAt: Date;
}

/**
 * Accept interview input
 */
export interface IMcpInterviewAcceptInput {
  interviewId: string;

  // For new candidates - registration data
  password?: string;
  acceptTerms?: boolean;
}

/**
 * Decline interview input
 */
export interface IMcpInterviewDeclineInput {
  interviewId: string;
  reason?: string;
}

/**
 * Start interview input (after acceptance)
 */
export interface IMcpInterviewStartInput {
  interviewId: string;
}

/**
 * Start interview response
 */
export interface IMcpInterviewStartResponse {
  success: boolean;
  assessmentInviteId: string;
  redirectUrl: string;
  authToken: import('../auth/auth.token.domain').IAuthToken;
  authUser: import('../auth/auth.user.domain').IAuthUser;
}
