import { ApiService } from '../core/api.service';
import { singleton } from '../../decorators/singleton';
import { IClientResumeViewApiResponse } from '../../models/api/client/resume.view.api';

const RESUME_VIEW_ENDPOINTS = {
  BASE: '/client/resume/view/:candidateId',
} as const;

@singleton
export class ClientResumeViewApiService extends ApiService {
  /**
   * View a candidate's resume
   * @param candidateId - The ID of the candidate
   * @returns The candidate's resume
   */
  public async viewResume(
    candidateId: string
  ): Promise<IClientResumeViewApiResponse> {
    try {
      return await this.apiGet<IClientResumeViewApiResponse>(
        RESUME_VIEW_ENDPOINTS.BASE.replace(':candidateId', candidateId)
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
