import { IStorageProvider } from './storage.interface';
import { GcpStorageProvider } from './provider/gcp.provider';
import { LocalStorageProvider } from './provider/local.provider';
import { ENV } from '@/config/env';

export enum StorageProvider {
  GCP = 'gcp',
  LOCAL = 'local',
  // Add other providers as needed (e.g., AWS, AZURE)
}

export class StorageFactory {
  private static instance: StorageFactory;
  private providers: Map<string, IStorageProvider>;
  private constructor() {
    this.providers = new Map();
    this.initializeProviders();
  }

  public static getInstance(): StorageFactory {
    if (!StorageFactory.instance) {
      StorageFactory.instance = new StorageFactory();
    }
    return StorageFactory.instance;
  }

  private initializeProviders(): void {
    const providerName = ENV.STORAGE_PROVIDER;

    if (providerName === StorageProvider.GCP) {
      this.providers.set(StorageProvider.GCP, new GcpStorageProvider());
    } else if (providerName === StorageProvider.LOCAL) {
      this.providers.set(
        StorageProvider.LOCAL,
        new LocalStorageProvider() as unknown as IStorageProvider
      );
    } else {
      throw new Error(`Invalid storage provider: ${providerName}`);
    }
  }

  /**
   * Returns the appropriate storage service implementation based on configuration
   */
  getProvider(): IStorageProvider {
    const provider = (
      ENV.STORAGE_PROVIDER || StorageProvider.GCP
    ).toLowerCase();

    const storageProvider = this.providers.get(provider);
    if (!storageProvider) {
      throw new Error(`Storage provider not found: ${provider}`);
    }

    return storageProvider;
  }
}
