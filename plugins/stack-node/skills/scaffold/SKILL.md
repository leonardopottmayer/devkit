---
name: scaffold
description: Creates web frontends that follow the devkit Node handbook - a React + Vite single-page app with TypeScript, React Router, TanStack Query, axios, i18next, Vitest + Testing Library + MSW and ESLint, with a UI library from the catalog (antd + Tailwind), and adds feature modules to it. Use when the user wants to "create a React app", "start a frontend", "new Vite project", "create a web client for my API", "add a module/page to the frontend", or when start-here picks React + Vite.
---

# Scaffold (Node)

Creates the app; the repository around it (CI, protections, releases) is the workflow plugin's job. The rules are in the handbook at `../../handbook/` relative to this file, the templates in `templates/`.

Read [`basics.md`](../../handbook/basics.md) and [`react-vite.md`](../../handbook/react-vite.md) first.

| Mode | Go to |
|---|---|
| **New React app** | [New React app](#new-react-app) |
| **Add a module** | [Add a module](#add-a-module) |

## Rules

- **pnpm only.** Never `npm install` or `yarn`.
- **Templates are copied, then owned by the project.** Adapt names and URLs; nothing references this repository.
- **Lint, build and test before handing over.** `pnpm lint`, `pnpm build` and `pnpm test` all green, every time.
- **Explain as you go** when the user is new to React: what a component is, what a hook is, why server data goes through TanStack Query.

## New React app

### 1. Create it

In the folder that will hold the repository's parent:

```bash
pnpm create vite <name> --template react-ts --no-interactive
cd <name>
```

`<name>`: lowercase, hyphens. It becomes the folder and the repository name.

### 2. Replace what Vite generated with the handbook's structure

1. Delete `src/App.tsx`, `src/App.css`, `src/assets/` and `.oxlintrc.json` (the handbook lints with ESLint).
2. Copy everything in [`templates/react-vite/`](templates/react-vite/) over the project, keeping the paths. It brings `vite.config.ts` (alias `@`, `/api` proxy), `vitest.config.ts`, `eslint.config.js`, `.env.example` and the whole `src/` layout.
3. Pin Node: write the major version of `node --version` to `.nvmrc`.
4. Dependencies:
   ```bash
   pnpm remove oxlint
   pnpm add react-router @tanstack/react-query axios i18next react-i18next
   pnpm add -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event msw eslint @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh globals
   ```
5. `package.json`:
   ```bash
   npm pkg set scripts.lint="eslint ." scripts.test="vitest run" scripts.test:watch="vitest" packageManager="pnpm@$(pnpm --version)"
   ```
   (`npm pkg` only edits the file; it installs nothing.)
6. `tsconfig.app.json`, in `compilerOptions`: add `"paths": { "@/*": ["./src/*"] }` and change `"types"` to `["vite/client", "vitest/globals"]`.
7. `pnpm lint`, `pnpm build`, `pnpm test`: all green before going on.

### 3. UI library

Read [`ui/README.md`](../../handbook/ui/README.md) and help the user choose with its questions. Then follow the chosen library's page and its overlay:

| Library | Packages | Overlay |
|---|---|---|
| antd + Tailwind | `pnpm add antd @ant-design/icons @ant-design/cssinjs` and `pnpm add -D tailwindcss @tailwindcss/vite` | copy [`templates/ui/antd-tailwind/`](templates/ui/antd-tailwind/) over the project: it replaces `vite.config.ts`, `src/index.css`, `src/app/providers.tsx`, `src/test/setup.ts` and `src/test/utils.tsx` |

If none in the catalog fits, say so: don't bend the app into the wrong library.

Lint, build and test again.

### 4. Finish

1. `.env` from `.env.example`, pointing `VITE_API_URL` at the API. Remind the user that everything `VITE_*` is public.
2. Replace Vite's README with: what the app is, the UI library it uses (with a link to its handbook page), how to run it (`pnpm install`, `pnpm dev`), how to test it.
3. Run `pnpm dev` once and open the URL it prints, to show the user it works.
4. If the app talks to an API, [add its first module](#add-a-module).

## Add a module

A module is a business area, named like the API's module it talks to (`notes`, `catalog`).

1. Agree with the user on the module name (lowercase, `catalog`) and its first resource (plural, `products`).
2. Copy [`templates/module/`](templates/module/) to `src/modules/<module>/`, then replace the placeholders in file **names and contents**, in this order:

   | Placeholder | Example |
   |---|---|
   | `__Resources__` | `Products` |
   | `__Resource__` | `Product` |
   | `__resources__` | `products` |
   | `__Module__` | `Catalog` |
   | `__module__` | `catalog` |

3. Adjust `models.ts` and the service's path to the real API endpoint and DTO.
4. Translations: add `<module>.title` and `<module>.loading` to every file in `src/i18n/locales/`.
5. Route: import `<Module>Page` in `src/app/router.tsx` and add `{ path: '<module>', element: <<Module>Page /> }` to the layout's children.
6. Lint, build, test. The template brings two tests (the service against MSW, the page rendering the list): keep them passing as the module grows.

New features in the module follow the layers in [`react-vite.md`](../../handbook/react-vite.md#modules): model → service (+ test) → hook (query key in the factory, invalidation on mutations) → component/page (+ test).

## Then

Hand over to the workflow: the **repo-setup** skill (Create mode for a new repository, Audit otherwise) adds the CI (`ci-node.yml`), Dependabot and protections.
