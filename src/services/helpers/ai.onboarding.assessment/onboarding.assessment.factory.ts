import { IOnboardingAssessmentProvider } from './onboarding.assessment.provider';
import { GcpVertexOnboardingAssessmentProvider } from './providers/gpc.vertex.onboarding.assessment.provider';
import { LocalOnboardingAssessmentProvider } from './providers/local.onboarding.assessment.provider';

import { ENV } from '@/config/env';

export enum OnboardingAssessmentProvider {
  LOCAL = 'local',
  GCP_VERTEX = 'gcp-vertex',
}

export class OnboardingAssessmentFactory {
  private static instance: OnboardingAssessmentFactory;
  private providers: Map<string, IOnboardingAssessmentProvider>;

  private constructor() {
    this.providers = new Map();
    this.initializeProviders();
  }

  public static getInstance(): OnboardingAssessmentFactory {
    if (!OnboardingAssessmentFactory.instance) {
      OnboardingAssessmentFactory.instance = new OnboardingAssessmentFactory();
    }
    return OnboardingAssessmentFactory.instance;
  }

  private initializeProviders(): void {
    const providerName = ENV.RESUME_ASSESSMENT_PROVIDER;

    if (providerName === OnboardingAssessmentProvider.LOCAL) {
      this.providers.set(
        OnboardingAssessmentProvider.LOCAL,
        new LocalOnboardingAssessmentProvider()
      );
    } else if (providerName === OnboardingAssessmentProvider.GCP_VERTEX) {
      this.providers.set(
        OnboardingAssessmentProvider.GCP_VERTEX,
        new GcpVertexOnboardingAssessmentProvider()
      );
    } else {
      throw new Error(`Invalid resume assessment provider: ${providerName}`);
    }
  }

  /**
   * Get a onboarding assessment provider by name
   * @param providerName The name of the provider to get
   * @returns The onboarding assessment provider
   * @throws Error if the provider is not found
   */
  public getProvider(): IOnboardingAssessmentProvider {
    const providerName = ENV.ONBOARDING_ASSESSMENT_PROVIDER;
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Resume assessment provider not found: ${providerName}`);
    }
    return provider;
  }
}
