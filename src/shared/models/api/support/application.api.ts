import {
  IApiRequest,
  IApiResponse,
  IApiPaginatedRequest,
  IPaginatedResponse,
} from '../common/common.api';
import {
  ISupportJobApplication,
  ISupportJobApplicationFilterQuery,
  ISupportJobApplicationIdParams,
  ISupportJobApplicationAiAssessment,
  ISupportJobApplicationStatistics,
  ISupportJobApplicationStatisticsQuery,
} from '../../domain/support/application.domain';

export type ISupportJobApplicationListApiRequest = IApiPaginatedRequest<
  void,
  ISupportJobApplicationFilterQuery,
  void
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportJobApplicationListApiResponse:
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
 *                     $ref: '#/components/schemas/ISupportJobApplication'
 */
export type ISupportJobApplicationListApiResponse =
  IPaginatedResponse<ISupportJobApplication>;

export type ISupportJobApplicationGetApiRequest = IApiRequest<
  void,
  void,
  ISupportJobApplicationIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportJobApplicationGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISupportJobApplication'
 */
export type ISupportJobApplicationGetApiResponse =
  IApiResponse<ISupportJobApplication>;

export type ISupportJobApplicationGetAiAssessmentApiRequest = IApiRequest<
  void,
  void,
  ISupportJobApplicationIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportJobApplicationGetAiAssessmentApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISupportJobApplicationAiAssessment'
 */
export type ISupportJobApplicationGetAiAssessmentApiResponse =
  IApiResponse<ISupportJobApplicationAiAssessment>;

export type ISupportJobApplicationStatisticsApiRequest = IApiRequest<
  void,
  ISupportJobApplicationStatisticsQuery,
  void
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportJobApplicationStatisticsApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISupportJobApplicationStatistics'
 */
export type ISupportJobApplicationStatisticsApiResponse =
  IApiResponse<ISupportJobApplicationStatistics>;
