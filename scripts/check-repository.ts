import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const repositoryRoot = process.cwd();
const gitSafeDirectory = repositoryRoot.replaceAll("\\", "/");
const trackedOutput = execFileSync(
  "git",
  ["-c", `safe.directory=${gitSafeDirectory}`, "ls-files", "-z"],
  { cwd: repositoryRoot, encoding: "utf8" },
);
const trackedFiles = trackedOutput.split("\0").filter(Boolean);

const forbiddenPrefixes = ["node_modules/", ".pnpm-store/", ".millennium/", "release/", "dist/", "cache/", "config/"];
const forbiddenExtensions = [".star", ".zip", ".sha256", ".log", ".pem", ".key", ".pfx", ".env"];
const forbiddenTracked = trackedFiles.filter((path) =>
  forbiddenPrefixes.some((prefix) => path.startsWith(prefix))
  || forbiddenExtensions.some((extension) => path.toLowerCase().endsWith(extension)),
);
if (forbiddenTracked.length > 0) {
  throw new Error(`Forbidden generated or sensitive files are tracked:\n${forbiddenTracked.join("\n")}`);
}

for (const required of ["LICENSE", "CHANGELOG.md", "CONTRIBUTING.md", "SECURITY.md", "docs/PRIVACY.md"]) {
  if (!trackedFiles.includes(required)) throw new Error(`Required public repository file is not tracked: ${required}`);
}

const sourceConfig = await readFile(resolve(repositoryRoot, "backend/source_config.lua"), "utf8");
if (!/remote_url\s*=\s*nil/.test(sourceConfig)) {
  throw new Error("The tracked development source config must not contain a remote URL");
}

const personalPathPattern = /[A-Za-z]:\\Users\\/;
for (const path of trackedFiles.filter((value) => /\.(?:json|md|lua|ts|tsx|toml|ya?ml)$/.test(value))) {
  const content = await readFile(resolve(repositoryRoot, path), "utf8");
  if (personalPathPattern.test(content)) throw new Error(`Machine-specific Windows user path found in ${path}`);
}

const forbiddenImportKeys = new Set(["steamid", "steamId", "accountid", "accountId", "ownerid", "ownerId", "libraryPath"]);
for (const path of trackedFiles.filter((value) => value.startsWith("docs/catalog-imports/") && value.endsWith(".json"))) {
  const parsed = JSON.parse(await readFile(resolve(repositoryRoot, path), "utf8"));
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      if (forbiddenImportKeys.has(key)) throw new Error(`Private field ${key} found in ${path}`);
      visit(child);
    }
  };
  visit(parsed);
}

console.log(`Public repository checks passed (${trackedFiles.length} tracked files)`);
