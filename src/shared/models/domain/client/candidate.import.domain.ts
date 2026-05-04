import { CandidateImportStatusEnum } from '../../common/enums';

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateImportBatch:
 *       type: object
 *       description: Domain model representing a candidate import batch
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the import batch
 *         jobPostingId:
 *           type: string
 *           format: uuid
 *           description: ID of the job posting
 *         uploadedBy:
 *           type: string
 *           format: uuid
 *           description: ID of the user who uploaded the file
 *         fileName:
 *           type: string
 *           description: Original file name
 *         fileSize:
 *           type: integer
 *           description: File size in bytes
 *         totalRecords:
 *           type: integer
 *           description: Total records in the file
 *         processedRecords:
 *           type: integer
 *           description: Successfully processed records
 *         updatedRecords:
 *           type: integer
 *           description: Updated existing candidates
 *         duplicateRecords:
 *           type: integer
 *           description: Duplicate records found
 *         failedRecords:
 *           type: integer
 *           description: Failed to process records
 *         status:
 *           $ref: '#/components/schemas/ImportBatchStatusEnum'
 *           description: Current status of the import batch
 *         startedAt:
 *           type: string
 *           format: date-time
 *           description: When the import started
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: When the import completed
 *         errorLog:
 *           type: string
 *           description: JSON string of errors
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the batch was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the batch was last updated
 */
export interface ICandidateImportBatch {
  id: string;
  jobPostingId: string;
  uploadedBy: string;
  fileName: string;
  fileSize: number;
  totalRecords: number;
  processedRecords: number;
  updatedRecords: number;
  duplicateRecords: number;
  failedRecords: number;
  status: CandidateImportStatusEnum;
  startedAt: Date;
  completedAt?: Date;
  errorLog?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateImportRecord:
 *       type: object
 *       description: Domain model representing a candidate import record
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the import record
 *         batchId:
 *           type: string
 *           format: uuid
 *           description: ID of the import batch
 *         rowNumber:
 *           type: integer
 *           description: Excel row number
 *         email:
 *           type: string
 *           format: email
 *           description: Candidate email
 *         name:
 *           type: string
 *           description: Candidate name
 *         phone:
 *           type: string
 *           description: Phone number
 *         jobTitle:
 *           type: string
 *           description: Job title
 *         location:
 *           type: string
 *           description: Location
 *         experience:
 *           type: integer
 *           description: Years of experience
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of skills
 *         education:
 *           type: string
 *           description: Education level
 *         gender:
 *           type: string
 *           description: Gender
 *         languages:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of languages
 *         status:
 *           $ref: '#/components/schemas/ImportRecordStatusEnum'
 *           description: Current status of the import record
 *         duplicateScore:
 *           type: number
 *           format: float
 *           description: Fuzzy match score (0-1)
 *         duplicateCandidateId:
 *           type: string
 *           format: uuid
 *           description: ID of duplicate candidate if found
 *         errorMessage:
 *           type: string
 *           description: Error message if processing failed
 *         uploadCount:
 *           type: integer
 *           description: Upload count for this client
 *         processedAt:
 *           type: string
 *           format: date-time
 *           description: When the record was processed
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the record was created
 */
export interface ICandidateImportRecord {
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
  status: CandidateImportStatusEnum;
  duplicateScore?: number;
  duplicateCandidateId?: string;
  errorMessage?: string;
  uploadCount: number;
  processedAt?: Date;
  createdAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateImportProgress:
 *       type: object
 *       description: Real-time import progress information
 *       properties:
 *         batchId:
 *           type: string
 *           format: uuid
 *           description: Import batch ID
 *         totalRecords:
 *           type: integer
 *           description: Total records to process
 *         processedRecords:
 *           type: integer
 *           description: Currently processed records
 *         successfulImports:
 *           type: integer
 *           description: Successfully imported records (new candidates)
 *         updatedRecords:
 *           type: integer
 *           description: Updated records (existing candidates)
 *         duplicateRecords:
 *           type: integer
 *           description: Duplicate records found
 *         failedRecords:
 *           type: integer
 *           description: Failed records count
 *         estimatedTimeRemaining:
 *           type: integer
 *           description: Estimated time remaining in seconds
 *         status:
 *           $ref: '#/components/schemas/ImportBatchStatusEnum'
 *           description: Current status
 */
export interface ICandidateImportProgress {
  batchId: string;
  totalRecords: number;
  processedRecords: number;
  successfulImports: number;
  updatedRecords: number;
  duplicateRecords: number;
  failedRecords: number;
  estimatedTimeRemaining: number;
  status: CandidateImportStatusEnum;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateImportStatistics:
 *       type: object
 *       description: Statistics for candidate imports
 *       properties:
 *         totalUploads:
 *           type: integer
 *           description: Total number of file uploads
 *         totalCandidates:
 *           type: integer
 *           description: Total number of candidates imported
 *         successfulImports:
 *           type: integer
 *           description: Successfully imported candidates
 *         invitedCandidates:
 *           type: integer
 *           description: Candidates who have been invited
 *         duplicateCandidates:
 *           type: integer
 *           description: Duplicate candidates found
 *         failedImports:
 *           type: integer
 *           description: Failed imports
 */
export interface ICandidateImportStatistics {
  totalUploads: number;
  totalCandidates: number;
  successfulImports: number;
  invitedCandidates: number;
  duplicateCandidates: number;
  failedImports: number;
}

/**
 * Interface for Excel row data (internal processing)
 */
export interface ICandidateImportRowData {
  rowNumber: number;
  email: string;
  name: string;
  phone?: string;
  jobTitle?: string;
  location?: string;
  experience?: number;
  skills: string; // Comma-separated string from Excel
  education?: string;
  gender?: string;
  languages: string; // Comma-separated string from Excel
}

/**
 * Interface for listing imported candidates with pagination
 */
export interface ICandidateImportListRequest {
  jobPostingId: string;
  clientId: string;
  limit?: number;
  offset?: number;
  status?: CandidateImportStatusEnum;
  includeDuplicates?: boolean;
}

/**
 * Interface for list response
 */
export interface ICandidateImportListResponse {
  items: ICandidateImportRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
