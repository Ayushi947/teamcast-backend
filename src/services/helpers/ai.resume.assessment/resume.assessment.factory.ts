import { IResumeAssessmentProvider } from './resume.assessment.provider';
import { LocalResumeAssessmentProvider } from './providers/local.resume.assessment.provider';
import { GcpVertexResumeAssessmentProvider } from './providers/gcp.vertex.resume.assessment.provider';
import { ENV } from '@/config/env';

export enum ResumeAssessmentProvider {
  LOCAL = 'local',
  GCP_VERTEX = 'gcp-vertex',
}

export class ResumeAssessmentFactory {
  private static instance: ResumeAssessmentFactory;
  private providers: Map<string, IResumeAssessmentProvider>;

  private constructor() {
    this.providers = new Map();
    this.initializeProviders();
  }

  public static getInstance(): ResumeAssessmentFactory {
    if (!ResumeAssessmentFactory.instance) {
      ResumeAssessmentFactory.instance = new ResumeAssessmentFactory();
    }
    return ResumeAssessmentFactory.instance;
  }

  private initializeProviders(): void {
    const providerName = ENV.RESUME_ASSESSMENT_PROVIDER;

    if (providerName === ResumeAssessmentProvider.LOCAL) {
      this.providers.set(
        ResumeAssessmentProvider.LOCAL,
        new LocalResumeAssessmentProvider()
      );
    } else if (providerName === ResumeAssessmentProvider.GCP_VERTEX) {
      this.providers.set(
        ResumeAssessmentProvider.GCP_VERTEX,
        new GcpVertexResumeAssessmentProvider()
      );
    } else {
      throw new Error(`Invalid resume assessment provider: ${providerName}`);
    }
  }

  /**
   * Get a resume assessment provider by name
   * @param providerName The name of the provider to get
   * @returns The resume assessment provider
   * @throws Error if the provider is not found
   */
  public getProvider(): IResumeAssessmentProvider {
    const providerName = ENV.RESUME_PARSER_PROVIDER;
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Resume assessment provider not found: ${providerName}`);
    }
    return provider;
  }
}
