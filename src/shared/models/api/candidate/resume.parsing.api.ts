import {
  IResumeParsed,
  IResumeParsingTask,
} from '../../domain/candidate/resume.parsing.domain';
import { IResumePublicParsingTask } from '../../domain/candidate/resume.public.parsing.domain';
import { IApiRequest, IApiResponse } from '../common/common.api';

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeUploadApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IResumeParsingTask'
 */
export type IResumeUploadApiResponse = IApiResponse<IResumeParsingTask>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeParsingTaskGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IResumeParsingTask'
 */
export type IResumeParsingTaskGetApiResponse = IApiResponse<IResumeParsingTask>;

/**
 * @openapi
 * components:
 *   parameters:
 *     IParsingTaskIdParams:
 *       in: path
 *       name: taskId
 *       required: true
 *       schema:
 *         type: string
 */
export interface IParsingTaskIdParams {
  taskId: string;
}

export type IResumeParsingTaskGetApiRequest = IApiRequest<
  void,
  void,
  IParsingTaskIdParams
>;

export type IResumeParsingGetParsedResumeApiRequest = IApiRequest<
  void,
  void,
  IParsingTaskIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeParsingGetParsedResumeApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IResumeParsed'
 */
export type IResumeParsingGetParsedResumeApiResponse =
  IApiResponse<IResumeParsed>;

// Public parsing task API models

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumePublicParsingUploadApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IResumePublicParsingTask'
 */
export type IResumePublicParsingUploadApiResponse =
  IApiResponse<IResumePublicParsingTask>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumePublicParsingTaskGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IResumePublicParsingTask'
 */
export type IResumePublicParsingTaskGetApiResponse =
  IApiResponse<IResumePublicParsingTask>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumePublicParsingGetResumeApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IResumeParsed'
 */
export type IResumePublicParsingGetResumeApiResponse =
  IApiResponse<IResumeParsed>;

/**
 * @openapi
 * components:
 *   parameters:
 *     IPublicParsingTaskIdParams:
 *       in: path
 *       name: taskId
 *       required: true
 *       schema:
 *         type: string
 *       description: The ID of the public parsing task
 */
export interface IPublicParsingTaskIdParams {
  taskId: string;
}

export type IResumePublicParsingTaskGetApiRequest = IApiRequest<
  void,
  void,
  IPublicParsingTaskIdParams
>;

export type IResumePublicParsingGetResumeApiRequest = IApiRequest<
  void,
  void,
  IPublicParsingTaskIdParams
>;
