import { IPracticeAssessmentProvider } from './practice.assessment.provider';
import { GcpVertexPracticeAssessmentProvider } from './providers/gcp.vertex.practice.assessment.provider';

export enum PracticeAssessmentProvider {
  GCP_VERTEX = 'gcp-vertex',
}

/**
 * Factory for Practice Assessment Providers
 *
 * This factory provides practice assessment providers that focus on:
 * - Job Description: 65% (Primary focus)
 * - Resume: 35% (Supporting context)
 *
 * NO onboarding assessment data is used.
 */
export class PracticeAssessmentFactory {
  private static instance: PracticeAssessmentFactory;
  private providers: Map<string, IPracticeAssessmentProvider>;

  private constructor() {
    this.providers = new Map();
    this.initializeProviders();
  }

  public static getInstance(): PracticeAssessmentFactory {
    if (!PracticeAssessmentFactory.instance) {
      PracticeAssessmentFactory.instance = new PracticeAssessmentFactory();
    }
    return PracticeAssessmentFactory.instance;
  }

  private initializeProviders(): void {
    // Default to GCP Vertex for practice assessments
    // Can be extended to support other providers in the future
    const providerName = PracticeAssessmentProvider.GCP_VERTEX;

    if (providerName === PracticeAssessmentProvider.GCP_VERTEX) {
      this.providers.set(
        PracticeAssessmentProvider.GCP_VERTEX,
        new GcpVertexPracticeAssessmentProvider()
      );
    } else {
      // Default to GCP Vertex
      this.providers.set(
        PracticeAssessmentProvider.GCP_VERTEX,
        new GcpVertexPracticeAssessmentProvider()
      );
    }
  }

  /**
   * Get the practice assessment provider
   * @returns The practice assessment provider
   */
  public getProvider(): IPracticeAssessmentProvider {
    const providerName = PracticeAssessmentProvider.GCP_VERTEX;
    const provider = this.providers.get(providerName);
    if (!provider) {
      // Return GCP Vertex as default
      return this.providers.get(PracticeAssessmentProvider.GCP_VERTEX)!;
    }
    return provider;
  }
}
