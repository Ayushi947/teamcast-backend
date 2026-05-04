import { IUser } from '../../domain/user/user.domain';
import { IApiRequest, IApiResponse } from '../common/common.api';

export interface IClientAccountManagerAssignmentApi {
  id: string;
  clientId: string;
  accountManagerId: string;
  assignedAt: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IAccountManagerOverrideApiRequest:
 *       type: object
 *       required:
 *         - clientId
 *         - accountManagerId
 *       properties:
 *         clientId:
 *           type: string
 *           format: uuid
 *           description: Client ID
 *         accountManagerId:
 *           type: string
 *           format: uuid
 *           description: Account Manager User ID
 *         changeReason:
 *           type: string
 *           description: Optional reason for changing the account manager
 *           example: "Client requested specific account manager"
 */
export interface IAccountManagerOverrideApiRequest {
  clientId: string;
  accountManagerId: string;
  changeReason?: string;
}

export interface IAccountManagerOverrideApiResponse {
  message: string;
  assignment: {
    id: string;
    clientId: string;
    accountManagerId: string;
    assignedAt: string;
  };
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IAccountManagerOverrideApiRequestWrapper:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 */
export type IAccountManagerOverrideApiRequestWrapper =
  IApiRequest<IAccountManagerOverrideApiRequest>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IAccountManagerOverrideApiResponseWrapper:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IAccountManagerOverrideApiResponse'
 */
export type IAccountManagerOverrideApiResponseWrapper =
  IApiResponse<IAccountManagerOverrideApiResponse>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IAccountManagerWrapper:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Message
 *         accountManager:
 *           $ref: '#/components/schemas/IUser'
 */
export interface IAccountManagerWrapper {
  message: string;
  accountManager: IUser;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IGetSupportAccountManagerByClientIdApiRequest:
 *       type: object
 */
export interface IGetSupportAccountManagerByClientIdApiRequest {
  clientId: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IGetSupportAccountManagerByClientIdApiResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The ID of the account manager
 *         name:
 *           type: string
 *           description: The name of the account manager
 *         email:
 *           type: string
 *           description: The email of the account manager
 *         type:
 *           type: string
 *           description: The type of the account manager
 *         role:
 *           type: string
 *           description: The role of the account manager
 *         status:
 *           type: string
 *           description: The status of the account manager
 *         jobTitle:
 *           type: string
 *           description: The job title of the account manager
 *         image:
 *           type: string
 *           description: The image of the account manager
 *         createdAt:
 *           type: string
 *           description: The created at date of the account manager
 *         updatedAt:
 *           type: string
 *           description: The updated at date of the account manager
 */
export interface IGetSupportAccountManagerByClientIdApiResponse {
  id: string;
  name: string;
  email: string;
  type: string;
  role: string;
  status: string;
  jobTitle?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export type IGetSupportAccountManagerByClientIdApiRequestWrapper =
  IApiRequest<IGetSupportAccountManagerByClientIdApiRequest>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IAssignAccountManagerToRecruiterApiRequest:
 *       type: object
 *       properties:
 *         recruiterId:
 *           type: string
 *           format: uuid
 *           description: The ID of the recruiter
 *         accountManagerId:
 *           type: string
 *           format: uuid
 *           description: The ID of the account manager
 */
export interface IAssignAccountManagerToRecruiterApiRequest {
  recruiterId: string;
  accountManagerId: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IAssignAccountManagerToRecruiterApiResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: The message of the response
 *         recruiter:
 *           $ref: '#/components/schemas/IUser'
 */
export interface IAssignAccountManagerToRecruiterApiResponse {
  message: string;
  recruiter: IUser;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IAssignAccountManagerToRecruiterApiRequestWrapper:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 */
export type IAssignAccountManagerToRecruiterApiRequestWrapper =
  IApiRequest<IAssignAccountManagerToRecruiterApiRequest>;
