# .NET handbook

How I build .NET projects. The [workflow handbook](../../workflow/handbook/README.md) covers the repository (branches, pull requests, releases); this one covers what's inside it.

Links to the workflow handbook work when reading this repository on GitHub. An agent using the installed plugins reaches that content through the workflow plugin's skills (repo-setup, release), which this plugin depends on.

## What to read

| You're building | Read |
|---|---|
| anything in .NET | [basics](basics.md) and [coding conventions](coding-conventions.md) |
| a library (NuGet packages) | [library](library.md) |
| an API | [API architectures](api/README.md), then the page of the architecture you pick |

The **scaffold** skill creates a new library or API following these pages, and adds modules to an API.

## Where this comes from

Every rule here is taken from a real project of mine, not from a wish list:

- **tars**: my .NET framework, a set of NuGet packages. Source of the library rules and the coding conventions.
- **pandora**: my personal system, a modular monolith API built on tars. Source of the modular monolith architecture.

A few things are newer than those projects (central package management, xUnit v3, AwesomeAssertions). Each page says so where it applies; the projects will be brought in line.
