# Steam 游戏名中文化

Millennium / SteamBrew 插件，按 Steam AppID 将 Windows Steam 桌面客户端游戏库左侧列表中的游戏名称显示为简体中文或双语，并允许使用中文译名或 Steam 英文原名搜索。默认格式为 `中文名 | 原名`；Steam 原名已经包含汉字时保持不变。

## 要求

- Windows 10/11
- Steam 稳定版
- Millennium 3.4.0 或更高版本
- Node.js 24 与 pnpm 11（仅开发构建需要）

## 开发

```powershell
pnpm install --frozen-lockfile
pnpm run check
pnpm run build
```

本地构建默认只使用打包词库。发布工作流通过 `GITHUB_REPOSITORY` 注入同仓库 GitHub Raw 地址。

## 安装与卸载

本项目不是独立 Steam 游戏，也不通过 Steam Workshop 分发；它是由 Millennium 加载的 Steam 客户端插件。

1. 安装并启动 Millennium。
2. 从本仓库 GitHub Releases 下载 ZIP，并核对同名 `.sha256` 文件。
3. 将 ZIP 中的 `steam-game-name-zh.star` 文件放入 Steam 的 `plugins` 目录。
4. 重启 Steam，在 Millennium 的插件设置中启用“Steam 游戏名中文化”。

禁用或删除插件后，Hooking API 不再应用补丁，Steam 将显示原始名称；插件不会修改 Steam 清单或数据库。

当前已发布版本为 `v0.2.0`，增加了与显示模式解耦的左栏中文搜索。中文译名、Steam 英文原名和 AppID 搜索，以及 Windows 11 真机、5,000 条本地性能门禁、独立失配降级、空缓存安装和 GitHub Release 正式产物复验均已通过。

## 发布与维护

- `main` 保存随时可审查、可构建的代码，也是远程词库的数据源。
- `v*` 语义化版本标签触发 GitHub Actions，生成发布 ZIP 与 SHA-256 校验和。
- 稳定测试完成后，将仓库作为子模块提交到 Millennium 官方 PluginDatabase；后续版本需要提交新的固定提交指针。
- 分支、提交、PR 和版本规则见 [Git 工作流](docs/GIT_WORKFLOW.md)。

## 隐私与故障排查

插件只访问构建时固定的同仓库词库地址，不上传游戏库、Steam ID 或遥测。断网时继续使用最后一次有效缓存。若 Steam 更新造成左栏结构不兼容，补丁会匹配失败并安全降级；请附上 Steam 与 Millennium 版本提交 Issue，勿提供账户信息或完整本地路径。

完整的请求时机、访问域名、缓存位置和本地数据说明见 [隐私与网络行为](docs/PRIVACY.md)。安全问题请按 [安全政策](SECURITY.md) 报告；版本变化见 [更新日志](CHANGELOG.md)。

已知的 Millennium 宿主问题：Steam/Millennium 刚启动时，插件卡片约每 3 秒更新大小和 CPU 统计，已打开的插件操作菜单可能失去定位锚点、移动到窗口左上角或一闪后消失。该行为已在本插件和 Extendium 上交叉复现，不是本插件词库或设置页面的定时刷新。请等待启动稳定后再打开“配置”；证据、归因和跟踪方案见 [已知问题](docs/KNOWN_ISSUES.md)。
