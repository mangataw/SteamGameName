import { readFile } from "node:fs/promises";
import { parse } from "luaparse";

type LuaNode = { type?: string; key?: { name?: string }; value?: unknown; [key: string]: unknown };

function productionStrings(source: string, fieldName: string): string[] {
  const ast = parse(source, { comments: false, encodingMode: "x-user-defined", luaVersion: "5.3" }) as unknown as LuaNode;
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

const targetPath = process.argv[2];
if (!targetPath) throw new Error("Usage: tsx scripts/diagnose-patch.ts <Steam JavaScript file>");
const [patchSource, targetSource] = await Promise.all([
  readFile("backend/patches.lua", "utf8"),
  readFile(targetPath, "utf8"),
]);

for (const field of ["find", "match"] as const) {
  const expressions = productionStrings(patchSource, field);
  expressions.forEach((source, patchIndex) => {
    const expression = new RegExp(source, "g");
    const matches = [...targetSource.matchAll(expression)];
    console.log(`${field}[${patchIndex}]: ${matches.length} match(es)`);
    if (matches[0]?.index !== undefined) {
      const start = Math.max(0, matches[0].index - 160);
      const end = Math.min(targetSource.length, matches[0].index + matches[0][0].length + 160);
      console.log(targetSource.slice(start, end));
    }
  });
}
