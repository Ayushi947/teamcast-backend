import { BaseEmailTemplate, EmailTemplateData } from './base.template';

export interface DailyDigestEmailData extends EmailTemplateData {
  name: string;
  date: string;
  clientName: string;
  jobPostings: {
    id: string;
    title: string;
    status: string;
    totalRecommendations: number;
    todaysCandidates: {
      id: string;
      name: string;
      image?: string;
      currentJobTitle?: string;
      score: number;
      matchReason: string[];
      onboardingRecommendation?: string;
      resume?: {
        experience?: any[];
        education?: any[];
      };
    }[];
  }[];
  dashboardUrl: string;
}

export class DailyDigestEmailTemplate extends BaseEmailTemplate {
  constructor(data: DailyDigestEmailData) {
    super(data);
  }

  protected getSubject(): string {
    return `Daily Digest - ${this.data.clientName} - ${this.data.date}`;
  }

  protected getTemplate(): string {
    const { jobPostings, dashboardUrl } = this.data;

    return `
      <tr>
        <td align="center" style="padding: 32px 24px;" class="content-padding">
          <h1 style="color: #111827; font-size: 28px; font-weight: 600; margin-bottom: 16px; text-align: center; line-height: 1.25;">
            Daily Digest Report
          </h1>

          <div style="margin-bottom: 30px;">
            ${
              jobPostings.length === 0
                ? `
              ${this.createStatusContainer(
                '📋',
                'No Active Job Postings',
                'No active job postings found at this time.',
                'info'
              )}
            `
                : jobPostings
                    .map(
                      (jobPosting: any) => `
              ${this.createInfoCard(
                jobPosting.title,
                `
                ${
                  jobPosting.todaysCandidates.length > 0
                    ? `
                  <div style="margin-top: 16px;">
                    <h4 style="color: #374151; font-size: 16px; font-weight: 600; margin: 0 0 16px 0;">Recommended Candidates</h4>
                    
                    <div style="display: block; width: 100%;">
                      ${jobPosting.todaysCandidates
                        .map(
                          (candidate: any) => `
                                    <div style="background: #f8fafc; border-radius: 8px; padding: 16px; border: 1px solid #e2e8f0; margin-bottom: 12px; width: 100%; box-sizing: border-box;">
                                      
                                      <!-- Table-based layout for better email client compatibility -->
                                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse;">
                                        <tr>
                                          <!-- Candidate Info Column -->
                                          <td style="vertical-align: top; padding-right: 12px;">
                                            <div style="font-weight: 600; color: #1f2937; font-size: 16px; margin-bottom: 2px; line-height: 1.3;">${candidate.name}</div>
                                            <div style="color: #6b7280; font-size: 14px; font-weight: 400; line-height: 1.3;">${candidate.currentJobTitle || 'Job Title Not Available'}</div>
                                          </td>
                                          
                                          <!-- Onboarding Recommendation Column - Right aligned -->
                                          <td style="vertical-align: top; text-align: right;">
                                            <div style="display: inline-block; text-align: center; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 20px; padding: 6px 12px; white-space: nowrap;">
                                              <div style="font-size: 10px; font-weight: 700; color: #15803d; line-height: 1.2;">
                                                ${candidate.onboardingRecommendation || 'Recommended'}
                                              </div>
                                            </div>
                                          </td>
                                        </tr>
                                      </table>
                          
                          ${
                            candidate.matchReason &&
                            candidate.matchReason.length > 0
                              ? `
                            <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #e2e8f0;">
                              <div style="color: #374151; font-size: 13px; font-weight: 600; margin-bottom: 8px;">Why this candidate matches:</div>
                              <div style="display: block; width: 100%;">
                                ${candidate.matchReason
                                  .map(
                                    (reason: string) => `
                                  <div style="background: linear-gradient(135deg, #e0e7ff 0%, #f0f4ff 100%); color: #3730a3; padding: 6px 10px; border-radius: 6px; font-size: 12px; line-height: 1.4; margin-bottom: 4px; width: 100%; box-sizing: border-box; border-left: 3px solid #6366f1;">
                                    ${reason}
                                  </div>
                                `
                                  )
                                  .join('')}
                              </div>
                            </div>
                          `
                              : ''
                          }
                        </div>
                      `
                        )
                        .join('')}
                    </div>
                  </div>
                `
                    : `
                  <div style="text-align: center;color: #6b7280; background: #f9fafb;">
                    <div style="font-size: 24px; margin-bottom: 8px;">🔍</div>
                    <p style="font-size: 14px; margin: 0; font-weight: 500;">No candidates recommended for this job posting today.</p>
                    <p style="font-size: 12px; margin: 4px 0 0 0; color: #9ca3af;">Check back tomorrow for new matches!</p>
                  </div>
                `
                }
                `,
                'highlight'
              )}
            `
                    )
                    .join('')
            }
          </div>

          ${this.createButton('View Dashboard', dashboardUrl, 'primary')}
        </td>
      </tr>
    `;
  }

  render(): { subject: string; html: string; text: string } {
    const baseRender = super.render();

    const text = `Daily Digest Report for ${this.data.clientName} - ${this.data.date}

Job Postings & Recommended Candidates:
${this.data.jobPostings.map((jp: any) => `- ${jp.title}: ${jp.totalRecommendations} candidates recommended today`).join('\n')}

View your dashboard: ${this.data.dashboardUrl}

Best regards,
The Teamcast Team`;

    return {
      subject: baseRender.subject,
      html: baseRender.html,
      text,
    };
  }
}
