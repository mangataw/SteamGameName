# Steam 游戏名中文化

Millennium / SteamBrew 插件，按 AppID 为 Steam 游戏库左侧列表显示简体中文或双语名称，并支持中文、Steam 原名和 AppID 搜索。插件不修改 Steam 清单、数据库或游戏文件。

## 功能

- 默认显示 `中文名 | Steam 原名`，也可切换为仅中文名，立即生效；
- 中文译名、Steam 原名和 AppID 均可用于过滤游戏库左栏；
- Steam 当前名称已经含有汉字时保持原样；
- 每个安装包内置完整词库，断网时仍能显示和搜索；
- 可从构建时固定的同仓库 `main` 词库取得经审核的纯数据更新；
- Steam UI 结构不兼容时安全停用对应补丁，不阻止 Steam 启动。

当前 `main` 内置 994 条 AppID 映射。译名优先采用官方简体中文名称，其次采用稳定、无歧义的社区常用译名；社区译名不代表发行商官方本地化。

## 兼容范围

- Windows 11；
- Steam 桌面模式、简体中文界面；
- Steam Stable 是正式支持范围；Steam Beta 仅进行尽力而为的兼容性冒烟测试，不承诺持续支持；
- Millennium 3.4.0 或更高版本。

Windows 10、Steam 英文界面、Big Picture、Steam Deck、Linux、macOS、非 Steam 快捷方式和游戏库左栏以外的界面不在当前发布保证范围内。

## 安装、更新与卸载

本项目不是独立 Steam 游戏，也不通过 Steam Workshop 或 Millennium PluginDatabase 分发。当前唯一支持的分发方式是从 GitHub Releases 下载并手动安装；目标电脑可以完全离线使用包内词库。这里的“手动/离线安装”描述安装渠道，不会强制关闭插件已披露的可选远程词库检查。

1. 安装并启动 Millennium。
2. 从 [GitHub Releases](https://github.com/mangataw/SteamGameName/releases) 下载 ZIP，并核对同名 `.sha256` 文件。
3. 将 ZIP 中唯一的 `steam-game-name-zh.star` 放入 Steam 的 `plugins` 目录；更新时覆盖旧文件。
4. 完整重启 Steam，在 Millennium 的插件页面启用“Steam 游戏名中文化”。

需要在离线电脑安装、核对 SHA-256、更新或卸载时，请按 [手动与离线安装指南](docs/MANUAL_INSTALLATION.md) 操作。插件代码不会自动更新；升级版本时需要重新下载并覆盖 `.star` 文件。

禁用或删除 `.star` 文件并重启 Steam 后，名称会恢复为 Steam 原始值。若还要清除词库缓存，请先完全退出 Steam 和 Millennium，再按 [隐私与网络行为](docs/PRIVACY.md) 中的路径删除本插件专用缓存目录。

当前稳定版本为 `v1.0.0`。版本变化见 [更新日志](CHANGELOG.md)，当前门禁见 [项目状态](docs/PROJECT_STATUS.md)。

## 设置与故障排查

设置页可以切换显示模式、查看词库来源和条目数，并手动刷新词库。

- 名称没有变化：确认插件已启用并完整重启 Steam；再查看设置页是否提示当前 Steam 结构不兼容。
- 中文搜索失效但名称仍正常：显示与搜索是独立补丁，Steam 更新可能只影响搜索；请记录 Steam 与 Millennium 版本后提交 Bug。
- 刷新失败：现有有效缓存或包内词库会继续使用；检查网络后可再次手动刷新。
- “配置”菜单启动后偏移或消失：这是 Millennium 启动期宿主竞态，请等待资源统计稳定后再打开。详情见 [已知问题](docs/KNOWN_ISSUES.md)。

提交 Bug 时请提供复现步骤、Steam 版本、Millennium 版本和设置页错误状态，不要附带 Steam ID、Cookie、令牌、私人游戏库或含用户名的完整路径。

## 网络、隐私与安全

正式构建只访问构建时固定的同仓库 HTTPS Raw `main` 词库；用户和远程内容都不能更改地址。插件不上传游戏库、Steam ID、搜索内容或遥测。远程响应必须通过大小、Schema 和业务规则校验，失败内容不会覆盖有效缓存。

请求时机、域名、缓存位置和离线行为见 [隐私与网络行为](docs/PRIVACY.md)。安全漏洞请按 [安全政策](SECURITY.md) 私下报告，不要在公开 Issue 中披露利用细节。

## 贡献

- 普通词库新增、修正或删除：使用“词库建议”Issue 模板，提供 AppID、Steam 原名和建议中文名；格式见 [词库建议与贡献](docs/CATALOG_CONTRIBUTIONS.md)；
- 已经修改仓库文件：按 PR 模板提交变更说明和验证结果；
- 代码与文档：阅读 [贡献指南](CONTRIBUTING.md) 和 [Git 工作流](docs/GIT_WORKFLOW.md)；
- 当前架构、发布门禁和历史验收证据：见 [项目状态](docs/PROJECT_STATUS.md) 与 [公共发布审计](docs/PUBLIC_RELEASE_AUDIT.md)。

## 本地开发

开发构建需要 Node.js 24 和 pnpm 11。本地构建默认不配置远程地址，只使用包内词库。

```powershell
pnpm install --frozen-lockfile
pnpm run check
pnpm run build
pnpm run verify:star
pnpm run package
$version = (Get-Content package.json | ConvertFrom-Json).version
pnpm run verify:package -- "release/steam-game-name-zh-v$version.zip"
```

正式标签构建会注入固定词库地址并生成 ZIP 与 SHA-256。远程数据边界、可复现构建与发布审计保留在 [公共发布审计](docs/PUBLIC_RELEASE_AUDIT.md)，不在 README 重复维护。
