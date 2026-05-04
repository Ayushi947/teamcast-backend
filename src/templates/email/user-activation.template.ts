import { BaseEmailTemplate, EmailTemplateData } from './base.template';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';
import { ENV } from '@/config/env';

export interface UserActivationEmailData extends EmailTemplateData {
  name: string;
  companyName: string;
  actionByName: string;
  dashboardUrl?: string;
  isActivation: boolean;
  userType: UserTypeEnum;
  userRole?: UserRoleEnum;
}

export class UserActivationEmailTemplate extends BaseEmailTemplate {
  protected getSubject(): string {
    const { isActivation } = this.data as UserActivationEmailData;
    const action = isActivation ? 'activated' : 'deactivated';

    return `Your account has been ${action} - Teamcast`;
  }

  protected getTemplate(): string {
    const { isActivation } = this.data as UserActivationEmailData;

    if (isActivation) {
      return this.getActivationContent();
    } else {
      return this.getDeactivationContent();
    }
  }

  private getActivationContent(): string {
    const {
      name,
      companyName,
      actionByName,
      dashboardUrl: _dashboardUrl,
      userType,
      userRole,
    } = this.data as UserActivationEmailData;

    return `
      <tr>
        <td align="center" style="padding: 32px 24px;" class="content-padding">
          <h1 style="color: #111827; font-size: 28px; font-weight: 600; margin-bottom: 16px; text-align: center; line-height: 1.25;">
            Account Activated!
          </h1>
          
          <p style="color: #4b5563; line-height: 1.6; margin: 0 0 24px 0; font-size: 16px; text-align: center;">
            Hi ${name}, your account for ${companyName} has been successfully activated by ${actionByName}. You now have full access to all platform features and can begin using Teamcast immediately.
          </p>

          <!-- Account Information -->
          ${this.createInfoCard(
            'Account Details',
            `<strong>Company:</strong> ${companyName}<br><strong>Status:</strong> <span style="color: #059669; font-weight: 600;">Active</span><br><strong>Activated By:</strong> ${actionByName}`,
            'highlight'
          )}

          ${this.createButton('Login to Your Account', `${ENV.FRONTEND_URL}/app/auth/login`, 'primary')}

          ${this.getWhatsNextSectionByUserTypeAndRole(userType, userRole)}
        </td>
      </tr>
    `;
  }

  private getDeactivationContent(): string {
    const { name, companyName, actionByName } = this
      .data as UserActivationEmailData;

    return `
      <tr>
        <td align="center" style="padding: 32px 24px;" class="content-padding">
          <h1 style="color: #111827; font-size: 28px; font-weight: 600; margin-bottom: 16px; text-align: center; line-height: 1.25;">
            Account Deactivated
          </h1>
          
          <p style="color: #4b5563; line-height: 1.6; margin: 0 0 24px 0; font-size: 16px; text-align: center;">
            Hi ${name}, your account for ${companyName} has been deactivated by ${actionByName}. Your access to the platform has been temporarily suspended and you will not be able to log in until your account is reactivated.
          </p>

          <!-- Account Information -->
          ${this.createInfoCard(
            'Account Details',
            `<strong>Company:</strong> ${companyName}<br><strong>Status:</strong> <span style="color: #d97706; font-weight: 600;">Deactivated</span><br><strong>Action By:</strong> ${actionByName}`,
            'default'
          )}

        </td>
      </tr>
    `;
  }

