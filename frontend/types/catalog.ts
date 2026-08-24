export interface TranslationCatalog {
  schemaVersion: 1;
  games: Record<string, string>;
}

export type CatalogSource = "bundled" | "cache" | "remote";
export type CatalogState = "bundled" | "cached" | "latest" | "offline" | "error";

export interface CatalogStatus {
  source: CatalogSource;
  state: CatalogState;
  entryCount: number;
  etag: string | null;
  lastModified: string | null;
  lastCheckedAt: string | null;
  lastSuccessfulUpdateAt: string | null;
  error: string | null;
  patchCompatible: boolean;
}
