# 手动与离线安装指南

当前版本不通过 Steam Workshop 或 Millennium PluginDatabase 分发。唯一支持的安装来源是本项目的 GitHub Releases；插件代码不会自动升级。

## 下载与校验

1. 打开 [GitHub Releases](https://github.com/mangataw/SteamGameName/releases)，选择最新正式版本。
2. 下载同版本的 ZIP 和 `.sha256` 文件。不要使用来源不明的重新打包文件。
3. 在 PowerShell 中校验 ZIP：

```powershell
Get-FileHash .\steam-game-name-zh-v1.0.0.zip -Algorithm SHA256
Get-Content .\steam-game-name-zh-v1.0.0.zip.sha256
```

两处 SHA-256 应一致。版本更新后，请把示例文件名替换成实际下载的版本。

## 安装

1. 解压 ZIP；归档中应只有 `steam-game-name-zh.star`。
2. 完全退出 Steam 和 Millennium。
3. 将 `.star` 文件复制到当前 Steam 安装所使用的 Millennium `plugins` 目录。
4. 完整启动 Steam，在 Millennium 的插件页面启用“Steam 游戏名中文化”。
5. 确认插件版本、双语/仅中文显示，以及中文、Steam 原名和 AppID 搜索正常。

如果目标电脑不能联网，可以在另一台电脑下载并校验文件，再通过移动存储介质复制 ZIP 或 `.star`。每个正式包都内置完整词库，因此离线状态下仍可显示和搜索；设置页的远程刷新会失败或显示离线，但不会覆盖有效缓存或包内词库。

## 更新

1. 下载并校验新版本。
2. 完全退出 Steam 和 Millennium。
3. 备份现有 `.star`（可选），再用新文件覆盖。
4. 完整重启 Steam 并核对插件版本。

插件代码不会通过远程词库机制更新。远程词库只包含经过校验的 AppID 与名称数据；代码更新始终需要手动替换 `.star`。

## 卸载

1. 完全退出 Steam 和 Millennium。
2. 从 `plugins` 目录删除 `steam-game-name-zh.star`，或先在 Millennium 中禁用插件。
3. 重新启动 Steam，游戏名称会恢复为 Steam 原始值。

若还要删除本插件缓存和设置，请按 [隐私与网络行为](PRIVACY.md) 中记录的路径操作。删除缓存不是卸载插件的必要步骤。

## 当前正式版

`v1.0.0` 的 GitHub Release ZIP SHA-256：

```text
086DAE2B9CDE56FBA0EE39AD470754E0C372C808EE517AB693A037AA34F33E2C
```

该哈希只适用于 `steam-game-name-zh-v1.0.0.zip`；以后版本必须使用其随附的 `.sha256` 文件。
