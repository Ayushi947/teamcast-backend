import { BaseEmailTemplate, EmailTemplateData } from './base.template';

export interface RecommendedCandidatesData extends EmailTemplateData {
  name: string;
  jobTitle: string;
  companyName: string;
  candidates: Array<{
    id: string;
    name: string;
    title: string;
    experience: string;
    skills: string[];
    matchScore: number;
    location: string;
    profileUrl: string;
  }>;
  totalCandidates: number;
  dashboardUrl: string;
}

export class RecommendedCandidatesEmailTemplate extends BaseEmailTemplate {
  protected getSubject(): string {
    return '{{params.totalCandidates}} Candidates Recommended for {{params.jobTitle}}';
  }

  /**
   * Override render method to handle candidates array and skills
   */
  render(): { subject: string; html: string } {
    let template = this.getTemplate();

    // Handle candidates array and skills
    const data = this.data as RecommendedCandidatesData;
    if (data.candidates && data.candidates.length > 0) {
      const firstCandidate = data.candidates[0];

      // Replace candidate-specific placeholders
      template = template.replace(
        /\{\{params\.candidates\.0\.name\}\}/g,
        firstCandidate.name || ''
      );
      template = template.replace(
        /\{\{params\.candidates\.0\.title\}\}/g,
        firstCandidate.title || ''
      );
      template = template.replace(
        /\{\{params\.candidates\.0\.location\}\}/g,
        firstCandidate.location || ''
      );
      template = template.replace(
        /\{\{params\.candidates\.0\.experience\}\}/g,
        firstCandidate.experience || ''
      );
      template = template.replace(
        /\{\{params\.candidates\.0\.matchScore\}\}/g,
        String(firstCandidate.matchScore || 0)
      );
      template = template.replace(
        /\{\{params\.candidates\.0\.profileUrl\}\}/g,
        firstCandidate.profileUrl || ''
      );

      // Handle skills array
      if (firstCandidate.skills && firstCandidate.skills.length > 0) {
        const skillsHtml = firstCandidate.skills
          .slice(0, 3) // Show only first 3 skills
          .map(
            (skill) =>
              `<span style="background-color: #f1f5f9; color: #475569; padding: 6px 12px; border-radius: 6px; font-size: 13px; border: none; font-weight: 500;">${skill}</span>`
          )
          .join('');

        // Replace the skills placeholder
        template = template.replace(
          /<span style="background-color: #f1f5f9; color: #475569; padding: 6px 12px; border-radius: 6px; font-size: 13px; border: none; font-weight: 500;">\{\{params\.candidates\.0\.skills\.0\}\}<\/span>\s*<span style="background-color: #f1f5f9; color: #475569; padding: 6px 12px; border-radius: 6px; font-size: 13px; border: none; font-weight: 500;">\{\{params\.candidates\.0\.skills\.1\}\}<\/span>\s*<span style="background-color: #f1f5f9; color: #475569; padding: 6px 12px; border-radius: 6px; font-size: 13px; border: none; font-weight: 500;">\{\{params\.candidates\.0\.skills\.2\}\}<\/span>/g,
          skillsHtml
        );
      } else {
        // Remove skills section if no skills available
        template = template.replace(
          /<div style="margin-bottom: 24px;">[\s\S]*?<div style="color: #4b5563; font-size: 14px; font-weight: 600; margin-bottom: 10px;">Key Skills:<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>/g,
          ''
        );
      }
    } else {
      // Handle case when no candidates are available
      template = template.replace(
        /<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; margin: 32px 0;">[\s\S]*?<\/table>/g,
        `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; margin: 32px 0;">
          <tr>
            <td align="center" style="padding: 32px 24px;">
              <div style="color: #6b7280; font-size: 16px; text-align: center; line-height: 1.6;">
                We're currently processing candidate matches. You'll receive an update once we have recommendations ready.
              </div>
            </td>
          </tr>
        </table>`
      );
    }

    // Replace remaining template variables
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

  protected getTemplate(): string {
    return `
      <tr>
        <td align="center" style="padding: 25px 32px;" class="content-padding">
          <h1 style="color: #1f2937; font-size: 28px; font-weight: 600; margin-bottom: 20px; text-align: center; line-height: 1.2;">
            Candidate Recommendations
          </h1>
          
          ${this.createStatusContainer('🎯', 'AI-Powered Matching', `Hi {{params.name}}, we've found {{params.totalCandidates}} highly qualified candidates for your <strong style="color: #1f2937;">{{params.jobTitle}}</strong> position at <strong style="color: #1f2937;">{{params.companyName}}</strong>.`, 'success')}

          <!-- Job Details -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f8fafc; border: none !important; border-radius: 12px; margin: 32px 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);">
            <tr>
              <td align="center" style="padding: 32px 24px;">
                <div style="color: #1f2937; font-size: 20px; font-weight: 600; margin-bottom: 20px;">
                  💼 Position Details
                </div>
                <div style="color: #4b5563; font-size: 16px; line-height: 1.8; text-align: left;">
                  <strong style="color: #1f2937;">Job Title:</strong> {{params.jobTitle}}<br>
                  <strong style="color: #1f2937;">Company:</strong> {{params.companyName}}<br>
                  <strong style="color: #1f2937;">Total Candidates:</strong> {{params.totalCandidates}}<br>
                  <strong style="color: #1f2937;">Match Criteria:</strong> Skills, Experience, Location
                </div>
              </td>
            </tr>
          </table>

          ${this.getCandidatesList()}

          ${this.createButton('View All Candidates', '{{params.dashboardUrl}}', 'primary')}

          <p style="color: #9ca3af; font-size: 14px; line-height: 1.5; margin: 32px 0; text-align: center;">
            Click the button above to access your dashboard and review all candidates.
          </p>

          ${this.getRecommendationInfo()}

          <p style="color: #9ca3af; font-size: 14px; line-height: 1.5; margin: 32px 0; text-align: center;">
            Need help with candidate selection? Contact our support team at 
            <a href="mailto:support@teamcast.ai" style="color: #3b82f6; text-decoration: none; font-weight: 500;">support@teamcast.ai</a>
          </p>

          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0; text-align: center;">
            Happy hiring, {{params.name}}! 🚀
          </p>
        </td>
      </tr>
    `;
  }

  private getCandidatesList(): string {
    return `
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; margin: 32px 0;">
        <tr>
          <td align="center">
            <h2 style="color: #1f2937; font-size: 22px; font-weight: 600; margin-bottom: 24px; text-align: center; line-height: 1.2;">Top Recommended Candidates</h2>
          </td>
        </tr>
        ${this.renderCandidates()}
      </table>
    `;
  }

  private renderCandidates(): string {
    // Simple template that will be processed by the base template system
    return `
      <tr>
        <td align="center" style="padding: 12px 0;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; border: none !important; border-radius: 12px; margin: 12px 0; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);">
            <tr>
              <td style="padding: 32px 24px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                  <div>
                    <h3 style="color: #1f2937; font-size: 20px; font-weight: 600; margin: 0 0 10px 0;">{{params.candidates.0.name}}</h3>
                    <p style="color: #3b82f6; font-size: 16px; font-weight: 500; margin: 0 0 10px 0;">{{params.candidates.0.title}}</p>
                    <div style="display: flex; gap: 16px; margin-bottom: 16px;">
                      <span style="color: #6b7280; font-size: 14px;">📍 {{params.candidates.0.location}}</span>
                      <span style="color: #6b7280; font-size: 14px;">💼 {{params.candidates.0.experience}}</span>
                    </div>
                  </div>
                  <div style="background-color: #f0fdf4; padding: 10px 16px; border-radius: 8px; border: none !important; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                    <span style="color: #16a34a; font-size: 13px; font-weight: 600;">{{params.candidates.0.matchScore}}% MATCH</span>
                  </div>
                </div>
                <div style="margin-bottom: 24px;">
                  <div style="color: #4b5563; font-size: 14px; font-weight: 600; margin-bottom: 10px;">Key Skills:</div>
                  <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    ${this.getSkillsTags()}
                  </div>
                </div>
                ${this.createButton('View Profile', '{{params.candidates.0.profileUrl}}', 'secondary')}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
  }

