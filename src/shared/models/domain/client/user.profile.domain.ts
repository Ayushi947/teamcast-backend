import {
  CommunicationChannelEnum,
  UserRoleEnum,
  UserStatusEnum,
} from '../../common/enums';

/**
 * @openapi
 * components:
 *   schemas:
 *     ClientUserProfileDomain:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The user ID
 *         name:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         jobTitle:
 *           type: string
 *           description: User's job title
 *         role:
 *           type: string
 *           ref: '#/components/schemas/UserRoleEnum'
 *           description: User's role in the client organization
 *         status:
 *           type: string
 *           ref: '#/components/schemas/UserStatusEnum'
 *           description: User's account status
 *         image:
 *           type: string
 *           description: URL to user's profile picture
 *         clientId:
 *           type: string
 *           description: ID of the client this user belongs to
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the user was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the user was last updated
 */
export interface IClientUserProfile {
  id: string;
  name: string;
  email: string;
  jobTitle?: string;
  role: UserRoleEnum;
  status: UserStatusEnum;
  image?: string;
  clientId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientUserProfileBasicUpdate:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: User's full name
 *         jobTitle:
 *           type: string
 */
export interface IClientUserProfileBasicUpdate {
  name: string;
  jobTitle?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientUserProfilePasswordChange:
 *       type: object
 *       required:
 *         - currentPassword
 *         - newPassword
 *       properties:
 *         currentPassword:
 *           type: string
 *           description: User's current password
 *         newPassword:
 *           type: string
 *           description: User's new password
 */
export interface IClientUserProfilePasswordChange {
  currentPassword: string;
  newPassword: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientUserProfilePhotoUpdate:
 *       type: object
 *       properties:
 *         fileName:
 *           type: string
 *           description: Name of the uploaded file
 */
export type IClientUserProfilePhotoUpdate = {
  fileName: string;
};

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientUserProfilePhotoUrl:
 *       type: object
 *       properties:
 *         fileName:
 *           type: string
 *           description: Name of the uploaded file
 *         presignedUrl:
 *           type: string
 *           description: URL to user's profile picture
 */
export interface IClientUserProfilePhotoUrl {
  fileName: string;
  presignedUrl: string;
}

/**
 * @openapi
 * components:
 *   parameters:
 *     IClientUserIDParams:
 *       name: clientUserId
 *       in: path
 *       required: true
 *       type: string
 *       description: ID of the client user
 */
export interface IClientUserIDParams {
  clientUserId: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientUserSettings:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The settings ID
 *         notificationsEnabled:
 *           type: boolean
 *           description: Whether all notifications are enabled
 *         emailNotifications:
 *           type: boolean
 *           description: Email-specific notifications toggle
 *         pushNotifications:
 *           type: boolean
 *           description: Push notification-specific toggle
 *         darkMode:
 *           type: boolean
 *           description: UI theme preference
 *         language:
 *           type: string
 *           description: User interface language
 *         timezone:
 *           type: string
 *           description: User's preferred timezone
 *         preferredCommunicationChannel:
 *           ref: '#/components/schemas/CommunicationChannelEnum'
 *           description: Preferred communication channel
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the settings were created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the settings were last updated
 */
export interface IClientUserSettings {
  clientUserId: string;
  globalSettingsId: string;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  darkMode: boolean;
  language: string;
  timezone: string;
  preferredCommunicationChannel?: CommunicationChannelEnum;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientUserSettingsUpdate:
 *       type: object
 *       properties:
 *         notificationsEnabled:
 *           type: boolean
 *           description: Whether all notifications are enabled
 *         emailNotifications:
 *           type: boolean
 *           description: Email-specific notifications toggle
 *         pushNotifications:
 *           type: boolean
 *           description: Push notification-specific toggle
 *         darkMode:
 *           type: boolean
 *           description: UI theme preference
 *         language:
 *           type: string
 *           description: User interface language
 *         timezone:
 *           type: string
 *           description: User's preferred timezone
 *         preferredCommunicationChannel:
 *           type: string
 *           enum: [EMAIL, PHONE, SMS, IN_APP]
 *           description: Preferred communication channel
 */
export interface IClientUserSettingsUpdate {
  notificationsEnabled?: boolean;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  darkMode?: boolean;
  language?: string;
  timezone?: string;
  preferredCommunicationChannel?: string;
}

/**
 * Helper function to convert database model to domain model
 */
export function toClientUserProfileDomain(
  user: any,
  clientUser?: any
): IClientUserProfile {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    jobTitle: user.jobTitle,
    role: user.role,
    status: user.status,
    image: user.image,
    clientId: clientUser?.clientId || '',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * Helper function to convert database model to domain model
 */
export function toClientUserSettingsDomain(settings: any): IClientUserSettings {
  return {
    notificationsEnabled: settings.notificationsEnabled,
    emailNotifications: settings.emailNotifications,
    pushNotifications: settings.pushNotifications,
    darkMode: settings.darkMode,
    language: settings.language,
    timezone: settings.timezone,
    preferredCommunicationChannel: settings.preferredCommunicationChannel,
    createdAt: settings.createdAt,
    updatedAt: settings.updatedAt,
    clientUserId: settings.clientUserId,
    globalSettingsId: settings.globalSettingsId,
  };
}
