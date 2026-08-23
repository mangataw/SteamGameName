# 贡献指南

新增或修正 `data/translations.zh-CN.json` 时，请提供 AppID、Steam 当前原名、建议简体中文名及来源。优先采用 Steam 官方简体中文名称；文件须保持 AppID 数值升序。

提交前运行：

```powershell
pnpm install --frozen-lockfile
pnpm run check
pnpm run build
pnpm run package
```

词库不得包含 HTML、控制字符、机器广告文案或无汉字译名。代码变更还应说明测试范围；影响补丁、缓存、远程更新或插件生命周期的变更，需要补充对应自动化测试和真机验证记录。

完整的分支、提交、PR 与发布规则见 [Git 工作流](docs/GIT_WORKFLOW.md)。
