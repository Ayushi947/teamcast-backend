/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateRecommendationCronTask:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The task ID
 *         status:
 *           $ref: '#/components/schemas/CandidateRecommendationCronTaskStatus'
 *         totalCandidates:
 *           type: number
 *           description: Total number of candidates to process
 *         processedCandidates:
 *           type: number
 *           description: Number of candidates processed
 *         failedCandidates:
 *           type: number
 *           description: Number of candidates that failed to process
 *         recommendationsCreated:
 *           type: number
 *           description: Total number of recommendations created
 *         error:
 *           type: string
 *           description: Error message if task failed
 *         startedAt:
 *           type: string
 *           format: date-time
 *           description: When the task started
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: When the task completed
 */
export interface ICandidateRecommendationCronTask {
  id: string;
  status: CandidateRecommendationCronTaskStatus;
  totalCandidates: number;
  processedCandidates: number;
  failedCandidates: number;
  recommendationsCreated: number;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     CandidateRecommendationCronTaskStatus:
 *       type: string
 *       enum: [PENDING, PROCESSING, COMPLETED, FAILED]
 *       description: Status of the candidate recommendation task
 */
export enum CandidateRecommendationCronTaskStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * @openapi
 * components:
 *   parameters:
 *     ICandidateRecommendationCronTaskFilterQueryStatus:
 *       in: query
 *       name: status
 *       required: false
 *       schema:
 *         $ref: '#/components/schemas/CandidateRecommendationCronTaskStatus'
 *         description: Filter by task status
 */
export interface ICandidateRecommendationCronTaskFilterQuery {
  status?: CandidateRecommendationCronTaskStatus;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateRecommendationSyncTask:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The sync task ID
 *         candidateId:
 *           type: string
 *           description: The candidate ID
 *         cronTaskId:
 *           type: string
 *           description: The parent cron task ID
 *         status:
 *           $ref: '#/components/schemas/CandidateRecommendationCronTaskStatus'
 *         recommendationsCreated:
 *           type: number
 *           description: Number of recommendations created for this candidate
 *         error:
 *           type: string
 *           description: Error message if task failed
 *         startedAt:
 *           type: string
 *           format: date-time
 *           description: When the sync task started
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: When the sync task completed
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the sync task was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the sync task was last updated
 */
export interface ICandidateRecommendationSyncTask {
  id: string;
  candidateId: string;
  cronTaskId: string;
  status: CandidateRecommendationCronTaskStatus;
  recommendationsCreated: number;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Convert a candidate recommendation cron task to a domain object
 */
export const toCandidateRecommendationCronTask = (
  task: any
): ICandidateRecommendationCronTask => {
  return {
    id: task.id,
    status: task.status as CandidateRecommendationCronTaskStatus,
    totalCandidates: task.totalCandidates,
    processedCandidates: task.processedCandidates,
    failedCandidates: task.failedCandidates,
    recommendationsCreated: task.recommendationsCreated,
    error: task.error,
    startedAt: task.startedAt,
    completedAt: task.completedAt,
  };
};

/**
 * Convert a list of candidate recommendation cron tasks to domain objects
 */
export const toCandidateRecommendationCronTaskList = (
  tasks: any[]
): ICandidateRecommendationCronTask[] => {
  return tasks.map(toCandidateRecommendationCronTask);
};

/**
 * Convert a candidate recommendation sync task to a domain object
 */
export const toCandidateRecommendationSyncTask = (
  task: any
): ICandidateRecommendationSyncTask => {
  return {
    id: task.id,
    candidateId: task.candidateId,
    cronTaskId: task.cronTaskId,
    status: task.status as CandidateRecommendationCronTaskStatus,
    recommendationsCreated: task.recommendationsCreated,
    error: task.error,
    startedAt: task.startedAt,
    completedAt: task.completedAt,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
};

/**
 * Convert a list of candidate recommendation sync tasks to domain objects
 */
export const toCandidateRecommendationSyncTaskList = (
  tasks: any[]
): ICandidateRecommendationSyncTask[] => {
  return tasks.map(toCandidateRecommendationSyncTask);
};
