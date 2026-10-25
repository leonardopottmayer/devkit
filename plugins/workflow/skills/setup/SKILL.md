---
name: setup
description: Checks which development tools are installed on the user's machine and guides the installation of what's missing, per operating system - git, GitHub CLI, Node (via fnm), pnpm, .NET SDK, Python, and the tlc-spec-driven skill. Use when the user is preparing their computer to code, when a command fails with "not found" / "not recognized", when start-here reaches the setup step, or when the user asks "what do I need to install", "set up my machine", "install node", "install git".
---

# Setup

Get the user's machine ready for the devkit workflow. Check first, install only what's missing, and explain each tool in one sentence before installing it: the user may have never heard of it.

## Rules

- **Check before installing.** Run the check command of every tool needed. Never reinstall something that works.
- **Ask before each installation.** Installing changes the user's system. Show the command, say what it installs, and wait for a yes.
- **The user does the logins.** Never ask for passwords, tokens or codes, and never type them. Authentication commands (`gh auth login`) are run by the user, in their own terminal.
- **Prefer the OS package manager**: `winget` on Windows (built into Windows 10/11), Homebrew on macOS, the distribution's package manager on Linux. Avoid piping scripts from the internet into a shell when a package manager can do it.
- **New tools often need a new terminal.** After installing, the `PATH` changes only for terminals opened afterwards. If a check still fails right after an install, ask the user to open a new terminal (or restart the editor) before trying anything else.

## What each project needs

| Tool | What it's for | Needed when |
|---|---|---|
| git | tracks the history of the code | always |
| GitHub CLI (`gh`) | creates repositories and pull requests from the terminal | always |
| fnm + Node.js | runs JavaScript tooling; fnm picks the Node version each project asks for | Node projects, and to install tlc-spec-driven |
| pnpm | installs JavaScript dependencies | Node projects |
| .NET SDK | builds and runs .NET projects | .NET projects |
| Python 3 | runs the validation scripts of tlc-spec-driven | when using tlc-spec-driven |

Install only the rows the project needs. If you don't know the stack yet, install the two "always" rows and stop there.

## Step 1: detect the operating system

Run a harmless command and read the result (`uname -s` fails on plain Windows; `$PSVersionTable` exists only in PowerShell). Windows, macOS or Linux decides every install command below.

On macOS, check `brew --version`. If Homebrew is missing, it's the first install: point the user to https://brew.sh and let them run the command shown there.

## Step 2: check

| Tool | Check | Works when |
|---|---|---|
| git | `git --version` | prints a version |
| gh | `gh --version` | prints a version |
| fnm | `fnm --version` | prints a version |
| Node.js | `node --version` | prints a version |
| pnpm | `pnpm --version` | prints a version |
| .NET SDK | `dotnet --list-sdks` | lists at least one SDK |
| Python 3 | `python3 --version`; on Windows also `python --version` and `py --version` | prints `Python 3.x` |

Show the user a short table: tool, found / missing, version.

## Step 3: install what's missing

| Tool | Windows | macOS | Linux |
|---|---|---|---|
| git | `winget install -e --id Git.Git` | `brew install git` | `sudo apt install git` / `sudo dnf install git` |
| gh | `winget install -e --id GitHub.cli` | `brew install gh` | follow https://github.com/cli/cli/blob/trunk/docs/install_linux.md (adds GitHub's package repository) |
| fnm | `winget install -e --id Schniz.fnm` | `brew install fnm` | `brew install fnm` if Homebrew is present; otherwise the official script at https://github.com/Schniz/fnm |
| pnpm | `winget install -e --id pnpm.pnpm` | `brew install pnpm` | `npm install -g pnpm` (after Node) |
| .NET SDK | `winget install -e --id Microsoft.DotNet.SDK.10` | `brew install --cask dotnet-sdk` | follow https://learn.microsoft.com/dotnet/core/install/linux for the distribution |
| Python 3 | `winget install -e --id Python.Python.3.13` | `brew install python` | usually preinstalled; otherwise `sudo apt install python3` |

Use the current LTS of .NET and a current Python 3 if newer ones exist than the IDs above.

### fnm needs one more step

fnm works by changing the shell environment, so the shell must load it on startup. Add the line for the user's shell to its profile, then open a new terminal:

| Shell | Profile file | Line |
|---|---|---|
| PowerShell | the file printed by `echo $PROFILE` (create it if missing) | `fnm env --use-on-cd --shell powershell \| Out-String \| Invoke-Expression` |
| bash | `~/.bashrc` | `eval "$(fnm env --use-on-cd --shell bash)"` |
| zsh | `~/.zshrc` | `eval "$(fnm env --use-on-cd --shell zsh)"` |

Then install Node:

- inside a project that has a `.nvmrc`: `fnm install` (reads the version from the file) and `fnm use`;
- otherwise: `fnm install --lts`, then `fnm default lts-latest`.

`--use-on-cd` makes fnm switch Node versions automatically when entering a folder with a `.nvmrc`.

### Python on Windows

Windows installs Python as `python` and `py`, often without a `python3` command. If only `python` works, that's fine: when a tool asks to run `python3 script.py`, run `python script.py` instead.

## Step 4: configure git

Check `git config --global user.name` and `git config --global user.email`. If either is empty:

```bash
git config --global user.name "Their Name"
git config --global user.email "ID+username@users.noreply.github.com"
git config --global init.defaultBranch main
```

Suggest the **GitHub no-reply email** (shown at https://github.com/settings/emails, with "Keep my email addresses private" turned on) instead of a personal address: every commit is public in a public repository, and so is its email.

## Step 5: GitHub account and login

1. If the user has no GitHub account, they create one at https://github.com/signup. Recommend turning on two-factor authentication right away (*Settings → Password and authentication*).
2. Check `gh auth status`. If not logged in, ask the user to run, in their own terminal:
   ```bash
   gh auth login
   ```
   and pick: GitHub.com → HTTPS → authenticate Git with GitHub credentials: yes → login with a web browser. This also lets `git push` work without passwords.
3. Run `gh auth status` again to confirm.

## Step 6: tlc-spec-driven (optional, recommended)

For anything bigger than a small fix, the workflow plans features with **tlc-spec-driven** by Tech Leads Club. It needs Node (for the installer) and Python 3 (for its scripts). Explain what it does in one sentence, ask, then install it for the agent the user is using:

```bash
npx @tech-leads-club/agent-skills install -s tlc-spec-driven -a claude-code
```

Replace `claude-code` with the user's agent if it's a different one. Running `npx @tech-leads-club/agent-skills` without arguments opens an interactive wizard instead. The agent may need a restart to see the new skill.

## Done

Show the final table, everything green. If a tool still fails after a new terminal, say exactly which command fails and with what message; don't keep retrying installs.

If this skill was reached from `start-here`, go back to it.
