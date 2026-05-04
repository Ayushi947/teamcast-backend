import { BaseEmailTemplate, EmailTemplateData } from './base.template';

export interface JobAIAssessmentInviteData extends EmailTemplateData {
  name: string;
  jobTitle: string;
  companyName: string;
  assessmentUrl: string;
  assessmentType: string;
  expiryHours: number;
}

export class JobAIAssessmentInviteEmailTemplate extends BaseEmailTemplate {
  protected getSubject(): string {
    const { jobTitle, companyName } = this.data as JobAIAssessmentInviteData;
    return `Complete your assessment: ${jobTitle} at ${companyName}`;
  }

  protected getTemplate(): string {
    const {
      name,
      jobTitle,
      companyName,
      assessmentUrl,
      assessmentType,
      expiryHours,
    } = this.data as JobAIAssessmentInviteData;

    return `
      <tr>
        <td align="center" style="padding: 32px 24px;" class="content-padding">
          <h1 style="color: #111827; font-size: 28px; font-weight: 600; margin-bottom: 16px; text-align: center; line-height: 1.25;">
            AI Assessment Invitation
          </h1>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
            Hi ${name}, exciting news! 🎯 You've been selected to showcase your talents through our cutting-edge AI assessment for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>. This is your opportunity to stand out and demonstrate why you're the perfect candidate they're looking for!
          </p>

          ${this.createStatusContainer('🤖', 'Assessment Ready', 'Your personalized assessment is ready to begin', 'info')}

          <!-- Assessment Details -->
          ${this.createInfoCard(
            '📋 Assessment Details',
            `<strong>Position:</strong> ${jobTitle}<br><strong>Company:</strong> ${companyName}<br><strong>Assessment Type:</strong> ${assessmentType}<br><strong>Time Limit:</strong> Complete within ${expiryHours} hours`,
            'highlight'
          )}

          ${this.createButton('Start Assessment', assessmentUrl, 'primary')}

          <!-- Alternative assessment link -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin: 24px 0;">
            <tr>
              <td style="padding: 16px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;">
                <div style="color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                  <strong>Button not working?</strong><br>
                  Copy and paste this link into your browser:<br>
                  <a href="${assessmentUrl}" style="color: #3b82f6; word-break: break-all; font-size: 13px;">${assessmentUrl}</a>
                </div>
              </td>
            </tr>
          </table>

          ${this.createWhatsNextSection([
            {
              icon: '⏰',
              title: 'Plan Your Time',
              description:
                'Ensure you have adequate time and a quiet environment',
            },
            {
              icon: '🤖',
              title: 'Complete Assessment',
              description:
                'Answer questions honestly and to the best of your ability',
            },
            {
              icon: '📊',
              title: 'Review Results',
              description:
                'The AI will analyze your responses and provide insights',
            },
            {
              icon: '📞',
              title: 'Next Steps',
              description:
                'Wait for feedback and potential interview invitation',
            },
          ])}

          <!-- Assessment Information -->
          ${this.createInfoCard(
            '🌟 Why Our AI Assessment is Different',
            "Teamcast's proprietary AI assessment technology is trusted by Fortune 500 companies to identify top talent. Unlike traditional assessments, our system adapts to your responses, creating a personalized experience that truly showcases your unique abilities. Over 95% of candidates find our assessments engaging and fair!",
            'highlight'
          )}

          <!-- Preparation Tips -->
          ${this.createInfoCard(
            '🎯 Assessment Tips',
            '• Find a quiet, distraction-free environment<br>• Ensure stable internet connection<br>• Be honest and authentic in your responses<br>• Take your time to think through each question<br>• Complete the assessment in one session',
            'default'
          )}


          <!-- Important Information -->
          ${this.createInfoCard(
            '⚠️ Important Information',
            `• Assessment must be completed within ${expiryHours} hours<br>• You can only take the assessment once<br>• Results will be reviewed by the hiring team<br>• Contact support if you experience technical issues`,
            'default'
          )}



          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0; text-align: center;">
            Good luck with your assessment, ${name}!
          </p>
        </td>
      </tr>
    `;
  }

  render(): { subject: string; html: string; text: string } {
    const {
      name,
      jobTitle,
      companyName,
      assessmentUrl,
      assessmentType,
      expiryHours,
    } = this.data as JobAIAssessmentInviteData;
    const baseRender = super.render();

    const text = `AI Assessment Invitation

Hi ${name},

You're invited to complete an AI-powered assessment for the ${jobTitle} position at ${companyName}.

Assessment Details:
• Position: ${jobTitle}
• Company: ${companyName}
• Assessment Type: ${assessmentType}
• Time Limit: Complete within ${expiryHours} hours

Start your assessment here:
${assessmentUrl}

What to Expect:
Our AI assessment is designed to evaluate your skills and fit for the role. It includes questions tailored to the position requirements and helps us understand your capabilities better. Be authentic in your responses.

Assessment Tips:
• Find a quiet, distraction-free environment
• Ensure stable internet connection
• Be honest and authentic in your responses
• Take your time to think through each question
• Complete the assessment in one session

What's Next?
1. Plan your time and find a quiet environment
2. Complete the assessment honestly and thoroughly
3. The AI will analyze your responses and provide insights
4. Wait for feedback and potential interview invitation

Important Information:
• Assessment must be completed within ${expiryHours} hours
• You can only take the assessment once
• Results will be reviewed by the hiring team
• Contact support if you experience technical issues

Why Teamcast?
• Intelligent: AI-powered candidate matching
• Efficient: Streamlined hiring workflows
• Reliable: Enterprise-level performance and innovation

Need assistance? Contact our support team at support@teamcast.ai

Good luck with your assessment!

Best regards,
The Teamcast Team`;

    return {
      subject: baseRender.subject,
      html: baseRender.html,
      text,
    };
  }
}
