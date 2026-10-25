# 贡献指南

## 词库贡献

普通用户新增、修正或删除游戏中文名时，请直接使用“词库建议”Issue 模板，只需提供改动类型、AppID、Steam 当前原名和建议中文名。详细格式见 [词库建议与贡献](docs/CATALOG_CONTRIBUTIONS.md)。

PR 面向已经实际修改仓库文件的开发者或贡献者，需要提供来源或选择理由并通过检查。词库 PR 不得混入代码、配置或远程地址变更。

词库属于社区维护的显示映射，不声称所有名称均为发行商官方译名。无法形成稳定结论时保留 Steam 原名，不为提高覆盖率而强行翻译，也不为 Steam 当前已经包含汉字的名称添加冗余映射。

## 代码与文档贡献

代码变更应说明问题、实现边界和测试范围；影响补丁、缓存、远程更新或插件生命周期的变更，需要补充对应自动化测试和真机验证记录。请勿在公开内容中提交账户信息、私人游戏库字段、密钥、缓存、构建产物或机器特定路径。

完整的分支、提交、PR 与发布规则见 [Git 工作流](docs/GIT_WORKFLOW.md)。

## 提交前检查

提交前运行：

```powershell
pnpm install --frozen-lockfile
pnpm run check
pnpm run build
pnpm run verify:star
pnpm run package
$version = (Get-Content package.json | ConvertFrom-Json).version
pnpm run verify:package -- "release/steam-game-name-zh-v$version.zip"
```

只修改词库时至少运行 `pnpm run check`；CI 会继续执行构建、`.star` 和发布包验证。不要提交 `.star`、ZIP、缓存或其他生成文件。
