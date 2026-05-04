import { IPaginationInfo } from '../../api/common/common.api';
import { ICandidateJobPosting } from '../candidate/job.posting.domain';

export interface ISearchResult {
  id: string;
  score: number;
  metadata: Record<string, any>;
  name?: string;
  email?: string | null;
  jobTitle?: string | null;
  image?: string | null;
  companyName?: string;
  description?: string;
  groundingInfo?: string; // Individual grounding information for this result
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISearchRequest:
 *       type: object
 *       properties:
 *         query:
 *           type: string
 *           description: Search query string (optional - if not provided, returns all results)
 *           example: "software engineer"
 *         page:
 *           type: number
 *           description: Page number for pagination (optional, defaults to 1)
 *           example: 1
 *         limit:
 *           type: number
 *           description: Number of results per page (optional, defaults to 10)
 *           example: 10
 */

export interface ISearchRequest {
  query?: string;
  page?: number;
  limit?: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISearchResponse:
 *       type: object
 *       properties:
 *         results:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: Unique identifier
 *               score:
 *                 type: number
 *                 description: Search relevance score
 *               metadata:
 *                 type: object
 *                 description: Additional metadata
 *               name:
 *                 type: string
 *                 description: Display name (candidate name or job title)
 *               email:
 *                 type: string
 *                 nullable: true
 *                 description: Candidate email (for candidate searches only)
 *               jobTitle:
 *                 type: string
 *                 nullable: true
 *                 description: Job title (for job searches) or candidate job title (for candidate searches)
 *               companyName:
 *                 type: string
 *                 description: Company name (for job searches only)
 *               description:
 *                 type: string
 *                 description: Brief description with key details
 *         groundingInfo:
 *           type: string
 *           description: Overall explanation of search criteria and matching algorithm used
 *         total:
 *           type: number
 *           description: Total number of results
 *         page:
 *           type: number
 *           description: Current page number
 *         pageSize:
 *           type: number
 *           description: Number of results per page
 */

export interface ISearchResponse {
  results: ISearchResult[];
  total: number;
  page: number;
  pageSize: number;
  overallGroundingInfo?: string; // Overall grounding info for the entire search result
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ITypeaheadRequest:
 *       type: object
 *       required:
 *         - query
 *         - type
 *       properties:
 *         query:
 *           type: string
 *           description: Typeahead query string
 *           example: "sof"
 */

export interface ITypeaheadRequest {
  query?: string;
  jobPostId?: string;
  clientId?: string;
  page?: number;
  limit?: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ITypeaheadResponse:
 *       type: object
 *       properties:
 *         results:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               text:
 *                 type: string
 *               type:
 *                 type: string
 *         pagination:
 *           type: object
 *           properties:
 *             currentPage:
 *               type: number
 *             totalPages:
 *               type: number
 *             totalResults:
 *               type: number
 *             limit:
 *               type: number
 *             hasNextPage:
 *               type: boolean
 *             hasPreviousPage:
 *               type: boolean
 *         jobPostId:
 *           type: string
 *         jobTitle:
 *           type: string
 *         originalQuery:
 *           type: string
 *         refinedQuery:
 *           type: string
 *         feedbackUsed:
 *           type: boolean
 *         feedbackCount:
 *           type: number
 *         feedbackAnalysis:
 *           type: object
 *           properties:
 *             totalFeedback:
 *               type: number
 *             recentFeedback:
 *               type: number
 *             interestedSkills:
 *               type: array
 *               items:
 *                 type: string
 *             notInterestedSkills:
 *               type: array
 *               items:
 *                 type: string
 */

export interface ITypeaheadResponse {
  results: any[];
  pagination: IPaginationInfo;
  jobPostId?: string;
  jobTitle?: string;
  originalQuery?: string;
  refinedQuery?: string | null;
  feedbackUsed: boolean;
  feedbackCount: number;
  feedbackAnalysis?: {
    totalFeedback: number;
    recentFeedback: number;
    interestedSkills: string[];
    notInterestedSkills: string[];
  } | null;
}

export interface IRagIndexingTask {
  id: string;
  entityId: string;
  entityType: 'candidate' | 'job';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface IRagProvider {
  index(
    entityId: string,
    entityType: 'candidate' | 'job'
  ): Promise<IRagIndexingTask>;
  searchCandidates(
    query: string,
    limit?: number,
    page?: number
  ): Promise<ISearchResult[]>;
  searchJobs(
    query: string,
    limit?: number,
    page?: number
  ): Promise<ISearchResult[]>;
  searchCandidatesForJob(
    jobId: string,
    limit?: number,
    page?: number
  ): Promise<ISearchResult[]>;
  searchJobsForCandidate(
    candidateId: string,
    limit?: number,
    page?: number
  ): Promise<ISearchResult[]>;
  getJobTypeahead(
    query: string,
    limit?: number,
    page?: number
  ): Promise<ISearchResult[]>;
  getCandidateTypeahead(
    query: string,
    limit?: number,
    page?: number
  ): Promise<ISearchResult[]>;
}

export interface ICandidateWithInfo {
  candidate: unknown;
  score: number;
  metadata: Record<string, unknown>;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateInfoResult:
 *       type: object
 *       properties:
 *         results:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               candidate:
 *                 type: object
 *               score:
 *                 type: number
 *               metadata:
 *                 type: object
 *         pagination:
 *           type: object
 *           properties:
 *             currentPage:
 *               type: number
 *             totalPages:
 *               type: number
 *             totalResults:
 *               type: number
 *             limit:
 *               type: number
 *             hasNextPage:
 *               type: boolean
 *             hasPreviousPage:
 *               type: boolean
 *             groundingInfo:
 *               type: string
 *         jobPostId:
 *           type: string
 *         jobTitle:
 *           type: string
 *         originalQuery:
 *           type: string
 *         refinedQuery:
 *           type: string
 *         feedbackUsed:
 *           type: boolean
 *         feedbackCount:
 *           type: number
 *         feedbackAnalysis:
 *           type: object
 *           properties:
 *             totalFeedback:
 *               type: number
 *             recentFeedback:
 *               type: number
 *             interestedSkills:
 *               type: array
 *               items:
 *                 type: string
 *             notInterestedSkills:
 *               type: array
 *               items:
 *                 type: string
 *
 */

export interface ICandidateInfoResult {
  results: ICandidateWithInfo[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalResults: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    groundingInfo: string;
  };
  jobPostId: string;
  jobTitle: string;
  originalQuery: string;
  refinedQuery: string | null;
  feedbackUsed: boolean;
  feedbackCount: number;
  feedbackAnalysis: {
    totalFeedback: number;
    recentFeedback: number;
    interestedSkills: string[];
    notInterestedSkills: string[];
  } | null;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobRecommendationResult:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               company:
 *                 type: object
 *               location:
 *                 type: string
 *               salaryRange:
 *                 type: object
 *               matchScore:
 *                 type: number
 *               matchDetails:
 *                 type: object
 *                 properties:
 *                   semanticScore:
 *                     type: number
 *                   titleScore:
 *                     type: number
 *                   skillsScore:
 *                     type: number
 *         page:
 *           type: number
 *         limit:
 *           type: number
 *         total:
 *           type: number
 *         error:
 *           type: string
 *         errorCode:
 *           type: string
 *
 */
export interface IJobRecommendationResult {
  items: Array<
    ICandidateJobPosting & {
      matchScore: number;
      matchDetails: {
        semanticScore: number;
        titleScore: number;
        skillsScore: number;
      };
    }
  >;
  page: number;
  limit: number;
  total: number;
  error?: string;
  errorCode?: string;
}

// Job AI Assessment Interview Interfaces
