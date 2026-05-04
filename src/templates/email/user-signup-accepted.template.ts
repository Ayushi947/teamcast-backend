import { BaseEmailTemplate, EmailTemplateData } from './base.template';

export interface UserSignupAcceptedData extends EmailTemplateData {
  name: string;
  inviterName: string;
  companyName: string;
  role: string;
  dashboardUrl: string;
  acceptedDate: string;
}

export class UserSignupAcceptedEmailTemplate extends BaseEmailTemplate {
  protected getSubject(): string {
    return 'Welcome to {{params.companyName}} - Your Account is Ready';
  }

  protected getTemplate(): string {
    return `
      <tr>
        <td align="center" style="padding:25px 30px;" class="content-padding">
          <h1 style="color:#2c3e50;font-size:28px;font-weight:600;margin-bottom:20px;text-align:center;line-height:1.2;">
            Welcome to Teamcast!
          </h1>
          <p style="color:#5a6c7d;font-size:16px;line-height:1.6;margin-bottom:30px;text-align:center;">
            Hi {{params.name}}, congratulations! You've successfully joined {{params.companyName}} on Teamcast. Your account is now active and ready to use.
          </p>
          ${this.createStatusContainer('✅', 'Account Activated', "You're all set to start using Teamcast", 'success')}
          <!-- Account Details -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;background-color:#f0fdf4;border:1px solid #22c55e;border-radius:8px;margin:30px 0;">
            <tr>
              <td align="center" style="padding:25px;">
                <div style="color:#16a34a;font-size:18px;font-weight:600;margin-bottom:15px;">
                  🎉 Account Details
                </div>
                <div style="color:#15803d;font-size:16px;line-height:1.8;">
                  <strong>Company:</strong> {{params.companyName}}<br>
                  <strong>Role:</strong> {{params.role}}<br>
                  <strong>Invited By:</strong> {{params.inviterName}}<br>
                  <strong>Activated:</strong> {{params.acceptedDate}}
                </div>
              </td>
            </tr>
          </table>
          ${this.getWelcomeFeatures()}
          ${this.createButton('Access Dashboard', '{{params.dashboardUrl}}', 'primary')}
          <!-- Alternative Link -->
          <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:30px 0;text-align:center;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="{{params.dashboardUrl}}" style="color:#667eea;text-decoration:underline;word-break:break-all;">{{params.dashboardUrl}}</a>
          </p>
          ${this.getGettingStarted()}
          <!-- Need Help Section -->
          <p style="color:#5a6c7d;font-size:14px;line-height:1.6;margin:30px 0;text-align:center;">
            Need help getting started? Contact {{params.inviterName}} or our support team at 
            <a href="mailto:support@teamcast.ai" style="color:#667eea;text-decoration:none;">support@teamcast.ai</a>
          </p>
          <p style="color:#5a6c7d;font-size:14px;line-height:1.6;margin:20px 0;text-align:center;">
            Happy hiring, {{params.name}}! 🚀
          </p>
        </td>
      </tr>
    `;
  }

  private getWelcomeFeatures(): string {
    return `
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f0fdf4; border: none !important; border-radius: 12px; margin: 32px 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);">
        <tr>
          <td align="center" style="padding: 32px 24px;">
            <div style="color: #1f2937; font-size: 20px; font-weight: 600; margin-bottom: 20px;">
              ✨ What You Can Do Now
            </div>
            <div style="color: #4b5563; font-size: 16px; line-height: 1.6; text-align: left;">
              • Create and manage job postings<br>
              • Review candidate applications<br>
              • Conduct AI-powered assessments<br>
              • Collaborate with your team<br>
              • Access analytics and insights<br>
              • Customize your hiring workflow
            </div>
          </td>
        </tr>
      </table>
    `;
  }

  private getGettingStarted(): string {
    return `
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;margin:10px 0;">
        <tr>
          <td align="center">
            <h2 style="color:#2c3e50;font-size:20px;font-weight:600;margin-bottom:20px;text-align:center;line-height:1.2;">Getting Started Guide</h2>
          </td>
        </tr>
        <tr>
          <td align="left" style="padding-top:10px;padding-bottom:5px;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;background-color:#f0fdf4;border-radius:8px;">
              <tr>
                <td class="feature-item-cell" style="padding:15px;">
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
                    <tr>
                      <td valign="middle" style="padding-left:15px;color:#16a34a;font-size:14px;line-height:1.5;">
                        <strong>🎯 Step 1:</strong> Complete your profile and preferences
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="left" style="padding-top:10px;padding-bottom:5px;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;background-color:#f8fafc;border-radius:8px;">
              <tr>
                <td class="feature-item-cell" style="padding:15px;">
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
                    <tr>
                      <td valign="middle" style="padding-left:15px;color:#5a6c7d;font-size:14px;line-height:1.5;">
                        <strong>📝 Step 2:</strong> Create your first job posting
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="left" style="padding-top:10px;padding-bottom:5px;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;background-color:#f8fafc;border-radius:8px;">
              <tr>
                <td class="feature-item-cell" style="padding:15px;">
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
                    <tr>
                      <td valign="middle" style="padding-left:15px;color:#5a6c7d;font-size:14px;line-height:1.5;">
                        <strong>🤖 Step 3:</strong> Set up AI assessment criteria
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="left" style="padding-top:10px;padding-bottom:5px;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;background-color:#f8fafc;border-radius:8px;">
              <tr>
                <td class="feature-item-cell" style="padding:15px;">
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
                    <tr>
                      <td valign="middle" style="padding-left:15px;color:#5a6c7d;font-size:14px;line-height:1.5;">
                        <strong>👥 Step 4:</strong> Invite team members to collaborate
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;
  }
}
