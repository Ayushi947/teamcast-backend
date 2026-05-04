import { singleton } from '@/shared/decorators/singleton';
import { ISearchProvider } from './search.provider';
import { GcpVertexSearchProvider } from './providers/gcp.vertex.search.provider';

export enum SearchProviderType {
  GCP_VERTEX = 'gcp_vertex',
}

@singleton
export class SearchFactory {
  private providers: Map<SearchProviderType, ISearchProvider> = new Map();

  /**
   * Get a search provider instance
   * @param type The type of search provider to get
   * @returns The search provider instance
   */
  getProvider(
    type: SearchProviderType = SearchProviderType.GCP_VERTEX
  ): ISearchProvider {
    if (!this.providers.has(type)) {
      this.providers.set(type, this.createProvider(type));
    }
    return this.providers.get(type)!;
  }

  /**
   * Create a new search provider instance
   * @param type The type of search provider to create
   * @returns The search provider instance
   */
  private createProvider(type: SearchProviderType): ISearchProvider {
    switch (type) {
      case SearchProviderType.GCP_VERTEX:
        return new GcpVertexSearchProvider();
      default:
        throw new Error(`Unsupported search provider type: ${type}`);
    }
  }

  /**
   * Get the default search provider instance
   * @returns The default search provider instance
   */
  getDefaultProvider(): ISearchProvider {
    return this.getProvider(SearchProviderType.GCP_VERTEX);
  }
}
