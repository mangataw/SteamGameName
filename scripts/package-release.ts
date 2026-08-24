import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { createHash } from "node:crypto";
import { zipSync } from "fflate";
import packageMetadata from "../package.json" with { type: "json" };

const canonicalName = "steam-game-name-zh.star";
const input = process.argv[2] ?? join(".millennium", "dist", canonicalName);
const version = process.env.PLUGIN_VERSION ?? packageMetadata.version;
const outputDirectory = "release";
const files: Record<string, Uint8Array> = {};

const inputInfo = await stat(input);
if (inputInfo.isDirectory()) throw new Error(`Expected a Starlight file, received directory: ${input}`);
files[canonicalName] = await readFile(input);
const archive = zipSync(files, { level: 9 });
await mkdir(outputDirectory, { recursive: true });
const archivePath = join(outputDirectory, `steam-game-name-zh-v${version}.zip`);
await writeFile(archivePath, archive);
const digest = createHash("sha256").update(archive).digest("hex");
await writeFile(`${archivePath}.sha256`, `${digest}  ${basename(archivePath)}\n`, "utf8");
console.log(`${archivePath} (${Object.keys(files).length} files)`);
