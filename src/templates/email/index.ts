// Base template
export { BaseEmailTemplate, EmailTemplateData } from './base.template';

// Authentication and Account Management Templates
export {
  OtpVerificationEmailTemplate,
  OtpVerificationEmailData,
} from './otp.verification.template';

export {
  PasswordResetEmailTemplate,
  PasswordResetEmailData,
} from './password-reset.template';

export {
  UserPasswordEmailTemplate,
  UserPasswordEmailData,
} from './user-password.template';

export {
  UserActivationEmailTemplate,
  UserActivationEmailData,
} from './user-activation.template';

// Client and Company Templates
export {
  ClientSignupEmailTemplate,
  ClientSignupEmailData,
} from './client-signup.template';

export {
  InvitationEmailTemplate,
  InvitationEmailData,
} from './invitation.template';

export {
  CampaignInvitationEmailTemplate,
  CampaignInvitationEmailData,
} from './campaign-invitation.template';

export {
  ClientSubscriptionUpgradedEmailTemplate,
  ClientSubscriptionUpgradedEmailData,
} from './client-subscription-upgraded.template';

export {
  ClientSubscriptionDowngradedEmailTemplate,
  ClientSubscriptionDowngradedEmailData,
} from './client-subscription-downgraded.template';

export {
  ClientAccountManagerAssignmentEmailTemplate,
  ClientAccountManagerAssignmentEmailData,
} from './client-account-manager-assignment.template';

export {
  AccountManagerClientOnboardedEmailTemplate,
  AccountManagerClientOnboardedEmailData,
} from './account-manager-client-onboarded.template';

// Job and Application Templates
export {
  JobInviteEmailTemplate,
  JobInviteEmailData,
} from './job-invite.template';

export {
  JobRecommendationEmailTemplate,
  JobRecommendationData,
} from './job-recommendation.template';

export {
  JobAIAssessmentInviteEmailTemplate,
  JobAIAssessmentInviteData,
} from './job-ai-assessment-invite.template';

export {
  ApplicationStatusEmailTemplate,
  ApplicationStatusEmailData,
} from './application-status.template';

export {
  SupportJobPostingInviteEmailTemplate,
  SupportJobPostingInviteEmailData,
} from './support.job.posting.invite.template';

export {
  SupportJobPostingInviteWithdrawnEmailTemplate,
  SupportJobPostingInviteWithdrawnEmailData,
} from './support.job.posting.invite.withdrawn.template';

export {
  RecruiterJobAssignmentEmailTemplate,
  RecruiterJobAssignmentEmailData,
} from './recruiter-job-assignment.template';

export {
  AccountManagerRecruiterAssignmentEmailTemplate,
  AccountManagerRecruiterAssignmentEmailData,
} from './account-manager-recruiter-assignment.template';

export {
  HireRequestDeelSetupEmailTemplate,
  HireRequestDeelSetupEmailData,
} from './hire-request-deel-setup.template';

// Document Management Templates
export {
  DocumentRejectionEmailTemplate,
  DocumentRejectionEmailData,
} from './document-rejection.template';

// Daily Stats Templates
export {
  DailyStatsEmailTemplate,
  DailyStatsEmailData,
} from './daily.stats.template';

// Support Templates
export {
  SupportTicketAssignmentEmailTemplate,
  SupportTicketAssignmentData,
} from './support-ticket-assignment.template';

export {
  SupportTicketCommentToAccountManagerEmailTemplate,
  SupportTicketCommentToAccountManagerData,
} from './support-ticket-comment-to-account-manager.template';

export {
  SupportTicketCommentToClientEmailTemplate,
  SupportTicketCommentToClientData,
} from './support-ticket-comment-to-client.template';

// Legacy templates (consider consolidating these)
export {
  UserWelcomeEmailTemplate,
  UserWelcomeData,
} from './user-welcome.template';

export {
  UserSignupInviteEmailTemplate,
  UserSignupInviteData,
} from './user-signup-invite.template';

export {
  UserSignupAcceptedEmailTemplate,
  UserSignupAcceptedData,
} from './user-signup-accepted.template';

export {
  CandidateJobAppliedEmailTemplate,
  CandidateJobAppliedData,
} from './candidate-job-applied.template';

export {
  CandidateApplicationStatusEmailTemplate,
  CandidateApplicationStatusData,
} from './candidate-application-status.template';

export {
  CandidateShortlistedEmailTemplate,
  CandidateShortlistedData,
} from './candidate-shortlisted.template';

export {
  ClientJobInviteEmailTemplate,
  ClientJobInviteData,
} from './client-job-invite.template';

export {
  JobApplicationWithdrawEmailTemplate,
  JobApplicationWithdrawData,
} from './job-application-withdraw.template';

export {
  SupportInvitationWithdrawnEmailTemplate,
  SupportInvitationWithdrawnData,
} from './support-invitation-withdrawn.template';

