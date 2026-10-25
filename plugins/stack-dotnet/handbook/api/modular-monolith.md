# Modular monolith, hexagonal

One deployable application, divided into **modules** by business area. Each module is a small hexagonal application of its own: the domain sits in the middle, and everything that talks to the outside world (HTTP, database, other services) is an adapter around it. Taken from pandora.

## When to use it

- **Use it** for a system with several business areas (finances, notes, agenda, identity) that will grow over years, deployed as one application.
- **Don't use it** for a focused service with one responsibility: seven projects per module is too much ceremony for a URL shortener.

Modules are independent enough to be extracted into separate services later, along their boundaries. You rarely need to; the option is there.

## Solution layout

```
src/
  Host/
    <Prefix>.Host/                         # the ASP.NET Core application: composes everything
  Shared/
    <Prefix>.Shared.Domain/                # types every module's domain may use
    <Prefix>.Shared.Infrastructure/        # cross-cutting setup: observability, user context
    <Prefix>.Shared.Persistence/           # database provider and shared persistence pieces
  Modules/
    <Module>/
      <Prefix>.Modules.<Module>.Abstractions/
      <Prefix>.Modules.<Module>.Contracts/
      <Prefix>.Modules.<Module>.Domain/
      <Prefix>.Modules.<Module>.Application/
      <Prefix>.Modules.<Module>.Infrastructure/
      <Prefix>.Modules.<Module>.Persistence/
      <Prefix>.Modules.<Module>.Presentation/
tests/
  <Prefix>.Modules.<Module>.Tests/         # one per module
  <Prefix>.IntegrationTests/               # the whole application against real dependencies
migrations/
  migrations/<module>/                      # SQL migrations, one folder per module
docs/
  modules/<module>/                         # one documentation folder per module
```

## Responsibilities

| Project | Holds | Hexagonal role |
|---|---|---|
| **Abstractions** | the module's identity (`<Module>Module` with its name, database key and schema), its options, and the interfaces other modules may call | public surface |
| **Contracts** | integration events: messages the module publishes for others (`AccountActivated`) | public surface |
| **Domain** | aggregates, value objects, domain errors, and **ports**: the interfaces the domain needs from the outside, like repositories | the core |
| **Application** | use cases: one folder per command or query, with its handler. Plus DTOs and application services. | the core |
| **Infrastructure** | adapters to external systems: HTTP clients, file storage, background jobs | driven adapters |
| **Persistence** | the module's `DbContext`, EF Core entity configurations, and repositories implementing the domain's ports | driven adapter |
| **Presentation** | controllers and request models | driving adapter |

The module's identity class lives in Abstractions so every layer agrees on the same names:

```csharp
public static class NotesModule
{
    public const string Name = "notes";
    public const string DatabaseKey = Name;
    public const string Schema = Name;
}
```

## Dependency rules

| Project | May reference |
|---|---|
| Abstractions | nothing of its own module |
| Contracts | messaging abstractions only |
| Domain | Shared.Domain |
| Application | its own Abstractions, Contracts, Domain; **other modules' Abstractions and Contracts** |
| Infrastructure | its own Abstractions, Domain, Application |
| Persistence | its own Abstractions, Domain; Shared.Persistence |
| Presentation | its own Application; Shared.Domain |
| Host | every module's Application, Infrastructure, Persistence, Presentation; Shared.Infrastructure and Shared.Persistence |

And the rules they add up to:

- **The domain depends on nothing technical.** No EF Core, no ASP.NET Core, no HTTP. It declares ports; adapters implement them.
- **A module talks to another only through that module's Abstractions or Contracts.** Never its Domain, Application or Persistence.
- **A module never reads another module's tables.** If it needs another module's data, it asks through an interface in that module's Abstractions, or keeps its own copy updated by integration events.

## Request flow

```
HTTP → Controller → Command/Query → Handler → Domain + ports → Repository → DbContext → database
                                                    ↓
HTTP ← Controller ← Result<T> ←─────────────────── Handler
```

1. The **controller** (Presentation) builds a command or query from the request and sends it through the mediator. It holds no logic.
2. The **handler** (Application) opens a unit of work on the module's database, loads aggregates through repositories, calls domain methods, saves, and returns a `Result`.
3. The **domain** enforces its own rules and returns errors as values.
4. The controller turns the `Result` into an HTTP response: the value on success, a mapped error (problem details) on failure.

A command or query is a folder with two files:

```
Application/Commands/CreatePage/
  CreatePageCommand.cs           # the input record and the command
  CreatePageCommandHandler.cs
```

## Data

