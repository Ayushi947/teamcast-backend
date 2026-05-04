import {
  IApiRequest,
  IApiResponse,
  IPaginatedResponse,
  IApiPaginatedRequest,
} from '../common/common.api';
import {
  ICandidateJobPosting,
  ICandidateJobPostingApply,
} from '../../domain/candidate/job.posting.domain';
import { ICandidateJobApplication } from '../../domain/candidate/application.domain';
import {
  WorkTypeEnum,
  WorkCommitmentEnum,
  WorkScheduleEnum,
  CompanyIndustryEnum,
} from '../../common/enums';

/**
 * @openapi
 * components:
 *   parameters:
 *     ICandidateJobPostingFilterQueryJobType:
 *       in: query
 *       name: jobType
 *       schema:
 *         $ref: '#/components/schemas/WorkTypeEnum'
 *       description: Filter by job type
 *     ICandidateJobPostingFilterQueryJobCommitment:
 *       in: query
 *       name: jobCommitment
 *       schema:
 *         $ref: '#/components/schemas/WorkCommitmentEnum'
 *       description: Filter by job commitment
 *     ICandidateJobPostingFilterQueryJobSchedule:
 *       in: query
 *       name: jobSchedule
 *       schema:
 *         $ref: '#/components/schemas/WorkScheduleEnum'
 *       description: Filter by job schedule
 *     ICandidateJobPostingFilterQueryIndustry:
 *       in: query
 *       name: industry
 *       schema:
 *         $ref: '#/components/schemas/CompanyIndustryEnum'
 *       description: Filter by industry
 *     ICandidateJobPostingFilterQueryIsRemote:
 *       in: query
 *       name: isRemote
 *       schema:
 *         type: boolean
 *       description: Filter by remote work availability
 *     ICandidateJobPostingFilterQueryMinExperience:
 *       in: query
 *       name: minExperience
 *       schema:
 *         type: integer
 *       description: Filter by minimum years of experience
 *     ICandidateJobPostingFilterQueryMaxExperience:
 *       in: query
 *       name: maxExperience
 *       schema:
 *         type: integer
 *       description: Filter by maximum years of experience
 *     ICandidateJobPostingFilterQueryMinSalary:
 *       in: query
 *       name: minSalary
 *       schema:
 *         type: number
 *       description: Filter by minimum salary
 *     ICandidateJobPostingFilterQueryMaxSalary:
 *       in: query
 *       name: maxSalary
 *       schema:
 *         type: number
 *       description: Filter by maximum salary
 *     ICandidateJobPostingFilterQuerySalaryCurrency:
 *       in: query
 *       name: salaryCurrency
 *       schema:
 *         type: string
 *       description: Filter by salary currency
 *     ICandidateJobPostingFilterQuerySkills:
 *       in: query
 *       name: skills
 *       schema:
 *         type: array
 *         items:
 *           type: string
 *       description: Filter by required skills
 *     ICandidateJobPostingFilterQueryCompany:
 *       in: query
 *       name: company
 *       schema:
 *         type: string
 *       description: Filter by company name
 */
export interface ICandidateJobPostingFilterQuery {
  jobType?: WorkTypeEnum;
  jobCommitment?: WorkCommitmentEnum;
  jobSchedule?: WorkScheduleEnum;
  industry?: CompanyIndustryEnum;
  isRemote?: boolean;
  minExperience?: number;
  maxExperience?: number;
  minSalary?: number;
  maxSalary?: number;
  salaryCurrency?: string;
  skills?: string[];
  company?: string;
}

export type ICandidateJobPostingListRequest = IApiPaginatedRequest<
  void,
  ICandidateJobPostingFilterQuery
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobPostingListGetApiResponse:
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
 *                     $ref: '#/components/schemas/ICandidateJobPosting'
 */
export type ICandidateJobPostingListGetApiResponse = IApiResponse<
  IPaginatedResponse<ICandidateJobPosting>
>;

/**
 * @openapi
 * components:
 *   parameters:
 *     ICandidateJobPostingIdParams:
 *       in: path
 *       name: jobPostingId
 *       required: true
 *       schema:
 *         type: string
 */
export interface ICandidateJobPostingIdParams {
  jobPostingId: string;
}

export type IJobPostingGetApiRequest = IApiRequest<
  void,
  void,
  ICandidateJobPostingIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobPostingGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ICandidateJobPosting'
 */
export type ICandidateJobPostingGetApiResponse =
  IApiResponse<ICandidateJobPosting>;

export type ICandidateJobPostingApplyApiRequest = IApiRequest<
  ICandidateJobPostingApply,
  void,
  ICandidateJobPostingIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateJobPostingApplyApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ICandidateJobApplication'
 */
export type ICandidateJobPostingApplyApiResponse =
  IApiResponse<ICandidateJobApplication>;
