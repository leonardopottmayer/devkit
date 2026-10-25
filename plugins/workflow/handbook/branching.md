# Branching

## The branches

| Branch | Holds | Created from | Merges into | Lives |
|---|---|---|---|---|
| `main` | released code. Every commit on it is a version. | — | — | forever |
| `dev` | the next release, being assembled | `main` | `main` | forever |
| `<type>/<description>` | one feature or fix in progress | `dev` | `dev` | hours to days |
| `hotfix/<description>` | an urgent fix for released code | `main` | `main` | hours |

GitHub's **default branch is `main`**: visitors see stable code. The consequence is that GitHub suggests `main` as the target of every new pull request, so **always target `dev` explicitly** (`gh pr create --base dev`). The skills do it for you.

> **Stage 1 projects have no `dev` yet.** Feature branches start from `main` and go back to `main`. Everything else on this page applies the day you create `dev`.

## The flow

```
feat/x ──PR (squash)──▶ dev ──PR (merge commit)──▶ main ──▶ bot: version, tag, release, publish
                                                     │
                         dev ◀── PR (merge commit) ──┘  bot: brings the version bump back
```

1. Create a branch from an up-to-date `dev`.
2. Commit as you like while you work.
3. Open a pull request to `dev`. CI runs. When it's green and you've reviewed the diff, squash-merge it. The branch is deleted.
4. Repeat for every feature. `dev` accumulates them.
5. When you want to release, open a pull request from `dev` to `main` and merge it with a merge commit. That merge **is** the release (see [releasing](releasing.md)).

```bash
git switch dev
git pull
git switch -c feat/telegram-album
# ...work and commit...
git push -u origin feat/telegram-album
gh pr create --base dev
```

## Merge strategies

| Pull request | Strategy | Why |
|---|---|---|
| feature → `dev` | **squash** | `dev` gets one clean commit per feature, and its message is the pull request title. The messy work-in-progress commits stay in the pull request. |
| `dev` → `main` | **merge commit** | `main` must contain the *same* commits as `dev`. A squash would create a look-alike commit and the two branches would drift apart, with conflicts on every release. |
| `main` → `dev` (bot) | **merge commit** | same reason, in the other direction |
| `hotfix/*` → `main` | **squash** | it's a single change, like a feature |

The repository settings allow both squash and merge commits. Rebase merging is disabled.

## Naming

`<type>/<short-description>`, lowercase, words separated by hyphens. The type is the same one you'll use in the commit message ([commits](commits.md)).

| Good | Bad |
|---|---|
| `feat/telegram-album` | `leonardo-branch` |
| `fix/refresh-token-race` | `fix` |
| `docs/identity-examples` | `feat/Add_Telegram_Album_Support_And_Refactor_Everything` |

One branch, one change. If you notice something unrelated while working, finish what you're doing and open another branch for it.

## Protection rules

`main` and `dev` are protected by a GitHub ruleset:

- changes only through a pull request;
- the CI check must pass before merging;
- no force push, no deletion;
- **zero required approvals**. GitHub doesn't let you approve your own pull request, so requiring one would lock a solo developer out. You review your own diff instead. Raise it to one approval when someone else joins.
- the release bot (a GitHub App) may push to `main` without a pull request. It's the only exception, and it only commits version bumps.

Merged branches are deleted automatically (repository setting).

## Hotfixes

When released code has a bug that can't wait for the next release, and `dev` already holds changes that aren't ready to ship:

1. Branch `hotfix/<description>` from `main`.
2. Fix it, open a pull request **to `main`**, squash-merge it.
3. The release bot publishes a patch version, then opens its usual `main` → `dev` pull request, which carries the fix to `dev` too. Nothing else to do.

If `dev` is ready to ship anyway, skip the hotfix: fix it on a normal branch and release `dev`.

## Maintaining an old version

Only when you must keep fixing an old major version after a new one is out (say, `1.x` after `2.0.0`): create `release/1.x` from the last `1.x` tag, at that moment, not before. Tags make this possible at any time, so there's nothing to prepare in advance.
