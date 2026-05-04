import { ApiService } from '../core/api.service';
import type {
  ICountry,
  IState,
  ICity,
  ILocationListResponse,
  ICombinedLocation,
} from '../../models/domain/common/location.domain';
import type {
  ICountryListApiRequest,
  IStateListApiRequest,
  ICityListApiRequest,
  ILocationNamesApiRequest,
} from '../../models/api/common/location.api';
import { singleton } from '../../decorators/singleton';

/**
 * API endpoints for location related operations
 */
const LOCATION_ENDPOINTS = {
  COUNTRIES: '/common/locations/countries',
  STATES: '/common/locations/states',
  CITIES: '/common/locations/cities',
  LOCATIONS: '/common/locations',
  LOCATION_NAMES: '/common/locations/names',
} as const;

@singleton
export class LocationApiService extends ApiService {
  /**
   * Get list of countries
   * @param params Optional parameters for filtering and pagination
   */
  public async getCountries(
    params?: ICountryListApiRequest
  ): Promise<ILocationListResponse<ICountry>> {
    try {
      return await this.apiGet<ILocationListResponse<ICountry>>(
        `${LOCATION_ENDPOINTS.COUNTRIES}${this.buildQueryString(params)}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get list of states
   * @param params Optional parameters for filtering and pagination
   */
  public async getStates(
    params?: IStateListApiRequest
  ): Promise<ILocationListResponse<IState>> {
    try {
      return await this.apiGet<ILocationListResponse<IState>>(
        `${LOCATION_ENDPOINTS.STATES}${this.buildQueryString(params)}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get list of cities
   * @param params Optional parameters for filtering and pagination
   */
  public async getCities(
    params?: ICityListApiRequest
  ): Promise<ILocationListResponse<ICity>> {
    try {
      return await this.apiGet<ILocationListResponse<ICity>>(
        `${LOCATION_ENDPOINTS.CITIES}${this.buildQueryString(params)}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get combined location names
   * @param params Optional parameters for filtering
   * @returns Promise resolving to array of combined locations (City, State, Country)
   */
  public async getLocationNames(
    params?: ILocationNamesApiRequest
  ): Promise<ILocationListResponse<ICombinedLocation>> {
    try {
      return await this.apiGet<ILocationListResponse<ICombinedLocation>>(
        `${LOCATION_ENDPOINTS.LOCATION_NAMES}${this.buildQueryString(params)}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a specific country by ID
   * @param countryId The ID of the country to fetch
   */
  public async getCountry(countryId: string): Promise<ICountry> {
    try {
      return await this.apiGet<ICountry>(
        `${LOCATION_ENDPOINTS.COUNTRIES}/${countryId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a specific state by ID
   * @param stateId The ID of the state to fetch
   */
  public async getState(stateId: string): Promise<IState> {
    try {
      return await this.apiGet<IState>(
        `${LOCATION_ENDPOINTS.STATES}/${stateId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a specific city by ID
   * @param cityId The ID of the city to fetch
   */
  public async getCity(cityId: string): Promise<ICity> {
    try {
      return await this.apiGet<ICity>(`${LOCATION_ENDPOINTS.CITIES}/${cityId}`);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get states for a specific country
   * @param countryId The ID of the country to get states for
   * @param params Optional parameters for filtering and pagination
   */
  public async getStatesByCountry(
    countryId: string,
    params?: Omit<IStateListApiRequest, 'countryId'>
  ): Promise<ILocationListResponse<IState>> {
    try {
      return await this.apiGet<ILocationListResponse<IState>>(
        `${LOCATION_ENDPOINTS.COUNTRIES}/${countryId}/states${this.buildQueryString(params)}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get cities for a specific state
   * @param stateId The ID of the state to get cities for
   * @param params Optional parameters for filtering and pagination
   */
  public async getCitiesByState(
    stateId: string,
    params?: Omit<ICityListApiRequest, 'stateId'>
  ): Promise<ILocationListResponse<ICity>> {
    try {
      return await this.apiGet<ILocationListResponse<ICity>>(
        `${LOCATION_ENDPOINTS.STATES}/${stateId}/cities${this.buildQueryString(params)}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get cities for a specific country
   * @param countryId The ID of the country to get cities for
   * @param params Optional parameters for filtering and pagination
   */
  public async getCitiesByCountry(
    countryId: string,
    params?: Omit<ICityListApiRequest, 'countryId'>
  ): Promise<ILocationListResponse<ICity>> {
    try {
      return await this.apiGet<ILocationListResponse<ICity>>(
        `${LOCATION_ENDPOINTS.COUNTRIES}/${countryId}/cities${this.buildQueryString(params)}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
