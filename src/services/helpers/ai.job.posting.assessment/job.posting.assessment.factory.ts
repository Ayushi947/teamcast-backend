import { IJobPostingAssessmentProvider } from './job.posting.assessment.provider';
import { LocalJobPostingAssessmentProvider } from './providers/local.job.posting.assessment.provider';
import { GcpVertexJobPostingAssessmentProvider } from './providers/gcp.vertex.job.posting.assessment.provider';
import { ENV } from '@/config/env';

export enum JobPostingAssessmentProvider {
  LOCAL = 'local',
  GCP_VERTEX = 'gcp-vertex',
}

export class JobPostingAssessmentFactory {
  private static instance: JobPostingAssessmentFactory;
  private providers: Map<string, IJobPostingAssessmentProvider>;

  private constructor() {
    this.providers = new Map();
    this.initializeProviders();
  }

  public static getInstance(): JobPostingAssessmentFactory {
    if (!JobPostingAssessmentFactory.instance) {
      JobPostingAssessmentFactory.instance = new JobPostingAssessmentFactory();
    }
    return JobPostingAssessmentFactory.instance;
  }

  private initializeProviders(): void {
    const providerName = ENV.RESUME_ASSESSMENT_PROVIDER;

    if (providerName === JobPostingAssessmentProvider.LOCAL) {
      this.providers.set(
        JobPostingAssessmentProvider.LOCAL,
        new LocalJobPostingAssessmentProvider()
      );
    } else if (providerName === JobPostingAssessmentProvider.GCP_VERTEX) {
      this.providers.set(
        JobPostingAssessmentProvider.GCP_VERTEX,
        new GcpVertexJobPostingAssessmentProvider()
      );
    } else {
      throw new Error(
        `Invalid job posting assessment provider: ${providerName}`
      );
    }
  }

  /**
   * Get a job posting assessment provider by name
   * @param providerName The name of the provider to get
   * @returns The job posting assessment provider
   * @throws Error if the provider is not found
   */
  public getProvider(): IJobPostingAssessmentProvider {
    const providerName = ENV.RESUME_PARSER_PROVIDER;
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(
        `Job posting assessment provider not found: ${providerName}`
      );
    }
    return provider;
  }
}
