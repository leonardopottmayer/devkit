# Releasing

A release is a version of the project that is final and identified: a number, a tag, release notes, and possibly published packages. In this workflow, **merging `dev` into `main` is the release**. Everything after that merge is done by a bot. Nobody types a version number, edits the changelog or creates a tag by hand.

## The flow

| # | You | The bot |
|---|---|---|
| 1 | merge features into `dev` as usual ([branching](branching.md)) | runs CI |
| 2 | open the pull request `dev` → `main` | runs CI and comments the version this merge will release, with the list of changes |
| 3 | merge it (**merge commit**) | reads the new commits, computes the version, commits it to `main`, tags it, publishes the GitHub Release (and packages, at [stage 4](publishing.md)) |
| 4 | — | opens a pull request `main` → `dev` with the version bump and enables auto-merge. It merges itself once CI is green. |

One pull request from you per release. The bot's pull request needs nothing from you.

## How the version is computed

The bot is [semantic-release](https://semantic-release.gitbook.io). It reads the [commit messages](commits.md) that reached `main` since the last tag and takes the biggest bump:

| Commits since the last release include | Next version (from `1.4.2`) |
|---|---|
| only `docs`, `refactor`, `test`, `chore`, `ci`, `build` | no release |
| at least one `fix` or `perf` | `1.4.3` |
| at least one `feat` | `1.5.0` |
| at least one breaking change (`!` or `BREAKING CHANGE:`) | `2.0.0` |

## What the bot changes

On every release, in one commit on `main` named `chore(release): <version>`:

- **the version in the source code**, so anyone can read the current version in the repository:

  | Stack | File | Field |
  |---|---|---|
  | .NET | `Directory.Build.props` at the root | `<Version>`, which every project inherits |
  | Node | `package.json` (every workspace package, in a monorepo) | `"version"` |
  | Claude Code plugin | `.claude-plugin/plugin.json` | `"version"` |

  A repository with several stacks gets all of its files updated to the same number.
- **`CHANGELOG.md`**, with the new section on top.

Then it creates the tag `v<version>` on that commit and the GitHub Release with the same notes.

## One version for the whole repository

Every package in a repository shares the same version (*lockstep*). If a repository publishes ten packages and only one changed, all ten get the new version. Consumers always know which versions go together, and there's one tag per release: `v1.5.0`.

> **Exception: independent versions.** If a project ever needs each package to carry its own version, semantic-release isn't the right tool. Use [release-please](https://github.com/googleapis/release-please) in manifest mode instead, with tags like `<package>-v1.5.0`. No project of mine needs this today, so the templates don't cover it.

## The bot's identity: a GitHub App

The release job doesn't run with the default `GITHUB_TOKEN`, for two reasons:

- **A pull request opened with `GITHUB_TOKEN` doesn't trigger CI.** The `main` → `dev` pull request would never get its required check, and auto-merge would wait forever.
- **`main` is protected.** Something has to be allowed to commit the version bump without a pull request.

A personal access token would work, but it's tied to your account, expires, and usually has more access than needed. A **GitHub App** is a dedicated identity with short-lived tokens:

1. Create a GitHub App in your account (*Settings → Developer settings → GitHub Apps*). Permissions: **Contents: read and write** and **Pull requests: read and write**, nothing else. No webhook.
2. Install it on the repository.
3. Save its Client ID as a repository variable (`RELEASE_APP_CLIENT_ID`) and a private key as a repository secret (`RELEASE_APP_PRIVATE_KEY`). The release workflow turns them into a short-lived token with `actions/create-github-app-token`.
4. In the `main` ruleset, add the App to the **bypass list**. It's the only identity allowed to push to `main` directly.
5. Enable **Allow auto-merge** in the repository settings.

One App can serve all your repositories: install it on each one. The **release** skill walks through every step.

semantic-release is configured not to comment on pull requests or open issues, which is why the App needs no other permission.

## Rules that keep it working

- **Never create tags, edit versions or edit `CHANGELOG.md` by hand.** The bot computes the next version from the last tag; a manual tag or edit confuses it.
- **The `main` → `dev` pull request is merged with a merge commit, never squashed.** A squash creates a different commit and `main` and `dev` start to drift.
- **The release commit doesn't carry `[skip ci]`.** That marker would also skip CI on the bot's pull request, and auto-merge would never happen. The release workflow running again on the bot's own commit is harmless: it finds nothing to release and exits.
- **One release at a time.** The workflow uses a `concurrency` group without cancellation: a second merge waits for the first release to finish.

## Hotfix releases

A hotfix pull request merged into `main` triggers the same bot: a patch version is released, and the `main` → `dev` pull request carries the fix to `dev`. See [branching](branching.md#hotfixes).

## Projects below 1.0

semantic-release doesn't give `0.x` versions special treatment: a breaking change on `0.4.0` goes straight to `1.0.0`. While a project is in `0.x` and not ready for `1.0.0`, describe breaking changes in the commit body without the `!` marker; they'll be released as a minor version. When you decide it's time for `1.0.0`, mark the next breaking change properly.

## Adopting it in an existing project

semantic-release starts from the last tag. If the project has never been tagged, the first release would be `1.0.0`. Before enabling it on a project that already has a version, tag the current state of `main` with that version (for example `v0.0.18`), and the bot continues from there.

## Where it runs

| Event | Workflow |
|---|---|
| pull request to `dev` or `main` | CI: build, test. On `dev` → `main`, also the release preview comment. |
| push to `dev` | CI |
| push to `main` | CI, then release |

There are no pre-release versions from `dev`. To try a package in another project before releasing it, use a local feed (see [publishing](publishing.md#testing-before-publishing)).
