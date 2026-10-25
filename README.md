# devkit

How I build software: repository workflow, releases, package publishing and stack playbooks, written as a handbook and packaged as agent skills.

> **This is opinionated.** It documents the way *I* work: the branches I use, how I write commits, how my releases happen. It is not a neutral survey of every option. If you follow it, you learn my way of doing things. Fork it and change what doesn't fit you.

## Who it's for

- **Me**, so I stop rediscovering the same setup in every project.
- **Developers** who want a ready-made process for their repositories.
- **Beginners (vibe coders)** building their first projects with an AI agent. The agent reads this repo and guides you step by step, explaining why each step exists.

## What's inside

| Plugin | Covers | Status |
|---|---|---|
| [`workflow`](plugins/workflow/handbook/README.md) | branching, commits, pull requests, security baseline, automated releases, package publishing | handbook written; skills `start-here`, `setup`, `repo-setup`, `release`, `local-package-testing` |
| `stack-dotnet` | .NET project playbook | planned |
| `stack-node` | React + Vite and NestJS playbooks | planned |

Start reading at the [workflow handbook](plugins/workflow/handbook/README.md). With an agent, just say "start here" or "I want to build...": the `start-here` skill takes it from there.

## Using it with Claude Code

This repository is a Claude Code plugin marketplace:

```
/plugin marketplace add leonardopottmayer/devkit
/plugin install workflow@devkit
```

The `workflow` plugin also brings GitHub's remote MCP server. It asks for an optional GitHub token when enabled; the `setup` skill explains how to create one. Without a token, everything still works through the `gh` CLI.

## Using it without Claude Code

- The handbook is plain Markdown. Read it on GitHub.
- The skills follow the open [Agent Skills](https://agentskills.io) format (`SKILL.md`), so other agents can use them. Copy the whole plugin folder, not just `skills/`: the skills read the handbook next to them.

## Recommended companion

For anything bigger than a small fix, I plan the work with **tlc-spec-driven** by [Tech Leads Club](https://github.com/tech-leads-club/agent-skills) (author: Felipe Rodrigues, CC-BY-4.0). It turns an idea into a spec, a design and atomic tasks, then implements them with tests and one commit per task.

```
npx @tech-leads-club/agent-skills install -s tlc-spec-driven -a claude-code
```

Replace `claude-code` with your agent, or run `npx @tech-leads-club/agent-skills` alone for an interactive wizard. The `setup` skill installs it for you.

## License

[MIT](LICENSE)
