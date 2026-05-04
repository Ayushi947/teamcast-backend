import {
  ICountry,
  IState,
  ICity,
  ILocationListResponse,
  ILocationNames,
} from '@/shared/models/domain/common/location.domain';
import {
  ICountryListApiRequest,
  IStateListApiRequest,
  ICityListApiRequest,
  ILocationNamesApiRequest,
} from '@/shared/models/api/common/location.api';
import { Country, State, City } from 'country-state-city';

export class LocationService {
  async getCountries(
    params: ICountryListApiRequest
  ): Promise<ILocationListResponse<ICountry>> {
    const { limit = 50, offset = 0, search } = params;

    let countries = Country.getAllCountries();

    if (search) {
      const searchLower = search.toLowerCase();
      countries = countries.filter(
        (country) =>
          country.name.toLowerCase().includes(searchLower) ||
          country.isoCode.toLowerCase().includes(searchLower)
      );
    }

    const total = countries.length;
    const items = countries.slice(offset, offset + limit).map((country) => ({
      id: country.isoCode,
      name: country.name,
      code: country.isoCode,
      phoneCode: country.phonecode,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    return {
      items,
      total,
      limit,
      offset,
    };
  }

  async getStates(
    params: IStateListApiRequest
  ): Promise<ILocationListResponse<IState>> {
    const { limit = 50, offset = 0, search, countryId } = params;

    let states = State.getAllStates();

    if (countryId) {
      states = states.filter((state) => state.countryCode === countryId);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      states = states.filter(
        (state) =>
          state.name.toLowerCase().includes(searchLower) ||
          state.isoCode.toLowerCase().includes(searchLower)
      );
    }

    const total = states.length;
    const items = states.slice(offset, offset + limit).map((state) => ({
      id: state.isoCode,
      name: state.name,
      countryId: state.countryCode,
      countryCode: state.countryCode,
      stateCode: state.isoCode,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    return {
      items,
      total,
      limit,
      offset,
    };
  }

  async getCities(
    params: ICityListApiRequest
  ): Promise<ILocationListResponse<ICity>> {
    const { limit = 50, offset = 0, search, stateId, countryId } = params;

    let cities = City.getAllCities();

    if (countryId) {
      cities = cities.filter((city) => city.countryCode === countryId);
    }

    if (stateId) {
      cities = cities.filter((city) => city.stateCode === stateId);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      cities = cities.filter((city) =>
        city.name.toLowerCase().includes(searchLower)
      );
    }

    const total = cities.length;
    const items = cities.slice(offset, offset + limit).map((city) => ({
      id: `${city.countryCode}-${city.stateCode}-${city.name}`,
      name: city.name,
      stateId: city.stateCode,
      countryId: city.countryCode,
      stateCode: city.stateCode,
      countryCode: city.countryCode,
      latitude: Number(city.latitude) || 0,
      longitude: Number(city.longitude) || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    return {
      items,
      total,
      limit,
      offset,
    };
  }

  async getAllLocationNames(
    params: ILocationNamesApiRequest = {}
  ): Promise<ILocationNames> {
    const { search, countryId, stateId } = params;
    const searchLower = search?.toLowerCase();

    // Get all countries for reference
    const countries = Country.getAllCountries();
    const countryMap = new Map(
      countries.map((country) => [country.isoCode, country.name])
    );

    // Get all states for reference
    const states = State.getAllStates();
    const stateMap = new Map(
      states.map((state) => [
        `${state.countryCode}-${state.isoCode}`,
        state.name,
      ])
    );

    // Get all cities
    let cities = City.getAllCities();

    // Apply filters
    if (countryId) {
      cities = cities.filter((city) => city.countryCode === countryId);
    }
    if (stateId) {
      cities = cities.filter((city) => city.stateCode === stateId);
    }
    if (searchLower) {
      cities = cities.filter(
        (city) =>
          city.name.toLowerCase().includes(searchLower) ||
          stateMap
            .get(`${city.countryCode}-${city.stateCode}`)
            ?.toLowerCase()
            .includes(searchLower) ||
          countryMap.get(city.countryCode)?.toLowerCase().includes(searchLower)
      );
    }

    // Create the combined location strings
    const locationStrings = cities.map((city) => {
      const stateName =
        stateMap.get(`${city.countryCode}-${city.stateCode}`) || '';
      const countryName = countryMap.get(city.countryCode) || '';
      return {
        id: `${city.countryCode}-${city.stateCode}-${city.name}`,
        name: `${city.name}, ${stateName}, ${countryName}`,
      };
    });

    // Sort alphabetically
    locationStrings.sort((a, b) => a.name.localeCompare(b.name));

    return {
      countries: [], // Empty as we're not using these anymore
      states: [], // Empty as we're not using these anymore
      cities: locationStrings,
    };
  }
}
