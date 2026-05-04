import { singleton } from '@/shared/decorators/singleton';
import { PrismaClient } from '@prisma/client';
import {
  IClientJobPosting,
  IClientJobPostingCreate,
  IClientJobPostingUpdate,
  IClientJobPostingSkillsUpdate,
  IClientJobPostingStatusUpdate,
  IClientJobPostingFilterQuery,
  toClientJobPostingDomain,
  IClientJobAiAssessmentSettings,
  IClientJobAiAssessmentSettingsUpdate,
  toClientJobAiAssessmentSettingsDomain,
  toClientJobPostingListDomain,
} from '@/shared/models/domain/client/job.postings.domain';
import {
  IPaginationRequest,
  IPaginatedResponse,
} from '@/shared/models/api/common/common.api';
import { getPaginationInfo } from '@/utils/pagination';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';
import { IClientJobPostingInvite } from '@/shared/models/domain/client/job.postings.domain';
import {
  IClientJobApplication,
  toClientApplicationDomain,
} from '@/shared/models/domain/client/application.domain';
import { INotificationProvider } from '../notification/notification.interface';
import { NotificationFactory } from '../notification/notification.factory';
import { ENV } from '@/config/env';
import { ClientUserInvitationService } from './user.invitation.service';
import {
  ApplicationStatusEnum,
  UserRoleEnum,
  JobPostingStatusEnum,
  JobInviteStatusEnum,
} from '@/shared/models/common/enums';
import { ClientSubscriptionService } from './subscription.service';
import { PaymentFactory } from '../subscription/payment.factory';
import { ClientUserProfileService } from './user.profile.service';
import { StorageFactory } from '../helpers/storage/storage.factory';
import { ClientSubscriptionLimitsService } from './subscription.limits.service';

import { ClientJobPostingAssessmentService } from './job.posting.assessment.service';
import { JobPostingAssessmentRecommendationEnum } from '@/shared/models/common/enums';
import { JobRecommendationCronService } from '../cron/job.recommendation.cron.service';
import { NodemailerProvider } from '../notification/nodemailer.service';
import { JobPostingRecruiterAssignmentService } from '../support/job.posting.recruiter.assignment.service';
import { IStorageProvider } from '../helpers/storage/storage.interface';

@singleton
export class ClientJobPostingService {
  private readonly prisma: PrismaClient;
  private readonly notificationProvider: INotificationProvider;
  private readonly invitationExpiryHours = 72; // 3 days
  private readonly clientUserInvitationService: ClientUserInvitationService;
  private readonly subscriptionService: ClientSubscriptionService;
  private readonly clientUserProfileService: ClientUserProfileService;
  private readonly subscriptionLimitsService: ClientSubscriptionLimitsService;
  private readonly jobPostingAssessmentService: ClientJobPostingAssessmentService;
  private readonly jobRecommendationCronService: JobRecommendationCronService;
  private readonly recruiterAssignmentService: JobPostingRecruiterAssignmentService;
  private readonly storageService: IStorageProvider;

  constructor() {
    this.prisma = new PrismaClient();
    this.storageService = StorageFactory.getInstance().getProvider();
    this.notificationProvider =
      new NotificationFactory().getNotificationProvider();

    // Initialize required services for ClientUserInvitationService
    const paymentFactory = new PaymentFactory();
    const nodemailerProvider = new NodemailerProvider();
    this.subscriptionService = new ClientSubscriptionService(
      paymentFactory,
      nodemailerProvider
    );
    const storageService = StorageFactory.getInstance().getProvider();

    const clientSubscriptionService = new ClientSubscriptionService(
      new PaymentFactory(),
      nodemailerProvider
    );

    this.clientUserProfileService = new ClientUserProfileService(
      storageService
    );

    this.clientUserInvitationService = new ClientUserInvitationService(
      this.notificationProvider,
      clientSubscriptionService,
      this.clientUserProfileService
    );

    this.subscriptionLimitsService = new ClientSubscriptionLimitsService();
    this.jobPostingAssessmentService = new ClientJobPostingAssessmentService();
    this.jobRecommendationCronService = new JobRecommendationCronService();
    this.recruiterAssignmentService =
      new JobPostingRecruiterAssignmentService();
  }

