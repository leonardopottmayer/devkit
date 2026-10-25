---
name: local-package-testing
description: Tests an unreleased version of a library (NuGet or npm package) inside another project on the same machine, through a local feed, without publishing anything. Use when the user changed a library and wants to try it in a project that consumes it before releasing ("test my package locally", "use the local version of tars in pandora", "local nuget feed", "npm pack and install", "try the package before publishing"), or when a consumer project still sees old package code after a local repack.
---

# Local package testing

Try a library change inside a consumer project before releasing it. Nothing is published: the package goes into a folder on the user's machine (the **local feed**) and the consumer installs it from there.

The handbook context is [`publishing.md`](../../handbook/publishing.md), at `../../handbook/` relative to this file.

## Rules

- **Never publish a pre-release to a real registry to test something.** That's what this skill avoids.
- **Every change made to the consumer is temporary.** The local feed, the local version and the `file:` dependency never get committed. Check it in [Before committing](#before-committing).
- **.NET: every pack gets a new version.** NuGet caches packages by id and version on the machine. Re-packing the same version doesn't replace what the consumer already restored: it keeps running the old code.

## The local feed

One folder per machine, outside every repository, shared by all libraries: `~/local-feed`. Create it if it doesn't exist.

In PowerShell, write `$HOME\local-feed` wherever this skill says `~/local-feed`: PowerShell doesn't expand `~` in arguments to external programs like `dotnet` and `pnpm`.

## .NET (NuGet)

### 1. Pack the library

In the library repository, pick a version **above** the one the consumer uses now, with a `local` suffix and a timestamp, so each pack is unique and newer than the previous one. If the library is at `0.0.18`:

```bash
dotnet pack -c Release -o ~/local-feed -p:PackageVersion=0.0.19-local.$(date +%Y%m%d%H%M%S)
```
```powershell
dotnet pack -c Release -o $HOME\local-feed -p:PackageVersion=0.0.19-local.$(Get-Date -Format yyyyMMddHHmmss)
```

- **`PackageVersion`, not `Version`.** It changes only the package version and leaves the assembly versions alone. Passing a pre-release `Version` can break the build of projects that derive `AssemblyVersion` from it.
- **Above the current version**, because a pre-release of the *same* number (`0.0.18-local...`) sorts below `0.0.18`, and NuGet reports a downgrade when other packages depend on `0.0.18`.
- In a repository that packs several packages, every package gets the same version, and the dependencies between them point to it.

Tell the user the exact version you packed.

### 2. Point the consumer to the feed

Look at the consumer's `nuget.config`:

- **It has `<clear />`** (it ignores machine-wide sources): add the feed to that file, temporarily:
  ```bash
  dotnet nuget add source ~/local-feed --name local --configfile nuget.config
  ```
- **No `<clear />`, or no `nuget.config`**: add the feed once at user level. It can stay; only local versions live there.
  ```bash
  dotnet nuget add source ~/local-feed --name local
  ```

If the consumer uses package source mapping (`<packageSourceMapping>`), map the library's id pattern to `local` too.

### 3. Use the local version

Find where the consumer sets the library version: `Directory.Packages.props` (central package management, often one shared property for all packages of the library) or each `.csproj`. Change it to the packed version, then:

```bash
dotnet restore
dotnet build
dotnet test
```

### 4. Iterate

Change the library, pack again (new timestamp, so new version), update the version in the consumer, restore. Never re-pack the same version.

If the consumer seems to run old code, the version was reused: pack with a new one.

## npm (pnpm)

### 1. Pack the library

In the library's package folder (each package of a monorepo separately), build it if it has a build step, then:

```bash
pnpm run --if-present build
pnpm pack --pack-destination ~/local-feed
```

`pnpm pack` produces exactly what `publish` would: only the files listed in `files`, with `workspace:` dependencies rewritten to real versions. That's why this skill uses a tarball instead of `pnpm link`, which points at the source folder and hides packaging mistakes.

### 2. Install it in the consumer

```bash
pnpm add ~/local-feed/<package-name>-<version>.tgz
```

The tarball name is printed by `pnpm pack` (a scoped `@owner/name` becomes `owner-name-<version>.tgz`). The consumer's `package.json` now has a `file:` dependency, and the lockfile changed: both are temporary.

### 3. Iterate

Change the library, `pnpm pack` again (the same version is fine), then `pnpm install` in the consumer: it notices the tarball changed. If it still runs old code, run the same `pnpm add` again.

## Before committing

In the **consumer**, before any commit, `git diff` must not contain:

- a `local` package source in `nuget.config`;
- a `-local.` version in `Directory.Packages.props` or a `.csproj`;
- a `file:...tgz` dependency in `package.json`, or the lockfile changes that came with it.

Revert them:

```bash
git restore nuget.config Directory.Packages.props   # the files that changed
git restore package.json pnpm-lock.yaml
pnpm install
```

CI would fail on them anyway (the feed folder doesn't exist there), but don't count on it.

The real flow continues as usual: release the library ([`releasing.md`](../../handbook/releasing.md)), then update the consumer to the released version in a normal pull request.

## Cleaning up

Old local packages pile up. From time to time, with the user's go-ahead:

- delete `~/local-feed/*-local.*.nupkg` and old `.tgz` files;
- delete the local versions from the NuGet cache: the `*-local.*` folders inside `~/.nuget/packages/<package id in lowercase>/`.
