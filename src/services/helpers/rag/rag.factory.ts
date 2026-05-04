import { IRagProvider, RagProvider } from './rag.provider';
import { GcpVertexRagProvider } from './providers/gcp.vertex.rag.provider';
import { ENV } from '@/config/env';

export class RagFactory {
  private static instance: RagFactory;
  private providers: Map<string, IRagProvider>;

  private constructor() {
    this.providers = new Map();
    this.initializeProviders();
  }

  public static getInstance(): RagFactory {
    if (!RagFactory.instance) {
      RagFactory.instance = new RagFactory();
    }
    return RagFactory.instance;
  }

  private initializeProviders(): void {
    const providerName = ENV.RAG_PROVIDER || RagProvider.GCP_VERTEX;

    if (providerName === RagProvider.GCP_VERTEX) {
      this.providers.set(RagProvider.GCP_VERTEX, new GcpVertexRagProvider());
    } else {
      throw new Error(`Invalid RAG provider: ${providerName}`);
    }
  }

  /**
   * Get a RAG provider
   * @returns The RAG provider
   * @throws Error if the provider is not found
   */
  public getProvider(): IRagProvider {
    const providerName = ENV.RAG_PROVIDER || RagProvider.GCP_VERTEX;
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`RAG provider not found: ${providerName}`);
    }
    return provider;
  }
}
