import { writeFile } from "node:fs/promises";
import packageMetadata from "../package.json" with { type: "json" };
import { renderSourceConfig } from "./source-config";

const repository = process.env.GITHUB_REPOSITORY;
const catalogRef = process.env.CATALOG_REF;
const version = process.env.PLUGIN_VERSION ?? packageMetadata.version;
const content = renderSourceConfig({ repository, catalogRef, version });
await writeFile("backend/source_config.lua", content, "utf8");
console.log(repository && catalogRef
  ? `远程词库跟踪受控仓库分支：${repository}@${catalogRef}`
  : "未配置 GITHUB_REPOSITORY/CATALOG_REF，将仅使用内置词库");
