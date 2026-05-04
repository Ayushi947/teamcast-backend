import { GoogleAuth } from 'google-auth-library';
import { VertexAI } from '@google-cloud/vertexai';
import { Storage } from '@google-cloud/storage';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { SpeechClient } from '@google-cloud/speech';
import { VideoIntelligenceServiceClient } from '@google-cloud/video-intelligence';
import { ENV } from './env';
import { logger } from '@/shared/utils/logger';
import fs from 'fs';

/**
 * Google Cloud Platform configuration and client initialization
 * Supports both Workload Identity (for GKE) and Service Account Key authentication
 */
export class GCPConfig {
  private static instance: GCPConfig;
  private googleAuth!: GoogleAuth;
  private constructor() {
    this.initializeAuth();
  }

  public static getInstance(): GCPConfig {
    if (!GCPConfig.instance) {
      GCPConfig.instance = new GCPConfig();
    }
    return GCPConfig.instance;
  }

  private initializeAuth(): void {
    const authOptions: any = {
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      projectId: ENV.GOOGLE_CLOUD_PROJECT_ID,
    };

    // Check if we're using workload identity (in GKE) or service account key
    if (
      ENV.GOOGLE_APPLICATION_CREDENTIALS &&
      this.fileExists(ENV.GOOGLE_APPLICATION_CREDENTIALS)
    ) {
      // Using service account key file (only if file exists)
      authOptions.keyFilename = ENV.GOOGLE_APPLICATION_CREDENTIALS;
      logger.info('Using Google Cloud Service Account Key authentication', {
        context: 'GCPConfig.initializeAuth',
        keyFile: ENV.GOOGLE_APPLICATION_CREDENTIALS,
      });
    } else if (ENV.GOOGLE_CLOUD_CLIENT_EMAIL && ENV.GOOGLE_CLOUD_PRIVATE_KEY) {
      // Using environment variables for service account
      authOptions.credentials = {
        client_email: ENV.GOOGLE_CLOUD_CLIENT_EMAIL,
        private_key: ENV.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
      };
      logger.info(
        'Using Google Cloud Service Account credentials from environment',
        {
          context: 'GCPConfig.initializeAuth',
          clientEmail: ENV.GOOGLE_CLOUD_CLIENT_EMAIL,
        }
      );
    } else {
      // Using workload identity (default credentials in GKE)
      if (
        ENV.GOOGLE_APPLICATION_CREDENTIALS &&
        !this.fileExists(ENV.GOOGLE_APPLICATION_CREDENTIALS)
      ) {
        logger.warn(
          'GOOGLE_APPLICATION_CREDENTIALS file not found, falling back to Workload Identity',
          {
            context: 'GCPConfig.initializeAuth',
            keyFile: ENV.GOOGLE_APPLICATION_CREDENTIALS,
          }
        );
      }
      logger.info('Using Google Cloud Workload Identity authentication', {
        context: 'GCPConfig.initializeAuth',
        projectId: ENV.GOOGLE_CLOUD_PROJECT_ID,
      });
    }

    this.googleAuth = new GoogleAuth(authOptions);
  }

  /**
   * Get Google Auth instance
   */
  public getAuth(): GoogleAuth {
    return this.googleAuth;
  }

  /**
   * Get Vertex AI instance
   */
  public getVertexAI(): VertexAI {
    const vertexAI = new VertexAI({
      project: ENV.GOOGLE_CLOUD_PROJECT_ID,
      location: ENV.GOOGLE_CLOUD_VERTEX_AI_LOCATION,
      // Let VertexAI use the default credentials (workload identity or ADC)
    });

    return vertexAI;
  }

  /**
   * Get Cloud Storage instance
   */
  public getStorage(): Storage {
    const storageOptions: any = {
      projectId: ENV.GOOGLE_CLOUD_PROJECT_ID,
    };

    // Only set credentials if using service account key
    if (
      ENV.GOOGLE_APPLICATION_CREDENTIALS &&
      this.fileExists(ENV.GOOGLE_APPLICATION_CREDENTIALS)
    ) {
      storageOptions.keyFilename = ENV.GOOGLE_APPLICATION_CREDENTIALS;
    } else if (ENV.GOOGLE_CLOUD_CLIENT_EMAIL && ENV.GOOGLE_CLOUD_PRIVATE_KEY) {
      storageOptions.credentials = {
        client_email: ENV.GOOGLE_CLOUD_CLIENT_EMAIL,
        private_key: ENV.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
      };
    }
    // For workload identity, no credentials needed - uses default

    return new Storage(storageOptions);
  }

