import { singleton } from '@/shared/decorators/singleton';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/shared/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { GcpVertexJobRecommendationProvider } from '@/services/helpers/job.recommendation/providers/gcp.vertex.job.recommendation.provider';
import { JobRecommendationPromptGenerator } from '@/services/helpers/job.recommendation/providers/job.recommendation.prompt';
import { ISearchResult } from '@/shared/models/domain/search/search.domain';
import { JobRecommendationStatusEnum } from '@/shared/models/common/enums';
import {
  IPaginatedResponse,
  IPaginationRequest,
} from '@/shared/models/api/common/common.api';
import {
  ISupportJobRecommendationPreview,
  ISupportStoreRecommendationsRequest,
  ISupportStoreRecommendationsResponse,
  ISupportStoredJobRecommendation,
} from '@/shared/models/domain/support/job.posting.recommendation.domain';

@singleton
export class SupportJobPostingRecommendationService {
  private readonly prisma: PrismaClient;
  private readonly gcpProvider: GcpVertexJobRecommendationProvider;
  private readonly promptGenerator: JobRecommendationPromptGenerator;

  constructor() {
    this.prisma = new PrismaClient();
    this.gcpProvider = new GcpVertexJobRecommendationProvider();
    this.promptGenerator = new JobRecommendationPromptGenerator();
  }

