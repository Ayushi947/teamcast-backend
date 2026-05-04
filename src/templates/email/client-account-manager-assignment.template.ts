import { BaseEmailTemplate, EmailTemplateData } from './base.template';

export interface ClientAccountManagerAssignmentEmailData
  extends EmailTemplateData {
  name: string;
  companyName: string;
  accountManagerName: string;
  accountManagerEmail: string;
  accountManagerJobTitle?: string;
  accountManagerPhone?: string;
  supportUrl: string;
}

export class ClientAccountManagerAssignmentEmailTemplate extends BaseEmailTemplate {
  constructor(data: ClientAccountManagerAssignmentEmailData) {
    super(data);
  }

  protected getSubject(): string {
    return 'Your Dedicated Account Manager - Welcome to Teamcast!';
  }

  protected getTemplate(): string {
    const {
      name,
      companyName,
      accountManagerName,
      accountManagerEmail,
      accountManagerJobTitle,
      accountManagerPhone,
    } = this.data as ClientAccountManagerAssignmentEmailData;

    return `
      <tr>
        <td align="center" style="padding: 32px 24px;" class="content-padding">
          <h1 style="color: #111827; font-size: 28px; font-weight: 600; margin-bottom: 16px; text-align: center; line-height: 1.25;">
            Meet Your Dedicated Account Manager!
          </h1>

          ${this.createStatusContainer('', 'Account Manager Assigned', `Hi ${name}, we're pleased to introduce you to your dedicated account manager.<br><br>Your account manager will serve as your primary point of contact at Teamcast and will work closely with ${companyName} to ensure you have a successful hiring experience.<br><br>They are here to provide guidance, support, and assistance with all your hiring needs.`, 'success')}

          <!-- Account Manager Information Card -->
          ${this.createInfoCard(
            'Your Account Manager',
            `<strong>Name:</strong> ${accountManagerName}<br>
             <strong>Email:</strong> <a href="mailto:${accountManagerEmail}" style="color: #3b82f6;">${accountManagerEmail}</a><br>
             ${accountManagerJobTitle ? `<strong>Title:</strong> ${accountManagerJobTitle}<br>` : ''}
             ${accountManagerPhone ? `<strong>Phone:</strong> <a href="tel:${accountManagerPhone}" style="color: #3b82f6;">${accountManagerPhone}</a><br>` : ''}
             <strong>Role:</strong> Your dedicated success partner`,
            'highlight'
          )}

          ${this.createButton(' 📧 Email Your Account Manager', `mailto:${accountManagerEmail}`, 'primary')}
        </td>
      </tr>
    `;
  }

  render(): { subject: string; html: string; text: string } {
    const {
      name,
      companyName,
      accountManagerName,
      accountManagerEmail,
      accountManagerJobTitle,
      accountManagerPhone,
      supportUrl,
    } = this.data as ClientAccountManagerAssignmentEmailData;
    const baseRender = super.render();

    const text = `Meet Your Dedicated Account Manager!

Hi ${name},

We're pleased to introduce you to your dedicated account manager who will serve as your primary point of contact at Teamcast. They will work closely with ${companyName} to ensure you have a successful hiring experience.

Your Account Manager:
Name: ${accountManagerName}
Email: ${accountManagerEmail}
${accountManagerJobTitle ? `Title: ${accountManagerJobTitle}` : ''}
${accountManagerPhone ? `Phone: ${accountManagerPhone}` : ''}

What Your Account Manager Does:
• Platform Guidance: Expert tips on using Teamcast features effectively
• Best Practices: Industry insights for better hiring outcomes  
• Technical Support: Quick resolution of any platform issues
• Strategy Consulting: Personalized advice for your hiring needs
• Success Planning: Regular reviews to optimize your hiring process

Next Steps:
1. Your account manager will reach out to schedule an introduction call
2. Together, we'll review your company profile and hiring preferences
3. Get personalized tips for attracting and hiring the best candidates
4. Regular check-ins to ensure you're achieving your hiring goals

Need immediate help? Contact support: ${supportUrl}

Best regards,
The Teamcast Team`;

    return {
      subject: baseRender.subject,
      html: baseRender.html,
      text,
    };
  }
}
