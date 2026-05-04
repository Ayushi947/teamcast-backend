import { singleton } from '@/shared/decorators/singleton';
import { PrismaClient } from '@prisma/client';
import {
  IJobPostingRecruiterAssignment,
  IJobPostingRecruiterAssignmentWithDetails,
  toJobPostingRecruiterAssignmentDomain,
  toJobPostingRecruiterAssignmentWithDetailsDomain,
} from '@/shared/models/domain/support/job.posting.recruiter.assignment.domain';
import {
  JobPostingRecruiterAssignmentStatusEnum,
  JobPostingStatusEnum,
  UserRoleEnum,
  UserStatusEnum,
} from '@/shared/models/common/enums';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';
import { INotificationProvider } from '../notification/notification.interface';
import { NotificationFactory } from '../notification/notification.factory';
import { AccountManagerAssignmentService } from './account.manager.assignment.service';
import { ENV } from '@/config/env';

@singleton
export class JobPostingRecruiterAssignmentService {
  private readonly prisma: PrismaClient;
  private readonly notificationProvider: INotificationProvider;
  private readonly accountManagerService: AccountManagerAssignmentService;

  constructor() {
    this.prisma = new PrismaClient();
    this.notificationProvider =
      new NotificationFactory().getNotificationProvider();
    this.accountManagerService = new AccountManagerAssignmentService();
  }

