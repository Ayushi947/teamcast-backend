/**
 * Interface for notification services
 * Implementations can include email providers like SMTP, Brevo, SendGrid, etc.
 */
export interface INotificationProvider {
  /**
   * Sends an OTP verification email to the user
   * @param to Email address of the recipient
   * @param name Name of the recipient
   * @param otpCode 6-digit OTP code
   */
  sendOtpVerificationEmail(
    to: string,
    name: string,
    otpCode: string
  ): Promise<void>;

  /**
   * Sends a password reset email to the user
   * @param to Email address of the recipient
   * @param name Name of the recipient
   * @param resetUrl URL for password reset
   * @param userType Optional user type for personalized content
   */
  sendPasswordResetEmail(
    to: string,
    name: string,
    resetUrl: string,
    userType?: string
  ): Promise<void>;

  /**
   * Sends a forgot password email with token to the user
   * @param to Email address of the recipient
   * @param name Name of the recipient
   * @param resetUrl URL for password reset
   * @param userType Optional user type for personalized content
   */
  sendForgotPasswordEmail(
    to: string,
    name: string,
    resetUrl: string,
    userType?: string
  ): Promise<void>;

  /**
   * Sends a client signup email to the user
   */
  sendClientSignupEmail(
    to: string,
    name: string,
    companyName: string,
    verificationUrl: string
  ): Promise<void>;

  /**
   * Sends a client account manager assignment email to the user
   * @param to Email address of the recipient
   * @param name Name of the recipient
   * @param companyName Name of the company
   * @param accountManagerName Name of the assigned account manager
   * @param accountManagerEmail Email of the assigned account manager
   * @param accountManagerJobTitle Optional job title of the account manager
   * @param accountManagerPhone Optional phone number of the account manager
   * @param supportUrl URL to the support page
   */
  sendClientAccountManagerAssignmentEmail(
    to: string,
    name: string,
    companyName: string,
    accountManagerName: string,
    accountManagerEmail: string,
    accountManagerJobTitle?: string,
    accountManagerPhone?: string,
    supportUrl?: string
  ): Promise<void>;

  /**
   * Sends a notification to an account manager when a new client is onboarded
   * @param to Email address of the account manager
   * @param accountManagerName Name of the account manager
   * @param clientName Name of the new client
   * @param clientEmail Email of the new client
   * @param companyName Name of the client company
   * @param onboardingDate Date when the client was onboarded
   * @param dashboardUrl URL to the account manager dashboard
   * @param companyType Optional company type
   * @param companySize Optional company size
   * @param companyIndustry Optional company industry
   * @param clientRole Optional client role
   * @param clientProfileUrl Optional URL to the client profile
   * @param supportUrl URL to the support page
   */
  sendAccountManagerClientOnboardedEmail(
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
  ): Promise<void>;

  /**
   * Sends a partner invitation email to the user
   * @param to Email address of the recipient
   * @param name Name of the recipient
   * @param companyName Name of the partner company
   * @param inviterName Name of the person who sent the invitation
   * @param invitationUrl URL for accepting the invitation
   * @param role Role assigned to the invitee
   * @param expiryHours Number of hours until the invitation expires
   * @param userType Type of user (PARTNER)
   * @param userRole Role of user (ADMIN, PARTNER_RESOURCE)
   */
  sendPartnerUserInvitationEmail(
    to: string,
    name: string,
    companyName: string,
    inviterName: string,
    invitationUrl: string,
    role: string,
    expiryHours: number,
    userType?: string,
    userRole?: string
  ): Promise<void>;

  /**
   * Sends a client invitation email to the user
   * @param to Email address of the recipient
   * @param name Name of the recipient
   * @param companyName Name of the client company
   * @param inviterName Name of the person who sent the invitation
   * @param invitationUrl URL for accepting the invitation
   * @param role Role assigned to the invitee
   * @param expiryHours Number of hours until the invitation expires
   * @param userType Type of user (CLIENT)
   * @param userRole Role of user (ADMIN, HR, RECRUITER, ACCOUNTS)
   */
  sendClientUserInvitationEmail(
    to: string,
    name: string,
    companyName: string,
    inviterName: string,
    invitationUrl: string,
    role: string,
    expiryHours: number,
    userType?: string,
    userRole?: string
  ): Promise<void>;