  /**
   * Create a new job posting
   */
  async createJobPosting(
    clientId: string,
    clientUserId: string,
    jobPostingData: IClientJobPostingCreate
  ): Promise<IClientJobPosting> {
    if (!clientUserId) {
      throw new AppError(
        'Inviter user ID is required',
        400,
        ErrorCode.INVALID_REQUEST
      );
    }

    try {
      // Check subscription limits before creating job posting
      const limitCheck =
        await this.subscriptionLimitsService.checkJobPostingLimit(clientId);

      if (!limitCheck.canCreate) {
        throw new AppError(
          limitCheck.errorMessage || 'Job posting limit exceeded',
          403,
          ErrorCode.SUBSCRIPTION_LIMIT_REACHED
        );
      }

      const clientJobAiAssessmentSettings =
        await this.prisma.client_ai_assessment_settings.findFirst({
          where: {
            clientId,
          },
        });

      // If client doesn't have AI assessment settings, we'll use default values
      // This allows job creation to proceed even without global AI settings

      // Extract AI assessment settings from job posting data
      const { aiAssessmentSettings, ...jobPostingDataWithoutAiSettings } =
        jobPostingData;

      // Prepare AI assessment settings data, filtering out null/undefined JSON fields
      const aiSettingsData: any = {
        greetingMessage:
          aiAssessmentSettings?.greetingMessage ??
          clientJobAiAssessmentSettings?.greetingMessage ??
          'Welcome to the assessment!',
        defaultAssessmentDuration:
          aiAssessmentSettings?.defaultAssessmentDuration ??
          clientJobAiAssessmentSettings?.defaultAssessmentDuration ??
          3600,
        defaultPassingScore:
          aiAssessmentSettings?.defaultPassingScore ??
          clientJobAiAssessmentSettings?.defaultPassingScore ??
          0.7,
        requiredSections: aiAssessmentSettings?.requiredSections ??
          clientJobAiAssessmentSettings?.requiredSections ?? [
            'TECHNICAL',
            'BEHAVIORAL',
          ],
        maximumAttempts:
          aiAssessmentSettings?.maximumAttempts ??
          clientJobAiAssessmentSettings?.maximumAttempts ??
          3,
        cooldownPeriod:
          aiAssessmentSettings?.cooldownPeriod ??
          clientJobAiAssessmentSettings?.cooldownPeriod ??
          7,
        maxAssessmentDuration:
          aiAssessmentSettings?.maxAssessmentDuration ??
          clientJobAiAssessmentSettings?.maxAssessmentDuration ??
          7200,
        assessmentBuffer:
          aiAssessmentSettings?.assessmentBuffer ??
          clientJobAiAssessmentSettings?.assessmentBuffer ??
          300,
        useCustomPrompts:
          aiAssessmentSettings?.useCustomPrompts ??
          clientJobAiAssessmentSettings?.useCustomPrompts ??
          false,
        aiDifficulty:
          aiAssessmentSettings?.aiDifficulty ??
          clientJobAiAssessmentSettings?.aiDifficulty ??
          'MEDIUM',
        proctoringEnabled:
          aiAssessmentSettings?.proctoringEnabled ??
          clientJobAiAssessmentSettings?.proctoringEnabled ??
          true,
        maxWarnings:
          aiAssessmentSettings?.maxWarnings ??
          clientJobAiAssessmentSettings?.maxWarnings ??
          3,
        tabSwitchLimit:
          aiAssessmentSettings?.tabSwitchLimit ??
          clientJobAiAssessmentSettings?.tabSwitchLimit ??
          3,
        copyPasteAllowed:
          aiAssessmentSettings?.copyPasteAllowed ??
          clientJobAiAssessmentSettings?.copyPasteAllowed ??
          false,
        videoRecordingEnabled:
          aiAssessmentSettings?.videoRecordingEnabled ??
          clientJobAiAssessmentSettings?.videoRecordingEnabled ??
          true,
        minimumVideoLength:
          aiAssessmentSettings?.minimumVideoLength ??
          clientJobAiAssessmentSettings?.minimumVideoLength ??
          300,
        aiVideoAnalysisEnabled:
          aiAssessmentSettings?.aiVideoAnalysisEnabled ??
          clientJobAiAssessmentSettings?.aiVideoAnalysisEnabled ??
          true,
        autoPublishOnSuccess:
          aiAssessmentSettings?.autoPublishOnSuccess ??
          clientJobAiAssessmentSettings?.autoPublishOnSuccess ??
          false,
        autoNotifyOnComplete:
          aiAssessmentSettings?.autoNotifyOnComplete ??
          clientJobAiAssessmentSettings?.autoNotifyOnComplete ??
          true,
        maxSections:
          aiAssessmentSettings?.maxSections ??
          clientJobAiAssessmentSettings?.maxSections ??
          5,
        maxQuestionsPerSection:
          aiAssessmentSettings?.maxQuestionsPerSection ??
          clientJobAiAssessmentSettings?.maxQuestionsPerSection ??
          5,
        customInstructions:
          aiAssessmentSettings?.customInstructions ??
          clientJobAiAssessmentSettings?.customInstructions ??
          '',
        interviewLanguage:
          (aiAssessmentSettings as any)?.interviewLanguage ??
          (clientJobAiAssessmentSettings as any)?.interviewLanguage ??
          'ENGLISH',
        interviewDialect:
          (aiAssessmentSettings as any)?.interviewDialect ??
          (clientJobAiAssessmentSettings as any)?.interviewDialect ??
          'en-US',
        interviewVoiceGender:
          (aiAssessmentSettings as any)?.interviewVoiceGender ??
          (clientJobAiAssessmentSettings as any)?.interviewVoiceGender ??
          'female',
      };

      // Only add JSON fields if they have values
      if (
        aiAssessmentSettings?.customPrompts ||
        clientJobAiAssessmentSettings?.customPrompts
      ) {
        aiSettingsData.customPrompts =
          aiAssessmentSettings?.customPrompts ??
          clientJobAiAssessmentSettings?.customPrompts;
      }
      if (
        aiAssessmentSettings?.skillWeightings ||
        clientJobAiAssessmentSettings?.skillWeightings
      ) {
        aiSettingsData.skillWeightings =
          aiAssessmentSettings?.skillWeightings ??
          clientJobAiAssessmentSettings?.skillWeightings;
      }
      if (
        aiAssessmentSettings?.sectionTemplates ||
        clientJobAiAssessmentSettings?.sectionTemplates
      ) {
        aiSettingsData.sectionTemplates =
          aiAssessmentSettings?.sectionTemplates ??
          clientJobAiAssessmentSettings?.sectionTemplates;
      }
      if (
        aiAssessmentSettings?.questionTemplates ||
        clientJobAiAssessmentSettings?.questionTemplates
      ) {
        aiSettingsData.questionTemplates =
          aiAssessmentSettings?.questionTemplates ??
          clientJobAiAssessmentSettings?.questionTemplates;
      }
      if (
        aiAssessmentSettings?.customStyles ||
        clientJobAiAssessmentSettings?.customStyles
      ) {
        aiSettingsData.customStyles =
          aiAssessmentSettings?.customStyles ??
          clientJobAiAssessmentSettings?.customStyles;
      }

      // Create the job posting
      const jobPosting = await this.prisma.job_posting.create({
        data: {
          ...jobPostingDataWithoutAiSettings,
          clientId,
          candidateShortlists: {
            create: jobPostingDataWithoutAiSettings.candidateShortlists,
          },
          createdById: clientUserId,
          status: JobPostingStatusEnum.DRAFT, // Default status
          numberOfViews: 0,
          numberOfApplications: 0,
          jobPostingAiAssessmentSettings: {
            create: aiSettingsData,
          },
        },
        include: {
          client: true,
          applications: true,
        },
      });

      // Increment job posting usage
      await this.subscriptionLimitsService.incrementJobPostingUsage(clientId);

      // Invite hiring manager if email is present and not a user
      if (jobPostingData.hiring_manager_email) {
        const existingUser = await this.prisma.user.findUnique({
          where: { email: jobPostingData.hiring_manager_email },
        });
        if (!existingUser) {
          try {
            // Resolve inviter userId from clientUserId
            const clientUser = await this.prisma.client_user.findUnique({
              where: { id: clientUserId },
            });
            if (!clientUser) {
              throw new AppError(
                'Client user not found',
                404,
                ErrorCode.NOT_FOUND
              );
            }
            const inviterUserId = clientUser.userId;
            logger.info({
              message: 'Inviting hiring manager',
              context: 'ClientJobPostingService.createJobPosting',
              inviterUserId,
              clientId,
              hiring_manager_email: jobPostingData.hiring_manager_email,
            });
            await this.clientUserInvitationService.sendInvitation(
              clientId,
              inviterUserId,
              {
                email: jobPostingData.hiring_manager_email,
                name: 'Hiring Manager', // You may want to allow name input
                jobTitle: 'Hiring Manager',
                role: UserRoleEnum.HR, // Use enum for role
              }
            );
          } catch (inviteError) {
            logger.error({
              message: 'Failed to invite hiring manager',
              context: 'ClientJobPostingService.createJobPosting',
              error:
                inviteError instanceof Error
                  ? inviteError.message
                  : inviteError,
              hiring_manager_email: jobPostingData.hiring_manager_email,
            });
            // Do not throw, just log
          }
        }
      }

      // Convert to domain model
      return toClientJobPostingDomain(jobPosting);
    } catch (error) {
      logger.error({
        message: 'Failed to create job posting',
        context: 'ClientJobPostingService.createJobPosting',
        error: error instanceof Error ? error.message : 'Unknown error',
        jobPostingData,
      });
      throw error;
    }
  }

