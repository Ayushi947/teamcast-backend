/**
 * @openapi
 * components:
 *   schemas:
 *     IJobRecommendationCronTask:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The task ID
 *         status:
 *           $ref: '#/components/schemas/JobRecommendationCronTaskStatus'
 *         totalJobs:
 *           type: number
 *           description: Total number of jobs to process
 *         processedJobs:
 *           type: number
 *           description: Number of jobs processed
 *         failedJobs:
 *           type: number
 *           description: Number of jobs that failed to process
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
export interface IJobRecommendationCronTask {
  id: string;
  status: JobRecommendationCronTaskStatus;
  totalJobs: number;
  processedJobs: number;
  failedJobs: number;
  recommendationsCreated: number;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     JobRecommendationCronTaskStatus:
 *       type: string
 *       enum: [PENDING, PROCESSING, COMPLETED, FAILED]
 *       description: Status of the job recommendation task
 */
export enum JobRecommendationCronTaskStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * @openapi
 * components:
 *   parameters:
 *     IJobRecommendationCronTaskFilterQueryStatus:
 *       in: query
 *       name: status
 *       required: false
 *       schema:
 *         $ref: '#/components/schemas/JobRecommendationCronTaskStatus'
 *         description: Filter by task status
 */
export interface IJobRecommendationCronTaskFilterQuery {
  status?: JobRecommendationCronTaskStatus;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobRecommendationSyncTask:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The sync task ID
 *         jobPostingId:
 *           type: string
 *           description: The job posting ID
 *         cronTaskId:
 *           type: string
 *           description: The parent cron task ID
 *         status:
 *           $ref: '#/components/schemas/JobRecommendationCronTaskStatus'
 *         recommendationsCreated:
 *           type: number
 *           description: Number of recommendations created for this job
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
export interface IJobRecommendationSyncTask {
  id: string;
  jobPostingId: string;
  cronTaskId: string;
  status: JobRecommendationCronTaskStatus;
  recommendationsCreated: number;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Convert a job recommendation cron task to a domain object
 */
export const toJobRecommendationCronTask = (
  task: any
): IJobRecommendationCronTask => {
  return {
    id: task.id,
    status: task.status as JobRecommendationCronTaskStatus,
    totalJobs: task.totalJobs,
    processedJobs: task.processedJobs,
    failedJobs: task.failedJobs,
    recommendationsCreated: task.recommendationsCreated,
    error: task.error,
    startedAt: task.startedAt,
    completedAt: task.completedAt,
  };
};

/**
 * Convert a list of job recommendation cron tasks to domain objects
 */
export const toJobRecommendationCronTaskList = (
  tasks: any[]
): IJobRecommendationCronTask[] => {
  return tasks.map(toJobRecommendationCronTask);
};

/**
 * Convert a job recommendation sync task to a domain object
 */
export const toJobRecommendationSyncTask = (
  task: any
): IJobRecommendationSyncTask => {
  return {
    id: task.id,
    jobPostingId: task.jobPostingId,
    cronTaskId: task.cronTaskId,
    status: task.status as JobRecommendationCronTaskStatus,
    recommendationsCreated: task.recommendationsCreated,
    error: task.error,
    startedAt: task.startedAt,
    completedAt: task.completedAt,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
};

/**
 * Convert a list of job recommendation sync tasks to domain objects
 */
export const toJobRecommendationSyncTaskList = (
  tasks: any[]
): IJobRecommendationSyncTask[] => {
  return tasks.map(toJobRecommendationSyncTask);
};
