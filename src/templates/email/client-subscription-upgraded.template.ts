import { BaseEmailTemplate } from './base.template';

export interface ClientSubscriptionUpgradedEmailData {
  name: string;
  companyName: string;
  newPackage: string;
  dashboardUrl?: string;
}

export class ClientSubscriptionUpgradedEmailTemplate extends BaseEmailTemplate {
  protected getSubject(): string {
    return 'Your Teamcast Subscription Has Been Successfully Upgraded';
  }

  protected getTemplate(): string {
    const { name, companyName, newPackage, dashboardUrl } = this
      .data as ClientSubscriptionUpgradedEmailData;
    return `
      <tr>
        <td align="center" style="padding:25px 30px;" class="content-padding">
          <h1 style="color:#2c3e50;font-size:28px;font-weight:600;margin-bottom:20px;text-align:center;line-height:1.2;">
            Subscription Upgrade Confirmed
          </h1>
          <p style="color:#5a6c7d;font-size:16px;line-height:1.6;margin-bottom:30px;text-align:center;">
            Dear ${name},<br>
            Congratulations! Your Teamcast subscription for <strong>${companyName}</strong> has been successfully upgraded to the premium <strong>${newPackage}</strong> plan. You now have access to our most advanced AI features and enterprise-grade capabilities that will supercharge your hiring success!
          </p>
          ${this.createStatusContainer('✅', 'Upgrade Successful', `Your plan has been upgraded to ${newPackage}. All new features and increased limits are now available.`, 'success')}
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;background-color:#f0fdf4;border:1px solid #22c55e;border-radius:8px;margin:30px 0;">
            <tr>
              <td align="center" style="padding:25px;">
                <div style="color:#16a34a;font-size:18px;font-weight:600;margin-bottom:15px;">
                  🚀 Welcome to ${newPackage} Plan
                </div>
                <div style="color:#15803d;font-size:16px;line-height:1.8;">
                  Your upgraded ${newPackage} plan includes additional team members, job postings, candidate views, and AI assessments. Explore your dashboard to access all new capabilities.
                </div>
              </td>
            </tr>
          </table>
          ${this.createButton('Access Dashboard', dashboardUrl || '{{params.dashboardUrl}}', 'primary')}
          <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:30px 0;text-align:center;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${dashboardUrl || '{{params.dashboardUrl}}'}" style="color:#667eea;text-decoration:underline;word-break:break-all;">${dashboardUrl || '{{params.dashboardUrl}}'}</a>
          </p>
          <p style="color:#5a6c7d;font-size:14px;line-height:1.6;margin:20px 0;text-align:center;">
            Thank you for choosing Teamcast!<br>
            Need assistance? Contact <a href="mailto:support@teamcast.ai" style="color:#667eea;text-decoration:none;">support@teamcast.ai</a>
          </p>
        </td>
      </tr>
    `;
  }
}