  /**
   * Get job recommendations preview for recruiter review
   * Returns recommendations without storing them
   */
  async getJobRecommendationsPreview(
    jobPostingId: string,
    pagination: IPaginationRequest = {},
    prevSyncDateTime?: Date,
    candidateSearch?: string
  ): Promise<IPaginatedResponse<ISupportJobRecommendationPreview>> {
    try {
      const page = pagination.page ?? 1;
      const limit = pagination.limit ?? 25;
      const searchLimit = Math.max(limit * 2, 50); // Get more results for better pagination

      logger.info('Getting job recommendations preview', {
        context:
          'SupportJobPostingRecommendationService.getJobRecommendationsPreview',
        jobPostingId,
        page,
        limit,
        searchLimit,
        search: pagination.search,
        candidateSearch,
      });

      // Verify job posting exists and get client info
      const jobPosting = await this.prisma.job_posting.findUnique({
        where: { id: jobPostingId },
        select: {
          id: true,
          clientId: true,
          title: true,
          status: true,
        },
      });

      if (!jobPosting) {
        throw new Error(`Job posting not found: ${jobPostingId}`);
      }

      let recommendedCandidates: ISearchResult[] = [];

      // If candidateSearch is provided, search by candidate name/email first
      if (candidateSearch?.trim()) {
        logger.info('Searching candidates by name/email in embeddings', {
          context:
            'SupportJobPostingRecommendationService.getJobRecommendationsPreview',
          jobPostingId,
          candidateSearch: candidateSearch.trim(),
        });

        // Search for candidates by name/email in the embeddings
        const candidateSearchResults = await this.searchCandidatesByNameOrEmail(
          candidateSearch.trim(),
          searchLimit,
          jobPostingId
        );

        if (candidateSearchResults.length > 0) {
          recommendedCandidates = candidateSearchResults;
          logger.info('Found candidates by name/email search', {
            context:
              'SupportJobPostingRecommendationService.getJobRecommendationsPreview',
            jobPostingId,
            candidateSearch: candidateSearch.trim(),
            foundCount: candidateSearchResults.length,
          });
        } else {
          logger.info(
            'No candidates found by name/email search, falling back to AI recommendations',
            {
              context:
                'SupportJobPostingRecommendationService.getJobRecommendationsPreview',
              jobPostingId,
              candidateSearch: candidateSearch.trim(),
            }
          );
        }
      }

      // If no candidates found by name/email search, or no candidateSearch provided, use AI recommendations
      if (recommendedCandidates.length === 0) {
        // Get job search terms
        const { jobSearchTerms } =
          await this.getJobPostingSearchTerms(jobPostingId);

        // Get feedback for better recommendations
        const feedback =
          await this.promptGenerator.getCandidateRecommendationFeedback(
            jobPosting.clientId,
            5,
            10
          );

        const feedbackAnalysis =
          this.promptGenerator.analyzeFeedbackPatterns(feedback);

        // Generate search prompt with feedback
        const searchPrompt =
          await JobRecommendationPromptGenerator.generateJobRecommendationPromptWithFeedback(
            jobSearchTerms,
            feedbackAnalysis,
            prevSyncDateTime
          );

        // Get recommended candidates using the GCP provider's search method
        recommendedCandidates =
          await this.gcpProvider.searchRecommendedCandidates(
            searchPrompt,
            searchLimit,
            prevSyncDateTime
          );

        logger.info('Found recommended candidates via AI recommendations', {
          context:
            'SupportJobPostingRecommendationService.getJobRecommendationsPreview',
          jobPostingId,
          candidateCount: recommendedCandidates.length,
        });
      }

      // Get detailed candidate information
      const allRecommendations = await this.enrichCandidateRecommendations(
        recommendedCandidates,
        jobPostingId
      );

      // Apply search filter if provided (this is the existing search functionality)
      let filteredRecommendations = allRecommendations;
      if (pagination.search?.trim()) {
        const searchTerm = pagination.search.trim().toLowerCase();
        filteredRecommendations = allRecommendations.filter((rec) => {
          // Search in candidate name, email, skills, and match reason
          const candidateName = rec.candidate.name.toLowerCase();
          const candidateEmail = rec.candidate.email.toLowerCase();
          const candidateSkills = (rec.candidate.skills || [])
            .join(' ')
            .toLowerCase();
          const matchReason = rec.matchReason.join(' ').toLowerCase();
          const groundingInfo = rec.groundingInfo.toLowerCase();

          return (
            candidateName.includes(searchTerm) ||
            candidateEmail.includes(searchTerm) ||
            candidateSkills.includes(searchTerm) ||
            matchReason.includes(searchTerm) ||
            groundingInfo.includes(searchTerm)
          );
        });

        logger.info('Applied search filter to recommendations', {
          context:
            'SupportJobPostingRecommendationService.getJobRecommendationsPreview',
          jobPostingId,
          searchTerm,
          originalCount: allRecommendations.length,
          filteredCount: filteredRecommendations.length,
        });
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      const paginatedRecommendations = filteredRecommendations.slice(
        offset,
        offset + limit
      );
      const totalPages = Math.ceil(filteredRecommendations.length / limit);

      logger.info('Paginated job recommendations preview', {
        context:
          'SupportJobPostingRecommendationService.getJobRecommendationsPreview',
        jobPostingId,
        total: filteredRecommendations.length,
        page,
        limit,
        totalPages,
        returnedItems: paginatedRecommendations.length,
        searchMethod: candidateSearch?.trim()
          ? 'candidate_name_email'
          : 'ai_recommendations',
      });

      return {
        items: paginatedRecommendations,
        pagination: {
          total: filteredRecommendations.length,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      logger.error('Failed to get job recommendations preview', {
        context:
          'SupportJobPostingRecommendationService.getJobRecommendationsPreview',
        jobPostingId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Store selected recommendations to database
   * Only called when recruiter confirms/saves recommendations
   */
  async storeSelectedRecommendations(
    request: ISupportStoreRecommendationsRequest
  ): Promise<ISupportStoreRecommendationsResponse> {
    try {
      logger.info('Storing selected recommendations', {
        context:
          'SupportJobPostingRecommendationService.storeSelectedRecommendations',
        jobPostingId: request.jobPostingId,
        selectedCount: request.selectedCandidateIds.length,
      });

      let stored = 0;
      let skipped = 0;

      // Store each selected recommendation by matching index
      for (let i = 0; i < request.selectedCandidateIds.length; i++) {
        const candidateId = request.selectedCandidateIds[i];
        const rec = request.recommendations[i];

        try {
          await this.prisma.job_posting_recommendation.upsert({
            where: {
              jobPostingId_candidateId: {
                jobPostingId: request.jobPostingId,
                candidateId: candidateId,
              },
            },
            update: {
              score: rec.metadata.semanticScore,
              matchReason: [rec.matchReason], // Convert string to array for storage
              updatedAt: new Date(),
            },
            create: {
              id: uuidv4(),
              jobPostingId: request.jobPostingId,
              candidateId: candidateId,
              score: rec.metadata.semanticScore,
              matchReason: [rec.matchReason], // Convert string to array for storage
              status: JobRecommendationStatusEnum.ACTIVE,
              isViewed: false,
              isSaved: true, // Mark as saved since recruiter explicitly selected it
              isInvited: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
          stored++;
        } catch (error) {
          logger.warn('Failed to store individual recommendation', {
            context:
              'SupportJobPostingRecommendationService.storeSelectedRecommendations',
            candidateId: candidateId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          skipped++;
        }
      }

      // Update job posting's recommendations sync timestamp
      await this.prisma.job_posting.update({
        where: { id: request.jobPostingId },
        data: { recommendationsSync: new Date() },
      });

      logger.info('Successfully stored selected recommendations', {
        context:
          'SupportJobPostingRecommendationService.storeSelectedRecommendations',
        jobPostingId: request.jobPostingId,
        stored,
        skipped,
      });

      return { stored, skipped };
    } catch (error) {
      logger.error('Failed to store selected recommendations', {
        context:
          'SupportJobPostingRecommendationService.storeSelectedRecommendations',
        jobPostingId: request.jobPostingId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get existing stored recommendations for a job posting
   */
  async getStoredRecommendations(
    jobPostingId: string,
    pagination: IPaginationRequest = {}
  ): Promise<IPaginatedResponse<ISupportStoredJobRecommendation>> {
    try {
      const page = pagination.page ?? 1;
      const limit = pagination.limit ?? 25;
      const sortBy = pagination.sortBy ?? 'score';
      const sortOrder = pagination.sortOrder ?? 'desc';
      const offset = (page - 1) * limit;

      logger.info('Getting stored recommendations', {
        context:
          'SupportJobPostingRecommendationService.getStoredRecommendations',
        jobPostingId,
        page,
        limit,
        sortBy,
        sortOrder,
        search: pagination.search,
      });

      // Build search conditions if search term is provided
      const searchConditions = pagination.search?.trim()
        ? {
            OR: [
              {
                candidate: {
                  user: {
                    name: {
                      contains: pagination.search.trim(),
                      mode: 'insensitive' as const,
                    },
                  },
                },
              },
              {
                candidate: {
                  user: {
                    email: {
                      contains: pagination.search.trim(),
                      mode: 'insensitive' as const,
                    },
                  },
                },
              },
              {
                matchReason: {
                  has: pagination.search.trim(),
                },
              },
            ],
          }
        : {};

      const [recommendations, total] = await Promise.all([
        this.prisma.job_posting_recommendation.findMany({
          where: {
            jobPostingId,
            status: JobRecommendationStatusEnum.ACTIVE,
            ...searchConditions,
          },
          include: {
            candidate: {
              select: {
                id: true,
                isImportedCandidate: true,
                importedIntegrationId: true,
                user: true,
              },
            },
          },
          orderBy: this.buildSortOrder(sortBy, sortOrder),
          take: limit,
          skip: offset,
        }),
        this.prisma.job_posting_recommendation.count({
          where: {
            jobPostingId,
            status: JobRecommendationStatusEnum.ACTIVE,
            ...searchConditions,
          },
        }),
      ]);

      // Transform to domain objects
      const domainRecommendations = recommendations.map((rec) => ({
        id: rec.id,
        jobPostingId: rec.jobPostingId,
        candidateId: rec.candidateId,
        score: rec.score,
        matchReason: rec.matchReason,
        isViewed: rec.isViewed,
        isSaved: rec.isSaved,
        isInvited: rec.isInvited,
        status: rec.status as JobRecommendationStatusEnum,
        candidate: rec.candidate
          ? {
              id: rec.candidate.id,
              name: rec.candidate.user.name,
              email: rec.candidate.user.email,
              profilePicture: rec.candidate.user.image || undefined,
              skills: (rec.candidate as any).skills || [],
              experience: (rec.candidate as any).experience || 0,
              currentLocation:
                (rec.candidate as any).currentLocation || undefined,
              expectedSalary:
                (rec.candidate as any).expectedSalary || undefined,
              isImportedCandidate: rec.candidate.isImportedCandidate,
              importedIntegrationId:
                rec.candidate.importedIntegrationId || undefined,
            }
          : undefined,
        createdAt: rec.createdAt,
        updatedAt: rec.updatedAt,
      }));

      const totalPages = Math.ceil(total / limit);

      logger.info('Retrieved stored recommendations', {
        context:
          'SupportJobPostingRecommendationService.getStoredRecommendations',
        jobPostingId,
        total,
        page,
        limit,
        totalPages,
        returnedItems: domainRecommendations.length,
        searchApplied: !!pagination.search?.trim(),
      });

      return {
        items: domainRecommendations,
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      logger.error('Failed to get stored recommendations', {
        context:
          'SupportJobPostingRecommendationService.getStoredRecommendations',
        jobPostingId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Private method to enrich search results with candidate details
   */
  private async enrichCandidateRecommendations(
    searchResults: ISearchResult[],
    _jobPostingId: string
  ): Promise<ISupportJobRecommendationPreview[]> {
    const candidateIds = searchResults.map((result) => result.id);

    // Get detailed candidate information
    const candidates = await this.prisma.candidate.findMany({
      where: {
        id: { in: candidateIds },
      },
      select: {
        id: true,
        isImportedCandidate: true,
        importedIntegrationId: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // Create a map for quick lookup
    const candidateMap = new Map(candidates.map((c) => [c.id, c]));

    // Enrich search results with candidate details
    return searchResults.map((result) => {
      const candidate = candidateMap.get(result.id);

      return {
        id: uuidv4(), // Generate preview ID
        candidateId: result.id,
        score: result.score,
        matchReason: [result.groundingInfo || 'AI recommendation'],
        aiScore: result.metadata?.aiScore || result.score * 100,
        groundingInfo: result.groundingInfo || 'No grounding info available',
        candidate: candidate
          ? {
              id: candidate.id,
              name: candidate.user.name,
              email: candidate.user.email,
              profilePicture: candidate.user.image || undefined,
              skills: (candidate as any).skills || [],
              experience: (candidate as any).experience || 0,
              currentLocation: (candidate as any).currentLocation || undefined,
              expectedSalary: (candidate as any).expectedSalary || undefined,
              isImportedCandidate: candidate.isImportedCandidate,
              importedIntegrationId:
                candidate.importedIntegrationId || undefined,
            }
          : {
              id: result.id,
              name: 'Unknown Candidate',
              email: 'unknown@example.com',
              isImportedCandidate: false,
              importedIntegrationId: undefined,
            },
        metadata: {
          semanticScore: result.metadata?.semanticScore || 0,
          skillMatchScore: result.metadata?.skillMatchScore || 0,
          experienceMatchScore: result.metadata?.experienceMatchScore || 0,
          industryMatchScore: result.metadata?.industryMatchScore || 0,
          locationMatchScore: result.metadata?.locationMatchScore || 0,
          aiScore: result.metadata?.aiScore || result.score * 100,
          aiRecommendation: result.metadata?.aiRecommendation || '',
          overallGroundingInfo:
            result.metadata?.overallGroundingInfo || result.groundingInfo || '',
        },
      };
    });
  }

  /**
   * Private method to get job posting search terms
   * Copied from GCP provider for consistency
   */
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
   * Private method to build sort order for Prisma queries
   */
  private buildSortOrder(
    sortBy: string,
    sortOrder: 'asc' | 'desc'
  ): Record<string, 'asc' | 'desc'>[] {
    const allowedSortFields = ['score', 'createdAt', 'updatedAt'];
    const field = allowedSortFields.includes(sortBy) ? sortBy : 'score';

    // Default sorting: primary field + createdAt as secondary
    if (field === 'createdAt') {
      return [{ [field]: sortOrder }];
    }

    return [{ [field]: sortOrder }, { createdAt: 'desc' }];
  }

  /**
   * Private method to search candidates by name or email in embeddings
   * This method searches through the candidate_embeddings table for candidates
   * whose names or emails match the search term
   */
  private async searchCandidatesByNameOrEmail(
    searchTerm: string,
    limit: number,
    jobPostingId: string
  ): Promise<ISearchResult[]> {
    try {
      logger.info('Searching candidates by name/email in embeddings', {
        context:
          'SupportJobPostingRecommendationService.searchCandidatesByNameOrEmail',
        searchTerm,
        limit,
        jobPostingId,
      });

      // Search for candidates by name or email using proper Prisma queries
      const candidates = await this.prisma.candidate.findMany({
        where: {
          user: {
            OR: [
              {
                name: {
                  contains: searchTerm,
                  mode: 'insensitive' as const,
                },
              },
              {
                email: {
                  contains: searchTerm,
                  mode: 'insensitive' as const,
                },
              },
            ],
          },
        },
        select: {
          id: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        take: limit,
      });

      // Check which candidates have embeddings
      const candidateIds = candidates.map((c) => c.id);
      const embeddings = await this.prisma.candidate_embeddings.findMany({
        where: {
          candidateId: { in: candidateIds },
        },
        select: {
          candidateId: true,
          data: true,
        },
      });

      // Create a map for quick lookup
      const embeddingMap = new Map(
        embeddings.map((e) => [e.candidateId, e.data as any])
      );

      logger.info('Found candidates by name/email search', {
        context:
          'SupportJobPostingRecommendationService.searchCandidatesByNameOrEmail',
        searchTerm,
        foundCount: candidates.length,
        withEmbeddings: embeddings.length,
      });

      // Use the same approach as getJobRecommendationsPreview to get proper grounding info
      // Get job search terms for context
      const { jobSearchTerms } =
        await this.getJobPostingSearchTerms(jobPostingId);

      // Get feedback for better recommendations
      const feedback =
        await this.promptGenerator.getCandidateRecommendationFeedback(
          jobPostingId, // Using jobPostingId instead of clientId for consistency
          5,
          10
        );

      const feedbackAnalysis =
        this.promptGenerator.analyzeFeedbackPatterns(feedback);

      // Generate search prompt with feedback
      const searchPrompt =
        await JobRecommendationPromptGenerator.generateJobRecommendationPromptWithFeedback(
          jobSearchTerms,
          feedbackAnalysis,
          undefined // No prevSyncDateTime for name/email search
        );

      // Get proper grounding info using GCP provider for each candidate
      const enrichedResults: ISearchResult[] = [];

      for (const candidate of candidates) {
        const embeddingData = embeddingMap.get(candidate.id);

        if (embeddingData) {
          // Use GCP provider to get proper grounding info for this candidate
          const candidateResults =
            await this.gcpProvider.searchRecommendedCandidates(
              searchPrompt,
              1, // Just get 1 result for this specific candidate
              undefined // No prevSyncDateTime
            );

          if (candidateResults.length > 0) {
            // Use the GCP result which has proper grounding info
            enrichedResults.push({
              ...candidateResults[0],
              id: candidate.id, // Ensure we use the correct candidate ID
            });
          } else {
            // Fallback to basic info if GCP search fails
            enrichedResults.push({
              id: candidate.id,
              score: 0.8,
              metadata: {
                ...(embeddingData?.metadata || {}),
                semanticScore: 0.8,
                skillMatchScore: 0,
                experienceMatchScore: 0,
                industryMatchScore: 0,
                locationMatchScore: 0,
                aiScore: 80,
                aiRecommendation: 'Found by name/email search',
                overallGroundingInfo: `Candidate found by searching for: ${searchTerm}`,
              },
              groundingInfo: `Candidate found by searching for: ${searchTerm}`,
            });
          }
        }
      }

      return enrichedResults;
    } catch (error) {
      logger.error('Failed to search candidates by name/email', {
        context:
          'SupportJobPostingRecommendationService.searchCandidatesByNameOrEmail',
        searchTerm,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Return empty array on error, allowing fallback to AI recommendations
      return [];
    }
  }
}
