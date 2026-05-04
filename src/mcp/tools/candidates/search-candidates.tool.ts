import { z } from 'zod';
import { PrismaClient, Prisma } from '@prisma/client';
import { McpContext } from '../../core/mcp.server';
import { McpToolRegistry } from '../../core/tool.registry';
import { MCP_SCOPES } from '../../config/mcp.config';
import { logger } from '@/shared/utils/logger';
import { McpWebhookService } from '../../services/mcp.webhook.service';

const prisma = new PrismaClient();

/**
 * Search Candidates Input Schema
 * Search candidates based on job requirements or custom parameters
 */
export const SearchCandidatesInputSchema = z.object({
  // Search by job posting (uses job requirements)
  jobPostingId: z
    .string()
    .uuid()
    .optional()
    .describe('Job posting ID to match candidates against its requirements'),

  // Direct search parameters
  skills: z
    .array(z.string())
    .optional()
    .describe('Required skills to search for'),
  preferredSkills: z
    .array(z.string())
    .optional()
    .describe('Preferred/nice-to-have skills'),
  minExperience: z
    .number()
    .min(0)
    .optional()
    .describe('Minimum years of experience'),
  maxExperience: z
    .number()
    .max(50)
    .optional()
    .describe('Maximum years of experience'),
  locations: z.array(z.string()).optional().describe('Preferred locations'),
  industries: z.array(z.string()).optional().describe('Preferred industries'),
  educationLevel: z
    .enum(['HIGH_SCHOOL', 'BACHELORS', 'MASTERS', 'DOCTORATE', 'OTHER'])
    .optional()
    .describe('Minimum education level'),
  jobTitles: z
    .array(z.string())
    .optional()
    .describe('Current or past job titles'),
  workTypes: z
    .array(z.enum(['REMOTE', 'ONSITE', 'HYBRID']))
    .optional()
    .describe('Preferred work types'),
  minSalary: z.number().optional().describe('Minimum expected salary'),
  maxSalary: z.number().optional().describe('Maximum expected salary'),
  salaryCurrency: z.string().default('USD').describe('Salary currency'),
  availableWithin: z.number().optional().describe('Available within X days'),
  noticePeriod: z
    .enum([
      'IMMEDIATE',
      'ONE_WEEK',
      'TWO_WEEKS',
      'ONE_MONTH',
      'TWO_MONTHS',
      'THREE_MONTHS',
    ])
    .optional()
    .describe('Notice period filter'),

  // US Work Authorization
  requireUSWorkAuth: z
    .boolean()
    .optional()
    .describe('Require US work authorization'),
  acceptVisaSponsorship: z
    .boolean()
    .optional()
    .describe('Whether visa sponsorship is acceptable'),

  // Search options
  includeNotLooking: z
    .boolean()
    .default(false)
    .describe('Include candidates not actively looking'),
  onlyPublished: z
    .boolean()
    .default(true)
    .describe('Only search published candidate profiles'),

  // Pagination
  page: z.number().min(1).default(1).describe('Page number'),
  limit: z.number().min(1).max(100).default(20).describe('Results per page'),

  // Sorting
  sortBy: z
    .enum(['relevance', 'experience', 'updatedAt', 'createdAt'])
    .default('relevance')
    .describe('Sort results by'),
  sortOrder: z.enum(['asc', 'desc']).default('desc').describe('Sort order'),
});

export type SearchCandidatesInput = z.infer<typeof SearchCandidatesInputSchema>;

/**
 * Calculate skill match score
 */
function calculateSkillMatch(
  candidateSkills: string[],
  requiredSkills: string[],
  preferredSkills: string[]
): { score: number; matchedRequired: string[]; matchedPreferred: string[] } {
  const normalizedCandidateSkills = candidateSkills.map((s) =>
    s.toLowerCase().trim()
  );
  const normalizedRequired = requiredSkills.map((s) => s.toLowerCase().trim());
  const normalizedPreferred = preferredSkills.map((s) =>
    s.toLowerCase().trim()
  );

  const matchedRequired = normalizedRequired.filter((skill) =>
    normalizedCandidateSkills.some(
      (cs) => cs.includes(skill) || skill.includes(cs)
    )
  );

  const matchedPreferred = normalizedPreferred.filter((skill) =>
    normalizedCandidateSkills.some(
      (cs) => cs.includes(skill) || skill.includes(cs)
    )
  );

  // Calculate score: 70% weight for required, 30% for preferred
  const requiredScore =
    normalizedRequired.length > 0
      ? (matchedRequired.length / normalizedRequired.length) * 0.7
      : 0.7;
  const preferredScore =
    normalizedPreferred.length > 0
      ? (matchedPreferred.length / normalizedPreferred.length) * 0.3
      : 0.3;

  return {
    score: Math.round((requiredScore + preferredScore) * 100),
    matchedRequired,
    matchedPreferred,
  };
}

