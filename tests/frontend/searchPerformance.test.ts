import { describe, expect, it } from "vitest";
import {
  buildCatalogSearchIndex,
  matchesCatalogSearch,
} from "../../frontend/translation/matchesCatalogSearch";
import type { TranslationCatalog } from "../../frontend/types/catalog";

const ENTRY_COUNT = 5_000;
const FIRST_APP_ID = 1_000_000;
const MAX_INDEX_BUILD_MS = 250;
const MAX_QUERY_BATCH_MS = 250;

function syntheticCatalog(): TranslationCatalog {
  const games: Record<string, string> = {};
  for (let index = 0; index < ENTRY_COUNT; index += 1) {
    games[String(FIRST_APP_ID + index)] = `性能测试游戏 ${index}`;
  }
  return { schemaVersion: 1, games };
}

describe("catalog search performance", () => {
  it("supports a local 5,000-game catalog and candidate library within the v0.2.0 budget", () => {
    const catalog = syntheticCatalog();
    const buildStartedAt = performance.now();
    const index = buildCatalogSearchIndex(catalog);
    const buildDuration = performance.now() - buildStartedAt;
    expect(Object.keys(index)).toHaveLength(ENTRY_COUNT);

    const appIds = Array.from({ length: ENTRY_COUNT }, (_, index) => FIRST_APP_ID + index);
    const queries = ["性", "性能", "性能测", "性能测试", "性能测试游戏 4", "性能测试游戏 49", "性能测试游戏 4999"];
    const searchStartedAt = performance.now();
    const matchCounts = queries.map((query) => appIds.reduce(
      (count, appId) => count + Number(matchesCatalogSearch(appId, query, index)),
      0,
    ));
    const searchDuration = performance.now() - searchStartedAt;

    expect(matchCounts[0]).toBe(ENTRY_COUNT);
    expect(matchCounts.at(-1)).toBe(1);
    expect(buildDuration).toBeLessThan(MAX_INDEX_BUILD_MS);
    expect(searchDuration).toBeLessThan(MAX_QUERY_BATCH_MS);
    console.log(
      `5,000-game search budget: index=${buildDuration.toFixed(2)}ms, `
      + `${queries.length} queries=${searchDuration.toFixed(2)}ms`,
    );
  });
});
