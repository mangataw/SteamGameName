import { readFileSync, readdirSync } from "node:fs";
import { parse } from "luaparse";
import { describe, expect, it } from "vitest";

type LuaNode = { type?: string; key?: { name?: string }; value?: unknown; [key: string]: unknown };

function productionString(fieldName: string): string {
  const ast = parse(readFileSync("backend/patches.lua", "utf8"), {
    comments: false,
    encodingMode: "x-user-defined",
    luaVersion: "5.3",
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
  expect(matches, `production field ${fieldName}`).toHaveLength(1);
  return matches[0]!;
}

const signature = new RegExp(productionString("find"), "g");
const transform = new RegExp(productionString("match"), "g");
const replacement = productionString("replace")
  .replaceAll("#{{self}}", "plugin")
  .replace(/\\([1-9])/gu, "$$$1");
const fixtures = readdirSync("tests/patch")
  .filter((name) => name.endsWith(".fixture.js"))
  .map((name) => [name, readFileSync(`tests/patch/${name}`, "utf8")] as const);
const bundledCatalog = JSON.parse(readFileSync("data/translations.zh-CN.json", "utf8")) as {
  games: Record<string, string>;
};

describe("production library sidebar patch", () => {
  it("keeps the synchronous bootstrap catalog small and sourced from bundled values", () => {
    const source = productionString("replace");
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

  it.each(fixtures)("matches %s exactly once", (_name, fixture) => {
    expect([...fixture.matchAll(signature)]).toHaveLength(1);
    expect([...fixture.matchAll(transform)]).toHaveLength(1);
  });

  it.each(fixtures)("transforms %s once and is idempotent", (_name, fixture) => {
    const patched = fixture.replace(transform, replacement);
    expect(patched).toContain("plugin?.gameNames?.render(");
    expect(patched).toMatch(/\.render\([^,]+\.item\.appid,\w+\.display_name,\w+\.active_beta\)/u);
    expect(patched).toContain('"220":"\\u534a\\u8870\\u671f 2"');
    expect(() => new Function(patched)).not.toThrow();
    expect([...patched.matchAll(transform)]).toHaveLength(0);
    expect(patched.replace(transform, replacement)).toBe(patched);
  });

  it.each([
    'function Details(e){return jsx("h1",{children:e.display_name})}',
    'function Search(e){return jsx("span",{children:e.name})}',
    fixtures[0]![1].replace("display_name_elanguage", "language"),
  ])("does not touch unrelated or structurally changed UI", (source) => {
    expect([...source.matchAll(signature)]).toHaveLength(0);
    expect(source.replace(transform, replacement)).toBe(source);
  });
});