  private getWhatsNextSectionByUserTypeAndRole(
    userType: UserTypeEnum,
    userRole?: UserRoleEnum
  ): string {
    // Handle CANDIDATE and PARTNER_RESOURCE (same entity)
    if (
      userType === UserTypeEnum.CANDIDATE ||
      userRole === UserRoleEnum.PARTNER_RESOURCE
    ) {
      return this.createWhatsNextSection([
        {
          icon: '',
          title: 'Start Using Platform',
          description: 'Log in and explore all available features',
        },
        {
          icon: '',
          title: 'Upload Resume',
          description: 'Add your professional experience and skills',
        },
        {
          icon: '',
          title: 'Complete Screening Assessment',
          description: 'Take assessments to showcase your abilities',
        },
        {
          icon: '',
          title: 'Apply for Jobs',
          description: 'Browse and apply to relevant opportunities',
        },
      ]);
    }

    // Handle CLIENT roles
    if (userType === UserTypeEnum.CLIENT) {
      switch (userRole) {
        case UserRoleEnum.ADMIN:
          return this.createWhatsNextSection([
            {
              icon: '🚀',
              title: 'Start Using Platform',
              description: 'Log in and explore all available features',
            },
            {
              icon: '👤',
              title: 'Complete Company Setup',
              description: 'Configure your company profile and settings',
            },
            {
              icon: '👥',
              title: 'Invite Team Members',
              description: 'Add HR, recruiters, and other team members',
            },
            {
              icon: '📝',
              title: 'Create Job Postings',
              description: 'Post your job openings and requirements',
            },
          ]);

        case UserRoleEnum.HR:
          return this.createWhatsNextSection([
            {
              icon: '🚀',
              title: 'Start Using Platform',
              description: 'Log in and explore all available features',
            },
            {
              icon: '👤',
              title: 'Complete Profile Setup',
              description: 'Set up your profile and preferences',
            },
            {
              icon: '📋',
              title: 'Review Job Postings',
              description: 'Manage and review job postings',
            },
            {
              icon: '👥',
              title: 'Manage Candidates',
              description: 'Review and manage candidate applications',
            },
          ]);

        case UserRoleEnum.RECRUITER:
          return this.createWhatsNextSection([
            {
              icon: '🚀',
              title: 'Start Using Platform',
              description: 'Log in and explore all available features',
            },
            {
              icon: '👤',
              title: 'Complete Profile Setup',
              description: 'Set up your profile and preferences',
            },
            {
              icon: '🔍',
              title: 'Find Candidates',
              description: 'Search and discover top talent',
            },
            {
              icon: '📞',
              title: 'Start Recruiting',
              description: 'Connect with candidates and schedule interviews',
            },
          ]);

        case UserRoleEnum.ACCOUNTS:
          return this.createWhatsNextSection([
            {
              icon: '🚀',
              title: 'Start Using Platform',
              description: 'Log in and explore all available features',
            },
            {
              icon: '👤',
              title: 'Complete Profile Setup',
              description: 'Set up your profile and preferences',
            },
            {
              icon: '💰',
              title: 'Manage Subscriptions',
              description: 'Review and manage billing and subscriptions',
            },
            {
              icon: '📊',
              title: 'View Analytics',
              description: 'Monitor hiring metrics and performance',
            },
          ]);

        default:
          return this.createWhatsNextSection([
            {
              icon: '🚀',
              title: 'Start Using Platform',
              description: 'Log in and explore all available features',
            },
            {
              icon: '👤',
              title: 'Complete Profile Setup',
              description: 'Set up your profile and preferences',
            },
            {
              icon: '🎯',
              title: 'Start Collaborating',
              description: 'Begin working with your team',
            },
          ]);
      }
    }

    // Handle PARTNER roles
    if (userType === UserTypeEnum.PARTNER) {
      switch (userRole) {
        case UserRoleEnum.ADMIN:
          return this.createWhatsNextSection([
            {
              icon: '🚀',
              title: 'Start Using Platform',
              description: 'Log in and explore all available features',
            },
            {
              icon: '🤝',
              title: 'Complete Company Setup',
              description: 'Configure your partnership profile and settings',
            },
            {
              icon: '👥',
              title: 'Invite Team Members',
              description: 'Add partner resources and team members',
            },
            {
              icon: '🚀',
              title: 'Start Collaborating',
              description: 'Begin working with clients and candidates',
            },
          ]);

        default:
          return this.createWhatsNextSection([
            {
              icon: '🚀',
              title: 'Start Using Platform',
              description: 'Log in and explore all available features',
            },
            {
              icon: '🤝',
              title: 'Complete Partnership Setup',
              description: 'Configure your partnership preferences',
            },
            {
              icon: '🚀',
              title: 'Start Collaborating',
              description: 'Begin working with clients and candidates',
            },
          ]);
      }
    }

    // Handle SUPPORT roles
    if (userType === UserTypeEnum.SUPPORT) {
      switch (userRole) {
        case UserRoleEnum.ACCOUNT_MANAGER:
          return this.createWhatsNextSection([
            {
              icon: '🚀',
              title: 'Start Using Platform',
              description: 'Log in and explore all available features',
            },
            {
              icon: '👤',
              title: 'Complete Profile Setup',
              description: 'Set up your support profile and preferences',
            },
            {
              icon: '👥',
              title: 'Manage Client Accounts',
              description: 'Support and manage client relationships',
            },
            {
              icon: '📊',
              title: 'Monitor Performance',
              description: 'Track client success and platform usage',
            },
          ]);

        default:
          return this.createWhatsNextSection([
            {
              icon: '🚀',
              title: 'Start Using Platform',
              description: 'Log in and explore all available features',
            },
            {
              icon: '👤',
              title: 'Complete Profile Setup',
              description: 'Set up your support profile and preferences',
            },
            {
              icon: '🛠️',
              title: 'Access Support Tools',
              description: 'Use admin tools and support features',
            },
          ]);
      }
    }

    // Default fallback
    return this.createWhatsNextSection([
      {
        icon: '',
        title: 'Start Using Platform',
        description: 'Log in and explore all available features',
      },
      {
        icon: '',
        title: 'Complete Profile Setup',
        description: 'Set up your profile and preferences',
      },
      {
        icon: '',
        title: 'Start Collaborating',
        description: 'Begin working with your new team',
      },
    ]);
  }

  render(): { subject: string; html: string; text: string } {
    const { name, companyName, actionByName, isActivation } = this
      .data as UserActivationEmailData;
    const baseRender = super.render();
    const action = isActivation ? 'activated' : 'deactivated';

    const text = `Account ${isActivation ? 'Activated!' : 'Deactivated'}

Hi ${name},

Your account for ${companyName} has been ${action} by ${actionByName}.

${
  isActivation
    ? `You now have full access to all platform features and can begin using Teamcast immediately.

What You Can Do Now:
• Log in and explore all available features
• Complete your profile and preferences  
• Start collaborating with your team

Need assistance? Contact our support team at support@teamcast.ai`
    : `Your account access has been temporarily suspended. You will not be able to log in or access platform features until your account is reactivated.

For questions about your account status, please contact our support team.`
}

Best regards,
The Teamcast Team`;

    return {
      subject: baseRender.subject,
      html: baseRender.html,
      text,
    };
  }
}
