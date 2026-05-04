import {
  IApiRequest,
  IApiResponse,
  IApiPaginatedRequest,
  IPaginatedResponse,
} from '../common/common.api';
import {
  IJobRecommendationCronTask,
  IJobRecommendationCronTaskFilterQuery,
} from '../../domain/cron/job.recommendation.cron.domain';

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobRecommendationCronStartTask:
 *       type: object
 *       properties:
 *         jobPostingId:
 *           type: string
 *           format: uuid
 *           description: The job posting ID to find recommendations for
 *         batchSize:
 *           type: number
 *           description: The number of recommendations to find in each batch
 *           default: 10
 */
export interface IJobRecommendationCronStartTask {
  jobPostingId: string;
  batchSize?: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobRecommendationCronStartTaskApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 jobPostingId:
 *                   type: string
 *                   format: uuid
 *                 batchSize:
 *                   type: number
 */
export type IJobRecommendationCronStartTaskApiRequest = IApiRequest<{
  jobPostingId: string;
  batchSize?: number;
}>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobRecommendationCronTaskStartedApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IJobRecommendationCronTask'
 */
export type IJobRecommendationCronTaskStartedApiResponse =
  IApiResponse<IJobRecommendationCronTask>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobRecommendationCronTaskGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IJobRecommendationCronTask'
 */
export type IJobRecommendationCronTaskGetApiResponse =
  IApiResponse<IJobRecommendationCronTask>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobRecommendationCronTaskListApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiPaginatedRequest'
 *         - type: object
 *           properties:
 *             filters:
 *               $ref: '#/components/schemas/IJobRecommendationCronTaskFilterQuery'
 */
export type IJobRecommendationCronTaskListApiRequest = IApiPaginatedRequest<{
  filters: IJobRecommendationCronTaskFilterQuery;
}>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobRecommendationCronTaskListApiResponse:
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
 *                     $ref: '#/components/schemas/IJobRecommendationCronTask'
 */
export type IJobRecommendationCronTaskListApiResponse = IApiResponse<
  IPaginatedResponse<IJobRecommendationCronTask>
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobRecommendationCronFindRecommendationsRequest:
 *       type: object
 *       properties:
 *         jobPostingId:
 *           type: string
 *           format: uuid
 *           description: The job posting ID to find recommendations for
 *         limit:
 *           type: number
 *           description: Maximum number of recommendations to find
 *           default: 10
 */
export interface IJobRecommendationCronFindRecommendationsRequest {
  jobPostingId: string;
  limit?: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobRecommendationCronFindRecommendationsApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IJobRecommendationCronFindRecommendationsRequest'
 */
export type IJobRecommendationCronFindRecommendationsApiRequest =
  IApiRequest<IJobRecommendationCronFindRecommendationsRequest>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobRecommendationCronFindRecommendationsApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 recommendationsFound:
 *                   type: number
 *                   description: Number of recommendations found and stored
 *                 message:
 *                   type: string
 *                   description: Success message
 */
export type IJobRecommendationCronFindRecommendationsApiResponse =
  IApiResponse<{
    recommendationsFound: number;
    message: string;
  }>;
