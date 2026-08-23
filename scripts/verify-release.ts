import { readFile } from "node:fs/promises";
import { unzipSync } from "fflate";

const canonicalName = "steam-game-name-zh.star";
const archivePath = process.argv.slice(2).find((argument) => argument !== "--");
if (!archivePath) throw new Error("Usage: tsx scripts/verify-release.ts <release.zip>");

const archive = unzipSync(await readFile(archivePath));
const entries = Object.keys(archive);
if (entries.length !== 1 || entries[0] !== canonicalName) {
  throw new Error(`Archive must contain exactly ${canonicalName}; found: ${entries.join(", ") || "<empty>"}`);
}
if ((archive[canonicalName]?.byteLength ?? 0) === 0) throw new Error(`${canonicalName} is empty`);
console.log(`${archivePath}: verified ${canonicalName}`);
