import { DocumentTypeEnum } from '../../common/enums';
/**
 * @openapi
 * components:
 *   schemas:
 *     EntityType:
 *       type: string
 *       enum: [partner, client, candidate, support]
 *       description: The type of entity that owns the document
 */
export enum EntityType {
  PARTNER = 'partner',
  CLIENT = 'client',
  CANDIDATE = 'candidate',
  SUPPORT = 'support',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IDocumentUploadRequest:
 *       type: object
 *       required:
 *         - fileName
 *         - fileType
 *         - fileSize
 *         - documentType
 *       properties:
 *         fileName:
 *           type: string
 *           description: Original name of the file
 *         name:
 *           type: string
 *           description: Custom display name for the document (optional)
 *         fileType:
 *           type: string
 *           description: MIME type of the file (e.g., application/pdf)
 *         fileSize:
 *           type: number
 *           description: Size of the file in bytes
 *         documentType:
 *           type: string
 *           enum: DocumentTypeEnum
 *           description: Category/type of document from predefined list
 */
export interface IDocumentUploadRequest {
  fileName: string;
  name?: string;
  fileType: string;
  fileSize: number;
  documentType: DocumentTypeEnum;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IDocumentUploadUrlResponse:
 *       type: object
 *       properties:
 *         uploadUrl:
 *           type: string
 *           description: Pre-signed URL for uploading the document
 *         documentId:
 *           type: string
 *           description: Unique document ID for tracking
 *         filePath:
 *           type: string
 *           description: Storage path where the file will be stored
 */
export interface IDocumentUploadUrlResponse {
  uploadUrl: string;
  documentId: string;
  filePath: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IDocumentConfirmUpload:
 *       type: object
 *       required:
 *         - documentId
 *       properties:
 *         documentId:
 *           type: string
 *           description: Document ID returned from upload URL generation
 */
export interface IDocumentConfirmUpload {
  documentId: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IDocument:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Document ID
 *         name:
 *           type: string
 *           description: Document name/title
 *         originalFileName:
 *           type: string
 *           description: Original file name
 *         type:
 *           type: string
 *           description: Document type/category
 *         mimeType:
 *           type: string
 *           description: MIME type of the file
 *         size:
 *           type: number
 *           description: File size in bytes
 *         url:
 *           type: string
 *           description: Document download URL
 *         uploadedBy:
 *           type: string
 *           description: User ID who uploaded the document
 *         uploadedAt:
 *           type: string
 *           format: date-time
 *           description: Upload timestamp
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
export interface IDocument {
  id: string;
  name: string;
  originalFileName: string;
  type: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IDocumentListResponse:
 *       type: object
 *       properties:
 *         documents:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IDocument'
 *         total:
 *           type: number
 *           description: Total number of documents
 */
export interface IDocumentListResponse {
  documents: IDocument[];
  total: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IDocumentDownloadResponse:
 *       type: object
 *       properties:
 *         downloadUrl:
 *           type: string
 *           description: Pre-signed URL for downloading the document
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: When the download URL expires
 */
export interface IDocumentDownloadResponse {
  downloadUrl: string;
  expiresAt: Date;
}
