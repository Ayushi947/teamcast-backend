import { ApiService } from '../core/api.service';
import {
  IPartnerSignup,
  IPartnerSignupDone,
} from '../../models/domain/partner/signup.domain';
import { singleton } from '../../decorators/singleton';

/**
 * API endpoints for partner signup related operations
 */
const SIGNUP_ENDPOINTS = {
  BASE: '/partner/signup',
} as const;

@singleton
export class PartnerSignupApiService extends ApiService {
  /**
   * Sign up a new partner
   */
  public async signup(data: IPartnerSignup): Promise<IPartnerSignupDone> {
    try {
      return await this.apiPost<IPartnerSignupDone>(
        SIGNUP_ENDPOINTS.BASE,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