  /**
   * Update an existing job posting
   */
  async updateJobPosting(
    clientId: string,
    jobPostingId: string,
    updateData: IClientJobPostingUpdate,
    clientUserId: string
  ): Promise<IClientJobPosting> {
    if (!clientUserId) {
      throw new AppError(
        'Inviter user ID is required',
        400,
        ErrorCode.INVALID_REQUEST
      );
    }
    try {
      // Check if job posting exists and belongs to the client
      const existingJobPosting = await this.prisma.job_posting.findFirst({
        where: {
          id: jobPostingId,
          clientId,
        },
      });

      if (!existingJobPosting) {
        throw new AppError('Job posting not found', 404, ErrorCode.NOT_FOUND);
      }

      // Extract AI assessment settings from update data
      const {
        aiAssessmentSettings,
        candidateShortlists,
        ...updateDataWithoutAiSettings
      } = updateData;

      // Update the job posting
      const updatedJobPosting = await this.prisma.job_posting.update({
        where: {
          id: jobPostingId,
        },
        data: {
          ...updateDataWithoutAiSettings,
          ...(candidateShortlists && {
            candidateShortlists: {
              create: candidateShortlists,
            },
          }),
        },
        include: {
          client: true,
          applications: true,
          jobPostingAiAssessmentSettings: true,
        },
      });

      // Update AI assessment settings if provided
      if (
        aiAssessmentSettings &&
        updatedJobPosting.jobPostingAiAssessmentSettings
      ) {
        const updatedAiSettings =
          await this.prisma.job_posting_ai_assessment_settings.update({
            where: {
              id: updatedJobPosting.jobPostingAiAssessmentSettings.id,
            },
            data: aiAssessmentSettings,
          });

        // Update the response object with fresh AI assessment settings,
        // ensuring all required fields are present for type compatibility
        updatedJobPosting.jobPostingAiAssessmentSettings = {
          ...updatedJobPosting.jobPostingAiAssessmentSettings,
          ...updatedAiSettings,
        };
      }

      // Invite hiring manager if email is present and not a user
      if (updateData.hiring_manager_email) {
        const existingUser = await this.prisma.user.findUnique({
          where: { email: updateData.hiring_manager_email },
        });
        if (!existingUser) {
          try {
            // Resolve inviter userId from clientUserId
            const clientUser = await this.prisma.client_user.findUnique({
              where: { id: clientUserId },
            });
            if (!clientUser) {
              throw new AppError(
                'Client user not found',
                404,
                ErrorCode.NOT_FOUND
              );
            }
            const inviterUserId = clientUser.userId;
            logger.info({
              message: 'Inviting hiring manager',
              context: 'ClientJobPostingService.updateJobPosting',
              inviterUserId,
              clientId,
              hiring_manager_email: updateData.hiring_manager_email,
            });
            await this.clientUserInvitationService.sendInvitation(
              clientId,
              inviterUserId,
              {
                email: updateData.hiring_manager_email,
                name: 'Hiring Manager', // You may want to allow name input
                jobTitle: 'Hiring Manager',
                role: UserRoleEnum.HR, // Use enum for role
              }
            );
          } catch (inviteError) {
            logger.error({
              message: 'Failed to invite hiring manager',
              context: 'ClientJobPostingService.updateJobPosting',
              error:
                inviteError instanceof Error
                  ? inviteError.message
                  : inviteError,
              hiring_manager_email: updateData.hiring_manager_email,
            });
            // Do not throw, just log
          }
        }
      }

      // Auto-assign recruiter after successful job posting update
      try {
        logger.info('Auto-assigning recruiter to updated job posting', {
          context: 'ClientJobPostingService.updateJobPosting',
          jobPostingId,
          clientId,
        });

        await this.recruiterAssignmentService.assignRecruiterToJobPosting(
          jobPostingId,
          clientId,
          clientUserId
        );

        logger.info('Recruiter auto-assignment completed successfully', {
          context: 'ClientJobPostingService.updateJobPosting',
          jobPostingId,
          clientId,
        });
      } catch (assignmentError) {
        logger.warn('Failed to auto-assign recruiter to job posting', {
          context: 'ClientJobPostingService.updateJobPosting',
          error:
            assignmentError instanceof Error
              ? assignmentError.message
              : assignmentError,
          jobPostingId,
          clientId,
        });
        // Don't throw error - job posting update was successful, recruiter assignment is optional
      }

      // Convert to domain model
      return toClientJobPostingDomain(updatedJobPosting);
    } catch (error) {
      logger.error({
        message: 'Failed to update job posting',
        context: 'ClientJobPostingService.updateJobPosting',
        error: error instanceof Error ? error.message : 'Unknown error',
        jobPostingId,
        updateData,
      });
      throw error;
    }
  }

