# Publishing packages

Stage 4: the release also publishes the project as packages that other projects install.

**Packages are published only by the release workflow**, right after the bot creates the version ([releasing](releasing.md)). Never from your computer: a package published by hand can't be traced to a commit, and it skips the tests.

## Where to publish

| Registry | For | Who can install | CI authentication |
|---|---|---|---|
| **nuget.org** | public .NET libraries | anyone | trusted publishing |
| **npmjs.com** | public JavaScript packages | anyone | trusted publishing |
| **GitHub Packages** (NuGet or npm) | packages only you (or your organization) use | **only authenticated users**, even when the repository is public | `GITHUB_TOKEN` with `packages: write` |

A project picks one or more targets in its release workflow. Publishing the same version to nuget.org and GitHub Packages at once is fine.

How to choose:

- **Others should be able to use it** → nuget.org or npmjs. GitHub Packages asks every consumer for a token, even for public packages, which keeps most people out.
- **It's for your own projects only** → GitHub Packages works, as long as every machine and CI that installs it has a token.

## Trusted publishing

nuget.org and npmjs support *trusted publishing*: the registry trusts a specific workflow in a specific repository, and GitHub proves the identity of the run with a short-lived OIDC token. There's no API key stored anywhere, so there's no API key to leak.

Setup, once per package or account:

**nuget.org**: in your account, *Trusted Publishing → Create policy*, with the repository owner, the repository and the release workflow file name (just the name, like `release.yml`). The release job needs `permissions: id-token: write` and uses the `NuGet/login` action, with your nuget.org **username** (not an API key), to exchange the OIDC token for a key valid for one hour. Run the workflow within a few days of creating the policy: the first successful login activates it permanently.

**npmjs**: in the package settings, *Trusted publisher → GitHub Actions*, with the owner, the repository and the workflow file name. The release job needs `permissions: id-token: write` and npm 11.5.1 or newer. Provenance is attached automatically. npm only lets you configure this on a package that already exists, so a brand-new package is published once by hand first.

## GitHub Packages

Publishing: the release job gets `permissions: packages: write` and uses `GITHUB_TOKEN`. npm packages on GitHub Packages must be scoped to the owner: `@leonardopottmayer/my-package`.

Installing: every consumer needs a personal access token with `read:packages` ([security](security.md#tokens-you-create)). For NuGet, a `nuget.config` lists the source, and the credentials come from the user-level config or environment, never from a file in the repository. Commit a `nuget.config.example` that shows the shape:

```xml
<configuration>
  <packageSources>
    <add key="nuget.org" value="https://api.nuget.org/v3/index.json" />
    <add key="github" value="https://nuget.pkg.github.com/OWNER/index.json" />
  </packageSources>
</configuration>
```

## Package metadata

A package carries information about itself. Set it once:

**.NET**, in `Directory.Build.props` (shared) and each `.csproj` (`Description`):

- `Authors`, `RepositoryUrl`, `PackageProjectUrl`, `PackageTags`
- `PackageLicenseExpression` (like `MIT`) or `PackageLicenseFile`
- `PackageReadmeFile`, so the registry page shows a README
- `IsPackable=false` on test, sample and tool projects, so they're never published

**npm**, in `package.json`:

- `name`, `description`, `license`, `repository`, `keywords`
- `files`: the **list of what goes into the package**. Without it, npm publishes almost everything in the folder, including files you didn't mean to share.

## Reserving your name on nuget.org

If your packages share a prefix (`Pottmayer.*`), request an ID prefix reservation from nuget.org. Reserved prefixes show a verified badge, and nobody else can publish packages starting with it.

## Testing before publishing

To try an unreleased version in another project, don't publish a pre-release: use a **local feed**, a folder on your machine (`~/local-feed`) that the consuming project installs from. The **local-package-testing** skill does it step by step. The essentials:

**.NET**: pack with a new, higher pre-release version every time, and set `PackageVersion`, not `Version`:

```bash
dotnet pack -c Release -o ~/local-feed -p:PackageVersion=0.0.19-local.$(date +%Y%m%d%H%M%S)
dotnet nuget add source ~/local-feed --name local
```

NuGet caches each version on the machine: re-pack the same version and the consumer keeps running the old code.

**npm**: pack a tarball with `pnpm pack` (it ships exactly what would be published) and install it:

```bash
pnpm pack --pack-destination ~/local-feed
pnpm add ~/local-feed/my-package-1.2.3.tgz
```

The local source, the local version and the tarball dependency never get committed in the consuming project.
