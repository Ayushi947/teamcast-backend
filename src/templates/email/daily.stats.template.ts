import { BaseEmailTemplate, EmailTemplateData } from './base.template';

export interface DailyStatsEmailData extends EmailTemplateData {
  name: string;
  date: string;
  candidateStats: {
    invitations: {
      supportInvitations: {
        pending: number;
        accepted: number;
        expired: number;
        withdrawn: number;
        resend: number;
        total: number;
      };
      partnerInvitations: {
        pending: number;
        accepted: number;
        expired: number;
        withdrawn: number;
        total: number;
      };
      supportImports: {
        pending: number;
        processed: number;
        invited: number;
        duplicate: number;
        failed: number;
        accepted: number;
        total: number;
      };
      jobInvites: {
        pending: number;
        accepted: number;
        declined: number;
        cancelled: number;
        expired: number;
        withdrawn: number;
        total: number;
      };
    };
    assessments: {
      onboardingAssessment: {
        highlyRecommended: number;
        recommended: number;
        notRecommended: number;
      };
      jobAiAssessment: {
        highlyRecommended: number;
        recommended: number;
        notRecommended: number;
      };
    };
  };
  clientStats: {
    totalClients: number;
    jobPostings: {
      draft: number;
      published: number;
      closed: number;
      archived: number;
      total: number;
    };
    applications: {
      draft: number;
      invited: number;
      applied: number;
      reviewing: number;
      shortlisted: number;
      assessing: number;
      offered: number;
      accepted: number;
      failed: number;
      rejected: number;
      withdrawn: number;
      declined: number;
      total: number;
    };
  };
  dashboardUrl: string;
}

export class DailyStatsEmailTemplate extends BaseEmailTemplate {
  constructor(data: DailyStatsEmailData) {
    super(data);
  }

  protected getSubject(): string {
    return `Daily Stats Report - ${this.data.date}`;
  }

