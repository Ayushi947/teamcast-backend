import {
  IApiRequest,
  IApiResponse,
  IApiPaginatedRequest,
  IPaginatedResponse,
} from '../common/common.api';
import {
  IRagCronTask,
  IRagCronTaskFilterQuery,
} from '../../domain/cron/rag.cron.domain';

/**
 * @openapi
 * components:
 *   schemas:
 *     IRagCronStartTask:
 *       type: object
 *       properties:
 *         batchSize:
 *           type: number
 *           description: The number of entities to process in each batch
 */
export interface IRagCronStartTask {
  batchSize: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IRagCronStartTaskApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 batchSize:
 *                   type: number
 */
export type IRagCronStartTaskApiRequest = IApiRequest<{
  batchSize: number;
}>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IRagCronTaskStartedApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IRagCronTask'
 */
export type IRagCronTaskStartedApiResponse = IApiResponse<IRagCronTask>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IRagCronTaskGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IRagCronTask'
 */
export type IRagCronTaskGetApiResponse = IApiResponse<IRagCronTask>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IRagCronTaskListApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiPaginatedRequest'
 *         - type: object
 *           properties:
 *             filters:
 *               $ref: '#/components/schemas/IRagCronTaskFilterQuery'
 */
export type IRagCronTaskListApiRequest = IApiPaginatedRequest<{
  filters: IRagCronTaskFilterQuery;
}>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IRagCronTaskListApiResponse:
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
 *                     $ref: '#/components/schemas/IRagCronTask'
 */
export type IRagCronTaskListApiResponse = IApiResponse<
  IPaginatedResponse<IRagCronTask>
>;
