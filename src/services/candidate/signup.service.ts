import { PrismaClient } from '@prisma/client';
import { AppError } from '@/utils/app.error';
import { logger } from '@/shared/utils/logger';
import { ErrorCode } from '@/utils/error.codes';
import { singleton } from '@/shared/decorators/singleton';
import {
  ICandidateSignup,
  ICandidateSignupDone,
} from '@/shared/models/domain/candidate/signup.domain';
import { getAuthToken } from '@/utils/generate.token';
import { toIAuthUser } from '@/shared/models/domain/auth/auth.user.domain';
import { INotificationProvider } from '../notification/notification.interface';
import { CandidateSubscriptionService } from './subscription.service';
import { CandidateProfileSettingsService } from './profile.settings.service';
import { CandidateResumeService } from './resume.service';
import {
  JobSearchStatusEnum,
  JobInviteStatusEnum,
  CandidateImportStatusEnum,
  JobAiAssessmentInviteStatusEnum,
} from '@/shared/models/common/enums';
import { CandidateStatusEnum } from '@/shared/models/common/enums';
import { hashPassword } from '@/utils/password';
import { VerifyService } from '@/services/auth/verify.service';
import { formatEmail, formatName } from '@/shared/utils/formatters';

const prisma = new PrismaClient();

@singleton
export class CandidateSignupService {
  constructor(
    private readonly notificationProvider: INotificationProvider,
    private readonly subscriptionService: CandidateSubscriptionService,
    private readonly candidateProfileSettingsService: CandidateProfileSettingsService,
    private readonly resumeService: CandidateResumeService,
    private readonly verifyService: VerifyService
  ) {}

