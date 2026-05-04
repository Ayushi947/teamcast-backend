import { BaseEmailTemplate, EmailTemplateData } from './base.template';

export interface UserSignupInviteData extends EmailTemplateData {
  name: string;
  inviterName: string;
  inviterEmail: string;
  companyName: string;
  role: string;
  inviteUrl: string;
  expiryHours: number;
}

export class UserSignupInviteEmailTemplate extends BaseEmailTemplate {
  protected getSubject(): string {
    return "You're Invited to Join {{params.companyName}} on Teamcast";
  }

  protected getTemplate(): string {
    return `
      <tr>
        <td align="center" style="padding:25px 30px;" class="content-padding">
          <h1 style="color:#2c3e50;font-size:28px;font-weight:600;margin-bottom:20px;text-align:center;line-height:1.2;">
            You're Invited to Join Teamcast
          </h1>
          
          <p style="color:#5a6c7d;font-size:16px;line-height:1.6;margin-bottom:30px;text-align:center;">
            Hi {{params.name}}, {{params.inviterName}} has invited you to join Teamcast. Click the button below to get started.
          </p>

          ${this.createButton('Accept Invitation', '{{params.inviteUrl}}', 'primary')}

          <!-- Alternative Link -->
          <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:30px 0;text-align:center;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="{{params.inviteUrl}}" style="color:#667eea;text-decoration:underline;word-break:break-all;">{{params.inviteUrl}}</a>
          </p>

          ${this.getInvitationInfo()}

          <!-- Need Help Section -->
          <p style="color:#5a6c7d;font-size:14px;line-height:1.6;margin:30px 0;text-align:center;">
            Have questions about this invitation? Contact {{params.inviterName}} or our support team at 
            <a href="mailto:support@teamcast.ai" style="color:#667eea;text-decoration:none;">support@teamcast.ai</a>
          </p>

          <p style="color:#5a6c7d;font-size:14px;line-height:1.6;margin:20px 0;text-align:center;">
            Welcome to Teamcast, {{params.name}}! 🚀
          </p>
        </td>
      </tr>
    `;
  }

  private getPlatformFeatures(): string {
    return `
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f0fdf4; border: none !important; border-radius: 12px; margin: 32px 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);">
        <tr>
          <td align="center" style="padding: 32px 24px;">
            <div style="color: #1f2937; font-size: 20px; font-weight: 600; margin-bottom: 20px;">
              ✨ What You'll Get Access To
            </div>
            <div style="color: #4b5563; font-size: 16px; line-height: 1.6; text-align: left;">
              • AI-powered candidate assessments<br>
              • Advanced job posting and management<br>
              • Real-time analytics and insights<br>
              • Collaborative hiring workflows<br>
              • Integrated communication tools<br>
              • Comprehensive candidate profiles
            </div>
          </td>
        </tr>
      </table>
    `;
  }

  private getInvitationInfo(): string {
    return `
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;margin:10px 0;">
        <tr>
          <td align="center">
            <h2 style="color:#2c3e50;font-size:20px;font-weight:600;margin-bottom:20px;text-align:center;line-height:1.2;">Getting Started</h2>
          </td>
        </tr>
        <tr>
          <td align="left" style="padding-top:10px;padding-bottom:5px;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;background-color:#fef3f2;border-radius:8px;">
              <tr>
                <td class="feature-item-cell" style="padding:15px;">
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
                    <tr>
                      <td valign="middle" style="padding-left:15px;color:#dc2626;font-size:14px;line-height:1.5;">
                        <strong>⏰ Time Sensitive:</strong> Accept the invitation within {{params.expiryHours}} hours
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
                        <strong>🔐 Secure Setup:</strong> Create your account with a strong password
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
                        <strong>📚 Quick Start:</strong> Complete the onboarding tutorial to get familiar
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
                        <strong>👥 Team Access:</strong> Connect with your team members and start collaborating
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
