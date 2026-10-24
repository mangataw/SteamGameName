import { readFile, writeFile } from "node:fs/promises";
import { validateCatalogSource } from "./catalog-validation";

interface AuditCandidate {
  appid: number;
  sources: string[];
  status: string;
  type: string | null;
  simplifiedChineseName: string | null;
  hasHan: boolean | null;
}

interface AuditSnapshot {
  candidates: AuditCandidate[];
}

interface ImportEntry {
  appid: number;
  originalName: string;
  chineseName: string;
}

interface CatalogImport {
  games: ImportEntry[];
}

const [catalogPath, importPath, auditPath] = process.argv.slice(2);
if (!catalogPath || !importPath || !auditPath) {
  throw new Error("Usage: tsx scripts/apply-public-catalog-import.ts <catalog.json> <import.json> <audit.json>");
}

const [catalogSource, importSource, auditSource] = await Promise.all([
  readFile(catalogPath, "utf8"),
  readFile(importPath, "utf8"),
  readFile(auditPath, "utf8"),
]);
const { catalog } = validateCatalogSource(catalogSource);
const catalogImport = JSON.parse(importSource) as CatalogImport;
const audit = JSON.parse(auditSource) as AuditSnapshot;
const auditByAppId = new Map(audit.candidates.map((candidate) => [candidate.appid, candidate]));
const seen = new Set<number>();
let imported = 0;

for (const entry of catalogImport.games) {
  if (!Number.isInteger(entry.appid) || entry.appid <= 0 || seen.has(entry.appid)) {
    throw new Error(`Invalid or duplicate import AppID: ${entry.appid}`);
  }
  seen.add(entry.appid);
  const candidate = auditByAppId.get(entry.appid);
  if (!candidate || candidate.status !== "available" || candidate.type !== "game") {
    throw new Error(`AppID ${entry.appid} is not an available game in the audit snapshot`);
  }
  if (candidate.sources.length === 0) throw new Error(`AppID ${entry.appid} has no candidate source`);
  if (candidate.simplifiedChineseName !== entry.originalName) {
    throw new Error(`AppID ${entry.appid} name mismatch: expected ${JSON.stringify(candidate.simplifiedChineseName)}`);
  }
  if (candidate.hasHan || /[\u3400-\u9fff]/u.test(entry.originalName)) {
    throw new Error(`AppID ${entry.appid} already has a Han display name`);
  }
  if (!/[\u3400-\u9fff]/u.test(entry.chineseName)) {
    throw new Error(`AppID ${entry.appid} translation has no Han character`);
  }
  const existing = catalog.games[String(entry.appid)];
  if (existing === entry.chineseName) continue;
  if (existing !== undefined) throw new Error(`AppID ${entry.appid} already has a different catalog translation: ${existing}`);
  catalog.games[String(entry.appid)] = entry.chineseName;
  imported += 1;
}

catalog.games = Object.fromEntries(Object.entries(catalog.games).sort(([left], [right]) => Number(left) - Number(right)));
await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
console.log(`Imported ${imported} public catalog translations; ${catalogImport.games.length - imported} already matched`);
