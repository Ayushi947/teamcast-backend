import { BaseEmailTemplate, EmailTemplateData } from './base.template';

export interface ApplicationStatusEmailData extends EmailTemplateData {
  candidateName?: string;
  jobTitle: string;
  companyName: string;
  status:
    | 'accepted'
    | 'rejected'
    | 'declined'
    | 'withdrawn'
    | 'submitted'
    | 'shortlisted'
    | 'interview_scheduled'
    | 'offer_extended';
  notes?: string;
  actionUrl?: string;
  isForCandidate?: boolean;
  isForClient?: boolean;
  nextSteps?: string;
  interviewDate?: string;
  offerDetails?: string;
}

export class ApplicationStatusEmailTemplate extends BaseEmailTemplate {
  constructor(data: ApplicationStatusEmailData) {
    super(data);
  }

  protected getSubject(): string {
    const { status, jobTitle, companyName, candidateName, isForCandidate } =
      this.data as ApplicationStatusEmailData;

    if (isForCandidate) {
      switch (status) {
        case 'accepted':
          return `Invitation Accepted: ${jobTitle} at ${companyName}`;
        case 'offer_extended':
          return `Congratulations! Offer for ${jobTitle} position`;
        case 'rejected':
          return `Application update: ${jobTitle} at ${companyName}`;
        case 'declined':
          return `Invitation Declined: ${jobTitle} at ${companyName}`;
        case 'withdrawn':
          return `Application withdrawn: ${jobTitle}`;
        case 'submitted':
          return `Application received: ${jobTitle} at ${companyName}`;
        case 'shortlisted':
          return `You're shortlisted for ${jobTitle}!`;
        case 'interview_scheduled':
          return `Interview scheduled: ${jobTitle} at ${companyName}`;
        default:
          return `Application update: ${jobTitle}`;
      }
    } else {
      switch (status) {
        case 'accepted':
          return `${candidateName} accepted your invitation to apply`;
        case 'rejected':
          return `${candidateName} declined your job offer`;
        case 'declined':
          return `${candidateName} declined your invitation to apply for ${jobTitle}`;
        case 'withdrawn':
          return `${candidateName} withdrew their application`;
        case 'submitted':
          return `New application: ${candidateName} applied for ${jobTitle}`;
        case 'shortlisted':
          return `${candidateName} has been shortlisted for ${jobTitle}`;
        case 'interview_scheduled':
          return `Interview scheduled with ${candidateName}`;
        default:
          return `Application update: ${jobTitle}`;
      }
    }
  }

  protected getTemplate(): string {
    const {
      candidateName,
      jobTitle,
      companyName,
      status,
      actionUrl,
      isForCandidate,
      interviewDate,
    } = this.data as ApplicationStatusEmailData;

    const config = this.getStatusConfig(status, isForCandidate || false);

    return `
      <tr>
        <td align="center" style="padding: 32px 24px;" class="content-padding">
          <h1 style="color: #111827; font-size: 28px; font-weight: 600; margin-bottom: 16px; text-align: center; line-height: 1.25;">
            ${config.title}
          </h1>
          
          ${this.createStatusContainer(config.icon, config.subtitle, config.description, config.type)}

          <!-- Application Details -->
          ${this.createInfoCard(
            'Application Details',
            `<strong>Position:</strong> ${jobTitle}<br><strong>Company:</strong> ${companyName}${candidateName && !isForCandidate ? `<br><strong>Candidate:</strong> ${candidateName}` : ''}<br><strong>Status:</strong> <span style="color: ${config.color}; font-weight: 600;">${config.statusDisplay}</span>${interviewDate ? `<br><strong>Interview Date:</strong> ${interviewDate}` : ''}`,
            'highlight'
          )}

          ${actionUrl ? this.createButton(config.buttonText, actionUrl, 'primary') : ''}

          ${this.getWhatsNextSectionByStatus(status, isForCandidate || false)}
        </td>
      </tr>
    `;
  }

