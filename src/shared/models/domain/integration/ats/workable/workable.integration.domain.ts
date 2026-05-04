import { ICandidateProfile } from '../../../candidate/profile.domain';

/**
 * @openapi
 * components:
 *   schemas:
 *     IWorkableConnectionRequest:
 *       type: object
 *       required:
 *         - subdomain
 *         - apiKey
 *         - name
 *       properties:
 *         subdomain:
 *           type: string
 *           description: Workable subdomain (e.g., 'company' for company.workable.com)
 *           example: company
 *         apiKey:
 *           type: string
 *           description: Workable API key
 *           example: api_key_here
 *         name:
 *           type: string
 *           description: Name for this integration connection
 *           example: Company Workable Integration
 *         description:
 *           type: string
 *           description: Optional description for this integration
 *           example: Main Workable ATS integration for candidate import
 */
export interface IWorkableConnectionRequest {
  subdomain: string;
  apiKey: string;
  name: string;
  description?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IWorkableConnectionResponse:
 *       type: object
 *       properties:
 *         integrationId:
 *           type: string
 *           format: uuid
 *           description: ID of the created integration
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, ERROR]
 *           description: Status of the integration
 *         message:
 *           type: string
 *           description: Success or error message
 *         connectionTest:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *               description: Whether the connection test was successful
 *             message:
 *               type: string
 *               description: Details about the connection test
 */
