import { BaseEmailTemplate, EmailTemplateData } from './base.template';

export interface RecruiterJobAssignmentEmailData extends EmailTemplateData {
  recruiterName: string;
  jobTitle: string;
  jobDescription: string;
  companyName: string;
  clientName: string;
  assignedByName: string;
  jobPostingUrl: string;
  dashboardUrl: string;
}

export class RecruiterJobAssignmentEmailTemplate extends BaseEmailTemplate {
  constructor(data: RecruiterJobAssignmentEmailData) {
    super(data);
  }

  protected getSubject(): string {
    const { jobTitle, companyName } = this
      .data as RecruiterJobAssignmentEmailData;
    return `New Job Assignment: ${jobTitle} at ${companyName}`;
  }

  protected getTemplate(): string {
    const {
      recruiterName,
      jobTitle,
      jobDescription,
      companyName,
      clientName,
      assignedByName,
      dashboardUrl,
    } = this.data as RecruiterJobAssignmentEmailData;

    return `
      <tr>
        <td align="center" style="padding: 32px 24px;" class="content-padding">
          <h1 style="color: #111827; font-size: 28px; font-weight: 600; margin-bottom: 16px; text-align: center; line-height: 1.25;">
            New Job Assignment
          </h1>
          
          ${this.createStatusContainer('🚀', 'Assignment Ready', `Hi ${recruiterName}, you have been assigned to a new job posting that requires your recruitment expertise.`, 'success')}

          <!-- Job Details Card -->
          ${this.createInfoCard(
            '💼 Job Details',
            `<strong>Position:</strong> ${jobTitle}<br>
             <strong>Company:</strong> ${companyName}<br>
             <strong>Client Contact:</strong> ${clientName}<br>
             <strong>Assigned by:</strong> ${assignedByName}`
          )}

          <!-- Job Description Card -->
          ${this.createInfoCard(
            '📝 Job Description',
            `<div style="text-align: left; white-space: pre-wrap; line-height: 1.6;">${jobDescription}</div>`
          )}

          <!-- Action Button -->
          <div style="margin: 32px 0; text-align: center;">
            ${this.createButton('Go to Dashboard', dashboardUrl, 'primary')}
          </div>


        </td>
      </tr>
    `;
  }
}
