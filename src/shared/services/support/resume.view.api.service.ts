import { ApiService } from '../core/api.service';
import { singleton } from '../../decorators/singleton';
import { IClientResumeViewApiResponse } from '../../models/api/client/resume.view.api';

const SUPPORT_RESUME_VIEW_ENDPOINTS = {
  VIEW: '/support/candidates/:candidateId/resume/view',
} as const;

@singleton
export class SupportResumeViewApiService extends ApiService {
  /**
   * Generate a pre-signed URL to view a candidate's resume as a support user.
   */
  public async viewResume(
    candidateId: string
  ): Promise<IClientResumeViewApiResponse> {
    try {
      return await this.apiGet<IClientResumeViewApiResponse>(
        SUPPORT_RESUME_VIEW_ENDPOINTS.VIEW.replace(':candidateId', candidateId)
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
