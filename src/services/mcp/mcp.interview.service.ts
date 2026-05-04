/**
 * MCP Interview Service
 * Handles agent-initiated interview requests
 */

import { PrismaClient, Prisma, mcp_assessment_level } from '@prisma/client';
import { logger } from '@/shared/utils/logger';
import { ENV } from '@/config/env';
import { McpWebhookService } from '@/mcp/services/mcp.webhook.service';
import { hashPassword } from '@/utils/password';
import { NotificationFactory } from '@/services/notification/notification.factory';
import { toIAuthUser } from '@/shared/models/domain/auth/auth.user.domain';
import { getAuthToken } from '@/utils/generate.token';
import { IStorageProvider } from '@/services/helpers/storage/storage.interface';
import { StorageFactory } from '@/services/helpers/storage/storage.factory';
import { getBucketFolderPathToMcpInterviewResume } from '@/utils/presigned.urls';
import {
  IMcpInterview,
  IMcpInterviewCreate,
  IMcpInterviewFilterQuery,
  IMcpInterviewResults,
  IMcpInterviewLandingData,
  IMcpInterviewAcceptInput,
  IMcpInterviewDeclineInput,
  IMcpInterviewStartInput,
  IMcpInterviewStartResponse,
  McpInterviewStatusEnum,
  McpAssessmentLevelEnum,
  McpSkillProficiencyEnum,
  IMcpExternalCandidateData,
} from '@/shared/models/domain/client/mcp.interview.domain';

const prisma = new PrismaClient();

/**
 * MCP Interview Service class
 */
class McpInterviewServiceClass {
  private storageProvider: IStorageProvider;

  constructor() {
    this.storageProvider = StorageFactory.getInstance().getProvider();
  }

