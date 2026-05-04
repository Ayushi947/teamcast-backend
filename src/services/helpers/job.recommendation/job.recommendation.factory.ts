import { IJobRecommendationProvider } from './job.recommendation.provider';
import { GcpVertexJobRecommendationProvider } from './providers/gcp.vertex.job.recommendation.provider';
import { ENV } from '@/config/env';

export enum JobRecommendationProvider {
  GCP_VERTEX = 'gcp-vertex',
}

export class JobRecommendationFactory {
  private static instance: JobRecommendationFactory;
  private providers: Map<string, IJobRecommendationProvider>;

  private constructor() {
    this.providers = new Map();
    this.initializeProviders();
  }

  public static getInstance(): JobRecommendationFactory {
    if (!JobRecommendationFactory.instance) {
      JobRecommendationFactory.instance = new JobRecommendationFactory();
    }
    return JobRecommendationFactory.instance;
  }

  private initializeProviders(): void {
    const providerName =
      ENV.RAG_PROVIDER || JobRecommendationProvider.GCP_VERTEX;

    if (providerName === JobRecommendationProvider.GCP_VERTEX) {
      this.providers.set(
        JobRecommendationProvider.GCP_VERTEX,
        new GcpVertexJobRecommendationProvider()
      );
    } else {
      throw new Error(`Invalid job recommendation provider: ${providerName}`);
    }
  }

  /**
   * Get a job recommendation provider
   * @returns The job recommendation provider
   * @throws Error if the provider is not found
   */
  public getProvider(): IJobRecommendationProvider {
    const providerName =
      ENV.RAG_PROVIDER || JobRecommendationProvider.GCP_VERTEX;
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Job recommendation provider not found: ${providerName}`);
    }
    return provider;
  }
}
