import {
  IApiRequest,
  IApiResponse,
  IApiPaginatedRequest,
  IPaginatedResponse,
} from '../common/common.api';
import {
  ICandidateRecommendation,
  ICandidateRecommendationFilterQuery,
  ICandidateRecommendationIdParams,
  ICandidateRecommendationReject,
  IGetCandidateRecommendedJobsParams,
} from '../../domain/candidate/recommendation.domain';

// Get candidate recommendations API models
export type ICandidateRecommendationListApiRequest = IApiPaginatedRequest<
  void,
  ICandidateRecommendationFilterQuery,
  { candidateId: string }
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateRecommendationListApiResponse:
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
 *                     $ref: '#/components/schemas/ICandidateRecommendation'
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
export type ICandidateRecommendationListApiResponse = IApiResponse<
  IPaginatedResponse<ICandidateRecommendation>
>;

// Get single candidate recommendation API models
export type ICandidateRecommendationGetApiRequest = IApiRequest<
  void,
  void,
  ICandidateRecommendationIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateRecommendationApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ICandidateRecommendation'
 */
export type ICandidateRecommendationApiResponse =
  IApiResponse<ICandidateRecommendation>;

export type IRejectCandidateRecommendationApiRequest = IApiRequest<
  ICandidateRecommendationReject,
  void,
  ICandidateRecommendationIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IRejectCandidateRecommendationApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ICandidateRecommendation'
 */
export type IRejectCandidateRecommendationApiResponse =
  IApiResponse<ICandidateRecommendation>;

// Mark recommendation as viewed API models
export type IMarkCandidateRecommendationViewedApiRequest = IApiRequest<
  void,
  void,
  ICandidateRecommendationIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IMarkCandidateRecommendationViewedApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ICandidateRecommendation'
 */
export type IMarkCandidateRecommendationViewedApiResponse =
  IApiResponse<ICandidateRecommendation>;

// Save recommendation API models
export type ISaveCandidateRecommendationApiRequest = IApiRequest<
  void,
  void,
  ICandidateRecommendationIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISaveCandidateRecommendationApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ICandidateRecommendation'
 */
export type ISaveCandidateRecommendationApiResponse =
  IApiResponse<ICandidateRecommendation>;

// Unsave recommendation API models
export type IUnsaveCandidateRecommendationApiRequest = IApiRequest<
  void,
  void,
  ICandidateRecommendationIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IUnsaveCandidateRecommendationApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ICandidateRecommendation'
 */
export type IUnsaveCandidateRecommendationApiResponse =
  IApiResponse<ICandidateRecommendation>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IGetCandidateRecommendedJobsApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IGetCandidateRecommendedJobsParams'
 */
export type IGetCandidateRecommendedJobsApiRequest = IApiRequest<
  void,
  void,
  IGetCandidateRecommendedJobsParams
>;
