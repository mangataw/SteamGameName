import { writeFile } from "node:fs/promises";
import packageMetadata from "../package.json" with { type: "json" };
import { renderSourceConfig } from "./source-config";

const repository = process.env.GITHUB_REPOSITORY;
const commitSha = process.env.GITHUB_SHA;
const version = process.env.PLUGIN_VERSION ?? packageMetadata.version;
const content = renderSourceConfig({ repository, commitSha, version });
await writeFile("backend/source_config.lua", content, "utf8");
console.log(repository && commitSha
  ? `远程词库固定到发布提交：${commitSha}`
  : "未配置 GITHUB_REPOSITORY/GITHUB_SHA，将仅使用内置词库");
