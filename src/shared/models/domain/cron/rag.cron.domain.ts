/**
 * @openapi
 * components:
 *   schemas:
 *     IRagCronTask:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The task ID
 *         status:
 *           $ref: '#/components/schemas/RagCronTaskStatus'
 *         totalEntities:
 *           type: number
 *           description: Total number of entities to process
 *         processedEntities:
 *           type: number
 *           description: Number of entities processed
 *         failedEntities:
 *           type: number
 *           description: Number of entities that failed to process
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
export interface IRagCronTask {
  id: string;
  status: RagCronTaskStatus;
  totalEntities: number;
  processedEntities: number;
  failedEntities: number;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     RagCronTaskStatus:
 *       type: string
 *       enum: [PENDING, PROCESSING, COMPLETED, FAILED]
 *       description: Status of the RAG task
 */
export enum RagCronTaskStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * @openapi
 * components:
 *   parameters:
 *     IRagCronTaskFilterQueryStatus:
 *       in: query
 *       name: status
 *       required: false
 *       schema:
 *         $ref: '#/components/schemas/RagCronTaskStatus'
 *         description: Filter by task status
 */
export interface IRagCronTaskFilterQuery {
  status?: RagCronTaskStatus;
}

/**
 * Convert a RAG cron task to a domain object
 */
export const toRagCronTask = (task: any): IRagCronTask => {
  return {
    id: task.id,
    status: task.status as RagCronTaskStatus,
    totalEntities: task.totalEntities,
    processedEntities: task.processedEntities,
    failedEntities: task.failedEntities,
    error: task.error,
    startedAt: task.startedAt,
    completedAt: task.completedAt,
  };
};

/**
 * Convert a list of RAG cron tasks to a domain object
 */
export const toRagCronTaskList = (tasks: any[]): IRagCronTask[] => {
  return tasks.map(toRagCronTask);
};
