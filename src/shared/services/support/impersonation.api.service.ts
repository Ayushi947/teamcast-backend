import { ApiService } from '../core/api.service';
import {
  IStartImpersonation,
  IStartImpersonationResponse,
  IStopImpersonation,
  IStopImpersonationResponse,
} from '../../models/domain/support/impersonation.domain';

/**
 * API endpoints for support impersonation operations
 */
const SUPPORT_IMPERSONATION_ENDPOINTS = {
  BASE: '/support/impersonation',
  START: '/support/impersonation/start',
  STOP: '/support/impersonation/stop',
} as const;

export class SupportImpersonationApiService extends ApiService {
  /**
   * Start impersonation
   */
  public async startImpersonation(
    data: IStartImpersonation
  ): Promise<IStartImpersonationResponse> {
    try {
      return await this.apiPost<IStartImpersonationResponse>(
        SUPPORT_IMPERSONATION_ENDPOINTS.START,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Stop impersonation
   */
  public async stopImpersonation(
    data: IStopImpersonation
  ): Promise<IStopImpersonationResponse> {
    try {
      return await this.apiPost<IStopImpersonationResponse>(
        SUPPORT_IMPERSONATION_ENDPOINTS.STOP,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
