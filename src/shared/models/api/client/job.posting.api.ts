import {
  IApiRequest,
  IApiResponse,
  IApiPaginatedRequest,
  IPaginatedResponse,
} from '../common/common.api';
import {
  IClientJobPosting,
  IClientJobPostingCreate,
  IClientJobPostingUpdate,
  IClientJobPostingSkillsUpdate,
  IClientJobPostingStatusUpdate,
  IClientJobPostingFilterQuery,
  IClientJobPostingIdParams,
  IClientJobAiAssessmentSettings,
  IClientJobAiAssessmentSettingsUpdate,
  IClientJobPostingInvite,
} from '../../domain/client/job.postings.domain';
import { IClientJobApplication } from '../../domain/client/application.domain';

export type IClientJobPostingCreateApiRequest =
  IApiRequest<IClientJobPostingCreate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobPostingCreateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IJobPosting'
 */
export type IClientJobPostingCreateApiResponse =
  IApiResponse<IClientJobPosting>;

export type IClientJobPostingUpdateApiRequest = IApiRequest<
  IClientJobPostingUpdate,
  void,
  IClientJobPostingIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobPostingUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientJobPosting'
 */
export type IClientJobPostingUpdateApiResponse =
  IApiResponse<IClientJobPosting>;

export type IClientJobPostingSkillsUpdateApiRequest = IApiRequest<
  IClientJobPostingSkillsUpdate,
  void,
  IClientJobPostingIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobPostingSkillsUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientJobPosting'
 */
export type IClientJobPostingSkillsUpdateApiResponse =
  IApiResponse<IClientJobPosting>;

export type IClientJobPostingStatusUpdateApiRequest = IApiRequest<
  IClientJobPostingStatusUpdate,
  void,
  IClientJobPostingIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobPostingStatusUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientJobPosting'
 */
export type IClientJobPostingStatusUpdateApiResponse =
  IApiResponse<IClientJobPosting>;

export type IClientJobPostingGetApiRequest = IApiRequest<
  void,
  void,
  IClientJobPostingIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobPostingGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IJobPosting'
 */
export type IClientJobPostingGetApiResponse = IApiResponse<IClientJobPosting>;

export type IClientJobPostingDeleteApiRequest = IApiRequest<
  void,
  void,
  IClientJobPostingIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobPostingDeleteApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: boolean
 */
export type IClientJobPostingDeleteApiResponse = IApiResponse<boolean>;

export type IClientJobPostingListApiRequest = IApiPaginatedRequest<
  void,
  IClientJobPostingFilterQuery,
  void
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobPostingListApiResponse:
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
 *                     $ref: '#/components/schemas/IClientJobPosting'
 */
export type IClientJobPostingListApiResponse =
  IPaginatedResponse<IClientJobPosting>;

export type IClientJobPostingInviteApiRequest = IApiRequest<
  IClientJobPostingInvite,
  void,
  IClientJobPostingIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobPostingInviteApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientJobApplication'
 */
export type IClientJobPostingInviteApiResponse =
  IApiResponse<IClientJobApplication>;

export type IClientJobAiAssessmentSettingsGetApiRequest = IApiRequest<
  void,
  void,
  IClientJobPostingIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobAiAssessmentSettingsGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientJobAiAssessmentSettings'
 */
export type IClientJobAiAssessmentSettingsGetApiResponse =
  IApiResponse<IClientJobAiAssessmentSettings>;

export type IClientJobAiAssessmentSettingsUpdateApiRequest = IApiRequest<
  IClientJobAiAssessmentSettingsUpdate,
  void,
  IClientJobPostingIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobAiAssessmentSettingsUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientJobAiAssessmentSettings'
 */
export type IClientJobAiAssessmentSettingsUpdateApiResponse =
  IApiResponse<IClientJobAiAssessmentSettings>;
