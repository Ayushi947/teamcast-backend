/**
 * @openapi
 * components:
 *   schemas:
 *     IClientProfileSettings:
 *       type: object
 *       properties:
 *         notificationsEnabled:
 *           type: boolean
 *           description: Controls whether notifications are enabled for the client
 *         emailNotifications:
 *           type: boolean
 *           description: Controls whether email notifications are enabled for the client
 *         pushNotifications:
 *           type: boolean
 *           description: Controls whether push notifications are enabled for the client
 *         jobAlerts:
 *           type: boolean
 *           description: Controls whether job alerts are enabled for the client
 *         candidateAlerts:
 *           type: boolean
 *           description: Controls whether candidate alerts are enabled for the client
 *         applicationAlerts:
 *           type: boolean
 *           description: Controls whether application alerts are enabled for the client
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

export interface IClientProfileSettings {
  clientId: string;
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
 *     IClientProfileSettingsUpdate:
 *       $ref: '#/components/schemas/IClientProfileSettings'
 */

export type IClientProfileSettingsUpdate = Partial<IClientProfileSettings>;

/**
 * Convert client settings data model to domain model
 */
export const toClientSettingsDomain = (
  settings: any
): IClientProfileSettings => {
  return {
    clientId: settings.clientId,
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
