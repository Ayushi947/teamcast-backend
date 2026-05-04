import { PrismaClient } from '@prisma/client';
import {
  FilteredResult,
  IJobRecommendationProvider,
  IJobRecommendationTask,
  JobRecommendationStatus,
  SearchResult,
} from '../job.recommendation.provider';
import { ISearchResult } from '@/shared/models/domain/search/search.domain';
import { logger } from '@/shared/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { GcpVertexRagProvider } from '@/services/helpers/rag/providers/gcp.vertex.rag.provider';
import { JobRecommendationPromptGenerator } from './job.recommendation.prompt';
import { ENV } from '@/config/env';
import { gcpConfig } from '@/config/gcp';
import { GoogleAuth } from 'google-auth-library';

export class GcpVertexJobRecommendationProvider
  implements IJobRecommendationProvider
{
  private readonly prisma: PrismaClient;
  private readonly ragProvider: GcpVertexRagProvider;
  private readonly jobRecommendationPromptGenerator: JobRecommendationPromptGenerator;
  private readonly projectId: string;
  private readonly location: string;
  private readonly modelId: string;
  private readonly apiEndpoint: string;
  private readonly auth: GoogleAuth;
  private readonly geminiModel: string;
  private readonly geminiApiEndpoint: string;

  constructor() {
    this.prisma = new PrismaClient();
    this.projectId = ENV.GOOGLE_CLOUD_PROJECT_ID;
    this.location = ENV.GOOGLE_CLOUD_VERTEX_AI_LOCATION;
    this.modelId =
      ENV.GOOGLE_CLOUD_VERTEX_AI_EMBEDDING_MODEL_ID || 'text-embedding-005';
    this.apiEndpoint = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${this.modelId}:predict`;
    this.auth = gcpConfig.getAuth();
    this.geminiModel = ENV.GOOGLE_CLOUD_VERTEX_AI_MODEL;
    this.geminiApiEndpoint = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${this.geminiModel}:generateContent`;
    // Initialize RAG provider with required dependency
    this.ragProvider = new GcpVertexRagProvider();
    this.jobRecommendationPromptGenerator =
      new JobRecommendationPromptGenerator();
  }

  private async getEmbedding(text: string): Promise<number[]> {
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

  /**
   * Generate AI-powered grounding information using Vertex AI Gemini
   */
  async generateIndividualGroundingInfo(
    result: FilteredResult & { aiScore: number }
  ): Promise<string> {
    try {
      // Collect all the candidate information with percentage validation
      const candidateInfo = {
        aiScore: Math.min(result.aiScore, 100), // Ensure AI score doesn't exceed 100%
        matchedSkills: result.metadata.matchDetails?.matched_skills || [],
        matchedLocations: result.metadata.matchDetails?.matched_locations || [],
        matchedIndustries:
          result.metadata.matchDetails?.matched_industries || [],
        experience: result.metadata.matchDetails?.experience || 0,
        semanticScore: Math.min(
          Math.round(result.metadata.semanticScore * 100),
          100
        ), // Ensure semantic score doesn't exceed 100%
        skillMatchScore: Math.min(
          Math.round(result.metadata.skillMatchScore * 100),
          100
        ), // Ensure skill match score doesn't exceed 100%
        locationMatchScore: Math.min(
          Math.round(result.metadata.locationMatchScore * 100),
          100
        ), // Ensure location match score doesn't exceed 100%
      };

      // Create prompt for AI grounding generation
      const prompt = `Generate a short, human-readable grounding explanation (2-5 sentences) for why this candidate is recommended for a job position. Use the following information:

AI Assessment Score: ${candidateInfo.aiScore}%
Matched Skills: ${candidateInfo.matchedSkills.join(', ') || 'None specified'}
Matched Locations: ${candidateInfo.matchedLocations.join(', ') || 'None specified'}
Matched Industries: ${candidateInfo.matchedIndustries.join(', ') || 'None specified'}
Experience: ${Math.round(candidateInfo.experience)} years
Match Scores - Semantic: ${candidateInfo.semanticScore}%, Skills: ${candidateInfo.skillMatchScore}%${candidateInfo.locationMatchScore > 0 ? `, Location: ${candidateInfo.locationMatchScore}%` : ''}

Requirements:
- Write in clear, professional language
- Use ONLY plain text, NO emojis or special characters
- Focus on the most important matching factors
- Keep it concise but informative
- Start with "This candidate is recommended because..."
- Include specific percentages and key details
- Ensure all percentages are valid (0-100%) and professional`;

      const accessToken = await this.auth.getAccessToken();

      const requestBody = {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 512,
          temperature: 0.3,
          topP: 0.8,
        },
      };

      const response = await fetch(this.geminiApiEndpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (generatedText) {
        logger.debug('AI grounding info generated successfully', {
          context: 'GcpVertexJobRecommendationProvider.generateAIGroundingInfo',
          candidateId: result.id,
          responseLength: generatedText.length,
        });
        return generatedText.trim();
      }

      logger.warn('No valid response from Vertex AI for grounding info', {
        context: 'GcpVertexJobRecommendationProvider.generateAIGroundingInfo',
        candidateId: result.id,
      });

      // Fallback to original format if AI fails
      return this.generateFallbackGroundingInfo(result);
    } catch (error) {
      logger.error('Failed to generate AI grounding info', {
        context: 'GcpVertexJobRecommendationProvider.generateAIGroundingInfo',
        candidateId: result.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Fallback to original format if AI fails
      return this.generateFallbackGroundingInfo(result);
    }
  }

  /**
   * Generate fallback grounding information when AI generation fails
   */
  private generateFallbackGroundingInfo(
    result: FilteredResult & { aiScore: number }
  ): string {
    const groundingParts = [];

    // Add AI score and recommendation with validation
    groundingParts.push(
      `AI Assessment Score: ${Math.min(result.aiScore, 100)}%`
    );

    // Add skill matches
    if (result.metadata.matchDetails?.matched_skills?.length > 0) {
      groundingParts.push(
        `Matched Skills: ${result.metadata.matchDetails.matched_skills.join(', ')}`
      );
    }

    // Add location matches
    if (result.metadata.matchDetails?.matched_locations?.length > 0) {
      groundingParts.push(
        `Matched Locations: ${result.metadata.matchDetails.matched_locations.join(', ')}`
      );
    }

    // Add industry matches
    if (result.metadata.matchDetails?.matched_industries?.length > 0) {
      groundingParts.push(
        `Matched Industries: ${result.metadata.matchDetails.matched_industries.join(', ')}`
      );
    }

    // Add experience info
    if (result.metadata.matchDetails?.experience) {
      groundingParts.push(
        `Experience: ${Math.round(result.metadata.matchDetails.experience)} years`
      );
    }

    // Add match scores with validation to ensure percentages don't exceed 100%
    const semanticScore = Math.min(
      Math.round(result.metadata.semanticScore * 100),
      100
    );
    const skillMatchScore = Math.min(
      Math.round(result.metadata.skillMatchScore * 100),
      100
    );
    const locationMatchScore =
      result.metadata.locationMatchScore > 0
        ? Math.min(Math.round(result.metadata.locationMatchScore * 100), 100)
        : 0;

    groundingParts.push(
      `Match Scores - Semantic: ${semanticScore}%, ` +
        `Skills: ${skillMatchScore}%` +
        (locationMatchScore > 0 ? `, Location: ${locationMatchScore}%` : '')
    );

    return groundingParts.join('; ');
  }

  async searchRecommendedCandidates(
    query: string,
    limit: number = 10,
    prevSyncDateTime?: Date
  ): Promise<ISearchResult[]> {
    logger.info({
      message: 'Starting optimized candidate search with grounding',
      context: 'GcpVertexRagProvider.searchCandidates',
      query,
      queryLength: query.length,
    });

    const embedding = await this.getEmbedding(query);

    // Dynamic query term extraction - no hardcoding
    const queryTerms = query
      .toLowerCase()
      .replace(/[^\w\s.-]/g, ' ') // Replace special chars except dots and hyphens (for tech terms)
      .split(/\s+/)
      .map((term) => term.trim())
      .filter(
        (term) =>
          term.length > 2 &&
          ![
            'the',
            'and',
            'or',
            'for',
            'with',
            'using',
            'from',
            'to',
            'in',
            'on',
            'at',
            'by',
            'are',
            'is',
            'can',
            'will',
            'have',
            'has',
            'this',
            'that',
            'they',
            'them',
            'their',
            'our',
            'your',
            'all',
            'some',
            'any',
            'each',
            'every',
            'also',
            'but',
            'not',
            'only',
            'just',
            'very',
            'more',
            'most',
            'much',
            'many',
            'few',
            'less',
            'such',
            'than',
            'then',
            'now',
            'here',
            'there',
            'where',
            'when',
            'how',
            'why',
            'what',
            'who',
            'which',
          ].includes(term)
      );

    // Extract meaningful terms for weighted matching (capitalized words often indicate skills/technologies)
    const importantTerms = query
      .split(/\s+/)
      .filter(
        (term) =>
          term.length > 2 &&
          (term[0] === term[0].toUpperCase() || // Capitalized words
            term.includes('.') || // Tech terms like Node.js
            term.includes('-') || // Compound terms
            /^[A-Z]+$/.test(term)) // All caps (acronyms)
      )
      .map((term) => term.toLowerCase());

    // Extract location terms - look for city names, states, countries (usually capitalized)
    const locationTerms = query
      .split(/\s+/)
      .filter(
        (term) =>
          term.length > 3 &&
          term[0] === term[0].toUpperCase() &&
          !/^(and|or|the|with|for|from|to|in|on|at|by)$/i.test(term) &&
          !importantTerms.includes(term.toLowerCase()) // Not already in important terms
      )
      .map((term) => term.toLowerCase());

    // Extract experience requirement from query
    const experienceMatch = query.match(/\d+/);
    const requiredExperience = experienceMatch
      ? parseInt(experienceMatch[0], 10)
      : 0;

    const minScore = 0.2; // Lower threshold for embedding-based matching

    logger.info({
      message:
        'Generated embedding for candidate search with location priority',
      context: 'GcpVertexRagProvider.searchCandidates',
      embeddingLength: embedding.length,
      queryTermsCount: queryTerms.length,
      locationTermsCount: locationTerms.length,
      locationTerms: locationTerms,
      minScore,
    });

    // Calculate offset for pagination
    const offset = 0;

    // Build the WHERE clause conditionally
    const whereClause = prevSyncDateTime
      ? `AND (c.data->'metadata'->>'candidateCreatedAt')::timestamp > $9`
      : '';

    // Optimized search using pgvector with enhanced grounding information
    const results = await this.prisma.$queryRawUnsafe<SearchResult[]>(
      `
      WITH candidate_matches AS (
        SELECT
          c."candidateId" as id,
          c.data->>'content' as content,
          c.data->'metadata' as metadata,
          c.embedding,
          -- Pre-calculate semantic similarity
          1 - (c.embedding <=> $1::vector) as semantic_score,
          -- Extract and match skills dynamically based on query terms
          CASE 
            WHEN c.data->'metadata'->'skills' IS NOT NULL THEN
              (SELECT 
                jsonb_agg(DISTINCT skill ORDER BY skill) FILTER (WHERE 
                  LOWER(skill) = ANY($2::text[]) OR 
                  LOWER(skill) = ANY($3::text[]) OR
                  EXISTS (
                    SELECT 1 FROM unnest($3::text[]) AS query_term
                    WHERE skill ILIKE '%' || query_term || '%'
                  ) OR
                  EXISTS (
                    SELECT 1 FROM unnest($2::text[]) AS query_term
                    WHERE skill ILIKE '%' || query_term || '%'
                  )
                )
                FROM jsonb_array_elements_text(c.data->'metadata'->'skills') skill
              )
            ELSE NULL
          END as matched_skills,
          -- Calculate dynamic skill match score based on embedding similarity
          CASE 
            WHEN c.data->'metadata'->'skills' IS NOT NULL THEN
              GREATEST(
                -- Exact matches with important terms (highest priority)
                (SELECT COUNT(*)::float / NULLIF(jsonb_array_length(c.data->'metadata'->'skills'), 0) * 2.5
                 FROM jsonb_array_elements_text(c.data->'metadata'->'skills') skill
                 WHERE LOWER(skill) = ANY($3::text[])),
                -- Exact matches with query terms
                (SELECT COUNT(*)::float / NULLIF(jsonb_array_length(c.data->'metadata'->'skills'), 0) * 2
                 FROM jsonb_array_elements_text(c.data->'metadata'->'skills') skill
                 WHERE LOWER(skill) = ANY($2::text[])),
                -- Fuzzy matches with important terms
                (SELECT COUNT(*)::float / NULLIF(jsonb_array_length(c.data->'metadata'->'skills'), 0) * 1.5
                 FROM jsonb_array_elements_text(c.data->'metadata'->'skills') skill
                 WHERE EXISTS (
                   SELECT 1 FROM unnest($3::text[]) AS query_term
                   WHERE skill ILIKE '%' || query_term || '%'
                 )),
                -- Fuzzy matches with general query terms
                (SELECT COUNT(*)::float / NULLIF(jsonb_array_length(c.data->'metadata'->'skills'), 0)
                 FROM jsonb_array_elements_text(c.data->'metadata'->'skills') skill
                 WHERE EXISTS (
                   SELECT 1 FROM unnest($2::text[]) AS query_term
                   WHERE skill ILIKE '%' || query_term || '%'
                 ))
              )
            ELSE 0 
          END as skill_match_score,
          -- Extract and match industries with grounding
          CASE 
            WHEN c.data->'metadata'->'industries' IS NOT NULL THEN
              (SELECT 
                jsonb_agg(industry ORDER BY industry) FILTER (WHERE LOWER(industry) = ANY($2::text[]))
                FROM jsonb_array_elements_text(c.data->'metadata'->'industries') industry
              )
            ELSE NULL
          END as matched_industries,
          -- Calculate industry match score
          CASE 
            WHEN c.data->'metadata'->'industries' IS NOT NULL THEN
              (SELECT COUNT(*)::float / NULLIF(jsonb_array_length(c.data->'metadata'->'industries'), 0)
               FROM jsonb_array_elements_text(c.data->'metadata'->'industries') industry
               WHERE LOWER(industry) = ANY($2::text[]))
            ELSE 0 
          END as industry_match_score,
          -- Extract and match preferred locations with HIGH PRIORITY
          CASE 
            WHEN c.data->'metadata'->'locations' IS NOT NULL THEN
              (SELECT 
                jsonb_agg(DISTINCT location ORDER BY location) FILTER (WHERE 
                  LOWER(location) = ANY($4::text[]) OR
                  LOWER(location) = ANY($2::text[]) OR
                  EXISTS (
                    SELECT 1 FROM unnest($4::text[]) AS query_location
                    WHERE location ILIKE '%' || query_location || '%'
                  )
                )
                FROM jsonb_array_elements_text(c.data->'metadata'->'locations') location
              )
            ELSE NULL
          END as matched_locations,
          -- Calculate location match score with HIGH WEIGHT
          CASE 
            WHEN c.data->'metadata'->'locations' IS NOT NULL THEN
              GREATEST(
                -- Exact location matches (highest priority)
                (SELECT COUNT(*)::float / NULLIF(jsonb_array_length(c.data->'metadata'->'locations'), 0) * 3
                 FROM jsonb_array_elements_text(c.data->'metadata'->'locations') location
                 WHERE LOWER(location) = ANY($4::text[])),
                -- Location matches from query terms
                (SELECT COUNT(*)::float / NULLIF(jsonb_array_length(c.data->'metadata'->'locations'), 0) * 2.5
                 FROM jsonb_array_elements_text(c.data->'metadata'->'locations') location
                 WHERE LOWER(location) = ANY($2::text[])),
                -- Fuzzy location matches
                (SELECT COUNT(*)::float / NULLIF(jsonb_array_length(c.data->'metadata'->'locations'), 0) * 2
                 FROM jsonb_array_elements_text(c.data->'metadata'->'locations') location
                 WHERE EXISTS (
                   SELECT 1 FROM unnest($4::text[]) AS query_location
                   WHERE location ILIKE '%' || query_location || '%'
                 ))
              )
            ELSE 0 
          END as location_match_score,
          -- Experience matching with grounding
          COALESCE((c.data->'metadata'->>'experience')::float, 0) as candidate_experience,
          CASE 
            WHEN c.data->'metadata'->>'experience' IS NOT NULL THEN
              LEAST(
                (c.data->'metadata'->>'experience')::float / 
                NULLIF($8::float, 0), 1
              )
            ELSE 0 
          END as experience_match_score
        FROM candidate_embeddings c
        INNER JOIN candidates cd ON c."candidateId" = cd.id
        WHERE cd."jobSearchStatus" = 'OPEN_TO_OPPORTUNITIES'
          AND c.embedding IS NOT NULL
          AND c.data IS NOT NULL
          ${whereClause}
      ),
      scored_results AS (
        SELECT 
          id,
          content,
          metadata,
          semantic_score,
          skill_match_score,
          experience_match_score,
          industry_match_score,
          location_match_score,
          matched_skills,
          matched_industries,
          matched_locations,
          candidate_experience,
          -- Location-priority scoring: Location gets highest weight for local preferences
          CASE 
            WHEN location_match_score > 0 THEN
              -- Candidates with location matches get significant boost
              (semantic_score * 0.15 + skill_match_score * 0.4 + 
               location_match_score * 0.3 + experience_match_score * 0.1 + industry_match_score * 0.05)
            ELSE
              -- Standard scoring for candidates without location matches
              (semantic_score * 0.2 + skill_match_score * 0.5 + 
               experience_match_score * 0.2 + industry_match_score * 0.1)
          END as score,
          -- Store match details for later grounding generation
          jsonb_build_object(
            'matched_locations', matched_locations,
            'matched_skills', matched_skills,
            'matched_industries', matched_industries,
            'semantic_score', ROUND(semantic_score::numeric, 3),
            'experience', candidate_experience,
            'experience_match_score', experience_match_score
          ) as match_details
        FROM candidate_matches
        WHERE semantic_score >= $5 -- Pre-filter for performance
      )
      SELECT 
        id,
        content,
        metadata,
        score,
        match_details,
        semantic_score,
        skill_match_score,
        experience_match_score,
        industry_match_score,
        location_match_score
      FROM scored_results
      WHERE score >= $5
      ORDER BY score DESC, semantic_score DESC
      LIMIT $6
      OFFSET $7
    `,
      embedding,
      queryTerms,
      importantTerms,
      locationTerms,
      minScore,
      limit * 3,
      offset,
      requiredExperience,
      ...(prevSyncDateTime ? [prevSyncDateTime.toISOString()] : [])
    );

    logger.debug({
      message: 'Candidate search results',
      context: 'GcpVertexRagProvider.searchCandidates',
      resultsCount: results.length,
      limit,
      query,
      results: results.map((r: SearchResult) => ({
        id: r.id,
        score: r.score,
      })),
    });

    // Extract AI scores and filter candidates with scores >= 85
    const candidatesWithAiScores = results
      .map((result: SearchResult) => {
        const content = result.content;
        const aiScore = parseFloat(
          content.split('AI Assessment score: ')[1]?.split('\n')[0] || '0'
        );
        const aiRecommendation =
          content.split('AI Assessment recommendation: ')[1]?.split('\n')[0] ||
          '';

        // Flexible AI score filtering - prioritize skill matches
        const hasSkillMatch = result.metadata?.skill_match_score > 0.3;
        const hasHighSemanticScore = result.score > 0.6;

        // Include candidates with AI score >= 70 OR good skill/semantic matches
        if (aiScore < 70 && !hasSkillMatch && !hasHighSemanticScore) {
          return null;
        }

        return {
          id: result.id,
          score: result.score,
          aiScore: aiScore, // Store AI score for sorting
          metadata: {
            ...result.metadata,
            aiScore,
            aiRecommendation,
            semanticScore: result.semantic_score,
            skillMatchScore: result.skill_match_score,
            experienceMatchScore: result.experience_match_score,
            industryMatchScore: result.industry_match_score,
            locationMatchScore: result.location_match_score,
            matchDetails: result.match_details, // Store individual match details
          },
        };
      })
      .filter(
        (result): result is FilteredResult & { aiScore: number } =>
          result !== null
      );

    // Sort by skill match priority, then AI score
    const sortedResults = candidatesWithAiScores
      .sort((a, b) => {
        // Prioritize candidates with skill matches
        const aSkillScore = a.metadata.skillMatchScore || 0;
        const bSkillScore = b.metadata.skillMatchScore || 0;

        if (aSkillScore !== bSkillScore) {
          return bSkillScore - aSkillScore; // Higher skill score first
        }

        // Then by composite score
        const aCompositeScore = a.metadata.semanticScore || 0;
        const bCompositeScore = b.metadata.semanticScore || 0;

        if (aCompositeScore !== bCompositeScore) {
          return bCompositeScore - aCompositeScore;
        }

        // Finally by AI score
        return b.aiScore - a.aiScore;
      })
      .slice(0, limit);

    logger.debug({
      message: 'Filtered and sorted candidates by skill match priority',
      context: 'GcpVertexRagProvider.searchCandidates',
      candidatesCount: sortedResults.length,
      aiScoreThreshold: 70,
      queryTermsCount: queryTerms.length,
      importantTermsCount: importantTerms.length,
      topCandidateSkillScores: sortedResults.slice(0, 3).map((r) => ({
        id: r.id,
        skillScore: r.metadata.skillMatchScore,
        aiScore: r.aiScore,
      })),
    });

    // Generate single grounding information for all candidates
    const generateOverallGroundingInfo = () => {
      const hasLocationMatches = sortedResults.some(
        (r) => r.metadata.locationMatchScore > 0
      );
      const hasSkillMatches = sortedResults.some(
        (r) => r.metadata.skillMatchScore > 0
      );
      const hasIndustryMatches = sortedResults.some(
        (r) => r.metadata.industryMatchScore > 0
      );
      const hasExperienceMatches = sortedResults.some(
        (r) => r.metadata.experienceMatchScore > 0
      );

      // Extract all unique matched skills across candidates
      const allMatchedSkills = new Set<string>();
      const allMatchedLocations = new Set<string>();
      const allMatchedIndustries = new Set<string>();

      sortedResults.forEach((result) => {
        if (result.metadata.matchDetails) {
          const details = result.metadata.matchDetails;
          if (details.matched_skills) {
            details.matched_skills.forEach((skill: string) =>
              allMatchedSkills.add(skill)
            );
          }
          if (details.matched_locations) {
            details.matched_locations.forEach((location: string) =>
              allMatchedLocations.add(location)
            );
          }
          if (details.matched_industries) {
            details.matched_industries.forEach((industry: string) =>
              allMatchedIndustries.add(industry)
            );
          }
        }
      });

      const groundingParts = [];

      groundingParts.push(
        `AI matched ${sortedResults.length} candidates based on semantic similarity and skill relevance.`
      );

      if (hasLocationMatches && allMatchedLocations.size > 0) {
        groundingParts.push(
          `Location preferences: ${Array.from(allMatchedLocations).slice(0, 5).join(', ')}${allMatchedLocations.size > 5 ? ` and ${allMatchedLocations.size - 5} more` : ''}`
        );
      }

      if (hasSkillMatches && allMatchedSkills.size > 0) {
        groundingParts.push(
          `Key skills matched: ${Array.from(allMatchedSkills).slice(0, 8).join(', ')}${allMatchedSkills.size > 8 ? ` and ${allMatchedSkills.size - 8} more` : ''}`
        );
      }

      if (hasIndustryMatches && allMatchedIndustries.size > 0) {
        groundingParts.push(
          `Industries: ${Array.from(allMatchedIndustries).slice(0, 3).join(', ')}${allMatchedIndustries.size > 3 ? ` and ${allMatchedIndustries.size - 3} more` : ''}`
        );
      }

      if (hasExperienceMatches) {
        const avgExperience =
          sortedResults
            .filter((r) => r.metadata.experienceMatchScore > 0)
            .reduce(
              (sum, r) => sum + (r.metadata.matchDetails?.experience || 0),
              0
            ) /
          sortedResults.filter((r) => r.metadata.experienceMatchScore > 0)
            .length;

        if (avgExperience > 0) {
          groundingParts.push(
            `Average experience: ${Math.round(avgExperience)} years`
          );
        }
      }

      // Add search strategy explanation
      const searchStrategy = [];
      if (locationTerms.length > 0) {
        searchStrategy.push('location-prioritized matching');
      }
      if (importantTerms.length > 0) {
        searchStrategy.push('skill-focused search');
      }
      if (queryTerms.length > 5) {
        searchStrategy.push('comprehensive semantic analysis');
      }

      if (searchStrategy.length > 0) {
        groundingParts.push(`Search strategy: ${searchStrategy.join(', ')}`);
      }

      return groundingParts.join('; ');
    };

    const overallGroundingInfo = generateOverallGroundingInfo();

    logger.info({
      message:
        'Generated overall and individual grounding information for candidate search',
      context: 'GcpVertexRagProvider.searchCandidates',
      overallGroundingInfo,
      candidatesReturned: sortedResults.length,
    });

    // Format the final results with AI-generated individual grounding info
    logger.info({
      message: 'Generating AI-powered grounding info for candidates',
      context: 'GcpVertexJobRecommendationProvider.searchRecommendedCandidates',
      candidateCount: sortedResults.length,
    });

    const searchResults = await Promise.all(
      sortedResults.map(async (result) => ({
        id: result.id,
        score: result.aiScore, // Use AI score as the main score
        metadata: {
          ...result.metadata,
          overallGroundingInfo:
            await this.generateIndividualGroundingInfo(result), // Generate AI-powered individual grounding info
        },
        groundingInfo: overallGroundingInfo ?? 'Not found', // Add overall grounding info for each candidate
      }))
    );

    logger.info({
      message: 'Successfully generated AI grounding info for all candidates',
      context: 'GcpVertexJobRecommendationProvider.searchRecommendedCandidates',
      candidateCount: searchResults.length,
    });

    return searchResults;
  }

  async findInitialRecommendations(
    jobPostingId: string,
    limit: number = 50,
    prevSyncDateTime?: Date
  ): Promise<IJobRecommendationTask> {
    const taskId = `job-rec-initial-${jobPostingId}-${Date.now()}`;

    const task: IJobRecommendationTask = {
      taskId,
      status: JobRecommendationStatus.STARTED,
      jobPostingId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      logger.info('Finding initial recommendations for job posting', {
        context:
          'GcpVertexJobRecommendationProvider.findInitialRecommendations',
        jobPostingId,
        limit,
        taskId,
      });

      const jobPosting = await this.prisma.job_posting.findUnique({
        where: { id: jobPostingId },
        select: {
          clientId: true,
        },
      });

      if (!jobPosting) {
        logger.error('Job posting not found', {
          context:
            'GcpVertexJobRecommendationProvider.findInitialRecommendations',
          jobPostingId,
          taskId,
        });

        task.status = JobRecommendationStatus.FAILED;
        task.error = 'Job posting not found';
        task.updatedAt = new Date();

        return task;
      }

      const { jobSearchTerms } =
        await this.getJobPostingSearchTerms(jobPostingId);

      const feedback =
        await this.jobRecommendationPromptGenerator.getCandidateRecommendationFeedback(
          jobPosting?.clientId || '',
          5,
          10
        );

      const feedbackAnalysis =
        this.jobRecommendationPromptGenerator.analyzeFeedbackPatterns(feedback);

      // Create search prompt with feedback (now async)
      const searchPrompt =
        await JobRecommendationPromptGenerator.generateJobRecommendationPromptWithFeedback(
          jobSearchTerms,
          feedbackAnalysis,
          prevSyncDateTime
        );

      // Get recommended candidates using RAG
      const recommendedCandidates = await this.searchRecommendedCandidates(
        searchPrompt,
        limit,
        prevSyncDateTime
      );

      logger.info('Found recommended candidates via RAG', {
        context:
          'GcpVertexJobRecommendationProvider.findInitialRecommendations',
        jobPostingId,
        candidateCount: recommendedCandidates.length,
        taskId,
      });

      // Store recommendations in database
      await this.storeRecommendations(jobPostingId, recommendedCandidates);

      // Update job posting's recommendationsSync timestamp
      await this.prisma.job_posting.update({
        where: { id: jobPostingId },
        data: { recommendationsSync: new Date() },
      });

      task.status = JobRecommendationStatus.COMPLETED;
      task.updatedAt = new Date();

      logger.info('Initial recommendations completed successfully', {
        context:
          'GcpVertexJobRecommendationProvider.findInitialRecommendations',
        jobPostingId,
        recommendationsCreated: recommendedCandidates.length,
        taskId,
      });
    } catch (error) {
      task.status = JobRecommendationStatus.FAILED;
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.updatedAt = new Date();

      logger.error('Failed to find initial recommendations', {
        context:
          'GcpVertexJobRecommendationProvider.findInitialRecommendations',
        jobPostingId,
        taskId,
        error: task.error,
      });
    }

    return task;
  }

  async findRecommendations(
    jobPostingId: string,
    lastSyncTimestamp?: Date,
    limit: number = 25
  ): Promise<IJobRecommendationTask> {
    const taskId = `job-rec-update-${jobPostingId}-${Date.now()}`;

    const task: IJobRecommendationTask = {
      taskId,
      status: JobRecommendationStatus.STARTED,
      jobPostingId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      logger.info('Finding new recommendations for job posting', {
        context: 'GcpVertexJobRecommendationProvider.findRecommendations',
        jobPostingId,
        lastSyncTimestamp,
        limit,
        taskId,
      });

      const jobPosting = await this.prisma.job_posting.findUnique({
        where: { id: jobPostingId },
        select: {
          clientId: true,
        },
      });

      if (!jobPosting) {
        logger.error('Job posting not found', {
          context: 'GcpVertexJobRecommendationProvider.findRecommendations',
          jobPostingId,
          taskId,
        });

        task.status = JobRecommendationStatus.FAILED;
        task.error = 'Job posting not found';
        task.updatedAt = new Date();

        return task;
      }

      // Get new candidates that were updated after the last sync
      const newCandidatesFilter = lastSyncTimestamp
        ? {
            updatedAt: {
              gte: lastSyncTimestamp,
            },
            jobSearchStatus: 'OPEN_TO_OPPORTUNITIES' as any,
            isPublished: true,
          }
        : {
            jobSearchStatus: 'OPEN_TO_OPPORTUNITIES' as any,
            isPublished: true,
          };

      const newCandidates = await this.prisma.candidate.findMany({
        where: newCandidatesFilter,
        select: { id: true },
        take: limit * 2, // Get more candidates to have options after filtering
      });

      logger.info('Found new candidates to process', {
        context: 'GcpVertexJobRecommendationProvider.findRecommendations',
        jobPostingId,
        newCandidatesCount: newCandidates.length,
        taskId,
      });

      if (newCandidates.length === 0) {
        task.status = JobRecommendationStatus.COMPLETED;
        task.updatedAt = new Date();

        logger.info('No new candidates found for recommendations', {
          context: 'GcpVertexJobRecommendationProvider.findRecommendations',
          jobPostingId,
          taskId,
        });

        return task;
      }

      const { jobSearchTerms } =
        await this.getJobPostingSearchTerms(jobPostingId);

      const feedback =
        await this.jobRecommendationPromptGenerator.getCandidateRecommendationFeedback(
          jobPosting?.clientId || '',
          5,
          10
        );

      const feedbackAnalysis =
        this.jobRecommendationPromptGenerator.analyzeFeedbackPatterns(feedback);

      const searchPrompt =
        await JobRecommendationPromptGenerator.generateJobRecommendationPromptWithFeedback(
          jobSearchTerms,
          feedbackAnalysis,
          lastSyncTimestamp
        );

      logger.debug({
        message: 'Generated search prompt',
        context: 'SearchService.getJobRecommendation',
        searchPrompt,
      });

      // Use RAG to find the best matches among new candidates
      const recommendedCandidates = await this.searchRecommendedCandidates(
        searchPrompt,
        limit
      );

      // Filter to only include new candidates
      const newCandidateIds = new Set(newCandidates.map((c) => c.id));
      const filteredRecommendations = recommendedCandidates.filter((rec) =>
        newCandidateIds.has(rec.id)
      );

      logger.info('Filtered recommendations to new candidates only', {
        context: 'GcpVertexJobRecommendationProvider.findRecommendations',
        jobPostingId,
        originalCount: recommendedCandidates.length,
        filteredCount: filteredRecommendations.length,
        taskId,
      });

      // Store new recommendations
      if (filteredRecommendations.length > 0) {
        await this.storeRecommendations(jobPostingId, filteredRecommendations);
      }

      // Update job posting's recommendationsSync timestamp
      await this.prisma.job_posting.update({
        where: { id: jobPostingId },
        data: { recommendationsSync: new Date() },
      });

      task.status = JobRecommendationStatus.COMPLETED;
      task.updatedAt = new Date();

      logger.info('New recommendations completed successfully', {
        context: 'GcpVertexJobRecommendationProvider.findRecommendations',
        jobPostingId,
        recommendationsCreated: filteredRecommendations.length,
        taskId,
      });
    } catch (error) {
      task.status = JobRecommendationStatus.FAILED;
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.updatedAt = new Date();

      logger.error('Failed to find new recommendations', {
        context: 'GcpVertexJobRecommendationProvider.findRecommendations',
        jobPostingId,
        taskId,
        error: task.error,
      });
    }

    return task;
  }

  async getRecommendedCandidates(
    jobPostingId: string,
    limit: number = 10
  ): Promise<ISearchResult[]> {
    try {
      logger.info('Getting recommended candidates for job posting', {
        context: 'GcpVertexJobRecommendationProvider.getRecommendedCandidates',
        jobPostingId,
        limit,
      });

      return await this.ragProvider.searchCandidatesForJob(jobPostingId, limit);
    } catch (error) {
      logger.error('Failed to get recommended candidates', {
        context: 'GcpVertexJobRecommendationProvider.getRecommendedCandidates',
        jobPostingId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Store recommendations in the database
   */
  private async storeRecommendations(
    jobPostingId: string,
    candidates: ISearchResult[]
  ): Promise<void> {
    try {
      // Verify job posting exists before storing recommendations
      const jobPosting = await this.prisma.job_posting.findUnique({
        where: { id: jobPostingId },
        select: { id: true },
      });

      if (!jobPosting) {
        logger.error('Job posting not found when storing recommendations', {
          context: 'GcpVertexJobRecommendationProvider.storeRecommendations',
          jobPostingId,
        });
        throw new Error('Job posting not found');
      }

      logger.info('Storing recommendations in database', {
        context: 'GcpVertexJobRecommendationProvider.storeRecommendations',
        jobPostingId,
        candidatesCount: candidates.length,
      });

      // Prepare recommendations data
      const recommendations = candidates.map((candidate) => ({
        id: uuidv4(),
        jobPostingId,
        candidateId: candidate.id,
        score: candidate.metadata.semanticScore,
        matchReason: [candidate.metadata.overallGroundingInfo],
        status: 'ACTIVE' as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      // Use upsert to avoid duplicate recommendations
      for (const rec of recommendations) {
        await this.prisma.job_posting_recommendation.upsert({
          where: {
            jobPostingId_candidateId: {
              jobPostingId: rec.jobPostingId,
              candidateId: rec.candidateId,
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
        context: 'GcpVertexJobRecommendationProvider.storeRecommendations',
        jobPostingId,
        recommendationsStored: recommendations.length,
      });
    } catch (error) {
      logger.error('Failed to store recommendations', {
        context: 'GcpVertexJobRecommendationProvider.storeRecommendations',
        jobPostingId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
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

  /**
   * Extract match reasons from candidate metadata
   */
  private extractMatchReasons(candidate: ISearchResult): string[] {
    const reasons: string[] = [];

    if (candidate.metadata) {
      if (candidate.metadata.skillMatchScore > 0) {
        reasons.push('Skills match');
      }
      if (candidate.metadata.experienceMatchScore > 0) {
        reasons.push('Experience match');
      }
      if (candidate.metadata.locationMatchScore > 0) {
        reasons.push('Location match');
      }
      if (candidate.metadata.industryMatchScore > 0) {
        reasons.push('Industry match');
      }
      if (candidate.metadata.semanticScore > 0.8) {
        reasons.push('High semantic similarity');
      }
    }

    return reasons.length > 0 ? reasons : ['AI recommended'];
  }
}
