import { IIntegrationProvider } from './integration.provider';
import { LocalJobBoardProvider } from './providers/jobboard/local.jobboard.provider';
import { IndeedJobBoardProvider } from './providers/jobboard/indeed.jobboard.provider';
import { LocalAtsProvider } from './providers/ats/local.ats.provider';
import { WorkableAtsProvider } from './providers/ats/workable.ats.provider';
import { IntegrationProviderType } from '@/shared/models/common/enums';

export enum IntegrationProvider {
  LOCAL_JOB_BOARD = 'local-jobboard',
  INDEED = 'indeed',
  LOCAL_ATS = 'local-ats',
  WORKABLE = 'Workable',
}

export class IntegrationsFactory {
  private static instance: IntegrationsFactory;
  private providers: Map<string, IIntegrationProvider>;

  private constructor() {
    this.providers = new Map();
    this.initializeProviders();
  }

  public static getInstance(): IntegrationsFactory {
    if (!IntegrationsFactory.instance) {
      IntegrationsFactory.instance = new IntegrationsFactory();
    }
    return IntegrationsFactory.instance;
  }

  private initializeProviders(): void {
    // Initialize local job board provider
    this.providers.set(
      IntegrationProvider.LOCAL_JOB_BOARD,
      new LocalJobBoardProvider()
    );

    // Initialize Indeed job board provider
    this.providers.set(
      IntegrationProvider.INDEED,
      new IndeedJobBoardProvider()
    );

    // Initialize local ATS provider
    this.providers.set(IntegrationProvider.LOCAL_ATS, new LocalAtsProvider());

    // Initialize Workable ATS provider
    this.providers.set(IntegrationProvider.WORKABLE, new WorkableAtsProvider());
  }

  /**
   * Get an integration provider by name
   * @param providerName The name of the provider to get
   * @returns The integration provider
   * @throws Error if the provider is not found
   */
  public getProvider(providerName: string): IIntegrationProvider {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Integration provider not found: ${providerName}`);
    }
    return provider;
  }

  /**
   * Get all available providers
   * @returns Array of all available providers
   */
  public getAllProviders(): IIntegrationProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get providers by type
   * @param type The provider type to filter by
   * @returns Array of providers of the specified type
   */
  public getProvidersByType(
    type: IntegrationProviderType
  ): IIntegrationProvider[] {
    return this.getAllProviders().filter(
      (provider) => provider.getProviderType() === type
    );
  }

  /**
   * Check if a provider exists
   * @param providerName The name of the provider to check
   * @returns True if the provider exists, false otherwise
   */
  public hasProvider(providerName: string): boolean {
    return this.providers.has(providerName);
  }

  /**
   * Get provider names
   * @returns Array of provider names
   */
  public getProviderNames(): string[] {
    return Array.from(this.providers.keys());
  }
}
