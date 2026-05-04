import { BaseEmailTemplate, EmailTemplateData } from './base.template';

export interface CandidateJobAppliedData extends EmailTemplateData {
  name: string;
  jobTitle: string;
  companyName: string;
  applicationId: string;
  appliedDate: string;
  nextSteps: string[];
  dashboardUrl: string;
}

export class CandidateJobAppliedEmailTemplate extends BaseEmailTemplate {
  protected getSubject(): string {
    return 'Application Submitted - {{params.jobTitle}} at {{params.companyName}}';
  }

  protected getTemplate(): string {
    return `
      <tr>
        <td align="center" style="padding: 32px 24px;" class="content-padding">
          <h1 style="color: #111827; font-size: 28px; font-weight: 600; margin-bottom: 16px; text-align: center; line-height: 1.25;">
            Application Submitted Successfully
          </h1>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
            Hi {{params.name}}, congratulations on taking the next step in your career! 🚀 Your application for the <strong>{{params.jobTitle}}</strong> position at <strong>{{params.companyName}}</strong> has been successfully submitted through Teamcast's intelligent platform and is now being reviewed by our AI-powered matching system.
          </p>

          ${this.createStatusContainer('✅', 'Application Received', 'Your application is now in our system', 'success')}

          <!-- Application Details -->
          ${this.createInfoCard(
            '📋 Application Details',
            `<strong>Position:</strong> {{params.jobTitle}}<br><strong>Company:</strong> {{params.companyName}}<br><strong>Application ID:</strong> {{params.applicationId}}<br><strong>Submitted:</strong> {{params.appliedDate}}`,
            'highlight'
          )}

          ${this.getNextSteps()}

          ${this.createButton('View Application Status', '{{params.dashboardUrl}}', 'primary')}

          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0; text-align: center;">
            🌟 Your journey to an amazing career starts here! We'll keep you updated every step of the way. Good luck! 🍀
          </p>
        </td>
      </tr>
    `;
  }

  private getNextSteps(): string {
    return this.createInfoCard(
      '🎯 What Happens Next',
      this.getNextStepsList(),
      'default'
    );
  }

  private getNextStepsList(): string {
    // This will be replaced with actual next steps during rendering
    return `
      • {{params.nextSteps.0}}<br>
      • {{params.nextSteps.1}}<br>
      • {{params.nextSteps.2}}<br>
      • You'll receive updates via email and in your dashboard<br>
      • Keep your profile updated for better opportunities
    `;
  }
}
