import { UserTypeEnum } from '../../common/enums';
import { UserRoleEnum } from '../../common/enums';
import { IAuthToken } from './auth.token.domain';

/**
 * @openapi
 * components:
 *   schemas:
 *     IAuthUser:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the user
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the user
 *         name:
 *           type: string
 *           description: Full name of the user
 *         role:
 *           $ref: '#/components/schemas/UserRoleEnum'
 *           description: Role assigned to the user
 *         type:
 *           $ref: '#/components/schemas/UserTypeEnum'
 *           description: Type of user account
 *         clientId:
 *           type: string
 *           format: uuid
 *           description: ID of the client organization (if user is a client user)
 *           nullable: true
 *         partnerId:
 *           type: string
 *           format: uuid
 *           description: ID of the partner organization (if user is a partner user)
 *           nullable: true
 *         candidateId:
 *           type: string
 *           format: uuid
 *           description: ID of the candidate profile (if user is a candidate)
 *           nullable: true
 *         profileSetup:
 *           type: boolean
 *           description: Whether the user has completed profile setup (only applies to client and partner admin users)
 *         emailVerified:
 *           type: string
 *           format: date-time
 *           description: Date when the email was verified
 *           nullable: true
 *         isDeelEnabled:
 *           type: boolean
 *           description: Whether Deel SSO is enabled for the user's client organization (only applies to CLIENT users)
 *           nullable: true
 */
export interface IAuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRoleEnum;
  type: UserTypeEnum;
  clientUserId?: string;
  clientId?: string;
  partnerUserId?: string;
  partnerId?: string;
  candidateId?: string;
  supportUserId?: string;
  profileSetup?: boolean;
  emailVerified?: Date;
  isDeelEnabled?: boolean;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IAuthUserWithToken:
 *       type: object
 *       properties:
 *         user:
 *           $ref: '#/components/schemas/IAuthUser'
 *         token:
 *           $ref: '#/components/schemas/IAuthToken'
 *
 */
export interface IAuthUserWithToken {
  user: IAuthUser;
  token: IAuthToken;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IAuthUserProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the user
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the user
 *         name:
 *           type: string
 *           description: Full name of the user
 *         role:
 *           $ref: '#/components/schemas/UserRoleEnum'
 *           description: Role assigned to the user
 *         type:
 *           $ref: '#/components/schemas/UserTypeEnum'
 *           description: Type of user account
 *         jobTitle:
 *           type: string
 *           description: Job title of the user
 *           nullable: true
 */
export interface IAuthUserProfile
  extends Omit<IAuthUser, 'clientId' | 'partnerId' | 'candidateId'> {
  jobTitle?: string;
}

export const toIAuthUser = (user: any): IAuthUser => {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    type: user.type,
    clientUserId: user.clientUser?.id,
    clientId: user.clientUser?.clientId,
    partnerUserId: user.partnerUser?.id,
    partnerId: user.partnerUser?.partnerId,
    supportUserId: user.supportUser?.id,
    candidateId: user.candidate?.id,
    profileSetup: user.profileSetup,
    emailVerified: user.emailVerified,
    isDeelEnabled:
      user.type === UserTypeEnum.CLIENT
        ? user.clientUser?.client?.settings?.isDeelEnabled || false
        : undefined,
  };
};
