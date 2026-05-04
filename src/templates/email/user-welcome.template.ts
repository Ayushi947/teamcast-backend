import { BaseEmailTemplate, EmailTemplateData } from './base.template';

export interface UserWelcomeData extends EmailTemplateData {
  name: string;
  userType: 'candidate' | 'client' | 'partner';
  dashboardUrl: string;
  profileUrl: string;
  helpUrl: string;
}

export class UserWelcomeEmailTemplate extends BaseEmailTemplate {
  protected getSubject(): string {
    return "Welcome to Teamcast - Let's Get Started!";
  }

  protected getTemplate(): string {
    return `
      <tr>
        <td align="center" style="padding:25px 30px;" class="content-padding">
          <h1 style="color:#2c3e50;font-size:28px;font-weight:600;margin-bottom:20px;text-align:center;line-height:1.2;">
            Welcome to Teamcast!
          </h1>
          <p style="color:#5a6c7d;font-size:16px;line-height:1.6;margin-bottom:30px;text-align:center;">
            Hi {{params.name}}, welcome to Teamcast! We're excited to have you join our platform and help you ${this.getUserTypeMessage()}.
          </p>
          ${this.createStatusContainer('🎉', 'Account Created', 'Your account is ready to use', 'info')}
          <!-- Welcome Message -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;background-color:#f0fdf4;border:1px solid #22c55e;border-radius:8px;margin:30px 0;">
            <tr>
              <td align="center" style="padding:25px;">
                <div style="color:#16a34a;font-size:18px;font-weight:600;margin-bottom:15px;">
                  🚀 Ready to Get Started?
                </div>
                <div style="color:#15803d;font-size:16px;line-height:1.8;">
                  Your account has been successfully created and you're all set to explore the amazing features Teamcast has to offer.
                </div>
              </td>
            </tr>
          </table>
          ${this.getUserTypeFeatures()}
          ${this.createButton('Access Dashboard', '{{params.dashboardUrl}}', 'primary')}
          <!-- Alternative Link -->
          <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:30px 0;text-align:center;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="{{params.dashboardUrl}}" style="color:#667eea;text-decoration:underline;word-break:break-all;">{{params.dashboardUrl}}</a>
          </p>
          <!-- Need Help Section -->
          <p style="color:#5a6c7d;font-size:14px;line-height:1.6;margin:30px 0;text-align:center;">
            Need help getting started? Check out our 
            <a href="{{params.helpUrl}}" style="color:#667eea;text-decoration:none;">help center</a> or contact our support team at 
            <a href="mailto:support@teamcast.ai" style="color:#667eea;text-decoration:none;">support@teamcast.ai</a>
          </p>
          <p style="color:#5a6c7d;font-size:14px;line-height:1.6;margin:20px 0;text-align:center;">
            Welcome aboard, {{params.name}}! We can't wait to see what you'll accomplish with Teamcast. 🚀
          </p>
        </td>
      </tr>
    `;
  }

  private getUserTypeMessage(): string {
    switch (this.data.userType) {
      case 'candidate':
        return 'find your dream job';
      case 'client':
        return 'find the perfect candidates';
      case 'partner':
        return 'grow your business';
      default:
        return 'achieve your goals';
    }
  }

  private getUserTypeFeatures(): string {
    switch (this.data.userType) {
      case 'candidate':
        return this.getCandidateFeatures();
      case 'client':
        return this.getClientFeatures();
      case 'partner':
        return this.getPartnerFeatures();
      default:
        return this.getGeneralFeatures();
    }
  }

  private getCandidateFeatures(): string {
    return `
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f0f9ff; border: none !important; border-radius: 12px; margin: 32px 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);">
        <tr>
          <td align="center" style="padding: 32px 24px;">
            <div style="color: #1f2937; font-size: 20px; font-weight: 600; margin-bottom: 20px;">
              ✨ What You Can Do as a Candidate
            </div>
            <div style="color: #4b5563; font-size: 16px; line-height: 1.6; text-align: left;">
              • Browse and apply to job opportunities<br>
              • Take AI-powered skill assessments<br>
              • Build a comprehensive profile<br>
              • Receive personalized job recommendations<br>
              • Track your application progress<br>
              • Connect with potential employers
            </div>
          </td>
        </tr>
      </table>
    `;
  }

  private getClientFeatures(): string {
    return `
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f0fdf4; border: none !important; border-radius: 12px; margin: 32px 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);">
        <tr>
          <td align="center" style="padding: 32px 24px;">
            <div style="color: #1f2937; font-size: 20px; font-weight: 600; margin-bottom: 20px;">
              ✨ What You Can Do as a Client
            </div>
            <div style="color: #4b5563; font-size: 16px; line-height: 1.6; text-align: left;">
              • Post and manage job openings<br>
              • Review candidate applications<br>
              • Conduct AI-powered assessments<br>
              • Access detailed analytics and insights<br>
              • Collaborate with your hiring team<br>
              • Streamline your hiring process
            </div>
          </td>
        </tr>
      </table>
    `;
  }

  private getPartnerFeatures(): string {
    return `
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f5f3ff; border: none !important; border-radius: 12px; margin: 32px 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);">
        <tr>
          <td align="center" style="padding: 32px 24px;">
            <div style="color: #1f2937; font-size: 20px; font-weight: 600; margin-bottom: 20px;">
              ✨ What You Can Do as a Partner
            </div>
            <div style="color: #4b5563; font-size: 16px; line-height: 1.6; text-align: left;">
              • Access exclusive job opportunities<br>
              • Manage client relationships<br>
              • Track placement success<br>
              • Access advanced recruitment tools<br>
              • Generate detailed reports<br>
              • Scale your recruitment business
            </div>
          </td>
        </tr>
      </table>
    `;
  }

  private getGeneralFeatures(): string {
    return `
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f8fafc; border: none !important; border-radius: 12px; margin: 32px 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);">
        <tr>
          <td align="center" style="padding: 32px 24px;">
            <div style="color: #1f2937; font-size: 20px; font-weight: 600; margin-bottom: 20px;">
              ✨ Platform Features
            </div>
            <div style="color: #4b5563; font-size: 16px; line-height: 1.6; text-align: left;">
              • AI-powered matching and assessments<br>
              • Real-time notifications and updates<br>
              • Comprehensive analytics and insights<br>
              • Secure and user-friendly interface<br>
              • Mobile-responsive design<br>
              • 24/7 customer support
            </div>
          </td>
        </tr>
      </table>
    `;
  }
}
