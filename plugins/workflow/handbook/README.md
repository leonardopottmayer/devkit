# Workflow handbook

This is how I run a repository, from the first commit to a published package. It is the same process for every project, whatever the language.

New to all of this? Read [concepts](concepts.md) first. It explains every term used here in plain words.

## Stages

You don't need the whole process on day one. A project adopts it in stages. Each stage adds one piece on top of the previous one and keeps everything that came before.

| Stage | What you get | Read |
|---|---|---|
| **1. Basics** | a GitHub repository, every change through a pull request, CI running the tests, security baseline | [commits](commits.md), [pull requests](pull-requests.md), [security](security.md) |
| **2. Integration branch** | a `dev` branch where features accumulate before they are released | [branching](branching.md) |
| **3. Automated releases** | merging into `main` creates the version number, the tag, the changelog and the GitHub Release on its own | [releasing](releasing.md) |
| **4. Publishing** | the release also publishes packages (NuGet, npm) | [publishing](publishing.md) |

A website or an app may never need stage 4, and that's fine. Stages 1 to 3 are worth it for any project you plan to keep.

### How to tell which stage a project is in

| If the repository has... | It is at least in stage |
|---|---|
| a CI workflow in `.github/workflows/` and protected `main` | 1 |
| a `dev` branch | 2 |
| a release workflow (semantic-release) | 3 |
| publish targets configured in the release workflow | 4 |

## The rules, in one screen

- `main` holds released code. `dev` holds the next release. Nobody commits directly to either: every change arrives through a pull request.
- Work happens in short-lived branches named `<type>/<short-description>`, created from `dev`.
- Commit messages and pull request titles follow [Conventional Commits](commits.md), in English.
- Feature pull requests are **squash-merged** into `dev`. The `dev` → `main` pull request uses a **merge commit**.
- Merging into `main` is the release. A bot computes the version, tags it, writes the changelog and publishes. Nobody types a version number by hand.
- Secrets never enter the repository, and never enter a chat with an AI agent.
