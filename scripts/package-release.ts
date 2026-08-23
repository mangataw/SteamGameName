import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { basename, join, relative } from "node:path";
import { createHash } from "node:crypto";
import { zipSync } from "fflate";

const input = process.argv[2] ?? ".millennium/dist";
const version = process.env.PLUGIN_VERSION ?? "0.1.0";
const outputDirectory = "release";
const files: Record<string, Uint8Array> = {};

async function collect(directory: string): Promise<void> {
  for (const name of await readdir(directory)) {
    const path = join(directory, name);
    const info = await stat(path);
    if (info.isDirectory()) await collect(path);
    else if (!path.endsWith(".map")) files[relative(input, path).replaceAll("\\", "/")] = await readFile(path);
  }
}

const inputInfo = await stat(input);
if (inputInfo.isDirectory()) await collect(input);
else files["steam-game-name-zh"] = await readFile(input);
const archive = zipSync(files, { level: 9 });
await mkdir(outputDirectory, { recursive: true });
const archivePath = join(outputDirectory, `steam-game-name-zh-v${version}.zip`);
await writeFile(archivePath, archive);
const digest = createHash("sha256").update(archive).digest("hex");
await writeFile(`${archivePath}.sha256`, `${digest}  ${basename(archivePath)}\n`, "utf8");
console.log(`${archivePath} (${Object.keys(files).length} files)`);
