import { BaseEmailTemplate, EmailTemplateData } from './base.template';

export interface AccountManagerRecruiterAssignmentEmailData
  extends EmailTemplateData {
  accountManagerName: string;
  recruiterName: string;
  recruiterEmail: string;
  jobTitle: string;
  companyName: string;
  clientName: string;
  assignedByName: string;
  jobPostingUrl: string;
  dashboardUrl: string;
}

export class AccountManagerRecruiterAssignmentEmailTemplate extends BaseEmailTemplate {
  constructor(data: AccountManagerRecruiterAssignmentEmailData) {
    super(data);
  }

  protected getSubject(): string {
    const { jobTitle, companyName } = this
      .data as AccountManagerRecruiterAssignmentEmailData;
    return `Recruiter Assigned: ${jobTitle} at ${companyName}`;
  }

  protected getTemplate(): string {
    const {
      accountManagerName,
      recruiterName,
      recruiterEmail,
      jobTitle,
      companyName,
      clientName,
      assignedByName,
      dashboardUrl,
    } = this.data as AccountManagerRecruiterAssignmentEmailData;

    return `
      <tr>
        <td align="center" style="padding: 32px 24px;" class="content-padding">
          <h1 style="color: #111827; font-size: 28px; font-weight: 600; margin-bottom: 16px; text-align: center; line-height: 1.25;">
            Recruiter Assigned to Client Job
          </h1>
          
          ${this.createStatusContainer('✅', 'Assignment Complete', `Hi ${accountManagerName}, a recruiter from your team has been assigned to one of your client's job postings.`, 'success')}

          <!-- Job Details Card -->
          ${this.createInfoCard(
            '💼 Job Assignment Details',
            `<strong>Position:</strong> ${jobTitle}<br>
             <strong>Company:</strong> ${companyName}<br>
             <strong>Client Contact:</strong> ${clientName}<br>
             <strong>Assigned by:</strong> ${assignedByName}`
          )}

          <!-- Recruiter Details Card -->
          ${this.createInfoCard(
            '👤 Assigned Recruiter',
            `<strong>Name:</strong> ${recruiterName}<br>
             <strong>Email:</strong> <a href="mailto:${recruiterEmail}" style="color: #3b82f6; text-decoration: none;">${recruiterEmail}</a><br>
             <strong>Team:</strong> Your Account Management Team`
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
