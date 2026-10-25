---
name: scaffold
description: Creates .NET projects that follow the devkit .NET handbook - a new library (NuGet packages), a new API in one of the cataloged architectures (modular monolith, hexagonal), or a new module inside a modular monolith API. Sets up the slnx solution, global.json, nuget.config, Directory.Build.props, central package management and xUnit v3 + AwesomeAssertions tests. Use when the user wants to "create a .NET project", "start a C# library", "create a web API in .NET", "new ASP.NET Core API", "add a module", or when start-here picks .NET as the stack.
---

# Scaffold (.NET)

Creates the project; the repository around it (CI, protections, releases) is the workflow plugin's job. The rules are in the handbook at `../../handbook/` relative to this file, the templates in `templates/`.

Read [`basics.md`](../../handbook/basics.md) and [`coding-conventions.md`](../../handbook/coding-conventions.md) first, then the page of what you're creating.

| Mode | Go to |
|---|---|
| **New library** | [New library](#new-library) |
| **New API** | [New API](#new-api) |
| **Add a module** to a modular monolith | [Add a module](#add-a-module) |

## Rules

- **Ask for the prefix** (`<Company>.<Product>`, like `Acme.Widgets`) before creating anything. Every name derives from it.
- **Folder = namespace.** Create every project with `-n <full name> -o <folder>/<full name>`.
- **No versions in project files.** Every `<PackageReference>` is versionless; the version goes in `Directory.Packages.props`. Templates from `dotnet new` write versions into the project file: move them.
- **Project files stay minimal.** `TargetFramework`, `Nullable` and `ImplicitUsings` come from `Directory.Build.props`: delete them from generated project files.
- **Build and test before handing over.** `dotnet build` with no warnings and `dotnet test` green, every time.
- **Explain as you go** when the user is new to .NET: what a solution is, what a project reference is, why tests live in their own project.

## The common base

Every mode except Add a module starts here, in an empty folder named after the repository (lowercase, hyphens).

1. Solution and SDK pin:
   ```bash
   dotnet new sln -n <Prefix>
   dotnet --version
   ```
   Copy [`templates/global.json`](templates/global.json) to the root and replace `SDK_VERSION` with the installed version.
2. Copy [`templates/nuget.config`](templates/nuget.config), [`templates/Directory.Build.props`](templates/Directory.Build.props) and [`templates/Directory.Packages.props`](templates/Directory.Packages.props) to the root.
3. In `Directory.Build.props`: for a library, fill `AUTHOR`, `YEAR`, `OWNER/REPOSITORY`, `TAGS` and the license; for an API, delete the package metadata group and the README `ItemGroup` below it.
4. Check the latest stable versions of the packages in `Directory.Packages.props` (`dotnet package search <id> --exact-match`, or nuget.org) and update them if newer ones exist.
5. `dotnet new gitignore`.

## New library

Read [`library.md`](../../handbook/library.md).

1. [The common base](#the-common-base).
2. Agree on the first group with the user (`Caching`, `Messaging`...) and which levels it needs. Start with what's needed now: often just `Abstractions` and the runtime.
3. For each package:
   ```bash
   dotnet new classlib -n <Prefix>.<Group>.Abstractions -o src/<Group>/<Prefix>.<Group>.Abstractions
   ```
   Reduce the project file to the SDK line plus a `<Description>`, delete `Class1.cs`, and add project references between levels (runtime → abstractions, provider → abstractions).
4. Tests, one project per group: create the folder `tests/<Prefix>.<Group>.Tests.Unit/`, copy [`templates/Tests.csproj`](templates/Tests.csproj) into it as `<Prefix>.<Group>.Tests.Unit.csproj`, reference the packages it tests (`dotnet add <test project> reference <project>`), and write a first real test.
5. `dotnet sln add` every project; check that the solution folders mirror `src/<Group>/` and `tests/`.
6. A `README.md` at the root (it becomes the package page) and `docs/<group>/` for the group's usage.
7. Build, test, and `dotnet pack -c Release -o ./packages` once to check the packages come out with the right names, and only the library ones. Delete `./packages` afterwards.

## New API

Read [`api/README.md`](../../handbook/api/README.md) and help the user choose an architecture from the catalog with its "How to choose" questions. If none fits, say so and stop: don't bend the project into the wrong shape.

### Modular monolith, hexagonal

Read [`api/modular-monolith.md`](../../handbook/api/modular-monolith.md).

1. [The common base](#the-common-base), without package metadata.
2. Host:
   ```bash
   dotnet new webapi -n <Prefix>.Host -o src/Host/<Prefix>.Host --use-controllers
   ```
   Move the package versions from its project file to `Directory.Packages.props`, remove the properties `Directory.Build.props` already sets, and delete the sample controller and its model.
3. Shared projects, as class libraries: `src/Shared/<Prefix>.Shared.Domain`, `<Prefix>.Shared.Infrastructure`, `<Prefix>.Shared.Persistence`. Shared.Infrastructure and Shared.Persistence reference Shared.Domain; the Host references Shared.Infrastructure and Shared.Persistence.
4. Ask for the first module (a business area: `Notes`, `Billing`) and [add it](#add-a-module).
5. Integration tests: `tests/<Prefix>.IntegrationTests/` from the test template, referencing the Host. Real dependencies come later, with the first endpoint that needs the database.
6. `migrations/migrations/` for the SQL migrations ([migris](https://github.com/leonardopottmayer/migris)) and `docs/modules/`.
7. Write in the README which architecture the project follows, with a link to its handbook page.
8. Build, test, run the Host once (`dotnet run --project src/Host/<Prefix>.Host`) to show the user it starts.

The building blocks (mediator, `Result`, unit of work, outbox) come from tars in my projects. Ask whether the user will use tars: it's on GitHub Packages and needs a token ([`basics.md`](../../handbook/basics.md#nugetconfig) shows the source mapping). If not, create each block when the first feature needs it, in the shape the handbook describes, never ahead of time.

## Add a module

In a modular monolith, following [Adding a module](../../handbook/api/modular-monolith.md#adding-a-module).

1. Agree with the user on the module name (PascalCase, `Notes`), its schema (lowercase, `notes`) and its three-letter table code (`nte`). Check that the code isn't used by another module (`migrations/migrations/*/`).
2. Create the seven class libraries under `src/Modules/<Module>/`:
   ```bash
   for layer in Abstractions Contracts Domain Application Infrastructure Persistence Presentation; do
     dotnet new classlib -n <Prefix>.Modules.<Module>.$layer -o src/Modules/<Module>/<Prefix>.Modules.<Module>.$layer
   done
   ```
   Reduce each project file and delete each `Class1.cs`.
3. Add the project references exactly as in the handbook's [dependency rules](../../handbook/api/modular-monolith.md#dependency-rules). Presentation needs ASP.NET Core: give it `<FrameworkReference Include="Microsoft.AspNetCore.App" />`.
4. Abstractions: `<Module>Module.cs` with `Name`, `DatabaseKey` and `Schema`.
5. Application, Infrastructure, Persistence, Presentation: a `DI` folder with one registration class each (`ApplicationDI.AddNotesApplication`, `InfrastructureDI.AddNotesInfrastructure`, `PersistenceDI.AddNotesPersistence`, `PresentationDI.AddNotesPresentationPart`). Empty bodies are fine; they're the hooks the host calls.
6. Persistence: `<Module>DbContext` with `HasDefaultSchema(<Module>Module.Schema)`. Add the EF Core packages (Npgsql provider) to `Directory.Packages.props` when this first module needs them.
7. Host: reference Application, Infrastructure, Persistence and Presentation, and call the four registration methods in the order the handbook shows.
8. Migrations: `migrations/migrations/<module>/<yyyyMMddHHmmss>-create-schema-<module>/` with the `up.sql` (`CREATE SCHEMA <module>;`) and `down.sql` (`DROP SCHEMA <module>;`).
9. Tests: `tests/<Prefix>.Modules.<Module>.Tests/` from the test template, referencing Domain and Application.
10. `dotnet sln add` everything under the solution folder `/src/Modules/<Module>/`, build, test.

## Then

Hand over to the workflow: the **repo-setup** skill (Create mode for a new repository, Audit otherwise) adds the CI (`ci-dotnet.yml`), Dependabot and protections. For a library, the **release** skill takes it to automated releases and publishing when the user is ready.
