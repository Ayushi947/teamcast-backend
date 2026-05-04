import {
  ISearchRequest,
  ISearchResponse,
  ITypeaheadRequest,
  ITypeaheadResponse,
} from '../../domain/search/search.domain';
import { IApiRequest, IApiResponse } from '../common/common.api';

export type ISearchApiRequest = IApiRequest<ISearchRequest>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISearchApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISearchResponse'
 */
export type ISearchApiResponse = IApiResponse<ISearchResponse>;

export type ITypeaheadApiRequest = IApiRequest<ITypeaheadRequest>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ITypeaheadApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ITypeaheadResponse'
 */
export type ITypeaheadApiResponse = IApiResponse<ITypeaheadResponse>;
