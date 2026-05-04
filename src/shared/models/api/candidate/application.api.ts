import {
  IApiRequest,
  IApiResponse,
  IPaginatedResponse,
  IApiPaginatedRequest,
} from '../common/common.api';
import {
  ICandidateJobApplication,
  ICandidateJobApplicationUpdate,
  ICandidateJobApplicationAccept,
  ICandidateJobApplicationReject,
  ICandidateJobApplicationWithdraw,
  ICandidateJobApplicationAiAssessment,
} from '../../domain/candidate/application.domain';
import { ApplicationStatusEnum } from '../../common/enums';

/**
 * @openapi
 * components:
 *   parameters:
 *     ICandidateJobApplicationFilterQuerySearch:
 *       in: query
 *       name: search
 *       required: false
 *       schema:
 *         type: string
 *         description: Global search across all searchable fields
 *     ICandidateJobApplicationFilterQuerySearchColumns:
 *       in: query
 *       name: searchColumns
 *       required: false
 *       schema:
 *         type: array
 *         items:
 *           type: string
 *         description: Specific columns to search in
 *       example: ["jobTitle", "company", "notes"]
 *     ICandidateJobApplicationFilterQueryStatus:
 *       in: query
 *       name: status
 *       schema:
 *         oneOf:
 *           - $ref: '#/components/schemas/ApplicationStatusEnum'
 *           - type: array
 *             items:
 *               $ref: '#/components/schemas/ApplicationStatusEnum'
 *         description: Filter by application status (single value or comma-separated list)
 *       example: "APPLIED,REVIEWING"
 *     ICandidateJobApplicationFilterQueryJobTitle:
 *       in: query
 *       name: jobTitle
 *       schema:
 *         type: string
 *       description: Filter by job title (partial match)
 *       example: "Software Engineer"
 *     ICandidateJobApplicationFilterQueryCompany:
 *       in: query
 *       name: company
 *       schema:
 *         type: string
 *       description: Filter by company name (partial match)
 *       example: "Tech Corp"
 *     ICandidateJobApplicationFilterQueryIndustry:
 *       in: query
 *       name: industry
 *       schema:
 *         type: string
 *       description: Filter by company industry (partial match)
 *       example: "Technology"
 *     ICandidateJobApplicationFilterQueryLocation:
 *       in: query
 *       name: location
 *       schema:
 *         type: string
 *       description: Filter by job location (partial match)
 *       example: "San Francisco"
 *     ICandidateJobApplicationFilterQueryJobType:
 *       in: query
 *       name: jobType
 *       schema:
 *         oneOf:
 *           - $ref: '#/components/schemas/WorkTypeEnum'
 *           - type: array
 *             items:
 *               $ref: '#/components/schemas/WorkTypeEnum'
 *         description: Filter by job type (single value or comma-separated list)
 *       example: "FULL_TIME,PART_TIME"
 *     ICandidateJobApplicationFilterQueryMinSalary:
 *       in: query
 *       name: minSalary
 *       schema:
 *         type: number
 *       description: Minimum salary filter
 *       example: 50000
 *     ICandidateJobApplicationFilterQueryMaxSalary:
 *       in: query
 *       name: maxSalary
 *       schema:
 *         type: number
 *       description: Maximum salary filter
 *       example: 100000
 *     ICandidateJobApplicationFilterQuerySalaryCurrency:
 *       in: query
 *       name: salaryCurrency
 *       schema:
 *         type: string
 *       description: Filter by salary currency
 *       example: "USD"
 *     ICandidateJobApplicationFilterQueryAppliedAfter:
 *       in: query
 *       name: appliedAfter
 *       schema:
 *         type: string
 *         format: date-time
 *       description: Filter by application date after this date
 *       example: "2024-01-01T00:00:00Z"
 *     ICandidateJobApplicationFilterQueryAppliedBefore:
 *       in: query
 *       name: appliedBefore
 *       schema:
 *         type: string
 *         format: date-time
 *       description: Filter by application date before this date
 *       example: "2024-12-31T23:59:59Z"
 *     ICandidateJobApplicationFilterQueryCreatedAfter:
 *       in: query
 *       name: createdAfter
 *       schema:
 *         type: string
 *         format: date-time
 *       description: Filter by creation date after this date
 *     ICandidateJobApplicationFilterQueryCreatedBefore:
 *       in: query
 *       name: createdBefore
 *       schema:
 *         type: string
 *         format: date-time
 *       description: Filter by creation date before this date
 *     ICandidateJobApplicationFilterQueryUpdatedAfter:
 *       in: query
 *       name: updatedAfter
 *       schema:
 *         type: string
 *         format: date-time
 *       description: Filter by update date after this date
 *     ICandidateJobApplicationFilterQueryUpdatedBefore:
 *       in: query
 *       name: updatedBefore
 *       schema:
 *         type: string
 *         format: date-time
 *       description: Filter by update date before this date
 */
