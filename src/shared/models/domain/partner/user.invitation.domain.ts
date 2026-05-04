import {
  PartnerUserInvitationStatusEnum,
  UserRoleEnum,
} from '../../common/enums';
import { IAuthToken } from '../auth/auth.token.domain';
import { IAuthUser } from '../auth/auth.user.domain';

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerUserInvitation:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the invitation
 *         partnerId:
 *           type: string
 *           format: uuid
 *           description: ID of the partner organization
 *         partner:
 *           type: object
 *           description: Partner organization details
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
 *           $ref: '#/components/schemas/PartnerUserInvitationStatusEnum'
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
export interface IPartnerUserInvitation {
  id: string;
  partnerId: string;
  email: string;
  name: string;
  jobTitle?: string;
  role: UserRoleEnum;
  status: PartnerUserInvitationStatusEnum;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     toIPartnerUserInvitation:
 *       type: function
 *       description: Converts a partner user invitation database entity to a domain model
 */
export const toIPartnerUserInvitation = (
  partnerUserInvitation: any
): IPartnerUserInvitation => {
  return {
    id: partnerUserInvitation.id,
    partnerId: partnerUserInvitation.partnerId,
    email: partnerUserInvitation.email,
    name: partnerUserInvitation.name,
    jobTitle: partnerUserInvitation.jobTitle,
    role: partnerUserInvitation.role,
    status: partnerUserInvitation.status,
    createdAt: partnerUserInvitation.createdAt,
    updatedAt: partnerUserInvitation.updatedAt,
  };
};

/**
 * @openapi
 * components:
 *   parameters:
 *     IPartnerInvitationIdParams:
 *       in: path
 *       name: partnerUserInvitationId
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *         description: Unique identifier of the partner user invitation
 */
export type IPartnerInvitationIdParams = {
  partnerUserInvitationId: string;
};

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerUserInvitationSend:
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
 *         partnerId:
 *           type: string
 *           format: uuid
 *           description: ID of the partner organization
 */
export interface IPartnerUserInvitationSend {
  email: string;
  name: string;
  jobTitle?: string;
  role: UserRoleEnum;
  partnerId: string;
}

/**
 * @openapi
 * components:
 *   parameters:
 *     IPartnerUserInvitationAcceptParams:
 *       in: path
 *       name: token
 *       required: true
 *       schema:
 *         type: string
 *         description: Invitation token received in the email
 */
export interface IPartnerUserInvitationAcceptParams {
  token?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerUserInvitationAccepted:
 *       type: object
 *       properties:
 *         user:
 *           $ref: '#/components/schemas/IAuthUser'
 *           description: Authenticated user information
 *         authToken:
 *           $ref: '#/components/schemas/IAuthToken'
 *           description: Authentication token for the user
 */
export interface IPartnerUserInvitationAccepted {
  user: IAuthUser;
  authToken: IAuthToken;
}

/**
 * @openapi
 * components:
 *   parameters:
 *     IPartnerUserInvitationFilterQueryEmail:
 *       in: query
 *       name: email
 *       required: false
 *       schema:
 *         type: string
 *         description: Filter by email address
 *     IPartnerUserInvitationFilterQueryName:
 *       in: query
 *       name: name
 *       required: false
 *       schema:
 *         type: string
 *         description: Filter by name
 *     IPartnerUserInvitationFilterQueryRole:
 *       in: query
 *       name: role
 *       required: false
 *       schema:
 *         $ref: '#/components/schemas/UserRoleEnum'
 *         description: Filter by role
 *     IPartnerUserInvitationFilterQueryStatus:
 *       in: query
 *       name: status
 *       required: false
 *       schema:
 *         $ref: '#/components/schemas/PartnerUserInvitationStatusEnum'
 *         description: Filter by status
 */
export interface IPartnerUserInvitationFilterQuery {
  email?: string;
  name?: string;
  role?: UserRoleEnum;
  status?: PartnerUserInvitationStatusEnum;
}
