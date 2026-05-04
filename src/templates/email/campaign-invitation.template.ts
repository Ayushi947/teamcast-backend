import { BaseEmailTemplate, EmailTemplateData } from './base.template';

export interface CampaignInvitationEmailData extends EmailTemplateData {
  name: string;
  inviterName: string;
  invitationUrl: string;
  jobTitle?: string;
}

export class CampaignInvitationEmailTemplate extends BaseEmailTemplate {
  constructor(data: CampaignInvitationEmailData) {
    super(data);
  }

  protected getSubject(): string {
    return 'Unlock Your Career Growth with Teamcast – Get Started Today!';
  }

  protected getTemplate(): string {
    const { name, invitationUrl } = this.data as CampaignInvitationEmailData;

    return `
      <tr>
        <td align="center" style="padding: 32px 24px;" class="content-padding">
          <h1 style="color: #111827; font-size: 28px; font-weight: 600; margin-bottom: 16px; text-align: center; line-height: 1.25;">
          Start Building Your Career<br>with Teamcast AI
          </h1>
         
          ${this.createStatusContainer(
            '',
            '',
            `<p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
            Hi <strong>${name}</strong>!  🎉 You've been invited to join Teamcast, an AI-powered talent platform designed to connect professionals with meaningful opportunities. Redefining the way talent meets opportunity, Teamcast helps you present your skills effectively and get matched with the right roles.
          </p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
            With a large network of professionals and companies already active on the platform, Teamcast provides a straightforward way for you to showcase your experience and explore new opportunities.
          </p>`,
            'success'
          )}

          ${this.createButton('Accept Invitation', invitationUrl, 'primary')}

          <!-- Alternative invitation link -->
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
              icon: '✅',
              title: 'Accept your invitation',
              description: 'Click the button above to activate your account',
            },
            {
              icon: '📄',
              title: 'Upload your resume',
              description: 'Share your skills and background',
            },
            {
              icon: '🎯',
              title: 'Complete AI-powered assessments',
              description: 'Highlight your capabilities',
            },
            {
              icon: '💼',
              title: 'Apply & match',
              description: 'Access roles that align with your profile',
            },
          ])}

          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 16px; text-align: left;">
           The faster you complete your profile, the sooner you’ll unlock opportunities tailored just for you.
          </p>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 16px; text-align: left;">
            Let’s build your career with Teamcast. Your future starts today! 
          </p>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0; text-align: left;">
            Best regards,<br>
            Teamcast Talent Team
          </p>
        </td>
      </tr>
    `;
  }

  render(): { subject: string; html: string; text: string } {
    const { name: _name, invitationUrl } = this
      .data as CampaignInvitationEmailData;
    const baseRender = super.render();

    const text = `Start Building Your Career

Accept your invitation here:
${invitationUrl}

What's Next?
1. Accept your invitation by clicking the link above
2. Upload your resume to share your skills and background
3. Complete AI-powered assessments to highlight your capabilities
4. Apply & match with roles that align with your profile

The faster you complete your profile, the sooner you’ll unlock opportunities tailored just for you.

Let’s build your career with Teamcast. Your future starts today! 

Best regards,
Teamcast Talent Team`;

    return {
      subject: baseRender.subject,
      html: baseRender.html,
      text,
    };
  }
}
