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
 *         name:
 *           type: string
 *           description: Name of the country
 *         code:
 *           type: string
 *           description: Two-letter country code (ISO 3166-1 alpha-2)
 *         phoneCode:
 *           type: string
 *           description: International phone code for the country
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the record was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the record was last updated
 */
export interface ICountry {
  id: string;
  name: string;
  code: string;
  phoneCode: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IState:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the state/province
 *         name:
 *           type: string
 *           description: Name of the state/province
 *         countryId:
 *           type: string
 *           description: ID of the country this state belongs to
 *         countryCode:
 *           type: string
 *           description: Two-letter country code
 *         stateCode:
 *           type: string
 *           description: State/province code
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the record was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the record was last updated
 */
export interface IState {
  id: string;
  name: string;
  countryId: string;
  countryCode: string;
  stateCode: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICity:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the city
 *         name:
 *           type: string
 *           description: Name of the city
 *         stateId:
 *           type: string
 *           description: ID of the state this city belongs to
 *         countryId:
 *           type: string
 *           description: ID of the country this city belongs to
 *         stateCode:
 *           type: string
 *           description: State/province code
 *         countryCode:
 *           type: string
 *           description: Two-letter country code
 *         latitude:
 *           type: number
 *           description: City's latitude coordinate
 *         longitude:
 *           type: number
 *           description: City's longitude coordinate
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the record was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the record was last updated
 */
export interface ICity {
  id: string;
  name: string;
  stateId: string;
  countryId: string;
  stateCode: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ILocationListResponse:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             description: List of location items (countries, states, or cities)
 *         total:
 *           type: number
 *           description: Total number of items available
 *         limit:
 *           type: number
 *           description: Maximum number of items per page
 *         offset:
 *           type: number
 *           description: Number of items skipped
 */
export interface ILocationListResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ILocationNames:
 *       type: object
 *       properties:
 *         countries:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: Country ID
 *               name:
 *                 type: string
 *                 description: Country name
 *         states:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: State ID
 *               name:
 *                 type: string
 *                 description: State name
 *         cities:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: City ID
 *               name:
 *                 type: string
 *                 description: City name
 */
export interface ILocationNames {
  countries: { id: string; name: string }[];
  states: { id: string; name: string }[];
  cities: { id: string; name: string }[];
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ILocationName:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Location ID
 *         name:
 *           type: string
 *           description: Location name
 */
export interface ILocationName {
  id: string;
  name: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ILocationResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the operation was successful
 *         data:
 *           $ref: '#/components/schemas/ILocationNames'
 */
export interface ILocationResponse {
  success: boolean;
  data: ILocationNames;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ILocationError:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the operation was successful
 *         message:
 *           type: string
 *           description: Error message
 */
export interface ILocationError {
  success: boolean;
  message: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICombinedLocation:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Location ID
 *         name:
 *           type: string
 *           description: Combined location name in format "City, State, Country"
 */
export interface ICombinedLocation {
  id: string;
  name: string; // Format: "City, State, Country"
}
