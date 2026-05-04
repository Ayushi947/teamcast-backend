import {
  IApiRequest,
  IApiResponse,
  IApiPaginatedRequest,
  IPaginatedResponse,
} from '../common/common.api';
import {
  IFeedbackEmailCronTask,
  IFeedbackEmailCronTaskFilterQuery,
  FeedbackEmailTaskType,
} from '../../domain/cron/feedback.email.cron.domain';

/**
 * @openapi
 * components:
 *   schemas:
 *     IFeedbackEmailCronStartTask:
 *       type: object
 *       properties:
 *         type:
 *           $ref: '#/components/schemas/FeedbackEmailTaskType'
 *           description: The type of feedback email task to start
 */
export interface IFeedbackEmailCronStartTask {
  type: FeedbackEmailTaskType;
}

/**
 * Start task API models
 */
export type IFeedbackEmailCronStartTaskApiRequest =
  IApiRequest<IFeedbackEmailCronStartTask>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IFeedbackEmailCronTaskStartedApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IFeedbackEmailCronTask'
 */
export type IFeedbackEmailCronTaskStartedApiResponse =
  IApiResponse<IFeedbackEmailCronTask>;

/**
 * Get task API models
 */
export type IFeedbackEmailCronTaskGetApiResponse =
  IApiResponse<IFeedbackEmailCronTask>;

/**
 * List tasks API models
 */
export type IFeedbackEmailCronTaskListApiRequest =
  IApiPaginatedRequest<IFeedbackEmailCronTaskFilterQuery>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IFeedbackEmailCronTaskListApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPaginatedResponse'
 *               items:
 *                 $ref: '#/components/schemas/IFeedbackEmailCronTask'
 */
export type IFeedbackEmailCronTaskListApiResponse =
  IPaginatedResponse<IFeedbackEmailCronTask>;
