# 公共发布审计

审计日期：2026-08-26。

## 仓库内容

- 被跟踪文件不包含 `node_modules/`、`.millennium/`、`release/`、缓存、日志、构建产物或密钥文件。
- 个人 Steam 库导入记录只保留 AppID、Steam 导出原名、中文译名、好评率和游玩时间等筛选信息，不包含 Steam ID、账户、拥有者或本地库路径。
- 项目具有 MIT 许可证、贡献指南、更新日志、隐私与网络行为说明、安全报告政策、Issue 模板和 PR 检查清单。
- 正式网络地址只由发布构建注入；本地构建的 `backend/source_config.lua` 保持 `remote_url = nil`。

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

本项目不凭推测添加旧式 `plugin.json` 或改变已经真机验收的 `.star` 结构。提交 PluginDatabase 前必须先确认其对 Starlight `.star` 插件的接入路径；若现行脚本尚未支持，则等待官方流程更新，或采用维护者明确认可的兼容方案。

另需独立确认固定同仓库 Raw 词库是否允许随 `main` 更新。若不允许，切换为审核方认可的捆绑词库或不可变版本化地址，不开放用户自定义 URL。

## 结论

仓库内部的许可证、隐私、安全、数据脱敏、CI、构建和发布包校验已具备公共审查基础。进入 `v1.0.0-rc.1` 前尚需完成 PluginDatabase 构建形式与远程纯数据策略预审，以及 Stable/Beta 和第三方测试门禁。
