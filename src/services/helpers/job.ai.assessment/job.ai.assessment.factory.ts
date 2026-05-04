import { IJobAiAssessmentProvider } from './job.ai.assessment.provider';
import { GcpVertexJobAiAssessmentProvider } from './providers/gpc.vertex.job.ai.assessment.provider';
import { LocalJobAiAssessmentProvider } from './providers/local.job.ai.assessment.provider';

import { ENV } from '@/config/env';

export enum JobAiAssessmentProvider {
  LOCAL = 'local',
  GCP_VERTEX = 'gcp-vertex',
}

export class JobAiAssessmentFactory {
  private static instance: JobAiAssessmentFactory;
  private providers: Map<string, IJobAiAssessmentProvider>;

  private constructor() {
    this.providers = new Map();
    this.initializeProviders();
  }

  public static getInstance(): JobAiAssessmentFactory {
    if (!JobAiAssessmentFactory.instance) {
      JobAiAssessmentFactory.instance = new JobAiAssessmentFactory();
    }
    return JobAiAssessmentFactory.instance;
  }

  private initializeProviders(): void {
    const providerName = ENV.RESUME_ASSESSMENT_PROVIDER;

    if (providerName === JobAiAssessmentProvider.LOCAL) {
      this.providers.set(
        JobAiAssessmentProvider.LOCAL,
        new LocalJobAiAssessmentProvider()
      );
    } else if (providerName === JobAiAssessmentProvider.GCP_VERTEX) {
      this.providers.set(
        JobAiAssessmentProvider.GCP_VERTEX,
        new GcpVertexJobAiAssessmentProvider()
      );
    } else {
      throw new Error(`Invalid resume assessment provider: ${providerName}`);
    }
  }

  /**
   * Get a job.ai assessment provider by name
   * @param providerName The name of the provider to get
   * @returns The job.ai assessment provider
   * @throws Error if the provider is not found
   */
  public getProvider(): IJobAiAssessmentProvider {
    const providerName = ENV.ONBOARDING_ASSESSMENT_PROVIDER;
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Resume assessment provider not found: ${providerName}`);
    }
    return provider;
  }
}
