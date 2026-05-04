import { ISupportPartner } from '../../domain/support/partners.domain';
import {
  IApiRequest,
  IApiResponse,
  IApiPaginatedRequest,
  IPaginatedResponse,
} from '../common/common.api';
import {
  ISupportPartnerUpdate,
  ISupportPartnerFilterQueryCompanyId,
  ISupportPartnerIdParams,
  ISupportPartnerListResponse,
} from '../../domain/support/partners.domain';

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportPartnerListResponse:
 *       type: object
 *       description: Response model for partner list items
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the partner
 *         companyName:
 *           type: string
 *           description: Name of the associated company
 *         email:
 *           type: string
 *           format: email
 *           description: Contact email of the associated company
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the partner was created
 *         candidateCount:
 *           type: number
 *           description: Number of candidates associated with the partner
 *         userCount:
 *           type: number
 *           description: Number of users associated with the partner
 */

export type ISupportPartnerUpdateApiRequest = IApiRequest<
  ISupportPartnerUpdate,
  void,
  ISupportPartnerIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportPartnerUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISupportPartner'
 */
export type ISupportPartnerUpdateApiResponse = IApiResponse<ISupportPartner>;

export type ISupportPartnerGetApiRequest = IApiRequest<
  void,
  void,
  ISupportPartnerIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportPartnerGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISupportPartner'
 */
export type ISupportPartnerGetApiResponse = IApiResponse<ISupportPartner>;

export type ISupportPartnerDeleteApiRequest = IApiRequest<
  void,
  void,
  ISupportPartnerIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportPartnerDeleteApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: boolean
 */
export type ISupportPartnerDeleteApiResponse = IApiResponse<boolean>;

export type ISupportPartnerListApiRequest = IApiPaginatedRequest<
  void,
  ISupportPartnerFilterQueryCompanyId,
  void
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportPartnerListApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPaginatedResponse'
 */
export type ISupportPartnerListApiResponse =
  IPaginatedResponse<ISupportPartnerListResponse>;
