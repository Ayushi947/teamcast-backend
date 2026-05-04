import { BaseEmailTemplate, EmailTemplateData } from './base.template';

export interface UserPasswordEmailData extends EmailTemplateData {
  name: string;
  email: string;
  password: string;
  loginUrl: string;
  userType: 'client' | 'partner' | 'support' | 'candidate';
  companyName?: string;
}

export class UserPasswordEmailTemplate extends BaseEmailTemplate {
  protected getSubject(): string {
    const { companyName } = this.data as UserPasswordEmailData;
    const typeLabel = this.getUserTypeLabel();

    if (companyName) {
      return `Your ${typeLabel} account is ready - ${companyName}`;
    }
    return `Your ${typeLabel} account is ready - Teamcast`;
  }

  protected getTemplate(): string {
    const { name, email, password, loginUrl, companyName } = this
      .data as UserPasswordEmailData;

    return `
      <tr>
        <td align="center" style="padding: 32px 24px;" class="content-padding">
          <h1 style="color: #111827; font-size: 28px; font-weight: 600; margin-bottom: 16px; text-align: center; line-height: 1.25;">
            ${this.getUserTypeLabel()} Account Ready!
          </h1>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
            Hi ${name}, ${this.getWelcomeMessage()}
          </p>

          ${this.createStatusContainer('🔑', 'Account Created', 'Your account is ready to use with the credentials below', 'success')}

          <!-- Login Credentials -->
          ${this.createInfoCard(
            '🔐 Your Login Credentials',
            `${companyName ? `<strong>Company:</strong> ${companyName}<br>` : ''}<strong>Email:</strong> ${email}<br><strong>Password:</strong> <code style="background-color: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-family: monospace; color: #1f2937; border: 1px solid #e5e7eb;">${password}</code><br><strong>Account Type:</strong> ${this.getUserTypeLabel()}`,
            'highlight'
          )}

          ${this.createButton('Sign In to Your Account', loginUrl, 'primary')}

          <!-- Alternative login link -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin: 24px 0;">
            <tr>
              <td style="padding: 16px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;">
                <div style="color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                  <strong>Button not working?</strong><br>
                  Copy and paste this link into your browser:<br>
                  <a href="${loginUrl}" style="color: #3b82f6; word-break: break-all; font-size: 13px;">${loginUrl}</a>
                </div>
              </td>
            </tr>
          </table>



          <!-- Getting Started Tips -->
          ${this.createInfoCard(
            '🌟 Pro Tips for Success',
            '• Personalize your profile to get the best experience<br>• Explore all platform features in your dashboard<br>• Set up notifications to stay updated<br>• Connect with our support team for onboarding assistance<br>• Check out our tutorials and resources to maximize your results',
            'default'
          )}



          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0; text-align: center;">
            Ready to start your hiring journey, ${name}?
          </p>
        </td>
      </tr>
    `;
  }

  private getUserTypeLabel(): string {
    const { userType } = this.data as UserPasswordEmailData;
    const labels = {
      client: 'Client',
      partner: 'Partner',
      support: 'Support',
      candidate: 'Candidate',
    };
    return labels[userType] || 'User';
  }

  private getWelcomeMessage(): string {
    const { companyName } = this.data as UserPasswordEmailData;
    const companyPart = companyName ? ` for ${companyName}` : '';

    const messages = {
      client: `your client account${companyPart} has been created and is ready to use. You can now access our intelligent hiring platform and start finding exceptional talent.`,
      partner: `your partner account${companyPart} has been created successfully. You can now collaborate with our network and access partnership opportunities.`,
      support: `your support account has been created with administrative privileges. You can now access all support tools and help manage the platform.`,
      candidate: `your candidate account${companyPart} has been created. You can now explore job opportunities and showcase your skills to potential employers.`,
    };

    return (
      messages[this.data.userType as keyof typeof messages] ||
      `your account${companyPart} has been created successfully.`
    );
  }

  private getGettingStartedSteps(): Array<{
    icon: string;
    title: string;
    description: string;
  }> {
    const { userType } = this.data as UserPasswordEmailData;

    const baseSteps = [
      {
        icon: '🔐',
        title: 'Sign In to Your Account',
        description: 'Use your credentials to log in and explore the platform',
      },
      {
        icon: '⚙️',
        title: 'Configure Settings',
        description: 'Customize your preferences and notification settings',
      },
    ];

    const typeSpecificSteps = {
      client: [
        {
          icon: '🏢',
          title: 'Complete Company Profile',
          description: 'Add company details and hiring preferences',
        },
        {
          icon: '📝',
          title: 'Create Job Postings',
          description: 'Start posting jobs and attracting qualified candidates',
        },
        ...baseSteps,
      ],
      partner: [
        {
          icon: '🤝',
          title: 'Set Up Partnership',
          description: 'Configure your partner profile and services',
        },
        {
          icon: '🔍',
          title: 'Explore Opportunities',
          description: 'Browse available partnerships and collaborations',
        },
        ...baseSteps,
      ],
      support: [
        {
          icon: '🛠️',
          title: 'Access Admin Tools',
          description: 'Familiarize yourself with administrative features',
        },
        {
          icon: '👥',
          title: 'Manage Platform',
          description: 'Handle user accounts and support requests',
        },
        ...baseSteps,
      ],
      candidate: [
        {
          icon: '👤',
          title: 'Build Your Profile',
          description: 'Complete your professional profile and upload resume',
        },
        {
          icon: '🔍',
          title: 'Explore Opportunities',
          description: 'Browse job openings and apply to positions',
        },
        ...baseSteps,
      ],
    };

    return typeSpecificSteps[userType] || baseSteps;
  }

  render(): { subject: string; html: string; text: string } {
    const { name, email, password, loginUrl, userType, companyName } = this
      .data as UserPasswordEmailData;
    const baseRender = super.render();

    const text = `${this.getUserTypeLabel()} Account Ready!

Hi ${name},

${this.getWelcomeMessage()}

Your Login Credentials:
${companyName ? `Company: ${companyName}` : ''}
Email: ${email}
Password: ${password}
Account Type: ${this.getUserTypeLabel()}

Sign in to your account:
${loginUrl}

Getting Started:
1. Sign in securely and change your password
2. Configure your settings and preferences
3. ${
      userType === 'client'
        ? 'Complete your company profile and create job postings'
        : userType === 'partner'
          ? 'Set up your partnership profile and explore opportunities'
          : userType === 'support'
            ? 'Access admin tools and familiarize with features'
            : 'Build your profile and explore job opportunities'
    }

Getting Started Tips:
• Personalize your profile for the best experience
• Explore all platform features in your dashboard
• Set up notifications to stay updated
• Connect with our support team for assistance

Why Teamcast?
• Intelligent: AI-powered candidate matching
• Efficient: Streamlined hiring workflows
• Reliable: Enterprise-level performance and innovation

Need assistance? Contact our support team at support@teamcast.ai

Ready to start your hiring journey!

Best regards,
The Teamcast Team`;

    return {
      subject: baseRender.subject,
      html: baseRender.html,
      text,
    };
  }
}