  private getStatusConfig(status: string, isForCandidate: boolean): any {
    const configs = {
      accepted: {
        type: 'success' as const,
        color: '#059669',
        icon: '',
        title: isForCandidate ? 'Invitation Accepted!' : 'Invitation Accepted',
        subtitle: isForCandidate
          ? 'You accepted the job invitation'
          : 'Candidate accepted the invitation',
        description: isForCandidate
          ? `Thank you for accepting the invitation to apply for the ${this.data.jobTitle} position at ${this.data.companyName}. Your application has been submitted and is now under review.`
          : `${this.data.candidateName} has accepted your invitation to apply for the ${this.data.jobTitle} position. Their application is now in your pipeline for review.`,
        statusDisplay: 'Application Submitted',
        buttonText: isForCandidate
          ? 'View Application Status'
          : 'Review Application',
      },
      rejected: {
        type: 'error' as const,
        color: '#dc2626',
        icon: '',
        title: isForCandidate ? 'Application Update' : 'Application Declined',
        subtitle: isForCandidate
          ? 'Application not selected'
          : 'Candidate declined offer',
        description: isForCandidate
          ? `Thank you for your interest in the ${this.data.jobTitle} position at ${this.data.companyName}. While this opportunity wasn't the perfect match, your skills are valuable and the right role is waiting for you.`
          : `${this.data.candidateName} has declined the offer for the ${this.data.jobTitle} position. Consider reviewing other candidates in your pipeline.`,
        statusDisplay: 'Not Selected',
        buttonText: isForCandidate
          ? 'Browse Similar Jobs'
          : 'Find Other Candidates',
      },
      declined: {
        type: 'error' as const,
        color: '#dc2626',
        icon: '',
        title: isForCandidate ? 'Invitation Declined' : 'Invitation Declined',
        subtitle: isForCandidate
          ? 'You declined the invitation'
          : 'Candidate declined the invitation',
        description: isForCandidate
          ? `You have declined the invitation to apply for the ${this.data.jobTitle} position at ${this.data.companyName}.${this.data.notes ? ` Reason: ${this.data.notes}` : ''}`
          : `${this.data.candidateName} has declined your invitation to apply for the ${this.data.jobTitle} position. Consider reviewing other candidates in your pipeline.`,
        statusDisplay: 'Declined',
        buttonText: isForCandidate
          ? 'Browse Other Jobs'
          : 'Find Other Candidates',
      },
      withdrawn: {
        type: 'warning' as const,
        color: '#d97706',
        icon: '',
        title: 'Application Withdrawn',
        subtitle: isForCandidate
          ? 'Application withdrawn'
          : 'Candidate withdrew application',
        description: isForCandidate
          ? `Your application for the ${this.data.jobTitle} position has been successfully withdrawn.`
          : `${this.data.candidateName} has withdrawn their application for the ${this.data.jobTitle} position.`,
        statusDisplay: 'Withdrawn',
        buttonText: isForCandidate
          ? 'Browse Other Jobs'
          : 'View Other Applications',
      },
      submitted: {
        type: 'info' as const,
        color: '#3b82f6',
        icon: '',
        title: isForCandidate
          ? 'Application Submitted'
          : 'New Application Received',
        subtitle: isForCandidate
          ? 'Application received'
          : 'New candidate applied',
        description: isForCandidate
          ? `Thank you for applying to the ${this.data.jobTitle} position at ${this.data.companyName}. Your application has been received and is being reviewed.`
          : `${this.data.candidateName} has submitted an application for the ${this.data.jobTitle} position.`,
        statusDisplay: 'Under Review',
        buttonText: isForCandidate ? 'Track Application' : 'Review Application',
      },
      shortlisted: {
        type: 'success' as const,
        color: '#8b5cf6',
        icon: '',
        title: isForCandidate ? "You're Shortlisted!" : 'Candidate Shortlisted',
        subtitle: isForCandidate
          ? 'Selected for next round!'
          : 'Candidate moved to shortlist',
        description: isForCandidate
          ? `Excellent news! You've been shortlisted for the ${this.data.jobTitle} position at ${this.data.companyName}. You impressed the hiring team!`
          : `${this.data.candidateName} has been shortlisted for the ${this.data.jobTitle} position. This candidate has been selected for the next round.`,
        statusDisplay: 'Shortlisted',
        buttonText: isForCandidate
          ? 'Prepare for Next Round'
          : 'Schedule Interview',
      },
      interview_scheduled: {
        type: 'info' as const,
        color: '#0891b2',
        icon: '',
        title: 'Interview Scheduled',
        subtitle: isForCandidate
          ? 'Your interview is confirmed'
          : 'Interview has been scheduled',
        description: isForCandidate
          ? `Your interview for the ${this.data.jobTitle} position at ${this.data.companyName} has been scheduled. Prepare for your upcoming interview.`
          : `An interview has been scheduled with ${this.data.candidateName} for the ${this.data.jobTitle} position. Interview details have been set.`,
        statusDisplay: 'Interview Scheduled',
        buttonText: isForCandidate
          ? 'View Interview Details'
          : 'View Interview Schedule',
      },
      offer_extended: {
        type: 'success' as const,
        color: '#059669',
        icon: '',
        title: isForCandidate ? 'Job Offer Extended!' : 'Offer Extended',
        subtitle: isForCandidate
          ? 'You received a job offer'
          : 'Offer has been sent to candidate',
        description: isForCandidate
          ? `Congratulations! You have received a job offer for the ${this.data.jobTitle} position at ${this.data.companyName}.`
          : `A job offer has been extended to ${this.data.candidateName} for the ${this.data.jobTitle} position.`,
        statusDisplay: 'Offer Extended',
        buttonText: isForCandidate ? 'Review Offer' : 'Track Offer Status',
      },
    };

    return configs[status as keyof typeof configs] || configs.submitted;
  }

