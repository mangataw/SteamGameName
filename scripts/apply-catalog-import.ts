import { readFile, writeFile } from "node:fs/promises";
import { validateCatalogSource } from "./catalog-validation";

interface LibraryEntry {
  appid: number;
  displayName: string;
  appType: number;
}

interface LibraryExport {
  entries: LibraryEntry[];
}

interface ImportEntry {
  appid: number;
  originalName: string;
  chineseName: string;
}

interface CatalogImport {
  games: ImportEntry[];
}

const [catalogPath, importPath, libraryPath] = process.argv.slice(2);
if (!catalogPath || !importPath || !libraryPath) {
  throw new Error("Usage: tsx scripts/apply-catalog-import.ts <catalog.json> <import.json> <steam-library.json>");
}

const [catalogSource, importSource, librarySource] = await Promise.all([
  readFile(catalogPath, "utf8"),
  readFile(importPath, "utf8"),
  readFile(libraryPath, "utf8"),
]);
const { catalog } = validateCatalogSource(catalogSource);
const catalogImport = JSON.parse(importSource) as CatalogImport;
const library = JSON.parse(librarySource) as LibraryExport;
const libraryByAppId = new Map(library.entries.map((entry) => [entry.appid, entry]));
const seen = new Set<number>();
let imported = 0;

for (const entry of catalogImport.games) {
  if (!Number.isInteger(entry.appid) || entry.appid <= 0 || seen.has(entry.appid)) {
    throw new Error(`Invalid or duplicate import AppID: ${entry.appid}`);
  }
  seen.add(entry.appid);
  const libraryEntry = libraryByAppId.get(entry.appid);
  if (!libraryEntry || libraryEntry.appType !== 1) throw new Error(`AppID ${entry.appid} is not a game in the library export`);
  if (libraryEntry.displayName !== entry.originalName) {
    throw new Error(`AppID ${entry.appid} name mismatch: expected ${JSON.stringify(libraryEntry.displayName)}`);
  }
  if (/[\u3400-\u9fff]/u.test(entry.originalName)) throw new Error(`AppID ${entry.appid} already has a Han display name`);
  if (!/[\u3400-\u9fff]/u.test(entry.chineseName)) throw new Error(`AppID ${entry.appid} translation has no Han character`);
  const existing = catalog.games[String(entry.appid)];
  if (existing === entry.chineseName) continue;
  if (existing !== undefined) throw new Error(`AppID ${entry.appid} already has a different catalog translation: ${existing}`);
  catalog.games[String(entry.appid)] = entry.chineseName;
  imported += 1;
}

catalog.games = Object.fromEntries(Object.entries(catalog.games).sort(([left], [right]) => Number(left) - Number(right)));
await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
console.log(`Imported ${imported} library translations; ${catalogImport.games.length - imported} already matched`);
