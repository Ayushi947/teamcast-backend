import { JobInviteStatusEnum } from '../../common/enums';
import { ISupportJobPostingInviteDetail } from '../../../models/api/support/job.posting.invite.api';

/**
 * Domain model for job posting invite with detailed information
 */
export interface ISupportJobPostingInvite {
  id: string;
  email: string;
  name: string;
  jobId: string;
  inviterId: string;
  status: JobInviteStatusEnum;
  expiresAt: Date;
  isSupportInvite: boolean;
  isImportedCandidate?: boolean;
  integrationId?: string; // ID of the integration provider used for import
  invitationUrl?: string;
  createdAt: Date;
  updatedAt: Date;

  // Job posting details
  jobPosting?: {
    id: string;
    title: string;
    description: string;
    jobType: string;
    jobCommitment: string;
    jobSchedule: string;
    industry: string;
    department?: string;
    isRemote: boolean;
    minSalary?: number;
    maxSalary?: number;
    salaryCurrency?: string;
    client?: {
      id: string;
      company?: {
        id: string;
        name: string;
      };
    };
  };

  // Inviter details
  inviter?: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Response model for list of job posting invites
 */
export interface ISupportJobPostingInviteListResponse {
  invites: ISupportJobPostingInvite[];
  total: number;
}

/**
 * Filter query interface for job posting invites
 */
export interface ISupportJobPostingInviteFilterQuery {
  email?: string;
  name?: string;
  status?: JobInviteStatusEnum;
  jobId?: string;
  invitedAfter?: string;
  invitedBefore?: string;
}

/**
 * Domain model for creating a job posting invite
 */
export interface ISupportJobPostingInviteCreate {
  email: string;
  name: string;
  jobId: string;
  inviterId: string;
  jobTitle: string;
}

/**
 * Domain model for invite candidate
 */
export interface ISupportJobPostingInviteCandidate {
  name: string;
  email: string;
}

/**
 * Domain model for bulk invite request
 */
export interface ISupportJobPostingInviteBulkRequest {
  candidates: ISupportJobPostingInviteCandidate[];
  jobTitle: string;
  jobId: string;
}

/**
 * Domain model for invite response
 */
export interface ISupportJobPostingInviteResponse {
  id: string;
  status: JobInviteStatusEnum;
  message: string;
}

/**
 * Domain model for bulk invite response
 */
export interface ISupportJobPostingInviteBulkResponse {
  results: ISupportJobPostingInviteResponse[];
  total: number;
  successful: number;
  failed: number;
}

/**
 * Transform Prisma job_invite to domain model
 */
export const toSupportJobPostingInviteDomain = (
  data: any
): ISupportJobPostingInvite => ({
  id: data.id,
  email: data.email,
  name: data.name,
  jobId: data.jobId,
  inviterId: data.inviterId,
  status: data.status,
  expiresAt: data.expiresAt,
  isSupportInvite: data.isSupportInvite || false,
  invitationUrl: data.invitationUrl,
  isImportedCandidate: data.isImportedCandidate || false,
  integrationId: data.integrationId,
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
  jobPosting: data.jobPosting
    ? {
        id: data.jobPosting.id,
        title: data.jobPosting.title,
        description: data.jobPosting.description,
        jobType: data.jobPosting.jobType,
        jobCommitment: data.jobPosting.jobCommitment,
        jobSchedule: data.jobPosting.jobSchedule,
        industry: data.jobPosting.industry,
        department: data.jobPosting.department,
        isRemote: data.jobPosting.isRemote,
        minSalary: data.jobPosting.minSalary,
        maxSalary: data.jobPosting.maxSalary,
        salaryCurrency: data.jobPosting.salaryCurrency,
        client: data.jobPosting.client
          ? {
              id: data.jobPosting.client.id,
              company: data.jobPosting.client.company
                ? {
                    id: data.jobPosting.client.company.id,
                    name: data.jobPosting.client.company.name,
                  }
                : undefined,
            }
          : undefined,
      }
    : undefined,
  inviter: data.inviter
    ? {
        id: data.inviter.id,
        name: data.inviter.name,
        email: data.inviter.email,
      }
    : undefined,
});

/**
 * Transform domain model to API response
 */
export const toSupportJobPostingInviteApiResponse = (
  invite: ISupportJobPostingInvite
): ISupportJobPostingInviteDetail => ({
  id: invite.id,
  email: invite.email,
  name: invite.name,
  jobId: invite.jobId,
  inviterId: invite.inviterId,
  status: invite.status,
  expiresAt: invite.expiresAt.toISOString(),
  isSupportInvite: invite.isSupportInvite,
  invitationUrl: invite.invitationUrl,
  isImportedCandidate: invite.isImportedCandidate,
  integrationId: invite.integrationId,
  createdAt: invite.createdAt.toISOString(),
  updatedAt: invite.updatedAt.toISOString(),
  jobPosting: invite.jobPosting
    ? {
        id: invite.jobPosting.id,
        title: invite.jobPosting.title,
        description: invite.jobPosting.description,
        jobType: invite.jobPosting.jobType,
        jobCommitment: invite.jobPosting.jobCommitment,
        jobSchedule: invite.jobPosting.jobSchedule,
        industry: invite.jobPosting.industry,
        department: invite.jobPosting.department,
        isRemote: invite.jobPosting.isRemote,
        minSalary: invite.jobPosting.minSalary,
        maxSalary: invite.jobPosting.maxSalary,
        salaryCurrency: invite.jobPosting.salaryCurrency,
        client: invite.jobPosting.client
          ? {
              id: invite.jobPosting.client.id,
              company: invite.jobPosting.client.company
                ? {
                    id: invite.jobPosting.client.company.id,
                    name: invite.jobPosting.client.company.name,
                  }
                : undefined,
            }
          : undefined,
      }
    : undefined,
  inviter: invite.inviter
    ? {
        id: invite.inviter.id,
        name: invite.inviter.name,
        email: invite.inviter.email,
      }
    : undefined,
});
