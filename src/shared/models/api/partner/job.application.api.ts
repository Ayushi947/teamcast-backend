import {
  IPartnerJobApplicationCreate,
  IPartnerJobApplicationDetails,
  IPartnerJobApplicationFilterQuery,
  IPartnerJobApplicationWithdraw,
} from '../../domain/partner/job.application.domain';
import {
  IApiRequest,
  IApiResponse,
  IApiPaginatedRequest,
  IPaginatedResponse,
} from '../common/common.api';
import { ApplicationStatusEnum } from '../../common/enums';

// Apply to job posting API models
export interface IPartnerJobApplicationApplyParams {
  id: string;
}

export type IPartnerJobApplicationApplyApiRequest = IApiRequest<
  IPartnerJobApplicationCreate,
  void,
  IPartnerJobApplicationApplyParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerJobApplicationApplyApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 applications:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       applicationId:
 *                         type: string
 *                         format: uuid
 *                       candidateId:
 *                         type: string
 *                         format: uuid
 *                       status:
 *                         $ref: '#/components/schemas/ApplicationStatusEnum'
 */
export type IPartnerJobApplicationApplyApiResponse = IApiResponse<{
  message: string;
  applications: Array<{
    applicationId: string;
    candidateId: string;
    status: ApplicationStatusEnum;
  }>;
}>;

// Get partner job applications list API models
export type IPartnerJobApplicationListApiRequest = IApiPaginatedRequest<
  void,
  IPartnerJobApplicationFilterQuery,
  void
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerJobApplicationListApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               allOf:
 *                 - $ref: '#/components/schemas/IPaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/IPartnerJobApplicationDetails'
 */
export type IPartnerJobApplicationListApiResponse = IApiResponse<
  IPaginatedResponse<IPartnerJobApplicationDetails>
>;

// Get application by ID API models
export interface IPartnerJobApplicationByIdParams {
  id: string;
}

export type IPartnerJobApplicationByIdApiRequest = IApiRequest<
  void,
  void,
  IPartnerJobApplicationByIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerJobApplicationByIdApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerJobApplicationDetails'
 */
export type IPartnerJobApplicationByIdApiResponse =
  IApiResponse<IPartnerJobApplicationDetails>;

// Withdraw application API models
export interface IPartnerJobApplicationWithdrawParams {
  id: string;
}

export type IPartnerJobApplicationWithdrawApiRequest = IApiRequest<
  IPartnerJobApplicationWithdraw,
  void,
  IPartnerJobApplicationWithdrawParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerJobApplicationWithdrawApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 applicationId:
 *                   type: string
 *                   format: uuid
 *                 status:
 *                   $ref: '#/components/schemas/ApplicationStatusEnum'
 */
export type IPartnerJobApplicationWithdrawApiResponse = IApiResponse<{
  message: string;
  applicationId: string;
  status: ApplicationStatusEnum;
}>;
