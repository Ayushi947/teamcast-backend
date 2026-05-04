import { JobRecommendationStatusEnum } from '../../common/enums';

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportJobRecommendationPreview:
 *       type: object
 *       description: Domain model representing a job recommendation preview for support team
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the preview recommendation
 *         candidateId:
 *           type: string
 *           format: uuid
 *           description: ID of the candidate
 *         score:
 *           type: number
 *           minimum: 0
 *           maximum: 1
 *           description: Match score between 0-1
 *         matchReason:
 *           type: array
 *           items:
 *             type: string
 *           description: Reasons for the match
 *         aiScore:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: AI assessment score (0-100)
 *         groundingInfo:
 *           type: string
 *           description: Detailed grounding information from AI
 *         candidate:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             name:
 *               type: string
 *             email:
 *               type: string
 *               format: email
 *             profilePicture:
 *               type: string
 *               nullable: true
 *             skills:
 *               type: array
 *               items:
 *                 type: string
 *             experience:
 *               type: number
 *               description: Years of experience
 *             currentLocation:
 *               type: string
 *               nullable: true
 *             expectedSalary:
 *               type: number
 *               nullable: true
 *             isImportedCandidate:
 *               type: boolean
 *               description: Whether this candidate was imported from external source
 *             importedIntegrationId:
 *               type: string
 *               nullable: true
 *               description: ID of the integration provider used for import
 *         metadata:
 *           type: object
 *           properties:
 *             semanticScore:
 *               type: number
 *               description: Semantic similarity score
 *             skillMatchScore:
 *               type: number
 *               description: Skill matching score
 *             experienceMatchScore:
 *               type: number
 *               description: Experience matching score
 *             industryMatchScore:
 *               type: number
 *               description: Industry matching score
 *             locationMatchScore:
 *               type: number
 *               description: Location matching score
 *             aiScore:
 *               type: number
 *               description: AI assessment score
 *             aiRecommendation:
 *               type: string
 *               description: AI recommendation text
 *             overallGroundingInfo:
 *               type: string
 *               description: Overall grounding information
 *       required:
 *         - id
 *         - candidateId
 *         - score
 *         - matchReason
 *         - aiScore
 *         - groundingInfo
 *         - candidate
 *         - metadata
 */
