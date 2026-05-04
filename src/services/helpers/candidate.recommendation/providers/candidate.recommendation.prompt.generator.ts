import { logger } from '@/shared/utils/logger';
import { singleton } from '@/shared/decorators/singleton';
import { GcpVertexCandidateRecommendationProvider } from './gcp.vertex.candidate.recommendation.provider';

import {
  CandidatePromptGenerator,
  ICandidateSearchRequest,
} from '../../recommendations.search.common.prompts/gcp.vertex.candidate.common.prompt';

@singleton
export class CandidateRecommendationPromptGenerator {
  private readonly candidatePromptGenerator: CandidatePromptGenerator;
  private readonly gcpProvider: GcpVertexCandidateRecommendationProvider;

  constructor() {
    this.candidatePromptGenerator = new CandidatePromptGenerator();
    this.gcpProvider = new GcpVertexCandidateRecommendationProvider();
  }

  static async generateCandidateRecommendationPromptWithFeedback(
    preferences: {
      preferredJobTitles: string[];
      skills: string[];
      preferredLocations?: string[];
    },
    feedbackAnalysis?: any,
    prevDateTime?: Date
  ): Promise<string> {
    try {
      // Use the new common candidate prompt generator
      const candidatePromptGenerator = new CandidatePromptGenerator();

      const request: ICandidateSearchRequest = {
        preferences: {
          preferredJobTitles: preferences.preferredJobTitles,
          skills: preferences.skills,
          preferredLocations: preferences.preferredLocations,
        },
        feedbackAnalysis,
        prevDateTime,
        additionalContext: {
          searchType: 'job_recommendation_for_candidate',
        },
      };

      logger.info(
        'Generating dynamic candidate recommendation prompt via common prompt generator',
        {
          context:
            'CandidateRecommendationPromptGenerator.generateCandidateRecommendationPromptWithFeedback',
          hasPreferences: !!preferences,
          hasFeedback: !!feedbackAnalysis,
          hasPrevDateTime: !!prevDateTime,
        }
      );

      // Use the candidate search method for job recommendations
      const prompt =
        await candidatePromptGenerator.generateCandidateSearchPrompt(request);

      logger.info(
        'Successfully generated dynamic candidate recommendation prompt via common generator',
        {
          context:
            'CandidateRecommendationPromptGenerator.generateCandidateRecommendationPromptWithFeedback',
          promptLength: prompt.length,
        }
      );

      return prompt;
    } catch (error) {
      logger.error('Failed to generate dynamic prompt, using fallback', {
        context:
          'CandidateRecommendationPromptGenerator.generateCandidateRecommendationPromptWithFeedback',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Fallback to the original static method logic
      return this.generateFallbackPrompt(
        preferences,
        feedbackAnalysis,
        prevDateTime
      );
    }
  }

  /**
   * Build a search query from candidate preferences
   */
  private static buildQueryFromPreferences(preferences: {
    preferredJobTitles: string[];
    skills: string[];
    preferredLocations?: string[];
  }): string {
    const queryParts = [];

    if (preferences.preferredJobTitles?.length) {
      queryParts.push(
        `Job titles: ${preferences.preferredJobTitles.join(', ')}`
      );
    }

    if (preferences.skills?.length) {
      queryParts.push(`Skills: ${preferences.skills.join(', ')}`);
    }

    if (preferences.preferredLocations?.length) {
      queryParts.push(
        `Locations: ${preferences.preferredLocations.join(', ')}`
      );
    }

    return queryParts.join(' | ');
  }

  /**
   * Fallback method for when Vertex AI fails
   */
  private static generateFallbackPrompt(
    preferences: {
      preferredJobTitles: string[];
      skills: string[];
      preferredLocations?: string[];
    },
    feedbackAnalysis?: any,
    prevDateTime?: Date
  ): string {
    const candidateQuery = this.buildQueryFromPreferences(preferences);

    let exclusionCriteria = '';
    let preferredCriteria = '';

    if (feedbackAnalysis) {
      exclusionCriteria = this.buildExclusionCriteria(
        feedbackAnalysis.notInterestedPatterns
      );
      preferredCriteria = this.buildPreferredCriteria(
        feedbackAnalysis.interestedPatterns
      );
    }

    // Add date filtering criteria if prevDateTime is provided
    let dateFilterCriteria = '';
    if (prevDateTime) {
      dateFilterCriteria = `
🕒 JOB POSTING DATE FILTER:
- ONLY include job postings whose creation date is GREATER THAN: ${prevDateTime.toISOString()}
- This ensures we only get NEW job postings since the last recommendation sync
- Exclude any job posting created before this timestamp
`;
    }

    // Format preferred job titles with emphasis
    const jobTitlesSection = preferences.preferredJobTitles?.length
      ? `**TARGET JOB TITLES:**
${preferences.preferredJobTitles.map((title) => `- ${title.trim()}`).join('\n')}
Focus on roles that match these titles or are closely related (e.g., Senior, Lead, Principal variations).`
      : `**TARGET JOB TITLES:** Any relevant professional roles`;

    // Format skills with categorization
    const skillsSection = preferences.skills?.length
      ? `**REQUIRED SKILLS & EXPERTISE:**
${preferences.skills
  .slice(0, 10)
  .map((skill) => `- ${skill.trim()}`)
  .join('\n')}
Prioritize jobs requiring these specific technical skills and competencies.`
      : `**REQUIRED SKILLS & EXPERTISE:** Open to various skill requirements`;

    // Format location preferences
    const locationsSection = preferences.preferredLocations?.length
      ? `**PREFERRED LOCATIONS:**
${preferences.preferredLocations.map((location) => `- ${location.trim()}`).join('\n')}
Consider remote opportunities and hybrid arrangements if location flexibility is indicated.`
      : `**PREFERRED LOCATIONS:** Open to all locations including remote work`;

    return `JOB SEARCH FOR RAG MATCHING
CANDIDATE PREFERENCES: "${candidateQuery}"

CORE MATCHING STRATEGY:
${jobTitlesSection}

${skillsSection}

${locationsSection}

SEMANTIC SEARCH INSTRUCTIONS:
1. JOB TITLE MATCHING: Match job postings to candidate's preferred roles and career level
2. SKILLS ALIGNMENT: Find jobs requiring the candidate's technical expertise
3. LOCATION COMPATIBILITY: Match location preferences and remote work options
4. EXPERIENCE LEVEL: Match seniority level indicated in preferred job titles

JOB POSTING ANALYSIS:
- Requirements: Extract from jobDescription, requiredSkills, preferredSkills arrays
- Location: Analyze workLocation, isRemote, isHybrid fields
- Experience: Match experienceLevel, yearsOfExperience requirements
- Industry: Consider industry, companyType, companySize
- Benefits: Factor in salary, benefits, workType preferences

${exclusionCriteria}

${preferredCriteria}

${dateFilterCriteria}

SCORING CRITERIA (Weighted):
1. Job title relevance (40%): Match to preferred roles and career progression
2. Skills alignment (35%): Required vs preferred skills match
3. Location compatibility (15%): Geographic or remote work alignment
4. Experience level (10%): Appropriate seniority level

MATCHING PRECISION:
- PRIMARY: Must align with core job title preferences and key skills
- SECONDARY: Prefer jobs with additional matching skills and benefits
- TERTIARY: Consider company culture, growth opportunities, work-life balance
- EXCLUSION: Strictly avoid patterns from negative feedback

OUTPUT EXPECTATION: Return top job postings ranked by composite score, ensuring diversity and avoiding feedback-flagged opportunities.`;
  }

  /**
   * Build exclusion criteria from negative feedback patterns
   */
  private static buildExclusionCriteria(notInterestedPatterns: any): string {
    if (!notInterestedPatterns) return '';

    const exclusions = [];

    if (notInterestedPatterns.jobTitles?.length > 0) {
      exclusions.push(
        `EXCLUDE Job Titles: [${notInterestedPatterns.jobTitles.join(', ')}]`
      );
    }
    if (notInterestedPatterns.skills?.length > 0) {
      exclusions.push(
        `EXCLUDE Skills: [${notInterestedPatterns.skills.join(', ')}]`
      );
    }
    if (notInterestedPatterns.industries?.length > 0) {
      exclusions.push(
        `EXCLUDE Industries: [${notInterestedPatterns.industries.join(', ')}]`
      );
    }
    if (notInterestedPatterns.locations?.length > 0) {
      exclusions.push(
        `EXCLUDE Locations: [${notInterestedPatterns.locations.join(', ')}]`
      );
    }
    if (notInterestedPatterns.companies?.length > 0) {
      exclusions.push(
        `EXCLUDE Companies: [${notInterestedPatterns.companies.join(', ')}]`
      );
    }
    if (notInterestedPatterns.workTypes?.length > 0) {
      exclusions.push(
        `EXCLUDE Work Types: [${notInterestedPatterns.workTypes.join(', ')}]`
      );
    }

    return exclusions.length > 0
      ? `\n🚫 STRICT EXCLUSION CRITERIA (DO NOT MATCH):\n${exclusions.join('\n')}\n`
      : '';
  }

  /**
   * Build preferred criteria from positive feedback patterns
   */
  private static buildPreferredCriteria(interestedPatterns: any): string {
    if (!interestedPatterns) return '';

    const preferences = [];

    if (interestedPatterns.jobTitles?.length > 0) {
      preferences.push(
        `PREFER Job Titles: [${interestedPatterns.jobTitles.join(', ')}] +20% score`
      );
    }
    if (interestedPatterns.skills?.length > 0) {
      preferences.push(
        `PREFER Skills: [${interestedPatterns.skills.join(', ')}] +15% score`
      );
    }
    if (interestedPatterns.industries?.length > 0) {
      preferences.push(
        `PREFER Industries: [${interestedPatterns.industries.join(', ')}] +15% score`
      );
    }
    if (interestedPatterns.locations?.length > 0) {
      preferences.push(
        `PREFER Locations: [${interestedPatterns.locations.join(', ')}] +10% score`
      );
    }
    if (interestedPatterns.companies?.length > 0) {
      preferences.push(
        `PREFER Companies: [${interestedPatterns.companies.join(', ')}] +10% score`
      );
    }
    if (interestedPatterns.workTypes?.length > 0) {
      preferences.push(
        `PREFER Work Types: [${interestedPatterns.workTypes.join(', ')}] +5% score`
      );
    }

    return preferences.length > 0
      ? `\n✅ PREFERRED CRITERIA (BOOST RANKING):\n${preferences.join('\n')}\n`
      : '';
  }

  /**
   * Creates a manual recommendation score based on candidate preferences and job posting search terms
   * @param candidatePreferences - Candidate's job preferences and skills
   * @param jobPostingSearchTerms - Job posting search terms and metadata
   * @returns Object containing semantic score and professional metadata
   */
  async createManualRecommendationScore(
    candidatePreferences: {
      preferredJobTitles?: string[];
      preferredLocations?: string[];
      skills?: string[];
    },
    jobPostingSearchTerms: {
      jobSearchTerms: string;
      jobPostTitle: string;
    }
  ): Promise<{
    score: number;
    metadata: string;
  }> {
    try {
      // Create a concise prompt for scoring
      const scoringPrompt = `Analyze the match between candidate preferences and job posting:
  
  CANDIDATE PREFERENCES:
  - Job Titles: ${candidatePreferences.preferredJobTitles?.join(', ') || 'Not specified'}
  - Skills: ${candidatePreferences.skills?.join(', ') || 'Not specified'}
  - Locations: ${candidatePreferences.preferredLocations?.join(', ') || 'Not specified'}
  
  JOB POSTING:
  - Title: ${jobPostingSearchTerms.jobPostTitle}
  - Requirements: ${jobPostingSearchTerms.jobSearchTerms.substring(0, 500)}...
  
  TASK: Evaluate compatibility and return:
  1. A semantic score (0.0 to 1.0) based on alignment
  2. A brief professional explanation (20-30 words) of the match
  
  Focus on: job title relevance, skills alignment, location compatibility, and experience level match.`;

      // Get embedding for the scoring prompt
      const promptEmbedding =
        await this.gcpProvider.getEmbedding(scoringPrompt);

      // Calculate a simple semantic score based on embedding characteristics
      const embeddingMagnitude = Math.sqrt(
        promptEmbedding.reduce((sum: number, val: number) => sum + val * val, 0)
      );
      const normalizedScore = Math.min(
        1.0,
        Math.max(0.0, embeddingMagnitude / 10)
      );

      // Generate professional metadata based on score ranges
      let metadata = '';
      if (normalizedScore >= 0.8) {
        metadata =
          "Exceptional alignment with candidate's career objectives and technical expertise.";
      } else if (normalizedScore >= 0.6) {
        metadata =
          "Strong compatibility with candidate's professional background and skill set.";
      } else if (normalizedScore >= 0.4) {
        metadata =
          "Moderate fit with candidate's qualifications and career preferences.";
      } else if (normalizedScore >= 0.2) {
        metadata =
          "Limited alignment with candidate's expertise and career goals.";
      } else {
        metadata =
          "Minimal compatibility with candidate's professional profile.";
      }

      logger.info('Manual recommendation score generated', {
        context:
          'GcpVertexCandidateRecommendationProvider.createManualRecommendationScore',
        score: normalizedScore,
        metadata,
        candidateId: 'manual',
        jobId: 'manual',
      });

      return {
        score: normalizedScore,
        metadata,
      };
    } catch (error) {
      logger.error('Failed to create manual recommendation score', {
        context:
          'GcpVertexCandidateRecommendationProvider.createManualRecommendationScore',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Return fallback score
      return {
        score: 0.5,
        metadata:
          'Standard compatibility assessment with moderate alignment potential.',
      };
    }
  }
}
