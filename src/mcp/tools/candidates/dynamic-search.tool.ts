import { z } from 'zod';
import { PrismaClient, Prisma } from '@prisma/client';
import { McpContext } from '../../core/mcp.server';
import { McpToolRegistry } from '../../core/tool.registry';
import { MCP_SCOPES } from '../../config/mcp.config';
import { logger } from '@/shared/utils/logger';
import { McpWebhookService } from '../../services/mcp.webhook.service';

const prisma = new PrismaClient();

/**
 * Dynamic Search Query Schema
 * Allows flexible querying with natural language-like filters
 */
export const DynamicSearchInputSchema = z.object({
  // Natural language query (parsed by the tool)
  query: z
    .string()
    .optional()
    .describe(
      'Natural language search query (e.g., "senior python developers in NYC with 5+ years")'
    ),

  // Structured filters (combined with query)
  filters: z
    .array(
      z.object({
        field: z.string().describe('Field to filter on'),
        operator: z
          .enum([
            'equals',
            'contains',
            'gt',
            'gte',
            'lt',
            'lte',
            'in',
            'notIn',
            'between',
          ])
          .describe('Comparison operator'),
        value: z
          .union([
            z.string(),
            z.number(),
            z.boolean(),
            z.array(z.string()),
            z.array(z.number()),
          ])
          .describe('Filter value'),
      })
    )
    .optional()
    .describe('Structured filters to apply'),

  // Entity type to search
  entity: z
    .enum(['candidates', 'jobs', 'applications'])
    .default('candidates')
    .describe('Entity type to search'),

  // Fields to return
  fields: z
    .array(z.string())
    .optional()
    .describe('Specific fields to return (default: all relevant fields)'),

  // Aggregations
  aggregate: z
    .object({
      groupBy: z.string().optional().describe('Field to group results by'),
      count: z.boolean().optional().describe('Include count'),
      sum: z.string().optional().describe('Field to sum'),
      avg: z.string().optional().describe('Field to average'),
    })
    .optional()
    .describe('Aggregation options'),

  // Pagination
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),

  // Sorting
  sortBy: z.string().optional().describe('Field to sort by'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),

  // Include related data
  include: z
    .array(z.string())
    .optional()
    .describe('Related entities to include (e.g., ["resume", "applications"])'),
});

export type DynamicSearchInput = z.infer<typeof DynamicSearchInputSchema>;

/**
 * Filter operator type matching schema
 */
type FilterOperator =
  | 'equals'
  | 'contains'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'notIn'
  | 'between';

/**
 * Filter type for internal use
 */
interface ParsedFilter {
  field: string;
  operator: FilterOperator;
  value: string | number | boolean | string[] | number[];
}

/**
 * Parse natural language query into filters
 */
