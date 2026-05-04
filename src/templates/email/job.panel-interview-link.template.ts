import { BaseEmailTemplate, EmailTemplateData } from './base.template';

export interface PanelInterviewLinkData extends EmailTemplateData {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  interviewDate: string;
  interviewTime: string;
  duration: string;
  timezone: string;
  meetingLink: string;
  eventId?: string;
  panelMemberNames: string[];
  additionalInstructions?: string;
  isCandidate?: boolean;
}

export class PanelInterviewLinkEmailTemplate extends BaseEmailTemplate {
  protected getSubject(): string {
    const data = this.data as PanelInterviewLinkData;
    if (data.isCandidate) {
      return `Panel Interview Link Ready - ${data.jobTitle} at ${data.companyName}`;
    } else {
      return `Panel Interview Invitation - ${data.candidateName} for ${data.jobTitle} at ${data.companyName}`;
    }
  }

  protected getTemplate(): string {
    const data = this.data as PanelInterviewLinkData;
    const isCandidate = data.isCandidate || false;

    const headerText = isCandidate
      ? 'Your Interview Link is Ready!'
      : 'Panel Interview Invitation';

    const greetingText = isCandidate
      ? `Hi {{params.candidateName}}, your panel interview for the <strong style="color: #1f2937;">{{params.jobTitle}}</strong> position at <strong style="color: #1f2937;">{{params.companyName}}</strong> has been scheduled. Here are your meeting details:`
      : `Hi {{params.name}}, you have been invited to participate in a panel interview for <strong style="color: #1f2937;">{{params.candidateName}}</strong> for the <strong style="color: #1f2937;">{{params.jobTitle}}</strong> position at <strong style="color: #1f2937;">{{params.companyName}}</strong>. Here are the meeting details:`;

    return `
      <tr>
        <td align="center" style="padding: 25px 32px;" class="content-padding">
          <h1 style="color: #1f2937; font-size: 28px; font-weight: 600; margin-bottom: 20px; text-align: center; line-height: 1.2;">
            ${headerText}
          </h1>
          ${this.createStatusContainer('📅', 'Interview Scheduled', `${greetingText}`, 'success')}
          
          <!-- Interview Details -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f8fafc; border: none !important; border-radius: 12px; margin: 32px 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);">
            <tr>
              <td style="padding: 32px 24px;">
                <div style="color: #1f2937; font-size: 20px; font-weight: 600; margin-bottom: 20px; text-align: left;">
                  📋 Interview Details
                </div>
                <div style="color: #4b5563; font-size: 16px; line-height: 1.8; text-align: left;">
                  <strong style="color: #1f2937;">Position:</strong> {{params.jobTitle}}<br>
                  <strong style="color: #1f2937;">Company:</strong> {{params.companyName}}<br>
                  <strong style="color: #1f2937;">Date:</strong> {{params.interviewDate}}<br>
                  <strong style="color: #1f2937;">Time:</strong> {{params.interviewTime}} ({{params.timezone}})<br>
                  <strong style="color: #1f2937;">Duration:</strong> {{params.duration}}<br>
                  ${this.getEventIdDisplay('{{params.eventId}}')}
                </div>
              </td>
            </tr>
          </table>

          <!-- Meeting Link -->
          <div style="text-align: center; margin: 32px 0;">
            ${this.createButton(isCandidate ? 'Join Interview' : 'Join Panel Interview', '{{params.meetingLink}}', 'primary')}
            <div style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin-top: 16px;">
              Meeting Link: <a href="{{params.meetingLink}}" style="color: #3b82f6; text-decoration: underline; word-break: break-all;">{{params.meetingLink}}</a>
            </div>
          </div>

          <!-- Panel Members -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; border: none !important; border-radius: 12px; margin: 32px 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);">
            <tr>
              <td style="padding: 32px 24px;">
                <div style="color: #1f2937; font-size: 20px; font-weight: 600; margin-bottom: 16px;">
                  ${isCandidate ? '👥 Your Interview Panel' : '👥 Interview Panel'}
                </div>
                <div style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                  ${
                    isCandidate
                      ? "You'll be interviewing with the following team members:"
                      : 'The following team members will be participating in this interview:'
                  }
                  ${this.getPanelMembersDisplay()}
                </div>
              </td>
            </tr>
          </table>

          <!-- Important Notes -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #fffbeb; border: none !important; border-radius: 12px; margin: 32px 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);">
            <tr>
              <td style="padding: 24px 20px;">
                <div style="color: #1f2937; font-size: 18px; font-weight: 600; margin-bottom: 12px;">
                  ⚠️ Important Reminders
                </div>
                <div style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                  • Test your audio and video before the interview<br>
                  • Join the meeting 5-10 minutes early<br>
                  • Ensure you have a stable internet connection<br>
                  • Find a quiet, well-lit space for the interview<br>
                  • Have a copy of your resume ready to reference
                </div>
              </td>
            </tr>
          </table>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0; text-align: center;">
            Best of luck with your interview, {{params.candidateName}}!
          </p>
        </td>
      </tr>
    `;
  }

  private getEventIdDisplay(eventId: string): string {
    if (!eventId) return '';
    return `<strong style="color: #1f2937;">Meeting ID:</strong> ${eventId}<br>`;
  }

  private getPanelMembersDisplay(): string {
    return `
      <ul style="margin:10px 0;padding-left:20px;color:#5a6c7d;">
        {{#each params.panelMemberNames}}
        <li style="margin:5px 0;">{{this}}</li>
        {{/each}}
      </ul>
    `;
  }

  public render(): { subject: string; html: string } {
    let template = this.getTemplate();

    // Handle panel members array
    const data = this.data as PanelInterviewLinkData;
    if (data.panelMemberNames && data.panelMemberNames.length > 0) {
      const panelMembersList = data.panelMemberNames
        .map((name) => `<li style="margin:5px 0;">${name}</li>`)
        .join('');

      template = template.replace(
        /{{#each params\.panelMemberNames}}[\s\S]*?{{\/each}}/g,
        `<ul style="margin:10px 0;padding-left:20px;color:#5a6c7d;">${panelMembersList}</ul>`
      );
    } else {
      template = template.replace(
        /{{#each params\.panelMemberNames}}[\s\S]*?{{\/each}}/g,
        `<p style="color:#5a6c7d;font-style:italic;">Panel member details will be shared separately.</p>`
      );
    }

    // Replace template variables
    if (this.data && typeof this.data === 'object') {
      Object.entries(this.data).forEach(([key, value]) => {
        const placeholder = `{{params.${key}}}`;
        if (
          typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean'
        ) {
          template = template.replace(
            new RegExp(placeholder, 'g'),
            String(value)
          );
        }
      });
    }

    return {
      subject: this.getSubject(),
      html: this.getEmailContainer(template),
    };
  }
}
