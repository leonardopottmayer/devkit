# React + Vite

How I structure a web frontend: a single-page app built with Vite, talking to an API. Taken from pandora's web client. Read [basics](basics.md) first.

## Stack

| Concern | Choice |
|---|---|
| Build and dev server | Vite |
| UI | React, with a UI library from the [catalog](ui/README.md) |
| Routing | React Router (`react-router`) |
| Server data | TanStack Query |
| HTTP | axios, through one shared client |
| Translations | i18next + react-i18next |
| Tests | Vitest, Testing Library, MSW |
| Lint | ESLint (flat config) with typescript-eslint and the React hooks rules |

## Layout

```
src/
  main.tsx                  # entry: providers + router
  index.css                 # global styles
  app/
    providers.tsx           # every app-wide provider, in one place
    router.tsx              # every route, in one place
  layouts/                  # page frames: AppLayout (navigation + <Outlet />)
  pages/                    # pages that belong to no module: HomePage, NotFoundPage
  components/               # components shared by several modules
  lib/
    api/client.ts           # the axios instance
    queryClient.ts          # the TanStack Query client and its defaults
  i18n/
    index.ts
    locales/en.json, pt-BR.json
  modules/
    <module>/               # one folder per business area, mirroring the API's modules
  test/
    setup.ts                # runs before every test file
    utils.tsx               # render helpers with providers
    msw/server.ts           # the mock API server for tests
```

## Modules

The app is split by business area, the same areas as the API (`notes`, `finances`, `identity`). Everything about one area lives in its module:

```
modules/notes/
  models.ts                 # types of what the API sends and receives
  services/
    pages.service.ts        # functions that call the API: listPages(), createPage()
  hooks/
    queryKeys.ts            # the module's query key factory
    usePages.ts             # TanStack Query hooks over the services
  lib/
    buildTree.ts            # pure logic, no React, no HTTP
    buildTree.test.ts
  components/               # components only this module uses
  pages/
    NotesPage.tsx           # what the router renders
```

The layers, from the bottom:

1. **`models.ts`**: plain TypeScript types matching the API's DTOs.
2. **`services/`**: one function per endpoint, using the shared `apiClient`. No React here: a service is a typed HTTP call.
3. **`hooks/`**: `useQuery` / `useMutation` wrappers over the services. Components never call services directly.
4. **`lib/`**: logic that doesn't need React or HTTP (parsing, tree building, calculations). It's where most of the tests go, because it's the easiest code to test.
5. **`components/` and `pages/`**: React. Pages are thin: they use hooks and compose components.

A module may import from `@/lib`, `@/components` and its own folder. Importing from another module is the exception: when two modules need the same thing, it moves to `@/components` or `@/lib`.

## Server data with TanStack Query

Data that comes from the API is **server state**: TanStack Query fetches it, caches it, and refetches it when it's stale. It never gets copied into React state or a global store.

Each module has a **query key factory**, so queries and invalidations always agree on the keys:

```ts
export const noteKeys = {
  all: ['notes'] as const,
  pages: () => [...noteKeys.all, 'pages'] as const,
  page: (id: string) => [...noteKeys.pages(), 'detail', id] as const,
}
```

A mutation invalidates the keys of what it changed:

```ts
export function useRenamePage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: pagesService.renamePage,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: noteKeys.pages() }),
  })
}
```

Defaults in `lib/queryClient.ts`: data stays fresh for a minute, one retry, no refetch on window focus.

## The API client

One axios instance for the whole app (`lib/api/client.ts`):

- **`adapter: 'fetch'`**: axios uses `fetch` instead of `XMLHttpRequest`. Same behavior in the browser, and it's what MSW intercepts reliably in tests (with MSW 3 and jsdom 30, `XMLHttpRequest` calls escape the mock server).
- **Base URL** from `VITE_API_URL`. Empty means "same origin": in development, Vite proxies `/api` to the backend; in production, the web server does.
- **Interceptors** for what every request needs: the `Authorization` header, the `Accept-Language` header with the current language, and the reaction to a `401` (refresh the session or send the user to the login page).
- Services call `apiClient.get<T>(...)` with the expected type, and return `data`.

## Routing

All routes are declared in `app/router.tsx`, with `createBrowserRouter`. Routes that need a logged-in user are wrapped in a guard component that redirects to the login page; the public ones (login, register) in a guard that redirects logged-in users away. Module pages are nested under the app layout, so they share the navigation.

## Translations

Every text the user reads goes through i18next from the first screen (`t('notes.title')`), with one JSON file per language in `i18n/locales/`. Adding a language later is a file; extracting hard-coded texts later is a hunt. Keys are grouped by module: `notes.*`, `finances.*`.

## Tests

| What | How |
|---|---|
| pure logic (`lib/`) | plain unit tests, next to the file: `buildTree.test.ts` |
| services | Vitest + MSW: the service calls the real `apiClient`, MSW answers the HTTP request |
| components and pages | Testing Library: render, interact like a user (`userEvent`), assert on what's on screen |

- Vitest runs in `jsdom`, with its own `vitest.config.ts`, so test settings don't leak into the build.
- **MSW intercepts HTTP** in tests. Each test declares the responses it needs (`server.use(...)`), and an unhandled request fails the test (`onUnhandledFrame: 'error'`): it's a bug in the test or in the code.
- `test/utils.tsx` renders components with the providers they need: a fresh `QueryClient` per test (no retries, no cache between tests) and a router.
- Query elements the way a user finds them: by role and accessible name (`getByRole('button', { name: 'Save' })`), not by CSS class or test id.

## Lint

ESLint flat config (`eslint.config.js`) with `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks` (rules of hooks, missing effect dependencies) and `eslint-plugin-react-refresh`. `pnpm lint` must pass before a pull request; the CI runs it.

## Build output

`pnpm build` type-checks and writes static files to `dist/`. Any static web server can serve them, with one rule: unknown paths must return `index.html`, because the router handles them in the browser.
