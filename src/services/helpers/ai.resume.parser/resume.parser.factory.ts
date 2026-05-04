import { IResumeParserProvider } from './resume.parser.provider';
import { LocalResumeParserProvider } from './providers/local.resume.parser.provider';
import { GcpVertexResumeParserProvider } from './providers/gcp.vertex.resume.parser.provider';
import { ENV } from '@/config/env';

export enum ResumeParserProvider {
  LOCAL = 'local',
  GCP_VERTEX = 'gcp-vertex',
}

export class ResumeParserFactory {
  private static instance: ResumeParserFactory;
  private providers: Map<string, IResumeParserProvider>;

  private constructor() {
    this.providers = new Map();
    this.initializeProviders();
  }

  public static getInstance(): ResumeParserFactory {
    if (!ResumeParserFactory.instance) {
      ResumeParserFactory.instance = new ResumeParserFactory();
    }
    return ResumeParserFactory.instance;
  }

  private initializeProviders(): void {
    const providerName = ENV.RESUME_PARSER_PROVIDER;

    if (providerName === ResumeParserProvider.LOCAL) {
      this.providers.set(
        ResumeParserProvider.LOCAL,
        new LocalResumeParserProvider()
      );
    } else if (providerName === ResumeParserProvider.GCP_VERTEX) {
      this.providers.set(
        ResumeParserProvider.GCP_VERTEX,
        new GcpVertexResumeParserProvider()
      );
    } else {
      throw new Error(`Invalid resume parser provider: ${providerName}`);
    }
  }

  /**
   * Get a resume parser provider by name
   * @param providerName The name of the provider to get
   * @returns The resume parser provider
   * @throws Error if the provider is not found
   */
  public getProvider(): IResumeParserProvider {
    const providerName = ENV.RESUME_PARSER_PROVIDER;
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Resume parser provider not found: ${providerName}`);
    }
    return provider;
  }
}