  private getWhatsNextSectionByStatus(
    status: string,
    isForCandidate: boolean
  ): string {
    if (isForCandidate) {
      return this.getCandidateNextSteps(status);
    } else {
      return this.getClientNextSteps(status);
    }
  }

  private getCandidateNextSteps(status: string): string {
    const steps = {
      accepted: [
        {
          icon: '⏰',
          title: 'Wait for Review',
          description: 'Your application is being reviewed by the hiring team',
        },
        {
          icon: '📧',
          title: 'Check Email',
          description: 'Watch for updates about your application status',
        },
        {
          icon: '🔍',
          title: 'Continue Exploring',
          description: 'Keep exploring other opportunities while you wait',
        },
      ],
      rejected: [
        {
          icon: '🔍',
          title: 'Continue Searching',
          description: 'Browse similar positions that match your skills',
        },
        {
          icon: '📝',
          title: 'Update Profile',
          description: 'Enhance your profile based on feedback received',
        },
        {
          icon: '🎯',
          title: 'Apply to More Jobs',
          description: 'Keep applying to increase your chances of success',
        },
      ],
      withdrawn: [
        {
          icon: '🔍',
          title: 'Explore Opportunities',
          description: 'Browse other available positions',
        },
        {
          icon: '⚙️',
          title: 'Update Preferences',
          description: 'Refine your job search criteria if needed',
        },
      ],
      submitted: [
        {
          icon: '⏰',
          title: 'Wait for Review',
          description: 'Your application is being reviewed by the hiring team',
        },
        {
          icon: '📧',
          title: 'Check Email',
          description: 'Watch for updates about your application status',
        },
        {
          icon: '🔍',
          title: 'Continue Applying',
          description: 'Keep exploring other opportunities while you wait',
        },
      ],
      shortlisted: [
        {
          icon: '📚',
          title: 'Research Company',
          description: 'Learn more about the company culture and values',
        },
        {
          icon: '💼',
          title: 'Prepare for Interview',
          description: 'Review common interview questions for this role',
        },
        {
          icon: '📞',
          title: 'Wait for Contact',
          description: 'HR will reach out to schedule your interview',
        },
      ],
      interview_scheduled: [
        {
          icon: '📚',
          title: 'Prepare Questions',
          description:
            'Prepare thoughtful questions about the role and company',
        },
        {
          icon: '👔',
          title: 'Plan Your Outfit',
          description: 'Choose appropriate attire for the interview',
        },
        {
          icon: '⏰',
          title: 'Arrive Early',
          description:
            'Plan to arrive 10-15 minutes before your scheduled time',
        },
      ],
      offer_extended: [
        {
          icon: '📖',
          title: 'Review Offer',
          description: 'Carefully review all terms and conditions',
        },
        {
          icon: '💬',
          title: 'Consider Decision',
          description: 'Take time to evaluate if this aligns with your goals',
        },
        {
          icon: '📞',
          title: 'Respond Promptly',
          description: 'Provide your response within the specified timeframe',
        },
      ],
    };

    const stepList = steps[status as keyof typeof steps] || steps.submitted;
    return this.createWhatsNextSection(stepList);
  }

