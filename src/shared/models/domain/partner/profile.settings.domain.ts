/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerProfileSettings:
 *       type: object
 *       properties:
 *         notificationsEnabled:
 *           type: boolean
 *           description: Controls whether notifications are enabled for the partner
 *         emailNotifications:
 *           type: boolean
 *           description: Controls whether email notifications are enabled for the partner
 *         pushNotifications:
 *           type: boolean
 *           description: Controls whether push notifications are enabled for the partner
 *         jobAlerts:
 *           type: boolean
 *           description: Controls whether job alerts are enabled for the partner
 *         candidateAlerts:
 *           type: boolean
 *           description: Controls whether candidate alerts are enabled for the partner
 *         applicationAlerts:
 *           type: boolean
 *           description: Controls whether application alerts are enabled for the partner
 *         privacySettings:
 *           type: object
 *           description: JSON object containing privacy settings
 *         brandingSettings:
 *           type: object
 *           description: JSON object containing branding settings
 *         integrationSettings:
 *           type: object
 *           description: JSON object containing integration settings with third-party services
 */

export interface IPartnerProfileSettings {
  partnerId: string;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  jobAlerts: boolean;
  candidateAlerts: boolean;
  applicationAlerts: boolean;
  privacySettings?: any;
  brandingSettings?: any;
  integrationSettings?: any;
  globalSettingsId?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerProfileSettingsUpdate:
 *       $ref: '#/components/schemas/IPartnerProfileSettings'
 */

export type IPartnerProfileSettingsUpdate = Partial<
  Omit<IPartnerProfileSettings, 'globalSettingsId' | 'partnerId'>
>;

/**
 * Convert partner settings data model to domain model
 */
export const toPartnerSettingsDomain = (
  settings: any
): IPartnerProfileSettings => {
  return {
    partnerId: settings.partnerId,
    notificationsEnabled: settings.notificationsEnabled,
    emailNotifications: settings.emailNotifications,
    pushNotifications: settings.pushNotifications,
    jobAlerts: settings.jobAlerts,
    candidateAlerts: settings.candidateAlerts,
    applicationAlerts: settings.applicationAlerts,
    privacySettings: settings.privacySettings
      ? typeof settings.privacySettings === 'string'
        ? JSON.parse(settings.privacySettings)
        : settings.privacySettings
      : undefined,
    brandingSettings: settings.brandingSettings
      ? typeof settings.brandingSettings === 'string'
        ? JSON.parse(settings.brandingSettings)
        : settings.brandingSettings
      : undefined,
    integrationSettings: settings.integrationSettings
      ? typeof settings.integrationSettings === 'string'
        ? JSON.parse(settings.integrationSettings)
        : settings.integrationSettings
      : undefined,
    globalSettingsId: settings.globalSettingsId,
  };
};
