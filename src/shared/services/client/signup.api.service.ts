import { ApiService } from '../core/api.service';
import {
  IClientSignup,
  IClientSignupDone,
} from '../../models/domain/client/signup.domain';

/**
 * API endpoints for signup related operations
 */
const SIGNUP_ENDPOINTS = {
  BASE: '/client/signup',
} as const;

export class ClientSignupApiService extends ApiService {
  /**
   * Sign up a new client
   */
  public async signup(data: IClientSignup): Promise<IClientSignupDone> {
    try {
      return await this.apiPost<IClientSignupDone>(SIGNUP_ENDPOINTS.BASE, data);
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
