import {
  IApiRequest,
  IApiResponse,
  IApiPaginatedRequest,
  IPaginatedResponse,
} from '../common/common.api';
import {
  IJobPostingRecommendation,
  IJobPostingRecommendationFilterQuery,
  IJobPostingRecommendationIdParams,
  IJobRecommendationReject,
} from '../../domain/client/job.posting.recommendation.domain';

// Get job posting recommendations API models
export type IJobPostingRecommendationListApiRequest = IApiPaginatedRequest<
  void,
  IJobPostingRecommendationFilterQuery,
  { jobPostingId: string }
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPostingRecommendationListApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/IJobPostingRecommendation'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total number of recommendations
 *                     page:
 *                       type: integer
 *                       description: Current page number
 *                     limit:
 *                       type: integer
 *                       description: Number of items per page
 *                     totalPages:
 *                       type: integer
 *                       description: Total number of pages
 */
export type IJobPostingRecommendationListApiResponse = IApiResponse<
  IPaginatedResponse<IJobPostingRecommendation>
>;

// Get single job posting recommendation API models
export type IJobPostingRecommendationGetApiRequest = IApiRequest<
  void,
  void,
  IJobPostingRecommendationIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPostingRecommendationGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IJobPostingRecommendation'
 */
export type IJobPostingRecommendationGetApiResponse =
  IApiResponse<IJobPostingRecommendation>;

// Reject job posting recommendation API models
export type IJobPostingRecommendationRejectApiRequest = IApiRequest<
  IJobRecommendationReject,
  void,
  IJobPostingRecommendationIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPostingRecommendationRejectApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IJobPostingRecommendation'
 */
export type IJobPostingRecommendationRejectApiResponse =
  IApiResponse<IJobPostingRecommendation>;

// Mark recommendation as viewed API models
export type IJobPostingRecommendationMarkViewedApiRequest = IApiRequest<
  void,
  void,
  IJobPostingRecommendationIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPostingRecommendationMarkViewedApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IJobPostingRecommendation'
 */
export type IJobPostingRecommendationMarkViewedApiResponse =
  IApiResponse<IJobPostingRecommendation>;

// Save recommendation API models
export type IJobPostingRecommendationSaveApiRequest = IApiRequest<
  void,
  void,
  IJobPostingRecommendationIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPostingRecommendationSaveApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IJobPostingRecommendation'
 */
export type IJobPostingRecommendationSaveApiResponse =
  IApiResponse<IJobPostingRecommendation>;

// Unsave recommendation API models
export type IJobPostingRecommendationUnsaveApiRequest = IApiRequest<
  void,
  void,
  IJobPostingRecommendationIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPostingRecommendationUnsaveApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IJobPostingRecommendation'
 */
export type IJobPostingRecommendationUnsaveApiResponse =
  IApiResponse<IJobPostingRecommendation>;
