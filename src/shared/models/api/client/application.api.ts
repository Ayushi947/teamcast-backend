import {
  IApiRequest,
  IApiResponse,
  IApiPaginatedRequest,
  IPaginatedResponse,
} from '../common/common.api';
import {
  IClientJobApplication,
  IClientJobApplicationFilterQuery,
  IClientJobApplicationIdParams,
  IClientJobApplicationAiAssessment,
  IClientJobApplicationStatusUpdate,
} from '../../domain/client/application.domain';

export type IClientJobApplicationListApiRequest = IApiPaginatedRequest<
  void,
  IClientJobApplicationFilterQuery,
  void
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobApplicationListApiResponse:
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
 *                     $ref: '#/components/schemas/IClientJobApplication'
 */
export type IClientJobApplicationListApiResponse =
  IPaginatedResponse<IClientJobApplication>;

export type IClientJobApplicationGetApiRequest = IApiRequest<
  void,
  void,
  IClientJobApplicationIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobApplicationGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientJobApplication'
 */
export type IClientJobApplicationGetApiResponse =
  IApiResponse<IClientJobApplication>;

export type IClientJobApplicationGetAiAssessmentApiRequest = IApiRequest<
  void,
  void,
  IClientJobApplicationIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobApplicationGetAiAssessmentApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientJobApplicationAiAssessment'
 */
export type IClientJobApplicationGetAiAssessmentApiResponse =
  IApiResponse<IClientJobApplicationAiAssessment>;

export type IClientJobApplicationUpdateApiRequest = IApiRequest<
  IClientJobApplicationStatusUpdate,
  void,
  IClientJobApplicationIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobApplicationUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientJobApplication'
 */
export type IClientJobApplicationUpdateApiResponse =
  IApiResponse<IClientJobApplication>;

export type IClientJobApplicationHireRequestApiRequest = IApiRequest<
  void,
  void,
  IClientJobApplicationIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientJobApplicationHireRequestApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Hire request processed successfully. Account manager has been notified."
 */
export type IClientJobApplicationHireRequestApiResponse = IApiResponse<{
  message: string;
}>;
