# 公共发布审计

审计日期：2026-08-26。再次核对的官方基线为 PluginDatabase `97403bdb67bce6650734bf8d1963989af59d3b46` 与 PluginTemplate `af0a07c7c90de902333ab5268e53ac1bf73bed36`。

## 仓库内容

- 被跟踪文件不包含 `node_modules/`、`.millennium/`、`release/`、缓存、日志、构建产物或密钥文件。
- 个人 Steam 库导入记录只保留 AppID、Steam 导出原名、中文译名、好评率和游玩时间等筛选信息，不包含 Steam ID、账户、拥有者或本地库路径。
- 项目具有 MIT 许可证、贡献指南、更新日志、隐私与网络行为说明、安全报告政策、Issue 模板和 PR 检查清单。
- 正式网络地址只由发布构建注入，并固定到该发布对应的完整 Git 提交 SHA；本地构建的 `backend/source_config.lua` 保持 `remote_url = nil`。
- `pnpm run check:repository` 自动拒绝被跟踪的构建产物、缓存、密钥类文件、本机 Windows 用户路径和个人库导入中的账户/拥有者/库路径字段，并检查公共政策文件及本地无远程地址基线。

## 可复现构建

在只包含提交内容的隔离克隆中执行：

```powershell
pnpm install --frozen-lockfile
pnpm run check
pnpm run build
pnpm run verify:star
pnpm run package
pnpm run verify:package -- release/steam-game-name-zh-v0.2.0.zip
```

结果：冻结锁文件安装成功；TypeScript、Lua 静态检查、51 项 Vitest、4 组 Lua 后端测试、692 条词库校验、Starlight 四区段校验和 ZIP 内容校验全部通过。

首次隔离验证发现 Windows Git 自动换行与 `starlight lsp` 写回 LF 会令三个内容未变化的配置文件显示为已修改。仓库现通过 `.gitattributes` 固定文本文件为 LF，消除该伪脏状态。

## PluginDatabase 预审结论

截至审计日期，官方 [PluginTemplate](https://github.com/SteamClientHomebrew/PluginTemplate) 已使用 `millennium.toml` 与 Starlight，仓库根目录不再包含旧式 `plugin.json`。但 [PluginDatabase](https://github.com/SteamClientHomebrew/PluginDatabase) 当前的 `scripts/build/prepare-dist.sh` 仍硬性复制根目录 `plugin.json`，并按旧式 `.millennium` 目录准备分发文件；其 CI 也使用 Node.js 20、`pnpm install` 和 `pnpm run build`。

将 PluginDatabase 当前 `scripts/build/` 原样放入本项目已成功构建的隔离克隆后执行 `prepare-dist.sh --silent`，脚本以 `plugin.json was not found. It is required for plugins to have.` 和退出码 1 结束。由此确认当前数据库分发链不能直接接收本项目，也不能直接接收同样不含 `plugin.json` 的最新官方 Starlight 模板。

本项目不凭推测添加旧式 `plugin.json` 或改变已经真机验收的 `.star` 结构。提交 PluginDatabase 前必须先确认其对 Starlight `.star` 插件的接入路径；若现行脚本尚未支持，则等待官方流程更新，或采用维护者明确认可的兼容方案。

已准备不包含无关上游菜单问题的英文预审草稿，见 [`PLUGIN_DATABASE_PRE_REVIEW.md`](PLUGIN_DATABASE_PRE_REVIEW.md)；在用户明确授权外部提交前只保存在本地仓库。

PluginDatabase 当前审核说明要求审计所有网络请求，PR 清单允许可信、公开且不存在关联获利的外部平台，没有明文禁止远程纯数据。本项目的正式请求固定到同仓库 GitHub Raw 的完整发布提交 SHA，不接受用户 URL、不跟随重定向、校验证书、8 秒超时，不发送游戏库或搜索数据，响应还必须通过大小、Schema 和业务规则校验。因此网络行为具备送审基础。

远程词库不再随 `main` 更新；每个产物只能读取其自身发布提交中的词库快照，更新数据必须创建新版本并推进 PluginDatabase 固定提交指针。预审只需确认这种不可变、同提交的纯数据请求是否允许；若仍不允许，则关闭网络请求并仅使用包内同一份词库。

## 结论

仓库内部的许可证、隐私、安全、数据脱敏、CI、构建和发布包校验已具备公共审查基础。进入 `v1.0.0-rc.1` 前尚需完成 PluginDatabase 构建形式与远程纯数据策略预审，以及 Stable/Beta 和第三方测试门禁。
