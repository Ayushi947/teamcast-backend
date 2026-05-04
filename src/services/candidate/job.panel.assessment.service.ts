import {
  job_panel_assessment_status,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import { singleton } from '@/shared/decorators/singleton';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';

import {
  ICandidatePanelAssessmentSlot,
  ICandidatePanelAssessmentInvitation,
} from '@/shared/models/domain/candidate/job.panel.assessment.domain';
import {
  JobPanelAssessmentStatusEnum,
  JobPanelAssessmentInvitationStatusEnum,
  JobPanelAssessmentSlotStatusEnum,
} from '@/shared/models/common/enums';
import { INotificationProvider } from '@/services/notification/notification.interface';
import { IScheduledInterviewItem } from '@/shared/models/api/client/job.panel.assessment.api';
import { ICandidatePanelAssessmentFilterQuery } from '@/shared/models/api/candidate/job.panel.assessment.api';
import {
  IPaginationRequest,
  IPaginatedResponse,
} from '@/shared/models/api/common/common.api';
import { getPaginationInfo } from '@/utils/pagination';

@singleton
export class CandidatePanelAssessmentService {
  private readonly prisma: PrismaClient;

  constructor(private readonly notificationProvider?: INotificationProvider) {
    this.prisma = new PrismaClient();
  }

  // Candidate responds to panel assessment invitation
  async respondToPanelAssessmentInvitation(
    invitationId: string,
    candidateId: string,
    action: JobPanelAssessmentInvitationStatusEnum,
    selectedSlotId?: string
  ): Promise<{
    invitation: ICandidatePanelAssessmentInvitation;
    message: string;
  }> {
    try {
      logger.info('Candidate responding to panel assessment invitation', {
        context:
          'CandidatePanelAssessmentService.respondToPanelAssessmentInvitation',
        invitationId,
        candidateId,
        action,
        selectedSlotId,
      });

      // Get the invitation with related data
      const invitation =
        await this.prisma.job_panel_assessment_invitation.findFirst({
          where: {
            id: invitationId,
            candidateId,
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
                  },
                },
                candidate: {
                  include: {
                    user: true,
                  },
                },
                slots: true,
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

      // Check if invitation is still valid
      if (
        invitation.status !== JobPanelAssessmentInvitationStatusEnum.PENDING
      ) {
        throw new AppError(
          'Invitation has already been responded to',
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }

      // Check if invitation has expired
      if (invitation.expiresAt && new Date() > invitation.expiresAt) {
        throw new AppError(
          'Invitation has expired',
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }

      let selectedSlot = null;
      let updatedInvitation;

      if (action === JobPanelAssessmentInvitationStatusEnum.ACCEPTED) {
        if (!selectedSlotId) {
          throw new AppError(
            'Selected slot ID is required when accepting invitation',
            400,
            ErrorCode.VALIDATION_ERROR
          );
        }

        // Verify the slot exists and is available
        selectedSlot = await this.prisma.job_panel_assessment_slots.findFirst({
          where: {
            id: selectedSlotId,
            panelAssessmentId: invitation.panelAssessmentId!,
            status: JobPanelAssessmentSlotStatusEnum.AVAILABLE,
          },
        });

        if (!selectedSlot) {
          throw new AppError(
            'Selected slot not found or no longer available',
            404,
            ErrorCode.NOT_FOUND
          );
        }

        // Update in transaction
        await this.prisma.$transaction(async (tx) => {
          // Update slot to selected
          await tx.job_panel_assessment_slots.update({
            where: { id: selectedSlotId },
            data: {
              status: JobPanelAssessmentSlotStatusEnum.SELECTED,
              isSelected: true,
            },
          });

          // Mark other slots as cancelled
          await tx.job_panel_assessment_slots.updateMany({
            where: {
              panelAssessmentId: invitation.panelAssessmentId!,
              id: { not: selectedSlotId },
              status: JobPanelAssessmentSlotStatusEnum.AVAILABLE,
            },
            data: {
              status: JobPanelAssessmentSlotStatusEnum.CANCELLED,
            },
          });

          // Update invitation
          updatedInvitation = await tx.job_panel_assessment_invitation.update({
            where: { id: invitationId },
            data: {
              status: JobPanelAssessmentInvitationStatusEnum.ACCEPTED,
              selectedSlotId,
              respondedAt: new Date(),
              acceptedAt: new Date(),
            },
          });

          // Update panel assessment status
          await tx.job_panel_assessment.update({
            where: { id: invitation.panelAssessmentId! },
            data: {
              status: JobPanelAssessmentStatusEnum.SLOT_SELECTED,
            },
          });
        });

        // Note: Status remains SLOT_SELECTED until meeting is manually scheduled
        // The status will be updated to MEETING_SCHEDULED when client generates meeting link
        logger.info(
          'Slot selected successfully, status remains SLOT_SELECTED',
          {
            context:
              'CandidatePanelAssessmentService.respondToPanelAssessmentInvitation',
            panelAssessmentId: invitation.panelAssessmentId,
            status: JobPanelAssessmentStatusEnum.SLOT_SELECTED,
          }
        );

        // Send notification emails to panel members and host using the confirmation template
        if (this.notificationProvider && selectedSlot) {
          try {
            const candidate = invitation.panelAssessment?.candidate;
            const jobPosting =
              invitation.panelAssessment?.jobApplication?.jobPosting;
            const company = jobPosting?.client?.company;

            if (candidate && jobPosting && company) {
              // Format the confirmed slot details
              const confirmedSlot = {
                date: selectedSlot.startDateTime.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }),
                localStartTime: selectedSlot.startDateTime.toLocaleTimeString(
                  'en-US',
                  {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  }
                ),
                localEndTime: selectedSlot.endDateTime.toLocaleTimeString(
                  'en-US',
                  {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  }
                ),
                duration: `${Math.round(
                  (selectedSlot.endDateTime.getTime() -
                    selectedSlot.startDateTime.getTime()) /
                    (1000 * 60)
                )} minutes`,
              };

              // Notify host using the confirmation template for slots accepted
              const confirmMethod =
                this.notificationProvider
                  .sendPanelAssessmentSlotsConfirmationEmail;
              if (selectedSlot.hostEmail && confirmMethod) {
                await confirmMethod.call(
                  this.notificationProvider,
                  selectedSlot.hostEmail,
                  selectedSlot.hostName || 'Host',
                  candidate.user.name,
                  jobPosting.title,
                  company.name,
                  confirmedSlot,
                  'Panel Interview'
                );
              }

              // Notify panel members using the confirmation template for slots accepted
              if (confirmMethod) {
                for (
                  let i = 0;
                  i < selectedSlot.panelMemberEmails.length;
                  i++
                ) {
                  const email = selectedSlot.panelMemberEmails[i];
                  const name =
                    selectedSlot.panelMemberNames[i] || 'Panel Member';

                  await confirmMethod.call(
                    this.notificationProvider,
                    email,
                    name,
                    candidate.user.name,
                    jobPosting.title,
                    company.name,
                    confirmedSlot,
                    'Panel Interview'
                  );
                }
              }
            }
          } catch (emailError) {
            logger.warn('Failed to send acceptance notification emails', {
              context:
                'CandidatePanelAssessmentService.respondToPanelAssessmentInvitation',
              error:
                emailError instanceof Error
                  ? emailError.message
                  : 'Unknown error',
              invitationId,
            });
          }
        }
      } else {
        // action === "reject"
        updatedInvitation =
          await this.prisma.job_panel_assessment_invitation.update({
            where: { id: invitationId },
            data: {
              status: JobPanelAssessmentInvitationStatusEnum.DECLINED,
              respondedAt: new Date(),
            },
          });

        // Send notification to client about rejection
        if (this.notificationProvider) {
          try {
            const candidate = invitation.panelAssessment?.candidate;
            const jobPosting =
              invitation.panelAssessment?.jobApplication?.jobPosting;
            const company = jobPosting?.client?.company;

            if (candidate && jobPosting && company) {
              // Notify host about rejection
              const slots = invitation.panelAssessment?.slots || [];
              if (slots.length > 0 && slots[0].hostEmail) {
                await this.notificationProvider.sendClientUserInvitationWithdrawnEmail(
                  slots[0].hostEmail,
                  slots[0].hostName || 'Host',
                  company.name,
                  `Panel Interview Declined - ${candidate.user.name} has declined the interview invitation`
                );
              }
            }
          } catch (emailError) {
            logger.warn('Failed to send rejection notification email', {
              context:
                'CandidatePanelAssessmentService.respondToPanelAssessmentInvitation',
              error:
                emailError instanceof Error
                  ? emailError.message
                  : 'Unknown error',
              invitationId,
            });
          }
        }
      }

      const message =
        action === JobPanelAssessmentInvitationStatusEnum.ACCEPTED
          ? 'Panel assessment invitation accepted successfully. The interview panel has been notified.'
          : 'Panel assessment invitation declined successfully. The interview panel has been notified.';

      logger.info(
        'Panel assessment invitation response processed successfully',
        {
          context:
            'CandidatePanelAssessmentService.respondToPanelAssessmentInvitation',
          invitationId,
          candidateId,
          action,
          selectedSlotId,
        }
      );

      return {
        invitation: this.toPanelAssessmentInvitationDomain(updatedInvitation),
        message,
      };
    } catch (error) {
      logger.error('Failed to process panel assessment invitation response', {
        context:
          'CandidatePanelAssessmentService.respondToPanelAssessmentInvitation',
        error: error instanceof Error ? error.message : 'Unknown error',
        invitationId,
        candidateId,
        action,
      });
      throw error;
    }
  }

  // Get panel assessment invitation for candidate
  async getPanelAssessmentInvitation(
    invitationId: string,
    candidateId: string
  ): Promise<ICandidatePanelAssessmentInvitation> {
    try {
      logger.info('Getting candidate panel assessment invitation', {
        context: 'CandidatePanelAssessmentService.getPanelAssessmentInvitation',
        invitationId,
        candidateId,
      });

      const invitation =
        await this.prisma.job_panel_assessment_invitation.findFirst({
          where: {
            id: invitationId,
            candidateId,
          },
        });

      if (!invitation) {
        throw new AppError(
          'Panel assessment invitation not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      return this.toPanelAssessmentInvitationDomain(invitation);
    } catch (error) {
      logger.error('Failed to get candidate panel assessment invitation', {
        context: 'CandidatePanelAssessmentService.getPanelAssessmentInvitation',
        error: error instanceof Error ? error.message : 'Unknown error',
        invitationId,
        candidateId,
      });
      throw error;
    }
  }

  // Get panel assessment slots for candidate
  async getPanelAssessmentSlots(
    panelAssessmentId: string,
    candidateId: string
  ): Promise<ICandidatePanelAssessmentSlot[]> {
    try {
      logger.info('Getting candidate panel assessment slots', {
        context: 'CandidatePanelAssessmentService.getPanelAssessmentSlots',
        panelAssessmentId,
        candidateId,
      });

      // First verify the candidate has access to this panel assessment
      const panelAssessment = await this.prisma.job_panel_assessment.findFirst({
        where: {
          id: panelAssessmentId,
          candidateId,
        },
      });

      if (!panelAssessment) {
        throw new AppError(
          'Panel assessment not found or access denied',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      const slots = await this.prisma.job_panel_assessment_slots.findMany({
        where: {
          panelAssessmentId,
          status: {
            in: [
              JobPanelAssessmentSlotStatusEnum.AVAILABLE,
              JobPanelAssessmentSlotStatusEnum.SELECTED,
            ],
          },
        },
        orderBy: {
          startDateTime: 'asc',
        },
      });

      return slots.map((slot) => this.toPanelAssessmentSlotDomain(slot));
    } catch (error) {
      logger.error('Failed to get candidate panel assessment slots', {
        context: 'CandidatePanelAssessmentService.getPanelAssessmentSlots',
        error: error instanceof Error ? error.message : 'Unknown error',
        panelAssessmentId,
        candidateId,
      });
      throw error;
    }
  }

  /**
   * Updates panel assessment status based on slot timing
   * @param panelAssessmentId - Single assessment ID to update
   * @returns Updated assessment with new status
   */
  async updatePanelAssessmentStatusByTiming(
    panelAssessmentId: string
  ): Promise<{
    id: string;
    previousStatus: JobPanelAssessmentStatusEnum;
    newStatus: JobPanelAssessmentStatusEnum;
    updated: boolean;
  }> {
    try {
      logger.info('Updating panel assessment status by timing', {
        context:
          'ClientJobPanelAssessmentService.updatePanelAssessmentStatusByTiming',
        panelAssessmentId,
      });

      // Get panel assessment with selected slot
      const panelAssessment = await this.prisma.job_panel_assessment.findUnique(
        {
          where: { id: panelAssessmentId },
          include: {
            slots: {
              where: { isSelected: true },
              orderBy: { startDateTime: 'asc' },
              take: 1,
            },
          },
        }
      );

      if (!panelAssessment) {
        throw new AppError(
          'Panel assessment not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      const selectedSlot = panelAssessment.slots[0];
      if (!selectedSlot) {
        logger.warn('No selected slot found for panel assessment', {
          context:
            'ClientJobPanelAssessmentService.updatePanelAssessmentStatusByTiming',
          panelAssessmentId,
        });
        return {
          id: panelAssessmentId,
          previousStatus:
            panelAssessment.status as JobPanelAssessmentStatusEnum,
          newStatus: panelAssessment.status as JobPanelAssessmentStatusEnum,
          updated: false,
        };
      }

      const currentTime = new Date();
      const slotStartTime = new Date(selectedSlot.startDateTime);
      const slotEndTime = new Date(selectedSlot.endDateTime);

      const previousStatus =
        panelAssessment.status as JobPanelAssessmentStatusEnum;
      let newStatus = previousStatus;
      let shouldUpdate = false;
      const updateData: Prisma.job_panel_assessmentUpdateInput = {};

      // Determine the new status based on timing
      if (currentTime >= slotEndTime) {
        // Assessment should be completed
        if (
          previousStatus !== JobPanelAssessmentStatusEnum.COMPLETED &&
          previousStatus !== JobPanelAssessmentStatusEnum.FAILED &&
          previousStatus !== JobPanelAssessmentStatusEnum.CANCELLED
        ) {
          newStatus = JobPanelAssessmentStatusEnum.COMPLETED;
          shouldUpdate = true;
          updateData.completedAt = currentTime;

          // Set startedAt if not already set
          if (!panelAssessment.startedAt) {
            updateData.startedAt = slotStartTime;
          }
        }
      } else if (currentTime >= slotStartTime) {
        // Assessment should be in progress
        if (
          previousStatus !== JobPanelAssessmentStatusEnum.IN_PROGRESS &&
          previousStatus !== JobPanelAssessmentStatusEnum.COMPLETED &&
          previousStatus !== JobPanelAssessmentStatusEnum.FAILED &&
          previousStatus !== JobPanelAssessmentStatusEnum.CANCELLED
        ) {
          newStatus = JobPanelAssessmentStatusEnum.IN_PROGRESS;
          shouldUpdate = true;

          // Only set startedAt if not already set
          if (!panelAssessment.startedAt) {
            updateData.startedAt = currentTime;
          }
        }
      } else {
        // Current time is before slot start time - meeting is scheduled
        if (
          previousStatus !== JobPanelAssessmentStatusEnum.MEETING_SCHEDULED &&
          previousStatus !== JobPanelAssessmentStatusEnum.COMPLETED &&
          previousStatus !== JobPanelAssessmentStatusEnum.FAILED &&
          previousStatus !== JobPanelAssessmentStatusEnum.CANCELLED
        ) {
          newStatus = JobPanelAssessmentStatusEnum.MEETING_SCHEDULED;
          shouldUpdate = true;
        }
      }

      // Update the assessment if status change is needed
      if (shouldUpdate) {
        await this.prisma.job_panel_assessment.update({
          where: { id: panelAssessmentId },
          data: {
            status: newStatus,
            ...updateData,
          },
        });

        logger.info('Panel assessment status updated', {
          context:
            'ClientJobPanelAssessmentService.updatePanelAssessmentStatusByTiming',
          panelAssessmentId,
          previousStatus,
          newStatus,
          slotStartTime: slotStartTime.toISOString(),
          slotEndTime: slotEndTime.toISOString(),
          currentTime: currentTime.toISOString(),
        });
      }

      return {
        id: panelAssessmentId,
        previousStatus,
        newStatus,
        updated: shouldUpdate,
      };
    } catch (error) {
      logger.error('Failed to update panel assessment status by timing', {
        context:
          'ClientJobPanelAssessmentService.updatePanelAssessmentStatusByTiming',
        error: error instanceof Error ? error.message : 'Unknown error',
        panelAssessmentId,
      });
      throw error;
    }
  }

  /**
   * Updates multiple panel assessment statuses based on slot timing
   * @param filters - Optional filters to limit which assessments to update
   * @returns Array of update results
   */
  async updateMultiplePanelAssessmentStatusesByTiming(filters?: {
    clientId?: string;
    candidateIds?: string[];
    statusesToUpdate?: JobPanelAssessmentStatusEnum[];
  }): Promise<
    Array<{
      id: string;
      previousStatus: JobPanelAssessmentStatusEnum;
      newStatus: JobPanelAssessmentStatusEnum;
      updated: boolean;
    }>
  > {
    try {
      logger.info('Updating multiple panel assessment statuses by timing', {
        context:
          'ClientJobPanelAssessmentService.updateMultiplePanelAssessmentStatusesByTiming',
        filters,
      });

      // Build where clause based on filters
      const where: Prisma.job_panel_assessment_slotsWhereInput = {
        isSelected: true,
      };

      if (filters?.clientId) {
        where.clientId = filters.clientId;
      }

      if (filters?.statusesToUpdate) {
        where.panelAssessment = {
          status: {
            in: filters.statusesToUpdate,
          },
        };
      } else {
        // Default to updating assessments that are not final statuses
        where.panelAssessment = {
          status: {
            notIn: [
              JobPanelAssessmentStatusEnum.COMPLETED,
              JobPanelAssessmentStatusEnum.FAILED,
              JobPanelAssessmentStatusEnum.CANCELLED,
            ],
          },
        };
      }

      if (filters?.candidateIds) {
        where.panelAssessment = {
          ...where.panelAssessment,
          candidateId: {
            in: filters.candidateIds,
          },
        };
      }

      // Get all selected slots with their panel assessments
      const selectedSlots =
        await this.prisma.job_panel_assessment_slots.findMany({
          where,
          include: {
            panelAssessment: true,
          },
          orderBy: {
            startDateTime: 'asc',
          },
        });

      logger.info('Found panel assessments to check for status updates', {
        context:
          'ClientJobPanelAssessmentService.updateMultiplePanelAssessmentStatusesByTiming',
        count: selectedSlots.length,
      });

      // Update each assessment individually
      const results = [];
      for (const slot of selectedSlots) {
        try {
          const result = await this.updatePanelAssessmentStatusByTiming(
            slot.panelAssessment.id
          );
          results.push(result);
        } catch (error) {
          logger.warn('Failed to update individual panel assessment status', {
            context:
              'ClientJobPanelAssessmentService.updateMultiplePanelAssessmentStatusesByTiming',
            panelAssessmentId: slot.panelAssessment.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          // Continue with other assessments even if one fails
          results.push({
            id: slot.panelAssessment.id,
            previousStatus: slot.panelAssessment
              .status as JobPanelAssessmentStatusEnum,
            newStatus: slot.panelAssessment
              .status as JobPanelAssessmentStatusEnum,
            updated: false,
          });
        }
      }

      const updatedCount = results.filter((r) => r.updated).length;
      logger.info('Completed multiple panel assessment status updates', {
        context:
          'ClientJobPanelAssessmentService.updateMultiplePanelAssessmentStatusesByTiming',
        totalChecked: results.length,
        totalUpdated: updatedCount,
      });

      return results;
    } catch (error) {
      logger.error(
        'Failed to update multiple panel assessment statuses by timing',
        {
          context:
            'ClientJobPanelAssessmentService.updateMultiplePanelAssessmentStatusesByTiming',
          error: error instanceof Error ? error.message : 'Unknown error',
          filters,
        }
      );
      throw error;
    }
  }

  // Helper methods for domain mapping
  private toPanelAssessmentInvitationDomain(
    invitation: any
  ): ICandidatePanelAssessmentInvitation {
    return {
      id: invitation.id,
      panelAssessmentId: invitation.panelAssessmentId!,
      status: invitation.status as JobPanelAssessmentInvitationStatusEnum,
      message: invitation.message || undefined,
      selectedSlotId: invitation.selectedSlotId || undefined,
      expiresAt: invitation.expiresAt,
      respondedAt: invitation.respondedAt || undefined,
      acceptedAt: invitation.acceptedAt || undefined,
      createdAt: invitation.createdAt,
      updatedAt: invitation.updatedAt,
    };
  }

  private toPanelAssessmentSlotDomain(
    slot: any
  ): ICandidatePanelAssessmentSlot {
    return {
      id: slot.id,
      panelAssessmentId: slot.panelAssessmentId,
      startDateTime: slot.startDateTime,
      endDateTime: slot.endDateTime,
      timeZone: slot.timeZone,
      status: slot.status as JobPanelAssessmentSlotStatusEnum,
      isSelected: slot.isSelected,
      createdAt: slot.createdAt,
      updatedAt: slot.updatedAt,
    };
  }

  async listScheduledInterviews(
    candidateId: string,
    filter?: ICandidatePanelAssessmentFilterQuery,
    paginationRequest?: IPaginationRequest
  ): Promise<IPaginatedResponse<IScheduledInterviewItem>> {
    // Get pagination info
    const paginationInfo = getPaginationInfo(paginationRequest || {});

    // Fix sortBy field name for panel assessment invitations
    if (paginationInfo.orderBy && paginationInfo.orderBy.scheduledTime) {
      paginationInfo.orderBy = {
        expiresAt: paginationInfo.orderBy.scheduledTime,
      };
    }
    // Validate status filter values
    // Validate status filter values
    if (filter?.status) {
      // Normalize to array
      const statuses = Array.isArray(filter.status)
        ? filter.status
        : [filter.status];

      const validStatuses = Object.values(job_panel_assessment_status);

      const filteredStatuses = statuses.filter((status) =>
        validStatuses.includes(status)
      );

      // Assign back normalized & validated statuses
      filter.status = filteredStatuses;
    }

    // Build where clause for filtering
    const where: any = {
      candidateId,
      status: JobPanelAssessmentInvitationStatusEnum.ACCEPTED,
    };

    // Add status filter if provided
    if (filter?.status && filter.status.length > 0) {
      const statusArray = Array.isArray(filter.status)
        ? filter.status
        : [filter.status];
      where.panelAssessment = {
        ...where.panelAssessment,
        status: {
          in: statusArray,
        },
      };
    }

    // Add search filter if provided
    if (filter?.search) {
      where.panelAssessment = {
        ...where.panelAssessment,
        jobApplication: {
          jobPosting: {
            OR: [
              {
                title: {
                  contains: filter.search,
                  mode: 'insensitive',
                },
              },
              {
                client: {
                  company: {
                    name: {
                      contains: filter.search,
                      mode: 'insensitive',
                    },
                  },
                },
              },
            ],
          },
        },
      };
    }

    const panelInterviews =
      await this.prisma.job_panel_assessment_invitation.findMany({
        where,
        skip: paginationInfo.skip,
        take: paginationInfo.take,
        orderBy: paginationInfo.orderBy,
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
      });

    if (!panelInterviews || panelInterviews.length === 0) {
      logger.info('No scheduled interviews found', {
        context: 'CandidatePanelAssessmentService.listScheduledInterviews',
        candidateId,
        filter,
      });
      return {
        items: [],
        pagination: {
          total: 0,
          page: paginationInfo.skip,
          limit: paginationInfo.take,
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
          panelAssessmentId: panelAssessment.id,
          meetingStatus: panelAssessment.status as JobPanelAssessmentStatusEnum,
          jobTitle: panelAssessment.jobApplication.jobPosting.title,
          companyName:
            panelAssessment.jobApplication.jobPosting.client.company.name,
          selectedSlotDateTime:
            selectedSlot?.startDateTime ||
            panelAssessment.scheduledDate ||
            invitation.createdAt,
          createdAt: invitation.createdAt,
          slotId: selectedSlot?.id || '',
          slotStatus: selectedSlot?.status as JobPanelAssessmentSlotStatusEnum,
          panelMemberNames:
            selectedSlot?.panelMemberNames || invitation.panelMemberNames || [],
          invitationUrl: invitation.eventLink || undefined,
        };
      });

    return {
      items: simplifiedInterviews,
      pagination: {
        total: simplifiedInterviews.length,
        page: paginationInfo.skip,
        limit: paginationInfo.take,
        totalPages: Math.ceil(
          simplifiedInterviews.length / paginationInfo.take
        ),
      },
    };
  }
}
