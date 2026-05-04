import { BaseEmailTemplate, EmailTemplateData } from './base.template';

export interface PanelAssessmentSlotData extends EmailTemplateData {
  name: string;
  candidateName: string;
  jobTitle: string;
  companyName: string;
  availableSlots: Array<{
    date: string;
    localStartTime: string;
    localEndTime: string;
    duration: string;
  }>;
  selectSlotUrl: string;
  assessmentType: string;
  timezone: string;
}

export class PanelAssessmentSlotEmailTemplate extends BaseEmailTemplate {
  protected getSubject(): string {
    return 'Panel Assessment - Select Your Interview Slot';
  }

  /**
   * Override render method to handle slots array
   */
  render(): { subject: string; html: string } {
    let template = this.getTemplate();

    // Generate slots HTML and replace the placeholder first
    const slotsHtml = this.generateSlotsHtml();
    template = template.replace('{{AVAILABLE_SLOTS_PLACEHOLDER}}', slotsHtml);

    // Replace template variables (like selectSlotUrl, name, etc.)
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

  private generateSlotsHtml(): string {
    const data = this.data as PanelAssessmentSlotData;
    const slots = data.availableSlots || [];

    if (slots.length === 0) {
      return `
        <tr>
          <td align="center" style="padding:20px 0;">
            <p style="color:#dc2626;font-size:16px;font-weight:500;">No available slots at this time.</p>
          </td>
        </tr>
      `;
    }

    return slots
      .map(
        (slot, _index) => `
      <tr>
        <td align="center" style="padding:10px 0;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:12px;margin:10px 0;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
            <tr>
              <td style="padding:25px;">
                <!-- Mobile-friendly layout -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
                  <tr>
                    <td valign="top" style="width:70%;">
                      <h3 style="color:#2c3e50;font-size:16px;font-weight:600;margin:0 0 8px 0;">${slot.date} ${data.timezone || 'UTC'}</h3>
                      <p style="color:#667eea;font-size:14px;font-weight:500;margin:0 0 8px 0;">${slot.localStartTime} - ${slot.localEndTime} (${slot.duration})</p>
                    </td>
                    <td valign="middle" align="right" style="width:30%;">
                      <div style="background-color:#f0fdf4;padding:8px 12px;border-radius:6px;border:1px solid #22c55e;display:inline-block;">
                        <span style="color:#16a34a;font-size:12px;font-weight:600;">AVAILABLE</span>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `
      )
      .join('');
  }

  protected getTemplate(): string {
    return `
    <tr>
      <td align="center" style="padding: 25px 32px;" class="content-padding">
        <h1 style="color: #1f2937; font-size: 28px; font-weight: 600; margin-bottom: 20px; text-align: center; line-height: 1.2;">
          Panel Assessment Invitation
        </h1>
        
        ${this.createStatusContainer('✅', 'Select Your Interview Slot', `Hi {{params.name}}, you've been invited for a panel interview for the <strong style="color: #1f2937;">{{params.jobTitle}}</strong> position at <strong style="color: #1f2937;">{{params.companyName}}</strong>. Please select your preferred time slot from the available options below.`, 'info')}

        <!-- Assessment Details -->
        ${this.createInfoCard(
          'Assessment Details',
          `<strong>Position:</strong> {{params.jobTitle}}<br><strong>Company:</strong> {{params.companyName}}<br><strong>Assessment Type:</strong> {{params.assessmentType}}`,
          'highlight'
        )}

        ${this.getAvailableSlots()}

        ${this.createButton('Select Interview Slot', '{{params.selectSlotUrl}}', 'primary')}

        <p style="color: #9ca3af; font-size: 14px; line-height: 1.5; margin: 32px 0; text-align: center;">
          Click the button above to access the slot selection page.
        </p>

        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0; text-align: center;">
          We look forward to speaking with you, {{params.name}}!
        </p>
      </td>
    </tr>
  `;
  }

  private getAvailableSlots(): string {
    // This will be replaced by actual slot data during rendering
    return `
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;margin:30px 0;">
        <tr>
          <td align="center">
            <h2 style="color:#2c3e50;font-size:20px;font-weight:600;margin-bottom:20px;text-align:center;line-height:1.2;">Available Time Slots</h2>
          </td>
        </tr>
        {{AVAILABLE_SLOTS_PLACEHOLDER}}
      </table>
    `;
  }

  private getAssessmentInfo(): string {
    return '';
  }
}
