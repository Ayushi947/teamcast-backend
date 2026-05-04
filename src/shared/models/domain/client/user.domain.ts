import { UserRoleEnum, UserStatusEnum, UserTypeEnum } from '../../common/enums';

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientUser:
 *       type: object
 *       description: Domain model representing a client user
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the client user
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the client user
 *         name:
 *           type: string
 *           description: Full name of the client user
 *         jobTitle:
 *           type: string
 *           description: Job title of the client user
 *         role:
 *           $ref: '#/components/schemas/UserRoleEnum'
 *           description: Role assigned to the client user
 *         status:
 *           $ref: '#/components/schemas/UserStatusEnum'
 *           description: Current status of the client user account
 *         type:
 *           $ref: '#/components/schemas/UserTypeEnum'
 *           description: Type of user account
 *         clientId:
 *           type: string
 *           format: uuid
 *           description: ID of the client the user belongs to
 *         profileSetup:
 *           type: boolean
 *           description: Indicates whether the client user has completed the profile setup
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the client user was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the client user was last updated
 *       required:
 *         - id
 *         - email
 *         - name
 *         - role
 *         - status
 *         - type
 *         - clientId
 *         - createdAt
 *         - updatedAt
 */
export interface IClientUser {
  id: string;
  email: string;
  name: string;
  jobTitle?: string;
  role: UserRoleEnum;
  status: UserStatusEnum;
  profilePicture?: string;
  type: UserTypeEnum;
  clientId: string;
  profileSetup?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientUserBasic:
 *       type: object
 *       description: Basic client user information
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the client user
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the client user
 *         name:
 *           type: string
 *           description: Full name of the client user
 *         role:
 *           $ref: '#/components/schemas/UserRoleEnum'
 *           description: Role assigned to the client user
 *         status:
 *           $ref: '#/components/schemas/UserStatusEnum'
 *           description: Current status of the client user account
 *       required:
 *         - id
 *         - email
 *         - name
 *         - role
 *         - status
 */
export type IClientUserBasic = Pick<
  IClientUser,
  'id' | 'email' | 'name' | 'role' | 'status'
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientUserCreate:
 *       type: object
 *       description: Payload for creating a new client user
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the client user
 *         name:
 *           type: string
 *           description: Full name of the client user
 *         jobTitle:
 *           type: string
 *           description: Job title of the client user
 *         role:
 *           $ref: '#/components/schemas/UserRoleEnum'
 *           description: Role assigned to the client user
 *         status:
 *           $ref: '#/components/schemas/UserStatusEnum'
 *           description: Initial status of the client user account
 *         clientId:
 *           type: string
 *           format: uuid
 *           description: ID of the client the user belongs to
 *         password:
 *           type: string
 *           format: password
 *           description: Password for the client user account (optional)
 *       required:
 *         - email
 *         - name
 *         - role
 *         - status
 *         - clientId
 */
export type IClientUserCreate = Omit<
  IClientUser,
  'id' | 'createdAt' | 'updatedAt' | 'type'
> & {
  password?: string;
};

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientUserUpdate:
 *       type: object
 *       description: Payload for updating an existing client user
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the client user
 *         name:
 *           type: string
 *           description: Full name of the client user
 *         jobTitle:
 *           type: string
 *           description: Job title of the client user
 *         role:
 *           $ref: '#/components/schemas/UserRoleEnum'
 *           description: Role assigned to the client user
 *         status:
 *           $ref: '#/components/schemas/UserStatusEnum'
 *           description: Current status of the client user account
 */
export type IClientUserUpdate = Partial<
  Omit<IClientUser, 'id' | 'createdAt' | 'updatedAt' | 'type' | 'clientId'>
>;

/**
 * @openapi
 * components:
 *   parameters:
 *     IClientUserFilterQueryEmail:
 *       in: query
 *       name: email
 *       required: false
 *       schema:
 *         type: string
 *         description: Filter by client user email
 *     IClientUserFilterQueryName:
 *       in: query
 *       name: name
 *       required: false
 *       schema:
 *         type: string
 *         description: Filter by client user name
 *     IClientUserFilterQueryRole:
 *       in: query
 *       name: role
 *       required: false
 *       schema:
 *         $ref: '#/components/schemas/UserRoleEnum'
 *         description: Filter by client user role
 *     IClientUserFilterQueryStatus:
 *       in: query
 *       name: status
 *       required: false
 *       schema:
 *         $ref: '#/components/schemas/UserStatusEnum'
 *         description: Filter by client user status
 */
export interface IClientUserFilterQuery {
  email?: string;
  name?: string;
  role?: UserRoleEnum;
  status?: UserStatusEnum;
}

/**
 * @openapi
 * components:
 *   parameters:
 *     IClientUserIdParams:
 *       in: path
 *       name: clientUserId
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *         description: ID of the client user
 */
export interface IClientUserIdParams {
  clientUserId: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientUserActivateDeactivate:
 *       type: object
 *       description: Payload for activating or deactivating a client user
 *       properties:
 *         status:
 *           $ref: '#/components/schemas/UserStatusEnum'
 *           description: New status for the client user (ACTIVE or INACTIVE)
 *       required:
 *         - status
 */
export interface IClientUserActivateDeactivate {
  status: UserStatusEnum;
}

/**
 * Helper function to convert database models to domain models
 * This handles the relationship between User and ClientUser
 */
export function toClientUserDomain(clientUser?: any): IClientUser {
  return {
    id: clientUser.id,
    email: clientUser.user.email,
    name: clientUser.user.name,
    jobTitle: clientUser.user.jobTitle,
    profilePicture: clientUser.user.image,
    role: clientUser.user.role,
    status: clientUser.user.status,
    type: clientUser.user.type,
    clientId: clientUser?.clientId || '',
    profileSetup: clientUser.profileSetup,
    createdAt: clientUser.createdAt,
    updatedAt: clientUser.updatedAt,
  };
}
