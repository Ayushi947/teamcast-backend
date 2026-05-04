import { BaseEmailTemplate, EmailTemplateData } from './base.template';

export interface PanelAssessmentConfirmationData extends EmailTemplateData {
  name: string;
  candidateName: string;
  jobTitle: string;
  companyName: string;
  selectedSlot: {
    date: string;
    time: string;
    duration: string;
    timezone: string;
  };
  interviewUrl: string;
  assessmentType: string;
}

export class PanelAssessmentConfirmationEmailTemplate extends BaseEmailTemplate {
  protected getSubject(): string {
    return 'Panel Assessment Confirmed - Interview Details';
  }

  protected getTemplate(): string {
    return `
      <tr>
        <td align="center" style="padding: 25px 32px;" class="content-padding">
          <h1 style="color: #1f2937; font-size: 28px; font-weight: 600; margin-bottom: 20px; text-align: center; line-height: 1.2;">
            Panel Assessment Confirmation
          </h1>
          
          <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin-bottom: 32px; text-align: center;">
            Hi {{params.name}}, your panel assessment slot for <strong style="color: #1f2937;">{{params.candidateName}}</strong> for the <strong style="color: #1f2937;">{{params.jobTitle}}</strong> position at <strong style="color: #1f2937;">{{params.companyName}}</strong> has been confirmed.
          </p>

          ${this.createStatusContainer('✅', 'Slot Confirmed', 'Your interview slot is now reserved', 'success')}

          <!-- Assessment Details -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f8fafc; border: none !important; border-radius: 12px; margin: 32px 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);">
            <tr>
              <td align="center" style="padding: 32px 24px;">
                <div style="color: #1f2937; font-size: 20px; font-weight: 600; margin-bottom: 20px;">
                  📋 Assessment Details
                </div>
                <div style="color: #4b5563; font-size: 16px; line-height: 1.8; text-align: left;">
                  <strong style="color: #1f2937;">Candidate:</strong> {{params.candidateName}}<br>
                  <strong style="color: #1f2937;">Position:</strong> {{params.jobTitle}}<br>
                  <strong style="color: #1f2937;">Company:</strong> {{params.companyName}}<br>
                  <strong style="color: #1f2937;">Assessment Type:</strong> {{params.assessmentType}}<br>
                  <strong style="color: #1f2937;">Slot:</strong> {{params.slot}}
                </div>
              </td>
            </tr>
          </table>

          ${this.createButton('Join Interview', '{{params.interviewUrl}}', 'primary')}

          <p style="color: #9ca3af; font-size: 14px; line-height: 1.5; margin: 32px 0; text-align: center;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="{{params.interviewUrl}}" style="color: #3b82f6; text-decoration: underline; word-break: break-all;">{{params.interviewUrl}}</a>
          </p>

          ${this.getInterviewPreparation()}

          <p style="color: #9ca3af; font-size: 14px; line-height: 1.5; margin: 32px 0; text-align: center;">
            Need technical support? Contact us at 
            <a href="mailto:support@teamcast.ai" style="color: #3b82f6; text-decoration: none; font-weight: 500;">support@teamcast.ai</a>
          </p>

          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0; text-align: center;">
            Good luck with your interview, {{params.name}}! 🍀
          </p>
        </td>
      </tr>
    `;
  }

  private getInterviewPreparation(): string {
    return `
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; margin: 10px 0;">
        <tr>
          <td align="center">
            <h2 style="color: #1f2937; font-size: 22px; font-weight: 600; margin-bottom: 24px; text-align: center; line-height: 1.2;">Interview Preparation</h2>
          </td>
        </tr>
        <tr>
          <td align="left" style="padding-top: 12px; padding-bottom: 6px;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #fef2f2; border-radius: 10px; border: none !important; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);">
              <tr>
                <td class="feature-item-cell" style="padding: 18px;">
                  <div style="color: #dc2626; font-size: 15px; line-height: 1.6;">
                    <strong>⏰ Be On Time:</strong> Join the interview 5 minutes before the scheduled time
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="left" style="padding-top: 12px; padding-bottom: 6px;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f8fafc; border-radius: 10px; border: none !important; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);">
              <tr>
                <td class="feature-item-cell" style="padding: 18px;">
                  <div style="color: #4b5563; font-size: 15px; line-height: 1.6;">
                    <strong>📹 Test Your Setup:</strong> Ensure your camera and microphone are working properly
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="left" style="padding-top: 12px; padding-bottom: 6px;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f8fafc; border-radius: 10px; border: none !important; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);">
              <tr>
                <td class="feature-item-cell" style="padding: 18px;">
                  <div style="color: #4b5563; font-size: 15px; line-height: 1.6;">
                    <strong>🌐 Stable Connection:</strong> Use a reliable internet connection in a quiet environment
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="left" style="padding-top: 12px; padding-bottom: 6px;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f8fafc; border-radius: 10px; border: none !important; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);">
              <tr>
                <td class="feature-item-cell" style="padding: 18px;">
                  <div style="color: #4b5563; font-size: 15px; line-height: 1.6;">
                    <strong>📋 Review:</strong> Go through the job description and your resume before the interview
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;
  }
}
