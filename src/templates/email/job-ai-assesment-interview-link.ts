import { BaseEmailTemplate, EmailTemplateData } from './base.template';

export interface JobAIAssessmentInterviewLinkData extends EmailTemplateData {
  candidateName: string;
  companyName: string;
  jobTitle: string;
  invitationUrl: string;
  expiryHours: number;
}

export class JobAIAssessmentInterviewLinkEmailTemplate extends BaseEmailTemplate {
  protected getSubject(): string {
    const { jobTitle, companyName } = this
      .data as JobAIAssessmentInterviewLinkData;
    return `Your AI Assessment Link: ${jobTitle} at ${companyName}`;
  }

  protected getTemplate(): string {
    const { candidateName, companyName, jobTitle, invitationUrl, expiryHours } =
      this.data as JobAIAssessmentInterviewLinkData;
    return `
      <tr>
        <td align="center" style="padding: 32px 24px;" class="content-padding">
          <h1 style="color: #111827; font-size: 28px; font-weight: 600; margin-bottom: 16px; text-align: center; line-height: 1.25;">
            Your AI Assessment is Ready!
          </h1>
          
          ${this.createStatusContainer('✅', 'Assessment Ready', `Hi ${candidateName}, we're excited to invite you to complete your AI-powered assessment for the ${jobTitle} position at ${companyName}. Your assessment link is ready and you can start at your convenience.`, 'success')}

          <!-- Assessment Details -->
          ${this.createInfoCard(
            'Assessment Details',
            `<strong>Position:</strong> ${jobTitle}<br><strong>Company:</strong> ${companyName}<br><strong>Link Expires In:</strong> ${expiryHours} hours`,
            'highlight'
          )}

          ${this.createButton('Start Assessment', invitationUrl, 'primary')}

          <!-- Alternative assessment link -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin: 24px 0;">
            <tr>
              <td style="padding: 16px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;">
                <div style="color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                  <strong>Button not working?</strong><br>
                  Copy and paste this link into your browser:<br>
                  <a href="${invitationUrl}" style="color: #3b82f6; word-break: break-all; font-size: 13px;">${invitationUrl}</a>
                </div>
              </td>
            </tr>
          </table>

          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0; text-align: center;">
            Best regards,<br>
            The ${companyName} Team
          </p>
        </td>
      </tr>
    `;
  }

  render(): { subject: string; html: string; text: string } {
    const { candidateName, companyName, jobTitle, invitationUrl, expiryHours } =
      this.data as JobAIAssessmentInterviewLinkData;
    const baseRender = super.render();
    const text = `Your AI Assessment is Ready!
 
Hi ${candidateName},
 
We're excited to invite you to complete your AI-powered assessment for the ${jobTitle} position at ${companyName}.
 
Assessment Details:
• Position: ${jobTitle}
• Company: ${companyName}
• Link Expires In: ${expiryHours} hours
 
Start your assessment here:
${invitationUrl}
 
Best regards,
The ${companyName} Team`;
    return {
      subject: baseRender.subject,
      html: baseRender.html,
      text,
    };
  }
}
