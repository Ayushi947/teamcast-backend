import { ISearchFilters } from '../search/search.provider';
import { logger } from '@/shared/utils/logger';
import { ENV } from '@/config/env';
import { gcpConfig } from '@/config/gcp';

export interface IJobSearchRequest {
  query?: string;
  preferences?: IJobSearchPreferences;
  feedbackAnalysis?: IJobFeedbackPatterns;
  prevDateTime?: Date;
  additionalContext?: {
    searchType?: 'job_search' | 'candidate_recommendation_for_jobs';
  };
}

export interface IJobSearchPreferences {
  skills?: string[];
  locations?: string[];
  industries?: string[];
  workTypes?: string[];
  salaryRange?: {
    min?: number;
    max?: number;
  };
  experienceLevel?: string;
  jobTitles?: string[];
  companyTypes?: string[];
  benefits?: string[];
}

export interface IJobFeedbackPatterns {
  interestedPatterns?: {
    skills?: string[];
    industries?: string[];
    locations?: string[];
    workTypes?: string[];
    jobTitles?: string[];
    companyTypes?: string[];
    salaryRanges?: string[];
  };
  notInterestedPatterns?: {
    skills?: string[];
    industries?: string[];
    locations?: string[];
    workTypes?: string[];
    jobTitles?: string[];
    companyTypes?: string[];
    salaryRanges?: string[];
  };
}

