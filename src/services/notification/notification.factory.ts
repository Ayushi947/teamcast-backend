import { singleton } from '@/shared/decorators/singleton';
import { BrevoProvider } from './brevo.service';
import { NodemailerProvider } from './nodemailer.service';
import { INotificationProvider } from './notification.interface';
import { ENV } from '@/config/env';

export enum NotificationProvider {
  SMTP = 'smtp',
  BREVO = 'brevo',
}

@singleton
export class NotificationFactory {
  /**
   * Returns the appropriate notification service implementation based on configuration
   * Defaults to Nodemailer (SMTP) to use extensive email templates
   */
  getNotificationProvider(): INotificationProvider {
    const provider = (
      ENV.NOTIFICATION_PROVIDER || NotificationProvider.SMTP
    ).toLowerCase();

    switch (provider) {
      case NotificationProvider.BREVO:
        return new BrevoProvider();
      case NotificationProvider.SMTP:
      default:
        return new NodemailerProvider();
    }
  }
}
