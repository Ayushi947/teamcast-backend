import { ENV } from '@/config/env';
import { logger } from '@/shared/utils/logger';
import { singleton } from '@/shared/decorators/singleton';
import { INotificationProvider } from './notification.interface';
import * as Brevo from '@getbrevo/brevo';
import {
  SupportJobPostingInviteEmailTemplate,
  SupportJobPostingInviteEmailData,
} from '@/templates/email/support.job.posting.invite.template';
import {
  SupportJobPostingInviteWithdrawnEmailTemplate,
  SupportJobPostingInviteWithdrawnEmailData,
} from '@/templates/email/support.job.posting.invite.withdrawn.template';
import {
  RecruiterJobAssignmentEmailTemplate,
  RecruiterJobAssignmentEmailData,
} from '@/templates/email/recruiter-job-assignment.template';
import {
  AccountManagerRecruiterAssignmentEmailTemplate,
  AccountManagerRecruiterAssignmentEmailData,
} from '@/templates/email/account-manager-recruiter-assignment.template';
import { JobAIAssessmentInterviewLinkEmailTemplate } from '@/templates/email/job-ai-assesment-interview-link';
import { McpInterviewAssessmentInviteEmailTemplate } from '@/templates/email/mcp-interview-assessment-invite';

/**
 * Brevo implementation of the notification service
 */
@singleton
export class BrevoProvider implements INotificationProvider {
  private readonly apiKey: string;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly apiInstance: Brevo.TransactionalEmailsApi;
  private readonly sendNotifications: boolean;

  constructor() {
    this.apiKey = ENV.BREVO_API_KEY || '';
    this.fromEmail = ENV.BREVO_FROM_EMAIL || 'noreply@example.com';
    this.fromName = ENV.BREVO_FROM_NAME || 'Teamcast';
    this.sendNotifications = ENV.SEND_NOTIFICATIONS;

    if (!this.apiKey) {
      logger.warn('Brevo API key not provided', {
        context: 'BrevoProvider.constructor',
      });
    }

    // Initialize the Brevo API instance
    this.apiInstance = new Brevo.TransactionalEmailsApi();
    this.apiInstance.setApiKey(
      Brevo.TransactionalEmailsApiApiKeys.apiKey,
      this.apiKey
    );

    logger.info('Brevo notification service initialized', {
      context: 'BrevoProvider.constructor',
      sendNotifications: this.sendNotifications,
    });
  }

  /**
   * Sends an OTP verification email using Brevo
   */
  async sendOtpVerificationEmail(
    to: string,
    name: string,
    otpCode: string
  ): Promise<void> {
    const templateId = parseInt(ENV.BREVO_VERIFICATION_TEMPLATE_ID);

    await this.sendTemplatedEmail({
      to,
      templateId,
      templateParams: {
        name,
        otpCode,
      },
      logContext: 'BrevoProvider.sendOtpVerificationEmail',
    });
  }

  /**
   * Sends a password reset email using Brevo
   */
  async sendPasswordResetEmail(
    to: string,
    name: string,
    resetUrl: string,
    userType?: string
  ): Promise<void> {
    const templateId = parseInt(ENV.BREVO_RESET_PASSWORD_TEMPLATE_ID);

    await this.sendTemplatedEmail({
      to,
      templateId,
      templateParams: {
        name,
        resetUrl,
        userType: userType || 'CANDIDATE',
      },
      logContext: 'BrevoProvider.sendPasswordResetEmail',
    });
  }

  /**
   * Sends a forgot password email using Brevo
   */
  async sendForgotPasswordEmail(
    to: string,
    name: string,
    resetUrl: string,
    userType?: string
  ): Promise<void> {
    const templateId = parseInt(ENV.BREVO_RESET_PASSWORD_TEMPLATE_ID);

    logger.info('Sending forgot password email', {
      context: 'BrevoProvider.sendForgotPasswordEmail',
      to,
    });

    await this.sendTemplatedEmail({
      to,
      templateId,
      templateParams: {
        name,
        resetUrl,
        userType: userType || 'CANDIDATE',
      },
      logContext: 'BrevoProvider.sendForgotPasswordEmail',
    });
  }

  /**
   * Sends a client signup email using Brevo
   */
  async sendClientSignupEmail(
    to: string,
    name: string,
    companyName: string,
    verificationUrl: string
  ): Promise<void> {
    const templateId = parseInt(ENV.BREVO_CLIENT_SIGNUP_TEMPLATE_ID);

    await this.sendTemplatedEmail({
      to,
      templateId,
      templateParams: {
        name,
        companyName,
        verificationUrl,
      },
      logContext: 'BrevoProvider.sendClientSignupEmail',
    });
  }