  /**
   * Update job posting skills
   */
  async updateJobPostingSkills(
    clientId: string,
    jobPostingId: string,
    skillsData: IClientJobPostingSkillsUpdate
  ): Promise<IClientJobPosting> {
    try {
      // Check if job posting exists and belongs to the client
      const existingJobPosting = await this.prisma.job_posting.findFirst({
        where: {
          id: jobPostingId,
          clientId,
        },
      });

      if (!existingJobPosting) {
        throw new AppError('Job posting not found', 404, ErrorCode.NOT_FOUND);
      }

      // Update the job posting skills
      const updatedJobPosting = await this.prisma.job_posting.update({
        where: {
          id: jobPostingId,
        },
        data: skillsData,
        include: {
          client: true,
          applications: true,
        },
      });

      // Convert to domain model
      return toClientJobPostingDomain(updatedJobPosting);
    } catch (error) {
      logger.error({
        message: 'Failed to update job posting skills',
        context: 'ClientJobPostingService.updateJobPostingSkills',
        error: error instanceof Error ? error.message : 'Unknown error',
        jobPostingId,
        skillsData,
      });
      throw error;
    }
  }

  /**
   * Update job posting status
   */
  async updateJobPostingStatus(
    clientId: string,
    jobPostingId: string,
    statusData: IClientJobPostingStatusUpdate
  ): Promise<IClientJobPosting> {
    try {
      // Check if job posting exists and belongs to the client
      const existingJobPosting = await this.prisma.job_posting.findFirst({
        where: {
          id: jobPostingId,
          clientId,
        },
      });

      if (!existingJobPosting) {
        throw new AppError('Job posting not found', 404, ErrorCode.NOT_FOUND);
      }

      // If updating status to PUBLISHED, validate assessment recommendation first
      if (statusData.status === JobPostingStatusEnum.PUBLISHED) {
        logger.info('Validating job posting assessment before publishing', {
          context: 'ClientJobPostingService.updateJobPostingStatus',
          jobPostingId,
          title: existingJobPosting.title,
        });

        try {
          // Get the latest assessment for this job posting
          const latestAssessment =
            await this.jobPostingAssessmentService.getLatestAssessmentForJobPosting(
              jobPostingId,
              clientId
            );

          // Check if assessment recommendation allows publishing
          const allowedRecommendations = [
            JobPostingAssessmentRecommendationEnum.HIGHLY_RECOMMENDED,
            JobPostingAssessmentRecommendationEnum.RECOMMENDED,
          ];

          if (
            !latestAssessment?.recommendation ||
            !allowedRecommendations.includes(latestAssessment?.recommendation)
          ) {
            throw new AppError(
              'Job posting can only be published when assessment recommendation is "Highly Recommended" or "Recommended"',
              400,
              ErrorCode.JOB_POSTING_ASSESSMENT_VALIDATION_FAILED
            );
          }

          logger.info('Job posting assessment validation passed', {
            context: 'ClientJobPostingService.updateJobPostingStatus',
            jobPostingId,
            recommendation: latestAssessment.recommendation,
            score: latestAssessment?.score,
          });
        } catch (validationError) {
          logger.warn('Job posting assessment validation failed', {
            context: 'ClientJobPostingService.updateJobPostingStatus',
            jobPostingId,
            title: existingJobPosting.title,
            validationError:
              validationError instanceof Error
                ? validationError.message
                : 'Unknown validation error',
          });

          throw validationError;
        }
      }

      // Prepare update data - automatically set isPublished when status becomes PUBLISHED
      const updateData: any = {
        ...statusData,
      };

      // Set isPublished based on status
      if (statusData.status === JobPostingStatusEnum.PUBLISHED) {
        updateData.isPublished = true;
      } else if (existingJobPosting.status === JobPostingStatusEnum.PUBLISHED) {
        // If changing from PUBLISHED to another status, set isPublished to false
        updateData.isPublished = false;
      }

      // Debug logging for update data
      logger.info({
        message: 'Job posting status update data prepared',
        context: 'ClientJobPostingService.updateJobPostingStatus',
        jobPostingId,
        statusData,
        existingStatus: existingJobPosting.status,
        existingIsPublished: existingJobPosting.isPublished,
        updateData,
        isPublishing: statusData.status === JobPostingStatusEnum.PUBLISHED,
        isUnpublishing:
          statusData.status !== JobPostingStatusEnum.PUBLISHED &&
          existingJobPosting.status === JobPostingStatusEnum.PUBLISHED,
        willSetIsPublished: updateData.isPublished,
      });

      // Update the job posting status
      const updatedJobPosting = await this.prisma.job_posting.update({
        where: {
          id: jobPostingId,
        },
        data: updateData,
        include: {
          client: true,
          applications: true,
        },
      });

      // Debug logging for database update
      logger.info({
        message: 'Job posting database update completed',
        context: 'ClientJobPostingService.updateJobPostingStatus',
        jobPostingId,
        updateData,
        updatedJobPosting: {
          id: updatedJobPosting.id,
          status: updatedJobPosting.status,
          isPublished: updatedJobPosting.isPublished,
        },
      });

      // Debug logging after update
      logger.info({
        message: 'Job posting status update completed',
        context: 'ClientJobPostingService.updateJobPostingStatus',
        jobPostingId,
        finalStatus: updatedJobPosting.status,
        finalIsPublished: updatedJobPosting.isPublished,
        domainIsPublished:
          toClientJobPostingDomain(updatedJobPosting).isPublished,
        rawIsPublished: updatedJobPosting.isPublished,
        rawIsPublishedType: typeof updatedJobPosting.isPublished,
      });

      // Convert to domain model
      return toClientJobPostingDomain(updatedJobPosting);
    } catch (error) {
      logger.error({
        message: 'Failed to update job posting status',
        context: 'ClientJobPostingService.updateJobPostingStatus',
        error: error instanceof Error ? error.message : 'Unknown error',
        jobPostingId,
        status: statusData.status,
      });
      throw error;
    }
  }

