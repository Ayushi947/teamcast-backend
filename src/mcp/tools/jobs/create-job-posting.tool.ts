import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { McpContext } from '../../core/mcp.server';
import { McpToolRegistry } from '../../core/tool.registry';
import { MCP_SCOPES } from '../../config/mcp.config';
import { logger } from '@/shared/utils/logger';
import {
  WorkTypeEnum,
  WorkCommitmentEnum,
  WorkScheduleEnum,
  CompanyIndustryEnum,
  JobPostingStatusEnum,
} from '@/shared/models/common/enums';

const prisma = new PrismaClient();

/**
 * Create Job Posting Input Schema
 * Schema for receiving job posting data from external AI agents
 */
export const CreateJobPostingInputSchema = z.object({
  // Required fields
  title: z.string().min(1).max(200).describe('Job title'),
  description: z.string().min(10).describe('Detailed job description'),

  // Job type and work arrangements
  jobType: z
    .enum(['REMOTE', 'ONSITE', 'HYBRID'])
    .default('REMOTE')
    .describe('Type of work arrangement'),
  jobCommitment: z
    .enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE'])
    .default('FULL_TIME')
    .describe('Employment commitment type'),
  jobSchedule: z
    .enum(['FLEXIBLE', 'FIXED', 'SHIFT_BASED', 'ASYNC'])
    .default('FLEXIBLE')
    .describe('Work schedule type'),

  // Industry and experience
  industry: z
    .enum([
      'TECHNOLOGY',
      'FINANCE',
      'HEALTHCARE',
      'EDUCATION',
      'RETAIL',
      'MANUFACTURING',
      'CONSULTING',
      'MEDIA',
      'REAL_ESTATE',
      'TRANSPORTATION',
      'HOSPITALITY',
      'ENERGY',
      'AGRICULTURE',
      'CONSTRUCTION',
      'GOVERNMENT',
      'NON_PROFIT',
      'OTHER',
    ])
    .default('TECHNOLOGY')
    .describe('Industry sector'),
  totalExperience: z
    .number()
    .min(0)
    .max(50)
    .default(0)
    .describe('Years of experience required'),

  // Team and reporting
  department: z.string().optional().describe('Department name'),
  teamSize: z.number().optional().describe('Size of the team'),
  reportingTo: z.string().optional().describe('Reporting manager/role'),
  hiringManagerEmail: z
    .string()
    .email()
    .optional()
    .describe('Hiring manager email'),

  // Compensation
  minSalary: z.number().min(0).default(0).describe('Minimum salary'),
  maxSalary: z.number().min(0).default(0).describe('Maximum salary'),
  salaryCurrency: z.string().default('USD').describe('Salary currency code'),
  equity: z.boolean().default(false).describe('Whether equity is offered'),

  // Job details
  numberOfOpenings: z
    .number()
    .min(1)
    .default(1)
    .describe('Number of positions'),
  responsibilities: z
    .array(z.string())
    .default([])
    .describe('List of job responsibilities'),
  benefits: z.array(z.string()).default([]).describe('List of benefits'),
  tags: z.array(z.string()).default([]).describe('Job tags/keywords'),

  // Location preferences
  isRemote: z.boolean().default(true).describe('Whether position is remote'),
  preferredLocations: z
    .array(z.string())
    .default([])
    .describe('Preferred candidate locations'),

  // Candidate requirements
  requiredSkills: z
    .array(z.string())
    .default([])
    .describe('Required skills for the position'),
  preferredSkills: z
    .array(z.string())
    .default([])
    .describe('Preferred/nice-to-have skills'),
  preferredUniversities: z
    .array(z.string())
    .default([])
    .describe('Preferred universities'),
  preferredDegrees: z
    .array(z.string())
    .default([])
    .describe('Preferred degrees'),
  preferredIndustries: z
    .array(z.string())
    .default([])
    .describe('Preferred previous industries'),

  // Dates
  applicationDeadline: z
    .string()
    .datetime()
    .optional()
    .describe('Application deadline (ISO 8601)'),
  availableFrom: z
    .string()
    .datetime()
    .optional()
    .describe('Position available from date (ISO 8601)'),

  // Publishing
  isPublished: z
    .boolean()
    .default(false)
    .describe('Whether to publish immediately'),
  isFeatured: z
    .boolean()
    .default(false)
    .describe('Whether to feature the posting'),

  // External reference
  externalJobId: z
    .string()
    .optional()
    .describe('External job ID from source system'),
  sourceSystem: z
    .string()
    .optional()
    .describe('Name of the source system/agent'),
});

