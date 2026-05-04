import { ApiService } from '../core/api.service';
import type {
  IJobPostingRecruiterAssignment,
  IJobPostingRecruiterAssignmentWithDetails,
  IJobPostingRecruiterAssignmentCreate,
  IJobPostingRecruiterAssignmentUpdate,
  IManualRecruiterAssignmentCreate,
} from '../../models/domain/support/job.posting.recruiter.assignment.domain';
import type {
  IJobPostingRecruiterAssignmentListApiResponse,
  IRecruiterListItem,
  IRecruiterJobPostingListItem,
} from '../../models/api/support/job.posting.recruiter.assignment.api';
import {
  IPaginatedResponse,
  IPaginationRequest,
} from '../../models/api/common/common.api';

/**
 * API endpoints for job posting recruiter assignment related operations
 */
const JOB_POSTING_RECRUITER_ASSIGNMENT_ENDPOINTS = {
  BASE: '/support/job-postings/recruiter-assignments',
  MANUAL: '/manual',
  JOB_POSTING: '/job-posting',
  REASSIGN: '/reassign',
  COMPLETE: '/complete',
  ACCOUNT_MANAGERS: '/account-managers',
  AVAILABLE_RECRUITERS: '/available-recruiters',
  RECRUITERS: '/recruiters',
  JOB_POSTINGS: '/job-postings',
} as const;

/**
 * Service for managing job posting recruiter assignments via API
 */
