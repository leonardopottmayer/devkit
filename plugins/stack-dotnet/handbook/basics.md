# .NET basics

What every .NET repository of mine has, library or API.

## Repository layout

```
<repository>/
  <Prefix>.slnx                 # the solution (XML format)
  global.json                   # SDK version and test runner
  nuget.config                  # package sources
  Directory.Build.props         # settings and version shared by every project
  Directory.Packages.props      # every package version
  src/                          # production code
  tests/                        # test projects
```

The scaffold skill's templates hold each of these files ready to copy.

## Names

- **Prefix**: `<Company>.<Product>`, like `Pottmayer.Tars` or `Pottmayer.Pandora`. Every project, namespace and package starts with it.
- **Project name = assembly name = root namespace.** `Pottmayer.Tars.Caching.Redis` lives in a folder with that same name.
- **Folder = namespace.** Every folder segment inside a project appears in the namespace of the files in it. A folder that isn't part of the namespace doesn't exist.
- **Everything in English**: code, folders, projects, database objects. Comments and user-facing text may be in other languages.

## The solution

`.slnx`, the XML solution format, is the default from .NET 10 on (`dotnet new sln` creates it). Solution folders mirror the folders on disk (`/src/Caching/`, `/tests/`).

## `global.json`

Pins the SDK so everyone, and CI, builds with the same one, and opts in to Microsoft.Testing.Platform for `dotnet test`:

```json
{
  "sdk": { "version": "10.0.401", "rollForward": "latestFeature" },
  "test": { "runner": "Microsoft.Testing.Platform" }
}
```

`latestFeature` accepts newer patch and feature bands of the same major (`10.0.4xx` and up). The CI workflow template reads this file to install the SDK. The `test` section is required by xUnit v3 on the .NET 10 SDK: without it, `dotnet test` fails.

## `nuget.config`

Lists the package sources and clears the ones configured on the machine, so every build restores the same way:

```xml
<packageSources>
  <clear />
  <add key="nuget.org" value="https://api.nuget.org/v3/index.json" />
</packageSources>
```

A project that also consumes a private feed (like tars from GitHub Packages) adds it here, with **package source mapping** so each package comes from exactly one source; central package management warns (NU1507) without it:

```xml
<packageSourceMapping>
  <packageSource key="nuget.org"><package pattern="*" /></packageSource>
  <packageSource key="github"><package pattern="Pottmayer.*" /></packageSource>
</packageSourceMapping>
```

Credentials for a private feed never go in this file ([security](../../workflow/handbook/security.md#tokens-you-create)).

## `Directory.Build.props`

Applies to every project below it:

- `TargetFramework`, `Nullable` (enabled), `ImplicitUsings` (enabled). Project files don't repeat them.
- `<Version>`: the one version of the repository. From stage 3 of the workflow on, the release bot writes it ([releasing](../../workflow/handbook/releasing.md)).
- Libraries also put the package metadata here (authors, license, repository URL, README). Each project sets only its own `<Description>`.

> tars still repeats `TargetFramework`, `Nullable` and `ImplicitUsings` in each project file. New projects keep them in `Directory.Build.props`.

## Central package management

Every package version lives in `Directory.Packages.props`. Project files reference packages **without a version**:

```xml
<!-- Directory.Packages.props -->
<PackageVersion Include="Microsoft.Extensions.DependencyInjection.Abstractions" Version="10.0.13" />

<!-- a project file -->
<PackageReference Include="Microsoft.Extensions.DependencyInjection.Abstractions" />
```

One package, one version, one place to update. `dotnet add package` already writes the version to `Directory.Packages.props` when central management is on, and Dependabot understands it.

> tars and pandora still declare versions in each project file; they'll be migrated.

## Tests

| | |
|---|---|
| Framework | **xUnit v3**, run by Microsoft.Testing.Platform |
| Assertions | **AwesomeAssertions**: `result.Should().Be(expected)` |
| Project names | `<Prefix>.<Area>.Tests.Unit`, `<Prefix>.<Area>.Tests.Integration` |
| Location | `tests/`, one project per area (a package group in a library, a module in an API) |
| Integration tests | real dependencies in containers (Testcontainers), never mocks of a database |

AwesomeAssertions is a free (Apache 2.0) continuation of FluentAssertions 7, with the same API. FluentAssertions 8 and later need a paid license for commercial use, so new projects don't use it.

> tars uses xUnit 2 with FluentAssertions 8, and pandora xUnit 2 with plain `Assert`. New projects use the stack above.

Tests assert behavior through public entry points. Name them after what they check: `Rejects_signing_keys_shorter_than_32_bytes`.

## Commands

```bash
dotnet restore
dotnet build --no-restore -c Release
dotnet test --no-build -c Release
dotnet pack --no-build -c Release -o ./packages    # libraries
```

These are the same commands the CI runs. Run them before opening a pull request.

## Integration with the workflow

| Workflow piece | .NET |
|---|---|
| CI | `ci-dotnet.yml` from the repo-setup skill |
| `.gitignore` | `dotnet new gitignore` |
| Where the version lives | `<Version>` in `Directory.Build.props` |
| Release bot `prepareCmd` | the `.NET` row in the release skill |
| Publishing | `dotnet pack` + push, in the release workflow's publish job |
| Dependency updates | Dependabot, `nuget` ecosystem |
| Local package testing | `-p:PackageVersion=...-local.<timestamp>` (local-package-testing skill) |
