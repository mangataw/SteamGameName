import type { TranslationCatalog } from "../types/catalog";
import type { DisplayMode } from "../types/settings";
import { containsHan } from "./containsHan";

const MAX_APP_ID = 0xffff_ffff;

export function normalizeAppId(appId: unknown): string | null {
  if (typeof appId === "number") {
    return Number.isSafeInteger(appId) && appId > 0 && appId <= MAX_APP_ID ? String(appId) : null;
  }
  if (typeof appId !== "string" || !/^[1-9]\d*$/.test(appId)) return null;
  const parsed = Number(appId);
  return Number.isSafeInteger(parsed) && parsed <= MAX_APP_ID ? appId : null;
}

export function formatDisplayName(
  appId: unknown,
  originalName: unknown,
  catalog: TranslationCatalog,
  mode: DisplayMode,
): unknown {
  if (typeof originalName !== "string" || originalName.length === 0) return originalName;
  const normalizedId = normalizeAppId(appId);
  if (!normalizedId || containsHan(originalName)) return originalName;
  const chineseName = catalog.games[normalizedId];
  if (!chineseName) return originalName;
  if (mode === "chinese") return chineseName;
  return chineseName === originalName ? originalName : `${chineseName} | ${originalName}`;
}

export function appendActiveBeta(displayName: unknown, activeBeta?: string): unknown {
  return activeBeta ? `${displayName} [${activeBeta}]` : displayName;
}
