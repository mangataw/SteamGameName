import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { validateCatalogSource } from "./catalog-validation";

interface SourceDefinition {
  id: string;
  url: string;
}

interface SteamAppDetails {
  success?: boolean;
  data?: {
    name?: string;
    type?: string;
  };
}

interface Candidate {
  appid: number;
  sources: string[];
  catalogued: boolean;
  status: "available" | "unavailable" | "request-error";
  type: string | null;
  simplifiedChineseName: string | null;
  hasHan: boolean | null;
  error?: string;
}

const sources: SourceDefinition[] = [
  { id: "most-played", url: "https://store.steampowered.com/charts/mostplayed" },
  { id: "top-sellers", url: "https://store.steampowered.com/charts/topselling/global" },
  { id: "best-of-2025", url: "https://store.steampowered.com/sale/bestof2025?l=schinese" },
  { id: "best-of-2024", url: "https://store.steampowered.com/sale/bestof2024?l=schinese" },
  { id: "best-of-2023", url: "https://store.steampowered.com/sale/BestOf2023?l=schinese" },
  { id: "best-of-2022", url: "https://store.steampowered.com/sale/BestOf2022?l=schinese" },
  { id: "best-of-2021", url: "https://store.steampowered.com/sale/BestOf2021?l=schinese" },
];

const [catalogPath = "data/translations.zh-CN.json", outputPath = "cache/steam-public-candidate-audit.json"] = process.argv.slice(2);
const catalog = validateCatalogSource(await readFile(catalogPath, "utf8")).catalog;
const sourceByAppId = new Map<number, Set<string>>();
const sourceCounts: Record<string, number> = {};

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, { headers: { "user-agent": "SteamGameName catalog audit" } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.text();
}

function decodeHtml(text: string): string {
  return text
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

for (const source of sources) {
  const html = decodeHtml(await fetchText(source.url));
  const ids = new Set<number>();
  for (const match of html.matchAll(/store\.steampowered\.com\/app\/(\d+)/g)) ids.add(Number(match[1]));
  for (const match of html.matchAll(/\\"id\\":(\d+),\\"type\\":\\"game\\"/g)) ids.add(Number(match[1]));
  sourceCounts[source.id] = ids.size;
  for (const appid of ids) {
    const memberships = sourceByAppId.get(appid) ?? new Set<string>();
    memberships.add(source.id);
    sourceByAppId.set(appid, memberships);
  }
  console.log(`${source.id}: ${ids.size} unique game AppIDs`);
}

async function fetchAppDetails(appid: number): Promise<SteamAppDetails> {
  const url = `https://store.steampowered.com/api/appdetails?appids=${appid}&l=schinese&cc=CN&filters=basic`;
  let lastError: unknown;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { "user-agent": "SteamGameName catalog audit" } });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const payload = await response.json() as Record<string, SteamAppDetails>;
      return payload[String(appid)] ?? {};
    } catch (error) {
      lastError = error;
      if (attempt < 5) await delay(attempt * 1_000);
    }
  }
  throw lastError;
}

const appids = [...sourceByAppId.keys()].sort((left, right) => left - right);
const candidates: Candidate[] = new Array(appids.length);
const previousByAppId = new Map<number, Candidate>();
try {
  const previous = JSON.parse(await readFile(outputPath, "utf8")) as { candidates?: Candidate[] };
  for (const candidate of previous.candidates ?? []) previousByAppId.set(candidate.appid, candidate);
  console.log(`resume: ${previousByAppId.size} cached candidate results`);
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
}
let cursor = 0;
let completed = 0;

function reportProgress(): void {
  completed += 1;
  if (completed % 50 === 0 || completed === appids.length) console.log(`appdetails: ${completed}/${appids.length}`);
}

async function worker(): Promise<void> {
  while (true) {
    const index = cursor;
    cursor += 1;
    if (index >= appids.length) return;
    const appid = appids[index];
    const base = {
      appid,
      sources: [...(sourceByAppId.get(appid) ?? [])],
      catalogued: catalog.games[String(appid)] !== undefined,
    };
    const previous = previousByAppId.get(appid);
    if (previous && previous.status !== "request-error") {
      candidates[index] = { ...previous, ...base };
      reportProgress();
      continue;
    }
    try {
      const details = await fetchAppDetails(appid);
      const name = details.success && typeof details.data?.name === "string" ? details.data.name.trim() : null;
      candidates[index] = {
        ...base,
        status: details.success ? "available" : "unavailable",
        type: details.success && typeof details.data?.type === "string" ? details.data.type : null,
        simplifiedChineseName: name,
        hasHan: name === null ? null : /[\u3400-\u9fff]/u.test(name),
      };
    } catch (error) {
      candidates[index] = {
        ...base,
        status: "request-error",
        type: null,
        simplifiedChineseName: null,
        hasHan: null,
        error: String(error),
      };
    }
    reportProgress();
  }
}

await Promise.all(Array.from({ length: 3 }, () => worker()));
const summary = {
  total: candidates.length,
  catalogued: candidates.filter((candidate) => candidate.catalogued).length,
  availableGames: candidates.filter((candidate) => candidate.status === "available" && candidate.type === "game").length,
  alreadyHanGames: candidates.filter((candidate) => candidate.status === "available" && candidate.type === "game" && candidate.hasHan).length,
  foreignNameGames: candidates.filter((candidate) => candidate.status === "available" && candidate.type === "game" && candidate.hasHan === false).length,
  foreignNameGamesNotCatalogued: candidates.filter((candidate) => !candidate.catalogued && candidate.status === "available" && candidate.type === "game" && candidate.hasHan === false).length,
  nonGames: candidates.filter((candidate) => candidate.status === "available" && candidate.type !== "game").length,
  unavailable: candidates.filter((candidate) => candidate.status === "unavailable").length,
  requestErrors: candidates.filter((candidate) => candidate.status === "request-error").length,
};

const output = {
  generatedAt: new Date().toISOString(),
  catalogPath,
  sources,
  sourceCounts,
  summary,
  candidates,
};
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(JSON.stringify(summary));
console.log(`Wrote ${outputPath}`);
