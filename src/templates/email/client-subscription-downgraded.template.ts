import { BaseEmailTemplate } from './base.template';

export interface ClientSubscriptionDowngradedEmailData {
  name: string;
  companyName: string;
  newPackage: string;
  dashboardUrl?: string;
}

export class ClientSubscriptionDowngradedEmailTemplate extends BaseEmailTemplate {
  protected getSubject(): string {
    return 'Your Teamcast Subscription Plan Has Been Updated';
  }

  protected getTemplate(): string {
    const { name, companyName, newPackage, dashboardUrl } = this
      .data as ClientSubscriptionDowngradedEmailData;
    return `
      <tr>
        <td align="center" style="padding:25px 30px;" class="content-padding">
          <h1 style="color:#2c3e50;font-size:28px;font-weight:600;margin-bottom:20px;text-align:center;line-height:1.2;">
            Subscription Plan Update
          </h1>
          <p style="color:#5a6c7d;font-size:16px;line-height:1.6;margin-bottom:30px;text-align:center;">
            Dear ${name},<br>
            We've successfully updated your Teamcast subscription for <strong>${companyName}</strong> to the <strong>${newPackage}</strong> plan. You still have access to our core AI-powered features that will help you continue your hiring success. Remember, you can upgrade anytime to unlock advanced capabilities!
          </p>
          ${this.createStatusContainer('ℹ️', 'Plan Updated', `Your plan has been changed to ${newPackage}. Please review your current plan limits and features.`, 'info')}
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;background-color:#f0f9ff;border:1px solid #0ea5e9;border-radius:8px;margin:30px 0;">
            <tr>
              <td align="center" style="padding:25px;">
                <div style="color:#0284c7;font-size:18px;font-weight:600;margin-bottom:15px;">
                  📊 Your ${newPackage} Plan Details
                </div>
                <div style="color:#0369a1;font-size:16px;line-height:1.8;">
                  Your current ${newPackage} plan includes team members, job postings, candidate views, and AI assessments. Visit your dashboard to see your updated limits and features.
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
            Thank you for being a valued Teamcast customer!<br>
          </p>
        </td>
      </tr>
    `;
  }
}
