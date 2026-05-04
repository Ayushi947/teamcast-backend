import { BaseEmailTemplate, EmailTemplateData } from './base.template';

export interface JobApplicationWithdrawData extends EmailTemplateData {
  name: string;
  jobTitle: string;
  companyName: string;
  applicationId: string;
  withdrawDate: string;
  reason?: string;
  dashboardUrl: string;
}

export class JobApplicationWithdrawEmailTemplate extends BaseEmailTemplate {
  protected getSubject(): string {
    return 'Application Withdrawn - {{params.jobTitle}} at {{params.companyName}}';
  }

  protected getTemplate(): string {
    return `
      <tr>
        <td align="center" style="padding:25px 30px;" class="content-padding">
          <h1 style="color:#2c3e50;font-size:28px;font-weight:600;margin-bottom:20px;text-align:center;line-height:1.2;">
            Application Withdrawn
          </h1>
          
          ${this.createStatusContainer('✅', 'Application Withdrawn', `Hi {{params.name}}, your application for the {{params.jobTitle}} position at {{params.companyName}} has been successfully withdrawn. Your application has been removed from consideration and you are no longer in the running for this position.`, 'info')}

          <!-- Application Details -->
          ${this.createInfoCard(
            'Withdrawal Details',
            `<strong>Position:</strong> {{params.jobTitle}}<br><strong>Company:</strong> {{params.companyName}}<br><strong>Application ID:</strong> {{params.applicationId}}<br><strong>Withdrawn:</strong> {{params.withdrawDate}}`,
            'highlight'
          )}

          ${this.getReasonSection()}

          ${this.createButton('View Applications', '{{params.dashboardUrl}}', 'primary')}

          <!-- Alternative Link -->
          <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:30px 0;text-align:center;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="{{params.dashboardUrl}}" style="color:#667eea;text-decoration:underline;word-break:break-all;">{{params.dashboardUrl}}</a>
          </p>

          <p style="color:#5a6c7d;font-size:14px;line-height:1.6;margin:20px 0;text-align:center;">
            Thank you for using Teamcast, {{params.name}}. We wish you the best in your job search!
          </p>
        </td>
      </tr>
    `;
  }

  private getReasonSection(): string {
    if (!this.data.reason) return '';

    return this.createInfoCard(
      'Withdrawal Reason',
      '{{params.reason}}',
      'default'
    );
  }
}
