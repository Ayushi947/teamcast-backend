import { ApiService } from '../core/api.service';
import { singleton } from '../../decorators/singleton';
import {
  IJobParsed,
  IJobParsingTask,
} from '../../models/domain/client/job.parsing.domain';
import { IJobPublicParsingTask } from '../../models/domain/client/job.public.parsing.domain';

/**
 * API endpoints for job parsing related operations
 */
const JOB_PARSING_ENDPOINTS = {
  BASE: '/client/job-parsing',
  UPLOAD: '/client/job-parsing/:jobPostingId/upload',
  PUBLIC_UPLOAD: '/client/job-parsing/public/upload',
  PUBLIC_TASK: '/client/job-parsing/public/:taskId',
  PUBLIC_PARSED_JOB: '/client/job-parsing/public/:taskId/job',
  TASK_FOR_JOB_POSTING: '/client/job-parsing/:jobPostingId/task',
  TASK_BY_ID: '/client/job-parsing/task/:taskId',
  PARSED_JOB: '/client/job-parsing/task/:taskId/job',
} as const;

/**
 * Service for handling job parsing related API operations
 */
@singleton
export class ClientJobParsingApiService extends ApiService {
  /**
   * Uploads a job description file for parsing
   * @param jobPostingId - The ID of the job posting
   * @param file - The job description file to upload
   * @param mode - The parsing mode to use (STRICT, INFERRED, GENERATIVE)
   * @returns Promise resolving to the upload response
   * @throws Error if the API request fails
   */
  public async uploadJobDescription(
    jobPostingId: string,
    file: File,
    mode: 'STRICT' | 'INFERRED' | 'GENERATIVE' = 'INFERRED'
  ): Promise<IJobParsingTask> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      return await this.apiPost<IJobParsingTask>(
        `${JOB_PARSING_ENDPOINTS.UPLOAD.replace(':jobPostingId', jobPostingId)}?mode=${mode}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gets the job parsing task status for a specific job posting
   * @param jobPostingId - The ID of the job posting
   * @returns Promise resolving to the task status
   * @throws Error if the API request fails
   */
  public async getParsingTaskForJobPosting(
    jobPostingId: string
  ): Promise<IJobParsingTask> {
    try {
      return await this.apiGet<IJobParsingTask>(
        JOB_PARSING_ENDPOINTS.TASK_FOR_JOB_POSTING.replace(
          ':jobPostingId',
          jobPostingId
        )
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gets the job parsing task status by task ID
   * @param taskId - The ID of the task to retrieve
   * @returns Promise resolving to the task status
   * @throws Error if the API request fails
   */
  public async getParsingTask(taskId: string): Promise<IJobParsingTask> {
    try {
      return await this.apiGet<IJobParsingTask>(
        JOB_PARSING_ENDPOINTS.TASK_BY_ID.replace(':taskId', taskId)
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gets the parsed job description for a specific task
   * @param taskId - The ID of the task
   * @returns Promise resolving to the parsed job description
   * @throws Error if the API request fails
   */
  public async getParsedJobDescription(taskId: string): Promise<IJobParsed> {
    try {
      return await this.apiGet<IJobParsed>(
        JOB_PARSING_ENDPOINTS.PARSED_JOB.replace(':taskId', taskId)
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Uploads a job description file for parsing (public endpoint - async)
   * @param file - The job description file to upload
   * @param mode - The parsing mode to use (STRICT, INFERRED, GENERATIVE)
   * @returns Promise resolving to the parsing task
   * @throws Error if the API request fails
   */
  public async uploadJobDescriptionPublic(
    file: File,
    mode: 'STRICT' | 'INFERRED' | 'GENERATIVE' = 'INFERRED'
  ): Promise<IJobPublicParsingTask> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      return await this.apiPost<IJobPublicParsingTask>(
        `${JOB_PARSING_ENDPOINTS.PUBLIC_UPLOAD}?mode=${mode}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gets the public parsing task status by task ID
   * @param taskId - The ID of the public parsing task to retrieve
   * @returns Promise resolving to the task status
   * @throws Error if the API request fails
   */
  public async getPublicParsingTask(
    taskId: string
  ): Promise<IJobPublicParsingTask> {
    try {
      return await this.apiGet<IJobPublicParsingTask>(
        JOB_PARSING_ENDPOINTS.PUBLIC_TASK.replace(':taskId', taskId)
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gets the parsed job description for a specific public parsing task
   * @param taskId - The ID of the public parsing task
   * @returns Promise resolving to the parsed job description
   * @throws Error if the API request fails
   */
  public async getParsedJobDescriptionFromPublicTask(
    taskId: string
  ): Promise<IJobParsed> {
    try {
      return await this.apiGet<IJobParsed>(
        JOB_PARSING_ENDPOINTS.PUBLIC_PARSED_JOB.replace(':taskId', taskId)
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