export interface ISupportJobRecommendationPreview {
  id: string;
  candidateId: string;
  score: number;
  matchReason: string[];
  aiScore: number;
  groundingInfo: string;
  candidate: {
    id: string;
    name: string;
    email: string;
    profilePicture?: string;
    skills?: string[];
    experience?: number;
    currentLocation?: string;
    expectedSalary?: number;
    isImportedCandidate: boolean;
    importedIntegrationId?: string;
  };
  metadata: {
    semanticScore: number;
    skillMatchScore: number;
    experienceMatchScore: number;
    industryMatchScore: number;
    locationMatchScore: number;
    aiScore: number;
    aiRecommendation: string;
    overallGroundingInfo: string;
  };
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportJobRecommendationPreviewResponse:
 *       type: object
 *       description: Response model for job recommendation previews
 *       properties:
 *         jobPostingId:
 *           type: string
 *           format: uuid
 *           description: ID of the job posting
 *         recommendations:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ISupportJobRecommendationPreview'
 *           description: List of recommendation previews
 *         total:
 *           type: number
 *           description: Total number of recommendations
 *         searchPrompt:
 *           type: string
 *           description: The search prompt used to generate recommendations
 *         generateAt:
 *           type: string
 *           format: date-time
 *           description: When the recommendations were generated
 *       required:
 *         - jobPostingId
 *         - recommendations
 *         - total
 *         - searchPrompt
 *         - generateAt
 */
export interface ISupportJobRecommendationPreviewResponse {
  jobPostingId: string;
  recommendations: ISupportJobRecommendationPreview[];
  total: number;
  searchPrompt: string;
  generateAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportStoreRecommendationsRequest:
 *       type: object
 *       description: Request model for storing selected recommendations
 *       properties:
 *         jobPostingId:
 *           type: string
 *           format: uuid
 *           description: ID of the job posting
 *         selectedCandidateIds:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *           description: IDs of selected candidates to store
 *         recommendations:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               metadata:
 *                 type: object
 *                 properties:
 *                   semanticScore:
 *                     type: number
 *                     minimum: 0
 *                     maximum: 1
 *                     description: Semantic score between 0-1
 *               matchReason:
 *                 type: string
 *                 description: Overall grounding info from metadata
 *           description: Simplified recommendation data for selected candidates
 *       required:
 *         - jobPostingId
 *         - selectedCandidateIds
 *         - recommendations
 */
export interface ISupportStoreRecommendationsRequest {
  jobPostingId: string;
  selectedCandidateIds: string[];
  recommendations: {
    metadata: {
      semanticScore: number;
    };
    matchReason: string;
  }[];
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportStoreRecommendationsResponse:
 *       type: object
 *       description: Response model for storing recommendations
 *       properties:
 *         stored:
 *           type: number
 *           description: Number of recommendations successfully stored
 *         skipped:
 *           type: number
 *           description: Number of recommendations skipped due to errors
 *       required:
 *         - stored
 *         - skipped
 */
export interface ISupportStoreRecommendationsResponse {
  stored: number;
  skipped: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportStoredJobRecommendation:
 *       type: object
 *       description: Domain model representing a stored job recommendation for support team
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the recommendation
 *         jobPostingId:
 *           type: string
 *           format: uuid
 *           description: ID of the job posting
 *         candidateId:
 *           type: string
 *           format: uuid
 *           description: ID of the candidate
 *         score:
 *           type: number
 *           minimum: 0
 *           maximum: 1
 *           description: Match score between 0-1
 *         matchReason:
 *           type: array
 *           items:
 *             type: string
 *           description: Reasons for the match
 *         isViewed:
 *           type: boolean
 *           description: Whether the recommendation has been viewed
 *         isSaved:
 *           type: boolean
 *           description: Whether the recommendation has been saved
 *         isInvited:
 *           type: boolean
 *           description: Whether the candidate has been invited
 *         status:
 *           $ref: '#/components/schemas/JobRecommendationStatusEnum'
 *         candidate:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             name:
 *               type: string
 *             email:
 *               type: string
 *               format: email
 *             profilePicture:
 *               type: string
 *               nullable: true
 *             skills:
 *               type: array
 *               items:
 *                 type: string
 *             experience:
 *               type: number
 *               description: Years of experience
 *             currentLocation:
 *               type: string
 *               nullable: true
 *             expectedSalary:
 *               type: number
 *               nullable: true
 *             isImportedCandidate:
 *               type: boolean
 *               description: Whether this candidate was imported from external source
 *             importedIntegrationId:
 *               type: string
 *               nullable: true
 *               description: ID of the integration provider used for import
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - id
 *         - jobPostingId
 *         - candidateId
 *         - score
 *         - matchReason
 *         - isViewed
 *         - isSaved
 *         - isInvited
 *         - status
 *         - createdAt
 *         - updatedAt
 */
export interface ISupportStoredJobRecommendation {
  id: string;
  jobPostingId: string;
  candidateId: string;
  score: number;
  matchReason: string[];
  isViewed: boolean;
  isSaved: boolean;
  isInvited: boolean;
  status: JobRecommendationStatusEnum;
  candidate?: {
    id: string;
    name: string;
    email: string;
    profilePicture?: string;
    skills?: string[];
    experience?: number;
    currentLocation?: string;
    expectedSalary?: number;
    isImportedCandidate: boolean;
    importedIntegrationId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportStoredJobRecommendationListResponse:
 *       type: object
 *       description: Response model for stored job recommendations list
 *       properties:
 *         recommendations:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ISupportStoredJobRecommendation'
 *           description: List of stored recommendations
 *         total:
 *           type: number
 *           description: Total number of stored recommendations
 *       required:
 *         - recommendations
 *         - total
 */
export interface ISupportStoredJobRecommendationListResponse {
  recommendations: ISupportStoredJobRecommendation[];
  total: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportJobRecommendationPreviewPaginatedResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IPaginatedResponse'
 *         - type: object
 *           properties:
 *             items:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ISupportJobRecommendationPreview'
 *               description: List of recommendation previews
 *       description: Paginated response for job recommendation previews
 */
export type ISupportJobRecommendationPreviewPaginatedResponse = {
  items: ISupportJobRecommendationPreview[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

/**
 * Transform functions to convert between data and domain models
 */
export const toSupportJobRecommendationPreviewDomain = (
  data: any
): ISupportJobRecommendationPreview => ({
  id: data.id,
  candidateId: data.candidateId,
  score: data.score,
  matchReason: data.matchReason,
  aiScore: data.aiScore,
  groundingInfo: data.groundingInfo,
  candidate: data.candidate,
  metadata: data.metadata,
});

export const toSupportStoredJobRecommendationDomain = (
  data: any
): ISupportStoredJobRecommendation => ({
  id: data.id,
  jobPostingId: data.jobPostingId,
  candidateId: data.candidateId,
  score: data.score,
  matchReason: data.matchReason,
  isViewed: data.isViewed,
  isSaved: data.isSaved,
  isInvited: data.isInvited,
  status: data.status,
  candidate: data.candidate,
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});