  /**
   * Get a job posting by ID
   */
  async getJobPosting(
    clientId: string,
    jobPostingId: string
  ): Promise<IClientJobPosting> {
    try {
      // Find the job posting
      const jobPosting = await this.prisma.job_posting.findFirst({
        where: {
          id: jobPostingId,
          clientId,
        },
        include: {
          client: true,
          applications: true,
        },
      });

      if (!jobPosting) {
        throw new AppError('Job posting not found', 404, ErrorCode.NOT_FOUND);
      }

      // Convert to domain model
      return toClientJobPostingDomain(jobPosting);
    } catch (error) {
      logger.error({
        message: 'Failed to get job posting',
        context: 'ClientJobPostingService.getJobPosting',
        error: error instanceof Error ? error.message : 'Unknown error',
        jobPostingId,
      });
      throw error;
    }
  }

  async getPublicJobPosting(jobPostingId: string): Promise<IClientJobPosting> {
    try {
      const jobPosting = await this.prisma.job_posting.findFirst({
        where: {
          id: jobPostingId,
        },
        include: {
          client: {
            include: {
              company: true,
            },
          },
        },
      });

      if (!jobPosting) {
        throw new AppError('Job posting not found', 404, ErrorCode.NOT_FOUND);
      }

      if (
        jobPosting.client.company.logo &&
        !jobPosting.client.company.logo.startsWith('http')
      ) {
        const presignedUrl = await this.storageService.generatePreSignedUrl(
          jobPosting.client.company.logo,
          'read'
        );
        jobPosting.client.company.logo = presignedUrl;
      }

      return toClientJobPostingDomain(jobPosting);
    } catch (error) {
      logger.error({
        message: 'Failed to get public job posting',
        context: 'ClientJobPostingService.getPublicJobPosting',
        error: error instanceof Error ? error.message : 'Unknown error',
        jobPostingId,
      });
      throw error;
    }
  }

