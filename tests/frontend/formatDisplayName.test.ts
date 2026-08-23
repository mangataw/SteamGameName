import { describe, expect, it } from "vitest";
import { formatDisplayName, normalizeAppId } from "../../frontend/translation/formatDisplayName";
import type { TranslationCatalog } from "../../frontend/types/catalog";

const catalog: TranslationCatalog = { schemaVersion: 1, games: { "620": "传送门 2", "730": "反恐精英 2" } };

describe("formatDisplayName", () => {
  it("formats a translated English name in all modes", () => {
    expect(formatDisplayName(620, "Portal 2", catalog, "bilingual")).toBe("传送门 2 | Portal 2");
    expect(formatDisplayName(620, "Portal 2", catalog, "chinese")).toBe("传送门 2");
    expect(formatDisplayName(620, "Portal 2", catalog, "original")).toBe("Portal 2");
  });
  it.each(["传送门 2", "傳送門 2", "Portal 传送门"])("preserves names containing Han: %s", (name) => {
    expect(formatDisplayName(620, name, catalog, "bilingual")).toBe(name);
  });
  it.each(["ポータル", "포털", "🎮 | !"])("does not mistake other scripts for Han: %s", (name) => {
    expect(formatDisplayName(620, name, catalog, "bilingual")).toBe(`传送门 2 | ${name}`);
  });
  it("preserves missing entries and invalid inputs", () => {
    expect(formatDisplayName(999, "Unknown", catalog, "bilingual")).toBe("Unknown");
    expect(formatDisplayName(0, "Portal 2", catalog, "bilingual")).toBe("Portal 2");
    expect(formatDisplayName("+620", "Portal 2", catalog, "bilingual")).toBe("Portal 2");
    expect(formatDisplayName(620, "", catalog, "bilingual")).toBe("");
    expect(formatDisplayName(620, undefined, catalog, "bilingual")).toBeUndefined();
  });
  it("accepts only the unsigned 32-bit AppID range", () => {
    expect(normalizeAppId("620")).toBe("620");
    expect(normalizeAppId("0620")).toBeNull();
    expect(normalizeAppId(0xffff_ffff)).toBe("4294967295");
    expect(normalizeAppId(0x1_0000_0000)).toBeNull();
  });
});

