/**
 * @openapi
 * components:
 *   schemas:
 *     DailyDigestCronTaskStatus:
 *       type: string
 *       enum: [PENDING, IN_PROGRESS, COMPLETED, FAILED, CANCELLED]
 *       description: Status of the daily digest cron task
 */
export enum DailyDigestCronTaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IDailyDigestCronTask:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The task ID
 *         status:
 *           $ref: '#/components/schemas/DailyDigestCronTaskStatus'
 *         startedAt:
 *           type: string
 *           format: date-time
 *           description: When the task started
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: When the task completed
 *         error:
 *           type: string
 *           description: Error message if task failed
 *         errorMessage:
 *           type: string
 *           description: Detailed error message
 *         clientDigests:
 *           type: string
 *           description: JSON string of client digest data
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the task was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the task was last updated
 */
export interface IDailyDigestCronTask {
  id: string;
  status: DailyDigestCronTaskStatus;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  errorMessage?: string;
  clientDigests?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IDailyDigestCronTaskFilterQuery:
 *       type: object
 *       properties:
 *         status:
 *           $ref: '#/components/schemas/DailyDigestCronTaskStatus'
 *           description: Filter by task status
 */
export interface IDailyDigestCronTaskFilterQuery {
  status?: DailyDigestCronTaskStatus;
}

/**
 * Convert a daily digest cron task to a domain object
 */
export const toDailyDigestCronTask = (task: any): IDailyDigestCronTask => {
  return {
    id: task.id,
    status: task.status as DailyDigestCronTaskStatus,
    startedAt: task.startedAt,
    completedAt: task.completedAt,
    error: task.error,
    errorMessage: task.errorMessage,
    clientDigests: task.clientDigests,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
};

/**
 * Convert a list of daily digest cron tasks to domain objects
 */
export const toDailyDigestCronTaskList = (
  tasks: any[]
): IDailyDigestCronTask[] => {
  return tasks.map(toDailyDigestCronTask);
};
