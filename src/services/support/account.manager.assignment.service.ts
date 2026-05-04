import { singleton } from '@/shared/decorators/singleton';
import { PrismaClient } from '@prisma/client';
import { IClientAccountManagerAssignment } from '@/shared/models/domain/support/account.manager.assignment.domain';
import { IUser, toUserDomain } from '@/shared/models/domain/user/user.domain';
import { INotificationProvider } from '../notification/notification.interface';
import { NotificationFactory } from '../notification/notification.factory';
import { ENV } from '@/config/env';
import { ISupportAccountManagerUserDomain } from '@/shared/models/domain/support/account.manager.assignment.domain';
import { logger } from '@/shared/utils/logger';
import {
  UserStatusEnum,
  UserRoleEnum,
  UserTypeEnum,
  JobPostingStatusEnum,
} from '@/shared/models/common/enums';
import {
  IAccountManagerAssignmentHistory,
  IAccountManagerReassignmentRequest,
  IJobPostingWorkload,
  IJobPostingRedistributionPlan,
} from '@/shared/models/domain/support/account.manager.assignment.history.domain';
import { IStorageProvider } from '../helpers/storage/storage.interface';
import { StorageFactory } from '../helpers/storage/storage.factory';

@singleton
export class AccountManagerAssignmentService {
  private readonly prisma: PrismaClient;
  private static roundRobinIndex: number = 0;
  private readonly notificationProvider: INotificationProvider;
  private readonly storageService: IStorageProvider;

  constructor() {
    this.prisma = new PrismaClient();
    this.notificationProvider =
      new NotificationFactory().getNotificationProvider();
    this.storageService = StorageFactory.getInstance().getProvider();
  }

