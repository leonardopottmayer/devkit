# Library

How I structure a .NET library published as NuGet packages, taken from tars. Read [basics](basics.md) and [coding conventions](coding-conventions.md) first.

## Packages are split by level

Every package belongs to one of four levels, and the level shows in its name:

| Level | Contains | Depends on | Name |
|---|---|---|---|
| **Abstractions** | interfaces, contracts, base types. No implementation. | nothing, or other `.Abstractions` | `<Prefix>.<Group>.<Subgroup?>.Abstractions` |
| **Runtime** | the default implementation of the contracts. Replaceable. | the `.Abstractions` of its group | `<Prefix>.<Group>.<Subgroup?>` |
| **Provider / Adapter** | an implementation tied to a technology (EF Core, Redis, MailKit) | the `.Abstractions` of its group | `<Prefix>.<Group>.<Subgroup?>.<Technology>` |
| **Host integration** | an adapter for a host (ASP.NET Core, worker). Thin and optional. | `.Abstractions` + the host SDK | `<Prefix>.<Group>.<Subgroup?>.AspNetCore` |

Examples from tars: `Pottmayer.Tars.Caching.Abstractions`, `Pottmayer.Tars.Caching`, `Pottmayer.Tars.Caching.Redis`, `Pottmayer.Tars.Web.Http.AspNetCore`.

An application references the abstractions it codes against and the providers it chooses. Swapping Redis for memory caching is a package and a registration, not a rewrite.

## Layout

```
src/
  <Group>/
    <Prefix>.<Group>.Abstractions/
    <Prefix>.<Group>/
    <Prefix>.<Group>.<Technology>/
tests/
  <Prefix>.<Group>.Tests.Unit/
docs/
  <group>/            # how to use the group: configuration, examples
```

The group folder under `src/` isn't part of any namespace: it only groups projects, and the project folder name carries the full name. The level lives in the project name, never in a folder: `src/Caching/Runtime/...` is wrong.

## A good abstraction

- works without ASP.NET Core;
- makes sense in any .NET host: console, worker, web;
- carries no provider details;
- doesn't leak the shape of one particular application.

If it only makes sense in one host, it belongs in that host's integration package.

## When to create a new package

Only with at least one of these reasons:

- a clear, cohesive responsibility;
- it can be reused on its own;
- it evolves at its own pace;
- it's tied to one technology or provider;
- it makes composition simpler for the consumer.

Otherwise it's a folder in an existing package.

## Usage classification

Besides its level, the documentation classifies each package by how applications use it:

| Classification | Meaning |
|---|---|
| **Essential** | every application using the library needs it |
| **Architectural style** | only if the application adopts a pattern (DDD, CQRS) |
| **Optional** | only if the application uses that feature |
| **Support** | internal utility, rarely referenced directly |

## Packaging

- Shared metadata (authors, license, repository, tags, README) in `Directory.Build.props`; each project sets its own `<Description>`.
- The root `README.md` is packed into every package and becomes its page on the registry.
- Test, sample and tool projects set `<IsPackable>false</IsPackable>`.
- Every package of the repository shares one version (lockstep, see [releasing](../../workflow/handbook/releasing.md)).
- Publishing happens in the release workflow ([publishing](../../workflow/handbook/publishing.md)).

## Documentation

- One folder per group under `docs/`, showing how to configure and combine its packages, with working examples.
- The root `README.md` lists the groups and links to their docs.
- Public types and members have XML docs, which ship inside the package and show up in the consumer's editor.