  /**
   * Sends a job invite email to a candidate
   * @param to Email address of the candidate
   * @param name Name of the candidate
   * @param companyName Name of the company
   * @param inviterName Name of the inviter
   * @param jobTitle Title of the job
   * @param invitationUrl URL for accepting the invite
   * @param expiryHours Number of hours until the invitation expires
   */
  sendJobInviteEmail(
    to: string,
    name: string,
    companyName: string,
    inviterName: string,
    jobTitle: string,
    invitationUrl: string,
    expiryHours: number
  ): Promise<void>;

  /**
   * Sends a notification when a client invitation is withdrawn
   * @param to Email address of the recipient
   * @param name Name of the recipient
   * @param companyName Name of the client company
   * @param inviterName Name of the person who withdrew the invitation
   */
  sendClientUserInvitationWithdrawnEmail(
    to: string,
    name: string,
    companyName: string,
    inviterName: string
  ): Promise<void>;

  /**
   * Sends a notification when a client user is activated
   * @param to Email address of the recipient
   * @param name Name of the recipient
   * @param companyName Name of the client company
   * @param activatedByName Name of the person who activated the user
   * @param dashboardUrl URL to the dashboard
   * @param userRole Optional role of the user for personalized content
   */
  sendClientUserActivatedEmail(
    to: string,
    name: string,
    companyName: string,
    activatedByName: string,
    dashboardUrl: string,
    userRole?: string
  ): Promise<void>;

  /**
   * Sends a notification when a client user is deactivated
   * @param to Email address of the recipient
   * @param name Name of the recipient
   * @param companyName Name of the client company
   * @param deactivatedByName Name of the person who deactivated the user
   * @param contactUrl URL for contacting support
   * @param userRole Optional role of the user for personalized content
   */
  sendClientUserDeactivatedEmail(
    to: string,
    name: string,
    companyName: string,
    deactivatedByName: string,
    contactUrl: string,
    userRole?: string
  ): Promise<void>;

  /**
   * Sends a notification when a partner user is activated
   * @param to Email address of the recipient
   * @param name Name of the recipient
   * @param companyName Name of the partner company
   * @param activatedByName Name of the person who activated the user
   * @param dashboardUrl URL to the dashboard
   * @param userRole Optional role of the user for personalized content
   */
  sendPartnerUserActivatedEmail(
    to: string,
    name: string,
    companyName: string,
    activatedByName: string,
    dashboardUrl: string,
    userRole?: string
  ): Promise<void>;

  /**
   * Sends a notification when a partner user is deactivated
   * @param to Email address of the recipient
   * @param name Name of the recipient
   * @param companyName Name of the partner company
   * @param deactivatedByName Name of the person who deactivated the user
   * @param contactUrl URL for contacting support
   * @param userRole Optional role of the user for personalized content
   */
  sendPartnerUserDeactivatedEmail(
    to: string,
    name: string,
    companyName: string,
    deactivatedByName: string,
    contactUrl: string,
    userRole?: string
  ): Promise<void>;

  /**
   * Sends a notification to candidate when their application is accepted
   * @param to Email address of the candidate
   * @param jobTitle Title of the job
   * @param companyName Name of the company
   * @param notes Optional notes about the acceptance
   * @param aiAssessmentLink Optional link to the AI assessment
   */
  sendApplicationAcceptedEmail(params: {
    to: string;
    jobTitle: string;
    companyName: string;
    notes?: string;
    aiAssessmentLink?: string;
  }): Promise<void>;

  /**
   * Sends a notification to client when candidate accepts their application
   * @param to Email address of the client user
   * @param candidateName Name of the candidate
   * @param jobTitle Title of the job
   * @param notes Optional notes from the candidate
   */
  sendCandidateAcceptedApplicationEmail(params: {
    to: string;
    candidateName: string;
    jobTitle: string;
    notes?: string;
  }): Promise<void>;

