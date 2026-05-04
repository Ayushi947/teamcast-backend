/**
 * @openapi
 * components:
 *   schemas:
 *     IFeedbackEmailCronTask:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The task ID
 *         type:
 *           $ref: '#/components/schemas/FeedbackEmailTaskType'
 *         status:
 *           $ref: '#/components/schemas/FeedbackEmailTaskCronStatus'
 *         totalRecipients:
 *           type: number
 *           description: Total number of recipients to send emails to
 *         emailsSent:
 *           type: number
 *           description: Number of emails sent successfully
 *         failedEmails:
 *           type: number
 *           description: Number of emails that failed to send
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
export interface IFeedbackEmailCronTask {
  id: string;
  type: FeedbackEmailTaskType;
  status: FeedbackEmailTaskCronStatus;
  totalRecipients: number;
  emailsSent: number;
  failedEmails: number;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     FeedbackEmailTaskCronStatus:
 *       type: string
 *       enum: [PENDING, PROCESSING, COMPLETED, FAILED]
 *       description: Status of the feedback email task
 */
export enum FeedbackEmailTaskCronStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     FeedbackEmailTaskType:
 *       type: string
 *       enum: [FEEDBACK_REQUEST, FEEDBACK_REMINDER, PANEL_ASSESSMENT_STATUS_UPDATE]
 *       description: Type of feedback email task
 */
export enum FeedbackEmailTaskType {
  FEEDBACK_REQUEST = 'FEEDBACK_REQUEST',
  FEEDBACK_REMINDER = 'FEEDBACK_REMINDER',
  PANEL_ASSESSMENT_STATUS_UPDATE = 'PANEL_ASSESSMENT_STATUS_UPDATE',
}

/**
 * @openapi
 * components:
 *   parameters:
 *     IFeedbackEmailCronTaskFilterQueryStatus:
 *       in: query
 *       name: status
 *       required: false
 *       schema:
 *         $ref: '#/components/schemas/FeedbackEmailTaskCronStatus'
 *         description: Filter by task status
 *     IFeedbackEmailCronTaskFilterQueryType:
 *       in: query
 *       name: type
 *       required: false
 *       schema:
 *         $ref: '#/components/schemas/FeedbackEmailTaskType'
 *         description: Filter by task type
 */
export interface IFeedbackEmailCronTaskFilterQuery {
  status?: FeedbackEmailTaskCronStatus;
  type?: FeedbackEmailTaskType;
}

/**
 * Convert a feedback email cron task to a domain object
 */
export const toFeedbackEmailCronTask = (task: any): IFeedbackEmailCronTask => {
  return {
    id: task.id,
    type: task.type as FeedbackEmailTaskType,
    status: task.status as FeedbackEmailTaskCronStatus,
    totalRecipients: task.totalRecipients,
    emailsSent: task.emailsSent,
    failedEmails: task.failedEmails,
    error: task.error,
    startedAt: task.startedAt,
    completedAt: task.completedAt,
  };
};

/**
 * Convert a list of feedback email cron tasks to domain objects
 */
export const toFeedbackEmailCronTaskList = (
  tasks: any[]
): IFeedbackEmailCronTask[] => {
  return tasks.map(toFeedbackEmailCronTask);
};
