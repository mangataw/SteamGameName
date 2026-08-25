import { beforeEach, describe, expect, it, vi } from "vitest";
import { translationStore } from "../../frontend/services/translationStore";
import { matchesCatalogSearch } from "../../frontend/translation/matchesCatalogSearch";

const catalog = { schemaVersion: 1 as const, games: { "620": "传送门 2" } };
const status = {
  source: "bundled" as const,
  state: "bundled",
  entryCount: 1,
  etag: null,
  lastModified: null,
  lastCheckedAt: null,
  lastSuccessfulUpdateAt: null,
  error: null,
  patchCompatible: true,
};

function envelope(data: unknown): string {
  return JSON.stringify({ ok: true, data, error: null });
}

function objectEnvelope(data: unknown): object {
  return { ok: true, data, error: null };
}

const setDisplayMode = vi.fn(async (mode: string) => envelope({ schemaVersion: 1, displayMode: mode }));
const refreshCatalog = vi.fn(async () => envelope(status));

beforeEach(async () => {
  setDisplayMode.mockClear();
  refreshCatalog.mockClear();
  Object.assign(globalThis, {
    backend: {
      get_catalog: async () => envelope(catalog),
      get_catalog_status: async () => envelope(status),
      report_patch_compatible: async () => envelope({ ...status, patchCompatible: true }),
      get_settings: async () => envelope({ schemaVersion: 1, displayMode: "bilingual" }),
      set_display_mode: setDisplayMode,
      refresh_catalog: refreshCatalog,
    },
  });
  await translationStore.initialize();
});

describe("translationStore display mode", () => {
  it("uses a non-forced refresh for the automatic startup check", async () => {
    await translationStore.refresh(false);

    expect(refreshCatalog).toHaveBeenCalledWith(false);
  });

  it("forces user-requested refreshes by default", async () => {
    await translationStore.refresh();

    expect(refreshCatalog).toHaveBeenCalledWith(true);
  });

  it("publishes the persisted mode to every subscriber", async () => {
    const listener = vi.fn();
    const unsubscribe = translationStore.subscribe(listener);

    await translationStore.setMode("chinese");

    expect(setDisplayMode).toHaveBeenCalledWith("chinese");
    expect(translationStore.getSnapshot().settings.displayMode).toBe("chinese");
    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
  });

  it("keeps the current snapshot when persistence fails", async () => {
    setDisplayMode.mockResolvedValueOnce(JSON.stringify({ ok: false, data: null, error: "write_failed" }));
    const before = translationStore.getSnapshot();

    await expect(translationStore.setMode("chinese")).rejects.toThrow("write_failed");

    expect(translationStore.getSnapshot()).toBe(before);
  });

  it("does not let an older reload overwrite a newly persisted mode", async () => {
    let finishOlderRead: ((value: string) => void) | undefined;
    const olderRead = new Promise<string>((resolve) => { finishOlderRead = resolve; });
    const testBackend = (globalThis as typeof globalThis & { backend: { get_settings: () => Promise<string> } }).backend;
    testBackend.get_settings = () => olderRead;

    const reload = translationStore.reload();
    await translationStore.setMode("chinese");
    finishOlderRead?.(envelope({ schemaVersion: 1, displayMode: "bilingual" }));
    await reload;

    expect(translationStore.getSnapshot().settings.displayMode).toBe("chinese");
  });

  it("accepts decoded RPC objects and restores the persisted mode on reload", async () => {
    let persistedMode = "bilingual";
    Object.assign(globalThis, {
      backend: {
        get_catalog: async () => objectEnvelope(catalog),
        get_catalog_status: async () => objectEnvelope(status),
        report_patch_compatible: async () => objectEnvelope({ ...status, patchCompatible: true }),
        get_settings: async () => objectEnvelope({ schemaVersion: 1, displayMode: persistedMode }),
        set_display_mode: async (mode: string) => {
          persistedMode = mode;
          return objectEnvelope({ schemaVersion: 1, displayMode: mode });
        },
        refresh_catalog: async () => objectEnvelope(status),
      },
    });

    await translationStore.setMode("chinese");
    await translationStore.reload();

    expect(persistedMode).toBe("chinese");
    expect(translationStore.getSnapshot().settings.displayMode).toBe("chinese");
    expect(translationStore.getSnapshot().status.entryCount).toBe(1);
  });

  it("atomically rebuilds the in-memory search index when the catalog changes", async () => {
    const testBackend = (globalThis as typeof globalThis & {
      backend: { get_catalog: () => Promise<string> };
    }).backend;
    testBackend.get_catalog = async () => envelope({
      schemaVersion: 1,
      games: { "730": "反恐精英 2" },
    });

    await translationStore.reload();

    const snapshot = translationStore.getSnapshot();
    expect(matchesCatalogSearch(730, "反恐精英", snapshot.searchIndex)).toBe(true);
    expect(matchesCatalogSearch(620, "传送门", snapshot.searchIndex)).toBe(false);
  });

});
