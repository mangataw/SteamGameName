import type { CatalogStatus, TranslationCatalog } from "../types/catalog";
import type { DisplayMode, PluginSettings } from "../types/settings";

interface RpcEnvelope<T> {
  ok: boolean;
  data: T | null;
  error: string | null;
}

function decode<T>(payload: unknown): T {
  // Depending on the Millennium/Starlight bridge version, an FFI JSON return
  // can arrive as the original string or as an already decoded object.
  const result = (typeof payload === "string" ? JSON.parse(payload) : payload) as RpcEnvelope<T>;
  if (!result || typeof result !== "object" || typeof result.ok !== "boolean") {
    throw new Error("后端返回格式无效");
  }
  if (!result.ok || result.data === null) throw new Error(result.error ?? "后端返回未知错误");
  return result.data;
}

export const backendService = {
  async getCatalog(): Promise<TranslationCatalog> {
    return decode(await backend.get_catalog());
  },
  async getStatus(): Promise<CatalogStatus> {
    return decode(await backend.get_catalog_status());
  },
  async reportPatchCompatible(): Promise<CatalogStatus> {
    return decode(await backend.report_patch_compatible());
  },
  async getSettings(): Promise<PluginSettings> {
    return decode(await backend.get_settings());
  },
  async setDisplayMode(mode: DisplayMode): Promise<PluginSettings> {
    return decode(await backend.set_display_mode(mode));
  },
  async refreshCatalog(force = true): Promise<CatalogStatus> {
    return decode(await backend.refresh_catalog(force));
  },
};
