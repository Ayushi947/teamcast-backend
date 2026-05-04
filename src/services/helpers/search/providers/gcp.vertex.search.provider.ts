import {
  ISearchProvider,
  ISearchFilters,
  ISearchResponse,
} from '../search.provider';
import { ISearchResult } from '@/shared/models/domain/search/search.domain';

import { IRagProvider } from '../../rag/rag.provider';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/shared/utils/logger';
import { RagFactory } from '../../rag/rag.factory';
import { CandidatePromptGenerator } from '../../recommendations.search.common.prompts/gcp.vertex.candidate.common.prompt';
import { JobPromptGenerator } from '../../recommendations.search.common.prompts/gcp.vertex.job.common.prompt';
import { StorageFactory } from '../../storage/storage.factory';
import { IStorageProvider } from '../../storage/storage.interface';

export class GcpVertexSearchProvider implements ISearchProvider {
  private readonly ragProvider: IRagProvider;
  private readonly prisma: PrismaClient;
  private readonly storageService: IStorageProvider;

  constructor() {
    this.ragProvider = RagFactory.getInstance().getProvider();
    this.prisma = new PrismaClient();
    this.storageService = StorageFactory.getInstance().getProvider();
  }

  /**
   * Search for jobs using a text query
   */
  async searchJobs(
    query: string,
    limit: number = 10,
    page: number = 1,
    filters?: ISearchFilters
  ): Promise<ISearchResponse> {
    try {
      // Generate enhanced search prompt using common job prompt generator
      const searchPrompt =
        await JobPromptGenerator.generateSimpleJobSearchPrompt(
          query || 'all jobs'
        );

      logger.debug({
        message:
          filters && Object.keys(filters).length > 0
            ? 'Using advanced job search with filters'
            : 'Using mode-based job search prompt',
        context: 'GcpVertexSearchProvider.searchJobs',
        query,
        filters,
        searchPrompt,
      });

      const results = await this.ragProvider.searchJobsWithPrompt(
        searchPrompt,
        limit
      );

      const enrichedResults = await this.enrichJobSearchResults(results);

      // Extract grounding information from the first result's metadata
      const groundingInfo = enrichedResults[0]?.metadata?.groundingInfo;

      return {
        results: enrichedResults,
        total: enrichedResults.length,
        page,
        pageSize: limit,
        groundingInfo,
      };
    } catch (error) {
      logger.error({
        message: 'Failed to search jobs',
        context: 'GcpVertexSearchProvider.searchJobs',
        error: error instanceof Error ? error.message : 'Unknown error',
        query,
      });
      throw error;
    }
  }

  /**
   * Search for candidates using a text query
   */
  async searchCandidates(
    query: string,
    limit: number = 10,
    page: number = 1,
    filters?: ISearchFilters
  ): Promise<ISearchResponse> {
    try {
      // Simply call the common candidate prompt generator with just the query
      const searchPrompt =
        await CandidatePromptGenerator.generateSimpleCandidateSearchPrompt(
          query || 'all candidates'
        );

      logger.debug({
        message: 'Using candidate search prompt via common prompt generator',
        context: 'GcpVertexSearchProvider.searchCandidates',
        query,
        filters,
        promptLength: searchPrompt.length,
      });

      // Use the enhanced prompt for search
      const results = await this.ragProvider.searchCandidates(
        searchPrompt,
        limit
      );
      const enrichedResults = await this.enrichCandidateSearchResults(results);

      return {
        results: enrichedResults,
        total: enrichedResults.length,
        page,
        pageSize: limit,
      };
    } catch (error) {
      logger.error({
        message: 'Failed to search candidates',
        context: 'GcpVertexSearchProvider.searchCandidates',
        error: error instanceof Error ? error.message : 'Unknown error',
        query,
      });
      throw error;
    }
  }

  /**
   * Enrich job search results with additional data
   */
  async enrichJobSearchResults(
    results: ISearchResult[]
  ): Promise<ISearchResult[]> {
    try {
      const enrichedResults = await Promise.all(
        results.map(async (result) => {
          try {
            // Get basic job info (title, company, description)
            const jobPosting = await this.prisma.job_posting.findUnique({
              where: { id: result.id },
              select: {
                title: true,
                description: true,
                client: {
                  select: {
                    company: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            });

            if (jobPosting) {
              const companyName =
                jobPosting.client?.company?.name || 'Unknown Company';

              return {
                ...result,
                name: jobPosting.title,
                email: null, // Jobs don't have email
                jobTitle: jobPosting.title,
                companyName: companyName,
                description: `${companyName} | Experience: ${result.metadata.experience || 'N/A'} years | ${
                  Array.isArray(result.metadata.requiredSkills)
                    ? `Skills: ${result.metadata.requiredSkills.slice(0, 3).join(', ')}`
                    : 'Skills: N/A'
                }`,
              };
            }

            return result;
          } catch (err) {
            logger.error({
              message: 'Failed to enrich job search result',
              context: 'GcpVertexSearchProvider.enrichJobSearchResults',
              error: err instanceof Error ? err.message : 'Unknown error',
              jobId: result.id,
            });
            return result; // Return original result if enrichment fails
          }
        })
      );

      return enrichedResults;
    } catch (error) {
      logger.error({
        message: 'Failed to enrich job search results',
        context: 'GcpVertexSearchProvider.enrichJobSearchResults',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return results; // Return original results if enrichment fails
    }
  }

  /**
   * Enrich candidate search results with additional data
   */
  async enrichCandidateSearchResults(
    results: ISearchResult[]
  ): Promise<ISearchResult[]> {
    try {
      const enrichedResults = await Promise.all(
        results.map(async (result) => {
          try {
            // Get basic candidate info (just name and email for search results)
            const candidate = await this.prisma.candidate.findUnique({
              where: { id: result.id },
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                    jobTitle: true,
                    image: true,
                  },
                },
              },
            });

            let profileImage = candidate?.user?.image;

            if (
              candidate?.user?.image &&
              !candidate?.user?.image.startsWith('http')
            ) {
              profileImage = await this.storageService.generatePreSignedUrl(
                candidate?.user?.image,
                'read'
              );
            }

            if (candidate?.user) {
              return {
                ...result,
                name: candidate.user.name,
                email: candidate.user.email,
                jobTitle: candidate.user.jobTitle,
                image: profileImage,
                description: `Experience: ${result.metadata.experience || 'N/A'} years | Skills: ${
                  Array.isArray(result.metadata.skills)
                    ? result.metadata.skills.slice(0, 3).join(', ')
                    : 'N/A'
                }`,
              };
            }

            return result;
          } catch (err) {
            logger.error({
              message: 'Failed to enrich candidate search result',
              context: 'GcpVertexSearchProvider.enrichCandidateSearchResults',
              error: err instanceof Error ? err.message : 'Unknown error',
              candidateId: result.id,
            });
            return result; // Return original result if enrichment fails
          }
        })
      );

      return enrichedResults;
    } catch (error) {
      logger.error({
        message: 'Failed to enrich candidate search results',
        context: 'GcpVertexSearchProvider.enrichCandidateSearchResults',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return results; // Return original results if enrichment fails
    }
  }
}