// Panel and Interview Templates
export {
  PanelAssessmentSlotEmailTemplate,
  PanelAssessmentSlotData,
} from './job.panel-assessment-slot.template';

export {
  PanelAssessmentSlotsConfirmationEmailTemplate,
  PanelAssessmentSlotsConfirmationData,
} from './job.panel-assessment.slots.confirmation.template';

export {
  PanelInterviewLinkEmailTemplate,
  PanelInterviewLinkData,
} from './job.panel-interview-link.template';

export {
  PanelAssessmentConfirmationEmailTemplate,
  PanelAssessmentConfirmationData,
} from './panel-assessment-confirmation.template';

export {
  PanelAssessmentFeedbackRequestEmailTemplate,
  PanelAssessmentFeedbackRequestData,
} from './panel-assessment-feedback-request.template';

export {
  PanelAssessmentFeedbackReminderEmailTemplate,
  PanelAssessmentFeedbackReminderData,
} from './panel-assessment-feedback-reminder.template';

// Candidate Assessment Templates
export {
  OnboardingAssessmentReminderEmailTemplate,
  OnboardingAssessmentReminderEmailData,
} from './onboarding-assessment-reminder.template';

// Notification and Digest Templates
export {
  InvitationAcceptedEmailTemplate,
  InvitationAcceptedEmailData,
} from './invitation-accepted.template';

export {
  RecommendedCandidatesEmailTemplate,
  RecommendedCandidatesData,
} from './recommended-candidates.template';

export {
  DailyDigestEmailTemplate,
  DailyDigestData,
} from './daily-digest.template';

import {
  PasswordResetEmailTemplate,
  PasswordResetEmailData,
} from './password-reset.template';
import {
  UserPasswordEmailTemplate,
  UserPasswordEmailData,
} from './user-password.template';
import {
  UserActivationEmailTemplate,
  UserActivationEmailData,
} from './user-activation.template';
import {
  ClientSignupEmailTemplate,
  ClientSignupEmailData,
} from './client-signup.template';
import {
  ClientAccountManagerAssignmentEmailTemplate,
  ClientAccountManagerAssignmentEmailData,
} from './client-account-manager-assignment.template';
import {
  InvitationEmailTemplate,
  InvitationEmailData,
} from './invitation.template';
import {
  JobInviteEmailTemplate,
  JobInviteEmailData,
} from './job-invite.template';
import {
  JobRecommendationEmailTemplate,
  JobRecommendationData,
} from './job-recommendation.template';
import {
  JobAIAssessmentInviteEmailTemplate,
  JobAIAssessmentInviteData,
} from './job-ai-assessment-invite.template';
import {
  ApplicationStatusEmailTemplate,
  ApplicationStatusEmailData,
} from './application-status.template';
import {
  SupportJobPostingInviteEmailData,
  SupportJobPostingInviteEmailTemplate,
} from './support.job.posting.invite.template';
import {
  SupportJobPostingInviteWithdrawnEmailData,
  SupportJobPostingInviteWithdrawnEmailTemplate,
} from './support.job.posting.invite.withdrawn.template';
import {
  AccountManagerClientOnboardedEmailData,
  AccountManagerClientOnboardedEmailTemplate,
} from './account-manager-client-onboarded.template';

/**
 * Email Template Factory for creating template instances
 * Updated to use the new consolidated templates
 */
export class EmailTemplateFactory {
  // User account templates
  static createPasswordResetTemplate(
    data: PasswordResetEmailData
  ): PasswordResetEmailTemplate {
    return new PasswordResetEmailTemplate(data);
  }

  static createUserPasswordTemplate(
    data: UserPasswordEmailData
  ): UserPasswordEmailTemplate {
    return new UserPasswordEmailTemplate(data);
  }

  static createUserActivationTemplate(
    data: UserActivationEmailData
  ): UserActivationEmailTemplate {
    return new UserActivationEmailTemplate(data);
  }

  // Client templates
  static createClientSignupTemplate(
    data: ClientSignupEmailData
  ): ClientSignupEmailTemplate {
    return new ClientSignupEmailTemplate(data);
  }

  static createClientAccountManagerAssignmentTemplate(
    data: ClientAccountManagerAssignmentEmailData
  ): ClientAccountManagerAssignmentEmailTemplate {
    return new ClientAccountManagerAssignmentEmailTemplate(data);
  }

  static createAccountManagerClientOnboardedTemplate(
    data: AccountManagerClientOnboardedEmailData
  ): AccountManagerClientOnboardedEmailTemplate {
    return new AccountManagerClientOnboardedEmailTemplate(data);
  }

  static createInvitationTemplate(
    data: InvitationEmailData
  ): InvitationEmailTemplate {
    return new InvitationEmailTemplate(data);
  }

