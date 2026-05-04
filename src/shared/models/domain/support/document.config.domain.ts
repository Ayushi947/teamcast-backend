import { VerificationStatus } from '../../common/enums';

/**
 * @openapi
 * components:
 *     IDocumentConfig:
 *       type: object
 *       required:
 *         - name
 *         - required
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the document config
 *         name:
 *           type: string
 *           description: Name of the document
 *         type:
 *           type: string
 *           description: Type of the document (e.g., ID, ADDRESS, FINANCIAL)
 *         required:
 *           type: boolean
 *           description: Whether this document is mandatory
 *         countryId:
 *           type: string
 *           description: ID of the country this document belongs to
 *         country:
 *           $ref: '#/components/schemas/ICountry'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
export interface IDocumentConfig {
  id?: string;
  name: string;
  type?: string;
  required: boolean;
  countryId?: string;
  country?: IDocumentCountry;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICountry:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the country
 *         countryName:
 *           type: string
 *           description: Name of the country
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the record was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the record was last updated
 */
export interface IDocumentCountry {
  id: string;
  countryName: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICountryWithDocuments:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         countryName:
 *           type: string
 *         documentConfigs:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IDocumentConfig'
 *         documentCount:
 *           type: integer
 *           description: Number of documents configured for this country
 *         requiredDocumentCount:
 *           type: integer
 *           description: Number of required documents for this country
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
export interface ICountryWithDocuments extends IDocumentCountry {
  documentConfigs: IDocumentConfig[];
  documentCount: number;
  requiredDocumentCount: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     CreateDocumentConfigRequest:
 *       type: object
 *       required:
 *         - countryName
 *         - documentConfig
 *       properties:
 *         countryName:
 *           type: string
 *         documentConfig:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IDocumentConfig'
 */

export interface CreateDocumentConfigRequest {
  countryName: string;
  documentConfig: IDocumentConfig[];
}

// VerificationStatus enum is imported from common enums

/**
 * @openapi
 * components:
 *   schemas:
 *     IDocumentVerificationRequest:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           $ref: '#/components/schemas/VerificationStatus'
 *         remarks:
 *           type: string
 *           description: Optional comments about the verification
 */
export interface IDocumentVerificationRequest {
  status: VerificationStatus;
  remarks?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IDocumentPreviewResponse:
 *       type: object
 *       properties:
 *         previewUrl:
 *           type: string
 *           description: URL to preview the document
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: When the preview URL expires
 */
export interface IDocumentPreviewResponse {
  previewUrl: string;
  expiresAt?: string;
}
