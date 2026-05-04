import { BaseEmailTemplate, EmailTemplateData } from './base.template';

export interface JobRecommendationData extends EmailTemplateData {
  name: string;
  jobTitle: string;
  companyName: string;
  jobUrl: string;
  matchScore: number;
  location?: string;
  salary?: string;
}

export class JobRecommendationEmailTemplate extends BaseEmailTemplate {
  protected getSubject(): string {
    const { jobTitle, companyName, matchScore } = this
      .data as JobRecommendationData;
    return `${matchScore}% match: ${jobTitle} at ${companyName}`;
  }

  protected getTemplate(): string {
    const {
      name,
      jobTitle,
      companyName,
      jobUrl,
      matchScore,
      location,
      salary,
    } = this.data as JobRecommendationData;

    return `
      <tr>
        <td align="center" style="padding: 32px 24px;" class="content-padding">
          <h1 style="color: #111827; font-size: 28px; font-weight: 600; margin-bottom: 16px; text-align: center; line-height: 1.25;">
            Perfect Match Found!
          </h1>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
            Hi ${name}, amazing news! 🤖✨ Our cutting-edge AI technology has discovered an exceptional opportunity that's practically tailor-made for you, with an impressive <strong>${matchScore}% compatibility score</strong>! This level of match typically leads to successful hires and career advancement. Your next big break could be right here!
          </p>


          <!-- Job Details -->
          ${this.createInfoCard(
            '💼 Opportunity Details',
            `<strong>Position:</strong> ${jobTitle}<br><strong>Company:</strong> ${companyName}${location ? `<br><strong>Location:</strong> ${location}` : ''}${salary ? `<br><strong>Salary:</strong> ${salary}` : ''}<br><strong>Match Score:</strong> <span style="color: #059669; font-weight: 600;">${matchScore}%</span>`,
            'highlight'
          )}

          ${this.createButton('View Job Details', jobUrl, 'primary')}

          <!-- Alternative job link -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin: 24px 0;">
            <tr>
              <td style="padding: 16px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;">
                <div style="color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                  <strong>Button not working?</strong><br>
                  Copy and paste this link into your browser:<br>
                  <a href="${jobUrl}" style="color: #3b82f6; word-break: break-all; font-size: 13px;">${jobUrl}</a>
                </div>
              </td>
            </tr>
          </table>



          <!-- Why This Match -->
          ${this.createInfoCard(
            '🤖 Why This Match?',
            `Our AI analyzed your skills, experience, and preferences to identify this opportunity. The ${matchScore}% match score indicates strong alignment between your profile and the role requirements.`,
            'highlight'
          )}

          <!-- Match Insights -->
          ${this.getMatchInsights()}



          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0; text-align: center;">
            Don't miss this opportunity, ${name}!
          </p>
        </td>
      </tr>
    `;
  }

  private getMatchInsights(): string {
    const { matchScore } = this.data as JobRecommendationData;

    if (matchScore >= 90) {
      return this.createInfoCard(
        '⭐ Exceptional Match',
        'This is an outstanding match! Your profile aligns extremely well with the role requirements. We highly recommend applying as soon as possible.',
        'default'
      );
    } else if (matchScore >= 80) {
      return this.createInfoCard(
        '✨ Strong Match',
        'This is a strong match for your profile. Your skills and experience align well with what the company is looking for.',
        'default'
      );
    } else if (matchScore >= 70) {
      return this.createInfoCard(
        '👍 Good Match',
        'This opportunity shows good potential for your career. Consider reviewing the details to see if it aligns with your goals.',
        'default'
      );
    } else {
      return this.createInfoCard(
        '💡 Potential Opportunity',
        'While this may not be a perfect match, it could be a good opportunity to expand your skills or explore new areas.',
        'default'
      );
    }
  }

  render(): { subject: string; html: string; text: string } {
    const {
      name,
      jobTitle,
      companyName,
      jobUrl,
      matchScore,
      location,
      salary,
    } = this.data as JobRecommendationData;
    const baseRender = super.render();

    const text = `Perfect Match Found!

Hi ${name},

Our AI has found an excellent opportunity that matches your skills and preferences with a ${matchScore}% compatibility score.

Opportunity Details:
• Position: ${jobTitle}
• Company: ${companyName}
${location ? `• Location: ${location}` : ''}
${salary ? `• Salary: ${salary}` : ''}
• Match Score: ${matchScore}%

View job details here:
${jobUrl}

Why This Match?
Our AI analyzed your skills, experience, and preferences to identify this opportunity. The ${matchScore}% match score indicates strong alignment between your profile and the role requirements.

What's Next?
1. Review the full job description and requirements
2. Apply directly through our platform
3. High-match candidates often get priority review
4. Set up alerts for similar opportunities

${
  matchScore >= 90
    ? 'Exceptional Match: This is an outstanding match! Your profile aligns extremely well with the role requirements. We highly recommend applying as soon as possible.'
    : matchScore >= 80
      ? 'Strong Match: This is a strong match for your profile. Your skills and experience align well with what the company is looking for.'
      : matchScore >= 70
        ? 'Good Match: This opportunity shows good potential for your career. Consider reviewing the details to see if it aligns with your goals.'
        : 'Potential Opportunity: While this may not be a perfect match, it could be a good opportunity to expand your skills or explore new areas.'
}

Why Teamcast?
• Intelligent: AI-powered candidate matching
• Efficient: Streamlined hiring workflows
• Reliable: Enterprise-level performance and innovation

Need assistance? Contact our support team at support@teamcast.ai

Don't miss this opportunity!

Best regards,
The Teamcast Team`;

    return {
      subject: baseRender.subject,
      html: baseRender.html,
      text,
    };
  }
}
