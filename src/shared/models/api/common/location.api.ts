import { IApiResponse } from './common.api';
import {
  ICountry,
  IState,
  ICity,
  ILocationListResponse,
  ILocationNames,
  ILocationResponse,
  ILocationError,
  ICombinedLocation,
} from '../../domain/common/location.domain';

/**
 * @openapi
 * components:
 *   schemas:
 *     ICountryListApiRequest:
 *       type: object
 *       properties:
 *         limit:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *           description: Maximum number of countries to return
 *         offset:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *           description: Number of countries to skip
 *         search:
 *           type: string
 *           description: Search term to filter countries
 */
export interface ICountryListApiRequest {
  limit?: number;
  offset?: number;
  search?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IStateListApiRequest:
 *       type: object
 *       properties:
 *         limit:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *           description: Maximum number of states to return
 *         offset:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *           description: Number of states to skip
 *         search:
 *           type: string
 *           description: Search term to filter states
 *         countryId:
 *           type: string
 *           description: Filter states by country ID
 */
export interface IStateListApiRequest {
  limit?: number;
  offset?: number;
  search?: string;
  countryId?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICityListApiRequest:
 *       type: object
 *       properties:
 *         limit:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *           description: Maximum number of cities to return
 *         offset:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *           description: Number of cities to skip
 *         search:
 *           type: string
 *           description: Search term to filter cities
 *         stateId:
 *           type: string
 *           description: Filter cities by state ID
 *         countryId:
 *           type: string
 *           description: Filter cities by country ID
 */
export interface ICityListApiRequest {
  limit?: number;
  offset?: number;
  search?: string;
  stateId?: string;
  countryId?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ILocationNamesApiRequest:
 *       type: object
 *       properties:
 *         search:
 *           type: string
 *           description: Search term to filter locations
 *         countryId:
 *           type: string
 *           description: Filter by country ID
 *         stateId:
 *           type: string
 *           description: Filter by state ID
 */
export interface ILocationNamesApiRequest {
  search?: string;
  countryId?: string;
  stateId?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ILocationNamesApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 locations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ICombinedLocation'
 */
export type ILocationNamesApiResponse = IApiResponse<{
  locations: ICombinedLocation[];
}>;

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
 *               $ref: '#/components/schemas/ILocationListResponse'
 */
export type ICountryListApiResponse = IApiResponse<
  ILocationListResponse<ICountry>
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IStateListApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ILocationListResponse'
 */
export type IStateListApiResponse = IApiResponse<ILocationListResponse<IState>>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICityListApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ILocationListResponse'
 */
export type ICityListApiResponse = IApiResponse<ILocationListResponse<ICity>>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ILocationListApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ILocationListResponse'
 */
export type ILocationListApiResponse = IApiResponse<
  ILocationListResponse<ILocationNames>
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ILocationApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ILocationResponse'
 */
export type ILocationApiResponse = IApiResponse<ILocationResponse>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ILocationErrorApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ILocationError'
 */
export type ILocationErrorApiResponse = IApiResponse<ILocationError>;
