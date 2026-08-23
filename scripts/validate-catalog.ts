import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { validateCatalogSource } from "./catalog-validation";

const path = resolve(process.argv[2] ?? "data/translations.zh-CN.json");
try {
  const source = await readFile(path, "utf8");
  const result = validateCatalogSource(source);
  console.log(`词库校验通过：${result.entryCount} 条翻译`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}

