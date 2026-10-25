# API architectures

There's no single right way to structure an API: a small service and a system with ten business areas need different shapes. This page is a catalog. Each project picks **one** architecture, writes it down in its README, and follows that page.

## The catalog

| Architecture | Fits when | Source |
|---|---|---|
| [Modular monolith, hexagonal](modular-monolith.md) | one deployable with several business areas that should stay independent; long-lived systems that will grow | pandora |

More will be added as real projects use them. Until then, if none fits, say so instead of bending the project to fit.

## How to choose

Ask, in this order:

1. **How many business areas does it have?** One (a URL shortener, a webhook receiver) or several (finances, notes, agenda)?
2. **Will it grow for years, or is it a focused tool?**
3. **Does it need to be deployed as separate services?** Almost never at the start: a modular monolith can split later, along its module boundaries.

If the answers are "several", "grow" and "no": modular monolith.

## Adding an architecture to the catalog

An architecture enters the catalog only after a real project uses it. Its page has these sections, in this order, so all pages can be compared:

1. **When to use it, and when not to.**
2. **Solution layout**: folders and projects.
3. **Responsibilities**: what each project or layer holds.
4. **Dependency rules**: who may reference whom, and what's forbidden.
5. **Request flow**: how a request travels from HTTP to the database and back.
6. **Data**: database, schemas, naming, migrations.
7. **Cross-cutting concerns**: authentication, errors, validation, logging.
8. **Tests**: what is tested where.
9. **Adding a feature**: the step-by-step for the most common change.
10. **Building blocks**: the libraries it relies on, and what replaces them without those libraries.

Then add a row to the catalog above, and teach the scaffold skill to create it.
