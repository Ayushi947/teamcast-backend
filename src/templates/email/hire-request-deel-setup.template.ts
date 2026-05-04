import { BaseEmailTemplate, EmailTemplateData } from './base.template';

export interface HireRequestDeelSetupEmailData extends EmailTemplateData {
  accountManagerName: string;
  clientName: string;
  clientCompanyName: string;
  clientEmail: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  applicationId: string;
  candidateId: string;
  clientId: string;
  assessmentScore?: number;
  assessmentResult?: string;
  assessmentRecommendation?: string;
  requestDate: string;
  priority: 'high' | 'medium' | 'low';
  specialNotes?: string;
}

export class HireRequestDeelSetupEmailTemplate extends BaseEmailTemplate {
  constructor(data: HireRequestDeelSetupEmailData) {
    super(data);
  }

  protected getSubject(): string {
    const { clientCompanyName, candidateName, jobTitle, priority } = this
      .data as HireRequestDeelSetupEmailData;
    const priorityLabel =
      priority === 'high'
        ? '[URGENT] '
        : priority === 'medium'
          ? '[PRIORITY] '
          : '';
    return `${priorityLabel}Hire Request: ${candidateName} for ${jobTitle} at ${clientCompanyName}`;
  }

  protected getTemplate(): string {
    const {
      accountManagerName,
      clientName,
      clientCompanyName,
      clientEmail,
      candidateName,
      candidateEmail,
      jobTitle,
      applicationId,
      candidateId,
      clientId,
      assessmentScore,
      assessmentResult,
      assessmentRecommendation,
      requestDate,
      priority,
      specialNotes,
    } = this.data as HireRequestDeelSetupEmailData;

    const priorityConfig = this.getPriorityConfig(priority);
    const assessmentInfo = this.getAssessmentInfo(
      assessmentScore,
      assessmentResult,
      assessmentRecommendation
    );

    return `
      <tr>
        <td align="center" style="padding: 32px 24px;" class="content-padding">
          <h1 style="color: #111827; font-size: 28px; font-weight: 600; margin-bottom: 16px; text-align: center; line-height: 1.25;">
            🚀 New Hire Request - Deel.com Setup Required
          </h1>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
            Hi ${accountManagerName}, a client has requested to hire a candidate through our platform. Please set up the candidate in Deel.com under the client's group.
          </p>

          ${this.createStatusContainer(
            priorityConfig.icon,
            'Hire Request Received',
            `Priority: ${priorityConfig.label} - Action required within 24 hours`,
            priorityConfig.type
          )}

          <!-- Request Details -->
          ${this.createInfoCard(
            '📋 Hire Request Details',
            `<strong>Request Date:</strong> ${requestDate}<br>
             <strong>Application ID:</strong> ${applicationId}<br>
             <strong>Priority Level:</strong> ${priorityConfig.label}<br>
             ${specialNotes ? `<strong>Special Notes:</strong> ${specialNotes}<br>` : ''}`,
            'highlight'
          )}

          <!-- Client Information -->
          ${this.createInfoCard(
            '🏢 Client Information',
            `<strong>Client Name:</strong> ${clientName}<br>
             <strong>Company:</strong> ${clientCompanyName}<br>
             <strong>Email:</strong> <a href="mailto:${clientEmail}" style="color: #3b82f6;">${clientEmail}</a><br>
             <strong>Client ID:</strong> ${clientId}`,
            'default'
          )}

          <!-- Candidate Information -->
          ${this.createInfoCard(
            '👤 Candidate Information',
            `<strong>Name:</strong> ${candidateName}<br>
             <strong>Email:</strong> <a href="mailto:${candidateEmail}" style="color: #3b82f6;">${candidateEmail}</a><br>
             <strong>Job Title:</strong> ${jobTitle}<br>
             <strong>Candidate ID:</strong> ${candidateId}`,
            'default'
          )}

          <!-- Assessment Information -->
          ${
            assessmentInfo
              ? this.createInfoCard(
                  '📊 Assessment Results',
                  assessmentInfo,
                  'default'
                )
              : ''
          }

          <!-- Action Required -->
          ${this.createInfoCard(
            '⚡ Action Required',
            `<strong>Please complete the following steps:</strong><br><br>
             1. <strong>Access Deel.com</strong> - Log into your Deel.com account<br>
             2. <strong>Navigate to Client Group</strong> - Find ${clientCompanyName}'s organization<br>
             3. <strong>Add New Person</strong> - Create a new person record for ${candidateName}<br>
             4. <strong>Enter Details</strong> - Use the candidate information provided above<br>
             5. <strong>Set Contract Type</strong> - Configure appropriate employment/contract terms<br>
             6. <strong>Notify Client</strong> - Send confirmation to ${clientName}<br><br>
             <strong>Timeline:</strong> Complete within 24 hours of this request`,
            'highlight'
          )}

          <!-- Quick Actions -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin: 24px 0;">
            <tr>
              <td align="center">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                  <tr>
                    <td style="border-radius: 6px; background-color: #3b82f6; text-align: center;">
                      <a href="https://app.deel.com" target="_blank" style="display: inline-block; padding: 12px 24px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 14px;">
                        🔗 Access Deel.com
                      </a>
                    </td>
                    <td style="width: 16px;"></td>
                    <td style="border-radius: 6px; background-color: #10b981; text-align: center;">
                      <a href="mailto:${clientEmail}?subject=Hire Request Confirmation - ${candidateName}&body=Hi ${clientName},%0D%0A%0D%0AI'm working on setting up ${candidateName} in our system for the ${jobTitle} position. I'll notify you once the setup is complete.%0D%0A%0D%0ABest regards,%0D%0A${accountManagerName}" style="display: inline-block; padding: 12px 24px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 14px;">
                        📧 Notify Client
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>




        </td>
      </tr>
    `;
  }

