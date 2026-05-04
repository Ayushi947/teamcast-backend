import {
  IIntegrationDataSummary,
  IIntegrationDataDetails,
  IDataImportSource,
  IDataUsageStatistics,
} from '../../../domain/integration/common/integration.data.tracking.domain';
import {
  IIntegrationDisconnectRequest,
  IIntegrationDisconnectResponse,
  IIntegrationDisconnectSummary,
} from '../../../domain/integration/common/integration.disconnect.domain';
import { IApiRequest, IApiResponse } from '../../common/common.api';

/**
 * @openapi
 * components:
 *   schemas:
 *     IIntegrationDataSummaryApiRequest:
 *       type: object
 *       description: API request to get summary of all integration data
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *       properties:
 *         params:
 *           type: object
 *           description: No parameters required for this endpoint
 *           additionalProperties: false
 *       required:
 *         - params
 */
export interface IIntegrationDataSummaryApiRequest extends IApiRequest {
  params: Record<string, never>;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IIntegrationDataSummaryApiResponse:
 *       type: object
 *       description: API response containing summary data for all integrations
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the request was successful
 *           example: true
 *         message:
 *           type: string
 *           description: Response message
 *           example: "Integration data summary retrieved successfully"
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IIntegrationDataSummary'
 *           description: Array of integration data summaries
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Response timestamp
 *       required:
 *         - success
 *         - message
 *         - data
 *         - timestamp
 */
export type IIntegrationDataSummaryApiResponse = IApiResponse<
  IIntegrationDataSummary[]
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IIntegrationDataDetailsApiRequest:
 *       type: object
 *       description: API request to get detailed data for a specific integration
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *       properties:
 *         params:
 *           type: object
 *           properties:
 *             integrationId:
 *               type: string
 *               format: uuid
 *               description: Unique identifier of the integration
 *               example: "123e4567-e89b-12d3-a456-426614174000"
 *           required:
 *             - integrationId
 *       required:
 *         - params
 */
export interface IIntegrationDataDetailsApiRequest extends IApiRequest {
  params: {
    integrationId: string;
  };
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IIntegrationDataDetailsApiResponse:
 *       type: object
 *       description: API response containing detailed data for a specific integration
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the request was successful
 *           example: true
 *         message:
 *           type: string
 *           description: Response message
 *           example: "Integration data details retrieved successfully"
 *         data:
 *           $ref: '#/components/schemas/IIntegrationDataDetails'
 *           description: Detailed integration data including jobs and candidates
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Response timestamp
 *       required:
 *         - success
 *         - message
 *         - data
 *         - timestamp
 */
export type IIntegrationDataDetailsApiResponse =
  IApiResponse<IIntegrationDataDetails>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobImportSourceApiRequest:
 *       type: object
 *       description: API request to get import source information for a specific job
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *       properties:
 *         params:
 *           type: object
 *           properties:
 *             jobId:
 *               type: string
 *               format: uuid
 *               description: Unique identifier of the job posting
 *               example: "123e4567-e89b-12d3-a456-426614174000"
 *           required:
 *             - jobId
 *       required:
 *         - params
 */
export interface IJobImportSourceApiRequest extends IApiRequest {
  params: {
    jobId: string;
  };
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobImportSourceApiResponse:
 *       type: object
 *       description: API response containing import source information for a job
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the request was successful
 *           example: true
 *         message:
 *           type: string
 *           description: Response message
 *           example: "Job import source retrieved successfully"
 *         data:
 *           allOf:
 *             - $ref: '#/components/schemas/IDataImportSource'
 *           nullable: true
 *           description: Import source information, null if job was not imported
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Response timestamp
 *       required:
 *         - success
 *         - message
 *         - data
 *         - timestamp
 */
export type IJobImportSourceApiResponse =
  IApiResponse<IDataImportSource | null>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateImportSourceApiRequest:
 *       type: object
 *       description: API request to get import source information for a specific candidate
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *       properties:
 *         params:
 *           type: object
 *           properties:
 *             candidateId:
 *               type: string
 *               format: uuid
 *               description: Unique identifier of the candidate
 *               example: "123e4567-e89b-12d3-a456-426614174000"
 *           required:
 *             - candidateId
 *       required:
 *         - params
 */
export interface ICandidateImportSourceApiRequest extends IApiRequest {
  params: {
    candidateId: string;
  };
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateImportSourceApiResponse:
 *       type: object
 *       description: API response containing import source information for a candidate
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the request was successful
 *           example: true
 *         message:
 *           type: string
 *           description: Response message
 *           example: "Candidate import source retrieved successfully"
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IDataImportSource'
 *           description: Array of import sources (candidates can be imported from multiple sources)
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Response timestamp
 *       required:
 *         - success
 *         - message
 *         - data
 *         - timestamp
 */
export type ICandidateImportSourceApiResponse = IApiResponse<
  IDataImportSource[]
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IDataUsageStatisticsApiRequest:
 *       type: object
 *       description: API request to get data usage statistics across all integrations
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *       properties:
 *         params:
 *           type: object
 *           description: No parameters required for this endpoint
 *           additionalProperties: false
 *       required:
 *         - params
 */
export interface IDataUsageStatisticsApiRequest extends IApiRequest {
  params: Record<string, never>;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IDataUsageStatisticsApiResponse:
 *       type: object
 *       description: API response containing comprehensive data usage statistics
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the request was successful
 *           example: true
 *         message:
 *           type: string
 *           description: Response message
 *           example: "Data usage statistics retrieved successfully"
 *         data:
 *           $ref: '#/components/schemas/IDataUsageStatistics'
 *           description: Comprehensive statistics about data usage across integrations
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Response timestamp
 *       required:
 *         - success
 *         - message
 *         - data
 *         - timestamp
 */
export type IDataUsageStatisticsApiResponse =
  IApiResponse<IDataUsageStatistics>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IIntegrationDisconnectApiRequest:
 *       type: object
 *       description: API request to disconnect a specific integration
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *       properties:
 *         params:
 *           type: object
 *           properties:
 *             integrationId:
 *               type: string
 *               format: uuid
 *               description: Unique identifier of the integration to disconnect
 *               example: "123e4567-e89b-12d3-a456-426614174000"
 *           required:
 *             - integrationId
 *         data:
 *           $ref: '#/components/schemas/IIntegrationDisconnectRequest'
 *           description: Disconnect configuration options
 *       required:
 *         - params
 *         - data
 */
export interface IIntegrationDisconnectApiRequest extends IApiRequest {
  params: {
    integrationId: string;
  };
  data: IIntegrationDisconnectRequest;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IIntegrationDisconnectApiResponse:
 *       type: object
 *       description: API response from integration disconnect operation
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the request was successful
 *           example: true
 *         message:
 *           type: string
 *           description: Response message
 *           example: "Integration disconnected successfully"
 *         data:
 *           $ref: '#/components/schemas/IIntegrationDisconnectResponse'
 *           description: Result of the disconnect operation
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Response timestamp
 *       required:
 *         - success
 *         - message
 *         - data
 *         - timestamp
 */
export type IIntegrationDisconnectApiResponse =
  IApiResponse<IIntegrationDisconnectResponse>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IIntegrationBulkDisconnectApiRequest:
 *       type: object
 *       description: API request to disconnect multiple integrations at once
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *       properties:
 *         data:
 *           type: object
 *           properties:
 *             integrationIds:
 *               type: array
 *               items:
 *                 type: string
 *                 format: uuid
 *               description: Array of integration IDs to disconnect
 *               example: ["123e4567-e89b-12d3-a456-426614174000", "223e4567-e89b-12d3-a456-426614174000"]
 *               minItems: 1
 *               maxItems: 50
 *             disconnectOptions:
 *               $ref: '#/components/schemas/IIntegrationDisconnectRequest'
 *               description: Disconnect options to apply to all selected integrations
 *           required:
 *             - integrationIds
 *             - disconnectOptions
 *       required:
 *         - data
 */
export interface IIntegrationBulkDisconnectApiRequest extends IApiRequest {
  data: {
    integrationIds: string[];
    disconnectOptions: IIntegrationDisconnectRequest;
  };
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IIntegrationBulkDisconnectApiResponse:
 *       type: object
 *       description: API response from bulk integration disconnect operation
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the request was successful
 *           example: true
 *         message:
 *           type: string
 *           description: Response message
 *           example: "Bulk disconnect completed"
 *         data:
 *           type: object
 *           properties:
 *             results:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/IIntegrationDisconnectResponse'
 *               description: Individual results for each integration disconnect operation
 *             summary:
 *               type: object
 *               description: Summary statistics of the bulk operation
 *               properties:
 *                 total:
 *                   type: integer
 *                   minimum: 0
 *                   description: Total number of integrations processed
 *                   example: 5
 *                 successful:
 *                   type: integer
 *                   minimum: 0
 *                   description: Number of integrations successfully disconnected
 *                   example: 4
 *                 failed:
 *                   type: integer
 *                   minimum: 0
 *                   description: Number of integrations that failed to disconnect
 *                   example: 1
 *               required:
 *                 - total
 *                 - successful
 *                 - failed
 *           required:
 *             - results
 *             - summary
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Response timestamp
 *       required:
 *         - success
 *         - message
 *         - data
 *         - timestamp
 */
export type IIntegrationBulkDisconnectApiResponse = IApiResponse<{
  results: IIntegrationDisconnectResponse[];
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IIntegrationDisconnectPreviewApiRequest:
 *       type: object
 *       description: API request to preview what would be affected by disconnecting an integration
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *       properties:
 *         params:
 *           type: object
 *           properties:
 *             integrationId:
 *               type: string
 *               format: uuid
 *               description: Unique identifier of the integration to preview disconnect for
 *               example: "123e4567-e89b-12d3-a456-426614174000"
 *           required:
 *             - integrationId
 *       required:
 *         - params
 */
export interface IIntegrationDisconnectPreviewApiRequest extends IApiRequest {
  params: {
    integrationId: string;
  };
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IIntegrationDisconnectPreviewApiResponse:
 *       type: object
 *       description: API response containing preview of what would be affected by disconnect
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the request was successful
 *           example: true
 *         message:
 *           type: string
 *           description: Response message
 *           example: "Disconnect preview retrieved successfully"
 *         data:
 *           $ref: '#/components/schemas/IIntegrationDisconnectSummary'
 *           description: Preview summary of entities that would be affected
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Response timestamp
 *       required:
 *         - success
 *         - message
 *         - data
 *         - timestamp
 */
export type IIntegrationDisconnectPreviewApiResponse =
  IApiResponse<IIntegrationDisconnectSummary>;

/**
 * @openapi
 * components:
 *   parameters:
 *     IntegrationIdParam:
 *       in: path
 *       name: integrationId
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *         description: Unique identifier for the integration
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     JobIdParam:
 *       in: path
 *       name: jobId
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *         description: Unique identifier for the job posting
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     CandidateIdParam:
 *       in: path
 *       name: candidateId
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *         description: Unique identifier for the candidate
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 */
