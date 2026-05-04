import {
  ISupportJobRecommendationPreview,
  ISupportStoreRecommendationsRequest,
  ISupportStoreRecommendationsResponse,
  ISupportStoredJobRecommendation,
} from '../../domain/support/job.posting.recommendation.domain';
import {
  IApiResponse,
  IApiPaginatedRequest,
  IPaginatedResponse,
} from '../common/common.api';

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportJobRecommendationPreviewApiRequest:
 *       type: object
 *       description: Request model for getting job recommendation previews
 *       properties:
 *         data:
 *           type: object
 *           description: Request data (empty for this endpoint)
 *         filters:
 *           type: object
 *           properties:
 *             limit:
 *               type: number
 *               minimum: 1
 *               maximum: 100
 *               default: 25
 *               description: Maximum number of recommendations to return
 *             prevSyncDateTime:
 *               type: string
 *               format: date-time
 *               description: Previous sync timestamp for incremental updates
 *             candidateSearch:
 *               type: string
 *               description: Search for candidates by name or email in embeddings before falling back to AI recommendations. Takes priority over AI recommendations. Supports exact and partial matches. When provided, this search is performed first, then additional search filters are applied.
 *         params:
 *           type: object
 *           properties:
 *             jobPostingId:
 *               type: string
 *               format: uuid
 *               description: ID of the job posting
 *         pagination:
 *           $ref: '#/components/schemas/IPaginationRequest'
 */
export interface ISupportJobRecommendationPreviewParams {
  jobPostingId: string;
}

export interface ISupportJobRecommendationPreviewFilters {
  limit?: number;
  prevSyncDateTime?: string;
}

export type ISupportJobRecommendationPreviewApiRequest = IApiPaginatedRequest<
  void,
  ISupportJobRecommendationPreviewFilters,
  ISupportJobRecommendationPreviewParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportJobRecommendationPreviewApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiPaginatedResponse'
 *         - type: object
 *           properties:
 *             data:
 *               allOf:
 *                 - $ref: '#/components/schemas/IPaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ISupportJobRecommendationPreview'
 *                       description: List of recommendation previews
 *               description: Paginated job recommendation preview data
 */
export type ISupportJobRecommendationPreviewApiResponse =
  IPaginatedResponse<ISupportJobRecommendationPreview>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportStoreRecommendationsApiRequest:
 *       type: object
 *       description: Request model for storing selected recommendations
 *       properties:
 *         data:
 *           type: object
 *           properties:
 *             selectedCandidateIds:
 *               type: array
 *               items:
 *                 type: string
 *                 format: uuid
 *               description: IDs of selected candidates to store
 *             recommendations:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   score:
 *                     type: number
 *                     minimum: 0
 *                     maximum: 1
 *                     description: Semantic score between 0-1
 *                   matchReason:
 *                     type: string
 *                     description: Overall grounding info from metadata
 *               description: Simplified recommendation data for selected candidates
 *           description: Store recommendations request data
 *         filters:
 *           type: object
 *           description: Query filters (empty for this endpoint)
 *         params:
 *           type: object
 *           properties:
 *             jobPostingId:
 *               type: string
 *               format: uuid
 *               description: ID of the job posting
 *         pagination:
 *           $ref: '#/components/schemas/IPaginationRequest'
 */
export interface ISupportStoreRecommendationsParams {
  jobPostingId: string;
}

export type ISupportStoreRecommendationsApiRequest = IApiPaginatedRequest<
  ISupportStoreRecommendationsRequest,
  void,
  ISupportStoreRecommendationsParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportStoreRecommendationsApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISupportStoreRecommendationsResponse'
 *               description: Store recommendations response data
 */
export type ISupportStoreRecommendationsApiResponse =
  IApiResponse<ISupportStoreRecommendationsResponse>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportStoredJobRecommendationListApiRequest:
 *       type: object
 *       description: Request model for getting stored job recommendations
 *       properties:
 *         data:
 *           type: object
 *           description: Request data (empty for this endpoint)
 *         filters:
 *           type: object
 *           description: Query filters (empty for this endpoint)
 *         params:
 *           type: object
 *           properties:
 *             jobPostingId:
 *               type: string
 *               format: uuid
 *               description: ID of the job posting
 *         pagination:
 *           $ref: '#/components/schemas/IPaginationRequest'
 */
export interface ISupportStoredJobRecommendationListParams {
  jobPostingId: string;
}

export type ISupportStoredJobRecommendationListApiRequest =
  IApiPaginatedRequest<void, void, ISupportStoredJobRecommendationListParams>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportStoredJobRecommendationListApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiPaginatedResponse'
 *         - type: object
 *           properties:
 *             data:
 *               allOf:
 *                 - $ref: '#/components/schemas/IPaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ISupportStoredJobRecommendation'
 *                       description: List of stored job recommendations
 *               description: Paginated stored job recommendations list data
 */
export type ISupportStoredJobRecommendationListApiResponse =
  IPaginatedResponse<ISupportStoredJobRecommendation>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportRefreshRecommendationsApiRequest:
 *       type: object
 *       description: Request model for refreshing job recommendations
 *       properties:
 *         data:
 *           type: object
 *           properties:
 *             limit:
 *               type: number
 *               minimum: 1
 *               maximum: 100
 *               default: 25
 *               description: Maximum number of recommendations to return
 *         filters:
 *           type: object
 *           description: Query filters (empty for this endpoint)
 *         params:
 *           type: object
 *           properties:
 *             jobPostingId:
 *               type: string
 *               format: uuid
 *               description: ID of the job posting
 *         pagination:
 *           $ref: '#/components/schemas/IPaginationRequest'
 */
export interface ISupportRefreshRecommendationsData {
  limit?: number;
}

export interface ISupportRefreshRecommendationsParams {
  jobPostingId: string;
}

export type ISupportRefreshRecommendationsApiRequest = IApiPaginatedRequest<
  ISupportRefreshRecommendationsData,
  void,
  ISupportRefreshRecommendationsParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportRefreshRecommendationsApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiPaginatedResponse'
 *         - type: object
 *           properties:
 *             data:
 *               allOf:
 *                 - $ref: '#/components/schemas/IPaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ISupportJobRecommendationPreview'
 *                       description: List of refreshed recommendation previews
 *               description: Refreshed paginated job recommendation data
 */
export type ISupportRefreshRecommendationsApiResponse =
  IPaginatedResponse<ISupportJobRecommendationPreview>;
