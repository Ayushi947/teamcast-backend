import {
  ISupportInvitationImportPerUploadStatistics,
  ISupportInvitationImportProgress,
  ISupportInvitationImportRecord,
  ISupportInvitationImportStatistics,
} from '../../domain/support/invitation.import.domain';
import { IPaginationRequest, IPaginatedResponse } from '../common/common.api';

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportInvitationImportProcessApiResponse:
 *       type: object
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/ISupportInvitationImportProgress'
 */
export interface ISupportInvitationImportProcessApiResponse {
  data: ISupportInvitationImportProgress;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportInvitationImportListApiRequest:
 *       type: object
 *       properties:
 *         filters:
 *           type: object
 *           properties:
 *             jobTitle:
 *               type: string
 *               description: Filter by job title
 *             location:
 *               type: string
 *               description: Filter by location
 *             skills:
 *               type: string
 *               description: Filter by skills
 *             status:
 *               type: string
 *               enum: [PENDING, PROCESSED, INVITED, DUPLICATE, FAILED, REGISTERED]
 *               description: Filter by candidate status
 *         pagination:
 *           $ref: '#/components/schemas/IPaginationRequest'
 */
export interface ISupportInvitationImportListApiRequest {
  data: Record<string, any>;
  filters: {
    jobTitle?: string;
    location?: string;
    skills?: string;
    status?: string;
  };
  params: Record<string, any>;
  pagination: IPaginationRequest;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportInvitationImportListApiResponse:
 *       type: object
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/IPaginatedResponse<ISupportInvitationImportRecord>'
 */
export interface ISupportInvitationImportListApiResponse {
  data: IPaginatedResponse<ISupportInvitationImportRecord>;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportInvitationImportStatisticsApiRequest:
 *       type: object
 *       properties:
 *         filters:
 *           type: object
 *           properties:
 *             startDate:
 *               type: string
 *               format: date
 *               description: Start date for statistics (YYYY-MM-DD)
 *             endDate:
 *               type: string
 *               format: date
 *               description: End date for statistics (YYYY-MM-DD)
 */
export interface ISupportInvitationImportStatisticsApiRequest {
  data: Record<string, any>;
  filters: {
    startDate?: string;
    endDate?: string;
  };
  params: Record<string, any>;
  pagination: IPaginationRequest;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportInvitationImportStatisticsApiResponse:
 *       type: object
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/ISupportInvitationImportStatistics'
 */
export interface ISupportInvitationImportStatisticsApiResponse {
  data: ISupportInvitationImportStatistics;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportInvitationImportPerUploadStatisticsApiResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ISupportInvitationImportPerUploadStatistics'
 *           description: Array of per-upload statistics
 */
export interface ISupportInvitationImportPerUploadStatisticsApiResponse {
  data: ISupportInvitationImportPerUploadStatistics[];
}
