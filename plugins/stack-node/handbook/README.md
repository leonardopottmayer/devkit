# Node handbook

How I build JavaScript and TypeScript projects. The [workflow handbook](../../workflow/handbook/README.md) covers the repository (branches, pull requests, releases); this one covers what's inside it.

Links to the workflow handbook work when reading this repository on GitHub. An agent using the installed plugins reaches that content through the workflow plugin's skills, which this plugin depends on.

## What to read

| You're building | Read |
|---|---|
| anything in Node / TypeScript | [basics](basics.md) |
| a web frontend | [React + Vite](react-vite.md), then [UI libraries](ui/README.md) and the page of the library you pick |

The **scaffold** skill creates a React + Vite app following these pages, and adds modules to it.

Backend in Node (NestJS) and Next.js aren't covered yet: they'll come from real projects when those mature.

## Where this comes from

- **pandora's web client** (`client-web`): React, Vite, TanStack Query, antd and Tailwind, organized in modules that mirror the API's.

The client still uses npm; new projects use pnpm, and the client will be migrated.