  private getPriorityConfig(priority: string): {
    icon: string;
    label: string;
    type: 'info' | 'success' | 'warning' | 'error';
  } {
    switch (priority) {
      case 'high':
        return {
          icon: '🚨',
          label: 'High Priority - Urgent',
          type: 'error',
        };
      case 'medium':
        return {
          icon: '⚠️',
          label: 'Medium Priority - Important',
          type: 'warning',
        };
      case 'low':
        return {
          icon: 'ℹ️',
          label: 'Low Priority - Standard',
          type: 'info',
        };
      default:
        return {
          icon: 'ℹ️',
          label: 'Standard Priority',
          type: 'info',
        };
    }
  }

  private getAssessmentInfo(
    score?: number,
    result?: string,
    recommendation?: string
  ): string | null {
    if (!score && !result && !recommendation) {
      return null;
    }

    let info = '';
    if (score) {
      info += `<strong>Assessment Score:</strong> ${score}%<br>`;
    }
    if (result) {
      info += `<strong>Assessment Result:</strong> ${result}<br>`;
    }
    if (recommendation) {
      info += `<strong>AI Recommendation:</strong> ${recommendation}<br>`;
    }

    return info || null;
  }

  render(): { subject: string; html: string; text: string } {
    const { html } = super.render();
    const text = this.getTextContent();

    return {
      subject: this.getSubject(),
      html,
      text,
    };
  }

  private getTextContent(): string {
    const {
      accountManagerName,
      clientName,
      clientCompanyName,
      clientEmail,
      candidateName,
      candidateEmail,
      jobTitle,
      applicationId,
      priority,
      requestDate,
    } = this.data as HireRequestDeelSetupEmailData;

    const priorityLabel =
      priority === 'high'
        ? 'URGENT'
        : priority === 'medium'
          ? 'PRIORITY'
          : 'STANDARD';

    return `
HIRE REQUEST - DEEL.COM SETUP REQUIRED

Hi ${accountManagerName},

A client has requested to hire a candidate through our platform. Please set up the candidate in Deel.com under the client's group.

PRIORITY: ${priorityLabel}
REQUEST DATE: ${requestDate}
APPLICATION ID: ${applicationId}

CLIENT INFORMATION:
- Name: ${clientName}
- Company: ${clientCompanyName}
- Email: ${clientEmail}

CANDIDATE INFORMATION:
- Name: ${candidateName}
- Email: ${candidateEmail}
- Job Title: ${jobTitle}

ACTION REQUIRED:
1. Access Deel.com (https://app.deel.com)
2. Navigate to ${clientCompanyName}'s organization
3. Add new person record for ${candidateName}
4. Enter candidate details provided above
5. Set appropriate contract/employment terms
6. Notify client of completion

TIMELINE: Complete within 24 hours

Please ensure all data privacy and compliance requirements are met during the setup process.

If you need assistance, please contact the technical support team.

Reference: Application ID ${applicationId}

Best regards,
Teamcast Platform
    `;
  }
}
