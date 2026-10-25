# UI libraries

A frontend needs components (buttons, forms, tables, modals) and a way to lay them out. There are several good combinations, and each project picks **one**, writes it down in its README, and follows that page.

## The catalog

| Library | Fits when | Source |
|---|---|---|
| [antd + Tailwind](antd-tailwind.md) | data-heavy apps: dashboards, back offices, personal systems full of tables and forms; you want ready-made components and don't need a custom look | pandora's web client |

Others (shadcn/ui, for example) will be added when a real project uses them.

## How to choose

1. **Is it mostly forms, tables and lists, or a custom-designed product page?** Ready-made component libraries shine at the first; headless components plus Tailwind at the second.
2. **Do you have a designer, or a visual identity to follow?** If not, a complete library looks consistent with no design work.

## Adding a library to the catalog

A library enters the catalog only after a real project uses it. Its page has these sections, in this order:

1. **When to use it, and when not to.**
2. **Packages**: what to install.
3. **Setup**: providers, global styles, build plugins.
4. **Theming**: colors, dark mode, density.
5. **Using it**: the usual patterns (forms, tables, feedback messages, modals).
6. **Layout and styling**: how custom styles coexist with the library.
7. **Tests**: what the test setup needs for its components to render in jsdom.

Then add a row above, and teach the scaffold skill to set it up.
