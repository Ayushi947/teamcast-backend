import { UserRoleEnum, UserStatusEnum, UserTypeEnum } from '../../common/enums';

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerUser:
 *       type: object
 *       description: Domain model representing a partner user
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the partner user
 *         email:
 *           type: string
 *           format: email
 *         name:
 *           type: string
 *           description: Full name of the partner user
 *         jobTitle:
 *           type: string
 *           description: Job title of the partner user
 *         role:
 *           $ref: '#/components/schemas/UserRoleEnum'
 *           description: Role assigned to the partner user
 *         status:
 *           $ref: '#/components/schemas/UserStatusEnum'
 *           description: Current status of the partner user account
 *         profilePicture:
 *           type: string
 *           description: URL of the partner user's profile picture
 *         type:
 *           $ref: '#/components/schemas/UserTypeEnum'
 *           description: Type of the partner user
 *         partnerId:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the partner
 *         profileSetup:
 *           type: boolean
 *           description: Indicates whether the partner user has completed profile setup
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the partner user was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the partner user was last updated
 *       required:
 *         - id
 *         - email
 *         - name
 *         - role
 *         - status
 *         - type
 *         - partnerId
 *         - createdAt
 *         - updatedAt
 */

export interface IPartnerUser {
  id: string;
  email: string;
  name: string;
  jobTitle?: string;
  role: UserRoleEnum;
  status: UserStatusEnum;
  profilePicture?: string;
  type: UserTypeEnum;
  partnerId: string;
  profileSetup?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerUserBasic:
 *       type: object
 *       description: Basic partner user information
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the partner user
 *         email:
 *           type: string
 *           format: email
 *         name:
 *           type: string
 *           description: Full name of the partner user
 *         role:
 *           $ref: '#/components/schemas/UserRoleEnum'
 *           description: Role assigned to the partner user
 *         status:
 *           $ref: '#/components/schemas/UserStatusEnum'
 *           description: Current status of the partner user account
 *       required:
 *         - id
 *         - email
 *         - name
 *         - role
 *         - status
 */

export type IPartnerUserBasic = Pick<
  IPartnerUser,
  'id' | 'email' | 'name' | 'role' | 'status'
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerUserCreate:
 *       type: object
 *       description: Payload for creating a new partner user (Admin only)
 *       required:
 *         - email
 *         - name
 *         - role
 *         - status
 *         - partnerId
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the partner user
 *         name:
 *           type: string
 *           description: Full name of the partner user
 *         jobTitle:
 *           type: string
 *           description: Job title of the partner user
 *         role:
 *           $ref: '#/components/schemas/UserRoleEnum'
 *           description: Role assigned to the partner user
 *         status:
 *           $ref: '#/components/schemas/UserStatusEnum'
 *           description: Current status of the partner user account
 *         partnerId:
 *           type: string
 *           format: uuid
 *           description: ID of the partner organization
 *         password:
 *           type: string
 *           format: password
 *           description: Password for the partner user account (optional)
 */

export type IPartnerUserCreate = Omit<
  IPartnerUser,
  'id' | 'createdAt' | 'updatedAt' | 'type'
> & {
  password?: string;
};

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerUserUpdate:
 *       type: object
 *       description: Payload for updating an existing partner user
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the partner user
 *         name:
 *           type: string
 *           description: Full name of the partner user
 *         jobTitle:
 *           type: string
 *           description: Job title of the partner user
 *         role:
 *           $ref: '#/components/schemas/UserRoleEnum'
 *           description: Role assigned to the partner user
 *         status:
 *           $ref: '#/components/schemas/UserStatusEnum'
 *           description: Current status of the partner user account
 */

export type IPartnerUserUpdate = Partial<
  Omit<IPartnerUser, 'id' | 'createdAt' | 'updatedAt' | 'type' | 'clientId'>
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerUserFilterQuery:
 *       type: object
 *       description: Query parameters for filtering partner users
 *       properties:
 *         email:
 *           type: string
 *           description: Filter by partner user email
 *         name:
 *           type: string
 *           description: Filter by partner user name
 *         role:
 *           $ref: '#/components/schemas/UserRoleEnum'
 *           description: Filter by partner user role
 *         status:
 *           $ref: '#/components/schemas/UserStatusEnum'
 *           description: Filter by partner user status
 */

export interface IPartnerUserFilterQuery {
  email?: string;
  name?: string;
  role?: UserRoleEnum;
  status?: UserStatusEnum;
}

/**
 * @openapi
 * components:
 *   parameters:
 *     IPartnerUserFilterQueryEmail:
 *       in: query
 *       name: email
 *       required: false
 *       schema:
 *         type: string
 *         format: email
 *         description: Filter by partner user email
 *     IPartnerUserFilterQueryName:
 *       in: query
 *       name: name
 *       required: false
 *       schema:
 *         type: string
 *         description: Filter by partner user name
 *     IPartnerUserFilterQueryRole:
 *       in: query
 *       name: role
 *       required: false
 *       schema:
 *         $ref: '#/components/schemas/UserRoleEnum'
 *         description: Filter by partner user role
 *     IPartnerUserFilterQueryStatus:
 *       in: query
 *       name: status
 *       required: false
 *       schema:
 *         $ref: '#/components/schemas/UserStatusEnum'
 *         description: Filter by partner user status
 */

/**
 * @openapi
 * components:
 *   parameters:
 *     IPartnerUserIdParams:
 *       in: path
 *       name: partnerUserId
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *         description: Unique identifier for the partner user
 */

export interface IPartnerUserIdParams {
  partnerUserId: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerUserActivateDeactivate:
 *       type: object
 *       description: Payload for activating or deactivating a partner user
 *       properties:
 *         status:
 *           $ref: '#/components/schemas/UserStatusEnum'
 *           description: New status for the partner user (ACTIVE or INACTIVE)
 *       required:
 *         - status
 */

export interface IPartnerUserActivateDeactivate {
  status: UserStatusEnum;
}

/**
 * Helper function to convert database models to domain models
 * This handles the relationship between User and PartnerUser
 */
export function toPartnerUserDomain(partnerUser?: any): IPartnerUser {
  return {
    id: partnerUser.id,
    email: partnerUser.user.email,
    name: partnerUser.user.name,
    jobTitle: partnerUser.user.jobTitle,
    profilePicture: partnerUser.user.image,
    role: partnerUser.user.role,
    status: partnerUser.user.status,
    type: partnerUser.user.type,
    partnerId: partnerUser.partnerId,
    profileSetup: partnerUser.profileSetup,
    createdAt: partnerUser.createdAt,
    updatedAt: partnerUser.updatedAt,
  };
}
