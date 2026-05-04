import { UserRoleEnum, UserStatusEnum } from '../../common/enums';

import { UserTypeEnum } from '../../common/enums';

/**
 * @openapi
 * components:
 *   schemas:
 *     IUser:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the user
 *         name:
 *           type: string
 *           description: Full name of the user
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the user
 *         type:
 *           $ref: '#/components/schemas/UserTypeEnum'
 *           description: Type of user account
 *         role:
 *           $ref: '#/components/schemas/UserRoleEnum'
 *           description: Role assigned to the user
 *         status:
 *           $ref: '#/components/schemas/UserStatusEnum'
 *           description: Current status of the user account
 *         jobTitle:
 *           type: string
 *           description: Job title of the user
 *           nullable: true
 *         emailVerified:
 *           type: string
 *           format: date-time
 *           description: Date when the email was verified
 *           nullable: true
 *         image:
 *           type: string
 *           description: URL to the user's profile image
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date when the user was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date when the user was last updated
 *       required:
 *         - id
 *         - name
 *         - email
 *         - type
 *         - role
 *         - status
 *         - createdAt
 *         - updatedAt
 */
export interface IUser {
  id: string;
  name: string;
  email: string;
  type: UserTypeEnum;
  role: UserRoleEnum;
  status: UserStatusEnum;
  jobTitle?: string;
  emailVerified?: Date;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Helper function to convert user data model to domain model
 * @param userData The user data model from database
 * @returns User domain model with sensitive fields removed
 */
export function toUserDomain(userData: any): IUser {
  // Destructure to omit sensitive fields
  const {
    password,
    refreshToken,
    passwordResetToken,
    emailVerificationToken,
    emailVerificationExpires,
    passwordResetExpires,
    ...userDomain
  } = userData;

  return userDomain;
}
