import { logger } from '@/shared/utils/logger';
import { ENV } from '@/config/env';
import { gcpConfig } from '@/config/gcp';

export interface ICandidateSearchRequest {
  query?: string;
  preferences?: {
    preferredJobTitles?: string[];
    skills?: string[];
    preferredLocations?: string[];
  };
  feedbackAnalysis?: any;
  prevDateTime?: Date;
  additionalContext?: {
    searchType?: 'candidate_search' | 'job_recommendation_for_candidate';
  };
}

export class CandidatePromptGenerator {
  private readonly projectId = ENV.GOOGLE_CLOUD_PROJECT_ID;
  private readonly location = ENV.GOOGLE_CLOUD_VERTEX_AI_LOCATION;
  private readonly modelId = ENV.GOOGLE_CLOUD_VERTEX_AI_MODEL;
  private readonly apiEndpoint = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${this.modelId}:generateContent`;
  private readonly auth = gcpConfig.getAuth();

  /**
   * Generate candidate search prompt based on request (supports both search and recommendations)
   */
  async generateCandidateSearchPrompt(
    request: ICandidateSearchRequest
  ): Promise<string> {
    const isRecommendation =
      request.additionalContext?.searchType ===
      'job_recommendation_for_candidate';

    if (isRecommendation) {
      return await this.generateJobRecommendationPrompt(request);
    } else {
      return await this.generateCandidateSearchPromptInternal(request);
    }
  }

  /**
   * Generate simple candidate search prompt for basic queries
   */
  static async generateSimpleCandidateSearchPrompt(
    query: string
  ): Promise<string> {
    const instance = new CandidatePromptGenerator();
    return await instance.generateCandidateSearchPromptInternal({ query });
  }

  /**
   * Generate job recommendation prompt for candidates
   */
  private async generateJobRecommendationPrompt(
    request: ICandidateSearchRequest
  ): Promise<string> {
    const query = this.buildQueryFromPreferences(request.preferences || {});

    let jobRecommendationPrompt = `
You are an expert job recommendation system for candidates.
Your task is to find the best job opportunities that match a candidate's preferences and experience.

JOB RECOMMENDATION TASK: Find jobs that match the candidate's career goals and skills.

CANDIDATE PREFERENCES:
- JOB TITLES: ${request.preferences?.preferredJobTitles?.join(', ') || 'Any'}
- SKILLS: ${request.preferences?.skills?.join(', ') || 'Any'}
- LOCATIONS: ${request.preferences?.preferredLocations?.join(', ') || 'Any'}

MATCHING LOGIC:
Return job postings that align with the candidate's preferred job titles, required skills, and location preferences.
Focus on career growth opportunities and skill development.

NATURAL LANGUAGE REFINEMENT RULE:
If the search query contains misspellings or natural language variations (e.g., 'javd' instead of 'java'), intelligently correct and expand the query to include the correct term and common variations. Always match the intended skill, technology, or job title, even if the user input is misspelled or phrased differently.

SPELLING CORRECTION & NORMALIZATION RULE:
- Before generating required criteria, analyze the query for misspelled or variant terms (e.g., 'javf' or 'javd' instead of 'java').
- Correct all misspelled skills, job titles, and technologies to their most likely intended standard form.
- Use the corrected terms in REQUIRED_CRITERIA and all matching logic.
- Example: If the query is "want candidate with javf", treat 'javf' as 'java' and use 'java' in the criteria.

NOW FIND JOBS FOR THIS CANDIDATE: "${query}"
`;
    // Only include the strict rule if prevDateTime is provided
    if (request.prevDateTime) {
      jobRecommendationPrompt += `\nSTRICT MATCH RULE: Only include jobs whose jobCreatedAt (from embedding metadata) is strictly greater than ${request.prevDateTime.toISOString()}. Do NOT include any jobs created before or at this date/time.`;
    }

    try {
      const result = await this.callVertexAI(jobRecommendationPrompt);
      return result || this.generateJobRecommendationFallback(request);
    } catch (_error) {
      return this.generateJobRecommendationFallback(request);
    }
  }

  /**
   * Generate candidate search prompt internally
   */
  private async generateCandidateSearchPromptInternal(
    request: ICandidateSearchRequest
  ): Promise<string> {
    const query =
      request.query ||
      this.buildQueryFromPreferences(request.preferences || {});
    return await this.generateIntelligentCandidateSearchPrompt(query);
  }

  /**
   * Generate an intelligent, exact-matching candidate search prompt using Vertex AI
   * This method creates prompts that ensure precise matching of user criteria for candidates
   */
  private async generateIntelligentCandidateSearchPrompt(
    query: string
  ): Promise<string> {
    const candidateSpecificPrompt = `
You are an expert candidate search prompt generator for RAG (Retrieval-Augmented Generation) systems.
Your task is to analyze candidate search queries and generate precise, semantic search prompts that will help find the most relevant candidates.
Your output must be structured and based on a deep understanding of the user's intent, even when the query is vague or contains typos.

TASK: Analyze the user query and extract key requirements for candidate matching. Generate a structured search prompt based on your analysis.

OUTPUT FORMAT:

EXACT_MATCH_CANDIDATE_SEARCH:

REQUIRED_CRITERIA:
- SKILLS: [A comprehensive list of inferred skills, tools, and technologies relevant to the ROLE. If specific skills are mentioned in the query, prioritize them.] OR "none specified"
- MUST_SKILLS: [Skills explicitly connected by "and" in the query that MUST be present.] OR "none specified"
- LOCATION: [Geographical location (city, state, country) or "remote" if specified in the query.] OR "none specified"
- EXPERIENCE: [Years of experience mentioned in the query (e.g., "5 years", "3+ years").] OR "none specified"
- INDUSTRY: [Industry mentioned in the query.] OR "none specified"
- ROLE: [The primary job role identified from the query.] OR "none specified"

MATCHING_LOGIC:
[Provide a clear, concise natural language explanation of the matching logic. This should describe how the criteria should be combined to find the best candidates.]

QUERY ANALYSIS AND ENHANCEMENT RULES:

1.  **ROLE AND SKILL INFERENCE**:
    - Identify the primary job role from the query (e.g., "Software Engineer", "Frontend Developer", "Java Developer").
    - Based on the identified role, infer a list of the **most critical and strictly relevant** skills, tools, and technologies. The list must be focused and specific to the core responsibilities of the role.
    - **AVOID GENERIC SKILLS**: Do not include widely applicable skills like 'Git', 'Jira', or basic office software unless the query specifically asks for them.
    - **MAINTAIN STRICT RELEVANCE**: For a given role, only include skills that are central to that function. For example:
        - For a 'UI/UX Designer' query, focus on design tools (Figma, Sketch), design principles (Wireframing, Prototyping), and user research. **Do not** include implementation technologies like HTML, CSS, or JavaScript unless the query is for a 'UI Developer' or 'Frontend' role.
        - For a 'Java Developer' query, focus on the Java ecosystem (Spring, Hibernate, Maven). **Do not** include general database languages like SQL unless the query specifies a backend or data-intensive role.
    - If the query mentions specific technologies (e.g., "React", "Spring Boot"), ensure they are included in the SKILLS list.

2.  **TYPO CORRECTION AND NORMALIZATION**:
    - Automatically correct common misspellings in roles and skills (e.g., "softwarr developer" -> "software developer", "javf" -> "java").
    - Treat singular and plural forms as the same (e.g., "developer" and "developers" refer to the same role).
    - Normalize role titles (e.g., "software engineer" includes "software developer", "developer", "programmer").

3.  **LOCATION EXTRACTION**:
    - Carefully scan the query for any mention of a geographical location (e.g., city, state, country) or the term "remote".
    - If and only if a location is explicitly mentioned, extract it into the LOCATION field.
    - If no location is specified, the LOCATION field must be "none specified". Do not infer or guess locations.

4.  **"AND" LOGIC FOR MUST_SKILLS**:
    - When the query explicitly connects skills with "and" (e.g., "java and react", "python and tensorflow"), extract these skills into the MUST_SKILLS field. These are mandatory requirements.

5.  **EXPERIENCE PARSING**:
    - Extract years of experience when mentioned (e.g., "3+ years", "5 years of experience", "senior").
    - Interpret "senior" as 5+ years of experience.
    - Interpret "3+ years" as 3 years and above.

EXAMPLES:

Query: "java developer from pune"
REQUIRED_CRITERIA:
- SKILLS: [Java, Spring, Spring Boot, Hibernate, Maven, Gradle, J2EE]
- MUST_SKILLS: none specified
- LOCATION: [Pune]
- EXPERIENCE: none specified
- INDUSTRY: none specified
- ROLE: [Java Developer]
MATCHING_LOGIC: Return candidates with skills related to Java development who are located in Pune. Both skill and location criteria are mandatory.

Query: "softwarr developer and software develpers"
REQUIRED_CRITERIA:
- SKILLS: [JavaScript, Python, Java, C++, C#, HTML, CSS, React, Angular, Vue.js, Node.js, SQL, NoSQL, Git, Docker, AWS, Azure]
- MUST_SKILLS: none specified
- LOCATION: none specified
- EXPERIENCE: none specified
- INDUSTRY: none specified
- ROLE: [Software Developer, Developer, Programmer]
MATCHING_LOGIC: Return candidates with a broad range of software development skills. The query contains typos and plurals, which have been corrected to "software developer".

Query: "react and node.js engineer"
REQUIRED_CRITERIA:
- SKILLS: [JavaScript, TypeScript, React, Node.js, Express.js, HTML, CSS, REST, GraphQL, MongoDB]
- MUST_SKILLS: [React, Node.js]
- LOCATION: none specified
- EXPERIENCE: none specified
- INDUSTRY: none specified
- ROLE: [Software Engineer, Full Stack Developer]
MATCHING_LOGIC: Return candidates who have BOTH React AND Node.js skills. These are mandatory requirements. The role is interpreted as a software or full-stack engineer.

Query: "senior python developer with 8 years experience"
REQUIRED_CRITERIA:
- SKILLS: [Python, Django, Flask, FastAPI, Pandas, NumPy, Scikit-learn, TensorFlow, PyTorch]
- MUST_SKILLS: none specified
- LOCATION: none specified
- EXPERIENCE: [8 years]
- INDUSTRY: none specified
- ROLE: [Senior Python Developer]
MATCHING_LOGIC: Return candidates with strong Python skills and exactly 8 years of experience. "Senior" role is consistent with the specified experience level.

Query: "UI/UX Designer"
REQUIRED_CRITERIA:
- SKILLS: [User Interface Design, User Experience Design, Wireframing, Prototyping, Usability Testing, Figma, Sketch, Adobe XD, Interaction Design]
- MUST_SKILLS: none specified
- LOCATION: none specified
- EXPERIENCE: none specified
- INDUSTRY: none specified
- ROLE: [UI/UX Designer, Product Designer]
MATCHING_LOGIC: Return candidates with skills focused on UI/UX design principles and tools. Exclude candidates whose primary skills are in software development (HTML, CSS, JavaScript).

NOW ANALYZE THIS QUERY FOR EXACT CANDIDATE MATCHING: "${query}"

GROUNDING INFORMATION GENERATION:
Generate a comprehensive grounding information summary that explains:
1. MATCHING STRATEGY: Describe how candidates were matched to the search criteria
2. SKILL ALIGNMENT: Summarize the key skills found across matched candidates
3. EXPERIENCE DISTRIBUTION: Explain the experience levels and years found
4. LOCATION COVERAGE: List the geographic areas or remote work preferences matched
5. INDUSTRY RELEVANCE: Highlight relevant industry backgrounds
6. SEARCH METHODOLOGY: Explain the semantic analysis and ranking approach used
7. QUALITY METRICS: Provide statistics on match quality and relevance scores

GROUNDING FORMAT REQUIREMENTS:
- Use ONLY plain text, NO emojis or special characters
- Write in clear, professional language
- Start with "AI matched X candidates based on..."
- Include specific numbers and statistics where available
- Explain the matching logic and criteria used
- Keep it informative but concise (3-5 sentences)
- Focus on factual information about the search and results

EXAMPLE GROUNDING FORMAT:
"AI matched 12 candidates based on semantic similarity and skill relevance to the Java Developer search. Key skills matched include Java, Spring Framework, and SQL across candidates with 2-7 years of experience. Location preferences span remote work and major cities including Pune and Bangalore. The search strategy utilized exact skill matching with comprehensive semantic analysis, resulting in an average match score of 82% across all results."

INDIVIDUAL CANDIDATE GROUNDING INFORMATION:
Generate individual grounding information for each candidate that explains:
1. AI ASSESSMENT SCORE: The candidate's AI assessment percentage score
2. MATCHED SKILLS: Specific skills that align with search criteria
3. MATCHED LOCATIONS: Geographic alignment with search location preferences
4. MATCHED INDUSTRIES: Industry background relevance
5. EXPERIENCE LEVEL: Years of relevant experience
6. MATCH SCORES: Breakdown of semantic, skills, and location match percentages

INDIVIDUAL GROUNDING FORMAT REQUIREMENTS:
- Use ONLY plain text, NO emojis or special characters
- Write in clear, professional language
- Include specific data points and percentages
- Keep it concise but informative
- Focus on factual matching information

EXAMPLE INDIVIDUAL GROUNDING FORMAT:
"AI Assessment Score: 88%; Matched Skills: Java, Spring Framework, MySQL; Matched Locations: Remote, Pune; Experience: 4 years; Match Scores - Semantic: 85%, Skills: 95%, Location: 90%"
`;

    try {
      const result = await this.callVertexAI(candidateSpecificPrompt);

      if (result) {
        return result;
      } else {
        logger.warn({
          message: 'Vertex AI call failed, falling back to basic prompt',
          context:
            'CandidatePromptGenerator.generateIntelligentCandidateSearchPrompt',
          query,
        });
        return this.generateExactMatchFallbackPrompt(query);
      }
    } catch (error) {
      logger.error({
        message:
          'Failed to generate exact matching candidate search prompt, falling back to basic prompt',
        context:
          'CandidatePromptGenerator.generateIntelligentCandidateSearchPrompt',
        error: error instanceof Error ? error.message : 'Unknown error',
        query,
      });

      // Fallback to exact matching basic prompt if Vertex AI fails
      return this.generateExactMatchFallbackPrompt(query);
    }
  }

  /**
   * Build query from preferences
   */
  private buildQueryFromPreferences(preferences: {
    preferredJobTitles?: string[];
    skills?: string[];
    preferredLocations?: string[];
  }): string {
    const parts: string[] = [];
    if (preferences.preferredJobTitles?.length) {
      parts.push(`Roles: ${preferences.preferredJobTitles.join(', ')}`);
    }
    if (preferences.skills?.length) {
      parts.push(`Skills: ${preferences.skills.join(', ')}`);
    }
    if (preferences.preferredLocations?.length) {
      parts.push(`Locations: ${preferences.preferredLocations.join(', ')}`);
    }
    return parts.length > 0 ? parts.join(' | ') : 'Any candidate';
  }

  /**
   * Generate job recommendation fallback
   */
  private generateJobRecommendationFallback(
    request: ICandidateSearchRequest
  ): string {
    const query = this.buildQueryFromPreferences(request.preferences || {});
    return `JOB RECOMMENDATION FOR CANDIDATE
TARGET PREFERENCES: "${query}"

Find job postings that match:
- Job Titles: ${request.preferences?.preferredJobTitles?.join(', ') || 'Any'}
- Required Skills: ${request.preferences?.skills?.join(', ') || 'Any'}
- Locations: ${request.preferences?.preferredLocations?.join(', ') || 'Any'}

Focus on career growth and skill development opportunities.`;
  }

  /**
   * Generate exact match fallback prompt
   */
  private generateExactMatchFallbackPrompt(query: string): string {
    return `CANDIDATE SEARCH FOR RAG MATCHING
TARGET QUERY: "${query}"

Find candidates that match the search criteria exactly.
Use semantic similarity for precise matching.

GROUNDING INFORMATION GENERATION:
Generate a comprehensive grounding information summary that explains:
1. MATCHING STRATEGY: Describe how candidates were matched to the search criteria
2. SKILL ALIGNMENT: Summarize the key skills found across matched candidates
3. EXPERIENCE DISTRIBUTION: Explain the experience levels and years found
4. LOCATION COVERAGE: List the geographic areas or remote work preferences matched
5. INDUSTRY RELEVANCE: Highlight relevant industry backgrounds
6. SEARCH METHODOLOGY: Explain the semantic analysis and ranking approach used
7. QUALITY METRICS: Provide statistics on match quality and relevance scores

GROUNDING FORMAT REQUIREMENTS:
- Use ONLY plain text, NO emojis or special characters
- Write in clear, professional language
- Start with "AI matched X candidates based on..."
- Include specific numbers and statistics where available
- Explain the matching logic and criteria used
- Keep it informative but concise (3-5 sentences)
- Focus on factual information about the search and results

INDIVIDUAL CANDIDATE GROUNDING INFORMATION:
Generate individual grounding information for each candidate that explains:
1. AI ASSESSMENT SCORE: The candidate's AI assessment percentage score
2. MATCHED SKILLS: Specific skills that align with search criteria
3. MATCHED LOCATIONS: Geographic alignment with search location preferences
4. MATCHED INDUSTRIES: Industry background relevance
5. EXPERIENCE LEVEL: Years of relevant experience
6. MATCH SCORES: Breakdown of semantic, skills, and location match percentages

INDIVIDUAL GROUNDING FORMAT REQUIREMENTS:
- Use ONLY plain text, NO emojis or special characters
- Write in clear, professional language
- Include specific data points and percentages
- Keep it concise but informative
- Focus on factual matching information`;
  }

  /**
   * Call Vertex AI to generate candidate search prompts
   */
  private async callVertexAI(prompt: string): Promise<string | null> {
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
        logger.debug('Vertex AI generated candidate prompt successfully', {
          context: 'CandidatePromptGenerator.callVertexAI',
          responseLength: generatedText.length,
        });
        return generatedText;
      }

      logger.warn('No valid response from Vertex AI', {
        context: 'CandidatePromptGenerator.callVertexAI',
      });
      return null;
    } catch (error) {
      logger.error('Vertex AI call failed', {
        context: 'CandidatePromptGenerator.callVertexAI',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }
}
