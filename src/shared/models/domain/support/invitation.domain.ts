import {
  SupportInvitationTypeEnum,
  SupportInvitationStatusEnum,
  UserRoleEnum,
  SupportDepartmentEnum,
  SupportLevelEnum,
} from '../../common/enums';
import { IAuthUser } from '../auth/auth.user.domain';
import { IAuthToken } from '../auth/auth.token.domain';

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportInvitation:
 *       type: object
 *       description: Domain model representing a support invitation
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the invitation
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the invitee
 *         name:
 *           type: string
 *           description: Full name of the invitee
 *         jobTitle:
 *           type: string
 *           description: Job title of the invitee (optional)
 *         type:
 *           $ref: '#/components/schemas/SupportInvitationTypeEnum'
 *           description: Type of invitation (CANDIDATE, CLIENT, PARTNER, SUPPORT_USER)
 *         status:
 *           $ref: '#/components/schemas/SupportInvitationStatusEnum'
 *           description: Current status of the invitation
 *         clientId:
 *           type: string
 *           format: uuid
 *           description: Client ID (for client invitations)
 *         partnerId:
 *           type: string
 *           format: uuid
 *           description: Partner ID (for partner invitations)
 *         companyName:
 *           type: string
 *           description: Company name (for client/partner invitations)
 *         specialization:
 *           type: string
 *           description: Specialization (for partner invitations)
 *         role:
 *           $ref: '#/components/schemas/UserRoleEnum'
 *           description: User role (for support user invitations)
 *         department:
 *           $ref: '#/components/schemas/SupportDepartmentEnum'
 *           description: Support department (for support user invitations)
 *         supportLevel:
 *           $ref: '#/components/schemas/SupportLevelEnum'
 *           description: Support level (for support user invitations)
 *         isCampaign:
 *           type: boolean
 *           description: Flag indicating if this invitation is part of a campaign (Excel upload)
 *         invitationUrl:
 *           type: string
 *           format: uri
 *           description: Generated invitation URL for copying
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the invitation was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the invitation was last updated
 *       required:
 *         - id
 *         - email
 *         - name
 *         - type
 *         - status
 *         - createdAt
 *         - updatedAt
 */