  private getClientNextSteps(status: string): string {
    const steps = {
      accepted: [
        {
          icon: '📋',
          title: 'Review Application',
          description: "Evaluate the candidate's qualifications and fit",
        },
        {
          icon: '📞',
          title: 'Schedule Screening',
          description: 'Consider scheduling a phone or video screening',
        },
        {
          icon: '👥',
          title: 'Share with Team',
          description: 'Get input from other team members if needed',
        },
      ],
      rejected: [
        {
          icon: '🔍',
          title: 'Continue Search',
          description: 'Review other candidates in your pipeline',
        },
        {
          icon: '📊',
          title: 'Analyze Feedback',
          description: 'Understand why the candidate declined',
        },
        {
          icon: '⚙️',
          title: 'Adjust Strategy',
          description: 'Consider improving your offer or process',
        },
      ],
      withdrawn: [
        {
          icon: '📋',
          title: 'Review Pipeline',
          description: 'Look at other candidates for this position',
        },
        {
          icon: '💬',
          title: 'Understand Reasons',
          description: 'Consider reaching out to understand their decision',
        },
        {
          icon: '🔍',
          title: 'Source New Candidates',
          description: 'Continue recruiting for this position',
        },
      ],
      submitted: [
        {
          icon: '📋',
          title: 'Review Application',
          description: "Evaluate the candidate's qualifications and fit",
        },
        {
          icon: '📞',
          title: 'Schedule Screening',
          description: 'Consider scheduling a phone or video screening',
        },
        {
          icon: '👥',
          title: 'Share with Team',
          description: 'Get input from other team members if needed',
        },
      ],
      shortlisted: [
        {
          icon: '📅',
          title: 'Schedule Interview',
          description: 'Coordinate interview times with your team',
        },
        {
          icon: '📝',
          title: 'Prepare Questions',
          description: 'Develop role-specific interview questions',
        },
        {
          icon: '👥',
          title: 'Brief Interviewers',
          description: 'Ensure all interviewers are prepared',
        },
      ],
      interview_scheduled: [
        {
          icon: '📝',
          title: 'Prepare Materials',
          description: 'Gather all necessary interview materials',
        },
        {
          icon: '👥',
          title: 'Coordinate Team',
          description: 'Ensure all interviewers are ready and informed',
        },
        {
          icon: '📞',
          title: 'Confirm Details',
          description: 'Double-check interview logistics with candidate',
        },
      ],
      offer_extended: [
        {
          icon: '⏰',
          title: 'Monitor Response',
          description: "Track the candidate's response timeline",
        },
        {
          icon: '📞',
          title: 'Be Available',
          description: 'Be ready to answer any questions about the offer',
        },
        {
          icon: '📋',
          title: 'Prepare Backup',
          description: 'Have alternative candidates ready if needed',
        },
      ],
    };

    const stepList = steps[status as keyof typeof steps] || steps.submitted;
    return this.createWhatsNextSection(stepList);
  }

  render(): { subject: string; html: string; text: string } {
    const { candidateName, jobTitle, companyName, status, isForCandidate } =
      this.data as ApplicationStatusEmailData;
    const baseRender = super.render();
    const config = this.getStatusConfig(status, isForCandidate || false);

    const text = `${config.title}

${config.description}

Application Details:
• Position: ${jobTitle}
• Company: ${companyName}
${candidateName && !isForCandidate ? `• Candidate: ${candidateName}` : ''}
• Status: ${config.statusDisplay}

Best regards,
The Teamcast Team`;

    return {
      subject: baseRender.subject,
      html: baseRender.html,
      text,
    };
  }

  // Override the base createStatusContainer method to match the signature
  protected createStatusContainer(
    icon: string,
    title: string,
    description: string,
    type: 'error' | 'info' | 'success' | 'warning' = 'info'
  ): string {
    const typeColors = {
      error: '#dc2626',
      info: '#3b82f6',
      success: '#059669',
      warning: '#d97706',
    };

    const typeBgColors = {
      error: '#fef2f2',
      info: '#f0f9ff',
      success: '#f0fdf4',
      warning: '#fffbeb',
    };

    return `
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin: 24px 0;">
        <tr>
          <td style="padding: 24px; background-color: ${typeBgColors[type]}; border: 1px solid #e5e7eb; border-radius: 8px; text-align: center;">
            <div style="color: ${typeColors[type]}; font-size: 24px; margin-bottom: 12px;">${icon}</div>
            <h3 style="color: #111827; font-size: 18px; font-weight: 600; margin-bottom: 8px;">${title}</h3>
            <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0;">${description}</p>
          </td>
        </tr>
      </table>
    `;
  }

