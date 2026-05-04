import { ApiService } from '../core/api.service';
import { singleton } from '../../decorators/singleton';
import {
  IResumeAssessment,
  IResumeAssessmentTask,
} from '../../models/domain/candidate/resume.assessment.domain';

/**
 * API endpoints for resume assessment related operations
 */
const RESUME_ASSESSMENT_ENDPOINTS = {
  BASE: '/candidate/resume/assessment',
  START: '/candidate/resume/assessment/start',
  TASK: '/candidate/resume/assessment/task',
  TASK_BY_ID: '/candidate/resume/assessment/task/:taskId',
  LATEST: '/candidate/resume/assessment/latest',
  ALL: '/candidate/resume/assessment/all',
  BY_ID: '/candidate/resume/assessment/:assessmentId',
  LATEST_BY_CANDIDATE_ID: '/candidate/resume/assessment/:candidateId/latest',
} as const;

/**
 * Service for handling resume assessment related API operations
 */
@singleton
export class CandidateResumeAssessmentApiService extends ApiService {
  /**
   * Starts a new resume assessment task
   * @returns Promise resolving to the assessment task
   * @throws Error if the API request fails
   */
  public async startAssessment(): Promise<IResumeAssessmentTask> {
    try {
      return await this.apiPost<IResumeAssessmentTask>(
        RESUME_ASSESSMENT_ENDPOINTS.START
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gets the resume assessment task status for the current candidate
   * @returns Promise resolving to the task status
   * @throws Error if the API request fails
   */
  public async getAssessmentTaskForCandidate(): Promise<IResumeAssessmentTask> {
    try {
      return await this.apiGet<IResumeAssessmentTask>(
        RESUME_ASSESSMENT_ENDPOINTS.TASK
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gets the resume assessment task status by task ID
   * @param taskId - The ID of the task to retrieve
   * @returns Promise resolving to the task status
   * @throws Error if the API request fails
   */
  public async getAssessmentTask(
    taskId: string
  ): Promise<IResumeAssessmentTask> {
    try {
      return await this.apiGet<IResumeAssessmentTask>(
        RESUME_ASSESSMENT_ENDPOINTS.TASK_BY_ID.replace(':taskId', taskId)
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gets the latest resume assessment results
   * @returns Promise resolving to the latest assessment
   * @throws Error if the API request fails
   */
  public async getLatestAssessment(): Promise<IResumeAssessment> {
    try {
      return await this.apiGet<IResumeAssessment>(
        RESUME_ASSESSMENT_ENDPOINTS.LATEST
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gets all resume assessment results
   * @returns Promise resolving to an array of assessments
   * @throws Error if the API request fails
   */
  public async getAllAssessments(): Promise<IResumeAssessment[]> {
    try {
      return await this.apiGet<IResumeAssessment[]>(
        RESUME_ASSESSMENT_ENDPOINTS.ALL
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gets a specific resume assessment by ID
   * @param assessmentId - The ID of the assessment to retrieve
   * @returns Promise resolving to the assessment
   * @throws Error if the API request fails
   */
  public async getAssessment(assessmentId: string): Promise<IResumeAssessment> {
    try {
      return await this.apiGet<IResumeAssessment>(
        RESUME_ASSESSMENT_ENDPOINTS.BY_ID.replace(':assessmentId', assessmentId)
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gets the latest resume assessment results for a candidate
   * @param candidateId - The ID of the candidate to retrieve
   * @returns Promise resolving to the latest assessment, or null if no assessment exists yet
   * @throws Error if the API request fails
   */

  public async getLatestAssessmentByCandidateId(
    candidateId: string
  ): Promise<IResumeAssessment | null> {
    try {
      return await this.apiGet<IResumeAssessment | null>(
        RESUME_ASSESSMENT_ENDPOINTS.LATEST_BY_CANDIDATE_ID.replace(
          ':candidateId',
          candidateId
        )
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
