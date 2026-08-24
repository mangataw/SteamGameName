import { writeFile } from "node:fs/promises";
import packageMetadata from "../package.json" with { type: "json" };

const repository = process.env.GITHUB_REPOSITORY;
const version = process.env.PLUGIN_VERSION ?? packageMetadata.version;
const remoteUrl = repository ? `https://raw.githubusercontent.com/${repository}/main/data/translations.zh-CN.json` : null;
const content = `-- Generated; do not edit in release artifacts.\nreturn {\n    remote_url = ${remoteUrl ? JSON.stringify(remoteUrl) : "nil"},\n    version = ${JSON.stringify(version)}\n}\n`;
await writeFile("backend/source_config.lua", content, "utf8");
console.log(remoteUrl ? `远程词库：${remoteUrl}` : "未配置 GITHUB_REPOSITORY，将仅使用内置词库");
