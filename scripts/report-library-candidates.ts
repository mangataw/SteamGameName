import { readFile, writeFile } from "node:fs/promises";
import { validateCatalogSource } from "./catalog-validation";

interface LibraryEntry {
  appid: number;
  displayName: string;
  appType: number;
  steamReviewPercent: number | null;
  playtimeMinutes: number;
}

interface LibraryExport {
  exportedAt?: string;
  entries: LibraryEntry[];
}

const [catalogPath, libraryPath, outputPath] = process.argv.slice(2);
if (!catalogPath || !libraryPath || !outputPath) {
  throw new Error("Usage: tsx scripts/report-library-candidates.ts <catalog.json> <steam-library.json> <output.md>");
}

const [catalogSource, librarySource] = await Promise.all([readFile(catalogPath, "utf8"), readFile(libraryPath, "utf8")]);
const { catalog } = validateCatalogSource(catalogSource);
const library = JSON.parse(librarySource) as LibraryExport;
const candidates = library.entries
  .filter(
    (entry) =>
      entry.appType === 1 &&
      !/[\u3400-\u9fff]/u.test(entry.displayName) &&
      !Object.hasOwn(catalog.games, String(entry.appid)),
  )
  .sort(
    (left, right) =>
      (right.steamReviewPercent ?? -1) - (left.steamReviewPercent ?? -1) ||
      right.playtimeMinutes - left.playtimeMinutes ||
      left.appid - right.appid,
  );

const buckets = [
  ["80–89%", candidates.filter((entry) => (entry.steamReviewPercent ?? -1) >= 80 && (entry.steamReviewPercent ?? -1) < 90)],
  ["70–79%", candidates.filter((entry) => (entry.steamReviewPercent ?? -1) >= 70 && (entry.steamReviewPercent ?? -1) < 80)],
  ["低于 70%", candidates.filter((entry) => entry.steamReviewPercent !== null && entry.steamReviewPercent < 70)],
  ["暂无评价", candidates.filter((entry) => entry.steamReviewPercent === null)],
] as const;
const lines = [
  "# Steam 库剩余词库候选",
  "",
  `生成依据：用户 Steam 库导出（${library.exportedAt ?? "时间未知"}）与当前词库差集。`,
  "",
  `剩余候选：${candidates.length} 款。清单不包含账户 ID、库路径或拥有者信息。`,
  "",
  "排序规则：Steam 好评率降序、游玩时间降序、AppID 升序。测试版、序章和品牌名仍保留在清单中，供人工决定是否收录。",
];

for (const [label, entries] of buckets) {
  if (entries.length === 0) continue;
  lines.push("", `## ${label}（${entries.length}）`, "", "| AppID | 当前名称 | 好评率 | 游玩时间 |", "| ---: | --- | ---: | ---: |");
  for (const entry of entries) {
    const name = entry.displayName.replaceAll("|", "\\|");
    lines.push(`| ${entry.appid} | ${name} | ${entry.steamReviewPercent === null ? "—" : `${entry.steamReviewPercent}%`} | ${entry.playtimeMinutes} 分钟 |`);
  }
}

await writeFile(outputPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${candidates.length} remaining candidates to ${outputPath}`);
