import { NodemailerProvider } from '../src/services/notification/nodemailer.service';
import { logger } from '../src/shared/utils/logger';

const TEST_EMAILS = [
  'dubbalwaryash@gmail.com',
  'yash.dubbalwar@humancloud.co.in',
];

async function testAllEmailTemplates() {
  const provider = new NodemailerProvider();

  logger.info('🚀 Testing all email templates...\n');

  try {
    for (const TEST_EMAIL of TEST_EMAILS) {
      let templateCount = 0;

      // ========================================
      // AUTHENTICATION & ACCOUNT MANAGEMENT
      // ========================================
      logger.info(
        '🔐 Testing Authentication & Account Management Templates...\n'
      );

      // 1. OTP Verification Email
      logger.info('📧 Testing OTP Verification Email...');
      await provider.sendOtpVerificationEmail(TEST_EMAIL, 'John Doe', '324242');
      logger.info('✅ OTP Verification Email sent successfully\n');
      templateCount++;

      // 2. Password Reset Email (using sendPasswordResetEmail only)
      logger.info('📧 Testing Password Reset Email...');
      await provider.sendPasswordResetEmail(
        TEST_EMAIL,
        'John Doe',
        'https://teamcast.ai/reset/token456'
      );
      logger.info('✅ Password Reset Email sent successfully\n');
      templateCount++;

      // 3. Client Signup Email
      logger.info('📧 Testing Client Signup Email...');
      await provider.sendClientSignupEmail(
        TEST_EMAIL,
        'John Doe',
        'https://teamcast.ai/verify/client123'
      );
      logger.info('✅ Client Signup Email sent successfully\n');
      templateCount++;

      // ========================================
      // ACCOUNT MANAGER & CLIENT MANAGEMENT
      // ========================================
      logger.info(
        '‍💼 Testing Account Manager & Client Management Templates...\n'
      );

      // 4. Client Account Manager Assignment Email
      logger.info('📧 Testing Client Account Manager Assignment Email...');
      await provider.sendClientAccountManagerAssignmentEmail(
        TEST_EMAIL,
        'John Doe',
        'TechCorp Inc.',
        'Sarah Johnson',
        'sarah@teamcast.ai',
        'Senior Account Manager',
        '+1-555-0123',
        'https://teamcast.ai/support'
      );
      logger.info(
        '✅ Client Account Manager Assignment Email sent successfully\n'
      );
      templateCount++;

      // 5. Account Manager Client Onboarded Email
      logger.info('📧 Testing Account Manager Client Onboarded Email...');
      await provider.sendAccountManagerClientOnboardedEmail(
        TEST_EMAIL,
        'Sarah Johnson',
        'John Doe',
        'john@techcorp.com',
        'TechCorp Inc.',
        'December 10, 2024',
        'https://teamcast.ai/dashboard',
        'Enterprise',
        '100-500',
        'Technology',
        'CEO',
        'https://teamcast.ai/profile/john-doe',
        'https://teamcast.ai/support'
      );
      logger.info(
        '✅ Account Manager Client Onboarded Email sent successfully\n'
      );
      // templateCount++;

      // ========================================
      // USER INVITATIONS & ACTIVATION
      // ========================================
      logger.info('👥 Testing User Invitations & Activation Templates...\n');

      // 6. Client User Invitation Email
      logger.info('📧 Testing Client User Invitation Email...');
      await provider.sendClientUserInvitationEmail(
        TEST_EMAIL,
        'John Doe',
        'TechCorp Inc.',
        'Sarah Johnson',
        'https://teamcast.ai/invite/client456',
        'Hiring Manager',
        72
      );
      logger.info('✅ Client User Invitation Email sent successfully\n');
      templateCount++;

      // 7. Partner User Invitation Email
      logger.info('📧 Testing Partner User Invitation Email...');
      await provider.sendPartnerUserInvitationEmail(
        TEST_EMAIL,
        'John Doe',
        'Partner Corp',
        'Sarah Johnson',
        'https://teamcast.ai/invite/partner456',
        'Account Manager',
        72
      );
      logger.info('✅ Partner User Invitation Email sent successfully\n');
      templateCount++;

      // 8. Support User Invitation Email
      logger.info('📧 Testing Support User Invitation Email...');
      await provider.sendSupportUserInvitationEmail(
        TEST_EMAIL,
        'John Doe',
        'Admin User',
        'https://teamcast.ai/invite/support456',
        'Support Specialist',
        72
      );
      logger.info('✅ Support User Invitation Email sent successfully\n');
      templateCount++;

      // 9. Support Candidate Invitation Email
      logger.info('📧 Testing Support Candidate Invitation Email...');
      await provider.sendSupportCandidateInvitationEmail(
        TEST_EMAIL,
        'John Doe',
        'Admin User',
        'https://teamcast.ai/invite/candidate456',
        72,
        'Senior Software Engineer'
      );
      logger.info('✅ Support Candidate Invitation Email sent successfully\n');
      templateCount++;

      // ========================================
      // USER ACTIVATION & DEACTIVATION
      // ========================================
      logger.info('✅ Testing User Activation & Deactivation Templates...\n');

      // 10. Client User Activated Email
      logger.info('📧 Testing Client User Activated Email...');
      await provider.sendClientUserActivatedEmail(
        TEST_EMAIL,
        'John Doe',
        'TechCorp Inc.',
        'Sarah Johnson',
        'https://teamcast.ai/dashboard'
      );
      logger.info('✅ Client User Activated Email sent successfully\n');
      templateCount++;

      // 11. Partner User Activated Email
      logger.info('📧 Testing Partner User Activated Email...');
      await provider.sendPartnerUserActivatedEmail(
        TEST_EMAIL,
        'John Doe',
        'Partner Corp',
        'Sarah Johnson',
        'https://teamcast.ai/dashboard'
      );
      logger.info('✅ Partner User Activated Email sent successfully\n');
      templateCount++;

      // 12. Support User Activated Email
      logger.info('📧 Testing Support User Activated Email...');
      await provider.sendSupportUserActivatedEmail(
        TEST_EMAIL,
        'John Doe',
        'Admin User',
        'https://teamcast.ai/dashboard'
      );
      logger.info('✅ Support User Activated Email sent successfully\n');
      templateCount++;

      // 13. Client User Deactivated Email
      logger.info('📧 Testing Client User Deactivated Email...');
      await provider.sendClientUserDeactivatedEmail(
        TEST_EMAIL,
        'John Doe',
        'TechCorp Inc.',
        'Sarah Johnson',
        'https://teamcast.ai/contact'
      );
      logger.info('✅ Client User Deactivated Email sent successfully\n');
      templateCount++;

      // 14. Partner User Deactivated Email
      logger.info('📧 Testing Partner User Deactivated Email...');
      await provider.sendPartnerUserDeactivatedEmail(
        TEST_EMAIL,
        'John Doe',
        'Partner Corp',
        'Sarah Johnson',
        'https://teamcast.ai/contact'
      );
      logger.info('✅ Partner User Deactivated Email sent successfully\n');
      templateCount++;

      // 15. Support User Deactivated Email
      logger.info('📧 Testing Support User Deactivated Email...');
      await provider.sendSupportUserDeactivatedEmail(
        TEST_EMAIL,
        'John Doe',
        'Admin User',
        'https://teamcast.ai/contact'
      );
      logger.info('✅ Support User Deactivated Email sent successfully\n');
      templateCount++;

      // ========================================
      // INVITATION WITHDRAWAL
      // ========================================
      logger.info(' Testing Invitation Withdrawal Templates...\n');

      // 16. Client User Invitation Withdrawn Email
      logger.info('📧 Testing Client User Invitation Withdrawn Email...');
      await provider.sendClientUserInvitationWithdrawnEmail(
        TEST_EMAIL,
        'John Doe',
        'TechCorp Inc.',
        'Sarah Johnson'
      );
      logger.info(
        '✅ Client User Invitation Withdrawn Email sent successfully\n'
      );
      templateCount++;

      // 17. Support User Invitation Withdrawn Email
      logger.info('📧 Testing Support User Invitation Withdrawn Email...');
      await provider.sendSupportUserInvitationWithdrawnEmail(
        TEST_EMAIL,
        'John Doe',
        'Admin User'
      );
      logger.info(
        '✅ Support User Invitation Withdrawn Email sent successfully\n'
      );
      templateCount++;

      // 18. Support Candidate Invitation Withdrawn Email
      logger.info('📧 Testing Support Candidate Invitation Withdrawn Email...');
      await provider.sendSupportCandidateInvitationWithdrawnEmail(
        TEST_EMAIL,
        'John Doe',
        'Admin User'
      );
      logger.info(
        '✅ Support Candidate Invitation Withdrawn Email sent successfully\n'
      );
      templateCount++;

      // ========================================
      // USER PASSWORD EMAILS
      // ========================================
      logger.info('🔑 Testing User Password Templates...\n');

      // 19. Partner User Password Email
      logger.info('📧 Testing Partner User Password Email...');
      await provider.sendPartnerUserPasswordEmail(
        TEST_EMAIL,
        'John Doe',
        'Partner Corp',
        'TempPassword123!',
        'https://teamcast.ai/login'
      );
      logger.info('✅ Partner User Password Email sent successfully\n');
      templateCount++;

      // 20. Client User Password Email
      logger.info('📧 Testing Client User Password Email...');
      await provider.sendClientUserPasswordEmail(
        TEST_EMAIL,
        'John Doe',
        'TechCorp Inc.',
        'TempPassword123!',
        'https://teamcast.ai/login'
      );
      logger.info('✅ Client User Password Email sent successfully\n');
      templateCount++;

      // 21. Support User Password Email
      logger.info('📧 Testing Support User Password Email...');
      await provider.sendSupportUserPasswordEmail(
        TEST_EMAIL,
        'John Doe',
        'TempPassword123!',
        'https://teamcast.ai/login'
      );
      logger.info('✅ Support User Password Email sent successfully\n');
      templateCount++;

      // 22. Support Partner User Password Email
      logger.info('📧 Testing Support Partner User Password Email...');
      await provider.sendSupportPartnerUserPasswordEmail(
        TEST_EMAIL,
        'John Doe',
        'Partner Corp',
        'TempPassword123!',
        'https://teamcast.ai/login'
      );
      logger.info('✅ Support Partner User Password Email sent successfully\n');
      templateCount++;

      // 23. Support Candidate User Password Email
      logger.info('📧 Testing Support Candidate User Password Email...');
      await provider.sendSupportCandidateUserPasswordEmail(
        TEST_EMAIL,
        'John Doe',
        'TempPassword123!',
        'https://teamcast.ai/login'
      );
      logger.info(
        '✅ Support Candidate User Password Email sent successfully\n'
      );
      templateCount++;

      // 24. Support Client User Password Email
      logger.info('📧 Testing Support Client User Password Email...');
      await provider.sendSupportClientUserPasswordEmail(
        TEST_EMAIL,
        'John Doe',
        'TechCorp Inc.',
        'TempPassword123!',
        'https://teamcast.ai/login'
      );
      logger.info('✅ Support Client User Password Email sent successfully\n');
      templateCount++;

      // ========================================
      // INVITATION ACCEPTANCE
      // ========================================
      logger.info(' Testing Invitation Acceptance Templates...\n');

      // 25. Partner Invitation Accepted Email
      logger.info('📧 Testing Partner Invitation Accepted Email...');
      await provider.sendPartnerInvitationAcceptedEmail(
        TEST_EMAIL,
        'Sarah Johnson',
        'John Doe',
        'Partner Corp',
        'Account Manager'
      );
      logger.info('✅ Partner Invitation Accepted Email sent successfully\n');
      templateCount++;

      // 26. Client Invitation Accepted Email
      logger.info(' Testing Client Invitation Accepted Email...');
      await provider.sendClientInvitationAcceptedEmail(
        TEST_EMAIL,
        'Sarah Johnson',
        'John Doe',
        'TechCorp Inc.',
        'Hiring Manager'
      );
      logger.info('✅ Client Invitation Accepted Email sent successfully\n');
      templateCount++;

      // 27. Support Invitation Accepted Email
      logger.info('📧 Testing Support Invitation Accepted Email...');
      await provider.sendSupportInvitationAcceptedEmail(
        TEST_EMAIL,
        'Admin User',
        'John Doe'
      );
      logger.info('✅ Support Invitation Accepted Email sent successfully\n');
      templateCount++;

      // 28. Support Candidate Invitation Accepted Email
      logger.info('📧 Testing Support Candidate Invitation Accepted Email...');
      await provider.sendSupportCandidateInvitationAcceptedEmail(
        TEST_EMAIL,
        'Admin User',
        'John Doe'
      );
      logger.info(
        '✅ Support Candidate Invitation Accepted Email sent successfully\n'
      );
      templateCount++;

      // ========================================
      // APPLICATION STATUS EMAILS
      // ========================================
      logger.info('📋 Testing Application Status Templates...\n');

      // 29. Application Accepted Email
      logger.info('📧 Testing Application Accepted Email...');
      await provider.sendApplicationAcceptedEmail({
        to: TEST_EMAIL,
        jobTitle: 'Senior Software Engineer',
        companyName: 'TechCorp Inc.',
        notes: 'Congratulations! Your application has been accepted.',
        aiAssessmentLink: 'https://teamcast.ai/assessment/ai-001',
      });
      logger.info('✅ Application Accepted Email sent successfully\n');
      templateCount++;

      // 30. Application Rejected Email
      logger.info('📧 Testing Application Rejected Email...');
      await provider.sendApplicationRejectedEmail({
        to: TEST_EMAIL,
        jobTitle: 'Senior Software Engineer',
        companyName: 'TechCorp Inc.',
        notes:
          "Thank you for your interest. We've decided to move forward with other candidates.",
      });
      logger.info('✅ Application Rejected Email sent successfully\n');
      templateCount++;

      // 31. Application Shortlisted Email
      logger.info('📧 Testing Application Shortlisted Email...');
      await provider.sendApplicationShortlistedEmail({
        to: TEST_EMAIL,
        jobTitle: 'Senior Software Engineer',
        companyName: 'TechCorp Inc.',
        notes: 'Your application has been shortlisted for the next round.',
      });
      logger.info('✅ Application Shortlisted Email sent successfully\n');
      templateCount++;

      // 32. Application Withdrawn Email
      logger.info('📧 Testing Application Withdrawn Email...');
      await provider.sendApplicationWithdrawnEmail({
        to: TEST_EMAIL,
        jobTitle: 'Senior Software Engineer',
        companyName: 'TechCorp Inc.',
        notes: 'Your application has been withdrawn as requested.',
      });
      logger.info('✅ Application Withdrawn Email sent successfully\n');
      templateCount++;

      // 33. Job Application Submitted Email
      logger.info('📧 Testing Job Application Submitted Email...');
      await provider.sendJobApplicationSubmittedEmail({
        to: TEST_EMAIL,
        jobTitle: 'Senior Software Engineer',
        companyName: 'TechCorp Inc.',
        notes: 'Your application has been successfully submitted.',
      });
      logger.info('✅ Job Application Submitted Email sent successfully\n');
      templateCount++;

      // 34. New Job Application Email
      logger.info('📧 Testing New Job Application Email...');
      await provider.sendNewJobApplicationEmail({
        to: TEST_EMAIL,
        candidateName: 'John Doe',
        jobTitle: 'Senior Software Engineer',
        companyName: 'TechCorp Inc.',
      });
      logger.info('✅ New Job Application Email sent successfully\n');
      templateCount++;

      // ========================================
      // CANDIDATE NOTIFICATION EMAILS
      // ========================================
      logger.info('👤 Testing Candidate Notification Templates...\n');

      // 35. Candidate Accepted Application Email
      logger.info('📧 Testing Candidate Accepted Application Email...');
      await provider.sendCandidateAcceptedApplicationEmail({
        to: TEST_EMAIL,
        candidateName: 'John Doe',
        jobTitle: 'Senior Software Engineer',
        notes: 'The candidate has accepted the job offer.',
      });
      logger.info(
        '✅ Candidate Accepted Application Email sent successfully\n'
      );
      templateCount++;

      // 36. Candidate Rejected Application Email
      logger.info('📧 Testing Candidate Rejected Application Email...');
      await provider.sendCandidateRejectedApplicationEmail({
        to: TEST_EMAIL,
        candidateName: 'John Doe',
        jobTitle: 'Senior Software Engineer',
        notes: 'The candidate was not selected for this position.',
      });
      logger.info(
        '✅ Candidate Rejected Application Email sent successfully\n'
      );
      templateCount++;

      // 37. Candidate Withdrew Application Email
      logger.info('📧 Testing Candidate Withdrew Application Email...');
      await provider.sendCandidateWithdrewApplicationEmail({
        to: TEST_EMAIL,
        candidateName: 'John Doe',
        jobTitle: 'Senior Software Engineer',
        notes: 'The candidate has withdrawn their application.',
      });
      logger.info(
        '✅ Candidate Withdrew Application Email sent successfully\n'
      );
      templateCount++;

      // 38. Candidate Shortlisted Email
      logger.info('📧 Testing Candidate Shortlisted Email...');
      await provider.sendCandidateShortlistedEmail({
        to: TEST_EMAIL,
        candidateName: 'John Doe',
        companyName: 'TechCorp Inc.',
        clientUserName: 'Sarah Johnson',
        jobTitle: 'Senior Software Engineer',
        notes: 'This candidate has been shortlisted for the position.',
      });
      logger.info('✅ Candidate Shortlisted Email sent successfully\n');
      templateCount++;

      // ========================================
      // JOB & ASSESSMENT EMAILS
      // ========================================
      logger.info('💼 Testing Job & Assessment Templates...\n');

      // 39. Job Invite Email
      logger.info(' Testing Job Invite Email...');
      await provider.sendJobInviteEmail(
        TEST_EMAIL,
        'John Doe',
        'TechCorp Inc.',
        'Sarah Johnson',
        'Senior Software Engineer',
        'https://teamcast.ai/jobs/invite-789',
        72
      );
      logger.info('✅ Job Invite Email sent successfully\n');
      templateCount++;

      // 40. Job AI Assessment Invite Email
      logger.info('📧 Testing Job AI Assessment Invite Email...');
      await provider.sendJobAIAssessmentInviteEmail(TEST_EMAIL, {
        name: 'John Doe',
        jobTitle: 'Senior Software Engineer',
        companyName: 'TechCorp Inc.',
        assessmentUrl: 'https://teamcast.ai/assessment/ai-001',
        duration: '60 minutes',
        expiryHours: 48,
        assessmentType: 'Technical Skills Assessment',
        skills: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
      });
      logger.info('✅ Job AI Assessment Invite Email sent successfully\n');
      templateCount++;

      // 41. Job AI Assessment Interview Link Email
      logger.info('📧 Testing Job AI Assessment Interview Link Email...');
      await provider.sendJobAIAssessmentInterviewLinkEmail(
        TEST_EMAIL,
        'John Doe',
        'TechCorp Inc.',
        'Senior Software Engineer',
        'https://teamcast.ai/assessment/interview-001',
        48
      );
      logger.info(
        '✅ Job AI Assessment Interview Link Email sent successfully\n'
      );
      templateCount++;

      // 42. Job Recommendation Email
      logger.info('📧 Testing Job Recommendation Email...');
      await provider.sendJobRecommendationEmail(TEST_EMAIL, {
        name: 'John Doe',
        jobTitle: 'Senior Software Engineer',
        companyName: 'TechCorp Inc.',
        jobUrl: 'https://teamcast.ai/jobs/job-001',
        matchScore: 95,
        location: 'San Francisco, CA',
        salary: '$120,000 - $150,000',
      });
      logger.info('✅ Job Recommendation Email sent successfully\n');
      templateCount++;

      // 43. Client Job Invite Email
      logger.info(' Testing Client Job Invite Email...');
      await provider.sendClientJobInviteEmail(TEST_EMAIL, {
        candidateName: 'John Doe',
        companyName: 'TechCorp Inc.',
        inviterName: 'Sarah Johnson',
        jobTitle: 'Senior Software Engineer',
        invitationUrl: 'https://teamcast.ai/jobs/invite-789',
        expiryHours: 72,
      });
      logger.info('✅ Client Job Invite Email sent successfully\n');
      templateCount++;

      // 44. Candidate Job Applied Email
      logger.info('📧 Testing Candidate Job Applied Email...');
      await provider.sendCandidateJobAppliedEmail(TEST_EMAIL, {
        candidateName: 'John Doe',
        jobTitle: 'Senior Software Engineer',
        companyName: 'TechCorp Inc.',
        applicationUrl: 'https://teamcast.ai/applications/app-001',
      });
      logger.info('✅ Candidate Job Applied Email sent successfully\n');
      templateCount++;

      // 45. Candidate Application Status Email
      logger.info('📧 Testing Candidate Application Status Email...');
      await provider.sendCandidateApplicationStatusEmail(TEST_EMAIL, {
        candidateName: 'John Doe',
        jobTitle: 'Senior Software Engineer',
        companyName: 'TechCorp Inc.',
        status: 'accepted',
        notes: 'Your application has been accepted for the next round.',
        applicationUrl: 'https://teamcast.ai/applications/app-001',
      });
      logger.info('✅ Candidate Application Status Email sent successfully\n');
      templateCount++;

      // 46. Job Application Withdraw Email
      logger.info('📧 Testing Job Application Withdraw Email...');
      await provider.sendJobApplicationWithdrawEmail(TEST_EMAIL, {
        candidateName: 'John Doe',
        jobTitle: 'Senior Software Engineer',
        companyName: 'TechCorp Inc.',
        withdrawReason: 'Found another opportunity',
        applicationUrl: 'https://teamcast.ai/applications/app-001',
      });
      logger.info('✅ Job Application Withdraw Email sent successfully\n');
      templateCount++;

      // ========================================
      // PANEL ASSESSMENT EMAILS
      // ========================================
      logger.info('👥 Testing Panel Assessment Templates...\n');

      // 47. Panel Assessment Slot Selection Email
      logger.info('📧 Testing Panel Assessment Slot Selection Email...');
      await provider.sendPanelAssessmentSlotSelectionEmail(
        TEST_EMAIL,
        'John Doe',
        'Senior Software Engineer',
        'TechCorp Inc.',
        [
          {
            date: 'December 15, 2024',
            localStartTime: '2:00 PM',
            localEndTime: '2:45 PM',
            duration: '45 minutes',
          },
        ],
        'https://teamcast.ai/assessment/slot-001',
        'Technical Interview',
        48,
        'America/New_York'
      );
      logger.info(
        '✅ Panel Assessment Slot Selection Email sent successfully\n'
      );
      templateCount++;

      // // 48. Panel Assessment Slot Email
      logger.info('📧 Testing Panel Assessment Slot Email...');
      await provider.sendPanelAssessmentSlotEmail(TEST_EMAIL, {
        name: 'John Doe',
        candidateName: 'John Doe',
        jobTitle: 'Senior Software Engineer',
        companyName: 'TechCorp Inc.',
        availableSlots: [
          {
            date: 'December 15, 2024',
            localStartTime: '2:00 PM',
            localEndTime: '2:45 PM',
            duration: '45 minutes',
          },
        ],
        selectSlotUrl: 'https://teamcast.ai/assessment/slot-001',
        assessmentType: 'Technical Interview',
        timezone: 'America/New_York',
      });
      logger.info('✅ Panel Assessment Slot Email sent successfully\n');
      templateCount++;

      // 49. Panel Assessment Slots Confirmation Email (using the actual implementation)
      logger.info('📧 Testing Panel Assessment Slots Confirmation Email...');
      await provider.sendPanelAssessmentSlotsConfirmationEmail(
        TEST_EMAIL,
        'Sarah Johnson',
        'John Doe',
        'Senior Software Engineer',
        'TechCorp Inc.',
        {
          date: 'December 15, 2024',
          localStartTime: '2:00 PM',
          localEndTime: '2:45 PM',
          duration: '45 minutes',
        },
        'Technical Interview'
      );
      logger.info(
        '✅ Panel Assessment Slots Confirmation Email sent successfully\n'
      );
      templateCount++;

      // 50. Panel Assessment Feedback Request Email
      logger.info('📧 Testing Panel Assessment Feedback Request Email...');
      await provider.sendPanelAssessmentFeedbackRequestEmail(
        TEST_EMAIL,
        'Sarah Johnson',
        'John Doe',
        'Senior Software Engineer',
        'TechCorp Inc.',
        'https://teamcast.ai/feedback/panel-001',
        false,
        48
      );
      logger.info(
        '✅ Panel Assessment Feedback Request Email sent successfully\n'
      );
      templateCount++;

      // 51. Panel Assessment Feedback Reminder Email
      logger.info('📧 Testing Panel Assessment Feedback Reminder Email...');
      await provider.sendPanelAssessmentFeedbackReminderEmail(
        TEST_EMAIL,
        'Sarah Johnson',
        'John Doe',
        'Senior Software Engineer',
        'TechCorp Inc.',
        'https://teamcast.ai/feedback/panel-001',
        24
      );
      logger.info(
        '✅ Panel Assessment Feedback Reminder Email sent successfully\n'
      );
      templateCount++;

      // 52. Panel Interview Link Email (fixed parameters)
      logger.info('📧 Testing Panel Interview Link Email...');
      await provider.sendPanelInterviewLinkEmail(
        TEST_EMAIL,
        'John Doe',
        'John Doe',
        'Senior Software Engineer',
        'TechCorp Inc.',
        'December 15, 2024',
        '2:00 PM',
        '45 minutes',
        'America/New_York',
        'https://meet.google.com/abc-defg-hij',
        'event-123',
        ['Sarah Johnson', 'Mike Smith'],
        'Please join 5 minutes early and ensure your camera is working.',
        true
      );
      logger.info('✅ Panel Interview Link Email sent successfully\n');
      templateCount++;

      // ========================================
      // USER SIGNUP & WELCOME EMAILS
      // ========================================
      logger.info('🎉 Testing User Signup & Welcome Templates...\n');

      // 53. User Signup Invite Email
      logger.info('📧 Testing User Signup Invite Email...');
      await provider.sendUserSignupInviteEmail(TEST_EMAIL, {
        name: 'John Doe',
        companyName: 'TechCorp Inc.',
        inviterName: 'Sarah Johnson',
        invitationUrl: 'https://teamcast.ai/signup/invite-001',
        expiryHours: 72,
        userType: 'candidate',
      });
      logger.info('✅ User Signup Invite Email sent successfully\n');
      templateCount++;

      // 54. User Signup Accepted Email
      logger.info('📧 Testing User Signup Accepted Email...');
      await provider.sendUserSignupAcceptedEmail(TEST_EMAIL, {
        name: 'John Doe',
        companyName: 'TechCorp Inc.',
        acceptedByName: 'Sarah Johnson',
        acceptedDate: 'December 10, 2024',
        userType: 'candidate',
      });
      logger.info('✅ User Signup Accepted Email sent successfully\n');
      templateCount++;

      // 55. User Welcome Email
      logger.info('📧 Testing User Welcome Email...');
      await provider.sendUserWelcomeEmail(TEST_EMAIL, {
        name: 'John Doe',
        userType: 'candidate',
        dashboardUrl: 'https://teamcast.ai/dashboard',
        profileUrl: 'https://teamcast.ai/profile',
        helpUrl: 'https://teamcast.ai/help',
      });
      logger.info('✅ User Welcome Email sent successfully\n');
      templateCount++;

      // ========================================
      // RECOMMENDATION & DIGEST EMAILS
      // ========================================
      logger.info('📊 Testing Recommendation & Digest Templates...\n');

      // 56. Recommended Candidates Email
      logger.info('📧 Testing Recommended Candidates Email...');
      await provider.sendRecommendedCandidatesEmail(TEST_EMAIL, {
        name: 'Sarah Johnson',
        jobTitle: 'Senior Software Engineer',
        companyName: 'TechCorp Inc.',
        candidates: [
          {
            id: 'candidate-001',
            name: 'John Doe',
            title: 'Senior Software Engineer',
            experience: '5+ years',
            skills: ['JavaScript', 'React', 'Node.js'],
            matchScore: 95,
            location: 'San Francisco, CA',
            profileUrl: 'https://teamcast.ai/candidates/candidate-001',
          },
        ],
        totalCandidates: 8,
        dashboardUrl: 'https://teamcast.ai/dashboard/candidates',
      });
      logger.info('✅ Recommended Candidates Email sent successfully\n');
      templateCount++;

      // 57. Daily Digest Email
      logger.info('📧 Testing Daily Digest Email...');
      await provider.sendDailyDigestEmail(TEST_EMAIL, {
        name: 'Sarah Johnson',
        companyName: 'TechCorp Inc.',
        date: 'December 10, 2024',
        summary: {
          newApplications: 12,
          assessmentsCompleted: 8,
          interviewsScheduled: 5,
          offersSent: 2,
        },
        topJobs: [
          {
            title: 'Senior Software Engineer',
            applications: 25,
            status: 'Active',
          },
          {
            title: 'Product Manager',
            applications: 18,
            status: 'Active',
          },
          {
            title: 'UX Designer',
            applications: 15,
            status: 'Active',
          },
        ],
        recentActivity: [
          {
            type: 'Application Received',
            description: 'John Doe applied for Senior Software Engineer',
            time: '2 hours ago',
          },
          {
            type: 'Assessment Completed',
            description: 'Jane Smith completed AI assessment',
            time: '4 hours ago',
          },
          {
            type: 'Interview Scheduled',
            description: 'Mike Johnson interview scheduled for tomorrow',
            time: '6 hours ago',
          },
        ],
        insights: [
          {
            metric: 'Application Rate',
            value: '15% increase',
            change: '+15%',
            trend: 'up',
          },
          {
            metric: 'Time to Hire',
            value: '12 days',
            change: '-3 days',
            trend: 'up',
          },
          {
            metric: 'Quality Score',
            value: '8.5/10',
            change: '+0.3',
            trend: 'up',
          },
        ],
        dashboardUrl: 'https://teamcast.ai/dashboard',
      });
      logger.info('✅ Daily Digest Email sent successfully\n');
      templateCount++;

      // ========================================
      // SUBSCRIPTION EMAILS
      // ========================================
      logger.info('💳 Testing Subscription Templates...\n');

      // 58. Client Subscription Upgraded Email
      logger.info('📧 Testing Client Subscription Upgraded Email...');
      await provider.sendClientSubscriptionUpgradedEmail(
        TEST_EMAIL,
        'John Doe',
        'TechCorp Inc.',
        'Enterprise Plan'
      );
      logger.info('✅ Client Subscription Upgraded Email sent successfully\n');
      templateCount++;

      // 59. Client Subscription Downgraded Email
      logger.info('📧 Testing Client Subscription Downgraded Email...');
      await provider.sendClientSubscriptionDowngradedEmail(
        TEST_EMAIL,
        'John Doe',
        'TechCorp Inc.',
        'Basic Plan'
      );
      logger.info(
        '✅ Client Subscription Downgraded Email sent successfully\n'
      );
      templateCount++;

      // ========================================
      // SUPPORT JOB POSTING EMAILS
      // ========================================
      logger.info('🛠️ Testing Support Job Posting Templates...\n');

      // 60. Support Job Posting Invite Email
      logger.info('📧 Testing Support Job Posting Invite Email...');
      await provider.sendSupportJobPostingInviteEmail(
        TEST_EMAIL,
        'John Doe',
        'Admin User',
        'Senior Software Engineer',
        'TechCorp Inc.',
        'https://teamcast.ai/jobs/posting-001',
        72,
        'We are looking for a talented Senior Software Engineer to join our team.',
        ['5+ years experience', 'JavaScript/TypeScript', 'React/Node.js'],
        ['Competitive salary', 'Health insurance', 'Remote work']
      );
      logger.info('✅ Support Job Posting Invite Email sent successfully\n');
      templateCount++;

      // 61. Support Job Posting Invite Withdrawn Email
      logger.info('📧 Testing Support Job Posting Invite Withdrawn Email...');
      await provider.sendSupportJobPostingInviteWithdrawnEmail(
        TEST_EMAIL,
        'John Doe',
        'Admin User',
        'Senior Software Engineer',
        'TechCorp Inc.',
        'Position has been filled'
      );
      logger.info(
        '✅ Support Job Posting Invite Withdrawn Email sent successfully\n'
      );
      templateCount++;

      // ========================================
      // RECRUITER & ACCOUNT MANAGER EMAILS
      // ========================================
      logger.info('👨‍💼 Testing Recruiter & Account Manager Templates...\n');

      // 62. Recruiter Job Assignment Email
      logger.info('📧 Testing Recruiter Job Assignment Email...');
      await provider.sendRecruiterJobAssignmentEmail(
        TEST_EMAIL,
        'John Doe',
        'Senior Software Engineer',
        'We are looking for a talented Senior Software Engineer to join our team.',
        'TechCorp Inc.',
        'Sarah Johnson',
        'Admin User',
        'https://teamcast.ai/jobs/posting-001',
        'https://teamcast.ai/dashboard',
        'admin@teamcast.ai'
      );
      logger.info('✅ Recruiter Job Assignment Email sent successfully\n');
      templateCount++;

      // 63. Account Manager Recruiter Assignment Email
      logger.info('📧 Testing Account Manager Recruiter Assignment Email...');
      await provider.sendAccountManagerRecruiterAssignmentEmail(
        TEST_EMAIL,
        'Sarah Johnson',
        'John Doe',
        'john@recruiter.com',
        'Senior Software Engineer',
        'TechCorp Inc.',
        'Mike Wilson',
        'Admin User',
        'https://teamcast.ai/jobs/posting-001',
        'https://teamcast.ai/dashboard'
      );
      logger.info(
        '✅ Account Manager Recruiter Assignment Email sent successfully\n'
      );
      templateCount++;

      // ========================================
      // HIRE REQUEST & DOCUMENT EMAILS
      // ========================================
      logger.info('📄 Testing Hire Request & Document Templates...\n');

      // 64. Hire Request Email
      logger.info('📧 Testing Hire Request Email...');
      await provider.sendHireRequestEmail(
        TEST_EMAIL,
        'Sarah Johnson',
        'John Doe',
        'TechCorp Inc.',
        'john@techcorp.com',
        'Mike Wilson',
        'mike@candidate.com',
        'Senior Software Engineer',
        'app-001',
        'candidate-001',
        'client-001',
        'December 10, 2024',
        'high',
        95,
        'Excellent',
        'Strongly recommend for hire',
        'Candidate has exceptional technical skills and cultural fit'
      );
      logger.info('✅ Hire Request Email sent successfully\n');
      templateCount++;

      // 65. Document Rejection Email
      logger.info('📧 Testing Document Rejection Email...');
      await provider.sendDocumentRejectionEmail(
        TEST_EMAIL,
        'John Doe',
        'TechCorp Inc.',
        'Company Logo',
        'Image',
        'Logo resolution is too low. Please provide a high-resolution version (minimum 300 DPI).',
        'hello@teamcast.ai',
        'https://teamcast.ai/help',
        'Please upload a new logo file with higher resolution and resubmit.'
      );
      logger.info('✅ Document Rejection Email sent successfully\n');
      templateCount++;

      logger.info('🎉 All email templates tested successfully!');
      logger.info(
        `📧 Check your email at ${TEST_EMAIL} to see all the templates.`
      );
      logger.info(`📊 Total templates tested: ${templateCount}`);
    }
  } catch (error) {
    logger.error('❌ Error testing email templates:', error);
  }
}

// Run the test
testAllEmailTemplates();
