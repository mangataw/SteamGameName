# 贡献指南

新增或修正 `data/translations.zh-CN.json` 时，请提供 AppID、Steam 当前原名、建议简体中文名及来源。优先采用 Steam 官方简体中文名称；没有官方名称时，可采用稳定、无歧义的社区常用译名，并注明依据。文件须保持 AppID 数值升序。

词库属于社区维护的显示映射，不声称所有名称均为发行商官方译名。发现错译、版本后缀不准确或存在更通行写法时，可以提交公开 Issue；有争议的译名应先讨论，无法形成稳定结论时保留原名而不强行翻译。

提交前运行：

```powershell
pnpm install --frozen-lockfile
pnpm run check
pnpm run build
pnpm run verify:star
pnpm run package
pnpm run verify:package -- release/steam-game-name-zh-v0.2.0.zip
```

词库不得包含 HTML、控制字符、机器广告文案或无汉字译名。代码变更还应说明测试范围；影响补丁、缓存、远程更新或插件生命周期的变更，需要补充对应自动化测试和真机验证记录。

完整的分支、提交、PR 与发布规则见 [Git 工作流](docs/GIT_WORKFLOW.md)。
