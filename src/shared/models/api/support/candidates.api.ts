import {
  ISupportCandidate,
  ISupportCandidateResetOnboardingAssessmentRequest,
  ISupportCandidateResetOnboardingAssessmentResponse,
  ISupportCandidateActionResponse,
} from '../../domain/support/candidates.domain';
import {
  IApiRequest,
  IApiResponse,
  IApiPaginatedRequest,
  IPaginatedResponse,
} from '../common/common.api';
import {
  ISupportCandidateCreateSimple,
  ISupportCandidateCreateDone,
  ISupportCandidateUpdate,
  ISupportCandidateFilterQuery,
  ISupportCandidateIdParams,
  ISupportCandidateListResponse,
  ISupportRecommendedCandidate,
} from '../../domain/support/candidates.domain';

export type ISupportCandidateCreateApiRequest =
  IApiRequest<ISupportCandidateCreateSimple>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportCandidateCreateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISupportCandidateCreateDone'
 */
export type ISupportCandidateCreateApiResponse =
  IApiResponse<ISupportCandidateCreateDone>;

export type ISupportCandidateUpdateApiRequest = IApiRequest<
  ISupportCandidateUpdate,
  void,
  ISupportCandidateIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportCandidateUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISupportCandidate'
 */
export type ISupportCandidateUpdateApiResponse =
  IApiResponse<ISupportCandidate>;

export type ISupportCandidateGetApiRequest = IApiRequest<
  void,
  void,
  ISupportCandidateIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportCandidateGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISupportCandidate'
 */
export type ISupportCandidateGetApiResponse = IApiResponse<ISupportCandidate>;

export type ISupportCandidateDeleteApiRequest = IApiRequest<
  void,
  void,
  ISupportCandidateIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportCandidateDeleteApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: boolean
 */
export type ISupportCandidateDeleteApiResponse = IApiResponse<boolean>;

export type ISupportCandidateListApiRequest = IApiPaginatedRequest<
  void,
  ISupportCandidateFilterQuery,
  void
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportCandidateListApiResponse:
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
 *                         $ref: '#/components/schemas/ISupportCandidateListResponse'
 */
export type ISupportCandidateListApiResponse =
  IPaginatedResponse<ISupportCandidateListResponse>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportCandidatePublishRequest:
 *       type: object
 *       description: Request to publish a candidate with note
 *       properties:
 *         candidateId:
 *           type: string
 *           format: uuid
 *           description: ID of the candidate to publish
 *         note:
 *           type: string
 *           description: Note to add when publishing the candidate
 *       required:
 *         - candidateId
 *         - note
 *       example:
 *         candidateId: "123e4567-e89b-12d3-a456-426614174000"
 *         note: "Published after review of onboarding assessment recommendations"
 */
export interface ISupportCandidatePublishRequest {
  candidateId: string;
  note: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportCandidatePublishApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISupportCandidatePublishRequest'
 */
export type ISupportCandidatePublishApiRequest =
  IApiRequest<ISupportCandidatePublishRequest>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportCandidatePublishApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 publishedCount:
 *                   type: number
 *                   description: Number of candidates successfully published
 *                 failedCount:
 *                   type: number
 *                   description: Number of candidates that failed to publish
 *                 failedCandidates:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       candidateId:
 *                         type: string
 *                         format: uuid
 *                       reason:
 *                         type: string
 *                         description: Reason for failure
 */
export type ISupportCandidatePublishApiResponse =
  IApiResponse<ISupportCandidateActionResponse>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportRecommendedCandidatesListApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiPaginatedRequest'
 *         - type: object
 *           properties:
 *             pagination:
 *               $ref: '#/components/schemas/IPaginationRequest'
 *             filters:
 *               $ref: '#/components/schemas/ISupportCandidateFilterQuery'
 */
export type ISupportRecommendedCandidatesListApiRequest = IApiPaginatedRequest<
  void,
  ISupportCandidateFilterQuery,
  void
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportRecommendedCandidatesListApiResponse:
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
 *                         $ref: '#/components/schemas/ISupportRecommendedCandidate'
 */
export type ISupportRecommendedCandidatesListApiResponse =
  IPaginatedResponse<ISupportRecommendedCandidate>;

export type ISupportCandidateResetOnboardingAssessmentApiRequest = IApiRequest<
  ISupportCandidateResetOnboardingAssessmentRequest,
  void,
  { supportCandidateId: string }
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportCandidateResetOnboardingAssessmentApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISupportCandidateResetOnboardingAssessmentResponse'
 */
export type ISupportCandidateResetOnboardingAssessmentApiResponse =
  IApiResponse<ISupportCandidateResetOnboardingAssessmentResponse>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportCandidateResendJobAiInvitationApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             params:
 *               type: object
 *               properties:
 *                 invitationId:
 *                   type: string
 *                   format: uuid
 *                   description: ID of the job AI assessment invitation to resend
 */
export type ISupportCandidateResendJobAiInvitationApiRequest = IApiRequest<
  void,
  void,
  { invitationId: string }
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportCandidateResendJobAiInvitationApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 processedCount:
 *                   type: number
 *                   description: Number of invitations successfully resent
 *                 failedCount:
 *                   type: number
 *                   description: Number of invitations that failed to resend
 *                 failedCandidates:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       candidateId:
 *                         type: string
 *                         format: uuid
 *                       reason:
 *                         type: string
 *                         description: Reason for failure
 */
export type ISupportCandidateResendJobAiInvitationApiResponse =
  IApiResponse<ISupportCandidateActionResponse>;
