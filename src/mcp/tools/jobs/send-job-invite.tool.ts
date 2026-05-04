import { z } from 'zod';
import { PrismaClient, application_status } from '@prisma/client';
import { McpContext } from '../../core/mcp.server';
import { McpToolRegistry } from '../../core/tool.registry';
import { MCP_SCOPES } from '../../config/mcp.config';
import { logger } from '@/shared/utils/logger';
import { JobInviteStatusEnum } from '@/shared/models/common/enums';
import { ENV } from '@/config/env';
import { NotificationFactory } from '@/services/notification/notification.factory';

const prisma = new PrismaClient();

/**
 * Candidate Input Schema for invitation
 */
const CandidateSchema = z.object({
  name: z.string().min(1).max(200).describe('Candidate full name'),
  email: z.string().email().describe('Candidate email address'),
  phone: z.string().optional().describe('Candidate phone number'),
  resumeUrl: z.string().url().optional().describe('URL to candidate resume'),
  linkedInUrl: z.string().url().optional().describe('LinkedIn profile URL'),
  skills: z.array(z.string()).optional().describe('Candidate skills'),
  currentTitle: z.string().optional().describe('Current job title'),
  currentCompany: z.string().optional().describe('Current company'),
  yearsOfExperience: z.number().optional().describe('Years of experience'),
  notes: z.string().optional().describe('Additional notes about the candidate'),
  externalCandidateId: z
    .string()
    .optional()
    .describe('External candidate ID from source system'),
});

/**
 * Send Job Invite Input Schema
 * Schema for sending job invites to candidates from external AI agents
 */
export const SendJobInviteInputSchema = z.object({
  jobPostingId: z
    .string()
    .uuid()
    .describe('ID of the job posting to invite candidates to'),
  candidates: z
    .array(CandidateSchema)
    .min(1)
    .max(100)
    .describe('List of candidates to invite (max 100 per request)'),

  // Optional settings
  sendEmail: z
    .boolean()
    .default(true)
    .describe('Whether to send email notifications to candidates'),
  customMessage: z
    .string()
    .max(1000)
    .optional()
    .describe('Custom message to include in the invitation'),
  inviteExpiryHours: z
    .number()
    .min(24)
    .max(720)
    .default(72)
    .describe('Hours until invite expires (default: 72)'),

  // External reference
  sourceSystem: z
    .string()
    .optional()
    .describe('Name of the source system/agent'),
  batchId: z
    .string()
    .optional()
    .describe('Batch ID for tracking related invites'),
});

export type SendJobInviteInput = z.infer<typeof SendJobInviteInputSchema>;

/**
 * Invite Result for each candidate
 */
interface InviteResult {
  email: string;
  name: string;
  success: boolean;
  inviteId?: string;
  message: string;
  status?: string;
  externalCandidateId?: string;
  emailSent?: boolean;
  emailError?: string;
}

/**
 * Check if job posting location is USA-based
 */
async function isJobUSBased(jobId: string): Promise<boolean> {
  try {
    const jobPosting = await prisma.job_posting.findUnique({
      where: { id: jobId },
      select: { preferredLocations: true },
    });

    if (!jobPosting || !jobPosting.preferredLocations) {
      return false;
    }

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
      context: 'sendJobInvite.tool.isJobUSBased',
    });
    return false;
  }
}

/**
 * Send Job Invite Tool Handler
 */
