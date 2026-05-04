import { IApiRequest, IApiResponse } from '../common/common.api';
import {
  IResume,
  IResumeSocial,
  IResumeCertification,
  IResumeEducation,
  IResumeExperience,
  IResumeProject,
  IResumeUpdate,
  IResumeSocialUpdate,
  IResumeCertificationCreate,
  IResumeEducationCreate,
  IResumeExperienceCreate,
  IResumeProjectCreate,
  IResumeProjectUpdate,
  IResumeExperienceUpdate,
  IResumeEducationUpdate,
  IResumeCertificationUpdate,
} from '../../domain/candidate/resume.domain';

/**
 * @openapi
 * components:
 *   parameters:
 *     ICandidateIdParams:
 *       in: path
 *       name: candidateId
 *       required: true
 *       schema:
 *         type: string
 */
export interface ICandidateIdParams {
  candidateId: string;
}

export type IResumePublicGetApiRequest = IApiRequest<
  void,
  void,
  ICandidateIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumePublicGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IResume'
 */
export type IResumePublicGetApiResponse = IApiResponse<IResume>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IResume'
 */
export type IResumeGetApiResponse = IApiResponse<IResume>;

export type IResumeUpdateApiRequest = IApiRequest<IResumeUpdate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IResume'
 */
export type IResumeUpdateApiResponse = IApiResponse<IResume>;

export type IResumeSocialGetApiRequest = IApiRequest<void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeSocialGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IResumeSocial'
 */
export type IResumeSocialGetApiResponse = IApiResponse<IResumeSocial>;

export type IResumeSocialUpdateApiRequest = IApiRequest<IResumeSocialUpdate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeSocialUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IResumeSocial'
 */
export type IResumeSocialUpdateApiResponse = IApiResponse<IResumeSocial>;

/**
 * @openapi
 * components:
 *   parameters:
 *     ICertificationIdParams:
 *       in: path
 *       name: certificationId
 *       required: true
 *       schema:
 *         type: string
 */
export interface ICertificationIdParams {
  certificationId: string;
}

export type IResumeCertificationGetApiRequest = IApiRequest<
  void,
  void,
  ICertificationIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeCertificationGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IResumeCertification'
 */
export type IResumeCertificationGetApiResponse =
  IApiResponse<IResumeCertification>;

export type IResumeCertificationCreateApiRequest =
  IApiRequest<IResumeCertificationCreate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeCertificationCreateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IResumeCertification'
 */
export type IResumeCertificationCreateApiResponse =
  IApiResponse<IResumeCertification>;

export type IResumeCertificationUpdateApiRequest = IApiRequest<
  IResumeCertificationUpdate,
  void,
  ICertificationIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeCertificationUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IResumeCertification'
 */
export type IResumeCertificationUpdateApiResponse =
  IApiResponse<IResumeCertification>;

/**
 * @openapi
 * components:
 *   parameters:
 *     IEducationIdParams:
 *       in: path
 *       name: educationId
 *       required: true
 *       schema:
 *         type: string
 */
export interface IEducationIdParams {
  educationId: string;
}

export type IResumeEducationGetApiRequest = IApiRequest<
  void,
  void,
  IEducationIdParams
>;
/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeEducationGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IResumeEducation'
 */
export type IResumeEducationGetApiResponse = IApiResponse<IResumeEducation>;

export type IResumeEducationCreateApiRequest =
  IApiRequest<IResumeEducationCreate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeEducationCreateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IResumeEducation'
 */
export type IResumeEducationCreateApiResponse = IApiResponse<IResumeEducation>;

export type IResumeEducationUpdateApiRequest = IApiRequest<
  IResumeEducationUpdate,
  void,
  IEducationIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeEducationUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IResumeEducation'
 */
export type IResumeEducationUpdateApiResponse = IApiResponse<IResumeEducation>;

/**
 * @openapi
 * components:
 *   parameters:
 *     IExperienceIdParams:
 *       in: path
 *       name: experienceId
 *       required: true
 *       schema:
 *         type: string
 */
export interface IExperienceIdParams {
  experienceId: string;
}

export type IResumeExperienceGetApiRequest = IApiRequest<
  void,
  void,
  IExperienceIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeExperienceGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IResumeExperience'
 */
export type IResumeExperienceGetApiResponse = IApiResponse<IResumeExperience>;

export type IResumeExperienceCreateApiRequest =
  IApiRequest<IResumeExperienceCreate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeExperienceCreateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IResumeExperience'
 */
export type IResumeExperienceCreateApiResponse =
  IApiResponse<IResumeExperience>;

export type IResumeExperienceUpdateApiRequest = IApiRequest<
  IResumeExperienceUpdate,
  void,
  IExperienceIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeExperienceUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IResumeExperience'
 */
export type IResumeExperienceUpdateApiResponse =
  IApiResponse<IResumeExperience>;

/**
 * @openapi
 * components:
 *   parameters:
 *     IExperienceIdParams:
 *       in: path
 *       name: experienceId
 *       required: true
 *       schema:
 *         type: string
 */
export interface IProjectIdParams {
  projectId: string;
}

export type IResumeProjectGetApiRequest = IApiRequest<
  void,
  void,
  IExperienceIdParams & IProjectIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeProjectGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IResumeProject'
 */
export type IResumeProjectGetApiResponse = IApiResponse<IResumeProject>;

export type IResumeProjectCreateApiRequest = IApiRequest<
  IResumeProjectCreate,
  void,
  IExperienceIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeProjectCreateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IResumeProject'
 */
export type IResumeProjectCreateApiResponse = IApiResponse<IResumeProject>;

export type IResumeProjectUpdateApiRequest = IApiRequest<
  IResumeProjectUpdate,
  void,
  IExperienceIdParams & IProjectIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeProjectUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IResumeProject'
 */
export type IResumeProjectUpdateApiResponse = IApiResponse<IResumeProject>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeCertificationsGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/IResumeCertification'
 */
export type IResumeCertificationsGetApiResponse = IApiResponse<
  IResumeCertification[]
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeEducationListGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/IResumeEducation'
 */
export type IResumeEducationListGetApiResponse = IApiResponse<
  IResumeEducation[]
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeExperienceListGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/IResumeExperience'
 */
export type IResumeExperienceListGetApiResponse = IApiResponse<
  IResumeExperience[]
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeProjectListGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/IResumeProject'
 */
export type IResumeProjectListGetApiResponse = IApiResponse<IResumeProject[]>;
