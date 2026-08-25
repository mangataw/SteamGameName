import { backendService } from "./backend";
import bundledCatalogJson from "../../data/translations.zh-CN.json";
import type { CatalogStatus, TranslationCatalog } from "../types/catalog";
import type { DisplayMode, PluginSettings } from "../types/settings";
import { buildCatalogSearchIndex, type CatalogSearchIndex } from "../translation/matchesCatalogSearch";

export interface TranslationSnapshot {
  catalog: TranslationCatalog;
  settings: PluginSettings;
  status: CatalogStatus;
  searchIndex: CatalogSearchIndex;
  version: number;
}

const bundledCatalog = bundledCatalogJson as TranslationCatalog;
let snapshot: TranslationSnapshot = {
  catalog: bundledCatalog,
  settings: { schemaVersion: 1, displayMode: "bilingual" },
  status: {
    source: "bundled", state: "bundled", entryCount: 0, etag: null, lastModified: null,
    lastCheckedAt: null, lastSuccessfulUpdateAt: null, error: null, patchCompatible: true,
  },
  searchIndex: buildCatalogSearchIndex(bundledCatalog),
  // The frontend export can be called before backend RPC initialization. Start
  // with the bundled catalog so that first call is useful without embedding the
  // complete catalog in the Steam UI patch string.
  version: 1,
};
const listeners = new Set<() => void>();
let settingsEpoch = 0;
let patchCompatibilityReported = false;

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
    const epochAtStart = settingsEpoch;
    const [catalog, settings, status] = await Promise.all([
      backendService.getCatalog(), backendService.getSettings(), backendService.getStatus(),
    ]);
    publish({
      catalog,
      settings: epochAtStart === settingsEpoch ? settings : snapshot.settings,
      status,
      searchIndex: catalog === snapshot.catalog ? snapshot.searchIndex : buildCatalogSearchIndex(catalog),
    });
  },
  async reload(): Promise<void> {
    await this.initialize();
  },
  async reportPatchCompatible(): Promise<void> {
    if (patchCompatibilityReported) return;
    patchCompatibilityReported = true;
    await backendService.reportPatchCompatible();
    await this.reload();
  },
  async setMode(mode: DisplayMode): Promise<void> {
    const requestEpoch = ++settingsEpoch;
    const settings = await backendService.setDisplayMode(mode);
    if (requestEpoch !== settingsEpoch) return;
    publish({
      catalog: snapshot.catalog,
      status: snapshot.status,
      settings,
      searchIndex: snapshot.searchIndex,
    });
  },
  async refresh(force = true): Promise<void> {
    await backendService.refreshCatalog(force);
    await this.reload();
  },
};