  /**
   * Assign a recruiter to a job posting using round-robin algorithm
   */
  async assignRecruiterToJobPosting(
    jobPostingId: string,
    clientId: string,
    assignedBy?: string
  ): Promise<IJobPostingRecruiterAssignment> {
    try {
      logger.info('Starting recruiter assignment to job posting', {
        context:
          'JobPostingRecruiterAssignmentService.assignRecruiterToJobPosting',
        jobPostingId,
        clientId,
        assignedBy,
      });

      // Check if job posting exists and belongs to the client
      const jobPosting = await this.prisma.job_posting.findFirst({
        where: {
          id: jobPostingId,
          clientId,
        },
        include: {
          client: {
            include: {
              company: true,
              clientUsers: {
                take: 1,
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });

      if (!jobPosting) {
        throw new AppError('Job posting not found', 404, ErrorCode.NOT_FOUND);
      }

      // Check if there's already an active assignment
      const existingAssignment =
        await this.prisma.job_posting_recruiter_assignment.findFirst({
          where: {
            jobPostingId,
            status: JobPostingRecruiterAssignmentStatusEnum.ACTIVE,
          },
        });

      if (existingAssignment) {
        logger.warn('Job posting already has an active recruiter assignment', {
          context:
            'JobPostingRecruiterAssignmentService.assignRecruiterToJobPosting',
          jobPostingId,
          existingAssignmentId: existingAssignment.id,
          existingRecruiterId: existingAssignment.recruiterId,
        });
        return toJobPostingRecruiterAssignmentDomain(existingAssignment);
      }

      // Get the account manager for this client
      const accountManager =
        await this.accountManagerService.getAccountManagerByClientId(clientId);

      // Get recruiters assigned to this account manager
      const recruiters =
        await this.accountManagerService.getRecruitersByAccountManagerId(
          accountManager.id
        );

      let selectedRecruiter: any;

      if (!recruiters.length) {
        logger.warn(
          'No active recruiters available for assignment under account manager, assigning account manager as recruiter',
          {
            context:
              'JobPostingRecruiterAssignmentService.assignRecruiterToJobPosting',
            jobPostingId,
            clientId,
            accountManagerId: accountManager.id,
          }
        );

        // Get the account manager's support user record to use as recruiter
        const accountManagerSupportUser =
          await this.prisma.support_user.findFirst({
            where: {
              user: {
                id: accountManager.id,
                role: UserRoleEnum.ACCOUNT_MANAGER,
                status: UserStatusEnum.ACTIVE,
              },
            },
            include: {
              user: true,
            },
          });

        if (!accountManagerSupportUser) {
          throw new AppError(
            'Account manager support user not found or inactive',
            503,
            ErrorCode.SERVICE_UNAVAILABLE
          );
        }

        selectedRecruiter = accountManagerSupportUser;
      } else {
        // Find the next recruiter using round-robin algorithm within account manager's team
        selectedRecruiter =
          await this.getNextRecruiterRoundRobinByAccountManager(
            recruiters,
            clientId
          );
      }

      logger.info('Selected recruiter for assignment', {
        context:
          'JobPostingRecruiterAssignmentService.assignRecruiterToJobPosting',
        selectedRecruiterId: selectedRecruiter.id,
        recruiterName: selectedRecruiter.user.name,
        recruiterEmail: selectedRecruiter.user.email,
      });

      // Create the assignment
      const assignment =
        await this.prisma.job_posting_recruiter_assignment.create({
          data: {
            jobPostingId,
            recruiterId: selectedRecruiter.id,
            assignedBy,
            status: JobPostingRecruiterAssignmentStatusEnum.ACTIVE,
            notes: 'Auto-assigned via round-robin algorithm',
          },
        });

      // Send notification to recruiter
      const jobPostingUrl = `${ENV.FRONTEND_URL}/app/support/job-details/${jobPostingId}`;
      const dashboardUrl = `${ENV.FRONTEND_URL}/app/support/sourcing`;
      const clientName =
        jobPosting.client.clientUsers[0]?.user.name || 'Client Contact';

      await this.notificationProvider.sendRecruiterJobAssignmentEmail(
        selectedRecruiter.user.email,
        selectedRecruiter.user.name,
        jobPosting.title,
        jobPosting.description,
        jobPosting.client.company.name,
        clientName,
        assignedBy ? 'System' : 'Auto-Assignment',
        jobPostingUrl,
        dashboardUrl,
        accountManager.email // CC the account manager
      );

      logger.info('Recruiter assignment notification sent', {
        context:
          'JobPostingRecruiterAssignmentService.assignRecruiterToJobPosting',
        recruiterEmail: selectedRecruiter.user.email,
        jobPostingId,
      });

      // Get account manager for the client and send notification
      try {
        const accountManager =
          await this.accountManagerService.getAccountManagerByClientId(
            clientId
          );

        await this.notificationProvider.sendAccountManagerRecruiterAssignmentEmail(
          accountManager.email,
          accountManager.name,
          selectedRecruiter.user.name,
          selectedRecruiter.user.email,
          jobPosting.title,
          jobPosting.client.company.name,
          clientName,
          assignedBy ? 'System' : 'Auto-Assignment',
          jobPostingUrl,
          dashboardUrl
        );

        logger.info('Account manager notification sent', {
          context:
            'JobPostingRecruiterAssignmentService.assignRecruiterToJobPosting',
          accountManagerEmail: accountManager.email,
          jobPostingId,
        });
      } catch (accountManagerError) {
        logger.warn(
          'Failed to notify account manager about recruiter assignment',
          {
            context:
              'JobPostingRecruiterAssignmentService.assignRecruiterToJobPosting',
            error:
              accountManagerError instanceof Error
                ? accountManagerError.message
                : accountManagerError,
            clientId,
            jobPostingId,
          }
        );
        // Don't throw error - assignment was successful, just notification failed
      }

      logger.info('Recruiter assignment completed successfully', {
        context:
          'JobPostingRecruiterAssignmentService.assignRecruiterToJobPosting',
        assignmentId: assignment.id,
        jobPostingId,
        recruiterId: selectedRecruiter.id,
      });

      return toJobPostingRecruiterAssignmentDomain(assignment);
    } catch (error) {
      logger.error('Failed to assign recruiter to job posting', {
        context:
          'JobPostingRecruiterAssignmentService.assignRecruiterToJobPosting',
        error: error instanceof Error ? error.message : 'Unknown error',
        jobPostingId,
        clientId,
        assignedBy,
      });
      throw error;
    }
  }

  /**
   * Manually assign a recruiter to a job posting
   */
  async manuallyAssignRecruiterToJobPosting(
    jobPostingId: string,
    recruiterId: string,
    assignedBy?: string,
    notes?: string
  ): Promise<IJobPostingRecruiterAssignment> {
    try {
      logger.info('Starting manual recruiter assignment to job posting', {
        context:
          'JobPostingRecruiterAssignmentService.manuallyAssignRecruiterToJobPosting',
        jobPostingId,
        recruiterId,
        assignedBy,
      });

      // Check if job posting exists
      const jobPosting = await this.prisma.job_posting.findUnique({
        where: { id: jobPostingId },
        include: {
          client: {
            include: {
              company: true,
              clientUsers: {
                take: 1,
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });

      if (!jobPosting) {
        throw new AppError('Job posting not found', 404, ErrorCode.NOT_FOUND);
      }

      // Check if there's already an active assignment
      const existingAssignment =
        await this.prisma.job_posting_recruiter_assignment.findFirst({
          where: {
            jobPostingId,
            status: JobPostingRecruiterAssignmentStatusEnum.ACTIVE,
          },
        });

      if (existingAssignment) {
        logger.warn('Job posting already has an active recruiter assignment', {
          context:
            'JobPostingRecruiterAssignmentService.manuallyAssignRecruiterToJobPosting',
          jobPostingId,
          existingAssignmentId: existingAssignment.id,
          existingRecruiterId: existingAssignment.recruiterId,
        });
        return toJobPostingRecruiterAssignmentDomain(existingAssignment);
      }

      // Verify the recruiter exists, is active, and belongs to the same account manager
      const recruiter = await this.prisma.support_user.findUnique({
        where: { id: recruiterId },
        include: {
          user: true,
          accountManagerAssignments: {
            include: {
              accountManager: true,
            },
          },
        },
      });

      if (
        !recruiter ||
        recruiter.user.role !== UserRoleEnum.RECRUITER ||
        recruiter.user.status !== UserStatusEnum.ACTIVE
      ) {
        throw new AppError(
          'Invalid recruiter for assignment',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      // Get the account manager for this client
      const accountManager =
        await this.accountManagerService.getAccountManagerByClientId(
          jobPosting.clientId
        );

      // Verify the recruiter is assigned to the same account manager as the client
      const recruiterAccountManager =
        recruiter.accountManagerAssignments[0]?.accountManager;

      if (
        !recruiterAccountManager ||
        recruiterAccountManager.id !== accountManager.id
      ) {
        throw new AppError(
          'Recruiter must be assigned to the same account manager as the client',
          400,
          ErrorCode.INVALID_REQUEST
        );
      }

      logger.info('Selected recruiter for manual assignment', {
        context:
          'JobPostingRecruiterAssignmentService.manuallyAssignRecruiterToJobPosting',
        selectedRecruiterId: recruiter.id,
        recruiterName: recruiter.user.name,
        recruiterEmail: recruiter.user.email,
      });

      // Create the assignment
      const assignment =
        await this.prisma.job_posting_recruiter_assignment.create({
          data: {
            jobPostingId,
            recruiterId: recruiter.id,
            assignedBy,
            status: JobPostingRecruiterAssignmentStatusEnum.ACTIVE,
            notes: notes || `Manually assigned by ${assignedBy || 'System'}`,
          },
        });

      // Send notification to recruiter
      const jobPostingUrl = `${ENV.FRONTEND_URL}/app/support/job-details/${jobPostingId}`;
      const dashboardUrl = `${ENV.FRONTEND_URL}/app/support/sourcing`;
      const clientName =
        jobPosting.client.clientUsers[0]?.user.name || 'Client Contact';

      await this.notificationProvider.sendRecruiterJobAssignmentEmail(
        recruiter.user.email,
        recruiter.user.name,
        jobPosting.title,
        jobPosting.description,
        jobPosting.client.company.name,
        clientName,
        assignedBy || 'Manual Assignment',
        jobPostingUrl,
        dashboardUrl,
        accountManager.email // CC the account manager
      );

      logger.info('Recruiter assignment notification sent', {
        context:
          'JobPostingRecruiterAssignmentService.manuallyAssignRecruiterToJobPosting',
        recruiterEmail: recruiter.user.email,
        jobPostingId,
      });

      // Send notification to account manager
      try {
        await this.notificationProvider.sendAccountManagerRecruiterAssignmentEmail(
          accountManager.email,
          accountManager.name,
          recruiter.user.name,
          recruiter.user.email,
          jobPosting.title,
          jobPosting.client.company.name,
          clientName,
          assignedBy || 'Manual Assignment',
          jobPostingUrl,
          dashboardUrl
        );

        logger.info('Account manager notification sent', {
          context:
            'JobPostingRecruiterAssignmentService.manuallyAssignRecruiterToJobPosting',
          accountManagerEmail: accountManager.email,
          jobPostingId,
        });
      } catch (accountManagerError) {
        logger.warn(
          'Failed to notify account manager about recruiter assignment',
          {
            context:
              'JobPostingRecruiterAssignmentService.manuallyAssignRecruiterToJobPosting',
            error:
              accountManagerError instanceof Error
                ? accountManagerError.message
                : accountManagerError,
            clientId: jobPosting.clientId,
            jobPostingId,
          }
        );
        // Don't throw error - assignment was successful, just notification failed
      }

      logger.info('Manual recruiter assignment completed successfully', {
        context:
          'JobPostingRecruiterAssignmentService.manuallyAssignRecruiterToJobPosting',
        assignmentId: assignment.id,
        jobPostingId,
        recruiterId: recruiter.id,
      });

      return toJobPostingRecruiterAssignmentDomain(assignment);
    } catch (error) {
      logger.error('Failed to manually assign recruiter to job posting', {
        context:
          'JobPostingRecruiterAssignmentService.manuallyAssignRecruiterToJobPosting',
        error: error instanceof Error ? error.message : 'Unknown error',
        jobPostingId,
        recruiterId,
        assignedBy,
      });
      throw error;
    }
  }

  /**
   * Get the next recruiter using round-robin algorithm within account manager's team
   */
  private async getNextRecruiterRoundRobinByAccountManager(
    availableRecruiters: any[],
    clientId: string
  ): Promise<any> {
    // Get the account manager for this client
    const accountManager =
      await this.accountManagerService.getAccountManagerByClientId(clientId);

    // Find the last assignment for this account manager's team to determine the next recruiter
    const lastAssignment =
      await this.prisma.job_posting_recruiter_assignment.findFirst({
        where: {
          jobPosting: {
            clientId: clientId,
          },
        },
        orderBy: { assignedAt: 'desc' },
        include: {
          recruiter: true,
        },
      });

    let nextIndex = 0;
    if (lastAssignment) {
      const lastRecruiterIndex = availableRecruiters.findIndex(
        (recruiter) => recruiter.id === lastAssignment.recruiterId
      );
      if (lastRecruiterIndex !== -1) {
        nextIndex = (lastRecruiterIndex + 1) % availableRecruiters.length;
      }
    }

    logger.info('Round-robin selection for account manager team', {
      context:
        'JobPostingRecruiterAssignmentService.getNextRecruiterRoundRobinByAccountManager',
      accountManagerId: accountManager.id,
      accountManagerName: accountManager.name,
      availableRecruitersCount: availableRecruiters.length,
      selectedRecruiterIndex: nextIndex,
      selectedRecruiterId: availableRecruiters[nextIndex]?.id,
    });

    return availableRecruiters[nextIndex];
  }
  /**
   * Get recruiter assignment for a job posting
   */
  async getRecruiterAssignmentForJobPosting(
    jobPostingId: string,
    clientId: string
  ): Promise<IJobPostingRecruiterAssignmentWithDetails | null> {
    try {
      // Verify job posting belongs to client
      const jobPosting = await this.prisma.job_posting.findFirst({
        where: {
          id: jobPostingId,
          clientId,
        },
      });

      if (!jobPosting) {
        throw new AppError('Job posting not found', 404, ErrorCode.NOT_FOUND);
      }

      const assignment =
        await this.prisma.job_posting_recruiter_assignment.findFirst({
          where: {
            jobPostingId,
            status: JobPostingRecruiterAssignmentStatusEnum.ACTIVE,
          },
          include: {
            recruiter: {
              include: {
                user: true,
              },
            },
            jobPosting: {
              include: {
                client: true,
              },
            },
          },
        });

      return assignment
        ? toJobPostingRecruiterAssignmentWithDetailsDomain(assignment)
        : null;
    } catch (error) {
      logger.error('Failed to get recruiter assignment for job posting', {
        context:
          'JobPostingRecruiterAssignmentService.getRecruiterAssignmentForJobPosting',
        error: error instanceof Error ? error.message : 'Unknown error',
        jobPostingId,
        clientId,
      });
      throw error;
    }
  }

  /**
   * Reassign a recruiter to a different job posting
   */
  async reassignRecruiter(
    assignmentId: string,
    newRecruiterId: string,
    reassignedBy?: string,
    reason?: string
  ): Promise<IJobPostingRecruiterAssignment> {
    try {
      // Use a transaction to ensure atomicity
      return await this.prisma.$transaction(async (tx) => {
        // Get existing assignment
        const existingAssignment =
          await tx.job_posting_recruiter_assignment.findUnique({
            where: { id: assignmentId },
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

        if (!existingAssignment) {
          throw new AppError('Assignment not found', 404, ErrorCode.NOT_FOUND);
        }

        // Verify new recruiter exists, is active, and belongs to the same account manager
        const newRecruiter = await tx.support_user.findUnique({
          where: { id: newRecruiterId },
          include: {
            user: true,
            accountManagerAssignments: {
              include: {
                accountManager: true,
              },
            },
          },
        });

        if (
          !newRecruiter ||
          newRecruiter.user.role !== UserRoleEnum.RECRUITER ||
          newRecruiter.user.status !== UserStatusEnum.ACTIVE
        ) {
          throw new AppError(
            'Invalid recruiter for reassignment',
            400,
            ErrorCode.INVALID_REQUEST
          );
        }

        // Verify the new recruiter is assigned to the same account manager as the client
        const clientAccountManager =
          await this.accountManagerService.getAccountManagerByClientId(
            existingAssignment.jobPosting.clientId
          );

        const recruiterAccountManager =
          newRecruiter.accountManagerAssignments[0]?.accountManager;

        if (
          !recruiterAccountManager ||
          recruiterAccountManager.id !== clientAccountManager.id
        ) {
          throw new AppError(
            'Recruiter must be assigned to the same account manager as the client',
            400,
            ErrorCode.INVALID_REQUEST
          );
        }

        // Check if there's already an active assignment for this job posting
        // that is NOT the current assignment being reassigned
        const existingActiveAssignment =
          await tx.job_posting_recruiter_assignment.findFirst({
            where: {
              jobPostingId: existingAssignment.jobPostingId,
              status: JobPostingRecruiterAssignmentStatusEnum.ACTIVE,
              id: { not: assignmentId }, // Exclude the current assignment being reassigned
            },
          });

        if (existingActiveAssignment) {
          throw new AppError(
            'There is already an active assignment for this job posting. Please complete or reassign the existing assignment first.',
            400,
            ErrorCode.INVALID_REQUEST
          );
        }

        // If the current assignment is already ACTIVE, we can just update it
        if (
          existingAssignment.status ===
          JobPostingRecruiterAssignmentStatusEnum.ACTIVE
        ) {
          // Update the existing assignment with new recruiter
          const updatedAssignment =
            await tx.job_posting_recruiter_assignment.update({
              where: { id: assignmentId },
              data: {
                recruiterId: newRecruiterId,
                assignedBy: reassignedBy,
                reassignedAt: new Date(),
                reassignedReason: reason,
                notes: `Reassigned to new recruiter. Reason: ${reason || 'Not specified'}`,
              },
            });

          // Send notification to new recruiter
          const jobPostingUrl = `${ENV.FRONTEND_URL}/support/job-postings/${existingAssignment.jobPostingId}`;
          const dashboardUrl = `${ENV.FRONTEND_URL}/support/dashboard`;

          // Get account manager for CC
          const accountManagerForCC =
            await this.accountManagerService.getAccountManagerByClientId(
              existingAssignment.jobPosting.clientId
            );

          await this.notificationProvider.sendRecruiterJobAssignmentEmail(
            newRecruiter.user.email,
            newRecruiter.user.name,
            existingAssignment.jobPosting.title,
            existingAssignment.jobPosting.description,
            existingAssignment.jobPosting.client.company.name,
            'Client Contact',
            reassignedBy || 'System',
            jobPostingUrl,
            dashboardUrl,
            accountManagerForCC.email // CC the account manager
          );

          logger.info(
            'Recruiter reassignment completed (updated existing active assignment)',
            {
              context: 'JobPostingRecruiterAssignmentService.reassignRecruiter',
              assignmentId: updatedAssignment.id,
              newRecruiterId,
              reason,
            }
          );

          return toJobPostingRecruiterAssignmentDomain(updatedAssignment);
        }

        // For non-active assignments, mark as reassigned and create new active assignment
        // Mark existing assignment as reassigned
        await tx.job_posting_recruiter_assignment.update({
          where: { id: assignmentId },
          data: {
            status: JobPostingRecruiterAssignmentStatusEnum.REASSIGNED,
            reassignedAt: new Date(),
            reassignedReason: reason,
          },
        });

        // Create new assignment
        const newAssignment = await tx.job_posting_recruiter_assignment.create({
          data: {
            jobPostingId: existingAssignment.jobPostingId,
            recruiterId: newRecruiterId,
            assignedBy: reassignedBy,
            status: JobPostingRecruiterAssignmentStatusEnum.ACTIVE,
            notes: `Reassigned from previous recruiter. Reason: ${reason || 'Not specified'}`,
          },
        });

        // Send notification to new recruiter
        const jobPostingUrl = `${ENV.FRONTEND_URL}/support/job-postings/${existingAssignment.jobPostingId}`;
        const dashboardUrl = `${ENV.FRONTEND_URL}/support/dashboard`;

        // Get account manager for CC
        const accountManagerForCC =
          await this.accountManagerService.getAccountManagerByClientId(
            existingAssignment.jobPosting.clientId
          );

        await this.notificationProvider.sendRecruiterJobAssignmentEmail(
          newRecruiter.user.email,
          newRecruiter.user.name,
          existingAssignment.jobPosting.title,
          existingAssignment.jobPosting.description,
          existingAssignment.jobPosting.client.company.name,
          'Client Contact',
          reassignedBy || 'System',
          jobPostingUrl,
          dashboardUrl,
          accountManagerForCC.email // CC the account manager
        );

        logger.info(
          'Recruiter reassignment completed (created new assignment)',
          {
            context: 'JobPostingRecruiterAssignmentService.reassignRecruiter',
            oldAssignmentId: assignmentId,
            newAssignmentId: newAssignment.id,
            newRecruiterId,
            reason,
          }
        );

        return toJobPostingRecruiterAssignmentDomain(newAssignment);
      });
    } catch (error) {
      logger.error('Failed to reassign recruiter', {
        context: 'JobPostingRecruiterAssignmentService.reassignRecruiter',
        error: error instanceof Error ? error.message : 'Unknown error',
        assignmentId,
        newRecruiterId,
        reason,
      });
      throw error;
    }
  }

  /**
   * Complete a recruiter assignment
   */
  async completeAssignment(
    assignmentId: string,
    completedBy?: string,
    notes?: string
  ): Promise<IJobPostingRecruiterAssignment> {
    try {
      // Get existing assignment first to access current notes
      const existingAssignment =
        await this.prisma.job_posting_recruiter_assignment.findUnique({
          where: { id: assignmentId },
        });

      if (!existingAssignment) {
        throw new AppError('Assignment not found', 404, ErrorCode.NOT_FOUND);
      }

      const assignment =
        await this.prisma.job_posting_recruiter_assignment.update({
          where: { id: assignmentId },
          data: {
            status: JobPostingRecruiterAssignmentStatusEnum.COMPLETED,
            completedAt: new Date(),
            notes: notes || existingAssignment.notes,
          },
        });

      logger.info('Recruiter assignment completed', {
        context: 'JobPostingRecruiterAssignmentService.completeAssignment',
        assignmentId,
        completedBy,
      });

      return toJobPostingRecruiterAssignmentDomain(assignment);
    } catch (error) {
      logger.error('Failed to complete recruiter assignment', {
        context: 'JobPostingRecruiterAssignmentService.completeAssignment',
        error: error instanceof Error ? error.message : 'Unknown error',
        assignmentId,
      });
      throw error;
    }
  }

  /**
   * Get all assignments for a recruiter
   */
  async getAssignmentsForRecruiter(
    recruiterId: string
  ): Promise<IJobPostingRecruiterAssignmentWithDetails[]> {
    try {
      const assignments =
        await this.prisma.job_posting_recruiter_assignment.findMany({
          where: { recruiterId },
          include: {
            recruiter: {
              include: {
                user: true,
              },
            },
            jobPosting: {
              include: {
                client: true,
              },
            },
          },
          orderBy: { assignedAt: 'desc' },
        });

      return assignments.map(toJobPostingRecruiterAssignmentWithDetailsDomain);
    } catch (error) {
      logger.error('Failed to get assignments for recruiter', {
        context:
          'JobPostingRecruiterAssignmentService.getAssignmentsForRecruiter',
        error: error instanceof Error ? error.message : 'Unknown error',
        recruiterId,
      });
      throw error;
    }
  }

  /**
   * Get available recruiters for an account manager with pagination (for support team use)
   */
  async getAvailableRecruitersForAccountManager(
    accountManagerId: string,
    paginationRequest: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      search?: string;
    }
  ): Promise<{
    items: any[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    try {
      logger.info(
        'Getting available recruiters for account manager with pagination',
        {
          context:
            'JobPostingRecruiterAssignmentService.getAvailableRecruitersForAccountManager',
          accountManagerId,
          paginationRequest,
        }
      );

      const page = Number(paginationRequest.page) || 1;
      const limit = Number(paginationRequest.limit) || 10;
      const sortBy = paginationRequest.sortBy || 'createdAt';
      const sortOrder = paginationRequest.sortOrder || 'desc';
      const search = paginationRequest.search;

      // Build where condition for recruiters under this account manager
      const whereConditions: any = {
        accountManagerAssignments: {
          some: {
            accountManagerId,
          },
        },
        user: {
          role: UserRoleEnum.RECRUITER,
          status: UserStatusEnum.ACTIVE,
        },
      };

      // Add search conditions
      if (search) {
        whereConditions.user = {
          ...whereConditions.user,
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        };
      }

      // Build order by condition
      const orderByConditions: any = {};
      if (sortBy === 'name' || sortBy === 'email' || sortBy === 'createdAt') {
        if (sortBy === 'name' || sortBy === 'email') {
          orderByConditions.user = { [sortBy]: sortOrder };
        } else {
          orderByConditions[sortBy] = sortOrder;
        }
      } else {
        orderByConditions.createdAt = sortOrder;
      }

      // Get total count
      const totalCount = await this.prisma.support_user.count({
        where: whereConditions,
      });

      // Get paginated recruiters
      const recruiters = await this.prisma.support_user.findMany({
        where: whereConditions,
        include: {
          user: true,
        },
        orderBy: orderByConditions,
        skip: (page - 1) * limit,
        take: limit,
      });

      const formattedRecruiters = recruiters.map((recruiter) => ({
        id: recruiter.id,
        name: recruiter.user.name,
        email: recruiter.user.email,
        jobTitle: recruiter.user.jobTitle,
        role: recruiter.user.role,
        status: recruiter.user.status,
        department: recruiter.department,
        createdAt: recruiter.createdAt,
      }));

      const totalPages = Math.ceil(totalCount / limit);

      logger.info('Retrieved available recruiters for account manager', {
        context:
          'JobPostingRecruiterAssignmentService.getAvailableRecruitersForAccountManager',
        accountManagerId,
        recruiterCount: formattedRecruiters.length,
        totalCount,
        page,
        limit,
        totalPages,
      });

      return {
        items: formattedRecruiters,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      logger.error('Failed to get available recruiters for account manager', {
        context:
          'JobPostingRecruiterAssignmentService.getAvailableRecruitersForAccountManager',
        error: error instanceof Error ? error.message : 'Unknown error',
        accountManagerId,
        paginationRequest,
      });
      throw error;
    }
  }

  /**
   * Get job postings assigned to a specific recruiter with pagination
   */
  async getJobPostingsForRecruiter(
    recruiterId: string,
    paginationRequest: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      search?: string;
      status?: string;
    }
  ): Promise<{
    items: any[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    try {
      logger.info('Getting job postings for recruiter with pagination', {
        context:
          'JobPostingRecruiterAssignmentService.getJobPostingsForRecruiter',
        recruiterId,
        paginationRequest,
      });

      // Verify the recruiter exists
      const recruiter = await this.prisma.support_user.findUnique({
        where: { id: recruiterId },
        include: {
          user: true,
        },
      });

      if (!recruiter) {
        throw new AppError('Recruiter not found', 404, ErrorCode.NOT_FOUND);
      }

      const page = Number(paginationRequest.page) || 1;
      const limit = Number(paginationRequest.limit) || 10;
      const sortBy = paginationRequest.sortBy || 'assignedAt';
      const sortOrder = paginationRequest.sortOrder || 'desc';
      const search = paginationRequest.search;
      const statusFilter = paginationRequest.status;

      // Build where conditions
      const whereConditions: any = {
        recruiterId,
        status: JobPostingRecruiterAssignmentStatusEnum.ACTIVE,
      };

      // Add job posting filters
      if (search || statusFilter) {
        whereConditions.jobPosting = {};

        if (search) {
          whereConditions.jobPosting.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            {
              client: {
                company: {
                  name: { contains: search, mode: 'insensitive' },
                },
              },
            },
          ];
        }

        if (statusFilter) {
          whereConditions.jobPosting.status = statusFilter;
        }
      }

      // Build order by conditions
      const orderByConditions: any = {};
      if (sortBy === 'title' || sortBy === 'status' || sortBy === 'createdAt') {
        orderByConditions.jobPosting = { [sortBy]: sortOrder };
      } else if (sortBy === 'companyName') {
        orderByConditions.jobPosting = {
          client: {
            company: {
              name: sortOrder,
            },
          },
        };
      } else if (sortBy === 'assignedAt') {
        orderByConditions.assignedAt = sortOrder;
      } else {
        orderByConditions.assignedAt = sortOrder;
      }

      // Get total count
      const totalCount =
        await this.prisma.job_posting_recruiter_assignment.count({
          where: whereConditions,
        });

      // Get paginated assignments
      const assignments =
        await this.prisma.job_posting_recruiter_assignment.findMany({
          where: {
            ...whereConditions,
            jobPosting: {
              status: {
                in: [JobPostingStatusEnum.PUBLISHED],
              },
            },
          },
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
            recruiter: {
              include: {
                user: true,
              },
            },
          },
          orderBy: orderByConditions,
          skip: (page - 1) * limit,
          take: limit,
        });

      const jobPostings = assignments.map((assignment) => ({
        id: assignment.jobPosting.id,
        title: assignment.jobPosting.title,
        description: assignment.jobPosting.description,
        status: assignment.jobPosting.status,
        totalExperience: assignment.jobPosting.totalExperience,
        company: {
          id: assignment.jobPosting.client.company.id,
          name: assignment.jobPosting.client.company.name,
        },
        client: {
          id: assignment.jobPosting.client.id,
        },
        assignment: {
          id: assignment.id,
          assignedAt: assignment.assignedAt,
          notes: assignment.notes,
        },
        createdAt: assignment.jobPosting.createdAt,
        updatedAt: assignment.jobPosting.updatedAt,
      }));

      const totalPages = Math.ceil(totalCount / limit);

      logger.info('Retrieved job postings for recruiter', {
        context:
          'JobPostingRecruiterAssignmentService.getJobPostingsForRecruiter',
        recruiterId,
        jobPostingsCount: jobPostings.length,
        totalCount,
        page,
        limit,
        totalPages,
      });

      return {
        items: jobPostings,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      logger.error('Failed to get job postings for recruiter', {
        context:
          'JobPostingRecruiterAssignmentService.getJobPostingsForRecruiter',
        error: error instanceof Error ? error.message : 'Unknown error',
        recruiterId,
        paginationRequest,
      });
      throw error;
    }
  }
}