export class JobPostingRecruiterAssignmentApiService extends ApiService {
  /**
   * Create a new recruiter assignment
   */
  public async createAssignment(
    data: IJobPostingRecruiterAssignmentCreate
  ): Promise<IJobPostingRecruiterAssignment> {
    try {
      return await this.apiPost<IJobPostingRecruiterAssignment>(
        JOB_POSTING_RECRUITER_ASSIGNMENT_ENDPOINTS.BASE,
        { data }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get recruiter assignment for a specific job posting
   */
  public async getAssignmentForJobPosting(
    jobPostingId: string
  ): Promise<IJobPostingRecruiterAssignmentWithDetails | null> {
    try {
      return await this.apiGet<IJobPostingRecruiterAssignmentWithDetails | null>(
        `${JOB_POSTING_RECRUITER_ASSIGNMENT_ENDPOINTS.BASE}${JOB_POSTING_RECRUITER_ASSIGNMENT_ENDPOINTS.JOB_POSTING}/${jobPostingId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update a recruiter assignment
   */
  public async updateAssignment(
    assignmentId: string,
    data: IJobPostingRecruiterAssignmentUpdate
  ): Promise<IJobPostingRecruiterAssignment> {
    try {
      return await this.apiPatch<IJobPostingRecruiterAssignment>(
        `${JOB_POSTING_RECRUITER_ASSIGNMENT_ENDPOINTS.BASE}/${assignmentId}`,
        { data }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Reassign a recruiter to a different job posting
   */
  public async reassignRecruiter(
    assignmentId: string,
    newRecruiterId: string,
    reason?: string
  ): Promise<IJobPostingRecruiterAssignment> {
    try {
      return await this.apiPost<IJobPostingRecruiterAssignment>(
        `${JOB_POSTING_RECRUITER_ASSIGNMENT_ENDPOINTS.BASE}/${assignmentId}${JOB_POSTING_RECRUITER_ASSIGNMENT_ENDPOINTS.REASSIGN}`,
        {
          newRecruiterId,
          reason,
        }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Complete a recruiter assignment
   */
  public async completeAssignment(
    assignmentId: string,
    notes?: string
  ): Promise<IJobPostingRecruiterAssignment> {
    try {
      return await this.apiPost<IJobPostingRecruiterAssignment>(
        `${JOB_POSTING_RECRUITER_ASSIGNMENT_ENDPOINTS.BASE}/${assignmentId}${JOB_POSTING_RECRUITER_ASSIGNMENT_ENDPOINTS.COMPLETE}`,
        {
          data: {
            notes,
          },
        }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * List recruiter assignments with optional filtering
   */
  public async listAssignments(
    filters: {
      recruiterId?: string;
      status?: string;
    } & IPaginationRequest
  ): Promise<IJobPostingRecruiterAssignmentListApiResponse> {
    try {
      return await this.apiGet<IJobPostingRecruiterAssignmentListApiResponse>(
        `${JOB_POSTING_RECRUITER_ASSIGNMENT_ENDPOINTS.BASE}${this.buildQueryString(filters)}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get available recruiters for an account manager with pagination
   */
  public async getAvailableRecruitersForAccountManager(
    accountManagerId: string,
    pagination?: IPaginationRequest & {
      search?: string;
    }
  ): Promise<IPaginatedResponse<IRecruiterListItem>> {
    try {
      const queryParams = pagination ? this.buildQueryString(pagination) : '';
      return await this.apiGet<IPaginatedResponse<IRecruiterListItem>>(
        `${JOB_POSTING_RECRUITER_ASSIGNMENT_ENDPOINTS.BASE}${JOB_POSTING_RECRUITER_ASSIGNMENT_ENDPOINTS.ACCOUNT_MANAGERS}/${accountManagerId}${JOB_POSTING_RECRUITER_ASSIGNMENT_ENDPOINTS.AVAILABLE_RECRUITERS}${queryParams}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get job postings assigned to a specific recruiter with pagination
   */
  public async getJobPostingsForRecruiter(
    recruiterId: string,
    pagination?: IPaginationRequest & {
      search?: string;
      status?: string;
    }
  ): Promise<IPaginatedResponse<IRecruiterJobPostingListItem>> {
    try {
      const queryParams = pagination ? this.buildQueryString(pagination) : '';
      return await this.apiGet<
        IPaginatedResponse<IRecruiterJobPostingListItem>
      >(
        `${JOB_POSTING_RECRUITER_ASSIGNMENT_ENDPOINTS.BASE}${JOB_POSTING_RECRUITER_ASSIGNMENT_ENDPOINTS.RECRUITERS}/${recruiterId}${JOB_POSTING_RECRUITER_ASSIGNMENT_ENDPOINTS.JOB_POSTINGS}${queryParams}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get assignments for a specific recruiter
   */
  public async getAssignmentsForRecruiter(
    recruiterId: string,
    pagination?: IPaginationRequest
  ): Promise<IPaginatedResponse<IJobPostingRecruiterAssignmentWithDetails>> {
    try {
      const filters = {
        recruiterId,
        ...pagination,
      };
      return await this.listAssignments(filters);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Auto-assign a recruiter to a job posting (triggers the round-robin algorithm)
   */
  public async autoAssignRecruiterToJobPosting(
    jobPostingId: string,
    assignedBy?: string
  ): Promise<IJobPostingRecruiterAssignment> {
    try {
      return await this.createAssignment({
        jobPostingId,
        recruiterId: '', // Will be auto-assigned by the backend
        assignedBy,
        notes: 'Auto-assigned via round-robin algorithm',
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Manually assign a recruiter to a job posting
   */
  public async manuallyAssignRecruiter(
    data: IManualRecruiterAssignmentCreate
  ): Promise<IJobPostingRecruiterAssignment> {
    try {
      return await this.apiPost<IJobPostingRecruiterAssignment>(
        `${JOB_POSTING_RECRUITER_ASSIGNMENT_ENDPOINTS.BASE}${JOB_POSTING_RECRUITER_ASSIGNMENT_ENDPOINTS.MANUAL}`,
        { data }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get assignment statistics for an account manager
   */
  public async getAssignmentStats(
    accountManagerId: string,
    dateRange?: {
      startDate?: string;
      endDate?: string;
    }
  ): Promise<{
    totalAssignments: number;
    activeAssignments: number;
    completedAssignments: number;
    reassignedAssignments: number;
    recruitersCount: number;
  }> {
    try {
      const queryParams = dateRange ? this.buildQueryString(dateRange) : '';
      return await this.apiGet<{
        totalAssignments: number;
        activeAssignments: number;
        completedAssignments: number;
        reassignedAssignments: number;
        recruitersCount: number;
      }>(
        `${JOB_POSTING_RECRUITER_ASSIGNMENT_ENDPOINTS.BASE}${JOB_POSTING_RECRUITER_ASSIGNMENT_ENDPOINTS.ACCOUNT_MANAGERS}/${accountManagerId}/stats${queryParams}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
