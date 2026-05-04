import { ICandidateRecommendationProvider } from './candidate.recommendation.provider';
import { GcpVertexCandidateRecommendationProvider } from './providers/gcp.vertex.candidate.recommendation.provider';
import { ENV } from '@/config/env';

export enum CandidateRecommendationProvider {
  GCP_VERTEX = 'gcp-vertex',
}

export class CandidateRecommendationFactory {
  private static instance: CandidateRecommendationFactory;
  private providers: Map<string, ICandidateRecommendationProvider>;

  private constructor() {
    this.providers = new Map();
    this.initializeProviders();
  }

  public static getInstance(): CandidateRecommendationFactory {
    if (!CandidateRecommendationFactory.instance) {
      CandidateRecommendationFactory.instance =
        new CandidateRecommendationFactory();
    }
    return CandidateRecommendationFactory.instance;
  }

  private initializeProviders(): void {
    const providerName =
      ENV.RAG_PROVIDER || CandidateRecommendationProvider.GCP_VERTEX;

    if (providerName === CandidateRecommendationProvider.GCP_VERTEX) {
      this.providers.set(
        CandidateRecommendationProvider.GCP_VERTEX,
        new GcpVertexCandidateRecommendationProvider()
      );
    } else {
      throw new Error(
        `Invalid candidate recommendation provider: ${providerName}`
      );
    }
  }

  /**
   * Get a candidate recommendation provider
   * @returns The candidate recommendation provider
   * @throws Error if the provider is not found
   */
  public getProvider(): ICandidateRecommendationProvider {
    const providerName =
      ENV.RAG_PROVIDER || CandidateRecommendationProvider.GCP_VERTEX;
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(
        `Candidate recommendation provider not found: ${providerName}`
      );
    }
    return provider;
  }
}
