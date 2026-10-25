# 公共发布审计

初次审计日期：2026-08-26；流程复核日期：2026-10-25。初次历史基线为 PluginDatabase `97403bdb67bce6650734bf8d1963989af59d3b46` 与 PluginTemplate `af0a07c7c90de902333ab5268e53ac1bf73bed36`，提交前结论以 2026-10-25 读取的 PluginDatabase `main` 为准。

## 仓库内容

- 被跟踪文件不包含 `node_modules/`、`.millennium/`、`release/`、缓存、日志、构建产物或密钥文件。
- 个人 Steam 库导入记录只保留 AppID、Steam 导出原名、中文译名、好评率和游玩时间等筛选信息，不包含 Steam ID、账户、拥有者或本地库路径。
- 项目具有 MIT 许可证、贡献指南、更新日志、隐私与网络行为说明、安全报告政策、Issue 模板和 PR 检查清单。
- 正式网络地址只由发布构建注入，并固定为同仓库 `main` 的完整词库文件；本地构建的 `backend/source_config.lua` 保持 `remote_url = nil`。
- `pnpm run check:repository` 自动拒绝被跟踪的构建产物、缓存、密钥类文件、本机 Windows 用户路径和个人库导入中的账户/拥有者/库路径字段，并检查公共政策文件及本地无远程地址基线。

## 可复现构建

在只包含提交内容的隔离克隆中执行：

```powershell
pnpm install --frozen-lockfile
pnpm run check
pnpm run build
pnpm run verify:star
pnpm run package
$version = (Get-Content package.json | ConvertFrom-Json).version
pnpm run verify:package -- "release/steam-game-name-zh-v$version.zip"
```

初次隔离审计结果：冻结锁文件安装成功；TypeScript、Lua 静态检查、60 项 Vitest、4 组 Lua 后端测试、当时的 692 条词库校验、Starlight 四区段校验和 ZIP 内容校验全部通过。

当前 `main` 已扩充为 994 条词库，并在工作区和 GitHub CI 通过完整检查、正式构建及 `.star` 校验；800 个公开来源候选的审核快照、最终纳入清单和保留原名理由已经归档在 `docs/catalog-imports/`。`v1.0.0-rc.1` 已完成干净安装、远端 ZIP、SHA-256 与安装产物复验；`v1.0.0` 仍需对其最终标签产物重复 ZIP 内容、哈希和干净安装复验。

首次隔离验证发现 Windows Git 自动换行与 `starlight lsp` 写回 LF 会令三个内容未变化的配置文件显示为已修改。仓库现通过 `.gitattributes` 固定文本文件为 LF，消除该伪脏状态。

## PluginDatabase 当前提交结论

2026-10-25 复核确认，官方 [PluginDatabase](https://github.com/SteamClientHomebrew/PluginDatabase) 已补齐 Starlight 构建路径：CI 以根目录 `millennium.toml` 识别 `.star` 插件，安装数据库配置的 Starlight 版本，并执行 `starlight pack -o dist --release --source-commit <commit>`；只有旧式 loose plugin 才继续读取 `plugin.json`。本项目现有布局可以直接进入该构建链，不添加 `plugin.json`。

当前新插件格式是：fork PluginDatabase，将源码仓库作为子模块加入 `plugins/steam-game-name-zh`，提交 `.gitmodules` 与固定到已审核发布提交的子模块指针，再按新插件 PR 模板提供说明和测试步骤。PR #235（Custom Toast Sounds）和 #241（Sort As Display）均展示了 Starlight/Lua 插件采用这一形式。

PluginDatabase 指南强调：插件仓库的代码更新必须通过新的数据库 PR 推进固定提交，保障用户安全。指南没有明文禁止运行时读取远程数据；当前数据库还收录了运行时访问公共数据的插件，例如按 AppID 请求 ProtonDB 并缓存结果的 `protondb-library-badges`、读取外部游戏时长数据的 `sortium` 及 RSS 插件。因此远程数据不是一概拒绝，而是需要披露和逐项审核。

本项目的正式请求固定到同仓库 GitHub Raw `main` 的完整词库文件，不接受用户 URL、不跟随重定向、校验证书、8 秒超时，不发送游戏库或搜索数据，响应还必须通过大小、Schema 和业务规则校验。`main` 的后续词库变化可以影响已发布插件，这一点会绕过插件代码指针更新，必须在正式 PR 中显著披露并由维护者决定是否接受。

远程词库随 `main` 中经审核的纯数据变更更新，不要求创建插件版本或推进 PluginDatabase 代码指针。若正式评审不接受这种受控远程数据策略，则关闭网络请求并仅使用包内同一份词库。

## 结论

仓库内部的许可证、隐私、安全、数据脱敏、CI、构建和发布包校验已具备公共审查基础，`v1.0.0` GitHub Release 与正式产物实机复验已经通过。PluginDatabase 构建形式支持本项目，远程纯数据边界也已有完整披露草案；但项目所有者已确认大部分功能代码由生成式 AI 生成，与当前官方“插件不得主要由 AI 生成”的准入规则冲突。项目不得勾选不真实的合规声明或直接提交正式 PR。除非维护者书面澄清适用规则，或项目未来通过真实的人类主导重新开发而实际满足准入条件，否则只维持独立 GitHub Release 分发。
