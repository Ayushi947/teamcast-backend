import { BaseEmailTemplate, EmailTemplateData } from './base.template';

export interface CandidateApplicationStatusData extends EmailTemplateData {
  name: string;
  jobTitle: string;
  companyName: string;
  status: 'accepted' | 'rejected';
  applicationId: string;
  feedback?: string;
  nextSteps?: string[];
  dashboardUrl: string;
}

export class CandidateApplicationStatusEmailTemplate extends BaseEmailTemplate {
  protected getSubject(): string {
    return '{{params.status === "accepted" ? "Congratulations" : "Application Update"}} - {{params.jobTitle}} at {{params.companyName}}';
  }

  protected getTemplate(): string {
    return `
      <tr>
        <td align="center" style="padding: 32px 24px;" class="content-padding">
          <h1 style="color: #111827; font-size: 28px; font-weight: 600; margin-bottom: 16px; text-align: center; line-height: 1.25;">
            ${this.getStatusTitle()}
          </h1>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
            Hi {{params.name}}, 🌟 ${this.getStatusMessage()}
          </p>

          ${this.createStatusContainer(
            this.getStatusIcon(),
            this.getStatusText(),
            this.getStatusDescription(),
            this.getStatusColor()
          )}

          <!-- Application Details -->
          ${this.createInfoCard(
            '📋 Application Details',
            `<strong>Position:</strong> {{params.jobTitle}}<br><strong>Company:</strong> {{params.companyName}}<br><strong>Application ID:</strong> {{params.applicationId}}<br><strong>Status:</strong> ${this.getStatusDisplay()}`,
            'highlight'
          )}

          ${this.getFeedbackSection()}



          ${this.createButton('View Application', '{{params.dashboardUrl}}', 'primary')}

          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0; text-align: center;">
            ${this.getClosingMessage()}
          </p>
        </td>
      </tr>
    `;
  }

  private getStatusTitle(): string {
    return this.data.status === 'accepted'
      ? 'Congratulations! Your Application Has Been Accepted'
      : 'Application Status Update';
  }

  private getStatusMessage(): string {
    return this.data.status === 'accepted'
      ? `incredible news! 🎉 Your exceptional application for the <strong>{{params.jobTitle}}</strong> position at {{params.companyName}} has been accepted! Your skills and experience have truly impressed the hiring team.`
      : `we wanted to provide you with an important update about your application for the <strong>{{params.jobTitle}}</strong> position at {{params.companyName}}. Thank you for choosing Teamcast for your career journey.`;
  }

  private getStatusIcon(): string {
    return this.data.status === 'accepted' ? '🎉' : '📋';
  }

  private getStatusText(): string {
    return this.data.status === 'accepted'
      ? 'Application Accepted'
      : 'Application Status';
  }

  private getStatusDescription(): string {
    return this.data.status === 'accepted'
      ? "You've been selected to move forward in the hiring process"
      : 'Your application has been reviewed and a decision has been made';
  }

  private getStatusColor(): 'success' | 'info' {
    return this.data.status === 'accepted' ? 'success' : 'info';
  }

  private getStatusDisplay(): string {
    return this.data.status === 'accepted' ? 'Accepted' : 'Not Selected';
  }

  private getFeedbackSection(): string {
    if (!this.data.feedback) return '';

    return this.createInfoCard('💬 Feedback', '{{params.feedback}}', 'default');
  }

  private getStepIcon(index: number): string {
    const icons = ['📝', '📧', '📞', '🤝', '✅', '🎯', '📋', '📅', '📱', '💼'];
    return icons[index % icons.length];
  }

  private getClosingMessage(): string {
    return this.data.status === 'accepted'
      ? `🌟 Congratulations again, {{params.name}}! Your future is bright and we're excited to have you on board. Welcome to your new adventure! 🚀`
      : `Thank you for your interest, {{params.name}}. While this opportunity wasn't the perfect match, amazing opportunities await you on Teamcast. Keep pursuing your dreams! 🌟`;
  }
}
