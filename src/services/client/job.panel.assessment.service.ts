import { Prisma, PrismaClient } from '@prisma/client';
import { singleton } from '@/shared/decorators/singleton';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';

import {
  IClientJobPanelAssessmentSlot,
  IClientJobPanelAssessmentInvitation,
  IClientJobPanelAssessmentSlotWithAvailability,
  IClientJobPanelAssessmentSlotCreate,
  IClientJobPanelAssessmentSlotUpdate,
  IClientJobPanelAssessmentInvitationCreate,
  IClientJobPanelAssessmentFeedback,
  IClientJobPanelAssessment,
} from '@/shared/models/domain/client/job.panel.assessment.domain';
import {
  JobPanelAssessmentStatusEnum,
  JobPanelAssessmentResultEnum,
  JobPanelAssessmentInvitationStatusEnum,
  JobPanelAssessmentSlotStatusEnum,
  JobPanelAssessmentFeedbackDecisionEnum,
  JobPanelAssessmentRecommendationEnum,
  InterviewTypeEnum,
} from '@/shared/models/common/enums';
import {
  IPaginationRequest,
  IPaginatedResponse,
} from '@/shared/models/api/common/common.api';
import { INotificationProvider } from '@/services/notification/notification.interface';
import {
  TeamsService,
  ITeamsMeetingRequest,
  ITeamsMeetingResponse,
} from '@/services/teams/teams.service';
import { toIAuthUser } from '@/shared/models/domain/auth/auth.user.domain';
import { getAuthToken } from '@/utils/generate.token';
import { ENV } from '@/config/env';
import {
  IScheduledInterviewItem,
  IScheduledPanelAssessmentMeetingDetails,
} from '@/shared/models/api/client/job.panel.assessment.api';

@singleton
export class ClientJobPanelAssessmentService {
  private readonly prisma: PrismaClient;

  constructor(
    private readonly notificationProvider?: INotificationProvider,
    private readonly teamsService?: TeamsService
  ) {
    this.prisma = new PrismaClient();

    // If TeamsService is not provided, instantiate it
    if (!this.teamsService) {
      this.teamsService = new TeamsService();
    }
  }