  /**
   * Sends a notification to candidate when their application is rejected
   * @param to Email address of the candidate
   * @param jobTitle Title of the job
   * @param companyName Name of the company
   * @param notes Optional notes about the rejection
   */
  sendApplicationRejectedEmail(params: {
    to: string;
    jobTitle: string;
    companyName: string;
    notes?: string;
  }): Promise<void>;

  /**
   * Sends a notification to candidate when their application is shortlisted
   * @param to Email address of the candidate
   * @param jobTitle Title of the job
   * @param companyName Name of the company
   * @param notes Optional notes about being shortlisted
   */
  sendApplicationShortlistedEmail(params: {
    to: string;
    jobTitle: string;
    companyName: string;
    notes?: string;
  }): Promise<void>;

  /**
   * Sends a notification to candidate when they are added to a company's shortlist
   * @param to Email address of the candidate
   * @param candidateName Name of the candidate
   * @param companyName Name of the company
   * @param clientUserName Name of the client user who shortlisted
   * @param jobTitle Optional title of the specific job
   * @param notes Optional notes from the client
   * @param dashboardUrl URL to candidate dashboard
   * @param profileUrl URL to candidate profile
   */
  sendCandidateShortlistedEmail?(params: {
    to: string;
    candidateName: string;
    companyName: string;
    clientUserName: string;
    jobTitle?: string;
    notes?: string;
  }): Promise<void>;

  /**
   * Sends a notification to client when candidate rejects their application
   * @param to Email address of the client user
   * @param candidateName Name of the candidate
   * @param jobTitle Title of the job
   * @param notes Optional notes from the candidate
   */
  sendCandidateRejectedApplicationEmail(params: {
    to: string;
    candidateName: string;
    jobTitle: string;
    notes?: string;
  }): Promise<void>;

  /**
   * Sends a notification to client when candidate declines their invitation/application
   * @param to Email address of the client user
   * @param candidateName Name of the candidate
   * @param jobTitle Title of the job
   * @param notes Optional notes/reason from the candidate
   */
  sendCandidateDeclinedApplicationEmail(params: {
    to: string;
    candidateName: string;
    jobTitle: string;
    notes?: string;
  }): Promise<void>;

  /**
   * Sends a notification to candidate when their application is withdrawn
   * @param to Email address of the candidate
   * @param jobTitle Title of the job
   * @param companyName Name of the company
   * @param notes Optional notes about the withdrawal
   */
  sendApplicationWithdrawnEmail(params: {
    to: string;
    jobTitle: string;
    companyName: string;
    notes?: string;
  }): Promise<void>;

  /**
   * Sends a notification to client when candidate withdraws their application
   * @param to Email address of the client user
   * @param candidateName Name of the candidate
   * @param jobTitle Title of the job
   * @param notes Optional notes from the candidate
   */
  sendCandidateWithdrewApplicationEmail(params: {
    to: string;
    candidateName: string;
    jobTitle: string;
    notes?: string;
  }): Promise<void>;

  /**
   * Sends a notification to candidate when they submit a job application
   */
  sendJobApplicationSubmittedEmail(params: {
    to: string;
    jobTitle: string;
    companyName: string;
    notes?: string;
  }): Promise<void>;

  /**
   * Sends a notification to client when a new job application is received
   */
  sendNewJobApplicationEmail(params: {
    to: string;
    candidateName: string;
    jobTitle: string;
    companyName: string;
  }): Promise<void>;

  /**
   * Sends a notification when a support user is activated
   * @param to Email address of the recipient
   * @param name Name of the recipient
   * @param activatedByName Name of the person who activated the user
   * @param dashboardUrl URL to the dashboard
   * @param userRole Optional role of the user for personalized content
   */
  sendSupportUserActivatedEmail(
    to: string,
    name: string,
    activatedByName: string,
    dashboardUrl: string,
    userRole?: string
  ): Promise<void>;

