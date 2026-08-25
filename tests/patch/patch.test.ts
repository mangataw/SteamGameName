import { readFileSync, readdirSync } from "node:fs";
import { parse } from "luaparse";
import { describe, expect, it } from "vitest";

type LuaNode = { type?: string; key?: { name?: string }; value?: unknown; [key: string]: unknown };

function productionStrings(fieldName: string): string[] {
  const ast = parse(readFileSync("backend/patches.lua", "utf8"), {
    comments: false, encodingMode: "x-user-defined", luaVersion: "5.3",
  }) as unknown as LuaNode;
  const matches: string[] = [];
  const visit = (node: unknown): void => {
    if (!node || typeof node !== "object") return;
    const candidate = node as LuaNode;
    if (candidate.type === "TableKeyString" && candidate.key?.name === fieldName) {
      const value = candidate.value as LuaNode;
      if (value.type === "StringLiteral" && typeof value.value === "string") matches.push(value.value);
    }
    for (const value of Object.values(candidate)) {
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === "object") visit(value);
    }
  };
  visit(ast);
  return matches;
}

function productionString(fieldName: string, marker: string): string {
  const matches = productionStrings(fieldName).filter((value) => value.includes(marker));
  expect(matches, `production field ${fieldName} containing ${marker}`).toHaveLength(1);
  return matches[0]!;
}

function replacement(source: string): string {
  return source.replaceAll("#{{self}}", "plugin").replace(/\\([1-9])/gu, "$$$1");
}

const displaySignature = new RegExp(productionString("find", "display_name_elanguage"), "g");
const displayTransform = new RegExp(productionString("match", "display_name_elanguage"), "g");
const displayReplacement = replacement(productionString("replace", "gameNames"));
const searchSignature = new RegExp(productionString("find", "m_filterSpec"), "g");
const searchTransform = new RegExp(productionString("match", "m_filterSpec"), "g");
const searchReplacement = replacement(productionString("replace", "gameSearch"));
const displayFixtures = readdirSync("tests/patch")
  .filter((name) => /^library-sidebar.*\.fixture\.js$/u.test(name))
  .map((name) => [name, readFileSync(`tests/patch/${name}`, "utf8")] as const);
const searchFixtures = readdirSync("tests/patch")
  .filter((name) => /^library-search.*\.fixture\.js$/u.test(name))
  .map((name) => [name, readFileSync(`tests/patch/${name}`, "utf8")] as const);
const executableSearchFixture = searchFixtures.find(([name]) => name === "library-search.fixture.js")![1];
const bundledCatalog = JSON.parse(readFileSync("data/translations.zh-CN.json", "utf8")) as {
  games: Record<string, string>;
};

describe("production library sidebar display patch", () => {
  it("keeps the synchronous bootstrap catalog small and sourced from bundled values", () => {
    const source = productionString("replace", "gameNames");
    const start = source.indexOf('{"10":');
    const end = source.indexOf("}[String(", start);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    const bootstrapCatalog = JSON.parse(source.slice(start, end + 1)) as Record<string, string>;
    expect(Object.keys(bootstrapCatalog).length).toBeLessThanOrEqual(8);
    expect(bootstrapCatalog).toEqual(Object.fromEntries(
      Object.keys(bootstrapCatalog).map((appId) => [appId, bundledCatalog.games[appId]]),
    ));
    expect(new TextEncoder().encode(source).byteLength).toBeLessThan(1024);
  });

  it.each(displayFixtures)("matches %s exactly once", (_name, fixture) => {
    expect([...fixture.matchAll(displaySignature)]).toHaveLength(1);
    expect([...fixture.matchAll(displayTransform)]).toHaveLength(1);
  });

  it.each(displayFixtures)("transforms %s once and is idempotent", (_name, fixture) => {
    const patched = fixture.replace(displayTransform, displayReplacement);
    expect(patched).toContain("plugin?.gameNames?.render(");
    expect(patched).toMatch(/\.render\([^,]+\.item\.appid,\w+\.display_name,\w+\.active_beta\)/u);
    expect(patched).toContain('"220":"\\u534a\\u8870\\u671f 2"');
    expect(() => new Function(patched)).not.toThrow();
    expect([...patched.matchAll(displayTransform)]).toHaveLength(0);
    expect(patched.replace(displayTransform, displayReplacement)).toBe(patched);
  });

  it.each([
    'function Details(e){return jsx("h1",{children:e.display_name})}',
    'function Search(e){return jsx("span",{children:e.name})}',
    displayFixtures[0]![1].replace("display_name_elanguage", "language"),
  ])("does not touch unrelated or structurally changed UI", (source) => {
    expect([...source.matchAll(displaySignature)]).toHaveLength(0);
    expect(source.replace(displayTransform, displayReplacement)).toBe(source);
  });
});

