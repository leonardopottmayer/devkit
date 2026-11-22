# Deploying

For an **app** (a website, an API, something that runs on a server) the release ends in Docker images that a server pulls and runs, instead of packages that other projects install. This page is the app counterpart of [publishing](publishing.md): it builds on stage 3 ([releasing](releasing.md)) and replaces stage 4.

## Images follow the branches

A workflow builds the app's images and pushes them to the GitHub Container Registry (GHCR), with tags that say where each one belongs:

| Event | Image tags | Who runs it |
|---|---|---|
| push to `dev` | `:dev` | staging: what the next release will ship |
| release tag `v1.4.0` (pushed by the release bot) | `:1.4.0`, `:latest` | prod, pinned to `:1.4.0` |
| every build | `:sha-<commit>` | nobody by default; a way back to any exact build |

Staging runs `:dev` on purpose. In this workflow the merge into `main` *is* the release, so the place to try a release is before that merge: what staging shows is exactly what merging will ship. A bug found there is fixed on `dev` and never becomes a version.

Prod always runs a **pinned version**, never `:latest` or `:dev`. Deploying is changing that pin; rolling back is changing it back.

```yaml
on:
  push:
    branches: [dev]
    tags: ['v*']
  workflow_dispatch:

permissions:
  contents: read
  packages: write   # push to GHCR with the workflow's own token
```

```yaml
      - uses: docker/metadata-action@<commit hash> # v5.x
        with:
          images: ghcr.io/${{ github.repository_owner }}/<app>-<part>
          tags: |
            type=raw,value=dev,enable=${{ github.ref == 'refs/heads/dev' }}
            type=semver,pattern={{version}}
            type=raw,value=latest,enable=${{ startsWith(github.ref, 'refs/tags/v') }}
            type=sha
```

The release tag starts this workflow only because the release bot pushes it with its own token. A tag pushed with the default `GITHUB_TOKEN` starts no workflow, which is one more reason the bot is a GitHub App ([releasing](releasing.md#the-bots-identity-a-github-app)).

The image is built from the tagged commit, which already holds the bot's version bump, so the version inside the app matches the tag.

## Environments

Each environment (a **tier**: `staging`, `prod`) is isolated: its own Docker network, its own database server, its own credentials. Several apps can share a tier; each gets its own database and its own login role on that tier's server, never the superuser.

| | Staging | Prod |
|---|---|---|
| Images | `:dev` | a pinned version |
| Data | throwaway: recreate it whenever it gets in the way | real, backed up every day, restore tested |
| E-mail | a catcher (Mailhog) | a real SMTP provider |
| Bots and OAuth clients | its own (a Telegram token has one reader; two environments can't share it) | its own |

The same compose file serves every environment of an app. Only the env file changes.

## Configuration and secrets

- One env file per environment next to the compose file (`.env.staging`, `.env.prod`), gitignored, with a copy in the password manager. `docker compose --env-file .env.prod up -d` injects it.
- A `.env.example` in the repository lists every variable ([security](security.md#secrets)).
- Required values fail fast: `${JWT_SIGNING_KEY:?JWT_SIGNING_KEY is required}` in the compose file makes `compose` refuse to start without it, instead of the app starting with a default.
- **Encryption keys never change.** A key that encrypts data in the database (tokens users connected, MFA secrets) travels with that database. A new key makes all of it unreadable.

## Deploying a release

1. The release is out: `gh release view` shows `v1.4.0`, and the tag's image build finished.
2. Run the release's migrations against prod first, when there are any.
3. Pin the new version in `.env.prod` and pull:
   ```bash
   docker compose --env-file .env.prod pull
   docker compose --env-file .env.prod up -d
   ```
4. Check one screen with real data and the logs.

Staging needs nothing per release: `pull` and `up -d` whenever `dev` moved.

## Security updates go through staging

Dependabot opens **security** updates against `main` whatever its configuration says. For a library
they are hotfixes ([security](security.md#dependencies)); for an app, `main` is production, so they
take the normal road instead and reach staging first:

```bash
gh pr edit <number> --base dev       # move it to dev
gh pr comment <number> --body "@dependabot rebase"   # Dependabot rebases it on dev; CI runs again
gh pr merge <number> --squash --auto # once green
```

They ship with the next release. When the vulnerability is urgent, release `dev` right after.

## Private images

GHCR images are private by default, even for a public repository. The server logs in once with a personal access token limited to `read:packages`:

```bash
docker login ghcr.io -u <username>
```

The same kind of token restores private packages during the image build (passed as a Docker build secret, never baked into the image). Give it an expiration date and note it: when it expires, builds fail at the restore step and pulls fail on the server.
