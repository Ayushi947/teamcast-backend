import { BaseEmailTemplate, EmailTemplateData } from './base.template';

export interface PanelAssessmentSlotsConfirmationData
  extends EmailTemplateData {
  name: string;
  candidateName: string;
  jobTitle: string;
  companyName: string;
  confirmedSlot: {
    date: string;
    localStartTime: string;
    localEndTime: string;
    duration: string;
  };
  assessmentType: string;
}

export class PanelAssessmentSlotsConfirmationEmailTemplate extends BaseEmailTemplate {
  protected getSubject(): string {
    return 'Panel Interview Slot Confirmed - Candidate Selection';
  }

  /**
   * Override render method to handle nested confirmedSlot object
   */
  render(): { subject: string; html: string } {
    let template = this.getTemplate();

    // Replace simple template variables first
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

      // Handle nested confirmedSlot object
      if (
        this.data.confirmedSlot &&
        typeof this.data.confirmedSlot === 'object'
      ) {
        const slot = this.data.confirmedSlot as {
          date: string;
          localStartTime: string;
          localEndTime: string;
          duration: string;
        };

        template = template.replace(
          /\{\{params\.confirmedSlot\.date\}\}/g,
          slot.date || ''
        );
        template = template.replace(
          /\{\{params\.confirmedSlot\.localStartTime\}\}/g,
          slot.localStartTime || ''
        );
        template = template.replace(
          /\{\{params\.confirmedSlot\.localEndTime\}\}/g,
          slot.localEndTime || ''
        );
        template = template.replace(
          /\{\{params\.confirmedSlot\.duration\}\}/g,
          slot.duration || ''
        );
      }
    }

    return {
      subject: this.getSubject(),
      html: this.getEmailContainer(template),
    };
  }

  protected getTemplate(): string {
    return `
      <tr>
        <td align="center" style="padding: 25px 32px;" class="content-padding">
          <h1 style="color: #1f2937; font-size: 28px; font-weight: 600; margin-bottom: 20px; text-align: center; line-height: 1.2;">
            Interview Slot Selected
          </h1>
          
          ${this.createStatusContainer('✅', 'Slot Confirmed', `Hi {{params.name}}, <strong style="color: #1f2937;">{{params.candidateName}}</strong> has selected their preferred interview slot for the <strong style="color: #1f2937;">{{params.jobTitle}}</strong> position at <strong style="color: #1f2937;">{{params.companyName}}</strong>.`, 'success')}

          <!-- Interview Details -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f8fafc; border: none !important; border-radius: 12px; margin: 32px 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);">
            <tr>
              <td align="center" style="padding: 32px 24px;">
                <div style="color: #1f2937; font-size: 20px; font-weight: 600; margin-bottom: 20px;">
                  📋 Interview Details
                </div>
                <div style="color: #4b5563; font-size: 16px; line-height: 1.8; text-align: left;">
                  <strong style="color: #1f2937;">Candidate:</strong> {{params.candidateName}}<br>
                  <strong style="color: #1f2937;">Position:</strong> {{params.jobTitle}}<br>
                  <strong style="color: #1f2937;">Company:</strong> {{params.companyName}}<br>
                  <strong style="color: #1f2937;">Assessment Type:</strong> {{params.assessmentType}}
                </div>
              </td>
            </tr>
          </table>

          ${this.getSelectedSlot()}


        </td>
      </tr>
    `;
  }

  private getSelectedSlot(): string {
    return `
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; margin: 32px 0;">
        <tr>
          <td align="center">
            <h2 style="color: #1f2937; font-size: 22px; font-weight: 600; margin-bottom: 24px; text-align: center; line-height: 1.2;">Selected Interview Slot</h2>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding: 12px 0;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; border: none !important; border-radius: 12px; margin: 12px 0; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);">
              <tr>
                <td style="padding: 32px 24px;">
                  <!-- Mobile-friendly layout -->
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
                    <tr>
                      <td valign="top" style="width: 70%;">
                        <h3 style="color: #1f2937; font-size: 20px; font-weight: 600; margin: 0 0 12px 0;">{{params.confirmedSlot.date}}</h3>
                        <p style="color: #10b981; font-size: 18px; font-weight: 600; margin: 0 0 8px 0;">{{params.confirmedSlot.localStartTime}} - {{params.confirmedSlot.localEndTime}} ({{params.confirmedSlot.duration}})</p>
                       
                      </td>
                      <td valign="middle" align="right" style="width: 30%; vertical-align: middle;">
                        <div style="background-color: #f0fdf4; padding: 12px 16px; border-radius: 10px; border: none !important; box-shadow: 0 2px 6px rgba(16, 185, 129, 0.15); display: table-cell; vertical-align: middle; height: 100%;">
                          <span style="color: #15803d; font-size: 14px; font-weight: 700;">CONFIRMED</span>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;
  }
}
