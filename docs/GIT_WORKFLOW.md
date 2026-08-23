# Git 工作流

## 仓库职责

- GitHub 仓库保存源码、人工维护词库、测试、文档和发布工作流。
- `main` 是唯一长期分支，也是插件运行时读取词库的固定来源。
- GitHub Releases 保存用户安装包与校验和；构建目录、缓存和本地配置不进入 Git。
- Millennium PluginDatabase 只固定经过验证的发布提交，不直接跟随本仓库的日常更新。

## 分支与 Pull Request

1. 从最新 `main` 创建短期分支：`feat/<name>`、`fix/<name>`、`catalog/<appid>`、`docs/<name>` 或 `chore/<name>`。
2. 每个分支只解决一个可审查的问题，保持提交小而完整。
3. 通过 Pull Request 合并；`main` 禁止直接强制推送，建议在 GitHub 开启分支保护、必需 CI 和至少一名审核者。
4. 合并前必须通过 `pnpm run check`、`pnpm run build` 和 `pnpm run package`。涉及 Steam UI 补丁或 Lua 后端时，还必须附对应测试和真机验证结果。
5. 默认使用 squash merge，使 `main` 的每个提交对应一个完整变更。紧急修复也必须走 PR，只可缩短审核流程，不跳过检查。

## 提交信息

采用 Conventional Commits：

```text
feat: add manual catalog refresh
fix: preserve cached catalog after request failure
catalog: add Portal 2 translation
test: cover incompatible sidebar fixture
docs: document preview installation
chore: update build tooling
```

- 标题使用英文、小写类型、祈使语气，建议不超过 72 个字符。
- 不提交密钥、Cookie、用户数据、绝对机器路径、`node_modules/`、`.millennium/`、`release/`、缓存或日志。
- 词库提交正文应记录 AppID、Steam 原名和中文名来源。

## 版本与发布

1. 版本遵循语义化版本：补丁修复增加 PATCH，兼容功能增加 MINOR，不兼容变更增加 MAJOR。
2. 发布前更新 `package.json` 与 `millennium.toml` 中的版本，并完成 `docs/PROJECT_STATUS.md` 的发布门禁。
3. 在已推送且 CI 通过的 `main` 提交上创建带注释标签，例如 `v0.1.0`；禁止移动或复用已发布标签。
4. 标签触发 Release 工作流，注入 GitHub Raw 词库地址，生成 ZIP 与 SHA-256 校验和。
5. 先发布预览版并收集兼容性结果；只有真机矩阵无阻断问题时才标记稳定版并提交 Millennium PluginDatabase。

## 远程与日常同步

标准远程名为 `origin`，地址为 `https://github.com/mangataw/SteamGameName.git`。开始工作前拉取最新 `main`，推送自己的短期分支并创建 PR；不要在共享分支上使用变基或强制推送。
