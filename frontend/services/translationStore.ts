import { backendService } from "./backend";
import type { CatalogStatus, TranslationCatalog } from "../types/catalog";
import type { DisplayMode, PluginSettings } from "../types/settings";

export interface TranslationSnapshot {
  catalog: TranslationCatalog;
  settings: PluginSettings;
  status: CatalogStatus;
  version: number;
}

const emptyCatalog: TranslationCatalog = { schemaVersion: 1, games: {} };
let snapshot: TranslationSnapshot = {
  catalog: emptyCatalog,
  settings: { schemaVersion: 1, displayMode: "bilingual" },
  status: {
    source: "bundled", state: "内置", entryCount: 0, etag: null, lastModified: null,
    lastCheckedAt: null, lastSuccessfulUpdateAt: null, error: null, patchCompatible: true,
  },
  version: 0,
};
const listeners = new Set<() => void>();

function publish(next: Omit<TranslationSnapshot, "version">): void {
  snapshot = { ...next, version: snapshot.version + 1 };
  listeners.forEach((listener) => listener());
}

export const translationStore = {
  getSnapshot: () => snapshot,
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  async initialize(): Promise<void> {
    const [catalog, settings, status] = await Promise.all([
      backendService.getCatalog(), backendService.getSettings(), backendService.getStatus(),
    ]);
    publish({ catalog, settings, status });
  },
  async reload(): Promise<void> {
    await this.initialize();
  },
  async setMode(mode: DisplayMode): Promise<void> {
    const settings = await backendService.setDisplayMode(mode);
    publish({ catalog: snapshot.catalog, status: snapshot.status, settings });
  },
  async refresh(): Promise<void> {
    await backendService.refreshCatalog(true);
    await this.reload();
  },
};

