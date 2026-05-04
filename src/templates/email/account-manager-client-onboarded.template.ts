import { BaseEmailTemplate, EmailTemplateData } from './base.template';

export interface AccountManagerClientOnboardedEmailData
  extends EmailTemplateData {
  accountManagerName: string;
  clientName: string;
  clientEmail: string;
  companyName: string;
  companyType?: string;
  companySize?: string;
  companyIndustry?: string;
  clientRole?: string;
  onboardingDate: string;
  dashboardUrl: string;
  clientProfileUrl?: string;
  supportUrl: string;
}

export class AccountManagerClientOnboardedEmailTemplate extends BaseEmailTemplate {
  constructor(data: AccountManagerClientOnboardedEmailData) {
    super(data);
  }

  protected getSubject(): string {
    return 'New Client Assignment - Action Required';
  }

  protected getTemplate(): string {
    const {
      accountManagerName,
      clientName,
      clientEmail,
      companyName,
      companyType,
      companySize,
      companyIndustry,
      clientRole,
      onboardingDate,
      // supportUrl,
    } = this.data as AccountManagerClientOnboardedEmailData;

    return `
      <tr>
        <td align="center" style="padding: 32px 24px;" class="content-padding">
          <h1 style="color: #111827; font-size: 28px; font-weight: 600; margin-bottom: 16px; text-align: center; line-height: 1.25;">
            New Client Assignment
          </h1>

          ${this.createStatusContainer('', 'Client Ready for Onboarding', `Hi ${accountManagerName}, you have been assigned a new client who has completed the initial registration process.<br><br>This client is now ready for your professional guidance and support. Please review their company profile and reach out within 24-48 hours to establish contact and begin the onboarding process.<br><br>Your expertise will be crucial in helping them achieve their hiring objectives.`, 'success')}

          <!-- Client Information Card -->
          ${this.createInfoCard(
            ' Client Information',
            `<strong>Client Name:</strong> ${clientName}<br>
             <strong>Email:</strong> <a href="mailto:${clientEmail}" style="color: #3b82f6;">${clientEmail}</a><br>
             <strong>Company:</strong> ${companyName}<br>
             ${companyType ? `<strong>Company Type:</strong> ${companyType}<br>` : ''}
             ${companySize ? `<strong>Company Size:</strong> ${companySize}<br>` : ''}
             ${companyIndustry ? `<strong>Industry:</strong> ${companyIndustry}<br>` : ''}
             ${clientRole ? `<strong>Role:</strong> ${clientRole}<br>` : ''}
             <strong>Registration Date:</strong> ${onboardingDate}`,
            'highlight'
          )}

          ${this.createButton('Contact Client', `mailto:${clientEmail}`, 'primary')}
        </td>
      </tr>
    `;
  }

  render(): { subject: string; html: string; text: string } {
    const {
      accountManagerName,
      clientName,
      clientEmail,
      companyName,
      companyType,
      companySize,
      companyIndustry,
      clientRole,
      onboardingDate,
    } = this.data as AccountManagerClientOnboardedEmailData;
    const baseRender = super.render();

    const text = `New Client Assignment - Action Required

Hi ${accountManagerName},

You have been assigned a new client who has completed the initial registration process. This client is now ready for your professional guidance and support.

Client Information:
Client Name: ${clientName}
Email: ${clientEmail}
Company: ${companyName}
${companyType ? `Company Type: ${companyType}` : ''}
${companySize ? `Company Size: ${companySize}` : ''}
${companyIndustry ? `Industry: ${companyIndustry}` : ''}
${clientRole ? `Role: ${clientRole}` : ''}
Registration Date: ${onboardingDate}

Best regards,
The Teamcast Team`;

    return {
      subject: baseRender.subject,
      html: baseRender.html,
      text,
    };
  }
}
