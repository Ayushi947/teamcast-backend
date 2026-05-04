import { ENV } from '@/config/env';
import { logger } from '@/shared/utils/logger';
import { singleton } from '@/shared/decorators/singleton';
import { INotificationProvider } from './notification.interface';
import nodemailer from 'nodemailer';
import {
  OtpVerificationEmailTemplate,
  OtpVerificationEmailData,
  PasswordResetEmailTemplate,
  PasswordResetEmailData,
  InvitationEmailTemplate,
  InvitationEmailData,
  CampaignInvitationEmailTemplate,
  CampaignInvitationEmailData,
  UserPasswordEmailTemplate,
  UserPasswordEmailData,
  InvitationAcceptedEmailTemplate,
  InvitationAcceptedEmailData,
  ClientSignupEmailTemplate,
  ClientSignupEmailData,
  UserActivationEmailTemplate,
  UserActivationEmailData,
  ApplicationStatusEmailTemplate,
  ApplicationStatusEmailData,
  JobRecommendationEmailTemplate,
  JobRecommendationData,
  JobAIAssessmentInviteEmailTemplate,
  JobAIAssessmentInviteData,
  ClientJobInviteEmailTemplate,
  ClientJobInviteData,
  CandidateJobAppliedEmailTemplate,
  CandidateJobAppliedData,
  CandidateApplicationStatusEmailTemplate,
  CandidateApplicationStatusData,
  JobApplicationWithdrawEmailTemplate,
  JobApplicationWithdrawData,
  PanelAssessmentSlotEmailTemplate,
  PanelAssessmentSlotData,
  PanelAssessmentSlotsConfirmationEmailTemplate,
  PanelAssessmentSlotsConfirmationData,
  PanelAssessmentFeedbackRequestEmailTemplate,
  PanelAssessmentFeedbackRequestData,
  PanelAssessmentFeedbackReminderEmailTemplate,
  PanelAssessmentFeedbackReminderData,
  PanelInterviewLinkEmailTemplate,
  PanelInterviewLinkData,
  UserSignupInviteEmailTemplate,
  UserSignupInviteData,
  UserSignupAcceptedEmailTemplate,
  UserSignupAcceptedData,
  UserWelcomeEmailTemplate,
  UserWelcomeData,
  RecommendedCandidatesEmailTemplate,
  RecommendedCandidatesData,
  DailyDigestEmailTemplate,
  DailyDigestData,
  DailyStatsEmailTemplate,
  DailyStatsEmailData,
  JobInviteEmailTemplate,
  JobInviteEmailData,
  CandidateShortlistedEmailTemplate,
  CandidateShortlistedData,
  SupportInvitationWithdrawnEmailTemplate,
  SupportInvitationWithdrawnData,
  ClientSubscriptionUpgradedEmailTemplate,
  ClientSubscriptionUpgradedEmailData,
  ClientSubscriptionDowngradedEmailTemplate,
  ClientSubscriptionDowngradedEmailData,
  ClientAccountManagerAssignmentEmailTemplate,
  ClientAccountManagerAssignmentEmailData,
  SupportJobPostingInviteEmailTemplate,
  SupportJobPostingInviteEmailData,
  SupportJobPostingInviteWithdrawnEmailTemplate,
  SupportJobPostingInviteWithdrawnEmailData,
  RecruiterJobAssignmentEmailTemplate,
  RecruiterJobAssignmentEmailData,
  AccountManagerRecruiterAssignmentEmailTemplate,
  AccountManagerRecruiterAssignmentEmailData,
  HireRequestDeelSetupEmailTemplate,
  HireRequestDeelSetupEmailData,
  AccountManagerClientOnboardedEmailTemplate,
  AccountManagerClientOnboardedEmailData,
  DocumentRejectionEmailTemplate,
  DocumentRejectionEmailData,
  OnboardingAssessmentReminderEmailTemplate,
  OnboardingAssessmentReminderEmailData,
} from '@/templates/email';
import { JobAIAssessmentInterviewLinkEmailTemplate } from '@/templates/email/job-ai-assesment-interview-link';
import { McpInterviewAssessmentInviteEmailTemplate } from '@/templates/email/mcp-interview-assessment-invite';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/common/enums';

@singleton
export class NodemailerProvider implements INotificationProvider {
  private readonly transporter: nodemailer.Transporter;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly sendNotifications: boolean;

  constructor() {
    this.fromEmail = ENV.SMTP_FROM_EMAIL || 'noreply@example.com';
    this.fromName = ENV.SMTP_FROM_NAME || 'Teamcast';
    this.sendNotifications = ENV.SEND_NOTIFICATIONS;

    this.transporter = nodemailer.createTransport({
      host: ENV.SMTP_HOST,
      port: ENV.SMTP_PORT ? parseInt(ENV.SMTP_PORT) : 587,
      secure: false, // upgrade later with STARTTLS
      auth: {
        user: ENV.SMTP_USER,
        pass: ENV.SMTP_PASS,
      },
    });

    logger.info('Nodemailer SMTP service initialized', {
      context: 'NodemailerProvider.constructor',
      sendNotifications: this.sendNotifications,
    });
  }

  async sendEmail(options: {
    from?: string;
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject: string;
    html: string;
    text?: string;
    attachments?: any[];
  }): Promise<void> {
    if (!this.sendNotifications) {
      logger.info('Email sending is disabled by SEND_NOTIFICATIONS flag', {
        context: 'NodemailerProvider.sendEmail',
        to: options.to,
        subject: options.subject,
      });
      return;
    }
    const mailOptions = {
      from: options.from || `${this.fromName} <${this.fromEmail}>`,
      to: options.to,
      cc: options.cc,
      bcc: options.bcc,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments,
    };
    try {
      const info = await this.transporter.sendMail(mailOptions);
      logger.info('Email sent via Nodemailer', {
        context: 'NodemailerProvider.sendEmail',
        to: options.to,
        subject: options.subject,
        messageId: info.messageId,
      });
    } catch (error) {
      logger.error('Failed to send email via Nodemailer', {
        context: 'NodemailerProvider.sendEmail',
        error,
      });
    }
  }

