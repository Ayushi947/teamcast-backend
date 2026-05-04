import {
  IPaginationRequest,
  IPaginatedResponse,
} from '../../api/common/common.api';

/**
 * @openapi
 * components:
 *   schemas:
 *     SubscriptionExpiryTaskType:
 *       type: string
 *       description: Type of subscription expiry task
 *       enum:
 *         - CLIENT_SUBSCRIPTION_EXPIRY
 *         - CANDIDATE_SUBSCRIPTION_EXPIRY
 */
export enum SubscriptionExpiryTaskType {
  CLIENT_SUBSCRIPTION_EXPIRY = 'CLIENT_SUBSCRIPTION_EXPIRY',
  CANDIDATE_SUBSCRIPTION_EXPIRY = 'CANDIDATE_SUBSCRIPTION_EXPIRY',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     SubscriptionExpiryTaskCronStatus:
 *       type: string
 *       description: Status of subscription expiry cron task
 *       enum:
 *         - PENDING
 *         - PROCESSING
 *         - COMPLETED
 *         - FAILED
 *         - CANCELLED
 */
export enum SubscriptionExpiryTaskCronStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISubscriptionExpiryCronTask:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the task
 *         type:
 *           $ref: '#/components/schemas/SubscriptionExpiryTaskType'
 *         status:
 *           $ref: '#/components/schemas/SubscriptionExpiryTaskCronStatus'
 *         totalSubscriptions:
 *           type: integer
 *           description: Total number of subscriptions processed
 *         expiredSubscriptions:
 *           type: integer
 *           description: Number of subscriptions that were expired
 *         failedSubscriptions:
 *           type: integer
 *           description: Number of subscriptions that failed to process
 *         startedAt:
 *           type: string
 *           format: date-time
 *           description: When the task started
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: When the task completed
 *         errorMessage:
 *           type: string
 *           description: Error message if the task failed
 *         metadata:
 *           type: object
 *           description: Additional metadata about the task
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the task was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the task was last updated
 */
export interface ISubscriptionExpiryCronTask {
  id: string;
  type: SubscriptionExpiryTaskType;
  status: SubscriptionExpiryTaskCronStatus;
  totalSubscriptions: number;
  expiredSubscriptions: number;
  failedSubscriptions: number;
  startedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISubscriptionExpiryCronTaskFilterQuery:
 *       type: object
 *       properties:
 *         type:
 *           $ref: '#/components/schemas/SubscriptionExpiryTaskType'
 *         status:
 *           $ref: '#/components/schemas/SubscriptionExpiryTaskCronStatus'
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Filter tasks started after this date
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: Filter tasks started before this date
 */
export interface ISubscriptionExpiryCronTaskFilterQuery {
  type?: SubscriptionExpiryTaskType;
  status?: SubscriptionExpiryTaskCronStatus;
  startDate?: Date;
  endDate?: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISubscriptionExpiryCronTaskListQuery:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           description: Page number
 *         limit:
 *           type: integer
 *           description: Number of items per page
 *         type:
 *           $ref: '#/components/schemas/SubscriptionExpiryTaskType'
 *         status:
 *           $ref: '#/components/schemas/SubscriptionExpiryTaskCronStatus'
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 */
export interface ISubscriptionExpiryCronTaskListQuery {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISubscriptionExpiryCronTaskCreate:
 *       type: object
 *       properties:
 *         type:
 *           $ref: '#/components/schemas/SubscriptionExpiryTaskType'
 *         metadata:
 *           type: object
 *           description: Additional metadata for the task
 */
export interface ISubscriptionExpiryCronTaskCreate {
  type: SubscriptionExpiryTaskType;
  metadata?: Record<string, any>;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISubscriptionExpiryCronTaskUpdate:
 *       type: object
 *       properties:
 *         status:
 *           $ref: '#/components/schemas/SubscriptionExpiryTaskCronStatus'
 *         totalSubscriptions:
 *           type: integer
 *           description: Total number of subscriptions processed
 *         expiredSubscriptions:
 *           type: integer
 *           description: Number of subscriptions that were expired
 *         failedSubscriptions:
 *           type: integer
 *           description: Number of subscriptions that failed to process
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: When the task completed
 *         errorMessage:
 *           type: string
 *           description: Error message if the task failed
 *         metadata:
 *           type: object
 *           description: Additional metadata about the task
 */
export interface ISubscriptionExpiryCronTaskUpdate {
  status?: SubscriptionExpiryTaskCronStatus;
  totalSubscriptions?: number;
  expiredSubscriptions?: number;
  failedSubscriptions?: number;
  completedAt?: Date;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISubscriptionExpiryCronTaskList:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ISubscriptionExpiryCronTask'
 *         total:
 *           type: integer
 *           description: Total number of tasks
 *         page:
 *           type: integer
 *           description: Current page number
 *         limit:
 *           type: integer
 *           description: Number of items per page
 *         totalPages:
 *           type: integer
 *           description: Total number of pages
 */
export type ISubscriptionExpiryCronTaskList =
  IPaginatedResponse<ISubscriptionExpiryCronTask>;

/**
 * Transform database model to domain model
 */
export const toSubscriptionExpiryCronTask = (
  data: any
): ISubscriptionExpiryCronTask => ({
  id: data.id,
  type: data.type,
  status: data.status,
  totalSubscriptions: data.totalSubscriptions,
  expiredSubscriptions: data.expiredSubscriptions,
  failedSubscriptions: data.failedSubscriptions,
  startedAt: data.startedAt,
  completedAt: data.completedAt,
  errorMessage: data.errorMessage,
  metadata: data.metadata,
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});

/**
 * Transform database model list to domain model list
 */
export const toSubscriptionExpiryCronTaskList = (
  data: any[],
  total: number,
  page: number,
  limit: number
): ISubscriptionExpiryCronTaskList => ({
  items: data.map(toSubscriptionExpiryCronTask),
  pagination: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  },
});

/**
 * Transform query parameters to filter and pagination objects
 */
export const parseSubscriptionExpiryCronTaskListQuery = (
  query: ISubscriptionExpiryCronTaskListQuery
): {
  pagination: IPaginationRequest;
  filters: ISubscriptionExpiryCronTaskFilterQuery;
} => {
  const pagination: IPaginationRequest = {
    page: query.page || 1,
    limit: query.limit || 10,
  };

  const filters: ISubscriptionExpiryCronTaskFilterQuery = {
    type: query.type as SubscriptionExpiryTaskType,
    status: query.status as SubscriptionExpiryTaskCronStatus,
    startDate: query.startDate ? new Date(query.startDate) : undefined,
    endDate: query.endDate ? new Date(query.endDate) : undefined,
  };

  return { pagination, filters };
};
