import { SupportInvitationImportStatusEnum } from '../../common/enums';

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportInvitationImportRowData:
 *       type: object
 *       description: Raw data extracted from Excel/CSV row for support invitation import
 *       properties:
 *         rowNumber:
 *           type: integer
 *           description: Row number in the Excel/CSV file
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the candidate
 *         name:
 *           type: string
 *           description: Full name of the candidate
 *         phone:
 *           type: string
 *           description: Phone number of the candidate (optional)
 *         jobTitle:
 *           type: string
 *           description: Current job title of the candidate (optional)
 *         location:
 *           type: string
 *           description: Location/city of the candidate (optional)
 *         experience:
 *           type: integer
 *           description: Years of experience (optional)
 *         skills:
 *           type: string
 *           description: Comma-separated skills from Excel (optional)
 *         education:
 *           type: string
 *           description: Highest education level (optional)
 *         gender:
 *           type: string
 *           description: Gender of the candidate (optional)
 *         languages:
 *           type: string
 *           description: Comma-separated languages known (optional)
 *       required:
 *         - rowNumber
 *         - email
 *         - name
 */
export interface ISupportInvitationImportRowData {
  rowNumber: number;
  email: string;
  name: string;
  phone?: string;
  jobTitle?: string;
  location?: string;
  experience?: number;
  skills?: string;
  education?: string;
  gender?: string;
  languages?: string;
  integrationProviderId?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportInvitationImportRecord:
 *       type: object
 *       description: Processed support invitation import record with status and metadata
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the import record
 *         batchId:
 *           type: string
 *           format: uuid
 *           description: Batch ID grouping invitations from the same import
 *         rowNumber:
 *           type: integer
 *           description: Original row number in the Excel/CSV file
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the candidate
 *         name:
 *           type: string
 *           description: Full name of the candidate
 *         phone:
 *           type: string
 *           description: Phone number of the candidate (optional)
 *         jobTitle:
 *           type: string
 *           description: Current job title of the candidate (optional)
 *         location:
 *           type: string
 *           description: Location/city of the candidate (optional)
 *         experience:
 *           type: integer
 *           description: Years of experience (optional)
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of skills parsed from comma-separated string
 *         education:
 *           type: string
 *           description: Highest education level (optional)
 *         gender:
 *           type: string
 *           description: Gender of the candidate (optional)
 *         languages:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of languages parsed from comma-separated string
 *         status:
 *           $ref: '#/components/schemas/SupportInvitationImportStatusEnum'
 *           description: Current processing status of the import record
 *         duplicateScore:
 *           type: number
 *           format: float
 *           minimum: 0.0
 *           maximum: 1.0
 *           description: Fuzzy match score for duplicate detection (0.0-1.0)
 *         duplicateRecordId:
 *           type: string
 *           format: uuid
 *           description: Reference to original invitation import ID if duplicate
 *         errorMessage:
 *           type: string
 *           description: Error message if processing failed
 *         uploadCount:
 *           type: integer
 *           description: Number of times this support user has uploaded files
 *         processedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the record was processed
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the record was created
 *       required:
 *         - id
 *         - batchId
 *         - rowNumber
 *         - email
 *         - name
 *         - skills
 *         - languages
 *         - status
 *         - uploadCount
 *         - processedAt
 *         - createdAt
 */
export interface ISupportInvitationImportRecord {
  id: string;
  batchId: string;
  rowNumber: number;
  email: string;
  name: string;
  phone?: string;
  jobTitle?: string;
  location?: string;
  experience?: number;
  skills: string[];
  education?: string;
  gender?: string;
  languages: string[];
  status: SupportInvitationImportStatusEnum;
  duplicateScore?: number;
  duplicateRecordId?: string;
  errorMessage?: string;
  uploadCount: number;
  processedAt: Date;
  createdAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportInvitationImportProgress:
 *       type: object
 *       description: Progress tracking information for support invitation import batch
 *       properties:
 *         batchId:
 *           type: string
 *           format: uuid
 *           description: Unique batch identifier for the import
 *         totalRecords:
 *           type: integer
 *           description: Total number of records in the import batch
 *         processedRecords:
 *           type: integer
 *           description: Number of records that have been processed
 *         successfulImports:
 *           type: integer
 *           description: Number of records successfully imported
 *         updatedRecords:
 *           type: integer
 *           description: Number of records that were updated (existing records)
 *         duplicateRecords:
 *           type: integer
 *           description: Number of duplicate records detected
 *         failedRecords:
 *           type: integer
 *           description: Number of records that failed to process
 *         estimatedTimeRemaining:
 *           type: integer
 *           description: Estimated time remaining in seconds
 *         status:
 *           $ref: '#/components/schemas/SupportInvitationImportStatusEnum'
 *           description: Current status of the import batch
 *       required:
 *         - batchId
 *         - totalRecords
 *         - processedRecords
 *         - successfulImports
 *         - updatedRecords
 *         - duplicateRecords
 *         - failedRecords
 *         - estimatedTimeRemaining
 *         - status
 */
export interface ISupportInvitationImportProgress {
  batchId: string;
  totalRecords: number;
  processedRecords: number;
  successfulImports: number;
  updatedRecords: number;
  duplicateRecords: number;
  failedRecords: number;
  estimatedTimeRemaining: number;
  status: SupportInvitationImportStatusEnum;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportInvitationImportStatistics:
 *       type: object
 *       description: Statistical overview of support invitation imports for a support user
 *       properties:
 *         totalUploads:
 *           type: integer
 *           description: Total number of file uploads by the support user
 *         totalInvitations:
 *           type: integer
 *           description: Total number of invitation records across all uploads
 *         successfulImports:
 *           type: integer
 *           description: Number of successfully imported records
 *         invitedCandidates:
 *           type: integer
 *           description: Number of candidates who have been invited
 *         duplicateCandidates:
 *           type: integer
 *           description: Number of duplicate candidates detected
 *         failedImports:
 *           type: integer
 *           description: Number of failed import records
 *         failureReasons:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: The error reason
 *               count:
 *                 type: integer
 *                 description: Number of records with this error
 *               examples:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Example emails with this error
 *       required:
 *         - totalUploads
 *         - totalInvitations
 *         - successfulImports
 *         - invitedCandidates
 *         - duplicateCandidates
 *         - failedImports
 */
export interface ISupportInvitationImportStatistics {
  totalUploads: number;
  totalInvitations: number;
  successfulImports: number;
  invitedCandidates: number;
  duplicateCandidates: number;
  failedImports: number;
  failureReasons?: Array<{
    reason: string;
    count: number;
    examples: string[];
  }>;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportInvitationImportPerUploadStatistics:
 *       type: object
 *       description: Statistics for a specific upload/batch
 *       properties:
 *         batchId:
 *           type: string
 *           format: uuid
 *           description: Unique batch identifier
 *         fileName:
 *           type: string
 *           description: Original file name
 *         uploadDate:
 *           type: string
 *           format: date-time
 *           description: Date when the file was uploaded
 *         totalRecords:
 *           type: integer
 *           description: Total number of records in this upload
 *         successfulImports:
 *           type: integer
 *           description: Number of successfully imported records
 *         failedRecords:
 *           type: integer
 *           description: Number of failed records
 *         duplicateRecords:
 *           type: integer
 *           description: Number of duplicate records
 *         invitedRecords:
 *           type: integer
 *           description: Number of records that were invited
 *         acceptedRecords:
 *           type: integer
 *           description: Number of records that were accepted
 *         failureReasons:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: The error reason
 *               count:
 *                 type: integer
 *                 description: Number of records with this error
 *               examples:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Example emails with this error
 *       required:
 *         - batchId
 *         - fileName
 *         - uploadDate
 *         - totalRecords
 *         - successfulImports
 *         - failedRecords
 *         - duplicateRecords
 *         - invitedRecords
 *         - acceptedRecords
 */
export interface ISupportInvitationImportPerUploadStatistics {
  batchId: string;
  fileName: string;
  uploadDate: Date;
  totalRecords: number;
  successfulImports: number;
  failedRecords: number;
  duplicateRecords: number;
  invitedRecords: number;
  acceptedRecords: number;
  failureReasons?: Array<{
    reason: string;
    count: number;
    examples: string[];
  }>;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportInvitationImportFilterQuery:
 *       type: object
 *       description: Filter query parameters for support invitation import records
 *       properties:
 *         email:
 *           type: string
 *           description: Filter by email address
 *         name:
 *           type: string
 *           description: Filter by candidate name
 *         jobTitle:
 *           type: string
 *           description: Filter by job title
 *         status:
 *           $ref: '#/components/schemas/SupportInvitationImportStatusEnum'
 *           description: Filter by import status
 *         startDate:
 *           type: string
 *           format: date
 *           description: Filter records created after this date
 *         endDate:
 *           type: string
 *           format: date
 *           description: Filter records created before this date
 *         search:
 *           type: string
 *           description: General search term across multiple fields
 */
export interface ISupportInvitationImportFilterQuery {
  email?: string;
  name?: string;
  jobTitle?: string;
  status?: SupportInvitationImportStatusEnum;
  startDate?: string;
  endDate?: string;
  search?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportInvitationImportListResponse:
 *       type: object
 *       description: Paginated response for support invitation import records
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ISupportInvitationImportRecord'
 *           description: Array of support invitation import records
 *         pagination:
 *           type: object
 *           description: Pagination information
 *           properties:
 *             total:
 *               type: integer
 *               description: Total number of records matching the filter
 *             page:
 *               type: integer
 *               description: Current page number
 *             limit:
 *               type: integer
 *               description: Number of records per page
 *             totalPages:
 *               type: integer
 *               description: Total number of pages
 *           required:
 *             - total
 *             - page
 *             - limit
 *             - totalPages
 *       required:
 *         - items
 *         - pagination
 */
export interface ISupportInvitationImportListResponse {
  items: ISupportInvitationImportRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
