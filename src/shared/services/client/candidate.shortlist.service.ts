import { ApiService } from '../core/api.service';
import {
  IClientCandidateShortlistCreate,
  IClientCandidateShortlistUpdate,
  IClientCandidateShortlist,
  IClientCandidateShortlistWithCandidate,
  IClientCandidateShortlistQuery,
} from '../../models/domain/client/candidate.shortlist.domain';
import {
  IClientCandidateShortlistListData,
  IClientCandidateShortlistBulkUpdateData,
} from '../../models/api/client/candidate.shortlist.api';
import { singleton } from '../../decorators/singleton';

/**
 * API endpoints for candidate shortlist related operations
 */
const CANDIDATE_SHORTLIST_ENDPOINTS = {
  BASE: '/client/candidate-shortlists',
  STATS: '/client/candidate-shortlists/stats',
  BULK: '/client/candidate-shortlists/bulk',
  BY_ID: '/client/candidate-shortlists/:shortlistId',
} as const;

@singleton
export class ClientCandidateShortlistApiService extends ApiService {
  /**
   * Create a new candidate shortlist entry
   */
  public async createCandidateShortlist(
    data: IClientCandidateShortlistCreate
  ): Promise<IClientCandidateShortlist> {
    try {
      return await this.apiPost<IClientCandidateShortlist>(
        CANDIDATE_SHORTLIST_ENDPOINTS.BASE,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get list of shortlisted candidates with filtering and pagination
   */
  public async listCandidateShortlists(
    query?: IClientCandidateShortlistQuery
  ): Promise<IClientCandidateShortlistListData> {
    try {
      const queryString = query ? this.buildQueryString(query) : '';
      const url = `${CANDIDATE_SHORTLIST_ENDPOINTS.BASE}${queryString}`;

      return await this.apiGet<IClientCandidateShortlistListData>(url);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a single candidate shortlist entry by ID
   */
  public async getCandidateShortlist(
    shortlistId: string
  ): Promise<IClientCandidateShortlistWithCandidate> {
    try {
      const url = CANDIDATE_SHORTLIST_ENDPOINTS.BY_ID.replace(
        ':shortlistId',
        shortlistId
      );

      return await this.apiGet<IClientCandidateShortlistWithCandidate>(url);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update a candidate shortlist entry
   */
  public async updateCandidateShortlist(
    shortlistId: string,
    data: IClientCandidateShortlistUpdate
  ): Promise<IClientCandidateShortlist> {
    try {
      const url = CANDIDATE_SHORTLIST_ENDPOINTS.BY_ID.replace(
        ':shortlistId',
        shortlistId
      );

      return await this.apiPatch<IClientCandidateShortlist>(url, data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete a candidate shortlist entry
   */
  public async deleteCandidateShortlist(
    shortlistId: string
  ): Promise<{ success: boolean }> {
    try {
      const url = CANDIDATE_SHORTLIST_ENDPOINTS.BY_ID.replace(
        ':shortlistId',
        shortlistId
      );

      return await this.apiDelete<{ success: boolean }>(url);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Bulk update multiple candidate shortlist entries
   */
  public async bulkUpdateCandidateShortlists(
    data: IClientCandidateShortlistBulkUpdateData
  ): Promise<{ updatedCount: number; success: boolean }> {
    try {
      return await this.apiPut<{ updatedCount: number; success: boolean }>(
        CANDIDATE_SHORTLIST_ENDPOINTS.BULK,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get candidate shortlist statistics
   */
  public async getCandidateShortlistStats(): Promise<{
    totalShortlisted: number;
    byStatus: {
      SHORTLISTED: number;
      NOT_INTERESTED: number;
      REJECTED: number;
    };
    byJobPosting: {
      jobPostingId: string;
      title: string;
      count: number;
    }[];
    recentActivity: IClientCandidateShortlistWithCandidate[];
  }> {
    try {
      return await this.apiGet<{
        totalShortlisted: number;
        byStatus: {
          SHORTLISTED: number;
          NOT_INTERESTED: number;
          REJECTED: number;
        };
        byJobPosting: {
          jobPostingId: string;
          title: string;
          count: number;
        }[];
        recentActivity: IClientCandidateShortlistWithCandidate[];
      }>(CANDIDATE_SHORTLIST_ENDPOINTS.STATS);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Mark a shortlist entry as viewed
   */
  public async markAsViewed(
    shortlistId: string
  ): Promise<IClientCandidateShortlist> {
    try {
      const url = CANDIDATE_SHORTLIST_ENDPOINTS.BY_ID.replace(
        ':shortlistId',
        shortlistId
      );

      return await this.apiPatch<IClientCandidateShortlist>(url, {
        viewedAt: new Date(),
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