  private getTitle(): string {
    const { status, isForCandidate } = this.data as ApplicationStatusEmailData;

    if (isForCandidate) {
      switch (status) {
        case 'accepted':
          return 'Invitation Accepted ✅';
        case 'rejected':
          return 'Application Update';
        case 'withdrawn':
          return 'Application Withdrawn';
        case 'submitted':
          return 'Application Submitted ✅';
        case 'shortlisted':
          return "You're Shortlisted! 🌟";
        case 'interview_scheduled':
          return 'Interview Scheduled';
        default:
          return 'Application Update';
      }
    } else {
      switch (status) {
        case 'accepted':
          return 'Invitation Accepted ✅';
        case 'rejected':
          return 'Application Declined';
        case 'withdrawn':
          return 'Application Withdrawn';
        case 'submitted':
          return 'New Application Received 📬';
        case 'shortlisted':
          return 'Candidate Shortlisted';
        case 'interview_scheduled':
          return 'Interview Scheduled';
        default:
          return 'Application Update';
      }
    }
  }

  private getContent(): string {
    const { status: _status, isForCandidate } = this
      .data as ApplicationStatusEmailData;

    if (isForCandidate) {
      return this.getCandidateContent();
    } else {
      return this.getClientContent();
    }
  }

  private getCandidateContent(): string {
    const { status, jobTitle, companyName, aiAssessmentLink } = this
      .data as ApplicationStatusEmailData;

    const statusConfig = this.getStatusConfig(status, true);

    return `
      <tr>
        <td align="center" style="padding: 25px 32px;" class="content-padding">
          <h1 style="color: #1f2937; font-size: 28px; font-weight: 600; margin-bottom: 20px; text-align: center; line-height: 1.2;">
            ${statusConfig.title}
          </h1>
          <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin-bottom: 32px; text-align: center;">
            ${statusConfig.subtitle}
          </p>

          ${this.createStatusContainer(statusConfig.icon, status, statusConfig.description, statusConfig.color)}

          <!-- Application Details -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f8fafc; border: none !important; border-radius: 12px; margin: 32px 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);">
            <tr>
              <td align="center" style="padding: 32px 24px;">
                <div style="color: #1f2937; font-size: 20px; font-weight: 600; margin-bottom: 20px;">
                  📋 Application Details
                </div>
                <div style="color: #4b5563; font-size: 16px; line-height: 1.8; text-align: left;">
                  <strong style="color: #1f2937;">Position:</strong> ${jobTitle}<br>
                  <strong style="color: #1f2937;">Company:</strong> ${companyName}<br>
                  <strong style="color: #1f2937;">Status:</strong> ${status.charAt(0).toUpperCase() + status.slice(1)}
                </div>
              </td>
            </tr>
          </table>

          ${
            aiAssessmentLink
              ? `
            <div style="text-align: center; margin: 32px 0;">
              ${this.createButton('Take AI Assessment', aiAssessmentLink, 'primary')}
            </div>
          `
              : ''
          }

          <!-- Next Steps -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f0fdf4; border: none !important; border-radius: 12px; margin: 32px 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);">
            <tr>
              <td align="center" style="padding: 24px 20px;">
                <div style="color: #1f2937; font-size: 18px; font-weight: 600; margin-bottom: 16px;">
                  🎯 What's Next?
                </div>
                <div style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                  ${this.getNextStepsForCandidate()}
                </div>
              </td>
            </tr>
          </table>

          <!-- Support Section -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f0fdf4; border: none !important; border-radius: 12px; margin: 32px 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);">
            <tr>
              <td align="center" style="padding: 24px 20px;">
                <div style="color: #1f2937; font-size: 18px; font-weight: 600; margin-bottom: 12px;">
                  🛟 Need Help?
                </div>
                <div style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                  Questions about your application? Contact our support team at 
                  <a href="mailto:support@teamcast.ai" style="color: #10b981; text-decoration: none; font-weight: 600;">support@teamcast.ai</a>
                </div>
              </td>
            </tr>
          </table>

          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0; text-align: center;">
            Best of luck with your application! 🚀
          </p>
        </td>
      </tr>
    `;
  }

