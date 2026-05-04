import { BaseEmailTemplate, EmailTemplateData } from './base.template';

export interface SupportJobPostingInviteWithdrawnEmailData
  extends EmailTemplateData {
  name: string;
  inviterName: string;
  jobTitle: string;
  companyName: string;
  reason?: string;
}

export class SupportJobPostingInviteWithdrawnEmailTemplate extends BaseEmailTemplate {
  constructor(data: SupportJobPostingInviteWithdrawnEmailData) {
    super(data);
  }

  protected getSubject(): string {
    const { jobTitle, companyName } = this
      .data as SupportJobPostingInviteWithdrawnEmailData;
    return `Job Invitation Withdrawn: ${jobTitle} at ${companyName} - Teamcast`;
  }

  protected getTemplate(): string {
    const { name, inviterName, jobTitle, companyName } = this
      .data as SupportJobPostingInviteWithdrawnEmailData;

    return `
      <tr>
        <td align="center" style="padding: 32px 24px;" class="content-padding">
          <h1 style="color: #111827; font-size: 28px; font-weight: 600; margin-bottom: 16px; text-align: center; line-height: 1.25;">
            Job Invitation Withdrawn
          </h1>
          
          ${this.createStatusContainer('⚠️', 'Invitation Withdrawn', `Hi ${name}, we wanted to inform you that the job invitation for ${jobTitle} at ${companyName} has been withdrawn by ${inviterName}.`, 'warning')}



          ${this.createInfoCard(
            '📋 What This Means',
            '• The job invitation has been cancelled<br>• You can no longer apply through this specific invitation<br>• The position may still be available through other channels<br>• Your profile remains active for future opportunities',
            'default'
          )}





          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0; text-align: center;">
            Thank you for your interest in joining our team, ${name}. We appreciate your understanding.
          </p>
        </td>
      </tr>
    `;
  }

  render(): { subject: string; html: string; text: string } {
    const { name, inviterName, jobTitle, companyName, reason } = this
      .data as SupportJobPostingInviteWithdrawnEmailData;
    const baseRender = super.render();

    const text = `Job Invitation Withdrawn

Hi ${name},

We wanted to inform you that the job invitation for ${jobTitle} at ${companyName} has been withdrawn by ${inviterName}.

The invitation for "${jobTitle}" has been withdrawn.

What This Means:
• The job invitation has been cancelled
• You can no longer apply through this specific invitation
• The position may still be available through other channels
• Your profile remains active for future opportunities

${
  reason
    ? `Additional Information:
${reason}

`
    : ''
}Explore Other Opportunities:
Your profile is still active in our system. You may be considered for other suitable positions that match your skills and experience.

Why Teamcast?
• Intelligent: AI-powered candidate matching
• Efficient: Streamlined hiring workflows
• Reliable: Enterprise-level performance and innovation

Need assistance? Contact our support team at support@teamcast.ai

Thank you for your interest in joining our team. We appreciate your understanding.

Best regards,
The Teamcast Team`;

    return {
      subject: baseRender.subject,
      html: baseRender.html,
      text,
    };
  }
}
