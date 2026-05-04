/**
 * @openapi
 * components:
 *   schemas:
 *     DailyStatsCronTaskStatus:
 *       type: string
 *       enum: [PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED]
 *       description: Status of the daily stats cron task
 */
export enum DailyStatsCronTaskStatus {
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
 *     IDailyStatsCronTask:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The task ID
 *         status:
 *           $ref: '#/components/schemas/DailyStatsCronTaskStatus'
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
 *         candidateStats:
 *           type: string
 *           description: JSON string of candidate statistics
 *         clientStats:
 *           type: string
 *           description: JSON string of client statistics
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the task was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the task was last updated
 */
export interface IDailyStatsCronTask {
  id: string;
  status: DailyStatsCronTaskStatus;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  errorMessage?: string;
  candidateStats?: string;
  clientStats?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IDailyStatsCronTaskFilterQuery:
 *       type: object
 *       properties:
 *         status:
 *           $ref: '#/components/schemas/DailyStatsCronTaskStatus'
 *           description: Filter by task status
 */
export interface IDailyStatsCronTaskFilterQuery {
  status?: DailyStatsCronTaskStatus;
}

/**
 * Convert a daily stats cron task to a domain object
 */
export const toDailyStatsCronTask = (task: any): IDailyStatsCronTask => {
  return {
    id: task.id,
    status: task.status as DailyStatsCronTaskStatus,
    startedAt: task.startedAt,
    completedAt: task.completedAt,
    error: task.error,
    errorMessage: task.errorMessage,
    candidateStats: task.candidateStats,
    clientStats: task.clientStats,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
};

/**
 * Convert a list of daily stats cron tasks to domain objects
 */
export const toDailyStatsCronTaskList = (
  tasks: any[]
): IDailyStatsCronTask[] => {
  return tasks.map(toDailyStatsCronTask);
};
