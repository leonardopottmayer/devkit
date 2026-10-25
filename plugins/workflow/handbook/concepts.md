# Concepts

Every term the handbook uses, in plain words. Read it once; come back when a word doesn't make sense.

## Git and GitHub

**Repository (repo)**: a project folder whose whole history is tracked by Git. The copy on your computer is the *local* repository; the copy on GitHub is the *remote* (usually called `origin`).

**Commit**: a saved snapshot of your changes, with a message that says what changed. Commits are permanent history: you add new ones, you don't edit old ones.

**Branch**: a separate line of commits. You create a branch to work on something without touching the main line, then bring it back when it's done. In this workflow, `main` and `dev` are long-lived; every other branch lives for a few hours or days.

**Push / pull**: *push* sends your local commits to GitHub; *pull* brings commits from GitHub to your computer.

**Pull request (PR)**: a request, on GitHub, to bring the commits of one branch into another. It is where you see the full diff, where CI runs, and where the change is approved. Nothing enters `main` or `dev` without one.

**Merge**: the moment a pull request is accepted and its changes enter the target branch. There are different ways to merge:

- **Squash merge**: all the commits of the branch become *one* commit on the target branch. Keeps history clean: one commit per feature.
- **Merge commit**: the commits keep their identity, and an extra commit joins the two histories. Required when two long-lived branches must stay in sync.

**Conflict**: Git couldn't combine two changes on its own because both touched the same lines. You decide by hand which version stays.

## Automation

**CI (continuous integration)**: a machine that builds and tests the code automatically, on every pull request and every merge. If the tests fail, the pull request can't be merged. In this workflow it runs on **GitHub Actions**.

**Workflow (GitHub Actions)**: a `.yml` file in `.github/workflows/` that tells GitHub what to run and when.

**Check**: the result of a workflow on a pull request (green ✓ or red ✗). *Required* checks must be green before merging.

**Bot / GitHub App**: an automated identity that acts on the repository: it commits version bumps, creates tags, opens pull requests. It is not a person and has only the permissions you give it.

## Versions and releases

**Semantic versioning (SemVer)**: version numbers as `MAJOR.MINOR.PATCH`, like `2.4.1`:

| Part | Goes up when | Example |
|---|---|---|
| PATCH | a bug is fixed, nothing else changes | `2.4.1` → `2.4.2` |
| MINOR | a feature is added, existing usage keeps working | `2.4.2` → `2.5.0` |
| MAJOR | something changes in a way that breaks existing usage | `2.5.0` → `3.0.0` |

Versions below `1.0.0` mean "still unstable": anything can change.

**Tag**: a permanent label on one commit, like `v2.4.1`. It never moves. It is how you know exactly which code is version `2.4.1`.

**Release**: a published version: a tag plus release notes on GitHub, and possibly packages.

**Changelog**: the list of what changed in each version (`CHANGELOG.md`).

## Packages

**Package**: code bundled so other projects can install it. .NET packages are *NuGet* packages; JavaScript packages are *npm* packages.

**Registry**: the server that hosts packages: nuget.org, npmjs.com, or GitHub Packages.

## Security

**Secret**: anything that grants access: passwords, API keys, tokens, connection strings, private keys. Whoever has the secret has the access. See [security](security.md).

**Environment variables / `.env`**: the way an app reads secrets and settings without having them in the code. The `.env` file stays on your machine and never goes into the repository.