function parseNaturalLanguageQuery(query: string): ParsedFilter[] {
  const filters: ParsedFilter[] = [];

  // Experience patterns
  const expMatch = query.match(
    /(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience)?/i
  );
  if (expMatch) {
    filters.push({
      field: 'resume.totalExperience',
      operator: 'gte',
      value: parseInt(expMatch[1]),
    });
  }

  // Skill patterns
  const skillPatterns = [
    /(?:with|knows?|using|skilled?\s*in|experience\s*(?:in|with))\s+([a-zA-Z0-9,\s+#.]+)/gi,
    /([a-zA-Z0-9#.]+)\s+developers?/gi,
  ];

  for (const pattern of skillPatterns) {
    let match;
    while ((match = pattern.exec(query)) !== null) {
      const skills = match[1]
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 1);
      if (skills.length > 0) {
        filters.push({
          field: 'resume.resumeSkills',
          operator: 'in',
          value: skills,
        });
      }
    }
  }

  // Location patterns
  const locationPatterns = [
    /(?:in|at|from|based\s*in|located\s*in)\s+([A-Z][a-zA-Z\s,]+)/g,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),?\s*(?:based|area)/g,
  ];

  for (const pattern of locationPatterns) {
    let match;
    while ((match = pattern.exec(query)) !== null) {
      filters.push({
        field: 'resume.location',
        operator: 'contains',
        value: match[1].trim(),
      });
    }
  }

  // Job title patterns
  const titlePatterns = [
    /(?:senior|junior|lead|staff|principal|chief)\s+([a-zA-Z\s]+?)(?:\s+developer|\s+engineer|\s+manager)?/gi,
    /(developer|engineer|manager|designer|analyst|architect|consultant)/gi,
  ];

  for (const pattern of titlePatterns) {
    let match;
    while ((match = pattern.exec(query)) !== null) {
      filters.push({
        field: 'resume.currentJobTitle',
        operator: 'contains',
        value: match[0].trim(),
      });
    }
  }

  // Remote/onsite patterns
  if (/remote/i.test(query)) {
    filters.push({
      field: 'preferences.preferredWorkTypes',
      operator: 'in',
      value: ['REMOTE'],
    });
  }

  // Availability patterns
  if (/immediately?\s*available|available\s*now/i.test(query)) {
    filters.push({
      field: 'resume.noticePeriod',
      operator: 'equals',
      value: 'IMMEDIATE',
    });
  }

  return filters;
}

/**
 * Build Prisma where clause from filters
 */
function buildWhereClause(
  filters: ParsedFilter[],
  _entity: string
): Record<string, unknown> {
  const where: Record<string, unknown> = {};

  for (const filter of filters) {
    const parts = filter.field.split('.');
    let current = where;

    // Navigate to the correct nested object
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]] as Record<string, unknown>;
    }

    const finalField = parts[parts.length - 1];

    // Build the filter condition
    switch (filter.operator) {
      case 'equals':
        current[finalField] = filter.value;
        break;
      case 'contains':
        current[finalField] = { contains: filter.value, mode: 'insensitive' };
        break;
      case 'gt':
        current[finalField] = { gt: filter.value };
        break;
      case 'gte':
        current[finalField] = { gte: filter.value };
        break;
      case 'lt':
        current[finalField] = { lt: filter.value };
        break;
      case 'lte':
        current[finalField] = { lte: filter.value };
        break;
      case 'in':
        current[finalField] = { hasSome: filter.value };
        break;
      case 'notIn':
        current[finalField] = { not: { in: filter.value } };
        break;
      case 'between':
        if (Array.isArray(filter.value) && filter.value.length === 2) {
          current[finalField] = {
            gte: filter.value[0],
            lte: filter.value[1],
          };
        }
        break;
    }
  }

  return where;
}

/**
 * Dynamic Search Tool Handler
 */
