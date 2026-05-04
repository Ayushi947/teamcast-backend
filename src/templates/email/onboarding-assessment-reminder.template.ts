import { BaseEmailTemplate, EmailTemplateData } from './base.template';

export interface OnboardingAssessmentReminderEmailData
  extends EmailTemplateData {
  name: string;
  assessmentUrl: string;
  resumeCompletedDate?: string;
}

export class OnboardingAssessmentReminderEmailTemplate extends BaseEmailTemplate {
  protected getSubject(): string {
    return 'Complete Your Assessment - Next Step Awaits! 🚀';
  }

  protected getTemplate(): string {
    const { name, assessmentUrl, resumeCompletedDate } = this
      .data as OnboardingAssessmentReminderEmailData;

    return `
      <tr>
        <td align="center" style="padding: 32px 24px;" class="content-padding">
          <h1 style="color: #111827; font-size: 28px; font-weight: 600; margin-bottom: 16px; text-align: center; line-height: 1.25;">
            You're Almost There! 🎯
          </h1>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
            Hi ${name}, great job getting started on your assessment! 🎉 You're one step away from unlocking amazing opportunities. Let's complete your assessment to showcase your full potential.
          </p>

          ${this.createStatusContainer('✅', 'Assessment Started', resumeCompletedDate ? `Last activity on ${resumeCompletedDate}` : "You've already made progress", 'success')}

          ${this.createStatusContainer('⏳', 'Next Step: Complete Your Assessment', 'Finish this to unlock job opportunities', 'info')}

          <!-- Why Complete Section -->
          ${this.createInfoCard(
            '🌟 Why Complete Your Assessment?',
            '• <strong>Get Matched</strong> with top companies looking for talent like you<br>• <strong>Stand Out</strong> with a comprehensive profile that showcases your skills<br>• <strong>Unlock Opportunities</strong> that align with your career goals<br>• <strong>Fast Track</strong> your application process with verified credentials',
            'highlight'
          )}

          ${this.createButton('Complete Assessment', assessmentUrl, 'primary')}

          <!-- Alternative link -->
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
              icon: '📝',
              title: 'Start Assessment',
              description:
                'Click the button above to begin your onboarding assessment',
            },
            {
              icon: '💡',
              title: 'Answer Honestly',
              description:
                'Be authentic - this helps us match you with the right opportunities',
            },
            {
              icon: '🎯',
              title: 'Complete Profile',
              description:
                'Finish all sections to maximize your visibility to employers',
            },
            {
              icon: '🚀',
              title: 'Get Matched',
              description:
                'Start receiving job recommendations tailored to your skills',
            },
          ])}

          <!-- Assessment Tips -->
          ${this.createInfoCard(
            '💪 Quick Tips for Success',
            '• Set aside 30-45 minutes in a quiet environment<br>• Ensure you have a stable internet connection<br>• Answer all questions thoughtfully and honestly<br>• Complete the assessment in one session for best results<br>• Showcase your unique skills and experiences',
            'default'
          )}

          <!-- What to Expect -->
          ${this.createInfoCard(
            '📋 What to Expect',
            'The assessment includes questions about your:<br>• Professional experience and skills<br>• Career goals and preferences<br>• Work style and strengths<br>• Industry knowledge and expertise<br><br>This typically takes 30-45 minutes to complete.',
            'default'
          )}

          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0; text-align: center;">
            We're excited to help you find your next great opportunity, ${name}!<br>
            Complete your assessment today and take the next step in your career journey.
          </p>
        </td>
      </tr>
    `;
  }

  render(): { subject: string; html: string; text: string } {
    const { name, assessmentUrl, resumeCompletedDate } = this
      .data as OnboardingAssessmentReminderEmailData;
    const baseRender = super.render();

    const text = `You're Almost There!

Hi ${name},

Great job getting started on your assessment! 🎉 You're one step away from unlocking amazing opportunities.

Assessment Status: ✅ In Progress
${resumeCompletedDate ? `Last activity on ${resumeCompletedDate}` : 'You have already made progress'}

Next Step: Complete Your Assessment ⏳
Finish this to unlock job opportunities

Why Complete Your Assessment?
• Get Matched with top companies looking for talent like you
• Stand Out with a comprehensive profile that showcases your skills
• Unlock Opportunities that align with your career goals
• Fast Track your application process with verified credentials

Complete your onboarding assessment here:
${assessmentUrl}

What's Next?
1. Start Assessment - Click the link above to begin
2. Answer Honestly - Be authentic to get the best matches
3. Complete Profile - Finish all sections for maximum visibility
4. Get Matched - Start receiving tailored job recommendations

Quick Tips for Success:
• Set aside 30-45 minutes in a quiet environment
• Ensure you have a stable internet connection
• Answer all questions thoughtfully and honestly
• Complete the assessment in one session for best results
• Showcase your unique skills and experiences

What to Expect:
The assessment includes questions about your:
• Professional experience and skills
• Career goals and preferences
• Work style and strengths
• Industry knowledge and expertise

This typically takes 30-45 minutes to complete.

We're excited to help you find your next great opportunity!
Complete your assessment today and take the next step in your career journey.

Best regards,
The Teamcast Team

---
Why Teamcast?
• Intelligent: AI-powered candidate matching
• Efficient: Streamlined hiring workflows
• Reliable: Enterprise-level performance and innovation

Need assistance? Contact our support team at support@teamcast.ai`;

    return {
      subject: baseRender.subject,
      html: baseRender.html,
      text,
    };
  }
}
