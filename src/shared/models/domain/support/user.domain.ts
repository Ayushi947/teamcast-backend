import {
  UserRoleEnum,
  UserStatusEnum,
  UserTypeEnum,
  SupportDepartmentEnum,
} from '../../common/enums';

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportUser:
 *       type: object
 *       description: Domain model representing a support user
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the support user
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the support user
 *         name:
 *           type: string
 *           description: Full name of the support user
 *         jobTitle:
 *           type: string
 *           description: Job title of the support user
 *         role:
 *           $ref: '#/components/schemas/UserRoleEnum'
 *           description: Role assigned to the support user
 *         status:
 *           $ref: '#/components/schemas/UserStatusEnum'
 *           description: Current status of the support user account
 *         type:
 *           $ref: '#/components/schemas/UserTypeEnum'
 *           description: Type of user account
 *         department:
 *           $ref: '#/components/schemas/SupportDepartmentEnum'
 *           description: Department the support user belongs to
 *         accountManagerAssigned:
 *           type: boolean
 *           description: Indicates if the recruiter has an account manager assigned (only applies to recruiters)
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the support user was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the support user was last updated
 *       required:
 *         - id
 *         - email
 *         - name
 *         - role
 *         - status
 *         - type
 *         - createdAt
 *         - updatedAt
 */
