import { ApiService } from '../core/api.service';
import { singleton } from '../../decorators/singleton';
import {
  IJobPostingAssessment,
  IJobPostingAssessmentTask,
} from '../../models/domain/client/job.posting.assessment.domain';

/**
 * API endpoints for job posting assessment related operations
 */
const JOB_POSTING_ASSESSMENT_ENDPOINTS = {
  BASE: '/client/job-posting-assessments',
  START: '/client/job-posting-assessments/:jobPostingId/start',
  TASK_BY_JOB_POSTING: '/client/job-posting-assessments/:jobPostingId/task',
  TASK_BY_ID: '/client/job-posting-assessments/task/:taskId',
  LATEST: '/client/job-posting-assessments/:jobPostingId/latest',
  ALL: '/client/job-posting-assessments/:jobPostingId/all',
  BY_ID: '/client/job-posting-assessments/:assessmentId',
} as const;

/**
 * Service for handling job posting assessment related API operations
 */
@singleton
export class ClientJobPostingAssessmentApiService extends ApiService {
  /**
   * Starts a new job posting assessment task
   * @param jobPostingId - The ID of the job posting to assess
   * @returns Promise resolving to the assessment task
   * @throws Error if the API request fails
   */
  public async startAssessment(
    jobPostingId: string
  ): Promise<IJobPostingAssessmentTask> {
    try {
      return await this.apiPost<IJobPostingAssessmentTask>(
        JOB_POSTING_ASSESSMENT_ENDPOINTS.START.replace(
          ':jobPostingId',
          jobPostingId
        )
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gets the job posting assessment task status for a specific job posting
   * @param jobPostingId - The ID of the job posting
   * @returns Promise resolving to the task status
   * @throws Error if the API request fails
   */
  public async getAssessmentTaskForJobPosting(
    jobPostingId: string
  ): Promise<IJobPostingAssessmentTask> {
    try {
      return await this.apiGet<IJobPostingAssessmentTask>(
        JOB_POSTING_ASSESSMENT_ENDPOINTS.TASK_BY_JOB_POSTING.replace(
          ':jobPostingId',
          jobPostingId
        )
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gets the job posting assessment task status by task ID
   * @param taskId - The ID of the task to retrieve
   * @returns Promise resolving to the task status
   * @throws Error if the API request fails
   */
  public async getAssessmentTask(
    taskId: string
  ): Promise<IJobPostingAssessmentTask> {
    try {
      return await this.apiGet<IJobPostingAssessmentTask>(
        JOB_POSTING_ASSESSMENT_ENDPOINTS.TASK_BY_ID.replace(':taskId', taskId)
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gets the latest job posting assessment results
   * @param jobPostingId - The ID of the job posting
   * @returns Promise resolving to the latest assessment
   * @throws Error if the API request fails
   */
  public async getLatestAssessment(
    jobPostingId: string
  ): Promise<IJobPostingAssessment> {
    try {
      return await this.apiGet<IJobPostingAssessment>(
        JOB_POSTING_ASSESSMENT_ENDPOINTS.LATEST.replace(
          ':jobPostingId',
          jobPostingId
        )
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gets all job posting assessment results
   * @param jobPostingId - The ID of the job posting
   * @returns Promise resolving to an array of assessments
   * @throws Error if the API request fails
   */
  public async getAllAssessments(
    jobPostingId: string
  ): Promise<IJobPostingAssessment[]> {
    try {
      return await this.apiGet<IJobPostingAssessment[]>(
        JOB_POSTING_ASSESSMENT_ENDPOINTS.ALL.replace(
          ':jobPostingId',
          jobPostingId
        )
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gets a specific job posting assessment by ID
   * @param assessmentId - The ID of the assessment to retrieve
   * @returns Promise resolving to the assessment
   * @throws Error if the API request fails
   */
  public async getAssessment(
    assessmentId: string
  ): Promise<IJobPostingAssessment> {
    try {
      return await this.apiGet<IJobPostingAssessment>(
        JOB_POSTING_ASSESSMENT_ENDPOINTS.BY_ID.replace(
          ':assessmentId',
          assessmentId
        )
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
