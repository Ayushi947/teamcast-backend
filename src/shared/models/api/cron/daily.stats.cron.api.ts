import {
  IApiRequest,
  IApiResponse,
  IApiPaginatedRequest,
  IPaginatedResponse,
} from '../common/common.api';
import {
  IDailyStatsCronTask,
  IDailyStatsCronTaskFilterQuery,
} from '../../domain/cron/daily.stats.domain';

/**
 * @openapi
 * components:
 *   schemas:
 *     IDailyStatsCronStartTask:
 *       type: object
 *       properties:
 *         data:
 *           type: object
 *           description: No data required to start daily stats task
 */
export interface IDailyStatsCronStartTask {
  data: Record<string, never>;
}

/**
 * Start task API models
 */
export type IDailyStatsCronStartTaskApiRequest =
  IApiRequest<IDailyStatsCronStartTask>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IDailyStatsCronTaskStartedApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IDailyStatsCronTask'
 */
export type IDailyStatsCronTaskStartedApiResponse =
  IApiResponse<IDailyStatsCronTask>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IDailyStatsCronTaskGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IDailyStatsCronTask'
 */
export type IDailyStatsCronTaskGetApiResponse =
  IApiResponse<IDailyStatsCronTask>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IDailyStatsCronTaskListApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiPaginatedRequest'
 *         - type: object
 *           properties:
 *             filters:
 *               $ref: '#/components/schemas/IDailyStatsCronTaskFilterQuery'
 */
export type IDailyStatsCronTaskListApiRequest = IApiPaginatedRequest<{
  filters: IDailyStatsCronTaskFilterQuery;
}>;

/**
 * @openapi
 * components:
 *     IDailyStatsCronTaskListApiResponse:
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
 *                     $ref: '#/components/schemas/IDailyStatsCronTask'
 */
export type IDailyStatsCronTaskListApiResponse = IApiResponse<
  IPaginatedResponse<IDailyStatsCronTask>
>;