export interface ISupportUser {
  id: string;
  email: string;
  name: string;
  jobTitle?: string;
  role: UserRoleEnum;
  status: UserStatusEnum;
  profilePicture?: string;
  type: UserTypeEnum;
  department?: SupportDepartmentEnum;
  accountManagerAssigned?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportUserBasic:
 *       type: object
 *       description: Basic support user information
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the support user
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the support user
 *         name:
 *           type: string
 *           description: Full name of the support user
 *         role:
 *           $ref: '#/components/schemas/UserRoleEnum'
 *           description: Role assigned to the support user
 *         status:
 *           $ref: '#/components/schemas/UserStatusEnum'
 *           description: Current status of the support user account
 *       required:
 *         - id
 *         - email
 *         - name
 *         - role
 *         - status
 */
export type ISupportUserBasic = Pick<
  ISupportUser,
  'id' | 'email' | 'name' | 'role' | 'status'
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportUserCreate:
 *       type: object
 *       description: Payload for creating a new support user
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the support user
 *         name:
 *           type: string
 *           description: Full name of the support user
 *         jobTitle:
 *           type: string
 *           description: Job title of the support user
 *         role:
 *           $ref: '#/components/schemas/UserRoleEnum'
 *           description: Role assigned to the support user
 *         status:
 *           $ref: '#/components/schemas/UserStatusEnum'
 *           description: Initial status of the support user account (defaults to ACTIVE)
 *         department:
 *           $ref: '#/components/schemas/SupportDepartmentEnum'
 *           description: Department the support user belongs to
 *       required:
 *         - email
 *         - name
 *         - role
 */
export type ISupportUserCreate = {
  email: string;
  name: string;
  jobTitle?: string;
  role: UserRoleEnum;
  status?: UserStatusEnum;
  department?: SupportDepartmentEnum;
};

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportUserCreateResponse:
 *       type: object
 *       description: Response payload when a support user is successfully created
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the created support user
 *         name:
 *           type: string
 *           description: Full name of the created support user
 *         jobTitle:
 *           type: string
 *           description: Job title of the created support user
 *         message:
 *           type: string
 *           description: Success message
 *       required:
 *         - email
 *         - name
 *         - message
 */
export interface ISupportUserCreateResponse {
  email: string;
  name: string;
  jobTitle?: string;
  message: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportUserUpdate:
 *       type: object
 *       description: Payload for updating an existing support user
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the support user
 *         name:
 *           type: string
 *           description: Full name of the support user
 *         jobTitle:
 *           type: string
 *           description: Job title of the support user
 *         role:
 *           $ref: '#/components/schemas/UserRoleEnum'
 *           description: Role assigned to the support user
 *         status:
 *           $ref: '#/components/schemas/UserStatusEnum'
 *           description: Current status of the support user account
 *         department:
 *           $ref: '#/components/schemas/SupportDepartmentEnum'
 *           description: Department the support user belongs to
 */
export type ISupportUserUpdate = Partial<
  Omit<ISupportUser, 'id' | 'createdAt' | 'updatedAt' | 'type'>
>;

/**
 * @openapi
 * components:
 *   parameters:
 *     ISupportUserFilterQueryEmail:
 *       in: query
 *       name: email
 *       required: false
 *       schema:
 *         type: string
 *         description: Filter by support user email
 *     ISupportUserFilterQueryName:
 *       in: query
 *       name: name
 *       required: false
 *       schema:
 *         type: string
 *         description: Filter by support user name
 *     ISupportUserFilterQueryRole:
 *       in: query
 *       name: role
 *       required: false
 *       schema:
 *         $ref: '#/components/schemas/UserRoleEnum'
 *         description: Filter by support user role
 *     ISupportUserFilterQueryStatus:
 *       in: query
 *       name: status
 *       required: false
 *       schema:
 *         $ref: '#/components/schemas/UserStatusEnum'
 *         description: Filter by support user status
 *     ISupportUserFilterQueryDepartment:
 *       in: query
 *       name: department
 *       required: false
 *       schema:
 *         $ref: '#/components/schemas/SupportDepartmentEnum'
 *         description: Filter by support user department
 */
export interface ISupportUserFilterQuery {
  email?: string;
  name?: string;
  role?: UserRoleEnum;
  status?: UserStatusEnum;
  department?: SupportDepartmentEnum;
}

/**
 * @openapi
 * components:
 *   parameters:
 *     ISupportUserIdParams:
 *       in: path
 *       name: supportUserId
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *         description: ID of the support user
 */
export interface ISupportUserIdParams {
  supportUserId: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportUserActivateDeactivate:
 *       type: object
 *       description: Payload for activating or deactivating a support user
 *       properties:
 *         status:
 *           $ref: '#/components/schemas/UserStatusEnum'
 *           description: New status for the support user (ACTIVE or INACTIVE)
 *         autoReassign:
 *           type: boolean
 *           description: Whether to automatically reassign clients when deactivating account manager (only applies to account managers)
 *           default: true
 *       required:
 *         - status
 */
export interface ISupportUserActivateDeactivate {
  status: UserStatusEnum;
  autoReassign?: boolean;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportUserListResponse:
 *       type: object
 *       description: Response model for support user list items
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the support user
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the support user
 *         name:
 *           type: string
 *           description: Full name of the support user
 *         jobTitle:
 *           type: string
 *           description: Job title of the support user
 *         role:
 *           $ref: '#/components/schemas/UserRoleEnum'
 *           description: Role assigned to the support user
 *         status:
 *           $ref: '#/components/schemas/UserStatusEnum'
 *           description: Current status of the support user account
 *         department:
 *           $ref: '#/components/schemas/SupportDepartmentEnum'
 *           description: Department the support user belongs to
 *         accountManagerAssigned:
 *           type: boolean
 *           description: Indicates if the recruiter has an account manager assigned (only applies to recruiters)
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the support user was created
 */
export interface ISupportUserListResponse {
  id: string;
  email: string;
  name: string;
  jobTitle?: string;
  role: UserRoleEnum;
  status: UserStatusEnum;
  department?: SupportDepartmentEnum;
  accountManagerAssigned?: boolean;
  createdAt: string;
}

/**
 * Helper function to convert database models to domain models
 * This handles the relationship between User and SupportUser
 */
export function toSupportUserDomain(supportUser?: any): ISupportUser {
  return {
    id: supportUser.id,
    email: supportUser.user.email,
    name: supportUser.user.name,
    jobTitle: supportUser.user.jobTitle,
    profilePicture: supportUser.user.image,
    role: supportUser.user.role,
    status: supportUser.user.status,
    type: supportUser.user.type,
    department: supportUser.department,
    createdAt: supportUser.createdAt,
    updatedAt: supportUser.updatedAt,
  };
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportUserPasswordChange:
 *       type: object
 *       description: Payload for changing the password of a support user
 *       properties:
 *         currentPassword:
 *           type: string
 *           description: Current password for the support user
 *         newPassword:
 *           type: string
 *           description: New password for the support user
 *       required:
 *         - currentPassword
 *         - newPassword
 */
export interface ISupportUserPasswordChange {
  currentPassword: string;
  newPassword: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportUserRecruiterAnalytics:
 *       type: object
 *       description: Analytics for a recruiter
 *       properties:
 *         recruiterId:
 *           type: string
 *           format: uuid
 *           description: ID of the recruiter
 *         jobPostings:
 *           type: number
 *           description: Number of job postings assigned to the recruiter
 *         pendingInvites:
 *           type: number
 *           description: Number of pending job invites
 *         acceptedInvites:
 *           type: number
 *           description: Number of accepted job invites
 *         rejectedInvites:
 *           type: number
 *           description: Number of rejected job invites
 *         withdrawnInvites:
 *           type: number
 *           description: Number of withdrawn job invites
 *         totalInvites:
 *           type: number
 *           description: Total number of job invites
 *       required:
 *         - recruiterId
 *         - jobPostings
 *         - pendingInvites
 *         - acceptedInvites
 *         - rejectedInvites
 *         - withdrawnInvites
 *         - totalInvites
 */
export interface ISupportUserRecruiterAnalytics {
  recruiterId: string;
  jobPostings: number;
  jobPostingData?: {
    jobPostingId: string;
    jobPostingTotalInvites: number;
    jobPostingTotalRecommendedCandidates: number;
  }[];
  pendingInvites: number;
  acceptedInvites: number;
  rejectedInvites: number;
  withdrawnInvites: number;
  totalInvites: number;
  recommendationsData?: {
    total: number;
    firstStageRecommendations: number; //(candidate score more than 80)
    secondStageRecommendations: number; //(candidate score more than 70)
    thirdStageRecommendations: number; //(candidate score more than 60)
  };
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateProfilePhotoUrl:
 *       type: object
 *       properties:
 *         fileName:
 *           type: string
 *           description: Name of the uploaded file
 *         presignedUrl:
 *           type: string
 *           description: URL to candidate's profile picture
 */
export interface ISupportUserProfilePhotoUrl {
  fileName: string;
  presignedUrl: string;
}
