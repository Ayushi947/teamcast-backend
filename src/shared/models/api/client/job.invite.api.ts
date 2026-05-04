import { JobInviteStatusEnum } from '../../common/enums';
import { IApiResponse, IPaginatedResponse } from '../common/common.api';
import {
  IJobInvite,
  IJobInviteTokenValidation,
} from '../../domain/client/job.invite.domain';
import { IJobInviteListResponse } from '../../domain/client/job.invite.domain';

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobInviteSimpleResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the created invite
 *         status:
 *           $ref: '#/components/schemas/JobInviteStatusEnum'
 *           description: Current status of the invite
 *         message:
 *           type: string
 *           description: Success message
 *           example: "Candidate invited successfully"
 *         success:
 *           type: boolean
 *           description: Whether the invite was successful
 *           example: true
 */
export interface IJobInviteSimpleResponse {
  id: string;
  status: JobInviteStatusEnum;
  message: string;
  success: boolean;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobInviteApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/IJobInviteSimpleResponse'
 */
export type IJobInviteApiResponse = IApiResponse<IJobInviteSimpleResponse[]>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobInviteCandidate:
 *       type: object
 *       required:
 *         - name
 *         - email
 *       properties:
 *         name:
 *           type: string
 *           description: Full name of the candidate
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the candidate
 */
export interface IJobInviteCandidate {
  name: string;
  email: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobInviteApiRequest:
 *       type: object
 *       required:
 *         - candidates
 *         - jobTitle
 *         - jobId
 *       properties:
 *         candidates:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IJobInviteCandidate'
 *           description: List of candidates to invite
 *         jobTitle:
 *           type: string
 *           description: Title of the job for which the invite is sent
 *         jobId:
 *           type: string
 *           format: uuid
 *           description: ID of the job posting
 */
export interface IJobInviteApiRequest {
  candidates: IJobInviteCandidate[];
  jobTitle: string;
  jobId: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobInviteTokenValidationResponse:
 *       type: object
 *       description: Response for invite token validation
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email address from the invite
 *         name:
 *           type: string
 *           description: Name from the invite
 *         jobId:
 *           type: string
 *           format: uuid
 *           description: Job ID from the invite
 *         inviteId:
 *           type: string
 *           format: uuid
 *           description: Invite ID
 *         isValid:
 *           type: boolean
 *           description: Whether the invite token is valid
 *         message:
 *           type: string
 *           description: Error message if validation fails
 */
export type IJobInviteTokenValidationResponse = IJobInviteTokenValidation;

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobInviteListApiRequest:
 *       type: object
 *       description: Request for getting job invites with filters and pagination
 *       properties:
 *         page:
 *           type: integer
 *           description: Page number
 *           example: 1
 *         limit:
 *           type: integer
 *           description: Number of items per page
 *           example: 10
 *         sortBy:
 *           type: string
 *           description: Field to sort by
 *           example: "createdAt"
 *         sortOrder:
 *           type: string
 *           enum: ["asc", "desc"]
 *           description: Sort order
 *           example: "desc"
 *         status:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/JobInviteStatusEnum'
 *           description: Filter by invite status
 *         jobId:
 *           type: string
 *           format: uuid
 *           description: Filter by specific job posting ID
 *         search:
 *           type: string
 *           description: Search term for candidate name or email
 *         startDate:
 *           type: string
 *           format: date
 *           description: Filter invites created from this date
 *         endDate:
 *           type: string
 *           format: date
 *           description: Filter invites created until this date
 */
export interface IJobInviteListApiRequest {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: JobInviteStatusEnum[];
  jobId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobInviteListApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IJobInviteListResponse'
 */
export type IJobInviteListApiResponse = IApiResponse<IJobInviteListResponse>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobImportedInviteListApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IPaginatedResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/IJobInvite'
 *               description: List of job invites
 *             total:
 *               type: number
 *               description: Total number of job invites
 */
export type IJobImportedInviteListApiResponse = IPaginatedResponse<IJobInvite>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobInviteByJobApiRequest:
 *       type: object
 *       description: Request for getting job invites by specific job posting ID
 *       properties:
 *         page:
 *           type: integer
 *           description: Page number
 *           example: 1
 *         limit:
 *           type: integer
 *           description: Number of items per page
 *           example: 10
 *         sortBy:
 *           type: string
 *           description: Field to sort by
 *           example: "createdAt"
 *         sortOrder:
 *           type: string
 *           enum: ["asc", "desc"]
 *           description: Sort order
 *           example: "desc"
 *         status:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/JobInviteStatusEnum'
 *           description: Filter by invite status
 *         search:
 *           type: string
 *           description: Search term for candidate name or email
 *         startDate:
 *           type: string
 *           format: date
 *           description: Filter invites created from this date
 *         endDate:
 *           type: string
 *           format: date
 *           description: Filter invites created until this date
 */
export interface IJobInviteByJobApiRequest {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: JobInviteStatusEnum[];
  search?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobInviteByJobApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IJobInviteListResponse'
 */
export type IJobInviteByJobApiResponse = IApiResponse<IJobInviteListResponse>;