  /**
   * Get Text-to-Speech client
   */
  public getTextToSpeechClient(): TextToSpeechClient {
    const clientOptions: any = {};

    if (
      ENV.GOOGLE_APPLICATION_CREDENTIALS &&
      this.fileExists(ENV.GOOGLE_APPLICATION_CREDENTIALS)
    ) {
      clientOptions.keyFilename = ENV.GOOGLE_APPLICATION_CREDENTIALS;
    } else if (ENV.GOOGLE_CLOUD_CLIENT_EMAIL && ENV.GOOGLE_CLOUD_PRIVATE_KEY) {
      clientOptions.credentials = {
        client_email: ENV.GOOGLE_CLOUD_CLIENT_EMAIL,
        private_key: ENV.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
      };
    }
    // For workload identity, no credentials needed

    return new TextToSpeechClient(clientOptions);
  }

  /**
   * Get Speech-to-Text client
   */
  public getSpeechClient(): SpeechClient {
    const clientOptions: any = {};

    if (
      ENV.GOOGLE_APPLICATION_CREDENTIALS &&
      this.fileExists(ENV.GOOGLE_APPLICATION_CREDENTIALS)
    ) {
      clientOptions.keyFilename = ENV.GOOGLE_APPLICATION_CREDENTIALS;
    } else if (ENV.GOOGLE_CLOUD_CLIENT_EMAIL && ENV.GOOGLE_CLOUD_PRIVATE_KEY) {
      clientOptions.credentials = {
        client_email: ENV.GOOGLE_CLOUD_CLIENT_EMAIL,
        private_key: ENV.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
      };
    }
    // For workload identity, no credentials needed

    return new SpeechClient(clientOptions);
  }

  /**
   * Get Video Intelligence client
   */
  public getVideoIntelligenceClient(): VideoIntelligenceServiceClient {
    const clientOptions: any = {};

    if (
      ENV.GOOGLE_APPLICATION_CREDENTIALS &&
      this.fileExists(ENV.GOOGLE_APPLICATION_CREDENTIALS)
    ) {
      clientOptions.keyFilename = ENV.GOOGLE_APPLICATION_CREDENTIALS;
    } else if (ENV.GOOGLE_CLOUD_CLIENT_EMAIL && ENV.GOOGLE_CLOUD_PRIVATE_KEY) {
      clientOptions.credentials = {
        client_email: ENV.GOOGLE_CLOUD_CLIENT_EMAIL,
        private_key: ENV.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
      };
    }
    // For workload identity, no credentials needed

    return new VideoIntelligenceServiceClient(clientOptions);
  }

  /**
   * Verify authentication and log the current method
   */
  public async verifyAuth(): Promise<void> {
    try {
      const projectId = await this.googleAuth.getProjectId();
      logger.info('Google Cloud authentication verified', {
        context: 'GCPConfig.verifyAuth',
        projectId,
        authType: this.getAuthType(),
      });
    } catch (error) {
      logger.error('Google Cloud authentication failed', {
        context: 'GCPConfig.verifyAuth',
        error: error instanceof Error ? error.message : 'Unknown error',
        authType: this.getAuthType(),
      });
      throw error;
    }
  }

  /**
   * Get credentials JSON for services that need serialized credentials
   * Used by LiveKit Egress for GCP upload configuration
   */
  public getCredentialsJson(): any {
    // Try service account key file first
    if (
      ENV.GOOGLE_APPLICATION_CREDENTIALS &&
      this.fileExists(ENV.GOOGLE_APPLICATION_CREDENTIALS)
    ) {
      return JSON.parse(
        fs.readFileSync(ENV.GOOGLE_APPLICATION_CREDENTIALS, 'utf8')
      );
    }

    // Try environment variables
    if (ENV.GOOGLE_CLOUD_CLIENT_EMAIL && ENV.GOOGLE_CLOUD_PRIVATE_KEY) {
      return {
        type: 'service_account',
        project_id: ENV.GOOGLE_CLOUD_PROJECT_ID,
        client_email: ENV.GOOGLE_CLOUD_CLIENT_EMAIL,
        private_key: ENV.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
      };
    }

    // For workload identity, throw error as egress needs explicit credentials
    throw new Error(
      'Egress requires explicit GCP credentials (service account key file or environment variables). ' +
        'Workload Identity is not supported for LiveKit Egress.'
    );
  }

  /**
   * Check if a file exists
   */
  private fileExists(filePath: string): boolean {
    try {
      return fs.existsSync(filePath) && fs.lstatSync(filePath).isFile();
    } catch (_error) {
      return false;
    }
  }

  private getAuthType(): string {
    if (
      ENV.GOOGLE_APPLICATION_CREDENTIALS &&
      this.fileExists(ENV.GOOGLE_APPLICATION_CREDENTIALS)
    ) {
      return 'Service Account Key File';
    } else if (ENV.GOOGLE_CLOUD_CLIENT_EMAIL && ENV.GOOGLE_CLOUD_PRIVATE_KEY) {
      return 'Service Account Environment Variables';
    } else {
      return 'Workload Identity / Application Default Credentials';
    }
  }
}

// Export singleton instance
export const gcpConfig = GCPConfig.getInstance();
