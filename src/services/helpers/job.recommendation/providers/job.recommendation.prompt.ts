import { logger } from '@/shared/utils/logger';
import { CandidateRecommendationFeedbackTypeEnum } from '@/shared/models/common/enums';
import { singleton } from '@/shared/decorators/singleton';
import { PrismaClient } from '@prisma/client';
import {
  ICandidateRecommendationFeedback,
  IFeedbackAnalysis,
} from '../job.recommendation.provider';
import {
  JobPromptGenerator,
  IJobSearchRequest,
} from '../../recommendations.search.common.prompts/gcp.vertex.job.common.prompt';

@singleton
export class JobRecommendationPromptGenerator {
  private readonly prisma: PrismaClient;
  private readonly jobPromptGenerator: JobPromptGenerator;

  constructor() {
    this.prisma = new PrismaClient();
    this.jobPromptGenerator = new JobPromptGenerator();
  }

  static async generateJobRecommendationPromptWithFeedback(
    query: string,
    feedbackAnalysis: any,
    prevDateTime?: Date
  ): Promise<string> {
    try {
      // Create a new instance for the static method call
      const jobPromptGenerator = new JobPromptGenerator();

      const request: IJobSearchRequest = {
        query,
        feedbackAnalysis,
        prevDateTime,
      };

      logger.info(
        'Generating dynamic job recommendation prompt via Vertex AI',
        {
          context:
            'JobRecommendationPromptGenerator.generateJobRecommendationPromptWithFeedback',
          query: query?.substring(0, 100),
          hasFeedback: !!feedbackAnalysis,
          hasPrevDateTime: !!prevDateTime,
        }
      );

      const response =
        await jobPromptGenerator.generateJobSearchPrompt(request);

      logger.info('Successfully generated dynamic job recommendation prompt', {
        context:
          'JobRecommendationPromptGenerator.generateJobRecommendationPromptWithFeedback',
        promptLength: response.length,
      });

      return response;
    } catch (error) {
      logger.error('Failed to generate dynamic prompt, using fallback', {
        context:
          'JobRecommendationPromptGenerator.generateJobRecommendationPromptWithFeedback',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Fallback to the original static method logic
      return this.generateFallbackPrompt(query, feedbackAnalysis, prevDateTime);
    }
  }

  /**
   * Fallback method for when Vertex AI fails
   */
  private static generateFallbackPrompt(
    query: string,
    feedbackAnalysis: any,
    prevDateTime?: Date
  ): string {
    const queryAnalysis = this.extractJobRequirements(query);

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
🕒 CANDIDATE CREATION DATE FILTER:
- ONLY include candidates whose creation date is GREATER THAN: ${prevDateTime.toISOString()}
- This ensures we only get NEW candidates since the last recommendation sync
- Exclude any candidate created before this timestamp
`;
    }

    return `CANDIDATE SEARCH FOR RAG MATCHING
TARGET JOB: "${query}"

CORE MATCHING STRATEGY:
${queryAnalysis}

SEMANTIC SEARCH INSTRUCTIONS:
1. EXACT SKILL MATCHING: Match candidate skills to required technologies/tools
2. EXPERIENCE ALIGNMENT: Find candidates with relevant years and project experience  
3. INDUSTRY RELEVANCE: Match industry background and domain knowledge
4. ROLE COMPATIBILITY: Match job titles, seniority levels, and responsibilities

CANDIDATE PROFILE ANALYSIS:
- Skills: Extract from resume.resumeSkills, experience.skills arrays
- Experience: Analyze experience.position, experience.company, experience.industry
- Education: Match education.degree, education.fieldOfStudy
- Preferences: Consider preferences.preferredIndustries, preferredLocations, preferredWorkTypes
- AI Assessment: Factor in assessment scores and recommendations if available

${exclusionCriteria}

${preferredCriteria}

${dateFilterCriteria}

SCORING CRITERIA (Weighted):
1. Direct skill match (40%): Exact technology/tool matches
2. Experience relevance (25%): Similar roles, projects, industries  
3. Education alignment (15%): Relevant degree/field of study
4. Location compatibility (10%): Geographic or remote work alignment
5. Career progression (10%): Growth trajectory and potential

MATCHING PRECISION:
- PRIMARY: Must have core skills from job requirements
- SECONDARY: Prefer candidates with additional complementary skills
- TERTIARY: Consider cultural fit and soft skills
- EXCLUSION: Strictly avoid patterns from negative feedback

OUTPUT EXPECTATION: Return top candidates ranked by composite score, ensuring diversity and avoiding feedback-flagged profiles.

GROUNDING INFORMATION GENERATION:
Generate a comprehensive grounding information summary that explains:
1. MATCHING STRATEGY: Describe how candidates were matched to the job requirements
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
"AI matched 15 candidates based on semantic similarity and skill relevance to the Software Engineer position. Key skills matched include Python, React, and AWS across candidates with 3-8 years of experience. Location preferences span remote work and major tech hubs including San Francisco and New York. The search strategy utilized comprehensive semantic analysis with skill-focused matching, resulting in an average match score of 78% across all results."

INDIVIDUAL CANDIDATE GROUNDING INFORMATION:
Generate individual grounding information for each candidate that explains:
1. AI ASSESSMENT SCORE: The candidate's AI assessment percentage score
2. MATCHED SKILLS: Specific skills that align with job requirements
3. MATCHED LOCATIONS: Geographic alignment with job location preferences
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
"AI Assessment Score: 85%; Matched Skills: Java, Spring Framework, AWS; Matched Locations: Remote, San Francisco; Experience: 5 years; Match Scores - Semantic: 78%, Skills: 92%, Location: 85%"`;
  }

  private static extractJobRequirements(query: string): string {
    return `
REQUIRED SKILLS EXTRACTION:
- Technical Skills: Extract programming languages, frameworks, tools
- Years of Experience: Identify experience requirements (junior/mid/senior)
- Industry Domain: Determine sector-specific knowledge needed
- Role Level: Identify seniority (entry/mid/senior/lead/principal)
- Work Type: Remote/hybrid/onsite preferences
- Location: Geographic requirements or constraints

QUERY ANALYSIS: "${query}"
- Extract core technologies and skills mentioned
- Identify experience level indicators
- Find industry or domain requirements  
- Determine role complexity and seniority
- Note any specific certifications or qualifications`;
  }

  private static buildExclusionCriteria(notInterestedPatterns: any): string {
    if (!notInterestedPatterns) return '';

    const exclusions = [];

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
    if (notInterestedPatterns.experienceLevels?.length > 0) {
      exclusions.push(
        `EXCLUDE Experience Levels: [${notInterestedPatterns.experienceLevels.join(', ')}]`
      );
    }
    if (notInterestedPatterns.jobTitles?.length > 0) {
      exclusions.push(
        `EXCLUDE Job Titles: [${notInterestedPatterns.jobTitles.join(', ')}]`
      );
    }
    if (notInterestedPatterns.companies?.length > 0) {
      exclusions.push(
        `EXCLUDE Companies: [${notInterestedPatterns.companies.join(', ')}]`
      );
    }

    return exclusions.length > 0
      ? `\n🚫 STRICT EXCLUSION CRITERIA (DO NOT MATCH):\n${exclusions.join('\n')}\n`
      : '';
  }

  private static buildPreferredCriteria(interestedPatterns: any): string {
    if (!interestedPatterns) return '';

    const preferences = [];

    if (interestedPatterns.skills?.length > 0) {
      preferences.push(
        `PREFER Skills: [${interestedPatterns.skills.join(', ')}] +20% score`
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
    if (interestedPatterns.experienceLevels?.length > 0) {
      preferences.push(
        `PREFER Experience Levels: [${interestedPatterns.experienceLevels.join(', ')}] +15% score`
      );
    }
    if (interestedPatterns.jobTitles?.length > 0) {
      preferences.push(
        `PREFER Job Titles: [${interestedPatterns.jobTitles.join(', ')}] +10% score`
      );
    }
    if (interestedPatterns.companies?.length > 0) {
      preferences.push(
        `PREFER Companies: [${interestedPatterns.companies.join(', ')}] +10% score`
      );
    }

    return preferences.length > 0
      ? `\n✅ PREFERRED CRITERIA (BOOST RANKING):\n${preferences.join('\n')}\n`
      : '';
  }

  /**
   * Map database feedback type to our enum
   * @param dbFeedbackType The feedback type from database
   */
  private mapFeedbackType(
    dbFeedbackType: any
  ): CandidateRecommendationFeedbackTypeEnum {
    return CandidateRecommendationFeedbackTypeEnum[
      dbFeedbackType as keyof typeof CandidateRecommendationFeedbackTypeEnum
    ];
  }

  async getCandidateRecommendationFeedback(
    clientId: string,
    limit: number = 100,
    daysBack: number = 30
  ): Promise<ICandidateRecommendationFeedback[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);

      logger.debug({
        message: 'Fetching candidate recommendation feedback',
        context: 'CandidateFeedbackService.getCandidateRecommendationFeedback',
        clientId,
        limit,
        daysBack,
        cutoffDate,
      });

      // Query using Prisma ORM with the correct schema relationships
      const feedbackRecords =
        await this.prisma.candidate_recommendation.findMany({
          where: {
            jobPosting: {
              clientId: clientId, // Get client through job posting relationship
            },
            createdAt: {
              gte: cutoffDate,
            },
            feedback: {
              isNot: null, // Only get recommendations that have feedback
            },
          },
          include: {
            candidate: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
                resume: {
                  select: {
                    summary: true,
                    resumeSkills: true,
                    totalExperience: true,
                    highestEducationLevel: true,
                    industries: true,
                  },
                },
                preferences: {
                  select: {
                    preferredLocations: true,
                  },
                },
              },
            },
            jobPosting: {
              select: {
                id: true,
                clientId: true,
              },
            },
            feedback: {
              select: {
                type: true,
                comment: true,
                reason: true,
                isHelpful: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: limit,
        });

      const feedback = feedbackRecords.map((record: any) => ({
        id: record.id,
        clientId: record.jobPosting?.clientId || '',
        candidateId: record.candidateId,
        jobId: record.jobPostingId,
        feedbackType: this.mapFeedbackType(record.feedback?.type),
        reason: record.feedback?.reason || '',
        notes: record.feedback?.comment || '',
        candidateProfile: {
          skills: record.candidate?.resume?.resumeSkills || [],
          experience: record.candidate?.resume?.totalExperience || 0,
          industry: record.candidate?.resume?.industries?.[0] || '',
          location:
            record.candidate?.preferences?.preferredLocations?.[0] || '',
          education: record.candidate?.resume?.highestEducationLevel || '',
          jobTitle: '', // Would need to get from experience table
          companyName: '', // Would need to get from experience table
        },
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      }));

      logger.debug({
        message: 'Retrieved candidate recommendation feedback',
        context: 'CandidateFeedbackService.getCandidateRecommendationFeedback',
        clientId,
        feedbackCount: feedback.length,
      });

      return feedback;
    } catch (error) {
      logger.error({
        message: 'Failed to get candidate recommendation feedback',
        context: 'CandidateFeedbackService.getCandidateRecommendationFeedback',
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
      });
      throw error;
    }
  }

  /**
   * Analyze feedback patterns to understand client preferences
   * @param feedback Array of feedback records
   */
  analyzeFeedbackPatterns(
    feedback: ICandidateRecommendationFeedback[]
  ): IFeedbackAnalysis {
    const notInterestedFeedback = feedback.filter(
      (f) =>
        f.feedbackType ===
          CandidateRecommendationFeedbackTypeEnum.NOT_INTERESTED ||
        f.feedbackType === CandidateRecommendationFeedbackTypeEnum.DISLIKE
    );

    const interestedFeedback = feedback.filter(
      (f) =>
        f.feedbackType === CandidateRecommendationFeedbackTypeEnum.LIKE ||
        f.feedbackType === CandidateRecommendationFeedbackTypeEnum.RELEVANT
    );

    const extractPatterns = (
      feedbackList: ICandidateRecommendationFeedback[]
    ) => {
      const skills: string[] = [];
      const industries: string[] = [];
      const locations: string[] = [];
      const experienceLevels: number[] = [];
      const educationLevels: string[] = [];
      const jobTitles: string[] = [];
      const companies: string[] = [];

      feedbackList.forEach((fb) => {
        if (fb.candidateProfile) {
          skills.push(...fb.candidateProfile.skills);
          if (fb.candidateProfile.industry)
            industries.push(fb.candidateProfile.industry);
          if (fb.candidateProfile.location)
            locations.push(fb.candidateProfile.location);
          if (fb.candidateProfile.experience)
            experienceLevels.push(fb.candidateProfile.experience);
          if (fb.candidateProfile.education)
            educationLevels.push(fb.candidateProfile.education);
          if (fb.candidateProfile.jobTitle)
            jobTitles.push(fb.candidateProfile.jobTitle);
          if (fb.candidateProfile.companyName)
            companies.push(fb.candidateProfile.companyName);
        }
      });

      return {
        skills: [...new Set(skills)],
        industries: [...new Set(industries)],
        locations: [...new Set(locations)],
        experienceLevels: [...new Set(experienceLevels)],
        educationLevels: [...new Set(educationLevels)],
        jobTitles: [...new Set(jobTitles)],
        companies: [...new Set(companies)],
      };
    };

    const notInterestedPatterns = extractPatterns(notInterestedFeedback);
    const interestedPatterns = extractPatterns(interestedFeedback);

    // Extract reasons from not interested feedback
    const reasons = notInterestedFeedback
      .map((f) => f.reason)
      .filter((reason) => reason && reason.trim() !== '')
      .map((reason) => reason!);

    const analysis: IFeedbackAnalysis = {
      notInterestedPatterns: {
        ...notInterestedPatterns,
        reasons: [...new Set(reasons)],
      },
      interestedPatterns,
      totalFeedback: feedback.length,
      recentFeedback: feedback.filter(
        (f) =>
          new Date(f.createdAt) >=
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length,
    };

    logger.debug({
      message: 'Analyzed feedback patterns',
      context: 'CandidateFeedbackService.analyzeFeedbackPatterns',
      analysis,
    });

    return analysis;
  }
}