  private getSkillsTags(): string {
    // Generate skills tags that will be processed by the template system
    return `
      <span style="background-color: #f1f5f9; color: #475569; padding: 6px 12px; border-radius: 6px; font-size: 13px; border: none; font-weight: 500;">{{params.candidates.0.skills.0}}</span>
      <span style="background-color: #f1f5f9; color: #475569; padding: 6px 12px; border-radius: 6px; font-size: 13px; border: none; font-weight: 500;">{{params.candidates.0.skills.1}}</span>
      <span style="background-color: #f1f5f9; color: #475569; padding: 6px 12px; border-radius: 6px; font-size: 13px; border: none; font-weight: 500;">{{params.candidates.0.skills.2}}</span>
    `;
  }

  private getRecommendationInfo(): string {
    return `
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; margin: 10px 0;">
        <tr>
          <td align="center">
            <h2 style="color: #1f2937; font-size: 22px; font-weight: 600; margin-bottom: 24px; text-align: center; line-height: 1.2;">How We Match Candidates</h2>
          </td>
        </tr>
        <tr>
          <td align="left" style="padding-top: 12px; padding-bottom: 6px;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f0fdf4; border-radius: 10px; border: none !important; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);">
              <tr>
                <td class="feature-item-cell" style="padding: 18px;">
                  <div style="color: #16a34a; font-size: 15px; line-height: 1.6;">
                    <strong>🎯 Skill Matching:</strong> AI analyzes technical skills and experience requirements
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="left" style="padding-top: 12px; padding-bottom: 6px;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f8fafc; border-radius: 10px; border: none !important; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);">
              <tr>
                <td class="feature-item-cell" style="padding: 18px;">
                  <div style="color: #4b5563; font-size: 15px; line-height: 1.6;">
                    <strong>📍 Location Preferences:</strong> Considers remote work and relocation preferences
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="left" style="padding-top: 12px; padding-bottom: 6px;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f8fafc; border-radius: 10px; border: none !important; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);">
              <tr>
                <td class="feature-item-cell" style="padding: 18px;">
                  <div style="color: #4b5563; font-size: 15px; line-height: 1.6;">
                    <strong>📊 Assessment Results:</strong> Includes AI assessment scores and performance data
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="left" style="padding-top: 12px; padding-bottom: 6px;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f8fafc; border-radius: 10px; border: none !important; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);">
              <tr>
                <td class="feature-item-cell" style="padding: 18px;">
                  <div style="color: #4b5563; font-size: 15px; line-height: 1.6;">
                    <strong>⭐ Cultural Fit:</strong> Evaluates alignment with company culture and values
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;
  }
}
