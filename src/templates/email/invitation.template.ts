import { BaseEmailTemplate, EmailTemplateData } from './base.template';

import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';

export interface InvitationEmailData extends EmailTemplateData {
  name: string;
  companyName: string;
  inviterName: string;
  invitationUrl: string;
  role: string;
  expiryHours: number;
  userType?: UserTypeEnum;
  userRole?: UserRoleEnum;
}

export class InvitationEmailTemplate extends BaseEmailTemplate {
  constructor(data: InvitationEmailData) {
    super(data);
  }

  protected getSubject(): string {
    const { inviterName } = this.data as InvitationEmailData;
    return `${inviterName} invited you to join Teamcast`;
  }

  protected getTemplate(): string {
    const {
      name,
      inviterName,
      invitationUrl,
      role,
      userType = UserTypeEnum.CANDIDATE,
      userRole = UserRoleEnum.INDIVIDUAL,
    } = this.data as InvitationEmailData;

    return `
      <tr>
        <td align="center" style="padding: 32px 24px;" class="content-padding">
          <h1 style="color: #111827; font-size: 28px; font-weight: 600; margin-bottom: 16px; text-align: center; line-height: 1.25;">
            You're Invited to Join Teamcast!
          </h1>
         
          ${this.createStatusContainer(
            '🎉',
            'Exclusive Invitation Received',
            `<p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
            Hi ${name}! Welcome to the future of work! 🚀 ${inviterName} has personally invited you to join Teamcast - the world's most advanced AI-powered talent platform - as a <strong>${this.formatRole(role)}</strong>.
          </p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
            You're about to join an exclusive community of 500,000+ professionals and 10,000+ companies who are revolutionizing how talent connects with opportunity.
          </p>`,
            'success'
          )}

          ${this.createButton('Accept Invitation', invitationUrl, 'primary')}

          <!-- Alternative invitation link -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin: 24px 0;">
            <tr>
              <td style="padding: 16px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;">
                <div style="color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                  <strong>Button not working?</strong><br>
                  Copy and paste this link into your browser:<br>
                  <a href="${invitationUrl}" style="color: #3b82f6; word-break: break-all; font-size: 13px;">${invitationUrl}</a>
                </div>
              </td>
            </tr>
          </table>

          ${this.getWhatsNextSectionByUserTypeAndRole(userType, userRole)}
        </td>
      </tr>
    `;
  }

  private getWhatsNextSectionByUserTypeAndRole(
    userType: string,
    userRole: string
  ): string {
    // Handle CANDIDATE and PARTNER_RESOURCE (same entity)
    if (
      userType === UserTypeEnum.CANDIDATE ||
      userRole === UserRoleEnum.PARTNER_RESOURCE
    ) {
      return this.createWhatsNextSection([
        {
          icon: '✅',
          title: 'Accept Invitation',
          description: 'Click the invitation button to join the platform',
        },
        {
          icon: '📄',
          title: 'Upload Resume',
          description: 'Add your professional experience and skills',
        },
        {
          icon: '🎯',
          title: 'Complete Screening Assessment',
          description: 'Take assessments to showcase your abilities',
        },
        {
          icon: '💼',
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
              icon: '✅',
              title: 'Accept Invitation',
              description: 'Click the invitation button to join the platform',
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
              icon: '✅',
              title: 'Accept Invitation',
              description: 'Click the invitation button to join the platform',
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
              icon: '✅',
              title: 'Accept Invitation',
              description: 'Click the invitation button to join the platform',
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
              icon: '✅',
              title: 'Accept Invitation',
              description: 'Click the invitation button to join the platform',
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
              icon: '✅',
              title: 'Accept Invitation',
              description: 'Click the invitation button to join the platform',
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
              icon: '✅',
              title: 'Accept Invitation',
              description: 'Click the invitation button to join the platform',
            },
            {
              icon: '🤝',
              title: 'Complete company Setup',
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
              icon: '✅',
              title: 'Accept Invitation',
              description: 'Click the invitation button to join the platform',
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
              icon: '✅',
              title: 'Accept Invitation',
              description: 'Click the invitation button to join the platform',
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
              icon: '✅',
              title: 'Accept Invitation',
              description: 'Click the invitation button to join the platform',
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
        icon: '✅',
        title: 'Accept Invitation',
        description: 'Click the invitation button to join the platform',
      },
      {
        icon: '👤',
        title: 'Complete Profile Setup',
        description: 'Set up your profile and preferences',
      },
      {
        icon: '🎯',
        title: 'Start Collaborating',
        description: 'Begin working with your new team',
      },
    ]);
  }

  private formatRole(role: string): string {
    const roleMap: { [key: string]: string } = {
      ADMIN: 'Administrator',
      HR: 'HR Manager',
      RECRUITER: 'Recruiter',
      ACCOUNTS: 'Accounts Manager',
      PARTNER_RESOURCE: 'Partner Resource',
      INDIVIDUAL: 'Individual',
      ACCOUNT_MANAGER: 'Account Manager',
    };

    return (
      roleMap[role] ||
      role
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (l) => l.toUpperCase())
    );
  }

  render(): { subject: string; html: string; text: string } {
    const {
      name: _name,
      companyName: _companyName,
      inviterName: _inviterName,
      invitationUrl,
      role: _role,
      expiryHours: _expiryHours,
    } = this.data as InvitationEmailData;
    const baseRender = super.render();

    const text = `You're Invited to Join Teamcast!

Accept your invitation here:
${invitationUrl}

What's Next?
1. Accept invitation by clicking the link above
2. Create your account or sign in
3. Start collaborating with your new team
4. Explore all the powerful hiring tools available

Best regards,
The Teamcast Team`;

    return {
      subject: baseRender.subject,
      html: baseRender.html,
      text,
    };
  }
}