  protected getTemplate(): string {
    const { candidateStats, clientStats } = this.data;

    return `
      <div style="max-width: 800px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1); overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <!-- Content -->
        <div style="padding: 40px 30px;">

            <!-- Candidate Invitation Analytics -->
          <div style="margin-bottom: 40px;">
            <h2 style="color: #1f2937; font-size: 24px; font-weight: 600; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 3px solid #6e55cf; position: relative;">
              Candidate Invitation
            </h2>
            
            <div style="background: white; border-radius: 12px; padding: 25px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); border: 1px solid #f1f5f9;">
              
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: separate; border-spacing: 0; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);">
                <thead>
                  <tr style="background: linear-gradient(135deg, #f8fafc, #f1f5f9);">
                    <th style="padding: 16px 12px; font-weight: 600; font-size: 14px; color: #475569; text-align: left; border-bottom: 1px solid #e2e8f0;">Invitation Type</th>
                    <th style="padding: 16px 12px; font-weight: 600; font-size: 14px; color: #475569; text-align: center; border-bottom: 1px solid #e2e8f0;">Pending</th>
                    <th style="padding: 16px 12px; font-weight: 600; font-size: 14px; color: #475569; text-align: center; border-bottom: 1px solid #e2e8f0;">Accepted</th>
                    <th style="padding: 16px 12px; font-weight: 600; font-size: 14px; color: #475569; text-align: center; border-bottom: 1px solid #e2e8f0;">Expired</th>
                    <th style="padding: 16px 12px; font-weight: 600; font-size: 14px; color: #475569; text-align: center; border-bottom: 1px solid #e2e8f0;">Withdrawn</th>
                    <th style="padding: 16px 12px; font-weight: 600; font-size: 14px; color: #475569; text-align: center; border-bottom: 1px solid #e2e8f0;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 16px 12px; color: #334155; font-size: 14px; font-weight: 500; color: #1e293b;">Support Invitations</td>
                    <td style="padding: 16px 12px; text-align: center; font-size: 14px; color: #6e55cf; font-weight: 600;">${candidateStats.invitations.supportInvitations.pending}</td>
                    <td style="padding: 16px 12px; text-align: center; font-size: 14px; color: #6e55cf; font-weight: 600;">${candidateStats.invitations.supportInvitations.accepted}</td>
                    <td style="padding: 16px 12px; text-align: center; font-size: 14px; color: #6e55cf; font-weight: 600;">${candidateStats.invitations.supportInvitations.expired}</td>
                    <td style="padding: 16px 12px; text-align: center; font-size: 14px; color: #6e55cf; font-weight: 600;">${candidateStats.invitations.supportInvitations.withdrawn}</td>
                    <td style="padding: 16px 12px; text-align: center; font-size: 14px; color: #6e55cf; font-weight: 600;">${candidateStats.invitations.supportInvitations.total}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 16px 12px; color: #334155; font-size: 14px; font-weight: 500; color: #1e293b;">Partner Invitations</td>
                    <td style="padding: 16px 12px; text-align: center; font-size: 14px; color: #6e55cf; font-weight: 600;">${candidateStats.invitations.partnerInvitations.pending}</td>
                    <td style="padding: 16px 12px; text-align: center; font-size: 14px; color: #6e55cf; font-weight: 600;">${candidateStats.invitations.partnerInvitations.accepted}</td>
                    <td style="padding: 16px 12px; text-align: center; font-size: 14px; color: #6e55cf; font-weight: 600;">${candidateStats.invitations.partnerInvitations.expired}</td>
                    <td style="padding: 16px 12px; text-align: center; font-size: 14px; color: #6e55cf; font-weight: 600;">${candidateStats.invitations.partnerInvitations.withdrawn}</td>
                    <td style="padding: 16px 12px; text-align: center; font-size: 14px; color: #6e55cf; font-weight: 600;">${candidateStats.invitations.partnerInvitations.total}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 16px 12px; color: #334155; font-size: 14px; font-weight: 500; color: #1e293b;">Support Imports</td>
                    <td style="padding: 16px 12px; text-align: center; font-size: 14px; color: #6e55cf; font-weight: 600;">${candidateStats.invitations.supportImports.pending}</td>
                    <td style="padding: 16px 12px; text-align: center; font-size: 14px; color: #6e55cf; font-weight: 600;">${candidateStats.invitations.supportImports.processed}</td>
                    <td style="padding: 16px 12px; text-align: center; font-size: 14px; color: #6e55cf; font-weight: 600;">${candidateStats.invitations.supportImports.invited}</td>
                    <td style="padding: 16px 12px; text-align: center; font-size: 14px; color: #6e55cf; font-weight: 600;">${candidateStats.invitations.supportImports.duplicate}</td>
                    <td style="padding: 16px 12px; text-align: center; font-size: 14px; color: #6e55cf; font-weight: 600;">${candidateStats.invitations.supportImports.total}</td>
                  </tr>
                  <tr>
                    <td style="padding: 16px 12px; color: #334155; font-size: 14px; font-weight: 500; color: #1e293b;">Job Invites</td>
                    <td style="padding: 16px 12px; text-align: center; font-size: 14px; color: #6e55cf; font-weight: 600;">${candidateStats.invitations.jobInvites.pending}</td>
                    <td style="padding: 16px 12px; text-align: center; font-size: 14px; color: #6e55cf; font-weight: 600;">${candidateStats.invitations.jobInvites.accepted}</td>
                    <td style="padding: 16px 12px; text-align: center; font-size: 14px; color: #6e55cf; font-weight: 600;">${candidateStats.invitations.jobInvites.declined}</td>
                    <td style="padding: 16px 12px; text-align: center; font-size: 14px; color: #6e55cf; font-weight: 600;">${candidateStats.invitations.jobInvites.cancelled}</td>
                    <td style="padding: 16px 12px; text-align: center; font-size: 14px; color: #6e55cf; font-weight: 600;">${candidateStats.invitations.jobInvites.total}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            </div>

            <!-- Assessment Analytics -->
          <div style="margin-bottom: 40px;">
            <h2 style="color: #1f2937; font-size: 24px; font-weight: 600; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 3px solid #6e55cf; position: relative;">
              Assessment Analytics
            </h2>
            
            <div style="display: flex; gap: 20px; flex-wrap: wrap;">
              <!-- Onboarding Assessment -->
              <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); border: 1px solid #f1f5f9; flex: 1; min-width: 300px;">
                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                  <div style="font-size: 16px; font-weight: 600; color: #1f2937;">Onboarding Assessment</div>
                </div>
                
                <div style="display: flex; gap: 12px; justify-content: space-between;">
                  <div style="background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-radius: 8px; padding: 15px; text-align: center; border: 1px solid #e2e8f0; flex: 1;">
                    <div style="font-size: 24px; font-weight: 700; color: #6e55cf; margin-bottom: 3px;">${candidateStats.assessments.onboardingAssessment.highlyRecommended}</div>
                    <div style="font-size: 12px; color: #64748b; font-weight: 500;">Highly Recommended</div>
                  </div>
                  <div style="background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-radius: 8px; padding: 15px; text-align: center; border: 1px solid #e2e8f0; flex: 1;">
                    <div style="font-size: 24px; font-weight: 700; color: #6e55cf; margin-bottom: 3px;">${candidateStats.assessments.onboardingAssessment.recommended}</div>
                    <div style="font-size: 12px; color: #64748b; font-weight: 500;">Recommended</div>
                  </div>
                  <div style="background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-radius: 8px; padding: 15px; text-align: center; border: 1px solid #e2e8f0; flex: 1;">
                    <div style="font-size: 24px; font-weight: 700; color: #6e55cf; margin-bottom: 3px;">${candidateStats.assessments.onboardingAssessment.notRecommended}</div>
                    <div style="font-size: 12px; color: #64748b; font-weight: 500;">Not Recommended</div>
                  </div>
                </div>
              </div>

              <!-- Job AI Assessment -->
              <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); border: 1px solid #f1f5f9; flex: 1; min-width: 300px;">
                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                  <div style="font-size: 16px; font-weight: 600; color: #1f2937;">Job AI Assessment</div>
                </div>
                
                <div style="display: flex; gap: 12px; justify-content: space-between;">
                  <div style="background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-radius: 8px; padding: 15px; text-align: center; border: 1px solid #e2e8f0; flex: 1;">
                    <div style="font-size: 24px; font-weight: 700; color: #6e55cf; margin-bottom: 3px;">${candidateStats.assessments.jobAiAssessment.highlyRecommended}</div>
                    <div style="font-size: 12px; color: #64748b; font-weight: 500;">Highly Recommended</div>
                  </div>
                  <div style="background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-radius: 8px; padding: 15px; text-align: center; border: 1px solid #e2e8f0; flex: 1;">
                    <div style="font-size: 24px; font-weight: 700; color: #6e55cf; margin-bottom: 3px;">${candidateStats.assessments.jobAiAssessment.recommended}</div>
                    <div style="font-size: 12px; color: #64748b; font-weight: 500;">Recommended</div>
                  </div>
                  <div style="background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-radius: 8px; padding: 15px; text-align: center; border: 1px solid #e2e8f0; flex: 1;">
                    <div style="font-size: 24px; font-weight: 700; color: #6e55cf; margin-bottom: 3px;">${candidateStats.assessments.jobAiAssessment.notRecommended}</div>
                    <div style="font-size: 12px; color: #64748b; font-weight: 500;">Not Recommended</div>
                  </div>
                </div>
              </div>
            </div>
            </div>

            <!-- Client Activity Summary -->
          <div style="margin-bottom: 32px;">
            <h2 style="color: #1f2937; font-size: 24px; font-weight: 600; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 3px solid #6e55cf; position: relative;">
              Client Activity Summary
            </h2>
            
            <!-- Job Postings -->
            <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); border: 1px solid #f1f5f9; margin-bottom: 24px;">
              <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <div style="font-size: 16px; font-weight: 600; color: #1f2937;">Job Postings Status</div>
              </div>
              
              <div style="display: flex; gap: 12px; justify-content: space-between; flex-wrap: wrap;">
                <div style="background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-radius: 8px; padding: 15px; text-align: center; border: 1px solid #e2e8f0; flex: 1; min-width: 120px;">
                  <div style="font-size: 24px; font-weight: 700; color: #6e55cf; margin-bottom: 3px;">${clientStats.jobPostings.draft}</div>
                  <div style="font-size: 12px; color: #64748b; font-weight: 500;">Draft</div>
                </div>
                <div style="background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-radius: 8px; padding: 15px; text-align: center; border: 1px solid #e2e8f0; flex: 1; min-width: 120px;">
                  <div style="font-size: 24px; font-weight: 700; color: #6e55cf; margin-bottom: 3px;">${clientStats.jobPostings.published}</div>
                  <div style="font-size: 12px; color: #64748b; font-weight: 500;">Published</div>
                </div>
                <div style="background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-radius: 8px; padding: 15px; text-align: center; border: 1px solid #e2e8f0; flex: 1; min-width: 120px;">
                  <div style="font-size: 24px; font-weight: 700; color: #6e55cf; margin-bottom: 3px;">${clientStats.jobPostings.closed}</div>
                  <div style="font-size: 12px; color: #64748b; font-weight: 500;">Closed</div>
                </div>
                <div style="background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-radius: 8px; padding: 15px; text-align: center; border: 1px solid #e2e8f0; flex: 1; min-width: 120px;">
                  <div style="font-size: 24px; font-weight: 700; color: #6e55cf; margin-bottom: 3px;">${clientStats.jobPostings.archived}</div>
                  <div style="font-size: 12px; color: #64748b; font-weight: 500;">Archived</div>
                </div>
                <div style="background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-radius: 8px; padding: 15px; text-align: center; border: 1px solid #e2e8f0; flex: 1; min-width: 120px;">
                  <div style="font-size: 24px; font-weight: 700; color: #6e55cf; margin-bottom: 3px;">${clientStats.jobPostings.total}</div>
                  <div style="font-size: 12px; color: #64748b; font-weight: 500;">Total</div>
                </div>
              </div>
            </div>

            <!-- Applications -->
            <div style="background: white; border-radius: 12px; padding: 25px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); border: 1px solid #f1f5f9;">
              <div style="display: flex; align-items: center; margin-bottom: 20px;">
                <div style="font-size: 18px; font-weight: 600; color: #1f2937;">Job Applications Pipeline</div>
              </div>
                              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: separate; border-spacing: 0; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);">
                <thead>
                  <tr style="background: linear-gradient(135deg, #f8fafc, #f1f5f9);">
                    <th style="padding: 16px 12px; font-weight: 600; font-size: 14px; color: #475569; text-align: left; border-bottom: 1px solid #e2e8f0;">Stage</th>
                    <th style="padding: 16px 12px; font-weight: 600; font-size: 14px; color: #475569; text-align: center; border-bottom: 1px solid #e2e8f0;">Count</th>
                    <th style="padding: 16px 12px; font-weight: 600; font-size: 14px; color: #475569; text-align: left; border-bottom: 1px solid #e2e8f0;">Stage</th>
                    <th style="padding: 16px 12px; font-weight: 600; font-size: 14px; color: #475569; text-align: center; border-bottom: 1px solid #e2e8f0;">Count</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 16px 12px; color: #334155; font-size: 14px; font-weight: 500; color: #1e293b;">Draft</td>
                    <td style="padding: 16px 12px; text-align: center; font-size: 14px; color: #6e55cf; font-weight: 600;">${clientStats.applications.draft}</td>
                    <td style="padding: 16px 12px; color: #334155; font-size: 14px; font-weight: 500; color: #1e293b;">Offered</td>
                    <td style="padding: 16px 12px; text-align: center; font-size: 14px; color: #6e55cf; font-weight: 600;">${clientStats.applications.offered}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 16px 12px; color: #334155; font-size: 14px; font-weight: 500; color: #1e293b;">Invited</td>
                    <td style="padding: 16px 12px; text-align: center; font-size: 14px; color: #6e55cf; font-weight: 600;">${clientStats.applications.invited}</td>
                    <td style="padding: 16px 12px; color: #334155; font-size: 14px; font-weight: 500; color: #1e293b;">Accepted</td>
                    <td style="padding: 16px 12px; text-align: center; font-size: 14px; color: #6e55cf; font-weight: 600;">${clientStats.applications.accepted}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 16px 12px; color: #334155; font-size: 14px; font-weight: 500; color: #1e293b;">Applied</td>
                    <td style="padding: 16px 12px; text-align: center; font-size: 14px; color: #6e55cf; font-weight: 600;">${clientStats.applications.applied}</td>
                    <td style="padding: 16px 12px; color: #334155; font-size: 14px; font-weight: 500; color: #1e293b;">Failed</td>
                    <td style="padding: 16px 12px; text-align: center; font-size: 14px; color: #6e55cf; font-weight: 600;">${clientStats.applications.failed}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 16px 12px; color: #334155; font-size: 14px; font-weight: 500; color: #1e293b;">Reviewing</td>
                    <td style="padding: 16px 12px; text-align: center; font-size: 14px; color: #6e55cf; font-weight: 600;">${clientStats.applications.reviewing}</td>
                    <td style="padding: 16px 12px; color: #334155; font-size: 14px; font-weight: 500; color: #1e293b;">Rejected</td>
                    <td style="padding: 16px 12px; text-align: center; font-size: 14px; color: #6e55cf; font-weight: 600;">${clientStats.applications.rejected}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 16px 12px; color: #334155; font-size: 14px; font-weight: 500; color: #1e293b;">Shortlisted</td>
                    <td style="padding: 16px 12px; text-align: center; font-size: 14px; color: #6e55cf; font-weight: 600;">${clientStats.applications.shortlisted}</td>
                    <td style="padding: 16px 12px; color: #334155; font-size: 14px; font-weight: 500; color: #1e293b;">Withdrawn</td>
                    <td style="padding: 16px 12px; text-align: center; font-size: 14px; color: #6e55cf; font-weight: 600;">${clientStats.applications.withdrawn}</td>
                  </tr>
                  <tr>
                    <td style="padding: 16px 12px; color: #334155; font-size: 14px; font-weight: 500; color: #1e293b;">Assessing</td>
                    <td style="padding: 16px 12px; text-align: center; font-size: 14px; color: #6e55cf; font-weight: 600;">${clientStats.applications.assessing}</td>
                    <td style="padding: 16px 12px; color: #334155; font-size: 14px; font-weight: 500; color: #1e293b;">Declined</td>
                    <td style="padding: 16px 12px; text-align: center; font-size: 14px; color: #6e55cf; font-weight: 600;">${clientStats.applications.declined}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    `;
  }

  render(): { subject: string; html: string; text: string } {
    const html = this.getEmailContainer(this.getTemplate());
    const text = `Daily Stats Report for ${this.data.date}`;

    return {
      subject: this.getSubject(),
      html,
      text,
    };
  }
}
