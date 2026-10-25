# Node basics

What every Node / TypeScript project of mine has.

## Node version: fnm + `.nvmrc`

Each project pins its Node major version in a `.nvmrc` at the root (`24`). fnm switches to it when you enter the folder, and CI reads the same file. Install fnm with the setup skill of the workflow plugin.

## Package manager: pnpm

- Dependencies are installed with **pnpm**, never npm or yarn, so there's one lockfile (`pnpm-lock.yaml`) and it's always committed.
- `package.json` declares the exact pnpm version, so everyone and CI use the same one:
  ```json
  "packageManager": "pnpm@12.14.0"
  ```
- pnpm doesn't run dependencies' install scripts unless you allow them (`pnpm approve-builds`). Allow only packages you recognize: an install script runs code on your machine.

| Task | Command |
|---|---|
| install everything | `pnpm install` |
| add a dependency | `pnpm add <package>` |
| add a dev dependency | `pnpm add -D <package>` |
| run a script | `pnpm <script>` (`pnpm dev`, `pnpm test`) |
| run a package's binary | `pnpm exec <binary>` |
| one-off command from the registry | `pnpm dlx <package>` |

## TypeScript

- TypeScript everywhere, `.ts` / `.tsx`. No plain JavaScript in `src/`.
- **Strict mode.** TypeScript 6 enables it by default; never turn it off. It makes the compiler catch forgotten `null`/`undefined` and implicit `any`.
- ES modules: `"type": "module"` in `package.json`, `import`/`export` everywhere.
- Path alias `@/` for `src/`: `import { apiClient } from '@/lib/api/client'` instead of `../../../lib/api/client`.
- `import type` for type-only imports (`verbatimModuleSyntax` enforces it).

## Scripts

Every project exposes the same script names, so the CI template and anyone new know what to run:

| Script | Does |
|---|---|
| `dev` | starts the development server |
| `build` | type-checks and builds for production |
| `lint` | lints the code |
| `test` | runs the tests once (used by CI) |
| `test:watch` | runs the tests in watch mode |
| `preview` | serves the production build locally |

## Environment variables

- Configuration comes from environment variables. Locally they live in `.env` (gitignored); a committed `.env.example` lists them with fake values ([security](../../workflow/handbook/security.md#secrets)).
- In a frontend, **every variable the code reads ends up in the JavaScript sent to the browser.** Vite only exposes variables prefixed `VITE_`, and anything prefixed `VITE_` is public. Never put a secret in a frontend variable: an API key there belongs to whoever opens the browser's dev tools.

## Integration with the workflow

| Workflow piece | Node |
|---|---|
| CI | `ci-node.yml` from the repo-setup skill (reads `.nvmrc` and `packageManager`) |
| `.gitignore` | the scaffolder's, plus the secrets lines from repo-setup |
| Where the version lives | `"version"` in `package.json` |
| Release bot `prepareCmd` | the Node rows in the release skill |
| Publishing | `npm publish` in the release workflow's publish job (packages only; apps aren't published) |
| Dependency updates | Dependabot, `npm` ecosystem (it reads `pnpm-lock.yaml`) |
| Local package testing | `pnpm pack` + `pnpm add <tarball>` (local-package-testing skill) |
