import {
  ISubscriptionExpiryCronTask,
  SubscriptionExpiryTaskType,
  ISubscriptionExpiryCronTaskFilterQuery,
} from '../../domain/cron/subscription.expiry.cron.domain';
import { IPaginationRequest, IPaginatedResponse } from '../common/common.api';

/**
 * @openapi
 * components:
 *   schemas:
 *     ISubscriptionExpiryCronTaskStartedApiResponse:
 *       type: object
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/ISubscriptionExpiryCronTask'
 */
export interface ISubscriptionExpiryCronTaskStartedApiResponse {
  data: ISubscriptionExpiryCronTask;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISubscriptionExpiryCronTaskGetApiResponse:
 *       type: object
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/ISubscriptionExpiryCronTask'
 */
export interface ISubscriptionExpiryCronTaskGetApiResponse {
  data: ISubscriptionExpiryCronTask;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISubscriptionExpiryCronTaskListApiResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ISubscriptionExpiryCronTask'
 *         total:
 *           type: integer
 *         page:
 *           type: integer
 *         limit:
 *           type: integer
 *         totalPages:
 *           type: integer
 */
export type ISubscriptionExpiryCronTaskListApiResponse =
  IPaginatedResponse<ISubscriptionExpiryCronTask>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISubscriptionExpiryCronStartTaskApiRequest:
 *       type: object
 *       properties:
 *         type:
 *           $ref: '#/components/schemas/SubscriptionExpiryTaskType'
 *         batchSize:
 *           type: integer
 *           description: Number of subscriptions to process in batch
 *         metadata:
 *           type: object
 *           description: Additional metadata for the task
 *       required:
 *         - type
 */
export interface ISubscriptionExpiryCronStartTaskApiRequest {
  type: SubscriptionExpiryTaskType;
  batchSize?: number;
  metadata?: Record<string, any>;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISubscriptionExpiryCronTaskListApiRequest:
 *       type: object
 *       properties:
 *         filters:
 *           type: object
 *           properties:
 *             type:
 *               $ref: '#/components/schemas/SubscriptionExpiryTaskType'
 *             status:
 *               $ref: '#/components/schemas/SubscriptionExpiryTaskCronStatus'
 *             startDate:
 *               type: string
 *               format: date-time
 *             endDate:
 *               type: string
 *               format: date-time
 *         pagination:
 *           $ref: '#/components/schemas/IPaginationRequest'
 */
export interface ISubscriptionExpiryCronTaskListApiRequest {
  filters?: ISubscriptionExpiryCronTaskFilterQuery;
  pagination: IPaginationRequest;
}
