import {
  IApiRequest,
  IApiResponse,
  IApiPaginatedRequest,
  IPaginatedResponse,
} from '../common/common.api';
import {
  ICandidateRecommendationCronTask,
  ICandidateRecommendationCronTaskFilterQuery,
} from '../../domain/cron/candidate.recommendation.cron.domain';

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateRecommendationCronStartTask:
 *       type: object
 *       properties:
 *         candidateId:
 *           type: string
 *           format: uuid
 *           description: The candidate ID to find job recommendations for
 *         batchSize:
 *           type: number
 *           description: The number of recommendations to find in each batch
 *           default: 10
 */
export interface ICandidateRecommendationCronStartTask {
  candidateId: string;
  batchSize?: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateRecommendationCronStartTaskApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 candidateId:
 *                   type: string
 *                   format: uuid
 *                 batchSize:
 *                   type: number
 */
export type ICandidateRecommendationCronStartTaskApiRequest = IApiRequest<{
  candidateId: string;
  batchSize?: number;
}>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateRecommendationCronTaskStartedApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ICandidateRecommendationCronTask'
 */
export type ICandidateRecommendationCronTaskStartedApiResponse =
  IApiResponse<ICandidateRecommendationCronTask>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateRecommendationCronTaskGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ICandidateRecommendationCronTask'
 */
export type ICandidateRecommendationCronTaskGetApiResponse =
  IApiResponse<ICandidateRecommendationCronTask>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateRecommendationCronTaskListApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiPaginatedRequest'
 *         - type: object
 *           properties:
 *             filters:
 *               $ref: '#/components/schemas/ICandidateRecommendationCronTaskFilterQuery'
 */
export type ICandidateRecommendationCronTaskListApiRequest =
  IApiPaginatedRequest<{
    filters: ICandidateRecommendationCronTaskFilterQuery;
  }>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateRecommendationCronTaskListApiResponse:
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
 *                     $ref: '#/components/schemas/ICandidateRecommendationCronTask'
 */
export type ICandidateRecommendationCronTaskListApiResponse = IApiResponse<
  IPaginatedResponse<ICandidateRecommendationCronTask>
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateRecommendationCronFindRecommendationsRequest:
 *       type: object
 *       properties:
 *         candidateId:
 *           type: string
 *           format: uuid
 *           description: The candidate ID to find job recommendations for
 *         limit:
 *           type: number
 *           description: Maximum number of recommendations to find
 *           default: 10
 */
export interface ICandidateRecommendationCronFindRecommendationsRequest {
  candidateId: string;
  limit?: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateRecommendationCronFindRecommendationsApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ICandidateRecommendationCronFindRecommendationsRequest'
 */
export type ICandidateRecommendationCronFindRecommendationsApiRequest =
  IApiRequest<ICandidateRecommendationCronFindRecommendationsRequest>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateRecommendationCronFindRecommendationsApiResponse:
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
export type ICandidateRecommendationCronFindRecommendationsApiResponse =
  IApiResponse<{
    recommendationsFound: number;
    message: string;
  }>;
