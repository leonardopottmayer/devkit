# antd + Tailwind

[Ant Design](https://ant.design) (antd) for the components, [Tailwind](https://tailwindcss.com) for layout and spacing. Taken from pandora's web client.

## When to use it

- **Use it** for apps full of forms, tables, lists and settings screens: antd has a complete, consistent component for each, with validation, pagination, date pickers and accessibility handled.
- **Don't use it** for a marketing site or a product with its own visual identity: overriding antd's look everywhere costs more than building on headless components.

## Packages

```bash
pnpm add antd @ant-design/icons @ant-design/cssinjs
pnpm add -D tailwindcss @tailwindcss/vite
```

## Setup

**Vite plugin** (`vite.config.ts`):

```ts
import tailwindcss from '@tailwindcss/vite'
// plugins: [react(), tailwindcss()]
```

**CSS layers** (`src/index.css`). Tailwind's reset (preflight) would wipe antd's styles, and antd's styles would beat Tailwind's utilities. Declaring the layer order fixes both: the reset comes first, antd in the middle, utilities last.

```css
@layer theme, base, antd, components, utilities;

@import 'tailwindcss';
```

**Providers** (`src/app/providers.tsx`). `StyleProvider layer` makes antd emit its styles into the `antd` layer; `ConfigProvider` sets the theme and the language of antd's own texts; `App` gives `message`, `notification` and `modal` access to that theme.

```tsx
<StyleProvider layer>
  <ConfigProvider locale={enUS} theme={{ algorithm: theme.defaultAlgorithm, token: { borderRadius: 6 } }}>
    <AntdApp className="h-full">{children}</AntdApp>
  </ConfigProvider>
</StyleProvider>
```

## Theming

- **Dark mode** switches the algorithm: `theme.darkAlgorithm` instead of `theme.defaultAlgorithm`, driven by the user's preference.
- **Design tokens** (`token: { colorPrimary, borderRadius }`) change the look globally. Don't override antd's CSS classes.
- **Language**: pass antd's locale matching the app language (`antd/locale/pt_BR`, `antd/locale/en_US`), so its built-in texts (pagination, date pickers) follow i18next.

## Using it

- **Forms**: antd's `Form` with `rules` for validation; submit calls a mutation hook.
- **Tables**: `Table` with `columns` and the query's data; loading state from the query (`loading={isLoading}`).
- **Feedback**: `App.useApp()` for `message.success(...)` and `modal.confirm(...)`, never the static `message.success` (it ignores the theme).
- **Icons**: `@ant-design/icons`.

## Layout and styling

- antd components for anything interactive; Tailwind utilities for layout, spacing and sizing around them (`flex`, `gap-4`, `h-full`).
- No custom CSS files unless a component needs something neither covers.

## Tests

antd uses browser APIs that jsdom lacks. Add to `src/test/setup.ts`:

```ts
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false, media: query, onchange: null,
      addListener: () => {}, removeListener: () => {},
      addEventListener: () => {}, removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}

if (!('ResizeObserver' in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}
```

And wrap rendered components in `ConfigProvider` and `App` in `src/test/utils.tsx`, like the real providers.