export interface ISupportInvitation {
  id: string;
  email: string;
  name: string;
  jobTitle?: string;
  type: SupportInvitationTypeEnum;
  status: SupportInvitationStatusEnum;
  clientId?: string;
  partnerId?: string;
  companyName?: string;
  specialization?: string;
  role?: UserRoleEnum;
  department?: SupportDepartmentEnum;
  supportLevel?: SupportLevelEnum;
  accountManagerId?: string;
  isCampaign?: boolean;
  invitationUrl?: string;
  invitedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Transform database model to domain model
 */
export const toISupportInvitation = (
  supportInvitation: any
): ISupportInvitation => {
  return {
    id: supportInvitation.id,
    email: supportInvitation.email,
    name: supportInvitation.name,
    jobTitle: supportInvitation.jobTitle,
    type: supportInvitation.type,
    status: supportInvitation.status,
    clientId: supportInvitation.clientId,
    partnerId: supportInvitation.partnerId,
    companyName: supportInvitation.companyName,
    specialization: supportInvitation.specialization,
    role: supportInvitation.role,
    department: supportInvitation.department,
    supportLevel: supportInvitation.supportLevel,
    accountManagerId: supportInvitation.accountManagerId,
    isCampaign: supportInvitation.isCampaign,
    invitationUrl: supportInvitation.invitationUrl,
    invitedBy: supportInvitation.invitedBy,
    createdAt: supportInvitation.createdAt,
    updatedAt: supportInvitation.updatedAt,
  };
};

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportInvitationSend:
 *       type: object
 *       description: Domain model for sending a support invitation
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the invitee
 *         name:
 *           type: string
 *           description: Full name of the invitee
 *         jobTitle:
 *           type: string
 *           description: Job title of the invitee (optional)
 *         type:
 *           $ref: '#/components/schemas/SupportInvitationTypeEnum'
 *           description: Type of invitation
 *         clientId:
 *           type: string
 *           format: uuid
 *           description: Client ID (for client invitations)
 *         partnerId:
 *           type: string
 *           format: uuid
 *           description: Partner ID (for partner invitations)
 *         companyName:
 *           type: string
 *           description: Company name (for client/partner invitations)
 *         specialization:
 *           type: string
 *           description: Specialization (for partner invitations)
 *         role:
 *           $ref: '#/components/schemas/UserRoleEnum'
 *           description: User role (for support user invitations)
 *         department:
 *           $ref: '#/components/schemas/SupportDepartmentEnum'
 *           description: Support department (for support user invitations)
 *         supportLevel:
 *           $ref: '#/components/schemas/SupportLevelEnum'
 *           description: Support level (for support user invitations)
 *         accountManagerId:
 *           type: string
 *           format: uuid
 *           description: Account manager ID (for support user invitations)
 *         isCampaign:
 *           type: boolean
 *           description: Flag indicating if this invitation is part of a campaign (Excel upload)
 *         integrationProviderId:
 *           type: string
 *           format: uuid
 *           description: ID of the integration provider used for import (for campaign invitations)
 *       required:
 *         - email
 *         - name
 *         - type
 */
export interface ISupportInvitationSend {
  email: string;
  name: string;
  jobTitle?: string;
  type: SupportInvitationTypeEnum;
  clientId?: string;
  partnerId?: string;
  companyName?: string;
  specialization?: string;
  role?: UserRoleEnum;
  department?: SupportDepartmentEnum;
  supportLevel?: SupportLevelEnum;
  accountManagerId?: string;
  isCampaign?: boolean;
  integrationProviderId?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportInvitationAccepted:
 *       type: object
 *       description: Domain model for accepted invitation response
 *       properties:
 *         user:
 *           $ref: '#/components/schemas/IAuthUser'
 *           description: Authenticated user information
 *         token:
 *           $ref: '#/components/schemas/IAuthToken'
 *           description: Authentication token for immediate login
 *       required:
 *         - user
 *         - token
 */
export interface ISupportInvitationAccepted {
  message: string;
  user: IAuthUser;
  token: IAuthToken;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportInvitationFilterQuery:
 *       type: object
 *       description: Filter query for support invitations
 *       properties:
 *         email:
 *           type: string
 *           description: Filter by email address
 *         name:
 *           type: string
 *           description: Filter by name
 *         type:
 *           $ref: '#/components/schemas/SupportInvitationTypeEnum'
 *           description: Filter by invitation type
 *         status:
 *           $ref: '#/components/schemas/SupportInvitationStatusEnum'
 *           description: Filter by invitation status
 *         role:
 *           $ref: '#/components/schemas/UserRoleEnum'
 *           description: Filter by user role (for support user invitations)
 *         department:
 *           $ref: '#/components/schemas/SupportDepartmentEnum'
 *           description: Filter by support department
 *         supportLevel:
 *           $ref: '#/components/schemas/SupportLevelEnum'
 *           description: Filter by support level
 *         showYours:
 *           type: boolean
 *           description: Filter by show yours
 *         isCampaign:
 *           type: boolean
 *           description: Filter by campaign invitations (Excel upload)
 */
export interface ISupportInvitationFilterQuery {
  email?: string;
  name?: string;
  type?: SupportInvitationTypeEnum;
  status?: SupportInvitationStatusEnum;
  role?: UserRoleEnum;
  department?: SupportDepartmentEnum;
  supportLevel?: SupportLevelEnum;
  showYours?: boolean;
  isCampaign?: boolean;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportInvitationAcceptParams:
 *       type: object
 *       description: Parameters for accepting an invitation
 *       properties:
 *         token:
 *           type: string
 *           description: Invitation token
 *       required:
 *         - token
 */
export interface ISupportInvitationAcceptParams {
  token: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportInvitationIdParams:
 *       type: object
 *       description: Parameters for invitation ID operations
 *       properties:
 *         supportInvitationId:
 *           type: string
 *           format: uuid
 *           description: Support invitation ID
 *       required:
 *         - supportInvitationId
 */
export interface ISupportInvitationIdParams {
  supportInvitationId: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportInvitationListRequest:
 *       type: object
 *       description: Request model for listing support invitations
 *       properties:
 *         filters:
 *           $ref: '#/components/schemas/ISupportInvitationFilterQuery'
 *           description: Filter criteria
 *         pagination:
 *           $ref: '#/components/schemas/IPaginationRequest'
 *           description: Pagination parameters
 */
export interface ISupportInvitationListRequest {
  filters?: ISupportInvitationFilterQuery;
  pagination?: {
    page: number;
    limit: number;
  };
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportInvitationListResponse:
 *       type: object
 *       description: Response model for listing support invitations
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ISupportInvitation'
 *           description: List of support invitations
 *         pagination:
 *           $ref: '#/components/schemas/IPaginatedResponse/properties/pagination'
 *           description: Pagination information
 *       required:
 *         - items
 *         - pagination
 */
export interface ISupportInvitationListResponse {
  items: ISupportInvitation[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportGenericInvitationExpireResult:
 *       type: object
 *       description: Domain model for auto-expiring invitations result
 *       properties:
 *         totalChecked:
 *           type: number
 *           description: Total number of invitations checked
 *         totalExpired:
 *           type: number
 *           description: Number of invitations that were expired
 *         alreadyExpired:
 *           type: number
 *           description: Number of invitations that were already expired
 *         notYetExpired:
 *           type: number
 *           description: Number of invitations that have not expired yet
 *         message:
 *           type: string
 *           description: Summary message of the operation
 *         details:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *                 description: Invitation ID
 *               status:
 *                 type: string
 *                 description: Current status of the invitation
 *               email:
 *                 type: string
 *                 description: Email address of the invitation
 *               message:
 *                 type: string
 *                 description: Detailed message for this invitation
 *           description: Detailed results for each invitation processed
 *       required:
 *         - totalChecked
 *         - totalExpired
 *         - alreadyExpired
 *         - notYetExpired
 *         - message
 *         - details
 */
export interface ISupportGenericInvitationExpireResult {
  totalChecked: number;
  totalExpired: number;
  alreadyExpired: number;
  notYetExpired: number;
  message: string;
  details: Array<{
    id: string;
    status: string;
    email: string;
    message: string;
  }>;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportGenericInvitationExpireParams:
 *       type: object
 *       description: Parameters for auto-expiring invitations
 *       properties:
 *         invitationType:
 *           type: string
 *           enum: [support, job-posting]
 *           description: Type of invitation to check and expire
 *       required:
 *         - invitationType
 */
export interface ISupportGenericInvitationExpireParams {
  invitationType: 'support' | 'job-posting';
}
