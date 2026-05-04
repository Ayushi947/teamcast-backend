import {
  IPartnerCandidate,
  IPartnerCandidateDetailed,
  IPartnerCandidateUpdate,
  IPartnerCandidateFilterQuery,
} from '../../domain/partner/candidate.domain';
import {
  IApiRequest,
  IApiResponse,
  IPaginatedResponse,
  IApiPaginatedRequest,
} from '../common/common.api';

// Get all candidates API models
export type IPartnerCandidateListApiRequest = IApiPaginatedRequest<
  void,
  IPartnerCandidateFilterQuery,
  void
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerCandidateListApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
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
 *                         $ref: '#/components/schemas/IPartnerCandidate'
 */
export type IPartnerCandidateListApiResponse = IApiResponse<
  IPaginatedResponse<IPartnerCandidate>
>;

// Get candidate by ID API models
export type IPartnerCandidateGetApiRequest = IApiRequest<
  void,
  void,
  { candidateId: string }
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerCandidateGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerCandidateDetailed'
 */
export type IPartnerCandidateGetApiResponse =
  IApiResponse<IPartnerCandidateDetailed>;

// Update candidate API models
export type IPartnerCandidateUpdateApiRequest = IApiRequest<
  IPartnerCandidateUpdate,
  void,
  { candidateId: string }
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerCandidateUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerCandidate'
 */
export type IPartnerCandidateUpdateApiResponse =
  IApiResponse<IPartnerCandidate>;

// Delete candidate API models
export type IPartnerCandidateDeleteApiRequest = IApiRequest<
  void,
  void,
  { candidateId: string }
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerCandidateDeleteApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 */
export type IPartnerCandidateDeleteApiResponse = IApiResponse<{
  success: boolean;
}>;

// Get recommended candidates for job posting API models
export type IPartnerCandidateRecommendationsApiRequest = IApiPaginatedRequest<
  void,
  void,
  { jobPostingId: string }
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerCandidateWithRecommendation:
 *       allOf:
 *         - $ref: '#/components/schemas/IPartnerCandidate'
 *         - type: object
 *           properties:
 *             recommendation:
 *               type: object
 *               properties:
 *                 score:
 *                   type: number
 *                   minimum: 0
 *                   maximum: 1
 *                   description: Match score between 0 and 1
 *                 matchReason:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Reasons for the match
 *                 isViewed:
 *                   type: boolean
 *                   description: Whether the recommendation has been viewed
 *                 isSaved:
 *                   type: boolean
 *                   description: Whether the recommendation has been saved
 *                 hasApplied:
 *                   type: boolean
 *                   description: Whether the candidate has applied
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   description: When the recommendation was created
 *               required:
 *                 - score
 *                 - matchReason
 *                 - isViewed
 *                 - isSaved
 *                 - hasApplied
 *                 - createdAt
 */
export interface IPartnerCandidateWithRecommendation extends IPartnerCandidate {
  recommendation: {
    score: number;
    matchReason: string[];
    isViewed: boolean;
    isSaved: boolean;
    hasApplied: boolean;
    createdAt: Date;
  };
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerCandidateRecommendationsApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
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
 *                         $ref: '#/components/schemas/IPartnerCandidateWithRecommendation'
 */
export type IPartnerCandidateRecommendationsApiResponse = IApiResponse<
  IPaginatedResponse<IPartnerCandidateWithRecommendation>
>;

// Update recommendation status API models
export type IPartnerCandidateRecommendationUpdateApiRequest = IApiRequest<
  {
    isViewed?: boolean;
    isSaved?: boolean;
    hasApplied?: boolean;
  },
  void,
  { candidateId: string; jobPostingId: string }
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerCandidateRecommendationUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
export type IPartnerCandidateRecommendationUpdateApiResponse = IApiResponse<{
  success: boolean;
  message: string;
}>;
