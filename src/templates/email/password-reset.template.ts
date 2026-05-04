import { BaseEmailTemplate, EmailTemplateData } from './base.template';
import { UserTypeEnum } from '@/shared/models/common/enums';

export interface PasswordResetEmailData extends EmailTemplateData {
  name: string;
  resetUrl: string;
  userType?: UserTypeEnum;
}

export class PasswordResetEmailTemplate extends BaseEmailTemplate {
  protected getSubject(): string {
    return 'Reset your password - Teamcast';
  }

  protected getTemplate(): string {
    const { name, resetUrl } = this.data as PasswordResetEmailData;

    return `
      <tr>
        <td align="center" style="padding: 32px 24px;" class="content-padding">
          <h1 style="color: #111827; font-size: 28px; font-weight: 600; margin-bottom: 16px; text-align: center; line-height: 1.25;">
            Reset Your Password
          </h1>
          
          ${this.createStatusContainer(
            '🔐',
            'Password Reset Required',
            `<p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
            Hi ${name}! We received a request to reset your password for your Teamcast account.
          </p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
            Click the button below to create a new secure password for your account.
          </p>`,
            'warning'
          )}

          ${this.createButton('Reset Password', resetUrl, 'primary')}

          <!-- Alternative reset link -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin: 24px 0;">
            <tr>
              <td style="padding: 16px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;">
                <div style="color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                  <strong>Button not working?</strong><br>
                  Copy and paste this link into your browser:<br>
                  <a href="${resetUrl}" style="color: #3b82f6; word-break: break-all; font-size: 13px;">${resetUrl}</a>
                </div>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    `;
  }

  render(): { subject: string; html: string; text: string } {
    const { name, resetUrl } = this.data as PasswordResetEmailData;
    const baseRender = super.render();

    const text = `Reset Your Password - Teamcast

Hi ${name}! We received a request to reset your password for your Teamcast account.

Reset your password here:
${resetUrl}

What's Next?
1. Click the reset link above
2. Create a new secure password
3. Sign in to your account with the new password

Best regards,
The Teamcast Team`;

    return {
      subject: baseRender.subject,
      html: baseRender.html,
      text,
    };
  }
}