  // Job and application templates
  static createJobInviteTemplate(
    data: JobInviteEmailData
  ): JobInviteEmailTemplate {
    return new JobInviteEmailTemplate(data);
  }

  static createJobRecommendationTemplate(
    data: JobRecommendationData
  ): JobRecommendationEmailTemplate {
    return new JobRecommendationEmailTemplate(data);
  }

  static createJobAIAssessmentInviteTemplate(
    data: JobAIAssessmentInviteData
  ): JobAIAssessmentInviteEmailTemplate {
    return new JobAIAssessmentInviteEmailTemplate(data);
  }

  static createApplicationStatusTemplate(
    data: ApplicationStatusEmailData
  ): ApplicationStatusEmailTemplate {
    return new ApplicationStatusEmailTemplate(data);
  }

  static createSupportJobPostingInviteTemplate(
    data: SupportJobPostingInviteEmailData
  ): SupportJobPostingInviteEmailTemplate {
    return new SupportJobPostingInviteEmailTemplate(data);
  }

  static createSupportJobPostingInviteWithdrawnTemplate(
    data: SupportJobPostingInviteWithdrawnEmailData
  ): SupportJobPostingInviteWithdrawnEmailTemplate {
    return new SupportJobPostingInviteWithdrawnEmailTemplate(data);
  }

  // Example template instances for testing
  static getExamplePasswordResetTemplate(): PasswordResetEmailTemplate {
    return new PasswordResetEmailTemplate({
      name: 'John Doe',
      resetUrl: 'https://teamcast.ai/reset/example-token',
    });
  }

  static getExampleClientSignupTemplate(): ClientSignupEmailTemplate {
    return new ClientSignupEmailTemplate({
      name: 'John Doe',
      companyName: 'Acme Corporation',
      verificationUrl: 'https://teamcast.ai/verify/example-token',
    });
  }

  static getExampleClientAccountManagerAssignmentTemplate(): ClientAccountManagerAssignmentEmailTemplate {
    return new ClientAccountManagerAssignmentEmailTemplate({
      name: 'John Doe',
      companyName: 'Acme Corporation',
      accountManagerName: 'Sarah Johnson',
      accountManagerEmail: 'sarah.johnson@teamcast.ai',
      accountManagerJobTitle: 'Senior Account Manager',
      accountManagerPhone: '+1 (555) 123-4567',
      supportUrl: 'https://teamcast.ai/support',
    });
  }

  static getExampleInvitationTemplate(): InvitationEmailTemplate {
    return new InvitationEmailTemplate({
      name: 'John Doe',
      inviterName: 'Jane Smith',
      companyName: 'Acme Corporation',
      invitationUrl: 'https://teamcast.ai/invite/example-token',
      role: 'RECRUITER',
      expiryHours: 72,
    });
  }

  static getExampleUserPasswordTemplate(): UserPasswordEmailTemplate {
    return new UserPasswordEmailTemplate({
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'temp123!',
      loginUrl: 'https://teamcast.ai/login',
      userType: 'client',
      companyName: 'Acme Corporation',
    });
  }

  static getExampleApplicationStatusTemplate(): ApplicationStatusEmailTemplate {
    return new ApplicationStatusEmailTemplate({
      candidateName: 'John Doe',
      jobTitle: 'Senior Developer',
      companyName: 'Acme Corporation',
      status: 'shortlisted',
      isForCandidate: true,
    });
  }

  static getExampleSupportJobPostingInviteTemplate(): SupportJobPostingInviteEmailTemplate {
    return new SupportJobPostingInviteEmailTemplate({
      name: 'John Doe',
      inviterName: 'Sarah Johnson',
      jobTitle: 'Senior Software Engineer',
      companyName: 'TechCorp Inc.',
      invitationUrl: 'https://teamcast.ai/job/apply/example-token',
      expiryHours: 72,
      jobDescription:
        'We are looking for a talented Senior Software Engineer to join our growing team. You will be responsible for developing and maintaining high-quality software solutions.',
      requirements: [
        '5+ years of experience in software development',
        'Strong knowledge of TypeScript and Node.js',
        'Experience with cloud platforms (AWS, GCP)',
        'Excellent problem-solving skills',
      ],
      benefits: [
        'Competitive salary and equity',
        'Flexible work arrangements',
        'Health, dental, and vision insurance',
        'Professional development opportunities',
      ],
    });
  }

  static getExampleSupportJobPostingInviteWithdrawnTemplate(): SupportJobPostingInviteWithdrawnEmailTemplate {
    return new SupportJobPostingInviteWithdrawnEmailTemplate({
      name: 'John Doe',
      inviterName: 'Sarah Johnson',
      jobTitle: 'Senior Software Engineer',
      companyName: 'TechCorp Inc.',
      reason:
        'The position has been filled internally. We appreciate your interest and will keep your profile in mind for future opportunities.',
    });
  }
}
