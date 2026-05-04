import { BaseEmailTemplate, EmailTemplateData } from './base.template';

export interface DailyDigestData extends EmailTemplateData {
  name: string;
  companyName: string;
  date: string;
  summary: {
    newApplications: number;
    assessmentsCompleted: number;
    interviewsScheduled: number;
    offersSent: number;
  };
  topJobs: Array<{
    title: string;
    applications: number;
    status: string;
  }>;
  recentActivity: Array<{
    type: string;
    description: string;
    time: string;
  }>;
  insights: Array<{
    metric: string;
    value: string;
    change: string;
    trend: 'up' | 'down' | 'neutral';
  }>;
  dashboardUrl: string;
}

export class DailyDigestEmailTemplate extends BaseEmailTemplate {
  protected getSubject(): string {
    return 'Daily Hiring Digest - {{params.date}}';
  }

  protected getTemplate(): string {
    return `
      <tr>
        <td align="center" style="padding: 32px 24px;" class="content-padding">
          <h1 style="color: #111827; font-size: 28px; font-weight: 600; margin-bottom: 16px; text-align: center; line-height: 1.25;">
            Daily Hiring Digest
          </h1>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
            Hi {{params.name}}, here's your power-packed daily hiring intelligence report for {{params.companyName}} on {{params.date}}! 📊✨ Your hiring success is accelerating with Teamcast's AI-driven insights and analytics.
          </p>

          ${this.createStatusContainer('📊', 'Daily Summary', 'Your hiring activity overview', 'info')}

          <!-- Summary Stats -->
          ${this.createInfoCard(
            "📈 Today's Activity",
            `<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; text-align: center;">
              <div style="background-color: #f0fdf4; padding: 12px; border-radius: 6px; border: 1px solid #bbf7d0;">
                <div style="color: #16a34a; font-size: 20px; font-weight: 700;">{{params.summary.newApplications}}</div>
                <div style="color: #15803d; font-size: 12px;">New Applications</div>
              </div>
              <div style="background-color: #fef3f2; padding: 12px; border-radius: 6px; border: 1px solid #fecaca;">
                <div style="color: #dc2626; font-size: 20px; font-weight: 700;">{{params.summary.assessmentsCompleted}}</div>
                <div style="color: #b91c1c; font-size: 12px;">Assessments Completed</div>
              </div>
              <div style="background-color: #f0f9ff; padding: 12px; border-radius: 6px; border: 1px solid #bae6fd;">
                <div style="color: #0284c7; font-size: 20px; font-weight: 700;">{{params.summary.interviewsScheduled}}</div>
                <div style="color: #0369a1; font-size: 12px;">Interviews Scheduled</div>
              </div>
              <div style="background-color: #fdf4ff; padding: 12px; border-radius: 6px; border: 1px solid #e9d5ff;">
                <div style="color: #9333ea; font-size: 20px; font-weight: 700;">{{params.summary.offersSent}}</div>
                <div style="color: #7c3aed; font-size: 12px;">Offers Sent</div>
              </div>
            </div>`,
            'highlight'
          )}

          ${this.getTopJobs()}

          ${this.getRecentActivity()}

          ${this.getInsights()}

          ${this.createButton('View Full Dashboard', '{{params.dashboardUrl}}', 'primary')}

          <!-- Alternative Link -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin: 24px 0;">
            <tr>
              <td style="padding: 16px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;">
                <div style="color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                  <strong>Button not working?</strong><br>
                  Copy and paste this link into your browser:<br>
                  <a href="{{params.dashboardUrl}}" style="color: #3b82f6; word-break: break-all; font-size: 13px;">{{params.dashboardUrl}}</a>
                </div>
              </td>
            </tr>
          </table>



          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0; text-align: center;">
            🌟 Your hiring excellence continues to impress, {{params.name}}! Keep leveraging Teamcast's AI power to build your dream team! 🚀
          </p>
        </td>
      </tr>
    `;
  }

  private getTopJobs(): string {
    return this.createInfoCard(
      '🔥 Top Performing Jobs',
      `<div style="color: #4b5563; font-size: 14px; line-height: 1.6;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
          <div>
            <strong>{{params.topJobs.0.title}}</strong><br>
            <span style="color: #6b7280; font-size: 12px;">{{params.topJobs.0.status}}</span>
          </div>
          <div style="background-color: #f0fdf4; padding: 4px 8px; border-radius: 4px;">
            <span style="color: #16a34a; font-size: 12px; font-weight: 600;">{{params.topJobs.0.applications}} apps</span>
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
          <div>
            <strong>{{params.topJobs.1.title}}</strong><br>
            <span style="color: #6b7280; font-size: 12px;">{{params.topJobs.1.status}}</span>
          </div>
          <div style="background-color: #f0fdf4; padding: 4px 8px; border-radius: 4px;">
            <span style="color: #16a34a; font-size: 12px; font-weight: 600;">{{params.topJobs.1.applications}} apps</span>
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0;">
          <div>
            <strong>{{params.topJobs.2.title}}</strong><br>
            <span style="color: #6b7280; font-size: 12px;">{{params.topJobs.2.status}}</span>
          </div>
          <div style="background-color: #f0fdf4; padding: 4px 8px; border-radius: 4px;">
            <span style="color: #16a34a; font-size: 12px; font-weight: 600;">{{params.topJobs.2.applications}} apps</span>
          </div>
        </div>
      </div>`,
      'default'
    );
  }

  private getRecentActivity(): string {
    return this.createInfoCard(
      '⏰ Recent Activity',
      `<div style="color: #4b5563; font-size: 14px; line-height: 1.6;">
        <div style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
          <strong>{{params.recentActivity.0.type}}</strong> - {{params.recentActivity.0.description}}<br>
          <span style="color: #6b7280; font-size: 12px;">{{params.recentActivity.0.time}}</span>
        </div>
        <div style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
          <strong>{{params.recentActivity.1.type}}</strong> - {{params.recentActivity.1.description}}<br>
          <span style="color: #6b7280; font-size: 12px;">{{params.recentActivity.1.time}}</span>
        </div>
        <div style="padding: 8px 0;">
          <strong>{{params.recentActivity.2.type}}</strong> - {{params.recentActivity.2.description}}<br>
          <span style="color: #6b7280; font-size: 12px;">{{params.recentActivity.2.time}}</span>
        </div>
      </div>`,
      'default'
    );
  }

  private getInsights(): string {
    return this.createInfoCard(
      '📊 Key Insights',
      `<div style="color: #4b5563; font-size: 14px; line-height: 1.6;">
        <div style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
          <strong>📈 {{params.insights.0.metric}}:</strong> {{params.insights.0.value}} (${this.getTrendIcon('{{params.insights.0.trend}}')} {{params.insights.0.change}})
        </div>
        <div style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
          <strong>🎯 {{params.insights.1.metric}}:</strong> {{params.insights.1.value}} (${this.getTrendIcon('{{params.insights.1.trend}}')} {{params.insights.1.change}})
        </div>
        <div style="padding: 8px 0;">
          <strong>⏱️ {{params.insights.2.metric}}:</strong> {{params.insights.2.value}} (${this.getTrendIcon('{{params.insights.2.trend}}')} {{params.insights.2.change}})
        </div>
      </div>`,
      'default'
    );
  }

  private getTrendIcon(trend: string): string {
    switch (trend) {
      case 'up':
        return '📈';
      case 'down':
        return '📉';
      default:
        return '➡️';
    }
  }
}
