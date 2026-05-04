import { PrismaClient } from '@prisma/client';
import { singleton } from '@/shared/decorators/singleton';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { INotificationProvider } from '../notification/notification.interface';
import {
  JobInviteStatusEnum,
  CandidateImportStatusEnum,
} from '@/shared/models/common/enums';
import { application_status } from '@prisma/client';
import { IJobInviteApiRequest } from '@/shared/models/api/client/job.invite.api';
import { IJobInviteSimpleResponse } from '@/shared/models/api/client/job.invite.api';
import {
  IJobInviteTokenValidation,
  IJobInviteListResponse,
  IJobInviteFilters,
  IJobInvite,
} from '@/shared/models/domain/client/job.invite.domain';
import { ENV } from '@/config/env';
import { logger } from '@/shared/utils/logger';
import { getPaginationInfo } from '@/utils/pagination';
import {
  IPaginationRequest,
  IPaginatedResponse,
} from '@/shared/models/api/common/common.api';

@singleton
export class JobInviteService {
  private readonly prisma: PrismaClient;
  private readonly invitationExpiryHours = 72;

  constructor(private readonly notificationProvider: INotificationProvider) {
    this.prisma = new PrismaClient();
  }

  /**
   * Validate invite token and extract email information
   * @param token - The invite ID to validate
   * @returns Object containing email and invite details
   */
  async validateInviteToken(token: string): Promise<IJobInviteTokenValidation> {
    logger.info('Validating invite token', {
      token: token.substring(0, 8) + '...',
      context: 'JobInviteService.validateInviteToken',
    });

    try {
      const invite = await this.prisma.job_invite.findUnique({
        where: { id: token },
      });

      if (!invite) {
        logger.warn('Token validation failed: Invalid token', {
          token: token.substring(0, 8) + '...',
          context: 'JobInviteService.validateInviteToken',
        });
        return {
          email: '',
          name: '',
          jobId: '',
          inviteId: '',
          isValid: false,
          message: 'Invalid invitation link',
        };
      }

      logger.info('Found invite for validation', {
        name: invite.name,
        email: invite.email,
        status: invite.status,
        expiresAt: invite.expiresAt.toISOString(),
        context: 'JobInviteService.validateInviteToken',
      });

      // Check if invite is expired
      if (invite.expiresAt < new Date()) {
        logger.warn('Token validation failed: Invite expired', {
          inviteId: invite.id,
          expiresAt: invite.expiresAt.toISOString(),
          context: 'JobInviteService.validateInviteToken',
        });

        // Update status to expired
        await this.prisma.job_invite.update({
          where: { id: token },
          data: { status: JobInviteStatusEnum.EXPIRED },
        });

        return {
          email: '',
          name: '',
          jobId: '',
          inviteId: '',
          isValid: false,
          message: 'Invitation has expired',
        };
      }

      // Check if invite is already accepted
      if (invite.status === JobInviteStatusEnum.ACCEPTED) {
        logger.warn('Token validation failed: Invite already accepted', {
          inviteId: invite.id,
          context: 'JobInviteService.validateInviteToken',
        });
        return {
          email: '',
          name: '',
          jobId: '',
          inviteId: '',
          isValid: false,
          message: 'Invitation has already been accepted',
        };
      }

      // Check if invite is declined or cancelled
      if (
        invite.status === JobInviteStatusEnum.DECLINED ||
        invite.status === JobInviteStatusEnum.CANCELLED
      ) {
        logger.warn('Token validation failed: Invite status invalid', {
          inviteId: invite.id,
          status: invite.status,
          context: 'JobInviteService.validateInviteToken',
        });
        return {
          email: '',
          name: '',
          jobId: '',
          inviteId: '',
          isValid: false,
          message: 'Invitation is no longer valid',
        };
      }

      logger.info('Token validation successful', {
        name: invite.name,
        email: invite.email,
        isUSBasedJob: invite.isUSBasedJob,
        context: 'JobInviteService.validateInviteToken',
      });

      return {
        email: invite.email,
        name: invite.name,
        jobId: invite.jobId,
        inviteId: invite.id,
        isValid: true,
        isUSBasedJob: invite.isUSBasedJob ?? false,
      };
    } catch (error) {
      logger.error('Token validation error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        token: token.substring(0, 8) + '...',
        context: 'JobInviteService.validateInviteToken',
      });
      return {
        email: '',
        name: '',
        jobId: '',
        inviteId: '',
        isValid: false,
        message: 'Error validating invitation',
      };
    }
  }

  /**
   * Helper function to check if job posting is USA-based
   * @param jobId - The job posting ID
   * @returns Boolean indicating if the job is USA-based
   */
  private async isJobUSBased(jobId: string): Promise<boolean> {
    try {
      const jobPosting = await this.prisma.job_posting.findUnique({
        where: { id: jobId },
        select: { preferredLocations: true },
      });

      if (!jobPosting || !jobPosting.preferredLocations) {
        return false;
      }

      // Check if any preferred location includes USA, United States, or US
      // Using regex patterns with word boundaries to avoid false positives
      const usaPatterns = [
        /\busa\b/i,
        /\bunited\s+states\b/i,
        /\bu\.?s\.?a?\.?\b/i,
        /\bamerica\b/i,
        /\bunited\s+states\s+of\s+america\b/i,
      ];

      return jobPosting.preferredLocations.some((location) =>
        usaPatterns.some((regex) => regex.test(location))
      );
    } catch (error) {
      logger.error('Error checking if job is USA-based', {
        jobId,
        error: error instanceof Error ? error.message : 'Unknown error',
        context: 'JobInviteService.isJobUSBased',
      });
      return false;
    }
  }

  /**
   * Create job invites without triggering job applications or AI assessments
   * This is specifically for imported candidates to avoid automatic assessment creation
   */
  async createJobInviteWithoutApplication(
    data: IJobInviteApiRequest,
    clientUserId: string,
    isImportedCandidate: boolean = false,
    integrationId?: string
  ): Promise<IJobInviteSimpleResponse[]> {
    const { candidates, jobTitle, jobId } = data;

    const results: IJobInviteSimpleResponse[] = [];

    // Check if job is USA-based
    const isUSBasedJob = await this.isJobUSBased(jobId);

    logger.info('Starting job invite creation process (without application)', {
      jobTitle,
      jobId,
      candidatesCount: candidates.length,
      clientUserId,
      isImportedCandidate,
      isUSBasedJob,
      context: 'JobInviteService.createJobInviteWithoutApplication',
    });

    for (const candidate of candidates) {
      const { name, email } = candidate;
      const trimmedEmail = email.trim();
      const normalizedEmail = trimmedEmail.toLowerCase();

      logger.info('Processing candidate for job invite (without application)', {
        name,
        email: normalizedEmail,
        jobId,
        context: 'JobInviteService.createJobInviteWithoutApplication',
      });

      try {
        const inviteUser = await this.prisma.user.findFirst({
          where: {
            email: {
              equals: normalizedEmail,
              mode: 'insensitive',
            },
          },
        });

        // Use actual user name if they exist, otherwise use form input
        const candidateName = inviteUser?.name || name;
        const userId = inviteUser?.id || null;

        // Check if invite already exists for this email and job
        // Exclude support invites - allow client invites even if support invite exists
        const isInviteAlreadyExists = await this.prisma.job_invite.findFirst({
          where: {
            email: {
              equals: normalizedEmail,
              mode: 'insensitive',
            },
            jobId,
            status: JobInviteStatusEnum.PENDING,
            isSupportInvite: {
              not: true, // Exclude support invites from this check
            },
          },
        });

        if (isInviteAlreadyExists) {
          throw new AppError(
            `Candidate ${trimmedEmail} already invited for this job`,
            400,
            ErrorCode.INVALID_REQUEST
          );
        }

        // If user exists, create both job_invite and job application
        if (inviteUser) {
          logger.info(
            'Candidate already exists, creating job invite and application (without application)',
            {
              email: normalizedEmail,
              userId: inviteUser.id,
              candidateName,
              context: 'JobInviteService.createJobInviteWithoutApplication',
            }
          );

          // Find the candidate record
          const candidateRecord = await this.prisma.candidate.findUnique({
            where: { userId: inviteUser.id },
          });

          if (!candidateRecord) {
            throw new AppError(
              `Candidate profile not found for ${trimmedEmail}`,
              400,
              ErrorCode.INVALID_REQUEST
            );
          }

          // Check if application already exists
          const existingApplication =
            await this.prisma.job_application.findFirst({
              where: {
                candidateId: candidateRecord.id,
                jobPostingId: jobId,
              },
            });

          if (existingApplication) {
            throw new AppError(
              `Candidate ${trimmedEmail} has already applied for this job`,
              400,
              ErrorCode.INVALID_REQUEST
            );
          }

          // Create job_invite entry for existing candidate (needed for acceptance flow)
          const expiresAt = new Date(
            Date.now() + this.invitationExpiryHours * 60 * 60 * 1000
          );

          const invite = await this.prisma.job_invite.create({
            data: {
              email: normalizedEmail,
              name: candidateName,
              userId,
              jobId,
              inviterId: clientUserId,
              status: JobInviteStatusEnum.PENDING,
              expiresAt,
              isImportedCandidate,
              integrationId,
              isUSBasedJob,
              isSupportInvite: false, // Explicitly set as client invite
            },
          });

          logger.info(
            'Created job invite for existing candidate (without application)',
            {
              inviteId: invite.id,
              email: normalizedEmail,
              context: 'JobInviteService.createJobInviteWithoutApplication',
            }
          );

          // Create job application with INVITED status
          const application = await this.prisma.job_application.create({
            data: {
              candidateId: candidateRecord.id,
              jobPostingId: jobId,
              status: application_status.INVITED,
              appliedAt: new Date(),
            },
          });

          logger.info(
            'Created job application for existing candidate (without application)',
            {
              applicationId: application.id,
              email: normalizedEmail,
              context: 'JobInviteService.createJobInviteWithoutApplication',
            }
          );

          // Send notification to existing candidate with inviteId
          await this.sendJobInviteNotificationToExistingCandidate(
            normalizedEmail,
            name,
            jobId,
            jobTitle,
            clientUserId,
            invite.id // Pass inviteId so candidate can accept via link
          );

          results.push({
            id: invite.id,
            status: JobInviteStatusEnum.PENDING,
            success: true,
            message: 'Job invite sent to existing candidate successfully',
          });

          continue;
        }

        // Create the job_invite record with isImportedCandidate flag
        const expiresAt = new Date(
          Date.now() + this.invitationExpiryHours * 60 * 60 * 1000
        );

        logger.info('Creating invite with expiry (without application)', {
          email: normalizedEmail,
          expiresAt: expiresAt.toISOString(),
          isImportedCandidate,
          candidateName,
          userId,
          context: 'JobInviteService.createJobInviteWithoutApplication',
        });

        const invite = await this.prisma.job_invite.create({
          data: {
            email: normalizedEmail,
            name: candidateName,
            userId,
            jobId,
            inviterId: clientUserId,
            status: JobInviteStatusEnum.PENDING,
            expiresAt,
            isImportedCandidate,
            integrationId,
            isUSBasedJob,
            // Set a flag to indicate this invite should not create applications
            isSupportInvite: true, // This prevents application creation in signup flow
          },
        });

        logger.info('Created invite record (without application)', {
          inviteId: invite.id,
          email: normalizedEmail,
          isImportedCandidate,
          context: 'JobInviteService.createJobInviteWithoutApplication',
        });

        // Fetch job, company, and inviter info for the email
        const clientUser = await this.prisma.client_user.findUnique({
          where: { id: clientUserId },
          include: { user: true },
        });

        const jobPosting = await this.prisma.job_posting.findUnique({
          where: { id: jobId },
          include: {
            client: {
              include: {
                company: true,
              },
            },
          },
        });

        if (!jobPosting || !jobPosting.client || !jobPosting.client.company) {
          logger.error('Job or company not found', {
            jobId,
            context: 'JobInviteService.createJobInviteWithoutApplication',
          });
          throw new AppError(
            'Job or company not found',
            404,
            ErrorCode.NOT_FOUND
          );
        }

        const companyName = jobPosting.client.company.name;
        const inviterName = clientUser?.user?.name || 'Hiring Manager';

        logger.info(
          'Retrieved company and inviter info (without application)',
          {
            companyName,
            inviterName,
            context: 'JobInviteService.createJobInviteWithoutApplication',
          }
        );

        // Use invite ID as token in the URL
        const inviteUrl = `${ENV.FRONTEND_URL}/app/candidate/signup?inviteId=${invite.id}&email=${encodeURIComponent(normalizedEmail)}`;

        logger.info('Generated invite URL (without application)', {
          inviteUrl,
          isUSBasedJob,
          context: 'JobInviteService.createJobInviteWithoutApplication',
        });

        // Send the invite email
        logger.info('Sending job invite email (without application)', {
          email: normalizedEmail,
          context: 'JobInviteService.createJobInviteWithoutApplication',
        });

        await this.notificationProvider.sendJobInviteEmail(
          normalizedEmail,
          name,
          companyName,
          inviterName,
          jobTitle,
          inviteUrl,
          this.invitationExpiryHours
        );

        logger.info(
          'Job invite email sent successfully (without application)',
          {
            email: normalizedEmail,
            inviteId: invite.id,
            context: 'JobInviteService.createJobInviteWithoutApplication',
          }
        );

        results.push({
          id: invite.id,
          status: JobInviteStatusEnum.PENDING,
          success: true,
          message:
            'Job invite created successfully (no application will be created)',
        });
      } catch (error) {
        logger.error('Failed to create job invite (without application)', {
          email: normalizedEmail,
          jobId,
          error: error instanceof Error ? error.message : 'Unknown error',
          context: 'JobInviteService.createJobInviteWithoutApplication',
        });

        results.push({
          id: '',
          status: JobInviteStatusEnum.PENDING,
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    logger.info('Job invite creation process completed (without application)', {
      jobId,
      totalCandidates: candidates.length,
      successfulInvites: results.filter((r) => r.id).length,
      failedInvites: results.filter((r) => !r.id).length,
      context: 'JobInviteService.createJobInviteWithoutApplication',
    });

    return results;
  }

  async createJobInvite(
    data: IJobInviteApiRequest,
    clientUserId: string,
    isImportedCandidate: boolean = false,
    integrationId?: string
  ): Promise<IJobInviteSimpleResponse[]> {
    const { candidates, jobTitle, jobId } = data;

    const results: IJobInviteSimpleResponse[] = [];

    // Check if job is USA-based
    const isUSBasedJob = await this.isJobUSBased(jobId);

    logger.info('Starting job invite creation process', {
      jobTitle,
      jobId,
      candidatesCount: candidates.length,
      clientUserId,
      isUSBasedJob,
      context: 'JobInviteService.createJobInvite',
    });

    for (const candidate of candidates) {
      const { name, email } = candidate;
      const trimmedEmail = email.trim();
      const normalizedEmail = trimmedEmail.toLowerCase();

      logger.info('Processing candidate for job invite', {
        name,
        email: normalizedEmail,
        jobId,
        context: 'JobInviteService.createJobInvite',
      });

      try {
        // Define active statuses that prevent re-inviting
        const activeStatuses = [
          JobInviteStatusEnum.PENDING,
          JobInviteStatusEnum.ACCEPTED,
        ];

        // First, check if invite already exists for this email and job
        // Check for any existing invite (excluding support invites)
        const existingInvite = await this.prisma.job_invite.findFirst({
          where: {
            email: {
              equals: normalizedEmail,
              mode: 'insensitive',
            },
            jobId,
            isSupportInvite: {
              not: true, // Exclude support invites from this check
            },
          },
        });

        // If invite exists with active status, show error
        if (existingInvite) {
          const existingStatus = existingInvite.status as JobInviteStatusEnum;
          if (activeStatuses.includes(existingStatus)) {
            throw new AppError(
              `Candidate ${trimmedEmail} already has an active invite for this job`,
              400,
              ErrorCode.INVALID_REQUEST
            );
          }

          // If invite exists but is expired/cancelled/withdrawn, we'll update it
          logger.info(
            'Found existing invite with inactive status, will update',
            {
              inviteId: existingInvite.id,
              currentStatus: existingInvite.status,
              email: normalizedEmail,
              context: 'JobInviteService.createJobInvite',
            }
          );
        }

        // Check if user exists
        const inviteUser = await this.prisma.user.findFirst({
          where: {
            email: {
              equals: normalizedEmail,
              mode: 'insensitive',
            },
          },
        });

        // Use actual user name if they exist, otherwise use form input
        const candidateName = inviteUser?.name || name;
        const userId = inviteUser?.id || null;

        logger.info('Determined candidate name and user ID', {
          formName: name,
          actualName: candidateName,
          userId,
          userExists: !!inviteUser,
          context: 'JobInviteService.createJobInvite',
        });

        // Prepare invite data
        const expiresAt = new Date(
          Date.now() + this.invitationExpiryHours * 60 * 60 * 1000
        );

        let invite;
        if (
          existingInvite &&
          !activeStatuses.includes(existingInvite.status as JobInviteStatusEnum)
        ) {
          // Update existing invite that was expired/cancelled/withdrawn
          invite = await this.prisma.job_invite.update({
            where: { id: existingInvite.id },
            data: {
              name: candidateName,
              userId,
              inviterId: clientUserId,
              status: JobInviteStatusEnum.PENDING,
              expiresAt,
              isImportedCandidate,
              integrationId,
              isUSBasedJob,
              isSupportInvite: false, // Explicitly set as client invite
              updatedAt: new Date(),
            },
          });

          logger.info('Updated existing invite record', {
            inviteId: invite.id,
            email: normalizedEmail,
            candidateName,
            userId,
            previousStatus: existingInvite.status,
            context: 'JobInviteService.createJobInvite',
          });
        } else {
          // Create new invite record
          try {
            invite = await this.prisma.job_invite.create({
              data: {
                email: normalizedEmail,
                name: candidateName,
                userId,
                jobId,
                inviterId: clientUserId,
                status: JobInviteStatusEnum.PENDING,
                expiresAt,
                isImportedCandidate,
                integrationId,
                isUSBasedJob,
                isSupportInvite: false, // Explicitly set as client invite
              },
            });

            logger.info('Created new invite record', {
              inviteId: invite.id,
              email: normalizedEmail,
              candidateName,
              userId,
              context: 'JobInviteService.createJobInvite',
            });
          } catch (createError: any) {
            // Handle unique constraint violation (shouldn't happen due to our check, but just in case)
            if (createError?.code === 'P2002') {
              throw new AppError(
                `Candidate ${trimmedEmail} already has an invite for this job`,
                400,
                ErrorCode.INVALID_REQUEST
              );
            }
            throw createError;
          }
        }

        // If user exists, also create/update job application
        if (inviteUser) {
          logger.info(
            'Candidate already exists, creating/updating job application',
            {
              email: normalizedEmail,
              userId: inviteUser.id,
              context: 'JobInviteService.createJobInvite',
            }
          );

          // Find the candidate record
          const candidateRecord = await this.prisma.candidate.findUnique({
            where: { userId: inviteUser.id },
          });

          if (!candidateRecord) {
            logger.warn(
              'Candidate profile not found, but continuing with invite creation',
              {
                email: normalizedEmail,
                userId: inviteUser.id,
                context: 'JobInviteService.createJobInvite',
              }
            );
          } else {
            // Check if application already exists
            const existingApplication =
              await this.prisma.job_application.findFirst({
                where: {
                  candidateId: candidateRecord.id,
                  jobPostingId: jobId,
                },
              });

            let application;
            if (existingApplication) {
              application = existingApplication;
              logger.info(
                'Application already exists, skipping application creation',
                {
                  applicationId: existingApplication.id,
                  email: normalizedEmail,
                  context: 'JobInviteService.createJobInvite',
                }
              );
            } else {
              // Create job application with INVITED status
              application = await this.prisma.job_application.create({
                data: {
                  candidateId: candidateRecord.id,
                  jobPostingId: jobId,
                  status: application_status.INVITED,
                  appliedAt: new Date(),
                },
              });

              logger.info('Created job application for existing candidate', {
                applicationId: application.id,
                email: normalizedEmail,
                context: 'JobInviteService.createJobInvite',
              });
            }

            // Link the invite to the application
            await this.prisma.job_invite.update({
              where: { id: invite.id },
              data: { jobApplicationId: application.id },
            });

            logger.info('Linked invite to application', {
              inviteId: invite.id,
              applicationId: application.id,
              email: normalizedEmail,
              context: 'JobInviteService.createJobInvite',
            });

            // Send notification to existing candidate with inviteId
            await this.sendJobInviteNotificationToExistingCandidate(
              normalizedEmail,
              name,
              jobId,
              jobTitle,
              clientUserId,
              invite.id // Pass inviteId so candidate can accept via link
            );
          }
        }

        // Fetch job, company, and inviter info for the email (needed for both existing and new candidates)
        const clientUser = await this.prisma.client_user.findUnique({
          where: { id: clientUserId },
          include: { user: true },
        });

        const jobPosting = await this.prisma.job_posting.findUnique({
          where: { id: jobId },
          include: {
            client: {
              include: {
                company: true,
              },
            },
          },
        });

        if (!jobPosting || !jobPosting.client || !jobPosting.client.company) {
          logger.error('Job or company not found', {
            jobId,
            context: 'JobInviteService.createJobInvite',
          });
          throw new AppError(
            'Job or company not found',
            404,
            ErrorCode.NOT_FOUND
          );
        }

        const companyName = jobPosting.client.company.name;
        const inviterName = clientUser?.user?.name || 'Hiring Manager';

        logger.info('Retrieved company and inviter info', {
          companyName,
          inviterName,
          context: 'JobInviteService.createJobInvite',
        });

        // Send email notification based on whether user exists or not
        if (inviteUser) {
          // For existing candidates, notification is already sent in the block above
          logger.info('Email notification sent to existing candidate', {
            email: normalizedEmail,
            context: 'JobInviteService.createJobInvite',
          });
        } else {
          // For new candidates, send signup link
          const inviteUrl = `${ENV.FRONTEND_URL}/app/candidate/signup?inviteId=${invite.id}&email=${encodeURIComponent(normalizedEmail)}`;

          logger.info('Generated invite URL for new candidate', {
            inviteUrl,
            isUSBasedJob,
            context: 'JobInviteService.createJobInvite',
          });

          // Send the invite email with signup link
          logger.info('Sending job invite email to new candidate', {
            email: normalizedEmail,
            context: 'JobInviteService.createJobInvite',
          });

          await this.notificationProvider.sendJobInviteEmail(
            normalizedEmail,
            name,
            companyName,
            inviterName,
            jobTitle,
            inviteUrl,
            this.invitationExpiryHours
          );

          logger.info('Email sent successfully to new candidate', {
            email: normalizedEmail,
            context: 'JobInviteService.createJobInvite',
          });
        }

        // Update candidate import status to INVITED if this candidate was imported
        try {
          await this.prisma.candidate_import.updateMany({
            where: {
              email: {
                equals: normalizedEmail,
                mode: 'insensitive',
              },
              jobPostingId: jobId,
              status: {
                in: [CandidateImportStatusEnum.PROCESSED],
              },
            },
            data: {
              status: CandidateImportStatusEnum.INVITED,
            },
          });

          logger.info('Updated candidate import status to INVITED', {
            email: normalizedEmail,
            jobId,
            context: 'JobInviteService.createJobInvite',
          });
        } catch (updateError) {
          logger.warn('Failed to update candidate import status', {
            email: normalizedEmail,
            jobId,
            error:
              updateError instanceof Error
                ? updateError.message
                : 'Unknown error',
            context: 'JobInviteService.createJobInvite',
          });
          // Don't fail the entire invite process if status update fails
        }

        // Return success result with invite ID
        results.push({
          id: invite.id,
          status: JobInviteStatusEnum.PENDING,
          success: true,
          message: inviteUser
            ? 'Job invite sent to existing candidate successfully'
            : 'Candidate invited successfully',
        });

        logger.info('Successfully processed invite', {
          name,
          email: normalizedEmail,
          context: 'JobInviteService.createJobInvite',
        });
      } catch (error: any) {
        logger.error('Failed to invite candidate', {
          name,
          email: normalizedEmail,
          error: error?.message || 'Unknown error',
          context: 'JobInviteService.createJobInvite',
        });

        results.push({
          id: '',
          status: JobInviteStatusEnum.PENDING,
          success: false,
          message: `${error?.message || 'Unknown error'}`,
        });
      }
    }

    logger.info('Invite creation process completed', {
      totalCandidates: candidates.length,
      successfulInvites: results.filter((r) => r.id).length,
      failedInvites: results.filter((r) => !r.id).length,
      context: 'JobInviteService.createJobInvite',
    });

    return results;
  }

  /**
   * Send job invite notification to existing candidate
   * @param email - Candidate email
   * @param name - Candidate name
   * @param jobId - Job posting ID
   * @param jobTitle - Job title
   * @param clientUserId - Client user ID who sent the invite
   */
  private async sendJobInviteNotificationToExistingCandidate(
    email: string,
    name: string,
    jobId: string,
    jobTitle: string,
    clientUserId: string,
    inviteId?: string
  ): Promise<void> {
    try {
      // Fetch job, company, and inviter info
      const clientUser = await this.prisma.client_user.findUnique({
        where: { id: clientUserId },
        include: { user: true },
      });

      const jobPosting = await this.prisma.job_posting.findUnique({
        where: { id: jobId },
        include: {
          client: {
            include: {
              company: true,
            },
          },
        },
      });

      if (!jobPosting || !jobPosting.client || !jobPosting.client.company) {
        logger.error(
          'Job or company not found for existing candidate notification',
          {
            jobId,
            context:
              'JobInviteService.sendJobInviteNotificationToExistingCandidate',
          }
        );
        return;
      }

      const companyName = jobPosting.client.company.name;
      const inviterName = clientUser?.user?.name || 'Hiring Manager';

      // Generate invite URL - include inviteId if available for acceptance flow
      // If inviteId is provided, candidate can accept even if not logged in (will redirect to login then accept)
      const inviteUrl = inviteId
        ? `${ENV.FRONTEND_URL}/app/candidate/assessment-invites/accept?inviteId=${inviteId}&email=${encodeURIComponent(email)}`
        : `${ENV.FRONTEND_URL}/app/candidate/assessment-invites`; // Fallback to applications page if no inviteId

      // Send notification email to existing candidate
      await this.notificationProvider.sendJobInviteEmail(
        email,
        name,
        companyName,
        inviterName,
        jobTitle,
        inviteUrl,
        this.invitationExpiryHours
      );

      logger.info('Sent job invite notification to existing candidate', {
        email,
        jobId,
        context:
          'JobInviteService.sendJobInviteNotificationToExistingCandidate',
      });
    } catch (error) {
      logger.error(
        'Failed to send job invite notification to existing candidate',
        {
          email,
          jobId,
          error: error instanceof Error ? error.message : 'Unknown error',
          context:
            'JobInviteService.sendJobInviteNotificationToExistingCandidate',
        }
      );
      // Don't throw - notification failure shouldn't break the main flow
    }
  }

  /**
   * Update expired invites and their related applications
   * @param clientId - The client ID to filter invites by
   */
  private async updateExpiredInvites(clientId: string): Promise<void> {
    try {
      const now = new Date();
      const clientUserIds = await this.getClientUserIds(clientId);

      // Find all expired invites that are still PENDING
      const expiredInvites = await this.prisma.job_invite.findMany({
        where: {
          inviterId: {
            in: clientUserIds,
          },
          status: JobInviteStatusEnum.PENDING,
          expiresAt: {
            lt: now,
          },
        },
        select: {
          id: true,
          email: true,
          jobId: true,
        },
      });

      if (expiredInvites.length === 0) {
        return;
      }

      const inviteIds = expiredInvites.map((invite) => invite.id);
      const jobIds = [...new Set(expiredInvites.map((invite) => invite.jobId))];
      const emails = expiredInvites.map((invite) => invite.email);

      // Update expired invites to EXPIRED status
      await this.prisma.job_invite.updateMany({
        where: {
          id: {
            in: inviteIds,
          },
        },
        data: {
          status: JobInviteStatusEnum.EXPIRED,
          updatedAt: now,
        },
      });

      logger.info('Updated expired job invites', {
        clientId,
        updatedCount: expiredInvites.length,
        context: 'JobInviteService.updateExpiredInvites',
      });

      // Update related job applications that are still INVITED
      // Find applications for these invites
      const applications = await this.prisma.job_application.findMany({
        where: {
          jobPostingId: {
            in: jobIds,
          },
          candidate: {
            user: {
              email: {
                in: emails,
                mode: 'insensitive',
              },
            },
          },
          status: application_status.INVITED,
        },
        select: {
          id: true,
        },
      });

      if (applications.length > 0) {
        // Update applications to WITHDRAWN status since invite expired
        await this.prisma.job_application.updateMany({
          where: {
            id: {
              in: applications.map((app) => app.id),
            },
          },
          data: {
            status: application_status.WITHDRAWN,
            updatedAt: now,
          },
        });

        logger.info('Updated job applications for expired invites', {
          clientId,
          updatedApplicationCount: applications.length,
          context: 'JobInviteService.updateExpiredInvites',
        });
      }
    } catch (error) {
      logger.error('Failed to update expired invites', {
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        context: 'JobInviteService.updateExpiredInvites',
      });
      // Don't throw - this shouldn't break the main flow
    }
  }

  /**
   * Get all job invites for a client with filtering and pagination
   * @param clientId - The client ID
   * @param filters - Filter criteria
   * @param paginationRequest - Pagination parameters
   * @returns Paginated list of job invites
   */
  async getAllJobInvites(
    clientId: string,
    filters: IJobInviteFilters,
    paginationRequest: IPaginationRequest
  ): Promise<IJobInviteListResponse> {
    logger.info('Getting all job invites for client', {
      clientId,
      filters,
      paginationRequest,
      context: 'JobInviteService.getAllJobInvites',
    });

    try {
      // Update expired invites before fetching
      await this.updateExpiredInvites(clientId);

      const paginationInfo = getPaginationInfo(paginationRequest);

      // Build where conditions
      const whereConditions: any = {
        inviterId: {
          in: await this.getClientUserIds(clientId),
        },
        // Exclude imported candidates from regular invite list
        isImportedCandidate: {
          not: true,
        },
      };

      // Add status filter
      if (filters.status && filters.status.length > 0) {
        whereConditions.status = {
          in: filters.status,
        };
      }

      // Add job ID filter
      if (filters.jobId) {
        whereConditions.jobId = filters.jobId;
      }

      // Add date range filters
      if (filters.startDate || filters.endDate) {
        whereConditions.createdAt = {};
        if (filters.startDate) {
          whereConditions.createdAt.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          whereConditions.createdAt.lte = new Date(filters.endDate);
        }
      }

      // Add search conditions
      if (filters.search) {
        whereConditions.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      // Get total count
      const total = await this.prisma.job_invite.count({
        where: whereConditions,
      });

      // Get invites with pagination, including user relation for real-time name
      const invites = await this.prisma.job_invite.findMany({
        where: whereConditions,
        skip: paginationInfo.skip,
        take: paginationInfo.take,
        orderBy: paginationInfo.orderBy,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Get job posting details for the invites
      const jobIds = [...new Set(invites.map((invite: any) => invite.jobId))];
      const jobPostings = await this.prisma.job_posting.findMany({
        where: {
          id: { in: jobIds },
        },
        select: {
          id: true,
          title: true,
          client: {
            select: {
              id: true,
              company: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      // Get inviter details for the invites
      const inviterIds = [
        ...new Set(invites.map((invite: any) => invite.inviterId)),
      ];
      const inviters = await this.prisma.client_user.findMany({
        where: {
          id: { in: inviterIds },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Get application details for the invites
      const applicationEmails = invites.map((invite: any) => invite.email);
      const applications = await this.prisma.job_application.findMany({
        where: {
          jobPosting: {
            id: { in: jobIds },
          },
          candidate: {
            user: {
              email: { in: applicationEmails },
            },
          },
        },
        include: {
          candidate: {
            include: {
              user: {
                select: {
                  email: true,
                },
              },
            },
          },
        },
      });

      const jobPostingMap = new Map(jobPostings.map((job) => [job.id, job]));
      const inviterMap = new Map(
        inviters.map((inviter) => [inviter.id, inviter])
      );
      const applicationMap = new Map(
        applications.map((app: any) => [app.candidate.user.email, app])
      );

      const totalPages = Math.ceil(total / paginationInfo.take);
      const page = Math.floor(paginationInfo.skip / paginationInfo.take) + 1;

      logger.info('Successfully retrieved job invites', {
        total,
        page,
        totalPages,
        context: 'JobInviteService.getAllJobInvites',
      });

      return {
        invites: invites.map((invite: any) =>
          this.mapJobInviteToDomainWithApplication(
            invite,
            jobPostingMap.get(invite.jobId),
            inviterMap.get(invite.inviterId),
            applicationMap.get(invite.email)
          )
        ),
        total,
        page,
        limit: paginationInfo.take,
        totalPages,
      };
    } catch (error) {
      logger.error('Failed to get job invites', {
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        context: 'JobInviteService.getAllJobInvites',
      });
      throw new AppError(
        'Failed to retrieve job invites',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get job invites for a specific job posting
   * @param clientId - The client ID
   * @param jobPostingId - The job posting ID
   * @param filters - Filter criteria
   * @param paginationRequest - Pagination parameters
   * @returns Paginated list of job invites for the specific job
   */
  async getJobInvitesByJobPostingId(
    clientId: string,
    jobPostingId: string,
    filters: IJobInviteFilters,
    paginationRequest: IPaginationRequest
  ): Promise<IJobInviteListResponse> {
    logger.info('Getting job invites for specific job posting', {
      clientId,
      jobPostingId,
      filters,
      paginationRequest,
      context: 'JobInviteService.getJobInvitesByJobPostingId',
    });

    try {
      // Verify the job posting belongs to the client
      const jobPosting = await this.prisma.job_posting.findFirst({
        where: {
          id: jobPostingId,
          client: {
            id: clientId,
          },
        },
      });

      if (!jobPosting) {
        logger.warn('Job posting not found or does not belong to client', {
          jobPostingId,
          clientId,
          context: 'JobInviteService.getJobInvitesByJobPostingId',
        });
        throw new AppError('Job posting not found', 404, ErrorCode.NOT_FOUND);
      }

      // Update expired invites before fetching
      await this.updateExpiredInvites(clientId);

      const paginationInfo = getPaginationInfo(paginationRequest);

      // Build where conditions
      const whereConditions: any = {
        jobId: jobPostingId,
        inviterId: {
          in: await this.getClientUserIds(clientId),
        },
        // Exclude imported candidates from regular invite list
        isImportedCandidate: {
          not: true,
        },
      };

      // Add status filter
      if (filters.status && filters.status.length > 0) {
        whereConditions.status = {
          in: filters.status,
        };
      }

      // Add date range filters
      if (filters.startDate || filters.endDate) {
        whereConditions.createdAt = {};
        if (filters.startDate) {
          whereConditions.createdAt.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          whereConditions.createdAt.lte = new Date(filters.endDate);
        }
      }

      // Add search conditions
      if (filters.search) {
        whereConditions.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      // Get total count
      const total = await this.prisma.job_invite.count({
        where: whereConditions,
      });

      // Get invites with pagination, including user relation for real-time name
      const invites = await this.prisma.job_invite.findMany({
        where: whereConditions,
        skip: paginationInfo.skip,
        take: paginationInfo.take,
        orderBy: paginationInfo.orderBy,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Get job posting details for the invites
      const jobIds = [...new Set(invites.map((invite: any) => invite.jobId))];
      const jobPostings = await this.prisma.job_posting.findMany({
        where: {
          id: { in: jobIds },
        },
        select: {
          id: true,
          title: true,
          client: {
            select: {
              id: true,
              company: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      // Get inviter details for the invites
      const inviterIds = [
        ...new Set(invites.map((invite: any) => invite.inviterId)),
      ];
      const inviters = await this.prisma.client_user.findMany({
        where: {
          id: { in: inviterIds },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Get application details for the invites
      const applicationEmails = invites.map((invite: any) => invite.email);
      const applications = await this.prisma.job_application.findMany({
        where: {
          jobPosting: {
            id: { in: jobIds },
          },
          candidate: {
            user: {
              email: { in: applicationEmails },
            },
          },
        },
        include: {
          candidate: {
            include: {
              user: {
                select: {
                  email: true,
                },
              },
            },
          },
        },
      });

      const jobPostingMap = new Map(jobPostings.map((job) => [job.id, job]));
      const inviterMap = new Map(
        inviters.map((inviter) => [inviter.id, inviter])
      );
      const applicationMap = new Map(
        applications.map((app) => [app.candidate.user.email, app])
      );

      const totalPages = Math.ceil(total / paginationInfo.take);
      const page = Math.floor(paginationInfo.skip / paginationInfo.take) + 1;

      logger.info('Successfully retrieved job invites for job posting', {
        jobPostingId,
        total,
        page,
        totalPages,
        context: 'JobInviteService.getJobInvitesByJobPostingId',
      });

      return {
        invites: invites.map((invite: any) =>
          this.mapJobInviteToDomainWithApplication(
            invite,
            jobPostingMap.get(invite.jobId),
            inviterMap.get(invite.inviterId),
            applicationMap.get(invite.email)
          )
        ),
        total,
        page,
        limit: paginationInfo.take,
        totalPages,
      };
    } catch (error) {
      logger.error('Failed to get job invites for job posting', {
        error: error instanceof Error ? error.message : 'Unknown error',
        jobPostingId,
        clientId,
        context: 'JobInviteService.getJobInvitesByJobPostingId',
      });
      throw new AppError(
        'Failed to retrieve job invites for job posting',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get all imported candidate job invites for a client with filtering and pagination
   * @param clientId - The client ID
   * @param filters - Filter criteria
   * @param paginationRequest - Pagination parameters
   * @returns Paginated list of imported candidate job invites
   */
  async getImportedCandidateJobInvites(
    clientId: string,
    filters: IJobInviteFilters,
    paginationRequest: IPaginationRequest
  ): Promise<IJobInviteListResponse> {
    logger.info('Getting imported candidate job invites for client', {
      clientId,
      filters,
      paginationRequest,
      context: 'JobInviteService.getImportedCandidateJobInvites',
    });

    try {
      // Update expired invites before fetching
      await this.updateExpiredInvites(clientId);

      const paginationInfo = getPaginationInfo(paginationRequest);

      // Build where conditions - only include imported candidates
      const whereConditions: any = {
        inviterId: {
          in: await this.getClientUserIds(clientId),
        },
        // Only include imported candidates
        isImportedCandidate: true,
      };

      // Add status filter
      if (filters.status && filters.status.length > 0) {
        whereConditions.status = {
          in: filters.status,
        };
      }

      // Add job ID filter
      if (filters.jobId) {
        whereConditions.jobId = filters.jobId;
      }

      // Add date range filters
      if (filters.startDate || filters.endDate) {
        whereConditions.createdAt = {};
        if (filters.startDate) {
          whereConditions.createdAt.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          whereConditions.createdAt.lte = new Date(filters.endDate);
        }
      }

      // Add search conditions
      if (filters.search) {
        whereConditions.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      // Get total count
      const total = await this.prisma.job_invite.count({
        where: whereConditions,
      });

      // Get invites with pagination, including user relation for real-time name
      const invites = await this.prisma.job_invite.findMany({
        where: whereConditions,
        skip: paginationInfo.skip,
        take: paginationInfo.take,
        orderBy: paginationInfo.orderBy,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Get job posting details for the invites
      const jobIds = [...new Set(invites.map((invite: any) => invite.jobId))];
      const jobPostings = await this.prisma.job_posting.findMany({
        where: {
          id: { in: jobIds },
        },
        select: {
          id: true,
          title: true,
          client: {
            select: {
              id: true,
              company: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      // Get inviter details for the invites
      const inviterIds = [
        ...new Set(invites.map((invite: any) => invite.inviterId)),
      ];
      const inviters = await this.prisma.client_user.findMany({
        where: {
          id: { in: inviterIds },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Get application details for the invites
      const applicationEmails = invites.map((invite: any) => invite.email);
      const applications = await this.prisma.job_application.findMany({
        where: {
          jobPosting: {
            id: { in: jobIds },
          },
          candidate: {
            user: {
              email: { in: applicationEmails },
            },
          },
        },
        include: {
          candidate: {
            include: {
              user: {
                select: {
                  email: true,
                },
              },
            },
          },
        },
      });

      const jobPostingMap = new Map(jobPostings.map((job) => [job.id, job]));
      const inviterMap = new Map(
        inviters.map((inviter) => [inviter.id, inviter])
      );
      const applicationMap = new Map(
        applications.map((app: any) => [app.candidate.user.email, app])
      );

      const totalPages = Math.ceil(total / paginationInfo.take);
      const page = Math.floor(paginationInfo.skip / paginationInfo.take) + 1;

      logger.info('Successfully retrieved imported candidate job invites', {
        total,
        page,
        totalPages,
        context: 'JobInviteService.getImportedCandidateJobInvites',
      });

      return {
        invites: invites.map((invite: any) =>
          this.mapJobInviteToDomainWithApplication(
            invite,
            jobPostingMap.get(invite.jobId),
            inviterMap.get(invite.inviterId),
            applicationMap.get(invite.email)
          )
        ),
        total,
        page,
        limit: paginationInfo.take,
        totalPages,
      };
    } catch (error) {
      logger.error('Failed to get imported candidate job invites', {
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        context: 'JobInviteService.getImportedCandidateJobInvites',
      });
      throw new AppError(
        'Failed to retrieve imported candidate job invites',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get imported candidate job invites for a specific job posting
   * @param clientId - The client ID
   * @param jobPostingId - The job posting ID
   * @param filters - Filter criteria
   * @param paginationRequest - Pagination parameters
   * @returns Paginated list of imported candidate job invites for the specific job
   */
  async getImportedCandidateJobInvitesByJobId(
    clientId: string,
    jobPostingId: string,
    filters: IJobInviteFilters,
    paginationRequest: IPaginationRequest
  ): Promise<IPaginatedResponse<IJobInvite>> {
    logger.info(
      'Getting imported candidate job invites for specific job posting',
      {
        clientId,
        jobPostingId,
        filters,
        paginationRequest,
        context: 'JobInviteService.getImportedCandidateJobInvitesByJobId',
      }
    );

    try {
      // Verify the job posting belongs to the client
      const jobPosting = await this.prisma.job_posting.findFirst({
        where: {
          id: jobPostingId,
          client: {
            id: clientId,
          },
        },
      });

      if (!jobPosting) {
        logger.warn('Job posting not found or does not belong to client', {
          jobPostingId,
          clientId,
          context: 'JobInviteService.getImportedCandidateJobInvitesByJobId',
        });
        throw new AppError('Job posting not found', 404, ErrorCode.NOT_FOUND);
      }

      // Update expired invites before fetching
      await this.updateExpiredInvites(clientId);

      const paginationInfo = getPaginationInfo(paginationRequest);

      // Build where conditions - only include imported candidates for specific job
      const whereConditions: any = {
        jobId: jobPostingId,
        inviterId: {
          in: await this.getClientUserIds(clientId),
        },
        // Only include imported candidates
        isImportedCandidate: true,
      };

      // Add status filter
      if (filters.status && filters.status.length > 0) {
        whereConditions.status = {
          in: filters.status,
        };
      }

      // Add date range filters
      if (filters.startDate || filters.endDate) {
        whereConditions.createdAt = {};
        if (filters.startDate) {
          whereConditions.createdAt.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          whereConditions.createdAt.lte = new Date(filters.endDate);
        }
      }

      // Add search conditions
      if (filters.search) {
        whereConditions.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      // Get total count
      const total = await this.prisma.job_invite.count({
        where: whereConditions,
      });

      // Get invites with pagination, including user relation for real-time name
      const invites = await this.prisma.job_invite.findMany({
        where: whereConditions,
        skip: paginationInfo.skip,
        take: paginationInfo.take,
        orderBy: paginationInfo.orderBy,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Get job posting details for the invites
      const jobIds = [...new Set(invites.map((invite: any) => invite.jobId))];
      const jobPostings = await this.prisma.job_posting.findMany({
        where: {
          id: { in: jobIds },
        },
        select: {
          id: true,
          title: true,
          client: {
            select: {
              id: true,
              company: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      // Get inviter details for the invites
      const inviterIds = [
        ...new Set(invites.map((invite: any) => invite.inviterId)),
      ];
      const inviters = await this.prisma.client_user.findMany({
        where: {
          id: { in: inviterIds },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Get application details for the invites
      const applicationEmails = invites.map((invite: any) => invite.email);
      const applications = await this.prisma.job_application.findMany({
        where: {
          jobPosting: {
            id: { in: jobIds },
          },
          candidate: {
            user: {
              email: { in: applicationEmails },
            },
          },
        },
        include: {
          candidate: {
            include: {
              user: {
                select: {
                  email: true,
                },
              },
            },
          },
        },
      });

      const jobPostingMap = new Map(jobPostings.map((job) => [job.id, job]));
      const inviterMap = new Map(
        inviters.map((inviter) => [inviter.id, inviter])
      );
      const applicationMap = new Map(
        applications.map((app) => [app.candidate.user.email, app])
      );

      const totalPages = Math.ceil(total / paginationInfo.take);
      const page = Math.floor(paginationInfo.skip / paginationInfo.take) + 1;

      logger.info(
        'Successfully retrieved imported candidate job invites for job posting',
        {
          jobPostingId,
          total,
          page,
          totalPages,
          context: 'JobInviteService.getImportedCandidateJobInvitesByJobId',
        }
      );

      return {
        items: invites.map((invite: any) =>
          this.mapJobInviteToDomainWithApplication(
            invite,
            jobPostingMap.get(invite.jobId),
            inviterMap.get(invite.inviterId),
            applicationMap.get(invite.email)
          )
        ),
        pagination: {
          total,
          page,
          limit: paginationInfo.take,
          totalPages,
        },
      };
    } catch (error) {
      logger.error(
        'Failed to get imported candidate job invites for job posting',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          jobPostingId,
          clientId,
          context: 'JobInviteService.getImportedCandidateJobInvitesByJobId',
        }
      );
      throw new AppError(
        'Failed to retrieve imported candidate job invites for job posting',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get all client user IDs for a given client
   * @param clientId - The client ID
   * @returns Array of client user IDs
   */
  private async getClientUserIds(clientId: string): Promise<string[]> {
    const clientUsers = await this.prisma.client_user.findMany({
      where: { clientId },
      select: { id: true },
    });
    return clientUsers.map((user) => user.id);
  }

  /**
   * Map database job invite to domain model
   * @param invite - Database job invite record
   * @returns Domain job invite model
   */
  private mapJobInviteToDomain(
    invite: any,
    jobPosting?: any,
    inviter?: any
  ): any {
    return {
      id: invite.id,
      clientId: jobPosting?.client?.id || '',
      candidateName: invite.name,
      candidateEmail: invite.email,
      jobId: invite.jobId,
      jobTitle: jobPosting?.title || '',
      invitedById: invite.inviterId,
      inviterName: inviter?.user?.name || '',
      message: '', // Not available in job_invite table
      status: invite.status,
      scheduledDate: undefined, // Not available in job_invite table
      expiresAt: invite.expiresAt,
      acceptedAt:
        invite.status === JobInviteStatusEnum.ACCEPTED
          ? invite.updatedAt
          : undefined,
      declinedAt:
        invite.status === JobInviteStatusEnum.DECLINED
          ? invite.updatedAt
          : undefined,
      declineReason: undefined, // Not available in job_invite table
      createdAt: invite.createdAt,
      updatedAt: invite.updatedAt,
      isImportedCandidate: invite.isImportedCandidate,
      integrationId: invite.integrationId,

      // Application status information - will be populated by the service methods
      applicationStatus: undefined,
      applicationId: undefined,
      appliedAt: undefined,
      applicationAcceptedAt: undefined,
      applicationAcceptedBy: undefined,
      applicationAcceptedById: undefined,
      applicationDeclinedAt: undefined,
      applicationDeclinedBy: undefined,
      applicationDeclinedById: undefined,
      applicationNotes: undefined,
      coverLetterUrl: undefined,
    };
  }

  /**
   * Map database job invite to domain model with application data
   * @param invite - Database job invite record (includes user relation)
   * @param jobPosting - Job posting details
   * @param inviter - Inviter details
   * @param application - Application details
   * @returns Domain job invite model with application data
   */
  private mapJobInviteToDomainWithApplication(
    invite: any,
    jobPosting?: any,
    inviter?: any,
    application?: any
  ): any {
    return {
      id: invite.id,
      clientId: jobPosting?.client?.id || '',
      // Prefer actual user name if available, fallback to stored name
      candidateName: invite.user?.name || invite.name,
      candidateEmail: invite.email,
      jobId: invite.jobId,
      jobTitle: jobPosting?.title || '',
      invitedById: invite.inviterId,
      inviterName: inviter?.user?.name || '',
      message: '', // Not available in job_invite table
      status: invite.status,
      scheduledDate: undefined, // Not available in job_invite table
      expiresAt: invite.expiresAt,
      acceptedAt:
        invite.status === JobInviteStatusEnum.ACCEPTED
          ? invite.updatedAt
          : undefined,
      declinedAt:
        invite.status === JobInviteStatusEnum.DECLINED
          ? invite.updatedAt
          : undefined,
      declineReason: undefined, // Not available in job_invite table
      createdAt: invite.createdAt,
      updatedAt: invite.updatedAt,
      isImportedCandidate: invite.isImportedCandidate,
      integrationId: invite.integrationId,

      // Application status information
      applicationStatus: application?.status,
      applicationId: application?.id,
      appliedAt: application?.createdAt,
      applicationAcceptedAt: application?.acceptedAt,
      applicationAcceptedBy: application?.acceptedBy,
      applicationAcceptedById: application?.acceptedById,
      applicationDeclinedAt: application?.declinedAt,
      applicationDeclinedBy: application?.declinedBy,
      applicationDeclinedById: application?.declinedById,
      applicationNotes: application?.notes,
      coverLetterUrl: application?.coverLetterUrl,
    };
  }
}
