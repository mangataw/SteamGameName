import type { TranslationCatalog } from "../types/catalog";
import { normalizeAppId } from "./formatDisplayName";

export type CatalogSearchIndex = Readonly<Record<string, string>>;

let cachedQuerySource: string | null = null;
let cachedNormalizedQuery = "";

function normalizeSearchText(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase();
}

function normalizeQuery(value: string): string {
  if (value !== cachedQuerySource) {
    cachedQuerySource = value;
    cachedNormalizedQuery = normalizeSearchText(value);
  }
  return cachedNormalizedQuery;
}

export function buildCatalogSearchIndex(catalog: TranslationCatalog): CatalogSearchIndex {
  const index: Record<string, string> = Object.create(null) as Record<string, string>;
  for (const [appId, chineseName] of Object.entries(catalog.games)) {
    index[appId] = normalizeSearchText(chineseName);
  }
  return index;
}

export function matchesCatalogSearch(
  appId: unknown,
  query: unknown,
  index: CatalogSearchIndex,
): boolean {
  if (typeof query !== "string" || query.length === 0) return false;
  const normalizedId = normalizeAppId(appId);
  if (!normalizedId) return false;
  const chineseName = index[normalizedId];
  return chineseName !== undefined && chineseName.includes(normalizeQuery(query));
}
