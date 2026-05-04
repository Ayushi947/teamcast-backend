import { ISearchResult } from '@/shared/models/domain/search/search.domain';

export enum RagProvider {
  GCP_VERTEX = 'gcp-vertex',
}

export interface IRagIndexingTask {
  taskId: string;
  status: RagIndexingStatus;
  error?: string;
  entityId: string;
  entityType: 'candidate' | 'job';
  createdAt: Date;
  updatedAt: Date;
}

export enum RagIndexingStatus {
  PENDING = 'PENDING',
  STARTED = 'STARTED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface IRagProvider {
  /**
   * Index a candidate or job
   * @param entityId The ID of the entity to index
   * @param entityType The type of entity (candidate or job)
   * @returns A promise that resolves to the indexing task identifier
   */
  index(
    entityId: string,
    entityType: 'candidate' | 'job'
  ): Promise<IRagIndexingTask>;

  /**
   * Search for candidates matching a job
   * @param jobId The ID of the job to match against
   * @param limit The maximum number of results to return
   * @returns A promise that resolves to an array of matching candidates
   */
  searchCandidatesForJob(
    jobId: string,
    limit?: number,
    page?: number
  ): Promise<ISearchResult[]>;

  /**
   * Search for jobs matching a candidate
   * @param candidateId The ID of the candidate to match against
   * @param limit The maximum number of results to return
   * @returns A promise that resolves to an array of matching jobs
   */
  searchJobsForCandidate(
    candidateId: string,
    limit?: number,
    page?: number
  ): Promise<ISearchResult[]>;

  /**
   * Search for jobs using a text query with a prompt
   * @param query The search query
   * @param limit The maximum number of results to return
   * @returns A promise that resolves to an array of matching jobs
   */
  searchJobsWithPrompt(
    query: string,
    limit?: number,
    page?: number
  ): Promise<ISearchResult[]>;

  /**
   * Search for candidates using a text query
   * @param query The search query
   * @param limit The maximum number of results to return
   * @returns A promise that resolves to an array of matching candidates
   */
  searchCandidates(
    query: string,
    limit?: number,
    page?: number
  ): Promise<ISearchResult[]>;
}
