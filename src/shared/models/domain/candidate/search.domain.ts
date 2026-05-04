import { ISearchResult } from '../search/search.domain';

export enum CandidateSearchMode {
  SEMANTIC = 'semantic',
  KEYWORD = 'keyword',
  HYBRID = 'hybrid',
  SKILLS_BASED = 'skills_based',
  EXPERIENCE_BASED = 'experience_based',
}

export interface ICandidateSearchRequest {
  query: string;
  limit?: number;
  mode?: CandidateSearchMode;
  filters?: ICandidateSearchFilters;
}

export interface ICandidateSearchFilters {
  skills?: string[];
  experience?: number;
  location?: string[];
  industry?: string[];
  education?: string[];
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  workType?: string[];
  workCommitment?: string[];
  isRemote?: boolean;
  companySize?: string[];
}

export interface ICandidateSearchResponse {
  results: ICandidateSearchResult[];
  total: number;
  query: string;
  enhancedQuery: string;
  mode: CandidateSearchMode;
  filters?: ICandidateSearchFilters;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateSearchResult:
 *       type: object
 *       required:
 *         - id
 *         - score
 *         - metadata
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the candidate
 *         score:
 *           type: number
 *           description: Match score for the candidate
 *         metadata:
 *           $ref: '#/components/schemas/ICandidateSearchMetadata'
 *         highlights:
 *           $ref: '#/components/schemas/ICandidateSearchHighlights'
 *     ICandidateSearchMetadata:
 *       type: object
 *       properties:
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *           description: List of candidate skills
 *         industries:
 *           type: array
 *           items:
 *             type: string
 *           description: List of industries the candidate has experience in
 *         locations:
 *           type: array
 *           items:
 *             type: string
 *           description: List of locations the candidate is interested in
 *         salary:
 *           type: object
 *           properties:
 *             min:
 *               type: number
 *               description: Minimum salary expectation
 *             max:
 *               type: number
 *               description: Maximum salary expectation
 *             currency:
 *               type: string
 *               description: Salary currency
 *         experience:
 *           type: number
 *           description: Years of experience
 *         education:
 *           type: string
 *           description: Highest level of education
 *         workType:
 *           type: array
 *           items:
 *             type: string
 *           description: Preferred work types
 *         isRemote:
 *           type: boolean
 *           description: Whether the candidate is open to remote work
 *         lastActive:
 *           type: string
 *           format: date-time
 *           description: When the candidate was last active
 *         profileCompleteness:
 *           type: number
 *           description: Profile completion percentage
 *     ICandidateSearchHighlights:
 *       type: object
 *       properties:
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *           description: Highlighted matching skills
 *         experience:
 *           type: array
 *           items:
 *             type: string
 *           description: Highlighted matching experience
 *         education:
 *           type: array
 *           items:
 *             type: string
 *           description: Highlighted matching education
 *         summary:
 *           type: array
 *           items:
 *             type: string
 *           description: Highlighted matching summary sections
 *         jobTitles:
 *           type: array
 *           items:
 *             type: string
 *           description: Highlighted matching job titles
 */

export interface ICandidateSearchResult {
  id: string;
  score: number;
  metadata: ICandidateSearchMetadata;
  highlights?: ICandidateSearchHighlights;
}

export interface ICandidateSearchMetadata {
  skills?: string[];
  industries?: string[];
  locations?: string[];
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  experience?: number;
  education?: string;
  workType?: string[];
  isRemote?: boolean;
  lastActive?: string;
  profileCompleteness?: number;
}

export interface ICandidateSearchHighlights {
  skills?: string[];
  experience?: string[];
  education?: string[];
  summary?: string[];
  jobTitles?: string[];
}

export interface IJobCandidateMatchRequest {
  candidateId: string;
  jobRequirements: string;
  jobId?: string;
}

export interface IJobCandidateMatchResponse {
  candidateId: string;
  jobId?: string;
  overallScore: number;
  skillsScore: number;
  experienceScore: number;
  careerFitScore: number;
  culturalFitScore: number;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
}

export enum SearchResultType {
  DIRECT_MATCH = 'direct_match',
  SEMANTIC_MATCH = 'semantic_match',
  SKILL_MATCH = 'skill_match',
  EXPERIENCE_MATCH = 'experience_match',
  EDUCATION_MATCH = 'education_match',
  LOCATION_MATCH = 'location_match',
}

export interface ISearchAnalytics {
  searchId: string;
  query: string;
  enhancedQuery: string;
  mode: CandidateSearchMode;
  resultsCount: number;
  averageScore: number;
  executionTime: number;
  filters?: ICandidateSearchFilters;
  timestamp: Date;
}

export interface ICandidateTypeaheadResponse {
  results: ISearchResult[];
  originalQuery: string;
  refinedQuery: string | null;
  feedbackUsed: boolean;
  feedbackCount: number;
}

export interface IFeedbackOptimizedSearchResponse {
  results: ISearchResult[];
  originalQuery: string;
  refinedQuery?: string;
  feedbackAnalysis?: {
    totalFeedback: number;
    recentFeedback: number;
    interestedPatterns: string[];
    notInterestedPatterns: string[];
    reasons: string[];
  };
  optimization: {
    feedbackUsed: boolean;
    patternsApplied: number;
    queryEnhanced: boolean;
  };
}
