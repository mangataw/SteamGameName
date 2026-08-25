import { describe, expect, it } from "vitest";
import {
  buildCatalogSearchIndex,
  matchesCatalogSearch,
} from "../../frontend/translation/matchesCatalogSearch";
import type { TranslationCatalog } from "../../frontend/types/catalog";

const catalog: TranslationCatalog = {
  schemaVersion: 1,
  games: { "400": "传送门", "620": "传送门 ２", "730": "反恐精英 2" },
};

describe("matchesCatalogSearch", () => {
  const index = buildCatalogSearchIndex(catalog);

  it("matches a full or partial Chinese translation by AppID", () => {
    expect(matchesCatalogSearch(620, "传送门", index)).toBe(true);
    expect(matchesCatalogSearch("730", "精英", index)).toBe(true);
    expect(matchesCatalogSearch(730, "传送门", index)).toBe(false);
  });

  it("normalizes compatibility-width and case variants once in the index", () => {
    expect(matchesCatalogSearch(620, "传送门 2", index)).toBe(true);
  });

  it("rejects empty queries, invalid AppIDs and missing translations", () => {
    expect(matchesCatalogSearch(620, "", index)).toBe(false);
    expect(matchesCatalogSearch(0, "传送门", index)).toBe(false);
    expect(matchesCatalogSearch("0620", "传送门", index)).toBe(false);
    expect(matchesCatalogSearch(999, "传送门", index)).toBe(false);
  });

  it("performs one indexed lookup instead of scanning the catalog", () => {
    let reads = 0;
    const observedIndex = new Proxy(index, {
      get(target, property, receiver) {
        if (typeof property === "string") reads += 1;
        return Reflect.get(target, property, receiver) as unknown;
      },
    });
    expect(matchesCatalogSearch(620, "传送", observedIndex)).toBe(true);
    expect(reads).toBe(1);
  });
});
