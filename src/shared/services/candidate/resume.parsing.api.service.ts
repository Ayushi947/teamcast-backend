import { ApiService } from '../core/api.service';
import { singleton } from '../../decorators/singleton';
import {
  IResumeParsed,
  IResumeParsingTask,
} from '../../models/domain/candidate/resume.parsing.domain';
import { IResumePublicParsingTask } from '../../models/domain/candidate/resume.public.parsing.domain';

/**
 * API endpoints for resume parsing related operations
 */
const RESUME_PARSING_ENDPOINTS = {
  BASE: '/candidate/resume/parsing',
  UPLOAD: '/candidate/resume/parsing/upload',
  PUBLIC_UPLOAD: '/candidate/resume/parsing/public/upload',
  PUBLIC_TASK: '/candidate/resume/parsing/public/:taskId',
  PUBLIC_PARSED_RESUME: '/candidate/resume/parsing/public/:taskId/resume',
  TASK: '/candidate/resume/parsing/task',
  TASK_BY_ID: '/candidate/resume/parsing/task/:taskId',
  PARSED_RESUME: '/candidate/resume/parsing/task/:taskId/resume',
} as const;

/**
 * Service for handling resume parsing related API operations
 */
@singleton
export class CandidateResumeParsingApiService extends ApiService {
  /**
   * Uploads a resume file for parsing
   * @param file - The resume file to upload
   * @param mode - The parsing mode to use (STRICT, INFERRED, GENERATIVE)
   * @returns Promise resolving to the upload response
   * @throws Error if the API request fails
   */
  public async uploadResume(
    file: File,
    mode: 'STRICT' | 'INFERRED' | 'GENERATIVE' = 'INFERRED'
  ): Promise<IResumeParsingTask> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      return await this.apiPost<IResumeParsingTask>(
        `${RESUME_PARSING_ENDPOINTS.UPLOAD}?mode=${mode}`,
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
   * Gets the resume parsing task status for the current candidate
   * @returns Promise resolving to the task status
   * @throws Error if the API request fails
   */
  public async getParsingTaskForCandidate(): Promise<IResumeParsingTask> {
    try {
      return await this.apiGet<IResumeParsingTask>(
        RESUME_PARSING_ENDPOINTS.TASK
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gets the resume parsing task status by task ID
   * @param taskId - The ID of the task to retrieve
   * @returns Promise resolving to the task status
   * @throws Error if the API request fails
   */
  public async getParsingTask(taskId: string): Promise<IResumeParsingTask> {
    try {
      return await this.apiGet<IResumeParsingTask>(
        RESUME_PARSING_ENDPOINTS.TASK_BY_ID.replace(':taskId', taskId)
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gets the parsed resume for a specific task
   * @param taskId - The ID of the task
   * @returns Promise resolving to the parsed resume
   * @throws Error if the API request fails
   */
  public async getParsedResume(taskId: string): Promise<IResumeParsed> {
    try {
      return await this.apiGet<IResumeParsed>(
        RESUME_PARSING_ENDPOINTS.PARSED_RESUME.replace(':taskId', taskId)
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Uploads a resume file for parsing (public endpoint - async)
   * @param file - The resume file to upload
   * @param mode - The parsing mode to use (STRICT, INFERRED, GENERATIVE)
   * @returns Promise resolving to the parsing task
   * @throws Error if the API request fails
   */
  public async uploadResumePublic(
    file: File,
    mode: 'STRICT' | 'INFERRED' | 'GENERATIVE' = 'INFERRED'
  ): Promise<IResumePublicParsingTask> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      return await this.apiPost<IResumePublicParsingTask>(
        `${RESUME_PARSING_ENDPOINTS.PUBLIC_UPLOAD}?mode=${mode}`,
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
  ): Promise<IResumePublicParsingTask> {
    try {
      return await this.apiGet<IResumePublicParsingTask>(
        RESUME_PARSING_ENDPOINTS.PUBLIC_TASK.replace(':taskId', taskId)
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gets the parsed resume for a specific public parsing task
   * @param taskId - The ID of the public parsing task
   * @returns Promise resolving to the parsed resume
   * @throws Error if the API request fails
   */
  public async getParsedResumeFromPublicTask(
    taskId: string
  ): Promise<IResumeParsed> {
    try {
      return await this.apiGet<IResumeParsed>(
        RESUME_PARSING_ENDPOINTS.PUBLIC_PARSED_RESUME.replace(':taskId', taskId)
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
