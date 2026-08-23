export interface TranslationCatalog {
  schemaVersion: 1;
  games: Record<string, string>;
}

export type CatalogSource = "bundled" | "cache" | "remote";
export type CatalogState = "内置" | "缓存" | "最新" | "离线" | "错误";

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

