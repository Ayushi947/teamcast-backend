import { ISearchResult } from '@/shared/models/domain/search/search.domain';

export interface ICandidateRecommendationTask {
  taskId: string;
  status: CandidateRecommendationStatus;
  candidateId: string;
  createdAt: Date;
  updatedAt: Date;
  error?: string;
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

export enum CandidateRecommendationStatus {
  STARTED = 'STARTED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface ICandidateRecommendationProvider {
  /**
   * Search recommended jobs for a candidate
   * @param query The query to search for
   * @param limit The maximum number of recommendations to return
   * @returns A list of recommended jobs
   */
  searchJobsRecommendation(
    query: string,
    limit?: number
  ): Promise<ISearchResult[]>;

  /**
   * Get embedding for a text
   * @param text The text to get embedding for
   * @returns The embedding for the text
   */
  getEmbedding(text: string): Promise<number[]>;

  /**
   * Find initial recommendations for a candidate
   * @param candidateId The candidate ID to find recommendations for
   * @param limit The maximum number of recommendations to return
   * @param prevSyncDateTime The previous sync timestamp to filter jobs created after this date
   * @returns A task object representing the recommendation process
   */
  findInitialRecommendations(
    candidateId: string,
    limit?: number,
    prevSyncDateTime?: Date
  ): Promise<ICandidateRecommendationTask>;

  /**
   * Find new recommendations for a candidate based on new job postings
   * @param candidateId The candidate ID to find recommendations for
   * @param lastSyncTimestamp The timestamp of the last recommendation sync
   * @param limit The maximum number of recommendations to return
   * @returns A task object representing the recommendation process
   */
  findRecommendations(
    candidateId: string,
    lastSyncTimestamp?: Date,
    limit?: number
  ): Promise<ICandidateRecommendationTask>;

  /**
   * Get recommended jobs for a candidate
   * @param candidateId The candidate ID
   * @param limit The maximum number of jobs to return
   * @returns List of recommended jobs with scores
   */
  getRecommendedJobs(
    candidateId: string,
    limit?: number
  ): Promise<ISearchResult[]>;
}
