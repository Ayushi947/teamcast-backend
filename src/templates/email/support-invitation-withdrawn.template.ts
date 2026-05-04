import { BaseEmailTemplate, EmailTemplateData } from './base.template';

export interface SupportInvitationWithdrawnData extends EmailTemplateData {
  name: string;
  inviterName: string;
  invitationType: 'partner' | 'client' | 'candidate' | 'support';
  companyName?: string;
  jobTitle?: string;
}

export class SupportInvitationWithdrawnEmailTemplate extends BaseEmailTemplate {
  protected getSubject(): string {
    return 'Invitation Withdrawn';
  }

  protected getTemplate(): string {
    const { name, inviterName, invitationType } = this
      .data as SupportInvitationWithdrawnData;

    return `
      <tr>
        <td align="center" style="padding: 32px 24px;" class="content-padding">
          <h1 style="color: #111827; font-size: 28px; font-weight: 600; margin-bottom: 16px; text-align: center; line-height: 1.25;">
            Invitation Withdrawn
          </h1>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
            Hi ${name}, your ${invitationType} invitation has been withdrawn by ${inviterName}.
          </p>

          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0; text-align: center;">
            This invitation is no longer valid and cannot be accepted.
          </p>

          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0; text-align: center;">
            If you're still interested in joining Teamcast, please contact ${inviterName} to request a new invitation.
          </p>
        </td>
      </tr>
    `;
  }
}
