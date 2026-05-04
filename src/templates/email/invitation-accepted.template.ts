import { BaseEmailTemplate, EmailTemplateData } from './base.template';
import { ENV } from '@/config/env';

export interface InvitationAcceptedEmailData extends EmailTemplateData {
  inviterName: string;
  acceptedByName: string;
  companyName: string;
  role: string;
  userType: 'partner' | 'client';
  acceptedDate?: string;
}

export class InvitationAcceptedEmailTemplate extends BaseEmailTemplate {
  protected getSubject(): string {
    const userTypeLabel =
      this.data.userType === 'partner' ? 'Partner' : 'Client';
    return `${userTypeLabel} Invitation Accepted - ${this.data.acceptedByName} Joined Your Team`;
  }

  protected getTemplate(): string {
    const {
      inviterName,
      acceptedByName,
      companyName,
      role,
      userType,
      acceptedDate,
    } = this.data as InvitationAcceptedEmailData;

    // Determine dashboard URL based on user type
    const dashboardUrl =
      userType === 'partner'
        ? `${ENV.FRONTEND_URL}/app/partner/dashboard`
        : `${ENV.FRONTEND_URL}/app/client/dashboard`;

    return `
      <tr>
        <td align="center" style="padding: 32px 24px;" class="content-padding">
          <h1 style="color: #111827; font-size: 28px; font-weight: 600; margin-bottom: 16px; text-align: center; line-height: 1.25;">
            Invitation Accepted!
          </h1>
          
          ${this.createStatusContainer('✅', 'Team Member Added', `Hi ${inviterName}, great news! ${acceptedByName} has accepted your invitation to join ${companyName} as a ${role}. They are now part of your team and can begin collaborating immediately.`, 'success')}
          
          <!-- Team Member Details -->
          ${this.createInfoCard(
            'New Team Member Details',
            `<strong>Name:</strong> ${acceptedByName}<br><strong>Role:</strong> ${role}${acceptedDate ? `<br><strong>Joined:</strong> ${acceptedDate}` : ''}<br><strong>Status:</strong> <span style="color: #059669; font-weight: 600;">Active</span>`,
            'highlight'
          )}

          ${this.createButton('View Team Dashboard', dashboardUrl, 'primary')}
        </td>
      </tr>
    `;
  }
}
