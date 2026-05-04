import { BaseEmailTemplate, EmailTemplateData } from './base.template';

export interface ClientSignupEmailData extends EmailTemplateData {
  name: string;
  companyName: string;
  verificationUrl: string;
}

export class ClientSignupEmailTemplate extends BaseEmailTemplate {
  constructor(data: ClientSignupEmailData) {
    super(data);
  }

  protected getSubject(): string {
    return 'Welcome to Teamcast - Verify your account';
  }

  protected getTemplate(): string {
    const { name, companyName, verificationUrl } = this
      .data as ClientSignupEmailData;

    return `
      <tr>
        <td align="center" style="padding: 32px 24px;" class="content-padding">
          <h1 style="color: #111827; font-size: 28px; font-weight: 600; margin-bottom: 16px; text-align: center; line-height: 1.25;">
            Welcome to Teamcast!
          </h1>

          ${this.createStatusContainer('🎉', 'Account Created Successfully', `Hi ${name}, welcome to Teamcast!<br><br>Thank you for choosing us to help ${companyName} find exceptional talent. Your company account has been created successfully and is ready to be activated.<br><br>To get started, please verify your email address by clicking the button below.`, 'success')}

          <!-- Company Information -->
          ${this.createInfoCard(
            '💼 Account Details',
            `<strong>Company:</strong> ${companyName}<br><strong>Status:</strong> <span style="color: #f59e0b; font-weight: 600;">Pending Email Verification</span><br><strong>Account Type:</strong> Client Organization`,
            'highlight'
          )}

          ${this.createButton('Verify Email Address', verificationUrl, 'primary')}

          <!-- Alternative verification link -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin: 24px 0;">
            <tr>
              <td style="padding: 16px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;">
                <div style="color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                  <strong>Button not working?</strong><br>
                  Copy and paste this link into your browser:<br>
                  <a href="${verificationUrl}" style="color: #3b82f6; word-break: break-all; font-size: 13px;">${verificationUrl}</a>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
  }

  render(): { subject: string; html: string; text: string } {
    const { name, verificationUrl } = this.data as ClientSignupEmailData;
    const baseRender = super.render();

    const text = `Welcome to Teamcast!

Hi ${name},

Your account has been created successfully and is ready to be activated.

Please verify your email address by clicking the link below:
${verificationUrl}

What's Next?
1. Verify your email address
2. Complete your company profile and preferences
3. Create your first job posting
4. Discover qualified candidates

Need assistance? Contact our support team at support@teamcast.ai

Best regards,
The Teamcast Team`;

    return {
      subject: baseRender.subject,
      html: baseRender.html,
      text,
    };
  }
}