  /**
   * Sends a notification when a support user is deactivated
   * @param to Email address of the recipient
   * @param name Name of the recipient
   * @param deactivatedByName Name of the person who deactivated the user
   * @param contactUrl URL for contacting support
   * @param userRole Optional role of the user for personalized content
   */
  sendSupportUserDeactivatedEmail(
    to: string,
    name: string,
    deactivatedByName: string,
    contactUrl: string,
    userRole?: string
  ): Promise<void>;

  /**
   * Sends a notification to inviter when their invitation is accepted
   * @param to Email address of the inviter
   * @param inviterName Name of the inviter
   * @param acceptedByName Name of the person who accepted the invitation
   * @param companyName Name of the partner company
   * @param role Role assigned to the accepted user
   */
  sendPartnerInvitationAcceptedEmail(
    to: string,
    inviterName: string,
    acceptedByName: string,
    companyName: string,
    role: string
  ): Promise<void>;

  /**
   * Sends a notification to inviter when their invitation is accepted
   * @param to Email address of the inviter
   * @param inviterName Name of the inviter
   * @param acceptedByName Name of the person who accepted the invitation
   * @param companyName Name of the partner company
   * @param role Role assigned to the accepted user
   */

  sendClientInvitationAcceptedEmail(
    to: string,
    inviterName: string,
    acceptedByName: string,
    companyName: string,
    role: string
  ): Promise<void>;

  /**
   * Sends a feedback request email to panel members after interview completion
   * @param to Email address of the panel member
   * @param panelMemberName Name of the panel member
   * @param candidateName Name of the interviewed candidate
   * @param jobTitle Title of the job position
   * @param companyName Name of the company
   * @param feedbackUrl URL for submitting feedback
   * @param isInternal Whether the panel member is internal (authenticated) or external (token-based)
   * @param expiryHours Number of hours until the feedback request expires
   */
  sendPanelAssessmentFeedbackRequestEmail(
    to: string,
    panelMemberName: string,
    candidateName: string,
    jobTitle: string,
    companyName: string,
    feedbackUrl: string,
    isInternal: boolean,
    expiryHours: number
  ): Promise<void>;

  /**
   * Sends a reminder email to panel members who haven't submitted feedback
   * @param to Email address of the panel member
   * @param panelMemberName Name of the panel member
   * @param candidateName Name of the interviewed candidate
   * @param jobTitle Title of the job position
   * @param companyName Name of the company
   * @param feedbackUrl URL for submitting feedback
   * @param expiryHours Number of hours until the feedback request expires
   */
  sendPanelAssessmentFeedbackReminderEmail(
    to: string,
    panelMemberName: string,
    candidateName: string,
    jobTitle: string,
    companyName: string,
    feedbackUrl: string,
    expiryHours: number
  ): Promise<void>;

  /**
   * Sends a panel assessment slot selection email to the candidate
   * @param to Email address of the candidate
   * @param candidateName Name of the candidate
   * @param jobTitle Title of the job position
   * @param companyName Name of the company
   * @param availableSlots Array of available time slots
   * @param selectSlotUrl URL for selecting a time slot
   * @param assessmentType Type of assessment (e.g., "Panel Interview")
   * @param expiryHours Number of hours until the invitation expires
   */
  sendPanelAssessmentSlotSelectionEmail?(
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
    expiryHours: number,
    timezone: string
  ): Promise<void>;

  /**
   * Sends a panel assessment confirmation email showing the confirmed slot
   * @param to Email address of the panel member/host
   * @param panelMemberName Name of the panel member/host
   * @param candidateName Name of the candidate
   * @param jobTitle Title of the job position
   * @param companyName Name of the company
   * @param confirmedSlot Details of the confirmed slot
   * @param assessmentType Type of assessment (e.g., "Panel Interview")
   */
  sendPanelAssessmentSlotsConfirmationEmail?(
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
  ): Promise<void>;