export type CreateJobPostingInput = z.infer<typeof CreateJobPostingInputSchema>;

/**
 * Create Job Posting Tool Handler
 */
async function handleCreateJobPosting(
  args: Record<string, unknown>,
  context: McpContext
): Promise<unknown> {
  const input = args as CreateJobPostingInput;

  logger.info('MCP: Creating job posting', {
    context: 'createJobPosting.tool',
    title: input.title,
    tenantClientId: context.tenantClientId,
    mcpClientId: context.mcpClientId,
    sourceSystem: input.sourceSystem,
  });

  try {
    // Get the client for this tenant
    const client = await prisma.client.findFirst({
      where: { id: context.tenantClientId },
      include: { company: true },
    });

    if (!client) {
      throw new Error(`Client not found for tenant: ${context.tenantClientId}`);
    }

    // Get a client user to set as creator (first admin user)
    const clientUser = await prisma.client_user.findFirst({
      where: {
        clientId: client.id,
        user: {
          role: 'ADMIN',
        },
      },
    });

    if (!clientUser) {
      throw new Error('No admin user found for client');
    }

    // Create the job posting
    const jobPosting = await prisma.job_posting.create({
      data: {
        clientId: client.id,
        createdById: clientUser.id,
        title: input.title,
        description: input.description,
        jobType: input.jobType as WorkTypeEnum,
        jobCommitment: input.jobCommitment as WorkCommitmentEnum,
        jobSchedule: input.jobSchedule as WorkScheduleEnum,
        industry: input.industry as CompanyIndustryEnum,
        totalExperience: input.totalExperience,
        department: input.department,
        teamSize: input.teamSize,
        reportingTo: input.reportingTo,
        hiring_manager_email: input.hiringManagerEmail,
        minSalary: input.minSalary,
        maxSalary: input.maxSalary,
        salaryCurrency: input.salaryCurrency,
        equity: input.equity,
        numberOfOpenings: input.numberOfOpenings,
        responsibilities: input.responsibilities,
        benefits: input.benefits,
        tags: input.tags,
        isRemote: input.isRemote,
        preferredLocations: input.preferredLocations,
        requiredSkills: input.requiredSkills,
        preferredSkills: input.preferredSkills,
        preferredUniversities: input.preferredUniversities,
        preferredDegrees: input.preferredDegrees,
        preferredIndustries: input.preferredIndustries,
        applicationDeadline: input.applicationDeadline
          ? new Date(input.applicationDeadline)
          : null,
        availableFrom: input.availableFrom
          ? new Date(input.availableFrom)
          : null,
        isPublished: input.isPublished,
        isFeatured: input.isFeatured,
        status: input.isPublished
          ? JobPostingStatusEnum.PUBLISHED
          : JobPostingStatusEnum.DRAFT,
        numberOfViews: 0,
        numberOfApplications: 0,
      },
      include: {
        client: {
          include: {
            company: true,
          },
        },
      },
    });

    logger.info('MCP: Job posting created successfully', {
      context: 'createJobPosting.tool',
      jobPostingId: jobPosting.id,
      title: jobPosting.title,
      status: jobPosting.status,
    });

    return {
      success: true,
      jobPosting: {
        id: jobPosting.id,
        title: jobPosting.title,
        description: jobPosting.description,
        status: jobPosting.status,
        isPublished: jobPosting.isPublished,
        companyName: jobPosting.client?.company?.name,
        createdAt: jobPosting.createdAt.toISOString(),
        externalJobId: input.externalJobId,
      },
      message: `Job posting "${jobPosting.title}" created successfully`,
    };
  } catch (error) {
    logger.error('MCP: Failed to create job posting', {
      context: 'createJobPosting.tool',
      error: error instanceof Error ? error.message : 'Unknown error',
      title: input.title,
    });

    throw error;
  }
}

/**
 * Register the Create Job Posting Tool
 */
export function registerCreateJobPostingTool(): void {
  const registry = McpToolRegistry.getInstance();

  registry.register(
    'teamcast.jobs.create',
    'Create a new job posting on Teamcast platform. Accepts job details including title, description, requirements, compensation, and preferences. Returns the created job posting ID for subsequent operations like sending invites.',
    CreateJobPostingInputSchema,
    handleCreateJobPosting,
    {
      requiredScopes: [MCP_SCOPES.JOBS_WRITE],
    }
  );
}
