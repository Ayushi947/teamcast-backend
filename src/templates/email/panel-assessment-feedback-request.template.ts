import { BaseEmailTemplate, EmailTemplateData } from './base.template';

export interface PanelAssessmentFeedbackRequestData extends EmailTemplateData {
  panelMemberName: string;
  candidateName: string;
  jobTitle: string;
  companyName: string;
  feedbackUrl: string;
  expiryHours: number;
}

export class PanelAssessmentFeedbackRequestEmailTemplate extends BaseEmailTemplate {
  constructor(data: PanelAssessmentFeedbackRequestData) {
    super(data);
  }

  protected getSubject(): string {
    const { candidateName, jobTitle, companyName } = this
      .data as PanelAssessmentFeedbackRequestData;
    return `Panel Assessment Feedback Request - ${candidateName} for ${jobTitle} at ${companyName}`;
  }

  protected getTemplate(): string {
    const {
      panelMemberName,
      candidateName,
      jobTitle,
      companyName,
      feedbackUrl,
      expiryHours,
    } = this.data as PanelAssessmentFeedbackRequestData;

    return `
      <tr>
        <td align="center" style="padding: 32px 24px;" class="content-padding">
          <h1 style="color: #111827; font-size: 28px; font-weight: 600; margin-bottom: 16px; text-align: center; line-height: 1.25;">
            Panel Assessment Feedback Request
          </h1>
         
          ${this.createStatusContainer(
            '✅',
            'Assessment Feedback Required',
            `Hi ${panelMemberName}! As a panel member, please provide feedback for a candidate assessment. Your expert evaluation is crucial in helping us make the best hiring decision. Please provide your comprehensive feedback within the next ${expiryHours} hours.`,
            'info'
          )}

          ${this.createInfoCard(
            'Assessment Information',
            `<strong>Candidate:</strong> ${candidateName}<br><strong>Position:</strong> ${jobTitle}<br><strong>Company:</strong> ${companyName}<br><br><strong>Important Reminder:</strong> Please complete your feedback within ${expiryHours} hours to ensure the hiring process proceeds smoothly. Your timely response is greatly appreciated.`,
            'highlight'
          )}

          ${this.createButton('Provide Feedback', feedbackUrl, 'primary')}

          <!-- Alternative feedback link -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin: 24px 0;">
            <tr>
              <td style="padding: 16px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;">
                <div style="color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                  <strong>Button not working?</strong><br>
                  Copy and paste this link into your browser:<br>
                  <a href="${feedbackUrl}" style="color: #3b82f6; word-break: break-all; font-size: 13px;">${feedbackUrl}</a>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
  }
}