  /**
   * Sends a panel interview link email to participants with meeting details
   * @param to Email address of the recipient
   * @param recipientName Name of the recipient
   * @param candidateName Name of the candidate
   * @param jobTitle Title of the job position
   * @param companyName Name of the company
   * @param interviewDate Formatted date of the interview
   * @param interviewTime Formatted time of the interview
   * @param duration Duration of the interview
   * @param timezone Timezone of the interview
   * @param meetingLink Link to join the interview
   * @param eventId Optional meeting/event ID
   * @param panelMemberNames Array of panel member names
   * @param additionalInstructions Optional additional instructions
   * @param isCandidate Whether the recipient is the candidate being interviewed (true) or a panel member/host (false)
   */
  sendPanelInterviewLinkEmail?(
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
  ): Promise<void>;

  /**
   * Sends a custom email with dynamic HTML template and fields
   * @param options Email sending options
   */
  sendEmail(options: {
    from: string;
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject: string;
    html: string;
    text?: string;
    attachments?: any[];
  }): Promise<void>;

  /**
   * Sends a job AI assessment interview link email to the candidate
   * @param to Email address of the candidate
   * @param candidateName Name of the candidate
   * @param companyName Name of the client company
   * @param jobTitle The title of the job the candidate applied for
   * @param invitationUrl A unique link where the candidate can start their assessment
   * @param expiryHours Number of hours before the invitation expires
   */
  sendJobAIAssessmentInterviewLinkEmail(
    to: string,
    candidateName: string,
    companyName: string,
    jobTitle: string,
    invitationUrl: string,
    expiryHours: number
  ): Promise<void>;

  /**
   * Sends an MCP interview assessment invite email to the candidate.
   * This is currently identical to the job AI assessment interview link email
   * but uses a separate template file so it can be customized independently.
   */
  sendMcpInterviewAssessmentInviteEmail(
    to: string,
    candidateName: string,
    companyName: string,
    jobTitle: string,
    invitationUrl: string,
    expiryHours: number
  ): Promise<void>;

  /**
   * Sends a support user invitation email
   * @param to Email address of the recipient
   * @param name Name of the recipient
   * @param inviterName Name of the person who sent the invitation
   * @param invitationUrl URL for accepting the invitation
   * @param role Role assigned to the invitee
   * @param expiryHours Number of hours until the invitation expires
   * @param department Department assigned to the invitee
   * @param supportLevel Support level assigned to the invitee
   * @param userType Type of user (SUPPORT)
   * @param userRole Role of user (ACCOUNT_MANAGER, etc.)
   */
  sendSupportUserInvitationEmail(
    to: string,
    name: string,
    inviterName: string,
    invitationUrl: string,
    role: string,
    expiryHours: number,
    department?: string,
    supportLevel?: string,
    userType?: string,
    userRole?: string
  ): Promise<void>;

  /**
   * Sends a notification when a support user invitation is withdrawn
   * @param to Email address of the recipient
   * @param name Name of the recipient
   * @param inviterName Name of the person who withdrew the invitation
   */
  sendSupportUserInvitationWithdrawnEmail(
    to: string,
    name: string,
    inviterName: string
  ): Promise<void>;

  /**
   * Sends a notification when a support invitation is accepted
   * @param to Email address of the inviter
   * @param inviterName Name of the inviter
   * @param acceptedByName Name of the person who accepted the invitation
   */
  sendSupportInvitationAcceptedEmail(
    to: string,
    inviterName: string,
    acceptedByName: string
  ): Promise<void>;

  /**
   * Sends a support candidate invitation email
   * @param to Email address of the recipient
   * @param name Name of the recipient
   * @param inviterName Name of the person who sent the invitation
   * @param invitationUrl URL for accepting the invitation
   * @param expiryHours Number of hours until the invitation expires
   * @param jobTitle Job title for the candidate
   * @param userType Type of user (CANDIDATE or PARTNER)
   * @param userRole Role of user (INDIVIDUAL or PARTNER_RESOURCE)
   */
  sendSupportCandidateInvitationEmail(
    to: string,
    name: string,
    inviterName: string,
    invitationUrl: string,
    expiryHours: number,
    jobTitle?: string,
    userType?: string,
    userRole?: string
  ): Promise<void>;