/**
 * Search Candidates Tool Handler
 */
async function handleSearchCandidates(
  args: Record<string, unknown>,
  context: McpContext
): Promise<unknown> {
  const input = args as SearchCandidatesInput;

  logger.info('MCP: Searching candidates', {
    context: 'searchCandidates.tool',
    tenantClientId: context.tenantClientId,
    mcpClientId: context.mcpClientId,
    hasJobPostingId: !!input.jobPostingId,
  });

  try {
    let searchCriteria = { ...input };

    // If job posting ID provided, fetch job requirements
    if (input.jobPostingId) {
      const jobPosting = await prisma.job_posting.findFirst({
        where: {
          id: input.jobPostingId,
          clientId: context.tenantClientId,
        },
      });

      if (!jobPosting) {
        throw new Error(`Job posting not found: ${input.jobPostingId}`);
      }

      // Merge job requirements with explicit search params (explicit params take priority)
      searchCriteria = {
        ...searchCriteria,
        skills: input.skills || jobPosting.requiredSkills,
        preferredSkills: input.preferredSkills || jobPosting.preferredSkills,
        minExperience: input.minExperience ?? jobPosting.totalExperience,
        locations: input.locations || jobPosting.preferredLocations,
        industries:
          input.industries ||
          (jobPosting.industry ? [jobPosting.industry] : undefined),
      };
    }

    // Build Prisma where clause
    const whereClause: Prisma.candidateWhereInput = {
      deletedAt: null,
    };

    // Published filter
    if (searchCriteria.onlyPublished) {
      whereClause.isPublished = true;
      whereClause.reviewStatus = 'PUBLISHED';
    }

    // Job search status filter
    if (!searchCriteria.includeNotLooking) {
      whereClause.jobSearchStatus = 'OPEN_TO_OPPORTUNITIES';
    }

    // Resume-based filters
    const resumeWhere: Prisma.resumeWhereInput = {};

    // Experience filter
    if (searchCriteria.minExperience !== undefined) {
      resumeWhere.totalExperience = {
        ...((resumeWhere.totalExperience as object) || {}),
        gte: searchCriteria.minExperience,
      };
    }
    if (searchCriteria.maxExperience !== undefined) {
      resumeWhere.totalExperience = {
        ...((resumeWhere.totalExperience as object) || {}),
        lte: searchCriteria.maxExperience,
      };
    }

    // Education level filter
    if (searchCriteria.educationLevel) {
      const educationLevels = [
        'HIGH_SCHOOL',
        'BACHELORS',
        'MASTERS',
        'DOCTORATE',
      ];
      const minIndex = educationLevels.indexOf(searchCriteria.educationLevel);
      resumeWhere.highestEducationLevel = {
        in: educationLevels.slice(minIndex) as any[],
      };
    }

    // Location filter
    if (searchCriteria.locations && searchCriteria.locations.length > 0) {
      resumeWhere.OR = searchCriteria.locations.map((loc) => ({
        location: { contains: loc, mode: 'insensitive' as const },
      }));
    }

    // Industry filter
    if (searchCriteria.industries && searchCriteria.industries.length > 0) {
      resumeWhere.primaryIndustry = {
        in: searchCriteria.industries,
        mode: 'insensitive',
      };
    }

    // Notice period filter
    if (searchCriteria.noticePeriod) {
      resumeWhere.noticePeriod = searchCriteria.noticePeriod;
    }

    // US Work Authorization filter
    if (searchCriteria.requireUSWorkAuth) {
      resumeWhere.isUSWorkAuthorized = true;
      if (!searchCriteria.acceptVisaSponsorship) {
        resumeWhere.requiresUSVisaSponsorship = false;
      }
    }

    // Apply resume filters
    if (Object.keys(resumeWhere).length > 0) {
      whereClause.resume = resumeWhere;
    }

    // Calculate pagination
    const skip = (searchCriteria.page - 1) * searchCriteria.limit;

    // Execute search
    const [candidates, total] = await Promise.all([
      prisma.candidate.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          resume: {
            select: {
              id: true,
              summary: true,
              totalExperience: true,
              currentJobTitle: true,
              currentCompany: true,
              location: true,
              primaryIndustry: true,
              resumeSkills: true,
              highestEducationLevel: true,
              noticePeriod: true,
              isUSWorkAuthorized: true,
              requiresUSVisaSponsorship: true,
              currentSalary: true,
              currentSalaryCurrency: true,
            },
          },
          preferences: {
            select: {
              preferredLocations: true,
              preferredWorkTypes: true,
              preferredSalaryMin: true,
              preferredSalaryMax: true,
            },
          },
        },
        skip,
        take: searchCriteria.limit,
        orderBy:
          searchCriteria.sortBy === 'experience'
            ? { resume: { totalExperience: searchCriteria.sortOrder } }
            : searchCriteria.sortBy === 'updatedAt'
              ? { updatedAt: searchCriteria.sortOrder }
              : { createdAt: searchCriteria.sortOrder },
      }),
      prisma.candidate.count({ where: whereClause }),
    ]);

    // Calculate relevance scores and enrich results
    const searchSkills = searchCriteria.skills || [];
    const preferredSkills = searchCriteria.preferredSkills || [];

    const enrichedCandidates = candidates.map((candidate) => {
      const candidateSkills = candidate.resume?.resumeSkills || [];
      const skillMatch = calculateSkillMatch(
        candidateSkills,
        searchSkills,
        preferredSkills
      );

      return {
        id: candidate.id,
        userId: candidate.user.id,
        name: candidate.user.name,
        email: candidate.user.email,
        avatar: candidate.user.image,
        currentTitle: candidate.resume?.currentJobTitle,
        currentCompany: candidate.resume?.currentCompany,
        location: candidate.resume?.location,
        experience: candidate.resume?.totalExperience,
        industry: candidate.resume?.primaryIndustry,
        education: candidate.resume?.highestEducationLevel,
        skills: candidateSkills,
        summary: candidate.resume?.summary?.substring(0, 300),
        noticePeriod: candidate.resume?.noticePeriod,
        usWorkAuthorized: candidate.resume?.isUSWorkAuthorized,
        requiresSponsorship: candidate.resume?.requiresUSVisaSponsorship,
        jobSearchStatus: candidate.jobSearchStatus,
        matchScore: skillMatch.score,
        matchedSkills: {
          required: skillMatch.matchedRequired,
          preferred: skillMatch.matchedPreferred,
        },
        preferences: candidate.preferences
          ? {
              locations: candidate.preferences.preferredLocations,
              workTypes: candidate.preferences.preferredWorkTypes,
              salaryRange: {
                min: candidate.preferences.preferredSalaryMin,
                max: candidate.preferences.preferredSalaryMax,
              },
            }
          : null,
      };
    });

    // Sort by relevance score if that's the selected sort
    if (searchCriteria.sortBy === 'relevance') {
      enrichedCandidates.sort((a, b) =>
        searchCriteria.sortOrder === 'desc'
          ? b.matchScore - a.matchScore
          : a.matchScore - b.matchScore
      );
    }

    logger.info('MCP: Candidate search completed', {
      context: 'searchCandidates.tool',
      total,
      returned: enrichedCandidates.length,
    });

    // Trigger webhook
    await McpWebhookService.getInstance().triggerWebhook(
      context.mcpClientId,
      'candidates.searched',
      {
        searchCriteria: {
          skills: searchCriteria.skills,
          minExperience: searchCriteria.minExperience,
          locations: searchCriteria.locations,
          jobPostingId: input.jobPostingId,
        },
        resultsCount: enrichedCandidates.length,
        totalMatches: total,
      }
    );

    return {
      success: true,
      data: {
        candidates: enrichedCandidates,
        pagination: {
          page: searchCriteria.page,
          limit: searchCriteria.limit,
          total,
          totalPages: Math.ceil(total / searchCriteria.limit),
        },
        searchCriteria: {
          skills: searchCriteria.skills,
          preferredSkills: searchCriteria.preferredSkills,
          minExperience: searchCriteria.minExperience,
          maxExperience: searchCriteria.maxExperience,
          locations: searchCriteria.locations,
          industries: searchCriteria.industries,
          jobPostingId: input.jobPostingId,
        },
      },
      message: `Found ${total} candidates matching your criteria`,
    };
  } catch (error) {
    logger.error('MCP: Failed to search candidates', {
      context: 'searchCandidates.tool',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
}

/**
 * Register the Search Candidates Tool
 */
export function registerSearchCandidatesTool(): void {
  const registry = McpToolRegistry.getInstance();

  registry.register(
    'teamcast.candidates.search',
    'Search for candidates based on skills, experience, location, and other criteria. Can also match candidates against a specific job posting requirements. Returns ranked candidates with match scores.',
    SearchCandidatesInputSchema,
    handleSearchCandidates,
    {
      requiredScopes: [MCP_SCOPES.CANDIDATES_READ],
    }
  );
}
