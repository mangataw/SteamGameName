# PluginDatabase Pre-review Draft

This draft is intentionally limited to distribution compatibility and the catalog data policy. It is not a plugin submission and has not been sent externally.

## Context

Steam Game Name Zh is a Windows-only Millennium 3.4+ plugin compiled with Starlight 1.1.3. It uses a Lua backend and produces one verified, unsigned `steam-game-name-zh.star` artifact. The source repository contains `millennium.toml` and follows the current official PluginTemplate layout.

The plugin changes only Steam's library sidebar display and filtering. It does not read credentials, upload library data, collect telemetry, or ship custom binaries.

## Question 1: Starlight distribution path

At the time of testing:

- PluginTemplate commit: `af0a07c7c90de902333ab5268e53ac1bf73bed36`
- PluginDatabase commit: `97403bdb67bce6650734bf8d1963989af59d3b46`

The template contains `millennium.toml` and no `plugin.json`. PluginDatabase's current `scripts/build/prepare-dist.sh` still requires root `plugin.json` and exits before preparing the distribution when it is absent.

We reproduced this after a successful Starlight build by running the current database script unchanged. It exited with code 1 and:

```text
plugin.json was not found. It is required for plugins to have.
```

What is the intended submission and distribution path for a Starlight `.star` plugin? Should the repository wait for PluginDatabase's build pipeline to support the current template, or is there a maintainer-approved compatibility manifest/layout?

## Question 2: fixed remote data catalog

Release builds can make conditional HTTPS requests to this fixed same-repository URL:

```text
https://raw.githubusercontent.com/mangataw/SteamGameName/main/data/translations.zh-CN.json
```

The URL is injected at build time and cannot be changed by users or downloaded content. Requests do not follow redirects, verify TLS, time out after 8 seconds, and send no Steam ID, library, search, settings, or telemetry data. Responses are size-limited and validated as Schema version 1 AppID-to-Chinese-name data; values cannot contain HTML, control characters, code, commands, patches, or another URL. Invalid responses never replace the last valid cache or bundled catalog.

Is a mutable, data-only catalog on the repository's `main` branch acceptable for PluginDatabase review? If not, would an immutable tag/commit URL be accepted, or must every catalog update be bundled into a newly reviewed plugin commit?

## Available evidence

- MIT-licensed public source and frozen dependency lockfile
- Automated TypeScript, Lua static, frontend, backend, patch, catalog, performance, repository-hygiene, Starlight and release-package checks
- Clean-clone Windows build verification
- Stable-channel Windows 11 functional, failure-mode, offline/cache, uninstall and release-artifact verification
- Published privacy/network behavior and security policy

The project will not add a guessed legacy manifest or submit to PluginDatabase until the supported Starlight path is confirmed.