describe("production library sidebar search patch", () => {
  it.each(searchFixtures)("matches %s exactly once", (_name, fixture) => {
    expect([...fixture.matchAll(searchSignature)]).toHaveLength(1);
    expect([...fixture.matchAll(searchTransform)]).toHaveLength(1);
  });

  it.each(searchFixtures)("transforms %s once and is idempotent", (_name, fixture) => {
    const patched = fixture.replace(searchTransform, searchReplacement);
    expect(patched).toContain("plugin?.gameSearch?.matches(");
    expect(() => new Function(patched)).not.toThrow();
    expect([...patched.matchAll(searchTransform)]).toHaveLength(0);
    expect(patched.replace(searchTransform, searchReplacement)).toBe(patched);
  });

  it("preserves native results and adds an AppID-based Chinese result", () => {
    const patched = executableSearchFixture.replace(searchTransform, searchReplacement);
    const createFilter = new Function("plugin", `${patched};return createSearchFilter();`) as
      (plugin: unknown) => { SetSearchText(value: string): void; MatchesImpl(app: object): boolean };
    let pluginCalls = 0;
    const plugin = { gameSearch: { matches: (appId: number, query: string) => {
      pluginCalls += 1;
      return appId === 620 && query === "传送门";
    } } };
    const filter = createFilter(plugin);

    filter.SetSearchText("portal");
    expect(filter.MatchesImpl({ appid: 620, display_name: "Portal 2", sort_as: "portal 2" })).toBe(true);
    expect(pluginCalls).toBe(0);
    filter.SetSearchText("传送门");
    expect(filter.MatchesImpl({ appid: 620, display_name: "Portal 2", sort_as: "portal 2" })).toBe(true);
    expect(pluginCalls).toBe(1);
    expect(filter.MatchesImpl({ appid: 400, display_name: "Portal", sort_as: "portal" })).toBe(false);
    filter.SetSearchText("620");
    expect(filter.MatchesImpl({ appid: 620, display_name: "Portal 2", sort_as: "portal 2" })).toBe(true);
  });

  it("falls back to untouched native search when the frontend export is unavailable", () => {
    const patched = executableSearchFixture.replace(searchTransform, searchReplacement);
    const createFilter = new Function("plugin", `${patched};return createSearchFilter();`) as
      (plugin: unknown) => { SetSearchText(value: string): void; MatchesImpl(app: object): boolean };
    const filter = createFilter(undefined);
    filter.SetSearchText("portal");
    expect(filter.MatchesImpl({ appid: 620, display_name: "Portal 2", sort_as: "portal 2" })).toBe(true);
    filter.SetSearchText("传送门");
    expect(filter.MatchesImpl({ appid: 620, display_name: "Portal 2", sort_as: "portal 2" })).toBe(false);
  });

  it.each([
    'function StoreSearch(e){return e.display_name.toLowerCase().includes(this.query)}',
    'function FriendSearch(e){return e.BMatchesSearchString(this.searchText)}',
    executableSearchFixture.replace("sort_as.includes", "original_sort_as.includes"),
  ])("does not touch unrelated or structurally changed search code", (source) => {
    expect([...source.matchAll(searchSignature)]).toHaveLength(0);
    expect(source.replace(searchTransform, searchReplacement)).toBe(source);
  });
});
