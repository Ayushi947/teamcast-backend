import { singleton } from '@/shared/decorators/singleton';
import { GcpVertexCandidateRecommendationProvider } from '../helpers/candidate.recommendation/providers/gcp.vertex.candidate.recommendation.provider';
import { ICandidateRecommendation } from '@/shared/models/domain/candidate/recommendation.domain';
import { PrismaClient } from '@prisma/client';
import {
  ISupportJobPosting,
  ISupportJobPostingListResponse,
  toSupportJobPostingDomain,
} from '@/shared/models/domain/support/job.posting.domain';

@singleton
export class CandidateRecommendationsService {
  private readonly prisma: PrismaClient;
  private readonly candidateRecommendationProvider: GcpVertexCandidateRecommendationProvider;

  constructor() {
    this.prisma = new PrismaClient();
    this.candidateRecommendationProvider =
      new GcpVertexCandidateRecommendationProvider();
  }

  async createCandidateRecommendation(
    candidateId: string,
    jobId: string
  ): Promise<ICandidateRecommendation> {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      throw new Error('Candidate not found');
    }

    const job = await this.prisma.job_posting.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new Error('Job not found');
    }

    return this.candidateRecommendationProvider.createCandidateRecommendation(
      candidateId,
      jobId
    );
  }

  async getCandidateRecommendedJobs(
    candidateId: string
  ): Promise<ISupportJobPostingListResponse> {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      throw new Error('Candidate not found');
    }

    const candidateRecommendations =
      await this.prisma.candidate_recommendation.findMany({
        where: {
          candidateId,
        },
      });

    const jobPostings = await this.prisma.job_posting.findMany({
      where: {
        id: {
          in: candidateRecommendations.map(
            (recommendation) => recommendation.jobPostingId
          ),
        },
      },
    });

    const supportJobPostings: ISupportJobPosting[] = jobPostings.map(
      (jobPosting) => toSupportJobPostingDomain(jobPosting)
    );

    return {
      jobPostings: supportJobPostings,
      total: supportJobPostings.length,
    };
  }
}
