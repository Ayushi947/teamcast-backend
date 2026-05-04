import { BaseEmailTemplate, EmailTemplateData } from './base.template';

export interface CandidateShortlistedData extends EmailTemplateData {
  candidateName: string;
  companyName: string;
  clientUserName: string;
  jobTitle?: string;
  notes?: string;
}

export class CandidateShortlistedEmailTemplate extends BaseEmailTemplate {
  protected getSubject(): string {
    const jobTitle = this.data.jobTitle;
    if (jobTitle) {
      return `You've been shortlisted`;
    }
    return `You've been shortlisted by {{params.companyName}}`;
  }

  protected getTemplate(): string {
    return `
      <tr>
        <td align="center" style="padding: 32px 24px;" class="content-padding">
          <h1 style="color: #111827; font-size: 28px; font-weight: 600; margin-bottom: 16px; text-align: center; line-height: 1.25;">
            You've Been Shortlisted!
          </h1>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
            Hi {{params.candidateName}}, incredible news! 🎉 You have been shortlisted by {{params.companyName}} - your skills and experience have impressed their hiring team! This is a significant milestone in your career journey, and you're now among the top candidates being considered.
          </p>

          ${this.createStatusContainer('🎉', 'Shortlisted', 'You have been selected to move forward in the hiring process', 'success')}

          <!-- Company and Job Details -->
          ${this.createInfoCard(
            '📋 Shortlist Details',
            `<strong>Company:</strong> {{params.companyName}}<br>${this.getJobTitleLine()}<strong>Shortlisted by:</strong> {{params.clientUserName}}<br><strong>Date:</strong> ${new Date().toLocaleDateString(
              'en-US',
              {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }
            )}`,
            'highlight'
          )}





          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0; text-align: center;">
            🌟 You're doing amazing, {{params.candidateName}}! This is your moment to shine - we're rooting for you! 🚀
          </p>
        </td>
      </tr>
    `;
  }

  private getJobTitleLine(): string {
    return this.data.jobTitle
      ? `<strong style="color: #1f2937;">Position:</strong> {{params.jobTitle}}<br>`
      : '';
  }
}