  /**
   * Sanitize filename by removing special characters
   */
  private sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();
  }

  /**
   * Request a new interview
   */
  async requestInterview(
    mcpClientId: string,
    input: IMcpInterviewCreate
  ): Promise<{
    interviewId: string;
    status: McpInterviewStatusEnum;
    candidateType: 'EXISTING' | 'EXTERNAL';
    candidateEmail: string;
    inviteUrl: string;
    expiresAt: Date;
    emailSent?: boolean;
    emailError?: string;
  }> {
    logger.info('MCP: Requesting interview', {
      context: 'mcpInterviewService.requestInterview',
      mcpClientId,
      hasExistingCandidate: !!input.candidateId,
      hasExternalCandidate: !!input.candidate,
      skillsCount: input.skillsToAssess.length,
    });

    // Validate input - must have either candidateId or candidate data
    if (!input.candidateId && !input.candidate) {
      throw new Error('Either candidateId or candidate data is required');
    }

    if (input.candidateId && input.candidate) {
      throw new Error('Cannot provide both candidateId and candidate data');
    }

    let candidateId: string | null = null;
    let candidateEmail: string;
    let candidateName: string;
    let isNewCandidate = false;
    let candidateData: IMcpExternalCandidateData | null = null;

    if (input.candidateId) {
      // Existing candidate - verify they exist and are published
      const candidate = await prisma.candidate.findUnique({
        where: { id: input.candidateId },
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

      if (!candidate) {
        throw new Error(`Candidate not found: ${input.candidateId}`);
      }

      if (!candidate.isPublished || candidate.reviewStatus !== 'PUBLISHED') {
        throw new Error('Cannot request interview for unpublished candidate');
      }

      candidateId = candidate.id;
      candidateEmail = candidate.user.email;
      candidateName = candidate.user.name;
    } else if (input.candidate) {
      // External candidate - check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: input.candidate.email.toLowerCase().trim() },
        include: {
          candidate: true,
        },
      });

      if (existingUser?.candidate) {
        // User exists with candidate profile - use existing
        candidateId = existingUser.candidate.id;
        candidateEmail = existingUser.email;
        candidateName = existingUser.name;
      } else {
        // New external candidate
        isNewCandidate = true;
        candidateEmail = input.candidate.email.toLowerCase().trim();
        candidateName = input.candidate.name;
        candidateData = {
          ...input.candidate,
          email: candidateEmail,
        };
      }
    } else {
      throw new Error('Invalid input');
    }

    // Check for existing pending interview for same candidate/skills
    const existingInterview = await prisma.mcp_interview.findFirst({
      where: {
        candidateEmail,
        mcpClientId,
        status: {
          in: ['INVITED', 'ACCEPTED', 'IN_PROGRESS'],
        },
        skillsToAssess: {
          hasSome: input.skillsToAssess,
        },
      },
    });

    if (existingInterview) {
      throw new Error(
        `Interview already pending for this candidate. Interview ID: ${existingInterview.id}`
      );
    }

    // Calculate expiry - default to 3 days if not provided
    const expiryDays = input.expiryDays || 3;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    // Create the interview first to get the ID
    const interview = await prisma.mcp_interview.create({
      data: {
        candidateId,
        isNewCandidate,
        candidateData: candidateData
          ? (candidateData as unknown as Prisma.InputJsonValue)
          : Prisma.DbNull,
        candidateEmail,
        candidateName,
        mcpClientId,
        externalReferenceId: input.externalReferenceId,
        externalCandidateId:
          input.externalCandidateId || input.candidate?.externalCandidateId,
        jobTitle: input.jobContext?.title,
        companyName: input.jobContext?.company,
        jobDescription: input.jobContext?.description,
        jobLocation: input.jobContext?.location,
        skillsToAssess: input.skillsToAssess,
        assessmentLevel: this.mapAssessmentLevel(
          input.assessmentLevel || McpAssessmentLevelEnum.INTERMEDIATE
        ),
        customInstructions: input.customInstructions,
        expectedDurationMinutes: input.expectedDurationMinutes,
        maxSections: input.maxSections,
        resumeFileUrl: null, // Will be updated after upload
        status: 'INVITED',
        expiresAt,
      },
    });

    // Handle resume file upload if provided (after interview creation to use real ID)
    if (input.resumeFile && input.resumeFileName) {
      try {
        // Convert base64 to buffer
        const fileBuffer = Buffer.from(input.resumeFile, 'base64');

        // Sanitize filename
        const sanitizedFileName = this.sanitizeFileName(input.resumeFileName);

        // Generate unique filename with timestamp
        const uniqueFileName = `${Date.now()}-${sanitizedFileName}`;

        // Get folder path using actual interview ID
        const { folderPath } = getBucketFolderPathToMcpInterviewResume(
          interview.id
        );
        const filePath = `${folderPath}/${uniqueFileName}`;

        // Upload file to storage
        await this.storageProvider.uploadFile(fileBuffer, filePath);

        // Update interview with resume file URL
        await prisma.mcp_interview.update({
          where: { id: interview.id },
          data: { resumeFileUrl: filePath },
        });

        // Store resume URL in candidateData if available for AI processing
        if (candidateData) {
          candidateData.resumeUrl = filePath;
          await prisma.mcp_interview.update({
            where: { id: interview.id },
            data: {
              candidateData: candidateData as unknown as Prisma.InputJsonValue,
            },
          });
        }

        logger.info('MCP: Resume file uploaded successfully', {
          context: 'mcpInterviewService.requestInterview',
          interviewId: interview.id,
          fileName: input.resumeFileName,
          fileSize: fileBuffer.length,
          storagePath: filePath,
        });
      } catch (error) {
        logger.error('MCP: Failed to upload resume file', {
          context: 'mcpInterviewService.requestInterview',
          interviewId: interview.id,
          fileName: input.resumeFileName,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        // Continue without resume file if upload fails
      }
    }

    // Generate invite URL
    const inviteUrl = `${ENV.FRONTEND_URL}/interview/accept/${interview.id}`;

    logger.info('MCP: Interview created', {
      context: 'mcpInterviewService.requestInterview',
      interviewId: interview.id,
      candidateEmail,
      isNewCandidate,
    });

    // Trigger webhook
    await McpWebhookService.getInstance().triggerWebhook(
      mcpClientId,
      'interview.invited',
      {
        interviewId: interview.id,
        candidateType: isNewCandidate ? 'EXTERNAL' : 'EXISTING',
        candidateEmail,
        candidateName,
        skillsToAssess: input.skillsToAssess,
        externalReferenceId: input.externalReferenceId,
        externalCandidateId: input.externalCandidateId,
        expiresAt,
      }
    );

    // Send email to candidate
    const { emailSent, emailError } = await this.sendInterviewInviteEmail({
      to: candidateEmail,
      candidateName,
      companyName:
        input.jobContext?.company || interview.companyName || 'Teamcast',
      jobTitle:
        input.jobContext?.title || interview.jobTitle || 'Interview Assessment',
      inviteUrl,
      expiryDays: input.expiryDays || 3,
      inviteMessage: input.inviteMessage,
      interviewId: interview.id,
    });

    return {
      interviewId: interview.id,
      status: McpInterviewStatusEnum.INVITED,
      candidateType: isNewCandidate ? 'EXTERNAL' : 'EXISTING',
      candidateEmail,
      inviteUrl,
      expiresAt,
      emailSent,
      emailError,
    };
  }

  private async sendInterviewInviteEmail(input: {
    to: string;
    candidateName: string;
    companyName: string;
    jobTitle: string;
    inviteUrl: string;
    expiryDays: number;
    inviteMessage?: string;
    interviewId: string;
  }): Promise<{ emailSent: boolean; emailError?: string }> {
    const provider = new NotificationFactory().getNotificationProvider();

    const expiryHours = input.expiryDays * 24;

    try {
      // Note: inviteMessage is currently not part of the shared email template.
      // If needed, we can extend the MCP-specific template to render it.
      await provider.sendMcpInterviewAssessmentInviteEmail(
        input.to,
        input.candidateName,
        input.companyName,
        input.jobTitle,
        input.inviteUrl,
        expiryHours
      );

      logger.info('MCP: Interview invite email sent', {
        context: 'mcpInterviewService.sendInterviewInviteEmail',
        interviewId: input.interviewId,
        to: input.to,
        provider: ENV.NOTIFICATION_PROVIDER,
      });

      return { emailSent: true };
    } catch (err) {
      const emailError = err instanceof Error ? err.message : 'Unknown error';

      logger.error('MCP: Interview invite email failed', {
        context: 'mcpInterviewService.sendInterviewInviteEmail',
        interviewId: input.interviewId,
        to: input.to,
        provider: ENV.NOTIFICATION_PROVIDER,
        error: emailError,
      });

      // Don't fail the whole request if email sending fails.
      return { emailSent: false, emailError };
    }
  }

  /**
   * Get interview status
   */
  async getInterviewStatus(
    mcpClientId: string,
    filters: {
      interviewId?: string;
      externalReferenceId?: string;
      candidateEmail?: string;
    }
  ): Promise<IMcpInterview | null> {
    const where: Record<string, unknown> = {
      mcpClientId,
    };

    if (filters.interviewId) {
      where.id = filters.interviewId;
    }
    if (filters.externalReferenceId) {
      where.externalReferenceId = filters.externalReferenceId;
    }
    if (filters.candidateEmail) {
      where.candidateEmail = filters.candidateEmail.toLowerCase().trim();
    }

    const interview = await prisma.mcp_interview.findFirst({
      where,
      include: {
        skillResults: true,
      },
    });

    if (!interview) {
      return null;
    }

    return this.mapToIMcpInterview(interview);
  }

  /**
   * Get interview results
   */
  async getInterviewResults(
    mcpClientId: string,
    interviewId: string
  ): Promise<IMcpInterviewResults | null> {
    const interview = await prisma.mcp_interview.findFirst({
      where: {
        id: interviewId,
        mcpClientId,
      },
      include: {
        skillResults: true,
        assessment: {
          include: {
            sections: {
              include: {
                questions: true,
              },
            },
          },
        },
        candidate: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!interview) {
      return null;
    }

    // Map sections to results
    const sections =
      interview.assessment?.sections.map((section) => ({
        name: section.title || section.type,
        skillName: section.type,
        score: section.score,
        timeSpent:
          section.startedAt && section.completedAt
            ? this.calculateDuration(section.startedAt, section.completedAt)
            : null,
        questionsAnswered:
          section.questions?.filter((q) => q.isAnswered).length ?? 0,
        questionsTotal: section.questions?.length ?? 0,
      })) || [];

    return {
      interviewId: interview.id,
      externalReferenceId: interview.externalReferenceId,
      externalCandidateId: interview.externalCandidateId,
      candidate: {
        name: interview.candidateName,
        email: interview.candidateEmail,
        teamcastCandidateId:
          interview.candidateId || interview.candidate?.id || null,
      },
      status: interview.status as McpInterviewStatusEnum,
      completedAt: interview.completedAt,
      overall: {
        score: interview.overallScore,
        recommendation: interview.recommendation,
        summary: interview.resultSummary,
      },
      skillAssessments: interview.skillResults.map((sr) => ({
        skill: sr.skillName,
        score: sr.score,
        level: sr.proficiencyLevel as McpSkillProficiencyEnum | null,
        strengths: sr.strengths,
        improvements: sr.improvements,
        notes: sr.feedback,
      })),
      sections,
    };
  }

  /**
   * List interviews for an MCP client
   */
  async listInterviews(
    mcpClientId: string,
    filter?: IMcpInterviewFilterQuery,
    pagination?: { page: number; limit: number }
  ): Promise<{ total: number; data: IMcpInterview[] }> {
    const where: Record<string, unknown> = {
      mcpClientId,
    };

    if (filter?.status) {
      where.status = Array.isArray(filter.status)
        ? { in: filter.status }
        : filter.status;
    }
    if (filter?.candidateEmail) {
      where.candidateEmail = filter.candidateEmail.toLowerCase().trim();
    }
    if (filter?.externalReferenceId) {
      where.externalReferenceId = filter.externalReferenceId;
    }
    if (filter?.externalCandidateId) {
      where.externalCandidateId = filter.externalCandidateId;
    }
    if (filter?.skillsToAssess) {
      where.skillsToAssess = { hasSome: filter.skillsToAssess };
    }
    if (filter?.fromDate || filter?.toDate) {
      where.createdAt = {};
      if (filter.fromDate) {
        (where.createdAt as Record<string, Date>).gte = filter.fromDate;
      }
      if (filter.toDate) {
        (where.createdAt as Record<string, Date>).lte = filter.toDate;
      }
    }

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const [total, interviews] = await Promise.all([
      prisma.mcp_interview.count({ where }),
      prisma.mcp_interview.findMany({
        where,
        include: {
          skillResults: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      total,
      data: interviews.map((i) => this.mapToIMcpInterview(i)),
    };
  }

  /**
   * Get interview landing data (for candidate view)
   */
  async getInterviewLandingData(
    interviewId: string
  ): Promise<IMcpInterviewLandingData | null> {
    const interview = await prisma.mcp_interview.findUnique({
      where: { id: interviewId },
    });

    if (!interview) {
      return null;
    }

    const isExpired = new Date() > interview.expiresAt;
    // Prefer explicit duration set by inviter; otherwise fallback to estimate.
    const estimatedDuration =
      interview.expectedDurationMinutes ?? interview.skillsToAssess.length * 15; // 15 mins per skill

    return {
      interviewId: interview.id,
      status: interview.status as McpInterviewStatusEnum,
      isExpired,
      candidateName: interview.candidateName,
      candidateEmail: interview.candidateEmail,
      isNewCandidate: interview.isNewCandidate,
      jobTitle: interview.jobTitle,
      companyName: interview.companyName,
      jobDescription: interview.jobDescription,
      jobLocation: interview.jobLocation,
      skillsCount: interview.skillsToAssess.length,
      expectedDurationMinutes: interview.expectedDurationMinutes,
      maxSections: interview.maxSections,
      estimatedDuration,
      expiresAt: interview.expiresAt,
    };
  }

  /**
   * Accept interview (called by candidate)
   */
  async acceptInterview(
    input: IMcpInterviewAcceptInput
  ): Promise<{ success: boolean; redirectUrl: string }> {
    const interview = await prisma.mcp_interview.findUnique({
      where: { id: input.interviewId },
      include: {
        mcpClient: true,
      },
    });

    if (!interview) {
      throw new Error('Interview not found');
    }

    if (interview.status !== 'INVITED') {
      throw new Error(
        `Interview is not in INVITED status. Current status: ${interview.status}`
      );
    }

    if (new Date() > interview.expiresAt) {
      await prisma.mcp_interview.update({
        where: { id: interview.id },
        data: { status: 'EXPIRED' },
      });
      throw new Error('Interview invitation has expired');
    }

    let userId: string | null = null;
    let candidateId: string | null = interview.candidateId;

    if (interview.isNewCandidate) {
      // Create new user and candidate
      if (!input.password) {
        throw new Error('Password is required for new candidate registration');
      }
      if (!input.acceptTerms) {
        throw new Error('Must accept terms and conditions');
      }

      const candidateData =
        interview.candidateData as IMcpExternalCandidateData | null;

      // Create user
      const hashedPassword = await hashPassword(input.password);

      const newUser = await prisma.user.create({
        data: {
          name: interview.candidateName,
          email: interview.candidateEmail,
          password: hashedPassword,
          type: 'CANDIDATE',
          role: 'INDIVIDUAL',
          status: 'ACTIVE',
          emailVerified: new Date(),
        },
      });

      userId = newUser.id;

      // Create candidate profile
      const newCandidate = await prisma.candidate.create({
        data: {
          userId: newUser.id,
          status: 'NEW',
          assessmentStage: 'RESUME_ASSESSMENT',
          isImportedCandidate: true,
        },
      });

      candidateId = newCandidate.id;

      // Create resume with external data if available
      if (candidateData) {
        await prisma.resume.create({
          data: {
            candidateId: newCandidate.id,
            currentJobTitle: candidateData.currentTitle,
            currentCompany: candidateData.currentCompany,
            totalExperience: candidateData.yearsOfExperience ?? 0,
            location: candidateData.location,
            summary: '', // Will be filled when resume is parsed
            primaryIndustry: '',
          },
        });
      }

      logger.info('MCP: New candidate registered via interview accept', {
        context: 'mcpInterviewService.acceptInterview',
        interviewId: interview.id,
        userId: newUser.id,
        candidateId: newCandidate.id,
      });
    } else {
      // Existing candidate - get user ID
      if (interview.candidateId) {
        const candidate = await prisma.candidate.findUnique({
          where: { id: interview.candidateId },
          select: { userId: true },
        });
        userId = candidate?.userId || null;
      }
    }

    // Update interview status
    await prisma.mcp_interview.update({
      where: { id: interview.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
        candidateId,
        linkedUserId: userId,
      },
    });

    // Trigger webhook
    await McpWebhookService.getInstance().triggerWebhook(
      interview.mcpClientId,
      'interview.accepted',
      {
        interviewId: interview.id,
        candidateType: interview.isNewCandidate ? 'EXTERNAL' : 'EXISTING',
        candidateEmail: interview.candidateEmail,
        candidateName: interview.candidateName,
        externalReferenceId: interview.externalReferenceId,
        externalCandidateId: interview.externalCandidateId,
        newUserId: interview.isNewCandidate ? userId : undefined,
        newCandidateId: interview.isNewCandidate ? candidateId : undefined,
        acceptedAt: new Date().toISOString(),
      }
    );

    // Redirect to the start page
    const redirectUrl = `${ENV.FRONTEND_URL}/interview/start/${interview.id}`;

    return {
      success: true,
      redirectUrl,
    };
  }

  /**
   * Start interview (creates assessment and returns redirect)
   * Called after candidate accepts and is ready to begin
   */
  async startInterview(
    input: IMcpInterviewStartInput
  ): Promise<IMcpInterviewStartResponse> {
    const now = new Date();

    const txResult = await prisma.$transaction(async (tx) => {
      const interview = await tx.mcp_interview.findUnique({
        where: { id: input.interviewId },
        include: {
          mcpClient: {
            include: {
              client: {
                include: {
                  company: true,
                  clientAiAssessmentSettings: {
                    include: {
                      globalJobAiAssessmentSettings: true,
                    },
                  },
                },
              },
            },
          },
          candidate: {
            include: {
              user: true,
              resume: true,
            },
          },
        },
      });

      if (!interview) {
        throw new Error('Interview not found');
      }

      if (!interview.candidateId || !interview.candidate) {
        throw new Error('Interview candidate not found');
      }

      if (!interview.linkedUserId) {
        throw new Error('Interview user not linked');
      }

      const client = interview.mcpClient.client;
      const candidateId = interview.candidateId;
      const candidate = interview.candidate;

      // If start is called multiple times (StrictMode/dev remounts or retries),
      // make this operation idempotent.
      if (interview.status === 'IN_PROGRESS') {
        const existingInvite = await tx.job_ai_assessment_invitation.findFirst({
          where: {
            candidateId,
            clientId: client.id,
            expiresAt: interview.expiresAt,
            type: 'AI',
          },
          orderBy: { createdAt: 'desc' },
        });

        if (!existingInvite) {
          throw new Error(
            'Interview already started but assessment invite not found'
          );
        }

        const authUser = toIAuthUser({
          ...candidate.user,
          candidate: { id: candidateId },
        });
        const authToken = getAuthToken(authUser);
        const redirectUrl = `${ENV.FRONTEND_URL}/app/candidate/assessments/ai/check?id=${existingInvite.id}&token=${authToken.accessToken}`;

        return {
          didCreate: false as const,
          response: {
            success: true,
            assessmentInviteId: existingInvite.id,
            redirectUrl,
            authToken,
            authUser,
          },
        };
      }

      if (interview.status !== 'ACCEPTED') {
        throw new Error(
          `Interview must be in ACCEPTED status to start. Current status: ${interview.status}`
        );
      }

      // Find a client_user to use as the creator/inviter
      const clientUser = await tx.client_user.findFirst({
        where: { clientId: client.id },
        orderBy: { createdAt: 'asc' },
      });
      logger.info('MCP: Client user found for this MCP client', {
        context: 'mcpInterviewService.startInterview',
        interviewId: interview.id,
        clientId: client.id,
        clientUser,
      });
      if (!clientUser) {
        logger.error('MCP: No client user found for this MCP client', {
          context: 'mcpInterviewService.startInterview',
          interviewId: interview.id,
          clientId: client.id,
        });
        throw new Error('No client user found for this MCP client');
      }

      // Guard against double-start races by atomically transitioning ACCEPTED → IN_PROGRESS.
      const updated = await tx.mcp_interview.updateMany({
        where: { id: interview.id, status: 'ACCEPTED' },
        data: { status: 'IN_PROGRESS', startedAt: now },
      });

      if (updated.count === 0) {
        // Another request started it first. Return the existing invite.
        const existingInvite = await tx.job_ai_assessment_invitation.findFirst({
          where: {
            candidateId,
            clientId: client.id,
            expiresAt: interview.expiresAt,
            type: 'AI',
          },
          orderBy: { createdAt: 'desc' },
        });

        if (!existingInvite) {
          throw new Error(
            'Interview already started but assessment invite not found'
          );
        }

        const authUser = toIAuthUser({
          ...candidate.user,
          candidate: { id: candidateId },
        });
        const authToken = getAuthToken(authUser);
        const redirectUrl = `${ENV.FRONTEND_URL}/app/candidate/assessments/ai/check?id=${existingInvite.id}&token=${authToken.accessToken}`;

        return {
          didCreate: false as const,
          response: {
            success: true,
            assessmentInviteId: existingInvite.id,
            redirectUrl,
            authToken,
            authUser,
          },
        };
      }

      // Create a virtual job posting for this MCP interview
      const jobPosting = await tx.job_posting.create({
        data: {
          clientId: client.id,
          createdById: clientUser.id,
          title:
            interview.jobTitle ||
            `Skills Assessment - ${interview.skillsToAssess.join(', ')}`,
          description:
            interview.jobDescription ||
            `AI-assisted skills assessment for ${interview.skillsToAssess.join(', ')}`,
          jobType: 'CONTRACTOR',
          jobCommitment: 'PROJECT_BASED',
          jobSchedule: 'FLEXIBLE',
          industry: 'TECHNOLOGY',
          totalExperience: 0,
          numberOfOpenings: 1,
          isRemote: true,
          status: 'DRAFT', // Keep as draft - not a real posting
          requiredSkills: interview.skillsToAssess,
          applicationDeadline: interview.expiresAt,
        },
      });

      // Create job application
      const jobApplication = await tx.job_application.create({
        data: {
          jobPostingId: jobPosting.id,
          candidateId: candidateId,
          status: 'SHORTLISTED',
        },
      });

      // Get or create client assessment settings
      const clientSettings =
        interview.mcpClient.client.clientAiAssessmentSettings;
      const baseSettings = clientSettings?.globalJobAiAssessmentSettings;

      // Override maxSections if specified in interview
      const effectiveMaxSections =
        interview.maxSections ??
        clientSettings?.maxSections ??
        baseSettings?.maxSections ??
        5;

      const effectiveDuration = interview.expectedDurationMinutes
        ? interview.expectedDurationMinutes * 60
        : (clientSettings?.defaultAssessmentDuration ?? 1800);

      logger.info('MCP: Using assessment settings', {
        context: 'mcpInterviewService.startInterview',
        interviewId: interview.id,
        maxSections: effectiveMaxSections,
        durationSeconds: effectiveDuration,
        hasCustomMaxSections: !!interview.maxSections,
        hasCustomDuration: !!interview.expectedDurationMinutes,
      });

      // Create job AI assessment invitation
      const assessmentInvitation = await tx.job_ai_assessment_invitation.create(
        {
          data: {
            candidateId: candidateId,
            clientId: client.id,
            jobApplicationId: jobApplication.id,
            invitedById: clientUser.id,
            status: 'PENDING',
            expiresAt: interview.expiresAt,
          },
        }
      );

      // Generate auth token for the candidate
      // Ensure candidateId is present in the auth user (candidate.user does not include user.candidate relation).
      const authUser = toIAuthUser({
        ...candidate.user,
        candidate: { id: candidateId },
      });
      const authToken = getAuthToken(authUser);

      logger.info('MCP: Interview started', {
        context: 'mcpInterviewService.startInterview',
        interviewId: interview.id,
        assessmentInviteId: assessmentInvitation.id,
        jobPostingId: jobPosting.id,
        jobApplicationId: jobApplication.id,
      });

      // Redirect to the assessment check page
      const redirectUrl = `${ENV.FRONTEND_URL}/app/candidate/assessments/ai/check?id=${assessmentInvitation.id}&token=${authToken.accessToken}`;

      return {
        didCreate: true as const,
        interviewForWebhook: {
          mcpClientId: interview.mcpClientId,
          interviewId: interview.id,
          candidateEmail: interview.candidateEmail,
          externalReferenceId: interview.externalReferenceId,
          externalCandidateId: interview.externalCandidateId,
        },
        response: {
          success: true,
          assessmentInviteId: assessmentInvitation.id,
          redirectUrl,
          authToken,
          authUser,
        },
      };
    });

    // Trigger webhook only once, on first successful start.
    if (txResult.didCreate) {
      await McpWebhookService.getInstance().triggerWebhook(
        txResult.interviewForWebhook.mcpClientId,
        'interview.started',
        {
          interviewId: txResult.interviewForWebhook.interviewId,
          candidateEmail: txResult.interviewForWebhook.candidateEmail,
          externalReferenceId: txResult.interviewForWebhook.externalReferenceId,
          externalCandidateId: txResult.interviewForWebhook.externalCandidateId,
          startedAt: now.toISOString(),
        }
      );
    }

    return txResult.response;
  }

  /**
   * Decline interview (called by candidate)
   */
  async declineInterview(
    input: IMcpInterviewDeclineInput
  ): Promise<{ success: boolean }> {
    const interview = await prisma.mcp_interview.findUnique({
      where: { id: input.interviewId },
    });

    if (!interview) {
      throw new Error('Interview not found');
    }

    if (interview.status !== 'INVITED') {
      throw new Error(
        `Interview is not in INVITED status. Current status: ${interview.status}`
      );
    }

    // Update interview status
    await prisma.mcp_interview.update({
      where: { id: interview.id },
      data: {
        status: 'DECLINED',
        declinedAt: new Date(),
        declineReason: input.reason,
      },
    });

    // Trigger webhook
    await McpWebhookService.getInstance().triggerWebhook(
      interview.mcpClientId,
      'interview.declined',
      {
        interviewId: interview.id,
        candidateEmail: interview.candidateEmail,
        externalReferenceId: interview.externalReferenceId,
        externalCandidateId: interview.externalCandidateId,
        declinedAt: new Date().toISOString(),
        reason: input.reason,
      }
    );

    logger.info('MCP: Interview declined', {
      context: 'mcpInterviewService.declineInterview',
      interviewId: interview.id,
      reason: input.reason,
    });

    return { success: true };
  }

  /**
   * Update interview after assessment completion
   */
  async updateInterviewResults(
    interviewId: string,
    results: {
      overallScore: number;
      recommendation: string;
      resultSummary: string;
      skillResults: Array<{
        skillName: string;
        score: number;
        proficiencyLevel: McpSkillProficiencyEnum;
        strengths: string[];
        improvements: string[];
        feedback: string;
      }>;
    }
  ): Promise<void> {
    const interview = await prisma.mcp_interview.findUnique({
      where: { id: interviewId },
    });

    if (!interview) {
      throw new Error('Interview not found');
    }

    // Update interview with results
    await prisma.mcp_interview.update({
      where: { id: interviewId },
      data: {
        status: 'RESULTS_READY',
        resultsReadyAt: new Date(),
        overallScore: results.overallScore,
        recommendation: results.recommendation,
        resultSummary: results.resultSummary,
      },
    });

    // Create skill results
    for (const sr of results.skillResults) {
      await prisma.mcp_interview_skill_result.create({
        data: {
          interviewId,
          skillName: sr.skillName,
          score: sr.score,
          proficiencyLevel: sr.proficiencyLevel,
          strengths: sr.strengths,
          improvements: sr.improvements,
          feedback: sr.feedback,
        },
      });
    }

    // Trigger webhook
    await McpWebhookService.getInstance().triggerWebhook(
      interview.mcpClientId,
      'interview.results_ready',
      {
        interviewId: interview.id,
        externalReferenceId: interview.externalReferenceId,
        externalCandidateId: interview.externalCandidateId,
        candidateEmail: interview.candidateEmail,
        overallScore: results.overallScore,
        recommendation: results.recommendation,
        skillsSummary: results.skillResults.map((sr) => ({
          skill: sr.skillName,
          score: sr.score,
          level: sr.proficiencyLevel,
        })),
      }
    );

    logger.info('MCP: Interview results updated', {
      context: 'mcpInterviewService.updateInterviewResults',
      interviewId,
      overallScore: results.overallScore,
    });
  }

  /**
   * Cancel an interview
   */
  async cancelInterview(
    mcpClientId: string,
    interviewId: string
  ): Promise<{ success: boolean }> {
    const interview = await prisma.mcp_interview.findFirst({
      where: {
        id: interviewId,
        mcpClientId,
      },
    });

    if (!interview) {
      throw new Error('Interview not found');
    }

    if (
      ['COMPLETED', 'EVALUATING', 'RESULTS_READY', 'CANCELLED'].includes(
        interview.status
      )
    ) {
      throw new Error(`Cannot cancel interview in ${interview.status} status`);
    }

    await prisma.mcp_interview.update({
      where: { id: interviewId },
      data: { status: 'CANCELLED' },
    });

    logger.info('MCP: Interview cancelled', {
      context: 'mcpInterviewService.cancelInterview',
      interviewId,
    });

    return { success: true };
  }

  // Helper methods

  private mapAssessmentLevel(
    level: McpAssessmentLevelEnum
  ): mcp_assessment_level {
    const mapping: Record<McpAssessmentLevelEnum, mcp_assessment_level> = {
      [McpAssessmentLevelEnum.JUNIOR]: 'JUNIOR',
      [McpAssessmentLevelEnum.INTERMEDIATE]: 'INTERMEDIATE',
      [McpAssessmentLevelEnum.SENIOR]: 'SENIOR',
      [McpAssessmentLevelEnum.LEAD]: 'LEAD',
    };
    return mapping[level];
  }

  private mapToIMcpInterview(
    interview: Record<string, unknown>
  ): IMcpInterview {
    return {
      id: interview.id as string,
      candidateId: interview.candidateId as string | null,
      isNewCandidate: interview.isNewCandidate as boolean,
      candidateData:
        interview.candidateData as IMcpExternalCandidateData | null,
      candidateEmail: interview.candidateEmail as string,
      candidateName: interview.candidateName as string,
      linkedUserId: interview.linkedUserId as string | null,
      mcpClientId: interview.mcpClientId as string,
      externalReferenceId: interview.externalReferenceId as string | null,
      externalCandidateId: interview.externalCandidateId as string | null,
      jobTitle: interview.jobTitle as string | null,
      companyName: interview.companyName as string | null,
      jobDescription: interview.jobDescription as string | null,
      jobLocation: interview.jobLocation as string | null,
      skillsToAssess: interview.skillsToAssess as string[],
      assessmentLevel: interview.assessmentLevel as McpAssessmentLevelEnum,
      customInstructions: interview.customInstructions as string | null,
      expectedDurationMinutes: interview.expectedDurationMinutes as
        | number
        | null,
      maxSections: interview.maxSections as number | null,
      resumeFileUrl: interview.resumeFileUrl as string | null,
      status: interview.status as McpInterviewStatusEnum,
      invitedAt: interview.invitedAt as Date,
      acceptedAt: interview.acceptedAt as Date | null,
      declinedAt: interview.declinedAt as Date | null,
      declineReason: interview.declineReason as string | null,
      startedAt: interview.startedAt as Date | null,
      completedAt: interview.completedAt as Date | null,
      resultsReadyAt: interview.resultsReadyAt as Date | null,
      expiresAt: interview.expiresAt as Date,
      assessmentId: interview.assessmentId as string | null,
      overallScore: interview.overallScore as number | null,
      recommendation: interview.recommendation as string | null,
      resultSummary: interview.resultSummary as string | null,
      createdAt: interview.createdAt as Date,
      updatedAt: interview.updatedAt as Date,
    };
  }

  private calculateDuration(start: Date, end: Date): string {
    const diffMs = end.getTime() - start.getTime();
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

// Export singleton instance
export const mcpInterviewService = new McpInterviewServiceClass();
export { McpInterviewServiceClass };
