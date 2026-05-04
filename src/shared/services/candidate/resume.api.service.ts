import { ApiService } from '../core/api.service';

import {
  IResume,
  IResumeCertification,
  IResumeCertificationCreate,
  IResumeCertificationUpdate,
  IResumeEducation,
  IResumeEducationCreate,
  IResumeEducationUpdate,
  IResumeExperience,
  IResumeExperienceCreate,
  IResumeExperienceUpdate,
  IResumeProject,
  IResumeProjectCreate,
  IResumeProjectUpdate,
  IResumeSocial,
  IResumeSocialUpdate,
  IResumeUpdate,
} from '../../models/domain/candidate/resume.domain';
import { singleton } from '../../decorators/singleton';
/**
 * API endpoints for resume related operations
 */
const RESUME_ENDPOINTS = {
  BASE: '/candidate/resume',
  PUBLIC: '/candidate/resume/public',
  SOCIAL: '/candidate/resume/social',
  CERTIFICATION: '/candidate/resume/certification',
  EDUCATION: '/candidate/resume/education',
  EXPERIENCE: '/candidate/resume/experience',
  PROJECT: '/candidate/resume/experience/:experienceId/project',
} as const;

/**
 * Service for handling resume related API operations
 */
@singleton
export class CandidateResumeApiService extends ApiService {
  /**
   * Retrieves the current resume
   * @returns Promise resolving to the resume details
   * @throws Error if the API request fails
   */
  public async getPublicResume(candidateId: string): Promise<IResume> {
    try {
      return await this.apiGet<IResume>(
        `${RESUME_ENDPOINTS.PUBLIC}/${candidateId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Retrieves the current resume
   * @returns Promise resolving to the resume details
   * @throws Error if the API request fails
   */
  public async getResume(): Promise<IResume> {
    try {
      return await this.apiGet<IResume>(RESUME_ENDPOINTS.BASE);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Updates the current resume
   * @param data - The resume update data
   * @returns Promise resolving to the updated resume details
   * @throws Error if the API request fails
   */
  public async updateResume(data: IResumeUpdate): Promise<IResume> {
    try {
      return await this.apiPatch<IResume>(RESUME_ENDPOINTS.BASE, data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Retrieves social links for the resume
   * @returns Promise resolving to the social links
   * @throws Error if the API request fails
   */
  public async getSocialLinks(): Promise<IResumeSocial> {
    try {
      return await this.apiGet<IResumeSocial>(RESUME_ENDPOINTS.SOCIAL);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Updates social links for the resume
   * @param data - The social links update data
   * @returns Promise resolving to the updated social links
   * @throws Error if the API request fails
   */
  public async updateSocialLinks(
    data: IResumeSocialUpdate
  ): Promise<IResumeSocial> {
    try {
      return await this.apiPatch<IResumeSocial>(RESUME_ENDPOINTS.SOCIAL, data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Retrieves all certifications
   * @returns Promise resolving to the list of certifications
   * @throws Error if the API request fails
   */
  public async getCertifications(): Promise<IResumeCertification[]> {
    try {
      return await this.apiGet<IResumeCertification[]>(
        RESUME_ENDPOINTS.CERTIFICATION
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Retrieves a specific certification
   * @param certificationId - The ID of the certification to retrieve
   * @returns Promise resolving to the certification details
   * @throws Error if the API request fails
   */
  public async getCertification(
    certificationId: string
  ): Promise<IResumeCertification> {
    try {
      return await this.apiGet<IResumeCertification>(
        `${RESUME_ENDPOINTS.CERTIFICATION}/${certificationId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Creates a new certification
   * @param data - The certification initialize data
   * @returns Promise resolving to the created certification details
   * @throws Error if the API request fails
   */
  public async createCertification(
    data: IResumeCertificationCreate
  ): Promise<IResumeCertification> {
    try {
      return await this.apiPost<IResumeCertification>(
        RESUME_ENDPOINTS.CERTIFICATION,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Updates a specific certification
   * @param certificationId - The ID of the certification to update
   * @param data - The certification update data
   * @returns Promise resolving to the updated certification details
   * @throws Error if the API request fails
   */
  public async updateCertification(
    certificationId: string,
    data: IResumeCertificationUpdate
  ): Promise<IResumeCertification> {
    try {
      return await this.apiPatch<IResumeCertification>(
        `${RESUME_ENDPOINTS.CERTIFICATION}/${certificationId}`,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Deletes a specific certification
   * @param certificationId - The ID of the certification to delete
   * @returns Promise resolving when the deletion is complete
   * @throws Error if the API request fails
   */
  public async deleteCertification(certificationId: string): Promise<void> {
    try {
      return await this.apiDelete<void>(
        `${RESUME_ENDPOINTS.CERTIFICATION}/${certificationId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Retrieves all education entries
   * @returns Promise resolving to the list of education entries
   * @throws Error if the API request fails
   */
  public async getEducationList(): Promise<IResumeEducation[]> {
    try {
      return await this.apiGet<IResumeEducation[]>(RESUME_ENDPOINTS.EDUCATION);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Retrieves a specific education entry
   * @param educationId - The ID of the education entry to retrieve
   * @returns Promise resolving to the education entry details
   * @throws Error if the API request fails
   */
  public async getEducation(educationId: string): Promise<IResumeEducation> {
    try {
      return await this.apiGet<IResumeEducation>(
        `${RESUME_ENDPOINTS.EDUCATION}/${educationId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Creates a new education entry
   * @param data - The education entry initialize data
   * @returns Promise resolving to the created education entry details
   * @throws Error if the API request fails
   */
  public async createEducation(
    data: IResumeEducationCreate
  ): Promise<IResumeEducation> {
    try {
      return await this.apiPost<IResumeEducation>(
        RESUME_ENDPOINTS.EDUCATION,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Updates a specific education entry
   * @param educationId - The ID of the education entry to update
   * @param data - The education entry update data
   * @returns Promise resolving to the updated education entry details
   * @throws Error if the API request fails
   */
  public async updateEducation(
    educationId: string,
    data: IResumeEducationUpdate
  ): Promise<IResumeEducation> {
    try {
      return await this.apiPatch<IResumeEducation>(
        `${RESUME_ENDPOINTS.EDUCATION}/${educationId}`,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Deletes a specific education entry
   * @param educationId - The ID of the education entry to delete
   * @returns Promise resolving when the deletion is complete
   * @throws Error if the API request fails
   */
  public async deleteEducation(educationId: string): Promise<void> {
    try {
      return await this.apiDelete<void>(
        `${RESUME_ENDPOINTS.EDUCATION}/${educationId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Retrieves all experience entries
   * @returns Promise resolving to the list of experience entries
   * @throws Error if the API request fails
   */
  public async getExperienceList(): Promise<IResumeExperience[]> {
    try {
      return await this.apiGet<IResumeExperience[]>(
        RESUME_ENDPOINTS.EXPERIENCE
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Retrieves a specific experience entry
   * @param experienceId - The ID of the experience entry to retrieve
   * @returns Promise resolving to the experience entry details
   * @throws Error if the API request fails
   */
  public async getExperience(experienceId: string): Promise<IResumeExperience> {
    try {
      return await this.apiGet<IResumeExperience>(
        `${RESUME_ENDPOINTS.EXPERIENCE}/${experienceId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Creates a new experience entry
   * @param data - The experience entry initialize data
   * @returns Promise resolving to the created experience entry details
   * @throws Error if the API request fails
   */
  public async createExperience(
    data: IResumeExperienceCreate
  ): Promise<IResumeExperience> {
    try {
      return await this.apiPost<IResumeExperience>(
        RESUME_ENDPOINTS.EXPERIENCE,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Updates a specific experience entry
   * @param experienceId - The ID of the experience entry to update
   * @param data - The experience entry update data
   * @returns Promise resolving to the updated experience entry details
   * @throws Error if the API request fails
   */
  public async updateExperience(
    experienceId: string,
    data: IResumeExperienceUpdate
  ): Promise<IResumeExperience> {
    try {
      return await this.apiPatch<IResumeExperience>(
        `${RESUME_ENDPOINTS.EXPERIENCE}/${experienceId}`,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Deletes a specific experience entry
   * @param experienceId - The ID of the experience entry to delete
   * @returns Promise resolving when the deletion is complete
   * @throws Error if the API request fails
   */
  public async deleteExperience(experienceId: string): Promise<void> {
    try {
      return await this.apiDelete<void>(
        `${RESUME_ENDPOINTS.EXPERIENCE}/${experienceId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Retrieves all projects for a specific experience
   * @param experienceId - The ID of the experience
   * @returns Promise resolving to the list of projects
   * @throws Error if the API request fails
   */
  public async getProjectList(experienceId: string): Promise<IResumeProject[]> {
    try {
      return await this.apiGet<IResumeProject[]>(
        RESUME_ENDPOINTS.PROJECT.replace(':experienceId', experienceId)
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Retrieves a specific project
   * @param experienceId - The ID of the experience
   * @param projectId - The ID of the project to retrieve
   * @returns Promise resolving to the project details
   * @throws Error if the API request fails
   */
  public async getProject(
    experienceId: string,
    projectId: string
  ): Promise<IResumeProject> {
    try {
      return await this.apiGet<IResumeProject>(
        `${RESUME_ENDPOINTS.PROJECT.replace(
          ':experienceId',
          experienceId
        )}/${projectId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Creates a new project
   * @param experienceId - The ID of the experience
   * @param data - The project initialize data
   * @returns Promise resolving to the created project details
   * @throws Error if the API request fails
   */
  public async createProject(
    experienceId: string,
    data: IResumeProjectCreate
  ): Promise<IResumeProject> {
    try {
      return await this.apiPost<IResumeProject>(
        RESUME_ENDPOINTS.PROJECT.replace(':experienceId', experienceId),
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Updates a specific project
   * @param experienceId - The ID of the experience
   * @param projectId - The ID of the project to update
   * @param data - The project update data
   * @returns Promise resolving to the updated project details
   * @throws Error if the API request fails
   */
  public async updateProject(
    experienceId: string,
    projectId: string,
    data: IResumeProjectUpdate
  ): Promise<IResumeProject> {
    try {
      return await this.apiPatch<IResumeProject>(
        `${RESUME_ENDPOINTS.PROJECT.replace(
          ':experienceId',
          experienceId
        )}/${projectId}`,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Deletes a specific project
   * @param experienceId - The ID of the experience
   * @param projectId - The ID of the project to delete
   * @returns Promise resolving when the deletion is complete
   * @throws Error if the API request fails
   */
  public async deleteProject(
    experienceId: string,
    projectId: string
  ): Promise<void> {
    try {
      return await this.apiDelete<void>(
        `${RESUME_ENDPOINTS.PROJECT.replace(
          ':experienceId',
          experienceId
        )}/${projectId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