  // Panel Assessment Slot Operations
  async createPanelAssessmentSlot(
    clientId: string,
    createdById: string,
    data: IClientJobPanelAssessmentSlotCreate
  ): Promise<{
    slots: IClientJobPanelAssessmentSlot[];
    message: string;
  }> {
    try {
      logger.info('Creating panel assessment slot(s)', {
        context: 'ClientJobPanelAssessmentService.createPanelAssessmentSlot',
        clientId,
        jobApplicationId: data.jobApplicationId,
        slotsCount: data.slots.length,
      });

      // Verify job application belongs to client and get candidate info
      const jobApplication = await this.prisma.job_application.findFirst({
        where: {
          id: data.jobApplicationId,
          jobPosting: {
            clientId,
          },
        },
        include: {
          jobPosting: true,
          candidate: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!jobApplication) {
        throw new AppError(
          'Job application not found or access denied',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Find or create panel assessment
      let panelAssessment = await this.prisma.job_panel_assessment.findFirst({
        where: {
          jobApplicationId: data.jobApplicationId,
          candidateId: jobApplication.candidateId,
        },
      });

      if (!panelAssessment) {
        panelAssessment = await this.prisma.job_panel_assessment.create({
          data: {
            candidateId: jobApplication.candidateId,
            jobApplicationId: data.jobApplicationId,
            status: JobPanelAssessmentStatusEnum.NOT_STARTED,
          },
        });
      }

      // Get existing slots for conflict checking
      const existingSlots =
        await this.prisma.job_panel_assessment_slots.findMany({
          where: {
            clientId,
            panelAssessmentId: panelAssessment.id,
            status: { not: JobPanelAssessmentSlotStatusEnum.CANCELLED },
          },
        });

      // Check for conflicts between new slots and existing slots
      for (const newSlot of data.slots) {
        for (const existingSlot of existingSlots) {
          if (this.slotsOverlap(newSlot, existingSlot)) {
            const startTime =
              newSlot.startDateTime instanceof Date
                ? newSlot.startDateTime.toISOString()
                : new Date(newSlot.startDateTime).toISOString();
            const endTime =
              newSlot.endDateTime instanceof Date
                ? newSlot.endDateTime.toISOString()
                : new Date(newSlot.endDateTime).toISOString();
            throw new AppError(
              `Time slot ${startTime} - ${endTime} conflicts with existing slot`,
              400,
              ErrorCode.VALIDATION_ERROR
            );
          }
        }
      }

      // Check for conflicts between new slots themselves
      for (let i = 0; i < data.slots.length; i++) {
        for (let j = i + 1; j < data.slots.length; j++) {
          if (this.slotsOverlap(data.slots[i], data.slots[j])) {
            const start1 =
              data.slots[i].startDateTime instanceof Date
                ? data.slots[i].startDateTime.toISOString()
                : new Date(data.slots[i].startDateTime).toISOString();
            const start2 =
              data.slots[j].startDateTime instanceof Date
                ? data.slots[j].startDateTime.toISOString()
                : new Date(data.slots[j].startDateTime).toISOString();
            throw new AppError(
              `Time slots ${start1} and ${start2} overlap`,
              400,
              ErrorCode.VALIDATION_ERROR
            );
          }
        }
      }

      // Create all slots in a transaction
      const createdSlots = await this.prisma.$transaction(async (tx) => {
        const slots = [];

        for (const slotData of data.slots) {
          const slot = await tx.job_panel_assessment_slots.create({
            data: {
              clientId,
              panelAssessmentId: panelAssessment.id,
              createdById,
              startDateTime: slotData.startDateTime,
              endDateTime: slotData.endDateTime,
              timeZone: slotData.timeZone,
              panelMemberEmails: slotData.panelMemberEmails,
              panelMemberNames: slotData.panelMemberNames,
              hostEmail: slotData.hostEmail,
              hostName: slotData.hostName,
            },
          });
          slots.push(slot);
        }

        return slots;
      });

      const mappedSlots = createdSlots.map((slot) =>
        this.toPanelAssessmentSlotDomain(slot as IClientJobPanelAssessmentSlot)
      );

      const message =
        data.slots.length === 1
          ? 'Successfully created 1 time slot'
          : `Successfully created ${data.slots.length} time slots`;

      logger.info('Panel assessment slot(s) created successfully', {
        context: 'ClientJobPanelAssessmentService.createPanelAssessmentSlot',
        clientId,
        jobApplicationId: data.jobApplicationId,
        slotsCreated: mappedSlots.length,
      });

      return {
        slots: mappedSlots,
        message,
      };
    } catch (error) {
      logger.error('Failed to create panel assessment slot(s)', {
        context: 'ClientJobPanelAssessmentService.createPanelAssessmentSlot',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        jobApplicationId: data.jobApplicationId,
      });
      throw error;
    }
  }

  async updatePanelAssessmentSlot(
    clientId: string,
    slotId: string,
    data: IClientJobPanelAssessmentSlotUpdate
  ): Promise<IClientJobPanelAssessmentSlot> {
    try {
      logger.info('Updating panel assessment slot', {
        context: 'ClientJobPanelAssessmentService.updatePanelAssessmentSlot',
        clientId,
        slotId,
      });

      const existingSlot =
        await this.prisma.job_panel_assessment_slots.findFirst({
          where: {
            id: slotId,
            clientId,
          },
        });

      if (!existingSlot) {
        throw new AppError(
          'Panel assessment slot not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // If slot is already selected, restrict updates
      if (existingSlot.status === JobPanelAssessmentSlotStatusEnum.SELECTED) {
        // Only allow status updates for selected slots
        const allowedUpdates = ['status'];
        const attemptedUpdates = Object.keys(data);
        const invalidUpdates = attemptedUpdates.filter(
          (key) => !allowedUpdates.includes(key)
        );

        if (invalidUpdates.length > 0) {
          throw new AppError(
            'Cannot update selected slot except for status',
            400,
            ErrorCode.VALIDATION_ERROR
          );
        }
      }

      const updatedSlot = await this.prisma.job_panel_assessment_slots.update({
        where: { id: slotId },
        data,
      });

      return this.toPanelAssessmentSlotDomain(
        updatedSlot as IClientJobPanelAssessmentSlot
      );
    } catch (error) {
      logger.error('Failed to update panel assessment slot', {
        context: 'ClientJobPanelAssessmentService.updatePanelAssessmentSlot',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        slotId,
      });
      throw error;
    }
  }

  async deletePanelAssessmentSlot(
    clientId: string,
    slotId: string
  ): Promise<void> {
    try {
      logger.info('Deleting panel assessment slot', {
        context: 'ClientJobPanelAssessmentService.deletePanelAssessmentSlot',
        clientId,
        slotId,
      });

      const existingSlot =
        await this.prisma.job_panel_assessment_slots.findFirst({
          where: {
            id: slotId,
            clientId,
          },
        });

      if (!existingSlot) {
        throw new AppError(
          'Panel assessment slot not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Check if slot is already selected
      if (existingSlot.status === JobPanelAssessmentSlotStatusEnum.SELECTED) {
        throw new AppError(
          'Cannot delete selected slot',
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }

      await this.prisma.job_panel_assessment_slots.delete({
        where: { id: slotId },
      });

      logger.info('Panel assessment slot deleted successfully', {
        context: 'ClientJobPanelAssessmentService.deletePanelAssessmentSlot',
        clientId,
        slotId,
      });
    } catch (error) {
      logger.error('Failed to delete panel assessment slot', {
        context: 'ClientJobPanelAssessmentService.deletePanelAssessmentSlot',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        slotId,
      });
      throw error;
    }
  }

  async getPanelAssessmentSlot(
    clientId: string,
    slotId: string
  ): Promise<IClientJobPanelAssessmentSlotWithAvailability> {
    try {
      logger.info('Getting panel assessment slot', {
        context: 'ClientJobPanelAssessmentService.getPanelAssessmentSlot',
        clientId,
        slotId,
      });

      const slot = await this.prisma.job_panel_assessment_slots.findFirst({
        where: {
          id: slotId,
          clientId,
        },
        include: {
          panelAssessment: {
            include: {
              candidate: {
                select: {
                  id: true,
                  user: {
                    select: {
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!slot) {
        throw new AppError(
          'Panel assessment slot not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      return this.toPanelAssessmentSlotWithAvailabilityDomain(
        slot as unknown as IClientJobPanelAssessmentSlotWithAvailability
      );
    } catch (error) {
      logger.error('Failed to get panel assessment slot', {
        context: 'ClientJobPanelAssessmentService.getPanelAssessmentSlot',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        slotId,
      });
      throw error;
    }
  }

  async listPanelAssessmentSlots(
    clientId: string,
    filters: {
      panelAssessmentId?: string;
      status?: string;
      startDate?: Date;
      endDate?: Date;
      hostEmail?: string;
      jobApplicationId?: string;
    },
    pagination: IPaginationRequest
  ): Promise<{
    items: IClientJobPanelAssessmentSlotWithAvailability[];
    pagination: IPaginatedResponse<IClientJobPanelAssessmentSlotWithAvailability>['pagination'];
  }> {
    try {
      const where: Prisma.job_panel_assessment_slotsWhereInput = { clientId };

      if (filters.panelAssessmentId) {
        where.panelAssessmentId = filters.panelAssessmentId;
      }

      if (filters.status) {
        where.status = filters.status as JobPanelAssessmentSlotStatusEnum;
      }

      if (filters.startDate) {
        where.startDateTime = { gte: filters.startDate };
      }

      if (filters.endDate) {
        where.endDateTime = { lte: filters.endDate };
      }

      if (filters.hostEmail) {
        where.hostEmail = filters.hostEmail;
      }

      if (filters.jobApplicationId) {
        where.panelAssessment = {
          jobApplicationId: filters.jobApplicationId,
        };
      }

      const skip = ((pagination.page || 1) - 1) * (pagination.limit || 10);
      const take = pagination.limit || 10;

      const [slots, total] = await Promise.all([
        this.prisma.job_panel_assessment_slots.findMany({
          where,
          skip,
          take,
          orderBy: {
            startDateTime: 'asc',
          },
          include: {
            panelAssessment: {
              include: {
                candidate: {
                  select: {
                    id: true,
                    user: {
                      select: {
                        name: true,
                        email: true,
                      },
                    },
                  },
                },
              },
            },
          },
        }),
        this.prisma.job_panel_assessment_slots.count({ where }),
      ]);

      const mappedSlots = slots.map((slot) =>
        this.toPanelAssessmentSlotWithAvailabilityDomain(
          slot as unknown as IClientJobPanelAssessmentSlotWithAvailability
        )
      );

      return {
        items: mappedSlots,
        pagination: {
          total,
          page: pagination.page || 1,
          limit: pagination.limit || 10,
          totalPages: Math.ceil(total / (pagination.limit || 10)),
        },
      };
    } catch (error) {
      logger.error('Failed to list panel assessment slots', {
        context: 'ClientJobPanelAssessmentService.listPanelAssessmentSlots',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        filters,
      });
      throw error;
    }
  }

  // Panel Assessment Invitation Operations
  async createPanelAssessmentInvitation(
    clientId: string,
    invitedById: string,
    data: IClientJobPanelAssessmentInvitationCreate
  ): Promise<IClientJobPanelAssessmentInvitation> {
    try {
      logger.info('Creating panel assessment invitation', {
        context:
          'ClientJobPanelAssessmentService.createPanelAssessmentInvitation',
        clientId,
        candidateId: data.candidateId,
        jobApplicationId: data.jobApplicationId,
      });

      // Find existing panel assessment for this application
      const panelAssessment = await this.prisma.job_panel_assessment.findFirst({
        where: {
          candidateId: data.candidateId,
          jobApplicationId: data.jobApplicationId,
        },
        include: {
          slots: true,
        },
      });

      if (!panelAssessment) {
        throw new AppError(
          'Panel assessment not found. Please create slots first.',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      if (!panelAssessment.slots || panelAssessment.slots.length === 0) {
        throw new AppError(
          'No available slots found. Please create slots first.',
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }

      // Check for existing active invitation
      const existingInvitation =
        await this.prisma.job_panel_assessment_invitation.findFirst({
          where: {
            clientId,
            candidateId: data.candidateId,
            status: {
              in: [
                JobPanelAssessmentInvitationStatusEnum.PENDING,
                JobPanelAssessmentInvitationStatusEnum.ACCEPTED,
              ],
            },
          },
        });

      if (existingInvitation) {
        throw new AppError(
          'Active invitation already exists for this candidate',
          400,
          ErrorCode.ALREADY_EXISTS
        );
      }

      // Get panel member info from the first available slot (or use provided data)
      const firstSlot = panelAssessment.slots[0];
      const panelMemberEmails = data.panelMemberEmails?.length
        ? data.panelMemberEmails
        : firstSlot.panelMemberEmails;
      const panelMemberNames = data.panelMemberNames?.length
        ? data.panelMemberNames
        : firstSlot.panelMemberNames;

      const expirationDays = data.expirationDays || 1; // 1 day expiry
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expirationDays);

      const invitation =
        await this.prisma.job_panel_assessment_invitation.create({
          data: {
            clientId,
            candidateId: data.candidateId,
            panelAssessmentId: panelAssessment.id,
            invitedById,
            message:
              data.message ||
              'You have been invited for a panel interview. Please select your preferred time slot.',
            panelMemberEmails,
            panelMemberNames,
            expiresAt,
          },
        });

      // Update panel assessment status to INVITATION_SENT
      await this.prisma.job_panel_assessment.update({
        where: { id: panelAssessment.id },
        data: {
          status: JobPanelAssessmentStatusEnum.INVITATION_SENT,
        },
      });

      // Send invitation email if notification provider is available
      if (this.notificationProvider) {
        try {
          // Get candidate details with job posting and company info
          const candidate = await this.prisma.candidate.findUnique({
            where: { id: data.candidateId },
            include: {
              user: true,
              settings: true,
            },
          });

          // Get job posting and company details
          const jobApplication = await this.prisma.job_application.findFirst({
            where: { id: data.jobApplicationId },
            include: {
              jobPosting: {
                include: {
                  client: {
                    include: {
                      company: true,
                    },
                  },
                },
              },
            },
          });

          if (candidate && jobApplication) {
            // Generate auth token for immediate login
            const authUser = toIAuthUser(candidate.user);
            const authToken = getAuthToken(authUser);

            const selectSlotUrl = `${ENV.FRONTEND_URL}/app/candidate/assessments/panel?invitationId=${invitation.id}&token=${authToken?.accessToken}`;

            // Format available slots for the template

            let timezone = 'UTC';
            if (candidate.settings) {
              timezone = candidate.settings.timezone || 'UTC';
            }

            const availableSlots = panelAssessment.slots.map((slot) => {
              const startDate = new Date(slot.startDateTime); // UTC from DB
              const endDate = new Date(slot.endDateTime); // UTC from DB

              const duration = Math.round(
                (endDate.getTime() - startDate.getTime()) / (1000 * 60)
              );

              return {
                date: new Intl.DateTimeFormat('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  timeZone: timezone, // 👈 convert UTC → candidate TZ
                }).format(startDate),

                localStartTime: new Intl.DateTimeFormat('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                  timeZone: timezone, // 👈 convert UTC → candidate TZ
                }).format(startDate),

                localEndTime: new Intl.DateTimeFormat('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                  timeZone: timezone, // 👈 convert UTC → candidate TZ
                }).format(endDate),

                duration: `${duration} minutes`,
              };
            });

            // Send panel assessment slot selection email
            if (
              this.notificationProvider.sendPanelAssessmentSlotSelectionEmail
            ) {
              await this.notificationProvider.sendPanelAssessmentSlotSelectionEmail(
                candidate.user.email,
                candidate.user.name,
                jobApplication.jobPosting.title,
                jobApplication.jobPosting.client.company.name,
                availableSlots,
                selectSlotUrl,
                'Panel Interview',
                expirationDays,
                timezone.toString()
              );
            }
          }
        } catch (emailError) {
          logger.warn('Failed to send panel assessment slot selection email', {
            context:
              'ClientJobPanelAssessmentService.createPanelAssessmentInvitation',
            error:
              emailError instanceof Error
                ? emailError.message
                : 'Unknown error',
            candidateId: data.candidateId,
          });
        }
      }

      return this.toPanelAssessmentInvitationDomain(
        invitation as IClientJobPanelAssessmentInvitation
      );
    } catch (error) {
      logger.error('Failed to create panel assessment invitation', {
        context:
          'ClientJobPanelAssessmentService.createPanelAssessmentInvitation',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        candidateId: data.candidateId,
      });
      throw error;
    }
  }

  async cancelPanelAssessmentInvitation(
    clientId: string,
    invitationId: string,
    organizerEmail?: string
  ): Promise<IClientJobPanelAssessmentInvitation> {
    try {
      logger.info('Cancelling panel assessment invitation', {
        context:
          'ClientJobPanelAssessmentService.cancelPanelAssessmentInvitation',
        clientId,
        invitationId,
      });

      const existingInvitation =
        await this.prisma.job_panel_assessment_invitation.findFirst({
          where: {
            id: invitationId,
            clientId,
          },
        });

      if (!existingInvitation) {
        throw new AppError(
          'Panel assessment invitation not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      if (
        existingInvitation.status ===
        JobPanelAssessmentInvitationStatusEnum.CANCELLED
      ) {
        throw new AppError(
          'Invitation is already cancelled',
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }

      // Cancel Teams meeting if it exists and organizer email is provided
      if (existingInvitation.eventId && organizerEmail) {
        try {
          await this.cancelInterviewMeeting(
            clientId,
            invitationId,
            organizerEmail
          );
        } catch (meetingError) {
          logger.warn(
            'Failed to cancel Teams meeting during invitation cancellation',
            {
              context:
                'ClientJobPanelAssessmentService.cancelPanelAssessmentInvitation',
              error:
                meetingError instanceof Error
                  ? meetingError.message
                  : 'Unknown error',
              invitationId,
            }
          );
          // Don't throw - continue with invitation cancellation
        }
      }

      const updatedInvitation =
        await this.prisma.job_panel_assessment_invitation.update({
          where: { id: invitationId },
          data: {
            status: JobPanelAssessmentInvitationStatusEnum.CANCELLED,
            eventId: null,
            eventLink: null,
          },
        });

      return this.toPanelAssessmentInvitationDomain(
        updatedInvitation as IClientJobPanelAssessmentInvitation
      );
    } catch (error) {
      logger.error('Failed to cancel panel assessment invitation', {
        context:
          'ClientJobPanelAssessmentService.cancelPanelAssessmentInvitation',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        invitationId,
      });
      throw error;
    }
  }

  // Panel Assessment Operations

  async getPanelAssessmentInvitation(
    clientId: string,
    invitationId: string
  ): Promise<IClientJobPanelAssessmentInvitation> {
    try {
      logger.info('Getting panel assessment invitation', {
        context: 'ClientJobPanelAssessmentService.getPanelAssessmentInvitation',
        clientId,
        invitationId,
      });

      const invitation =
        await this.prisma.job_panel_assessment_invitation.findFirst({
          where: {
            id: invitationId,
            clientId,
          },
        });

      if (!invitation) {
        throw new AppError(
          'Panel assessment invitation not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      return this.toPanelAssessmentInvitationDomain(
        invitation as IClientJobPanelAssessmentInvitation
      );
    } catch (error) {
      logger.error('Failed to get panel assessment invitation', {
        context: 'ClientJobPanelAssessmentService.getPanelAssessmentInvitation',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        invitationId,
      });
      throw error;
    }
  }

  async listPanelAssessmentInvitations(
    clientId: string,
    filters: {
      candidateId?: string;
      status?: string;
      panelAssessmentId?: string;
      jobApplicationId?: string;
    },
    pagination: IPaginationRequest
  ): Promise<{
    items: IClientJobPanelAssessmentInvitation[];
    pagination: IPaginatedResponse<IClientJobPanelAssessmentInvitation>['pagination'];
  }> {
    try {
      logger.info('Listing panel assessment invitations', {
        context:
          'ClientJobPanelAssessmentService.listPanelAssessmentInvitations',
        clientId,
        filters,
      });

      const where: Prisma.job_panel_assessment_invitationWhereInput = {
        clientId,
      };

      if (filters.candidateId) {
        where.candidateId = filters.candidateId;
      }

      if (filters.status) {
        where.status = filters.status as JobPanelAssessmentInvitationStatusEnum;
      }

      if (filters.panelAssessmentId) {
        where.panelAssessmentId = filters.panelAssessmentId;
      }

      if (filters.jobApplicationId) {
        where.panelAssessment = {
          jobApplicationId: filters.jobApplicationId,
        };
      }

      const skip = ((pagination.page || 1) - 1) * (pagination.limit || 10);
      const take = pagination.limit || 10;

      const [invitations, total] = await Promise.all([
        this.prisma.job_panel_assessment_invitation.findMany({
          where,
          skip,
          take,
          orderBy: {
            createdAt: 'desc',
          },
        }),
        this.prisma.job_panel_assessment_invitation.count({ where }),
      ]);

      const mappedInvitations = invitations.map((inv) =>
        this.toPanelAssessmentInvitationDomain(
          inv as IClientJobPanelAssessmentInvitation
        )
      );

      return {
        items: mappedInvitations,
        pagination: {
          total,
          page: pagination.page || 1,
          limit: pagination.limit || 10,
          totalPages: Math.ceil(total / (pagination.limit || 10)),
        },
      };
    } catch (error) {
      logger.error('Failed to list panel assessment invitations', {
        context:
          'ClientJobPanelAssessmentService.listPanelAssessmentInvitations',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        filters,
      });
      throw error;
    }
  }

  async submitFeedback(
    panelAssessmentId: string,
    panelMemberEmail: string,
    panelMemberName: string,
    feedbackData: {
      detailedFeedback: string;
      decision: JobPanelAssessmentFeedbackDecisionEnum;
      recommendation: JobPanelAssessmentRecommendationEnum;
    },
    feedbackToken?: string
  ): Promise<IClientJobPanelAssessmentFeedback> {
    try {
      logger.info('Creating feedback record', {
        context: 'ClientJobPanelAssessmentService.submitFeedback',
        panelAssessmentId,
        panelMemberEmail,
      });

      // Check if feedback already exists
      const existingFeedback =
        await this.prisma.job_panel_assessment_feedback.findFirst({
          where: {
            panelAssessmentId,
            panelMemberEmail,
          },
        });

      if (existingFeedback) {
        throw new AppError(
          'Feedback has already been submitted by this panel member',
          400,
          ErrorCode.ALREADY_EXISTS
        );
      }

      // Create new feedback record
      const createdFeedback =
        await this.prisma.job_panel_assessment_feedback.create({
          data: {
            panelAssessmentId,
            panelMemberEmail,
            panelMemberName,
            detailedFeedback: feedbackData.detailedFeedback,
            decision: feedbackData.decision,
            recommendation: feedbackData.recommendation,
            isSubmitted: true,
            submittedAt: new Date(),
            feedbackToken,
          },
        });

      logger.info('Feedback record created successfully', {
        context: 'ClientJobPanelAssessmentService.submitFeedback',
        feedbackId: createdFeedback.id,
      });

      // Check if all panel members have submitted feedback and update main assessment
      await this.updateAssessmentBasedOnFeedback(panelAssessmentId);

      return this.toPanelAssessmentFeedbackDomain(createdFeedback);
    } catch (error) {
      logger.error('Failed to create feedback record', {
        context: 'ClientJobPanelAssessmentService.submitFeedback',
        error: error instanceof Error ? error.message : 'Unknown error',
        panelAssessmentId,
        panelMemberEmail,
      });
      throw error;
    }
  }

  /**
   * Update main assessment based on collected feedback
   */
  private async updateAssessmentBasedOnFeedback(
    panelAssessmentId: string
  ): Promise<void> {
    try {
      logger.info(
        'Checking if assessment should be updated based on feedback',
        {
          context:
            'ClientJobPanelAssessmentService.updateAssessmentBasedOnFeedback',
          panelAssessmentId,
        }
      );

      // Get assessment with feedback and selected slot
      const assessment = await this.prisma.job_panel_assessment.findUnique({
        where: { id: panelAssessmentId },
        include: {
          feedback: {
            where: { isSubmitted: true },
          },
          slots: {
            where: { isSelected: true },
          },
        },
      });

      if (!assessment) {
        logger.warn('Panel assessment not found for feedback update', {
          context:
            'ClientJobPanelAssessmentService.updateAssessmentBasedOnFeedback',
          panelAssessmentId,
        });
        return;
      }

      const selectedSlot = assessment.slots[0];
      if (!selectedSlot) {
        logger.warn('No selected slot found for assessment', {
          context:
            'ClientJobPanelAssessmentService.updateAssessmentBasedOnFeedback',
          panelAssessmentId,
        });
        return;
      }

      // Check if all panel members have submitted feedback
      const requiredPanelMembers = selectedSlot.panelMemberEmails;
      const submittedFeedback = assessment.feedback;
      const submittedEmails = submittedFeedback.map((f) => f.panelMemberEmail);

      const allFeedbackSubmitted = requiredPanelMembers.every((email) =>
        submittedEmails.includes(email)
      );

      if (!allFeedbackSubmitted) {
        logger.info('Not all panel members have submitted feedback yet', {
          context:
            'ClientJobPanelAssessmentService.updateAssessmentBasedOnFeedback',
          panelAssessmentId,
          required: requiredPanelMembers.length,
          submitted: submittedFeedback.length,
        });
        return;
      }

      const { overallResult, overallRecommendation } =
        this.calculateOverallAssessment(submittedFeedback);

      await this.prisma.job_panel_assessment.update({
        where: { id: panelAssessmentId },
        data: {
          result: overallResult,
          recommendation: overallRecommendation,
        },
      });

      logger.info('Assessment updated based on collected feedback', {
        context:
          'ClientJobPanelAssessmentService.updateAssessmentBasedOnFeedback',
        panelAssessmentId,
        overallResult,
        overallRecommendation,
        currentStatus: assessment.status,
      });
    } catch (error) {
      logger.error('Failed to update assessment based on feedback', {
        context:
          'ClientJobPanelAssessmentService.updateAssessmentBasedOnFeedback',
        error: error instanceof Error ? error.message : 'Unknown error',
        panelAssessmentId,
      });
    }
  }

  /**
   * Calculate overall assessment result and recommendation based on individual feedback
   */
  private calculateOverallAssessment(feedback: any[]): {
    overallResult: JobPanelAssessmentResultEnum;
    overallRecommendation: JobPanelAssessmentRecommendationEnum;
  } {
    const decisions = feedback.map((f) => f.decision);
    const recommendations = feedback.map((f) => f.recommendation);

    // Calculate overall result based on decisions
    const hireCount = decisions.filter(
      (d) => d === JobPanelAssessmentFeedbackDecisionEnum.HIRE
    ).length;
    const noHireCount = decisions.filter(
      (d) => d === JobPanelAssessmentFeedbackDecisionEnum.NO_HIRE
    ).length;
    const needsAnotherRoundCount = decisions.filter(
      (d) => d === JobPanelAssessmentFeedbackDecisionEnum.NEEDS_ANOTHER_ROUND
    ).length;

    let overallResult: JobPanelAssessmentResultEnum;

    if (hireCount > noHireCount && needsAnotherRoundCount === 0) {
      overallResult = JobPanelAssessmentResultEnum.PASSED;
    } else if (noHireCount > hireCount) {
      overallResult = JobPanelAssessmentResultEnum.FAILED;
    } else {
      // Mixed results or needs another round
      overallResult = JobPanelAssessmentResultEnum.REQUIRES_REVIEW;
    }

    // Calculate overall recommendation based on individual recommendations
    const highlyRecommendedCount = recommendations.filter(
      (r) => r === JobPanelAssessmentRecommendationEnum.HIGHLY_RECOMMENDED
    ).length;
    const recommendedCount = recommendations.filter(
      (r) => r === JobPanelAssessmentRecommendationEnum.RECOMMENDED
    ).length;
    const notRecommendedCount = recommendations.filter(
      (r) => r === JobPanelAssessmentRecommendationEnum.NOT_RECOMMENDED
    ).length;
    const _requiresReviewCount = recommendations.filter(
      (r) => r === JobPanelAssessmentRecommendationEnum.REQUIRES_FURTHER_REVIEW
    ).length;

    let overallRecommendation: JobPanelAssessmentRecommendationEnum;

    if (highlyRecommendedCount >= Math.ceil(feedback.length / 2)) {
      overallRecommendation =
        JobPanelAssessmentRecommendationEnum.HIGHLY_RECOMMENDED;
    } else if (
      highlyRecommendedCount + recommendedCount >=
      Math.ceil(feedback.length / 2)
    ) {
      overallRecommendation = JobPanelAssessmentRecommendationEnum.RECOMMENDED;
    } else if (notRecommendedCount >= Math.ceil(feedback.length / 2)) {
      overallRecommendation =
        JobPanelAssessmentRecommendationEnum.NOT_RECOMMENDED;
    } else {
      overallRecommendation =
        JobPanelAssessmentRecommendationEnum.REQUIRES_FURTHER_REVIEW;
    }

    return { overallResult, overallRecommendation };
  }

  /**
   * Submit feedback with internal/external logic check
   */
  async submitPanelFeedback(
    identifier: string, // either feedbackToken or panelMemberEmail
    feedbackData: {
      detailedFeedback: string;
      decision: JobPanelAssessmentFeedbackDecisionEnum;
      recommendation: JobPanelAssessmentRecommendationEnum;
    },
    panelAssessmentId?: string // provided for internal users
  ): Promise<IClientJobPanelAssessmentFeedback> {
    try {
      logger.info('Processing panel feedback submission', {
        context: 'ClientJobPanelAssessmentService.submitPanelFeedback',
        identifier,
        isInternal: !!panelAssessmentId,
      });

      if (panelAssessmentId) {
        // Internal user submission
        const panelMemberEmail = identifier;

        // Get panel member name from the slot
        const panelAssessment =
          await this.prisma.job_panel_assessment.findFirst({
            where: { id: panelAssessmentId },
            include: {
              slots: {
                where: { isSelected: true },
              },
            },
          });

        if (!panelAssessment || !panelAssessment.slots[0]) {
          throw new AppError(
            'Panel assessment or selected slot not found',
            404,
            ErrorCode.NOT_FOUND
          );
        }

        const selectedSlot = panelAssessment.slots[0];
        const emailIndex =
          selectedSlot.panelMemberEmails.indexOf(panelMemberEmail);
        const panelMemberName =
          emailIndex >= 0 && selectedSlot.panelMemberNames[emailIndex]
            ? selectedSlot.panelMemberNames[emailIndex]
            : panelMemberEmail;

        return this.submitFeedback(
          panelAssessmentId,
          panelMemberEmail,
          panelMemberName,
          feedbackData
        );
      } else {
        // External user submission (token-based)
        const feedbackToken = identifier;

        // Find feedback record by token
        const feedbackRecord =
          await this.prisma.job_panel_assessment_feedback.findFirst({
            where: {
              feedbackToken,
              isSubmitted: false, // Only allow submission if not already submitted
            },
            include: {
              panelAssessment: {
                include: {
                  slots: {
                    where: { isSelected: true },
                  },
                },
              },
            },
          });

        if (!feedbackRecord) {
          throw new AppError(
            'Invalid or expired feedback token, or feedback already submitted',
            404,
            ErrorCode.NOT_FOUND
          );
        }

        // Check if token is expired (72 hours from creation)
        const tokenExpiryTime = new Date(
          feedbackRecord.createdAt.getTime() + 72 * 60 * 60 * 1000
        );
        if (new Date() > tokenExpiryTime) {
          throw new AppError(
            'Feedback token has expired',
            400,
            ErrorCode.VALIDATION_ERROR
          );
        }

        // Update the existing feedback record with the submitted data
        const updatedFeedback =
          await this.prisma.job_panel_assessment_feedback.update({
            where: { id: feedbackRecord.id },
            data: {
              detailedFeedback: feedbackData.detailedFeedback,
              decision: feedbackData.decision,
              recommendation: feedbackData.recommendation,
              isSubmitted: true,
              submittedAt: new Date(),
            },
          });

        logger.info('External feedback submitted successfully', {
          context: 'ClientJobPanelAssessmentService.submitPanelFeedback',
          feedbackId: updatedFeedback.id,
          panelAssessmentId: feedbackRecord.panelAssessmentId,
          panelMemberEmail: feedbackRecord.panelMemberEmail,
        });

        // Check if all panel members have submitted feedback and update main assessment
        await this.updateAssessmentBasedOnFeedback(
          feedbackRecord.panelAssessmentId
        );

        return this.toPanelAssessmentFeedbackDomain(updatedFeedback);
      }
    } catch (error) {
      logger.error('Failed to process panel feedback submission', {
        context: 'ClientJobPanelAssessmentService.submitPanelFeedback',
        error: error instanceof Error ? error.message : 'Unknown error',
        identifier,
      });
      throw error;
    }
  }

  /**
   * Get feedback details by token for external feedback form
   */
  async getFeedbackByToken(feedbackToken: string): Promise<{
    feedback: IClientJobPanelAssessmentFeedback;
    candidate: { name: string; email: string };
    jobPosting: { title: string; company: string };
    assessment: { scheduledDate?: Date };
    isSubmitted: boolean;
  }> {
    try {
      logger.info('Getting feedback details by token', {
        context: 'ClientJobPanelAssessmentService.getFeedbackByToken',
        feedbackToken,
      });

      const feedbackRecord =
        await this.prisma.job_panel_assessment_feedback.findFirst({
          where: {
            feedbackToken,
          },
          include: {
            panelAssessment: {
              include: {
                jobApplication: {
                  include: {
                    jobPosting: {
                      include: {
                        client: {
                          include: {
                            company: true,
                          },
                        },
                      },
                    },
                    candidate: {
                      include: {
                        user: true,
                      },
                    },
                  },
                },
                slots: {
                  where: { isSelected: true },
                },
              },
            },
          },
        });

      if (!feedbackRecord) {
        throw new AppError('Invalid feedback token', 404, ErrorCode.NOT_FOUND);
      }

      // Check if token is expired (72 hours from creation)
      const tokenExpiryTime = new Date(
        feedbackRecord.createdAt.getTime() + 72 * 60 * 60 * 1000
      );
      if (new Date() > tokenExpiryTime) {
        throw new AppError(
          'Feedback token has expired',
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }

      const selectedSlot = feedbackRecord.panelAssessment?.slots[0];

      return {
        feedback: this.toPanelAssessmentFeedbackDomain(feedbackRecord),
        candidate: {
          name: feedbackRecord.panelAssessment!.jobApplication.candidate.user
            .name,
          email:
            feedbackRecord.panelAssessment!.jobApplication.candidate.user.email,
        },
        jobPosting: {
          title:
            feedbackRecord.panelAssessment!.jobApplication.jobPosting.title,
          company:
            feedbackRecord.panelAssessment!.jobApplication.jobPosting.client
              .company.name,
        },
        assessment: {
          scheduledDate: selectedSlot?.startDateTime,
        },
        isSubmitted: feedbackRecord.isSubmitted,
      };
    } catch (error) {
      logger.error('Failed to get feedback by token', {
        context: 'ClientJobPanelAssessmentService.getFeedbackByToken',
        error: error instanceof Error ? error.message : 'Unknown error',
        feedbackToken,
      });
      throw error;
    }
  }

  /**
   * List all feedback for a panel assessment
   */
  async listPanelAssessmentFeedback(
    clientId: string,
    filters: {
      panelAssessmentId?: string;
      panelMemberEmail?: string;
      isSubmitted?: boolean;
    },
    pagination: IPaginationRequest
  ): Promise<{
    items: IClientJobPanelAssessmentFeedback[];
    pagination: IPaginatedResponse<IClientJobPanelAssessmentFeedback>['pagination'];
  }> {
    try {
      logger.info('Listing panel assessment feedback', {
        context: 'ClientJobPanelAssessmentService.listPanelAssessmentFeedback',
        clientId,
        filters,
      });

      const where: Prisma.job_panel_assessment_feedbackWhereInput = {};

      // Build where clause based on filters
      if (filters.panelAssessmentId) {
        where.panelAssessmentId = filters.panelAssessmentId;
      }

      if (filters.panelMemberEmail) {
        where.panelMemberEmail = filters.panelMemberEmail;
      }

      if (filters.isSubmitted !== undefined) {
        where.isSubmitted = filters.isSubmitted;
      }

      // If panelAssessmentId is provided, verify it belongs to the client
      if (filters.panelAssessmentId) {
        const panelAssessment =
          await this.prisma.job_panel_assessment.findFirst({
            where: {
              id: filters.panelAssessmentId,
              jobApplication: {
                jobPosting: {
                  clientId,
                },
              },
            },
          });

        if (!panelAssessment) {
          // Return empty result instead of throwing error
          return {
            items: [],
            pagination: {
              total: 0,
              page: pagination.page || 1,
              limit: pagination.limit || 10,
              totalPages: 0,
            },
          };
        }
      } else {
        // If no panelAssessmentId is provided, filter by client through panel assessment
        where.panelAssessment = {
          jobApplication: {
            jobPosting: {
              clientId,
            },
          },
        };
      }

      const skip = ((pagination.page || 1) - 1) * (pagination.limit || 10);
      const take = pagination.limit || 10;

      const [feedback, total] = await Promise.all([
        this.prisma.job_panel_assessment_feedback.findMany({
          where,
          skip,
          take,
          orderBy: {
            createdAt: 'asc',
          },
        }),
        this.prisma.job_panel_assessment_feedback.count({ where }),
      ]);

      const mappedFeedback = feedback.map((f) =>
        this.toPanelAssessmentFeedbackDomain(f)
      );

      return {
        items: mappedFeedback,
        pagination: {
          total,
          page: pagination.page || 1,
          limit: pagination.limit || 10,
          totalPages: Math.ceil(total / (pagination.limit || 10)),
        },
      };
    } catch (error) {
      logger.error('Failed to list panel assessment feedback', {
        context: 'ClientJobPanelAssessmentService.listPanelAssessmentFeedback',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        filters,
      });
      throw error;
    }
  }

  /**
   * Generate and send Teams meeting link for a panel assessment invitation
   * This method is triggered when client clicks "Send Interview Link" button
   */
  async generateAndSendInterviewLink(
    clientId: string,
    invitationId: string,
    organizerEmail: string,
    organizerName: string,
    useTeams?: boolean,
    manualMeetingLink?: string,
    manualEventId?: string
  ): Promise<{
    meetingLink: string;
    message: string;
    eventId?: string;
  }> {
    try {
      logger.info('Generating interview link for panel assessment', {
        context: 'ClientJobPanelAssessmentService.generateAndSendInterviewLink',
        clientId,
        invitationId,
        organizerEmail,
        useTeams,
      });

      // Get invitation with related data
      const invitation =
        await this.prisma.job_panel_assessment_invitation.findFirst({
          where: {
            id: invitationId,
            clientId,
          },
          include: {
            panelAssessment: {
              include: {
                slots: {
                  where: { isSelected: true },
                },
                candidate: {
                  include: {
                    user: true,
                  },
                },
                jobApplication: {
                  include: {
                    jobPosting: {
                      include: {
                        client: {
                          include: {
                            company: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        });

      if (!invitation) {
        throw new AppError(
          'Panel assessment invitation not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      if (
        invitation.status !== JobPanelAssessmentInvitationStatusEnum.ACCEPTED
      ) {
        throw new AppError(
          'Invitation must be accepted before generating meeting link',
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }

      const selectedSlot = invitation.panelAssessment?.slots[0];
      if (!selectedSlot) {
        throw new AppError(
          'No selected slot found for this invitation',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      const candidate = invitation.panelAssessment?.candidate;
      const jobPosting = invitation.panelAssessment?.jobApplication?.jobPosting;
      const company = jobPosting?.client?.company;

      if (!candidate || !jobPosting || !company) {
        throw new AppError(
          'Required data not found for meeting creation',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      let meetingLink: string;
      let eventId: string | undefined;
      let message: string;

      if (useTeams) {
        // MS Teams flow
        logger.info('Using MS Teams integration for meeting creation', {
          context:
            'ClientJobPanelAssessmentService.generateAndSendInterviewLink',
          invitationId,
        });

        // Check if Teams service is available
        if (!this.teamsService || !this.teamsService.isConfigured()) {
          throw new AppError(
            'Teams integration is not configured',
            500,
            ErrorCode.SERVICE_UNAVAILABLE
          );
        }

        const attendees = [
          // Add candidate as the primary attendee
          {
            email: candidate.user.email,
            name: candidate.user.name,
          },
          // Add panel members
          ...selectedSlot.panelMemberEmails.map((email, index) => ({
            email,
            name: selectedSlot.panelMemberNames[index] || email,
          })),
        ];

        // If host is different from organizer, add host to attendees
        if (
          selectedSlot.hostEmail &&
          selectedSlot.hostEmail !== organizerEmail
        ) {
          attendees.push({
            email: selectedSlot.hostEmail,
            name: selectedSlot.hostName || selectedSlot.hostEmail,
          });
        }

        // Create Teams meeting request
        const meetingRequest: ITeamsMeetingRequest = {
          subject: `Panel Interview - ${candidate.user.name} for ${jobPosting.title}`,
          startDateTime: selectedSlot.startDateTime,
          endDateTime: selectedSlot.endDateTime,
          timeZone: selectedSlot.timeZone || 'UTC',
          attendees,
          organizer: {
            email: organizerEmail,
            name: organizerName,
          },
          candidateName: candidate.user.name,
        };

        // Create Teams meeting
        const meetingResponse: ITeamsMeetingResponse =
          await this.teamsService.createPanelInterviewMeeting(meetingRequest);

        meetingLink = meetingResponse.joinUrl;
        eventId = meetingResponse.meetingId;
        message =
          'Teams meeting link has been generated and sent to all participants';
      } else {
        // Manual meeting link flow
        logger.info('Using manual meeting link for interview', {
          context:
            'ClientJobPanelAssessmentService.generateAndSendInterviewLink',
          invitationId,
        });

        if (!manualMeetingLink) {
          throw new AppError(
            'Manual meeting link is required when Teams integration is disabled',
            400,
            ErrorCode.VALIDATION_ERROR
          );
        }

        meetingLink = manualMeetingLink;
        eventId = manualEventId;
        message =
          'External meeting link has been saved and sent to all participants';
      }

      // Update invitation with meeting details and change status to MEETING_SCHEDULED
      await this.prisma.$transaction(async (tx) => {
        // Update invitation with meeting details
        await tx.job_panel_assessment_invitation.update({
          where: { id: invitationId },
          data: {
            eventId: eventId,
            eventLink: meetingLink,
          },
        });

        // Update panel assessment status to MEETING_SCHEDULED
        // This changes the status from SLOT_SELECTED to MEETING_SCHEDULED when meeting is actually scheduled
        await tx.job_panel_assessment.update({
          where: { id: invitation.panelAssessment!.id },
          data: {
            status: JobPanelAssessmentStatusEnum.MEETING_SCHEDULED,
          },
        });
      });

      // Send notification to candidate, panel members, and host
      if (this.notificationProvider) {
        try {
          // Format date and time for the template
          const startDate = new Date(selectedSlot.startDateTime);
          const endDate = new Date(selectedSlot.endDateTime);
          const duration = Math.round(
            (endDate.getTime() - startDate.getTime()) / (1000 * 60)
          ); // duration in minutes

          const interviewDate = startDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });

          const interviewTime = startDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });

          const sendLinkMethod =
            this.notificationProvider.sendPanelInterviewLinkEmail;

          if (sendLinkMethod) {
            // 1. Send interview link email to candidate
            logger.info('Sending interview link email to candidate', {
              context:
                'ClientJobPanelAssessmentService.generateAndSendInterviewLink',
              candidateEmail: candidate.user.email,
              candidateName: candidate.user.name,
            });

            await sendLinkMethod.call(
              this.notificationProvider,
              candidate.user.email,
              candidate.user.name,
              candidate.user.name,
              jobPosting.title,
              company.name,
              interviewDate,
              interviewTime,
              `${duration} minutes`,
              selectedSlot.timeZone || 'UTC',
              meetingLink,
              eventId,
              selectedSlot.panelMemberNames,
              'Please join the meeting 5-10 minutes early and ensure you have a stable internet connection.',
              true // isCandidate = true
            );

            // 2. Send separate interview link emails to each panel member
            logger.info('Sending interview link emails to panel members', {
              context:
                'ClientJobPanelAssessmentService.generateAndSendInterviewLink',
              panelMemberCount: selectedSlot.panelMemberEmails.length,
              organizerEmail,
            });

            for (let i = 0; i < selectedSlot.panelMemberEmails.length; i++) {
              const email = selectedSlot.panelMemberEmails[i];
              const name = selectedSlot.panelMemberNames[i] || email;

              // Send email to all panel members, including organizer if they're a panel member
              logger.info('Sending interview link email to panel member', {
                context:
                  'ClientJobPanelAssessmentService.generateAndSendInterviewLink',
                panelMemberEmail: email,
                panelMemberName: name,
                isOrganizer:
                  email.toLowerCase() === organizerEmail.toLowerCase(),
              });

              await sendLinkMethod.call(
                this.notificationProvider,
                email,
                name,
                candidate.user.name,
                jobPosting.title,
                company.name,
                interviewDate,
                interviewTime,
                `${duration} minutes`,
                selectedSlot.timeZone || 'UTC',
                meetingLink,
                eventId,
                selectedSlot.panelMemberNames,
                "Please review the candidate's profile beforehand and prepare relevant questions to assess their fit for the role.",
                false // isCandidate = false
              );
            }

            // 3. Send separate interview link email to host if they exist and are different from panel members
            if (selectedSlot.hostEmail && selectedSlot.hostName) {
              const isHostAPanelMember = selectedSlot.panelMemberEmails.some(
                (email) =>
                  email.toLowerCase() === selectedSlot.hostEmail!.toLowerCase()
              );
              const isHostTheOrganizer =
                selectedSlot.hostEmail.toLowerCase() ===
                organizerEmail.toLowerCase();

              // Only send host email if host is not a panel member or if host is the organizer but not already sent
              if (!isHostAPanelMember || isHostTheOrganizer) {
                logger.info('Sending interview link email to host', {
                  context:
                    'ClientJobPanelAssessmentService.generateAndSendInterviewLink',
                  hostEmail: selectedSlot.hostEmail,
                  hostName: selectedSlot.hostName,
                  isHostAPanelMember,
                  isHostTheOrganizer,
                });

                await sendLinkMethod.call(
                  this.notificationProvider,
                  selectedSlot.hostEmail,
                  selectedSlot.hostName,
                  candidate.user.name,
                  jobPosting.title,
                  company.name,
                  interviewDate,
                  interviewTime,
                  `${duration} minutes`,
                  selectedSlot.timeZone || 'UTC',
                  meetingLink,
                  eventId,
                  selectedSlot.panelMemberNames,
                  'As the interview host, please ensure the meeting runs smoothly and all participants can join successfully.',
                  false // isCandidate = false
                );
              } else {
                logger.info(
                  'Skipping host email as host is already a panel member',
                  {
                    context:
                      'ClientJobPanelAssessmentService.generateAndSendInterviewLink',
                    hostEmail: selectedSlot.hostEmail,
                    hostName: selectedSlot.hostName,
                  }
                );
              }
            }
          }
        } catch (emailError) {
          logger.warn('Failed to send meeting link notification emails', {
            context:
              'ClientJobPanelAssessmentService.generateAndSendInterviewLink',
            error:
              emailError instanceof Error
                ? emailError.message
                : 'Unknown error',
            invitationId,
          });
          // Don't throw - meeting was created/saved successfully
        }
      }

      logger.info('Interview link processed and sent successfully', {
        context: 'ClientJobPanelAssessmentService.generateAndSendInterviewLink',
        invitationId,
        useTeams,
        eventId,
      });

      return {
        meetingLink,
        eventId,
        message,
      };
    } catch (error) {
      logger.error('Failed to generate and send interview link', {
        context: 'ClientJobPanelAssessmentService.generateAndSendInterviewLink',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        invitationId,
        useTeams,
      });
      throw error;
    }
  }

  /**
   * Update Teams meeting for a panel assessment invitation
   * This method is called when slot time or attendees are changed
   */
  async updateInterviewMeeting(
    clientId: string,
    invitationId: string,
    organizerEmail: string
  ): Promise<{
    meetingLink: string;
    message: string;
    eventId?: string;
  }> {
    try {
      logger.info('Updating Teams meeting for panel assessment', {
        context: 'ClientJobPanelAssessmentService.updateInterviewMeeting',
        clientId,
        invitationId,
        organizerEmail,
      });

      // Get invitation with meeting details
      const invitation =
        await this.prisma.job_panel_assessment_invitation.findFirst({
          where: {
            id: invitationId,
            clientId,
          },
          include: {
            panelAssessment: {
              include: {
                slots: {
                  where: { isSelected: true },
                },
                candidate: {
                  include: {
                    user: true,
                  },
                },
                jobApplication: {
                  include: {
                    jobPosting: {
                      include: {
                        client: {
                          include: {
                            company: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        });

      if (!invitation || !invitation.eventId) {
        throw new AppError(
          'Invitation or meeting not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      const selectedSlot = invitation.panelAssessment?.slots[0];
      const candidate = invitation.panelAssessment?.candidate;
      const jobPosting = invitation.panelAssessment?.jobApplication?.jobPosting;

      if (!selectedSlot || !candidate || !jobPosting) {
        throw new AppError(
          'Required data not found for meeting update',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      if (!this.teamsService || !this.teamsService.isConfigured()) {
        throw new AppError(
          'Teams integration is not configured',
          500,
          ErrorCode.SERVICE_UNAVAILABLE
        );
      }

      // Prepare updated attendees list including candidate and panel members
      const attendees = [
        // Add candidate as the primary attendee
        {
          email: candidate.user.email,
          name: candidate.user.name,
        },
        // Add panel members
        ...selectedSlot.panelMemberEmails.map((email, index) => ({
          email,
          name: selectedSlot.panelMemberNames[index] || email,
        })),
      ];

      const updateRequest: Partial<ITeamsMeetingRequest> = {
        subject: `Panel Interview - ${candidate.user.name} for ${jobPosting.title}`,
        startDateTime: selectedSlot.startDateTime,
        endDateTime: selectedSlot.endDateTime,
        timeZone: selectedSlot.timeZone || 'UTC',
        attendees,
        candidateName: candidate.user.name,
      };

      // Update Teams meeting
      const meetingResponse: ITeamsMeetingResponse =
        await this.teamsService.updatePanelInterviewMeeting(
          invitation.eventId,
          organizerEmail,
          updateRequest
        );

      // Update invitation with new meeting details
      await this.prisma.job_panel_assessment_invitation.update({
        where: { id: invitationId },
        data: {
          eventLink: meetingResponse.joinUrl,
        },
      });

      logger.info('Teams meeting updated successfully', {
        context: 'ClientJobPanelAssessmentService.updateInterviewMeeting',
        invitationId,
        meetingId: meetingResponse.meetingId,
      });

      return {
        meetingLink: meetingResponse.joinUrl,
        eventId: meetingResponse.meetingId,
        message: 'Teams meeting has been updated successfully',
      };
    } catch (error) {
      logger.error('Failed to update Teams meeting', {
        context: 'ClientJobPanelAssessmentService.updateInterviewMeeting',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        invitationId,
      });
      throw error;
    }
  }

  /**
   * Cancel Teams meeting for a panel assessment invitation
   * This method is called when invitation is cancelled or assessment is cancelled
   */
  async cancelInterviewMeeting(
    clientId: string,
    invitationId: string,
    organizerEmail: string
  ): Promise<{ message: string }> {
    try {
      logger.info('Cancelling Teams meeting for panel assessment', {
        context: 'ClientJobPanelAssessmentService.cancelInterviewMeeting',
        clientId,
        invitationId,
        organizerEmail,
      });

      // Get invitation with meeting details
      const invitation =
        await this.prisma.job_panel_assessment_invitation.findFirst({
          where: {
            id: invitationId,
            clientId,
          },
        });

      if (!invitation) {
        throw new AppError('Invitation not found', 404, ErrorCode.NOT_FOUND);
      }

      // Only cancel meeting if it exists
      if (invitation.eventId && this.teamsService?.isConfigured()) {
        try {
          await this.teamsService.cancelPanelInterviewMeeting(
            invitation.eventId,
            organizerEmail
          );

          // Clear meeting details from invitation
          await this.prisma.job_panel_assessment_invitation.update({
            where: { id: invitationId },
            data: {
              eventId: null,
              eventLink: null,
            },
          });

          logger.info('Teams meeting cancelled successfully', {
            context: 'ClientJobPanelAssessmentService.cancelInterviewMeeting',
            invitationId,
            meetingId: invitation.eventId,
          });
        } catch (teamsError) {
          logger.warn('Failed to cancel Teams meeting, but continuing', {
            context: 'ClientJobPanelAssessmentService.cancelInterviewMeeting',
            error:
              teamsError instanceof Error
                ? teamsError.message
                : 'Unknown error',
            invitationId,
            meetingId: invitation.eventId,
          });
          // Don't throw - still clear the meeting details
          await this.prisma.job_panel_assessment_invitation.update({
            where: { id: invitationId },
            data: {
              eventId: null,
              eventLink: null,
            },
          });
        }
      }

      return {
        message: 'Meeting cancellation processed successfully',
      };
    } catch (error) {
      logger.error('Failed to cancel Teams meeting', {
        context: 'ClientJobPanelAssessmentService.cancelInterviewMeeting',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        invitationId,
      });
      throw error;
    }
  }

  // Helper method to check if two slots overlap
  private slotsOverlap(
    slot1: { startDateTime: Date | string; endDateTime: Date | string },
    slot2: { startDateTime: Date | string; endDateTime: Date | string }
  ): boolean {
    const start1 =
      slot1.startDateTime instanceof Date
        ? slot1.startDateTime
        : new Date(slot1.startDateTime);
    const end1 =
      slot1.endDateTime instanceof Date
        ? slot1.endDateTime
        : new Date(slot1.endDateTime);
    const start2 =
      slot2.startDateTime instanceof Date
        ? slot2.startDateTime
        : new Date(slot2.startDateTime);
    const end2 =
      slot2.endDateTime instanceof Date
        ? slot2.endDateTime
        : new Date(slot2.endDateTime);

    return start1 < end2 && end1 > start2;
  }

  // Helper methods for domain mapping
  private toPanelAssessmentSlotDomain(
    slot: IClientJobPanelAssessmentSlot
  ): IClientJobPanelAssessmentSlot {
    return {
      id: slot.id,
      clientId: slot.clientId,
      panelAssessmentId: slot.panelAssessmentId,
      createdById: slot.createdById,
      startDateTime: slot.startDateTime,
      endDateTime: slot.endDateTime,
      timeZone: slot.timeZone,
      status: slot.status as JobPanelAssessmentSlotStatusEnum,
      isSelected: slot.isSelected,
      panelMemberEmails: slot.panelMemberEmails,
      panelMemberNames: slot.panelMemberNames,
      hostEmail: slot.hostEmail,
      hostName: slot.hostName,
      createdAt: slot.createdAt,
      updatedAt: slot.updatedAt,
    };
  }

  private toPanelAssessmentSlotWithAvailabilityDomain(
    slot: any
  ): IClientJobPanelAssessmentSlotWithAvailability {
    const baseSlot = this.toPanelAssessmentSlotDomain(slot);

    return {
      ...baseSlot,
      panelAssessment: slot.panelAssessment
        ? {
            id: slot.panelAssessment.id,
            candidate: {
              id: slot.panelAssessment.candidate.id,
              name: slot.panelAssessment.candidate.user.name,
              email: slot.panelAssessment.candidate.user.email,
            },
          }
        : undefined,
    };
  }

  private toPanelAssessmentInvitationDomain(
    invitation: IClientJobPanelAssessmentInvitation
  ): IClientJobPanelAssessmentInvitation {
    return {
      id: invitation.id,
      clientId: invitation.clientId,
      candidateId: invitation.candidateId,
      panelAssessmentId: invitation.panelAssessmentId!,
      invitedById: invitation.invitedById,
      status: invitation.status as JobPanelAssessmentInvitationStatusEnum,
      useTeams: invitation.useTeams,
      message: invitation.message || undefined,
      panelMemberEmails: invitation.panelMemberEmails,
      panelMemberNames: invitation.panelMemberNames,
      eventId: invitation.eventId || undefined,
      eventLink: invitation.eventLink || undefined,
      selectedSlotId: invitation.selectedSlotId || undefined,
      expiresAt: invitation.expiresAt,
      respondedAt: invitation.respondedAt || undefined,
      acceptedAt: invitation.acceptedAt || undefined,
      createdAt: invitation.createdAt,
      updatedAt: invitation.updatedAt,
    };
  }

  private toPanelAssessmentFeedbackDomain(
    feedback: any
  ): IClientJobPanelAssessmentFeedback {
    return {
      id: feedback.id,
      panelAssessmentId: feedback.panelAssessmentId,
      panelMemberEmail: feedback.panelMemberEmail,
      panelMemberName: feedback.panelMemberName,
      detailedFeedback: feedback.detailedFeedback,
      decision: feedback.decision,
      recommendation: feedback.recommendation,
      isSubmitted: feedback.isSubmitted,
      submittedAt: feedback.submittedAt || undefined,
      feedbackToken: feedback.feedbackToken || undefined,
      feedbackLink: feedback.feedbackLink || undefined,
      createdAt: feedback.createdAt,
      updatedAt: feedback.updatedAt,
    };
  }

  async listScheduledInterviews(
    clientId: string,
    pagination?: IPaginationRequest
  ): Promise<IPaginatedResponse<IScheduledInterviewItem>> {
    const where: any = {
      clientId,
      status: JobPanelAssessmentInvitationStatusEnum.ACCEPTED,
    };

    // Add search functionality
    if (pagination?.search && pagination.search.trim()) {
      where.OR = [
        {
          candidate: {
            user: {
              name: {
                contains: pagination.search.trim(),
                mode: 'insensitive',
              },
            },
          },
        },
        {
          candidate: {
            user: {
              email: {
                contains: pagination.search.trim(),
                mode: 'insensitive',
              },
            },
          },
        },
        {
          panelAssessment: {
            jobApplication: {
              jobPosting: {
                title: {
                  contains: pagination.search.trim(),
                  mode: 'insensitive',
                },
              },
            },
          },
        },
        {
          panelAssessment: {
            jobApplication: {
              jobPosting: {
                client: {
                  company: {
                    name: {
                      contains: pagination.search.trim(),
                      mode: 'insensitive',
                    },
                  },
                },
              },
            },
          },
        },
      ];
    }

    const skip = ((pagination?.page || 1) - 1) * (pagination?.limit || 10);
    const take = pagination?.limit || 10;

    const [panelInterviews, total] = await Promise.all([
      this.prisma.job_panel_assessment_invitation.findMany({
        where,
        skip,
        take,
        include: {
          panelAssessment: {
            where: {
              status: {
                in: [
                  JobPanelAssessmentStatusEnum.SLOT_SELECTED,
                  JobPanelAssessmentStatusEnum.MEETING_SCHEDULED,
                  JobPanelAssessmentStatusEnum.COMPLETED,
                ],
              },
            },
            include: {
              candidate: {
                include: {
                  user: true,
                },
              },
              jobApplication: {
                include: {
                  jobPosting: {
                    include: {
                      client: {
                        include: {
                          company: true,
                        },
                      },
                    },
                  },
                },
              },
              slots: {
                where: {
                  isSelected: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.job_panel_assessment_invitation.count({ where }),
    ]);

    if (!panelInterviews || panelInterviews.length === 0) {
      logger.info('No scheduled interviews found', {
        context: 'ClientJobPanelAssessmentService.listScheduledInterviews',
        clientId,
      });
      return {
        items: [],
        pagination: {
          total: 0,
          page: pagination?.page || 1,
          limit: pagination?.limit || 10,
          totalPages: 0,
        },
      };
    }

    // Transform the data to match the simplified interface
    const simplifiedInterviews = panelInterviews
      .filter((invitation) => invitation.panelAssessment)
      .map((invitation) => {
        const panelAssessment = invitation.panelAssessment!;
        const selectedSlot = panelAssessment.slots[0]; // Get the selected slot

        return {
          id: invitation.id,
          candidateName: panelAssessment.candidate.user.name,
          candidateEmail: panelAssessment.candidate.user.email,
          companyName:
            panelAssessment.jobApplication.jobPosting.client.company.name,
          jobPostingId: panelAssessment.jobApplication.jobPosting.id,
          jobApplicationId: panelAssessment.jobApplication.id,
          panelAssessmentId: panelAssessment.id,
          meetingStatus: panelAssessment.status as JobPanelAssessmentStatusEnum,
          jobTitle: panelAssessment.jobApplication.jobPosting.title,
          selectedSlotDateTime:
            selectedSlot?.startDateTime ||
            panelAssessment.scheduledDate ||
            invitation.createdAt,
          createdAt: invitation.createdAt,
          slotId: selectedSlot?.id || '',
          slotStatus: selectedSlot?.status as JobPanelAssessmentSlotStatusEnum,
          panelMemberNames:
            selectedSlot?.panelMemberNames || invitation.panelMemberNames || [],
          type: InterviewTypeEnum.PANEL_ASSESSMENT,
        };
      });

    return {
      items: simplifiedInterviews,
      pagination: {
        total,
        page: pagination?.page || 1,
        limit: pagination?.limit || 10,
        totalPages: Math.ceil(total / (pagination?.limit || 10)),
      },
    };
  }

  /**
   * Get Panel Assessment Meeting Details
   */
  async getPanelAssessmentMeetingDetails(
    clientId: string,
    invitationId: string
  ): Promise<IScheduledPanelAssessmentMeetingDetails> {
    const invitation =
      await this.prisma.job_panel_assessment_invitation.findFirst({
        where: { id: invitationId, clientId },
        include: {
          panelAssessment: {
            include: {
              candidate: {
                include: {
                  user: true,
                },
              },
              jobApplication: {
                include: {
                  jobPosting: true,
                },
              },
              slots: {
                where: {
                  isSelected: true,
                },
                orderBy: {
                  startDateTime: 'asc',
                },
              },
            },
          },
        },
      });

    if (!invitation) {
      throw new AppError('Invitation not found', 404, ErrorCode.NOT_FOUND);
    }

    if (!invitation.panelAssessment) {
      throw new AppError(
        'Panel assessment not found',
        404,
        ErrorCode.NOT_FOUND
      );
    }

    const { panelAssessment } = invitation;
    const selectedSlot =
      panelAssessment.slots.length > 0 ? panelAssessment.slots[0] : null;

    return {
      id: invitation.id,
      candidateName: panelAssessment.candidate.user.name,
      candidateEmail: panelAssessment.candidate.user.email,
      panelAssessmentId: panelAssessment.id,
      meetingStatus: panelAssessment.status,
      jobTitle: panelAssessment.jobApplication.jobPosting.title,
      selectedSlotDateTime:
        selectedSlot?.startDateTime ||
        panelAssessment.scheduledDate ||
        undefined,
      eventLink: invitation.eventLink || undefined,
      panelMemberNames: invitation.panelMemberNames || [],
      panelMemberEmails: invitation.panelMemberEmails || [],
    };
  }

  /**
   * Mark a panel assessment as completed
   */
  async markPanelAssessmentAsCompleted(
    clientId: string,
    panelAssessmentId: string
  ): Promise<IClientJobPanelAssessment> {
    try {
      logger.info('Marking panel assessment as completed', {
        context:
          'ClientJobPanelAssessmentService.markPanelAssessmentAsCompleted',
        clientId,
        panelAssessmentId,
      });

      // Verify the panel assessment exists and belongs to the client
      const panelAssessment = await this.prisma.job_panel_assessment.findFirst({
        where: {
          id: panelAssessmentId,
          jobApplication: {
            jobPosting: {
              clientId,
            },
          },
        },
      });

      if (!panelAssessment) {
        throw new AppError(
          'Panel assessment not found or access denied',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Check if assessment is already completed
      if (panelAssessment.status === JobPanelAssessmentStatusEnum.COMPLETED) {
        throw new AppError(
          'Panel assessment is already completed',
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }

      // Check if assessment is cancelled
      if (panelAssessment.status === JobPanelAssessmentStatusEnum.CANCELLED) {
        throw new AppError(
          'Cannot mark cancelled panel assessment as completed',
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }

      // Update the panel assessment status to completed
      const updatedAssessment = await this.prisma.job_panel_assessment.update({
        where: { id: panelAssessmentId },
        data: {
          status: JobPanelAssessmentStatusEnum.COMPLETED,
          completedAt: new Date(),
        },
      });

      logger.info('Panel assessment marked as completed successfully', {
        context:
          'ClientJobPanelAssessmentService.markPanelAssessmentAsCompleted',
        clientId,
        panelAssessmentId,
        previousStatus: panelAssessment.status,
      });

      return this.toPanelAssessmentDomain(updatedAssessment);
    } catch (error) {
      logger.error('Failed to mark panel assessment as completed', {
        context:
          'ClientJobPanelAssessmentService.markPanelAssessmentAsCompleted',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        panelAssessmentId,
      });
      throw error;
    }
  }

  // Helper method to map panel assessment to domain model
  private toPanelAssessmentDomain(assessment: any): IClientJobPanelAssessment {
    return {
      id: assessment.id,
      candidateId: assessment.candidateId,
      jobApplicationId: assessment.jobApplicationId,
      status: assessment.status as JobPanelAssessmentStatusEnum,
      result: assessment.result as JobPanelAssessmentResultEnum,
      recommendation:
        assessment.recommendation as JobPanelAssessmentRecommendationEnum,
      scheduledDate: assessment.scheduledDate,
      startedAt: assessment.startedAt,
      completedAt: assessment.completedAt,
      duration: assessment.duration,
      createdAt: assessment.createdAt,
      updatedAt: assessment.updatedAt,
    };
  }
}