async function handleDynamicSearch(
  args: Record<string, unknown>,
  context: McpContext
): Promise<unknown> {
  const input = args as DynamicSearchInput;

  logger.info('MCP: Dynamic search', {
    context: 'dynamicSearch.tool',
    tenantClientId: context.tenantClientId,
    entity: input.entity,
    hasQuery: !!input.query,
    filterCount: input.filters?.length || 0,
  });

  try {
    // Combine natural language query filters with explicit filters
    let allFilters: ParsedFilter[] = (input.filters || []) as ParsedFilter[];

    if (input.query) {
      const parsedFilters = parseNaturalLanguageQuery(input.query);
      allFilters = [...allFilters, ...parsedFilters];
    }

    const skip = (input.page - 1) * input.limit;

    // Build base where clause
    const whereClause = buildWhereClause(allFilters, input.entity);

    // Add tenant filter and default conditions
    if (input.entity === 'candidates') {
      (whereClause as any).deletedAt = null;
      (whereClause as any).isPublished = true;

      // Build include clause
      const includeClause: Record<string, boolean | object> = {
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
            summary: true,
            totalExperience: true,
            currentJobTitle: true,
            currentCompany: true,
            location: true,
            primaryIndustry: true,
            resumeSkills: true,
            highestEducationLevel: true,
            noticePeriod: true,
          },
        },
      };

      // Add additional includes
      if (input.include) {
        for (const inc of input.include) {
          if (inc === 'preferences') {
            includeClause.preferences = true;
          }
          if (inc === 'applications') {
            includeClause.applications = {
              take: 5,
              orderBy: { appliedAt: 'desc' as const },
            };
          }
        }
      }

      // Execute search
      const [results, total] = await Promise.all([
        prisma.candidate.findMany({
          where: whereClause as Prisma.candidateWhereInput,
          include: includeClause,
          skip,
          take: input.limit,
          orderBy: input.sortBy
            ? { [input.sortBy]: input.sortOrder }
            : { updatedAt: 'desc' },
        }),
        prisma.candidate.count({
          where: whereClause as Prisma.candidateWhereInput,
        }),
      ]);

      // Transform results - cast to any for dynamic include
      const transformedResults = results.map((candidate: any) => ({
        id: candidate.id,
        name: candidate.user?.name,
        email: candidate.user?.email,
        avatar: candidate.user?.image,
        currentTitle: candidate.resume?.currentJobTitle,
        currentCompany: candidate.resume?.currentCompany,
        location: candidate.resume?.location,
        experience: candidate.resume?.totalExperience,
        industry: candidate.resume?.primaryIndustry,
        skills: candidate.resume?.resumeSkills || [],
        summary: candidate.resume?.summary?.substring(0, 200),
        education: candidate.resume?.highestEducationLevel,
        noticePeriod: candidate.resume?.noticePeriod,
        status: candidate.status,
        jobSearchStatus: candidate.jobSearchStatus,
      }));

      // Trigger webhook
      await McpWebhookService.getInstance().triggerWebhook(
        context.mcpClientId,
        'search.executed',
        {
          entity: input.entity,
          query: input.query,
          filtersApplied: allFilters.length,
          resultsCount: transformedResults.length,
          totalMatches: total,
        }
      );

      return {
        success: true,
        data: {
          results: transformedResults,
          pagination: {
            page: input.page,
            limit: input.limit,
            total,
            totalPages: Math.ceil(total / input.limit),
          },
          query: {
            natural: input.query,
            parsedFilters: allFilters,
          },
        },
        message: `Found ${total} ${input.entity} matching your search`,
      };
    } else if (input.entity === 'jobs') {
      // Job search
      (whereClause as any).clientId = context.tenantClientId;

      const [results, total] = await Promise.all([
        prisma.job_posting.findMany({
          where: whereClause as Prisma.job_postingWhereInput,
          select: {
            id: true,
            title: true,
            description: true,
            jobType: true,
            jobCommitment: true,
            industry: true,
            totalExperience: true,
            minSalary: true,
            maxSalary: true,
            requiredSkills: true,
            preferredSkills: true,
            status: true,
            isPublished: true,
            numberOfApplications: true,
            createdAt: true,
          },
          skip,
          take: input.limit,
          orderBy: input.sortBy
            ? { [input.sortBy]: input.sortOrder }
            : { createdAt: 'desc' },
        }),
        prisma.job_posting.count({
          where: whereClause as Prisma.job_postingWhereInput,
        }),
      ]);

      return {
        success: true,
        data: {
          results,
          pagination: {
            page: input.page,
            limit: input.limit,
            total,
            totalPages: Math.ceil(total / input.limit),
          },
        },
        message: `Found ${total} job postings`,
      };
    } else if (input.entity === 'applications') {
      // Application search - must be for this tenant's jobs
      (whereClause as any).jobPosting = { clientId: context.tenantClientId };

      const [results, total] = await Promise.all([
        prisma.job_application.findMany({
          where: whereClause as Prisma.job_applicationWhereInput,
          include: {
            candidate: {
              include: {
                user: { select: { name: true, email: true } },
                resume: {
                  select: { currentJobTitle: true, totalExperience: true },
                },
              },
            },
            jobPosting: { select: { title: true, id: true } },
          },
          skip,
          take: input.limit,
          orderBy: input.sortBy
            ? { [input.sortBy]: input.sortOrder }
            : { appliedAt: 'desc' },
        }),
        prisma.job_application.count({
          where: whereClause as Prisma.job_applicationWhereInput,
        }),
      ]);

      const transformedResults = results.map((app) => ({
        id: app.id,
        status: app.status,
        appliedAt: app.appliedAt,
        candidate: {
          id: app.candidate.id,
          name: app.candidate.user.name,
          email: app.candidate.user.email,
          title: app.candidate.resume?.currentJobTitle,
          experience: app.candidate.resume?.totalExperience,
        },
        job: {
          id: app.jobPosting.id,
          title: app.jobPosting.title,
        },
      }));

      return {
        success: true,
        data: {
          results: transformedResults,
          pagination: {
            page: input.page,
            limit: input.limit,
            total,
            totalPages: Math.ceil(total / input.limit),
          },
        },
        message: `Found ${total} applications`,
      };
    }

    throw new Error(`Unsupported entity type: ${input.entity}`);
  } catch (error) {
    logger.error('MCP: Dynamic search failed', {
      context: 'dynamicSearch.tool',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
}

/**
 * Register the Dynamic Search Tool
 */
export function registerDynamicSearchTool(): void {
  const registry = McpToolRegistry.getInstance();

  registry.register(
    'teamcast.search.dynamic',
    'Perform flexible searches across candidates, jobs, or applications using natural language queries or structured filters. Supports complex filtering, sorting, and aggregations. Examples: "senior python developers in NYC with 5+ years", "remote React engineers available immediately"',
    DynamicSearchInputSchema,
    handleDynamicSearch,
    {
      requiredScopes: [MCP_SCOPES.CANDIDATES_READ],
    }
  );
}
