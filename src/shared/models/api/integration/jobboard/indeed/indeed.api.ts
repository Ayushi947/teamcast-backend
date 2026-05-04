import {
  IIndeedCallbackParams,
  IIndeedJobPublishParams,
  IIndeedCandidateImportParams,
  IIndeedTokenResponse,
  IIndeedJobPublishResponse,
  IJobPostingPublish,
  ICandidateImport,
} from '../../../../domain/integration/jobboard/indeed/indeed.domain';
import {
  IApiRequest,
  IApiResponse,
  IPaginatedResponse,
  IApiPaginatedRequest,
} from '../../../common/common.api';

// Integration Initiation API Models
export type IIndeedInitiateApiRequest = IApiRequest<{
  integrationName?: string;
}>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IIndeedInitiateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 clientIntegrationId:
 *                   type: string
 *                   format: uuid
 *                   description: ID of the created client integration
 *                 authUrl:
 *                   type: string
 *                   description: OAuth authorization URL
 *                 state:
 *                   type: string
 *                   description: OAuth state parameter
 */
export type IIndeedInitiateApiResponse = IApiResponse<{
  clientIntegrationId: string;
  authUrl: string;
  state: string;
}>;

// OAuth API Models
export type IIndeedCallbackApiRequest = IApiRequest<
  void,
  {
    code: string;
    state: string;
    error?: string;
  },
  IIndeedCallbackParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IIndeedCallbackApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               oneOf:
 *                 - $ref: '#/components/schemas/IIndeedTokenResponse'
 *                 - type: object
 *                   properties:
 *                     clientIntegrationId:
 *                       type: string
 *                       format: uuid
 *                       description: ID of the activated client integration
 *                     tokens:
 *                       $ref: '#/components/schemas/IIndeedTokenResponse'
 */
export type IIndeedCallbackApiResponse = IApiResponse<
  | IIndeedTokenResponse
  | {
      clientIntegrationId: string;
      tokens: IIndeedTokenResponse;
    }
>;

// Job Publishing API Models
export type IIndeedJobPublishApiRequest = IApiRequest<
  IJobPostingPublish,
  void,
  IIndeedJobPublishParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IIndeedJobPublishApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IIndeedJobPublishResponse'
 */
export type IIndeedJobPublishApiResponse =
  IApiResponse<IIndeedJobPublishResponse>;

export type IIndeedJobUpdateApiRequest = IApiRequest<
  Partial<IJobPostingPublish>,
  void,
  IIndeedJobPublishParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IIndeedJobUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: boolean
 *               description: Whether the job was successfully updated
 */
export type IIndeedJobUpdateApiResponse = IApiResponse<boolean>;

export type IIndeedJobDeleteApiRequest = IApiRequest<
  void,
  void,
  IIndeedJobPublishParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IIndeedJobDeleteApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: boolean
 *               description: Whether the job was successfully deleted
 */
export type IIndeedJobDeleteApiResponse = IApiResponse<boolean>;

// Candidate Import API Models
export type IIndeedCandidateImportApiRequest = IApiRequest<
  void,
  void,
  IIndeedCandidateImportParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IIndeedCandidateImportApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 importedCount:
 *                   type: number
 *                   description: Number of candidates imported
 *                 duplicateCount:
 *                   type: number
 *                   description: Number of duplicate candidates skipped
 *                 errorCount:
 *                   type: number
 *                   description: Number of candidates that failed to import
 *                 candidates:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ICandidateImport'
 */
export type IIndeedCandidateImportApiResponse = IApiResponse<{
  importedCount: number;
  duplicateCount: number;
  errorCount: number;
  candidates: ICandidateImport[];
}>;

export type IIndeedCandidateListApiRequest = IApiPaginatedRequest<
  void,
  void,
  IIndeedCandidateImportParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IIndeedCandidateListApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPaginatedResponse'
 *               items:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/ICandidateImport'
 */
export type IIndeedCandidateListApiResponse = IApiResponse<
  IPaginatedResponse<ICandidateImport>
>;

// Sync API Models
export type IIndeedSyncJobsApiRequest = IApiRequest<
  void,
  void,
  { clientIntegrationId: string }
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IIndeedSyncJobsApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 syncedCount:
 *                   type: number
 *                   description: Number of jobs synced
 *                 errorCount:
 *                   type: number
 *                   description: Number of jobs that failed to sync
 *                 message:
 *                   type: string
 *                   description: Sync status message
 */
export type IIndeedSyncJobsApiResponse = IApiResponse<{
  syncedCount: number;
  errorCount: number;
  message: string;
}>;

export type IIndeedSyncCandidatesApiRequest = IApiRequest<
  void,
  void,
  { clientIntegrationId: string }
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IIndeedSyncCandidatesApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 syncedCount:
 *                   type: number
 *                   description: Number of candidates synced
 *                 errorCount:
 *                   type: number
 *                   description: Number of candidates that failed to sync
 *                 message:
 *                   type: string
 *                   description: Sync status message
 */
export type IIndeedSyncCandidatesApiResponse = IApiResponse<{
  syncedCount: number;
  errorCount: number;
  message: string;
}>;

// Token Management API Models
export type IIndeedRefreshTokenApiRequest = IApiRequest<
  void,
  void,
  { clientIntegrationId: string }
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IIndeedRefreshTokenApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IIndeedTokenResponse'
 */
export type IIndeedRefreshTokenApiResponse = IApiResponse<IIndeedTokenResponse>;

// Connection Test API Models
export type IIndeedTestConnectionApiRequest = IApiRequest<
  void,
  void,
  { clientIntegrationId: string }
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IIndeedTestConnectionApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Whether the connection test was successful
 *                 message:
 *                   type: string
 *                   description: Connection test result message
 */
export type IIndeedTestConnectionApiResponse = IApiResponse<{
  success: boolean;
  message: string;
}>;