  /**
   * Delete a job posting
   */
  async deleteJobPosting(
    clientId: string,
    jobPostingId: string
  ): Promise<void> {
    try {
      // Check if job posting exists and belongs to the client
      const existingJobPosting = await this.prisma.job_posting.findFirst({
        where: {
          id: jobPostingId,
          clientId,
        },
      });

      if (!existingJobPosting) {
        throw new AppError('Job posting not found', 404, ErrorCode.NOT_FOUND);
      }

      // Delete the job posting
      await this.prisma.job_posting.delete({
        where: {
          id: jobPostingId,
        },
      });
    } catch (error) {
      logger.error({
        message: 'Failed to delete job posting',
        context: 'ClientJobPostingService.deleteJobPosting',
        error: error instanceof Error ? error.message : 'Unknown error',
        jobPostingId,
      });
      throw error;
    }
  }

  /**
   * List job postings with optional filtering
   */
  async listJobPostings(
    clientId: string,
    filter: IClientJobPostingFilterQuery,
    paginationRequest: IPaginationRequest
  ): Promise<IPaginatedResponse<IClientJobPosting>> {
    try {
      // Get pagination info
      const paginationInfo = getPaginationInfo(paginationRequest);

      // Build where clause for filtering
      const where = {
        clientId,
        ...(paginationRequest.search && {
          OR: [
            {
              title: {
                contains: paginationRequest.search,
                mode: 'insensitive' as const,
              },
            },
            {
              department: {
                contains: paginationRequest.search,
                mode: 'insensitive' as const,
              },
            },
          ],
        }),
        ...(filter.jobType && { jobType: filter.jobType }),
        ...(filter.industry && { industry: filter.industry }),
        ...(filter.status && { status: filter.status }),
        ...(filter.isRemote !== undefined && { isRemote: filter.isRemote }),
        ...(filter.minSalary && { minSalary: { gte: filter.minSalary } }),
        ...(filter.maxSalary && { maxSalary: { lte: filter.maxSalary } }),
        ...(filter.requiredSkills && {
          requiredSkills: {
            hasSome: filter.requiredSkills,
          },
        }),
      };

      // Find job postings with pagination and filtering
      const jobPostings = await this.prisma.job_posting.findMany({
        where,
        include: {
          candidateShortlists: true,
          client: true,
          recommendations: true,
          applications: {
            where: {
              status: {
                in: [
                  ApplicationStatusEnum.ACCEPTED,
                  ApplicationStatusEnum.APPLIED,
                ],
              },
            },
            include: {
              candidate: {
                include: {
                  user: {
                    select: {
                      name: true,
                      jobTitle: true,
                      email: true,
                      role: true,
                      type: true,
                      image: true,
                    },
                  },
                  resume: true,
                },
              },
            },
          },
        },
        ...paginationInfo,
      });

      // Count total matching records
      const total = await this.prisma.job_posting.count({ where });

      // Return paginated response
      return {
        items: jobPostings.map(toClientJobPostingListDomain),
        pagination: {
          total,
          page: paginationInfo.skip,
          limit: paginationInfo.take,
          totalPages: Math.ceil(total / paginationInfo.take),
        },
      };
    } catch (error) {
      logger.error({
        message: 'Failed to list job postings',
        context: 'ClientJobPostingService.listJobPostings',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        filter,
      });
      throw error;
    }
  }

