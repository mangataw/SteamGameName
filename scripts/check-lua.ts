import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "luaparse";

async function luaFiles(directory: string): Promise<string[]> {
  const result: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await luaFiles(path));
    else if (entry.name.endsWith(".lua")) result.push(path);
  }
  return result;
}

const files = [...await luaFiles("backend"), ...await luaFiles("tests/backend")];
const errors: string[] = [];
for (const file of files) {
  const source = await readFile(file, "utf8");
  try {
    parse(source, { comments: false, encodingMode: "none", luaVersion: "5.3" });
  } catch (error) {
    errors.push(`${file}: ${error instanceof Error ? error.message : String(error)}`);
  }
  source.split(/\r?\n/u).forEach((line, index) => {
    if (/\s+$/u.test(line)) errors.push(`${file}:${index + 1}: trailing whitespace`);
    if (line.includes("\t")) errors.push(`${file}:${index + 1}: tab indentation is forbidden`);
  });
}
if (errors.length) throw new Error(`Lua checks failed:\n${errors.join("\n")}`);
console.log(`Lua syntax/static checks passed (${files.length} files)`);