  private getClientContent(): string {
    const { status, jobTitle, candidateName } = this
      .data as ApplicationStatusEmailData;
    const statusConfig = this.getStatusConfig(status, false);

    return `
      <tr>
        <td align="center" style="padding: 10px 32px;" class="content-padding">
          <h1 style="color: #1f2937; font-size: 28px; font-weight: 600; margin-bottom: 20px; text-align: center; line-height: 1.2;">
            ${statusConfig.title}
          </h1>
          <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin-bottom: 32px; text-align: center;">
            ${statusConfig.subtitle}
          </p>

          ${this.createStatusContainer(statusConfig.icon, status, statusConfig.description, statusConfig.color)}

          <!-- Application Details -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f8fafc; border: none !important; border-radius: 12px; margin: 32px 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);">
            <tr>
              <td align="center" style="padding: 32px 24px;">
                <div style="color: #1f2937; font-size: 20px; font-weight: 600; margin-bottom: 20px;">
                  📋 Application Details
                </div>
                <div style="color: #4b5563; font-size: 16px; line-height: 1.8; text-align: left;">
                  <strong style="color: #1f2937;">Candidate:</strong> ${candidateName}<br>
                  <strong style="color: #1f2937;">Position:</strong> ${jobTitle}<br>
                  <strong style="color: #1f2937;">Status:</strong> ${status.charAt(0).toUpperCase() + status.slice(1)}
                </div>
              </td>
            </tr>
          </table>

          <!-- Recommended Actions -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f0fdf4; border: none !important; border-radius: 12px; margin: 32px 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);">
            <tr>
              <td align="center" style="padding: 24px 20px;">
                <div style="color: #1f2937; font-size: 18px; font-weight: 600; margin-bottom: 16px;">
                  🎯 Recommended Actions
                </div>
                <div style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                  ${this.getNextStepsForClient()}
                </div>
              </td>
            </tr>
          </table>

          <!-- Support Section -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f0fdf4; border: none !important; border-radius: 12px; margin: 32px 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);">
            <tr>
              <td align="center" style="padding: 24px 20px;">
                <div style="color: #1f2937; font-size: 18px; font-weight: 600; margin-bottom: 12px;">
                  🛟 Need Help?
                </div>
                <div style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                  Questions about managing applications? Contact our support team at 
                  <a href="mailto:support@teamcast.ai" style="color: #10b981; text-decoration: none; font-weight: 600;">support@teamcast.ai</a>
                </div>
              </td>
            </tr>
          </table>

          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0; text-align: center;">
            Continue building your team with Teamcast! 🚀
          </p>
        </td>
      </tr>
    `;
  }

  private getNextStepsForCandidate(): string {
    const { status } = this.data as ApplicationStatusEmailData;

    switch (status) {
      case 'accepted':
        return "We'll review your application and contact you if you're selected for the next round. Keep an eye on your email for updates.";
      case 'rejected':
        return "Don't get discouraged! Keep applying to other positions that match your skills and interests.";
      case 'withdrawn':
        return 'You can always apply to other open positions or reapply for this role if circumstances change.';
      case 'submitted':
        return "We'll review your application and contact you if you're selected for the next round.";
      case 'shortlisted':
        return "Prepare for the next round! We'll send you details about the interview process soon.";
      case 'interview_scheduled':
        return "Prepare for your upcoming interview! We'll send you more details about the interview process soon.";
      default:
        return 'Check your dashboard for updates and continue exploring opportunities.';
    }
  }

  private getNextStepsForClient(): string {
    const { status } = this.data as ApplicationStatusEmailData;

    switch (status) {
      case 'accepted':
        return "Review the candidate's profile and application materials in your dashboard. They've accepted your invitation and their application is ready for review.";
      case 'rejected':
        return 'Consider reviewing other candidates or adjusting your job requirements if needed.';
      case 'withdrawn':
        return 'Review your job posting and consider reaching out to other qualified candidates.';
      case 'submitted':
        return "Review the candidate's profile and application materials in your dashboard.";
      case 'shortlisted':
        return "Prepare for the interview! We'll send you more details about the interview process soon.";
      case 'interview_scheduled':
        return "Prepare for the upcoming interview! We'll send you more details about the interview process soon.";
      default:
        return 'Log into your dashboard to manage applications and take appropriate actions.';
    }
  }

  private getTextContent(): string {
    const {
      status,
      jobTitle,
      companyName,
      candidateName,
      notes,
      isForCandidate,
    } = this.data as ApplicationStatusEmailData;

    if (isForCandidate) {
      return `Application Update - ${jobTitle}

Your application for ${jobTitle} at ${companyName} has been ${status}.

${notes ? `Notes: ${notes}` : ''}

${this.getNextStepsForCandidate()}

Best regards,
The Teamcast Team`;
    } else {
      return `Application Update - ${jobTitle}

${candidateName} has ${status} the application for ${jobTitle}.

${notes ? `Notes: ${notes}` : ''}

${this.getNextStepsForClient()}

Best regards,
The Teamcast Team`;
    }
  }
}
