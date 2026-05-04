import { PrismaClient } from '@prisma/client';
import { GoogleAuth } from 'google-auth-library';
import {
  IRagProvider,
  IRagIndexingTask,
  RagIndexingStatus,
} from '../rag.provider';
import { ISearchResult } from '@/shared/models/domain/search/search.domain';

import { ENV } from '@/config/env';
import { logger } from '@/shared/utils/logger';
import { gcpConfig } from '@/config/gcp';

interface SearchResult {
  id: string;
  content: string;
  metadata: any;
  score: number;
  semantic_score: number;
  title_score?: number;
  skills_score?: number;
  skill_match_score?: number;
  experience_match_score?: number;
  industry_match_score?: number;
  location_match_score?: number;
  match_details?: any;
  exact_match_score?: number;
}

interface FilteredResult {
  id: string;
  score: number;
  metadata: Record<string, any>;
}

export class GcpVertexRagProvider implements IRagProvider {
  private prisma: PrismaClient;
  private readonly projectId: string;
  private readonly location: string;
  private readonly modelId: string;
  private readonly apiEndpoint: string;
  private readonly auth: GoogleAuth;

  constructor() {
    this.prisma = new PrismaClient();
    this.projectId = ENV.GOOGLE_CLOUD_PROJECT_ID;
    this.location = ENV.GOOGLE_CLOUD_VERTEX_AI_LOCATION;
    this.modelId =
      ENV.GOOGLE_CLOUD_VERTEX_AI_EMBEDDING_MODEL_ID || 'text-embedding-005';
    this.apiEndpoint = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${this.modelId}:predict`;
    this.auth = gcpConfig.getAuth();
  }

  async getEmbedding(text: string): Promise<number[]> {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const client = await this.auth.getClient();
        const token = await client.getAccessToken();

        logger.debug({
          message: 'Getting embedding',
          context: 'GcpVertexRagProvider.getEmbedding',
          text,
          modelId: this.modelId,
          attempt,
        });

        const response = await fetch(this.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token.token}`,
          },
          body: JSON.stringify({
            instances: [{ content: text }],
            parameters: {
              taskType: 'RETRIEVAL_DOCUMENT',
            },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          const errorMessage = errorData?.error?.message || response.statusText;

          // Check if it's a rate limit error
          if (
            response.status === 429 ||
            errorMessage.toLowerCase().includes('quota')
          ) {
            if (attempt < maxRetries) {
              const delay = retryDelay * attempt;
              logger.warn({
                message: 'Rate limit hit, retrying after delay',
                context: 'GcpVertexRagProvider.getEmbedding',
                attempt,
                delay,
                error: errorMessage,
              });
              await new Promise((resolve) => setTimeout(resolve, delay));
              continue;
            }
          }

          throw new Error(`Failed to get embedding: ${errorMessage}`);
        }

        const data = await response.json();
        return data.predictions[0].embeddings.values;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt === maxRetries) {
          logger.error({
            message: 'Failed to get embedding after all retries',
            context: 'GcpVertexRagProvider.getEmbedding',
            error: lastError.message,
            attempts: attempt,
          });
          throw lastError;
        }
      }
    }

    throw lastError || new Error('Failed to get embedding after all retries');
  }

  private async getCandidateAiAssessment(candidateId: string): Promise<any> {
    const candidate = await this.prisma.job_ai_assessment.findFirst({
      where: { candidateId },
    });
    return candidate as any;
  }

  async index(
    entityId: string,
    entityType: 'candidate' | 'job'
  ): Promise<IRagIndexingTask> {
    const taskId = `index-${entityType}-${entityId}-${Date.now()}`;

    logger.debug({
      message: 'Indexing entity',
      context: 'GcpVertexRagProvider.index',
      entityId,
      entityType,
    });

    // Create task record
    const task: IRagIndexingTask = {
      taskId,
      status: RagIndexingStatus.STARTED,
      entityId,
      entityType,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      if (entityType === 'candidate') {
        await this.indexCandidate(entityId);
      } else {
        await this.indexJob(entityId);
      }

      task.status = RagIndexingStatus.COMPLETED;
    } catch (error) {
      task.status = RagIndexingStatus.FAILED;
      task.error = error instanceof Error ? error.message : 'Unknown error';
      logger.error({
        message: 'Error indexing entity',
        context: 'GcpVertexRagProvider.index',
        error,
        taskId,
      });
    }

    task.updatedAt = new Date();
    return task;
  }

  private async indexCandidate(candidateId: string): Promise<void> {
    logger.debug({
      message: 'Indexing candidate',
      context: 'GcpVertexRagProvider.indexCandidate',
      candidateId,
    });

    const candidate = await this.getCandidate(candidateId);
    const candidateAiAssessment =
      await this.getCandidateAiAssessment(candidateId);

    // Prepare content for embedding
    const content = await this.prepareCandidateContent(
      candidate,
      candidateAiAssessment
    );

    logger.debug({
      message: 'Candidate content',
      context: 'GcpVertexRagProvider.indexCandidate',
      content,
    });

    // Get embedding from Vertex AI
    const embedding = await this.getEmbedding(content);

    logger.debug({
      message: 'Candidate embedding',
      context: 'GcpVertexRagProvider.indexCandidate',
      embedding,
    });

    // Store in pgvector using raw query
    await this.prisma.$executeRaw`
      INSERT INTO candidate_embeddings ("candidateId", embedding, data, updated_at)
      VALUES (
        ${candidate.id},
        ${embedding}::vector,
        ${JSON.stringify({
          content,
          metadata: {
            skills: candidate.resume?.resumeSkills || [],
            industries: candidate.resume?.industries || [],
            locations: candidate.preferences?.preferredLocations || [],
            salary: {
              min: candidate.preferences?.preferredSalaryMin,
              max: candidate.preferences?.preferredSalaryMax,
              currency: candidate.preferences?.preferredSalaryCurrency,
            },
            experience: candidate.resume?.totalExperience,
            education: candidate.resume?.highestEducationLevel,
            aiAssmentScore: candidateAiAssessment?.score,
            aiAssmentRecommendation: candidateAiAssessment?.recommendation,
            candidateCreatedAt: candidate.createdAt,
          },
        })}::jsonb,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT ("candidateId")
      DO UPDATE SET
        embedding = EXCLUDED.embedding,
        data = EXCLUDED.data,
        updated_at = CURRENT_TIMESTAMP
    `;

    // Mark as not dirty
    await this.prisma.candidate.update({
      where: { id: candidateId },
      data: { isDirty: false },
    });
  }

  private async indexJob(jobId: string): Promise<void> {
    logger.debug({
      message: 'Indexing job',
      context: 'GcpVertexRagProvider.indexJob',
      jobId,
    });

    const job = await this.getJob(jobId);
    // Prepare content for embedding
    const content = await this.prepareJobContent(job);

    logger.debug({
      message: 'Job content',
      context: 'GcpVertexRagProvider.indexJob',
      content,
    });

    // Get embedding from Vertex AI
    const embedding = await this.getEmbedding(content);

    logger.debug({
      message: 'Job embedding',
      context: 'GcpVertexRagProvider.indexJob',
      embedding,
    });

    // Store in pgvector using raw query
    await this.prisma.$executeRaw`
      INSERT INTO job_embeddings ("jobId", embedding, data, updated_at)
      VALUES (
        ${job.id},
        ${embedding}::vector,
        ${JSON.stringify({
          content,
          metadata: {
            requiredSkills: job.requiredSkills || [],
            preferredSkills: job.preferredSkills || [],
            industries: job.preferredIndustries || [],
            locations: job.preferredLocations || [],
            salary: {
              min: job.minSalary,
              max: job.maxSalary,
              currency: job.salaryCurrency,
            },
            experience: job.totalExperience,
            education: job.preferredDegrees || [],
            isRemote: job.isRemote,
            jobType: job.jobType,
            jobCommitment: job.jobCommitment,
            jobSchedule: job.jobSchedule,
            industry: job.industry,
            jobCreatedAt: job.createdAt,
          },
        })}::jsonb,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT ("jobId")
      DO UPDATE SET
        embedding = EXCLUDED.embedding,
        data = EXCLUDED.data,
        updated_at = CURRENT_TIMESTAMP
    `;

    logger.debug({
      message: 'Job embedding stored',
      context: 'GcpVertexRagProvider.indexJob',
      jobId,
    });

    // Mark as not dirty
    await this.prisma.job_posting.update({
      where: { id: jobId },
      data: { isDirty: false },
    });

    logger.debug({
      message: 'Job marked as not dirty',
      context: 'GcpVertexRagProvider.indexJob',
      jobId,
    });
  }

  private async getCandidate(candidateId: string): Promise<any> {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        resume: {
          include: {
            experience: {
              include: {
                projects: true,
              },
            },
            education: true,
            certifications: true,
          },
        },
        preferences: true,
        resumeAssessments: true,
        onboardingAssessments: true,
        user: true,
      },
    });

    if (!candidate) {
      throw new Error('Candidate not found or not published');
    }

    return candidate;
  }

  private async prepareCandidateContent(
    candidate: any,
    candidateAiAssessment?: any
  ): Promise<string> {
    const parts = [];

    // Basic info
    parts.push(`Name: ${candidate.user.name}`);
    parts.push(`Summary: ${candidate.resume?.summary || ''}`);

    // Experience
    if (candidate.resume?.experience) {
      parts.push('Experience:');
      candidate.resume.experience.forEach((exp: any) => {
        parts.push(`- ${exp.position} at ${exp.company} (${exp.industry})`);
        parts.push(`  ${exp.description}`);
        parts.push(`  Skills: ${exp.skills.join(', ')}`);
      });
    }

    // Education
    if (candidate.resume?.education) {
      parts.push('Education:');
      candidate.resume.education.forEach((edu: any) => {
        parts.push(
          `- ${edu.degree} in ${edu.fieldOfStudy} from ${edu.institution}`
        );
      });
    }

    // Skills
    if (candidate.resume?.resumeSkills) {
      parts.push(`Skills: ${candidate.resume.resumeSkills.join(', ')}`);
    }

    // Preferences
    if (candidate.preferences) {
      parts.push('Preferences:');
      parts.push(
        `- Industries: ${candidate.preferences.preferredIndustries.join(', ')}`
      );
      parts.push(
        `- Locations: ${candidate.preferences.preferredLocations.join(', ')}`
      );
      parts.push(
        `- Work Types: ${candidate.preferences.preferredWorkTypes.join(', ')}`
      );
    }

    // Add AI Assessment info if available
    if (candidateAiAssessment && typeof candidateAiAssessment === 'object') {
      const score = candidateAiAssessment.score;
      const recommendation = candidateAiAssessment.recommendation;

      if (score !== undefined) {
        parts.push(`AI Assessment score: ${score}`);
      }
      if (recommendation) {
        parts.push(`AI Assessment recommendation: ${recommendation}`);
      }
      if (candidate.createdAt) {
        parts.push(`Candidate created at: ${candidate.createdAt}`);
      }
    }

    return parts.join('\n');
  }

  private async getJob(jobId: string): Promise<any> {
    const job = await this.prisma.job_posting.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new Error('Job not found');
    }

    return job;
  }

  private prepareJobContent(job: any): string {
    const parts = [];

    // Basic info
    parts.push(`Title: ${job.title}`);
    parts.push(`Description: ${job.description}`);
    parts.push(`Job Type: ${job.jobType}`);
    parts.push(`Job Commitment: ${job.jobCommitment}`);
    parts.push(`Job Schedule: ${job.jobSchedule}`);
    parts.push(`Industry: ${job.industry}`);
    parts.push(`Total Experience Required: ${job.totalExperience} years`);
    parts.push(`Is Remote: ${job.isRemote ? 'Yes' : 'No'}`);

    // Department and team info
    if (job.department) {
      parts.push(`Department: ${job.department}`);
    }
    if (job.teamSize) {
      parts.push(`Team Size: ${job.teamSize}`);
    }
    if (job.reportingTo) {
      parts.push(`Reporting To: ${job.reportingTo}`);
    }

    // Requirements
    if (job.requiredSkills?.length > 0) {
      parts.push('Required Skills:');
      parts.push(`- ${job.requiredSkills.join(', ')}`);
    }
    if (job.preferredSkills?.length > 0) {
      parts.push('Preferred Skills:');
      parts.push(`- ${job.preferredSkills.join(', ')}`);
    }
    if (job.preferredDegrees?.length > 0) {
      parts.push('Preferred Degrees:');
      parts.push(`- ${job.preferredDegrees.join(', ')}`);
    }
    if (job.preferredUniversities?.length > 0) {
      parts.push('Preferred Universities:');
      parts.push(`- ${job.preferredUniversities.join(', ')}`);
    }
    if (job.preferredLocations?.length > 0) {
      parts.push('Preferred Locations:');
      parts.push(`- ${job.preferredLocations.join(', ')}`);
    }
    if (job.preferredIndustries?.length > 0) {
      parts.push('Preferred Industries:');
      parts.push(`- ${job.preferredIndustries.join(', ')}`);
    }

    // Compensation
    if (job.minSalary || job.maxSalary) {
      parts.push('Compensation:');
      if (job.minSalary && job.maxSalary) {
        parts.push(
          `- ${job.minSalary} - ${job.maxSalary} ${job.salaryCurrency || 'USD'}`
        );
      } else if (job.minSalary) {
        parts.push(`- From ${job.minSalary} ${job.salaryCurrency || 'USD'}`);
      } else if (job.maxSalary) {
        parts.push(`- Up to ${job.maxSalary} ${job.salaryCurrency || 'USD'}`);
      }
      if (job.equity) {
        parts.push('- Equity included');
      }
    }
    if (job.benefits?.length > 0) {
      parts.push('Benefits:');
      parts.push(`- ${job.benefits.join(', ')}`);
    }

    // Responsibilities
    if (job.responsibilities?.length > 0) {
      parts.push('Responsibilities:');
      job.responsibilities.forEach((resp: string) => {
        parts.push(`- ${resp}`);
      });
    }

    // Tags
    if (job.tags?.length > 0) {
      parts.push('Tags:');
      parts.push(`- ${job.tags.join(', ')}`);
    }

    if (job.createdAt) {
      parts.push(`JobCreatedAt: ${job.createdAt}`);
    }

    return parts.join('\n');
  }

  async searchCandidatesForJob(
    jobId: string,
    limit: number = 10
  ): Promise<ISearchResult[]> {
    const job = await this.getJob(jobId);
    // Prepare content for embedding
    const content = await this.prepareJobContent(job);
    const embedding = await this.getEmbedding(content);
    const minScore = 0.6; // Minimum similarity score for job-candidate matching

    // Search using pgvector with minimum score filtering
    const results = await this.prisma.$queryRaw<SearchResult[]>`
      SELECT
        c."candidateId" as id,
        c.data->>'content' as content,
        c.data->'metadata' as metadata,
        1 - (c.embedding <=> ${embedding}::vector) as score
      FROM candidate_embeddings c
      JOIN candidates cd ON c."candidateId" = cd.id
      WHERE (1 - (c.embedding <=> ${embedding}::vector)) >= ${minScore}
        AND cd."jobSearchStatus" = 'OPEN_TO_OPPORTUNITIES'
      ORDER BY score DESC
      LIMIT ${limit}
    `;

    return (results as any[]).map((result) => ({
      id: result.id,
      score: result.score,
      metadata: result.metadata,
    }));
  }

  async searchJobsForCandidate(
    candidateId: string,
    limit: number = 10
  ): Promise<ISearchResult[]> {
    const candidate = await this.getCandidate(candidateId);
    const content = await this.prepareCandidateContent(candidate);
    const embedding = await this.getEmbedding(content);
    const minScore = 0.6; // Minimum similarity score for candidate-job matching

    // Search using pgvector with minimum score filtering
    const results = await this.prisma.$queryRaw<SearchResult[]>`
      SELECT
        j."jobId" as id,
        j.data->>'content' as content,
        j.data->'metadata' as metadata,
        1 - (j.embedding <=> ${embedding}::vector) as score
      FROM job_embeddings j
      JOIN job_postings jp ON j."jobId" = jp.id
      WHERE (1 - (j.embedding <=> ${embedding}::vector)) >= ${minScore}
        AND jp."status" = 'PUBLISHED'
      ORDER BY score DESC
      LIMIT ${limit}
    `;

    return (results as any[]).map((result) => ({
      id: result.id,
      score: result.score,
      metadata: result.metadata,
    }));
  }

  async searchCandidates(
    query: string,
    limit: number = 10,
    page: number = 1
  ): Promise<ISearchResult[]> {
    logger.info({
      message: 'Starting intelligent match candidate search',
      context: 'GcpVertexRagProvider.searchCandidates',
      query,
      queryLength: query.length,
    });

    // Step 1: Create embedding from the query (which is already AI-generated prompt)
    const embedding = await this.getEmbedding(query);

    // Step 2: Parse exact match criteria from AI prompt
    const exactCriteria = this.parseExactMatchCriteria(query);

    logger.info({
      message: 'Parsed exact match criteria from AI prompt',
      context: 'GcpVertexRagProvider.searchCandidates',
      exactCriteria,
    });

    const offset = (page - 1) * limit;
    const minScore = 0.3; // Baseline semantic similarity

    // Step 4: Build exact match SQL conditions
    const exactMatchConditions = this.buildExactMatchConditions(exactCriteria);

    logger.debug({
      message: 'Built exact match conditions',
      context: 'GcpVertexRagProvider.searchCandidates',
      conditions: exactMatchConditions,
    });

    // Step 5: Build the SQL query with exact matching conditions
    const skillsCondition =
      exactMatchConditions.hasRequiredSkills !== 'true'
        ? exactMatchConditions.hasRequiredSkills
        : 'true';
    const locationCondition =
      exactMatchConditions.hasRequiredLocation !== 'true'
        ? exactMatchConditions.hasRequiredLocation
        : 'true';
    const experienceCondition =
      exactMatchConditions.hasRequiredExperience !== 'true'
        ? exactMatchConditions.hasRequiredExperience
        : 'true';
    const industryCondition =
      exactMatchConditions.hasRequiredIndustry !== 'true'
        ? exactMatchConditions.hasRequiredIndustry
        : 'true';
    const roleCondition =
      exactMatchConditions.hasRequiredRole !== 'true'
        ? exactMatchConditions.hasRequiredRole
        : 'true';
    const mustSkillsCondition =
      exactMatchConditions.hasRequiredMustSkills !== 'true'
        ? exactMatchConditions.hasRequiredMustSkills
        : 'true';

    const results = await this.prisma.$queryRawUnsafe<SearchResult[]>(
      `
      WITH candidate_exact_matches AS (
        SELECT
          c."candidateId" as id,
          c.data->>'content' as content,
          c.data->'metadata' as metadata,
          c.embedding,
          -- Semantic similarity score
          1 - (c.embedding <=> $1::vector) as semantic_score,
          -- Individual match conditions
          (${skillsCondition}) as skills_matched,
          (${mustSkillsCondition}) as must_skills_matched,
          (${locationCondition}) as location_matched,
          (${experienceCondition}) as experience_matched,
          (${industryCondition}) as industry_matched,
          (${roleCondition}) as role_matched
        FROM candidate_embeddings c
        INNER JOIN candidates cd ON c."candidateId" = cd.id
        WHERE cd."jobSearchStatus" = 'OPEN_TO_OPPORTUNITIES'
          AND c.embedding IS NOT NULL
          AND c.data IS NOT NULL
      ),
      scored_candidates AS (
        SELECT 
          id,
          content,
          metadata,
          semantic_score,
          skills_matched,
          must_skills_matched,
          location_matched,
          experience_matched,
          industry_matched,
          role_matched,
          -- Calculate smart match score - Skills 30% when others not specified, strict when specified
          CASE 
            WHEN (
              -- Skills: At least 30% must match (flexible but meaningful)
              ($2::jsonb->>'skills' IS NULL OR ($2::jsonb->>'skills')::text = '[]' OR skills_matched = true)
            ) AND (
              -- Must Skills: ALL must be present (strict matching)
              ($2::jsonb->>'mustSkills' IS NULL OR ($2::jsonb->>'mustSkills')::text = '[]' OR must_skills_matched = true)
            ) AND (
              -- Location: Only check if specified (strict when specified, ignored when not)
              ($2::jsonb->>'location' IS NULL OR $2::jsonb->>'location' = '' OR location_matched = true)
            ) AND (
              -- Experience: Only check if specified (strict when specified, ignored when not)
              ($2::jsonb->>'experience' IS NULL OR $2::jsonb->>'experience' = '' OR experience_matched = true)
            ) AND (
              -- Industry: Flexible (any match is good)
              ($2::jsonb->>'industry' IS NULL OR $2::jsonb->>'industry' = '' OR industry_matched = true)
            )
            THEN 1.0
            ELSE 0.0
          END as exact_match_score,
          -- Individual match details for debugging
          jsonb_build_object(
            'skills_matched', skills_matched,
            'must_skills_matched', must_skills_matched,
            'location_matched', location_matched,
            'experience_matched', experience_matched,
            'industry_matched', industry_matched,
            'role_matched', role_matched,
            'required_criteria', $2::jsonb
          ) as match_details
        FROM candidate_exact_matches
      ),
      final_candidates AS (
        SELECT 
          id,
          content,
          metadata,
          semantic_score,
          exact_match_score,
          match_details,
          -- Combined scoring: Exact match gets priority, then semantic similarity
          CASE 
            WHEN exact_match_score = 1.0 THEN 
              -- Perfect exact match: prioritize by semantic similarity
              1.0 + (semantic_score * 0.5)
            WHEN exact_match_score = 0.0 AND semantic_score >= $3 THEN
              -- No exact match but good semantic similarity: lower priority
              semantic_score * 0.3
            ELSE 
              0.0
          END as final_score
        FROM scored_candidates
        WHERE 
          -- SMART MODE: Skills 30% when others not specified, strict when specified
          exact_match_score = 1.0
      )
      SELECT 
        id,
        content,
        metadata,
        final_score as score,
        exact_match_score,
        semantic_score,
        match_details
      FROM final_candidates
      WHERE final_score > 0
      ORDER BY final_score DESC, semantic_score DESC
      LIMIT $4
      OFFSET $5
    `,
      embedding,
      JSON.stringify(exactCriteria),
      minScore,
      limit * 2,
      offset
    );

    logger.debug({
      message: 'Exact match + semantic search completed',
      context: 'GcpVertexRagProvider.searchCandidates',
      resultsCount: results.length,
      exactCriteria,
      query,
    });

    // Step 6: Filter by AI score and format results
    const candidatesWithAiScores = results
      .map((result: SearchResult) => {
        const content = result.content;
        const aiScore = parseFloat(
          content.split('AI Assessment score: ')[1]?.split('\n')[0] || '0'
        );
        const aiRecommendation =
          content.split('AI Assessment recommendation: ')[1]?.split('\n')[0] ||
          '';

        // SIMPLIFIED LOGIC: If exact_match_score is not zero, return the candidate
        const exactMatchScore = (result as any).exact_match_score || 0;
        if (exactMatchScore === 0) {
          return null;
        }

        return {
          id: result.id,
          score: aiScore, // Use AI score as primary ranking
          metadata: {
            ...result.metadata,
            aiScore,
            aiRecommendation,
            exactMatchScore: result.exact_match_score,
            semanticScore: result.semantic_score,
            finalScore: result.score,
            matchDetails: result.match_details,
            searchType: exactMatchScore > 0 ? 'exact_match' : 'semantic_match',
            originalQuery: query,
            aiGeneratedPrompt: query.substring(0, 200) + '...',
          },
        };
      })
      .filter(
        (result): result is FilteredResult & { score: number } =>
          result !== null
      );

    // Step 7: Sort and limit final results
    const sortedResults = candidatesWithAiScores
      .sort((a, b) => {
        // First priority: exact matches
        const aIsExact = a.metadata.exactMatchScore === 1.0;
        const bIsExact = b.metadata.exactMatchScore === 1.0;

        if (aIsExact && !bIsExact) return -1;
        if (!aIsExact && bIsExact) return 1;

        // Second priority: AI score
        return b.score - a.score;
      })
      .slice(0, limit);

    logger.info({
      message: 'Intelligent match candidate search completed',
      context: 'GcpVertexRagProvider.searchCandidates',
      totalResults: results.length,
      exactMatches: sortedResults.filter(
        (r) => r.metadata.exactMatchScore === 1.0
      ).length,
      semanticMatches: sortedResults.filter(
        (r) => r.metadata.exactMatchScore === 0.0
      ).length,
      finalResults: sortedResults.length,
      exactCriteria,
    });

    return sortedResults;
  }

  /**
   * Parse exact match criteria from AI-generated prompt
   */
  private parseExactMatchCriteria(aiPrompt: string): {
    skills?: string[];
    mustSkills?: string[];
    location?: string;
    experience?: string;
    industry?: string;
    role?: string;
  } {
    const criteria: any = {};

    try {
      // Extract skills
      const skillsMatch = aiPrompt.match(/SKILLS:\s*\[([^\]]+)\]/i);
      if (skillsMatch && !skillsMatch[1].includes('none specified')) {
        criteria.skills = skillsMatch[1]
          .split(',')
          .map((s) => s.trim().replace(/['"]/g, ''))
          .filter((s) => s && !s.includes('none specified'));
      }

      // Extract must skills (skills connected by "and")
      const mustSkillsMatch = aiPrompt.match(/MUST_SKILLS:\s*\[([^\]]+)\]/i);
      if (mustSkillsMatch && !mustSkillsMatch[1].includes('none specified')) {
        criteria.mustSkills = mustSkillsMatch[1]
          .split(',')
          .map((s) => s.trim().replace(/['"]/g, ''))
          .filter((s) => s && !s.includes('none specified'));
      }

      // Extract location
      const locationMatch = aiPrompt.match(/LOCATION:\s*\[([^\]]+)\]/i);
      if (locationMatch && !locationMatch[1].includes('none specified')) {
        criteria.location = locationMatch[1].trim().replace(/['"]/g, '');
      }

      // Extract experience
      const experienceMatch = aiPrompt.match(/EXPERIENCE:\s*\[([^\]]+)\]/i);
      if (experienceMatch && !experienceMatch[1].includes('none specified')) {
        criteria.experience = experienceMatch[1].trim().replace(/['"]/g, '');
      }

      // Extract industry
      const industryMatch = aiPrompt.match(/INDUSTRY:\s*([^\n]+)/i);
      if (industryMatch && !industryMatch[1].includes('none specified')) {
        criteria.industry = industryMatch[1].trim().replace(/['"]/g, '');
      }

      // Extract role
      const roleMatch = aiPrompt.match(/ROLE:\s*([^\n]+)/i);
      if (roleMatch && !roleMatch[1].includes('none specified')) {
        criteria.role = roleMatch[1].trim().replace(/['"]/g, '');
      }

      logger.debug({
        message: 'Successfully parsed criteria from AI prompt',
        context: 'GcpVertexRagProvider.parseExactMatchCriteria',
        criteria,
      });
    } catch (error) {
      logger.error({
        message: 'Error parsing exact match criteria',
        context: 'GcpVertexRagProvider.parseExactMatchCriteria',
        error: error instanceof Error ? error.message : 'Unknown error',
        aiPrompt: aiPrompt.substring(0, 300),
      });
    }

    return criteria;
  }

  /**
   * Build SQL conditions for exact matching
   */
  private buildExactMatchConditions(criteria: any): {
    hasRequiredSkills: string;
    hasRequiredMustSkills: string;
    hasRequiredLocation: string;
    hasRequiredExperience: string;
    hasRequiredIndustry: string;
    hasRequiredRole: string;
  } {
    const conditions = {
      hasRequiredSkills: 'true', // Default to true if no requirement
      hasRequiredMustSkills: 'true',
      hasRequiredLocation: 'true',
      hasRequiredExperience: 'true',
      hasRequiredIndustry: 'true',
      hasRequiredRole: 'true',
    };

    try {
      // Skills condition - ANY single skill match is sufficient (loose matching)
      if (criteria.skills && criteria.skills.length > 0) {
        const skillsCondition = criteria.skills
          .map((skill: string) => `LOWER('${skill.replace(/'/g, "''")}')`)
          .join(', ');

        conditions.hasRequiredSkills = `(
          c.data->'metadata'->'skills' IS NOT NULL AND
          EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(c.data->'metadata'->'skills') skill 
            WHERE LOWER(skill) = ANY(ARRAY[${skillsCondition}])
          )
        )`;
      }

      // Must Skills condition - ALL skills must be present (exact matching)
      if (criteria.mustSkills && criteria.mustSkills.length > 0) {
        const mustSkillsCondition = criteria.mustSkills
          .map((skill: string) => `LOWER('${skill.replace(/'/g, "''")}')`)
          .join(', ');

        conditions.hasRequiredMustSkills = `(
          c.data->'metadata'->'skills' IS NOT NULL AND
          (SELECT COUNT(*) FROM jsonb_array_elements_text(c.data->'metadata'->'skills') skill 
           WHERE LOWER(skill) = ANY(ARRAY[${mustSkillsCondition}])) >= ${criteria.mustSkills.length}
        )`;
      }

      // Location condition - exact matching
      if (criteria.location) {
        const location = criteria.location.replace(/'/g, "''");
        conditions.hasRequiredLocation = `(
          c.data->'metadata'->'locations' IS NOT NULL AND
          EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(c.data->'metadata'->'locations') location
            WHERE LOWER(TRIM(location)) = LOWER('${location}')
          )
        )`;
      }

      // Experience condition - precise matching (exact years vs range vs between)
      if (criteria.experience) {
        const exp = criteria.experience.toLowerCase();
        if (/\d+/.test(exp)) {
          // Check for range patterns like "2-5 years", "1+ and less than 3", etc.
          const rangeMatch = exp.match(/(\d+)\s*-\s*(\d+)/);
          const plusLessMatch = exp.match(
            /(\d+)\+\s*(?:and\s+)?(?:less\s+than|under|below)\s+(\d+)/
          );
          const betweenMatch = exp.match(
            /(?:between\s+)?(\d+)\s*(?:and|to)\s+(\d+)/
          );

          if (rangeMatch) {
            // Range format: "2-5 years" → BETWEEN 2 AND 5
            const minYears = parseInt(rangeMatch[1]);
            const maxYears = parseInt(rangeMatch[2]);
            conditions.hasRequiredExperience = `(
              c.data->'metadata'->>'experience' IS NOT NULL AND
              (c.data->'metadata'->>'experience')::float BETWEEN ${minYears} AND ${maxYears}
            )`;
          } else if (plusLessMatch) {
            // Range format: "1+ and less than 3" → >= 1 AND < 3
            const minYears = parseInt(plusLessMatch[1]);
            const maxYears = parseInt(plusLessMatch[2]);
            conditions.hasRequiredExperience = `(
              c.data->'metadata'->>'experience' IS NOT NULL AND
              (c.data->'metadata'->>'experience')::float >= ${minYears} AND
              (c.data->'metadata'->>'experience')::float < ${maxYears}
            )`;
          } else if (betweenMatch) {
            // Range format: "between 2 and 5" → BETWEEN 2 AND 5
            const minYears = parseInt(betweenMatch[1]);
            const maxYears = parseInt(betweenMatch[2]);
            conditions.hasRequiredExperience = `(
              c.data->'metadata'->>'experience' IS NOT NULL AND
              (c.data->'metadata'->>'experience')::float BETWEEN ${minYears} AND ${maxYears}
            )`;
          } else {
            const years = parseInt(exp.match(/\d+/)?.[0] || '0');

            // Check if it's a range (contains '+', 'plus', 'and above', etc.)
            if (
              exp.includes('+') ||
              exp.includes('plus') ||
              exp.includes('and above') ||
              exp.includes('and up')
            ) {
              // Range: years and above (e.g., "1+ years" → 1 year and above)
              conditions.hasRequiredExperience = `(
                c.data->'metadata'->>'experience' IS NOT NULL AND
                (c.data->'metadata'->>'experience')::float >= ${years}
              )`;
            } else {
              // Exact: specific years only (e.g., "1 years" → exactly 1 year)
              conditions.hasRequiredExperience = `(
                c.data->'metadata'->>'experience' IS NOT NULL AND
                (c.data->'metadata'->>'experience')::float = ${years}
              )`;
            }
          }
        } else if (exp.includes('junior') || exp.includes('entry')) {
          conditions.hasRequiredExperience = `(
            c.data->'metadata'->>'experience' IS NOT NULL AND
            (c.data->'metadata'->>'experience')::float BETWEEN 0 AND 2
          )`;
        } else if (exp.includes('mid')) {
          conditions.hasRequiredExperience = `(
            c.data->'metadata'->>'experience' IS NOT NULL AND
            (c.data->'metadata'->>'experience')::float BETWEEN 3 AND 5
          )`;
        } else if (exp.includes('senior')) {
          conditions.hasRequiredExperience = `(
            c.data->'metadata'->>'experience' IS NOT NULL AND
            (c.data->'metadata'->>'experience')::float BETWEEN 6 AND 10
          )`;
        } else if (exp.includes('lead') || exp.includes('principal')) {
          conditions.hasRequiredExperience = `(
            c.data->'metadata'->>'experience' IS NOT NULL AND
            (c.data->'metadata'->>'experience')::float >= 10
          )`;
        }
      }

      // Industry condition
      if (criteria.industry) {
        const industry = criteria.industry.replace(/'/g, "''");
        conditions.hasRequiredIndustry = `(
          c.data->'metadata'->'industries' IS NOT NULL AND
          EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(c.data->'metadata'->'industries') industry
            WHERE LOWER(industry) LIKE LOWER('%${industry}%')
          )
        )`;
      }

      // Role condition - for sorting preference only (not filtering)
      if (criteria.role) {
        const role = criteria.role.replace(/'/g, "''");
        conditions.hasRequiredRole = `(
          LOWER(c.data->>'content') LIKE LOWER('%${role}%')
        )`;
      }

      logger.debug({
        message: 'Built exact match SQL conditions',
        context: 'GcpVertexRagProvider.buildExactMatchConditions',
        criteria,
        conditionsCount: Object.keys(conditions).filter(
          (key) => conditions[key as keyof typeof conditions] !== 'true'
        ).length,
      });
    } catch (error) {
      logger.error({
        message: 'Error building exact match conditions',
        context: 'GcpVertexRagProvider.buildExactMatchConditions',
        error: error instanceof Error ? error.message : 'Unknown error',
        criteria,
      });
    }

    return conditions;
  }

  /**
   * Parse exact match criteria from AI-generated job search prompt
   */
  private parseExactMatchCriteriaForJobs(aiPrompt: string): {
    jobTitle?: string;
    skills?: string[];
    mustSkills?: string[];
    location?: string;
    experience?: string;
    industry?: string;
    workType?: string;
    salaryRange?: string;
  } {
    const criteria: any = {};

    try {
      // Extract job title
      const jobTitleMatch = aiPrompt.match(/JOB_TITLE:\s*\[([^\]]+)\]/i);
      if (jobTitleMatch && !jobTitleMatch[1].includes('none specified')) {
        criteria.jobTitle = jobTitleMatch[1]
          .split(',')[0] // Take the first job title if multiple
          .trim()
          .replace(/['"]/g, '');
      }

      // Extract skills
      const skillsMatch = aiPrompt.match(/SKILLS:\s*\[([^\]]+)\]/i);
      if (skillsMatch && !skillsMatch[1].includes('none specified')) {
        criteria.skills = skillsMatch[1]
          .split(',')
          .map((s) => s.trim().replace(/['"]/g, ''))
          .filter((s) => s && !s.includes('none specified'));
      }

      // Extract must skills (skills connected by "and")
      const mustSkillsMatch = aiPrompt.match(/MUST_SKILLS:\s*\[([^\]]+)\]/i);
      if (mustSkillsMatch && !mustSkillsMatch[1].includes('none specified')) {
        criteria.mustSkills = mustSkillsMatch[1]
          .split(',')
          .map((s) => s.trim().replace(/['"]/g, ''))
          .filter((s) => s && !s.includes('none specified'));
      }

      // Extract location
      const locationMatch = aiPrompt.match(/LOCATION:\s*\[([^\]]+)\]/i);
      if (locationMatch && !locationMatch[1].includes('none specified')) {
        criteria.location = locationMatch[1].trim().replace(/['"]/g, '');
      }

      // Extract experience
      const experienceMatch = aiPrompt.match(/EXPERIENCE:\s*\[([^\]]+)\]/i);
      if (experienceMatch && !experienceMatch[1].includes('none specified')) {
        criteria.experience = experienceMatch[1].trim().replace(/['"]/g, '');
      }

      // Extract industry
      const industryMatch = aiPrompt.match(/INDUSTRY:\s*\[([^\]]+)\]/i);
      if (industryMatch && !industryMatch[1].includes('none specified')) {
        criteria.industry = industryMatch[1].trim().replace(/['"]/g, '');
      }

      // Extract work type
      const workTypeMatch = aiPrompt.match(/WORK_TYPE:\s*\[([^\]]+)\]/i);
      if (workTypeMatch && !workTypeMatch[1].includes('none specified')) {
        criteria.workType = workTypeMatch[1].trim().replace(/['"]/g, '');
      }

      // Extract salary range
      const salaryMatch = aiPrompt.match(/SALARY_RANGE:\s*\[([^\]]+)\]/i);
      if (salaryMatch && !salaryMatch[1].includes('none specified')) {
        criteria.salaryRange = salaryMatch[1].trim().replace(/['"]/g, '');
      }

      logger.debug({
        message: 'Successfully parsed job criteria from AI prompt',
        context: 'GcpVertexRagProvider.parseExactMatchCriteriaForJobs',
        criteria,
      });
    } catch (error) {
      logger.error({
        message: 'Error parsing exact match job criteria',
        context: 'GcpVertexRagProvider.parseExactMatchCriteriaForJobs',
        error: error instanceof Error ? error.message : 'Unknown error',
        aiPrompt: aiPrompt.substring(0, 300),
      });
    }

    return criteria;
  }

  /**
   * Build SQL conditions for exact job matching
   */
  private buildExactMatchConditionsForJobs(criteria: any): {
    hasRequiredJobTitle: string;
    hasRequiredSkills: string;
    hasRequiredMustSkills: string;
    hasRequiredLocation: string;
    hasRequiredExperience: string;
    hasRequiredIndustry: string;
    hasRequiredWorkType: string;
    hasRequiredSalary: string;
  } {
    const conditions = {
      hasRequiredJobTitle: 'true', // Default to true if no requirement
      hasRequiredSkills: 'true',
      hasRequiredMustSkills: 'true',
      hasRequiredLocation: 'true',
      hasRequiredExperience: 'true',
      hasRequiredIndustry: 'true',
      hasRequiredWorkType: 'true',
      hasRequiredSalary: 'true',
    };

    try {
      // Job title condition - check in content
      if (criteria.jobTitle) {
        const jobTitle = criteria.jobTitle.replace(/'/g, "''");
        conditions.hasRequiredJobTitle = `(
            LOWER(j.data->>'content') LIKE LOWER('%${jobTitle}%') OR
            LOWER(j.data->>'content') LIKE LOWER('%Title: ${jobTitle}%')
          )`;
      }

      // Skills condition - match against required or preferred skills
      if (criteria.skills && criteria.skills.length > 0) {
        const skillsCondition = criteria.skills
          .map((skill: string) => `LOWER('${skill.replace(/'/g, "''")}')`)
          .join(', ');

        conditions.hasRequiredSkills = `(
            (j.data->'metadata'->'requiredSkills' IS NOT NULL AND
             (SELECT COUNT(*) FROM jsonb_array_elements_text(j.data->'metadata'->'requiredSkills') skill 
              WHERE LOWER(skill) = ANY(ARRAY[${skillsCondition}])) > 0) OR
            (j.data->'metadata'->'preferredSkills' IS NOT NULL AND
             (SELECT COUNT(*) FROM jsonb_array_elements_text(j.data->'metadata'->'preferredSkills') skill 
              WHERE LOWER(skill) = ANY(ARRAY[${skillsCondition}])) > 0)
          )`;
      }

      // Must Skills condition - ALL skills must be present (exact matching)
      if (criteria.mustSkills && criteria.mustSkills.length > 0) {
        const mustSkillsCondition = criteria.mustSkills
          .map((skill: string) => `LOWER('${skill.replace(/'/g, "''")}')`)
          .join(', ');

        conditions.hasRequiredMustSkills = `(
          (j.data->'metadata'->'requiredSkills' IS NOT NULL AND
           (SELECT COUNT(*) FROM jsonb_array_elements_text(j.data->'metadata'->'requiredSkills') skill 
            WHERE LOWER(skill) = ANY(ARRAY[${mustSkillsCondition}])) >= ${criteria.mustSkills.length}) OR
          (j.data->'metadata'->'preferredSkills' IS NOT NULL AND
           (SELECT COUNT(*) FROM jsonb_array_elements_text(j.data->'metadata'->'preferredSkills') skill 
            WHERE LOWER(skill) = ANY(ARRAY[${mustSkillsCondition}])) >= ${criteria.mustSkills.length})
        )`;
      }

      // Location condition - exact matching
      if (criteria.location) {
        const location = criteria.location.replace(/'/g, "''");
        conditions.hasRequiredLocation = `(
            j.data->'metadata'->'locations' IS NOT NULL AND
            EXISTS (
              SELECT 1 FROM jsonb_array_elements_text(j.data->'metadata'->'locations') location
              WHERE LOWER(TRIM(location)) = LOWER('${location}')
            )
          )`;
      }

      // Experience condition - match job experience requirement
      if (criteria.experience) {
        const exp = criteria.experience.toLowerCase();
        if (/\d+/.test(exp)) {
          const years = parseInt(exp.match(/\d+/)?.[0] || '0');
          // For jobs, we want experience requirement to be close to what user specifies
          conditions.hasRequiredExperience = `(
              j.data->'metadata'->>'experience' IS NOT NULL AND
              (j.data->'metadata'->>'experience')::float BETWEEN ${Math.max(0, years - 2)} AND ${years + 2}
            )`;
        } else if (exp.includes('junior') || exp.includes('entry')) {
          conditions.hasRequiredExperience = `(
              j.data->'metadata'->>'experience' IS NOT NULL AND
              (j.data->'metadata'->>'experience')::float BETWEEN 0 AND 3
            )`;
        } else if (exp.includes('mid')) {
          conditions.hasRequiredExperience = `(
              j.data->'metadata'->>'experience' IS NOT NULL AND
              (j.data->'metadata'->>'experience')::float BETWEEN 2 AND 6
            )`;
        } else if (exp.includes('senior')) {
          conditions.hasRequiredExperience = `(
              j.data->'metadata'->>'experience' IS NOT NULL AND
              (j.data->'metadata'->>'experience')::float BETWEEN 5 AND 12
            )`;
        } else if (exp.includes('lead') || exp.includes('principal')) {
          conditions.hasRequiredExperience = `(
              j.data->'metadata'->>'experience' IS NOT NULL AND
              (j.data->'metadata'->>'experience')::float >= 8
            )`;
        }
      }

      // Industry condition - match job industry
      if (criteria.industry) {
        const industry = criteria.industry.replace(/'/g, "''");
        conditions.hasRequiredIndustry = `(
            (j.data->'metadata'->>'industry' IS NOT NULL AND
             LOWER(j.data->'metadata'->>'industry') LIKE LOWER('%${industry}%')) OR
            (j.data->'metadata'->'industries' IS NOT NULL AND
             EXISTS (
               SELECT 1 FROM jsonb_array_elements_text(j.data->'metadata'->'industries') industry
               WHERE LOWER(industry) LIKE LOWER('%${industry}%')
             ))
          )`;
      }

      // Work type condition - match remote/hybrid/onsite
      if (criteria.workType) {
        const workType = criteria.workType.toLowerCase();
        if (workType.includes('remote')) {
          conditions.hasRequiredWorkType = `(
              j.data->'metadata'->>'isRemote' = 'true' OR
              LOWER(j.data->>'content') LIKE LOWER('%remote%')
            )`;
        } else if (workType.includes('hybrid')) {
          conditions.hasRequiredWorkType = `(
              LOWER(j.data->>'content') LIKE LOWER('%hybrid%') OR
              LOWER(j.data->>'content') LIKE LOWER('%flexible%')
            )`;
        } else if (
          workType.includes('onsite') ||
          workType.includes('on-site')
        ) {
          conditions.hasRequiredWorkType = `(
              j.data->'metadata'->>'isRemote' = 'false' OR
              (j.data->'metadata'->>'isRemote' IS NULL AND
               LOWER(j.data->>'content') NOT LIKE LOWER('%remote%'))
            )`;
        }
      }

      // Salary condition - match salary range
      if (criteria.salaryRange) {
        const salaryMatch = criteria.salaryRange.match(
          /(\d+)(?:k|000)?(?:\s*-\s*(\d+)(?:k|000)?)?/i
        );
        if (salaryMatch) {
          const minSalary =
            parseInt(salaryMatch[1]) *
            (salaryMatch[1].includes('k') ? 1000 : 1);
          const maxSalary = salaryMatch[2]
            ? parseInt(salaryMatch[2]) *
              (salaryMatch[2].includes('k') ? 1000 : 1)
            : minSalary * 1.5; // If no max specified, use 1.5x min as max

          conditions.hasRequiredSalary = `(
              j.data->'metadata'->'salary' IS NOT NULL AND
              (j.data->'metadata'->'salary'->>'min')::float <= ${maxSalary} AND
              (j.data->'metadata'->'salary'->>'max')::float >= ${minSalary}
            )`;
        }
      }

      logger.debug({
        message: 'Built exact match job SQL conditions',
        context: 'GcpVertexRagProvider.buildExactMatchConditionsForJobs',
        criteria,
        conditionsCount: Object.keys(conditions).filter(
          (key) => conditions[key as keyof typeof conditions] !== 'true'
        ).length,
      });
    } catch (error) {
      logger.error({
        message: 'Error building exact match job conditions',
        context: 'GcpVertexRagProvider.buildExactMatchConditionsForJobs',
        error: error instanceof Error ? error.message : 'Unknown error',
        criteria,
      });
    }

    return conditions;
  }

  /**
   * Generate overall grounding information for job search results
   */
  private generateJobOverallGroundingInfo(
    results: any[],
    _query: string,
    exactCriteria: any
  ): string {
    if (results.length === 0) {
      return 'No jobs found matching your exact search criteria. Try broadening your search terms or adjusting your requirements.';
    }

    // Extract the actual search term from the query

    // Analyze overall statistics
    const totalResults = results.length;

    // Analyze matching details from results
    const skillMatches = new Set<string>();
    const locationMatches = new Set<string>();
    const titleMatches = new Set<string>();
    const experienceRanges: number[] = [];
    const salaryRanges: string[] = [];

    // Extract matching information from job metadata
    results.forEach((result) => {
      const metadata = result.metadata || {};

      // Collect skill matches
      if (Array.isArray(metadata.requiredSkills)) {
        metadata.requiredSkills.forEach((skill: string) => {
          if (
            skill &&
            exactCriteria.skills?.some((searchSkill: string) =>
              skill.toLowerCase().includes(searchSkill.toLowerCase())
            )
          ) {
            skillMatches.add(skill);
          }
        });
      }
      if (Array.isArray(metadata.preferredSkills)) {
        metadata.preferredSkills.forEach((skill: string) => {
          if (
            skill &&
            exactCriteria.skills?.some((searchSkill: string) =>
              skill.toLowerCase().includes(searchSkill.toLowerCase())
            )
          ) {
            skillMatches.add(skill);
          }
        });
      }

      // Collect location matches
      if (Array.isArray(metadata.locations)) {
        metadata.locations.forEach((location: string) => {
          if (location) {
            locationMatches.add(location);
          }
        });
      }

      // Collect experience data
      if (metadata.experience && typeof metadata.experience === 'number') {
        experienceRanges.push(metadata.experience);
      }

      // Collect salary data
      if (metadata.salary && metadata.salary.min && metadata.salary.max) {
        const salaryText = `${metadata.salary.min}-${metadata.salary.max} ${metadata.salary.currency || 'USD'}`;
        salaryRanges.push(salaryText);
      }

      // Extract job titles from content
      const content = result.content;
      if (content && typeof content === 'string') {
        const titleMatch = content.match(/Title:\s*([^\n]+)/i);
        if (titleMatch) {
          titleMatches.add(titleMatch[1].trim());
        }
      }
    });

    // Build comprehensive criteria summary
    const criteriaDetails: string[] = [];
    const matchingDetails: string[] = [];

    if (exactCriteria.skills?.length) {
      criteriaDetails.push(`${exactCriteria.skills.join(', ')} skills`);
      if (skillMatches.size > 0) {
        matchingDetails.push(
          `Found ${skillMatches.size} relevant skill${skillMatches.size === 1 ? '' : 's'}: ${Array.from(skillMatches).slice(0, 3).join(', ')}${skillMatches.size > 3 ? ', and more' : ''}`
        );
      }
    }

    if (exactCriteria.location) {
      criteriaDetails.push(`in ${exactCriteria.location}`);
      if (locationMatches.size > 0) {
        matchingDetails.push(
          `Available locations: ${Array.from(locationMatches).slice(0, 3).join(', ')}${locationMatches.size > 3 ? ', and more' : ''}`
        );
      }
    }

    if (exactCriteria.jobTitle) {
      criteriaDetails.push(`${exactCriteria.jobTitle} roles`);
      if (titleMatches.size > 0) {
        matchingDetails.push(
          `Job titles include: ${Array.from(titleMatches).slice(0, 2).join(', ')}${titleMatches.size > 2 ? ', and more' : ''}`
        );
      }
    }

    if (exactCriteria.experience) {
      criteriaDetails.push(`${exactCriteria.experience} experience`);
      if (experienceRanges.length > 0) {
        const avgExp =
          experienceRanges.reduce((sum, exp) => sum + exp, 0) /
          experienceRanges.length;
        const minExp = Math.min(...experienceRanges);
        const maxExp = Math.max(...experienceRanges);
        matchingDetails.push(
          `Experience requirements range from ${minExp} to ${maxExp} years (average: ${avgExp.toFixed(1)} years)`
        );
      }
    }

    if (exactCriteria.workType) {
      criteriaDetails.push(`${exactCriteria.workType} work`);
    }

    if (exactCriteria.salaryRange && salaryRanges.length > 0) {
      matchingDetails.push(
        `Salary ranges: ${salaryRanges.slice(0, 2).join(', ')}${salaryRanges.length > 2 ? ', and more' : ''}`
      );
    }

    const searchSummary =
      criteriaDetails.length > 0
        ? criteriaDetails.join(', ')
        : 'your search terms';

    // Calculate quality metrics
    const highQualityJobs = results.filter((r) => r.score >= 1.2).length;
    const perfectMatches = results.filter(
      (r) => r.metadata.exactMatchScore === 1.0
    ).length;

    // Generate comprehensive, informative grounding information
    let groundingInfo = `Found ${totalResults} job${totalResults === 1 ? '' : 's'} matching ${searchSummary}. `;

    if (perfectMatches > 0) {
      groundingInfo += `${perfectMatches} job${perfectMatches === 1 ? '' : 's'} perfectly matched all your requirements. `;
    } else if (highQualityJobs > 0) {
      groundingInfo += `${highQualityJobs} high-quality match${highQualityJobs === 1 ? '' : 'es'} found with strong relevance. `;
    } else {
      groundingInfo += `Results are ranked by relevance to your search criteria. `;
    }

    if (matchingDetails.length > 0) {
      groundingInfo += matchingDetails.join('. ') + '. ';
    }

    groundingInfo += `All positions have been filtered to align with your specific requirements and are sorted by match quality and relevance.`;

    if (exactCriteria.skills?.length && skillMatches.size === 0) {
      groundingInfo += ` Note: Consider broadening your skill requirements for more results.`;
    }

    return groundingInfo;
  }

  async searchJobsWithPrompt(
    query: string,
    limit: number = 10,
    page: number = 1
  ): Promise<ISearchResult[]> {
    logger.info({
      message: 'Starting exact match job search',
      context: 'GcpVertexRagProvider.searchJobsWithPrompt',
      query,
      queryLength: query.length,
    });

    // Step 1: Create embedding from the query (which is already AI-generated prompt)
    const embedding = await this.getEmbedding(query);

    // Step 2: Parse exact match criteria from AI prompt
    const exactCriteria = this.parseExactMatchCriteriaForJobs(query);

    logger.info({
      message: 'Parsed exact match criteria from AI prompt',
      context: 'GcpVertexRagProvider.searchJobsWithPrompt',
      exactCriteria,
    });

    const offset = (page - 1) * limit;
    const minScore = 0.3; // Baseline semantic similarity

    // Step 3: Build exact match SQL conditions
    const exactMatchConditions =
      this.buildExactMatchConditionsForJobs(exactCriteria);

    logger.debug({
      message: 'Built exact match conditions',
      context: 'GcpVertexRagProvider.searchJobsWithPrompt',
      conditions: exactMatchConditions,
    });

    // Step 4: Build the SQL query with exact matching conditions
    const jobTitleCondition =
      exactMatchConditions.hasRequiredJobTitle !== 'true'
        ? exactMatchConditions.hasRequiredJobTitle
        : 'true';
    const skillsCondition =
      exactMatchConditions.hasRequiredSkills !== 'true'
        ? exactMatchConditions.hasRequiredSkills
        : 'true';
    const mustSkillsCondition =
      exactMatchConditions.hasRequiredMustSkills !== 'true'
        ? exactMatchConditions.hasRequiredMustSkills
        : 'true';
    const locationCondition =
      exactMatchConditions.hasRequiredLocation !== 'true'
        ? exactMatchConditions.hasRequiredLocation
        : 'true';
    const experienceCondition =
      exactMatchConditions.hasRequiredExperience !== 'true'
        ? exactMatchConditions.hasRequiredExperience
        : 'true';
    const industryCondition =
      exactMatchConditions.hasRequiredIndustry !== 'true'
        ? exactMatchConditions.hasRequiredIndustry
        : 'true';
    const workTypeCondition =
      exactMatchConditions.hasRequiredWorkType !== 'true'
        ? exactMatchConditions.hasRequiredWorkType
        : 'true';
    const salaryCondition =
      exactMatchConditions.hasRequiredSalary !== 'true'
        ? exactMatchConditions.hasRequiredSalary
        : 'true';

    const results = await this.prisma.$queryRawUnsafe<SearchResult[]>(
      `
      WITH job_exact_matches AS (
        SELECT
          j."jobId" as id,
          j.data->>'content' as content,
          j.data->'metadata' as metadata,
          j.embedding,
          -- Semantic similarity score
          1 - (j.embedding <=> $1::vector) as semantic_score,
          -- Individual match conditions
          (${jobTitleCondition}) as job_title_matched,
          (${skillsCondition}) as skills_matched,
          (${mustSkillsCondition}) as must_skills_matched,
          (${locationCondition}) as location_matched,
          (${experienceCondition}) as experience_matched,
          (${industryCondition}) as industry_matched,
          (${workTypeCondition}) as work_type_matched,
          (${salaryCondition}) as salary_matched
        FROM job_embeddings j
        INNER JOIN job_postings jp ON j."jobId" = jp.id
        WHERE jp."isPublished" = true
          AND jp.status = 'PUBLISHED'
          AND j.embedding IS NOT NULL
          AND j.data IS NOT NULL
      ),
      scored_jobs AS (
        SELECT 
          id,
          content,
          metadata,
          semantic_score,
          job_title_matched,
          skills_matched,
          must_skills_matched,
          location_matched,
          experience_matched,
          industry_matched,
          work_type_matched,
          salary_matched,
          -- Calculate exact match score
          CASE 
            WHEN job_title_matched = true
             AND skills_matched = true
             AND must_skills_matched = true
             AND location_matched = true  
             AND experience_matched = true
             AND industry_matched = true
             AND work_type_matched = true
             AND salary_matched = true
            THEN 1.0
            ELSE 0.0
          END as exact_match_score,
          -- Individual match details for debugging
          jsonb_build_object(
            'job_title_matched', job_title_matched,
            'skills_matched', skills_matched,
            'location_matched', location_matched,
            'experience_matched', experience_matched,
            'industry_matched', industry_matched,
            'work_type_matched', work_type_matched,
            'salary_matched', salary_matched,
            'required_criteria', $2::jsonb
          ) as match_details
        FROM job_exact_matches
      ),
      final_jobs AS (
        SELECT 
          id,
          content,
          metadata,
          semantic_score,
          exact_match_score,
          match_details,
          -- Combined scoring: Exact match gets priority, then semantic similarity
          CASE 
            WHEN exact_match_score = 1.0 THEN 
              -- Perfect exact match: prioritize by semantic similarity
              1.0 + (semantic_score * 0.5)
            WHEN exact_match_score = 0.0 AND semantic_score >= $3 THEN
              -- No exact match but good semantic similarity: lower priority
              semantic_score * 0.3
            ELSE 
              0.0
          END as final_score
        FROM scored_jobs
        WHERE 
          -- STRICT MODE: Only return jobs with exact matches
          exact_match_score = 1.0
      )
      SELECT 
        id,
        content,
        metadata,
        final_score as score,
        exact_match_score,
        semantic_score,
        match_details
      FROM final_jobs
      WHERE final_score > 0
      ORDER BY final_score DESC, semantic_score DESC
      LIMIT $4
      OFFSET $5
    `,
      embedding,
      JSON.stringify(exactCriteria),
      minScore,
      limit * 2,
      offset
    );

    logger.debug({
      message: 'Exact match + semantic search completed',
      context: 'GcpVertexRagProvider.searchJobsWithPrompt',
      resultsCount: results.length,
      exactCriteria,
      query,
    });

    // Step 5: Format results with enhanced metadata
    const jobsWithEnhancedMetadata = results
      .map((result: SearchResult) => {
        const exactMatchScore = (result as any).exact_match_score || 0;
        if (exactMatchScore === 0) {
          return null;
        }

        return {
          id: result.id,
          score: result.score, // Use final score for ranking
          metadata: {
            ...result.metadata,
            exactMatchScore: result.exact_match_score,
            semanticScore: result.semantic_score,
            finalScore: result.score,
            matchDetails: result.match_details,
            searchType: exactMatchScore > 0 ? 'exact_match' : 'semantic_match',
            originalQuery: query,
            aiGeneratedPrompt: query.substring(0, 200) + '...',
          },
        };
      })
      .filter(
        (result): result is FilteredResult & { score: number } =>
          result !== null
      );

    // Step 6: Sort and limit final results
    const sortedResults = jobsWithEnhancedMetadata
      .sort((a, b) => {
        // First priority: exact matches
        const aIsExact = a.metadata.exactMatchScore === 1.0;
        const bIsExact = b.metadata.exactMatchScore === 1.0;

        if (aIsExact && !bIsExact) return -1;
        if (!aIsExact && bIsExact) return 1;

        // Second priority: final score
        return b.score - a.score;
      })
      .slice(0, limit);

    // Step 7: Generate overall grounding information and add it to the first result's metadata
    const overallGroundingInfo = this.generateJobOverallGroundingInfo(
      sortedResults as any[],
      query,
      exactCriteria
    );

    const finalResults = sortedResults.map((result, index) => ({
      id: result.id,
      score: result.score,
      metadata: {
        ...result.metadata,
        // Add grounding info to the first result only
        ...(index === 0 && { groundingInfo: overallGroundingInfo }),
      },
    }));

    logger.info({
      message: 'Exact match job search completed',
      context: 'GcpVertexRagProvider.searchJobsWithPrompt',
      totalResults: results.length,
      exactMatches: sortedResults.filter(
        (r) => r.metadata.exactMatchScore === 1.0
      ).length,
      semanticMatches: sortedResults.filter(
        (r) => r.metadata.exactMatchScore === 0.0
      ).length,
      finalResults: sortedResults.length,
      exactCriteria,
    });

    return finalResults;
  }

  /**
   * Generate overall grounding information for the entire search result set
   * @param results The search results with match details
   * @param query The original search query
   * @returns Overall explanation of search criteria and matching algorithm
   */
  private generateOverallGroundingInfo(results: any[], query: string): string {
    if (results.length === 0) {
      return 'No jobs found matching your search criteria. Try broadening your search terms or adjusting your requirements.';
    }

    // Extract the actual search term from the query
    const actualQuery = this.extractActualQuery(query);
    const searchTerm = actualQuery || query.trim();

    // Analyze overall statistics
    const totalResults = results.length;
    const avgScore =
      results.reduce((sum, r) => sum + r.score, 0) / totalResults;
    const highScoreResults = results.filter((r) => r.score >= 0.8).length;
    const mediumScoreResults = results.filter(
      (r) => r.score >= 0.6 && r.score < 0.8
    ).length;

    // Count skill matches across all results
    const totalExactRequired = results.reduce(
      (sum, r) => sum + (r.exact_required_skill_matches || 0),
      0
    );
    const totalExactPreferred = results.reduce(
      (sum, r) => sum + (r.exact_preferred_skill_matches || 0),
      0
    );
    const totalPartialRequired = results.reduce(
      (sum, r) => sum + (r.partial_required_skill_matches || 0),
      0
    );
    const totalPartialPreferred = results.reduce(
      (sum, r) => sum + (r.partial_preferred_skill_matches || 0),
      0
    );

    // Build comprehensive grounding explanation
    let groundingInfo = `Found ${totalResults} job(s) matching your search for "${searchTerm}". `;

    // Add skill matching information
    const totalSkillMatches =
      totalExactRequired +
      totalExactPreferred +
      totalPartialRequired +
      totalPartialPreferred;
    if (totalSkillMatches > 0) {
      groundingInfo += `The AI identified ${totalSkillMatches} total skill alignment(s) across all results, including ${totalExactRequired} exact required skill matches and ${totalExactPreferred} exact preferred skill matches. `;
    }

    // Add score distribution information
    if (highScoreResults > 0) {
      groundingInfo += `${highScoreResults} result(s) show high relevance (80%+ match score), indicating strong alignment with your search criteria. `;
    }
    if (mediumScoreResults > 0) {
      groundingInfo += `${mediumScoreResults} result(s) show moderate relevance (60-80% match score), suggesting good potential matches with some skill overlap. `;
    }

    // Add average score information
    groundingInfo += `Average match score across all results is ${(avgScore * 100).toFixed(1)}%, reflecting the overall quality of matches found. `;

    // Add matching algorithm explanation
    groundingInfo += `Results were ranked using semantic similarity analysis, exact skill matching, and content relevance scoring. The search algorithm prioritized jobs with direct skill matches while also considering contextual relevance and job description alignment.`;

    return groundingInfo;
  }

  /**
   * Extract the actual search query from prompt templates
   * @param query The full query that may contain prompt templates
   * @returns Clean search term
   */
  private extractActualQuery(query: string): string {
    // If query contains prompt template markers, extract the actual query
    if (query.includes('QUERY: ')) {
      const queryMatch = query.match(/QUERY:\s*(.+?)(?:\n|$)/);
      if (queryMatch) {
        return queryMatch[1].trim();
      }
    }

    // If query starts with a prompt template, try to extract the search term
    if (
      query.includes('JOB SEARCH:') ||
      query.includes('COMPREHENSIVE JOB SEARCH:')
    ) {
      // Look for the actual search term after the prompt
      const lines = query.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (
          trimmed &&
          !trimmed.startsWith('JOB SEARCH:') &&
          !trimmed.startsWith('COMPREHENSIVE JOB SEARCH:') &&
          !trimmed.startsWith('MATCH') &&
          !trimmed.startsWith('SCORING') &&
          !trimmed.startsWith('QUERY:')
        ) {
          return trimmed;
        }
      }
    }

    // Return the original query if no template detected
    return query.trim();
  }
}