export class JobPromptGenerator {
  private readonly projectId = ENV.GOOGLE_CLOUD_PROJECT_ID;
  private readonly location = ENV.GOOGLE_CLOUD_VERTEX_AI_LOCATION;
  private readonly modelId = ENV.GOOGLE_CLOUD_VERTEX_AI_MODEL;
  private readonly apiEndpoint = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${this.modelId}:generateContent`;
  private readonly auth = gcpConfig.getAuth();

  constructor() {
    logger.info('JobPromptGenerator initialized', {
      context: 'JobPromptGenerator.constructor',
      project: ENV.GOOGLE_CLOUD_PROJECT_ID,
      location: ENV.GOOGLE_CLOUD_VERTEX_AI_LOCATION,
      model: this.modelId,
    });
  }

  /**
   * Generate job search prompt based on request (supports both search and recommendations)
   */
  async generateJobSearchPrompt(request: IJobSearchRequest): Promise<string> {
    const isRecommendation =
      request.additionalContext?.searchType ===
      'candidate_recommendation_for_jobs';

    if (isRecommendation) {
      return await this.generateCandidateJobRecommendationPrompt(request);
    } else {
      return await this.generateJobSearchPromptInternal(request);
    }
  }

  /**
   * Generate job search prompt based on query, mode, and filters
   * @param query The search query
   * @param mode Search mode
   * @param filters Optional filters for advanced search
   * @returns Generated search prompt
   */
  static async generateJobSearchPrompt(
    query: string,
    filters?: ISearchFilters
  ): Promise<string> {
    const instance = new JobPromptGenerator();

    // If filters are provided, use advanced search with filters
    if (filters && Object.keys(filters).length > 0) {
      return instance.generateAdvancedSearchPrompt(query, filters);
    }

    // Use intelligent AI-powered prompt generation for better matching
    return await instance.generateIntelligentJobSearchPrompt(query);
  }

  /**
   * Generate simple job search prompt for basic queries
   */
  static async generateSimpleJobSearchPrompt(query: string): Promise<string> {
    const instance = new JobPromptGenerator();
    return await instance.generateIntelligentJobSearchPrompt(query);
  }

  /**
   * Generate an intelligent, exact-matching job search prompt using Vertex AI
   * This method creates prompts that ensure precise matching of user criteria for jobs
   */
  private async generateIntelligentJobSearchPrompt(
    query: string,
    prevDateTime?: Date
  ): Promise<string> {
    let jobSpecificPrompt = `
You are an expert job search prompt generator for RAG (Retrieval-Augmented Generation) systems.
Your task is to analyze job search queries and generate precise, semantic search prompts that will help find the most relevant job postings.

JOB-SPECIFIC TASK: Analyze the user query and extract EXACT requirements for job posting matching.

JOB-SPECIFIC RULES:
1. If user mentions specific skills → ONLY return jobs requiring those exact skills
2. If user mentions location → ONLY return jobs from that exact location  
3. If user mentions role/title → ONLY return jobs with that exact role/title
4. If user mentions experience → ONLY return jobs with that experience requirement
5. If user mentions industry → ONLY return jobs from that exact industry
6. If user mentions work type → ONLY return jobs with that work arrangement
7. If user mentions salary → ONLY return jobs within that salary range
"""STRICT RULE: If a previous date/time is provided, ONLY match candidates whose candidateCreatedAt (from embedding metadata) is strictly greater than the provided prevDateTime. Do NOT include any candidates created before or at this date/time. The prevDateTime is: ${prevDateTime ? prevDateTime.toISOString() : '[not provided]'}"""

NATURAL LANGUAGE REFINEMENT RULE:
If the search query contains misspellings or natural language variations (e.g., 'javd' instead of 'java'), intelligently correct and expand the query to include the correct term and common variations. Always match the intended skill, technology, or job title, even if the user input is misspelled or phrased differently.

SPELLING CORRECTION & NORMALIZATION RULE:
- Before generating required criteria, analyze the query for misspelled or variant terms (e.g., 'javf' or 'javd' instead of 'java').
- Correct all misspelled skills, job titles, and technologies to their most likely intended standard form.
- Use the corrected terms in REQUIRED_CRITERIA and all matching logic.
- Example: If the query is "want job with javf", treat 'javf' as 'java' and use 'java' in the criteria.

OUTPUT FORMAT:

EXACT_MATCH_JOB_SEARCH:

REQUIRED_CRITERIA:
- JOB_TITLE: [exact job title mentioned] OR "none specified"
- SKILLS: [exact skills mentioned] OR "none specified"
- LOCATION: [exact location mentioned] OR "none specified" 
- EXPERIENCE: [exact experience mentioned] OR "none specified"
- INDUSTRY: [exact industry mentioned] OR "none specified"
- WORK_TYPE: [exact work type mentioned] OR "none specified"
- SALARY_RANGE: [exact salary range mentioned] OR "none specified"

MATCHING_LOGIC:
[Write specific instructions for exact matching based on what user specified]

JOB-SPECIFIC EXAMPLES:

Query: "react developer jobs"
REQUIRED_CRITERIA:
- JOB_TITLE: [Developer]
- SKILLS: [React]
- All others: "none specified"
LOGIC: Return only jobs with React in requirements AND developer role

Query: "remote python jobs in fintech"
REQUIRED_CRITERIA:
- SKILLS: [Python]
- WORK_TYPE: [Remote]
- INDUSTRY: [Fintech]
- All others: "none specified"
LOGIC: Return only jobs with Python requirements AND remote work AND fintech industry

Query: "want job with javf"
REQUIRED_CRITERIA:
- SKILLS: [java]
- All others: "none specified"
LOGIC: Return only jobs with Java in requirements. Do not return jobs without Java as a required skill.

NOW ANALYZE THIS QUERY FOR EXACT JOB MATCHING: "${query}"

GROUNDING INFORMATION GENERATION:
Generate a comprehensive grounding information summary that explains:
1. MATCHING STRATEGY: Describe how jobs were matched to the search criteria
2. SKILL ALIGNMENT: Summarize the key skills found across matched jobs
3. EXPERIENCE DISTRIBUTION: Explain the experience requirements found
4. LOCATION COVERAGE: List the geographic areas or remote work options matched
5. INDUSTRY RELEVANCE: Highlight relevant industry backgrounds
6. SEARCH METHODOLOGY: Explain the semantic analysis and ranking approach used
7. QUALITY METRICS: Provide statistics on match quality and relevance scores

GROUNDING FORMAT REQUIREMENTS:
- Use ONLY plain text, NO emojis or special characters
- Write in clear, professional language
- Start with "AI matched X jobs based on..."
- Include specific numbers and statistics where available
- Explain the matching logic and criteria used
- Keep it informative but concise (3-5 sentences)
- Focus on factual information about the search and results

INDIVIDUAL JOB GROUNDING INFORMATION:
Generate individual grounding information for each job that explains:
1. SKILL MATCH: Specific skills that align with search criteria
2. LOCATION MATCH: Geographic alignment with search location preferences  
3. EXPERIENCE MATCH: Experience requirement alignment
4. INDUSTRY MATCH: Industry background relevance
5. SALARY RANGE: Compensation alignment with search criteria
6. MATCH SCORES: Breakdown of semantic, skills, and location match percentages

INDIVIDUAL GROUNDING FORMAT REQUIREMENTS:
- Use ONLY plain text, NO emojis or special characters
- Write in clear, professional language
- Include specific data points and percentages
- Keep it concise but informative
- Focus on factual matching information

EXAMPLE GROUNDING FORMAT:
"AI matched 18 jobs based on semantic similarity and skill relevance to the React Developer search. Key skills matched include React, JavaScript, and Node.js across roles requiring 2-6 years of experience. Location coverage includes remote work and major cities including San Francisco and New York. The search strategy utilized exact skill matching with comprehensive semantic analysis, resulting in an average match score of 85% across all results."

EXAMPLE INDIVIDUAL GROUNDING FORMAT:
"Skill Match: React, JavaScript, TypeScript; Location Match: Remote, San Francisco; Experience Match: 3-5 years; Industry Match: Technology; Salary Range: $80k-$120k; Match Scores - Semantic: 82%, Skills: 95%, Location: 88%"
`;
    // Only include the strict rule if prevDateTime is provided
    if (prevDateTime) {
      jobSpecificPrompt += `\nSTRICT MATCH RULE: Only include candidates whose candidateCreatedAt (from embedding metadata) is strictly greater than ${prevDateTime.toISOString()}. Do NOT include any candidates created before or at this date/time.`;
    }

    try {
      const result = await this.callVertexAI(jobSpecificPrompt, { query });

      if (result) {
        return result;
      } else {
        logger.warn({
          message: 'Vertex AI call failed, falling back to basic prompt',
          context: 'JobPromptGenerator.generateIntelligentJobSearchPrompt',
          query,
        });
        return this.generateExactMatchFallbackPrompt(query);
      }
    } catch (error) {
      logger.error({
        message:
          'Failed to generate exact matching job search prompt, falling back to basic prompt',
        context: 'JobPromptGenerator.generateIntelligentJobSearchPrompt',
        error: error instanceof Error ? error.message : 'Unknown error',
        query,
      });

      // Fallback to exact matching basic prompt if Vertex AI fails
      return this.generateExactMatchFallbackPrompt(query);
    }
  }

  /**
   * Generate candidate job recommendation prompt
   */
  private async generateCandidateJobRecommendationPrompt(
    request: IJobSearchRequest
  ): Promise<string> {
    const query =
      request.query ||
      this.buildQueryFromPreferences(request.preferences || {});

    let candidateJobRecommendationPrompt = `
You are an expert job recommendation system for finding jobs that match candidates.
Your task is to find the best job opportunities based on candidate search criteria and preferences.

CANDIDATE JOB RECOMMENDATION TASK: Find jobs that match the candidate's search requirements.

CANDIDATE SEARCH CRITERIA:
- QUERY: ${query}
- PREFERENCES: ${request.preferences ? JSON.stringify(request.preferences, null, 2) : 'None specified'}

MATCHING LOGIC:
Return job postings that align with the candidate's search query and preferences.
Focus on jobs that match the candidate's skills, experience level, and location preferences.
Prioritize opportunities that offer career growth and skill development.

NOW FIND JOBS FOR THIS CANDIDATE SEARCH: "${query}"
`;
    // Only include the strict rule if prevDateTime is provided
    if (request.prevDateTime) {
      candidateJobRecommendationPrompt += `\nSTRICT MATCH RULE: Only include jobs whose jobCreatedAt (from embedding metadata) is strictly greater than ${request.prevDateTime.toISOString()}. Do NOT include any jobs created before or at this date/time.`;
    }

    try {
      const result = await this.callVertexAI(
        candidateJobRecommendationPrompt,
        request
      );
      return result || this.generateCandidateJobRecommendationFallback(request);
    } catch (_error) {
      return this.generateCandidateJobRecommendationFallback(request);
    }
  }

  /**
   * Generate job search prompt internally
   */
  private async generateJobSearchPromptInternal(
    request: IJobSearchRequest
  ): Promise<string> {
    const query =
      request.query ||
      this.buildQueryFromPreferences(request.preferences || {});
    // If prevDateTime is present, pass it to the prompt generator
    return await this.generateIntelligentJobSearchPrompt(
      query,
      request.prevDateTime
    );
  }

  /**
   * Generate advanced search prompt with filters
   * @param query The search query
   * @param filters Search filters
   * @returns Generated advanced search prompt
   */
  private generateAdvancedSearchPrompt(
    query: string,
    filters: ISearchFilters
  ): string {
    const filterParts: string[] = [];

    if (filters?.skills?.length) {
      filterParts.push(
        `SKILLS: [${filters.skills.join(', ')}] - Match ANY skill (OR logic)`
      );
    }
    if (filters?.experience) {
      filterParts.push(
        `EXPERIENCE: ${filters.experience} years (±2 years flexibility)`
      );
    }
    if (filters?.location?.length) {
      filterParts.push(
        `LOCATIONS: [${filters.location.join(', ')}] - Include nearby areas`
      );
    }
    if (filters?.industry?.length) {
      filterParts.push(
        `INDUSTRIES: [${filters.industry.join(', ')}] - Related sectors OK`
      );
    }

    const filtersText =
      filterParts.length > 0 ? filterParts.join('\n') : 'No specific filters';

    return `ADVANCED JOB SEARCH: "${query}"

APPLIED FILTERS:
${filtersText}

EFFICIENT PROCESSING:
1. QUERY PARSING:
   - Extract skills, roles, industries, locations from query
   - Apply fuzzy matching for all extracted terms
   - Handle natural language variations

2. FILTER APPLICATION:
   - Hard constraints: Must-have requirements
   - Soft constraints: Preferred criteria with flexibility
   - Combinatorial logic: (Skill1 OR Skill2) AND (Location1 OR Location2)

3. SCORING ALGORITHM:
   - Base score: Query relevance (0-100)
   - Filter bonus: +10 points per matching filter
   - Experience bonus: +5 points for experience match
   - Location bonus: +3 points for location match

4. RESULT OPTIMIZATION:
   - Minimum score threshold: 40
   - Maximum results: Top 50 jobs
   - Diversity factor: Include varied opportunities
   - Recency bonus: +2 points for recently posted jobs

QUERY: ${query}`;
  }

  /**
   * Build query from preferences
   */
  private buildQueryFromPreferences(
    preferences: IJobSearchPreferences
  ): string {
    const parts: string[] = [];

    if (preferences.skills?.length) {
      parts.push(`Skills: ${preferences.skills.join(', ')}`);
    }
    if (preferences.jobTitles?.length) {
      parts.push(`Roles: ${preferences.jobTitles.join(', ')}`);
    }
    if (preferences.industries?.length) {
      parts.push(`Industries: ${preferences.industries.join(', ')}`);
    }
    if (preferences.locations?.length) {
      parts.push(`Locations: ${preferences.locations.join(', ')}`);
    }
    if (preferences.workTypes?.length) {
      parts.push(`Work Types: ${preferences.workTypes.join(', ')}`);
    }
    if (preferences.experienceLevel) {
      parts.push(`Experience: ${preferences.experienceLevel}`);
    }

    return parts.length > 0 ? parts.join(' | ') : 'Job opportunities';
  }

  /**
   * Generate candidate job recommendation fallback
   */
  private generateCandidateJobRecommendationFallback(
    request: IJobSearchRequest
  ): string {
    const query =
      request.query ||
      this.buildQueryFromPreferences(request.preferences || {});
    return `JOB RECOMMENDATIONS FOR CANDIDATE
TARGET SEARCH: "${query}"

Find job postings that match the candidate's search criteria and preferences.
Focus on opportunities that align with their skills and career goals.`;
  }

  /**
   * Generate fallback prompt when Vertex AI is unavailable
   */
  private generateExactMatchFallbackPrompt(query: string): string {
    return `EXACT_MATCH_JOB_SEARCH: "${query}"

REQUIRED_CRITERIA:
- Extract specific skills, job titles, locations, experience levels from query
- Match job postings that contain these exact requirements
- Use semantic similarity for precise matching

MATCHING_LOGIC:
Return only job postings that match the specified criteria exactly.
Focus on precision over recall for better quality results.

GROUNDING INFORMATION GENERATION:
Generate a comprehensive grounding information summary that explains:
1. MATCHING STRATEGY: Describe how jobs were matched to the search criteria
2. SKILL ALIGNMENT: Summarize the key skills found across matched jobs
3. EXPERIENCE DISTRIBUTION: Explain the experience requirements found
4. LOCATION COVERAGE: List the geographic areas or remote work options matched
5. INDUSTRY RELEVANCE: Highlight relevant industry backgrounds
6. SEARCH METHODOLOGY: Explain the semantic analysis and ranking approach used
7. QUALITY METRICS: Provide statistics on match quality and relevance scores

GROUNDING FORMAT REQUIREMENTS:
- Use ONLY plain text, NO emojis or special characters
- Write in clear, professional language
- Start with "AI matched X jobs based on..."
- Include specific numbers and statistics where available
- Explain the matching logic and criteria used
- Keep it informative but concise (3-5 sentences)
- Focus on factual information about the search and results

INDIVIDUAL JOB GROUNDING INFORMATION:
Generate individual grounding information for each job that explains:
1. SKILL MATCH: Specific skills that align with search criteria
2. LOCATION MATCH: Geographic alignment with search location preferences  
3. EXPERIENCE MATCH: Experience requirement alignment
4. INDUSTRY MATCH: Industry background relevance
5. SALARY RANGE: Compensation alignment with search criteria
6. MATCH SCORES: Breakdown of semantic, skills, and location match percentages

INDIVIDUAL GROUNDING FORMAT REQUIREMENTS:
- Use ONLY plain text, NO emojis or special characters
- Write in clear, professional language
- Include specific data points and percentages
- Keep it concise but informative
- Focus on factual matching information`;
  }

  /**
   * Call Vertex AI to generate job search prompts
   */
  private async callVertexAI(
    prompt: string,
    _request: IJobSearchRequest
  ): Promise<string | null> {
    try {
      const accessToken = await this.auth.getAccessToken();

      const requestBody = {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.3,
          topP: 0.8,
        },
      };

      const response = await fetch(this.apiEndpoint, {
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
        logger.debug('Vertex AI generated job prompt successfully', {
          context: 'JobPromptGenerator.callVertexAI',
          responseLength: generatedText.length,
        });
        return generatedText;
      }

      logger.warn('No valid response from Vertex AI', {
        context: 'JobPromptGenerator.callVertexAI',
      });
      return null;
    } catch (error) {
      logger.error('Vertex AI call failed', {
        context: 'JobPromptGenerator.callVertexAI',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }
}
