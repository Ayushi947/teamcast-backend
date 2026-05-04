import {
  JobInviteStatusEnum,
  SupportJobInviteStatusEnum,
} from '../../common/enums';
import { IApiResponse } from '../common/common.api';
import { IApiRequest } from '../common/common.api';

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportJobInviteSimpleResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the created invite
 *         status:
 *           $ref: '#/components/schemas/SupportJobInviteStatusEnum'
 *           description: Current status of the invite
 *         message:
 *           type: string
 *           description: Success message
 *           example: "Support user invited successfully"
 */
export interface ISupportJobInviteSimpleResponse {
  id: string;
  status: SupportJobInviteStatusEnum;
  message: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportJobInviteApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ISupportJobInviteSimpleResponse'
 */
export type ISupportJobInviteApiResponse = IApiResponse<
  ISupportJobInviteSimpleResponse[]
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportJobInviteCandidate:
 *       type: object
 *       required:
 *         - name
 *         - email
 *       properties:
 *         name:
 *           type: string
 *           description: Full name of the support user
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the support user
 */
export interface ISupportJobInviteCandidate {
  name: string;
  email: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportJobInviteApiRequest:
 *       type: object
 *       required:
 *         - candidates
 *         - jobTitle
 *         - jobId
 *       properties:
 *         candidates:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ISupportJobInviteCandidate'
 *           description: List of support users to invite
 *         jobTitle:
 *           type: string
 *           description: Title of the job for which the invite is sent
 *         jobId:
 *           type: string
 *           format: uuid
 *           description: ID of the job posting
 */
export interface ISupportJobInviteApiRequest {
  candidates: ISupportJobInviteCandidate[];
  jobTitle: string;
  jobId: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportJobPostingInviteDetail:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the invite
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the invited candidate
 *         name:
 *           type: string
 *           description: Name of the invited candidate
 *         jobId:
 *           type: string
 *           format: uuid
 *           description: ID of the job posting
 *         inviterId:
 *           type: string
 *           format: uuid
 *           description: ID of the support user who sent the invite
 *         status:
 *           $ref: '#/components/schemas/JobInviteStatusEnum'
 *           description: Current status of the invite
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: Expiration date of the invite
 *         isSupportInvite:
 *           type: boolean
 *           description: Whether this is a support-initiated invite
 *         invitationUrl:
 *           type: string
 *           description: URL for the job posting invite
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the invite was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the invite was last updated
 *         jobPosting:
 *           type: object
 *           description: Job posting details
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             title:
 *               type: string
 *             description:
 *               type: string
 *             jobType:
 *               type: string
 *             jobCommitment:
 *               type: string
 *             jobSchedule:
 *               type: string
 *             industry:
 *               type: string
 *             department:
 *               type: string
 *             isRemote:
 *               type: boolean
 *             minSalary:
 *               type: number
 *             maxSalary:
 *               type: number
 *             salaryCurrency:
 *               type: string
 *             client:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 company:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *         inviter:
 *           type: object
 *           description: Inviter details
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             name:
 *               type: string
 *             email:
 *               type: string
 *               format: email
 */
export interface ISupportJobPostingInviteDetail {
  id: string;
  email: string;
  name: string;
  jobId: string;
  inviterId: string;
  status: JobInviteStatusEnum;
  expiresAt: string;
  isSupportInvite: boolean;
  invitationUrl?: string;
  isImportedCandidate?: boolean;
  integrationId?: string;
  createdAt: string;
  updatedAt: string;
  jobPosting?: {
    id: string;
    title: string;
    description: string;
    jobType: string;
    jobCommitment: string;
    jobSchedule: string;
    industry: string;
    department?: string;
    isRemote: boolean;
    minSalary?: number;
    maxSalary?: number;
    salaryCurrency?: string;
    client?: {
      id: string;
      company?: {
        id: string;
        name: string;
      };
    };
  };
  inviter?: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportJobPostingInviteDetailApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISupportJobPostingInviteDetail'
 */
export type ISupportJobPostingInviteDetailApiResponse =
  IApiResponse<ISupportJobPostingInviteDetail>;

/**
 * @openapi
 * components:
 *   parameters:
 *     ISupportJobPostingInviteIdParams:
 *       name: invitationId
 *       in: path
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *         description: ID of the invite to resend
 */
export interface ISupportJobPostingInviteIdParams {
  invitationId: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportJobPostingInviteResendApiRequest:
 *       type: object
 *       required:
 *         - invitationId
 *       properties:
 *         invitationId:
 *           type: string
 *           format: uuid
 *           description: ID of the invite to resend
 */
export type ISupportJobPostingInviteResendApiRequest = IApiRequest<
  void,
  void,
  ISupportJobPostingInviteIdParams
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportJobPostingInviteWithdrawApiRequest:
 *       type: object
 *       required:
 *         - invitationId
 */
export type ISupportJobPostingInviteWithdrawApiRequest = IApiRequest<
  void,
  void,
  ISupportJobPostingInviteIdParams
>;
