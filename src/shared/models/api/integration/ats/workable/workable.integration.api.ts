import {
  IWorkableConnectionRequest,
  IWorkableConnectionResponse,
  IWorkableValidationResponse,
  IWorkableCandidateImportRequest,
  IWorkableCandidateImportResponse,
  IWorkableJobImportRequest,
  IWorkableJobImportResponse,
  IWorkableJobSelectionRequest,
  IWorkableIntegrationIdParams,
} from '../../../../domain/integration/ats/workable/workable.integration.domain';
import { IApiRequest, IApiResponse } from '../../../common/common.api';

// Connect Workable API Models
export type IWorkableConnectApiRequest =
  IApiRequest<IWorkableConnectionRequest>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IWorkableConnectApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IWorkableConnectionResponse'
 */
export type IWorkableConnectApiResponse =
  IApiResponse<IWorkableConnectionResponse>;

// Validate Connection API Models
export type IWorkableValidateApiRequest = IApiRequest<
  void,
  void,
  IWorkableIntegrationIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IWorkableValidateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IWorkableValidationResponse'
 */
export type IWorkableValidateApiResponse =
  IApiResponse<IWorkableValidationResponse>;

// Import Candidates API Models
export type IWorkableImportCandidatesApiRequest = IApiRequest<
  IWorkableCandidateImportRequest,
  void,
  IWorkableIntegrationIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IWorkableImportCandidatesApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IWorkableCandidateImportResponse'
 */
export type IWorkableImportCandidatesApiResponse =
  IApiResponse<IWorkableCandidateImportResponse>;

// Import Jobs API Models
export type IWorkableImportJobsApiRequest = IApiRequest<
  IWorkableJobImportRequest,
  void,
  IWorkableIntegrationIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IWorkableImportJobsApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IWorkableJobImportResponse'
 */
export type IWorkableImportJobsApiResponse =
  IApiResponse<IWorkableJobImportResponse>;

// Import Selected Jobs API Models
export type IWorkableImportSelectedJobsApiRequest = IApiRequest<
  IWorkableJobSelectionRequest,
  void,
  IWorkableIntegrationIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IWorkableImportSelectedJobsApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IWorkableJobImportResponse'
 */
export type IWorkableImportSelectedJobsApiResponse =
  IApiResponse<IWorkableJobImportResponse>;
