import { Request, Response, NextFunction } from 'express';
import { CandidateResumeService } from '@/services/candidate/resume.service';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import {
  IResumeGetApiResponse,
  IResumeUpdateApiRequest,
  IResumeUpdateApiResponse,
  IResumeSocialUpdateApiRequest,
  IResumeSocialUpdateApiResponse,
  IResumeCertificationCreateApiRequest,
  IResumeCertificationCreateApiResponse,
  IResumeEducationCreateApiRequest,
  IResumeEducationCreateApiResponse,
  IResumeExperienceCreateApiRequest,
  IResumeExperienceCreateApiResponse,
  IResumeProjectCreateApiRequest,
  IResumeProjectCreateApiResponse,
  IResumeSocialGetApiResponse,
  IResumeCertificationUpdateApiResponse,
  IResumeCertificationUpdateApiRequest,
  IResumeCertificationGetApiRequest,
  IResumeCertificationGetApiResponse,
  IResumeEducationUpdateApiResponse,
  IResumeEducationUpdateApiRequest,
  IResumeEducationGetApiResponse,
  IResumeEducationGetApiRequest,
  IResumeExperienceGetApiResponse,
  IResumeExperienceGetApiRequest,
  IResumeExperienceUpdateApiResponse,
  IResumeExperienceUpdateApiRequest,
  IResumeProjectGetApiResponse,
  IResumeProjectGetApiRequest,
  IResumeProjectUpdateApiResponse,
  IResumeProjectUpdateApiRequest,
  IResumeCertificationsGetApiResponse,
  IResumeEducationListGetApiResponse,
  IResumeExperienceListGetApiResponse,
  IResumeProjectListGetApiResponse,
} from '@/shared/models/api/candidate/resume.api';
import { singleton } from '@/shared/decorators/singleton';
import { ErrorCode } from '@/utils/error.codes';
import { AppError } from '@/utils/app.error';

@singleton
export class ResumeController extends BaseController {
  constructor(private readonly resumeService: CandidateResumeService) {
    super();
  }