- **PostgreSQL, one database, one schema per module**, named after the module (`notes`). The module's `DbContext` maps only its own schema.
- **Table names carry a module code and a number**: `nte001_page`, `nte002_attachment` (`nte` = notes). The code makes every table's owner obvious in any query or log. Constraints and indexes reuse it: `pk_nte001`, `ix_nte002_page_id`.
- **Columns in `snake_case`.** Ids are `uuid` (v7, time-ordered). Audit columns: `created_by`, `created_at`, `updated_by`, `updated_at`; soft delete with `deleted_at`.
- **Enum values stored as text with hyphens**: `pending-confirmation`, `api-key`.
- **Migrations are plain SQL**, one folder per module under `migrations/migrations/<module>/`, each migration with an `up.sql` and a `down.sql`, applied by [migris](https://github.com/leonardopottmayer/migris) (`npm install -g migris`). The first migration of a module creates its schema.
- **Before 1.0**, a schema change edits the original `CREATE TABLE` migration instead of adding an `ALTER`: there's no production data to migrate yet, and the history stays readable.

## Cross-cutting concerns

- **Authentication**: controllers are `[Authorize]` by default. The current user comes from the user context, never from the request body.
- **Another user's resource is "not found"**, not "forbidden": answering 403 would confirm it exists.
- **Errors**: domain and application errors are values (`Result`); the host maps them to HTTP status codes and problem details in one place.
- **API versioning** in the URL: `api/v{version}/<module>/<resource>`.
- **Messaging between modules**: integration events go through a **transactional outbox**, saved in the same transaction as the change that caused them, then delivered in-process. A module never publishes an event for a change that was rolled back.
- **Time** comes from an injected `TimeProvider`.

## Composition in the host

Each layer of each module exposes one registration method, and the host calls them in order ([one method per registration](../coding-conventions.md#one-method-per-registration)):

```csharp
builder.AddPandoraSharedInfrastructure();
builder.AddPandoraSharedPersistence();

builder.Services.AddNotesPersistence();
builder.AddNotesInfrastructure();
builder.Services.AddNotesApplication();
// ...same three lines for every module...

builder.AddPandoraOutbox();          // after the modules: it needs every module's contracts and database key

builder.Services.AddControllers()
    .AddNotesPresentationPart();     // ...one per module
```

## Tests

- **One test project per module** for the domain and the use cases: aggregates, value objects, handlers with fake ports.
- **One integration test project** for the whole application against a real PostgreSQL in a container (Testcontainers): migrations, repositories, HTTP endpoints.
- Application projects expose internals to their test project (`InternalsVisibleTo`) when a test needs them.

## Adding a module

1. Pick the module name (`Notes`), its schema (`notes`) and its table code (three letters, `nte`).
2. Create the seven projects under `src/Modules/<Module>/` with the references in [Dependency rules](#dependency-rules), and add them to the solution under `/src/Modules/<Module>/`.
3. Abstractions: the `<Module>Module` identity class.
4. Each of Application, Infrastructure, Persistence and Presentation: a `DI` folder with its registration method (`Add<Module>Application`, ...).
5. Persistence: the `<Module>DbContext` mapping the module's schema.
6. Host: reference the four outer projects and call the registration methods.
7. Migrations: `migrations/migrations/<module>/`, starting with `create-schema-<module>`.
8. Tests: `tests/<Prefix>.Modules.<Module>.Tests/`.
9. Docs: `docs/modules/<module>/`.

The scaffold skill does steps 2 to 8.

## Adding a feature to a module

1. **Domain**: the aggregate or value object changes, with its rules and errors. Tests first.
2. **Port**: if the use case needs something new from the outside, a method on a repository interface (or a new port).
3. **Application**: a folder under `Commands/` or `Queries/` with the input, the command and the handler.
4. **Persistence**: the repository method, the entity configuration, and the SQL migration.
5. **Presentation**: the endpoint in the module's controller, plus a request model if needed.
6. **Contracts**: an integration event, if other modules need to react.
7. **Docs**: the module's documentation.

## Building blocks

In pandora, the reusable pieces come from **tars**, my framework:

| Piece | tars package |
|---|---|
| mediator, commands, queries, handlers | `Pottmayer.Tars.Core.Mediator`, `Pottmayer.Tars.Core.Cqrs` |
| `Result`, errors | `Pottmayer.Tars.Core.Primitives` |
| aggregates, value objects | `Pottmayer.Tars.Core.Ddd` |
| unit of work, repositories, database keys | `Pottmayer.Tars.Data.Relational` |
| HTTP error mapping, problem details | `Pottmayer.Tars.Web.Http.AspNetCore` |
| current user | `Pottmayer.Tars.UserContext` |
| transactional outbox | `Pottmayer.Tars.Messaging.EntityFrameworkCore` |

tars is published on GitHub Packages, which requires a GitHub token to install (see [publishing](../../../workflow/handbook/publishing.md)). The architecture doesn't depend on it: without tars, each piece is a small amount of your own code (a `Result` type, a mediator interface, a unit of work around the `DbContext`) or a well-known library. Keep the same shapes, so the rest of this page still applies.
