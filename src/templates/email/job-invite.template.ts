import { BaseEmailTemplate, EmailTemplateData } from './base.template';

export interface JobInviteEmailData extends EmailTemplateData {
  name: string;
  companyName: string;
  inviterName: string;
  jobTitle: string;
  invitationUrl: string;
  expiryHours: number;
}

export class JobInviteEmailTemplate extends BaseEmailTemplate {
  constructor(data: JobInviteEmailData) {
    super(data);
  }

  protected getSubject(): string {
    const { jobTitle, companyName } = this.data as JobInviteEmailData;
    return `You're invited to apply: ${jobTitle} at ${companyName}`;
  }

  protected getTemplate(): string {
    const {
      name,
      companyName,
      inviterName,
      jobTitle,
      invitationUrl,
      expiryHours,
    } = this.data as JobInviteEmailData;

    return `
      <tr>
        <td align="center" style="padding: 32px 24px;" class="content-padding">
          <h1 style="color: #111827; font-size: 28px; font-weight: 600; margin-bottom: 16px; text-align: center; line-height: 1.25;">
            You're Invited to Apply!
          </h1>
          
          ${this.createStatusContainer('✅', 'Personal Invitation', `Hi ${name}, congratulations! ${inviterName} from ${companyName} has personally invited you to apply for an exclusive, high-priority opportunity that perfectly aligns with your exceptional skills and career aspirations. You're among the select few chosen from our talent pool of 500,000+ professionals!`, 'success')}

          <!-- Job Details -->
          ${this.createInfoCard(
            'Opportunity Details',
            `<strong>Position:</strong> ${jobTitle}<br><strong>Company:</strong> ${companyName}<br><strong>Invited By:</strong> ${inviterName}<br><strong>Application Deadline:</strong> ${expiryHours} hours`,
            'highlight'
          )}

          ${this.createButton('View Job & Apply', invitationUrl, 'primary')}

          <!-- Alternative application link -->
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

          ${this.createWhatsNextSection([
            {
              icon: '📋',
              title: 'Review Job Details',
              description: 'Read the complete job description and requirements',
            },
            {
              icon: '📄',
              title: 'Submit Application',
              description: 'Complete your application with relevant documents',
            },
            {
              icon: '🤖',
              title: 'AI Assessment',
              description: 'Complete any required assessments or screening',
            },
            {
              icon: '🤝',
              title: 'Interview Process',
              description: 'Participate in interviews if selected to proceed',
            },
          ])}
        </td>
      </tr>
    `;
  }

  render(): { subject: string; html: string; text: string } {
    const {
      name,
      companyName,
      inviterName,
      jobTitle,
      invitationUrl,
      expiryHours,
    } = this.data as JobInviteEmailData;
    const baseRender = super.render();

    const text = `You're Invited to Apply!

Hi ${name},

${inviterName} from ${companyName} has personally invited you to apply for an exciting opportunity that matches your profile.

Opportunity Details:
• Position: ${jobTitle}
• Company: ${companyName}
• Invited By: ${inviterName}
• Application Deadline: ${expiryHours} hours

View job details and apply here:
${invitationUrl}

What's Next?
1. Review the complete job description and requirements
2. Submit your application with relevant documents
3. Complete any required assessments or screening
4. Participate in interviews if selected to proceed

Best regards,
The Teamcast Team`;

    return {
      subject: baseRender.subject,
      html: baseRender.html,
      text,
    };
  }
}
