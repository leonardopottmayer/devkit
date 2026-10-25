---
name: repo-setup
description: Creates a GitHub repository that follows the devkit workflow, audits an existing one against it, or moves a repository to stage 2 by adding the dev branch. Covers .gitattributes, .gitignore, pull request template, CI workflow (.NET / Node), Dependabot, repository settings, security settings and branch rulesets. Use when creating the repository of a new project, when the user asks to "set up the repo", "protect main", "add CI", "add dependabot", "check if my repo follows the workflow", "audit the repo", "create the dev branch", or when start-here reaches the repository step.
---

# Repo setup

Brings a repository to the standard of the devkit workflow. Three modes:

| Mode | When | Go to |
|---|---|---|
| **Create** | a local project with code, not on GitHub yet | [Create](#create) |
| **Audit** | an existing repository; find what's missing and fix it | [Audit](#audit) |
| **Add dev** | move a stage 1 repository to stage 2 | [Add dev](#add-dev-stage-2) |

The handbook is in `../../handbook/`, the templates in `templates/`, both relative to this file. The rules behind every item are in [`branching.md`](../../handbook/branching.md) and [`security.md`](../../handbook/security.md); explain them to the user as you apply them.

## Rules

- **Templates are copied, then owned by the project.** Copy each template into the project and adapt it (paths, solution name, check names). The project never references this repository.
- **Ask before anything that reaches GitHub**: creating the repository, pushing, changing settings, creating rulesets. Show what will be done first.
- **`gh` needs a logged-in user** (`gh auth status`). If it isn't, send the user to the setup skill. `{owner}/{repo}` in `gh api` paths is filled in by `gh` from the current repository.
- **Never commit directly to a protected branch.** The only direct push to `main` is the very first one, in Create mode, before the ruleset exists.

## The standard

Every item, with how to check it. Create mode applies all of them in order; Audit mode checks them and fixes the ones that fail.

| # | Item | Check |
|---|---|---|
| 1 | `.gitattributes` from the template | file exists with `* text=auto eol=lf` |
| 2 | `.gitignore` covers build outputs and `.env` files | file exists, contains `.env` |
| 3 | `.env.example` if the app reads configuration | the code reads environment variables → file exists |
| 4 | `README.md`: what the project is, how to run it | file exists and isn't the scaffolder's default |
| 5 | `LICENSE` (public repositories) | file exists |
| 6 | `.github/pull_request_template.md` | file exists |
| 7 | CI workflow per stack + toolchain pin | `.github/workflows/ci-*.yml`; `global.json` (.NET); `.nvmrc` and `packageManager` in `package.json` (Node) |
| 8 | `.github/dependabot.yml` | file exists, lists the project's ecosystems |
| 9 | repository on GitHub, pushed | `gh repo view` |
| 10 | merge settings | see [Settings](#settings) |
| 11 | security settings | see [Security](#security) |
| 12 | ruleset on `main` (and `dev` from stage 2) | `gh api repos/{owner}/{repo}/rulesets --jq '.[].name'` |

## Create

### Files (items 1 to 8)

1. **`.gitattributes`**: copy [`templates/.gitattributes`](templates/.gitattributes) to the root.
2. **`.gitignore`**: generate it with the stack's own tool, then make sure the secrets lines are there:
   - .NET: `dotnet new gitignore`
   - Node: `gh api gitignore/templates/Node --jq .source > .gitignore`
   - both, or neither: combine them by hand.

   Append, if missing:
   ```
   .env
   .env.*
   !.env.example
   ```
3. **`.env.example`**: if the code reads environment variables, list each one with a fake value.
4. **`README.md`**: replace the scaffolder's default with: one paragraph on what the project is, how to install the dependencies, how to run it, how to run the tests.
5. **`LICENSE`**: for a public repository, ask which license. Suggest MIT, the usual choice for open source: `gh api licenses/mit --jq .body > LICENSE`, then replace `[year]` and `[fullname]`.
6. **Pull request template**: copy [`templates/pull_request_template.md`](templates/pull_request_template.md) to `.github/pull_request_template.md`.
7. **CI**: for each stack in the project, copy the template to `.github/workflows/`:

   | Stack | Detected by | Template | Also needs |
   |---|---|---|---|
   | .NET | a `*.sln`, `*.slnx` or `*.csproj` | [`ci-dotnet.yml`](templates/ci-dotnet.yml) | `global.json` at the root. If missing: `dotnet new globaljson --sdk-version <installed SDK> --roll-forward latestFeature` |
   | Node | a `package.json` | [`ci-node.yml`](templates/ci-node.yml) | `.nvmrc` with the Node major version (`node --version`), and `"packageManager": "pnpm@<version>"` in `package.json` (`pnpm --version`) |

   Adapt: if there are several solutions at the root, pass the one to build to `dotnet restore/build/test`; if the Node project lives in a subfolder, add `defaults.run.working-directory` and point `node-version-file` to it. Run the same commands locally once to make sure they pass before pushing.
8. **Dependabot**: copy [`templates/dependabot.yml`](templates/dependabot.yml) to `.github/dependabot.yml`. Keep only the project's ecosystems (`github-actions` always stays). In stage 1, delete every `target-branch: dev` line.

### First commit and push (item 9)

1. `git init -b main` if it isn't a repository yet.
2. `git add .` and show the user `git status`. Look at the list together: nothing secret, nothing generated (`bin/`, `obj/`, `node_modules/`, `dist/`).
3. `git commit -m "chore: initial commit"`.
4. Ask public or private, then:
   ```bash
   gh repo create <name> --public --source . --push
   ```
   (`--private` for a private one.) Name: the folder name, lowercase with hyphens.
5. Wait for the first CI run (`gh run watch`). It must be green before the ruleset makes it required.

### Settings (item 10)

```bash
gh repo edit --enable-squash-merge --enable-merge-commit --enable-rebase-merge=false --delete-branch-on-merge --enable-auto-merge
```

Squash for feature pull requests, merge commits for `dev` → `main`, no rebase, merged branches deleted, auto-merge available for the release bot.

### Security (item 11)

```bash
gh api -X PUT repos/{owner}/{repo}/vulnerability-alerts
gh api -X PUT repos/{owner}/{repo}/automated-security-fixes
gh api -X PATCH repos/{owner}/{repo} -f "security_and_analysis[secret_scanning][status]=enabled" -f "security_and_analysis[secret_scanning_push_protection][status]=enabled"
```

Dependabot alerts, Dependabot security updates, secret scanning with push protection. On a **private** repository of a personal account, secret scanning is a paid feature and the last command fails: tell the user, and that the rules in [`security.md`](../../handbook/security.md#secrets) are the only protection there.

### Ruleset (item 12)

Fill [`templates/ruleset.json`](templates/ruleset.json): replace `BRANCH` (twice) with `main`, and `CHECK` with the job name of each CI workflow (`Build & Test (.NET)`, `Build & Test (Node)`; one entry per workflow). Save it to a temporary file **outside** the repository, then:

```bash
gh api repos/{owner}/{repo}/rulesets --method POST --input <file>
```

From now on, nothing enters `main` without a pull request and a green CI. The project is in **stage 1**.

## Audit

1. Check every item of [the standard](#the-standard). For the GitHub items:
   ```bash
   gh api repos/{owner}/{repo} --jq '{allow_squash_merge, allow_merge_commit, allow_rebase_merge, delete_branch_on_merge, allow_auto_merge, security_and_analysis}'
   gh api repos/{owner}/{repo}/vulnerability-alerts      # 204 = on, 404 = off
   gh api repos/{owner}/{repo}/automated-security-fixes  # "enabled": true/false
   gh api repos/{owner}/{repo}/rulesets --jq '.[].name'
   ```
2. Compare the project's CI workflows and `dependabot.yml` with the current templates. The project may have adapted them on purpose: report the differences that matter (missing `permissions`, outdated action versions, a missing step), not every line.
3. Show the user a table: item, OK / missing / different, what you propose.
4. Fix the items the user approves, one at a time. File changes go through a branch and a pull request like any other change (`ci/...` or `chore/...`), never straight to `main`.

## Add dev (stage 2)

The repository must pass the audit for stage 1 first.

1. Create `dev` from an up-to-date `main` and push it:
   ```bash
   git switch main
   git pull
   git switch -c dev
   git push -u origin dev
   ```
2. Fill the ruleset template again with `BRANCH` = `dev` and create it, like for `main`.
3. Dependabot reads its configuration from the default branch (`main`), so the `target-branch: dev` lines must land there. On a branch from `main`, add `target-branch: dev` to each ecosystem in `.github/dependabot.yml`, open a pull request **to `main`**, squash-merge it. Then open a pull request from `main` to `dev` and merge it with a **merge commit**, so `dev` gets the change too.
4. Explain what changes in the user's routine: new branches start from `dev`, pull requests target `dev` (`gh pr create --base dev`), and releasing means a pull request from `dev` to `main` ([`branching.md`](../../handbook/branching.md)).

Until the project reaches stage 3, nothing brings changes from `main` back to `dev` automatically. Any pull request merged into `main` that didn't come from `dev` (a hotfix, like step 3 above) is followed by a `main` → `dev` pull request with a merge commit, opened by hand.