  /**
   * Invite a candidate to a job posting
   */
  async inviteCandidate(
    clientId: string,
    jobPostingId: string,
    inviteData: IClientJobPostingInvite,
    _clientUserId: string
  ): Promise<IClientJobApplication> {
    try {
      // Check if job posting exists and belongs to the client
      const existingJobPosting = await this.prisma.job_posting.findFirst({
        where: {
          id: jobPostingId,
          clientId,
        },
      });

      if (!existingJobPosting) {
        throw new AppError('Job posting not found', 404, ErrorCode.NOT_FOUND);
      }

      // Check if candidate exists
      const candidate = await this.prisma.candidate.findUnique({
        where: {
          id: inviteData.candidateId,
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      if (!candidate) {
        throw new AppError('Candidate not found', 404, ErrorCode.NOT_FOUND);
      }

      // Check if application already exists
      const existingApplication = await this.prisma.job_application.findFirst({
        where: {
          jobPostingId,
          candidateId: inviteData.candidateId,
        },
      });

      if (existingApplication) {
        throw new AppError(
          'Candidate has already been invited',
          400,
          ErrorCode.JOB_APPLICATION_ALREADY_EXISTS
        );
      }

      // Check if job_invite already exists for this client (unique constraint on jobId + email + isSupportInvite)
      const existingJobInvite = await this.prisma.job_invite.findFirst({
        where: {
          jobId: jobPostingId,
          email: candidate.user.email,
          isSupportInvite: false, // Check for client invites only
        },
      });

      let jobInvites;
      if (existingJobInvite) {
        // Use existing invite
        jobInvites = existingJobInvite;
        logger.info({
          message: 'Job invite already exists, using existing invite',
          context: 'ClientJobPostingService.inviteCandidate',
          jobInvites,
        });
      } else {
        // Create new invite
        jobInvites = await this.prisma.job_invite.create({
          data: {
            jobId: jobPostingId,
            status: JobInviteStatusEnum.PENDING,
            email: candidate.user.email,
            name: candidate.user.name,
            inviterId: _clientUserId,
            expiresAt: new Date(
              Date.now() + this.invitationExpiryHours * 60 * 60 * 1000
            ),
          },
        });
        logger.info({
          message: 'Job invite created',
          context: 'ClientJobPostingService.inviteCandidate',
          jobInvites,
        });
      }

      const jobPosting = await this.prisma.job_posting.findUnique({
        where: {
          id: jobPostingId,
        },
        include: {
          client: {
            include: {
              company: true,
            },
          },
        },
      });

      // Create job application with INVITED status
      const application = await this.prisma.job_application.create({
        data: {
          jobPostingId,
          candidateId: inviteData.candidateId,
          status: 'INVITED',
          coverLetterUrl: inviteData.coverLetterUrl,
        },
      });

      // Link the invite to the application
      await this.prisma.job_invite.update({
        where: { id: jobInvites.id },
        data: { jobApplicationId: application.id },
      });

      logger.info('Linked invite to application', {
        inviteId: jobInvites.id,
        applicationId: application.id,
        context: 'ClientJobPostingService.inviteCandidate',
      });

      // Check if candidate exists in job posting recommendations and update isInvited flag
      const existingRecommendation =
        await this.prisma.job_posting_recommendation.findUnique({
          where: {
            jobPostingId_candidateId: {
              jobPostingId,
              candidateId: inviteData.candidateId,
            },
          },
        });

      if (existingRecommendation) {
        // Update job recommendation as invited
        await this.prisma.job_posting_recommendation.update({
          where: {
            id: existingRecommendation.id,
          },
          data: {
            isInvited: true,
          },
        });
        logger.info({
          message: 'Updated job recommendation isInvited flag',
          context: 'ClientJobPostingService.inviteCandidate',
          recommendationId: existingRecommendation.id,
          jobPostingId,
          candidateId: inviteData.candidateId,
        });
      }

      const invitationUrl = `${ENV.FRONTEND_URL}/app/candidate/assessment-invites`;

      // Send email to candidate
      await this.notificationProvider.sendClientUserInvitationEmail(
        candidate.user.email,
        candidate.user.name,
        jobPosting?.client?.company?.name || '',
        jobPosting?.client?.company?.name || '',
        invitationUrl,
        'candidate',
        this.invitationExpiryHours
      );

      // Return enhanced application data with invite information
      const enhancedApplication = {
        ...application,
        jobInvite: jobInvites,
        candidate: candidate,
        jobPosting: jobPosting,
      };

      return toClientApplicationDomain(enhancedApplication);
    } catch (error) {
      logger.error({
        message: 'Failed to invite candidate',
        context: 'ClientJobPostingService.inviteCandidate',
        error: error instanceof Error ? error.message : 'Unknown error',
        jobPostingId,
        candidateId: inviteData.candidateId,
      });
      throw error;
    }
  }

  /**
   * Get AI assessment settings for a job posting
   */
  async getJobPostingAiAssessmentSettings(
    clientId: string,
    jobPostingId: string
  ): Promise<IClientJobAiAssessmentSettings> {
    try {
      // Check if job posting exists and belongs to the client
      const jobPosting = await this.prisma.job_posting.findFirst({
        where: {
          id: jobPostingId,
          clientId,
        },
        include: {
          jobPostingAiAssessmentSettings: true,
        },
      });

      if (!jobPosting) {
        throw new AppError('Job posting not found', 404, ErrorCode.NOT_FOUND);
      }

      if (!jobPosting.jobPostingAiAssessmentSettings) {
        throw new AppError(
          'AI assessment settings not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      return toClientJobAiAssessmentSettingsDomain(
        jobPosting.jobPostingAiAssessmentSettings
      );
    } catch (error) {
      logger.error({
        message: 'Failed to get job posting AI assessment settings',
        context: 'ClientJobPostingService.getJobPostingAiAssessmentSettings',
        error: error instanceof Error ? error.message : 'Unknown error',
        jobPostingId,
      });
      throw error;
    }
  }

  /**
   * Update AI assessment settings for a job posting
   */
  async updateJobPostingAiAssessmentSettings(
    clientId: string,
    jobPostingId: string,
    updateData: IClientJobAiAssessmentSettingsUpdate
  ): Promise<IClientJobAiAssessmentSettings> {
    try {
      // Check if job posting exists and belongs to the client
      const jobPosting = await this.prisma.job_posting.findFirst({
        where: {
          id: jobPostingId,
          clientId,
        },
        include: {
          jobPostingAiAssessmentSettings: true,
        },
      });

      if (!jobPosting) {
        throw new AppError('Job posting not found', 404, ErrorCode.NOT_FOUND);
      }

      if (!jobPosting.jobPostingAiAssessmentSettings) {
        throw new AppError(
          'AI assessment settings not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Update the settings
      const updatedSettings =
        await this.prisma.job_posting_ai_assessment_settings.update({
          where: {
            id: jobPosting.jobPostingAiAssessmentSettings.id,
          },
          data: updateData,
        });

      return toClientJobAiAssessmentSettingsDomain(updatedSettings);
    } catch (error) {
      logger.error({
        message: 'Failed to update job posting AI assessment settings',
        context: 'ClientJobPostingService.updateJobPostingAiAssessmentSettings',
        error: error instanceof Error ? error.message : 'Unknown error',
        jobPostingId,
        updateData,
      });
      throw error;
    }
  }

  async getJobsById(jobIds: string[]): Promise<IClientJobPosting[]> {
    const jobs = await this.prisma.job_posting.findMany({
      where: {
        id: {
          in: jobIds,
        },
      },
      include: {
        client: {
          include: {
            company: true,
          },
        },
      },
    });

    return jobs.map(toClientJobPostingDomain);
  }
}
