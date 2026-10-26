# 已归档：PluginDatabase 正式提交草案

> **归档状态（2026-10-26）：** 项目已决定不向 PluginDatabase 提交，继续通过 GitHub Releases 手动分发。本草案仅保留技术审计材料，不是待执行清单，也不得用于勾选不真实的合规声明或直接提交 PR。

本文件原用于冻结 `v1.0.0` 后创建 `SteamClientHomebrew/PluginDatabase` 新插件 PR。该路线现已关闭；下文内容只记录当时准备过的披露和测试方案。

## PR 标题

```text
Add Steam Game Name Zh
```

## 摘要

Steam Game Name Zh is a Windows Millennium plugin that displays reviewed Simplified Chinese or bilingual names in the Steam Library sidebar and adds Chinese-name matching after Steam's native name and AppID search. It does not modify Steam manifests, databases, or game files.

The plugin uses a standard Millennium Lua backend and ships no custom native binaries. Each package contains the full 994-entry catalog, so display and search continue offline. Steam Stable is the supported channel; Beta is tested as a submission compatibility smoke test.

## 历史计划中的远程数据披露

Release builds conditionally request the complete JSON catalog from the build-fixed URL below:

```text
https://raw.githubusercontent.com/mangataw/SteamGameName/main/data/translations.zh-CN.json
```

- The repository, `main` branch, and path are fixed at build time and cannot be changed by users or downloaded content.
- Catalog-only changes merged to `main` can affect installed releases without advancing the PluginDatabase code pointer.
- Requests send no Steam ID, library contents, search text, settings, credentials, or telemetry.
- Redirects are disabled; TLS verification, an 8-second timeout, a 5 MiB limit, schema/business validation, conditional requests, atomic cache replacement, and bundled/last-valid fallbacks are enforced.
- The response is declarative AppID/name data and cannot supply code, HTML, commands, patches, settings, or another URL.
- The archived draft proposed disabling the request and using only the bundled catalog if maintainers rejected this model; no review was requested because no PR was submitted.

## 历史计划中的测试步骤

1. Install the `.star` built from the pinned submodule commit and restart Steam completely.
2. Enable the plugin in Millennium on a Simplified Chinese Windows 11 Steam client.
3. Confirm a mapped game shows `Chinese name | Steam original name` in the Library sidebar.
4. Switch to Chinese-only mode and confirm the sidebar updates without changing the details page, downloads page, context menu, or launch behavior.
5. Search the Library by Chinese translation, Steam original name, and exact AppID; all three should find the same mapped game.
6. Confirm an unmapped game and a game whose Steam name already contains Han characters remain unchanged.
7. Disconnect the network or make the catalog endpoint unavailable, restart Steam, and confirm bundled or last-valid catalog display/search still works.
8. Disable or remove the plugin and restart Steam; original names must be restored.

## 历史模板填写边界

- 开发者 Stable/Beta 自测：已完成，可如实勾选；当前测试期间 Steam Beta 与 Stable 的 `PACKAGE_CL` 相同，应在说明中披露。
- 标准 Millennium Lua 后端：是。
- 自定义二进制：否。
- 两个其他插件 PR 的测试反馈：可选；未完成时不得勾选或伪造链接。
- 第三方 Stable/Beta 验证：作者不得勾选，留给独立测试者在正式 PR 中完成。
- 生成式 AI 使用程度：项目所有者已确认大部分功能代码由生成式 AI 生成；当前不符合官方准入规则，不得勾选插件合规项或隐瞒该事实。

## 历史固定提交检查

- `package.json`、`millennium.toml`、标签和 Release 均为 `1.0.0`。
- `pnpm run check`、正式构建、`.star` 校验、ZIP 内容和 SHA-256 全部通过。
- 原计划只增加 `.gitmodules` 和 `plugins/steam-game-name-zh` 固定子模块指针；未执行。
- 原计划要求第三方测试使用固定提交；当前不提交 PluginDatabase，因此该测试要求已取消。