  /**
   * Get candidate public resume
   */
  getPublicResume = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IResumeGetApiResponse>(req, res, next, async () => {
      const candidateId = req.params.candidateId;
      if (!candidateId) {
        throw new AppError(
          'Candidate ID is required',
          400,
          ErrorCode.CANDIDATE_ID_REQUIRED
        );
      }
      return await this.resumeService.getResume(candidateId);
    });
  };

  /**
   * Get candidate resume
   */
  getResume = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IResumeGetApiResponse>(req, res, next, async () => {
      const candidateId = req.user.candidateId;
      if (!candidateId) {
        throw new AppError(
          'Candidate ID is required',
          400,
          ErrorCode.CANDIDATE_ID_REQUIRED
        );
      }
      return await this.resumeService.getResume(candidateId);
    });
  };

  /**
   * Update candidate resume
   */
  updateResume = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IResumeUpdateApiResponse>(req, res, next, async () => {
      const candidateId = req.user.candidateId;
      if (!candidateId) {
        throw new AppError(
          'Candidate ID is required',
          400,
          ErrorCode.CANDIDATE_ID_REQUIRED
        );
      }
      const { data } = createIApiRequest<IResumeUpdateApiRequest>(req);
      return await this.resumeService.updateResume(candidateId, data);
    });
  };

  /**
   * Get resume social links
   */
  getResumeSocial = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IResumeSocialGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user.candidateId;
        if (!candidateId) {
          throw new AppError(
            'Candidate ID is required',
            400,
            ErrorCode.CANDIDATE_ID_REQUIRED
          );
        }
        return await this.resumeService.getResumeSocial(candidateId);
      }
    );
  };

  /**
   * Update resume social links
   */
  updateResumeSocial = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IResumeSocialUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user.candidateId;
        if (!candidateId) {
          throw new AppError(
            'Candidate ID is required',
            400,
            ErrorCode.CANDIDATE_ID_REQUIRED
          );
        }
        const { data } = createIApiRequest<IResumeSocialUpdateApiRequest>(req);
        return await this.resumeService.updateResumeSocial(candidateId, data);
      }
    );
  };

  /**
   * Add certification to resume
   */
  addCertification = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IResumeCertificationCreateApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user.candidateId;
        if (!candidateId) {
          throw new AppError(
            'Candidate ID is required',
            400,
            ErrorCode.CANDIDATE_ID_REQUIRED
          );
        }
        const { data } =
          createIApiRequest<IResumeCertificationCreateApiRequest>(req);
        return await this.resumeService.addCertification(candidateId, data);
      }
    );
  };

  /**
   * Update certification in resume
   */
  updateCertification = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IResumeCertificationUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user.candidateId;
        if (!candidateId) {
          throw new AppError(
            'Candidate ID is required',
            400,
            ErrorCode.CANDIDATE_ID_REQUIRED
          );
        }
        const { data, params } =
          createIApiRequest<IResumeCertificationUpdateApiRequest>(req);
        return await this.resumeService.updateCertification(
          candidateId,
          params.certificationId,
          data
        );
      }
    );
  };

  /**
   * Get certification from resume
   */
  getCertification = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IResumeCertificationGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user.candidateId;
        if (!candidateId) {
          throw new AppError(
            'Candidate ID is required',
            400,
            ErrorCode.CANDIDATE_ID_REQUIRED
          );
        }
        const { params } =
          createIApiRequest<IResumeCertificationGetApiRequest>(req);
        return await this.resumeService.getCertification(
          candidateId,
          params.certificationId
        );
      }
    );
  };

  /**
   * Add education to resume
   */
  addEducation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IResumeEducationCreateApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user.candidateId;
        if (!candidateId) {
          throw new AppError(
            'Candidate ID is required',
            400,
            ErrorCode.CANDIDATE_ID_REQUIRED
          );
        }
        const { data } =
          createIApiRequest<IResumeEducationCreateApiRequest>(req);
        return await this.resumeService.addEducation(candidateId, data);
      }
    );
  };

  /**
   * Update education in resume
   */
  updateEducation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IResumeEducationUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user.candidateId;
        if (!candidateId) {
          throw new AppError(
            'Candidate ID is required',
            400,
            ErrorCode.CANDIDATE_ID_REQUIRED
          );
        }
        const { data, params } =
          createIApiRequest<IResumeEducationUpdateApiRequest>(req);
        return await this.resumeService.updateEducation(
          candidateId,
          params.educationId,
          data
        );
      }
    );
  };

  /**
   * Get education from resume
   */
  getEducation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IResumeEducationGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user.candidateId;
        if (!candidateId) {
          throw new AppError(
            'Candidate ID is required',
            400,
            ErrorCode.CANDIDATE_ID_REQUIRED
          );
        }
        const { params } =
          createIApiRequest<IResumeEducationGetApiRequest>(req);
        return await this.resumeService.getEducation(
          candidateId,
          params.educationId
        );
      }
    );
  };

  /**
   * Add experience to resume
   */
  addExperience = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IResumeExperienceCreateApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user.candidateId;
        if (!candidateId) {
          throw new AppError(
            'Candidate ID is required',
            400,
            ErrorCode.CANDIDATE_ID_REQUIRED
          );
        }
        const { data } =
          createIApiRequest<IResumeExperienceCreateApiRequest>(req);
        return await this.resumeService.addExperience(candidateId, data);
      }
    );
  };

  /**
   * Get experience from resume
   */
  getExperience = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IResumeExperienceGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user.candidateId;
        if (!candidateId) {
          throw new AppError(
            'Candidate ID is required',
            400,
            ErrorCode.CANDIDATE_ID_REQUIRED
          );
        }
        const { params } =
          createIApiRequest<IResumeExperienceGetApiRequest>(req);
        return await this.resumeService.getExperience(
          candidateId,
          params.experienceId
        );
      }
    );
  };

  /**
   * Update experience in resume
   */
  updateExperience = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IResumeExperienceUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user.candidateId;
        if (!candidateId) {
          throw new AppError(
            'Candidate ID is required',
            400,
            ErrorCode.CANDIDATE_ID_REQUIRED
          );
        }
        const { data, params } =
          createIApiRequest<IResumeExperienceUpdateApiRequest>(req);
        return await this.resumeService.updateExperience(
          candidateId,
          params.experienceId,
          data
        );
      }
    );
  };

  /**
   * Add project to experience
   */
  addProject = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IResumeProjectCreateApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user.candidateId;
        if (!candidateId) {
          throw new AppError(
            'Candidate ID is required',
            400,
            ErrorCode.CANDIDATE_ID_REQUIRED
          );
        }
        const { data, params } =
          createIApiRequest<IResumeProjectCreateApiRequest>(req);
        return await this.resumeService.addProject(
          candidateId,
          params.experienceId,
          data
        );
      }
    );
  };

  /**
   * Get project from experience
   */
  getProject = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IResumeProjectGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user.candidateId;
        if (!candidateId) {
          throw new AppError(
            'Candidate ID is required',
            400,
            ErrorCode.CANDIDATE_ID_REQUIRED
          );
        }
        const { params } = createIApiRequest<IResumeProjectGetApiRequest>(req);
        return await this.resumeService.getProject(
          candidateId,
          params.experienceId,
          params.projectId
        );
      }
    );
  };

  /**
   * Update project in experience
   */
  updateProject = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IResumeProjectUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user.candidateId;
        if (!candidateId) {
          throw new AppError(
            'Candidate ID is required',
            400,
            ErrorCode.CANDIDATE_ID_REQUIRED
          );
        }
        const { data, params } =
          createIApiRequest<IResumeProjectUpdateApiRequest>(req);
        return await this.resumeService.updateProject(
          candidateId,
          params.experienceId,
          params.projectId,
          data
        );
      }
    );
  };

  /**
   * Get all certifications from resume
   */
  getCertifications = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IResumeCertificationsGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user.candidateId;
        if (!candidateId) {
          throw new AppError(
            'Candidate ID is required',
            400,
            ErrorCode.CANDIDATE_ID_REQUIRED
          );
        }
        return await this.resumeService.getCertifications(candidateId);
      }
    );
  };

  /**
   * Get all education entries from resume
   */
  getEducationList = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IResumeEducationListGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user.candidateId;
        if (!candidateId) {
          throw new AppError(
            'Candidate ID is required',
            400,
            ErrorCode.CANDIDATE_ID_REQUIRED
          );
        }
        return await this.resumeService.getEducationList(candidateId);
      }
    );
  };

  /**
   * Get all experience entries from resume
   */
  getExperienceList = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IResumeExperienceListGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user.candidateId;
        if (!candidateId) {
          throw new AppError(
            'Candidate ID is required',
            400,
            ErrorCode.CANDIDATE_ID_REQUIRED
          );
        }
        return await this.resumeService.getExperienceList(candidateId);
      }
    );
  };

  /**
   * Get all projects for a specific experience
   */
  getProjectList = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IResumeProjectListGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user.candidateId;
        if (!candidateId) {
          throw new AppError(
            'Candidate ID is required',
            400,
            ErrorCode.CANDIDATE_ID_REQUIRED
          );
        }
        const { params } = createIApiRequest<IResumeProjectGetApiRequest>(req);
        return await this.resumeService.getProjectList(
          candidateId,
          params.experienceId
        );
      }
    );
  };

  /**
   * Delete experience from resume
   */
  deleteExperience = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const candidateId = req.user.candidateId;
      if (!candidateId) {
        throw new AppError(
          'Candidate ID is required',
          400,
          ErrorCode.CANDIDATE_ID_REQUIRED
        );
      }
      const { params } = createIApiRequest<IResumeExperienceGetApiRequest>(req);
      await this.resumeService.deleteExperience(
        candidateId,
        params.experienceId
      );
      return { success: true };
    });
  };

  /**
   * Delete project from experience
   */
  deleteProject = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const candidateId = req.user.candidateId;
      if (!candidateId) {
        throw new AppError(
          'Candidate ID is required',
          400,
          ErrorCode.CANDIDATE_ID_REQUIRED
        );
      }
      const { params } = createIApiRequest<IResumeProjectGetApiRequest>(req);
      await this.resumeService.deleteProject(
        candidateId,
        params.experienceId,
        params.projectId
      );
      return { success: true };
    });
  };

  /**
   * Delete education from resume
   */
  deleteEducation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const candidateId = req.user.candidateId;
      if (!candidateId) {
        throw new AppError(
          'Candidate ID is required',
          400,
          ErrorCode.CANDIDATE_ID_REQUIRED
        );
      }
      const { params } = createIApiRequest<IResumeEducationGetApiRequest>(req);
      await this.resumeService.deleteEducation(candidateId, params.educationId);
      return { success: true };
    });
  };

  /**
   * Delete certification from resume
   */
  deleteCertification = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const candidateId = req.user.candidateId;
      if (!candidateId) {
        throw new AppError(
          'Candidate ID is required',
          400,
          ErrorCode.CANDIDATE_ID_REQUIRED
        );
      }
      const { params } =
        createIApiRequest<IResumeCertificationGetApiRequest>(req);
      await this.resumeService.deleteCertification(
        candidateId,
        params.certificationId
      );
      return { success: true };
    });
  };
}
