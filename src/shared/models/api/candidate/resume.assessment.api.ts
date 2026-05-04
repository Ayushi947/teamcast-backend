import {
  IResumeAssessment,
  IResumeAssessmentTask,
} from '../../domain/candidate/resume.assessment.domain';
import { IApiRequest, IApiResponse } from '../common/common.api';

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeAssessmentStartApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IResumeAssessmentTask'
 */
export type IResumeAssessmentStartApiResponse =
  IApiResponse<IResumeAssessmentTask>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeAssessmentTaskGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IResumeAssessmentTask'
 */
export type IResumeAssessmentTaskGetApiResponse =
  IApiResponse<IResumeAssessmentTask>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeAssessmentGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IResumeAssessment'
 */
export type IResumeAssessmentGetApiResponse = IApiResponse<IResumeAssessment>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeAssessmentGetLatestApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IResumeAssessment'
 */
export type IResumeAssessmentGetLatestApiResponse =
  IApiResponse<IResumeAssessment>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeAssessmentGetAllApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/IResumeAssessment'
 */
export type IResumeAssessmentGetAllApiResponse = IApiResponse<
  IResumeAssessment[]
>;

/**
 * @openapi
 * components:
 *   parameters:
 *     IAssessmentTaskIdParams:
 *       in: path
 *       name: taskId
 *       required: true
 *       schema:
 *         type: string
 */
export interface IAssessmentTaskIdParams {
  taskId: string;
}

/**
 * @openapi
 * components:
 *   parameters:
 *     IAssessmentIdParams:
 *       in: path
 *       name: assessmentId
 *       required: true
 *       schema:
 *         type: string
 */
export interface IAssessmentIdParams {
  assessmentId: string;
}

export type IResumeAssessmentTaskGetApiRequest = IApiRequest<
  void,
  void,
  IAssessmentTaskIdParams
>;

export type IResumeAssessmentGetApiRequest = IApiRequest<
  void,
  void,
  IAssessmentIdParams
>;

type IAssessmentCandidateIdParams = {
  candidateId: string;
};

/**
 * @openapi
 * components:
 *   parameters:
 *     IAssessmentCandidateIdParams:
 *       in: path
 *       name: candidateId
 *       required: true
 *       schema:
 *         type: string
 */
export type IResumeAssessmentGetLatestByCandidateIdApiRequest = IApiRequest<
  void,
  void,
  IAssessmentCandidateIdParams
>;
