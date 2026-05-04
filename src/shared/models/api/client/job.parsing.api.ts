import {
  IJobParsed,
  IJobParsingTask,
} from '../../domain/client/job.parsing.domain';
import { IJobPublicParsingTask } from '../../domain/client/job.public.parsing.domain';
import { IApiRequest, IApiResponse } from '../common/common.api';

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobUploadApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IJobParsingTask'
 */
export type IJobUploadApiResponse = IApiResponse<IJobParsingTask>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobParsingTaskGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IJobParsingTask'
 */
export type IJobParsingTaskGetApiResponse = IApiResponse<IJobParsingTask>;

/**
 * @openapi
 * components:
 *   parameters:
 *     IJobParsingTaskIdParams:
 *       in: path
 *       name: taskId
 *       required: true
 *       schema:
 *         type: string
 */
export interface IJobParsingTaskIdParams {
  taskId: string;
}

export type IJobParsingTaskGetApiRequest = IApiRequest<
  void,
  void,
  IJobParsingTaskIdParams
>;

export type IJobParsingGetParsedJobApiRequest = IApiRequest<
  void,
  void,
  IJobParsingTaskIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobParsingGetParsedJobApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IJobParsed'
 */
export type IJobParsingGetParsedJobApiResponse = IApiResponse<IJobParsed>;

// Public parsing task API models

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPublicParsingUploadApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IJobPublicParsingTask'
 */
export type IJobPublicParsingUploadApiResponse =
  IApiResponse<IJobPublicParsingTask>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPublicParsingTaskGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IJobPublicParsingTask'
 */
export type IJobPublicParsingTaskGetApiResponse =
  IApiResponse<IJobPublicParsingTask>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPublicParsingGetJobApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IJobParsed'
 */
export type IJobPublicParsingGetJobApiResponse = IApiResponse<IJobParsed>;

/**
 * @openapi
 * components:
 *   parameters:
 *     IPublicJobParsingTaskIdParams:
 *       in: path
 *       name: taskId
 *       required: true
 *       schema:
 *         type: string
 *       description: The ID of the public job parsing task
 */
export interface IPublicJobParsingTaskIdParams {
  taskId: string;
}

export type IJobPublicParsingTaskGetApiRequest = IApiRequest<
  void,
  void,
  IPublicJobParsingTaskIdParams
>;

export type IJobPublicParsingGetJobApiRequest = IApiRequest<
  void,
  void,
  IPublicJobParsingTaskIdParams
>;
