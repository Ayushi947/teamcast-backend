import {
  ClientUserInvitationStatusEnum,
  UserRoleEnum,
} from '../../common/enums';
import { IAuthToken } from '../auth/auth.token.domain';
import { IAuthUser } from '../auth/auth.user.domain';

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientUserInvitation:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the invitation
 *         clientId:
 *           type: string
 *           format: uuid
 *           description: ID of the client organization
 *         client:
 *           type: object
 *           description: Client organization details
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the invited user
 *         name:
 *           type: string
 *           description: Name of the invited user
 *         jobTitle:
 *           type: string
 *           description: Job title of the invited user
 *         role:
 *           $ref: '#/components/schemas/UserRoleEnum'
 *           description: Role assigned to the invited user
 *         status:
 *           $ref: '#/components/schemas/ClientUserInvitationStatusEnum'
 *           description: Current status of the invitation
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the invitation was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the invitation was last updated
 */
export interface IClientUserInvitation {
  id: string;
  clientId: string;
  email: string;
  name: string;
  jobTitle?: string;
  role: UserRoleEnum;
  status: ClientUserInvitationStatusEnum;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     toIClientUserInvitation:
 *       type: function
 *       description: Converts a client user invitation database entity to a domain model
 */
export const toIClientUserInvitation = (
  clientUserInvitation: any
): IClientUserInvitation => {
  return {
    id: clientUserInvitation.id,
    clientId: clientUserInvitation.clientId,
    email: clientUserInvitation.email,
    name: clientUserInvitation.name,
    jobTitle: clientUserInvitation.jobTitle,
    role: clientUserInvitation.role,
    status: clientUserInvitation.status,
    createdAt: clientUserInvitation.createdAt,
    updatedAt: clientUserInvitation.updatedAt,
  };
};

/**
 * @openapi
 * components:
 *   parameters:
 *     IInvitationIdParams:
 *       in: path
 *       name: clientUserInvitationId
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *         description: Unique identifier of the client user invitation
 */
export type IInvitationIdParams = {
  clientUserInvitationId: string;
};

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientUserInvitationSend:
 *       type: object
 *       required:
 *         - email
 *         - name
 *         - role
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the user to invite
 *         name:
 *           type: string
 *           description: Name of the user to invite
 *         jobTitle:
 *           type: string
 *           description: Job title of the user to invite
 *         role:
 *           $ref: '#/components/schemas/UserRoleEnum'
 *           description: Role to assign to the invited user
 */
export interface IClientUserInvitationSend {
  email: string;
  name: string;
  jobTitle?: string;
  role: UserRoleEnum;
}

/**
 * @openapi
 * components:
 *   parameters:
 *     IClientUserInvitationAcceptParams:
 *       in: path
 *       name: token
 *       required: true
 *       schema:
 *         type: string
 *         description: Invitation token received in the email
 */
export interface IClientUserInvitationAcceptParams {
  token?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientUserInvitationAccepted:
 *       type: object
 *       properties:
 *         user:
 *           $ref: '#/components/schemas/IAuthUser'
 *           description: Authenticated user information
 *         authToken:
 *           $ref: '#/components/schemas/IAuthToken'
 *           description: Authentication token for the user
 */
export interface IClientUserInvitationAccepted {
  user: IAuthUser;
  authToken: IAuthToken;
}

/**
 * @openapi
 * components:
 *   parameters:
 *     IClientUserInvitationFilterQueryEmail:
 *       in: query
 *       name: email
 *       required: false
 *       schema:
 *         type: string
 *         description: Filter by email address
 *     IClientUserInvitationFilterQueryName:
 *       in: query
 *       name: name
 *       required: false
 *       schema:
 *         type: string
 *         description: Filter by name
 *     IClientUserInvitationFilterQueryRole:
 *       in: query
 *       name: role
 *       required: false
 *       schema:
 *         $ref: '#/components/schemas/UserRoleEnum'
 *         description: Filter by role
 *     IClientUserInvitationFilterQueryStatus:
 *       in: query
 *       name: status
 *       required: false
 *       schema:
 *         $ref: '#/components/schemas/ClientUserInvitationStatusEnum'
 *         description: Filter by status
 */
export interface IClientUserInvitationFilterQuery {
  email?: string;
  name?: string;
  role?: UserRoleEnum;
  status?: ClientUserInvitationStatusEnum;
}
