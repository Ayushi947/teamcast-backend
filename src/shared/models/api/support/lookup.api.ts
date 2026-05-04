import { IApiRequest, IApiResponse } from '../common/common.api';
import {
  ILookupCategoryCreate,
  ILookupValueCreate,
  ILookupCategoryIdParams,
  ILookupValueIdParams,
  ILookupCategoryMinimal,
  ILookupCountry,
  ILookupTimezone,
} from '../../domain/support/lookup.domain';
import { ILookupCategory, ILookupValue } from '../../common/enums';

// Lookup Category API Types
export type ILookupCategoryCreateApiRequest =
  IApiRequest<ILookupCategoryCreate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ILookupCategoryCreateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ILookupCategory'
 */
export type ILookupCategoryCreateApiResponse = IApiResponse<ILookupCategory>;

export type ILookupCategoryListApiRequest = IApiRequest<void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ILookupCategoryListApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ILookupCategory'
 *           description: For admin and support users, returns full lookup category data with all fields. For non-admin users, returns minimal data with only id, name, label and values fields.
 */
export type ILookupCategoryListApiResponse = IApiResponse<ILookupCategory[]>;

export type ILookupCategoryGetByIdApiRequest = IApiRequest<
  void,
  void,
  ILookupCategoryIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ILookupCategoryGetByIdApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ILookupCategory'
 */
export type ILookupCategoryGetByIdApiResponse = IApiResponse<ILookupCategory>;

export type ILookupCategoryDeleteApiRequest = IApiRequest<
  void,
  void,
  ILookupCategoryIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ILookupCategoryDeleteApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Lookup category deleted successfully"
 */
export type ILookupCategoryDeleteApiResponse = IApiResponse<void>;

// Lookup Value API Types
export type ILookupValueCreateApiRequest = IApiRequest<ILookupValueCreate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ILookupValueCreateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ILookupValue'
 */
export type ILookupValueCreateApiResponse = IApiResponse<ILookupValue>;

export type ILookupValueDeleteApiRequest = IApiRequest<
  void,
  void,
  ILookupValueIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ILookupValueDeleteApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Lookup value deleted successfully"
 */
export type ILookupValueDeleteApiResponse = IApiResponse<void>;

export type ILookupValuesByCategoriesApiRequest = IApiRequest<
  void,
  { categories: string }
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ILookupValuesByCategoriesApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 oneOf:
 *                   - $ref: '#/components/schemas/ILookupCategory'
 *                   - $ref: '#/components/schemas/ILookupCategoryMinimal'
 *           description: For admin and support users, returns full lookup category data with all fields. For non-admin users, returns minimal data with only id, name, label and values fields.
 */
export type ILookupValuesByCategoriesApiResponse = IApiResponse<
  ILookupCategory[] | ILookupCategoryMinimal[]
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICountryListApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ICountry'
 */
export type ISupportLookupCountryListApiResponse = IApiResponse<
  ILookupCountry[]
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ITimezoneListApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ITimezone'
 */
export type ITimezoneListApiResponse = IApiResponse<ILookupTimezone[]>;
