# PluginDatabase 正式提交草案

> **当前暂停提交：** 项目所有者已确认大部分功能代码由生成式 AI 生成，与 PluginDatabase 当前“插件不得主要由 AI 生成”的准入规则冲突。本草案仅保留技术材料，不得用于勾选不真实的合规声明或直接提交 PR。只有维护者书面澄清适用规则，或项目未来真实满足准入条件后，才重新读取官方模板并继续。

本文件原用于冻结 `v1.0.0` 后创建 `SteamClientHomebrew/PluginDatabase` 新插件 PR。提交时必须重新读取官方模板，不复制已经变化的历史字段。

## PR 标题

```text
Add Steam Game Name Zh
```

## 摘要

Steam Game Name Zh is a Windows Millennium plugin that displays reviewed Simplified Chinese or bilingual names in the Steam Library sidebar and adds Chinese-name matching after Steam's native name and AppID search. It does not modify Steam manifests, databases, or game files.

The plugin uses a standard Millennium Lua backend and ships no custom native binaries. Each package contains the full 994-entry catalog, so display and search continue offline. Steam Stable is the supported channel; Beta is tested as a submission compatibility smoke test.

## 必须显著披露的远程数据行为

Release builds conditionally request the complete JSON catalog from the build-fixed URL below:

```text
https://raw.githubusercontent.com/mangataw/SteamGameName/main/data/translations.zh-CN.json
```

- The repository, `main` branch, and path are fixed at build time and cannot be changed by users or downloaded content.
- Catalog-only changes merged to `main` can affect installed releases without advancing the PluginDatabase code pointer.
- Requests send no Steam ID, library contents, search text, settings, credentials, or telemetry.
- Redirects are disabled; TLS verification, an 8-second timeout, a 5 MiB limit, schema/business validation, conditional requests, atomic cache replacement, and bundled/last-valid fallbacks are enforced.
- The response is declarative AppID/name data and cannot supply code, HTML, commands, patches, settings, or another URL.
- If maintainers reject this model, release configuration will disable the request and use only the bundled catalog.

## 测试步骤

1. Install the `.star` built from the pinned submodule commit and restart Steam completely.
2. Enable the plugin in Millennium on a Simplified Chinese Windows 11 Steam client.
3. Confirm a mapped game shows `Chinese name | Steam original name` in the Library sidebar.
4. Switch to Chinese-only mode and confirm the sidebar updates without changing the details page, downloads page, context menu, or launch behavior.
5. Search the Library by Chinese translation, Steam original name, and exact AppID; all three should find the same mapped game.
6. Confirm an unmapped game and a game whose Steam name already contains Han characters remain unchanged.
7. Disconnect the network or make the catalog endpoint unavailable, restart Steam, and confirm bundled or last-valid catalog display/search still works.
8. Disable or remove the plugin and restart Steam; original names must be restored.

## 官方模板填写边界

- 开发者 Stable/Beta 自测：已完成，可如实勾选；当前测试期间 Steam Beta 与 Stable 的 `PACKAGE_CL` 相同，应在说明中披露。
- 标准 Millennium Lua 后端：是。
- 自定义二进制：否。
- 两个其他插件 PR 的测试反馈：可选；未完成时不得勾选或伪造链接。
- 第三方 Stable/Beta 验证：作者不得勾选，留给独立测试者在正式 PR 中完成。
- 生成式 AI 使用程度：项目所有者已确认大部分功能代码由生成式 AI 生成；当前不符合官方准入规则，不得勾选插件合规项或隐瞒该事实。

## 固定提交检查

- `package.json`、`millennium.toml`、标签和 Release 均为 `1.0.0`。
- `pnpm run check`、正式构建、`.star` 校验、ZIP 内容和 SHA-256 全部通过。
- PluginDatabase 只增加 `.gitmodules` 和 `plugins/steam-game-name-zh` 固定子模块指针。
- 第三方测试必须使用该固定提交；若指针因修复推进，应重新确认受影响场景。