  async sendOtpVerificationEmail(
    to: string,
    name: string,
    otpCode: string
  ): Promise<void> {
    const data: OtpVerificationEmailData = {
      name,
      otpCode,
      to,
    };
    const { subject, html } = new OtpVerificationEmailTemplate(data).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendPasswordResetEmail(
    to: string,
    name: string,
    resetUrl: string,
    userType?: string
  ): Promise<void> {
    const data: PasswordResetEmailData = {
      name,
      resetUrl,
      userType: (userType as UserTypeEnum) || UserTypeEnum.CANDIDATE,
    };
    const { subject, html } = new PasswordResetEmailTemplate(data).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendForgotPasswordEmail(
    to: string,
    name: string,
    resetUrl: string,
    userType?: string
  ): Promise<void> {
    const data: PasswordResetEmailData = {
      name,
      resetUrl,
      userType: (userType as UserTypeEnum) || UserTypeEnum.CANDIDATE,
    };
    const { subject, html } = new PasswordResetEmailTemplate(data).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendClientSignupEmail(
    to: string,
    name: string,
    verificationUrl: string
  ): Promise<void> {
    const data: ClientSignupEmailData = {
      name,
      companyName: 'Teamcast', // Default company name for signup
      verificationUrl,
    };
    const { subject, html } = new ClientSignupEmailTemplate(data).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendClientAccountManagerAssignmentEmail(
    to: string,
    name: string,
    companyName: string,
    accountManagerName: string,
    accountManagerEmail: string,
    accountManagerJobTitle?: string,
    accountManagerPhone?: string,
    supportUrl?: string
  ): Promise<void> {
    const data: ClientAccountManagerAssignmentEmailData = {
      name,
      companyName,
      accountManagerName,
      accountManagerEmail,
      accountManagerJobTitle,
      accountManagerPhone,
      supportUrl: supportUrl || 'https://teamcast.ai/support',
    };
    const { subject, html } = new ClientAccountManagerAssignmentEmailTemplate(
      data
    ).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });

    logger.info('Client account manager assignment email sent', {
      context: 'NodemailerProvider.sendClientAccountManagerAssignmentEmail',
      to,
      name,
      companyName,
      accountManagerName,
    });
  }

  async sendAccountManagerClientOnboardedEmail(
    to: string,
    accountManagerName: string,
    clientName: string,
    clientEmail: string,
    companyName: string,
    onboardingDate: string,
    dashboardUrl: string,
    companyType?: string,
    companySize?: string,
    companyIndustry?: string,
    clientRole?: string,
    clientProfileUrl?: string,
    supportUrl?: string
  ): Promise<void> {
    const data: AccountManagerClientOnboardedEmailData = {
      accountManagerName,
      clientName,
      clientEmail,
      companyName,
      onboardingDate,
      dashboardUrl,
      companyType,
      companySize,
      companyIndustry,
      clientRole,
      clientProfileUrl,
      supportUrl: supportUrl || 'https://teamcast.ai/support',
    };
    const { subject, html } = new AccountManagerClientOnboardedEmailTemplate(
      data
    ).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });

    logger.info('Account manager client onboarded email sent', {
      context: 'NodemailerProvider.sendAccountManagerClientOnboardedEmail',
      to,
      accountManagerName,
      clientName,
      companyName,
    });
  }

