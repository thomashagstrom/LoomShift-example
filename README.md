# LoomShift-example

code created by LoomShift GitHub app

A TypeScript component library scaffold. Built with [tsup](https://tsup.egoist.dev/),
it emits ESM + CJS bundles and type declarations from a single build command.

## Documentation

- [Components](./docs/components.md) — what each component is and when to use it, in plain language.
- [Usage](./docs/usage.md) — install steps, peer dependencies, and code examples for every component.
- [Interactive docs (Storybook)](#interactive-docs) — live previews and editable props.

### Design System Components

- **AnimatedDialog** — a modal dialog that animates in and out, with the same look, behaviour and accessibility as a standard MUI dialog.
- **AnimatedSnackbar** — a notification banner that slides or fades in to confirm something happened, then disappears on its own.
- **ConfirmActions** — the "Ok"/"Cancel" button pair used to end a confirmation, with configurable labels and a loading state.
- **AnimatedStack** — a row/column layout box that eases its contents onto the screen, with an optional subtle background wash.

See [docs/components.md](./docs/components.md) for full descriptions and [docs/usage.md](./docs/usage.md) for code examples.

## Install

```sh
npm install loomshift-example
```

See [docs/usage.md](./docs/usage.md) for peer dependency requirements.

## Interactive docs

An interactive [Storybook](https://storybook.js.org/) covers every component
with live previews, an auto-generated props table and editable controls for
`variant`, `duration`, `easing` and `open`:

```sh
npm run storybook        # dev server on http://localhost:6006
npm run build-storybook  # static site in storybook-static/
```

Stories live next to the component they document (`src/**/*.stories.tsx`), so a
feature slice ships its docs with its code. The `Introduction` page
(`docs/Introduction.mdx`) is the landing page.

## Development

```sh
npm install        # install dev dependencies
npm run build      # produce dist/ (ESM + CJS + .d.ts) in one command
npm run typecheck  # type-check without emitting
npm run lint       # lint with ESLint
npm test           # run the unit tests (Vitest + Testing Library)
npm run storybook  # browse the component docs
```

The build writes:

- `dist/index.js`   — ESM bundle (`module` / `exports.import`)
- `dist/index.cjs`  — CommonJS bundle (`main` / `exports.require`)
- `dist/index.d.ts` — type declarations (`types`)

## Publishing

`prepublishOnly` runs the build, so the compiled `dist/` is always fresh:

```sh
npm publish --dry-run   # verify the packed contents
npm publish
```
