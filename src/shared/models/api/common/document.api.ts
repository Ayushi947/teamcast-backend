import { IApiResponse } from './common.api';
import {
  IDocument,
  IDocumentListResponse,
  EntityType,
} from '../../domain/common/document.domain';

/**
 * @openapi
 * components:
 *   schemas:
 *     IDocumentUploadApiRequest:
 *       type: object
 *       required:
 *         - file
 *       properties:
 *         file:
 *           type: string
 *           format: binary
 *           description: Document file to upload
 *         name:
 *           type: string
 *           description: Optional custom display name for the document
 *         documentType:
 *           type: string
 *           description: Optional type/category of the document
 *           example: contract
 */
export interface IDocumentUploadApiRequest {
  file: File | Buffer;
  name?: string;
  documentType?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IDocumentUploadApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IDocument'
 */
export type IDocumentUploadApiResponse = IApiResponse<IDocument>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IDocumentListApiRequest:
 *       type: object
 *       properties:
 *         limit:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *           description: Maximum number of documents to return
 *         offset:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *           description: Number of documents to skip
 *         type:
 *           type: string
 *           description: Filter documents by type
 *         includeDownloadUrls:
 *           type: boolean
 *           default: false
 *           description: Whether to include pre-signed download URLs
 */
export interface IDocumentListApiRequest {
  limit?: number;
  offset?: number;
  type?: string;
  includeDownloadUrls?: boolean;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IDocumentListApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IDocumentListResponse'
 */
export type IDocumentListApiResponse = IApiResponse<IDocumentListResponse>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IDocumentDownloadApiResponse:
 *       description: Binary file response with appropriate headers
 *       type: string
 *       format: binary
 */
export interface IDocumentDownloadApiResponse {
  buffer: Buffer;
  document: IDocument;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IDocumentDeleteApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             message:
 *               type: string
 *               example: Document deleted successfully
 */
export type IDocumentDeleteApiResponse = IApiResponse<null>;

/**
 * Document API request parameters
 */
export interface IDocumentApiParams {
  entityType: EntityType;
  entityId: string;
  documentId?: string;
}

/**
 * Common document operation requests
 */
export interface IDocumentOperationRequest {
  entityType: EntityType;
  entityId: string;
  documentId: string;
}

/**
 * Document upload form data interface
 */
export interface IDocumentUploadFormData extends FormData {
  append(name: 'file', value: File | Blob, fileName?: string): void;
  append(name: 'documentType', value: string): void;
}