  async sendClientUserInvitationEmail(
    to: string,
    name: string,
    companyName: string,
    inviterName: string,
    invitationUrl: string,
    role: string,
    expiryHours: number,
    userType?: string,
    userRole?: string
  ): Promise<void> {
    const data: InvitationEmailData = {
      name,
      companyName,
      inviterName,
      invitationUrl,
      role,
      expiryHours,
      userType: (userType as UserTypeEnum) || UserTypeEnum.CLIENT,
      userRole: (userRole as UserRoleEnum) || UserRoleEnum.INDIVIDUAL,
    };
    const { subject, html } = new InvitationEmailTemplate(data).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendPartnerUserInvitationEmail(
    to: string,
    name: string,
    companyName: string,
    inviterName: string,
    invitationUrl: string,
    role: string,
    expiryHours: number,
    userType?: string,
    userRole?: string
  ): Promise<void> {
    const data: InvitationEmailData = {
      name,
      companyName,
      inviterName,
      invitationUrl,
      role,
      expiryHours,
      userType: (userType as UserTypeEnum) || UserTypeEnum.PARTNER,
      userRole: (userRole as UserRoleEnum) || UserRoleEnum.INDIVIDUAL,
    };
    const { subject, html } = new InvitationEmailTemplate(data).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendClientUserInvitationWithdrawnEmail(
    to: string,
    name: string,
    companyName: string,
    inviterName: string
  ): Promise<void> {
    const data: SupportInvitationWithdrawnData = {
      name,
      inviterName,
      invitationType: 'client',
      companyName,
    };
    const { subject, html } = new SupportInvitationWithdrawnEmailTemplate(
      data
    ).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendClientUserActivatedEmail(
    to: string,
    name: string,
    companyName: string,
    activatedByName: string,
    dashboardUrl: string,
    userRole?: string
  ): Promise<void> {
    const data: UserActivationEmailData = {
      name,
      companyName,
      actionByName: activatedByName,
      dashboardUrl,
      isActivation: true,
      userType: UserTypeEnum.CLIENT,
      userRole: (userRole as UserRoleEnum) || UserRoleEnum.INDIVIDUAL,
    };
    const { subject, html } = new UserActivationEmailTemplate(data).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendPartnerUserActivatedEmail(
    to: string,
    name: string,
    companyName: string,
    activatedByName: string,
    dashboardUrl: string,
    userRole?: string
  ): Promise<void> {
    const data: UserActivationEmailData = {
      name,
      companyName,
      actionByName: activatedByName,
      dashboardUrl,
      isActivation: true,
      userType: UserTypeEnum.PARTNER,
      userRole: (userRole as UserRoleEnum) || UserRoleEnum.INDIVIDUAL,
    };
    const { subject, html } = new UserActivationEmailTemplate(data).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendPartnerUserDeactivatedEmail(
    to: string,
    name: string,
    companyName: string,
    deactivatedByName: string,
    contactUrl: string,
    userRole?: string
  ): Promise<void> {
    const data: UserActivationEmailData = {
      name,
      companyName,
      actionByName: deactivatedByName,
      contactUrl,
      isActivation: false,
      userType: UserTypeEnum.PARTNER,
      userRole: (userRole as UserRoleEnum) || UserRoleEnum.INDIVIDUAL,
    };
    const { subject, html } = new UserActivationEmailTemplate(data).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendClientUserDeactivatedEmail(
    to: string,
    name: string,
    companyName: string,
    deactivatedByName: string,
    contactUrl: string,
    userRole?: string
  ): Promise<void> {
    const data: UserActivationEmailData = {
      name,
      companyName,
      actionByName: deactivatedByName,
      contactUrl,
      isActivation: false,
      userType: UserTypeEnum.CLIENT,
      userRole: (userRole as UserRoleEnum) || UserRoleEnum.INDIVIDUAL,
    };
    const { subject, html } = new UserActivationEmailTemplate(data).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendApplicationAcceptedEmail(params: {
    to: string;
    jobTitle: string;
    companyName: string;
    notes?: string;
    aiAssessmentLink?: string;
  }): Promise<void> {
    const data: ApplicationStatusEmailData = {
      candidateName: 'You',
      jobTitle: params.jobTitle,
      companyName: params.companyName,
      status: 'accepted',
      notes: params.notes,
      aiAssessmentLink: params.aiAssessmentLink,
      isForCandidate: true,
    };
    const { subject, html } = new ApplicationStatusEmailTemplate(data).render();
    await this.sendEmail({
      to: params.to,
      subject,
      html,
    });
  }

  async sendCandidateAcceptedApplicationEmail(params: {
    to: string;
    candidateName: string;
    jobTitle: string;
    notes?: string;
  }): Promise<void> {
    const data: ApplicationStatusEmailData = {
      candidateName: params.candidateName,
      jobTitle: params.jobTitle,
      companyName: 'Your Company',
      status: 'accepted',
      notes: params.notes,
      isForClient: true,
    };
    const { subject, html } = new ApplicationStatusEmailTemplate(data).render();
    await this.sendEmail({
      to: params.to,
      subject,
      html,
    });
  }

  async sendApplicationRejectedEmail(params: {
    to: string;
    jobTitle: string;
    companyName: string;
    notes?: string;
  }): Promise<void> {
    const data: ApplicationStatusEmailData = {
      candidateName: 'You',
      jobTitle: params.jobTitle,
      companyName: params.companyName,
      status: 'rejected',
      notes: params.notes,
      isForCandidate: true,
    };
    const { subject, html } = new ApplicationStatusEmailTemplate(data).render();
    await this.sendEmail({
      to: params.to,
      subject,
      html,
    });
  }

  async sendCandidateRejectedApplicationEmail(params: {
    to: string;
    candidateName: string;
    jobTitle: string;
    notes?: string;
  }): Promise<void> {
    const data: ApplicationStatusEmailData = {
      candidateName: params.candidateName,
      jobTitle: params.jobTitle,
      companyName: 'Your Company',
      status: 'rejected',
      notes: params.notes,
      isForClient: true,
    };
    const { subject, html } = new ApplicationStatusEmailTemplate(data).render();
    await this.sendEmail({
      to: params.to,
      subject,
      html,
    });
  }

  async sendCandidateDeclinedApplicationEmail(params: {
    to: string;
    candidateName: string;
    jobTitle: string;
    notes?: string;
  }): Promise<void> {
    const data: ApplicationStatusEmailData = {
      candidateName: params.candidateName,
      jobTitle: params.jobTitle,
      companyName: 'Your Company',
      status: 'declined',
      notes: params.notes,
      isForClient: true,
    };
    const { subject, html } = new ApplicationStatusEmailTemplate(data).render();
    await this.sendEmail({
      to: params.to,
      subject,
      html,
    });
  }

  async sendApplicationWithdrawnEmail(params: {
    to: string;
    jobTitle: string;
    companyName: string;
    notes?: string;
  }): Promise<void> {
    const data: ApplicationStatusEmailData = {
      candidateName: 'You',
      jobTitle: params.jobTitle,
      companyName: params.companyName,
      status: 'withdrawn',
      notes: params.notes,
      isForCandidate: true,
    };
    const { subject, html } = new ApplicationStatusEmailTemplate(data).render();
    await this.sendEmail({
      to: params.to,
      subject,
      html,
    });
  }

  async sendCandidateWithdrewApplicationEmail(params: {
    to: string;
    candidateName: string;
    jobTitle: string;
    notes?: string;
  }): Promise<void> {
    const data: ApplicationStatusEmailData = {
      candidateName: params.candidateName,
      jobTitle: params.jobTitle,
      companyName: 'Your Company',
      status: 'withdrawn',
      notes: params.notes,
      isForClient: true,
    };
    const { subject, html } = new ApplicationStatusEmailTemplate(data).render();
    await this.sendEmail({
      to: params.to,
      subject,
      html,
    });
  }

  async sendJobApplicationSubmittedEmail(params: {
    to: string;
    jobTitle: string;
    companyName: string;
    notes?: string;
  }): Promise<void> {
    const data: ApplicationStatusEmailData = {
      candidateName: 'You',
      jobTitle: params.jobTitle,
      companyName: params.companyName,
      status: 'submitted',
      notes: params.notes,
      isForCandidate: true,
    };
    const { subject, html } = new ApplicationStatusEmailTemplate(data).render();
    await this.sendEmail({
      to: params.to,
      subject,
      html,
    });
  }

  async sendNewJobApplicationEmail(params: {
    to: string;
    candidateName: string;
    jobTitle: string;
    companyName: string;
  }): Promise<void> {
    const data: ApplicationStatusEmailData = {
      candidateName: params.candidateName,
      jobTitle: params.jobTitle,
      companyName: params.companyName,
      status: 'submitted',
      isForClient: true,
    };
    const { subject, html } = new ApplicationStatusEmailTemplate(data).render();
    await this.sendEmail({
      to: params.to,
      subject,
      html,
    });
  }

  async sendSupportUserActivatedEmail(
    to: string,
    name: string,
    activatedByName: string,
    dashboardUrl: string,
    userRole?: string
  ): Promise<void> {
    const data: UserActivationEmailData = {
      name,
      companyName: 'Teamcast Support',
      actionByName: activatedByName,
      dashboardUrl,
      isActivation: true,
      userType: UserTypeEnum.SUPPORT,
      userRole: (userRole as UserRoleEnum) || UserRoleEnum.INDIVIDUAL,
    };
    const { subject, html } = new UserActivationEmailTemplate(data).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendSupportUserDeactivatedEmail(
    to: string,
    name: string,
    deactivatedByName: string,
    contactUrl: string,
    userRole?: string
  ): Promise<void> {
    const data: UserActivationEmailData = {
      name,
      companyName: 'Teamcast Support',
      actionByName: deactivatedByName,
      contactUrl,
      isActivation: false,
      userType: UserTypeEnum.SUPPORT,
      userRole: (userRole as UserRoleEnum) || UserRoleEnum.INDIVIDUAL,
    };
    const { subject, html } = new UserActivationEmailTemplate(data).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendPartnerUserPasswordEmail(
    to: string,
    name: string,
    companyName: string,
    password: string,
    loginUrl: string
  ): Promise<void> {
    const data: UserPasswordEmailData = {
      name,
      companyName,
      password,
      loginUrl,
      userType: 'partner',
      email: to,
    };
    const { subject, html } = new UserPasswordEmailTemplate(data).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendClientUserPasswordEmail(
    to: string,
    name: string,
    companyName: string,
    password: string,
    loginUrl: string
  ): Promise<void> {
    const data: UserPasswordEmailData = {
      name,
      companyName,
      password,
      loginUrl,
      userType: 'client',
      email: to,
    };
    const { subject, html } = new UserPasswordEmailTemplate(data).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendSupportPartnerUserPasswordEmail(
    to: string,
    name: string,
    companyName: string,
    password: string,
    loginUrl: string
  ): Promise<void> {
    const data: UserPasswordEmailData = {
      name,
      email: to,
      password,
      loginUrl,
      userType: 'partner',
      companyName,
    };
    const { subject, html } = new UserPasswordEmailTemplate(data).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendSupportCandidateUserPasswordEmail(
    to: string,
    name: string,
    password: string,
    loginUrl: string
  ): Promise<void> {
    const data: UserPasswordEmailData = {
      name,
      email: to,
      password,
      loginUrl,
      userType: 'candidate',
    };
    const { subject, html } = new UserPasswordEmailTemplate(data).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendSupportClientUserPasswordEmail(
    to: string,
    name: string,
    companyName: string,
    password: string,
    loginUrl: string
  ): Promise<void> {
    const data: UserPasswordEmailData = {
      name,
      email: to,
      password,
      loginUrl,
      userType: 'client',
      companyName,
    };
    const { subject, html } = new UserPasswordEmailTemplate(data).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendSupportUserPasswordEmail(
    to: string,
    name: string,
    password: string,
    loginUrl: string
  ): Promise<void> {
    const data: UserPasswordEmailData = {
      name,
      email: to,
      password,
      loginUrl,
      userType: 'support',
    };
    const { subject, html } = new UserPasswordEmailTemplate(data).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendPartnerInvitationAcceptedEmail(
    to: string,
    inviterName: string,
    acceptedByName: string,
    companyName: string,
    role: string
  ): Promise<void> {
    const data: InvitationAcceptedEmailData = {
      inviterName,
      acceptedByName,
      companyName,
      role,
      userType: 'partner',
      acceptedDate: new Date().toLocaleDateString(),
    };
    const { subject, html } = new InvitationAcceptedEmailTemplate(
      data
    ).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendClientInvitationAcceptedEmail(
    to: string,
    inviterName: string,
    acceptedByName: string,
    companyName: string,
    role: string
  ): Promise<void> {
    const data: InvitationAcceptedEmailData = {
      inviterName,
      acceptedByName,
      companyName,
      role,
      userType: 'client',
      acceptedDate: new Date().toLocaleDateString(),
    };
    const { subject, html } = new InvitationAcceptedEmailTemplate(
      data
    ).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendApplicationShortlistedEmail(params: {
    to: string;
    jobTitle: string;
    companyName: string;
    notes?: string;
  }): Promise<void> {
    const data: ApplicationStatusEmailData = {
      candidateName: 'You',
      jobTitle: params.jobTitle,
      companyName: params.companyName,
      status: 'shortlisted',
      notes: params.notes,
      isForCandidate: true,
    };
    const { subject, html } = new ApplicationStatusEmailTemplate(data).render();
    await this.sendEmail({
      to: params.to,
      subject,
      html,
    });
  }

  async sendCandidateShortlistedEmail(params: {
    to: string;
    candidateName: string;
    companyName: string;
    clientUserName: string;
    jobTitle?: string;
    notes?: string;
  }): Promise<void> {
    const data: CandidateShortlistedData = {
      candidateName: params.candidateName,
      companyName: params.companyName,
      clientUserName: params.clientUserName,
      jobTitle: params.jobTitle,
      notes: params.notes,
    };
    const { subject, html } = new CandidateShortlistedEmailTemplate(
      data
    ).render();
    await this.sendEmail({
      to: params.to,
      subject,
      html,
    });
  }

  async sendPanelAssessmentFeedbackRequestEmail(
    to: string,
    panelMemberName: string,
    candidateName: string,
    jobTitle: string,
    companyName: string,
    feedbackUrl: string,
    _isInternal: boolean,
    expiryHours: number
  ): Promise<void> {
    const data: PanelAssessmentFeedbackRequestData = {
      panelMemberName,
      candidateName,
      jobTitle,
      companyName,
      feedbackUrl,
      expiryHours,
    };
    const { subject, html } = new PanelAssessmentFeedbackRequestEmailTemplate(
      data
    ).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendPanelAssessmentFeedbackReminderEmail(
    to: string,
    panelMemberName: string,
    candidateName: string,
    jobTitle: string,
    companyName: string,
    feedbackUrl: string,
    expiryHours: number
  ): Promise<void> {
    const data: PanelAssessmentFeedbackReminderData = {
      panelMemberName,
      candidateName,
      jobTitle,
      companyName,
      feedbackUrl,
      expiryHours,
    };
    const { subject, html } = new PanelAssessmentFeedbackReminderEmailTemplate(
      data
    ).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendPanelAssessmentSlotSelectionEmail(
    to: string,
    candidateName: string,
    jobTitle: string,
    companyName: string,
    availableSlots: Array<{
      date: string;
      localStartTime: string;
      localEndTime: string;
      duration: string;
    }>,
    selectSlotUrl: string,
    assessmentType: string,
    _expiryHours: number,
    timezone: string
  ): Promise<void> {
    const data: PanelAssessmentSlotData = {
      name: candidateName,
      candidateName,
      jobTitle,
      companyName,
      availableSlots,
      selectSlotUrl,
      assessmentType,
      timezone,
    };
    const template = new PanelAssessmentSlotEmailTemplate(data);
    const { subject, html } = template.render();
    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendJobRecommendationEmail(
    to: string,
    data: JobRecommendationData
  ): Promise<void> {
    const { subject, html } = new JobRecommendationEmailTemplate(data).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendJobAIAssessmentInviteEmail(
    to: string,
    data: JobAIAssessmentInviteData
  ): Promise<void> {
    const { subject, html } = new JobAIAssessmentInviteEmailTemplate(
      data
    ).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendClientJobInviteEmail(
    to: string,
    data: ClientJobInviteData
  ): Promise<void> {
    const { subject, html } = new ClientJobInviteEmailTemplate(data).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendCandidateJobAppliedEmail(
    to: string,
    data: CandidateJobAppliedData
  ): Promise<void> {
    const { subject, html } = new CandidateJobAppliedEmailTemplate(
      data
    ).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendCandidateApplicationStatusEmail(
    to: string,
    data: CandidateApplicationStatusData
  ): Promise<void> {
    const { subject, html } = new CandidateApplicationStatusEmailTemplate(
      data
    ).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendJobApplicationWithdrawEmail(
    to: string,
    data: JobApplicationWithdrawData
  ): Promise<void> {
    const { subject, html } = new JobApplicationWithdrawEmailTemplate(
      data
    ).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendPanelAssessmentSlotEmail(
    to: string,
    data: PanelAssessmentSlotData
  ): Promise<void> {
    const { subject, html } = new PanelAssessmentSlotEmailTemplate(
      data
    ).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendPanelAssessmentConfirmationEmail(
    to: string,
    panelMemberName: string,
    candidateName: string,
    jobTitle: string,
    companyName: string,
    confirmedSlot: {
      date: string;
      localStartTime: string;
      localEndTime: string;
      duration: string;
    },
    assessmentType: string
  ): Promise<void> {
    await this.sendPanelAssessmentSlotsConfirmationEmail(
      to,
      panelMemberName,
      candidateName,
      jobTitle,
      companyName,
      confirmedSlot,
      assessmentType
    );
  }

  async sendPanelAssessmentSlotsConfirmationEmail(
    to: string,
    panelMemberName: string,
    candidateName: string,
    jobTitle: string,
    companyName: string,
    confirmedSlot: {
      date: string;
      localStartTime: string;
      localEndTime: string;
      duration: string;
    },
    assessmentType: string
  ): Promise<void> {
    const data: PanelAssessmentSlotsConfirmationData = {
      name: panelMemberName,
      candidateName,
      jobTitle,
      companyName,
      confirmedSlot,
      assessmentType,
    };
    const { subject, html } = new PanelAssessmentSlotsConfirmationEmailTemplate(
      data
    ).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendPanelInterviewLinkEmail(
    to: string,
    recipientName: string,
    candidateName: string,
    jobTitle: string,
    companyName: string,
    interviewDate: string,
    interviewTime: string,
    duration: string,
    timezone: string,
    meetingLink: string,
    eventId?: string,
    panelMemberNames?: string[],
    additionalInstructions?: string,
    isCandidate?: boolean
  ): Promise<void> {
    const data: PanelInterviewLinkData = {
      recipientName,
      candidateName,
      jobTitle,
      companyName,
      interviewDate,
      interviewTime,
      duration,
      timezone,
      meetingLink,
      eventId,
      panelMemberNames: panelMemberNames || [],
      additionalInstructions,
      isCandidate: isCandidate || false,
    };

    const { subject, html } = new PanelInterviewLinkEmailTemplate(
      data
    ).render();

    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendUserSignupInviteEmail(
    to: string,
    data: UserSignupInviteData
  ): Promise<void> {
    const { subject, html } = new UserSignupInviteEmailTemplate(data).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendUserSignupAcceptedEmail(
    to: string,
    data: UserSignupAcceptedData
  ): Promise<void> {
    const { subject, html } = new UserSignupAcceptedEmailTemplate(
      data
    ).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendUserWelcomeEmail(to: string, data: UserWelcomeData): Promise<void> {
    const { subject, html } = new UserWelcomeEmailTemplate(data).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendRecommendedCandidatesEmail(
    to: string,
    data: RecommendedCandidatesData
  ): Promise<void> {
    const { subject, html } = new RecommendedCandidatesEmailTemplate(
      data
    ).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendDailyDigestEmail(to: string, data: DailyDigestData): Promise<void> {
    const { subject, html } = new DailyDigestEmailTemplate(data).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendDailyStatsEmail(
    to: string,
    data: DailyStatsEmailData
  ): Promise<void> {
    const { subject, html } = new DailyStatsEmailTemplate(data).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendJobInviteEmail(
    to: string,
    name: string,
    companyName: string,
    inviterName: string,
    jobTitle: string,
    invitationUrl: string,
    expiryHours: number
  ): Promise<void> {
    const emailData: JobInviteEmailData = {
      name,
      companyName,
      inviterName,
      jobTitle,
      invitationUrl,
      expiryHours,
    };
    const { subject, html } = new JobInviteEmailTemplate(emailData).render();
    await this.sendEmail({
      from: `${this.fromName} <${this.fromEmail}>`,
      to,
      subject,
      html,
    });
  }

  async sendClientSubscriptionUpgradedEmail(
    to: string,
    name: string,
    companyName: string,
    newPackage: string
  ): Promise<void> {
    const data: ClientSubscriptionUpgradedEmailData = {
      name,
      companyName,
      newPackage,
    };
    const { subject, html } = new ClientSubscriptionUpgradedEmailTemplate(
      data
    ).render();
    await this.sendEmail({ to, subject, html });
  }

  async sendClientSubscriptionDowngradedEmail(
    to: string,
    name: string,
    companyName: string,
    newPackage: string
  ): Promise<void> {
    const data: ClientSubscriptionDowngradedEmailData = {
      name,
      companyName,
      newPackage,
    };
    const { subject, html } = new ClientSubscriptionDowngradedEmailTemplate(
      data
    ).render();
    await this.sendEmail({ to, subject, html });
  }
  async sendJobAIAssessmentInterviewLinkEmail(
    to: string,
    candidateName: string,
    companyName: string,
    jobTitle: string,
    invitationUrl: string,
    expiryHours: number
  ): Promise<void> {
    const data = {
      candidateName,
      companyName,
      jobTitle,
      invitationUrl,
      expiryHours,
    };
    const { subject, html, text } =
      new JobAIAssessmentInterviewLinkEmailTemplate(data).render();
    try {
      await this.sendEmail({
        to,
        subject,
        html,
        text,
      });
      logger.info('Job AI assessment interview link email sent', {
        context: 'NodemailerService.sendJobAIAssessmentInterviewLinkEmail',
        to,
        candidateName,
        companyName,
        jobTitle,
      });
    } catch (error) {
      logger.error('Error sending job AI assessment interview link email', {
        context: 'NodemailerService.sendJobAIAssessmentInterviewLinkEmail',
        error,
      });
    }
  }

  async sendMcpInterviewAssessmentInviteEmail(
    to: string,
    candidateName: string,
    companyName: string,
    jobTitle: string,
    invitationUrl: string,
    expiryHours: number
  ): Promise<void> {
    const data = {
      candidateName,
      companyName,
      jobTitle,
      invitationUrl,
      expiryHours,
    };
    const { subject, html, text } =
      new McpInterviewAssessmentInviteEmailTemplate(data).render();
    try {
      await this.sendEmail({
        to,
        subject,
        html,
        text,
      });
      logger.info('MCP interview assessment invite email sent', {
        context: 'NodemailerService.sendMcpInterviewAssessmentInviteEmail',
        to,
        candidateName,
        companyName,
        jobTitle,
      });
    } catch (error) {
      logger.error('Error sending MCP interview assessment invite email', {
        context: 'NodemailerService.sendMcpInterviewAssessmentInviteEmail',
        error,
      });
    }
  }

  async sendSupportUserInvitationEmail(
    to: string,
    name: string,
    inviterName: string,
    invitationUrl: string,
    role: string,
    expiryHours: number,
    _department?: string,
    _supportLevel?: string,
    userType?: string,
    userRole?: string
  ): Promise<void> {
    const data: InvitationEmailData = {
      name,
      companyName: 'Teamcast Support Team',
      inviterName,
      invitationUrl,
      role,
      expiryHours,
      userType: (userType as UserTypeEnum) || UserTypeEnum.SUPPORT,
      userRole: (userRole as UserRoleEnum) || UserRoleEnum.INDIVIDUAL,
    };
    const { subject, html } = new InvitationEmailTemplate(data).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendSupportUserInvitationWithdrawnEmail(
    to: string,
    name: string,
    inviterName: string
  ): Promise<void> {
    const data: SupportInvitationWithdrawnData = {
      name,
      inviterName,
      invitationType: 'support',
      companyName: 'Teamcast Support Team',
      actionByName: inviterName,
      isActivation: false,
      userType: UserTypeEnum.SUPPORT,
    };
    const { subject, html } = new SupportInvitationWithdrawnEmailTemplate(
      data
    ).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendSupportInvitationAcceptedEmail(
    to: string,
    inviterName: string,
    acceptedByName: string
  ): Promise<void> {
    const data: InvitationAcceptedEmailData = {
      inviterName,
      acceptedByName,
      companyName: 'Teamcast Support Team',
      role: 'Support Team Member',
      userType: 'client',
      acceptedDate: new Date().toLocaleDateString(),
    };
    const { subject, html } = new InvitationAcceptedEmailTemplate(
      data
    ).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendSupportCandidateInvitationEmail(
    to: string,
    name: string,
    inviterName: string,
    invitationUrl: string,
    expiryHours: number,
    _jobTitle?: string,
    userType?: string,
    userRole?: string
  ): Promise<void> {
    const data: InvitationEmailData = {
      name,
      companyName: 'Teamcast Support Team',
      inviterName,
      invitationUrl,
      role: 'Candidate',
      expiryHours,
      userType: (userType as UserTypeEnum) || UserTypeEnum.CANDIDATE,
      userRole: (userRole as UserRoleEnum) || UserRoleEnum.INDIVIDUAL,
    };
    const { subject, html } = new InvitationEmailTemplate(data).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendCampaignInvitationEmail(
    to: string,
    name: string,
    inviterName: string,
    invitationUrl: string,
    jobTitle?: string
  ): Promise<void> {
    const data: CampaignInvitationEmailData = {
      name,
      inviterName,
      invitationUrl,
      jobTitle,
    };
    const { subject, html } = new CampaignInvitationEmailTemplate(
      data
    ).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendSupportCandidateInvitationWithdrawnEmail(
    to: string,
    name: string,
    inviterName: string
  ): Promise<void> {
    const data: SupportInvitationWithdrawnData = {
      name,
      inviterName,
      invitationType: 'candidate',
      companyName: 'Teamcast Support Team',
      actionByName: inviterName,
      isActivation: false,
      userType: UserTypeEnum.SUPPORT,
    };
    const { subject, html } = new SupportInvitationWithdrawnEmailTemplate(
      data
    ).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendSupportCandidateInvitationAcceptedEmail(
    to: string,
    inviterName: string,
    acceptedByName: string
  ): Promise<void> {
    const data: InvitationAcceptedEmailData = {
      inviterName,
      acceptedByName,
      companyName: 'Teamcast Support Team',
      role: 'Support Candidate',
      userType: 'client',
      acceptedDate: new Date().toLocaleDateString(),
    };
    const { subject, html } = new InvitationAcceptedEmailTemplate(
      data
    ).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendSupportJobPostingInviteEmail(
    to: string,
    name: string,
    inviterName: string,
    jobTitle: string,
    companyName: string,
    invitationUrl: string,
    expiryHours: number,
    jobDescription?: string,
    requirements?: string[],
    benefits?: string[]
  ): Promise<void> {
    const data: SupportJobPostingInviteEmailData = {
      name,
      inviterName,
      jobTitle,
      companyName,
      invitationUrl,
      expiryHours,
      jobDescription,
      requirements,
      benefits,
    };
    const { subject, html, text } = new SupportJobPostingInviteEmailTemplate(
      data
    ).render();
    await this.sendEmail({
      to,
      subject,
      html,
      text,
    });
  }

  async sendSupportJobPostingInviteWithdrawnEmail(
    to: string,
    name: string,
    inviterName: string,
    jobTitle: string,
    companyName: string,
    reason?: string
  ): Promise<void> {
    const data: SupportJobPostingInviteWithdrawnEmailData = {
      name,
      inviterName,
      jobTitle,
      companyName,
      reason,
    };
    const { subject, html, text } =
      new SupportJobPostingInviteWithdrawnEmailTemplate(data).render();
    await this.sendEmail({
      to,
      subject,
      html,
      text,
    });
  }

  /**
   * Sends a notification to a recruiter when they are assigned to a job posting
   */
  async sendRecruiterJobAssignmentEmail(
    to: string,
    recruiterName: string,
    jobTitle: string,
    jobDescription: string,
    companyName: string,
    clientName: string,
    assignedByName: string,
    jobPostingUrl: string,
    dashboardUrl: string,
    ccEmail?: string
  ): Promise<void> {
    const data: RecruiterJobAssignmentEmailData = {
      recruiterName,
      jobTitle,
      jobDescription,
      companyName,
      clientName,
      assignedByName,
      jobPostingUrl,
      dashboardUrl,
    };

    const { subject, html } = new RecruiterJobAssignmentEmailTemplate(
      data
    ).render();

    await this.sendEmail({
      to,
      subject,
      html,
      ...(ccEmail && { cc: ccEmail }),
    });
  }

  /**
   * Sends a notification to an account manager when a recruiter is assigned to their client's job posting
   */
  async sendAccountManagerRecruiterAssignmentEmail(
    to: string,
    accountManagerName: string,
    recruiterName: string,
    recruiterEmail: string,
    jobTitle: string,
    companyName: string,
    clientName: string,
    assignedByName: string,
    jobPostingUrl: string,
    dashboardUrl: string
  ): Promise<void> {
    const data: AccountManagerRecruiterAssignmentEmailData = {
      accountManagerName,
      recruiterName,
      recruiterEmail,
      jobTitle,
      companyName,
      clientName,
      assignedByName,
      jobPostingUrl,
      dashboardUrl,
    };

    const { subject, html } =
      new AccountManagerRecruiterAssignmentEmailTemplate(data).render();

    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  /**
   * Send hire request email to account manager
   */
  async sendHireRequestEmail(
    to: string,
    accountManagerName: string,
    clientName: string,
    clientCompanyName: string,
    clientEmail: string,
    candidateName: string,
    candidateEmail: string,
    jobTitle: string,
    applicationId: string,
    candidateId: string,
    clientId: string,
    requestDate: string,
    priority: 'high' | 'medium' | 'low',
    assessmentScore?: number,
    assessmentResult?: string,
    assessmentRecommendation?: string,
    specialNotes?: string
  ): Promise<void> {
    if (!this.sendNotifications) {
      logger.info('Notifications disabled, skipping hire request email', {
        context: 'NodemailerProvider.sendHireRequestEmail',
        accountManagerName,
        candidateName,
        jobTitle,
      });
      return;
    }

    try {
      const data: HireRequestDeelSetupEmailData = {
        accountManagerName,
        clientName,
        clientCompanyName,
        clientEmail,
        candidateName,
        candidateEmail,
        jobTitle,
        applicationId,
        candidateId,
        clientId,
        assessmentScore,
        assessmentResult,
        assessmentRecommendation,
        requestDate,
        priority,
        specialNotes,
      };

      const template = new HireRequestDeelSetupEmailTemplate(data);
      const { subject, html, text } = template.render();

      await this.sendEmail({
        from: this.fromEmail,
        to,
        subject,
        html,
        text,
      });

      logger.info('Hire request email sent successfully', {
        context: 'NodemailerProvider.sendHireRequestEmail',
        accountManagerName,
        candidateName,
        jobTitle,
      });
    } catch (error) {
      logger.error('Failed to send hire request email', {
        context: 'NodemailerProvider.sendHireRequestEmail',
        error: error instanceof Error ? error.message : 'Unknown error',
        accountManagerName,
        candidateName,
        jobTitle,
      });
      throw error;
    }
  }

  /**
   * Send document rejection email to client
   */
  async sendDocumentRejectionEmail(
    to: string,
    clientName: string,
    companyName: string,
    documentName: string,
    documentType: string,
    rejectionReason: string,
    supportEmail?: string,
    supportUrl?: string,
    resubmissionInstructions?: string
  ): Promise<void> {
    if (!this.sendNotifications) {
      logger.info('Notifications disabled, skipping document rejection email', {
        context: 'NodemailerProvider.sendDocumentRejectionEmail',
        clientName,
        companyName,
        documentName,
      });
      return;
    }

    try {
      const data: DocumentRejectionEmailData = {
        clientName,
        companyName,
        documentName,
        documentType,
        rejectionReason,
        supportEmail: supportEmail || 'hello@teamcast.ai',
        supportUrl: supportUrl || 'https://teamcast.ai/help',
        resubmissionInstructions:
          resubmissionInstructions ||
          'Please review the feedback and make the necessary corrections before resubmitting.',
      };

      const { subject, html } = new DocumentRejectionEmailTemplate(
        data
      ).render();

      await this.sendEmail({
        to,
        subject,
        html,
      });

      logger.info('Document rejection email sent successfully', {
        context: 'NodemailerProvider.sendDocumentRejectionEmail',
        to,
        clientName,
        companyName,
        documentName,
      });
    } catch (error) {
      logger.error('Failed to send document rejection email', {
        context: 'NodemailerProvider.sendDocumentRejectionEmail',
        error: error instanceof Error ? error.message : 'Unknown error',
        to,
        clientName,
        companyName,
        documentName,
      });
      throw error;
    }
  }

  /**
   * Send support ticket assignment email to support user
   */
  async sendSupportTicketAssignmentEmail(
    to: string,
    supportUserName: string,
    ticketId: string,
    ticketTitle: string,
    ticketDescription: string,
    ticketPriority: 'low' | 'medium' | 'high' | 'urgent',
    ticketCategory: string,
    ticketStatus: string,
    assignedByName: string,
    assignedByEmail: string,
    ticketUrl: string,
    clientName?: string,
    clientCompanyName?: string,
    dueDate?: string,
    estimatedResolutionTime?: string,
    attachments?: Array<{
      name: string;
      size: string;
      type: string;
    }>
  ): Promise<void> {
    if (!this.sendNotifications) {
      logger.info(
        'Notifications disabled, skipping support ticket assignment email',
        {
          context: 'NodemailerProvider.sendSupportTicketAssignmentEmail',
          supportUserName,
          ticketId,
          ticketTitle,
        }
      );
      return;
    }

    try {
      const { SupportTicketAssignmentEmailTemplate } = await import(
        '@/templates/email'
      );

      const data = {
        supportUserName,
        ticketId,
        ticketTitle,
        ticketDescription,
        ticketPriority,
        ticketCategory,
        ticketStatus,
        assignedByName,
        assignedByEmail,
        ticketUrl,
        clientName,
        clientCompanyName,
        dueDate,
        estimatedResolutionTime,
        attachments: attachments || [],
      };

      const { subject, html } = new SupportTicketAssignmentEmailTemplate(
        data
      ).render();

      await this.sendEmail({
        to,
        subject,
        html,
      });

      logger.info(
        'Support ticket assignment email sent successfully via Nodemailer',
        {
          context: 'NodemailerProvider.sendSupportTicketAssignmentEmail',
          to,
          supportUserName,
          ticketId,
          ticketTitle,
          ticketPriority,
        }
      );
    } catch (error) {
      logger.error(
        'Failed to send support ticket assignment email via Nodemailer',
        {
          context: 'NodemailerProvider.sendSupportTicketAssignmentEmail',
          error: error instanceof Error ? error.message : 'Unknown error',
          to,
          supportUserName,
          ticketId,
          ticketTitle,
        }
      );
      throw error;
    }
  }

  /**
   * Send support ticket comment notification email to account manager when client adds comment
   */
  async sendSupportTicketCommentToAccountManagerEmail(
    to: string,
    accountManagerName: string,
    ticketId: string,
    ticketTitle: string,
    ticketNumber: string,
    commentContent: string,
    commentAuthorName: string,
    commentAuthorEmail: string,
    clientCompanyName: string,
    ticketUrl: string,
    ticketPriority: string,
    ticketStatus: string
  ): Promise<void> {
    if (!this.sendNotifications) {
      logger.info(
        'Notifications disabled, skipping support ticket comment to account manager email',
        {
          context:
            'NodemailerProvider.sendSupportTicketCommentToAccountManagerEmail',
          accountManagerName,
          ticketId,
          ticketTitle,
        }
      );
      return;
    }

    try {
      const { SupportTicketCommentToAccountManagerEmailTemplate } =
        await import('@/templates/email');

      const data = {
        accountManagerName,
        ticketId,
        ticketTitle,
        ticketNumber,
        commentContent,
        commentAuthorName,
        commentAuthorEmail,
        clientCompanyName,
        ticketUrl,
        ticketPriority,
        ticketStatus,
      };

      const { subject, html } =
        new SupportTicketCommentToAccountManagerEmailTemplate(data).render();

      await this.sendEmail({
        to,
        subject,
        html,
      });

      logger.info(
        'Support ticket comment to account manager email sent successfully via Nodemailer',
        {
          context:
            'NodemailerProvider.sendSupportTicketCommentToAccountManagerEmail',
          to,
          accountManagerName,
          ticketId,
          ticketTitle,
          commentAuthorName,
        }
      );
    } catch (error) {
      logger.error(
        'Failed to send support ticket comment to account manager email via Nodemailer',
        {
          context:
            'NodemailerProvider.sendSupportTicketCommentToAccountManagerEmail',
          error: error instanceof Error ? error.message : 'Unknown error',
          to,
          accountManagerName,
          ticketId,
          ticketTitle,
        }
      );
      throw error;
    }
  }

  /**
   * Send support ticket comment notification email to client when account manager adds comment
   */
  async sendSupportTicketCommentToClientEmail(
    to: string,
    clientName: string,
    ticketId: string,
    ticketTitle: string,
    ticketNumber: string,
    commentContent: string,
    commentAuthorName: string,
    commentAuthorEmail: string,
    ticketUrl: string,
    ticketPriority: string,
    ticketStatus: string,
    accountManagerJobTitle?: string
  ): Promise<void> {
    if (!this.sendNotifications) {
      logger.info(
        'Notifications disabled, skipping support ticket comment to client email',
        {
          context: 'NodemailerProvider.sendSupportTicketCommentToClientEmail',
          clientName,
          ticketId,
          ticketTitle,
        }
      );
      return;
    }

    try {
      const { SupportTicketCommentToClientEmailTemplate } = await import(
        '@/templates/email'
      );

      const data = {
        clientName,
        ticketId,
        ticketTitle,
        ticketNumber,
        commentContent,
        commentAuthorName,
        commentAuthorEmail,
        ticketUrl,
        ticketPriority,
        ticketStatus,
        accountManagerJobTitle,
      };

      const { subject, html } = new SupportTicketCommentToClientEmailTemplate(
        data
      ).render();

      await this.sendEmail({
        to,
        subject,
        html,
      });

      logger.info(
        'Support ticket comment to client email sent successfully via Nodemailer',
        {
          context: 'NodemailerProvider.sendSupportTicketCommentToClientEmail',
          to,
          clientName,
          ticketId,
          ticketTitle,
          commentAuthorName,
        }
      );
    } catch (error) {
      logger.error(
        'Failed to send support ticket comment to client email via Nodemailer',
        {
          context: 'NodemailerProvider.sendSupportTicketCommentToClientEmail',
          error: error instanceof Error ? error.message : 'Unknown error',
          to,
          clientName,
          ticketId,
          ticketTitle,
        }
      );
      throw error;
    }
  }

  async sendOnboardingAssessmentReminderEmail(
    to: string,
    name: string,
    assessmentUrl: string,
    resumeCompletedDate?: string
  ): Promise<void> {
    const data: OnboardingAssessmentReminderEmailData = {
      name,
      assessmentUrl,
      resumeCompletedDate,
    };
    const { subject, html } = new OnboardingAssessmentReminderEmailTemplate(
      data
    ).render();
    await this.sendEmail({
      to,
      subject,
      html,
    });

    logger.info('Onboarding assessment reminder email sent', {
      context: 'NodemailerProvider.sendOnboardingAssessmentReminderEmail',
      to,
      name,
    });
  }
}
