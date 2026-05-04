import { BaseEmailTemplate, EmailTemplateData } from './base.template';

export interface ClientJobInviteData extends EmailTemplateData {
  name: string;
  jobTitle: string;
  companyName: string;
  inviterName: string;
  jobUrl: string;
  jobDescription: string;
  location: string;
  salary?: string;
  jobType: string;
}

export class ClientJobInviteEmailTemplate extends BaseEmailTemplate {
  protected getSubject(): string {
    return 'Job Invitation - {{params.jobTitle}} at {{params.companyName}}';
  }

  protected getTemplate(): string {
    return `
      <tr>
        <td align="center" style="padding: 32px 24px;" class="content-padding">
          <h1 style="color: #111827; font-size: 28px; font-weight: 600; margin-bottom: 16px; text-align: center; line-height: 1.25;">
            You're Invited to Apply
          </h1>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
            Hi {{params.name}}, this is your moment! 🌟 <strong>{{params.inviterName}}</strong> from <strong>{{params.companyName}}</strong> has personally invited you to apply for an exclusive opportunity that perfectly matches your exceptional skills and experience. You've been hand-selected from thousands of candidates!
          </p>
          <!-- Job Details -->
          ${this.createInfoCard(
            '💼 Job Details',
            `<strong>Position:</strong> {{params.jobTitle}}<br><strong>Company:</strong> {{params.companyName}}<br><strong>Location:</strong> {{params.location}}<br><strong>Type:</strong> {{params.jobType}}<br>${this.getSalaryDisplay('{{params.salary}}')}`,
            'highlight'
          )}
          <!-- Job Description -->
          ${this.createInfoCard(
            '📝 About This Role',
            '{{params.jobDescription}}',
            'default'
          )}
          ${this.createButton('Apply Now', '{{params.jobUrl}}', 'primary')}
          <!-- Alternative application link -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin: 24px 0;">
            <tr>
              <td style="padding: 16px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;">
                <div style="color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                  <strong>Button not working?</strong><br>
                  Copy and paste this link into your browser:<br>
                  <a href="{{params.jobUrl}}" style="color: #3b82f6; word-break: break-all; font-size: 13px;">{{params.jobUrl}}</a>
                </div>
              </td>
            </tr>
          </table>
          ${this.getInvitationInfo()}
        </td>
      </tr>
    `;
  }

  private getSalaryDisplay(salary: string): string {
    if (!salary) return '';
    return `<strong style="color: #1f2937;">Salary:</strong> ${salary}<br>`;
  }

  private getInvitationInfo(): string {
    return this.createWhatsNextSection([
      {
        icon: '🎯',
        title: 'Perfect Match',
        description:
          'Your skills and experience align perfectly with this role',
      },
      {
        icon: '⭐',
        title: 'High Priority',
        description:
          'This invitation indicates strong interest from the hiring team',
      },
      {
        icon: '🚀',
        title: 'Fast Track',
        description: 'Personal invitations often receive priority review',
      },
    ]);
  }
}
