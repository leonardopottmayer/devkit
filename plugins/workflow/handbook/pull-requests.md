# Pull requests

Every change reaches `dev` or `main` through a pull request, including the ones you make alone. The pull request is where CI proves the change works, and where you read your own diff one last time before it becomes history.

## One pull request, one change

A pull request does one thing: one feature, one fix, one refactor. Small pull requests are reviewed properly; big ones get skimmed. If the title needs an "and", it's two pull requests.

## Target

| Pull request | Target |
|---|---|
| feature, fix, docs... | `dev` (stage 1: `main`) |
| hotfix | `main` |
| release | `dev` → `main` |

The default branch is `main`, so GitHub will suggest it. Always choose the target on purpose.

## Title

The title is a [Conventional Commit](commits.md): it becomes the commit message on `dev` when the pull request is squash-merged.

```
feat(telegram): support media albums
```

The release pull request (`dev` → `main`) is merged with a merge commit, so its title doesn't feed the changelog. Name it after the date: `Release 2026-10-24`.

## Description

```markdown
## What
One or two sentences: what changes.

## Why
The problem it solves, or the reason it was needed.

## How to test
Steps to see it working, or "covered by tests".

## Notes
Anything the reviewer should know: trade-offs, follow-ups, screenshots.
```

## Before merging

CI must be green. Then read the whole diff on GitHub, file by file, and check:

- [ ] Does it do only what the title says?
- [ ] No secrets, tokens, `.env` contents or personal data?
- [ ] No leftovers: debug logs, commented-out code, TODOs that should be done now?
- [ ] New behavior has tests; changed behavior has updated tests?
- [ ] Docs updated if usage changed?

Reading the diff on GitHub is different from reading it in your editor: you see exactly what will enter history. Do it every time, especially when an AI agent wrote the code.

## Merging

| Pull request | Button |
|---|---|
| feature / fix / hotfix | **Squash and merge** |
| release (`dev` → `main`) | **Create a merge commit** |

The branch is deleted automatically after the merge.

## Drafts

Open a pull request as a **draft** when the work isn't finished but you want CI feedback or to save progress. Mark it ready when it is.

## Commands

```bash
gh pr create --base dev --title "feat(telegram): support media albums" --body-file pr.md
gh pr create --base dev --draft --fill    # draft, title and body from your commits
gh pr checks                             # CI status of the current branch's pull request
gh pr view --web                         # open it in the browser to review the diff
gh pr merge --squash --delete-branch     # feature pull requests
gh pr merge --merge                      # the dev → main release pull request
```
