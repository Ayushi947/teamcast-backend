import { PrismaClient } from '@prisma/client';
import {
  ICandidateRecommendationProvider,
  ICandidateRecommendationTask,
  CandidateRecommendationStatus,
  SearchResult,
} from '../candidate.recommendation.provider';
import { ISearchResult } from '@/shared/models/domain/search/search.domain';
import { logger } from '@/shared/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { GcpVertexRagProvider } from '@/services/helpers/rag/providers/gcp.vertex.rag.provider';
import { CandidateRecommendationPromptGenerator } from './candidate.recommendation.prompt.generator';
import { ENV } from '@/config/env';
import { GoogleAuth } from 'google-auth-library';
import { gcpConfig } from '@/config/gcp';
import {
  ICandidateRecommendation,
  toCandidateRecommendationDomain,
} from '@/shared/models/domain/candidate/recommendation.domain';

export class GcpVertexCandidateRecommendationProvider
  implements ICandidateRecommendationProvider
{
  private readonly prisma: PrismaClient;
  private readonly ragProvider: GcpVertexRagProvider;
  private readonly projectId: string;
  private readonly location: string;
  private readonly modelId: string;
  private readonly apiEndpoint: string;
  private readonly auth: GoogleAuth;

  constructor() {
    this.prisma = new PrismaClient();
    // Initialize RAG provider with required dependency
    this.ragProvider = new GcpVertexRagProvider();
    this.projectId = ENV.GOOGLE_CLOUD_PROJECT_ID;
    this.location = ENV.GOOGLE_CLOUD_VERTEX_AI_LOCATION;
    this.modelId =
      ENV.GOOGLE_CLOUD_VERTEX_AI_EMBEDDING_MODEL_ID || 'text-embedding-005';
    this.apiEndpoint = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${this.modelId}:predict`;
    this.auth = gcpConfig.getAuth();
    // Don't create CandidateProfileService here - use lazy initialization
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

  async searchJobsRecommendation(
    query: string,
    limit: number = 10,
    prevSyncDateTime?: Date
  ): Promise<ISearchResult[]> {
    logger.info({
      message: 'Starting job search',
      context: 'GcpVertexRagProvider.searchJobs',
      query,
      queryLength: query.length,
    });

    const embedding = await this.getEmbedding(query);
    const offset = 0;
    // Simplified query processing - let Gemini embedding model handle stop words naturally
    const tokenizeQuery = (text: string): string[] => {
      return (
        text
          .toLowerCase()
          // Handle special tech formats like "Node.js", "C++", "C#", etc.
          .replace(/([a-z])\.([a-z])/g, '$1_dot_$2') // Node.js -> node_dot_js
          .replace(/([a-z])\+\+/g, '$1plusplus') // C++ -> cplusplus
          .replace(/([a-z])#/g, '$1sharp') // C# -> csharp
          // Split by various delimiters but preserve meaningful punctuation
          .split(/[\s,;()[\]{}|/\\]+/)
          .map((term) => term.trim())
          .filter((term) => term.length > 1) // Only filter very short terms, let embedding model handle the rest
          // Restore special formats
          .map((term) =>
            term
              .replace(/_dot_/g, '.')
              .replace(/plusplus/g, '++')
              .replace(/sharp/g, '#')
          )
      );
    };

    // Extract meaningful n-grams (1-3 words) for better matching
    const extractNGrams = (tokens: string[], maxN: number = 3): string[] => {
      const ngrams: string[] = [];

      for (let i = 0; i < tokens.length; i++) {
        // Unigrams
        ngrams.push(tokens[i]);

        // Bigrams
        if (i < tokens.length - 1) {
          ngrams.push(`${tokens[i]} ${tokens[i + 1]}`);
        }

        // Trigrams
        if (maxN >= 3 && i < tokens.length - 2) {
          ngrams.push(`${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`);
        }
      }

      return [...new Set(ngrams)]; // Remove duplicates
    };

    const queryTokens = tokenizeQuery(query);
    const queryNGrams = extractNGrams(queryTokens);

    // Separate longer phrases from single terms for different matching strategies
    const singleTerms = queryNGrams.filter((term) => !term.includes(' '));
    const phrases = queryNGrams.filter((term) => term.includes(' '));

    // Build the WHERE clause conditionally
    const whereClause = prevSyncDateTime
      ? `AND (j.data->'metadata'->>'jobCreatedAt')::timestamp > $6`
      : '';

    // Search using pgvector with improved title and skills matching
    const results = await this.prisma.$queryRawUnsafe<SearchResult[]>(
      `
      WITH job_scores AS (
        SELECT
          j."jobId" as id,
          j.data->>'content' as content,
          j.data->'metadata' as metadata,
          -- Extract title from content (Title: <title>) and calculate title match score
          CASE 
            WHEN j.data->>'content' ~ '^Title: ' 
            THEN (
              WITH title_text AS (
                SELECT LOWER(regexp_replace(split_part(j.data->>'content', E'\\n', 1), '^Title: ', '')) as title
              )
              SELECT GREATEST(
                -- Single term matching
                (
                  SELECT COUNT(DISTINCT term)::float 
                  FROM unnest($1::text[]) term
                  WHERE title_text.title LIKE '%' || term || '%'
                ) / NULLIF(array_length($1::text[], 1), 0) * 0.6,
                -- Phrase matching (higher weight)
                (
                  SELECT COUNT(DISTINCT phrase)::float 
                  FROM unnest($2::text[]) phrase
                  WHERE title_text.title LIKE '%' || phrase || '%'
                ) / NULLIF(array_length($2::text[], 1), 0) * 0.8
              )
              FROM title_text
            )
            ELSE 0 
          END as title_score,
          -- Skills match score using exact and partial matching
          CASE 
            WHEN j.data->'metadata'->'requiredSkills' IS NOT NULL 
            THEN (
              WITH skill_analysis AS (
                SELECT 
                  -- Single term matches in skills
                  (
                    SELECT COUNT(DISTINCT term)::float
                    FROM unnest($1::text[]) term
                    CROSS JOIN jsonb_array_elements_text(j.data->'metadata'->'requiredSkills') skill
                    WHERE LOWER(skill) LIKE '%' || term || '%'
                  ) as single_matches,
                  -- Phrase matches in skills (higher precision)
                  (
                    SELECT COUNT(DISTINCT phrase)::float
                    FROM unnest($2::text[]) phrase
                    CROSS JOIN jsonb_array_elements_text(j.data->'metadata'->'requiredSkills') skill
                    WHERE LOWER(skill) LIKE '%' || phrase || '%'
                  ) as phrase_matches,
                  array_length($1::text[], 1) as total_single_terms,
                  array_length($2::text[], 1) as total_phrases,
                  jsonb_array_length(j.data->'metadata'->'requiredSkills') as total_skills
              )
              SELECT GREATEST(
                -- Query coverage score (how many query terms matched)
                (single_matches * 0.4 + phrase_matches * 0.6) / NULLIF(total_single_terms + total_phrases, 0) * 0.7,
                -- Skill coverage score (how many skills matched)
                (single_matches * 0.4 + phrase_matches * 0.6) / NULLIF(total_skills, 0) * 0.5
              )
              FROM skill_analysis
            )
            ELSE 0 
          END as skills_score,
          -- Content-based matching for broader context
          CASE 
            WHEN j.data->>'content' IS NOT NULL 
            THEN (
              SELECT COUNT(DISTINCT term)::float 
              FROM unnest($1::text[]) term
              WHERE LOWER(j.data->>'content') LIKE '%' || term || '%'
            ) / NULLIF(array_length($1::text[], 1), 0) * 0.2
            ELSE 0 
          END as content_score,
          -- Semantic similarity score
          (1 - (j.embedding <=> $3::vector)) as semantic_score
        FROM job_embeddings j
        JOIN job_postings jp ON j."jobId" = jp.id
        WHERE jp."isPublished" = true
          AND jp.status = 'PUBLISHED'
          ${whereClause}
      ),
      filtered_jobs AS (
        SELECT *,
          (title_score + skills_score + content_score) as combined_score
        FROM job_scores
        WHERE (title_score + skills_score + content_score) > 0.05  -- Adaptive threshold
      )
      SELECT 
        id,
        content,
        metadata,
        combined_score as score,
        semantic_score,
        title_score,
        skills_score,
        content_score
      FROM filtered_jobs
      ORDER BY 
        combined_score DESC, 
        semantic_score DESC,
        title_score DESC,
        skills_score DESC
      LIMIT $4
      OFFSET $5
    `,
      singleTerms,
      phrases,
      embedding,
      limit,
      offset,
      ...(prevSyncDateTime ? [prevSyncDateTime.toISOString()] : [])
    );

    logger.debug({
      message: 'Job search results',
      context: 'GcpVertexRagProvider.searchJobs',
      resultsCount: results.length,
      limit,
      query,
      queryTokens,
      singleTerms,
      phrases,
      totalNGrams: queryNGrams.length,
      scores: results.map((r) => ({
        id: r.id,
        totalScore: r.score,
        semanticScore: r.semantic_score,
        titleScore: r.title_score,
        skillsScore: r.skills_score,
        contentScore: (r as any).content_score,
      })),
    });

    return (results as any[]).map((result) => ({
      id: result.id,
      score: result.score,
      content: result.content,
      metadata: {
        ...result.metadata,
        semanticScore: result.semantic_score,
        titleScore: result.title_score,
        skillsScore: result.skills_score,
      },
    }));
  }

  async findInitialRecommendations(
    candidateId: string,
    limit: number = 50,
    prevSyncDateTime?: Date
  ): Promise<ICandidateRecommendationTask> {
    const taskId = `candidate-rec-initial-${candidateId}-${Date.now()}`;

    const task: ICandidateRecommendationTask = {
      taskId,
      status: CandidateRecommendationStatus.STARTED,
      candidateId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      logger.info('Finding initial recommendations for candidate', {
        context:
          'GcpVertexCandidateRecommendationProvider.findInitialRecommendations',
        candidateId,
        limit,
        taskId,
      });

      const candidatePreferences =
        await this.getCandidateSearchTerms(candidateId);

      if (!candidatePreferences?.preferredJobTitles?.length) {
        logger.info('No job title preferences found for candidate', {
          context:
            'GcpVertexCandidateRecommendationProvider.findInitialRecommendations',
          candidateId,
          taskId,
        });
      }

      const searchPrompt =
        await CandidateRecommendationPromptGenerator.generateCandidateRecommendationPromptWithFeedback(
          {
            preferredJobTitles: candidatePreferences.preferredJobTitles || [],
            preferredLocations: candidatePreferences.preferredLocations || [],
            skills: candidatePreferences.skills || [],
          },
          prevSyncDateTime
        );

      logger.debug({
        message: 'Generated search prompt',
        context: 'SearchService.getJobRecommendation',
        searchPrompt,
      });

      // Get recommended jobs using RAG
      const recommendedJobs = await this.searchJobsRecommendation(
        searchPrompt,
        limit,
        prevSyncDateTime
      );

      logger.info('Found recommended jobs via RAG', {
        context:
          'GcpVertexCandidateRecommendationProvider.findInitialRecommendations',
        candidateId,
        jobCount: recommendedJobs.length,
        taskId,
      });

      // Store recommendations in database
      await this.storeRecommendations(candidateId, recommendedJobs);

      // Update candidate's recommendationsSync timestamp
      await this.prisma.candidate.update({
        where: { id: candidateId },
        data: { recommendationsSync: new Date() },
      });

      task.status = CandidateRecommendationStatus.COMPLETED;
      task.updatedAt = new Date();

      logger.info('Initial recommendations completed successfully', {
        context:
          'GcpVertexCandidateRecommendationProvider.findInitialRecommendations',
        candidateId,
        recommendationsCreated: recommendedJobs.length,
        taskId,
      });
    } catch (error) {
      task.status = CandidateRecommendationStatus.FAILED;
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.updatedAt = new Date();

      logger.error('Failed to find initial recommendations', {
        context:
          'GcpVertexCandidateRecommendationProvider.findInitialRecommendations',
        candidateId,
        taskId,
        error: task.error,
      });
    }

    return task;
  }

  async findRecommendations(
    candidateId: string,
    lastSyncTimestamp?: Date,
    limit: number = 25
  ): Promise<ICandidateRecommendationTask> {
    const taskId = `candidate-rec-update-${candidateId}-${Date.now()}`;

    const task: ICandidateRecommendationTask = {
      taskId,
      status: CandidateRecommendationStatus.STARTED,
      candidateId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      logger.info('Finding new recommendations for candidate', {
        context: 'GcpVertexCandidateRecommendationProvider.findRecommendations',
        candidateId,
        lastSyncTimestamp,
        limit,
        taskId,
      });

      // Get new job postings that were updated after the last sync
      const newJobsFilter = lastSyncTimestamp
        ? {
            updatedAt: {
              gte: lastSyncTimestamp,
            },
            status: 'PUBLISHED' as any,
            isPublished: true,
          }
        : {
            status: 'PUBLISHED' as any,
            isPublished: true,
          };

      const newJobs = await this.prisma.job_posting.findMany({
        where: newJobsFilter,
        select: { id: true },
        take: limit * 2, // Get more jobs to have options after filtering
      });

      logger.info('Found new jobs to process', {
        context: 'GcpVertexCandidateRecommendationProvider.findRecommendations',
        candidateId,
        newJobsCount: newJobs.length,
        taskId,
      });

      if (newJobs.length === 0) {
        task.status = CandidateRecommendationStatus.COMPLETED;
        task.updatedAt = new Date();

        logger.info('No new jobs found for recommendations', {
          context:
            'GcpVertexCandidateRecommendationProvider.findRecommendations',
          candidateId,
          taskId,
        });

        return task;
      }

      const candidatePreferences =
        await this.getCandidateSearchTerms(candidateId);

      const searchPrompt =
        await CandidateRecommendationPromptGenerator.generateCandidateRecommendationPromptWithFeedback(
          {
            preferredJobTitles: candidatePreferences.preferredJobTitles || [],
            preferredLocations: candidatePreferences.preferredLocations || [],
            skills: candidatePreferences.skills || [],
          },
          null,
          lastSyncTimestamp
        );

      logger.debug({
        message: 'Generated search prompt',
        context: 'SearchService.getJobRecommendation',
        searchPrompt,
      });

      // Use RAG to find the best matches among new jobs
      const recommendedJobs = await this.searchJobsRecommendation(
        searchPrompt,
        limit
      );

      // Filter to only include new jobs
      const newJobIds = new Set(newJobs.map((j) => j.id));
      const filteredRecommendations = recommendedJobs.filter((rec) =>
        newJobIds.has(rec.id)
      );

      logger.info('Filtered recommendations to new jobs only', {
        context: 'GcpVertexCandidateRecommendationProvider.findRecommendations',
        candidateId,
        originalCount: recommendedJobs.length,
        filteredCount: filteredRecommendations.length,
        taskId,
      });

      // Store new recommendations
      if (filteredRecommendations.length > 0) {
        await this.storeRecommendations(candidateId, filteredRecommendations);
      }

      // Update candidate's recommendationsSync timestamp
      await this.prisma.candidate.update({
        where: { id: candidateId },
        data: { recommendationsSync: new Date() },
      });

      task.status = CandidateRecommendationStatus.COMPLETED;
      task.updatedAt = new Date();

      logger.info('New recommendations completed successfully', {
        context: 'GcpVertexCandidateRecommendationProvider.findRecommendations',
        candidateId,
        recommendationsCreated: filteredRecommendations.length,
        taskId,
      });
    } catch (error) {
      task.status = CandidateRecommendationStatus.FAILED;
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.updatedAt = new Date();

      logger.error('Failed to find new recommendations', {
        context: 'GcpVertexCandidateRecommendationProvider.findRecommendations',
        candidateId,
        taskId,
        error: task.error,
      });
    }

    return task;
  }

  async getRecommendedJobs(
    candidateId: string,
    limit: number = 10
  ): Promise<ISearchResult[]> {
    try {
      logger.info('Getting recommended jobs for candidate', {
        context: 'GcpVertexCandidateRecommendationProvider.getRecommendedJobs',
        candidateId,
        limit,
      });

      return await this.ragProvider.searchJobsForCandidate(candidateId, limit);
    } catch (error) {
      logger.error('Failed to get recommended jobs', {
        context: 'GcpVertexCandidateRecommendationProvider.getRecommendedJobs',
        candidateId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get a candidate's search terms
   */
  private async getCandidateSearchTerms(candidateId: string): Promise<{
    preferredJobTitles?: string[];
    preferredLocations?: string[];
    skills?: string[];
  }> {
    try {
      const candidate = await this.prisma.candidate_preferences.findUnique({
        where: { candidateId },
        include: {
          candidate: {
            include: {
              resume: true,
            },
          },
        },
      });

      if (!candidate) {
        return {
          preferredJobTitles: [],
          preferredLocations: [],
          skills: [],
        };
      }

      return {
        preferredJobTitles: candidate.preferredJobTitles,
        preferredLocations: candidate.preferredLocations,
        skills: candidate.candidate.resume?.resumeSkills,
      };
    } catch (error) {
      logger.error({
        message: 'Failed to get candidate search terms',
        context: 'CandidateProfileService.getCandidateSearchTerms',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
      });
      throw error;
    }
  }

  /**
   * Store recommendations in the database
   */
  private async storeRecommendations(
    candidateId: string,
    jobs: ISearchResult[]
  ): Promise<void> {
    try {
      logger.info('Storing recommendations in database', {
        context:
          'GcpVertexCandidateRecommendationProvider.storeRecommendations',
        candidateId,
        jobsCount: jobs.length,
      });

      // Prepare recommendations data
      const recommendations = jobs.map((job) => ({
        id: uuidv4(),
        candidateId,
        jobPostingId: job.id,
        score: job.score,
        matchReason: this.extractMatchReasons(job),
        status: 'ACTIVE' as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      // Use upsert to avoid duplicate recommendations
      for (const rec of recommendations) {
        await this.prisma.candidate_recommendation.upsert({
          where: {
            candidateId_jobPostingId: {
              candidateId: rec.candidateId,
              jobPostingId: rec.jobPostingId,
            },
          },
          update: {
            score: rec.score,
            matchReason: rec.matchReason,
            updatedAt: rec.updatedAt,
          },
          create: rec,
        });
      }

      logger.info('Successfully stored recommendations', {
        context:
          'GcpVertexCandidateRecommendationProvider.storeRecommendations',
        candidateId,
        recommendationsStored: recommendations.length,
      });
    } catch (error) {
      logger.error('Failed to store recommendations', {
        context:
          'GcpVertexCandidateRecommendationProvider.storeRecommendations',
        candidateId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Extract match reasons from job metadata
   */
  private extractMatchReasons(job: ISearchResult): string[] {
    const reasons: string[] = [];

    if (job.metadata) {
      if (job.metadata.skillMatchScore > 0) {
        reasons.push('Skills match');
      }
      if (job.metadata.experienceMatchScore > 0) {
        reasons.push('Experience match');
      }
      if (job.metadata.locationMatchScore > 0) {
        reasons.push('Location match');
      }
      if (job.metadata.industryMatchScore > 0) {
        reasons.push('Industry match');
      }
      if (job.metadata.semanticScore > 0.8) {
        reasons.push('High semantic similarity');
      }
    }

    return reasons.length > 0 ? reasons : ['AI recommended'];
  }

  private async getJobPostingSearchTerms(
    jobPostId: string
  ): Promise<{ jobSearchTerms: string; jobPostTitle: string }> {
    const jobPosting = await this.prisma.job_posting.findUnique({
      where: { id: jobPostId },
      select: {
        title: true,
        description: true,
        requiredSkills: true,
        preferredSkills: true,
        industry: true,
        jobType: true,
        jobCommitment: true,
        jobSchedule: true,
        preferredLocations: true,
        preferredIndustries: true,
      },
    });

    if (!jobPosting) {
      return {
        jobSearchTerms: '',
        jobPostTitle: '',
      };
    }

    // Combine relevant fields into search terms
    const searchTerms = [
      jobPosting.title,
      jobPosting.description,
      ...jobPosting.requiredSkills,
      ...jobPosting.preferredSkills,
      jobPosting.industry,
      jobPosting.jobType,
      jobPosting.jobCommitment,
      jobPosting.jobSchedule,
      ...jobPosting.preferredLocations,
      ...jobPosting.preferredIndustries,
    ]
      .filter(Boolean)
      .join(' ');

    return {
      jobSearchTerms: searchTerms,
      jobPostTitle: jobPosting.title,
    };
  }

  async createCandidateRecommendation(
    candidateId: string,
    jobId: string
  ): Promise<ICandidateRecommendation> {
    const candidatePreferences =
      await this.getCandidateSearchTerms(candidateId);

    const jobPostingSearchTerms = await this.getJobPostingSearchTerms(jobId);

    const promptGenerator = new CandidateRecommendationPromptGenerator();
    const { score, metadata } =
      await promptGenerator.createManualRecommendationScore(
        candidatePreferences,
        jobPostingSearchTerms
      );

    const createCandidateRecommendation =
      await this.prisma.candidate_recommendation.upsert({
        where: {
          candidateId_jobPostingId: {
            candidateId,
            jobPostingId: jobId,
          },
        },
        update: {
          score,
          matchReason: [metadata],
          updatedAt: new Date(),
        },
        create: {
          candidateId,
          jobPostingId: jobId,
          score,
          matchReason: [metadata],
          status: 'ACTIVE' as any,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

    return toCandidateRecommendationDomain(createCandidateRecommendation);
  }
}
