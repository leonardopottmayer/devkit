---
name: release
description: Sets up and runs automated releases in the devkit workflow - semantic-release on main, a GitHub App bot that commits the version and opens the main → dev sync pull request, a release preview comment, and package publishing to nuget.org, npmjs or GitHub Packages. Use when the user wants to "release", "ship a version", "publish a new version", "set up releases", "automate versioning", "add a changelog", "publish to nuget / npm", when a release failed, or when start-here suggests moving to stage 3 or 4.
---

# Release

Stage 3 (automated releases) and stage 4 (publishing) of the devkit workflow. The rules are in [`releasing.md`](../../handbook/releasing.md) and [`publishing.md`](../../handbook/publishing.md), at `../../handbook/` relative to this file; the templates are in `templates/`. Read the handbook page of what you're about to do before doing it.

| Mode | When | Go to |
|---|---|---|
| **Release** | the project is in stage 3; the user wants to ship what's on `dev` | [Release](#release-1) |
| **Adopt** | move a stage 2 project to stage 3 | [Adopt](#adopt-stage-3) |
| **Publish** | add package publishing (stage 4) | [Publish](#publish-stage-4) |
| **Fix** | a release didn't happen or went wrong | [Troubleshooting](#troubleshooting) |

## Rules

- **Never create tags, edit versions or edit `CHANGELOG.md` by hand**, and never let the user do it. The one exception is the adoption tag below.
- **Ask before anything that reaches GitHub**: pushing, merging, changing rulesets, setting variables.
- **The user handles the bot's private key.** Never read, print or paste the `.pem` file. The user runs the command that stores it.

## Release

1. Make sure `dev` is green: `gh run list --branch dev --limit 3`.
2. Open the release pull request:
   ```bash
   gh pr create --base main --head dev --title "Release $(date +%F)" --body "Release of the changes on dev."
   ```
3. Wait for CI and the **release preview** comment (`gh pr view --comments`). It says which version the merge will release and lists the commits. Show it to the user. If it says "releases nothing" and the user expected a release, look at the commit types (only `feat`, `fix`, `perf` and breaking changes release).
4. With the user's go-ahead, merge it **with a merge commit**:
   ```bash
   gh pr merge --merge
   ```
5. Follow the release: `gh run watch` on the Release run, then `gh release view` to show the result.
6. The bot opens the `main` → `dev` pull request and merges it when CI passes. Check it closed: `gh pr list --base dev --head main`. If it's still open after CI finished, see [Troubleshooting](#troubleshooting).

## Adopt (stage 3)

The project must be in stage 2: `dev` exists and both `main` and `dev` have rulesets (repo-setup, Audit mode).

### 1. One version in the source code

| Stack | Where the version lives | Make sure |
|---|---|---|
| .NET | `<Version>` in `Directory.Build.props` at the root | it exists, and no other property hard-codes the number. `PackageVersion` defaults to `Version`; derived ones like `<AssemblyVersion>$(Version).0</AssemblyVersion>` are fine. Remove `<Version>` from the `.csproj` files. |
| Node | `"version"` in `package.json` (every workspace package, in a monorepo) | all packages have the same number |
| Claude Code plugin | `"version"` in each `.claude-plugin/plugin.json` | same number everywhere |

### 2. Adoption tag

semantic-release continues from the last `v*` tag. Check `git tag --list 'v*'`. If there's none and the project already has a version (say `0.0.18`), tag the current `main` with it, with the user's go-ahead:

```bash
git fetch origin
git tag v0.0.18 origin/main
git push origin v0.0.18
```

Without this tag the first automated release is `1.0.0`. A project with no version yet doesn't need it.

### 3. Copy the templates

On a branch from `dev` (`ci/release`):

1. [`templates/.releaserc.json`](templates/.releaserc.json) → `.releaserc.json` at the root. Replace `PREPARE_CMD` and `VERSION_FILES` using the table below. A project with several stacks joins the commands with ` && ` and lists all the files.

   | Stack | `prepareCmd` | `VERSION_FILES` |
   |---|---|---|
   | .NET | `sed -i -E 's#<Version>[^<]*</Version>#<Version>${nextRelease.version}</Version>#' Directory.Build.props` | `Directory.Build.props` |
   | Node, one package | `npm pkg set version=${nextRelease.version}` | `package.json` |
   | Node, workspaces | `find . -name package.json -not -path '*/node_modules/*' -execdir npm pkg set version=${nextRelease.version} \;` | `package.json` plus one glob per workspace folder (`packages/*/package.json`) |
   | Claude Code plugin | `for f in plugins/*/.claude-plugin/plugin.json; do jq --arg v ${nextRelease.version} '.version = $v' $f > $f.tmp && mv $f.tmp $f; done` | `plugins/*/.claude-plugin/plugin.json` |

   The commands run on the Ubuntu runner, not on the user's machine. Inside the JSON string, escape backslashes and double quotes (`\;` becomes `\\;`, `"` becomes `\"`). `VERSION_FILES` is replaced by one array entry per file or glob.
2. [`templates/release.yml`](templates/release.yml) → `.github/workflows/release.yml`. For stage 3 alone, **delete the `publish` job** (and the `workflow_dispatch` trigger with it).
3. [`templates/release-preview.yml`](templates/release-preview.yml) → `.github/workflows/release-preview.yml`, unchanged.

### 4. The release bot (once per GitHub account)

The bot is a GitHub App. One App serves every repository of the account; skip to step 5 if the user already has one. The user does this in the browser; guide them:

1. *Settings → Developer settings → GitHub Apps → New GitHub App*.
2. Name: something like `<username>-release-bot`. Homepage URL: the user's GitHub profile. **Webhook: uncheck "Active".**
3. Repository permissions: **Contents: Read and write**, **Pull requests: Read and write**. Nothing else.
4. "Where can this GitHub App be installed?": **Only on this account**. Create.
5. On the App page, note the **App ID** and the **Client ID**. Neither is secret.
6. *Generate a private key*: a `.pem` file downloads. It is a secret: tell the user to keep it in their password manager and never commit it.

### 5. Connect the bot to the repository

1. *Install App* (on the App page) → the user's account → **Only select repositories** → add this repository. For an App installed before, add the repository in its installation settings.
2. Store the Client ID as a variable (you can run this one):
   ```bash
   gh variable set RELEASE_APP_CLIENT_ID --body "<client id>"
   ```
3. The user stores the private key, in their own terminal:
   ```bash
   gh secret set RELEASE_APP_PRIVATE_KEY < path/to/the-key.pem
   ```
4. Let the bot bypass the `main` ruleset. Find its id, then write the updated ruleset to a temporary file outside the repository and send it back, replacing `<APP_ID>` with the App ID:
   ```bash
   gh api repos/{owner}/{repo}/rulesets --jq '.[] | select(.name == "main") | .id'
   gh api repos/{owner}/{repo}/rulesets/<RULESET_ID> --jq '{name, target, enforcement, conditions, rules, bypass_actors: (.bypass_actors + [{actor_id: <APP_ID>, actor_type: "Integration", bypass_mode: "always"}])}' > <tmp>/main-ruleset.json
   gh api -X PUT repos/{owner}/{repo}/rulesets/<RULESET_ID> --input <tmp>/main-ruleset.json
   ```
   Only `main`. The bot never pushes to `dev`; it goes through a pull request like everyone else.
5. Check that **Allow auto-merge** is on: `gh api repos/{owner}/{repo} --jq .allow_auto_merge`. If not: `gh repo edit --enable-auto-merge`.

### 6. Ship it

Open the `ci/release` pull request to `dev` (`ci: automate releases with semantic-release`), squash-merge it, then run the first [Release](#release-1). The release workflow arrives on `main` with that merge and runs on it right away.

Explain to the user what changed in their routine: releasing is now opening and merging the `dev` → `main` pull request; versions, tags, changelog and the sync back to `dev` happen on their own ([`releasing.md`](../../handbook/releasing.md)).

## Publish (stage 4)

The project must be in stage 3. Decide the targets with the user ([`publishing.md`](../../handbook/publishing.md#where-to-publish)).

1. On a branch from `dev`, put the `publish` job and the `workflow_dispatch` trigger of [`templates/release.yml`](templates/release.yml) back into the project's `release.yml`. Keep only the steps of the chosen targets: the .NET block (setup, pack, then nuget.org and/or GitHub Packages) and/or the Node block (npmjs and/or GitHub Packages). Drop the `id-token` or `packages` permission no target uses.
2. Adapt to the project: for a Node package in a subfolder, add `working-directory` to its steps. `npm publish` doesn't rewrite `workspace:` dependencies; a pnpm monorepo that publishes packages depending on each other needs `pnpm publish` instead, so check that case before relying on the template.
3. Package metadata, from [`publishing.md`](../../handbook/publishing.md#package-metadata): description, license, repository, README; `IsPackable=false` on .NET test and sample projects; `files` in `package.json`.
4. Per target:

   | Target | Setup |
   |---|---|
   | nuget.org | the user creates a trusted publishing policy on nuget.org (owner, repository, workflow file `release.yml`), then `gh variable set NUGET_USER --body "<nuget.org username>"`. The policy activates on the first successful login, within a few days of its creation. |
   | npmjs | a brand-new package is published once by hand by the user (`npm publish --access public`); then they add the trusted publisher in the package settings (owner, repository, `release.yml`) |
   | GitHub Packages | nothing; `GITHUB_TOKEN` is enough. npm package names must be `@owner/name`. |

5. Pull request to `dev`, squash-merge. The next release publishes.

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| The Release run didn't start | `release.yml` isn't on `main` yet, or the merge commit message starts with `chore(release):` (skipped on purpose) |
| The run passed but released nothing | no `feat`, `fix`, `perf` or breaking change since the last tag. Expected. |
| semantic-release fails pushing to `main` (protected branch) | the App isn't in the `main` ruleset bypass list, or isn't installed on the repository ([step 5](#5-connect-the-bot-to-the-repository)) |
| "Bad credentials" / token step fails | `RELEASE_APP_CLIENT_ID` or `RELEASE_APP_PRIVATE_KEY` is missing or wrong |
| The `main` → `dev` pull request stays open | its CI didn't run or failed (`gh pr checks <number>`). If it has conflicts, someone edited a version file or `CHANGELOG.md` on `dev`: resolve keeping `main`'s version, merge with a merge commit. |
| The first release came out as `1.0.0` | the adoption tag was missing. Talk to the user before doing anything: the tag and the release are public. |
| Publishing failed after the release was created | fix the cause, then publish again: `gh workflow run release.yml -f version=<version>` |