  /**
   * Sends a client account manager assignment email using Brevo
   */
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
    const templateId = parseInt(
      ENV.BREVO_CLIENT_ACCOUNT_MANAGER_ASSIGNMENT_TEMPLATE_ID
    );

    await this.sendTemplatedEmail({
      to,
      templateId,
      templateParams: {
        name,
        companyName,
        accountManagerName,
        accountManagerEmail,
        accountManagerJobTitle: accountManagerJobTitle || '',
        accountManagerPhone: accountManagerPhone || '',
        supportUrl: supportUrl || 'https://teamcast.ai/support',
      },
      logContext: 'BrevoProvider.sendClientAccountManagerAssignmentEmail',
    });
  }

  /**
   * Sends a notification to an account manager when a new client is onboarded using Brevo
   */
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
    const templateId = parseInt(
      ENV.BREVO_ACCOUNT_MANAGER_CLIENT_ONBOARDED_TEMPLATE_ID || '0'
    );

    await this.sendTemplatedEmail({
      to,
      templateId,
      templateParams: {
        accountManagerName,
        clientName,
        clientEmail,
        companyName,
        onboardingDate,
        dashboardUrl,
        companyType: companyType || '',
        companySize: companySize || '',
        companyIndustry: companyIndustry || '',
        clientRole: clientRole || '',
        clientProfileUrl: clientProfileUrl || '',
        supportUrl: supportUrl || 'https://teamcast.ai/support',
      },
      logContext: 'BrevoProvider.sendAccountManagerClientOnboardedEmail',
    });
  }

  /**
   * Sends a client invitation email using Brevo
   */
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
    const templateId = parseInt(ENV.BREVO_CLIENT_INVITATION_TEMPLATE_ID);

    logger.info('Sending client user invitation email', {
      context: 'BrevoProvider.sendClientUserInvitationEmail',
      to,
      templateId,
      templateParams: {
        name,
      },
    });

    await this.sendTemplatedEmail({
      to,
      templateId,
      templateParams: {
        name,
        companyName,
        inviterName,
        invitationUrl,
        role,
        expiryHours: expiryHours.toString(),
        userType: userType || 'CLIENT',
        userRole: userRole || 'INDIVIDUAL',
      },
      logContext: 'BrevoProvider.sendClientUserInvitationEmail',
    });
  }

  /**
   * Sends a partner invitation email using Brevo
   */
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
    const templateId = parseInt(ENV.BREVO_PARTNER_INVITATION_TEMPLATE_ID);

    logger.info('Sending partner user invitation email', {
      context: 'BrevoProvider.sendPartnerUserInvitationEmail',
      to,
      templateId,
      templateParams: {
        name,
      },
    });

    await this.sendTemplatedEmail({
      to,
      templateId,
      templateParams: {
        name,
        companyName,
        inviterName,
        invitationUrl,
        role,
        expiryHours: expiryHours.toString(),
        userType: userType || 'PARTNER',
        userRole: userRole || 'INDIVIDUAL',
      },
      logContext: 'BrevoProvider.sendPartnerUserInvitationEmail',
    });
  }

  /**
   * Sends a notification when a client invitation is withdrawn
   */
  async sendClientUserInvitationWithdrawnEmail(
    to: string,
    name: string,
    companyName: string,
    inviterName: string
  ): Promise<void> {
    const templateId = parseInt(
      ENV.BREVO_CLIENT_INVITATION_WITHDRAWN_TEMPLATE_ID
    );

    logger.info('Sending client user invitation withdrawn email', {
      context: 'BrevoProvider.sendClientUserInvitationWithdrawnEmail',
      to,
      templateId,
      templateParams: {
        name,
      },
    });

    await this.sendTemplatedEmail({
      to,
      templateId,
      templateParams: {
        name,
        companyName,
        inviterName,
      },
      logContext: 'BrevoProvider.sendClientUserInvitationWithdrawnEmail',
    });
  }

  /**
   * Sends a notification when a client user is activated
   */
  async sendClientUserActivatedEmail(
    to: string,
    name: string,
    companyName: string,
    activatedByName: string,
    dashboardUrl: string,
    _userRole?: string
  ): Promise<void> {
    const templateId = parseInt(ENV.BREVO_USER_ACTIVATED_TEMPLATE_ID);

    logger.info('Sending client user activated email', {
      context: 'BrevoProvider.sendClientUserActivatedEmail',
      to,
      templateId,
      templateParams: {
        name,
        companyName,
        activatedByName,
        dashboardUrl,
      },
    });

    await this.sendTemplatedEmail({
      to,
      templateId,
      templateParams: {
        name,
        companyName,
        activatedByName,
        dashboardUrl,
      },
      logContext: 'BrevoProvider.sendClientUserActivatedEmail',
    });
  }

  async sendPartnerUserActivatedEmail(
    to: string,
    name: string,
    companyName: string,
    activatedByName: string,
    dashboardUrl: string,
    _userRole?: string
  ): Promise<void> {
    const templateId = parseInt(ENV.BREVO_USER_ACTIVATED_TEMPLATE_ID);

    await this.sendTemplatedEmail({
      to,
      templateId,
      templateParams: {
        name,
        companyName,
        activatedByName,
        dashboardUrl,
      },
      logContext: 'BrevoProvider.sendPartnerUserActivatedEmail',
    });
  }

  async sendPartnerUserDeactivatedEmail(
    to: string,
    name: string,
    companyName: string,
    deactivatedByName: string,
    contactUrl: string,
    _userRole?: string
  ): Promise<void> {
    const templateId = parseInt(ENV.BREVO_USER_DEACTIVATED_TEMPLATE_ID);

    await this.sendTemplatedEmail({
      to,
      templateId,
      templateParams: {
        name,
        companyName,
        deactivatedByName,
        contactUrl,
      },
      logContext: 'BrevoProvider.sendPartnerUserDeactivatedEmail',
    });
  }

  /**
   * Sends a notification when a client user is deactivated
   */
  async sendClientUserDeactivatedEmail(
    to: string,
    name: string,
    companyName: string,
    deactivatedByName: string,
    contactUrl: string,
    _userRole?: string
  ): Promise<void> {
    const templateId = parseInt(ENV.BREVO_USER_DEACTIVATED_TEMPLATE_ID);

    logger.info('Sending client user deactivated email', {
      context: 'BrevoProvider.sendClientUserDeactivatedEmail',
      to,
      templateId,
      templateParams: {
        name,
        companyName,
        deactivatedByName,
        contactUrl,
      },
    });

    await this.sendTemplatedEmail({
      to,
      templateId,
      templateParams: {
        name,
        companyName,
        deactivatedByName,
        contactUrl,
      },
      logContext: 'BrevoProvider.sendClientUserDeactivatedEmail',
    });
  }

  /**
   * Sends a notification to candidate when their application is accepted
   */
  async sendApplicationAcceptedEmail(params: {
    to: string;
    jobTitle: string;
    companyName: string;
    notes?: string;
    aiAssessmentLink?: string;
  }): Promise<void> {
    const templateId = parseInt(ENV.BREVO_APPLICATION_ACCEPTED_TEMPLATE_ID);

    await this.sendTemplatedEmail({
      to: params.to,
      templateId,
      templateParams: {
        jobTitle: params.jobTitle,
        companyName: params.companyName,
        notes: params.notes || '',
        aiAssessmentLink: params.aiAssessmentLink || '',
      },
      logContext: 'BrevoProvider.sendApplicationAcceptedEmail',
    });
  }

  /**
   * Sends a notification to client when candidate accepts their application
   */
  async sendCandidateAcceptedApplicationEmail(params: {
    to: string;
    candidateName: string;
    jobTitle: string;
    notes?: string;
  }): Promise<void> {
    const templateId = parseInt(ENV.BREVO_CANDIDATE_ACCEPTED_TEMPLATE_ID);

    await this.sendTemplatedEmail({
      to: params.to,
      templateId,
      templateParams: {
        candidateName: params.candidateName,
        jobTitle: params.jobTitle,
        notes: params.notes || '',
      },
      logContext: 'BrevoProvider.sendCandidateAcceptedApplicationEmail',
    });
  }

  /**
   * Sends a notification to candidate when their application is rejected
   */
  async sendApplicationRejectedEmail(params: {
    to: string;
    jobTitle: string;
    companyName: string;
    notes?: string;
  }): Promise<void> {
    const templateId = parseInt(ENV.BREVO_APPLICATION_REJECTED_TEMPLATE_ID);

    await this.sendTemplatedEmail({
      to: params.to,
      templateId,
      templateParams: {
        jobTitle: params.jobTitle,
        companyName: params.companyName,
        notes: params.notes || '',
      },
      logContext: 'BrevoProvider.sendApplicationRejectedEmail',
    });
  }

  /**
   * Sends a notification to client when candidate rejects their application
   */
  async sendCandidateRejectedApplicationEmail(params: {
    to: string;
    candidateName: string;
    jobTitle: string;
    notes?: string;
  }): Promise<void> {
    const templateId = parseInt(ENV.BREVO_CANDIDATE_REJECTED_TEMPLATE_ID);

    await this.sendTemplatedEmail({
      to: params.to,
      templateId,
      templateParams: {
        candidateName: params.candidateName,
        jobTitle: params.jobTitle,
        notes: params.notes || '',
      },
      logContext: 'BrevoProvider.sendCandidateRejectedApplicationEmail',
    });
  }

  /**
   * Sends a notification to client when candidate declines their invitation/application
   * Note: This is different from "rejected" which is when client rejects candidate's application
   */
  async sendCandidateDeclinedApplicationEmail(params: {
    to: string;
    candidateName: string;
    jobTitle: string;
    notes?: string;
  }): Promise<void> {
    // Use declined template ID - this template should say "candidate declined the invitation"
    // not "candidate declined the offer"
    const templateId = parseInt(ENV.BREVO_CANDIDATE_DECLINED_TEMPLATE_ID);

    await this.sendTemplatedEmail({
      to: params.to,
      templateId,
      templateParams: {
        candidateName: params.candidateName,
        jobTitle: params.jobTitle,
        notes: params.notes || '',
      },
      logContext: 'BrevoProvider.sendCandidateDeclinedApplicationEmail',
    });
  }

  /**
   * Sends a notification to candidate when their application is withdrawn
   */
  async sendApplicationWithdrawnEmail(params: {
    to: string;
    jobTitle: string;
    companyName: string;
    notes?: string;
  }): Promise<void> {
    const templateId = parseInt(ENV.BREVO_APPLICATION_WITHDRAWN_TEMPLATE_ID);

    await this.sendTemplatedEmail({
      to: params.to,
      templateId,
      templateParams: {
        jobTitle: params.jobTitle,
        companyName: params.companyName,
        notes: params.notes || '',
      },
      logContext: 'BrevoProvider.sendApplicationWithdrawnEmail',
    });
  }

  /**
   * Sends a notification to client when candidate withdraws their application
   */
  async sendCandidateWithdrewApplicationEmail(params: {
    to: string;
    candidateName: string;
    jobTitle: string;
    notes?: string;
  }): Promise<void> {
    const templateId = parseInt(ENV.BREVO_CANDIDATE_WITHDREW_TEMPLATE_ID);

    await this.sendTemplatedEmail({
      to: params.to,
      templateId,
      templateParams: {
        candidateName: params.candidateName,
        jobTitle: params.jobTitle,
        notes: params.notes || '',
      },
      logContext: 'BrevoProvider.sendCandidateWithdrewApplicationEmail',
    });
  }

  /**
   * Sends a notification to candidate when they submit a job application
   */
  async sendJobApplicationSubmittedEmail(params: {
    to: string;
    jobTitle: string;
    companyName: string;
    notes?: string;
  }): Promise<void> {
    const templateId = parseInt(
      ENV.BREVO_JOB_APPLICATION_SUBMITTED_TEMPLATE_ID
    );

    await this.sendTemplatedEmail({
      to: params.to,
      templateId,
      templateParams: {
        jobTitle: params.jobTitle,
        companyName: params.companyName,
        notes: params.notes || '',
      },
      logContext: 'BrevoProvider.sendJobApplicationSubmittedEmail',
    });
  }

  /**
   * Sends a notification to client when a new job application is received
   */
  async sendNewJobApplicationEmail(params: {
    to: string;
    candidateName: string;
    jobTitle: string;
    companyName: string;
  }): Promise<void> {
    const templateId = parseInt(ENV.BREVO_NEW_JOB_APPLICATION_TEMPLATE_ID);

    await this.sendTemplatedEmail({
      to: params.to,
      templateId,
      templateParams: {
        candidateName: params.candidateName,
        jobTitle: params.jobTitle,
        companyName: params.companyName,
      },
      logContext: 'BrevoProvider.sendNewJobApplicationEmail',
    });
  }

  /**
   * Sends a notification when a support user is activated
   */
  async sendSupportUserActivatedEmail(
    to: string,
    name: string,
    activatedByName: string,
    dashboardUrl: string,
    _userRole?: string
  ): Promise<void> {
    const templateId = parseInt(ENV.BREVO_USER_ACTIVATED_TEMPLATE_ID);

    logger.info('Sending support user activated email', {
      context: 'BrevoProvider.sendSupportUserActivatedEmail',
      to,
      templateId,
      templateParams: {
        name,
        activatedByName,
        dashboardUrl,
      },
    });

    await this.sendTemplatedEmail({
      to,
      templateId,
      templateParams: {
        name,
        activatedByName,
        dashboardUrl,
      },
      logContext: 'BrevoProvider.sendSupportUserActivatedEmail',
    });
  }

  /**
   * Sends a notification when a support user is deactivated
   */
  async sendSupportUserDeactivatedEmail(
    to: string,
    name: string,
    deactivatedByName: string,
    contactUrl: string,
    _userRole?: string
  ): Promise<void> {
    const templateId = parseInt(ENV.BREVO_USER_DEACTIVATED_TEMPLATE_ID);

    logger.info('Sending support user deactivated email', {
      context: 'BrevoProvider.sendSupportUserDeactivatedEmail',
      to,
      templateId,
      templateParams: {
        name,
        deactivatedByName,
        contactUrl,
      },
    });

    await this.sendTemplatedEmail({
      to,
      templateId,
      templateParams: {
        name,
        deactivatedByName,
        contactUrl,
      },
      logContext: 'BrevoProvider.sendSupportUserDeactivatedEmail',
    });
  }

  /**
   * Sends a notification to inviter when their invitation is accepted
   */
  async sendPartnerInvitationAcceptedEmail(
    to: string,
    inviterName: string,
    acceptedByName: string,
    companyName: string,
    role: string
  ): Promise<void> {
    const templateId = parseInt(
      ENV.BREVO_PARTNER_USER_INVITATION_ACKNOWLEDGMENT_TEMPLATE_ID
    );

    await this.sendTemplatedEmail({
      to,
      templateId,
      templateParams: {
        inviterName,
        acceptedByName,
        companyName,
        role,
      },
      logContext: 'BrevoProvider.sendPartnerInvitationAcceptedEmail',
    });
  }

  /**
   * Sends a notification to client inviter when their invitation is accepted
   */
  async sendClientInvitationAcceptedEmail(
    to: string,
    inviterName: string,
    acceptedByName: string,
    companyName: string,
    role: string
  ): Promise<void> {
    // For now, use the same template as partner invitation acknowledgment
    // This can be changed to a specific client template later
    const templateId = parseInt(
      ENV.BREVO_PARTNER_USER_INVITATION_ACKNOWLEDGMENT_TEMPLATE_ID
    );

    await this.sendTemplatedEmail({
      to,
      templateId,
      templateParams: {
        inviterName,
        acceptedByName,
        companyName,
        role,
      },
      logContext: 'BrevoProvider.sendClientInvitationAcceptedEmail',
    });
  }

  /**
   * Sends a notification to candidate when their application is shortlisted
   */
  async sendApplicationShortlistedEmail(params: {
    to: string;
    jobTitle: string;
    companyName: string;
    notes?: string;
  }): Promise<void> {
    const templateId = parseInt(ENV.BREVO_APPLICATION_SHORTLISTED_TEMPLATE_ID);

    await this.sendTemplatedEmail({
      to: params.to,
      templateId,
      templateParams: {
        jobTitle: params.jobTitle,
        companyName: params.companyName,
        notes: params.notes || '',
      },
      logContext: 'BrevoProvider.sendApplicationShortlistedEmail',
    });
  }

  /**
   * Sends a feedback request email to panel members after interview completion
   */
  async sendPanelAssessmentFeedbackRequestEmail(
    to: string,
    panelMemberName: string,
    candidateName: string,
    jobTitle: string,
    companyName: string,
    feedbackUrl: string,
    isInternal: boolean,
    expiryHours: number
  ): Promise<void> {
    const templateId = parseInt(ENV.BREVO_CLIENT_INVITATION_TEMPLATE_ID);

    logger.info('Sending panel assessment feedback request email', {
      context: 'BrevoProvider.sendPanelAssessmentFeedbackRequestEmail',
      to,
      templateId,
      templateParams: {
        panelMemberName,
        candidateName,
        jobTitle,
        companyName,
        isInternal: isInternal.toString(),
      },
    });

    await this.sendTemplatedEmail({
      to,
      templateId,
      templateParams: {
        panelMemberName,
        candidateName,
        jobTitle,
        companyName,
        feedbackUrl,
        isInternal: isInternal.toString(),
        expiryHours: expiryHours.toString(),
      },
      logContext: 'BrevoProvider.sendPanelAssessmentFeedbackRequestEmail',
    });
  }

  /**
   * Sends a reminder email to panel members who haven't submitted feedback
   */
  async sendPanelAssessmentFeedbackReminderEmail(
    to: string,
    panelMemberName: string,
    candidateName: string,
    jobTitle: string,
    companyName: string,
    feedbackUrl: string,
    expiryHours: number
  ): Promise<void> {
    const templateId = parseInt(ENV.BREVO_CLIENT_INVITATION_TEMPLATE_ID);

    logger.info('Sending panel assessment feedback reminder email', {
      context: 'BrevoProvider.sendPanelAssessmentFeedbackReminderEmail',
      to,
      templateId,
      templateParams: {
        panelMemberName,
        candidateName,
        jobTitle,
        companyName,
      },
    });

    await this.sendTemplatedEmail({
      to,
      templateId,
      templateParams: {
        panelMemberName,
        candidateName,
        jobTitle,
        companyName,
        feedbackUrl,
        expiryHours: expiryHours.toString(),
      },
      logContext: 'BrevoProvider.sendPanelAssessmentFeedbackReminderEmail',
    });
  }

  /**
   * Common method to send templated emails
   */
  private async sendTemplatedEmail({
    to,
    templateId,
    templateParams,
    logContext,
  }: {
    to: string;
    templateId: number;
    templateParams: Record<string, string>;
    logContext: string;
  }): Promise<void> {
    // Add environment name to template parameters, empty if production
    const enhancedTemplateParams = {
      ...templateParams,
      env_name: ENV.ENV_NAME === 'production' ? '' : ENV.ENV_NAME,
    };

    // If notifications are disabled, just log and return
    if (!this.sendNotifications) {
      logger.info(`email logging (notifications disabled)`, {
        context: logContext,
        to,
        templateId,
        enhancedTemplateParams,
      });
      return;
    }

    try {
      const sendSmtpEmail = new Brevo.SendSmtpEmail();

      // Set sender information
      sendSmtpEmail.sender = {
        name: this.fromName,
        email: this.fromEmail,
      };

      // Set recipient information
      sendSmtpEmail.to = [
        {
          email: to,
        },
      ];

      // Set template ID
      sendSmtpEmail.templateId = templateId;

      // Set template parameters
      sendSmtpEmail.params = enhancedTemplateParams;

      logger.info('Sending email via Brevo', {
        sendSmtpEmail,
      });

      // Send the email
      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);

      logger.info(`email sent via Brevo`, {
        context: logContext,
        to,
        messageId: result.body?.messageId,
      });
    } catch (error) {
      logger.error(`Failed to send email via Brevo`, {
        context: logContext,
        error: error instanceof Error ? error.message : 'Unknown error',
        to,
      });
      throw error;
    }
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
        context: 'BrevoProvider.sendEmail',
        to: options.to,
        subject: options.subject,
      });
      return;
    }

    try {
      const sendSmtpEmail = new Brevo.SendSmtpEmail();

      // Set sender information
      sendSmtpEmail.sender = {
        name: this.fromName,
        email: this.fromEmail,
      };

      // Set recipient information
      const recipients = Array.isArray(options.to) ? options.to : [options.to];
      sendSmtpEmail.to = recipients.map((email) => ({ email }));

      // Set CC recipients if provided
      if (options.cc) {
        const ccRecipients = Array.isArray(options.cc)
          ? options.cc
          : [options.cc];
        sendSmtpEmail.cc = ccRecipients.map((email) => ({ email }));
      }

      // Set BCC recipients if provided
      if (options.bcc) {
        const bccRecipients = Array.isArray(options.bcc)
          ? options.bcc
          : [options.bcc];
        sendSmtpEmail.bcc = bccRecipients.map((email) => ({ email }));
      }

      // Set subject and content
      sendSmtpEmail.subject = options.subject;
      sendSmtpEmail.htmlContent = options.html;

      if (options.text) {
        sendSmtpEmail.textContent = options.text;
      }

      // Set attachments if provided
      if (options.attachments && options.attachments.length > 0) {
        sendSmtpEmail.attachment = options.attachments.map((attachment) => ({
          content: attachment.content || attachment.buffer?.toString('base64'),
          name: attachment.filename || attachment.name,
        }));
      }

      logger.info('Sending custom email via Brevo', {
        context: 'BrevoProvider.sendEmail',
        to: options.to,
        subject: options.subject,
        hasAttachments: !!(
          options.attachments && options.attachments.length > 0
        ),
      });

      // Send the email
      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);

      logger.info('Custom email sent successfully via Brevo', {
        context: 'BrevoProvider.sendEmail',
        to: options.to,
        subject: options.subject,
        messageId: result.body?.messageId,
      });
    } catch (error) {
      logger.error('Failed to send custom email via Brevo', {
        context: 'BrevoProvider.sendEmail',
        error: error instanceof Error ? error.message : 'Unknown error',
        to: options.to,
        subject: options.subject,
      });
      throw error;
    }
  }

  async sendJobInviteEmail(
    to: string,
    name: string,
    companyName: string,
    inviterName: string,
    jobTitle: string,
    inviteUrl: string,
    expiryHours: number
  ): Promise<void> {
    const templateId = parseInt(ENV.BREVO_JOB_INVITATION_TEMPLATE_ID || '0');

    await this.sendTemplatedEmail({
      to,
      templateId,
      templateParams: {
        name,
        companyName,
        inviterName,
        jobTitle,
        invitationUrl: inviteUrl,
        expiryHours: expiryHours.toString(),
      },
      logContext: 'BrevoProvider.sendJobInviteEmail',
    });
  }

  async sendJobAIAssessmentInterviewLinkEmail(
    to: string,
    candidateName: string,
    companyName: string,
    jobTitle: string,
    invitationUrl: string,
    expiryHours: number
  ): Promise<void> {
    const { subject, html, text } =
      new JobAIAssessmentInterviewLinkEmailTemplate({
        candidateName,
        companyName,
        jobTitle,
        invitationUrl,
        expiryHours,
      }).render();

    await this.sendEmail({
      to,
      subject,
      html,
      text,
    });
  }

  async sendMcpInterviewAssessmentInviteEmail(
    to: string,
    candidateName: string,
    companyName: string,
    jobTitle: string,
    invitationUrl: string,
    expiryHours: number
  ): Promise<void> {
    const { subject, html, text } =
      new McpInterviewAssessmentInviteEmailTemplate({
        candidateName,
        companyName,
        jobTitle,
        invitationUrl,
        expiryHours,
      }).render();

    await this.sendEmail({
      to,
      subject,
      html,
      text,
    });
  }

  async sendSupportUserInvitationEmail(
    to: string,
    name: string,
    inviterName: string,
    _invitationUrl: string,
    role: string,
    expiryHours: number,
    department?: string,
    supportLevel?: string,
    userType?: string,
    userRole?: string
  ): Promise<void> {
    logger.warn(
      'sendSupportUserInvitationEmail is not implemented for BrevoProvider',
      {
        context: 'BrevoProvider.sendSupportUserInvitationEmail',
        to,
        name,
        inviterName,
        role,
        department,
        supportLevel,
        expiryHours,
        userType,
        userRole,
      }
    );
    throw new Error(
      'sendSupportUserInvitationEmail is not implemented for BrevoProvider'
    );
  }

  async sendSupportUserInvitationWithdrawnEmail(
    to: string,
    name: string,
    inviterName: string
  ): Promise<void> {
    logger.warn(
      'sendSupportUserInvitationWithdrawnEmail is not implemented for BrevoProvider',
      {
        context: 'BrevoProvider.sendSupportUserInvitationWithdrawnEmail',
        to,
        name,
        inviterName,
      }
    );
    throw new Error(
      'sendSupportUserInvitationWithdrawnEmail is not implemented for BrevoProvider'
    );
  }

  async sendSupportInvitationAcceptedEmail(
    to: string,
    inviterName: string,
    acceptedByName: string
  ): Promise<void> {
    logger.warn(
      'sendSupportInvitationAcceptedEmail is not implemented for BrevoProvider',
      {
        context: 'BrevoProvider.sendSupportInvitationAcceptedEmail',
        to,
        inviterName,
        acceptedByName,
      }
    );
    throw new Error(
      'sendSupportInvitationAcceptedEmail is not implemented for BrevoProvider'
    );
  }

  async sendSupportCandidateInvitationEmail(
    to: string,
    name: string,
    inviterName: string,
    _invitationUrl: string,
    expiryHours: number,
    jobTitle?: string,
    userType?: string,
    userRole?: string
  ): Promise<void> {
    logger.warn(
      'sendSupportCandidateInvitationEmail is not implemented for BrevoProvider',
      {
        context: 'BrevoProvider.sendSupportCandidateInvitationEmail',
        to,
        name,
        inviterName,
        jobTitle,
        expiryHours,
        userType,
        userRole,
      }
    );
    throw new Error(
      'sendSupportCandidateInvitationEmail is not implemented for BrevoProvider'
    );
  }

  async sendCampaignInvitationEmail(
    to: string,
    name: string,
    invitationUrl: string
  ): Promise<void> {
    logger.warn(
      'sendCampaignInvitationEmail is not implemented for BrevoProvider',
      {
        context: 'BrevoProvider.sendCampaignInvitationEmail',
        to,
        name,

        invitationUrl,
      }
    );
    throw new Error(
      'sendCampaignInvitationEmail is not implemented for BrevoProvider'
    );
  }

  async sendSupportCandidateInvitationWithdrawnEmail(
    to: string,
    name: string,
    inviterName: string
  ): Promise<void> {
    logger.warn(
      'sendSupportCandidateInvitationWithdrawnEmail is not implemented for BrevoProvider',
      {
        context: 'BrevoProvider.sendSupportCandidateInvitationWithdrawnEmail',
        to,
        name,
        inviterName,
      }
    );
    throw new Error(
      'sendSupportCandidateInvitationWithdrawnEmail is not implemented for BrevoProvider'
    );
  }

  async sendSupportCandidateInvitationAcceptedEmail(
    to: string,
    inviterName: string,
    acceptedByName: string
  ): Promise<void> {
    logger.warn(
      'sendSupportCandidateInvitationAcceptedEmail is not implemented for BrevoProvider',
      {
        context: 'BrevoProvider.sendSupportCandidateInvitationAcceptedEmail',
        to,
        inviterName,
        acceptedByName,
      }
    );
    throw new Error(
      'sendSupportCandidateInvitationAcceptedEmail is not implemented for BrevoProvider'
    );
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
    const { HireRequestDeelSetupEmailTemplate } = await import(
      '@/templates/email'
    );

    const template = new HireRequestDeelSetupEmailTemplate({
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
    });

    const { subject, html, text } = template.render();

    await this.sendEmail({
      to,
      subject,
      html,
      text,
    });
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
        context: 'BrevoProvider.sendDocumentRejectionEmail',
        clientName,
        companyName,
        documentName,
      });
      return;
    }

    try {
      const { DocumentRejectionEmailTemplate } = await import(
        '@/templates/email'
      );

      const data = {
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

      logger.info('Document rejection email sent successfully via Brevo', {
        context: 'BrevoProvider.sendDocumentRejectionEmail',
        to,
        clientName,
        companyName,
        documentName,
      });
    } catch (error) {
      logger.error('Failed to send document rejection email via Brevo', {
        context: 'BrevoProvider.sendDocumentRejectionEmail',
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
   * Send daily digest email to client administrators
   */
  async sendDailyDigestEmail(to: string, data: any): Promise<void> {
    if (!this.sendNotifications) {
      logger.info('Notifications disabled, skipping daily digest email', {
        context: 'BrevoProvider.sendDailyDigestEmail',
        to,
      });
      return;
    }

    try {
      const { DailyDigestEmailTemplate } = await import('@/templates/email');

      const { subject, html } = new DailyDigestEmailTemplate(data).render();

      await this.sendEmail({
        to,
        subject,
        html,
      });

      logger.info('Daily digest email sent successfully via Brevo', {
        context: 'BrevoProvider.sendDailyDigestEmail',
        to,
      });
    } catch (error) {
      logger.error('Failed to send daily digest email via Brevo', {
        context: 'BrevoProvider.sendDailyDigestEmail',
        error: error instanceof Error ? error.message : 'Unknown error',
        to,
      });
      throw error;
    }
  }

  /**
   * Send daily stats email to support team
   */
  async sendDailyStatsEmail(to: string, data: any): Promise<void> {
    if (!this.sendNotifications) {
      logger.info('Notifications disabled, skipping daily stats email', {
        context: 'BrevoProvider.sendDailyStatsEmail',
        to,
      });
      return;
    }

    try {
      const { DailyStatsEmailTemplate } = await import('@/templates/email');

      const { subject, html } = new DailyStatsEmailTemplate(data).render();

      await this.sendEmail({
        to,
        subject,
        html,
      });

      logger.info('Daily stats email sent successfully via Brevo', {
        context: 'BrevoProvider.sendDailyStatsEmail',
        to,
      });
    } catch (error) {
      logger.error('Failed to send daily stats email via Brevo', {
        context: 'BrevoProvider.sendDailyStatsEmail',
        error: error instanceof Error ? error.message : 'Unknown error',
        to,
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
          context: 'BrevoProvider.sendSupportTicketAssignmentEmail',
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
        'Support ticket assignment email sent successfully via Brevo',
        {
          context: 'BrevoProvider.sendSupportTicketAssignmentEmail',
          to,
          supportUserName,
          ticketId,
          ticketTitle,
          ticketPriority,
        }
      );
    } catch (error) {
      logger.error('Failed to send support ticket assignment email via Brevo', {
        context: 'BrevoProvider.sendSupportTicketAssignmentEmail',
        error: error instanceof Error ? error.message : 'Unknown error',
        to,
        supportUserName,
        ticketId,
        ticketTitle,
      });
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
            'BrevoProvider.sendSupportTicketCommentToAccountManagerEmail',
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
        'Support ticket comment to account manager email sent successfully via Brevo',
        {
          context:
            'BrevoProvider.sendSupportTicketCommentToAccountManagerEmail',
          to,
          accountManagerName,
          ticketId,
          ticketTitle,
          commentAuthorName,
        }
      );
    } catch (error) {
      logger.error(
        'Failed to send support ticket comment to account manager email via Brevo',
        {
          context:
            'BrevoProvider.sendSupportTicketCommentToAccountManagerEmail',
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
          context: 'BrevoProvider.sendSupportTicketCommentToClientEmail',
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
        'Support ticket comment to client email sent successfully via Brevo',
        {
          context: 'BrevoProvider.sendSupportTicketCommentToClientEmail',
          to,
          clientName,
          ticketId,
          ticketTitle,
          commentAuthorName,
        }
      );
    } catch (error) {
      logger.error(
        'Failed to send support ticket comment to client email via Brevo',
        {
          context: 'BrevoProvider.sendSupportTicketCommentToClientEmail',
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
}
