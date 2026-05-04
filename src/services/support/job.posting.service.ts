import { singleton } from '@/shared/decorators/singleton';
import { PrismaClient } from '@prisma/client';
import {
  ISupportJobPosting,
  ISupportJobPostingListResponse,
  toSupportJobPostingDomain,
} from '@/shared/models/domain/support/job.posting.domain';
import { JobPostingStatusEnum } from '@/shared/models/common/enums';

@singleton
export class SupportJobPostingService {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getAllJobPostingsBySupportUserId(
    supportUserId: string
  ): Promise<ISupportJobPostingListResponse> {
    const accountManager =
      await this.prisma.support_user_account_manager_assignment.findFirst({
        where: {
          supportUserId: supportUserId,
        },
      });

    if (!accountManager) {
      throw new Error('Account manager not found');
    }

    const clients =
      await this.prisma.client_account_manager_assignment.findMany({
        where: {
          accountManagerId: accountManager.accountManagerId,
        },
      });

    const jobPostings = await this.prisma.job_posting.findMany({
      where: {
        clientId: {
          in: clients.map((client) => client.clientId),
        },
        status: JobPostingStatusEnum.PUBLISHED,
      },
      include: {
        recruiterAssignments: {
          where: {
            status: 'ACTIVE',
          },
          include: {
            recruiter: {
              include: {
                user: true,
              },
            },
          },
          take: 1,
        },
      },
    });

    const supportJobPostings: ISupportJobPosting[] = jobPostings.map(
      (jobPosting) => {
        const recruiterAssignment = jobPosting.recruiterAssignments[0];
        return toSupportJobPostingDomain({
          ...jobPosting,
          recruiter: recruiterAssignment
            ? {
                id: recruiterAssignment.recruiter.id,
                name: recruiterAssignment.recruiter.user.name,
                email: recruiterAssignment.recruiter.user.email,
                assignedAt: recruiterAssignment.assignedAt,
              }
            : undefined,
        });
      }
    );

    return {
      jobPostings: supportJobPostings,
      total: supportJobPostings.length,
    };
  }

  async getJobPostingsByAccountManagerId(
    accountManagerId: string
  ): Promise<ISupportJobPostingListResponse> {
    const clients =
      await this.prisma.client_account_manager_assignment.findMany({
        where: {
          accountManagerId: accountManagerId,
        },
      });

    const jobPostings = await this.prisma.job_posting.findMany({
      where: {
        clientId: {
          in: clients.map((client) => client.clientId),
        },
        status: JobPostingStatusEnum.PUBLISHED,
      },
      include: {
        recruiterAssignments: {
          where: {
            status: 'ACTIVE',
          },
          include: {
            recruiter: {
              include: {
                user: true,
              },
            },
          },
          take: 1,
        },
      },
    });

    const supportJobPostings: ISupportJobPosting[] = jobPostings.map(
      (jobPosting) => {
        const recruiterAssignment = jobPosting.recruiterAssignments[0];
        return toSupportJobPostingDomain({
          ...jobPosting,
          recruiter: recruiterAssignment
            ? {
                id: recruiterAssignment.recruiter.id,
                name: recruiterAssignment.recruiter.user.name,
                email: recruiterAssignment.recruiter.user.email,
                assignedAt: recruiterAssignment.assignedAt,
              }
            : undefined,
        });
      }
    );

    return {
      jobPostings: supportJobPostings,
      total: supportJobPostings.length,
    };
  }
}