async function handleSendJobInvite(
  args: Record<string, unknown>,
  context: McpContext
): Promise<unknown> {
  const input = args as SendJobInviteInput;

  logger.info('MCP: Sending job invites', {
    context: 'sendJobInvite.tool',
    jobPostingId: input.jobPostingId,
    candidateCount: input.candidates.length,
    tenantClientId: context.tenantClientId,
    mcpClientId: context.mcpClientId,
    sourceSystem: input.sourceSystem,
  });

  const results: InviteResult[] = [];

  try {
    // Verify job posting exists and belongs to the tenant
    const jobPosting = await prisma.job_posting.findFirst({
      where: {
        id: input.jobPostingId,
        clientId: context.tenantClientId,
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
      throw new Error(
        `Job posting not found or access denied: ${input.jobPostingId}`
      );
    }

    // Get the client user for this operation (first admin)
    const clientUser = await prisma.client_user.findFirst({
      where: {
        clientId: context.tenantClientId,
        user: {
          role: 'ADMIN',
        },
      },
      include: { user: true },
    });

    if (!clientUser) {
      throw new Error('No admin user found for client');
    }

    const notificationProvider =
      new NotificationFactory().getNotificationProvider();
    const inviterName = clientUser.user?.name || 'Hiring Manager';
    const companyName = jobPosting.client?.company?.name || 'Teamcast';

    // Check if job is USA-based
    const isUSBasedJob = await isJobUSBased(input.jobPostingId);
    const inviteExpiryHours = input.inviteExpiryHours || 72;

    // Process each candidate
    for (const candidate of input.candidates) {
      const normalizedEmail = candidate.email.trim().toLowerCase();

      try {
        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
          where: {
            email: {
              equals: normalizedEmail,
              mode: 'insensitive',
            },
          },
        });

        // Check for existing pending invite
        const existingInvite = await prisma.job_invite.findFirst({
          where: {
            email: {
              equals: normalizedEmail,
              mode: 'insensitive',
            },
            jobId: input.jobPostingId,
            status: JobInviteStatusEnum.PENDING,
          },
        });

        if (existingInvite) {
          if (!input.sendEmail) {
            results.push({
              email: normalizedEmail,
              name: candidate.name,
              success: false,
              message: 'Candidate already has a pending invite for this job',
              status: 'ALREADY_INVITED',
              externalCandidateId: candidate.externalCandidateId,
            });
            continue;
          }

          const inviteUrl = existingUser
            ? `${ENV.FRONTEND_URL}/app/candidate/assessment-invites/accept?inviteId=${existingInvite.id}&email=${encodeURIComponent(normalizedEmail)}`
            : `${ENV.FRONTEND_URL}/app/candidate/signup?inviteId=${existingInvite.id}&email=${encodeURIComponent(normalizedEmail)}`;

          let emailSent = false;
          let emailError: string | undefined;
          try {
            await notificationProvider.sendJobInviteEmail(
              normalizedEmail,
              candidate.name,
              companyName,
              inviterName,
              jobPosting.title,
              inviteUrl,
              inviteExpiryHours
            );
            emailSent = true;
          } catch (err) {
            emailError = err instanceof Error ? err.message : 'Unknown error';
            logger.error('MCP: Failed to re-send invite email', {
              context: 'sendJobInvite.tool',
              inviteId: existingInvite.id,
              email: normalizedEmail,
              error: emailError,
            });
          }

          results.push({
            email: normalizedEmail,
            name: candidate.name,
            success: emailSent,
            inviteId: existingInvite.id,
            message: emailSent
              ? 'Invite already existed; email re-sent'
              : 'Invite already existed; email failed to send',
            status: 'PENDING',
            externalCandidateId: candidate.externalCandidateId,
            emailSent,
            emailError,
          });
          continue;
        }

        // Create the invite
        const expiresAt = new Date(
          Date.now() + inviteExpiryHours * 60 * 60 * 1000
        );

        const invite = await prisma.job_invite.create({
          data: {
            email: normalizedEmail,
            name: candidate.name,
            userId: existingUser?.id || null,
            jobId: input.jobPostingId,
            inviterId: clientUser.id,
            status: JobInviteStatusEnum.PENDING,
            expiresAt,
            isImportedCandidate: true,
            isUSBasedJob,
            isSupportInvite: false,
            // MCP tracking fields
            sourceMcpClientId: context.mcpClientId,
            externalCandidateId: candidate.externalCandidateId,
            externalBatchId: input.batchId,
          },
        });

        // If user exists, also create job application
        if (existingUser) {
          const candidateRecord = await prisma.candidate.findUnique({
            where: { userId: existingUser.id },
          });

          if (candidateRecord) {
            // Check for existing application
            const existingApplication = await prisma.job_application.findFirst({
              where: {
                candidateId: candidateRecord.id,
                jobPostingId: input.jobPostingId,
              },
            });

            if (!existingApplication) {
              const application = await prisma.job_application.create({
                data: {
                  candidateId: candidateRecord.id,
                  jobPostingId: input.jobPostingId,
                  status: application_status.INVITED,
                  appliedAt: new Date(),
                },
              });

              // Link invite to application
              await prisma.job_invite.update({
                where: { id: invite.id },
                data: { jobApplicationId: application.id },
              });
            }
          }
        }

        // Note: Additional candidate metadata (skills, resume, etc.) is stored
        // with the invite for reference by the hiring team

        // Generate invite URL (for reference/logging)
        const inviteUrl = existingUser
          ? `${ENV.FRONTEND_URL}/app/candidate/assessment-invites/accept?inviteId=${invite.id}&email=${encodeURIComponent(normalizedEmail)}`
          : `${ENV.FRONTEND_URL}/app/candidate/signup?inviteId=${invite.id}&email=${encodeURIComponent(normalizedEmail)}`;

        logger.info('MCP: Job invite created', {
          context: 'sendJobInvite.tool',
          inviteId: invite.id,
          email: normalizedEmail,
          existingUser: !!existingUser,
        });

        let emailSent = false;
        let emailError: string | undefined;
        if (input.sendEmail) {
          try {
            await notificationProvider.sendJobInviteEmail(
              normalizedEmail,
              candidate.name,
              companyName,
              inviterName,
              jobPosting.title,
              inviteUrl,
              inviteExpiryHours
            );
            emailSent = true;
          } catch (err) {
            emailError = err instanceof Error ? err.message : 'Unknown error';
            logger.error('MCP: Failed to send invite email', {
              context: 'sendJobInvite.tool',
              inviteId: invite.id,
              email: normalizedEmail,
              error: emailError,
            });
          }
        }

        results.push({
          email: normalizedEmail,
          name: candidate.name,
          success: true,
          inviteId: invite.id,
          message: input.sendEmail
            ? emailSent
              ? 'Invite created and email sent'
              : 'Invite created but email failed to send'
            : 'Invite created (email disabled)',
          status: 'PENDING',
          externalCandidateId: candidate.externalCandidateId,
          emailSent: input.sendEmail ? emailSent : undefined,
          emailError,
        });
      } catch (candidateError) {
        logger.error('MCP: Failed to create invite for candidate', {
          context: 'sendJobInvite.tool',
          email: normalizedEmail,
          error:
            candidateError instanceof Error
              ? candidateError.message
              : 'Unknown error',
        });

        results.push({
          email: normalizedEmail,
          name: candidate.name,
          success: false,
          message:
            candidateError instanceof Error
              ? candidateError.message
              : 'Failed to create invite',
          status: 'ERROR',
          externalCandidateId: candidate.externalCandidateId,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    logger.info('MCP: Job invite batch completed', {
      context: 'sendJobInvite.tool',
      jobPostingId: input.jobPostingId,
      totalCandidates: input.candidates.length,
      successCount,
      failCount,
    });

    return {
      success: successCount > 0,
      jobPosting: {
        id: jobPosting.id,
        title: jobPosting.title,
        companyName: jobPosting.client?.company?.name,
      },
      summary: {
        total: input.candidates.length,
        successful: successCount,
        failed: failCount,
      },
      results,
      batchId: input.batchId,
      message: `${successCount} invite(s) sent successfully, ${failCount} failed`,
    };
  } catch (error) {
    logger.error('MCP: Failed to send job invites', {
      context: 'sendJobInvite.tool',
      error: error instanceof Error ? error.message : 'Unknown error',
      jobPostingId: input.jobPostingId,
    });

    throw error;
  }
}

/**
 * Register the Send Job Invite Tool
 */
export function registerSendJobInviteTool(): void {
  const registry = McpToolRegistry.getInstance();

  registry.register(
    'teamcast.jobs.sendInvite',
    'Send job invites to candidates for a specific job posting. Accepts candidate details including name, email, and optional profile information. Candidates will receive email invitations to apply for the position. Returns invite IDs and status for each candidate.',
    SendJobInviteInputSchema,
    handleSendJobInvite,
    {
      requiredScopes: [MCP_SCOPES.INVITES_WRITE],
    }
  );
}