  /**
   * Assigns an account manager to a client using round-robin logic.
   */
  async assignAccountManagerToClient(
    clientId: string,
    prisma:
      | PrismaClient
      | Omit<
          PrismaClient,
          | '$connect'
          | '$disconnect'
          | '$on'
          | '$transaction'
          | '$use'
          | '$extends'
        > = this.prisma
  ): Promise<void> {
    // Validate client exists first
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        company: true,
        clientUsers: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    // Get all available account managers (support users with ACCOUNT_MANAGER role, ACTIVE status, and available for assignment)
    const accountManagers = await prisma.support_user.findMany({
      where: {
        user: {
          type: UserTypeEnum.SUPPORT,
          role: UserRoleEnum.ACCOUNT_MANAGER,
          status: UserStatusEnum.ACTIVE,
        },
        isAvailableForAssignment: true,
      },
      include: {
        user: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!accountManagers.length) {
      // Log the issue but don't throw error - allow signup to continue without account manager
      logger.warn('No account managers available for client assignment', {
        clientId,
        context: 'AccountManagerAssignmentService.assignAccountManagerToClient',
      });
      return; // Exit early without assigning an account manager
    }

    // Find the last assigned manager (if any)
    const lastAssignment =
      await prisma.client_account_manager_assignment.findFirst({
        orderBy: { assignedAt: 'desc' },
      });
    let nextIndex = 0;
    if (lastAssignment) {
      const lastManagerIndex = accountManagers.findIndex(
        (am) => am.id === lastAssignment.accountManagerId
      );
      nextIndex = (lastManagerIndex + 1) % accountManagers.length;
    }
    const selectedManager = accountManagers[nextIndex];

    // Create assignment
    await prisma.client_account_manager_assignment.create({
      data: {
        clientId,
        accountManagerId: selectedManager.id,
      },
    });

    // Send notification email if client users exist
    const primaryClientUser = client.clientUsers[0];
    if (primaryClientUser) {
      // Send email to client about account manager assignment
      await this.notificationProvider.sendClientAccountManagerAssignmentEmail(
        primaryClientUser.user.email,
        primaryClientUser.user.name,
        client.company.name,
        selectedManager.user.name,
        selectedManager.user.email,
        selectedManager.user.jobTitle || undefined,
        undefined, // phone number not available in user model
        `${ENV.FRONTEND_URL}/support`
      );
    }
  }

  /**
   * Archive recommendations when account manager changes
   */
  private async archiveJobPostingRecommendations(
    jobPostingIds: string[],
    oldAccountManagerId: string,
    prisma:
      | PrismaClient
      | Omit<
          PrismaClient,
          | '$connect'
          | '$disconnect'
          | '$on'
          | '$transaction'
          | '$use'
          | '$extends'
        > = this.prisma
  ): Promise<void> {
    for (const jobPostingId of jobPostingIds) {
      // Get all recommendations for this job posting
      const recommendations = await prisma.job_posting_recommendation.findMany({
        where: { jobPostingId },
        include: {
          jobPosting: {
            include: {
              recruiterAssignments: {
                include: {
                  recruiter: {
                    include: {
                      accountManagerAssignments: {
                        where: {
                          accountManagerId: oldAccountManagerId,
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

      // Archive each recommendation
      for (const recommendation of recommendations) {
        const recruiterAssignment =
          recommendation.jobPosting.recruiterAssignments[0];
        if (recruiterAssignment) {
          await prisma.job_posting_recommendation_archive.create({
            data: {
              originalRecommendationId: recommendation.id,
              jobPostingId: recommendation.jobPostingId,
              candidateId: recommendation.candidateId,
              recruiterId: recruiterAssignment.recruiterId,
              accountManagerId: oldAccountManagerId,
              originalScore: recommendation.score,
              originalMatchReason: recommendation.matchReason,
              originalStatus: recommendation.status,
            },
          });
        }
      }
    }
  }

  /**
   * Create history record for account manager assignment change
   */
  private async createAccountManagerAssignmentHistory(
    request: IAccountManagerReassignmentRequest,
    previousAccountManagerId: string,
    prisma:
      | PrismaClient
      | Omit<
          PrismaClient,
          | '$connect'
          | '$disconnect'
          | '$on'
          | '$transaction'
          | '$use'
          | '$extends'
        > = this.prisma
  ): Promise<IAccountManagerAssignmentHistory> {
    const history = await prisma.account_manager_assignment_history.create({
      data: {
        clientId: request.clientId,
        previousAccountManagerId,
        newAccountManagerId: request.newAccountManagerId,
        changeReason: request.changeReason,
        changedBy: request.changedBy,
        notes: request.notes,
      },
    });

    return {
      id: history.id,
      clientId: history.clientId,
      previousAccountManagerId: history.previousAccountManagerId,
      newAccountManagerId: history.newAccountManagerId || undefined,
      changeReason: history.changeReason,
      changedBy: history.changedBy,
      changedAt: history.changedAt,
      notes: history.notes || undefined,
    };
  }

  /**
   * Override the account manager for a client.
   * If an assignment exists, update it; otherwise, create a new one.
   */
  async changeAccountManager(
    clientId: string,
    accountManagerId: string,
    changedBy: string = 'system',
    changeReason: string = 'Account manager reassignment'
  ): Promise<IClientAccountManagerAssignment> {
    return await this.prisma.$transaction(async (prisma) => {
      const clientExists = await prisma.client.findUnique({
        where: { id: clientId },
      });
      if (!clientExists) {
        throw new Error('Client not found');
      }

      // Find the support user by userId (since accountManagerId is actually a user ID)
      const accountManager = await prisma.support_user.findUnique({
        where: {
          userId: accountManagerId,
        },
        include: {
          user: true,
        },
      });

      if (!accountManager) {
        throw new Error('Account manager not found');
      }

      // Get current assignment for history tracking
      const currentAssignment =
        await prisma.client_account_manager_assignment.findUnique({
          where: { clientId },
        });

      // Create history record if there was a previous assignment
      if (currentAssignment) {
        await this.createAccountManagerAssignmentHistory(
          {
            clientId,
            newAccountManagerId: accountManager.id,
            changeReason,
            changedBy,
          },
          currentAssignment.accountManagerId,
          prisma
        );

        // Archive recommendations for this client's job postings
        const clientJobPostings = await prisma.job_posting.findMany({
          where: { clientId },
          select: { id: true },
        });

        if (clientJobPostings.length > 0) {
          await this.archiveJobPostingRecommendations(
            clientJobPostings.map((jp) => jp.id),
            currentAssignment.accountManagerId,
            prisma
          );
        }

        // Redistribute job postings if both account managers have recruiters
        try {
          await this.redistributeJobPostings(
            currentAssignment.accountManagerId,
            accountManager.id,
            changedBy,
            prisma
          );
        } catch (error) {
          logger.warn(
            'Could not redistribute job postings during account manager change',
            {
              clientId,
              oldAccountManagerId: currentAssignment.accountManagerId,
              newAccountManagerId: accountManager.id,
              error: error instanceof Error ? error.message : String(error),
              context: 'AccountManagerAssignmentService.changeAccountManager',
            }
          );
        }
      }

      // Check if assignment exists
      let assignment;
      if (currentAssignment) {
        assignment = await prisma.client_account_manager_assignment.update({
          where: { clientId },
          data: {
            accountManagerId: accountManager.id,
            assignedAt: new Date(),
          },
        });
      } else {
        assignment = await prisma.client_account_manager_assignment.create({
          data: {
            clientId,
            accountManagerId: accountManager.id,
          },
        });
      }

      // Send notification email to the client about the account manager change
      const clientWithDetails = await prisma.client.findUnique({
        where: { id: clientId },
        include: {
          company: true,
          clientUsers: {
            include: {
              user: true,
            },
          },
        },
      });

      if (clientWithDetails && clientWithDetails.clientUsers.length > 0) {
        const primaryClientUser = clientWithDetails.clientUsers[0];
        // Send email to client about account manager assignment
        await this.notificationProvider.sendClientAccountManagerAssignmentEmail(
          primaryClientUser.user.email,
          primaryClientUser.user.name,
          clientWithDetails.company.name,
          accountManager.user.name,
          accountManager.user.email,
          accountManager.user.jobTitle || undefined,
          undefined, // phone number not available in user model
          `${ENV.FRONTEND_URL}/support`
        );

        // Send email to account manager about client assignment
        await this.notificationProvider.sendAccountManagerClientOnboardedEmail(
          accountManager.user.email,
          accountManager.user.name,
          primaryClientUser.user.name,
          primaryClientUser.user.email,
          clientWithDetails.company.name,
          new Date().toLocaleDateString(),
          clientWithDetails.company.companyType || 'ENTERPRISE'
        );
      }

      return {
        id: assignment.id,
        clientId: assignment.clientId,
        accountManagerId: assignment.accountManagerId,
        assignedAt: assignment.assignedAt,
      };
    });
  }

  async getAllAccountManagers(): Promise<IUser[]> {
    const accountManagers = await this.prisma.support_user.findMany({
      where: {
        user: {
          type: UserTypeEnum.SUPPORT,
          role: UserRoleEnum.ACCOUNT_MANAGER,
          status: UserStatusEnum.ACTIVE,
        },
      },
      include: {
        user: true,
      },
    });

    const accountManagersWithImage = await Promise.all(
      accountManagers.map(async (am) => {
        if (am.user.image) {
          const presignedUrl = await this.storageService.generatePreSignedUrl(
            am.user.image,
            'read'
          );
          am.user.image = presignedUrl;
        }
        return toUserDomain(am.user);
      })
    );

    return accountManagersWithImage;
  }

  async getManagerDetails(supportUserId: string): Promise<IUser | null> {
    const supportUser = await this.prisma.support_user.findUnique({
      where: { id: supportUserId },
    });

    if (!supportUser) {
      throw new Error('Support user not found');
    }

    const accountManager =
      await this.prisma.support_user_account_manager_assignment.findUnique({
        where: { supportUserId },
      });

    if (!accountManager) {
      logger.error(
        `Account manager not found for support user: ${supportUserId}`
      );
      return null;
    }

    const managerUser = await this.prisma.support_user.findUnique({
      where: { id: accountManager.accountManagerId },
      include: {
        user: true,
      },
    });

    if (!managerUser) {
      throw new Error('Account manager user not found');
    }

    if (managerUser.user.image && !managerUser.user.image.startsWith('http')) {
      const presignedUrl = await this.storageService.generatePreSignedUrl(
        managerUser.user.image,
        'read'
      );
      managerUser.user.image = presignedUrl;
    }

    return toUserDomain(managerUser.user);
  }

  /**
   * Get account manager user details for a client by clientId
   */
  async getAccountManagerByClientId(
    clientId: string
  ): Promise<ISupportAccountManagerUserDomain> {
    const assignment =
      await this.prisma.client_account_manager_assignment.findUnique({
        where: { clientId },
        include: { accountManager: { include: { user: true } } },
      });

    if (
      assignment?.accountManager?.user.image &&
      !assignment?.accountManager?.user.image.startsWith('http')
    ) {
      const presignedUrl = await this.storageService.generatePreSignedUrl(
        assignment.accountManager.user.image,
        'read'
      );
      assignment.accountManager.user.image = presignedUrl;
    }

    if (!assignment?.accountManager) {
      throw new Error('No account manager assigned for this client.');
    }

    return {
      id: assignment.accountManager.id,
      name: assignment.accountManager.user.name,
      email: assignment.accountManager.user.email,
      type: assignment.accountManager.user.type,
      role: assignment.accountManager.user.role,
      status: assignment.accountManager.user.status,
      jobTitle: assignment.accountManager.user.jobTitle || undefined,
      image: assignment.accountManager.user.image || undefined,
      createdAt: assignment.accountManager.user.createdAt,
      updatedAt: assignment.accountManager.user.updatedAt,
    };
  }

  /**
   * Get all recruiters assigned to a specific account manager
   */
  async getRecruitersByAccountManagerId(
    accountManagerId: string
  ): Promise<any[]> {
    const recruiters = await this.prisma.support_user.findMany({
      where: {
        user: {
          type: UserTypeEnum.SUPPORT,
          role: UserRoleEnum.RECRUITER,
          status: UserStatusEnum.ACTIVE,
        },
        accountManagerAssignments: {
          some: {
            accountManagerId: accountManagerId,
          },
        },
      },
      include: {
        user: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return recruiters;
  }

  /**
   * Release all recruiters assigned to an inactive account manager
   */
  async releaseRecruitersFromAccountManager(
    accountManagerId: string,
    prisma:
      | PrismaClient
      | Omit<
          PrismaClient,
          | '$connect'
          | '$disconnect'
          | '$on'
          | '$transaction'
          | '$use'
          | '$extends'
        > = this.prisma
  ): Promise<void> {
    // Remove all recruiter assignments for this account manager
    await prisma.support_user_account_manager_assignment.deleteMany({
      where: {
        accountManagerId: accountManagerId,
      },
    });

    logger.info('Released all recruiters from inactive account manager', {
      accountManagerId,
      context:
        'AccountManagerAssignmentService.releaseRecruitersFromAccountManager',
    });
  }

  /**
   * Reassign all clients of an inactive account manager to new account managers using round-robin
   */
  async reassignClientsFromInactiveAccountManager(
    inactiveAccountManagerId: string,
    requestingUserId: string,
    prisma:
      | PrismaClient
      | Omit<
          PrismaClient,
          | '$connect'
          | '$disconnect'
          | '$on'
          | '$transaction'
          | '$use'
          | '$extends'
        > = this.prisma,
    autoReassign: boolean = true
  ): Promise<void> {
    // Get all clients assigned to the inactive account manager
    const clientAssignments =
      await prisma.client_account_manager_assignment.findMany({
        where: {
          accountManagerId: inactiveAccountManagerId,
        },
        include: {
          client: {
            include: {
              company: true,
              clientUsers: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });

    if (!clientAssignments.length) {
      logger.info('No clients to reassign for inactive account manager', {
        inactiveAccountManagerId,
        context:
          'AccountManagerAssignmentService.reassignClientsFromInactiveAccountManager',
      });
      return;
    }

    // If manual reassignment is requested, only create history records without reassigning
    if (!autoReassign) {
      for (const assignment of clientAssignments) {
        // Create history record for manual reassignment tracking
        await prisma.account_manager_assignment_history.create({
          data: {
            clientId: assignment.clientId,
            previousAccountManagerId: inactiveAccountManagerId,
            newAccountManagerId: null, // Will be set when manually reassigned
            changeReason: 'AM_INACTIVE_MANUAL',
            changedBy: requestingUserId,
            notes: `Account manager became inactive - manual reassignment required`,
          },
        });

        // Archive existing recommendations for this client's job postings
        const clientJobPostings = await prisma.job_posting.findMany({
          where: { clientId: assignment.clientId },
          select: { id: true },
        });

        if (clientJobPostings.length > 0) {
          await this.archiveJobPostingRecommendations(
            clientJobPostings.map((jp) => jp.id),
            inactiveAccountManagerId,
            prisma
          );
        }
      }

      logger.info('Created history records for manual client reassignment', {
        inactiveAccountManagerId,
        clientsToReassign: clientAssignments.length,
        context:
          'AccountManagerAssignmentService.reassignClientsFromInactiveAccountManager',
      });
      return;
    }

    // Get all available active account managers (excluding the inactive one)
    const activeAccountManagers = await prisma.support_user.findMany({
      where: {
        user: {
          type: UserTypeEnum.SUPPORT,
          role: UserRoleEnum.ACCOUNT_MANAGER,
          status: UserStatusEnum.ACTIVE,
        },
        id: {
          not: inactiveAccountManagerId,
        },
        isAvailableForAssignment: true,
      },
      include: {
        user: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!activeAccountManagers.length) {
      logger.error('No active account managers available for reassignment', {
        inactiveAccountManagerId,
        clientCount: clientAssignments.length,
        context:
          'AccountManagerAssignmentService.reassignClientsFromInactiveAccountManager',
      });
      throw new Error('No active account managers available for reassignment');
    }

    // Find the last assignment to determine round-robin starting point
    const lastAssignment =
      await prisma.client_account_manager_assignment.findFirst({
        where: {
          accountManagerId: {
            not: inactiveAccountManagerId,
          },
        },
        orderBy: { assignedAt: 'desc' },
      });

    let nextIndex = 0;
    if (lastAssignment) {
      const lastManagerIndex = activeAccountManagers.findIndex(
        (am) => am.id === lastAssignment.accountManagerId
      );
      nextIndex = (lastManagerIndex + 1) % activeAccountManagers.length;
    }

    // Reassign each client to a new account manager using round-robin
    for (const assignment of clientAssignments) {
      const newAccountManager = activeAccountManagers[nextIndex];

      // Create history record for the reassignment
      await prisma.account_manager_assignment_history.create({
        data: {
          clientId: assignment.clientId,
          previousAccountManagerId: inactiveAccountManagerId,
          newAccountManagerId: newAccountManager.id,
          changeReason: 'AM_INACTIVE',
          changedBy: requestingUserId,
          notes: `Automatic reassignment due to account manager becoming inactive`,
        },
      });

      // Archive existing recommendations for this client's job postings
      const clientJobPostings = await prisma.job_posting.findMany({
        where: { clientId: assignment.clientId },
        select: { id: true },
      });

      if (clientJobPostings.length > 0) {
        await this.archiveJobPostingRecommendations(
          clientJobPostings.map((jp) => jp.id),
          inactiveAccountManagerId,
          prisma
        );
      }

      // Update the assignment
      await prisma.client_account_manager_assignment.update({
        where: { id: assignment.id },
        data: {
          accountManagerId: newAccountManager.id,
          assignedAt: new Date(),
        },
      });

      // Redistribute job postings to new account manager's recruiters
      try {
        await this.redistributeJobPostings(
          inactiveAccountManagerId,
          newAccountManager.id,
          'system',
          prisma
        );
      } catch (error) {
        logger.error(
          'Failed to redistribute job postings during reassignment',
          {
            clientId: assignment.clientId,
            inactiveAccountManagerId,
            newAccountManagerId: newAccountManager.id,
            error: error instanceof Error ? error.message : String(error),
            context:
              'AccountManagerAssignmentService.reassignClientsFromInactiveAccountManager',
          }
        );
      }

      // Send notification to client about the account manager change
      const primaryClientUser = assignment.client.clientUsers[0];
      if (primaryClientUser) {
        try {
          // Send email to client about account manager reassignment
          await this.notificationProvider.sendClientAccountManagerAssignmentEmail(
            primaryClientUser.user.email,
            primaryClientUser.user.name,
            assignment.client.company.name,
            newAccountManager.user.name,
            newAccountManager.user.email,
            newAccountManager.user.jobTitle || undefined,
            undefined,
            `${ENV.FRONTEND_URL}/support`
          );

          // Send email to new account manager about client assignment
          await this.notificationProvider.sendAccountManagerClientOnboardedEmail(
            newAccountManager.user.email,
            newAccountManager.user.name,
            primaryClientUser.user.name,
            primaryClientUser.user.email,
            assignment.client.company.name,
            new Date().toLocaleDateString(),
            assignment.client.company.companyType || 'ENTERPRISE'
          );
        } catch (error) {
          logger.error(
            'Failed to send account manager reassignment notification',
            {
              clientId: assignment.clientId,
              newAccountManagerId: newAccountManager.id,
              error: error instanceof Error ? error.message : String(error),
              context:
                'AccountManagerAssignmentService.reassignClientsFromInactiveAccountManager',
            }
          );
        }
      }

      logger.info('Client reassigned to new account manager', {
        clientId: assignment.clientId,
        oldAccountManagerId: inactiveAccountManagerId,
        newAccountManagerId: newAccountManager.id,
        newAccountManagerName: newAccountManager.user.name,
        context:
          'AccountManagerAssignmentService.reassignClientsFromInactiveAccountManager',
      });

      // Move to next account manager in round-robin
      nextIndex = (nextIndex + 1) % activeAccountManagers.length;
    }

    logger.info('Completed client reassignment from inactive account manager', {
      inactiveAccountManagerId,
      clientsReassigned: clientAssignments.length,
      activeAccountManagersCount: activeAccountManagers.length,
      context:
        'AccountManagerAssignmentService.reassignClientsFromInactiveAccountManager',
    });
  }

  /**
   * Get workload distribution for recruiters under a specific account manager
   */
  private async getRecruiterWorkloads(
    accountManagerId: string,
    prisma:
      | PrismaClient
      | Omit<
          PrismaClient,
          | '$connect'
          | '$disconnect'
          | '$on'
          | '$transaction'
          | '$use'
          | '$extends'
        > = this.prisma
  ): Promise<IJobPostingWorkload[]> {
    const recruiters =
      await this.getRecruitersByAccountManagerId(accountManagerId);
    const workloads: IJobPostingWorkload[] = [];

    for (const recruiter of recruiters) {
      // Get total job postings assigned to this recruiter
      const totalJobPostings =
        await prisma.job_posting_recruiter_assignment.count({
          where: { recruiterId: recruiter.id },
        });

      // Get fulfilled job postings (those with status CLOSED and applications)
      const fulfilledJobPostings =
        await prisma.job_posting_recruiter_assignment.count({
          where: {
            recruiterId: recruiter.id,
            jobPosting: {
              status: JobPostingStatusEnum.CLOSED,
              numberOfApplications: { gt: 0 },
            },
          },
        });

      const pendingJobPostings = totalJobPostings - fulfilledJobPostings;
      const workloadPercentage =
        totalJobPostings > 0
          ? (fulfilledJobPostings / totalJobPostings) * 100
          : 0;

      workloads.push({
        recruiterId: recruiter.id,
        recruiterName: recruiter.user.name,
        totalJobPostings,
        fulfilledJobPostings,
        pendingJobPostings,
        workloadPercentage,
      });
    }

    return workloads;
  }

  /**
   * Redistribute job postings evenly among new account manager's recruiters
   */
  private async redistributeJobPostings(
    oldAccountManagerId: string,
    newAccountManagerId: string,
    changedBy: string,
    prisma:
      | PrismaClient
      | Omit<
          PrismaClient,
          | '$connect'
          | '$disconnect'
          | '$on'
          | '$transaction'
          | '$use'
          | '$extends'
        > = this.prisma
  ): Promise<IJobPostingRedistributionPlan[]> {
    // Get all job postings from old account manager's recruiters
    const oldRecruiters =
      await this.getRecruitersByAccountManagerId(oldAccountManagerId);
    const newRecruiters =
      await this.getRecruitersByAccountManagerId(newAccountManagerId);

    if (!newRecruiters.length) {
      logger.warn('No recruiters available under new account manager', {
        newAccountManagerId,
        context: 'AccountManagerAssignmentService.redistributeJobPostings',
      });
      return [];
    }

    const redistributionPlan: IJobPostingRedistributionPlan[] = [];

    // Get workloads for new recruiters to ensure even distribution
    const newRecruiterWorkloads = await this.getRecruiterWorkloads(
      newAccountManagerId,
      prisma
    );

    for (const oldRecruiter of oldRecruiters) {
      // Get all job postings assigned to this old recruiter
      const jobPostingAssignments =
        await prisma.job_posting_recruiter_assignment.findMany({
          where: { recruiterId: oldRecruiter.id },
          include: { jobPosting: true },
        });

      for (const assignment of jobPostingAssignments) {
        // Find the recruiter with least workload for even distribution
        const targetRecruiter = newRecruiterWorkloads.reduce((prev, current) =>
          prev.pendingJobPostings < current.pendingJobPostings ? prev : current
        );

        redistributionPlan.push({
          jobPostingId: assignment.jobPostingId,
          jobTitle: assignment.jobPosting.title,
          currentRecruiterId: oldRecruiter.id,
          newRecruiterId: targetRecruiter.recruiterId,
          reason: 'Account manager change - even redistribution',
        });

        // Update the assignment
        await prisma.job_posting_recruiter_assignment.update({
          where: { id: assignment.id },
          data: { recruiterId: targetRecruiter.recruiterId },
        });

        // Create history record
        await prisma.job_posting_assignment_history.create({
          data: {
            jobPostingId: assignment.jobPostingId,
            previousRecruiterId: oldRecruiter.id,
            newRecruiterId: targetRecruiter.recruiterId,
            previousAccountManagerId: oldAccountManagerId,
            newAccountManagerId: newAccountManagerId,
            changedBy,
            notes: 'Job posting redistributed due to account manager change',
          },
        });

        // Update workload for next assignment
        const workloadIndex = newRecruiterWorkloads.findIndex(
          (w) => w.recruiterId === targetRecruiter.recruiterId
        );
        if (workloadIndex !== -1) {
          newRecruiterWorkloads[workloadIndex].pendingJobPostings++;
          newRecruiterWorkloads[workloadIndex].totalJobPostings++;
        }

        logger.info('Job posting redistributed', {
          jobPostingId: assignment.jobPostingId,
          jobTitle: assignment.jobPosting.title,
          fromRecruiterId: oldRecruiter.id,
          toRecruiterId: targetRecruiter.recruiterId,
          oldAccountManagerId,
          newAccountManagerId,
          context: 'AccountManagerAssignmentService.redistributeJobPostings',
        });
      }
    }

    return redistributionPlan;
  }

  /**
   * Handle account manager becoming inactive - release recruiters and reassign clients
   * Returns true if all clients were successfully reassigned, false otherwise
   */
  async handleInactiveAccountManager(
    accountManagerUserId: string,
    requestingUserId: string,
    autoReassign: boolean = true
  ): Promise<{ success: boolean; message: string }> {
    return await this.prisma.$transaction(async (prisma) => {
      // Find the support user by userId
      const supportUser = await prisma.support_user.findUnique({
        where: { userId: accountManagerUserId },
        include: { user: true },
      });

      if (!supportUser) {
        throw new Error('Support user not found');
      }

      // Verify this is an account manager
      if (supportUser.user.role !== UserRoleEnum.ACCOUNT_MANAGER) {
        throw new Error('User is not an account manager');
      }

      // Check if there are other available active account managers available for reassignment
      const activeAccountManagers = await prisma.support_user.findMany({
        where: {
          user: {
            type: UserTypeEnum.SUPPORT,
            role: UserRoleEnum.ACCOUNT_MANAGER,
            status: UserStatusEnum.ACTIVE,
          },
          id: {
            not: supportUser.id,
          },
          isAvailableForAssignment: true,
        },
      });

      // Get all clients assigned to this account manager
      const clientAssignments =
        await prisma.client_account_manager_assignment.findMany({
          where: {
            accountManagerId: supportUser.id,
          },
        });

      // If there are clients but no other active account managers, prevent deactivation
      // This applies to both auto and manual reassignment modes
      if (clientAssignments.length > 0 && activeAccountManagers.length === 0) {
        const errorMessage = `No active managers for reassignment.`;
        logger.warn(errorMessage, {
          accountManagerUserId,
          supportUserId: supportUser.id,
          accountManagerName: supportUser.user.name,
          clientCount: clientAssignments.length,
          activeAccountManagersCount: activeAccountManagers.length,
          autoReassign,
          context:
            'AccountManagerAssignmentService.handleInactiveAccountManager',
        });
        return { success: false, message: errorMessage };
      }

      logger.info('Processing inactive account manager', {
        accountManagerUserId,
        supportUserId: supportUser.id,
        accountManagerName: supportUser.user.name,
        clientCount: clientAssignments.length,
        activeAccountManagersCount: activeAccountManagers.length,
        autoReassign,
        context: 'AccountManagerAssignmentService.handleInactiveAccountManager',
      });

      try {
        // Step 1: Release all recruiters assigned to this account manager
        await this.releaseRecruitersFromAccountManager(supportUser.id, prisma);

        // Step 2: Reassign all clients to new account managers using round-robin or manual
        await this.reassignClientsFromInactiveAccountManager(
          supportUser.id,
          requestingUserId,
          prisma,
          autoReassign
        );

        // Step 3: Verify all clients have been successfully reassigned (only for auto reassignment)
        if (autoReassign) {
          const remainingAssignments =
            await prisma.client_account_manager_assignment.findMany({
              where: {
                accountManagerId: supportUser.id,
              },
            });

          if (remainingAssignments.length > 0) {
            const errorMessage = `Failed to reassign all clients. ${remainingAssignments.length} clients still assigned to account manager ${supportUser.user.name}.`;
            logger.error(errorMessage, {
              accountManagerUserId,
              supportUserId: supportUser.id,
              accountManagerName: supportUser.user.name,
              remainingAssignments: remainingAssignments.length,
              context:
                'AccountManagerAssignmentService.handleInactiveAccountManager',
            });
            return { success: false, message: errorMessage };
          }
        }

        logger.info('Successfully processed inactive account manager', {
          accountManagerUserId,
          supportUserId: supportUser.id,
          accountManagerName: supportUser.user.name,
          clientsProcessed: clientAssignments.length,
          autoReassign,
          context:
            'AccountManagerAssignmentService.handleInactiveAccountManager',
        });

        const message = autoReassign
          ? `Successfully reassigned ${clientAssignments.length} clients from account manager ${supportUser.user.name}`
          : `Successfully processed ${clientAssignments.length} clients from account manager ${supportUser.user.name}. Manual reassignment required.`;

        return {
          success: true,
          message,
        };
      } catch (error) {
        const errorMessage = `Failed to process inactive account manager ${supportUser.user.name}: ${error instanceof Error ? error.message : String(error)}`;
        logger.error(errorMessage, {
          accountManagerUserId,
          supportUserId: supportUser.id,
          accountManagerName: supportUser.user.name,
          error: error instanceof Error ? error.message : String(error),
          context:
            'AccountManagerAssignmentService.handleInactiveAccountManager',
        });
        return { success: false, message: errorMessage };
      }
    });
  }

  /**
   * Get workload statistics for an account manager's recruiters
   */
  async getAccountManagerRecruiterWorkloads(
    accountManagerId: string
  ): Promise<IJobPostingWorkload[]> {
    return this.getRecruiterWorkloads(accountManagerId);
  }

  async assignAccountManagerToRecruiter(
    recruiterId: string,
    accountManagerId: string
  ): Promise<IUser> {
    const recruiter = await this.prisma.support_user.findUnique({
      where: { id: recruiterId },
      include: {
        user: true,
      },
    });

    if (!recruiter) {
      throw new Error('Recruiter not found');
    }

    const accountManager = await this.prisma.support_user.findUnique({
      where: { userId: accountManagerId },
    });

    if (!accountManager) {
      throw new Error('Account manager not found');
    }

    const recruiterAccountManagerAssignment =
      await this.prisma.support_user_account_manager_assignment.findUnique({
        where: { supportUserId: recruiterId },
      });

    if (recruiterAccountManagerAssignment) {
      throw new Error('Recruiter already has an account manager assigned');
    }

    await this.prisma.support_user_account_manager_assignment.create({
      data: {
        supportUserId: recruiterId,
        accountManagerId: accountManager.id,
        assignedAt: new Date(),
      },
    });

    return toUserDomain(recruiter.user);
  }

  /**
   * Change/reassign the account manager for a recruiter
   */
  async changeAccountManagerForRecruiter(
    recruiterId: string,
    newAccountManagerId: string,
    changedBy: string = 'system',
    changeReason: string = 'Account manager reassignment'
  ): Promise<IUser> {
    const recruiter = await this.prisma.support_user.findUnique({
      where: { id: recruiterId },
      include: {
        user: true,
      },
    });

    if (!recruiter) {
      throw new Error('Recruiter not found');
    }

    const newAccountManager = await this.prisma.support_user.findUnique({
      where: { userId: newAccountManagerId },
    });

    if (!newAccountManager) {
      throw new Error('Account manager not found');
    }

    const recruiterAccountManagerAssignment =
      await this.prisma.support_user_account_manager_assignment.findUnique({
        where: { supportUserId: recruiterId },
      });

    if (!recruiterAccountManagerAssignment) {
      throw new Error(
        'Recruiter does not have an account manager assigned. Use assign endpoint instead.'
      );
    }

    // Update the assignment
    await this.prisma.support_user_account_manager_assignment.update({
      where: { supportUserId: recruiterId },
      data: {
        accountManagerId: newAccountManager.id,
        assignedAt: new Date(),
      },
    });

    logger.info('Account manager changed for recruiter', {
      context:
        'AccountManagerAssignmentService.changeAccountManagerForRecruiter',
      recruiterId,
      oldAccountManagerId: recruiterAccountManagerAssignment.accountManagerId,
      newAccountManagerId: newAccountManager.id,
      changedBy,
      changeReason,
    });

    return toUserDomain(recruiter.user);
  }

  /**
   * Get the account manager assigned to a recruiter
   */
  async getAccountManagerByRecruiterId(
    recruiterId: string
  ): Promise<ISupportAccountManagerUserDomain> {
    const recruiterAccountManagerAssignment =
      await this.prisma.support_user_account_manager_assignment.findUnique({
        where: { supportUserId: recruiterId },
        include: {
          accountManager: {
            include: {
              user: true,
            },
          },
        },
      });

    if (!recruiterAccountManagerAssignment) {
      throw new Error('No account manager assigned to this recruiter');
    }

    const accountManager = recruiterAccountManagerAssignment.accountManager;

    return {
      id: accountManager.user.id,
      name: accountManager.user.name,
      email: accountManager.user.email,
      type: accountManager.user.type,
      role: accountManager.user.role,
      status: accountManager.user.status,
      jobTitle: accountManager.user.jobTitle || undefined,
      image: accountManager.user.image || undefined,
      createdAt: accountManager.user.createdAt,
      updatedAt: accountManager.user.updatedAt,
    };
  }

  /**
   * Toggle account manager availability status
   */
  async toggleAccountManagerAvailability(
    accountManagerUserId: string,
    isAvailable: boolean
  ): Promise<{ success: boolean; message: string; isAvailable: boolean }> {
    try {
      // Find the support user by userId
      const supportUser = await this.prisma.support_user.findUnique({
        where: { userId: accountManagerUserId },
        include: { user: true },
      });

      if (!supportUser) {
        throw new Error('Support user not found');
      }

      // Verify this is an account manager
      if (supportUser.user.role !== UserRoleEnum.ACCOUNT_MANAGER) {
        throw new Error('User is not an account manager');
      }

      // Update availability status
      await this.prisma.support_user.update({
        where: { id: supportUser.id },
        data: { isAvailableForAssignment: isAvailable },
      });

      const statusText = isAvailable ? 'available' : 'unavailable';
      const message = `Account manager ${supportUser.user.name} is now ${statusText} for new client assignments`;

      logger.info('Account manager availability status updated', {
        accountManagerUserId,
        supportUserId: supportUser.id,
        accountManagerName: supportUser.user.name,
        isAvailable,
        context:
          'AccountManagerAssignmentService.toggleAccountManagerAvailability',
      });

      return {
        success: true,
        message,
        isAvailable,
      };
    } catch (error) {
      const errorMessage = `Failed to update account manager availability: ${error instanceof Error ? error.message : String(error)}`;
      logger.error(errorMessage, {
        accountManagerUserId,
        isAvailable,
        error: error instanceof Error ? error.message : String(error),
        context:
          'AccountManagerAssignmentService.toggleAccountManagerAvailability',
      });

      return {
        success: false,
        message: errorMessage,
        isAvailable: !isAvailable, // Return the opposite since the update failed
      };
    }
  }

  /**
   * Get account manager availability status
   */
  async getAccountManagerAvailabilityStatus(
    accountManagerUserId: string
  ): Promise<{ isAvailable: boolean; name: string }> {
    const supportUser = await this.prisma.support_user.findUnique({
      where: { userId: accountManagerUserId },
      include: { user: true },
    });

    if (!supportUser) {
      throw new Error('Support user not found');
    }

    if (supportUser.user.role !== UserRoleEnum.ACCOUNT_MANAGER) {
      throw new Error('User is not an account manager');
    }

    return {
      isAvailable: supportUser.isAvailableForAssignment,
      name: supportUser.user.name,
    };
  }
}
