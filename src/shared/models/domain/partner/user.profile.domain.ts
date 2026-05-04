import {
  CommunicationChannelEnum,
  UserRoleEnum,
  UserStatusEnum,
} from '../../common/enums';

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerUserProfile:
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
 *           description: User's role in the partner organization
 *         status:
 *           type: string
 *           ref: '#/components/schemas/UserStatusEnum'
 *           description: User's account status
 *         image:
 *           type: string
 *           description: URL to user's profile picture
 *         partnerId:
 *           type: string
 *           description: ID of the partner this user belongs to
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the user was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the user was last updated
 */
export interface IPartnerUserProfile {
  id: string;
  name: string;
  email: string;
  jobTitle?: string;
  role: UserRoleEnum;
  status: UserStatusEnum;
  image?: string;
  partnerId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerUserProfileBasicUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: User's full name
 *         jobTitle:
 *           type: string
 *           description: User's job title
 */
export interface IPartnerUserProfileBasicUpdate {
  name?: string;
  jobTitle?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerUserProfilePasswordChange:
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
export interface IPartnerUserProfilePasswordChange {
  currentPassword: string;
  newPassword: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerUserProfilePhotoUpdate:
 *       type: object
 *       properties:
 *         fileName:
 *           type: string
 *           description: Name of the uploaded file
 */
export type IPartnerUserProfilePhotoUpdate = {
  fileName: string;
};

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerUserProfilePhotoUrl:
 *       type: object
 *       properties:
 *         fileName:
 *           type: string
 *           description: Name of the uploaded file
 *         presignedUrl:
 *           type: string
 *           description: URL to user's profile picture
 */
export interface IPartnerUserProfilePhotoUrl {
  fileName: string;
  presignedUrl: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerUserSettings:
 *       type: object
 *       properties:
 *         partnerUserId:
 *           type: string
 *           description: ID of the partner user
 *         globalSettingsId:
 *           type: string
 *           description: Reference to global settings
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
export interface IPartnerUserSettings {
  partnerUserId: string;
  globalSettingsId?: string;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  darkMode: boolean;
  language: string;
  timezone: string;
  preferredCommunicationChannel: CommunicationChannelEnum;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerUserSettingsUpdate:
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
export interface IPartnerUserSettingsUpdate {
  notificationsEnabled?: boolean;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  darkMode?: boolean;
  language?: string;
  timezone?: string;
  preferredCommunicationChannel?: string;
}

/**
 * Convert database user and partner_user to domain model
 */
export function toPartnerUserProfileDomain(
  user: any,
  partnerUser: any
): IPartnerUserProfile {
  return {
    id: partnerUser.id,
    name: user.name,
    email: user.email,
    jobTitle: user.jobTitle,
    role: user.role,
    status: user.status,
    image: user.image,
    partnerId: partnerUser.partnerId,
    createdAt: partnerUser.createdAt,
    updatedAt: partnerUser.updatedAt,
  };
}

/**
 * Convert database partner_user_settings to domain model
 */
export function toPartnerUserSettingsDomain(
  settings?: any
): IPartnerUserSettings {
  if (!settings) {
    throw new Error('Settings cannot be null');
  }

  return {
    partnerUserId: settings.partnerUserId,
    globalSettingsId: settings.globalSettingsId,
    notificationsEnabled: settings.notificationsEnabled,
    emailNotifications: settings.emailNotifications,
    pushNotifications: settings.pushNotifications,
    darkMode: settings.darkMode,
    language: settings.language,
    timezone: settings.timezone,
    preferredCommunicationChannel: settings.preferredCommunicationChannel,
  };
}
