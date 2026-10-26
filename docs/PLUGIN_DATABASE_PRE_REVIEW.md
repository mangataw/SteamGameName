# Archived PluginDatabase Pre-review

This text was submitted as PluginDatabase Discussion #236 on 2026-08-26. It received no maintainer reply. On 2026-10-26, the project decided not to submit to PluginDatabase and to continue distribution through manually installed GitHub Releases. This file is retained only as a historical record; it is not an active submission plan.

## 2026-10-25 follow-up

- The current PluginDatabase workflows detect a root `millennium.toml`, install their configured `@steambrew/starlight`, and run `starlight pack -o dist --release --source-commit <commit>`. The legacy `plugin.json` path is now only used for loose plugins. No compatibility `plugin.json` is needed for this repository.
- Current Starlight submissions such as PluginDatabase PRs #235 and #241 use the normal database form: add the source repository as a submodule under `plugins/<slug>`, update `.gitmodules`, and pin the submodule to the reviewed commit.
- The submission guidelines do not explicitly prohibit runtime network data. The accepted database currently includes plugins that request public data at runtime, including `protondb-library-badges`, `sortium`, and an RSS feed plugin. This is evidence that remote data is reviewed case by case, not categorically rejected.
- The guidelines do state that repository changes must advance the PluginDatabase pointer before users receive code updates. A mutable data-only `main` catalog is therefore an important review disclosure even though it contains no executable code. Until maintainers explicitly reject it, this project keeps the controlled catalog design and its bundled/offline fallback.

## Context

Steam Game Name Zh is a Windows-only Millennium 3.4+ plugin compiled with Starlight. It uses a Lua backend and produces one verified, unsigned `steam-game-name-zh.star` artifact. The source repository contains `millennium.toml` and follows the current official PluginTemplate layout.

The plugin changes only Steam's library sidebar display and filtering. It does not read credentials, upload library data, collect telemetry, or ship custom binaries.

## Question 1: Starlight distribution path

At the time of testing:

- PluginTemplate commit: `af0a07c7c90de902333ab5268e53ac1bf73bed36`
- PluginDatabase commit: `97403bdb67bce6650734bf8d1963989af59d3b46`

The template contained `millennium.toml` and no `plugin.json`. At that historical snapshot, PluginDatabase's `scripts/build/prepare-dist.sh` still required root `plugin.json` and exited before preparing the distribution when it was absent.

We reproduced this after a successful Starlight build by running the current database script unchanged. It exited with code 1 and:

```text
plugin.json was not found. It is required for plugins to have.
```

This question was later resolved by the PluginDatabase pipeline: Starlight projects are selected by `millennium.toml` and packed directly. No submission was made, and the project did not add a guessed legacy manifest.

## Question 2: controlled remote data catalog

The current release plan makes conditional HTTPS requests to a build-fixed same-repository catalog URL:

```text
https://raw.githubusercontent.com/mangataw/SteamGameName/main/data/translations.zh-CN.json
```

The repository, `main` ref, and path are injected at build time and cannot be changed by users or downloaded content. Reviewed catalog changes merged to `main` can update an already released plugin without changing its code. Requests do not follow redirects, verify TLS, time out after 8 seconds, and send no Steam ID, library, search, settings, or telemetry data. Responses are size-limited and validated as Schema version 1 AppID-to-Chinese-name data; values cannot contain HTML, control characters, code, commands, patches, or another URL. Invalid responses never replace the last valid cache or bundled catalog.

Is this controlled, data-only same-repository request acceptable for PluginDatabase review, or must the plugin operate exclusively from its bundled copy with no network request? Catalog-only changes are intended to ship through reviewed `main` updates without a new plugin release; code, permissions, or network-location changes still require a versioned plugin update.

## Available evidence

- MIT-licensed public source and frozen dependency lockfile
- Automated TypeScript, Lua static, frontend, backend, patch, catalog, performance, repository-hygiene, Starlight and release-package checks
- Clean-clone Windows build verification
- Stable-channel Windows 11 functional, failure-mode, offline/cache, uninstall and release-artifact verification
- Published privacy/network behavior and security policy

The project did not add a guessed legacy manifest or open a formal PluginDatabase PR. It completed its own release gates and published `v1.0.0` through GitHub Releases. The controlled remote catalog remains documented in the repository privacy and security policies, while every package retains the full bundled catalog for offline use.
