import { BaseEmailTemplate, EmailTemplateData } from './base.template';

export interface SupportJobPostingInviteEmailData extends EmailTemplateData {
  name: string;
  inviterName: string;
  jobTitle: string;
  companyName: string;
  invitationUrl: string;
  expiryHours: number;
  jobDescription?: string;
  requirements?: string[];
  benefits?: string[];
}

export class SupportJobPostingInviteEmailTemplate extends BaseEmailTemplate {
  constructor(data: SupportJobPostingInviteEmailData) {
    super(data);
  }

  protected getSubject(): string {
    const { jobTitle, companyName } = this
      .data as SupportJobPostingInviteEmailData;
    return `Exclusive Job Opportunity: ${jobTitle} at ${companyName} - Teamcast`;
  }

  protected getTemplate(): string {
    const { name, inviterName, jobTitle, companyName, invitationUrl } = this
      .data as SupportJobPostingInviteEmailData;

    return `
      <tr>
        <td align="center" style="padding: 32px 24px;" class="content-padding">
          <h1 style="color: #111827; font-size: 28px; font-weight: 600; margin-bottom: 16px; text-align: center; line-height: 1.25;">
            Exclusive Job Opportunity!
          </h1>
          
          ${this.createStatusContainer('🎯', 'Exclusive Invitation', `Hi ${name}, ${inviterName} has identified you as a perfect match for an exciting opportunity at ${companyName}.`, 'success')}

          <!-- Simple Job Invitation Message -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
            <p style="color: #1e293b; font-size: 18px; font-weight: 500; margin-bottom: 16px; line-height: 1.5;">
              Teamcast has invited you as <strong>"${jobTitle}"</strong>
            </p>
            <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin-bottom: 0;">
              Click the button below to sign up now and start your application process.
            </p>
          </div>

          ${this.createButton('Accept Invite', invitationUrl, 'primary')}

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

          <!-- Why This Invitation Matters -->
          ${this.createInfoCard(
            '⭐ Why You Were Selected',
            'Our AI-powered matching system has identified you as an ideal candidate for this role. The hiring team at Teamcast has specifically selected you based on your skills, experience, and profile match.',
            'highlight'
          )}





          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0; text-align: center;">
            We look forward to learning more about you, ${name}!
          </p>
        </td>
      </tr>
    `;
  }

  render(): { subject: string; html: string; text: string } {
    const { name, inviterName, jobTitle, invitationUrl, expiryHours } = this
      .data as SupportJobPostingInviteEmailData;
    const baseRender = super.render();

    const text = `Exclusive Job Opportunity!

Hi ${name},

${inviterName} has identified you as a perfect match for an exciting opportunity at Teamcast.

Teamcast has invited you as "${jobTitle}"

Click the link below to sign up now and start your application process:
${invitationUrl}

What's Next?
1. Review the complete job description and requirements
2. Submit your application with relevant documents
3. Complete any required assessments or screening
4. Participate in interviews if selected to proceed

Why You Were Selected:
Our AI-powered matching system has identified you as an ideal candidate for this role. The hiring team at Teamcast has specifically selected you based on your skills, experience, and profile match.

Important Information:
• This invitation expires in ${expiryHours} hours
• You'll have priority consideration for this role
• Contact ${inviterName} if you have questions
• Your application will be reviewed promptly

Why Teamcast?
• Intelligent: AI-powered candidate matching
• Efficient: Streamlined hiring workflows
• Reliable: Enterprise-level performance and innovation

Need assistance? Contact our support team at support@teamcast.ai

We look forward to learning more about you!

Best regards,
The Teamcast Team`;

    return {
      subject: baseRender.subject,
      html: baseRender.html,
      text,
    };
  }
}
