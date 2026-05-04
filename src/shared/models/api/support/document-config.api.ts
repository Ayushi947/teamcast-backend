import {
  CreateDocumentConfigRequest,
  IDocumentPreviewResponse,
  IDocumentVerificationRequest,
  ICountryWithDocuments,
  IDocumentConfig,
} from '../../domain/support/document.config.domain';
import { IApiRequest, IApiResponse } from '../common/common.api';

export type CreateDocumentConfigApiRequest =
  IApiRequest<CreateDocumentConfigRequest>;

export interface GetDocumentsByCountryRequest {
  countryName: string;
}

export type GetDocumentsByCountryApiRequest =
  IApiRequest<GetDocumentsByCountryRequest>;

/**
 * @openapi
 * components:
 *   schemas:
 *     GetDocumentsByCountryResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               doc_name:
 *                 type: string
 *               doc_type:
 *                 type: string
 *               is_required:
 *                 type: boolean
 *               countryId:
 *                 type: string
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *               updatedAt:
 *                 type: string
 *                 format: date-time
 *               country:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 */
export type GetDocumentsByCountryApiResponse = IApiResponse<IDocumentConfig[]>;

/**
 * @openapi
 * components:
 *   schemas:
 *     GetAllDocumentsConfigResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               name:
 *                 type: string
 *               documentConfigs:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     doc_name:
 *                       type: string
 *                     doc_type:
 *                       type: string
 *                     is_required:
 *                       type: boolean
 *               documentCount:
 *                 type: integer
 *               requiredDocumentCount:
 *                 type: integer
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *               updatedAt:
 *                 type: string
 *                 format: date-time
 */
export type GetAllDocumentsConfigApiResponse = IApiResponse<
  ICountryWithDocuments[]
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     DocumentVerificationApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/DocumentVerificationRequest'
 */
export type IDocumentVerificationApiRequest =
  IApiRequest<IDocumentVerificationRequest>;

/**
 * @openapi
 * components:
 *   schemas:
 *     DocumentVerificationApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 */
export type IDocumentVerificationApiResponse = IApiResponse<{
  success: boolean;
}>;

/**
 * @openapi
 * components:
 *   schemas:
 *     DocumentPreviewApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/DocumentPreviewResponse'
 */
export type DocumentPreviewApiResponse = IApiResponse<IDocumentPreviewResponse>;
