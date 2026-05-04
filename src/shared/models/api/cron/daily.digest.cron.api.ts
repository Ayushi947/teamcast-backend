import {
  IApiRequest,
  IApiResponse,
  IApiPaginatedRequest,
  IPaginatedResponse,
} from '../common/common.api';
import {
  IDailyDigestCronTask,
  IDailyDigestCronTaskFilterQuery,
} from '../../domain/cron/daily.digest.domain';

/**
 * @openapi
 * components:
 *   schemas:
 *     IDailyDigestCronStartTask:
 *       type: object
 *       properties:
 *         data:
 *           type: object
 *           description: No data required to start daily digest task
 */
export interface IDailyDigestCronStartTask {
  data: Record<string, never>;
}

/**
 * Start task API models
 */
export type IDailyDigestCronStartTaskApiRequest =
  IApiRequest<IDailyDigestCronStartTask>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IDailyDigestCronTaskStartedApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IDailyDigestCronTask'
 */
export type IDailyDigestCronTaskStartedApiResponse =
  IApiResponse<IDailyDigestCronTask>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IDailyDigestCronTaskGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IDailyDigestCronTask'
 */
export type IDailyDigestCronTaskGetApiResponse =
  IApiResponse<IDailyDigestCronTask>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IDailyDigestCronTaskListApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiPaginatedRequest'
 *         - type: object
 *           properties:
 *             filters:
 *               $ref: '#/components/schemas/IDailyDigestCronTaskFilterQuery'
 */
export type IDailyDigestCronTaskListApiRequest = IApiPaginatedRequest<{
  filters: IDailyDigestCronTaskFilterQuery;
}>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IDailyDigestCronTaskListApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPaginatedResponse'
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/IDailyDigestCronTask'
 */
export type IDailyDigestCronTaskListApiResponse = IApiResponse<
  IPaginatedResponse<IDailyDigestCronTask>
>;
