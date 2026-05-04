import { ApiService } from '../core/api.service';
import {
  ICandidateSignup,
  ICandidateSignupDone,
} from '../../models/domain/candidate/signup.domain';
import { singleton } from '../../decorators/singleton';

/**
 * API endpoints for candidate signup related operations
 */
const SIGNUP_ENDPOINTS = {
  BASE: '/candidate/signup',
} as const;

@singleton
export class CandidateSignupApiService extends ApiService {
  /**
   * Sign up a new candidate
   */
  public async signup(
    data: ICandidateSignup,
    inviteId?: string
  ): Promise<ICandidateSignupDone> {
    try {
      const url = inviteId
        ? `${SIGNUP_ENDPOINTS.BASE}?inviteId=${encodeURIComponent(inviteId)}`
        : SIGNUP_ENDPOINTS.BASE;

      return await this.apiPost<ICandidateSignupDone>(url, data);
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
