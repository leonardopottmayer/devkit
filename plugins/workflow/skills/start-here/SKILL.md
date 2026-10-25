---
name: start-here
description: Entry point of the devkit workflow and its "what's next" navigator. Guides a person, possibly with no programming background, from an idea to a working repository, one step at a time, explaining why each step exists. Use when the user wants to start a new project ("I want to build...", "create a project", "how do I start"), asks where they are or what to do next in an existing project ("what's next", "what now", "where am I"), or seems lost about the development process. Delegates machine preparation to the setup skill and feature planning to tlc-spec-driven.
---

# Start here

You are guiding someone through the devkit workflow. They may be an experienced developer or someone who has never used git. Find out which, and adapt: skip the explanations for the first, slow down for the second.

The workflow is documented in the handbook, at `../../handbook/` relative to this file. Read [`../../handbook/README.md`](../../handbook/README.md) before starting. Read each other page when the step that needs it comes up, not all at once.

## How to guide

- **One step at a time.** Say what the step is, why it exists (one or two sentences), do it or have the user do it, confirm it worked, then move on. Never dump the whole plan on a beginner.
- **Speak the user's language.** The handbook is in English; your explanations are in whatever language the user writes in.
- **Explain terms the first time they appear**, using [`concepts.md`](../../handbook/concepts.md). "A branch is a separate line of work, so you can try things without touching the main version."
- **Teach this workflow, not alternatives.** The handbook is opinionated on purpose. If the user asks why it's done this way, explain the reason given in the handbook; don't offer a menu of other ways.
- **`gh` is the reference for GitHub operations.** The skills write their commands with `gh`. If the GitHub MCP server is connected, you may use its tools for the same things (reading a pull request, its checks, a CI run); the result must be the same.
- **The user stays in control.** Ask before anything that leaves their machine or is hard to undo: creating the GitHub repository, pushing, merging, publishing. Never ask for or type passwords, tokens or other secrets (see [`security.md`](../../handbook/security.md)).

## First: new project or existing one?

Look at the current folder:

- **Not a git repository, or empty** → new project, go to [New project](#new-project).
- **A git repository** → existing project, go to [Existing project](#existing-project).

## New project

### 1. Understand the idea

Ask, one question at a time, only what's needed to choose a stack:

1. What do you want to build? (one or two sentences)
2. Who will use it: you, people you know, anyone on the internet?
3. What kind of thing is it?

| If it's... | It is a... |
|---|---|
| something people open in the browser and click around | web frontend |
| something other programs call to get or save data | API (backend) |
| both of the above | frontend + API |
| code other developers install in their projects | library (package) |
| a tool run from the terminal | CLI |

Repeat the idea back in one sentence and confirm before moving on.

### 2. Choose the stack

| Kind | Stack | Playbook |
|---|---|---|
| web frontend | React + Vite | `stack-node` (planned) |
| API | NestJS, or .NET if the user prefers C# | `stack-node` (planned) / `stack-dotnet` |
| library | .NET (NuGet) or TypeScript (npm), whichever the user's ecosystem is | `stack-dotnet` / `stack-node` (planned) |
| CLI | .NET or Node | planned |

**.NET** has its playbook: the `stack-dotnet` plugin's **scaffold** skill creates the project (step 4). For a stack whose playbook is still planned: create the project with the official scaffolder (`pnpm create vite`, `pnpm dlx @nestjs/cli new`), tell the user that stack-specific conventions are coming later, and apply the workflow from this handbook, which doesn't depend on the stack. If the `stack-dotnet` plugin isn't installed, suggest installing it (`/plugin install stack-dotnet@devkit`).

### 3. Prepare the machine

Use the **setup** skill for the tools this stack needs. Come back here when it's done.

### 4. Create the project and the repository (stage 1)

1. Create the project in a folder named after the project (lowercase, hyphens): with the stack's skill when its playbook exists (**scaffold** for .NET), otherwise with the official scaffolder. Run it once to show the user it works.
2. Use the **repo-setup** skill in Create mode: it adds the standard files, the CI, makes the first commit, creates the GitHub repository and protects `main`.

Each step of repo-setup is a moment to explain one concept: what a commit is, what the remote is, why `main` is protected, what CI does.

The project is now in **stage 1**. Continue with [Daily work](#daily-work).

## Existing project

### 1. Find the stage

Use the table "How to tell which stage a project is in" in [`../../handbook/README.md`](../../handbook/README.md):

- `.github/workflows/` has a CI workflow and `main` is protected (`gh api repos/{owner}/{repo}/rulesets`) → stage 1
- `git branch -a` shows a `dev` branch → stage 2
- a release workflow running semantic-release exists → stage 3
- the release workflow publishes packages → stage 4

If the project doesn't meet stage 1, the next step is to bring it there with the **repo-setup** skill in Audit mode.

### 2. Find where the work is

Check `git status` and the current branch:

| Situation | Next step |
|---|---|
| on `main` or `dev` with no changes | start a new piece of work ([Daily work](#daily-work)) |
| on a feature branch with uncommitted changes | finish, commit, push |
| on a feature branch, pushed, no pull request (`gh pr view` fails) | open the pull request ([`pull-requests.md`](../../handbook/pull-requests.md)) |
| a pull request is open | check CI (`gh pr checks`), review the diff, merge |

Tell the user where they are in one sentence, and propose the next step.

## Daily work

The loop the user repeats for every change:

1. **Start from an up-to-date base.** `dev` from stage 2 on, `main` in stage 1. Create a branch named `<type>/<short-description>` ([`branching.md`](../../handbook/branching.md)).
2. **Plan, if it's bigger than a small fix.** Use **tlc-spec-driven** to turn the idea into a spec and tasks before writing code. If it isn't installed, offer to install it via the setup skill. For a small fix, skip straight to the code.
3. **Build it**, with tests.
4. **Open a pull request** to the right base, with a Conventional Commit title ([`commits.md`](../../handbook/commits.md), [`pull-requests.md`](../../handbook/pull-requests.md)).
5. **CI green, diff reviewed by the user, squash-merge.** Walk a beginner through the review checklist the first few times.

## When to move to the next stage

Suggest the next stage when the need appears, not before:

| Move to | When |
|---|---|
| stage 2 (`dev`) | the project is in use by someone, and the user wants to group several changes before they reach `main` |
| stage 3 (automated releases) | the user wants version numbers, a changelog, or will publish packages |
| stage 4 (publishing) | the project is a library others will install |

Each move is described in the handbook page of that stage ([`branching.md`](../../handbook/branching.md), [`releasing.md`](../../handbook/releasing.md), [`publishing.md`](../../handbook/publishing.md)). Explain what changes in the user's routine before making the move. The move to stage 2 is done by the **repo-setup** skill (Add dev mode); stages 3 and 4 by the **release** skill.
