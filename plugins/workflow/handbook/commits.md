# Commits

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org), in English. The format is machine-readable on purpose: the release bot reads these messages to decide the next version and to write the changelog.

## Format

```
<type>(<scope>): <description>

[optional body: why the change was needed]

[optional footer: BREAKING CHANGE: what breaks and how to migrate]
```

- **type**: what kind of change (table below). Required.
- **scope**: which part of the project, usually the module or package name: `identity`, `telegram`, `caching`. Optional, lowercase.
- **description**: what the change does, in the imperative ("add", "fix", "reject"), lowercase, no period at the end, up to ~72 characters.

## Types and what they do to the version

| Type | Use for | Version bump |
|---|---|---|
| `feat` | a new feature or capability | MINOR |
| `fix` | a bug fix | PATCH |
| `perf` | a performance improvement | PATCH |
| `refactor` | code change that neither fixes nor adds behavior | none |
| `docs` | documentation only | none |
| `test` | adding or fixing tests | none |
| `build` | build system, dependencies | none |
| `ci` | CI workflows | none |
| `chore` | anything else that isn't user-facing | none |
| `revert` | undoing a previous commit | depends on what's reverted |

**Breaking changes** bump MAJOR. Mark them with `!` after the type/scope, and explain in the footer:

```
feat(identity)!: require an explicit signing key

BREAKING CHANGE: AddTarsIdentity no longer generates a key. Set Identity:Jwt:SigningKey (32+ bytes).
```

If a pull request has only `refactor`, `docs`, `test`, `chore`... commits, merging it to `main` releases nothing. That's intended.

## Examples

Real commits from my projects:

```
feat(identity): warn once when ITokenRevocationService is not registered
fix(identity): accept only HS256 when validating JWTs
fix(telegram): mask the bot token in HttpClient logs and spans
fix(email): bump MailKit 4.13.0 -> 4.18.2 to clear vulnerable dependencies
test(email): assert the MIME body type instead of casting it
docs(identity): document the risk of reading API keys from the query string
ci: least-privilege workflow token; pin pack.yml actions to commit hashes
```

And what not to write:

| Bad | Why | Better |
|---|---|---|
| `fixed stuff` | no type, says nothing | `fix(caching): nullable cast of the Redis key` |
| `feat: Added the new endpoint.` | past tense, capital, period | `feat(api): add the tenant lookup endpoint` |
| `feat: telegram albums + refactor + fix tests` | three changes in one | three commits, or three pull requests |
| `wip` | fine on your branch, never on `dev` | (gets replaced by the PR title on squash) |

## Which messages actually matter

Feature branches are squash-merged, so **what lands on `dev` is the pull request title**, not your individual commits. That means:

- On your own branch, commit however helps you, including `wip`.
- The **pull request title** must be a perfect Conventional Commit. It becomes the commit message on `dev`, and from there the changelog. See [pull requests](pull-requests.md).

Writing good commits on your branch is still worth it: they make the pull request easier to review, and tools like tlc-spec-driven produce one clean commit per task anyway.

## Never

- Never commit secrets (see [security](security.md)). Deleting the commit later doesn't help: rotate the secret.
- Never edit version numbers or `CHANGELOG.md` by hand once stage 3 is in place. The bot owns them.
