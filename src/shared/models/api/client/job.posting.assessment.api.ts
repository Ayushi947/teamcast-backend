import {
  IJobPostingAssessment,
  IJobPostingAssessmentTask,
} from '../../domain/client/job.posting.assessment.domain';
import { IApiRequest, IApiResponse } from '../common/common.api';

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPostingAssessmentStartApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IJobPostingAssessmentTask'
 */
export type IJobPostingAssessmentStartApiResponse =
  IApiResponse<IJobPostingAssessmentTask>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPostingAssessmentTaskGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IJobPostingAssessmentTask'
 */
export type IJobPostingAssessmentTaskGetApiResponse =
  IApiResponse<IJobPostingAssessmentTask>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPostingAssessmentGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IJobPostingAssessment'
 */
export type IJobPostingAssessmentGetApiResponse =
  IApiResponse<IJobPostingAssessment>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPostingAssessmentGetLatestApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IJobPostingAssessment'
 */
export type IJobPostingAssessmentGetLatestApiResponse =
  IApiResponse<IJobPostingAssessment>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPostingAssessmentGetAllApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/IJobPostingAssessment'
 */
export type IJobPostingAssessmentGetAllApiResponse = IApiResponse<
  IJobPostingAssessment[]
>;

/**
 * @openapi
 * components:
 *   parameters:
 *     IJobPostingAssessmentTaskIdParams:
 *       in: path
 *       name: taskId
 *       required: true
 *       schema:
 *         type: string
 */
export interface IJobPostingAssessmentTaskIdParams {
  taskId: string;
}

/**
 * @openapi
 * components:
 *   parameters:
 *     IJobPostingAssessmentIdParams:
 *       in: path
 *       name: assessmentId
 *       required: true
 *       schema:
 *         type: string
 */
export interface IJobPostingAssessmentIdParams {
  assessmentId: string;
}

/**
 * @openapi
 * components:
 *   parameters:
 *     IJobPostingIdParams:
 *       in: path
 *       name: jobPostingId
 *       required: true
 *       schema:
 *         type: string
 */
export interface IJobPostingIdParams {
  jobPostingId: string;
}

export type IJobPostingAssessmentStartApiRequest = IApiRequest<
  void,
  void,
  IJobPostingIdParams
>;

export type IJobPostingAssessmentTaskGetApiRequest = IApiRequest<
  void,
  void,
  IJobPostingAssessmentTaskIdParams
>;

export type IJobPostingAssessmentGetApiRequest = IApiRequest<
  void,
  void,
  IJobPostingAssessmentIdParams
>;

export type IJobPostingAssessmentGetByJobPostingApiRequest = IApiRequest<
  void,
  void,
  IJobPostingIdParams
>;