export interface IWorkableConnectionResponse {
  integrationId: string;
  status: string;
  message: string;
  connectionTest: {
    success: boolean;
    message: string;
  };
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IWorkableValidationResponse:
 *       type: object
 *       properties:
 *         isValid:
 *           type: boolean
 *           description: Whether the connection is valid
 *         message:
 *           type: string
 *           description: Validation result message
 *         details:
 *           type: object
 *           properties:
 *             subdomain:
 *               type: string
 *               description: The subdomain being tested
 *             apiEndpoint:
 *               type: string
 *               description: The API endpoint being tested
 *             responseStatus:
 *               type: number
 *               description: HTTP response status from test
 */
export interface IWorkableValidationResponse {
  isValid: boolean;
  message: string;
  details?: {
    subdomain: string;
    apiEndpoint: string;
    responseStatus?: number;
  };
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IWorkableCandidateImportRequest:
 *       type: object
 *       properties:
 *         jobId:
 *           type: string
 *           description: Optional Workable job ID to filter candidates
 *           example: "12345"
 *         limit:
 *           type: number
 *           description: Maximum number of candidates to import (default 50, max 200)
 *           example: 50
 *           minimum: 1
 *           maximum: 200
 *         offset:
 *           type: number
 *           description: Offset for pagination (default 0)
 *           example: 0
 *           minimum: 0
 *         state:
 *           type: string
 *           description: Candidate state filter (active, hired, etc.)
 *           example: active
 */
export interface IWorkableCandidateImportRequest {
  limit?: number;
  offset?: number;
  state?: string;
  externalJobId?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IWorkableCandidateImportResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the import was successful
 *         message:
 *           type: string
 *           description: Import result message
 *         importedCount:
 *           type: number
 *           description: Number of candidates successfully imported
 *         skippedCount:
 *           type: number
 *           description: Number of candidates skipped (already exist)
 *         errorCount:
 *           type: number
 *           description: Number of candidates that failed to import
 *         candidates:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ICandidateProfile'
 *           description: List of imported candidates
 *         errors:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               candidateId:
 *                 type: string
 *                 description: External candidate ID from Workable
 *               error:
 *                 type: string
 *                 description: Error message
 *           description: List of import errors
 */
export interface IWorkableCandidateImportResponse {
  success: boolean;
  message: string;
  importedCount: number;
  skippedCount: number;
  errorCount: number;
  candidates: ICandidateProfile[];
  errors: Array<{
    candidateId: string;
    error: string;
  }>;
  taskId?: string;
  isAsync?: boolean;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IWorkableCredentials:
 *       type: object
 *       required:
 *         - subdomain
 *         - apiKey
 *       properties:
 *         subdomain:
 *           type: string
 *           description: Workable subdomain
 *         apiKey:
 *           type: string
 *           description: Workable API key
 */
export interface IWorkableCredentials {
  subdomain: string;
  apiKey: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IWorkableJobImportRequest:
 *       type: object
 *       properties:
 *         state:
 *           type: string
 *           description: Job state filter (draft, published, closed, archived)
 *           example: published
 *         limit:
 *           type: number
 *           description: Maximum number of jobs to import (default 50, max 200)
 *           example: 50
 *           minimum: 1
 *           maximum: 200
 *         offset:
 *           type: number
 *           description: Offset for pagination (default 0)
 *           example: 0
 *           minimum: 0
 *         sync:
 *           type: boolean
 *           description: Whether to automatically import jobs (true) or return them for manual selection (false)
 *           example: true
 *           default: true
 */
export interface IWorkableJobImportRequest {
  state?: string;
  limit?: number;
  offset?: number;
  sync?: boolean;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IWorkableJobImportResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the import was successful
 *         message:
 *           type: string
 *           description: Import result message
 *         importedCount:
 *           type: number
 *           description: Number of jobs successfully imported
 *         skippedCount:
 *           type: number
 *           description: Number of jobs skipped (already exist)
 *         errorCount:
 *           type: number
 *           description: Number of jobs that failed to import
 *         jobs:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IWorkableImportedJob'
 *           description: List of imported jobs (when sync=true) or empty array (when sync=false)
 *         availableJobs:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IWorkableAvailableJob'
 *           description: List of available jobs for manual selection (when sync=false)
 *         errors:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               jobId:
 *                 type: string
 *                 description: External job ID from Workable
 *               error:
 *                 type: string
 *                 description: Error message
 *           description: List of import errors
 */
export interface IWorkableJobImportResponse {
  success: boolean;
  message: string;
  importedCount: number;
  skippedCount: number;
  errorCount: number;
  jobs: IWorkableImportedJob[];
  availableJobs?: IWorkableAvailableJob[];
  errors: Array<{
    jobId: string;
    error: string;
  }>;
  taskId?: string;
  isAsync?: boolean;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IWorkableImportedJob:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Internal job posting ID
 *         title:
 *           type: string
 *           description: Job title
 *         externalJobId:
 *           type: string
 *           description: External job ID from Workable
 *         externalJobUrl:
 *           type: string
 *           description: URL to the job on Workable
 *         shortcode:
 *           type: string
 *           description: Workable job shortcode
 *         status:
 *           type: string
 *           description: Job posting status
 *         department:
 *           type: string
 *           description: Department
 *         location:
 *           type: string
 *           description: Job location
 *         isRemote:
 *           type: boolean
 *           description: Whether the job is remote
 *         employmentType:
 *           type: string
 *           description: Employment type (Full-time, Part-time, etc.)
 *         function:
 *           type: string
 *           description: Job function/category
 *         industry:
 *           type: string
 *           description: Industry
 *         numberOfOpenings:
 *           type: number
 *           description: Number of openings
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the job was created
 */
export interface IWorkableImportedJob {
  id: string;
  title: string;
  externalJobId: string;
  externalJobUrl?: string;
  shortcode?: string;
  status: string;
  department?: string;
  location?: string;
  isRemote: boolean;
  employmentType?: string;
  function?: string;
  industry?: string;
  numberOfOpenings: number;
  createdAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IWorkableAvailableJob:
 *       type: object
 *       properties:
 *         externalJobId:
 *           type: string
 *           description: External job ID from Workable
 *         shortcode:
 *           type: string
 *           description: Workable job shortcode
 *         title:
 *           type: string
 *           description: Job title
 *         department:
 *           type: string
 *           description: Department
 *         location:
 *           type: string
 *           description: Job location
 *         isRemote:
 *           type: boolean
 *           description: Whether the job is remote
 *         employmentType:
 *           type: string
 *           description: Employment type (Full-time, Part-time, etc.)
 *         function:
 *           type: string
 *           description: Job function/category
 *         industry:
 *           type: string
 *           description: Industry
 *         state:
 *           type: string
 *           description: Current job state in Workable
 *         numberOfOpenings:
 *           type: number
 *           description: Number of openings
 *         externalJobUrl:
 *           type: string
 *           description: URL to the job on Workable
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the job was created in Workable
 *         alreadyImported:
 *           type: boolean
 *           description: Whether this job is already imported
 */
export interface IWorkableAvailableJob {
  externalJobId: string;
  shortcode?: string;
  title: string;
  department?: string;
  location?: string;
  isRemote: boolean;
  employmentType?: string;
  function?: string;
  industry?: string;
  state: string;
  numberOfOpenings: number;
  externalJobUrl?: string;
  createdAt: Date;
  alreadyImported: boolean;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IWorkableJobSelectionRequest:
 *       type: object
 *       required:
 *         - selectedJobIds
 *       properties:
 *         selectedJobIds:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of external job IDs (shortcodes) to import
 *           example: ["job123", "job456"]
 */
export interface IWorkableJobSelectionRequest {
  selectedJobIds: string[];
}

// Parameter types for route handlers
export type IWorkableIntegrationIdParams = {
  integrationId: string;
};
