# Security baseline

This is the minimum every project has from day one, whatever its size. None of it is optional, and none of it is hard.

## Secrets

A secret is anything that grants access: passwords, API keys, tokens, database connection strings, private keys. Whoever holds the secret holds the access, and bots scan public GitHub repositories for leaked keys within minutes.

**Rules:**

1. **Secrets never go into the repository.** The app reads them from environment variables. Locally they live in a `.env` file, which is listed in `.gitignore`.
2. **Commit a `.env.example` instead**, with every variable name and a fake value, so anyone knows what to configure:
   ```
   DATABASE_URL=postgres://user:password@localhost:5432/app
   TELEGRAM_BOT_TOKEN=replace-me
   ```
3. **In CI, secrets live in GitHub** (repository *Settings → Secrets and variables → Actions*), never in workflow files.
4. **Never paste a secret into a chat with an AI agent.** The conversation is sent to an external service. If the agent needs a value, it should tell you where to put it (your `.env`, a GitHub secret) and let you do it.
5. **If a secret leaks, rotate it immediately**: revoke it and generate a new one. Deleting the commit is not enough: the history, forks, caches and scanners already have it.

## Repository settings

Turn these on when the repository is created (*Settings → Code security*):

| Setting | What it does |
|---|---|
| **Secret scanning + push protection** | GitHub rejects a push that contains a recognizable secret, before it becomes public |
| **Dependabot alerts** | warns when a dependency has a known vulnerability |
| **Dependabot security updates** | opens pull requests that fix those vulnerabilities |
| **Branch rulesets** | protect `main` (and `dev`) as described in [branching](branching.md) |

## Dependencies

Every dependency is code you didn't write running with your app's permissions.

- Prefer fewer dependencies. Before adding one, check whether the standard library or the framework already does it.
- Prefer well-known, maintained packages. Look at the last release date and download count.
- Dependabot opens version-update pull requests weekly, grouped, targeting `dev`. Read the changelog of major updates before merging.

## CI workflows

- **Read-only token by default.** Every workflow starts with:
  ```yaml
  permissions:
    contents: read
  ```
  and a job gets more only if it needs it (the release job needs to write tags, for example).
- **Pin third-party actions to a commit hash** in any workflow that touches secrets or has write permissions. A tag like `@v4` can be moved to point at different code; a commit hash can't:
  ```yaml
  uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4.4.0
  ```
- **Bots use a GitHub App, not a personal token.** App tokens are short-lived and scoped to one repository; a personal token is tied to your account and usually has more access than needed. See [releasing](releasing.md).
- **Publishing uses trusted publishing** where the registry supports it, so there's no long-lived API key stored at all. See [publishing](publishing.md).

## Tokens you create

When you must create a personal access token (for example, to install packages from GitHub Packages):

- use a **fine-grained** token, limited to the repositories and permissions it needs;
- give it an **expiration date**;
- store it where the tool expects it (an environment variable, a user-level config file outside the repository), never in a project file.

## Working with an AI agent

- Review every diff the agent produces before it's merged. You're responsible for what enters the repository, whoever typed it.
- If the agent wants to run a command you don't understand, ask it to explain first.
- Don't let the agent read files that hold secrets unless it's necessary. It doesn't need your `.env` to write code that reads from it.
