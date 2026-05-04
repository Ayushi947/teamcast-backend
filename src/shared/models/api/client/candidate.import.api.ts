import {
  ICandidateImportProgress,
  ICandidateImportRecord,
  ICandidateImportStatistics,
} from '../../domain/client/candidate.import.domain';
import {
  IApiRequest,
  IApiResponse,
  IApiPaginatedRequest,
  IPaginatedResponse,
} from '../common/common.api';

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateImportTemplateDownloadRequest:
 *       type: object
 *       description: Request to download Excel template for candidate import
 *       properties:
 *         jobPostingId:
 *           type: string
 *           format: uuid
 *           description: Job posting ID for the template
 *       required:
 *         - jobPostingId
 */
export interface ICandidateImportTemplateDownloadRequest {
  jobPostingId: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateImportProcessRequest:
 *       type: object
 *       description: Request to process candidate import
 *       properties:
 *         jobPostingId:
 *           type: string
 *           format: uuid
 *           description: Job posting ID for the import
 */
export type ICandidateImportTemplateDownloadApiRequest =
  IApiRequest<ICandidateImportTemplateDownloadRequest>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateImportProcessApiResponse:
 *       type: object
 *       description: Response to process candidate import
 */
export type ICandidateImportProcessApiResponse =
  IApiResponse<ICandidateImportProgress>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateImportListApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiPaginatedRequest'
 *         - type: object
 *           properties:
 *             filters:
 *               type: object
 *               properties:
 *                 jobTitle:
 *                   type: string
 *                   description: Filter by job   title
 *                 location:
 *                   type: string
 *                   description: Filter by location
 *                 skills:
 *                   type: string
 *                   description: Filter by skills
 *             params:
 *               type: object
 *               properties:
 *                 jobPostingId:
 *                   type: string
 *                   format: uuid
 *                   description: Job posting ID
 *               required:
 *                 - jobPostingId
 */
export type ICandidateImportListApiRequest = IApiPaginatedRequest<
  void,
  {
    jobTitle?: string;
    location?: string;
    skills?: string;
  },
  {
    jobPostingId: string;
  }
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateImportListApiResponse:
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
 *                     $ref: '#/components/schemas/ICandidateImportRecord'
 */
export type ICandidateImportListApiResponse = IApiResponse<
  IPaginatedResponse<ICandidateImportRecord>
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateImportStatisticsApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             query:
 *               type: object
 *               properties:
 *                 jobPostingId:
 *                   type: string
 *                   format: uuid
 *                   description: Optional job posting ID to filter statistics
 *                 startDate:
 *                   type: string
 *                   format: date
 *                   description: Start date for statistics (YYYY-MM-DD)
 *                 endDate:
 *                   type: string
 *                   format: date
 *                   description: End date for statistics (YYYY-MM-DD)
 */
export interface ICandidateImportStatisticsQuery {
  jobPostingId?: string;
}

export type ICandidateImportStatisticsApiRequest = IApiRequest<
  void,
  ICandidateImportStatisticsQuery
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateImportStatisticsApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ICandidateImportStatistics'
 */
export type ICandidateImportStatisticsApiResponse =
  IApiResponse<ICandidateImportStatistics>;