  /**
   * Sends a campaign invitation email to a candidate
   * @param to Email address of the recipient
   * @param name Name of the recipient
   * @param inviterName Name of the person who sent the invitation
   * @param invitationUrl URL for accepting the invitation
   * @param jobTitle Optional job title
   */
  sendCampaignInvitationEmail(
    to: string,
    name: string,
    inviterName: string,
    invitationUrl: string,
    jobTitle?: string
  ): Promise<void>;

  /**
   * Sends a notification when a support candidate invitation is withdrawn
   * @param to Email address of the recipient
   * @param name Name of the recipient
   * @param inviterName Name of the person who withdrew the invitation
   */
  sendSupportCandidateInvitationWithdrawnEmail(
    to: string,
    name: string,
    inviterName: string
  ): Promise<void>;

  /**
   * Sends a notification when a support candidate invitation is accepted
   * @param to Email address of the inviter
   * @param inviterName Name of the inviter
   * @param acceptedByName Name of the person who accepted the invitation
   */
  sendSupportCandidateInvitationAcceptedEmail(
    to: string,
    inviterName: string,
    acceptedByName: string
  ): Promise<void>;

  /**
   * Sends a support job posting invite email to a candidate
   * @param to Email address of the candidate
   * @param name Name of the candidate
   * @param inviterName Name of the support user who sent the invitation
   * @param jobTitle Title of the job
   * @param companyName Name of the company posting the job
   * @param invitationUrl URL for accepting the invite
   * @param expiryHours Number of hours until the invitation expires
   * @param jobDescription Optional job description
   * @param requirements Optional array of job requirements
   * @param benefits Optional array of job benefits
   */
  sendSupportJobPostingInviteEmail(
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
  ): Promise<void>;

  /**
   * Sends a notification when a support job posting invitation is withdrawn
   * @param to Email address of the recipient
   * @param name Name of the recipient
   * @param inviterName Name of the person who withdrew the invitation
   * @param jobTitle Title of the job
   * @param companyName Name of the company posting the job
   * @param reason Optional reason for the withdrawal
   */
  sendSupportJobPostingInviteWithdrawnEmail(
    to: string,
    name: string,
    inviterName: string,
    jobTitle: string,
    companyName: string,
    reason?: string
  ): Promise<void>;

  /**
   * Sends a notification to a recruiter when they are assigned to a job posting
   * @param to Email address of the recruiter
   * @param recruiterName Name of the recruiter
   * @param jobTitle Title of the job posting
   * @param jobDescription Description of the job posting
   * @param companyName Name of the client company
   * @param clientName Name of the client contact
   * @param assignedByName Name of the person who made the assignment
   * @param jobPostingUrl URL to view the job posting
   * @param dashboardUrl URL to the recruiter dashboard
   * @param ccEmail Optional CC email address (typically account manager)
   */
  sendRecruiterJobAssignmentEmail(
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
  ): Promise<void>;

  /**
   * Sends a notification to an account manager when a recruiter is assigned to their client's job posting
   * @param to Email address of the account manager
   * @param accountManagerName Name of the account manager
   * @param recruiterName Name of the assigned recruiter
   * @param recruiterEmail Email of the assigned recruiter
   * @param jobTitle Title of the job posting
   * @param companyName Name of the client company
   * @param clientName Name of the client contact
   * @param assignedByName Name of the person who made the assignment
   * @param jobPostingUrl URL to view the job posting
   * @param dashboardUrl URL to the account manager dashboard
   */
  sendAccountManagerRecruiterAssignmentEmail(
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
  ): Promise<void>;

