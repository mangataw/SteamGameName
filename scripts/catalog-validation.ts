import Ajv2020 from "ajv/dist/2020.js";
import schema from "../data/translations.schema.json" with { type: "json" };
import { containsHan } from "../frontend/translation/containsHan";
import type { TranslationCatalog } from "../frontend/types/catalog";

const MAX_APP_ID = 0xffff_ffff;
const ajv = new Ajv2020({ allErrors: true, strict: false });
const validateSchema = ajv.compile(schema);

export interface ValidationResult {
  catalog: TranslationCatalog;
  entryCount: number;
  normalized: string;
}

function gamesObjectSource(source: string): string | null {
  const match = /"games"\s*:\s*\{/.exec(source);
  if (!match) return null;
  const start = source.indexOf("{", match.index);
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const character = source[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
    } else if (character === '"') inString = true;
    else if (character === "{") depth += 1;
    else if (character === "}" && --depth === 0) return source.slice(start, index + 1);
  }
  return null;
}

function catalogAppIds(source: string): string[] {
  const gamesSource = gamesObjectSource(source);
  if (!gamesSource) throw new Error("缺失 games 对象");
  const seen = new Set<string>();
  const keys: string[] = [];
  for (const match of gamesSource.matchAll(/"((?:\\.|[^"\\])*)"\s*:/g)) {
    const key = JSON.parse(`"${match[1]}"`) as string;
    if (seen.has(key)) throw new Error(`AppID 重复: ${key}`);
    seen.add(key);
    keys.push(key);
  }
  return keys;
}

export function validateCatalogSource(source: string): ValidationResult {
  if (source.startsWith("\ufeff")) throw new Error("词库禁止 UTF-8 BOM");
  const sourceAppIds = catalogAppIds(source);
  const sortedSourceAppIds = [...sourceAppIds].sort((left, right) => Number(left) - Number(right));
  if (sourceAppIds.some((appId, index) => appId !== sortedSourceAppIds[index])) throw new Error("AppID 必须按数值升序排列");
  let value: unknown;
  try { value = JSON.parse(source); } catch (error) { throw new Error(`JSON 无效: ${String(error)}`); }
  if (!validateSchema(value)) throw new Error(`Schema 无效: ${ajv.errorsText(validateSchema.errors)}`);
  const catalog = value as unknown as TranslationCatalog;
  const entries = Object.entries(catalog.games);
  for (const [appId, name] of entries) {
    const numeric = Number(appId);
    if (!Number.isSafeInteger(numeric) || numeric <= 0 || numeric > MAX_APP_ID) throw new Error(`AppID 超出范围: ${appId}`);
    if (name.trim().length === 0 || !containsHan(name)) throw new Error(`译名必须包含汉字: ${appId}`);
    if (/[\u0000-\u001f\u007f]/u.test(name)) throw new Error(`译名包含控制字符: ${appId}`);
    if (/[<>]/u.test(name)) throw new Error(`译名疑似包含 HTML: ${appId}`);
  }
  const sorted = [...entries].sort(([left], [right]) => Number(left) - Number(right));
  const normalized = `${JSON.stringify({ schemaVersion: 1, games: Object.fromEntries(sorted) }, null, 2)}\n`;
  return { catalog, entryCount: entries.length, normalized };
}