export interface ICandidateJobApplicationFilterQuery {
  search?: string;
  searchColumns?: string[];
  status?: ApplicationStatusEnum | ApplicationStatusEnum[];
  jobTitle?: string;
  company?: string;
  industry?: string;
  location?: string;
  jobType?: string | string[];
  minSalary?: number;
  maxSalary?: number;
  salaryCurrency?: string;
  appliedAfter?: Date;
  appliedBefore?: Date;
  createdAfter?: Date;
  createdBefore?: Date;
  updatedAfter?: Date;
  updatedBefore?: Date;
}

export type ICandidateJobApplicationListRequest = IApiPaginatedRequest<
  void,
  ICandidateJobApplicationFilterQuery
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobApplicationListGetApiResponse:
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
 *                     $ref: '#/components/schemas/ICandidateJobApplication'
 */
export type ICandidateJobApplicationListGetApiResponse = IApiResponse<
  IPaginatedResponse<ICandidateJobApplication>
>;

/**
 * @openapi
 * components:
 *   parameters:
 *     ICandidateJobApplicationIdParams:
 *       in: path
 *       name: applicationId
 *       required: true
 *       schema:
 *         type: string
 */
export interface ICandidateJobApplicationIdParams {
  applicationId: string;
}

export type ICandidateJobApplicationGetApiRequest = IApiRequest<
  void,
  void,
  ICandidateJobApplicationIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobApplicationGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ICandidateJobApplication'
 */
export type ICandidateJobApplicationGetApiResponse =
  IApiResponse<ICandidateJobApplication>;

export type ICandidateJobApplicationUpdateApiRequest = IApiRequest<
  ICandidateJobApplicationUpdate,
  void,
  ICandidateJobApplicationIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobApplicationUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ICandidateJobApplication'
 */
export type ICandidateJobApplicationUpdateApiResponse =
  IApiResponse<ICandidateJobApplication>;

export type ICandidateJobApplicationAcceptApiRequest = IApiRequest<
  ICandidateJobApplicationAccept,
  void,
  ICandidateJobApplicationIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobApplicationAcceptApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ICandidateJobApplication'
 */
export type ICandidateJobApplicationAcceptApiResponse =
  IApiResponse<ICandidateJobApplication>;

export type ICandidateJobApplicationRejectApiRequest = IApiRequest<
  ICandidateJobApplicationReject,
  void,
  ICandidateJobApplicationIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobApplicationRejectApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ICandidateJobApplication'
 */
export type ICandidateJobApplicationRejectApiResponse =
  IApiResponse<ICandidateJobApplication>;

export type ICandidateJobApplicationWithdrawApiRequest = IApiRequest<
  ICandidateJobApplicationWithdraw,
  void,
  ICandidateJobApplicationIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobApplicationWithdrawApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ICandidateJobApplication'
 */
export type ICandidateJobApplicationWithdrawApiResponse =
  IApiResponse<ICandidateJobApplication>;

export type ICandidateJobApplicationGetAiAssessmentApiRequest = IApiRequest<
  void,
  void,
  ICandidateJobApplicationIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobApplicationGetAiAssessmentApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ICandidateJobApplicationAiAssessment'
 */
export type ICandidateJobApplicationGetAiAssessmentApiResponse =
  IApiResponse<ICandidateJobApplicationAiAssessment>;