  /**
   * Send hire request email to account manager
   * @param to Email address of the account manager
   * @param accountManagerName Name of the account manager
   * @param clientName Name of the client user
   * @param clientCompanyName Name of the client company
   * @param clientEmail Email of the client user
   * @param candidateName Name of the candidate
   * @param candidateEmail Email of the candidate
   * @param jobTitle Title of the job
   * @param applicationId ID of the application
   * @param candidateId ID of the candidate
   * @param clientId ID of the client
   * @param requestDate Date of the hire request
   * @param priority Priority level of the request
   * @param assessmentScore Optional AI assessment score
   * @param assessmentResult Optional AI assessment result
   * @param assessmentRecommendation Optional AI assessment recommendation
   * @param specialNotes Optional special notes
   */
  sendHireRequestEmail(
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
  ): Promise<void>;

  /**
   * Send document rejection email to client
   * @param to Email address of the client
   * @param clientName Name of the client
   * @param companyName Name of the company
   * @param documentName Name of the rejected document
   * @param documentType Type of the document
   * @param rejectionReason Reason for rejection
   * @param supportEmail Optional support email address
   * @param supportUrl Optional support portal URL
   * @param resubmissionInstructions Optional instructions for resubmission
   */
  sendDocumentRejectionEmail(
    to: string,
    clientName: string,
    companyName: string,
    documentName: string,
    documentType: string,
    rejectionReason: string,
    supportEmail?: string,
    supportUrl?: string,
    resubmissionInstructions?: string
  ): Promise<void>;

  /**
   * Send daily digest email to client administrators
   * @param to Email address of the recipient
   * @param data Daily digest data containing job postings and candidate recommendations
   */
  sendDailyDigestEmail(to: string, data: any): Promise<void>;

  /**
   * Send daily stats email to support team
   * @param to Email address of the recipient
   * @param data Daily stats data containing candidate and client statistics
   */
  sendDailyStatsEmail(to: string, data: any): Promise<void>;

  /**
   * Send support ticket assignment email to support user
   * @param to Email address of the support user
   * @param supportUserName Name of the support user
   * @param ticketId ID of the ticket
   * @param ticketTitle Title of the ticket
   * @param ticketDescription Description of the ticket
   * @param ticketPriority Priority level of the ticket
   * @param ticketCategory Category of the ticket
   * @param ticketStatus Current status of the ticket
   * @param assignedByName Name of the person who assigned the ticket
   * @param assignedByEmail Email of the person who assigned the ticket
   * @param ticketUrl URL to view the ticket
   * @param dashboardUrl URL to the support dashboard
   * @param clientName Optional name of the client
   * @param clientCompanyName Optional name of the client company
   * @param dueDate Optional due date for the ticket
   * @param estimatedResolutionTime Optional estimated resolution time
   * @param attachments Optional array of attachment details
   */
  sendSupportTicketAssignmentEmail(
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
  ): Promise<void>;

  /**
   * Send support ticket comment notification email to account manager when client adds comment
   * @param to Email address of the account manager
   * @param accountManagerName Name of the account manager
   * @param ticketId ID of the ticket
   * @param ticketTitle Title of the ticket
   * @param ticketNumber Ticket number for display
   * @param commentContent Content of the comment
   * @param commentAuthorName Name of the comment author (client)
   * @param commentAuthorEmail Email of the comment author (client)
   * @param clientCompanyName Name of the client company
   * @param ticketUrl URL to view the ticket
   * @param ticketPriority Priority level of the ticket
   * @param ticketStatus Current status of the ticket
   */
  sendSupportTicketCommentToAccountManagerEmail(
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
  ): Promise<void>;

  /**
   * Send support ticket comment notification email to client when account manager adds comment
   * @param to Email address of the client
   * @param clientName Name of the client
   * @param ticketId ID of the ticket
   * @param ticketTitle Title of the ticket
   * @param ticketNumber Ticket number for display
   * @param commentContent Content of the comment
   * @param commentAuthorName Name of the comment author (account manager)
   * @param commentAuthorEmail Email of the comment author (account manager)
   * @param ticketUrl URL to view the ticket
   * @param ticketPriority Priority level of the ticket
   * @param ticketStatus Current status of the ticket
   * @param accountManagerJobTitle Optional job title of the account manager
   */
  sendSupportTicketCommentToClientEmail(
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
  ): Promise<void>;
}
