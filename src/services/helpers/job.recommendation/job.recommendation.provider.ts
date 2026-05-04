import { CandidateRecommendationFeedbackTypeEnum } from '@/shared/models/common/enums';
import { ISearchResult } from '@/shared/models/domain/search/search.domain';

export interface IJobRecommendationTask {
  taskId: string;
  status: JobRecommendationStatus;
  jobPostingId: string;
  createdAt: Date;
  updatedAt: Date;
  error?: string;
}

export interface ICandidateRecommendationFeedback {
  id: string;
  clientId: string;
  candidateId: string;
  jobId?: string;
  feedbackType: CandidateRecommendationFeedbackTypeEnum;
  reason?: string;
  notes?: string;
  candidateProfile?: {
    skills: string[];
    experience: number;
    industry: string;
    location: string;
    education: string;
    jobTitle: string;
    companyName: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface FilteredResult {
  id: string;
  score: number;
  metadata: Record<string, any>;
}

export interface SearchResult {
  id: string;
  content: string;
  metadata: any;
  score: number;
  semantic_score: number;
  title_score?: number;
  skills_score?: number;
  skill_match_score?: number;
  experience_match_score?: number;
  industry_match_score?: number;
  location_match_score?: number;
  match_details?: any;
  exact_match_score?: number;
}

export interface IFeedbackAnalysis {
  notInterestedPatterns: {
    skills: string[];
    industries: string[];
    locations: string[];
    experienceLevels: number[];
    educationLevels: string[];
    jobTitles: string[];
    companies: string[];
    reasons: string[];
  };
  interestedPatterns: {
    skills: string[];
    industries: string[];
    locations: string[];
    experienceLevels: number[];
    educationLevels: string[];
    jobTitles: string[];
    companies: string[];
  };
  totalFeedback: number;
  recentFeedback: number;
}

export enum JobRecommendationStatus {
  STARTED = 'STARTED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface IJobRecommendationProvider {
  /**
   * Search recommended candidates for a job posting
   * @param query The query to search for
   * @param limit The maximum number of recommendations to return
   * @returns A list of recommended candidates
   */
  searchRecommendedCandidates(
    query: string,
    limit?: number
  ): Promise<ISearchResult[]>;

  /**
   * Find initial recommendations for a job posting
   * @param jobPostingId The job posting ID to find recommendations for
   * @param limit The maximum number of recommendations to return
   * @param prevSyncDateTime The previous sync timestamp to filter candidates created after this date
   * @returns A task object representing the recommendation process
   */
  findInitialRecommendations(
    jobPostingId: string,
    limit?: number,
    prevSyncDateTime?: Date
  ): Promise<IJobRecommendationTask>;

  /**
   * Find new recommendations for a job posting based on new candidates
   * @param jobPostingId The job posting ID to find recommendations for
   * @param lastSyncTimestamp The timestamp of the last recommendation sync
   * @param limit The maximum number of recommendations to return
   * @returns A task object representing the recommendation process
   */
  findRecommendations(
    jobPostingId: string,
    lastSyncTimestamp?: Date,
    limit?: number
  ): Promise<IJobRecommendationTask>;

  /**
   * Get recommended candidates for a job posting
   * @param jobPostingId The job posting ID
   * @param limit The maximum number of candidates to return
   * @returns List of recommended candidates with scores
   */
  getRecommendedCandidates(
    jobPostingId: string,
    limit?: number
  ): Promise<ISearchResult[]>;
}
