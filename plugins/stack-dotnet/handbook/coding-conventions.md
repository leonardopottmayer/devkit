# Coding conventions

Code-level decisions applied across my .NET code. They aren't style preferences: they were made once and are followed everywhere, so new code matches the old.

`<Prefix>` below is the project's short name used in method names (`Tars`, `Pandora`).

## Style

- **File-scoped namespaces**, one type per file, file named after the type.
- **`sealed` by default.** A class is open for inheritance only when it's designed for it.
- **Primary constructors** for dependency injection: `public sealed class CreatePageCommandHandler(IUnitOfWorkFactory factory, TimeProvider timeProvider)`.
- **Records** for inputs, outputs and value-like data.
- **`internal`** for implementation details that other projects don't need (EF Core configurations, helpers).
- **`TimeProvider`**, injected, instead of `DateTime.UtcNow`: time becomes testable.
- **`CancellationToken`** on every async method that does I/O, passed all the way down.
- **XML docs on public types and members**, saying what it's for and anything non-obvious. Comments inside methods explain *why*, never *what*.

## Expected failures are results, not exceptions

An operation that can fail for a business reason (invalid input, not found, conflict) returns a `Result` carrying either the value or the errors. Exceptions are for the unexpected: a bug, the database down. Callers can't forget to handle a `Result`; an exception is invisible in the signature.

## `Options` vs `Configuration` suffix

The suffix records **how the type is configured**:

| Suffix | Means | How to tell |
|---|---|---|
| `…Options` | binds to an `appsettings` section | has an overload taking the host builder and a section name |
| `…Configuration` | configured only in code, through an `Action<>` | no section, no binder; a builder you call methods on |

Values that change per environment (hosts, ports, credentials) belong in `Options`. Things JSON can't express (generic methods, routes, closures) make a `Configuration`. A family where most types are `Options` and one is `Configuration` is correct: the suffix tells you which one isn't appsettings-bound.

## One method per registration

There's **no "register everything" method** in a library. Each registration is its own small, public method, and the application composes what it uses:

```csharp
services.AddTarsIntegrationEventTypeRegistry(eventTypes);
services.AddTarsIntegrationEventRouter();
services.AddTarsIntegrationEventDispatcher();
```

A provider may offer an entry point that calls the pieces in order, but it's only a composition of public methods, each callable on its own. The documentation shows how to combine them.

In an API, each module layer has one registration method (`AddNotesPersistence`, `AddNotesApplication`), and the host composes them.

## `TryAdd`, so the application can override

Libraries register with `TryAdd*`, not `Add*`. An application that registers its own implementation **first** keeps it, and the library leaves it in place. That's how an application changes a behavior without forking the library.

## Registration names

- Public registration extensions are named `Add<Prefix><Thing>`: `AddTarsMediator`, `AddPandoraOutbox`.
- A keyed-DI variant puts `Keyed` right after the prefix: `AddTarsKeyedRabbitMqIntegrationEventBus`, not `…EventBusKeyed`, like Microsoft's `AddKeyedScoped`.

## Fail fast at startup

Validate options and composition **when registering**, not on first use. A misconfiguration should stop the application from starting, not surface on the first request in production.

- Options validate themselves when bound.
- Composition validates cross-references (a route to something never registered).
- Required invariants throw in the constructor.

The error message says how to fix it: which method to call, which setting is missing.