  /**
   * Registers a new candidate user with optional invite-based signup
   * @param signupData Candidate signup data
   * @param inviteId Optional invite ID for invite-based signup
   * @returns Candidate signup result
   */
  async signup(
    signupData: ICandidateSignup,
    inviteId?: string
  ): Promise<ICandidateSignupDone> {
    const formattedEmail = formatEmail(signupData.email);

    logger.info('Starting candidate signup process', {
      email: formattedEmail,
      inviteId,
      context: 'CandidateSignupService.signup',
    });

    if (inviteId) {
      logger.info('Invite-based signup initiated', {
        email: formattedEmail,
        inviteId,
        context: 'CandidateSignupService.signup',
      });
    } else {
      logger.info('Regular signup initiated', {
        email: formattedEmail,
        context: 'CandidateSignupService.signup',
      });
    }

    // Check if user with this email already exists in our database
    const existingUser = await prisma.user.findUnique({
      where: { email: formattedEmail },
    });

    if (existingUser) {
      logger.warn('User already exists during signup', {
        email: formattedEmail,
        context: 'CandidateSignupService.signup',
      });
      throw new AppError('Email already in use', 409, ErrorCode.ALREADY_EXISTS);
    }

    // If inviteId is provided, validate the invite
    let invite = null;
    if (inviteId) {
      logger.info('Validating invite for signup', {
        inviteId,
        context: 'CandidateSignupService.signup',
      });

      invite = await prisma.job_invite.findUnique({
        where: { id: inviteId },
      });

      if (!invite) {
        logger.warn('Invalid invite ID during signup', {
          inviteId,
          context: 'CandidateSignupService.signup',
        });
        throw new AppError(
          'Invalid invitation link',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      if (invite.email !== formattedEmail) {
        logger.warn('Email mismatch during invite-based signup', {
          inviteEmail: invite.email,
          signupEmail: formattedEmail,
          context: 'CandidateSignupService.signup',
        });
        throw new AppError(
          'Email does not match invitation',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      if (invite.status !== JobInviteStatusEnum.PENDING) {
        logger.warn('Invalid invite status during signup', {
          inviteId,
          status: invite.status,
          context: 'CandidateSignupService.signup',
        });
        throw new AppError(
          'Invitation is no longer valid',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      if (invite.expiresAt < new Date()) {
        logger.warn('Invite expired during signup', {
          inviteId,
          expiresAt: invite.expiresAt.toISOString(),
          context: 'CandidateSignupService.signup',
        });

        // Update status to expired
        await prisma.job_invite.update({
          where: { id: inviteId },
          data: { status: JobInviteStatusEnum.EXPIRED },
        });
        throw new AppError(
          'Invitation has expired',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      logger.info('Invite validation successful', {
        email: invite.email,
        context: 'CandidateSignupService.signup',
      });
    }

    // Find default subscription package
    const defaultSubscriptionPackage =
      await prisma.candidate_subscription_package.findFirst({
        where: { isDefault: true, isActive: true },
      });

    if (!defaultSubscriptionPackage) {
      throw new AppError(
        'No default subscription package found',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }

    // Use a transaction to ensure all operations are atomic
    const result = await prisma.$transaction(async (tx) => {
      // Create user in our database
      const user = await tx.user.create({
        data: {
          name: formatName(signupData.name),
          email: formattedEmail,
          password: await hashPassword(signupData.password), // Hash password
          jobTitle: signupData.jobTitle || '',
          type: 'CANDIDATE',
          role: 'INDIVIDUAL',
          status: 'ACTIVE',
          // If invite-based signup, mark email as verified immediately
          emailVerified: invite ? new Date() : null,
        },
      });

      if (invite) {
        logger.info('User created with email verification (OTP skipped)', {
          email: user.email,
          context: 'CandidateSignupService.signup',
        });
      } else {
        logger.info('User created (OTP verification required)', {
          email: user.email,
          context: 'CandidateSignupService.signup',
        });
      }

      // Check if this is an imported candidate signup
      let candidateImportRecord = null;
      let isImportedCandidate = false;
      let importedByClientId = null;
      let importedJobPostingId = null;
      let importedIntegrationId = null;

      if (invite) {
        // Look for a candidate import record matching the invite email and job
        candidateImportRecord = await tx.candidate_import.findFirst({
          where: {
            email: invite.email,
            jobPostingId: invite.jobId,
          },
        });

        if (candidateImportRecord) {
          isImportedCandidate = true;
          importedByClientId = candidateImportRecord.clientId;
          importedJobPostingId = candidateImportRecord.jobPostingId;
          importedIntegrationId = candidateImportRecord.integrationProviderId;

          logger.info('Detected imported candidate signup', {
            candidateImportId: candidateImportRecord.id,
            email: invite.email,
            jobId: invite.jobId,
            integrationProviderId: importedIntegrationId,
            context: 'CandidateSignupService.signup',
          });
        }
      }

      // Create candidate
      const candidate = await tx.candidate.create({
        data: {
          userId: user.id,
          status: CandidateStatusEnum.NEW,
          jobSearchStatus: JobSearchStatusEnum.OPEN_TO_OPPORTUNITIES,
          isPublished: false,
          completionPercentage: 0,
          isInviteSignup: Boolean(invite && !invite.isSupportInvite),
          // Import tracking fields
          isImportedCandidate,
          importedByClientId,
          importedJobPostingId,
          importedIntegrationId,
        },
      });

      logger.info('Candidate profile created', {
        candidateId: candidate.id,
        context: 'CandidateSignupService.signup',
      });

      // Create candidate settings with default values
      const defaultSettings =
        await this.candidateProfileSettingsService.getDefaultSettings(
          candidate.id
        );
      await tx.candidate_settings.create({
        data: {
          candidateId: candidate.id,
          globalSettingsId: defaultSettings.globalSettingsId,
          notificationsEnabled: defaultSettings.notificationsEnabled,
          emailNotifications: defaultSettings.emailNotifications,
          pushNotifications: defaultSettings.pushNotifications,
          jobAlerts: defaultSettings.jobAlerts,
          applicationUpdates: defaultSettings.applicationUpdates,
          profileVisibility: defaultSettings.profileVisibility,
          shareDataWithEmployers: defaultSettings.shareDataWithEmployers,
          darkMode: defaultSettings.darkMode,
          language: defaultSettings.language,
          timezone: signupData.timezone || defaultSettings.timezone,
          preferredCommunicationChannel:
            defaultSettings.preferredCommunicationChannel,
        },
      });

      // If this is an invite-based signup, create job application and mark invite as accepted
      if (invite) {
        // If the invite was sent by a support user, skip auto-creating application and auto-acceptance
        if (invite.isSupportInvite) {
          logger.info(
            'Skipping application creation for support-sent invite in invite-based signup',
            {
              inviteId: invite.id,
              jobId: invite.jobId,
              email: invite.email,
              context: 'CandidateSignupService.signup',
            }
          );

          // Mark invite as ACCEPTED without creating application and link user
          await tx.job_invite.update({
            where: { id: inviteId },
            data: {
              status: JobInviteStatusEnum.ACCEPTED,
              userId: user.id, // Link the user to the invite for accurate name display
            },
          });

          logger.info(
            'Support invite marked as ACCEPTED (no application created)',
            {
              inviteId,
              userId: user.id,
              context: 'CandidateSignupService.signup',
            }
          );
        } else {
          logger.info('Creating job application for invite-based signup', {
            jobId: invite.jobId,
            context: 'CandidateSignupService.signup',
          });

          // Create job application for this candidate and jobId with ACCEPTED status
          // since the candidate is signing up via invite link, they are accepting the invitation
          const jobApplication = await tx.job_application.create({
            data: {
              candidateId: candidate.id,
              jobPostingId: invite.jobId,
              status: 'INVITED',
              appliedAt: new Date(),
            },
          });

          logger.info(
            'Job application created successfully with ACCEPTED status',
            {
              applicationId: jobApplication.id,
              context: 'CandidateSignupService.signup',
            }
          );

          // Mark invite as ACCEPTED and link it to the application and user
          await tx.job_invite.update({
            where: { id: inviteId },
            data: {
              status: JobInviteStatusEnum.ACCEPTED,
              jobApplicationId: jobApplication.id, // Link the invite to the application
              userId: user.id, // Link the user to the invite for accurate name display
            },
          });

          logger.info(
            'Invite marked as ACCEPTED and linked to application and user',
            {
              inviteId,
              applicationId: jobApplication.id,
              userId: user.id,
              context: 'CandidateSignupService.signup',
            }
          );

          // Create job_ai_assessment_invitation for this application
          try {
            // Get clientId from inviterId (clientUserId)
            const clientUser = await tx.client_user.findUnique({
              where: { id: invite.inviterId },
              select: { clientId: true },
            });

            if (clientUser) {
              // Check if invitation already exists
              let invitationRecord =
                await tx.job_ai_assessment_invitation.findFirst({
                  where: {
                    candidateId: candidate.id,
                    jobApplicationId: jobApplication.id,
                  },
                });

              if (!invitationRecord) {
                // Create job_ai_assessment_invitation
                const invitationExpiryHours = 72; // 3 days
                invitationRecord = await tx.job_ai_assessment_invitation.create(
                  {
                    data: {
                      candidateId: candidate.id,
                      clientId: clientUser.clientId,
                      jobApplicationId: jobApplication.id,
                      status: JobAiAssessmentInviteStatusEnum.ACCEPTED,
                      invitedById: invite.inviterId,
                      expiresAt: new Date(
                        Date.now() + invitationExpiryHours * 60 * 60 * 1000
                      ),
                      createdAt: new Date(),
                    },
                  }
                );

                logger.info(
                  'Job AI assessment invitation created successfully',
                  {
                    applicationId: jobApplication.id,
                    candidateId: candidate.id,
                    clientId: clientUser.clientId,
                    context: 'CandidateSignupService.signup',
                  }
                );
              } else if (
                invitationRecord.status !==
                JobAiAssessmentInviteStatusEnum.ACCEPTED
              ) {
                invitationRecord = await tx.job_ai_assessment_invitation.update(
                  {
                    where: { id: invitationRecord.id },
                    data: { status: JobAiAssessmentInviteStatusEnum.ACCEPTED },
                  }
                );

                logger.info(
                  'Job AI assessment invitation updated to ACCEPTED',
                  {
                    applicationId: jobApplication.id,
                    invitationId: invitationRecord.id,
                    context: 'CandidateSignupService.signup',
                  }
                );
              } else {
                logger.info(
                  'Job AI assessment invitation already ACCEPTED, skipping update',
                  {
                    applicationId: jobApplication.id,
                    invitationId: invitationRecord.id,
                    context: 'CandidateSignupService.signup',
                  }
                );
              }
            } else {
              logger.warn(
                'Client user not found for inviterId, skipping AI assessment invitation creation',
                {
                  inviterId: invite.inviterId,
                  context: 'CandidateSignupService.signup',
                }
              );
            }
          } catch (assessmentInviteError) {
            // Log error but don't fail the signup process
            logger.error(
              'Failed to create/update job AI assessment invitation during signup',
              {
                error:
                  assessmentInviteError instanceof Error
                    ? assessmentInviteError.message
                    : 'Unknown error',
                applicationId: jobApplication.id,
                candidateId: candidate.id,
                context: 'CandidateSignupService.signup',
              }
            );
          }
        }
      }

      // Update candidate import record if this was an imported candidate signup
      if (candidateImportRecord && isImportedCandidate) {
        await tx.candidate_import.update({
          where: { id: candidateImportRecord.id },
          data: {
            status: CandidateImportStatusEnum.REGISTERED,
            candidateId: candidate.id,
          },
        });

        logger.info(
          'Updated candidate import record with registered candidate',
          {
            candidateImportId: candidateImportRecord.id,
            candidateId: candidate.id,
            email: candidateImportRecord.email,
            context: 'CandidateSignupService.signup',
          }
        );
      }

      // Return user with all relationships
      return await tx.user.findUnique({
        where: { id: user.id },
        include: {
          candidate: {
            include: {
              settings: true,
            },
          },
        },
      });
    });

    if (!result) {
      throw new AppError(
        'Failed to create candidate',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }

    // Create subscription with default package
    await this.subscriptionService.createDefaultSubscription(
      result.candidate?.id || ''
    );

    // Create initial resume
    await this.resumeService.createInitialResume(result.candidate?.id || '');

    // Non-invite signups will see and react to pending invitations from the dashboard flow.

    // Send OTP verification email only for non-invite signups
    if (!invite) {
      logger.info('Sending OTP verification email', {
        email: result.email,
        context: 'CandidateSignupService.signup',
      });
      try {
        await this.verifyService.sendOtpVerification({
          email: result.email,
        });
        logger.info('OTP verification email sent successfully', {
          email: result.email,
          context: 'CandidateSignupService.signup',
        });
      } catch (emailError) {
        logger.warn('Failed to send OTP verification email', {
          error:
            emailError instanceof Error ? emailError.message : 'Unknown error',
          email: result.email,
          context: 'CandidateSignupService.signup',
        });
      }
    } else {
      logger.info('OTP verification SKIPPED for invite-based signup', {
        email: result.email,
        context: 'CandidateSignupService.signup',
      });
    }

    // Generate auth token for immediate login
    const authUser = toIAuthUser(result);
    const authToken = getAuthToken(authUser);

    if (invite) {
      logger.info('Invite-based signup completed successfully', {
        email: result.email,
        userId: result.id,
        candidateId: result.candidate?.id,
        context: 'CandidateSignupService.signup',
      });
    } else {
      logger.info('Regular signup completed successfully', {
        email: result.email,
        userId: result.id,
        candidateId: result.candidate?.id,
        context: 'CandidateSignupService.signup',
      });
    }

    logger.info('Candidate signup completed successfully', {
      userId: result.id,
      email: result.email,
      inviteId,
      context: 'CandidateSignupService.signup',
    });

    return {
      message: invite
        ? 'Candidate registered successfully via invitation. Welcome!'
        : 'Candidate registered successfully. Please check your email to verify your account.',
      user: authUser,
      token: authToken,
    };
  }
}
