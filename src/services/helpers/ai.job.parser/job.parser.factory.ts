import { IJobParserProvider } from './job.parser.provider';
import { LocalJobParserProvider } from './providers/local.job.parser.provider';
import { GcpVertexJobParserProvider } from './providers/gcp.vertex.job.parser.provider';
import { ENV } from '@/config/env';

export enum JobParserProvider {
  LOCAL = 'local',
  GCP_VERTEX = 'gcp-vertex',
}

export class JobParserFactory {
  private static instance: JobParserFactory;
  private providers: Map<string, IJobParserProvider>;

  private constructor() {
    this.providers = new Map();
    this.initializeProviders();
  }

  public static getInstance(): JobParserFactory {
    if (!JobParserFactory.instance) {
      JobParserFactory.instance = new JobParserFactory();
    }
    return JobParserFactory.instance;
  }

  private initializeProviders(): void {
    const providerName = ENV.JOB_PARSER_PROVIDER || JobParserProvider.LOCAL;

    if (providerName === JobParserProvider.LOCAL) {
      this.providers.set(JobParserProvider.LOCAL, new LocalJobParserProvider());
    } else if (providerName === JobParserProvider.GCP_VERTEX) {
      this.providers.set(
        JobParserProvider.GCP_VERTEX,
        new GcpVertexJobParserProvider()
      );
    } else {
      throw new Error(`Invalid job parser provider: ${providerName}`);
    }
  }

  /**
   * Get a job parser provider by name
   * @param providerName The name of the provider to get
   * @returns The job parser provider
   * @throws Error if the provider is not found
   */
  public getProvider(): IJobParserProvider {
    const providerName = ENV.JOB_PARSER_PROVIDER || JobParserProvider.LOCAL;
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Job parser provider not found: ${providerName}`);
    }
    return provider;
  }
}
